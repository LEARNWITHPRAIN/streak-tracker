import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface VariableStepperProps {
  taskId: string;
  unitLabel: string;
  value: number;
  stepIncrement: number;
  dailyUnitCap: number | null;
  xpRate: number;
  quickAddChips?: number[];
  onChange: (taskId: string, newValue: number) => void;
}

function calcXP(units: number, rate: number): number {
  return Math.round(units * rate * 10) / 10;
}

function calcCappedXP(units: number, rate: number, cap: number | null): number {
  const cappedUnits = cap != null ? Math.min(units, cap) : units;
  return Math.round(cappedUnits * rate * 10) / 10;
}

export const VariableStepper: React.FC<VariableStepperProps> = ({
  taskId,
  unitLabel,
  value,
  stepIncrement,
  dailyUnitCap,
  xpRate,
  quickAddChips,
  onChange,
}) => {
  const isCapped = dailyUnitCap != null && value >= dailyUnitCap;
  const xpEarned = calcXP(value, xpRate);
  const cappedXp = calcCappedXP(value, xpRate, dailyUnitCap);
  const maxCappedXp = dailyUnitCap != null ? Math.round(dailyUnitCap * xpRate) : null;

  const handleAdd = () => {
    onChange(taskId, value + stepIncrement);
  };

  const handleSubtract = () => {
    onChange(taskId, Math.max(0, value - stepIncrement));
  };

  const handleQuickAdd = (amount: number) => {
    onChange(taskId, value + amount);
  };

  const displayValue = Number.isInteger(value) ? value : value.toFixed(2);
  const unitDisplay = unitLabel || 'units';

  return (
    <div className="space-y-2">
      {/* Main stepper row */}
      <div className="flex items-center gap-3">
        {/* Subtract */}
        <button
          onClick={handleSubtract}
          disabled={value <= 0}
          className="w-9 h-9 rounded-xl bg-muted/60 border border-border/50 flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label={`Decrease ${unitLabel}`}
        >
          <Minus className="w-4 h-4" />
        </button>

        {/* Value display */}
        <div className="flex-1 text-center">
          <span className="text-2xl font-bold text-foreground tabular-nums">{displayValue}</span>
          <span className="text-xs text-muted-foreground ml-1.5">{unitDisplay}</span>
        </div>

        {/* Add */}
        <button
          onClick={handleAdd}
          className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary hover:bg-primary/25 transition-all"
          aria-label={`Increase ${unitLabel}`}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* XP live display */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          XP earned: <span className="font-bold text-primary">{xpEarned}</span>
          {maxCappedXp != null && (
            <span className="text-muted-foreground"> (capped: {cappedXp} / {maxCappedXp})</span>
          )}
        </span>
        {isCapped && (
          <span className="px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 text-[10px] font-semibold border border-orange-500/20">
            Cap reached
          </span>
        )}
      </div>

      {/* Cap progress bar */}
      {dailyUnitCap != null && (
        <div className="h-1.5 bg-muted/60 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isCapped ? 'bg-orange-500' : 'bg-primary'
            }`}
            style={{ width: `${Math.min(100, (value / dailyUnitCap) * 100)}%` }}
          />
        </div>
      )}

      {/* Quick-add chips */}
      {quickAddChips && quickAddChips.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {quickAddChips.map(chip => (
            <button
              key={chip}
              onClick={() => handleQuickAdd(chip)}
              className="px-2.5 py-1 rounded-lg bg-muted/50 border border-border/40 text-xs font-medium text-muted-foreground hover:bg-primary/15 hover:text-primary hover:border-primary/30 transition-all"
            >
              +{chip}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
