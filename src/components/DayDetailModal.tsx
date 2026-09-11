import React from 'react';
import { X, Dumbbell, TrendingUp, BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface ExerciseLog {
  exercise_id: string;
  exercise_name: string;
  sets_completed: number;
  total_sets: number;
  weight_kg?: number | null;
}

interface DayDetailModalProps {
  date: string; // YYYY-MM-DD
  logs: ExerciseLog[];
  onClose: () => void;
}

const DayDetailModal: React.FC<DayDetailModalProps> = ({ date, logs, onClose }) => {
  if (!date) return null;

  const displayDate = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const totalSets = logs.reduce((acc, l) => acc + l.total_sets, 0);
  const completedSets = logs.reduce((acc, l) => acc + Math.min(l.sets_completed, l.total_sets), 0);
  const overallPct = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

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
              <BarChart2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">{displayDate}</h2>
              <p className="text-xs text-muted-foreground">Progressive Overload Snapshot</p>
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
          <p className="text-xs text-muted-foreground mt-1.5">
            {completedSets} of {totalSets} sets completed
          </p>
        </div>

        {/* Exercise table */}
        <div className="px-5 pb-5 max-h-[55vh] overflow-y-auto">
          {logs.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground text-sm">
              No workout data logged for this day.
            </div>
          ) : (
            <div className="space-y-2 mt-3">
              {/* Table header */}
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 pb-1 border-b border-border/40">
                <span>Exercise</span>
                <span className="text-center">Sets</span>
                <span className="text-center">Weight</span>
                <span className="text-center">Done</span>
              </div>

              {logs.map((log) => {
                const pct = log.total_sets > 0
                  ? Math.round((Math.min(log.sets_completed, log.total_sets) / log.total_sets) * 100)
                  : 0;
                const isComplete = pct >= 100;

                return (
                  <div
                    key={log.exercise_id}
                    className={`grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center rounded-xl px-3 py-2.5 border transition-colors
                      ${isComplete
                        ? 'bg-primary/5 border-primary/20'
                        : 'bg-muted/30 border-border/40'
                      }`}
                  >
                    {/* Name */}
                    <div className="flex items-center gap-2 min-w-0">
                      <Dumbbell className={`w-3.5 h-3.5 shrink-0 ${isComplete ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className="text-sm font-semibold truncate text-foreground">{log.exercise_name}</span>
                    </div>

                    {/* Sets done / total */}
                    <span className="text-xs font-mono text-center whitespace-nowrap text-muted-foreground">
                      {log.sets_completed}/{log.total_sets}
                    </span>

                    {/* Weight */}
                    <span className="text-center">
                      {log.weight_kg != null ? (
                        <Badge variant="outline" className="text-[10px] font-mono bg-background/60 px-1.5">
                          {log.weight_kg} kg
                        </Badge>
                      ) : (
                        <span className="text-[10px] text-muted-foreground font-medium">BW</span>
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
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
};

export default DayDetailModal;
