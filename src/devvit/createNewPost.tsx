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


    // Set the post flair after creating the post
    await reddit.setPostFlair({
        postId: post.id,
        subredditName: subreddit.name,
        flairTemplateId: 'c4bfeea8-9237-11f0-b6a0-3ad3107bb536', // Correct property name
        text: postData.flairText ?? "not defined" , // Optional
    });
    
    const redisService = createRedisService(context);
    await redisService.saveDeck(post.id, postData);

    ui.showToast({ text: 'Created post!' });
    ui.navigateTo(post);
}