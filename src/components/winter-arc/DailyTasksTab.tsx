import React, { useMemo } from 'react';
import { CheckCircle2, Circle, Flame, Zap, Calendar } from 'lucide-react';
import { WinterArcTask, TaskProgress, WinterArcStreak, UserSettings, DAILY_XP_CEILING } from '@/hooks/useWinterArc';
import { VariableStepper } from './VariableStepper';

// Quick-add chip configs per task name keyword
const QUICK_ADD_CHIPS: Record<string, number[]> = {
  exercise:   [10, 25, 50],
  meditation: [5, 10, 20],
  work:       [1, 2, 4],
  study:      [1, 2, 4],
  reading:    [5, 10, 20],
};

function getQuickAddChips(taskName: string, stepIncrement: number): number[] {
  const lower = taskName.toLowerCase();
  for (const key of Object.keys(QUICK_ADD_CHIPS)) {
    if (lower.includes(key)) return QUICK_ADD_CHIPS[key];
  }
  // Fallback: 2x, 5x, 10x the step
  return [stepIncrement * 2, stepIncrement * 5, stepIncrement * 10];
}

interface DailyTasksTabProps {
  tasks: WinterArcTask[];
  todayProgress: Record<string, TaskProgress>;
  streak: WinterArcStreak;
  arcDayCount: number;
  userSettings: UserSettings;
  todayTotalXP: number;
  onFixedToggle: (taskId: string, checked: boolean) => void;
  onVariableChange: (taskId: string, units: number) => void;
}

export const DailyTasksTab: React.FC<DailyTasksTabProps> = ({
  tasks,
  todayProgress,
  streak,
  arcDayCount,
  userSettings,
  todayTotalXP,
  onFixedToggle,
  onVariableChange,
}) => {
  const fixedTasks = useMemo(() => tasks.filter(t => t.task_type === 'fixed'), [tasks]);
  const variableTasks = useMemo(() => tasks.filter(t => t.task_type === 'variable'), [tasks]);

  const xpPercent = Math.min(100, Math.round((todayTotalXP / DAILY_XP_CEILING) * 100));
  const completedFixed = fixedTasks.filter(t => (todayProgress[t.id]?.units_logged ?? 0) >= 1).length;

  return (
    <div className="space-y-6 animate-scale-in">

      {/* XP Summary banner */}
      <div className="glass rounded-2xl p-5 border border-border/60 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Arc day count */}
            <div className="flex flex-col items-center px-4 py-3 rounded-xl bg-primary/15 border border-primary/30">
              <span className="text-2xl font-black text-primary leading-none">{arcDayCount}</span>
              <span className="text-[10px] text-muted-foreground font-medium mt-0.5">Day of Arc</span>
            </div>
            {/* Streak */}
            <div className="flex flex-col items-center px-4 py-3 rounded-xl bg-orange-500/15 border border-orange-500/30">
              <div className="flex items-center gap-1">
                <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
                <span className="text-2xl font-black text-orange-500 leading-none">{streak.current_streak}</span>
              </div>
              <span className="text-[10px] text-muted-foreground font-medium mt-0.5">Day Streak</span>
            </div>
          </div>

          {/* XP info */}
          <div className="flex-1 w-full sm:w-auto space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-foreground">{Math.round(todayTotalXP)} / {DAILY_XP_CEILING} XP today</span>
              </div>
              <span className="text-xs text-muted-foreground">{xpPercent}%</span>
            </div>
            <div className="h-3 bg-muted/70 rounded-full overflow-hidden p-0.5 border border-border/30">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{
                  width: `${xpPercent}%`,
                  boxShadow: xpPercent > 0 ? '0 0 12px hsl(var(--primary) / 0.6)' : 'none',
                }}
              />
            </div>
          </div>
        </div>

        {/* Streak milestone note */}
        {streak.current_streak > 0 && streak.current_streak % 7 === 0 && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-semibold">
            <Flame className="w-3.5 h-3.5" />
            7-day streak bonus! +25 XP has been awarded 🏆
          </div>
        )}
      </div>

      {/* Fixed Tasks */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Fixed Tasks</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground">
            {completedFixed}/{fixedTasks.length} done
          </span>
        </div>
        <div className="space-y-2">
          {fixedTasks.map(task => {
            const progress = todayProgress[task.id];
            const checked = (progress?.units_logged ?? 0) >= 1;
            const displayName = task.task_name === 'Social Media Limit'
              ? `Stayed under my ${userSettings.social_media_limit_minutes} min social media limit`
              : task.task_name;

            return (
              <button
                key={task.id}
                onClick={() => onFixedToggle(task.id, !checked)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all duration-200 ${
                  checked
                    ? 'bg-primary/10 border-primary/40 shadow-sm shadow-primary/10'
                    : 'glass border-border/40 hover:border-primary/30 hover:bg-muted/50'
                }`}
              >
                <div className="shrink-0">
                  {checked
                    ? <CheckCircle2 className="w-6 h-6 text-primary" />
                    : <Circle className="w-6 h-6 text-muted-foreground/50" />
                  }
                </div>
                <span className={`flex-1 text-sm font-medium ${checked ? 'text-primary' : 'text-foreground'}`}>
                  {displayName}
                </span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                  checked
                    ? 'bg-primary/20 text-primary border-primary/30'
                    : 'bg-muted/50 text-muted-foreground border-border/40'
                }`}>
                  +{task.xp_flat} XP
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Variable Tasks */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Track Your Progress</h3>
        </div>
        <div className="space-y-3">
          {variableTasks.map(task => {
            const progress = todayProgress[task.id];
            const currentUnits = progress?.units_logged ?? 0;
            const quickChips = getQuickAddChips(task.task_name, task.step_increment ?? 1);
            const maxXp = task.daily_unit_cap != null && task.xp_rate != null
              ? Math.round(task.daily_unit_cap * task.xp_rate)
              : null;

            return (
              <div
                key={task.id}
                className={`glass rounded-2xl p-5 border transition-all duration-200 ${
                  currentUnits > 0
                    ? 'border-primary/30 bg-primary/5'
                    : 'border-border/40'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-bold text-foreground">{task.task_name}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {task.xp_rate} XP per {task.unit_label}
                      {maxXp != null && ` · Max ${maxXp} XP`}
                    </p>
                  </div>
                  {currentUnits > 0 && (
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/15 border border-primary/30">
                      <Zap className="w-3.5 h-3.5 text-primary" />
                      <span className="text-xs font-bold text-primary">
                        {Math.round(progress?.capped_xp_earned ?? 0)} XP
                      </span>
                    </div>
                  )}
                </div>
                <VariableStepper
                  taskId={task.id}
                  unitLabel={task.unit_label ?? 'units'}
                  value={currentUnits}
                  stepIncrement={task.step_increment ?? 1}
                  dailyUnitCap={task.daily_unit_cap ?? null}
                  xpRate={task.xp_rate ?? 0}
                  quickAddChips={quickChips}
                  onChange={onVariableChange}
                />
              </div>
            );
          })}
        </div>
      </section>

      {/* Today's date */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-2">
        <Calendar className="w-3.5 h-3.5" />
        <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
      </div>
    </div>
  );
};
