import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WinterArcSeason {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
}

export interface WinterArcTask {
  id: string;
  season_id: string | null;
  task_name: string;
  task_type: 'fixed' | 'variable';
  xp_flat: number | null;
  unit_label: string | null;
  xp_rate: number | null;
  step_increment: number | null;
  daily_unit_cap: number | null;
  sort_order: number;
}

export interface TaskProgress {
  task_id: string;
  units_logged: number;
  xp_earned: number;
  capped_xp_earned: number;
}

export interface WinterArcStreak {
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
}

export interface UserSettings {
  social_media_limit_minutes: number;
}

// Daily XP ceiling constant (sum of all capped tasks: 150 + 20 for 10k steps + 230 variable = 400)
export const DAILY_XP_CEILING = 400;

// Completion threshold: 50% of daily XP ceiling
export const COMPLETION_XP_THRESHOLD = 200;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useWinterArc = () => {
  const { user } = useAuth();

  const [activeSeason, setActiveSeason] = useState<WinterArcSeason | null>(null);
  const [enrolled, setEnrolled] = useState(false);
  const [joinedDate, setJoinedDate] = useState<string | null>(null);
  const [tasks, setTasks] = useState<WinterArcTask[]>([]);
  const [todayProgress, setTodayProgress] = useState<Record<string, TaskProgress>>({});
  const [streak, setStreak] = useState<WinterArcStreak>({ current_streak: 0, longest_streak: 0, last_active_date: null });
  const [userSettings, setUserSettings] = useState<UserSettings>({ social_media_limit_minutes: 60 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getTodayKey = () => new Date().toISOString().split('T')[0];

  // ── Fetch active season ───────────────────────────────────────────────────
  const fetchActiveSeason = useCallback(async () => {
    const today = getTodayKey();
    const { data, error } = await supabase
      .from('winter_arc_seasons')
      .select('*')
      .lte('start_date', today)
      .gte('end_date', today)
      .order('start_date', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;
    return data as WinterArcSeason;
  }, []);

  // ── Fetch enrollment ──────────────────────────────────────────────────────
  const fetchEnrollment = useCallback(async (seasonId: string) => {
    if (!user) return null;
    const { data } = await supabase
      .from('winter_arc_enrollment')
      .select('joined_date')
      .eq('user_id', user.id)
      .eq('season_id', seasonId)
      .single();
    return data;
  }, [user]);

  // ── Fetch tasks ───────────────────────────────────────────────────────────
  const fetchTasks = useCallback(async (seasonId: string) => {
    const { data, error } = await supabase
      .from('winter_arc_daily_tasks')
      .select('*')
      .eq('season_id', seasonId)
      .order('sort_order');

    let currentTasks = (data || []) as WinterArcTask[];

    // Self-heal: ensure 10,000 Steps task exists in the season
    const has10kSteps = currentTasks.some(t => t.task_name === '10,000 Steps' || t.task_name === '10k Steps');
    if (!has10kSteps && seasonId) {
      try {
        const { data: newTask, error: insertErr } = await supabase
          .from('winter_arc_daily_tasks')
          .insert({
            season_id: seasonId,
            task_name: '10,000 Steps',
            task_type: 'fixed',
            xp_flat: 20,
            sort_order: 8,
          })
          .select()
          .single();

        if (newTask && !insertErr) {
          currentTasks = [...currentTasks, newTask as WinterArcTask].sort((a, b) => a.sort_order - b.sort_order);
        }
      } catch {
        // Fallback handled
      }
    }

    return currentTasks;
  }, []);

  // ── Fetch today's progress ────────────────────────────────────────────────
  const fetchTodayProgress = useCallback(async (seasonId: string) => {
    if (!user) return {};
    const today = getTodayKey();
    const { data, error } = await supabase
      .from('winter_arc_user_progress')
      .select('task_id, units_logged, xp_earned, capped_xp_earned')
      .eq('user_id', user.id)
      .eq('season_id', seasonId)
      .eq('date', today)
      .not('task_id', 'is', null);

    if (error || !data) return {};
    const map: Record<string, TaskProgress> = {};
    data.forEach(row => {
      if (row.task_id) {
        map[row.task_id] = {
          task_id: row.task_id,
          units_logged: row.units_logged ?? 0,
          xp_earned: row.xp_earned ?? 0,
          capped_xp_earned: row.capped_xp_earned ?? 0,
        };
      }
    });
    return map;
  }, [user]);

  // ── Fetch streak ──────────────────────────────────────────────────────────
  const fetchStreak = useCallback(async (seasonId: string) => {
    if (!user) return;
    const { data } = await supabase
      .from('winter_arc_streaks')
      .select('current_streak, longest_streak, last_active_date')
      .eq('user_id', user.id)
      .eq('season_id', seasonId)
      .single();
    if (data) {
      setStreak({
        current_streak: data.current_streak ?? 0,
        longest_streak: data.longest_streak ?? 0,
        last_active_date: data.last_active_date ?? null,
      });
    }
  }, [user]);

  // ── Fetch user settings ───────────────────────────────────────────────────
  const fetchUserSettings = useCallback(async (seasonId: string) => {
    if (!user) return;
    const { data } = await supabase
      .from('winter_arc_user_settings')
      .select('social_media_limit_minutes')
      .eq('user_id', user.id)
      .eq('season_id', seasonId)
      .single();
    if (data) {
      setUserSettings({ social_media_limit_minutes: data.social_media_limit_minutes ?? 60 });
    }
  }, [user]);

  // ── Main loader ───────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const season = await fetchActiveSeason();
      setActiveSeason(season);
      if (!season) { setLoading(false); return; }

      const [enrollment, fetchedTasks, progress] = await Promise.all([
        fetchEnrollment(season.id),
        fetchTasks(season.id),
        fetchTodayProgress(season.id),
      ]);

      setEnrolled(!!enrollment);
      setJoinedDate(enrollment?.joined_date ?? null);
      setTasks(fetchedTasks);
      setTodayProgress(progress);

      if (enrollment) {
        await Promise.all([fetchStreak(season.id), fetchUserSettings(season.id)]);
      }
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load Winter Arc data');
    } finally {
      setLoading(false);
    }
  }, [user, fetchActiveSeason, fetchEnrollment, fetchTasks, fetchTodayProgress, fetchStreak, fetchUserSettings]);

  useEffect(() => { load(); }, [load]);

  // ── Realtime: subscribe to own progress updates ───────────────────────────
  const realtimeRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  useEffect(() => {
    if (!user || !activeSeason) return;

    realtimeRef.current = supabase
      .channel(`winter_arc_progress_${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'winter_arc_user_progress',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        fetchTodayProgress(activeSeason.id).then(setTodayProgress);
        fetchStreak(activeSeason.id);
      })
      .subscribe();

    return () => {
      realtimeRef.current?.unsubscribe();
    };
  }, [user, activeSeason, fetchTodayProgress, fetchStreak]);

  // ── Join Arc ──────────────────────────────────────────────────────────────
  const joinArc = useCallback(async (socialMediaLimitMinutes = 60) => {
    if (!user || !activeSeason) return { error: 'No active season' };
    const today = getTodayKey();

    const { error: enrollError } = await supabase
      .from('winter_arc_enrollment')
      .upsert({ user_id: user.id, season_id: activeSeason.id, joined_date: today }, { onConflict: 'user_id,season_id' });
    if (enrollError) return { error: enrollError.message };

    const { error: settingsError } = await supabase
      .from('winter_arc_user_settings')
      .upsert({
        user_id: user.id,
        season_id: activeSeason.id,
        social_media_limit_minutes: Math.min(60, Math.max(1, socialMediaLimitMinutes)),
      }, { onConflict: 'user_id,season_id' });
    if (settingsError) return { error: settingsError.message };

    // Initialize streak row
    await supabase
      .from('winter_arc_streaks')
      .upsert({ user_id: user.id, season_id: activeSeason.id }, { onConflict: 'user_id,season_id' });

    setEnrolled(true);
    setJoinedDate(today);
    setUserSettings({ social_media_limit_minutes: socialMediaLimitMinutes });
    return { error: null };
  }, [user, activeSeason]);

  // ── Log fixed task ────────────────────────────────────────────────────────
  const logFixedTask = useCallback(async (taskId: string, checked: boolean) => {
    if (!user || !activeSeason) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task || task.task_type !== 'fixed') return;

    const xp = checked ? (task.xp_flat ?? 0) : 0;
    const today = getTodayKey();

    // Optimistic update
    setTodayProgress(prev => ({
      ...prev,
      [taskId]: { task_id: taskId, units_logged: checked ? 1 : 0, xp_earned: xp, capped_xp_earned: xp },
    }));

    await supabase
      .from('winter_arc_user_progress')
      .upsert({
        user_id: user.id,
        season_id: activeSeason.id,
        task_id: taskId,
        date: today,
        units_logged: checked ? 1 : 0,
        xp_earned: xp,
        capped_xp_earned: xp,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,task_id,date' });
  }, [user, activeSeason, tasks]);

  // ── Log variable task ─────────────────────────────────────────────────────
  const logVariableTask = useCallback(async (taskId: string, units: number) => {
    if (!user || !activeSeason) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task || task.task_type !== 'variable') return;

    const sanitizedUnits = Math.max(0, units);
    const xpRate = task.xp_rate ?? 0;
    const xpEarned = Math.round(sanitizedUnits * xpRate * 10) / 10; // preserve 1 decimal
    const capUnits = task.daily_unit_cap ?? Infinity;
    const cappedUnits = Math.min(sanitizedUnits, capUnits);
    const cappedXp = Math.round(cappedUnits * xpRate * 10) / 10;
    const today = getTodayKey();

    // Optimistic update
    setTodayProgress(prev => ({
      ...prev,
      [taskId]: { task_id: taskId, units_logged: sanitizedUnits, xp_earned: xpEarned, capped_xp_earned: cappedXp },
    }));

    await supabase
      .from('winter_arc_user_progress')
      .upsert({
        user_id: user.id,
        season_id: activeSeason.id,
        task_id: taskId,
        date: today,
        units_logged: sanitizedUnits,
        xp_earned: xpEarned,
        capped_xp_earned: cappedXp,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,task_id,date' });
  }, [user, activeSeason, tasks]);

  // ── Derived totals ────────────────────────────────────────────────────────
  const todayTotalXP = Object.values(todayProgress).reduce((sum, p) => sum + (p.capped_xp_earned ?? 0), 0);
  const todayUncappedXP = Object.values(todayProgress).reduce((sum, p) => sum + (p.xp_earned ?? 0), 0);

  // Day count in arc (relative to joined_date - personalized for each user)
  const arcDayCount = (() => {
    if (!joinedDate) return 1;
    try {
      const [jy, jm, jd] = joinedDate.split('-').map(Number);
      const todayStr = getTodayKey();
      const [ty, tm, td] = todayStr.split('-').map(Number);
      const joinUtc = Date.UTC(jy, jm - 1, jd);
      const todayUtc = Date.UTC(ty, tm - 1, td);
      const diff = Math.floor((todayUtc - joinUtc) / (1000 * 60 * 60 * 24));
      return Math.max(1, diff + 1); // Day 1 on join date
    } catch {
      return 1;
    }
  })();

  // ── Reset or change personalized start date ──────────────────────────────
  const resetStartDate = useCallback(async (newDate?: string) => {
    if (!user || !activeSeason) return { error: 'Not enrolled' };
    const dateToSet = newDate || getTodayKey();
    const { error: updateErr } = await supabase
      .from('winter_arc_enrollment')
      .update({ joined_date: dateToSet })
      .eq('user_id', user.id)
      .eq('season_id', activeSeason.id);

    if (updateErr) return { error: updateErr.message };
    setJoinedDate(dateToSet);
    return { error: null };
  }, [user, activeSeason]);

  return {
    activeSeason,
    enrolled,
    joinedDate,
    arcDayCount,
    tasks,
    todayProgress,
    todayTotalXP,
    todayUncappedXP,
    streak,
    userSettings,
    loading,
    error,
    // Actions
    joinArc,
    logFixedTask,
    logVariableTask,
    resetStartDate,
    refetch: load,
  };
};
