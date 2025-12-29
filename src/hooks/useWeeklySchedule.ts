import { useState, useEffect } from 'react';

export interface WeeklyExercise {
  id: string;
  name: string;
  setsReps: string;
}

export interface DaySchedule {
  day: string;
  shortDay: string;
  title: string;
  subtitle: string;
  exercises: WeeklyExercise[];
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

// Parse setsReps like "3×12", "3x12", "4×8" to get the number of sets
export const parseSets = (setsReps: string): number | null => {
  const match = setsReps.match(/^(\d+)\s*[×xX]\s*\d+/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
};

export const useWeeklySchedule = () => {
  const [schedule, setSchedule] = useState<DaySchedule[]>(defaultSchedule);
  const [useSameDaily, setUseSameDaily] = useState(false);

  useEffect(() => {
    const savedSchedule = localStorage.getItem('weekly-schedule');
    if (savedSchedule) {
      setSchedule(JSON.parse(savedSchedule));
    }
    
    const savedSameDaily = localStorage.getItem('use-same-daily');
    if (savedSameDaily) {
      setUseSameDaily(JSON.parse(savedSameDaily));
    }
  }, []);

  const saveSchedule = (newSchedule: DaySchedule[]) => {
    setSchedule(newSchedule);
    localStorage.setItem('weekly-schedule', JSON.stringify(newSchedule));
  };

  const toggleUseSameDaily = () => {
    const newValue = !useSameDaily;
    setUseSameDaily(newValue);
    localStorage.setItem('use-same-daily', JSON.stringify(newValue));
  };

  const getTodaySchedule = (): DaySchedule | null => {
    if (useSameDaily) {
      // Return Monday's schedule as the "same daily" routine
      return schedule.find(d => d.day === 'monday') || null;
    }
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    return schedule.find(d => d.day === today) || null;
  };

  const getTodayName = (): string => {
    return new Date().toLocaleDateString('en-US', { weekday: 'long' });
  };

  return {
    schedule,
    useSameDaily,
    saveSchedule,
    toggleUseSameDaily,
    getTodaySchedule,
    getTodayName,
    parseSets,
  };
};
