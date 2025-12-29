import { useState, useEffect, useCallback } from 'react';
import { useWeeklySchedule, parseSets } from './useWeeklySchedule';

interface SetProgress {
  [exerciseId: string]: number;
}

const getTodayKey = () => new Date().toISOString().split('T')[0];

export const useTodayProgress = () => {
  const { getTodaySchedule } = useWeeklySchedule();
  const [setProgress, setSetProgress] = useState<SetProgress>({});
  const [refreshKey, setRefreshKey] = useState(0);
  const todaySchedule = getTodaySchedule();

  // Load from localStorage and set up storage event listener
  useEffect(() => {
    const loadProgress = () => {
      const savedProgress = localStorage.getItem(`today-workout-progress-${getTodayKey()}`);
      if (savedProgress) {
        setSetProgress(JSON.parse(savedProgress));
      } else {
        setSetProgress({});
      }
    };

    loadProgress();

    // Listen for storage changes from other components
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `today-workout-progress-${getTodayKey()}`) {
        loadProgress();
      }
    };

    // Custom event for same-tab updates
    const handleCustomUpdate = () => {
      loadProgress();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('workout-progress-updated', handleCustomUpdate);

    // Poll for changes every 500ms as a fallback
    const interval = setInterval(loadProgress, 500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('workout-progress-updated', handleCustomUpdate);
      clearInterval(interval);
    };
  }, []);

  const getTotalProgress = useCallback((): number => {
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
  }, [todaySchedule, setProgress]);

  const getStats = useCallback(() => {
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
  }, [todaySchedule, setProgress]);

  return {
    todayProgress: getTotalProgress(),
    todayStats: getStats(),
  };
};
