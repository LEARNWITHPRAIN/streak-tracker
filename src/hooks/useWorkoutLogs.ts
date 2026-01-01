import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { parseSets, DaySchedule, Exercise } from './useUserWorkouts';

interface SetProgress {
  [exerciseId: string]: number;
}

interface WorkoutLog {
  exercise_id: string;
  exercise_name: string;
  sets_completed: number;
  total_sets: number;
}

export const useWorkoutLogs = () => {
  const { user } = useAuth();
  const [todayProgress, setTodayProgress] = useState<SetProgress>({});
  const [loading, setLoading] = useState(true);

  const getTodayKey = () => new Date().toISOString().split('T')[0];

  // Fetch today's workout logs
  const fetchTodayLogs = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', getTodayKey());

      if (error) throw error;

      if (data) {
        const progress: SetProgress = {};
        data.forEach(log => {
          progress[log.exercise_id] = log.sets_completed;
        });
        setTodayProgress(progress);
      }
    } catch (error) {
      console.error('Error fetching workout logs:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

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
      // If allExercises is provided, ensure all exercises are logged to keep calendar in sync
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
        // Fallback to single exercise update
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

      // Update local state
      setTodayProgress(prev => ({
        ...prev,
        [exerciseId]: setsCompleted,
      }));

      // Dispatch event to notify other components
      window.dispatchEvent(new Event('workout-progress-updated'));
    } catch (error) {
      console.error('Error updating workout log:', error);
    }
  };

  // Reset all progress for today
  const resetTodayProgress = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('workout_logs')
        .delete()
        .eq('user_id', user.id)
        .eq('date', getTodayKey());

      if (error) throw error;

      setTodayProgress({});
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
    });

    const percentage = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
    return { percentage, completed: completedSets, total: totalSets };
  };

  // Fetch calendar history for a date range
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

      // Group by date - sum all sets across exercises
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

  useEffect(() => {
    fetchTodayLogs();
  }, [fetchTodayLogs]);

  return {
    todayProgress,
    loading,
    updateSetProgress,
    resetTodayProgress,
    calculateTotalProgress,
    fetchCalendarHistory,
    refetch: fetchTodayLogs,
  };
};
