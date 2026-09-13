import React from 'react';
import { X, Dumbbell, TrendingUp, BarChart2, Check, Scale, Flame, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DailyExerciseSetLog } from '@/types/exercise';
import { DaySchedule } from '@/hooks/useUserWorkouts';

export interface ExerciseLog {
  exercise_id: string;
  exercise_name: string;
  sets_completed: number;
  total_sets: number;
  weight_kg?: number | null;
  sets?: DailyExerciseSetLog[];
}

interface DayDetailModalProps {
  date: string; // YYYY-MM-DD
  logs: ExerciseLog[];
  daySchedule?: DaySchedule | null;
  onClose: () => void;
}

const DayDetailModal: React.FC<DayDetailModalProps> = ({ date, logs, daySchedule, onClose }) => {
  if (!date) return null;

  const displayDate = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const totalSets = logs.reduce((acc, l) => acc + (l.sets ? l.sets.length : l.total_sets), 0);
  const completedSets = logs.reduce((acc, l) => {
    if (l.sets && l.sets.length > 0) {
      return acc + l.sets.filter(s => s.completed).length;
    }
    return acc + Math.min(l.sets_completed, l.total_sets);
  }, 0);
  const overallPct = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

  // Calculate day totals: volume and max weight
  let maxWeightLifted: number | null = null;
  let totalVolume = 0;

  logs.forEach(log => {
    if (log.sets && log.sets.length > 0) {
      log.sets.forEach(s => {
        if (s.completed && s.weight !== null && s.weight > 0) {
          if (maxWeightLifted === null || s.weight > maxWeightLifted) {
            maxWeightLifted = s.weight;
          }
          const reps = typeof s.reps === 'number' ? s.reps : parseInt(String(s.reps || '10'), 10) || 10;
          totalVolume += s.weight * reps;
        }
      });
    } else if (log.weight_kg) {
      if (maxWeightLifted === null || log.weight_kg > maxWeightLifted) {
        maxWeightLifted = log.weight_kg;
      }
      totalVolume += log.weight_kg * 10 * log.sets_completed;
    }
  });

  const isRestDay = daySchedule?.title?.toLowerCase().includes('rest') || (daySchedule && daySchedule.exercises.length === 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
      style={{ animation: 'fadeIn 0.15s ease-out' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-card border border-border/60 rounded-2xl shadow-2xl overflow-hidden"
        style={{ animation: 'scaleIn 0.15s ease-out' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/50 bg-gradient-to-r from-primary/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              {isRestDay ? (
                <Moon className="w-5 h-5 text-primary" />
              ) : (
                <BarChart2 className="w-5 h-5 text-primary" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-foreground">{displayDate}</h2>
                {daySchedule?.title && (
                  <Badge variant="outline" className="text-[10px] font-bold bg-primary/10 text-primary border-primary/30 uppercase tracking-wider">
                    {daySchedule.title}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {daySchedule?.subtitle ? daySchedule.subtitle : 'Weekly Split Routine & Progress'}
              </p>
            </div>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose} className="rounded-xl h-8 w-8">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Overall progress bar */}
        <div className="px-5 pt-4 pb-2">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-primary" />
              Overall Completion
            </span>
            <span className="text-sm font-bold text-primary">{overallPct}%</span>
          </div>
          <div className="h-2.5 bg-muted/60 rounded-full overflow-hidden border border-border/30">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${overallPct}%`,
                background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary) / 0.7))',
                boxShadow: overallPct > 0 ? '0 0 10px hsl(var(--primary) / 0.5)' : 'none',
              }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-1.5">
            <span>{completedSets} of {totalSets} sets completed</span>
            {totalVolume > 0 && (
              <span className="font-mono text-primary font-semibold">
                Vol: {totalVolume.toLocaleString()} kg
              </span>
            )}
          </div>
        </div>

        {/* Exercise table */}
        <div className="px-5 pb-5 max-h-[55vh] overflow-y-auto">
          {logs.length === 0 ? (
            <div className="py-10 px-4 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Moon className="w-6 h-6" />
              </div>
              <div className="space-y-1 max-w-xs mx-auto">
                <h3 className="text-sm font-bold text-foreground">
                  {daySchedule?.title || 'Rest Day'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {daySchedule?.subtitle || 'Scheduled rest & recovery in your weekly split. Take time to relax and let your muscles rebuild.'}
                </p>
              </div>
              <Badge variant="outline" className="text-xs font-semibold bg-primary/10 text-primary border-primary/25">
                Active Recovery & Rebuilding
              </Badge>
            </div>
          ) : (
            <div className="space-y-3 mt-3">
              {/* Table header */}
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 pb-1 border-b border-border/40">
                <span>Exercise</span>
                <span className="text-center">Sets</span>
                <span className="text-center">Top Weight</span>
                <span className="text-center">Done</span>
              </div>

              {logs.map((log) => {
                const effectiveTotal = log.sets ? log.sets.length : log.total_sets;
                const effectiveDone = log.sets 
                  ? log.sets.filter(s => s.completed).length 
                  : log.sets_completed;
                const pct = effectiveTotal > 0
                  ? Math.round((Math.min(effectiveDone, effectiveTotal) / effectiveTotal) * 100)
                  : 0;
                const isComplete = pct >= 100;

                // Determine display weight
                let displayWeight: number | null = log.weight_kg ?? null;
                if (log.sets && log.sets.length > 0) {
                  const setWeights = log.sets
                    .map(s => s.weight)
                    .filter((w): w is number => w !== null && w > 0);
                  if (setWeights.length > 0) {
                    displayWeight = Math.max(...setWeights);
                  }
                }

                return (
                  <div
                    key={log.exercise_id}
                    className={`rounded-xl p-3 border transition-colors space-y-2
                      ${isComplete
                        ? 'bg-primary/5 border-primary/20'
                        : 'bg-muted/30 border-border/40'
                      }`}
                  >
                    {/* Main Row */}
                    <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center">
                      {/* Name */}
                      <div className="flex items-center gap-2 min-w-0">
                        <Dumbbell className={`w-3.5 h-3.5 shrink-0 ${isComplete ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className="text-sm font-semibold truncate text-foreground">{log.exercise_name}</span>
                      </div>

                      {/* Sets done / total */}
                      <span className="text-xs font-mono text-center whitespace-nowrap text-muted-foreground px-1">
                        {effectiveDone}/{effectiveTotal}
                      </span>

                      {/* Weight */}
                      <span className="text-center">
                        {displayWeight !== null ? (
                          <Badge variant="outline" className="text-[10px] font-mono bg-background/60 px-1.5 text-primary border-primary/30">
                            {displayWeight} kg
                          </Badge>
                        ) : (
                          <span className="text-[10px] text-muted-foreground font-medium px-1">BW</span>
                        )}
                      </span>

                      {/* % completion */}
                      <span
                        className={`text-xs font-bold text-center tabular-nums ${
                          isComplete ? 'text-primary' : pct > 0 ? 'text-amber-500' : 'text-muted-foreground'
                        }`}
                      >
                        {pct}%
                      </span>
                    </div>

                    {/* Detailed Set-by-Set Breakdown Chips */}
                    {log.sets && log.sets.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1.5 border-t border-border/30">
                        {log.sets.map((s, idx) => {
                          const weightLabel = s.weight !== null && s.weight > 0 ? `${s.weight}kg` : 'BW';
                          const repsLabel = s.reps ? `${s.reps}r` : '';

                          return (
                            <div
                              key={idx}
                              className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md border transition-all ${
                                s.completed
                                  ? 'bg-primary/15 text-primary border-primary/35 font-semibold shadow-xs'
                                  : 'bg-background/50 text-muted-foreground border-border/40'
                              }`}
                            >
                              <span className="opacity-60">S{s.setNumber}:</span>
                              <span className="font-bold">{weightLabel}</span>
                              {repsLabel && <span className="opacity-70 text-[9px]">({repsLabel})</span>}
                              {s.completed ? (
                                <Check className="w-2.5 h-2.5 stroke-[3] text-primary" />
                              ) : (
                                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer Summary */}
        {logs.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border/50 bg-muted/20 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Scale className="w-3.5 h-3.5 text-primary" />
              <span>Top: <strong className="text-foreground">{maxWeightLifted ? `${maxWeightLifted} kg` : 'Bodyweight'}</strong></span>
            </div>
            {totalVolume > 0 && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Flame className="w-3.5 h-3.5 text-orange-500" />
                <span>Volume: <strong className="text-primary font-mono">{totalVolume.toLocaleString()} kg</strong></span>
              </div>
            )}
            <span className="text-[11px] text-muted-foreground font-medium">
              {completedSets >= totalSets
                ? '🔥 100% Completed'
                : completedSets === 0
                ? 'Weekly Split Planned (0%)'
                : `${totalSets - completedSets} sets left`}
            </span>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
};

export default DayDetailModal;

