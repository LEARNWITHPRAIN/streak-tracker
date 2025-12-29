export type ExerciseStatus = 'pending' | 'done' | 'skipped';

export interface Exercise {
  id: string;
  name: string;
  status: ExerciseStatus;
  order: number;
}

export interface DayProgress {
  date: string; // YYYY-MM-DD format
  exercises: Exercise[];
  totalExercises: number;
  completedExercises: number;
}

export interface TimerSettings {
  restDuration: number; // in seconds
  soundEnabled: boolean;
}
