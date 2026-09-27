export type ExerciseCategory = 'bodyweight' | 'equipment';
export type MuscleGroup = 'Chest' | 'Back' | 'Legs' | 'Shoulders' | 'Arms' | 'Core';

export interface ExerciseTemplate {
  /** Unique identifier for the template */
  id: string;
  /** Display name of the exercise */
  name: string;
  /** Category: bodyweight or equipment */
  category: ExerciseCategory;
  /** Primary muscle group tag for filtering */
  muscleGroup: MuscleGroup;
  /** Specific primary muscle targeted */
  primaryMuscle: string;
  /** Secondary assisting muscles */
  secondaryMuscles: string[];
  /** Rank for that primary muscle (e.g. 1 = #1 ranked exercise, 2 = #2, etc.) */
  rank: number;
  /** Human-readable badge text describing rank */
  rankLabel: string;
  /** Step-by-step instructions on how to perform the exercise */
  howToPerform: string[];
  /** Image URL or local asset path */
  image: string;
  /** Default recommended sets */
  defaultSets: number;
  /** Default recommended reps */
  defaultReps: string;
  /** Default recommended starting weight in kg (null for bodyweight) */
  defaultWeightKg: number | null;
  /** Optional coach tips / cues */
  tips?: string;
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * HOW TO ADD NEW EXERCISE TEMPLATES IN THE FUTURE:
 * ─────────────────────────────────────────────────────────────────────────────
 * Simply add a new object to this array with:
 *   - id: Unique slug (e.g., 'cable-flyes')
 *   - name: Display name (e.g., 'Low-to-High Cable Flyes')
 *   - category: 'bodyweight' | 'equipment'
 *   - muscleGroup: 'Chest' | 'Back' | 'Legs' | 'Shoulders' | 'Arms' | 'Core'
 *   - primaryMuscle: Which primary muscle it targets
 *   - secondaryMuscles: Array of secondary muscles targeted
 *   - rank: 1 for #1 exercise, 2 for #2, etc.
 *   - rankLabel: e.g. '#1 Exercise for Upper Chest Peak'
 *   - howToPerform: Array of step-by-step instruction lines
 *   - image: Image URL or local asset path
 *   - defaultSets: Number of sets (e.g. 3 or 4)
 *   - defaultReps: Target reps (e.g. '8-10', '10-12')
 *   - defaultWeightKg: Starting weight in kg, or null for bodyweight
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const EXERCISE_TEMPLATES: ExerciseTemplate[] = [
  // ── GYM EQUIPMENT: CHEST ──────────────────────────────────────────────────
  {
    id: 'barbell-bench-press',
    name: 'Barbell Bench Press',
    category: 'equipment',
    muscleGroup: 'Chest',
    primaryMuscle: 'Chest (Mid & Lower Pectoralis Major)',
    secondaryMuscles: ['Triceps Brachii', 'Anterior Deltoids'],
    rank: 1,
    rankLabel: '#1 Exercise for Overall Chest Mass & Raw Power',
    howToPerform: [
      'Lie flat on the bench with eyes directly under the racked barbell.',
      'Grip the bar slightly wider than shoulder-width, plant feet flat on the floor, and retract your shoulder blades.',
      'Unrack the bar and lower it under control to the middle of your chest while tucking elbows at ~45-70°.',
      'Press the bar explosively back to lockout over your chest without bouncing off your ribs.',
    ],
    image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=800&q=80',
    defaultSets: 4,
    defaultReps: '8-10',
    defaultWeightKg: 60,
    tips: 'Keep your shoulder blades pinched together throughout the entire rep to protect your rotators.',
  },
  {
    id: 'incline-dumbbell-press',
    name: 'Incline Dumbbell Press',
    category: 'equipment',
    muscleGroup: 'Chest',
    primaryMuscle: 'Upper Chest (Clavicular Head)',
    secondaryMuscles: ['Front Deltoids', 'Triceps Brachii'],
    rank: 2,
    rankLabel: '#2 Exercise for Upper Chest Peak & Fullness',
    howToPerform: [
      'Set an adjustable bench to a 30° to 45° incline.',
      'Sit down and kick the dumbbells up to shoulder level as you lean back.',
      'Press dumbbells upward until arms are extended, squeezing your upper chest at the top.',
      'Lower weights under control until your elbows reach just below 90° for a deep stretch.',
    ],
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
    defaultSets: 3,
    defaultReps: '10-12',
    defaultWeightKg: 22,
    tips: 'Avoid setting the incline too high (above 45°) to prevent shifting tension to your shoulders.',
  },

  // ── GYM EQUIPMENT: BACK ───────────────────────────────────────────────────
  {
    id: 'barbell-deadlift',
    name: 'Conventional Barbell Deadlift',
    category: 'equipment',
    muscleGroup: 'Back',
    primaryMuscle: 'Full Back & Posterior Chain (Erector Spinae & Lats)',
    secondaryMuscles: ['Hamstrings', 'Glutes', 'Trapezius', 'Forearms'],
    rank: 1,
    rankLabel: '#1 Exercise for Total Posterior Thickness & Strength',
    howToPerform: [
      'Stand with feet hip-width apart, the bar over mid-foot about one inch from your shins.',
      'Hinge at hips to grip the bar outside your legs with hands just outside your shins.',
      'Drop hips until shins touch the bar, pull chest up, flatten your back, and brace your core.',
      'Drive the floor away through your heels to stand tall, locking hips and knees together.',
      'Hinge backward to lower bar back to the floor under control.',
    ],
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
    defaultSets: 4,
    defaultReps: '5-6',
    defaultWeightKg: 80,
    tips: 'Do not hyperextend your lower back at lockout. Keep the barbell in constant contact with your body.',
  },
  {
    id: 'lat-pulldown-cable',
    name: 'Wide-Grip Lat Pulldown',
    category: 'equipment',
    muscleGroup: 'Back',
    primaryMuscle: 'Back (Latissimus Dorsi - Outer Wings)',
    secondaryMuscles: ['Biceps', 'Rhomboids', 'Rear Deltoids', 'Teres Major'],
    rank: 2,
    rankLabel: '#2 Exercise for V-Taper Back Width',
    howToPerform: [
      'Sit at the pulldown station with thighs secured snugly under the roller pads.',
      'Grip the wide bar with an overhand grip wider than your shoulders.',
      'Lean back slightly (~10-15°), retract shoulder blades, and pull the bar down to upper chest.',
      'Squeeze your lats hard at the bottom, then let the bar slowly return to full stretch overhead.',
    ],
    image: 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?auto=format&fit=crop&w=800&q=80',
    defaultSets: 3,
    defaultReps: '10-12',
    defaultWeightKg: 50,
    tips: 'Lead with your elbows pulling down towards your back pockets, not your forearms.',
  },

  // ── GYM EQUIPMENT: SHOULDERS ─────────────────────────────────────────────
  {
    id: 'overhead-barbell-press',
    name: 'Standing Overhead Press (OHP)',
    category: 'equipment',
    muscleGroup: 'Shoulders',
    primaryMuscle: 'Shoulders (Anterior & Lateral Deltoids)',
    secondaryMuscles: ['Triceps', 'Upper Pectorals', 'Core & Serratus'],
    rank: 1,
    rankLabel: '#1 Exercise for 3D Boulder Shoulders',
    howToPerform: [
      'Grip the bar slightly wider than shoulder-width with bar resting on upper chest/front delts.',
      'Brace glutes, core, and quads to create a rigid, stable torso.',
      'Press the bar straight upward, pulling head slightly back to clear chin, then pushing head through once bar passes forehead.',
      'Lock out overhead with bar centered over mid-foot, then lower under control.',
    ],
    image: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=800&q=80',
    defaultSets: 4,
    defaultReps: '8-10',
    defaultWeightKg: 40,
    tips: 'Keep your elbows slightly in front of the bar, not flared backwards.',
  },
  {
    id: 'dumbbell-lateral-raises',
    name: 'Dumbbell Lateral Raises',
    category: 'equipment',
    muscleGroup: 'Shoulders',
    primaryMuscle: 'Lateral Deltoids (Side Shoulders)',
    secondaryMuscles: ['Supraspinatus', 'Trapezius'],
    rank: 2,
    rankLabel: '#2 Exercise for Shoulder Capped Width',
    howToPerform: [
      'Stand holding dumbbells at your sides with a slight forward torso lean (~10°).',
      'Raise weights out to the sides in the scapular plane with elbows slightly bent.',
      'Lift until arms are parallel to the floor, leading with elbows.',
      'Pause for a split second, then lower under control over 2-3 seconds.',
    ],
    image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&q=80',
    defaultSets: 3,
    defaultReps: '12-15',
    defaultWeightKg: 10,
    tips: 'Use moderate weight and strict form. Shrugging with traps takes tension off the side delts.',
  },

  // ── GYM EQUIPMENT: LEGS ──────────────────────────────────────────────────
  {
    id: 'barbell-back-squat',
    name: 'Barbell Back Squats',
    category: 'equipment',
    muscleGroup: 'Legs',
    primaryMuscle: 'Quadriceps & Gluteus Maximus',
    secondaryMuscles: ['Hamstrings', 'Core & Erector Spinae', 'Adductors'],
    rank: 1,
    rankLabel: '#1 King of All Lower Body Exercises',
    howToPerform: [
      'Rest the bar across your upper back/traps, grip firmly, and unrack taking two steps back.',
      'Set feet shoulder-width apart with toes turned slightly outward (15-30°).',
      'Inhale deep, brace your core, and sit down between hips until hip crease is below knee level.',
      'Drive powerfully out of the hole through mid-foot to stand back up.',
    ],
    image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&q=80',
    defaultSets: 4,
    defaultReps: '8-10',
    defaultWeightKg: 70,
    tips: 'Keep knees tracking in line with toes and do not let your chest collapse forward.',
  },
  {
    id: 'romanian-deadlift',
    name: 'Romanian Deadlift (RDL)',
    category: 'equipment',
    muscleGroup: 'Legs',
    primaryMuscle: 'Hamstrings & Glutes',
    secondaryMuscles: ['Lower Back', 'Forearms', 'Core'],
    rank: 2,
    rankLabel: '#2 Exercise for Hamstring & Glute Hypertrophy',
    howToPerform: [
      'Hold a barbell at hip level with feet hip-width apart and knees soft with a slight bend.',
      'Push your hips backward towards the wall behind you while sliding the bar down your thighs.',
      'Lower bar to mid-shin level until you feel a deep stretch in hamstrings without rounding back.',
      'Drive hips forward and squeeze glutes to return to standing.',
    ],
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
    defaultSets: 3,
    defaultReps: '10-12',
    defaultWeightKg: 60,
    tips: 'This is a pure hip hinge, not a squat. Keep knees soft but fixed at the same bend angle.',
  },

  // ── GYM EQUIPMENT: ARMS ──────────────────────────────────────────────────
  {
    id: 'incline-dumbbell-curl',
    name: 'Incline Dumbbell Bicep Curls',
    category: 'equipment',
    muscleGroup: 'Arms',
    primaryMuscle: 'Biceps Brachii (Long Head / Peak)',
    secondaryMuscles: ['Brachialis', 'Brachioradialis'],
    rank: 1,
    rankLabel: '#1 Exercise for Maximum Bicep Peak Stretch',
    howToPerform: [
      'Set an adjustable bench to a 45° to 60° incline and sit back with dumbbells hanging straight down.',
      'Curl the weights upward while supinating wrists (palms facing up) without swinging shoulders.',
      'Squeeze biceps hard at peak contraction, then lower slowly over 3 seconds to full stretch.',
    ],
    image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=800&q=80',
    defaultSets: 3,
    defaultReps: '10-12',
    defaultWeightKg: 12,
    tips: 'The incline position stretches the long head of the bicep before it even begins to contract.',
  },
  {
    id: 'tricep-rope-pushdown',
    name: 'Tricep Rope Pushdowns',
    category: 'equipment',
    muscleGroup: 'Arms',
    primaryMuscle: 'Triceps Brachii (Lateral & Medial Heads)',
    secondaryMuscles: ['Anconeus'],
    rank: 2,
    rankLabel: '#2 Exercise for Tricep Horseshoe Sweep',
    howToPerform: [
      'Attach a rope to high pulley. Stand with a slight forward lean with elbows pinned at your sides.',
      'Push the rope downward by extending elbows until arms are completely locked out.',
      'Spread the ends of the rope apart at the bottom for an intense tricep contraction.',
      'Return under control to 90° elbow bend while keeping upper arms motionless.',
    ],
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
    defaultSets: 3,
    defaultReps: '12-15',
    defaultWeightKg: 25,
    tips: 'Do not let your elbows flare forward or swing back. Lock upper arms like a hinge.',
  },

  // ── BODYWEIGHT: CHEST ────────────────────────────────────────────────────
  {
    id: 'bw-push-ups',
    name: 'Deficit / Standard Push-ups',
    category: 'bodyweight',
    muscleGroup: 'Chest',
    primaryMuscle: 'Chest (Pectoralis Major)',
    secondaryMuscles: ['Triceps', 'Anterior Deltoids', 'Core & Serratus'],
    rank: 1,
    rankLabel: '#1 Bodyweight Movement for Chest Development',
    howToPerform: [
      'Start in a high plank position with hands slightly wider than shoulders and fingers spread.',
      'Keep body in a straight line from heels to crown with glutes and abs tight.',
      'Lower chest until it is 1 inch from the floor, keeping elbows at a 45° arrow angle.',
      'Press through full palms back up to full lockout, spreading shoulder blades apart at top.',
    ],
    image: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?auto=format&fit=crop&w=800&q=80',
    defaultSets: 3,
    defaultReps: '15-20',
    defaultWeightKg: null,
    tips: 'Elevate hands on push-up bars or books for a deeper chest stretch deficit.',
  },
  {
    id: 'bw-parallel-dips',
    name: 'Parallel Bar Dips',
    category: 'bodyweight',
    muscleGroup: 'Chest',
    primaryMuscle: 'Lower Chest & Triceps Brachii',
    secondaryMuscles: ['Front Deltoids', 'Core'],
    rank: 2,
    rankLabel: '#2 Bodyweight Calisthenic for Chest & Arm Power',
    howToPerform: [
      'Grip parallel bars and press up to support yourself with locked arms.',
      'Lean torso forward (~30°) to prioritize chest over pure triceps.',
      'Lower yourself until elbows reach 90° and you feel a comfortable chest stretch.',
      'Press firmly back up to full arm extension without bouncing.',
    ],
    image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=800&q=80',
    defaultSets: 3,
    defaultReps: '10-12',
    defaultWeightKg: null,
    tips: 'A forward torso lean shifts focus to pecs; keeping body upright shifts focus to triceps.',
  },

  // ── BODYWEIGHT: BACK ─────────────────────────────────────────────────────
  {
    id: 'bw-pull-ups',
    name: 'Wide-Grip Pull-ups',
    category: 'bodyweight',
    muscleGroup: 'Back',
    primaryMuscle: 'Back (Latissimus Dorsi)',
    secondaryMuscles: ['Biceps', 'Rhomboids', 'Forearms', 'Teres Major'],
    rank: 1,
    rankLabel: '#1 Bodyweight King for Back Width & Thickness',
    howToPerform: [
      'Hang from bar with an overhand grip wider than shoulders in a full dead hang.',
      'Depress shoulder blades down and back before bending your elbows.',
      'Pull yourself up until your chin clears the bar, driving elbows down to ribs.',
      'Lower yourself slowly back down to a controlled full dead hang.',
    ],
    image: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?auto=format&fit=crop&w=800&q=80',
    defaultSets: 4,
    defaultReps: '8-12',
    defaultWeightKg: null,
    tips: 'Avoid kipping or kicking legs. Pure strict lat pulling builds the best back.',
  },
  {
    id: 'bw-chin-ups',
    name: 'Underhand Chin-ups',
    category: 'bodyweight',
    muscleGroup: 'Back',
    primaryMuscle: 'Back (Lats) & Biceps Brachii',
    secondaryMuscles: ['Forearms', 'Lower Traps', 'Abs'],
    rank: 2,
    rankLabel: '#2 Compound for Arm Mass & Mid-Back',
    howToPerform: [
      'Hang from bar with an underhand (palms facing you) shoulder-width grip.',
      'Pull your chest up toward the bar, leading with your upper chest.',
      'Squeeze biceps and lats at the top as your chin passes the bar.',
      'Lower under complete control back to full extension.',
    ],
    image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=800&q=80',
    defaultSets: 3,
    defaultReps: '8-10',
    defaultWeightKg: null,
    tips: 'Underhand grip provides supreme mechanical leverage for heavier bicep recruitment.',
  },

  // ── BODYWEIGHT: LEGS ─────────────────────────────────────────────────────
  {
    id: 'bw-bulgarian-split-squat',
    name: 'Bulgarian Split Squats (Bodyweight)',
    category: 'bodyweight',
    muscleGroup: 'Legs',
    primaryMuscle: 'Quadriceps & Gluteus Maximus',
    secondaryMuscles: ['Hamstrings', 'Calves', 'Core & Balance Stabilizers'],
    rank: 1,
    rankLabel: '#1 Single-Leg Mass & Strength Builder',
    howToPerform: [
      'Stand 2 feet in front of a bench or chair and place top of rear foot on it.',
      'Keep chest tall and lower front hip until front thigh is parallel to the ground.',
      'Front knee should stay stacked above mid-foot, not collapsing inward.',
      'Drive through front heel to return to starting position.',
    ],
    image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&q=80',
    defaultSets: 3,
    defaultReps: '12-15 each',
    defaultWeightKg: null,
    tips: 'Lean torso slightly forward at a 15° angle to target glutes, or stay completely upright for quad focus.',
  },
  {
    id: 'bw-pistol-squat',
    name: 'Single-Leg Pistol Squats',
    category: 'bodyweight',
    muscleGroup: 'Legs',
    primaryMuscle: 'Quadriceps & Hip Flexors',
    secondaryMuscles: ['Glutes', 'Ankles', 'Core Balance'],
    rank: 2,
    rankLabel: '#2 Pinnacle Calisthenic Leg Strength Movement',
    howToPerform: [
      'Stand on one leg with other leg extended straight out in front of you.',
      'Extend arms forward for balance, take a breath, and descend smoothly on standing leg.',
      'Squat down until hamstring touches calf while keeping extended leg off the floor.',
      'Drive powerfully through mid-foot and heel to return to full standing lockout.',
    ],
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
    defaultSets: 3,
    defaultReps: '6-8 each',
    defaultWeightKg: null,
    tips: 'Use a pole or TRX strap for assistance if working on balance and bottom mobility.',
  },

  // ── BODYWEIGHT: CORE ─────────────────────────────────────────────────────
  {
    id: 'bw-hanging-leg-raises',
    name: 'Hanging Leg / Knee Raises',
    category: 'bodyweight',
    muscleGroup: 'Core',
    primaryMuscle: 'Lower Rectus Abdominis & Hip Flexors',
    secondaryMuscles: ['Obliques', 'Forearm Grip', 'Lats'],
    rank: 1,
    rankLabel: '#1 Exercise for Lower Ab Definition & Core Compression',
    howToPerform: [
      'Hang from pull-up bar with arms fully extended and body still.',
      'Without swinging, curl your pelvis upward and lift toes up to bar level (or knees to chest).',
      'Pause for 1 second at top contraction with abs tightly flexed.',
      'Lower legs back down slowly over 3 seconds without letting body swing.',
    ],
    image: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?auto=format&fit=crop&w=800&q=80',
    defaultSets: 3,
    defaultReps: '12-15',
    defaultWeightKg: null,
    tips: 'The key is curling the pelvis upward toward your ribs, not just raising the thighs.',
  },
  {
    id: 'bw-rkc-plank',
    name: 'Hardstyle RKC Plank Hold',
    category: 'bodyweight',
    muscleGroup: 'Core',
    primaryMuscle: 'Deep Core (Transverse Abdominis & Rectus Abdominis)',
    secondaryMuscles: ['Glutes', 'Shoulders', 'Quads'],
    rank: 2,
    rankLabel: '#2 Isometric Core Anti-Extension Stability',
    howToPerform: [
      'Place forearms on the ground with elbows under shoulders and hands in fists.',
      'Form a straight line from heels to head with pelvis slightly tucked (posterior pelvic tilt).',
      'Actively squeeze glutes, pull elbows down towards toes, and pull toes toward elbows.',
      'Breathe deeply while maintaining 100% maximal tension throughout entire body.',
    ],
    image: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=800&q=80',
    defaultSets: 3,
    defaultReps: '30-45s',
    defaultWeightKg: null,
    tips: 'A true RKC plank is about maximal tension; 30 seconds should feel harder than 2 minutes of passive planking.',
  },
];
