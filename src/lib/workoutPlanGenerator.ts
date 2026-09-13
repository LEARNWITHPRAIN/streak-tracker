// ── Workout Plan Generator ────────────────────────────────────────────────────
// Pure TypeScript — no React, no Supabase. Converts onboarding answers into a
// ready-to-store DaySchedule[] in the same shape used by useUserWorkouts.

import { DaySchedule, Exercise } from '@/hooks/useUserWorkouts';

export type Goal = 'lose_fat' | 'build_muscle' | 'strength' | 'endurance' | 'general_fitness';
export type Experience = 'beginner' | 'intermediate' | 'advanced';
export type Equipment = 'full_gym' | 'dumbbells_only' | 'bodyweight' | 'barbell_rack';
export type TemplateName = 'full_body' | 'upper_lower' | 'push_pull_legs' | 'bro_split';

export interface OnboardingPreferences {
  goal: Goal;
  experience: Experience;
  equipment: Equipment;
  training_days: number;
  session_duration: string;
  limitations?: string | null;
  selected_template?: TemplateName | null;
}

export interface TemplateRecommendation {
  template: TemplateName;
  label: string;
  description: string;
  trainingDays: number;
  reason: string;
  isRecommended: boolean;
  schedule: { day: string; type: 'workout' | 'rest'; label: string }[];
}

// ── Rep/Set scheme by goal ────────────────────────────────────────────────────
const getScheme = (goal: Goal, experience: Experience): { sets: number; reps: string; rest: string } => {
  if (goal === 'strength') {
    return experience === 'beginner'
      ? { sets: 3, reps: '5', rest: '3 min' }
      : { sets: 5, reps: '3-5', rest: '3-5 min' };
  }
  if (goal === 'lose_fat' || goal === 'endurance') {
    return { sets: 3, reps: '15-20', rest: '60s' };
  }
  // build_muscle / general_fitness
  if (experience === 'beginner') return { sets: 3, reps: '10-12', rest: '90s' };
  if (experience === 'advanced') return { sets: 4, reps: '8-12', rest: '2 min' };
  return { sets: 3, reps: '8-12', rest: '90s' };
};

const makeSetsReps = (sets: number, reps: string) => `${sets}×${reps}`;

// ── Exercise library ───────────────────────────────────────────────────────────
type MuscleFocus = 'chest' | 'back' | 'shoulders' | 'arms' | 'legs' | 'core' | 'glutes' | 'quads' | 'hamstrings' | 'calves';

const exerciseLibrary: Record<MuscleFocus, Record<Equipment | 'any', string[]>> = {
  chest: {
    full_gym: ['Bench Press', 'Incline Dumbbell Press', 'Cable Flyes', 'Dips', 'Chest Press Machine'],
    barbell_rack: ['Bench Press', 'Incline Bench Press', 'Dips', 'Push-ups'],
    dumbbells_only: ['Dumbbell Bench Press', 'Incline Dumbbell Press', 'Dumbbell Flyes', 'Push-ups'],
    bodyweight: ['Push-ups', 'Wide Push-ups', 'Diamond Push-ups', 'Decline Push-ups', 'Dips'],
    any: ['Push-ups', 'Dumbbell Bench Press', 'Bench Press'],
  },
  back: {
    full_gym: ['Pull-ups', 'Barbell Rows', 'Lat Pulldown', 'Cable Rows', 'Face Pulls', 'Deadlifts'],
    barbell_rack: ['Deadlifts', 'Barbell Rows', 'Pull-ups', 'Rack Pulls'],
    dumbbells_only: ['Dumbbell Rows', 'Chest-Supported Rows', 'Pull-ups', 'Renegade Rows'],
    bodyweight: ['Pull-ups', 'Chin-ups', 'Inverted Rows', 'Superman Hold'],
    any: ['Pull-ups', 'Dumbbell Rows', 'Barbell Rows'],
  },
  shoulders: {
    full_gym: ['Overhead Press', 'Lateral Raises', 'Front Raises', 'Face Pulls', 'Rear Delt Flyes'],
    barbell_rack: ['Barbell Overhead Press', 'Barbell Upright Rows', 'Lateral Raises'],
    dumbbells_only: ['Dumbbell Overhead Press', 'Lateral Raises', 'Front Raises', 'Bent-Over Lateral Raises'],
    bodyweight: ['Pike Push-ups', 'Handstand Push-ups', 'Shoulder Taps'],
    any: ['Overhead Press', 'Lateral Raises'],
  },
  arms: {
    full_gym: ['Bicep Curls', 'Tricep Pushdowns', 'Hammer Curls', 'Skull Crushers', 'Cable Curls'],
    barbell_rack: ['Barbell Curls', 'Close-Grip Bench Press', 'Skull Crushers', 'Hammer Curls'],
    dumbbells_only: ['Dumbbell Curls', 'Hammer Curls', 'Overhead Tricep Extension', 'Concentration Curls'],
    bodyweight: ['Diamond Push-ups', 'Dips', 'Chin-ups'],
    any: ['Bicep Curls', 'Tricep Pushdowns', 'Hammer Curls'],
  },
  legs: {
    full_gym: ['Squat', 'Romanian Deadlift', 'Leg Press', 'Leg Curl', 'Leg Extension', 'Calf Raise'],
    barbell_rack: ['Squat', 'Romanian Deadlift', 'Barbell Lunges', 'Calf Raise'],
    dumbbells_only: ['Goblet Squat', 'Romanian Deadlift', 'Dumbbell Lunges', 'Bulgarian Split Squat', 'Calf Raise'],
    bodyweight: ['Squats', 'Lunges', 'Bulgarian Split Squat', 'Wall Sit', 'Glute Bridges', 'Calf Raises'],
    any: ['Squat', 'Lunges', 'Calf Raise'],
  },
  quads: {
    full_gym: ['Squat', 'Leg Press', 'Leg Extension', 'Walking Lunges', 'Front Squat'],
    barbell_rack: ['Squat', 'Front Squat', 'Barbell Lunges'],
    dumbbells_only: ['Goblet Squat', 'Dumbbell Lunges', 'Bulgarian Split Squat'],
    bodyweight: ['Squats', 'Lunges', 'Step-ups', 'Wall Sit'],
    any: ['Squat', 'Lunges'],
  },
  hamstrings: {
    full_gym: ['Romanian Deadlift', 'Leg Curl', 'Good Mornings', 'Stiff-Leg Deadlift'],
    barbell_rack: ['Romanian Deadlift', 'Good Mornings', 'Stiff-Leg Deadlift'],
    dumbbells_only: ['Romanian Deadlift', 'Dumbbell Leg Curl', 'Nordic Curls'],
    bodyweight: ['Nordic Curls', 'Glute-Ham Raises', 'Hip Hinges'],
    any: ['Romanian Deadlift', 'Leg Curl'],
  },
  glutes: {
    full_gym: ['Hip Thrust', 'Romanian Deadlift', 'Cable Kickbacks', 'Sumo Deadlift', 'Leg Press'],
    barbell_rack: ['Hip Thrust', 'Romanian Deadlift', 'Sumo Deadlift'],
    dumbbells_only: ['Dumbbell Hip Thrust', 'Romanian Deadlift', 'Dumbbell Sumo Squat'],
    bodyweight: ['Glute Bridges', 'Hip Thrusts', 'Donkey Kicks', 'Clamshells'],
    any: ['Hip Thrust', 'Glute Bridges'],
  },
  calves: {
    full_gym: ['Calf Raise', 'Seated Calf Raise', 'Leg Press Calf Raise'],
    barbell_rack: ['Standing Calf Raise', 'Seated Calf Raise'],
    dumbbells_only: ['Dumbbell Calf Raise', 'Single-Leg Calf Raise'],
    bodyweight: ['Calf Raises', 'Single-Leg Calf Raise', 'Jump Rope'],
    any: ['Calf Raise'],
  },
  core: {
    full_gym: ['Plank Hold', 'Cable Crunches', 'Hanging Leg Raises', 'Ab Wheel Rollouts'],
    barbell_rack: ['Plank Hold', 'Hanging Leg Raises', 'Barbell Rollouts'],
    dumbbells_only: ['Plank Hold', 'Russian Twists', 'Dumbbell Side Bends'],
    bodyweight: ['Plank Hold', 'Crunches', 'Bicycle Crunches', 'Leg Raises', 'Mountain Climbers'],
    any: ['Plank Hold', 'Crunches', 'Leg Raises'],
  },
};

const pickExercises = (
  muscle: MuscleFocus,
  equipment: Equipment,
  count: number,
  experience: Experience
): string[] => {
  const pool = exerciseLibrary[muscle][equipment] || exerciseLibrary[muscle].any || [];
  // Advanced users get more variety — shuffle slightly
  const limit = experience === 'beginner' ? Math.min(count, 2) : count;
  return pool.slice(0, limit);
};

const makeExercise = (dayPrefix: string, idx: number, name: string, setsReps: string): Exercise => ({
  id: `${dayPrefix}-${idx + 1}-${Date.now() + idx}`,
  name,
  setsReps,
  weight: null,
});

// ── DAYS OF WEEK ──────────────────────────────────────────────────────────────
const ALL_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const SHORT_DAYS: Record<string, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu',
  friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
};

// Assign workout vs rest days based on trainingDays and template
// PPL always keeps Sunday as rest: Mon-Sat workout (or Mon-Wed + Fri-Sat for 5d), Sunday Rest
const getWorkoutDayPattern = (trainingDays: number, template?: TemplateName): boolean[] => {
  if (template === 'push_pull_legs') {
    if (trainingDays >= 6) {
      return [true, true, true, true, true, true, false];
    }
    if (trainingDays === 5) {
      return [true, true, true, false, true, true, false];
    }
    if (trainingDays <= 3) {
      return [true, false, true, false, true, false, false];
    }
    return [true, true, false, true, true, false, false];
  }
  // true = workout, false = rest
  const patterns: Record<number, boolean[]> = {
    2: [true, false, false, true, false, false, false],
    3: [true, false, true, false, true, false, false],
    4: [true, true, false, true, true, false, false],
    5: [true, true, false, true, true, true, false],
    6: [true, true, true, true, true, true, false],
    7: [true, true, true, true, true, true, true],
  };
  return patterns[trainingDays] || patterns[4];
};

// ── Template-specific session factories ──────────────────────────────────────

const makeFullBodySession = (
  dayPrefix: string,
  prefs: OnboardingPreferences,
  sessionIndex: number,
): { title: string; subtitle: string; exercises: Exercise[] } => {
  const { sets, reps } = getScheme(prefs.goal, prefs.experience);
  const sr = makeSetsReps(sets, reps);
  const exCount = prefs.experience === 'beginner' ? 3 : prefs.experience === 'advanced' ? 5 : 4;

  const sessions = [
    {
      title: 'Full Body A',
      subtitle: 'Squat Pattern Focus',
      muscles: ['quads', 'back', 'chest', 'core'] as MuscleFocus[],
    },
    {
      title: 'Full Body B',
      subtitle: 'Hip Hinge Pattern Focus',
      muscles: ['hamstrings', 'back', 'shoulders', 'core'] as MuscleFocus[],
    },
    {
      title: 'Full Body C',
      subtitle: 'Upper + Lower Balance',
      muscles: ['chest', 'legs', 'arms', 'core'] as MuscleFocus[],
    },
  ];

  const session = sessions[sessionIndex % sessions.length];
  const exercises: Exercise[] = [];
  let idx = 0;

  for (const muscle of session.muscles) {
    const names = pickExercises(muscle, prefs.equipment, Math.ceil(exCount / session.muscles.length), prefs.experience);
    for (const name of names) {
      exercises.push(makeExercise(dayPrefix, idx++, name, sr));
    }
  }

  return { title: session.title, subtitle: session.subtitle, exercises: exercises.slice(0, exCount + 1) };
};

const makeUpperSession = (
  dayPrefix: string,
  prefs: OnboardingPreferences,
  label: 'A' | 'B',
): { title: string; subtitle: string; exercises: Exercise[] } => {
  const { sets, reps } = getScheme(prefs.goal, prefs.experience);
  const sr = makeSetsReps(sets, reps);
  const exCount = prefs.experience === 'beginner' ? 4 : prefs.experience === 'advanced' ? 6 : 5;

  const muscles: MuscleFocus[] = label === 'A'
    ? ['chest', 'back', 'shoulders', 'arms']
    : ['back', 'chest', 'arms', 'shoulders'];

  const exercises: Exercise[] = [];
  let idx = 0;
  for (const m of muscles) {
    const names = pickExercises(m, prefs.equipment, Math.ceil(exCount / muscles.length), prefs.experience);
    for (const name of names) {
      exercises.push(makeExercise(dayPrefix, idx++, name, sr));
    }
  }

  return {
    title: `Upper Body ${label}`,
    subtitle: 'Chest · Back · Shoulders · Arms',
    exercises: exercises.slice(0, exCount),
  };
};

const makeLowerSession = (
  dayPrefix: string,
  prefs: OnboardingPreferences,
  label: 'A' | 'B',
): { title: string; subtitle: string; exercises: Exercise[] } => {
  const { sets, reps } = getScheme(prefs.goal, prefs.experience);
  const sr = makeSetsReps(sets, reps);
  const exCount = prefs.experience === 'beginner' ? 4 : prefs.experience === 'advanced' ? 6 : 5;

  const muscles: MuscleFocus[] = label === 'A'
    ? ['quads', 'hamstrings', 'glutes', 'calves', 'core']
    : ['hamstrings', 'quads', 'calves', 'glutes', 'core'];

  const exercises: Exercise[] = [];
  let idx = 0;
  for (const m of muscles) {
    const names = pickExercises(m, prefs.equipment, Math.ceil(exCount / muscles.length), prefs.experience);
    for (const name of names) {
      exercises.push(makeExercise(dayPrefix, idx++, name, sr));
    }
  }

  return {
    title: `Lower Body ${label}`,
    subtitle: 'Quads · Hamstrings · Glutes · Calves',
    exercises: exercises.slice(0, exCount),
  };
};

const makePushSession = (dayPrefix: string, prefs: OnboardingPreferences): { title: string; subtitle: string; exercises: Exercise[] } => {
  const { sets, reps } = getScheme(prefs.goal, prefs.experience);
  const sr = makeSetsReps(sets, reps);
  const exCount = prefs.experience === 'beginner' ? 4 : 5;
  const muscles: MuscleFocus[] = ['chest', 'shoulders', 'arms'];
  const exercises: Exercise[] = [];
  let idx = 0;
  for (const m of muscles) {
    const names = pickExercises(m, prefs.equipment, Math.ceil(exCount / muscles.length), prefs.experience);
    for (const name of names) exercises.push(makeExercise(dayPrefix, idx++, name, sr));
  }
  // Filter out pull exercises that may bleed in from 'arms'
  return { title: 'Push Day', subtitle: 'Chest · Shoulders · Triceps', exercises: exercises.slice(0, exCount) };
};

const makePullSession = (dayPrefix: string, prefs: OnboardingPreferences): { title: string; subtitle: string; exercises: Exercise[] } => {
  const { sets, reps } = getScheme(prefs.goal, prefs.experience);
  const sr = makeSetsReps(sets, reps);
  const exCount = prefs.experience === 'beginner' ? 4 : 5;
  const muscles: MuscleFocus[] = ['back', 'arms'];
  const exercises: Exercise[] = [];
  let idx = 0;
  for (const m of muscles) {
    const names = pickExercises(m, prefs.equipment, Math.ceil(exCount / muscles.length) + 1, prefs.experience);
    for (const name of names) exercises.push(makeExercise(dayPrefix, idx++, name, sr));
  }
  return { title: 'Pull Day', subtitle: 'Back · Biceps · Rear Delts', exercises: exercises.slice(0, exCount) };
};

const makeLegsSession = (dayPrefix: string, prefs: OnboardingPreferences): { title: string; subtitle: string; exercises: Exercise[] } => {
  const { sets, reps } = getScheme(prefs.goal, prefs.experience);
  const sr = makeSetsReps(sets, reps);
  const exCount = prefs.experience === 'beginner' ? 4 : 6;
  const muscles: MuscleFocus[] = ['quads', 'hamstrings', 'glutes', 'calves'];
  const exercises: Exercise[] = [];
  let idx = 0;
  for (const m of muscles) {
    const names = pickExercises(m, prefs.equipment, Math.ceil(exCount / muscles.length), prefs.experience);
    for (const name of names) exercises.push(makeExercise(dayPrefix, idx++, name, sr));
  }
  return { title: 'Legs Day', subtitle: 'Quads · Hamstrings · Glutes · Calves', exercises: exercises.slice(0, exCount) };
};

// ── Bro Split sessions ─────────────────────────────────────────────────────────
const makeBroSession = (
  dayPrefix: string,
  prefs: OnboardingPreferences,
  focus: 'chest' | 'back' | 'shoulders' | 'arms' | 'legs',
): { title: string; subtitle: string; exercises: Exercise[] } => {
  const { sets, reps } = getScheme(prefs.goal, prefs.experience);
  const sr = makeSetsReps(sets, reps);
  const exCount = prefs.experience === 'beginner' ? 4 : prefs.experience === 'advanced' ? 6 : 5;

  const mapping: Record<string, { title: string; subtitle: string; muscles: MuscleFocus[] }> = {
    chest: { title: 'Chest Day', subtitle: 'Chest & Triceps', muscles: ['chest', 'arms'] },
    back: { title: 'Back Day', subtitle: 'Back & Biceps', muscles: ['back', 'arms'] },
    shoulders: { title: 'Shoulder Day', subtitle: 'Shoulders & Traps', muscles: ['shoulders', 'arms'] },
    arms: { title: 'Arms Day', subtitle: 'Biceps & Triceps', muscles: ['arms', 'core'] },
    legs: { title: 'Legs Day', subtitle: 'Quads · Hamstrings · Glutes', muscles: ['quads', 'hamstrings', 'glutes', 'calves'] },
  };

  const session = mapping[focus];
  const exercises: Exercise[] = [];
  let idx = 0;
  for (const m of session.muscles) {
    const names = pickExercises(m, prefs.equipment, Math.ceil(exCount / session.muscles.length), prefs.experience);
    for (const name of names) exercises.push(makeExercise(dayPrefix, idx++, name, sr));
  }

  return { title: session.title, subtitle: session.subtitle, exercises: exercises.slice(0, exCount) };
};

const REST_DAY: { title: string; subtitle: string; exercises: Exercise[] } = {
  title: 'Rest Day',
  subtitle: 'Recovery & Relaxation',
  exercises: [],
};

// ── Main plan generator ────────────────────────────────────────────────────────
export const generateWorkoutPlan = (prefs: OnboardingPreferences): DaySchedule[] => {
  const template = prefs.selected_template || selectBestTemplate(prefs);
  const workPattern = getWorkoutDayPattern(prefs.training_days, template);

  const plan: DaySchedule[] = ALL_DAYS.map((day, dayIndex) => {
    const isWorkoutDay = workPattern[dayIndex];
    const prefix = day.slice(0, 3);

    if (!isWorkoutDay) {
      return {
        day,
        shortDay: SHORT_DAYS[day],
        ...REST_DAY,
      };
    }

    // Count which workout-day number this is (1-indexed)
    const workoutDayNumber = workPattern.slice(0, dayIndex + 1).filter(Boolean).length;

    let session: { title: string; subtitle: string; exercises: Exercise[] };

    if (template === 'full_body') {
      session = makeFullBodySession(prefix, prefs, workoutDayNumber - 1);
    } else if (template === 'upper_lower') {
      session = workoutDayNumber % 2 !== 0
        ? makeUpperSession(prefix, prefs, workoutDayNumber <= 2 ? 'A' : 'B')
        : makeLowerSession(prefix, prefs, workoutDayNumber <= 2 ? 'A' : 'B');
    } else if (template === 'push_pull_legs') {
      const cycle = (workoutDayNumber - 1) % 3;
      if (cycle === 0) session = makePushSession(prefix, prefs);
      else if (cycle === 1) session = makePullSession(prefix, prefs);
      else session = makeLegsSession(prefix, prefs);
    } else {
      // bro_split
      const focuses: Array<'chest' | 'back' | 'shoulders' | 'arms' | 'legs'> = ['chest', 'back', 'shoulders', 'arms', 'legs'];
      const focus = focuses[(workoutDayNumber - 1) % focuses.length];
      session = makeBroSession(prefix, prefs, focus);
    }

    return {
      day,
      shortDay: SHORT_DAYS[day],
      title: session.title,
      subtitle: session.subtitle,
      exercises: session.exercises,
    };
  });

  return plan;
};

// ── Template selection logic ──────────────────────────────────────────────────
const selectBestTemplate = (prefs: OnboardingPreferences): TemplateName => {
  const { training_days, experience } = prefs;
  if (training_days <= 3) return 'full_body';
  if (training_days === 4) return experience === 'advanced' ? 'bro_split' : 'upper_lower';
  if (training_days === 5) return experience === 'beginner' ? 'upper_lower' : 'push_pull_legs';
  return experience === 'beginner' ? 'push_pull_legs' : 'bro_split';
};

// ── Template recommendations (with reasons) ──────────────────────────────────
export const getTemplateRecommendations = (prefs: OnboardingPreferences): TemplateRecommendation[] => {
  const best = selectBestTemplate(prefs);
  const { training_days, experience, goal } = prefs;

  const expLabel = experience === 'beginner' ? 'beginner' : experience === 'intermediate' ? 'intermediate' : 'advanced';
  const goalLabel = goal === 'build_muscle' ? 'building muscle' : goal === 'lose_fat' ? 'fat loss' : goal === 'strength' ? 'strength' : goal === 'endurance' ? 'endurance' : 'general fitness';

  const templates: TemplateRecommendation[] = [
    {
      template: 'full_body',
      label: 'Full Body',
      description: 'Train every major muscle group in each session. Ideal for beginners or those with limited time.',
      trainingDays: Math.min(prefs.training_days, 3),
      isRecommended: best === 'full_body',
      reason: best === 'full_body'
        ? `⭐ Full Body is recommended for you because you train ${training_days}×/week, you're a ${expLabel}, and your goal is ${goalLabel}.`
        : `Full Body works best for 2–3 days/week. Your ${training_days} training days could support a more advanced split.`,
      schedule: [
        { day: 'Mon', type: 'workout', label: 'Full Body A' },
        { day: 'Tue', type: 'rest', label: 'Rest' },
        { day: 'Wed', type: 'workout', label: 'Full Body B' },
        { day: 'Thu', type: 'rest', label: 'Rest' },
        { day: 'Fri', type: 'workout', label: 'Full Body C' },
        { day: 'Sat', type: 'rest', label: 'Rest' },
        { day: 'Sun', type: 'rest', label: 'Rest' },
      ],
    },
    {
      template: 'upper_lower',
      label: 'Upper / Lower',
      description: 'Alternate between upper body and lower body sessions. Great balance of volume and recovery.',
      trainingDays: 4,
      isRecommended: best === 'upper_lower',
      reason: best === 'upper_lower'
        ? `⭐ Upper/Lower is recommended for you because you train ${training_days}×/week, you're a ${expLabel}, and your goal is ${goalLabel}.`
        : `Upper/Lower is perfect for 4 days/week. ${training_days < 4 ? 'You may not have enough days.' : 'Works well with your schedule.'}`,
      schedule: [
        { day: 'Mon', type: 'workout', label: 'Upper A' },
        { day: 'Tue', type: 'workout', label: 'Lower A' },
        { day: 'Wed', type: 'rest', label: 'Rest' },
        { day: 'Thu', type: 'workout', label: 'Upper B' },
        { day: 'Fri', type: 'workout', label: 'Lower B' },
        { day: 'Sat', type: 'rest', label: 'Rest' },
        { day: 'Sun', type: 'rest', label: 'Rest' },
      ],
    },
    {
      template: 'push_pull_legs',
      label: 'Push / Pull / Legs',
      description: 'Group muscles by movement pattern. High volume per muscle, ideal for intermediate to advanced lifters.',
      trainingDays: 6,
      isRecommended: best === 'push_pull_legs',
      reason: best === 'push_pull_legs'
        ? `⭐ PPL is recommended for you because you train ${training_days}×/week, you're a ${expLabel}, and your goal is ${goalLabel}.`
        : training_days < 5
          ? `PPL shines with 5–6 training days. With ${training_days} days you may not recover adequately.`
          : `PPL suits your ${training_days} training days well.`,
      schedule: [
        { day: 'Mon', type: 'workout', label: 'Push' },
        { day: 'Tue', type: 'workout', label: 'Pull' },
        { day: 'Wed', type: 'workout', label: 'Legs' },
        { day: 'Thu', type: 'workout', label: 'Push' },
        { day: 'Fri', type: 'workout', label: 'Pull' },
        { day: 'Sat', type: 'workout', label: 'Legs' },
        { day: 'Sun', type: 'rest', label: 'Rest' },
      ],
    },
    {
      template: 'bro_split',
      label: 'Bro Split',
      description: 'One muscle group per session: chest, back, shoulders, arms, legs. Classic bodybuilding approach.',
      trainingDays: 5,
      isRecommended: best === 'bro_split',
      reason: best === 'bro_split'
        ? `⭐ Bro Split is recommended for you because you train ${training_days}×/week, you're a ${expLabel}, and your goal is ${goalLabel}.`
        : experience === 'beginner'
          ? 'Bro Split gives each muscle only 1 session/week — not optimal for beginners who benefit from more frequency.'
          : `Works well for dedicated bodybuilding with ${training_days} days.`,
      schedule: [
        { day: 'Mon', type: 'workout', label: 'Chest' },
        { day: 'Tue', type: 'workout', label: 'Back' },
        { day: 'Wed', type: 'workout', label: 'Shoulders' },
        { day: 'Thu', type: 'workout', label: 'Arms' },
        { day: 'Fri', type: 'workout', label: 'Legs' },
        { day: 'Sat', type: 'rest', label: 'Rest' },
        { day: 'Sun', type: 'rest', label: 'Rest' },
      ],
    },
  ];

  // Sort: recommended first
  return templates.sort((a, b) => (b.isRecommended ? 1 : 0) - (a.isRecommended ? 1 : 0));
};
