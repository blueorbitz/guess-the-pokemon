export type Page =
  | "home"
  | "pokemon"
  | "leaderboard";

export type Scorecard = {
  playTimeInSeconds: number;
  correct: number;
  total: number;
  skip: number;
};

export type WebviewToBlockMessage = { type: "INIT" } | {
  type: "GET_POKEMON_REQUEST";
  payload: { name: string };
} | {
  type: "SAVE_GUESS_SCORE";
  payload: Scorecard;
} | {
  type: "GET_LEADERBOARD";
};

export type BlocksToWebviewMessage = {
  type: "INIT_RESPONSE";
  payload: {
    postId: string;
    username: string;
  };
} | {
  type: "GET_POKEMON_RESPONSE";
  payload: { number: number; name: string; error?: string };
} | {
  type: "GET_LEADERBOARD_RESPONSE";
  payload: { member: string; score: number }[];
};

export type DevvitMessage = {
  type: "devvit-message";
  data: { message: BlocksToWebviewMessage };
};
