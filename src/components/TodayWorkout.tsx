import React, { useState, useEffect, useMemo } from 'react';
import { 
  Dumbbell, Heart, Zap, ZapOff, Target, Footprints, Flame, Moon, Check, 
  RotateCcw, ChevronDown, ChevronUp, Scale, LayoutGrid, ArrowRight, Minus, Plus,
  Calendar
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUserWorkouts, parseReps, getExerciseSets, Exercise, DaySchedule } from '@/hooks/useUserWorkouts';
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
  const { 
    schedule,
    getTodaySchedule, 
    getTodayName, 
    selectedWorkoutDay,
    setSelectedWorkoutDay,
    loading: scheduleLoading 
  } = useUserWorkouts();
  const { 
    todayProgress, 
    todaySets, 
    saveExerciseSets, 
    resetTodayProgress, 
    calculateTotalProgress, 
    loading: progressLoading 
  } = useWorkoutLogs();
  
  const todayName = getTodayName();
  const todayDayKey = useMemo(() => {
    return new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  }, []);

  // Dynamically group workouts from the Weekly tab by trimmed, case-insensitive title
  const workoutGroups = useMemo(() => {
    if (!schedule || schedule.length === 0) return [];
    const groupMap = new Map<string, { title: string; occurrences: DaySchedule[] }>();

    schedule.forEach((daySchedule) => {
      const rawTitle = (daySchedule.title || '').trim();
      if (!rawTitle) return;
      const key = rawTitle.toLowerCase();

      if (!groupMap.has(key)) {
        groupMap.set(key, {
          title: rawTitle,
          occurrences: [daySchedule],
        });
      } else {
        groupMap.get(key)!.occurrences.push(daySchedule);
      }
    });

    return Array.from(groupMap.values());
  }, [schedule]);

  // Determine the active scheduled occurrence based on session selection, today's day, or first schedule item
  const activeSchedule: DaySchedule | null = useMemo(() => {
    if (!schedule || schedule.length === 0) return null;

    if (selectedWorkoutDay) {
      const match = schedule.find(d => d.day.toLowerCase() === selectedWorkoutDay.toLowerCase());
      if (match) return match;
    }

    const todayMatch = schedule.find(d => d.day.toLowerCase() === todayDayKey);
    if (todayMatch) return todayMatch;

    return schedule[0] || null;
  }, [schedule, selectedWorkoutDay, todayDayKey]);

  // The active workout group corresponding to the selected occurrence
  const activeGroup = useMemo(() => {
    if (!activeSchedule || workoutGroups.length === 0) return null;
    return workoutGroups.find(g => 
      g.occurrences.some(o => o.day.toLowerCase() === activeSchedule.day.toLowerCase())
    ) || null;
  }, [activeSchedule, workoutGroups]);

  const handleSelectWorkoutGroup = (group: { title: string; occurrences: DaySchedule[] }) => {
    if (!group || group.occurrences.length === 0) return;

    // Single workout case: automatically select it without prompting
    if (group.occurrences.length === 1) {
      setSelectedWorkoutDay(group.occurrences[0].day);
      return;
    }

    // Duplicate workout names case:
    // If currently selected day is already in this group, keep it
    if (activeSchedule && group.occurrences.some(o => o.day.toLowerCase() === activeSchedule.day.toLowerCase())) {
      return;
    }

    // If today's day matches one of the occurrences, prefer today's occurrence
    const todayOccurrence = group.occurrences.find(o => o.day.toLowerCase() === todayDayKey);
    if (todayOccurrence) {
      setSelectedWorkoutDay(todayOccurrence.day);
      return;
    }

    // Otherwise default to the first occurrence
    setSelectedWorkoutDay(group.occurrences[0].day);
  };

  const handleSelectOccurrence = (dayName: string) => {
    setSelectedWorkoutDay(dayName);
  };

  const todaySchedule = activeSchedule;

  // Helper to get structured sets for an exercise from routine configuration
  const getSetsForExercise = (exercise: Exercise): DailyExerciseSetLog[] => {
    const configured = getExerciseSets(exercise);
    const existing = todaySets[exercise.id];
    const completedCount = todayProgress[exercise.id] || 0;

    return configured.map((s, idx) => {
      const isCompleted = existing && existing[idx] !== undefined 
        ? existing[idx].completed 
        : idx < completedCount;

      const targetReps = String(s.reps || parseReps(exercise.setsReps) || '10').replace(/^[0-9]+\s*[*xX×]\s*/, '');
      const doneReps = existing && existing[idx] !== undefined && existing[idx].doneReps !== undefined
        ? String(existing[idx].doneReps)
        : (isCompleted ? targetReps : '');

      return {
        setNumber: s.setNumber || idx + 1,
        weight: s.weight !== undefined ? s.weight : (exercise.weight ?? null),
        reps: targetReps,
        doneReps: doneReps,
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

  // Toggle completion of a specific set, optionally saving user-specified done reps
  const handleToggleSet = async (exercise: Exercise, setIndex: number, specificDoneReps?: string) => {
    const currentSets = [...getSetsForExercise(exercise)];
    if (!currentSets[setIndex]) return;

    const wasCompleted = currentSets[setIndex].completed;
    const targetReps = String(currentSets[setIndex].reps || '10').replace(/^[0-9]+\s*[*xX×]\s*/, '');
    const currentDone = specificDoneReps !== undefined && specificDoneReps !== ''
      ? specificDoneReps
      : currentSets[setIndex].doneReps;

    const nextDoneReps = !wasCompleted
      ? (currentDone !== undefined && currentDone !== '' ? currentDone : targetReps)
      : currentDone;

    currentSets[setIndex] = {
      ...currentSets[setIndex],
      completed: !wasCompleted,
      doneReps: nextDoneReps,
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

  // Update done reps directly for a set
  const handleUpdateDoneReps = async (exercise: Exercise, setIndex: number, doneReps: string) => {
    const currentSets = [...getSetsForExercise(exercise)];
    if (!currentSets[setIndex]) return;

    currentSets[setIndex] = {
      ...currentSets[setIndex],
      doneReps,
    };

    const allMeta = getAllExercisesMeta().map(m => 
      m.id === exercise.id ? { ...m, totalSets: currentSets.length } : m
    );

    await saveExerciseSets(exercise.id, exercise.name, currentSets, allMeta);
  };

  // Quick card click: completes next pending set, or resets all sets if already 100%
  const handleQuickAdvance = async (exercise: Exercise) => {
    const currentSets = [...getSetsForExercise(exercise)];
    const nextPendingIdx = currentSets.findIndex(s => !s.completed);

    if (nextPendingIdx !== -1) {
      const targetReps = String(currentSets[nextPendingIdx].reps || '10').replace(/^[0-9]+\s*[*xX×]\s*/, '');
      const currentDone = currentSets[nextPendingIdx].doneReps;
      currentSets[nextPendingIdx] = {
        ...currentSets[nextPendingIdx],
        completed: true,
        doneReps: currentDone !== undefined && currentDone !== '' ? currentDone : targetReps,
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

  if (!todaySchedule || workoutGroups.length === 0) {
    return (
      <Card className="bg-card/40 border-dashed border-border/80 rounded-2xl p-8 sm:p-12 text-center max-w-lg mx-auto my-8">
        <CardContent className="space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
            <Dumbbell className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-foreground">No Workouts Scheduled</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              You don't have any workouts scheduled in your Weekly Split yet. Head over to the Weekly tab to create or customize your workouts.
            </p>
          </div>
          {onNavigateToWeekly && (
            <Button 
              onClick={onNavigateToWeekly}
              className="rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-primary/20"
            >
              <LayoutGrid className="w-4 h-4 mr-2" />
              Go to Weekly Split & Create Workout
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const dayKey = todaySchedule.day.toLowerCase();
  const currentGroupTitle = activeGroup?.title || todaySchedule.title;

  return (
    <div className="space-y-6">
      {/* Dynamic Workout Selector Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-card/75 border border-border/60 shadow-lg shadow-black/20 backdrop-blur-md space-y-3.5">
        {/* Top bar: Category label + Today Badge + Timer & Reset controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Dumbbell className="w-3.5 h-3.5 text-primary" />
              Today's Workout
            </span>
            <Badge variant="outline" className="text-[10px] px-2 py-0 bg-background/50 border-primary/30 text-primary font-semibold">
              Today: {todayName}
            </Badge>
            {todaySchedule.day.toLowerCase() !== todayDayKey && (
              <Badge variant="secondary" className="text-[10px] px-2 py-0 font-medium text-muted-foreground">
                Performing: <span className="capitalize ml-1 text-foreground font-semibold">{todaySchedule.day}</span>
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {onToggleAutoStart && (
              <button
                type="button"
                onClick={onToggleAutoStart}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                  autoStart
                    ? 'bg-primary/15 text-primary border-primary/40 hover:bg-primary/25'
                    : 'bg-muted/40 text-muted-foreground border-border/30 hover:bg-muted hover:text-foreground'
                }`}
                title={autoStart ? 'Auto-start Rest Timer is ON' : 'Auto-start Rest Timer is OFF'}
              >
                {autoStart ? <Zap className="w-3.5 h-3.5 text-primary" /> : <ZapOff className="w-3.5 h-3.5 text-muted-foreground" />}
                <span className="hidden sm:inline">Auto Timer:</span> {autoStart ? 'ON' : 'OFF'}
              </button>
            )}

            <Button 
              size="sm" 
              variant="ghost" 
              onClick={resetTodayProgress}
              className="text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-xl h-8 px-2.5"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Reset All
            </Button>
          </div>
        </div>

        {/* Workout Dropdown Selector Trigger */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="w-full flex items-center justify-between gap-3 p-3 sm:p-3.5 rounded-xl bg-background/70 hover:bg-background/95 border border-border/70 hover:border-primary/50 transition-all text-left shadow-sm group focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-11 h-11 rounded-xl bg-card border border-border/50 flex items-center justify-center shrink-0 shadow-inner ${dayColors[dayKey] || 'text-primary'}`}>
                  {dayIcons[dayKey] || <Dumbbell className="w-5 h-5" />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-xl font-bold tracking-tight text-foreground truncate group-hover:text-primary transition-colors">
                      {currentGroupTitle}
                    </h3>
                    <ChevronDown className="w-4 h-4 text-primary shrink-0 transition-transform group-data-[state=open]:rotate-180" />
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {todaySchedule.subtitle || `${todaySchedule.exercises.length} exercises`}
                    {activeGroup && activeGroup.occurrences.length > 1 ? (
                      <span className="ml-1 text-primary/90 font-medium">• {activeGroup.occurrences.length} days scheduled</span>
                    ) : (
                      <span className="ml-1 text-muted-foreground/80">• Scheduled for <span className="capitalize font-semibold text-foreground/90">{todaySchedule.day}</span></span>
                    )}
                  </p>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/40 text-xs font-semibold text-muted-foreground group-hover:text-foreground group-hover:bg-muted/70 transition-colors shrink-0">
                <span>Switch Workout</span>
              </div>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start" className="w-[310px] sm:w-[380px] p-2 bg-card/95 backdrop-blur-2xl border border-border/80 shadow-2xl rounded-2xl max-h-[380px] overflow-y-auto">
            <DropdownMenuLabel className="text-[11px] font-bold text-muted-foreground px-2 py-1.5 uppercase tracking-wider flex items-center justify-between">
              <span>Weekly Workouts</span>
              <span className="text-[10px] font-normal text-primary">{workoutGroups.length} available</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-1 bg-border/40" />

            {workoutGroups.map((group) => {
              const isGroupActive = activeGroup && group.title.toLowerCase() === activeGroup.title.toLowerCase();
              return (
                <DropdownMenuItem
                  key={group.title}
                  onClick={() => handleSelectWorkoutGroup(group)}
                  className={`flex items-start justify-between gap-2 p-2.5 rounded-xl cursor-pointer transition-all my-0.5 ${
                    isGroupActive
                      ? 'bg-primary/15 text-primary border border-primary/30 font-semibold'
                      : 'hover:bg-muted/60 text-foreground'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold truncate">{group.title}</span>
                      {group.occurrences.length > 1 && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-background/60 border-primary/30 text-primary font-medium shrink-0">
                          {group.occurrences.length}× / week
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                      {group.occurrences.map(o => o.shortDay).join(', ')} • {group.occurrences[0]?.exercises.length || 0} exercises
                    </p>
                  </div>
                  {isGroupActive && (
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  )}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Duplicate Workout Resolution: Clean Segmented Toggle */}
        {activeGroup && activeGroup.occurrences.length > 1 && (
          <div className="pt-2 border-t border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-in fade-in duration-200">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
              <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>Choose your <strong className="text-foreground">{activeGroup.title}</strong>:</span>
            </div>
            <div className="inline-flex items-center p-1 rounded-xl bg-background/80 border border-border/60 gap-1 self-start sm:self-auto w-full sm:w-auto overflow-x-auto">
              {activeGroup.occurrences.map((occ) => {
                const isSelected = occ.day.toLowerCase() === todaySchedule.day.toLowerCase();
                return (
                  <button
                    key={occ.day}
                    type="button"
                    onClick={() => handleSelectOccurrence(occ.day)}
                    className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                      isSelected
                        ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30 scale-[1.02]'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    <span className="capitalize">{occ.day}</span>
                    <span className={`text-[10px] px-1 rounded ${isSelected ? 'bg-primary-foreground/20 text-primary-foreground' : 'text-muted-foreground/70'}`}>
                      {occ.exercises.length} ex
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Routine Edit Redirect Notification Banner */}
      {onNavigateToWeekly && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-primary/15 via-primary/10 to-transparent border border-primary/30 shadow-sm">
          <div className="flex items-start sm:items-center gap-3 text-foreground/90">
            <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 shadow-inner">
              <LayoutGrid className="w-5 h-5 text-primary" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs sm:text-sm font-bold text-foreground">
                  Today's Logging: <span className="text-primary underline decoration-primary/50 underline-offset-2">Done Reps Only</span>
                </p>
                <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30 font-semibold px-2 py-0">
                  Target & weights are locked here
                </Badge>
              </div>
              <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                Log your completed reps here. To customize exercise names, target weights, sets, or target reps, head over to the <strong>Weekly Split</strong> tab.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onNavigateToWeekly}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:brightness-110 transition-all shrink-0 self-stretch sm:self-auto shadow-sm shadow-primary/20 active:scale-95"
          >
            <span>Edit in Weekly Split</span>
            <ArrowRight className="w-3.5 h-3.5" />
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
                onToggleSet={(idx, specificDoneReps) => handleToggleSet(exercise, idx, specificDoneReps)}
                onUpdateDoneReps={(idx, doneReps) => handleUpdateDoneReps(exercise, idx, doneReps)}
                onNavigateToWeekly={onNavigateToWeekly}
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
          💡 Record your <strong>Done Reps</strong> for each set & click <strong>✓ Set</strong> to complete
        </span>
        {onNavigateToWeekly && (
          <>
            <span className="hidden sm:inline opacity-40">•</span>
            <button
              type="button"
              onClick={onNavigateToWeekly}
              className="text-primary font-semibold hover:underline flex items-center gap-1"
            >
              Need to change sets, target reps or weights? Edit in Weekly tab →
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
  onToggleSet: (setIndex: number, specificDoneReps?: string) => void;
  onUpdateDoneReps: (setIndex: number, doneReps: string) => void;
  onNavigateToWeekly?: () => void;
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
  onUpdateDoneReps,
  onNavigateToWeekly,
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
            <div className="flex items-center gap-2 mt-1 flex-wrap">
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
          <div className="pt-2 space-y-2.5 border-t border-border/40">
            {/* Legend / Helper Info */}
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1">
              <span>Set & Target</span>
              <span className="text-right text-primary">Your Done Reps</span>
            </div>

            <div className="space-y-2">
              {sets.map((set, idx) => (
                <TodaySetRow
                  key={idx}
                  set={set}
                  setIndex={idx}
                  onToggle={(doneReps) => onToggleSet(idx, doneReps)}
                  onUpdateDoneReps={(doneReps) => onUpdateDoneReps(idx, doneReps)}
                />
              ))}
            </div>

            {/* Set Status Summary & Weekly Link */}
            <div className="flex items-center justify-between pt-1 px-1 text-[11px]">
              <span className="text-muted-foreground font-medium">
                {completedSets} of {totalSets} sets completed
              </span>
              {onNavigateToWeekly && (
                <button
                  type="button"
                  onClick={onNavigateToWeekly}
                  className="text-primary hover:underline font-semibold flex items-center gap-1 text-[11px]"
                >
                  Edit routine in Weekly <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ── Mobile-Friendly Clean Set Row Component ─────────────────────────────
interface TodaySetRowProps {
  set: DailyExerciseSetLog;
  setIndex: number;
  onToggle: (specificDoneReps?: string) => void;
  onUpdateDoneReps: (doneReps: string) => void;
}

const TodaySetRow: React.FC<TodaySetRowProps> = ({
  set,
  setIndex,
  onToggle,
  onUpdateDoneReps,
}) => {
  const targetRepsClean = String(set.reps || '10').replace(/^[0-9]+\s*[*xX×]\s*/, '');
  const initialDone = set.doneReps !== undefined && set.doneReps !== '' 
    ? String(set.doneReps) 
    : (set.completed ? targetRepsClean : '');
  
  const [localDoneReps, setLocalDoneReps] = useState<string>(initialDone);

  useEffect(() => {
    if (set.doneReps !== undefined && set.doneReps !== '') {
      setLocalDoneReps(String(set.doneReps));
    } else if (set.completed) {
      setLocalDoneReps(targetRepsClean);
    } else {
      setLocalDoneReps('');
    }
  }, [set.doneReps, set.completed, targetRepsClean]);

  const handleStep = (delta: number) => {
    const currentNum = parseInt(localDoneReps || targetRepsClean, 10) || 0;
    const nextNum = Math.max(0, currentNum + delta);
    const nextStr = String(nextNum);
    setLocalDoneReps(nextStr);
    onUpdateDoneReps(nextStr);
  };

  const handleInputChange = (val: string) => {
    const sanitized = val.replace(/[^0-9]/g, '');
    setLocalDoneReps(sanitized);
    onUpdateDoneReps(sanitized);
  };

  const handleToggle = () => {
    const repsToSave = localDoneReps.trim() !== '' ? localDoneReps.trim() : targetRepsClean;
    if (!set.completed && localDoneReps.trim() === '') {
      setLocalDoneReps(targetRepsClean);
    }
    onToggle(repsToSave);
  };

  return (
    <div
      className={`p-2.5 rounded-xl border transition-all duration-200 ${
        set.completed
          ? 'bg-primary/10 border-primary/40 shadow-xs'
          : 'bg-background/50 hover:bg-background/80 border-border/50'
      }`}
    >
      {/* Top Line: Set Number + Planned Weight + Target Reps (Read-Only) */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-7 h-7 flex items-center justify-center text-xs font-black font-mono rounded-lg shrink-0 border ${
            set.completed 
              ? 'bg-primary text-primary-foreground border-primary shadow-xs' 
              : 'bg-primary/15 text-primary border-primary/20'
          }`}>
            S{set.setNumber || setIndex + 1}
          </span>

          <span 
            className="flex items-center gap-1 text-xs font-mono font-medium px-2 py-1 rounded-lg bg-muted/40 border border-border/40 text-foreground"
            title="Planned weight from weekly routine (locked)"
          >
            <Scale className="w-3 h-3 text-primary shrink-0" />
            <span className="font-semibold truncate">
              {set.weight !== null ? `${set.weight} kg` : 'Bodyweight'}
            </span>
          </span>
        </div>

        {/* Target Reps Badge (Routine Target - Read-Only in Today) */}
        <div 
          className="flex items-center gap-1.5 text-xs shrink-0"
          title="Planned target reps from weekly routine (locked)"
        >
          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Target:</span>
          <span className="font-mono font-bold text-foreground px-2 py-0.5 rounded-md bg-muted/50 border border-border/50 text-[11px]">
            {targetRepsClean} reps
          </span>
        </div>
      </div>

      {/* Bottom Line: Done Reps Stepper/Input (Editable) + Complete Action Button */}
      <div className="flex items-center justify-between gap-2 pt-2 mt-2 border-t border-border/35">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-xs font-bold text-primary shrink-0 flex items-center gap-1">
            <span>Done:</span>
          </span>

          {/* Stepper + Direct Numeric Input for Done Reps */}
          <div className={`flex items-center h-8 rounded-xl border p-0.5 shadow-inner transition-all ${
            set.completed
              ? 'bg-background border-primary/50 ring-1 ring-primary/20'
              : 'bg-background/80 border-border/70 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30'
          }`}>
            <button
              type="button"
              onClick={() => handleStep(-1)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/70 active:scale-90 transition-all text-xs font-bold shrink-0"
              title="Decrease reps"
            >
              <Minus className="w-3 h-3" />
            </button>

            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder={targetRepsClean}
              value={localDoneReps}
              onChange={(e) => handleInputChange(e.target.value)}
              className="w-10 min-w-0 bg-transparent text-xs font-mono font-black text-foreground text-center outline-none px-0.5"
              title="Enter completed reps"
            />

            <button
              type="button"
              onClick={() => handleStep(1)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/70 active:scale-90 transition-all text-xs font-bold shrink-0"
              title="Increase reps"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          <span className="text-[11px] font-semibold text-muted-foreground select-none shrink-0 hidden sm:inline">
            reps
          </span>
        </div>

        {/* Set Complete Action Toggle Button */}
        <button
          type="button"
          onClick={handleToggle}
          className={`h-8 px-3.5 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all shadow-sm shrink-0 active:scale-95 ${
            set.completed
              ? 'bg-primary text-primary-foreground shadow-primary/25 hover:brightness-110'
              : 'bg-muted/70 text-muted-foreground hover:bg-primary/20 hover:text-primary border border-border/50 hover:border-primary/40'
          }`}
          title={set.completed ? 'Set completed (click to undo)' : 'Click to complete set with done reps'}
        >
          <Check className={`w-3.5 h-3.5 ${set.completed ? 'stroke-[3]' : 'opacity-40'}`} />
          <span>{set.completed ? 'Done' : 'Set'}</span>
        </button>
      </div>
    </div>
  );
};

export default TodayWorkout;
