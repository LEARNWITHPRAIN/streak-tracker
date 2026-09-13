import React, { useState, useEffect } from 'react';
import {
  Dumbbell,
  LayoutGrid,
  Headphones,
  Zap,
  CalendarDays,
  TableProperties,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle2,
  Sparkles,
  Minimize2,
  Maximize2,
  ExternalLink,
  Compass,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'yodha_tutorial_v1_done';

export interface TutorialStep {
  icon: React.ReactNode;
  accentColor: string;
  tag: string;
  title: string;
  description: string;
  targetTab: 'today' | 'weekly' | 'calendar' | 'music' | 'fuel';
  liveBadge: string;
  bullets?: string[];
  tip?: string;
}

const STEPS: TutorialStep[] = [
  {
    icon: <Sparkles className="w-8 h-8 text-amber-400" />,
    accentColor: 'from-orange-500 to-amber-500',
    tag: 'Welcome Warrior',
    targetTab: 'today',
    liveBadge: 'Dashboard Live',
    title: "Welcome to Yodha Mode! 🚀",
    description:
      "Your personalized workout plan is active. Take this quick practical tour to learn how to log workouts, edit weights, add music, and track your streaks.",
    bullets: [
      'The website stays visible so you can see each feature live',
      'Watch the dashboard switch tabs as we walk through the steps',
      'You can minimize this card anytime to try out buttons',
    ],
    tip: 'Replay this tutorial anytime from your Profile settings.',
  },
  {
    icon: <Dumbbell className="w-8 h-8 text-orange-400" />,
    accentColor: 'from-orange-500 to-red-500',
    tag: 'Today Tab',
    targetTab: 'today',
    liveBadge: "Live: Today's Workout",
    title: 'Log Daily Sets & Rest Timer',
    description:
      "Right behind this card is your Today workout. Tap each exercise to view target sets, check them off as you complete them, and watch your daily progress ring fill up.",
    bullets: [
      'Tap any exercise card to expand target sets and reps',
      'Check off each set to record your lift in real time',
      'Automatic rest timer counts down between sets',
      'The circle progress ring tracks your percentage complete',
    ],
    tip: 'Toggle Auto Rest Timer on or off right in the hero banner above.',
  },
  {
    icon: <LayoutGrid className="w-8 h-8 text-violet-400" />,
    accentColor: 'from-violet-500 to-purple-600',
    tag: 'Weekly Tab',
    targetTab: 'weekly',
    liveBadge: 'Live: Weekly Schedule',
    title: 'Edit Exercises, Sets & Weights',
    description:
      "Notice the Weekly schedule open on your screen. You can customize every day of your split, set custom weights in kg/lbs, and add or reorder exercises.",
    bullets: [
      'Tap "+ Add Exercise" on any day to add movements',
      'Set target weights (kg/lbs), sets, and rep ranges',
      'Drag and reorder exercises to match your gym setup',
      'Changes save immediately — no save button needed',
    ],
    tip: 'Set your weights before hitting the gym so your workout is ready to go.',
  },
  {
    icon: <TableProperties className="w-8 h-8 text-blue-400" />,
    accentColor: 'from-blue-500 to-cyan-500',
    tag: 'Weekly → Spreadsheet',
    targetTab: 'weekly',
    liveBadge: 'Live: Spreadsheet Mode',
    title: 'Option 1: The Spreadsheet Form',
    description:
      "Look at the Weekly tab — tap the 'Spreadsheet View' toggle to see your entire 7-day routine in a fast table. Edit all exercises, weights, and reps across days in one place.",
    bullets: [
      'High-speed table view of all 7 training days at once',
      'Inline edit weight, target sets, and rep counts per cell',
      'Perfect for quick weekly planning or updating your program',
    ],
    tip: 'Spreadsheet mode lets you program a whole week of progressive overload in seconds.',
  },
  {
    icon: <Headphones className="w-8 h-8 text-emerald-400" />,
    accentColor: 'from-green-500 to-emerald-600',
    tag: 'Music Tab',
    targetTab: 'music',
    liveBadge: 'Live: Gym Music Player',
    title: 'Add Music & Pump-Up Playlists',
    description:
      "Your screen switched to the Music tab. Build your workout soundtrack using curated gym presets, search for songs, or paste custom YouTube / Spotify links.",
    bullets: [
      'Curated playlists: Phonk, Heavy Rock, Hip Hop, Cyberpunk',
      'Paste any YouTube track or playlist link to add it directly',
      'Background mini-player stays active while you log sets',
    ],
    tip: 'Music continues playing even when you switch back to Today to log sets.',
  },
  {
    icon: <Zap className="w-8 h-8 text-yellow-400" />,
    accentColor: 'from-yellow-500 to-amber-500',
    tag: 'Fuel Tab',
    targetTab: 'fuel',
    liveBadge: 'Live: Motivational Fuel',
    title: 'Add Motivational Reels & Videos',
    description:
      "The Fuel tab is your visual hype library. Feed your fire before heavy lifts with motivational clips from YouTube, Instagram Reels, or uploads from your gallery.",
    bullets: [
      'Paste links from Instagram Reels or YouTube Shorts',
      'Upload your personal hype clips from your phone gallery',
      'Organize your favorites into a quick-access pre-workout feed',
    ],
    tip: 'Watch a 30-second hype clip right before going for a new personal record!',
  },
  {
    icon: <CalendarDays className="w-8 h-8 text-pink-400" />,
    accentColor: 'from-pink-500 to-rose-600',
    tag: 'Calendar Tab',
    targetTab: 'calendar',
    liveBadge: 'Live: Monthly Calendar',
    title: 'Track Streaks & Workout History',
    description:
      "Look at the Calendar tab on your screen. Every day you train shows a completion ring. The more sets you finish, the fuller and brighter the ring glows.",
    bullets: [
      '🟠 Full orange ring = 100% workout completed',
      '🟡 Partial ring = session in progress or rest day',
      'Flame counter tracks your active unbroken day streak',
      'Navigate backwards to review past months',
    ],
    tip: 'Never break the streak — even 1 logged set keeps the momentum alive!',
  },
  {
    icon: <CalendarDays className="w-8 h-8 text-teal-400" />,
    accentColor: 'from-teal-500 to-cyan-600',
    tag: 'Calendar → Day View',
    targetTab: 'calendar',
    liveBadge: 'Live: Exercise History',
    title: 'Option 2: Detailed Day Logs',
    description:
      "Click on any day in the Calendar to open its history. You get two powerful views to inspect everything you accomplished:",
    bullets: [
      '1️⃣ Detailed Exercise Log: Every exercise, set, and exact weight lifted',
      '2️⃣ Day Spreadsheet View: Compact table of completed reps and volume',
      'Compare planned weights vs actual weights lifted to ensure progressive overload',
    ],
    tip: 'You are all set to conquer your fitness goals in Yodha Mode! Let’s crush it.',
  },
];

interface AppTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab?: string;
  onTabChange?: (tab: 'today' | 'weekly' | 'calendar' | 'music' | 'fuel') => void;
}

export const AppTutorial: React.FC<AppTutorialProps> = ({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
}) => {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setIsMinimized(false);
      setVisible(true);
      // Ensure starting on today tab
      onTabChange?.('today');
    } else {
      setVisible(false);
    }
  }, [isOpen, onTabChange]);

  // When step changes, automatically change tab to show practical website UI
  useEffect(() => {
    if (isOpen) {
      const currentStep = STEPS[step];
      if (currentStep && onTabChange) {
        onTabChange(currentStep.targetTab);
      }
    }
  }, [step, isOpen, onTabChange]);

  if (!isOpen) return null;

  const current = STEPS[step];
  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;

  const handleClose = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {}
    setVisible(false);
    // return to today tab on close
    onTabChange?.('today');
    setTimeout(onClose, 200);
  };

  const goNext = () => {
    if (isLast) {
      handleClose();
      return;
    }
    setStep((s) => s + 1);
  };

  const goPrev = () => {
    if (isFirst) return;
    setStep((s) => s - 1);
  };

  const jumpToStep = (idx: number) => {
    setStep(idx);
  };

  // Minimized floating pill view so user can freely interact with the practical website
  if (isMinimized) {
    return (
      <div
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[120] animate-in fade-in slide-in-from-bottom-3 duration-200 cursor-pointer select-none"
        onClick={() => setIsMinimized(false)}
      >
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-card/95 border border-primary/50 shadow-2xl backdrop-blur-xl hover:border-primary transition-all group">
          <div className="relative flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-ping absolute" />
            <span className="w-2.5 h-2.5 rounded-full bg-primary relative" />
          </div>
          <Sparkles className="w-4 h-4 text-primary group-hover:rotate-12 transition-transform" />
          <div className="text-xs font-bold text-foreground">
            {current.tag}{' '}
            <span className="text-muted-foreground font-normal">
              ({step + 1}/{STEPS.length})
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-primary pl-1">
            <span>Expand Guide</span>
            <Maximize2 className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Non-blocking subtle guide indicator - website stays 100% visible */}
      <div
        className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[120] w-[calc(100vw-2rem)] sm:w-[420px] max-h-[85vh] flex flex-col bg-card/95 backdrop-blur-2xl border border-border/80 shadow-2xl rounded-3xl overflow-hidden transition-all duration-300 ${
          visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-95'
        }`}
        style={{
          boxShadow: '0 20px 50px -10px rgba(0,0,0,0.6), 0 0 25px -5px hsl(var(--primary) / 0.25)',
        }}
      >
        {/* ── Top Accent Bar ────────────────────────────────────────────── */}
        <div className={`h-1.5 w-full bg-gradient-to-r ${current.accentColor}`} />

        {/* ── Floating Header ───────────────────────────────────────────── */}
        <div className="px-5 pt-4 pb-2 flex items-center justify-between border-b border-border/40 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {/* Step Counter Badge */}
            <span className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20 shrink-0">
              Step {step + 1} of {STEPS.length}
            </span>

            {/* Live Practical Badge */}
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="truncate">{current.liveBadge}</span>
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Minimize button: lets user inspect/click full screen */}
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Minimize guide to try website"
            >
              <Minimize2 className="w-4 h-4" />
            </button>

            {/* Close / Skip button */}
            <button
              onClick={handleClose}
              className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Close tour"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Scrollable Body ───────────────────────────────────────────── */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[calc(85vh-130px)] scrollbar-thin">
          {/* Hero Row: Icon + Title */}
          <div className="flex items-start gap-3.5">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${current.accentColor} flex items-center justify-center p-2.5 shrink-0 shadow-lg shadow-black/20 text-white`}>
              {current.icon}
            </div>
            <div className="min-w-0 space-y-0.5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
                {current.tag}
              </span>
              <h3 className="text-base font-black text-foreground leading-snug">
                {current.title}
              </h3>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {current.description}
          </p>

          {/* Practical Bullet Points */}
          {current.bullets && (
            <div className="space-y-2 p-3 rounded-2xl bg-muted/40 border border-border/50">
              {current.bullets.map((bullet, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-foreground/90 leading-normal">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <span>{bullet}</span>
                </div>
              ))}
            </div>
          )}

          {/* Pro Tip */}
          {current.tip && (
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-xs text-primary leading-tight">
              <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{current.tip}</span>
            </div>
          )}

          {/* Active Practical Tab Switch button if user navigated away */}
          {activeTab && activeTab !== current.targetTab && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onTabChange?.(current.targetTab)}
              className="w-full text-xs h-8 rounded-xl border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground gap-1.5"
            >
              <Compass className="w-3.5 h-3.5" />
              Switch view to {current.targetTab.toUpperCase()} tab
            </Button>
          )}
        </div>

        {/* ── Footer Navigation ─────────────────────────────────────────── */}
        <div className="p-4 border-t border-border/50 bg-muted/20 flex items-center justify-between gap-2 shrink-0">
          {/* Prev button */}
          <Button
            size="sm"
            variant="ghost"
            onClick={goPrev}
            disabled={isFirst}
            className={`h-9 px-3 text-xs rounded-xl text-muted-foreground hover:text-foreground gap-1 ${
              isFirst ? 'invisible' : ''
            }`}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Back
          </Button>

          {/* Step Dots indicator */}
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => jumpToStep(i)}
                className={`transition-all duration-200 rounded-full ${
                  i === step
                    ? 'w-5 h-1.5 bg-primary shadow-sm shadow-primary'
                    : 'w-1.5 h-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60'
                }`}
                title={`Jump to step ${i + 1}`}
              />
            ))}
          </div>

          {/* Next / Finish button */}
          <Button
            size="sm"
            onClick={goNext}
            className={`h-9 px-4 text-xs font-bold rounded-xl gap-1.5 bg-gradient-to-r ${current.accentColor} text-white border-0 shadow-md shadow-primary/20 hover:opacity-95 transition-all`}
          >
            {isLast ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                Finish Tour!
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
    </>
  );
};

/** Returns true if the user has NOT yet seen the tutorial */
export function shouldShowTutorial(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'true';
  } catch {
    return false;
  }
}

/** Call this to programmatically reset the tutorial (e.g. from Profile) */
export function resetTutorial(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}
