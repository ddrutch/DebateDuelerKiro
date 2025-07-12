import { Devvit, Post, useWebView } from '@devvit/public-api';
import { BlocksToWebviewMessage, WebviewToBlockMessage } from '../shared/types/redditTypes';
import { createRedisService } from './redisService';
import { createNewPost as createNewPostUtil } from './createNewPost';
import { defineConfig } from '@devvit/server';
import { getDefaultDeck } from '../server/core/decks';
import { Preview } from './Preview';
import { Question } from '../shared/types/redditTypes';
import { HeroButton } from './components/HeroButton';


// defineConfig({
//   name: '[Bolt] Debate Dueler',
//   entry: 'index.html',
//   height: 'tall',\
//   menu: { enable: false },
// });

/**
 * Randomly shuffles an array using the Fisher-Yates (Knuth) algorithm.
 * @param array The array to shuffle.
 * @returns The shuffled array.
 */
function shuffle(array: any[]) {
  let currentIndex = array.length, randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex !== 0) {

    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}


Devvit.addMenuItem({
  label: 'Create Debate Dueler Post',
  location: 'subreddit',
  forUserType: 'moderator',
  onPress: async (_event, context) => {
    const { reddit, ui } = context;
    const subreddit = await reddit.getCurrentSubreddit();
    const post = await reddit.submitPost({

      title: 'default duel',
      subredditName: subreddit.name,
      preview: <Preview />,
    });
    ui.showToast({ text: 'Created post!' });
    ui.navigateTo(post.url);
  },
});

Devvit.addCustomPostType({
  name: 'Dueler',
  height: 'tall',
  render:  (context) => { 
    const { mount } = useWebView<WebviewToBlockMessage, BlocksToWebviewMessage>({
      onMessage: async (event, { postMessage }) => {
        console.log('Received message', event);
        const data = event as unknown as WebviewToBlockMessage;
        const redisService = createRedisService(context);
        const defaultDeck = getDefaultDeck();
        const deck = await redisService.getDeck(context.postId!) || defaultDeck;
        const playerSession = await redisService.getPlayerSession(context.postId!, context.userId!);
        const leaderboard = await redisService.getLeaderboard(context.postId!);

        
        const user = await context.reddit.getCurrentUser();
        //const isAdmin = user?.isAdmin ?? false;
        // const = user?.modPermissions?.get(subredditName)?.length > 0 ?? false;

        const subredditName = await context.reddit.getCurrentSubredditName();
        const isAdmin =
          (user?.modPermissions?.get(subredditName)?.length ?? 0) > 0 ;

        
        const playerRank = await redisService.getPlayerRank(context.postId!, context.userId!);

        if (deck == defaultDeck) {
          await redisService.saveDeck(context.postId!, defaultDeck);
        }

        switch (data.type) {
          case 'INIT':   
            // Shuffle the deck and then limit it to a maximum of 10 questions
            deck.questions = shuffle(deck.questions).slice(0, 10);
            
            postMessage({
              type: 'INIT_RESPONSE',
              payload: {
                postId: context.postId!,
                deck: deck,
                playerSession: playerSession,
                playerRank: playerRank,
                userId : context.userId!,
                username: await context.reddit.getCurrentUsername() || 'Anonymous',
                isAdmin: isAdmin,
              },
            });
            break;
          case 'CREATE_NEW_POST':
            //await createNewPostUtil(data.payload.post.Title, data.payload.post, context);
            await createNewPostUtil(data.payload.postData, context);
          break;

          case 'COMPLETE_GAME':
            //await redisService.saveUserData(context.userId!, data.payload.playerData);
            if (context.postId && context.userId) {
              await redisService.saveUserGameData(
                context.postId,
                context.userId,
                data.payload.answers,
                data.payload.totalScore,
                data.payload.sessionData
              );
              
              postMessage({
                type: 'CONFIRM_SAVE_PLAYER_DATA',
                payload: { isSaved: true }
              });
            }
          break;
          case 'GET_LEADERBOARD_DATA': 
            postMessage({
              type: 'GIVE_LEADERBOARD_DATA',
              payload: {
                leaderboard,
                playerRank: playerRank,
                playerScore: null,
              },
            })
          break;
          case 'ADD_QUESTION':
            if (context.postId) {
              const username = await context.reddit.getCurrentUsername() || 'Anonymous';
              const question: Question = {
                ...data.payload.question,
                authorUsername: username, // Now guaranteed to be string
              };
              await redisService.addQuestionToDeck(context.postId, question);
            }
          break;
          case 'EDIT_QUESTION':
            if (context.postId) {
              await redisService.editQuestionInDeck(context.postId, data.payload.question);
              // After editing, refresh the deck data in the webview
              const updatedDeck = await redisService.getDeck(context.postId!) || defaultDeck;
              postMessage({
                type: 'GIVE_POST_DATA',
                payload: {
                  postId: context.postId!,
                  deck: updatedDeck,
                  playerSession: playerSession,
                  playerRank: playerRank,
                  userId: context.userId!,
                  username: await context.reddit.getCurrentUsername() || 'Anonymous',
                  isAdmin: isAdmin,
                }
              });
            }
            break;
          case 'DELETE_QUESTION': // Handle delete question
            if (context.postId) {
              await redisService.deleteQuestionFromDeck(context.postId, data.payload.questionId);
              // After deleting, refresh the deck data in the webview
              const updatedDeck = await redisService.getDeck(context.postId!) || defaultDeck;
              postMessage({
                type: 'GIVE_POST_DATA',
                payload: {
                  postId: context.postId!,
                  deck: updatedDeck,
                  playerSession: playerSession,
                  playerRank: playerRank,
                  userId: context.userId!,
                  username: await context.reddit.getCurrentUsername() || 'Anonymous',
                  isAdmin: isAdmin,
                }
              });
            }
            break;
          case 'GET_POST_DATA':
            if (context.postId) {
              const gotDeck = await redisService.getDeck(context.postId!) || defaultDeck;
              const gotPlayerRank = await redisService.getPlayerRank(context.postId!, context.userId!);
              const gotPlayerSession = await redisService.getPlayerSession(context.postId!, context.userId!);
              
              // Shuffle the deck and then limit it to a maximum of 10 questions
              gotDeck.questions = shuffle(gotDeck.questions).slice(0, 10);
              
              postMessage({
                type: 'GIVE_POST_DATA',
                payload : {
                  postId: context.postId!,
                  deck: gotDeck,
                  playerSession: gotPlayerSession,
                  playerRank: gotPlayerRank,
                  userId : context.userId!,
                  username: await context.reddit.getCurrentUsername() || 'Anonymous',
                  isAdmin: isAdmin, // Pass isAdmin status
                }

    
              })

            }
          break;
          default:
            console.error('Unknown message type', data satisfies never);
            break;
        }
      },
    });

return (
  <zstack width="100%" height="100%" alignment="center middle">
    {/* Background */}
    <image
      imageHeight={1024}
      imageWidth={1500}
      height="100%"
      width="100%"
      url="background2.png"
      description="Striped blue background"
      resizeMode="cover"
    />

    {/* Bolt badge in top‑right, smaller */}
    <zstack
      width="100%"
      height="100%"
      alignment="top center"
      padding="small"
    >
      <image
        url="bolt.png"
        description="Bolt badge"
        width="50px"
        height="50px"
        imageWidth="150px"
        imageHeight="150px"
        onPress={() => context.ui.navigateTo("https://bolt.new/")}
      />
    </zstack>

    <vstack alignment="center" gap="none" padding="large" grow>
      {/* Logo */}
      <vstack width="100%" height="30%" alignment="top center">
        <image
          url="logo.png"
          description="Logo"
          height="140px"
          width="140px"
          imageHeight="240px"
          imageWidth="240px"
        />
      </vstack>

      {/* Title / subtitle */}
      <vstack height="30%" alignment="middle center" gap="medium">
        <text size="xxlarge" weight="bold" outline="thick">
          {/* your title here */}
        </text>
      </vstack>

      {/* Old bolt slot, now HeroButton doubled in size */}
      <vstack height="40%" alignment="bottom center" gap="medium">
        <HeroButton
          label="Play the game!!"
          onPress={mount}
          animated
        />
      </vstack>
    </vstack>
  </zstack>
);

  },
});

export default Devvit;
