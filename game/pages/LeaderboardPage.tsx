import { ComponentProps, useEffect } from 'react';
import { useSetPage } from '../hooks/usePage';
import { cn, formatTime, sendToDevvit } from '../utils';
import { useDevvitListener } from '../hooks/useDevvitListener';

type LeaderboardEntry = {
  member: string;
  score: number;
};

export const LeaderboardPage = () => {
  const setPage = useSetPage();
  const leaderboard = useDevvitListener('GET_LEADERBOARD_RESPONSE');

  // This would be replaced with actual data from your backend
  const mockLeaderboard: LeaderboardEntry[] = [
    { member: "Player1", score: 599562 },
    { member: "Player2", score: 299321 },
    { member: "Player3", score: 199795 },
    { member: "Player4", score: 199562 },
    { member: "Player5", score: 199321 },
  ];

  useEffect(() => {
    sendToDevvit({ type: 'GET_LEADERBOARD' });
  }, []);

  useEffect(() => {
    console.log(leaderboard);
  }, [leaderboard]);

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-start overflow-hidden rounded-lg bg-[#f5f5f5] dark:bg-[#1a1a1a] p-4">
      <div className="pointer-events-none absolute inset-0 z-20 h-full w-full bg-[#f5f5f5] dark:bg-[#1a1a1a] [mask-image:radial-gradient(transparent,white)]" />

      <div className={cn('relative z-20 flex justify-between items-center w-full mb-6')}>
        <h1 className={cn('text-xl text-gray-900 dark:text-white md:text-4xl')}>
          Leaderboard
        </h1>

        <MagicButton onClick={() => setPage('home')}>
          Back to Home
        </MagicButton>
      </div>

      <div className="relative z-20 w-full max-w-md h-[500px] overflow-y-auto">
        {[...mockLeaderboard, ...(leaderboard ?? [])].map((entry, rank) => (
          <div
            key={entry.member}
            className="flex items-center justify-between p-4 mb-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <span className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                #{rank + 1}
              </span>
              <a href={`https://www.reddit.com/user/${entry.member}`}>
                <span className="text-gray-900 dark:text-white">
                  {entry.member}
                </span>
              </a>
            </div>
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              {Math.floor(entry.score / 100000)} corrects
              in {formatTime(100000 - (entry.score - Math.floor(entry.score / 100000) * 100000))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const MagicButton = ({ children, ...props }: ComponentProps<'button'>) => {
  return (
    <button
      className={cn(
        'relative inline-flex h-12  min-w-[150px] overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50',
        props.className
      )}
      {...props}
    >
      <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
      <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-3 py-1 text-sm font-medium text-white backdrop-blur-3xl">
        {children}
      </span>
    </button>
  );
};
