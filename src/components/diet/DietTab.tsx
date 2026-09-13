import React, { useState, useCallback } from 'react';
import { useDiet } from '@/hooks/useDiet';
import { useMealLogs, dateStrLabel } from '@/hooks/useMealLogs';
import { DietOnboarding } from './DietOnboarding';
import { DailyMacroProgress } from './DailyMacroProgress';
import { ManualMealEntry } from './ManualMealEntry';
import { MealUploader } from './MealUploader';
import { MealCard } from './MealCard';
import { MacroGoalEditor } from './MacroGoalEditor';
import {
  Utensils,
  SlidersHorizontal,
  RotateCcw,
  Loader2,
  Salad,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  History,
  ChevronDown,
  ChevronUp,
  Flame,
  Beef,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ── 7-day history summary chip ────────────────────────────────────────────────
function getLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    );
  }
  return days;
}

function shortDayLabel(dateStr: string): string {
  const today = (() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
  })();
  if (dateStr === today) return 'Today';
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
}

export const DietTab: React.FC = () => {
  const { dietProfile, loading: dietLoading, saveDietProfile, updateGoals } = useDiet();
  const {
    meals,
    loading: mealsLoading,
    totals,
    addMeal,
    deleteMeal,
    selectedDateStr,
    isToday,
    goToPrevDay,
    goToNextDay,
    goToToday,
    goToDate,
    dateLabel,
  } = useMealLogs();

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [showOnboardingReset, setShowOnboardingReset] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Lightweight per-day summary: we load them client-side only when history panel opens
  const last7Days = getLast7Days();

  if (dietLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Loading your personalized nutrition plan...</p>
      </div>
    );
  }

  if (!dietProfile || showOnboardingReset) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-4">
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-semibold">
            <Salad className="w-3.5 h-3.5" /> Nutrition Engine
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Calculate Your Daily Diet Blueprint
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Answer a few quick questions to compute your exact calorie, protein, carb, and fat targets.
          </p>
        </div>

        <DietOnboarding
          onComplete={async (input, customGoals) => {
            const ok = await saveDietProfile(input, customGoals);
            if (ok) setShowOnboardingReset(false);
            return ok;
          }}
          initialData={dietProfile || undefined}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* ── Top Banner ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-card/60 backdrop-blur-xl border border-border/80 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-primary-foreground shadow-md shadow-primary/20">
            <Utensils className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-foreground">Diet &amp; Fuel Tracker</h2>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">
                {dietProfile.goal === 'lose_fat'
                  ? 'Fat Loss'
                  : dietProfile.goal === 'gain_muscle'
                  ? 'Muscle Hypertrophy'
                  : 'Maintenance'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Target: <span className="text-primary font-bold">{dietProfile.daily_calories} kcal</span> ·{' '}
              <span className="text-primary font-bold">{dietProfile.daily_protein_g}g Protein</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditorOpen(true)}
            className="text-xs border-border/80 hover:border-primary/40 hover:bg-primary/10 text-foreground rounded-xl"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5 text-primary" />
            Edit Targets
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowOnboardingReset(true)}
            className="text-xs text-muted-foreground hover:text-foreground rounded-xl"
            title="Recalculate BMR and TDEE"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Recalculate
          </Button>
        </div>
      </div>

      {/* ── Progress Bars ─────────────────────────────────────────────────────── */}
      <DailyMacroProgress totals={totals} targets={dietProfile} />

      {/* ── Action Zone: AI Scanner + Manual Entry ────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4">
        <MealUploader onMealDetected={addMeal} />
        <ManualMealEntry onAddMeal={addMeal} />
      </div>

      {/* ── Today's / Selected Day's Meals ────────────────────────────────────── */}
      <div className="space-y-3">
        {/* Date Navigation Header */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-primary" />
            <span>{dateLabel}'s Logged Meals</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted font-mono font-medium text-muted-foreground">
              {mealsLoading ? '…' : meals.length}
            </span>
          </h3>

          <div className="flex items-center gap-1">
            <button
              onClick={goToPrevDay}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              title="Previous day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {!isToday && (
              <button
                onClick={goToToday}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-primary/15 text-primary hover:bg-primary/25 transition-colors border border-primary/30"
              >
                Today
              </button>
            )}

            <button
              onClick={goToNextDay}
              disabled={isToday}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
              title="Next day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Meal Cards */}
        {mealsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : meals.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-border/80 text-center bg-card/20 space-y-2">
            <Utensils className="w-8 h-8 text-muted-foreground/40 mx-auto" />
            <p className="text-sm font-semibold text-muted-foreground">
              No meals logged for {dateLabel.toLowerCase()}
            </p>
            <p className="text-xs text-muted-foreground/70">
              {isToday
                ? 'Use the manual form or snap a photo of your plate to start tracking!'
                : 'No meals were logged on this day.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {meals.map((meal) => (
              <MealCard key={meal.id} meal={meal} onDelete={deleteMeal} />
            ))}
          </div>
        )}
      </div>

      {/* ── 7-Day History Panel ───────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border/70 bg-card/40 overflow-hidden">
        <button
          onClick={() => setShowHistory((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-2 text-sm font-bold text-foreground">
            <History className="w-4 h-4 text-primary" />
            <span>7-Day Meal History</span>
          </div>
          {showHistory ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </button>

        {showHistory && (
          <div className="px-4 pb-4 pt-1 border-t border-border/50">
            <p className="text-xs text-muted-foreground mb-3">
              Click a day to view its meals and macros.
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
              {last7Days.map((dateStr) => {
                const isSelected = dateStr === selectedDateStr;
                const label = shortDayLabel(dateStr);
                return (
                  <button
                    key={dateStr}
                    onClick={() => goToDate(dateStr)}
                    className={`relative flex flex-col items-center gap-1 p-2.5 rounded-xl border text-center transition-all duration-200 ${
                      isSelected
                        ? 'bg-primary/20 border-primary/50 text-primary shadow-md shadow-primary/10'
                        : 'bg-card/50 border-border/60 hover:bg-muted/40 hover:border-primary/30 text-muted-foreground'
                    }`}
                  >
                    <span className={`text-[11px] font-bold ${isSelected ? 'text-primary' : ''}`}>
                      {label}
                    </span>
                    {/* Mini macro indicators */}
                    <div className="flex items-center gap-1 mt-0.5">
                      <Flame className="w-2.5 h-2.5 text-orange-400" />
                      <Beef className="w-2.5 h-2.5 text-primary" />
                    </div>
                    {isSelected && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected day summary from already-loaded data */}
            {!mealsLoading && meals.length > 0 && (
              <div className="mt-4 p-3.5 rounded-xl bg-gradient-to-r from-primary/10 to-orange-500/5 border border-primary/20">
                <p className="text-xs font-bold text-foreground mb-2">
                  {dateLabel} Summary
                </p>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <div className="text-[10px] text-orange-400 font-semibold">Calories</div>
                    <div className="text-sm font-extrabold text-foreground font-mono">
                      {Math.round(totals.calories)}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      / {dietProfile.daily_calories}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-primary font-semibold">Protein</div>
                    <div className="text-sm font-extrabold text-foreground font-mono">
                      {Math.round(totals.protein)}g
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      / {dietProfile.daily_protein_g}g
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-blue-400 font-semibold">Carbs</div>
                    <div className="text-sm font-extrabold text-foreground font-mono">
                      {Math.round(totals.carbs)}g
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      / {dietProfile.daily_carbs_g ?? '—'}g
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-pink-400 font-semibold">Fat</div>
                    <div className="text-sm font-extrabold text-foreground font-mono">
                      {Math.round(totals.fat)}g
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      / {dietProfile.daily_fat_g ?? '—'}g
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Macro Goal Editor Modal ────────────────────────────────────────────── */}
      <MacroGoalEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        dietProfile={dietProfile}
        onSave={updateGoals}
        onResetToCalculated={() => setShowOnboardingReset(true)}
      />
    </div>
  );
};
