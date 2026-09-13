import React, { useState } from 'react';
import { useDiet } from '@/hooks/useDiet';
import { useMealLogs } from '@/hooks/useMealLogs';
import { DietOnboarding } from './DietOnboarding';
import { DailyMacroProgress } from './DailyMacroProgress';
import { ManualMealEntry } from './ManualMealEntry';
import { MealUploader } from './MealUploader';
import { MealCard } from './MealCard';
import { MacroGoalEditor } from './MacroGoalEditor';
import { 
  Utensils, 
  Sparkles, 
  SlidersHorizontal, 
  Calendar as CalendarIcon, 
  RotateCcw,
  Loader2,
  Salad
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export const DietTab: React.FC = () => {
  const { dietProfile, loading: dietLoading, saveDietProfile, updateGoals } = useDiet();
  const { meals, loading: mealsLoading, totals, addMeal, deleteMeal } = useMealLogs();
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [showOnboardingReset, setShowOnboardingReset] = useState(false);

  if (dietLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Loading your personalized nutrition plan...</p>
      </div>
    );
  }

  // If user hasn't set up their diet profile yet or clicked recalculate:
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
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-card/60 backdrop-blur-xl border border-border/80 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-primary-foreground shadow-md shadow-primary/20">
            <Utensils className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-foreground">Diet & Fuel Tracker</h2>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">
                {dietProfile.goal === 'lose_fat' ? 'Fat Loss' : dietProfile.goal === 'gain_muscle' ? 'Muscle Hypertrophy' : 'Maintenance'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Target: <span className="text-primary font-bold">{dietProfile.daily_calories} kcal</span> · <span className="text-primary font-bold">{dietProfile.daily_protein_g}g Protein</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
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

      {/* Progress Bars (Percentage first, then exact numbers) */}
      <DailyMacroProgress totals={totals} targets={dietProfile} />

      {/* Action Zone: AI Meal Scanner (PRO) & Manual Meal Logger (FREE) */}
      <div className="grid grid-cols-1 gap-4">
        {/* PRO Feature: AI Camera Upload */}
        <MealUploader onMealDetected={addMeal} />

        {/* FREE Feature: Manual Meal Entry */}
        <ManualMealEntry onAddMeal={addMeal} />
      </div>

      {/* Today's Meals List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <span>Today's Logged Meals</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted font-mono font-medium text-muted-foreground">
              {meals.length}
            </span>
          </h3>
        </div>

        {mealsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : meals.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-border/80 text-center bg-card/20 space-y-2">
            <Utensils className="w-8 h-8 text-muted-foreground/40 mx-auto" />
            <p className="text-sm font-semibold text-muted-foreground">No meals logged yet today</p>
            <p className="text-xs text-muted-foreground/70">
              Use the manual form or snap a photo of your plate to start tracking your protein and calories!
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

      {/* Modal for adjusting goals */}
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
