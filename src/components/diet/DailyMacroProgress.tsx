import React from 'react';
import { Flame, Dumbbell, Wheat, Droplet, Sparkles, CheckCircle2 } from 'lucide-react';
import { DietProfile } from '@/hooks/useDiet';

interface DailyMacroProgressProps {
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  targets: DietProfile;
}

export const DailyMacroProgress: React.FC<DailyMacroProgressProps> = ({ totals, targets }) => {
  const calPercent = Math.min(150, Math.round((totals.calories / (targets.daily_calories || 1)) * 100));
  const proPercent = Math.min(150, Math.round((totals.protein / (targets.daily_protein_g || 1)) * 100));
  const carbsPercent = Math.min(150, Math.round((totals.carbs / (targets.daily_carbs_g || 1)) * 100));
  const fatPercent = Math.min(150, Math.round((totals.fat / (targets.daily_fat_g || 1)) * 100));

  const macros = [
    {
      name: 'Calories',
      percent: calPercent,
      current: Math.round(totals.calories),
      target: targets.daily_calories,
      unit: 'kcal',
      left: Math.max(0, targets.daily_calories - Math.round(totals.calories)),
      icon: Flame,
      color: 'orange',
      bgGradient: 'from-orange-600 via-amber-500 to-yellow-500',
      textAccent: 'text-orange-400',
      barBg: 'bg-orange-500',
    },
    {
      name: 'Protein',
      percent: proPercent,
      current: Math.round(totals.protein),
      target: targets.daily_protein_g,
      unit: 'g',
      left: Math.max(0, targets.daily_protein_g - Math.round(totals.protein)),
      icon: Dumbbell,
      color: 'primary',
      bgGradient: 'from-orange-500 to-amber-600',
      textAccent: 'text-primary',
      barBg: 'bg-primary',
    },
    {
      name: 'Carbs',
      percent: carbsPercent,
      current: Math.round(totals.carbs),
      target: targets.daily_carbs_g,
      unit: 'g',
      left: Math.max(0, targets.daily_carbs_g - Math.round(totals.carbs)),
      icon: Wheat,
      color: 'amber',
      bgGradient: 'from-amber-500 to-yellow-500',
      textAccent: 'text-amber-400',
      barBg: 'bg-amber-500',
    },
    {
      name: 'Fats',
      percent: fatPercent,
      current: Math.round(totals.fat),
      target: targets.daily_fat_g,
      unit: 'g',
      left: Math.max(0, targets.daily_fat_g - Math.round(totals.fat)),
      icon: Droplet,
      color: 'pink',
      bgGradient: 'from-pink-500 to-rose-500',
      textAccent: 'text-pink-400',
      barBg: 'bg-pink-500',
    },
  ];

  return (
    <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-xl p-5 shadow-xl space-y-4">
      {/* Header banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <span>Today's Nutrition Completion</span>
            {proPercent >= 100 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3" /> Protein Target Hit!
              </span>
            )}
          </h3>
          <p className="text-xs text-muted-foreground">
            Live progress measured in percentage and exact numbers
          </p>
        </div>

        <div className="text-xs font-mono text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg border border-border/60 self-start sm:self-auto">
          Calorie Target: <span className="text-foreground font-bold">{targets.daily_calories} kcal</span>
        </div>
      </div>

      {/* 4 Macro Cards: Showing First Percentage, then Numbers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {macros.map((m) => {
          const Icon = m.icon;
          const isComplete = m.percent >= 100;

          return (
            <div
              key={m.name}
              className="p-4 rounded-xl bg-background/50 border border-border/70 hover:border-border transition-all space-y-2.5 relative overflow-hidden"
            >
              {/* Macro header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Icon className={`w-4 h-4 ${m.textAccent}`} />
                  <span className="text-xs font-bold text-foreground uppercase tracking-wider">{m.name}</span>
                </div>
                {/* 1. FIRST: Prominent Percentage */}
                <span className={`text-base font-extrabold font-mono ${m.textAccent}`}>
                  {m.percent}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-muted/60 h-2.5 rounded-full overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${m.bgGradient} transition-all duration-700 ease-out`}
                  style={{ width: `${Math.min(100, m.percent)}%` }}
                />
              </div>

              {/* 2. SECOND: Numbers (Completed / Goal and Remaining) */}
              <div className="flex items-center justify-between text-xs pt-0.5">
                <span className="font-mono text-foreground font-semibold">
                  {m.current} <span className="text-[11px] text-muted-foreground font-normal">/ {m.target}{m.unit}</span>
                </span>
                <span className="text-[11px] text-muted-foreground font-mono">
                  {isComplete ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3" /> Met
                    </span>
                  ) : (
                    <span>{m.left}{m.unit} left</span>
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
