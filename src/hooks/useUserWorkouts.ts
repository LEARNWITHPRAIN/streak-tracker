import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Json } from '@/integrations/supabase/types';

import { ExerciseSet } from '@/types/exercise';
export type { ExerciseSet };

export interface Exercise {
  id: string;
  name: string;
  setsReps: string;
  /**
   * Weight in kilograms. Null indicates body weight.
   */
  weight: number | null;
  /**
   * Individual sets with custom weights
   */
  sets?: ExerciseSet[];
}

export interface DaySchedule {
  day: string;
  shortDay: string;
  title: string;
  subtitle: string;
  exercises: Exercise[];
}

export const defaultSchedule: DaySchedule[] = [
  {
    day: 'monday',
    shortDay: 'Mon',
    title: 'Push Day',
    subtitle: 'Chest · Shoulders · Triceps',
    exercises: [
      { id: 'mon-1', name: 'Barbell Bench Press', setsReps: '3×8-10', weight: 60 },
      { id: 'mon-2', name: 'Incline Dumbbell Press', setsReps: '3×10', weight: 22 },
      { id: 'mon-3', name: 'Overhead Shoulder Press', setsReps: '3×10', weight: 40 },
      { id: 'mon-4', name: 'Dumbbell Lateral Raises', setsReps: '3×12', weight: 10 },
      { id: 'mon-5', name: 'Tricep Rope Pushdowns', setsReps: '3×12', weight: 25 },
    ],
  },
  {
    day: 'tuesday',
    shortDay: 'Tue',
    title: 'Pull Day',
    subtitle: 'Back · Biceps · Rear Delts',
    exercises: [
      { id: 'tue-1', name: 'Lat Pulldown / Pull-ups', setsReps: '3×8-10', weight: 55 },
      { id: 'tue-2', name: 'Barbell Bent-Over Rows', setsReps: '3×10', weight: 50 },
      { id: 'tue-3', name: 'Seated Cable Rows', setsReps: '3×10', weight: 45 },
      { id: 'tue-4', name: 'Face Pulls', setsReps: '3×15', weight: 20 },
      { id: 'tue-5', name: 'Barbell Bicep Curls', setsReps: '3×12', weight: 25 },
      { id: 'tue-6', name: 'Dumbbell Hammer Curls', setsReps: '3×12', weight: 12 },
    ],
  },
  {
    day: 'wednesday',
    shortDay: 'Wed',
    title: 'Legs Day',
    subtitle: 'Quads · Hamstrings · Calves',
    exercises: [
      { id: 'wed-1', name: 'Barbell Back Squats', setsReps: '3×8-10', weight: 70 },
      { id: 'wed-2', name: 'Romanian Deadlifts (RDL)', setsReps: '3×10', weight: 60 },
      { id: 'wed-3', name: 'Leg Press', setsReps: '3×12', weight: 110 },
      { id: 'wed-4', name: 'Hamstring Leg Curls', setsReps: '3×12', weight: 40 },
      { id: 'wed-5', name: 'Standing Calf Raises', setsReps: '4×15', weight: 35 },
    ],
  },
  {
    day: 'thursday',
    shortDay: 'Thu',
    title: 'Push Day (Focus)',
    subtitle: 'Chest · Shoulders · Triceps',
    exercises: [
      { id: 'thu-1', name: 'Incline Barbell Bench Press', setsReps: '3×8-10', weight: 50 },
      { id: 'thu-2', name: 'Seated Dumbbell Shoulder Press', setsReps: '3×10', weight: 20 },
      { id: 'thu-3', name: 'Chest Dips', setsReps: '3×10', weight: null },
      { id: 'thu-4', name: 'Cable Chest Flyes', setsReps: '3×12', weight: 15 },
      { id: 'thu-5', name: 'Overhead Tricep Extension', setsReps: '3×12', weight: 20 },
    ],
  },
  {
    day: 'friday',
    shortDay: 'Fri',
    title: 'Pull Day (Focus)',
    subtitle: 'Back · Biceps · Rear Delts',
    exercises: [
      { id: 'fri-1', name: 'Deadlifts (Conventional)', setsReps: '3×6', weight: 80 },
      { id: 'fri-2', name: 'Close-Grip Lat Pulldown', setsReps: '3×10', weight: 50 },
      { id: 'fri-3', name: 'Single-Arm Dumbbell Rows', setsReps: '3×10', weight: 24 },
      { id: 'fri-4', name: 'Rear Delt Flyes', setsReps: '3×15', weight: 8 },
      { id: 'fri-5', name: 'Incline Dumbbell Curls', setsReps: '3×12', weight: 12 },
    ],
  },
  {
    day: 'saturday',
    shortDay: 'Sat',
    title: 'Legs & Core Day',
    subtitle: 'Quads · Glutes · Abs',
    exercises: [
      { id: 'sat-1', name: 'Front Squats / Goblet Squats', setsReps: '3×10', weight: 40 },
      { id: 'sat-2', name: 'Bulgarian Split Squats', setsReps: '3×10', weight: 14 },
      { id: 'sat-3', name: 'Leg Extensions', setsReps: '3×12', weight: 45 },
      { id: 'sat-4', name: 'Seated Calf Raises', setsReps: '4×15', weight: 30 },
      { id: 'sat-5', name: 'Hanging Knee / Leg Raises', setsReps: '3×15', weight: null },
      { id: 'sat-6', name: 'Plank Hold', setsReps: '3×45s', weight: null },
    ],
  },
  {
    day: 'sunday',
    shortDay: 'Sun',
    title: 'Rest & Recovery Day',
    subtitle: 'Mobility, Hydration & Sleep',
    exercises: [],
  },
];

export const parseSets = (setsReps: string): number | null => {
  if (!setsReps) return null;
  const match = setsReps.match(/^(\d+)\s*[×xX*]\s*\d+/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
};

export const parseReps = (setsReps: string): string => {
  if (!setsReps) return '10';
  const match = setsReps.match(/^\d+\s*[×xX*]\s*(.+)/);
  if (match) {
    return match[1].trim();
  }
  return setsReps;
};

/**
 * Returns structured sets for an exercise.
 * If exercise.sets is defined and non-empty, returns it.
 * Otherwise, generates sets from setsReps and base weight.
 */
export const getExerciseSets = (exercise: Exercise): ExerciseSet[] => {
  if (exercise.sets && exercise.sets.length > 0) {
    return exercise.sets.map((s, idx) => ({
      setNumber: s.setNumber || idx + 1,
      weight: s.weight !== undefined ? s.weight : (exercise.weight ?? null),
      reps: s.reps || parseReps(exercise.setsReps) || '10',
      completed: !!s.completed,
    }));
  }

  const count = parseSets(exercise.setsReps) || 3;
  const reps = parseReps(exercise.setsReps) || '10';
  const generated: ExerciseSet[] = [];
  for (let i = 1; i <= count; i++) {
    generated.push({
      setNumber: i,
      weight: exercise.weight ?? null,
      reps,
      completed: false,
    });
  }
  return generated;
};

export const formatExerciseSetsReps = (sets: ExerciseSet[]): string => {
  if (!sets || sets.length === 0) return '0 sets';
  const reps = sets[0]?.reps || '10';
  return `${sets.length}×${reps}`;
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

const SELECTED_WORKOUT_DAY_KEY = 'yodha_today_selected_day';
const DATE_ROUTINE_OVERRIDES_KEY = 'yodha_date_routine_overrides';

const getTodayKey = (): string => new Date().toISOString().split('T')[0];

const getInitialSelectedDay = (): string => {
  try {
    const todayKey = getTodayKey();
    const dateSaved = localStorage.getItem(`yodha_workout_day_${todayKey}`);
    if (dateSaved) return dateSaved.toLowerCase();

    const rawOverrides = localStorage.getItem(DATE_ROUTINE_OVERRIDES_KEY);
    if (rawOverrides) {
      const overrides = JSON.parse(rawOverrides);
      if (overrides[todayKey]) return overrides[todayKey].toLowerCase();
    }

    const saved = sessionStorage.getItem(SELECTED_WORKOUT_DAY_KEY);
    if (saved) return saved.toLowerCase();
  } catch {
    // ignore
  }
  return new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
};

export const useUserWorkouts = () => {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState<DaySchedule[]>(defaultSchedule);
  const [customRoutine, setCustomRoutine] = useState<DaySchedule>(defaultCustomRoutine);
  const [loading, setLoading] = useState(true);
  const [selectedWorkoutDay, setSelectedWorkoutDayState] = useState<string>(getInitialSelectedDay);

  const setSelectedWorkoutDay = useCallback((day: string) => {
    const normalized = day.toLowerCase();
    const todayKey = getTodayKey();
    setSelectedWorkoutDayState(normalized);
    try {
      localStorage.setItem(`yodha_workout_day_${todayKey}`, normalized);
      sessionStorage.setItem(SELECTED_WORKOUT_DAY_KEY, normalized);

      const rawOverrides = localStorage.getItem(DATE_ROUTINE_OVERRIDES_KEY);
      const overrides = rawOverrides ? JSON.parse(rawOverrides) : {};
      overrides[todayKey] = normalized;
      localStorage.setItem(DATE_ROUTINE_OVERRIDES_KEY, JSON.stringify(overrides));
    } catch {
      // ignore
    }
    window.dispatchEvent(new CustomEvent('today-workout-selected', { detail: normalized }));
    window.dispatchEvent(new Event('workout-progress-updated'));
  }, []);

  const setDateWorkoutDay = useCallback((dateKey: string, day: string) => {
    const normalized = day.toLowerCase();
    const todayKey = getTodayKey();
    try {
      const rawOverrides = localStorage.getItem(DATE_ROUTINE_OVERRIDES_KEY);
      const overrides = rawOverrides ? JSON.parse(rawOverrides) : {};
      overrides[dateKey] = normalized;
      localStorage.setItem(DATE_ROUTINE_OVERRIDES_KEY, JSON.stringify(overrides));
    } catch {
      // ignore
    }

    if (dateKey === todayKey) {
      setSelectedWorkoutDayState(normalized);
      try {
        localStorage.setItem(`yodha_workout_day_${todayKey}`, normalized);
        sessionStorage.setItem(SELECTED_WORKOUT_DAY_KEY, normalized);
      } catch {
        // ignore
      }
      window.dispatchEvent(new CustomEvent('today-workout-selected', { detail: normalized }));
    }

    window.dispatchEvent(new CustomEvent('date-routine-updated', { detail: { dateKey, day: normalized } }));
    window.dispatchEvent(new Event('workout-progress-updated'));
  }, []);

  // Listen for workout selection changes across components
  useEffect(() => {
    const handleSelectedWorkoutUpdate = (e: Event) => {
      const customEv = e as CustomEvent<string>;
      if (customEv.detail) {
        setSelectedWorkoutDayState(customEv.detail.toLowerCase());
      } else {
        try {
          const todayKey = getTodayKey();
          const dateSaved = localStorage.getItem(`yodha_workout_day_${todayKey}`);
          if (dateSaved) {
            setSelectedWorkoutDayState(dateSaved.toLowerCase());
            return;
          }
          const saved = sessionStorage.getItem(SELECTED_WORKOUT_DAY_KEY);
          if (saved) setSelectedWorkoutDayState(saved.toLowerCase());
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener('today-workout-selected', handleSelectedWorkoutUpdate);
    return () => {
      window.removeEventListener('today-workout-selected', handleSelectedWorkoutUpdate);
    };
  }, []);
  
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

  /**
   * Upsert a generated plan (from onboarding) into user_workouts.
   * Replaces any existing rows for this user.
   */
  const initializePlanSchedule = async (generatedSchedule: DaySchedule[]) => {
    if (!user) return;

    try {
      const upserts = generatedSchedule.map(day => ({
        user_id: user.id,
        day: day.day,
        short_day: day.shortDay,
        title: day.title,
        subtitle: day.subtitle,
        exercises: day.exercises as unknown as Json,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('user_workouts')
        .upsert(upserts, { onConflict: 'user_id,day' });

      if (error) throw error;

      setSchedule(generatedSchedule);
      window.dispatchEvent(new Event('workout-schedule-updated'));
      window.dispatchEvent(new Event('workout-progress-updated'));
    } catch (error) {
      console.error('Error initializing plan schedule:', error);
      throw error;
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

  // Get today's schedule - returns custom routine if useSameDaily, otherwise currently selected/scheduled workout
  const getTodaySchedule = useCallback((): DaySchedule | null => {
    if (useSameDaily) {
      return customRoutine || defaultCustomRoutine;
    }
    // If a specific workout day has been selected by the user for Today's session, return it
    if (selectedWorkoutDay) {
      const match = schedule.find(d => d.day.toLowerCase() === selectedWorkoutDay.toLowerCase());
      if (match) return match;
    }
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    return schedule.find(d => d.day === today) || schedule[0] || null;
  }, [useSameDaily, customRoutine, schedule, selectedWorkoutDay]);

  // Get schedule for any specific date (YYYY-MM-DD), checking overrides, today's selection, and weekly split
  const getScheduleForDate = useCallback((dateKey: string): DaySchedule | null => {
    const todayKey = getTodayKey();
    if (dateKey === todayKey) {
      return getTodaySchedule();
    }

    let overrideDay: string | null = null;
    try {
      const rawOverrides = localStorage.getItem(DATE_ROUTINE_OVERRIDES_KEY);
      if (rawOverrides) {
        const overrides = JSON.parse(rawOverrides);
        if (overrides[dateKey]) overrideDay = overrides[dateKey].toLowerCase();
      }
    } catch {
      // ignore
    }

    if (overrideDay) {
      const match = schedule.find(d => d.day.toLowerCase() === overrideDay);
      if (match) return match;
    }

    if (useSameDaily && customRoutine) {
      return customRoutine;
    }

    const parts = dateKey.split('-');
    if (parts.length === 3) {
      const [y, m, d] = parts.map(Number);
      const dateObj = new Date(y, m - 1, d);
      const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      return schedule.find(d => d.day.toLowerCase() === dayOfWeek) || null;
    }

    return null;
  }, [getTodaySchedule, schedule, customRoutine, useSameDaily]);

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
    selectedWorkoutDay,
    setSelectedWorkoutDay,
    setDateWorkoutDay,
    getScheduleForDate,
    updateDayWorkout,
    getTodaySchedule,
    getTodayName,
    toggleUseSameDaily,
    initializePlanSchedule,
    refetch: fetchSchedule,
  };
};
