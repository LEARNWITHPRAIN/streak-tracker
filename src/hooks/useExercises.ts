import { useState, useEffect } from 'react';
import { Exercise, ExerciseStatus, DayProgress } from '@/types/exercise';

const DEFAULT_EXERCISES: Omit<Exercise, 'id'>[] = [
  { name: '60 sec planche', status: 'pending', order: 1 },
  { name: '10 scapula push ups', status: 'pending', order: 2 },
  { name: '10 negative push ups', status: 'pending', order: 3 },
  { name: '10 normal pushups', status: 'pending', order: 4 },
  { name: '10 wide push ups', status: 'pending', order: 5 },
  { name: '10 diamond pushups', status: 'pending', order: 6 },
  { name: '10 triceps extensions', status: 'pending', order: 7 },
  { name: '5 archer pushups', status: 'pending', order: 8 },
];

const generateId = () => Math.random().toString(36).substring(2, 9);

const getTodayKey = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

export const useExercises = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [history, setHistory] = useState<Record<string, DayProgress>>({});
  const todayKey = getTodayKey();

  // Load from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('exercise-history');
    const savedExerciseTemplate = localStorage.getItem('exercise-template');
    
    if (savedHistory) {
      const parsedHistory = JSON.parse(savedHistory);
      setHistory(parsedHistory);
      
      // Load today's exercises if they exist
      if (parsedHistory[todayKey]) {
        setExercises(parsedHistory[todayKey].exercises);
      } else {
        // Initialize today with template or defaults
        initializeToday(savedExerciseTemplate);
      }
    } else {
      initializeToday(savedExerciseTemplate);
    }
  }, []);

  const initializeToday = (savedTemplate: string | null) => {
    let template = DEFAULT_EXERCISES;
    if (savedTemplate) {
      template = JSON.parse(savedTemplate);
    }
    
    const todayExercises = template.map((ex, idx) => ({
      ...ex,
      id: generateId(),
      status: 'pending' as ExerciseStatus,
      order: idx + 1,
    }));
    
    setExercises(todayExercises);
  };

  // Save exercises whenever they change
  useEffect(() => {
    if (exercises.length === 0) return;
    
    const newHistory = {
      ...history,
      [todayKey]: {
        date: todayKey,
        exercises,
        totalExercises: exercises.length,
        completedExercises: exercises.filter(e => e.status === 'done').length,
      },
    };
    
    setHistory(newHistory);
    localStorage.setItem('exercise-history', JSON.stringify(newHistory));
  }, [exercises]);

  const updateExerciseStatus = (id: string, status: ExerciseStatus) => {
    setExercises(prev => 
      prev.map(ex => ex.id === id ? { ...ex, status } : ex)
    );
  };

  const addExercise = (name: string) => {
    const newExercise: Exercise = {
      id: generateId(),
      name,
      status: 'pending',
      order: exercises.length + 1,
    };
    
    const updated = [...exercises, newExercise];
    setExercises(updated);
    
    // Update template
    const template = updated.map(({ name, order }) => ({ name, order, status: 'pending' as ExerciseStatus }));
    localStorage.setItem('exercise-template', JSON.stringify(template));
  };

  const editExercise = (id: string, name: string) => {
    const updated = exercises.map(ex => ex.id === id ? { ...ex, name } : ex);
    setExercises(updated);
    
    // Update template
    const template = updated.map(({ name, order }) => ({ name, order, status: 'pending' as ExerciseStatus }));
    localStorage.setItem('exercise-template', JSON.stringify(template));
  };

  const deleteExercise = (id: string) => {
    const updated = exercises
      .filter(ex => ex.id !== id)
      .map((ex, idx) => ({ ...ex, order: idx + 1 }));
    setExercises(updated);
    
    // Update template
    const template = updated.map(({ name, order }) => ({ name, order, status: 'pending' as ExerciseStatus }));
    localStorage.setItem('exercise-template', JSON.stringify(template));
  };

  const reorderExercises = (newOrder: Exercise[]) => {
    const updated = newOrder.map((ex, idx) => ({ ...ex, order: idx + 1 }));
    setExercises(updated);
    
    // Update template
    const template = updated.map(({ name, order }) => ({ name, order, status: 'pending' as ExerciseStatus }));
    localStorage.setItem('exercise-template', JSON.stringify(template));
  };

  const resetToday = () => {
    setExercises(prev => prev.map(ex => ({ ...ex, status: 'pending' as ExerciseStatus })));
  };

  const stats = {
    total: exercises.length,
    done: exercises.filter(e => e.status === 'done').length,
    pending: exercises.filter(e => e.status === 'pending').length,
    skipped: exercises.filter(e => e.status === 'skipped').length,
  };

  const completionPercentage = stats.total > 0 
    ? Math.round((stats.done / stats.total) * 100) 
    : 0;

  const nextExercise = exercises.find(e => e.status === 'pending');

  return {
    exercises,
    history,
    stats,
    completionPercentage,
    nextExercise,
    updateExerciseStatus,
    addExercise,
    editExercise,
    deleteExercise,
    reorderExercises,
    resetToday,
  };
};
