
## Devvit Webview React

A template repository for writing webview apps with Devvit.

https://github.com/user-attachments/assets/5bf4d6ec-5ff1-49ce-8c50-f46e7fbac781

### Tech

- [Devvit](https://developers.reddit.com/docs/): Reddit’s Developer Platform that lets you build powerful apps and experiences to enhance the communities you love.
- [Vite](https://vite.dev/): Advanced build tool for the web
- [React](https://react.dev/): UI Library for the web
- [TailwindCSS](https://tailwindcss.com/): Utility first CSS framework
- [Typescript](https://www.typescriptlang.org/): Strongly typed Javascript superset
- [Motion](https://motion.dev/): Animation Library

## Getting started

> Make sure you have Node 22 downloaded on your machine before running!

```sh
git clone ....

cd ...

npm install
```

Before continuing, make a subreddit on Reddit.com. This will be where you do your own development. Go to Reddit.com, scroll the left side bar down to communities, and click "Create a community."

Next, go to the `package.json` and update see the `dev:devvit` command. Update the command to have you subreddit name.

Finally go to `devvit.yaml` and name your app. It has to be 0-16 characters. Once you have, click save, and run `yarn upload` from the root of the repository.

Now all you have to do is run `yarn dev` and navigate to the subreddit.

There is one last gotcha! You need to make a new post before you can see it. You can do so by going to your subreddit, clicking the three dots, and tapping "Make my experience post". After you start developing your all please update the menu item copy (found in `src/main.tsx`).

## Game assets

Download the pokemon image resource using the following [link](https://gearoid.me/pokemon/downloads/pokemedia.zip).

Extract the image and put it into the public folder. **You'll only need the artwork folder**. 

## Commands

- `yarn dev`: Starts a development server where you can develop your application live on Reddit.
- `yarn upload`: Uploads a new version of your app
- `yarn vite`: Useful to run just the React app on your machine if you need to style things quickly.
