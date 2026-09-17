import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, Dumbbell, Calendar as CalendarIcon, Check, ArrowUp, ArrowDown, 
  Minus, Scale, Flame, Award, ChevronDown, Sparkles, RefreshCw, BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUserWorkouts, DaySchedule, Exercise } from '@/hooks/useUserWorkouts';
import { useWorkoutLogs } from '@/hooks/useWorkoutLogs';
import { SpreadsheetWorkoutRow } from '@/types/exercise';

export const ExerciseProgressSection: React.FC = () => {
  const { schedule, customRoutine, useSameDaily } = useUserWorkouts();
  const { fetchAllDetailedLogs } = useWorkoutLogs();

  const [allRows, setAllRows] = useState<SpreadsheetWorkoutRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>(() => {
    try {
      return localStorage.getItem('yodha_selected_progress_exercise_id') || '';
    } catch {
      return '';
    }
  });
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Load all user workout history
  const loadData = async () => {
    setLoading(true);
    try {
      const rows = await fetchAllDetailedLogs(schedule, customRoutine);
      setAllRows(rows);
    } catch (e) {
      console.error('Error loading exercise progress logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('workout-progress-updated', handleUpdate);
    return () => window.removeEventListener('workout-progress-updated', handleUpdate);
  }, [fetchAllDetailedLogs, schedule, customRoutine]);

  // Extract all available exercises across weekly schedule or custom routine
  const routineExercises = useMemo(() => {
    const list: { groupTitle: string; day: string; exercise: Exercise }[] = [];
    const seen = new Set<string>();

    if (useSameDaily && customRoutine) {
      customRoutine.exercises.forEach(ex => {
        if (!seen.has(ex.id)) {
          seen.add(ex.id);
          list.push({ groupTitle: customRoutine.title || 'Daily Routine', day: 'daily', exercise: ex });
        }
      });
    }

    if (schedule && schedule.length > 0) {
      schedule.forEach(daySchedule => {
        daySchedule.exercises.forEach(ex => {
          if (!seen.has(ex.id)) {
            seen.add(ex.id);
            list.push({ 
              groupTitle: `${daySchedule.title} (${daySchedule.shortDay})`, 
              day: daySchedule.day, 
              exercise: ex 
            });
          }
        });
      });
    }

    return list;
  }, [schedule, customRoutine, useSameDaily]);

  // Ensure an exercise is selected by default
  useEffect(() => {
    if (routineExercises.length > 0) {
      const exists = routineExercises.some(r => r.exercise.id === selectedExerciseId);
      if (!selectedExerciseId || !exists) {
        const defaultId = routineExercises[0].exercise.id;
        setSelectedExerciseId(defaultId);
        try {
          localStorage.setItem('yodha_selected_progress_exercise_id', defaultId);
        } catch {}
      }
    }
  }, [routineExercises, selectedExerciseId]);

  const handleSelectExercise = (id: string) => {
    setSelectedExerciseId(id);
    try {
      localStorage.setItem('yodha_selected_progress_exercise_id', id);
    } catch {}
  };

  // Find currently selected exercise definition
  const currentExerciseItem = useMemo(() => {
    return routineExercises.find(r => r.exercise.id === selectedExerciseId) || null;
  }, [routineExercises, selectedExerciseId]);

  // Filter and sort historical sessions for this specific exercise
  const exerciseSessions = useMemo(() => {
    if (!selectedExerciseId && !currentExerciseItem) return [];

    const exName = currentExerciseItem?.exercise.name.toLowerCase().trim();

    const filtered = allRows.filter(row => {
      if (row.exerciseId === selectedExerciseId) return true;
      if (exName && row.exerciseName?.toLowerCase().trim() === exName) return true;
      return false;
    });

    // Remove duplicates per date (keep the one with most completed sets)
    const byDate = new Map<string, SpreadsheetWorkoutRow>();
    filtered.forEach(row => {
      const existing = byDate.get(row.date);
      if (!existing || row.setsCompleted > existing.setsCompleted) {
        byDate.set(row.date, row);
      }
    });

    const list = Array.from(byDate.values());
    list.sort((a, b) => a.date.localeCompare(b.date));
    return list;
  }, [allRows, selectedExerciseId, currentExerciseItem]);

  // Max sets count across all sessions for column header generation
  const maxSetsCount = useMemo(() => {
    let count = 3;
    exerciseSessions.forEach(s => {
      if (s.sets && s.sets.length > count) {
        count = Math.min(s.sets.length, 8);
      }
    });
    return count;
  }, [exerciseSessions]);

  // Statistics calculation for the selected exercise
  const stats = useMemo(() => {
    if (exerciseSessions.length === 0) {
      return {
        prWeight: currentExerciseItem?.exercise.weight ?? null,
        bestVolume: 0,
        totalSessions: 0,
        maxRepsInSet: 0,
        weightProgressionDelta: 0,
      };
    }

    let prWeight: number | null = null;
    let bestVolume = 0;
    let maxRepsInSet = 0;

    exerciseSessions.forEach(session => {
      if (session.totalVolumeKg > bestVolume) {
        bestVolume = session.totalVolumeKg;
      }
      if (session.sets) {
        session.sets.forEach(s => {
          if (s.completed) {
            if (s.weight !== null && s.weight > 0) {
              if (prWeight === null || s.weight > prWeight) {
                prWeight = s.weight;
              }
            }
            const reps = s.doneReps !== undefined && s.doneReps !== '' ? parseInt(String(s.doneReps), 10) : parseInt(String(s.reps || '0'), 10);
            if (!isNaN(reps) && reps > maxRepsInSet) {
              maxRepsInSet = reps;
            }
          }
        });
      } else if (session.maxWeightKg) {
        if (prWeight === null || session.maxWeightKg > prWeight) {
          prWeight = session.maxWeightKg;
        }
      }
    });

    const firstWeight = exerciseSessions[0]?.maxWeightKg ?? 0;
    const lastWeight = exerciseSessions[exerciseSessions.length - 1]?.maxWeightKg ?? 0;
    const weightProgressionDelta = lastWeight - firstWeight;

    return {
      prWeight,
      bestVolume,
      totalSessions: exerciseSessions.length,
      maxRepsInSet,
      weightProgressionDelta,
    };
  }, [exerciseSessions, currentExerciseItem]);

  // Sorted list for table display (user can choose newest first or oldest first)
  const displaySessions = useMemo(() => {
    const list = [...exerciseSessions];
    if (sortOrder === 'desc') {
      list.reverse();
    }
    return list;
  }, [exerciseSessions, sortOrder]);

  return (
    <div className="space-y-6 animate-scale-in max-w-full overflow-hidden">
      {/* ── Top Header & Exercise Selector Card ── */}
      <div className="glass rounded-2xl p-4 sm:p-6 border border-border/60 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary shrink-0 shadow-md shadow-primary/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-foreground">Exercise Progress & Overload</h2>
              <p className="text-xs text-muted-foreground">
                Track your weights, reps, and progression history set-by-set
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={loadData}
            disabled={loading}
            className="rounded-xl border-border/60 hover:bg-muted/70 text-xs self-start sm:self-auto h-9"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Exercise Dropdown Trigger */}
        <div className="pt-2">
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
            Select Exercise from Routine
          </label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="w-full flex items-center justify-between p-3.5 rounded-xl bg-card/90 hover:bg-card border border-border/70 hover:border-primary/50 text-left transition-all group focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Dumbbell className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm sm:text-base text-foreground truncate group-hover:text-primary transition-colors">
                        {currentExerciseItem?.exercise.name || 'Select an exercise'}
                      </span>
                      {currentExerciseItem && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/30 shrink-0">
                          {currentExerciseItem.exercise.weight !== null && currentExerciseItem.exercise.weight !== undefined
                            ? `${currentExerciseItem.exercise.weight} kg`
                            : 'BW'}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {currentExerciseItem?.groupTitle || 'Weekly Routine'} • {exerciseSessions.length} session{exerciseSessions.length !== 1 ? 's' : ''} logged
                    </p>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-primary shrink-0 transition-transform group-data-[state=open]:rotate-180" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start" className="w-[310px] sm:w-[420px] max-h-[380px] overflow-y-auto p-1.5 bg-card/95 backdrop-blur-2xl border border-border/80 shadow-2xl rounded-2xl">
              <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1.5">
                Exercises in Your Routines
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="my-1 bg-border/40" />

              {routineExercises.map(({ groupTitle, exercise }) => {
                const isSelected = exercise.id === selectedExerciseId;
                return (
                  <DropdownMenuItem
                    key={exercise.id}
                    onClick={() => handleSelectExercise(exercise.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all my-0.5 ${
                      isSelected ? 'bg-primary/20 text-primary font-bold' : 'hover:bg-muted/60 text-foreground'
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="text-xs sm:text-sm font-semibold truncate">{exercise.name}</div>
                      <div className="text-[10px] text-muted-foreground truncate">
                        {groupTitle} • {exercise.setsReps}
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Key Performance Indicators (Mobile Grid) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-card/70 border border-border/60 flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Top Weight</span>
            <Scale className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="text-lg sm:text-2xl font-bold font-mono text-foreground">
            {stats.prWeight !== null && stats.prWeight > 0 ? `${stats.prWeight} kg` : 'Bodyweight'}
          </div>
          {stats.weightProgressionDelta !== 0 && (
            <div className={`text-[10px] font-semibold flex items-center gap-0.5 mt-0.5 ${
              stats.weightProgressionDelta > 0 ? 'text-emerald-500' : 'text-red-400'
            }`}>
              {stats.weightProgressionDelta > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
              {stats.weightProgressionDelta > 0 ? '+' : ''}{stats.weightProgressionDelta} kg all-time
            </div>
          )}
        </div>

        <div className="p-3.5 rounded-2xl bg-card/70 border border-border/60 flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Best Reps</span>
            <Award className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-lg sm:text-2xl font-bold font-mono text-foreground">
            {stats.maxRepsInSet > 0 ? `${stats.maxRepsInSet} reps` : '—'}
          </div>
          <span className="text-[10px] text-muted-foreground mt-0.5">Top single set reps</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-card/70 border border-border/60 flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Top Volume</span>
            <Flame className="w-3.5 h-3.5 text-orange-500" />
          </div>
          <div className="text-lg sm:text-2xl font-bold font-mono text-primary">
            {stats.bestVolume > 0 ? `${stats.bestVolume.toLocaleString()} kg` : '—'}
          </div>
          <span className="text-[10px] text-muted-foreground mt-0.5">Best session volume</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-card/70 border border-border/60 flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Sessions</span>
            <BarChart3 className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="text-lg sm:text-2xl font-bold font-mono text-foreground">
            {stats.totalSessions}
          </div>
          <span className="text-[10px] text-muted-foreground mt-0.5">Total workouts tracked</span>
        </div>
      </div>

      {/* ── Progressive Overload Sets Table ── */}
      <div className="glass rounded-2xl p-4 sm:p-6 border border-border/60 shadow-xl space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h3 className="font-bold text-base sm:text-lg text-foreground flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-primary" />
              Sets & Weight History
            </h3>
            <p className="text-xs text-muted-foreground">
              Scroll horizontally on mobile to view all completed sets
            </p>
          </div>

          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/40">
            <button
              type="button"
              onClick={() => setSortOrder('desc')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                sortOrder === 'desc' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Newest First
            </button>
            <button
              type="button"
              onClick={() => setSortOrder('asc')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                sortOrder === 'asc' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Oldest First
            </button>
          </div>
        </div>

        {exerciseSessions.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-3 bg-muted/20 border border-dashed border-border/80 rounded-2xl">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Dumbbell className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h4 className="font-bold text-base text-foreground">No Logs Yet for this Exercise</h4>
              <p className="text-xs text-muted-foreground">
                Perform and check off your sets in <strong>Today's Workout</strong> tab to automatically build your progressive overload history table here.
              </p>
            </div>
            {currentExerciseItem && (
              <Badge variant="outline" className="text-xs bg-background/60 border-primary/30 text-primary">
                Configured: {currentExerciseItem.exercise.setsReps} {currentExerciseItem.exercise.weight ? `@ ${currentExerciseItem.exercise.weight}kg` : ''}
              </Badge>
            )}
          </div>
        ) : (
          <div className="w-full overflow-x-auto rounded-2xl border border-border/60 bg-background/50 scrollbar-thin">
            <table className="w-full border-collapse text-left text-xs sm:text-sm min-w-[560px]">
              <thead>
                <tr className="border-b border-border/70 bg-muted/40 text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
                  <th className="py-3 px-3.5 sticky left-0 z-10 bg-muted/90 backdrop-blur-md min-w-[110px]">
                    Date & Day
                  </th>
                  {Array.from({ length: maxSetsCount }).map((_, idx) => (
                    <th key={idx} className="py-3 px-3 text-center min-w-[90px]">
                      Set {idx + 1}
                    </th>
                  ))}
                  <th className="py-3 px-3 text-center min-w-[85px]">
                    Top Wt
                  </th>
                  <th className="py-3 px-3 text-right pr-4 min-w-[90px]">
                    Volume
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-mono">
                {displaySessions.map((session, rowIdx) => {
                  const prevSession = sortOrder === 'desc' 
                    ? displaySessions[rowIdx + 1] 
                    : displaySessions[rowIdx - 1];

                  const vDiff = prevSession ? session.totalVolumeKg - prevSession.totalVolumeKg : 0;
                  const wDiff = prevSession && session.maxWeightKg && prevSession.maxWeightKg 
                    ? session.maxWeightKg - prevSession.maxWeightKg 
                    : 0;

                  return (
                    <tr 
                      key={session.date}
                      className="hover:bg-primary/5 transition-colors group"
                    >
                      {/* Date Cell (Sticky on mobile scroll) */}
                      <td className="py-3 px-3.5 sticky left-0 z-10 bg-background/95 backdrop-blur-md font-sans border-r border-border/30">
                        <div className="font-bold text-foreground text-xs leading-tight whitespace-nowrap">
                          {session.date}
                        </div>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <span>{session.dayName || 'Day'}</span>
                          {session.isComplete && (
                            <Check className="w-3 h-3 text-primary stroke-[3]" />
                          )}
                        </div>
                      </td>

                      {/* Set 1, Set 2, Set 3, ... Columns */}
                      {Array.from({ length: maxSetsCount }).map((_, setIdx) => {
                        const setLog = session.sets?.[setIdx];
                        if (!setLog) {
                          return (
                            <td key={setIdx} className="py-3 px-3 text-center text-muted-foreground/30">
                              —
                            </td>
                          );
                        }

                        const wt = setLog.weight !== null && setLog.weight !== undefined && setLog.weight > 0
                          ? `${setLog.weight}kg`
                          : 'BW';
                        const reps = setLog.doneReps !== undefined && setLog.doneReps !== ''
                          ? `${setLog.doneReps}r`
                          : setLog.reps ? `${setLog.reps}r` : '';

                        const isDone = setLog.completed;

                        // Progression indicator vs previous session's same set index
                        const prevSet = prevSession?.sets?.[setIdx];
                        const wtIncreased = prevSet && setLog.weight !== null && prevSet.weight !== null && setLog.weight > prevSet.weight;
                        const repsIncreased = prevSet && prevSet.doneReps && setLog.doneReps && parseInt(String(setLog.doneReps), 10) > parseInt(String(prevSet.doneReps), 10);

                        return (
                          <td key={setIdx} className="py-2.5 px-2 text-center">
                            <div className={`inline-flex flex-col items-center justify-center p-1.5 rounded-xl border text-[11px] leading-tight min-w-[70px] transition-all ${
                              isDone
                                ? 'bg-primary/15 border-primary/40 text-primary font-bold shadow-xs'
                                : 'bg-muted/30 border-border/40 text-muted-foreground opacity-70'
                            }`}>
                              <div className="flex items-center gap-1">
                                <span>{wt}</span>
                                {wtIncreased && (
                                  <span className="text-[9px] text-emerald-400 font-bold">↑</span>
                                )}
                              </div>
                              {reps && (
                                <div className="text-[9px] opacity-80 flex items-center gap-0.5">
                                  <span>{reps}</span>
                                  {repsIncreased && <span className="text-emerald-400 font-bold">↑</span>}
                                  {isDone && <Check className="w-2.5 h-2.5 text-primary stroke-[3]" />}
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      })}

                      {/* Top Weight Cell */}
                      <td className="py-3 px-3 text-center font-bold text-foreground">
                        {session.maxWeightKg ? (
                          <div className="inline-flex items-center gap-1">
                            <span>{session.maxWeightKg}kg</span>
                            {wDiff !== 0 && (
                              <span className={`text-[10px] font-semibold ${wDiff > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {wDiff > 0 ? `+${wDiff}` : wDiff}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground font-normal">BW</span>
                        )}
                      </td>

                      {/* Volume Cell */}
                      <td className="py-3 px-3 text-right pr-4 font-bold text-primary">
                        <div>
                          {session.totalVolumeKg.toLocaleString()}
                          <span className="text-[10px] text-muted-foreground ml-0.5">kg</span>
                        </div>
                        {vDiff !== 0 && (
                          <div className={`text-[9px] font-semibold ${vDiff > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {vDiff > 0 ? `+${vDiff.toLocaleString()}` : vDiff.toLocaleString()}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExerciseProgressSection;
