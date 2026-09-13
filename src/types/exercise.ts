export type ExerciseStatus = 'pending' | 'done' | 'skipped';

export interface ExerciseSet {
  setNumber: number;
  weight: number | null; // in kilograms; null indicates body-weight (BW)
  reps?: number | string; // e.g. 10 or '8-12'
  completed?: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  status: ExerciseStatus;
  order: number;
  /**
   * Weight for the exercise in kilograms.
   * `null` indicates body-weight only.
   */
  weight: number | null;
  /**
   * Optional multiple sets with individual weights and reps
   */
  sets?: ExerciseSet[];
}

export interface DailyExerciseSetLog {
  setNumber: number;
  weight: number | null;
  reps?: number | string;
  completed: boolean;
}

export interface DetailedExerciseLog {
  exercise_id: string;
  exercise_name: string;
  sets_completed: number;
  total_sets: number;
  weight_kg?: number | null;
  sets?: DailyExerciseSetLog[];
}

export interface SpreadsheetWorkoutRow {
  date: string; // YYYY-MM-DD
  dayName: string; // e.g. "Friday"
  exerciseId: string;
  exerciseName: string;
  setsCompleted: number;
  totalSets: number;
  sets: DailyExerciseSetLog[];
  maxWeightKg: number | null;
  totalVolumeKg: number;
  isComplete: boolean;
  completionRate: number;
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
  autoStart: boolean; // auto-start rest timer after completing a set
}

