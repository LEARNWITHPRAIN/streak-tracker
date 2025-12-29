import { useState, useEffect } from 'react';
import { useWeeklySchedule, parseSets } from './useWeeklySchedule';

interface SetProgress {
  [exerciseId: string]: number;
}

const getTodayKey = () => new Date().toISOString().split('T')[0];

export const useTodayProgress = () => {
  const { getTodaySchedule } = useWeeklySchedule();
  const [setProgress, setSetProgress] = useState<SetProgress>({});
  const todaySchedule = getTodaySchedule();

  useEffect(() => {
    const savedProgress = localStorage.getItem(`today-workout-progress-${getTodayKey()}`);
    if (savedProgress) {
      setSetProgress(JSON.parse(savedProgress));
    }
  }, []);

  const getTotalProgress = (): number => {
    if (!todaySchedule || todaySchedule.exercises.length === 0) return 0;
    
    let totalSets = 0;
    let completedSets = 0;
    
    todaySchedule.exercises.forEach(ex => {
      const sets = parseSets(ex.setsReps);
      if (sets) {
        totalSets += sets;
        completedSets += Math.min(setProgress[ex.id] || 0, sets);
      } else {
        totalSets += 1;
        if (setProgress[ex.id] && setProgress[ex.id] >= 1) {
          completedSets += 1;
        }
      }
    });
    
    return totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
  };

  const getStats = () => {
    if (!todaySchedule) return { total: 0, completed: 0 };
    
    let totalSets = 0;
    let completedSets = 0;
    
    todaySchedule.exercises.forEach(ex => {
      const sets = parseSets(ex.setsReps);
      if (sets) {
        totalSets += sets;
        completedSets += Math.min(setProgress[ex.id] || 0, sets);
      } else {
        totalSets += 1;
        if (setProgress[ex.id] && setProgress[ex.id] >= 1) {
          completedSets += 1;
        }
      }
    });
    
    return { total: totalSets, completed: completedSets };
  };

  return {
    todayProgress: getTotalProgress(),
    todayStats: getStats(),
  };
};
