import { Scorecard } from '../shared';
import { sendToDevvit } from '../utils';

export const leaderboardService = {
  async addScore(score: Scorecard) {
    // Sends a message to the Devvit app
    sendToDevvit({ type: 'SAVE_GUESS_SCORE', payload: score });
  },

  async getLeaderboard() {
    sendToDevvit({ type: 'GET_LEADERBOARD' });
  }
};
