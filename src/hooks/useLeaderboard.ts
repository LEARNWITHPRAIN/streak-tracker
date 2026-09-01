import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  user_id: string;
  display_name: string | null;
  total_xp: number;
  current_streak: number;
  rank: number;
}

export type TimeframeOption = '1d' | '3d' | '7d' | '30d' | 'custom';

export interface DateRange {
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
}

export const TIMEFRAME_OPTIONS: { label: string; value: TimeframeOption; days?: number }[] = [
  { label: '1 Day',   value: '1d',   days: 1 },
  { label: '3 Days',  value: '3d',   days: 3 },
  { label: '7 Days',  value: '7d',   days: 7 },
  { label: '30 Days', value: '30d',  days: 30 },
  { label: 'Custom',  value: 'custom' },
];

function getDateRange(timeframe: TimeframeOption, customRange?: DateRange): DateRange {
  const today = new Date().toISOString().split('T')[0];
  if (timeframe === 'custom' && customRange) return customRange;
  const days = TIMEFRAME_OPTIONS.find(t => t.value === timeframe)?.days ?? 7;
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  return { start: start.toISOString().split('T')[0], end: today };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface UseLeaderboardOptions {
  scopeType: 'season' | 'challenge';
  scopeId: string | null;
  timeframe?: TimeframeOption;
  customRange?: DateRange;
  enabled?: boolean;
}

export const useLeaderboard = ({
  scopeType,
  scopeId,
  timeframe = '7d',
  customRange,
  enabled = true,
}: UseLeaderboardOptions) => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const dateRange = getDateRange(timeframe, customRange);

  const fetchLeaderboard = useCallback(async () => {
    if (!scopeId || !enabled) { setLoading(false); return; }
    setLoading(true);
    setError(null);

    try {
      const { data, error: rpcError } = await (supabase.rpc as any)(
        'get_leaderboard',
        {
          p_scope_type: scopeType,
          p_scope_id: scopeId,
          p_start_date: dateRange.start,
          p_end_date: dateRange.end,
        }
      );

      if (rpcError) throw rpcError;
      setEntries((data || []) as LeaderboardEntry[]);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  }, [scopeId, scopeType, dateRange.start, dateRange.end, enabled]);

  useEffect(() => { fetchLeaderboard(); }, [fetchLeaderboard]);

  // ── Realtime: re-fetch on any progress change in scope ────────────────────
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  useEffect(() => {
    if (!scopeId || !enabled) return;

    const table = scopeType === 'season' ? 'winter_arc_user_progress' : 'challenge_progress';
    const filterCol = scopeType === 'season' ? 'season_id' : 'challenge_id';

    channelRef.current = supabase
      .channel(`leaderboard_${scopeType}_${scopeId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table,
        filter: `${filterCol}=eq.${scopeId}`,
      }, () => {
        fetchLeaderboard();
      })
      .subscribe();

    return () => { channelRef.current?.unsubscribe(); };
  }, [scopeId, scopeType, enabled, fetchLeaderboard]);

  // Current user's entry (always visible even if far down)
  const myEntry = user ? entries.find(e => e.user_id === user.id) : undefined;

  return {
    entries,
    myEntry,
    loading,
    error,
    dateRange,
    refetch: fetchLeaderboard,
  };
};
