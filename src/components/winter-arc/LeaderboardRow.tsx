import React from 'react';
import { Crown, Flame, Medal, Zap } from 'lucide-react';
import { LeaderboardEntry } from '@/hooks/useLeaderboard';

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
}

const RANK_STYLES = [
  'from-yellow-500/20 to-yellow-600/5 border-yellow-500/40 text-yellow-500',  // 1st
  'from-slate-400/20 to-slate-500/5 border-slate-400/40 text-slate-400',      // 2nd
  'from-orange-600/20 to-orange-700/5 border-orange-600/40 text-orange-600',  // 3rd
];

function getRankIcon(rank: number) {
  if (rank === 1) return <Crown className="w-4 h-4 text-yellow-500" />;
  if (rank === 2) return <Medal className="w-4 h-4 text-slate-400" />;
  if (rank === 3) return <Medal className="w-4 h-4 text-orange-600" />;
  return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
}

function getInitials(name: string | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export const LeaderboardRow: React.FC<LeaderboardRowProps> = ({ entry, isCurrentUser }) => {
  const topStyle = RANK_STYLES[entry.rank - 1];
  const isTop3 = entry.rank <= 3;

  return (
    <div
      className={`flex items-center gap-4 p-3.5 rounded-2xl border transition-all ${
        isCurrentUser
          ? 'bg-primary/10 border-primary/40 shadow-sm shadow-primary/20'
          : isTop3
          ? `bg-gradient-to-r ${topStyle} backdrop-blur-sm`
          : 'glass border-border/40 hover:border-border/60'
      }`}
    >
      {/* Rank badge */}
      <div className="w-8 flex items-center justify-center shrink-0">
        {getRankIcon(entry.rank)}
      </div>

      {/* Avatar */}
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
          isCurrentUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted/70 text-muted-foreground'
        }`}
      >
        {getInitials(entry.display_name)}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-sm truncate ${isCurrentUser ? 'text-primary' : 'text-foreground'}`}>
          {entry.display_name ?? 'Anonymous'}
          {isCurrentUser && <span className="ml-1.5 text-[10px] text-muted-foreground font-normal">(you)</span>}
        </p>
        {entry.current_streak > 0 && (
          <div className="flex items-center gap-1 mt-0.5">
            <Flame className="w-3 h-3 text-orange-500" />
            <span className="text-[10px] text-muted-foreground">{entry.current_streak}d streak</span>
          </div>
        )}
      </div>

      {/* XP */}
      <div className="flex items-center gap-1.5 shrink-0">
        <Zap className="w-3.5 h-3.5 text-primary" />
        <span className="text-sm font-bold text-foreground tabular-nums">
          {Math.round(entry.total_xp).toLocaleString()}
        </span>
        <span className="text-xs text-muted-foreground">XP</span>
      </div>
    </div>
  );
};
