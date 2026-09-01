import React, { useState } from 'react';
import { Trophy, RefreshCw, Radio, ChevronDown, CalendarRange } from 'lucide-react';
import { useLeaderboard, TimeframeOption, TIMEFRAME_OPTIONS, DateRange } from '@/hooks/useLeaderboard';
import { LeaderboardRow } from './LeaderboardRow';
import { useAuth } from '@/contexts/AuthContext';

interface LeaderboardTabProps {
  scopeType: 'season' | 'challenge';
  scopeId: string | null;
  title?: string;
}

export const LeaderboardTab: React.FC<LeaderboardTabProps> = ({
  scopeType,
  scopeId,
  title = 'Global Leaderboard',
}) => {
  const { user } = useAuth();
  const [timeframe, setTimeframe] = useState<TimeframeOption>('7d');
  const [customRange, setCustomRange] = useState<DateRange>({ start: '', end: '' });
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [showTimeframeMenu, setShowTimeframeMenu] = useState(false);

  const effectiveTimeframe = timeframe === 'custom' && customRange.start && customRange.end
    ? 'custom' : (timeframe === 'custom' ? '7d' : timeframe);

  const { entries, myEntry, loading, error, refetch } = useLeaderboard({
    scopeType,
    scopeId,
    timeframe: effectiveTimeframe,
    customRange: effectiveTimeframe === 'custom' ? customRange : undefined,
    enabled: !!scopeId,
  });

  const selectedLabel = TIMEFRAME_OPTIONS.find(t => t.value === timeframe)?.label ?? '7 Days';

  const topEntries = entries.slice(0, 50);
  const myEntryIsVisible = !myEntry || topEntries.some(e => e.user_id === myEntry.user_id);

  return (
    <div className="space-y-5 animate-scale-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-yellow-500" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">{title}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Radio className="w-2.5 h-2.5 text-green-400 animate-pulse" />
              <span className="text-[10px] text-muted-foreground">Live updates</span>
            </div>
          </div>
        </div>

        <button
          onClick={refetch}
          disabled={loading}
          className="w-9 h-9 rounded-xl bg-muted/50 border border-border/40 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          title="Refresh leaderboard"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Timeframe selector */}
      <div className="relative">
        <button
          onClick={() => setShowTimeframeMenu(v => !v)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass border border-border/40 text-sm font-medium text-foreground hover:border-primary/30 transition-all w-full sm:w-auto"
        >
          <CalendarRange className="w-4 h-4 text-muted-foreground" />
          <span className="flex-1 text-left">{selectedLabel}</span>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showTimeframeMenu ? 'rotate-180' : ''}`} />
        </button>

        {showTimeframeMenu && (
          <div className="absolute top-full left-0 mt-1 z-20 glass border border-border/50 rounded-xl overflow-hidden shadow-xl min-w-[160px]">
            {TIMEFRAME_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => {
                  setTimeframe(opt.value);
                  setShowTimeframeMenu(false);
                  if (opt.value === 'custom') setShowCustomPicker(true);
                  else setShowCustomPicker(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                  timeframe === opt.value
                    ? 'bg-primary/15 text-primary font-semibold'
                    : 'text-foreground hover:bg-muted/70'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Custom date range picker */}
      {showCustomPicker && (
        <div className="glass rounded-2xl p-4 border border-border/40 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Custom Range</p>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">Start Date</label>
              <input
                type="date"
                value={customRange.start}
                onChange={e => setCustomRange(r => ({ ...r, start: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border/40 text-sm text-foreground focus:outline-none focus:border-primary/50"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">End Date</label>
              <input
                type="date"
                value={customRange.end}
                onChange={e => setCustomRange(r => ({ ...r, end: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border/40 text-sm text-foreground focus:outline-none focus:border-primary/50"
              />
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/30 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-muted/40 animate-pulse" />
          ))}
        </div>
      )}

      {/* Entries */}
      {!loading && !error && (
        <div className="space-y-2">
          {topEntries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Trophy className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">No data yet for this timeframe.</p>
              <p className="text-sm mt-1">Log tasks to appear on the board!</p>
            </div>
          ) : (
            topEntries.map(entry => (
              <LeaderboardRow
                key={entry.user_id}
                entry={entry}
                isCurrentUser={entry.user_id === user?.id}
              />
            ))
          )}

          {/* Sticky current user row if not in top 50 */}
          {!myEntryIsVisible && myEntry && (
            <>
              <div className="flex items-center gap-2 px-3 py-1">
                <div className="flex-1 h-px bg-border/40" />
                <span className="text-[10px] text-muted-foreground">Your ranking</span>
                <div className="flex-1 h-px bg-border/40" />
              </div>
              <LeaderboardRow entry={myEntry} isCurrentUser />
            </>
          )}
        </div>
      )}
    </div>
  );
};
