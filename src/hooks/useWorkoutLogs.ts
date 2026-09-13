import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { parseSets, parseReps, DaySchedule, Exercise, ExerciseSet, getExerciseSets } from './useUserWorkouts';
import { DailyExerciseSetLog, DetailedExerciseLog, SpreadsheetWorkoutRow } from '@/types/exercise';
import { Json } from '@/integrations/supabase/types';

interface SetProgress {
  [exerciseId: string]: number;
}

export interface TodaySetsMap {
  [exerciseId: string]: DailyExerciseSetLog[];
}

const getStorageKey = (userId?: string) => `yodha_daily_sets_v2_${userId || 'anon'}`;

export const useWorkoutLogs = () => {
  const { user } = useAuth();
  const [todayProgress, setTodayProgress] = useState<SetProgress>({});
  const [todaySets, setTodaySets] = useState<TodaySetsMap>({});
  const [loading, setLoading] = useState(true);

  const getTodayKey = () => new Date().toISOString().split('T')[0];

  // Helper to read cached sets for a date
  const getCachedSetsForDate = useCallback((dateKey: string): TodaySetsMap => {
    try {
      const storageKey = getStorageKey(user?.id);
      const raw = localStorage.getItem(storageKey);
      if (!raw) return {};
      const allDates = JSON.parse(raw);
      return allDates[dateKey] || {};
    } catch (e) {
      console.warn('Failed to parse cached sets:', e);
      return {};
    }
  }, [user?.id]);

  // Helper to write cached sets for a date
  const saveCachedSetsForDate = useCallback((dateKey: string, setsMap: TodaySetsMap) => {
    try {
      const storageKey = getStorageKey(user?.id);
      const raw = localStorage.getItem(storageKey);
      const allDates = raw ? JSON.parse(raw) : {};
      allDates[dateKey] = { ...(allDates[dateKey] || {}), ...setsMap };
      localStorage.setItem(storageKey, JSON.stringify(allDates));
    } catch (e) {
      console.warn('Failed to cache sets:', e);
    }
  }, [user?.id]);

  // Sync detailed sets to Supabase user_workouts as log:YYYY-MM-DD
  const syncSetsToCloud = useCallback(async (dateKey: string, setsMap: TodaySetsMap, exercisesMeta: { id: string; name: string }[]) => {
    if (!user) return;
    try {
      const exercisesPayload = exercisesMeta.map(ex => ({
        id: ex.id,
        name: ex.name,
        sets: setsMap[ex.id] || [],
      }));

      await supabase
        .from('user_workouts')
        .upsert(
          {
            user_id: user.id,
            day: `log:${dateKey}`,
            short_day: 'Log',
            title: `Workout Log ${dateKey}`,
            subtitle: `${exercisesPayload.length} exercises`,
            exercises: exercisesPayload as unknown as Json,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,day' }
        );
    } catch (err) {
      console.warn('Could not sync detailed set logs to cloud:', err);
    }
  }, [user]);

  // Fetch today's workout logs and sets
  const fetchTodayLogs = useCallback(async () => {
    const todayKey = getTodayKey();
    const cached = getCachedSetsForDate(todayKey);
    if (Object.keys(cached).length > 0) {
      setTodaySets(cached);
    }

    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch workout_logs summary
      const { data, error } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', todayKey);

      if (error) throw error;

      if (data) {
        const progress: SetProgress = {};
        data.forEach(log => {
          progress[log.exercise_id] = log.sets_completed;
        });
        setTodayProgress(progress);
      }

      // 2. Fetch detailed sets log from user_workouts if exists
      const { data: logEntry } = await supabase
        .from('user_workouts')
        .select('exercises')
        .eq('user_id', user.id)
        .eq('day', `log:${todayKey}`)
        .maybeSingle();

      if (logEntry && Array.isArray(logEntry.exercises)) {
        const cloudSets: TodaySetsMap = {};
        (logEntry.exercises as any[]).forEach(item => {
          if (item.id && Array.isArray(item.sets)) {
            cloudSets[item.id] = item.sets;
          }
        });
        setTodaySets(prev => {
          const merged = { ...cloudSets, ...prev };
          saveCachedSetsForDate(todayKey, merged);
          return merged;
        });
      }
    } catch (error) {
      console.error('Error fetching workout logs:', error);
    } finally {
      setLoading(false);
    }
  }, [user, getCachedSetsForDate, saveCachedSetsForDate]);

  // Update or create workout log
  const updateSetProgress = async (
    exerciseId: string,
    exerciseName: string,
    setsCompleted: number,
    totalSets: number,
    allExercises?: { id: string; name: string; totalSets: number }[]
  ) => {
    if (!user) return;

    try {
      if (allExercises && allExercises.length > 0) {
        const upserts = allExercises.map(ex => ({
          user_id: user.id,
          date: getTodayKey(),
          exercise_id: ex.id,
          exercise_name: ex.name,
          sets_completed: ex.id === exerciseId ? setsCompleted : (todayProgress[ex.id] || 0),
          total_sets: ex.totalSets,
          updated_at: new Date().toISOString(),
        }));

        const { error } = await supabase
          .from('workout_logs')
          .upsert(upserts, { onConflict: 'user_id,date,exercise_id' });

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('workout_logs')
          .upsert(
            {
              user_id: user.id,
              date: getTodayKey(),
              exercise_id: exerciseId,
              exercise_name: exerciseName,
              sets_completed: setsCompleted,
              total_sets: totalSets,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,date,exercise_id' }
          );

        if (error) throw error;
      }

      setTodayProgress(prev => ({
        ...prev,
        [exerciseId]: setsCompleted,
      }));

      window.dispatchEvent(new Event('workout-progress-updated'));
    } catch (error) {
      console.error('Error updating workout log:', error);
    }
  };

  /**
   * Save full set details for an exercise (sets with individual weights and completion)
   */
  const saveExerciseSets = async (
    exerciseId: string,
    exerciseName: string,
    sets: DailyExerciseSetLog[],
    allExercises?: { id: string; name: string; totalSets: number }[]
  ) => {
    const todayKey = getTodayKey();
    const completedCount = sets.filter(s => s.completed).length;
    const totalCount = sets.length;

    // Update local state
    const nextTodaySets = {
      ...todaySets,
      [exerciseId]: sets,
    };
    setTodaySets(nextTodaySets);
    saveCachedSetsForDate(todayKey, nextTodaySets);

    // Sync to workout_logs
    await updateSetProgress(exerciseId, exerciseName, completedCount, totalCount, allExercises);

    // Sync detailed sets to cloud
    const metaList = (allExercises || [{ id: exerciseId, name: exerciseName, totalSets: totalCount }]).map(e => ({
      id: e.id,
      name: e.name,
    }));
    await syncSetsToCloud(todayKey, nextTodaySets, metaList);
  };

  // Reset all progress for today
  const resetTodayProgress = async () => {
    const todayKey = getTodayKey();
    try {
      if (user) {
        await supabase
          .from('workout_logs')
          .delete()
          .eq('user_id', user.id)
          .eq('date', todayKey);

        await supabase
          .from('user_workouts')
          .delete()
          .eq('user_id', user.id)
          .eq('day', `log:${todayKey}`);
      }

      // Clear local storage
      const storageKey = getStorageKey(user?.id);
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const allDates = JSON.parse(raw);
        delete allDates[todayKey];
        localStorage.setItem(storageKey, JSON.stringify(allDates));
      }

      setTodayProgress({});
      setTodaySets({});
      window.dispatchEvent(new Event('workout-progress-updated'));
    } catch (error) {
      console.error('Error resetting progress:', error);
    }
  };

  // Calculate total progress for today
  const calculateTotalProgress = (schedule: DaySchedule | null): { percentage: number; completed: number; total: number } => {
    if (!schedule || schedule.exercises.length === 0) {
      return { percentage: 0, completed: 0, total: 0 };
    }

    let totalSets = 0;
    let completedSets = 0;

    schedule.exercises.forEach(ex => {
      // Check if we have detailed sets
      const detailed = todaySets[ex.id];
      if (detailed && detailed.length > 0) {
        totalSets += detailed.length;
        completedSets += detailed.filter(s => s.completed).length;
      } else {
        const sets = parseSets(ex.setsReps);
        if (sets) {
          totalSets += sets;
          completedSets += Math.min(todayProgress[ex.id] || 0, sets);
        } else {
          totalSets += 1;
          if (todayProgress[ex.id] && todayProgress[ex.id] >= 1) {
            completedSets += 1;
          }
        }
      }
    });

    const percentage = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
    return { percentage, completed: completedSets, total: totalSets };
  };

  // Fetch calendar history summary for a date range (for month grid)
  const fetchCalendarHistory = useCallback(async (startDate: string, endDate: string) => {
    if (!user) return {};

    try {
      const { data, error } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate);

      if (error) throw error;

      const history: Record<string, { totalExercises: number; completedExercises: number }> = {};
      
      if (data) {
        data.forEach(log => {
          if (!history[log.date]) {
            history[log.date] = { totalExercises: 0, completedExercises: 0 };
          }
          history[log.date].totalExercises += log.total_sets;
          history[log.date].completedExercises += log.sets_completed;
        });
      }

      return history;
    } catch (error) {
      console.error('Error fetching calendar history:', error);
      return {};
    }
  }, [user]);

  /**
   * Fetch detailed sets and exercise logs for a single day
   */
  const fetchDayDetailedLogs = useCallback(async (
    dateKey: string,
    schedule?: DaySchedule[] | null,
    customRoutine?: DaySchedule | null,
    useSameDaily?: boolean
  ): Promise<DetailedExerciseLog[]> => {
    // 1. Check local cache
    const cached = getCachedSetsForDate(dateKey);

    // 2. Fetch workout_logs for this date
    let rawLogs: any[] = [];
    if (user) {
      const { data } = await supabase
        .from('workout_logs')
        .select('exercise_id, exercise_name, sets_completed, total_sets')
        .eq('user_id', user.id)
        .eq('date', dateKey);
      if (data) rawLogs = data;

      // Also check cloud user_workouts for log:dateKey
      const { data: cloudEntry } = await supabase
        .from('user_workouts')
        .select('exercises')
        .eq('user_id', user.id)
        .eq('day', `log:${dateKey}`)
        .maybeSingle();

      if (cloudEntry && Array.isArray(cloudEntry.exercises)) {
        cloudEntry.exercises.forEach((item: any) => {
          if (item.id && Array.isArray(item.sets) && !cached[item.id]) {
            cached[item.id] = item.sets;
          }
        });
      }
    }

    // Build schedule exercises lookup to match routine weights
    const routineExercisesMap: Record<string, Exercise> = {};
    if (schedule) {
      schedule.forEach(day => {
        day.exercises.forEach(ex => {
          routineExercisesMap[ex.id] = ex;
          routineExercisesMap[ex.name.toLowerCase()] = ex;
        });
      });
    }
    if (customRoutine) {
      customRoutine.exercises.forEach(ex => {
        routineExercisesMap[ex.id] = ex;
        routineExercisesMap[ex.name.toLowerCase()] = ex;
      });
    }

    // Determine the scheduled routine for this specific day of the week
    let scheduledDay: DaySchedule | undefined;
    if (dateKey) {
      const parts = dateKey.split('-');
      if (parts.length === 3) {
        const [y, m, d] = parts.map(Number);
        const dateObj = new Date(y, m - 1, d);
        const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        if (useSameDaily && customRoutine) {
          scheduledDay = customRoutine;
        } else if (schedule) {
          scheduledDay = schedule.find(s => s.day.toLowerCase() === dayOfWeek);
        }
      }
    }

    const scheduledExercises = scheduledDay ? scheduledDay.exercises : [];

    // If no logs, no cached sets, and no scheduled exercises (e.g. true rest day or no schedule), return empty
    if (rawLogs.length === 0 && Object.keys(cached).length === 0 && scheduledExercises.length === 0) {
      return [];
    }

    const results: DetailedExerciseLog[] = [];
    const processedExIds = new Set<string>();

    const buildLogItem = (row: any): DetailedExerciseLog => {
      const exId = row.exercise_id;
      const cachedSets = cached[exId];
      const routineEx = routineExercisesMap[exId] || routineExercisesMap[row.exercise_name?.toLowerCase()];

      let sets: DailyExerciseSetLog[] = [];

      if (cachedSets && cachedSets.length > 0) {
        sets = cachedSets;
      } else if (routineEx) {
        const configuredSets = getExerciseSets(routineEx);
        sets = configuredSets.map((s, idx) => ({
          setNumber: s.setNumber || idx + 1,
          weight: s.weight !== undefined ? s.weight : (routineEx.weight ?? null),
          reps: s.reps || '10',
          completed: idx < row.sets_completed,
        }));
      } else {
        const total = row.total_sets || 1;
        for (let i = 1; i <= total; i++) {
          sets.push({
            setNumber: i,
            weight: null,
            reps: '10',
            completed: i <= row.sets_completed,
          });
        }
      }

      const weights = sets.map(s => s.weight).filter((w): w is number => w !== null && w > 0);
      const maxWeight = weights.length > 0 ? Math.max(...weights) : (routineEx?.weight ?? null);

      return {
        exercise_id: exId,
        exercise_name: row.exercise_name,
        sets_completed: row.sets_completed,
        total_sets: Math.max(row.total_sets, sets.length),
        weight_kg: maxWeight,
        sets,
      };
    };

    // 1. Process scheduled exercises first (preserves user's weekly split ordering)
    scheduledExercises.forEach(schedEx => {
      const rawLog = rawLogs.find(
        r => r.exercise_id === schedEx.id || r.exercise_name?.toLowerCase() === schedEx.name.toLowerCase()
      );
      const cachedSets = cached[schedEx.id];

      if (rawLog) {
        results.push(buildLogItem(rawLog));
        processedExIds.add(rawLog.exercise_id);
        if (schedEx.id) processedExIds.add(schedEx.id);
      } else if (cachedSets && cachedSets.length > 0) {
        const completedCount = cachedSets.filter(s => s.completed).length;
        const weights = cachedSets.map(s => s.weight).filter((w): w is number => w !== null && w > 0);
        results.push({
          exercise_id: schedEx.id,
          exercise_name: schedEx.name,
          sets_completed: completedCount,
          total_sets: cachedSets.length,
          weight_kg: weights.length > 0 ? Math.max(...weights) : (schedEx.weight ?? null),
          sets: cachedSets,
        });
        processedExIds.add(schedEx.id);
      } else {
        // Exercise from weekly split not yet logged on this date (0% completed)
        const configuredSets = getExerciseSets(schedEx);
        const sets: DailyExerciseSetLog[] = configuredSets.map((s, idx) => ({
          setNumber: s.setNumber || idx + 1,
          weight: s.weight !== undefined ? s.weight : (schedEx.weight ?? null),
          reps: s.reps || '10',
          completed: false,
        }));
        const weights = sets.map(s => s.weight).filter((w): w is number => w !== null && w > 0);
        const maxWeight = weights.length > 0 ? Math.max(...weights) : (schedEx.weight ?? null);

        results.push({
          exercise_id: schedEx.id,
          exercise_name: schedEx.name,
          sets_completed: 0,
          total_sets: sets.length,
          weight_kg: maxWeight,
          sets,
        });
        processedExIds.add(schedEx.id);
      }
    });

    // 2. Process any remaining raw logs not in the weekly schedule
    rawLogs.forEach(row => {
      if (!processedExIds.has(row.exercise_id) && !results.some(r => r.exercise_id === row.exercise_id || r.exercise_name?.toLowerCase() === row.exercise_name?.toLowerCase())) {
        results.push(buildLogItem(row));
        processedExIds.add(row.exercise_id);
      }
    });

    // 3. Process any remaining cached sets not yet in results
    Object.keys(cached).forEach(exId => {
      if (!processedExIds.has(exId) && !results.some(r => r.exercise_id === exId)) {
        const sets = cached[exId];
        const routineEx = routineExercisesMap[exId];
        const completedCount = sets.filter(s => s.completed).length;
        const weights = sets.map(s => s.weight).filter((w): w is number => w !== null && w > 0);
        results.push({
          exercise_id: exId,
          exercise_name: routineEx?.name || 'Exercise',
          sets_completed: completedCount,
          total_sets: sets.length,
          weight_kg: weights.length > 0 ? Math.max(...weights) : null,
          sets,
        });
        processedExIds.add(exId);
      }
    });

    return results;
  }, [user, getCachedSetsForDate]);

  /**
   * Fetch all historical exercise logs formatted as SpreadsheetWorkoutRow[]
   */
  const fetchAllDetailedLogs = useCallback(async (
    schedule?: DaySchedule[] | null,
    customRoutine?: DaySchedule | null
  ): Promise<SpreadsheetWorkoutRow[]> => {
    if (!user) return [];

    try {
      // 1. Fetch all workout_logs for this user
      const { data: logs, error } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      if (!logs || logs.length === 0) return [];

      // 2. Fetch all cloud user_workouts log: entries
      const { data: cloudLogs } = await supabase
        .from('user_workouts')
        .select('day, exercises')
        .eq('user_id', user.id)
        .like('day', 'log:%');

      const cloudMap: Record<string, Record<string, DailyExerciseSetLog[]>> = {};
      if (cloudLogs) {
        cloudLogs.forEach(entry => {
          const date = entry.day.replace('log:', '');
          if (!cloudMap[date]) cloudMap[date] = {};
          if (Array.isArray(entry.exercises)) {
            (entry.exercises as any[]).forEach(item => {
              if (item.id && Array.isArray(item.sets)) {
                cloudMap[date][item.id] = item.sets;
              }
            });
          }
        });
      }

      // 3. Prepare routine lookup
      const routineLookup: Record<string, Exercise> = {};
      if (schedule) {
        schedule.forEach(day => {
          day.exercises.forEach(ex => {
            routineLookup[ex.id] = ex;
            routineLookup[ex.name.toLowerCase()] = ex;
          });
        });
      }
      if (customRoutine) {
        customRoutine.exercises.forEach(ex => {
          routineLookup[ex.id] = ex;
          routineLookup[ex.name.toLowerCase()] = ex;
        });
      }

      const rows: SpreadsheetWorkoutRow[] = [];

      logs.forEach(log => {
        const dateKey = log.date;
        const cached = getCachedSetsForDate(dateKey);
        const cloudSets = cloudMap[dateKey]?.[log.exercise_id];
        const setsSource = cached[log.exercise_id] || cloudSets;
        const routineEx = routineLookup[log.exercise_id] || routineLookup[log.exercise_name?.toLowerCase()];

        let sets: DailyExerciseSetLog[] = [];
        if (setsSource && setsSource.length > 0) {
          sets = setsSource;
        } else if (routineEx) {
          const configured = getExerciseSets(routineEx);
          sets = configured.map((s, idx) => ({
            setNumber: s.setNumber || idx + 1,
            weight: s.weight !== undefined ? s.weight : (routineEx.weight ?? null),
            reps: s.reps || '10',
            completed: idx < log.sets_completed,
          }));
        } else {
          for (let i = 1; i <= log.total_sets; i++) {
            sets.push({
              setNumber: i,
              weight: null,
              reps: '10',
              completed: i <= log.sets_completed,
            });
          }
        }

        // Compute max weight and volume
        let maxWeight: number | null = null;
        let volume = 0;
        sets.forEach(s => {
          if (s.completed && s.weight !== null && s.weight > 0) {
            if (maxWeight === null || s.weight > maxWeight) {
              maxWeight = s.weight;
            }
            const repsNum = typeof s.reps === 'number' ? s.reps : parseInt(String(s.reps || '10'), 10) || 10;
            volume += s.weight * repsNum;
          }
        });

        // Day name
        const dayDate = new Date(`${dateKey}T00:00:00`);
        const dayName = isNaN(dayDate.getTime())
          ? ''
          : dayDate.toLocaleDateString('en-US', { weekday: 'short' });

        const totalSets = Math.max(log.total_sets, sets.length);
        const completionRate = totalSets > 0 ? Math.round((log.sets_completed / totalSets) * 100) : 0;

        rows.push({
          date: dateKey,
          dayName,
          exerciseId: log.exercise_id,
          exerciseName: log.exercise_name,
          setsCompleted: log.sets_completed,
          totalSets,
          sets,
          maxWeightKg: maxWeight,
          totalVolumeKg: Math.round(volume),
          isComplete: log.sets_completed >= totalSets && totalSets > 0,
          completionRate,
        });
      });

      return rows;
    } catch (err) {
      console.error('Error fetching all detailed logs:', err);
      return [];
    }
  }, [user, getCachedSetsForDate]);

  useEffect(() => {
    fetchTodayLogs();
  }, [fetchTodayLogs]);

  return {
    todayProgress,
    todaySets,
    loading,
    updateSetProgress,
    saveExerciseSets,
    resetTodayProgress,
    calculateTotalProgress,
    fetchCalendarHistory,
    fetchDayDetailedLogs,
    fetchAllDetailedLogs,
    refetch: fetchTodayLogs,
  };
};

