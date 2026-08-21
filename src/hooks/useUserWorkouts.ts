import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Json } from '@/integrations/supabase/types';

export interface Exercise {
  id: string;
  name: string;
  setsReps: string;
}

export interface DaySchedule {
  day: string;
  shortDay: string;
  title: string;
  subtitle: string;
  exercises: Exercise[];
}

const defaultSchedule: DaySchedule[] = [
  {
    day: 'monday',
    shortDay: 'Mon',
    title: 'Push Day',
    subtitle: 'Chest & Triceps',
    exercises: [
      { id: 'mon-1', name: 'Bench Press', setsReps: '4×8' },
      { id: 'mon-2', name: 'Incline Dumbbell Press', setsReps: '3×10' },
      { id: 'mon-3', name: 'Dips', setsReps: '3×12' },
      { id: 'mon-4', name: 'Tricep Pushdowns', setsReps: '3×15' },
    ],
  },
  {
    day: 'tuesday',
    shortDay: 'Tue',
    title: 'Pull Day',
    subtitle: 'Back & Biceps',
    exercises: [
      { id: 'tue-1', name: 'Pull-ups', setsReps: '4×8' },
      { id: 'tue-2', name: 'Barbell Rows', setsReps: '4×10' },
      { id: 'tue-3', name: 'Face Pulls', setsReps: '3×15' },
      { id: 'tue-4', name: 'Bicep Curls', setsReps: '3×12' },
    ],
  },
  {
    day: 'wednesday',
    shortDay: 'Wed',
    title: 'Active Recovery',
    subtitle: 'Mobility & Light Cardio',
    exercises: [
      { id: 'wed-1', name: 'Yoga Flow', setsReps: '20 min' },
      { id: 'wed-2', name: 'Light Cardio', setsReps: '15 min' },
      { id: 'wed-3', name: 'Stretching', setsReps: '10 min' },
    ],
  },
  {
    day: 'thursday',
    shortDay: 'Thu',
    title: 'Legs & Core',
    subtitle: 'Lower Body Power',
    exercises: [
      { id: 'thu-1', name: 'Squats', setsReps: '4×8' },
      { id: 'thu-2', name: 'Romanian Deadlifts', setsReps: '3×10' },
      { id: 'thu-3', name: 'Walking Lunges', setsReps: '3×12' },
      { id: 'thu-4', name: 'Plank Hold', setsReps: '3×45s' },
    ],
  },
  {
    day: 'friday',
    shortDay: 'Fri',
    title: 'Upper Body Focus',
    subtitle: 'Shoulders & Arms',
    exercises: [
      { id: 'fri-1', name: 'Overhead Press', setsReps: '4×8' },
      { id: 'fri-2', name: 'Lateral Raises', setsReps: '3×12' },
      { id: 'fri-3', name: 'Hammer Curls', setsReps: '3×10' },
      { id: 'fri-4', name: 'Skull Crushers', setsReps: '3×12' },
    ],
  },
  {
    day: 'saturday',
    shortDay: 'Sat',
    title: 'Full Body Intensity',
    subtitle: 'Compound Movements',
    exercises: [
      { id: 'sat-1', name: 'Deadlifts', setsReps: '5×5' },
      { id: 'sat-2', name: 'Clean & Press', setsReps: '4×6' },
      { id: 'sat-3', name: 'Burpees', setsReps: '3×15' },
    ],
  },
  {
    day: 'sunday',
    shortDay: 'Sun',
    title: 'Rest Day',
    subtitle: 'Recovery & Relaxation',
    exercises: [],
  },
];

export const parseSets = (setsReps: string): number | null => {
  const match = setsReps.match(/^(\d+)\s*[×xX]\s*\d+/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
};

const SAME_DAILY_KEY = 'yodha-same-daily';
const CUSTOM_ROUTINE_KEY = 'custom';

const defaultCustomRoutine: DaySchedule = {
  day: CUSTOM_ROUTINE_KEY,
  shortDay: 'Daily',
  title: 'Daily Routine',
  subtitle: 'Same workout every day',
  exercises: [
    { id: 'custom-1', name: 'Push-ups', setsReps: '3×15' },
    { id: 'custom-2', name: 'Squats', setsReps: '3×15' },
    { id: 'custom-3', name: 'Plank', setsReps: '3×30s' },
  ],
};

export const useUserWorkouts = () => {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState<DaySchedule[]>(defaultSchedule);
  const [customRoutine, setCustomRoutine] = useState<DaySchedule>(defaultCustomRoutine);
  const [loading, setLoading] = useState(true);
  
  // Initialize useSameDaily from localStorage
  const [useSameDaily, setUseSameDaily] = useState(() => {
    try {
      const saved = localStorage.getItem(SAME_DAILY_KEY);
      return saved === 'true';
    } catch {
      return false;
    }
  });

  // Listen for same-daily updates across components & tabs
  useEffect(() => {
    const handleSameDailyUpdate = () => {
      try {
        const saved = localStorage.getItem(SAME_DAILY_KEY);
        setUseSameDaily(saved === 'true');
      } catch {
        // ignore
      }
    };

    window.addEventListener('same-daily-updated', handleSameDailyUpdate);
    window.addEventListener('storage', handleSameDailyUpdate);

    return () => {
      window.removeEventListener('same-daily-updated', handleSameDailyUpdate);
      window.removeEventListener('storage', handleSameDailyUpdate);
    };
  }, []);

  // Fetch user's workout schedule from database
  const fetchSchedule = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_workouts')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      if (data && data.length > 0) {
        // Map database data to schedule format (exclude custom)
        const dbSchedule = defaultSchedule.map(defaultDay => {
          const dbDay = data.find(d => d.day === defaultDay.day);
          if (dbDay) {
            return {
              day: dbDay.day,
              shortDay: dbDay.short_day,
              title: dbDay.title,
              subtitle: dbDay.subtitle,
              exercises: dbDay.exercises as unknown as Exercise[],
            };
          }
          return defaultDay;
        });
        setSchedule(dbSchedule);

        // Check for custom routine
        const customData = data.find(d => d.day === CUSTOM_ROUTINE_KEY);
        if (customData) {
          setCustomRoutine({
            day: CUSTOM_ROUTINE_KEY,
            shortDay: 'Daily',
            title: customData.title,
            subtitle: customData.subtitle,
            exercises: customData.exercises as unknown as Exercise[],
          });
        } else {
          setCustomRoutine(defaultCustomRoutine);
        }
      } else {
        // Initialize with default schedule for new users
        await initializeDefaultSchedule();
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Listen for schedule updates from custom routine editor
  useEffect(() => {
    const handleScheduleUpdate = () => {
      fetchSchedule();
    };

    window.addEventListener('workout-schedule-updated', handleScheduleUpdate);
    return () => {
      window.removeEventListener('workout-schedule-updated', handleScheduleUpdate);
    };
  }, [fetchSchedule]);

  // Initialize default schedule for new users
  const initializeDefaultSchedule = async () => {
    if (!user) return;

    try {
      const inserts = defaultSchedule.map(day => ({
        user_id: user.id,
        day: day.day,
        short_day: day.shortDay,
        title: day.title,
        subtitle: day.subtitle,
        exercises: day.exercises as unknown as Json,
      }));

      const { error } = await supabase.from('user_workouts').insert(inserts);
      if (error) throw error;
    } catch (error) {
      console.error('Error initializing schedule:', error);
    }
  };

  // Update a day's workout
  const updateDayWorkout = async (dayName: string, updates: Partial<DaySchedule>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_workouts')
        .update({
          title: updates.title,
          subtitle: updates.subtitle,
          exercises: updates.exercises as unknown as Json,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('day', dayName);

      if (error) throw error;

      // Update local state
      if (dayName === CUSTOM_ROUTINE_KEY) {
        setCustomRoutine(prev => ({ ...prev, ...updates }));
      } else {
        setSchedule(prev =>
          prev.map(d => (d.day === dayName ? { ...d, ...updates } : d))
        );
      }

      window.dispatchEvent(new Event('workout-schedule-updated'));
      window.dispatchEvent(new Event('workout-progress-updated'));
    } catch (error) {
      console.error('Error updating workout:', error);
    }
  };

  // Get today's schedule - returns custom routine if useSameDaily, otherwise day-specific
  const getTodaySchedule = useCallback((): DaySchedule | null => {
    if (useSameDaily) {
      return customRoutine || defaultCustomRoutine;
    }
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    return schedule.find(d => d.day === today) || null;
  }, [useSameDaily, customRoutine, schedule]);

  const getTodayName = (): string => {
    return new Date().toLocaleDateString('en-US', { weekday: 'long' });
  };

  const toggleUseSameDaily = () => {
    setUseSameDaily(prev => {
      const newValue = !prev;
      try {
        localStorage.setItem(SAME_DAILY_KEY, String(newValue));
      } catch {
        // Ignore localStorage errors
      }
      window.dispatchEvent(new CustomEvent('same-daily-updated', { detail: newValue }));
      window.dispatchEvent(new Event('workout-progress-updated'));
      return newValue;
    });
  };

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  return {
    schedule,
    customRoutine,
    loading,
    useSameDaily,
    updateDayWorkout,
    getTodaySchedule,
    getTodayName,
    toggleUseSameDaily,
    refetch: fetchSchedule,
  };
};
