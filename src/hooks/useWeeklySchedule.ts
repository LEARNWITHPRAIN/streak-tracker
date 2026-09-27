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
    exercises: [],
  },
  {
    day: 'tuesday',
    shortDay: 'Tue',
    title: 'Pull Day',
    subtitle: 'Back & Biceps',
    exercises: [],
  },
  {
    day: 'wednesday',
    shortDay: 'Wed',
    title: 'Legs & Core',
    subtitle: 'Lower Body Power',
    exercises: [],
  },
  {
    day: 'thursday',
    shortDay: 'Thu',
    title: 'Shoulders & Arms',
    subtitle: 'Delts & Arms Focus',
    exercises: [],
  },
  {
    day: 'friday',
    shortDay: 'Fri',
    title: 'Pull Day',
    subtitle: 'Back Width & Thickness',
    exercises: [],
  },
  {
    day: 'saturday',
    shortDay: 'Sat',
    title: 'Full Body Intensity',
    subtitle: 'Compound Movements',
    exercises: [],
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
