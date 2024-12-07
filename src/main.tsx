import { Devvit, useAsync, useState } from '@devvit/public-api';
import { DEVVIT_SETTINGS_KEYS } from './constants.js';
import { sendMessageToWebview } from './utils/utils.js';
import { WebviewToBlockMessage } from '../game/shared.js';
import { WEBVIEW_ID } from './constants.js';
import { Preview } from './components/Preview.js';
import { getPokemonByName } from './core/pokeapi.js';

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

Devvit.addSettings([
  // Just here as an example
  {
    name: DEVVIT_SETTINGS_KEYS.SECRET_API_KEY,
    label: 'API Key for secret things',
    type: 'string',
    isSecret: true,
    scope: 'app',
  },
]);

Devvit.configure({
  redditAPI: true,
  http: true,
  redis: true,
  realtime: true,
});

Devvit.addMenuItem({
  // Please update as you work on your idea!
  label: 'Guess the pokemon challenge',
  location: 'subreddit',
  forUserType: 'moderator',
  onPress: async (_event, context) => {
    const { reddit, ui } = context;
    const subreddit = await reddit.getCurrentSubreddit();
    const post = await reddit.submitPost({
      // Title of the post. You'll want to update!
      title: 'Guess the Pokemon ' + new Date().toDateString(),
      subredditName: subreddit.name,
      preview: <Preview />,
    });
    ui.showToast({ text: 'Created post!' });
    ui.navigateTo(post.url);
  },
});

// Add a post type definition
Devvit.addCustomPostType({
  name: 'Pokemon Post',
  height: 'tall',
  render: (context) => {
    const [launched, setLaunched] = useState(false);

    return (
      <vstack height="100%" width="100%" alignment="center middle">
        {launched ? (
          <webview
            id={WEBVIEW_ID}
            url="index.html"
            width={'100%'}
            height={'100%'}
            onMessage={async (event) => {
              console.log('Received message', event);
              const data = event as unknown as WebviewToBlockMessage;

              switch (data.type) {
                case 'INIT':
                  const currUser = await context.reddit.getCurrentUser();
                  sendMessageToWebview(context, {
                    type: 'INIT_RESPONSE',
                    payload: {
                      postId: context.postId!,
                      username: currUser?.username ?? 'anon',
                    },
                  });
                  break;
                case 'GET_POKEMON_REQUEST':
                  context.ui.showToast({ text: `Received message: ${JSON.stringify(data)}` });
                  const pokemon = await getPokemonByName(data.payload.name);

                  sendMessageToWebview(context, {
                    type: 'GET_POKEMON_RESPONSE',
                    payload: {
                      name: pokemon.name,
                      number: pokemon.id,
                      // Note that we don't allow outside images on Reddit if
                      // wanted to get the sprite. Please reach out to support
                      // if you need this for your app!
                    },
                  });
                  break;

                case 'SAVE_GUESS_SCORE':
                  const currUser2 = await context.reddit.getCurrentUser();
                  if (currUser2 == null)
                    break;
                  const currentScore = await context.redis.zScore('leaderboard', currUser2.username);
                  const newScore = data.payload.correct * 100000 + (100000 - data.payload.playTimeInSeconds);
                  if (newScore > (currentScore ?? 0)) {
                    await context.redis.zAdd('leaderboard', {
                      member: currUser2.username,
                      score: newScore,
                    });
                  }
                  await context.reddit.submitComment({
                    id: context.postId!,
                    text: [
                      `🎮 Pokémon Silhouette Game Results`,
                      `👤 Player: ${currUser2.username}`,
                      `⏱️ Time Played: ${formatTime(data.payload.playTimeInSeconds)}`,
                      // `📊 Statistics:`,
                      `- Total Pokémon: ${data.payload.total}`,
                      `- Correct Guesses: ${data.payload.correct}`,
                      `- Skipped: ${data.payload.skip}`,
                      `- Accuracy: ${Math.floor((data.payload.correct / data.payload.total) * 100)} %`,
                    ].join('\n')
                  });
                  break;

                case 'GET_LEADERBOARD':
                  const currUser3 = await context.reddit.getCurrentUser();
                  if (currUser3 == null)
                    break;
                  const leaderboard = await context.redis.zRange('leaderboard', 0, 100000000, { by: 'score', reverse: true });
                  console.log("Caesar's score: " + (await context.redis.zScore('leaderboard', currUser3.username)));
                  console.log('Leaderboard', leaderboard);
                  sendMessageToWebview(context, {
                    type: 'GET_LEADERBOARD_RESPONSE',
                    payload: leaderboard.slice(0, 5),
                  });
                  break;
                default:
                  console.error('Unknown message type', data satisfies never);
                  break;
              }
            }}
          />
        ) : (
          <button
            onPress={() => {
              setLaunched(true);
            }}
          >
            Launch
          </button>
        )}
      </vstack>
    );
  },
});

export default Devvit;
