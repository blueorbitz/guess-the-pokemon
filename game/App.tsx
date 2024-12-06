import { Page } from './shared';
import { PokemonPage } from './pages/PokemonPage';
import { HomePage } from './pages/HomePage';
import { usePage } from './hooks/usePage';
import { useEffect, useState } from 'react';
import { sendToDevvit } from './utils';
import { useDevvitListener } from './hooks/useDevvitListener';
import { LeaderboardPage } from './pages/LeaderboardPage';

const getPage = (page: Page, { postId, username }: { postId: string, username: string }) => {
  switch (page) {
    case 'home':
      return <HomePage postId={postId} username={username} />;
    case 'pokemon':
      return <PokemonPage />;
    case 'leaderboard':
      return <LeaderboardPage />
    default:
      throw new Error(`Unknown page: ${page satisfies never}`);
  }
};

export const App = () => {
  const [postId, setPostId] = useState('');
  const [username, setUsername] = useState('anon');
  const page = usePage();
  const initData = useDevvitListener('INIT_RESPONSE');
  useEffect(() => {
    sendToDevvit({ type: 'INIT' });
  }, []);

  useEffect(() => {
    if (initData) {
      setPostId(initData.postId);
      setUsername(initData.username);
    }
  }, [initData, setPostId]);

  return <div className="h-full">{getPage(page, { postId, username })}</div>;
};
