import React, { useState, useEffect } from 'react';
import {
  Dumbbell,
  LayoutGrid,
  Headphones,
  Zap,
  Calendar,
  CalendarDays,
  TableProperties,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle2,
  Play,
  Weight,
  PlusCircle,
  Youtube,
  Instagram,
  Image,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'yodha_tutorial_v1_done';

interface TutorialStep {
  icon: React.ReactNode;
  accentColor: string;
  tag: string;
  title: string;
  description: string;
  bullets?: string[];
  tip?: string;
}

const STEPS: TutorialStep[] = [
  {
    icon: <Sparkles className="w-10 h-10" />,
    accentColor: 'from-orange-500 to-amber-500',
    tag: 'Welcome',
    title: "You're in, Warrior! 🎉",
    description:
      "Your personalized workout plan is ready. Let's take a 60-second tour so you know exactly how to get the most out of Yodha Mode.",
    tip: 'You can replay this tutorial anytime from your Profile settings.',
  },
  {
    icon: <Dumbbell className="w-10 h-10" />,
    accentColor: 'from-orange-500 to-red-500',
    tag: 'Today Tab',
    title: 'Log Your Daily Workout',
    description:
      "The Today tab shows today's exercises. Tap each exercise to expand it, then tap a set to mark it done. Your progress ring updates in real time.",
    bullets: [
      'Tap any exercise to expand sets & reps',
      'Check off each set as you complete it',
      'Progress circle fills up as you go',
      'Rest timer auto-starts after each set',
    ],
  },
  {
    icon: <LayoutGrid className="w-10 h-10" />,
    accentColor: 'from-violet-500 to-purple-600',
    tag: 'Weekly Tab',
    title: 'Edit Exercises & Set Weights',
    description:
      'Go to the Weekly tab to fully customize your plan. You can add new exercises to any day, set your target weight & reps, and reorder or delete movements.',
    bullets: [
      'Tap + Add Exercise on any day',
      'Set weight (kg/lbs), sets & reps per exercise',
      'Drag to reorder exercises in a day',
      'Delete or swap exercises anytime',
    ],
    tip: 'Changes save instantly — no need to press save.',
  },
  {
    icon: <TableProperties className="w-10 h-10" />,
    accentColor: 'from-blue-500 to-cyan-500',
    tag: 'Weekly Tab → Spreadsheet',
    title: 'Power Edit with Spreadsheet View',
    description:
      'Inside the Weekly tab there\'s a Spreadsheet button. This gives you a full table view of the whole week — edit all your exercises, weights, and reps in one shot.',
    bullets: [
      'See every exercise across all 7 days at once',
      'Inline edit weight, sets and reps per cell',
      'Fastest way to bulk-update your plan',
    ],
    tip: 'Great for programming your next training block in minutes.',
  },
  {
    icon: <Headphones className="w-10 h-10" />,
    accentColor: 'from-green-500 to-emerald-600',
    tag: 'Music Tab',
    title: 'Add Your Pump-Up Playlist',
    description:
      'The Music tab lets you build your ultimate workout playlist. Search for tracks, add from presets, or paste a YouTube/Spotify link to queue it up.',
    bullets: [
      'Browse curated gym music presets',
      'Paste any YouTube link to add a track',
      'Mini player stays visible while you train',
      'Plays in background as you log sets',
    ],
  },
  {
    icon: <Zap className="w-10 h-10" />,
    accentColor: 'from-yellow-500 to-orange-500',
    tag: 'Fuel Tab',
    title: 'Stay Fired Up with Motivational Videos',
    description:
      'The Fuel tab is your motivational video library. Add videos from YouTube, Instagram Reels, or your phone gallery and watch them before or during your session.',
    bullets: [
      'Paste a YouTube or Instagram Reels link',
      'Upload clips directly from your gallery',
      'Build a personal hype reel',
      'More sources coming soon (TikTok, X)',
    ],
    tip: '🔥 Pro tip: watch a 60-second hype clip before your heaviest set.',
  },
  {
    icon: <CalendarDays className="w-10 h-10" />,
    accentColor: 'from-pink-500 to-rose-600',
    tag: 'Calendar Tab',
    title: 'Track Your Progress Over Time',
    description:
      'The Calendar shows your entire workout history. Colored days mean you trained — the brighter the color, the more complete the session.',
    bullets: [
      '🟠 Full ring = 100% workout completed',
      '🟡 Partial ring = started but not finished',
      'Browse previous months with ← → arrows',
    ],
    tip: 'Tap any day on the calendar to see a detailed breakdown.',
  },
  {
    icon: <CalendarDays className="w-10 h-10" />,
    accentColor: 'from-teal-500 to-cyan-600',
    tag: 'Calendar → Day View',
    title: 'Two Ways to See Your History',
    description:
      "Tap any calendar day to open it. You'll see two views of your workout for that day:",
    bullets: [
      '📋 Exercise Log — every exercise, set & weight you lifted',
      '📊 Spreadsheet View — full table of all sets & reps completed',
      'Compare planned vs actual lifts side by side',
      'Great for tracking progressive overload week to week',
    ],
    tip: 'Use the Day View to decide if it\'s time to increase your weight next session.',
  },
];

interface AppTutorialProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppTutorial: React.FC<AppTutorialProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(0);
  const [animDir, setAnimDir] = useState<'next' | 'prev'>('next');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep(0);
      // slight delay so opacity transition fires
      setTimeout(() => setVisible(true), 10);
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const current = STEPS[step];
  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;

  const goNext = () => {
    if (isLast) { handleClose(); return; }
    setAnimDir('next');
    setStep(s => s + 1);
  };

  const goPrev = () => {
    if (isFirst) return;
    setAnimDir('prev');
    setStep(s => s - 1);
  };

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setVisible(false);
    setTimeout(onClose, 250);
  };

  return (
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center p-4 transition-all duration-300 ${
        visible ? 'bg-black/70 backdrop-blur-sm' : 'bg-black/0'
      }`}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div
        className={`relative w-full max-w-md bg-card border border-border/70 rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 ${
          visible ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
        }`}
      >
        {/* ── Gradient accent top bar ────────────────────────────────────────── */}
        <div className={`h-1.5 w-full bg-gradient-to-r ${current.accentColor}`} />

        {/* ── Skip button ────────────────────────────────────────────────────── */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors z-10"
          title="Skip tutorial"
        >
          <X className="w-4 h-4" />
        </button>

        {/* ── Icon hero ──────────────────────────────────────────────────────── */}
        <div className={`flex items-center justify-center py-8 bg-gradient-to-b ${current.accentColor} opacity-90`}>
          <div className="p-5 rounded-2xl bg-white/15 text-white shadow-xl">
            {current.icon}
          </div>
        </div>

        {/* ── Content ────────────────────────────────────────────────────────── */}
        <div className="px-6 pt-5 pb-6 space-y-4">
          {/* Tag + Title */}
          <div className="space-y-1">
            <span className={`inline-block text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-gradient-to-r ${current.accentColor} text-white`}>
              {current.tag}
            </span>
            <h2 className="text-xl font-black text-foreground leading-tight">{current.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{current.description}</p>
          </div>

          {/* Bullet points */}
          {current.bullets && (
            <ul className="space-y-2">
              {current.bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-foreground/85">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Tip callout */}
          {current.tip && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-primary/10 border border-primary/20">
              <Sparkles className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-primary/90 font-medium leading-relaxed">{current.tip}</p>
            </div>
          )}
        </div>

        {/* ── Footer: Progress dots + Nav buttons ────────────────────────────── */}
        <div className="px-6 pb-6 flex items-center justify-between gap-3">
          {/* Step dots */}
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => { setAnimDir(i > step ? 'next' : 'prev'); setStep(i); }}
                className={`rounded-full transition-all duration-300 ${
                  i === step
                    ? `w-5 h-2 bg-gradient-to-r ${current.accentColor}`
                    : i < step
                    ? 'w-2 h-2 bg-primary/50'
                    : 'w-2 h-2 bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-2">
            {!isFirst && (
              <Button
                variant="ghost"
                size="sm"
                onClick={goPrev}
                className="text-xs text-muted-foreground hover:text-foreground rounded-xl gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Back
              </Button>
            )}

            <Button
              size="sm"
              onClick={goNext}
              className={`text-xs font-bold rounded-xl px-4 gap-1.5 bg-gradient-to-r ${current.accentColor} text-white border-0 shadow-lg hover:opacity-90 transition-opacity`}
            >
              {isLast ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Let's Go!
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="w-3.5 h-3.5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

/** Returns true if the user has NOT yet seen the tutorial */
export function shouldShowTutorial(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== 'true';
}

/** Call this to programmatically reset the tutorial (e.g. from Profile) */
export function resetTutorial(): void {
  localStorage.removeItem(STORAGE_KEY);
}
