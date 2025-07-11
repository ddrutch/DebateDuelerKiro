import { Devvit} from '@devvit/public-api';
import { createRedisService } from './redisService.js';
import { Preview } from './Preview.js';
import { Deck } from '../shared/types/redditTypes.js';




export async function createNewPost(postData : Deck , context: Devvit.Context) {
    const { reddit, ui } = context;
    const subreddit = await reddit.getCurrentSubreddit();
    const post = await reddit.submitPost({
        title: `${postData.title} by ${postData.createdBy}`,
        subredditName: subreddit.name,
        preview: <Preview />,
        //runAs: 'USER',
    });
    const redisService = createRedisService(context);
    await redisService.saveDeck(post.id, postData);

    ui.showToast({ text: 'Created post!' });
    ui.navigateTo(post);
}