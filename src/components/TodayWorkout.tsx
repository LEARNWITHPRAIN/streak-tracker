import React, { useState, useMemo } from 'react';
import { 
  Dumbbell, Heart, Zap, ZapOff, Target, Footprints, Flame, Moon, Check, 
  RotateCcw, ChevronDown, ChevronUp, Scale, LayoutGrid, ArrowRight 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useUserWorkouts, parseReps, getExerciseSets, Exercise } from '@/hooks/useUserWorkouts';
import { useWorkoutLogs } from '@/hooks/useWorkoutLogs';
import { useAnimatedProgress } from '@/hooks/useAnimatedProgress';
import { DailyExerciseSetLog } from '@/types/exercise';

const dayIcons: Record<string, React.ReactNode> = {
  monday: <Dumbbell className="w-5 h-5" />,
  tuesday: <Target className="w-5 h-5" />,
  wednesday: <Heart className="w-5 h-5" />,
  thursday: <Footprints className="w-5 h-5" />,
  friday: <Zap className="w-5 h-5" />,
  saturday: <Flame className="w-5 h-5" />,
  sunday: <Moon className="w-5 h-5" />,
};

const dayColors: Record<string, string> = {
  monday: 'text-primary',
  tuesday: 'text-primary',
  wednesday: 'text-primary',
  thursday: 'text-primary',
  friday: 'text-primary',
  saturday: 'text-primary',
  sunday: 'text-muted-foreground',
};

interface TodayWorkoutProps {
  onSetComplete?: () => void;
  autoStart?: boolean;
  onToggleAutoStart?: () => void;
  onNavigateToWeekly?: () => void;
}

export const TodayWorkout: React.FC<TodayWorkoutProps> = ({ 
  onSetComplete,
  autoStart = true,
  onToggleAutoStart,
  onNavigateToWeekly,
}) => {
  const { getTodaySchedule, getTodayName, loading: scheduleLoading } = useUserWorkouts();
  const { 
    todayProgress, 
    todaySets, 
    saveExerciseSets, 
    resetTodayProgress, 
    calculateTotalProgress, 
    loading: progressLoading 
  } = useWorkoutLogs();
  
  const todaySchedule = getTodaySchedule();
  const todayName = getTodayName();

  // Helper to get structured sets for an exercise from routine configuration
  const getSetsForExercise = (exercise: Exercise): DailyExerciseSetLog[] => {
    const configured = getExerciseSets(exercise);
    const existing = todaySets[exercise.id];
    const completedCount = todayProgress[exercise.id] || 0;

    return configured.map((s, idx) => {
      // Check if existing log recorded completion status for this set
      const isCompleted = existing && existing[idx] !== undefined 
        ? existing[idx].completed 
        : idx < completedCount;

      return {
        setNumber: s.setNumber || idx + 1,
        weight: s.weight !== undefined ? s.weight : (exercise.weight ?? null),
        reps: s.reps || parseReps(exercise.setsReps) || '10',
        completed: isCompleted,
      };
    });
  };

  // Helper to build all exercises metadata for database synchronization
  const getAllExercisesMeta = () => {
    if (!todaySchedule) return [];
    return todaySchedule.exercises.map(ex => {
      const sets = getSetsForExercise(ex);
      return {
        id: ex.id,
        name: ex.name,
        totalSets: sets.length,
      };
    });
  };

  // Toggle completion of a specific set
  const handleToggleSet = async (exercise: Exercise, setIndex: number) => {
    const currentSets = [...getSetsForExercise(exercise)];
    if (!currentSets[setIndex]) return;

    const wasCompleted = currentSets[setIndex].completed;
    currentSets[setIndex] = {
      ...currentSets[setIndex],
      completed: !wasCompleted,
    };

    const allMeta = getAllExercisesMeta().map(m => 
      m.id === exercise.id ? { ...m, totalSets: currentSets.length } : m
    );

    await saveExerciseSets(exercise.id, exercise.name, currentSets, allMeta);

    // Auto-start rest timer only when completing a set (not when un-checking)
    if (!wasCompleted && onSetComplete) {
      onSetComplete();
    }
  };

  // Quick card click: completes next pending set, or resets all sets if already 100%
  const handleQuickAdvance = async (exercise: Exercise) => {
    const currentSets = [...getSetsForExercise(exercise)];
    const nextPendingIdx = currentSets.findIndex(s => !s.completed);

    if (nextPendingIdx !== -1) {
      // Mark next set complete
      currentSets[nextPendingIdx] = {
        ...currentSets[nextPendingIdx],
        completed: true,
      };
      const allMeta = getAllExercisesMeta();
      await saveExerciseSets(exercise.id, exercise.name, currentSets, allMeta);
      if (onSetComplete) onSetComplete();
    } else {
      // All done, reset this exercise to 0
      const resetSets = currentSets.map(s => ({ ...s, completed: false }));
      const allMeta = getAllExercisesMeta();
      await saveExerciseSets(exercise.id, exercise.name, resetSets, allMeta);
    }
  };

  const { percentage: totalProgress } = calculateTotalProgress(todaySchedule);
  const animatedTotalProgress = useAnimatedProgress(totalProgress);

  if (scheduleLoading || progressLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground animate-pulse">Loading workout...</p>
      </div>
    );
  }

  if (!todaySchedule) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No schedule found for today</p>
      </div>
    );
  }

  const dayKey = todaySchedule.day;

  return (
    <div className="space-y-6">
      {/* Top Banner / Settings */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-card/60 border border-border/50 backdrop-blur-sm">
        {/* Day Header */}
        <div className="flex items-center gap-3.5">
          <div className={`w-12 h-12 rounded-2xl bg-background/80 border border-border/50 flex items-center justify-center shadow-inner ${dayColors[dayKey]}`}>
            {dayIcons[dayKey]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-xl font-bold tracking-tight ${dayColors[dayKey]}`}>{todaySchedule.title}</h3>
              <Badge variant="outline" className="text-xs px-2.5 py-0.5 bg-background/50 border-primary/30 font-semibold">
                {todayName}
              </Badge>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground mt-0.5">{todaySchedule.subtitle}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
          {onToggleAutoStart && (
            <button
              type="button"
              onClick={onToggleAutoStart}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs md:text-sm font-medium border transition-all ${
                autoStart
                  ? 'bg-primary/15 text-primary border-primary/40 hover:bg-primary/25'
                  : 'bg-muted/40 text-muted-foreground border-border/30 hover:bg-muted hover:text-foreground'
              }`}
              title={autoStart ? 'Auto-start Rest Timer is ON' : 'Auto-start Rest Timer is OFF'}
            >
              {autoStart ? <Zap className="w-3.5 h-3.5 text-primary" /> : <ZapOff className="w-3.5 h-3.5 text-muted-foreground" />}
              <span>Auto Timer: {autoStart ? 'ON' : 'OFF'}</span>
            </button>
          )}

          <Button 
            size="sm" 
            variant="ghost" 
            onClick={resetTodayProgress}
            className="text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-xl"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Reset All
          </Button>
        </div>
      </div>

      {/* Routine Edit Redirect Notification Banner */}
      {onNavigateToWeekly && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 p-3 px-4 rounded-xl bg-primary/10 border border-primary/30 text-xs shadow-sm">
          <div className="flex items-center gap-2 text-foreground/90">
            <LayoutGrid className="w-4 h-4 text-primary shrink-0" />
            <span>To customize exercises, weights, sets, or reps, edit your program in <strong>Weekly Schedule</strong>.</span>
          </div>
          <button
            type="button"
            onClick={onNavigateToWeekly}
            className="inline-flex items-center gap-1 font-bold text-primary hover:underline hover:text-primary/90 shrink-0 self-end sm:self-auto"
          >
            Edit in Weekly Split <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Overall Progress Status */}
      <div className="space-y-2 bg-card/40 border border-border/40 p-4 rounded-2xl">
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground font-medium">Workout Completion</span>
          <span className="font-bold text-primary text-base">{animatedTotalProgress}%</span>
        </div>
        <Progress value={animatedTotalProgress} className="h-2.5 rounded-full" activeOnProgress />
      </div>

      {/* Exercises Grid */}
      {todaySchedule.exercises.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {todaySchedule.exercises.map((exercise) => {
            const sets = getSetsForExercise(exercise);
            const totalSets = sets.length;
            const completedSets = sets.filter(s => s.completed).length;
            const isCompleted = totalSets > 0 && completedSets >= totalSets;
            const progressPercent = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

            return (
              <ExerciseWorkoutCard
                key={exercise.id}
                exercise={exercise}
                sets={sets}
                dayKey={dayKey}
                dayColors={dayColors}
                isCompleted={isCompleted}
                completedSets={completedSets}
                totalSets={totalSets}
                progressPercent={progressPercent}
                onQuickAdvance={() => handleQuickAdvance(exercise)}
                onToggleSet={(idx) => handleToggleSet(exercise, idx)}
              />
            );
          })}
        </div>
      ) : (
        <Card className="bg-card/30 border-dashed rounded-2xl p-8 text-center">
          <CardContent className="space-y-2">
            <Moon className="w-10 h-10 mx-auto text-muted-foreground/60" />
            <p className="text-base font-semibold text-muted-foreground">Rest Day - Take time to recover!</p>
            <p className="text-xs text-muted-foreground/60">Your muscles grow and rebuild during rest!</p>
          </CardContent>
        </Card>
      )}

      {/* Helpful Footer Note */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-xs text-muted-foreground pt-2 text-center">
        <span className="flex items-center gap-1.5">
          💡 Click <strong>✓ Set</strong> or <strong>Card</strong> to complete sets & start rest timer
        </span>
        {onNavigateToWeekly && (
          <>
            <span className="hidden sm:inline opacity-40">•</span>
            <button
              type="button"
              onClick={onNavigateToWeekly}
              className="text-primary font-semibold hover:underline flex items-center gap-1"
            >
              Need to change sets, reps or weights? Edit in Weekly tab →
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// ── Exercise Workout Card (Pure Completion Flow) ─────────────────────────
interface ExerciseWorkoutCardProps {
  exercise: Exercise;
  sets: DailyExerciseSetLog[];
  dayKey: string;
  dayColors: Record<string, string>;
  isCompleted: boolean;
  completedSets: number;
  totalSets: number;
  progressPercent: number;
  onQuickAdvance: () => void;
  onToggleSet: (setIndex: number) => void;
}

const ExerciseWorkoutCard: React.FC<ExerciseWorkoutCardProps> = ({
  exercise,
  sets,
  dayKey,
  dayColors,
  isCompleted,
  completedSets,
  totalSets,
  progressPercent,
  onQuickAdvance,
  onToggleSet,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const maxWeight = useMemo(() => {
    const weights = sets
      .map(s => s.weight)
      .filter((w): w is number => w !== null && w > 0);
    return weights.length > 0 ? Math.max(...weights) : null;
  }, [sets]);

  return (
    <Card
      className={`transition-all duration-300 border rounded-2xl overflow-hidden shadow-sm ${
        isCompleted 
          ? 'bg-primary/10 border-primary/40 shadow-primary/5' 
          : 'bg-card/75 hover:bg-card border-border/60 hover:border-primary/30'
      }`}
    >
      <CardContent className="p-4 space-y-3.5">
        {/* Card Header */}
        <div className="flex items-center gap-3">
          <div 
            onClick={onQuickAdvance}
            className={`w-11 h-11 rounded-xl bg-background/70 border border-border/50 flex items-center justify-center shrink-0 cursor-pointer hover:scale-105 transition-transform ${dayColors[dayKey]}`}
            title="Click to complete next set"
          >
            <Dumbbell className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0 cursor-pointer" onClick={onQuickAdvance}>
            <div className="flex items-center gap-2">
              <p className={`font-bold text-base truncate ${isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                {exercise.name}
              </p>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs bg-background/60 font-mono font-medium">
                {completedSets}/{totalSets} sets
              </Badge>
              {maxWeight !== null ? (
                <Badge variant="secondary" className="text-[10px] font-mono px-2 py-0 bg-primary/15 text-primary border border-primary/30">
                  Top: {maxWeight} kg
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] font-medium px-2 py-0 text-muted-foreground">
                  Bodyweight (BW)
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {isCompleted && (
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                <Check className="w-4 h-4 font-bold" />
              </div>
            )}
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? 'Collapse sets' : 'Expand sets'}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <Progress value={progressPercent} className="h-1.5 rounded-full" activeOnProgress />

        {/* Multi-Set Detailed Breakdown */}
        {isExpanded && (
          <div className="pt-1 space-y-2 border-t border-border/40">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1">
              <span>Set & Weight</span>
              <span>Reps</span>
              <span className="text-right">Action</span>
            </div>

            <div className="space-y-1.5">
              {sets.map((set, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between gap-2 p-2 rounded-xl border transition-all ${
                    set.completed
                      ? 'bg-primary/10 border-primary/30 text-foreground'
                      : 'bg-background/40 hover:bg-background/70 border-border/40'
                  }`}
                >
                  {/* Set Number & Weight Badge */}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="w-8 h-8 flex items-center justify-center text-xs font-black font-mono rounded-lg bg-primary/15 text-primary shrink-0 border border-primary/20">
                      S{set.setNumber}
                    </span>

                    <span className="flex items-center gap-1.5 text-xs font-mono font-medium px-2.5 py-1.5 rounded-xl bg-muted/30 border border-border/50 text-foreground">
                      <Scale className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="font-semibold">
                        {set.weight !== null ? `${set.weight} kg` : 'Bodyweight'}
                      </span>
                    </span>
                  </div>

                  {/* Target Reps Badge */}
                  <div className="shrink-0 text-center">
                    <span className="text-xs font-mono font-semibold text-muted-foreground px-2.5 py-1.5 rounded-xl bg-muted/30 border border-border/50 inline-block">
                      {String(set.reps || '10').replace(/^[0-9]+\s*[*xX×]\s*/, '')} reps
                    </span>
                  </div>

                  {/* Single Action: Complete Set */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onToggleSet(idx)}
                      className={`h-8 px-3.5 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all shadow-sm ${
                        set.completed
                          ? 'bg-primary text-primary-foreground shadow-primary/25 hover:brightness-110'
                          : 'bg-muted/70 text-muted-foreground hover:bg-primary/20 hover:text-primary border border-border/50 hover:border-primary/40'
                      }`}
                      title={set.completed ? 'Set completed (click to undo)' : 'Click to complete set & start rest timer'}
                    >
                      <Check className={`w-3.5 h-3.5 ${set.completed ? 'stroke-[3]' : 'opacity-40'}`} />
                      <span>{set.completed ? 'Done' : 'Set'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Set Status Summary */}
            <div className="flex items-center justify-between pt-1 px-1">
              <span className="text-[11px] text-muted-foreground font-medium">
                {completedSets} of {totalSets} sets completed
              </span>
              <span className="text-[11px] font-semibold text-primary">
                {progressPercent}% Done
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TodayWorkout;
