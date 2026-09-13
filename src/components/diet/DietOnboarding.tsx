import React, { useState } from 'react';
import { 
  Flame, 
  Target, 
  Activity, 
  User, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  Check, 
  SlidersHorizontal 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  MacroCalculationInput, 
  CalculatedMacros, 
  calculateMacros 
} from '@/hooks/useDiet';

interface DietOnboardingProps {
  onComplete: (input: MacroCalculationInput, customGoals?: Partial<CalculatedMacros>) => Promise<boolean>;
  initialData?: Partial<MacroCalculationInput>;
}

export const DietOnboarding: React.FC<DietOnboardingProps> = ({ onComplete, initialData }) => {
  const [step, setStep] = useState<number>(1);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<MacroCalculationInput>({
    age: initialData?.age || 24,
    gender: initialData?.gender || 'male',
    height_cm: initialData?.height_cm || 175,
    weight_kg: initialData?.weight_kg || 70,
    activity_level: initialData?.activity_level || 'moderately_active',
    goal: initialData?.goal || 'gain_muscle',
  });

  const [customGoals, setCustomGoals] = useState<CalculatedMacros | null>(null);
  const [isEditingGoals, setIsEditingGoals] = useState(false);

  // Compute calculated whenever we reach step 4 or preview
  const calculated = calculateMacros(formData);
  const activeGoals = customGoals || calculated;

  const handleNext = () => {
    if (step < 4) {
      if (step === 3 && !customGoals) {
        setCustomGoals(calculateMacros(formData));
      }
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await onComplete(formData, customGoals || undefined);
    } finally {
      setSaving(false);
    }
  };

  const activityOptions = [
    { id: 'sedentary', label: 'Sedentary', desc: 'Desk job, little to no exercise', multiplier: '1.2x' },
    { id: 'lightly_active', label: 'Lightly Active', desc: '1-3 days of light workouts / week', multiplier: '1.375x' },
    { id: 'moderately_active', label: 'Moderately Active', desc: '3-5 days of moderate workouts / week', multiplier: '1.55x' },
    { id: 'very_active', label: 'Very Active', desc: '6-7 days of intense workouts / week', multiplier: '1.725x' },
    { id: 'super_active', label: 'Super Active', desc: 'Athlete / 2x daily training', multiplier: '1.9x' },
  ] as const;

  const goalOptions = [
    { 
      id: 'lose_fat', 
      label: 'Cut & Shred', 
      desc: 'Caloric deficit (-15%) with high protein to retain muscle', 
      badge: 'Fat Loss', 
      accent: 'from-amber-500/20 to-orange-500/10 border-orange-500/40 text-orange-400' 
    },
    { 
      id: 'maintain', 
      label: 'Lean Maintenance', 
      desc: 'Balanced maintenance calories to optimize energy & recovery', 
      badge: 'Balance', 
      accent: 'from-blue-500/20 to-cyan-500/10 border-blue-500/40 text-blue-400' 
    },
    { 
      id: 'gain_muscle', 
      label: 'Hypertrophy Bulk', 
      desc: 'Caloric surplus (+10%) with max protein for muscle building', 
      badge: 'Muscle Mass', 
      accent: 'from-purple-500/20 to-pink-500/10 border-purple-500/40 text-purple-400' 
    },
  ] as const;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-card/60 backdrop-blur-xl border border-border/80 rounded-2xl shadow-2xl relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Step progress */}
      <div className="relative mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Yodha Diet Architect</h2>
              <p className="text-xs text-muted-foreground">Science-backed macro formula tailored for warriors</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
            Step {step} of 4
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-muted/40 h-1.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-pink-500 transition-all duration-300 ease-out"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      <div>
        {/* STEP 1: Body Metrics */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <User className="w-4 h-4 text-purple-400" /> What are your body metrics?
              </h3>
              <p className="text-xs text-muted-foreground">These allow us to calculate your Basal Metabolic Rate (BMR) with clinical accuracy.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Gender</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, gender: 'male' })}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      formData.gender === 'male'
                        ? 'border-purple-500 bg-purple-500/20 text-purple-300 shadow-sm'
                        : 'border-border bg-background/50 text-muted-foreground hover:border-purple-500/40'
                    }`}
                  >
                    Male ⚡
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, gender: 'female' })}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      formData.gender === 'female'
                        ? 'border-purple-500 bg-purple-500/20 text-purple-300 shadow-sm'
                        : 'border-border bg-background/50 text-muted-foreground hover:border-purple-500/40'
                    }`}
                  >
                    Female 🌸
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Age</Label>
                <div className="relative">
                  <Input
                    type="number"
                    min={12}
                    max={100}
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) || 0 })}
                    className="bg-background/50 border-border text-foreground pr-12 font-mono"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">years</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Height</Label>
                <div className="relative">
                  <Input
                    type="number"
                    min={100}
                    max={250}
                    value={formData.height_cm}
                    onChange={(e) => setFormData({ ...formData, height_cm: Number(e.target.value) || 0 })}
                    className="bg-background/50 border-border text-foreground pr-10 font-mono"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">cm</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Current Weight</Label>
                <div className="relative">
                  <Input
                    type="number"
                    min={30}
                    max={250}
                    step="0.5"
                    value={formData.weight_kg}
                    onChange={(e) => setFormData({ ...formData, weight_kg: Number(e.target.value) || 0 })}
                    className="bg-background/50 border-border text-foreground pr-10 font-mono"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">kg</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Activity Level */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-400" /> How active is your lifestyle?
              </h3>
              <p className="text-xs text-muted-foreground">Determines your Total Daily Energy Expenditure (TDEE).</p>
            </div>

            <div className="space-y-2">
              {activityOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, activity_level: opt.id })}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                    formData.activity_level === opt.id
                      ? 'border-purple-500 bg-purple-500/15 shadow-md shadow-purple-500/10'
                      : 'border-border/70 bg-background/40 hover:bg-background/80 hover:border-purple-500/30'
                  }`}
                >
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-foreground">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </div>
                  <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-muted text-muted-foreground">
                    {opt.multiplier}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: Fitness Goal */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-400" /> What is your primary objective?
              </h3>
              <p className="text-xs text-muted-foreground">Select your goal so we can compute the ideal calorie surplus/deficit and macro ratio.</p>
            </div>

            <div className="space-y-3">
              {goalOptions.map((goal) => (
                <button
                  key={goal.id}
                  type="button"
                  onClick={() => {
                    const newForm = { ...formData, goal: goal.id };
                    setFormData(newForm);
                    setCustomGoals(calculateMacros(newForm));
                  }}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    formData.goal === goal.id
                      ? `border-purple-500 bg-gradient-to-r ${goal.accent} shadow-md`
                      : 'border-border/70 bg-background/40 hover:bg-background/80 hover:border-purple-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-foreground">{goal.label}</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-background/80 border border-border text-foreground">
                      {goal.badge}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{goal.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4: Review & Customize */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-400" /> Your Calculated Target
                </h3>
                <p className="text-xs text-muted-foreground">
                  Personalized plan. You can edit any value below to match your preference.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingGoals(!isEditingGoals)}
                className="text-xs border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5" />
                {isEditingGoals ? 'Lock Values' : 'Fine Tune'}
              </Button>
            </div>

            {/* Target Big Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Calories */}
              <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-center relative">
                <span className="text-[11px] font-semibold text-orange-400 uppercase tracking-wider">Calories</span>
                {isEditingGoals ? (
                  <Input
                    type="number"
                    value={activeGoals.daily_calories}
                    onChange={(e) =>
                      setCustomGoals({
                        ...activeGoals,
                        daily_calories: Number(e.target.value) || 0,
                      })
                    }
                    className="mt-1 h-8 text-center text-base font-bold bg-background/80 border-orange-500/40"
                  />
                ) : (
                  <div className="text-xl font-extrabold text-foreground mt-1">
                    {activeGoals.daily_calories} <span className="text-xs font-normal text-muted-foreground">kcal</span>
                  </div>
                )}
              </div>

              {/* Protein */}
              <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center relative">
                <span className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider">Protein</span>
                {isEditingGoals ? (
                  <Input
                    type="number"
                    value={activeGoals.daily_protein_g}
                    onChange={(e) =>
                      setCustomGoals({
                        ...activeGoals,
                        daily_protein_g: Number(e.target.value) || 0,
                      })
                    }
                    className="mt-1 h-8 text-center text-base font-bold bg-background/80 border-purple-500/40"
                  />
                ) : (
                  <div className="text-xl font-extrabold text-foreground mt-1">
                    {activeGoals.daily_protein_g} <span className="text-xs font-normal text-muted-foreground">g</span>
                  </div>
                )}
              </div>

              {/* Carbs */}
              <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center relative">
                <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider">Carbs</span>
                {isEditingGoals ? (
                  <Input
                    type="number"
                    value={activeGoals.daily_carbs_g}
                    onChange={(e) =>
                      setCustomGoals({
                        ...activeGoals,
                        daily_carbs_g: Number(e.target.value) || 0,
                      })
                    }
                    className="mt-1 h-8 text-center text-base font-bold bg-background/80 border-blue-500/40"
                  />
                ) : (
                  <div className="text-xl font-extrabold text-foreground mt-1">
                    {activeGoals.daily_carbs_g} <span className="text-xs font-normal text-muted-foreground">g</span>
                  </div>
                )}
              </div>

              {/* Fat */}
              <div className="p-3.5 rounded-xl bg-pink-500/10 border border-pink-500/20 text-center relative">
                <span className="text-[11px] font-semibold text-pink-400 uppercase tracking-wider">Fats</span>
                {isEditingGoals ? (
                  <Input
                    type="number"
                    value={activeGoals.daily_fat_g}
                    onChange={(e) =>
                      setCustomGoals({
                        ...activeGoals,
                        daily_fat_g: Number(e.target.value) || 0,
                      })
                    }
                    className="mt-1 h-8 text-center text-base font-bold bg-background/80 border-pink-500/40"
                  />
                ) : (
                  <div className="text-xl font-extrabold text-foreground mt-1">
                    {activeGoals.daily_fat_g} <span className="text-xs font-normal text-muted-foreground">g</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick reset to computed if edited */}
            {customGoals && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setCustomGoals(calculated)}
                  className="text-xs text-muted-foreground hover:text-purple-400 underline"
                >
                  Reset to science formula
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-6 mt-6 border-t border-border/60">
        {step > 1 ? (
          <Button
            type="button"
            variant="ghost"
            onClick={handleBack}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
        ) : (
          <div />
        )}

        {step < 4 ? (
          <Button
            type="button"
            onClick={handleNext}
            className="bg-purple-600 hover:bg-purple-500 text-white"
          >
            Continue <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold shadow-lg shadow-purple-500/25"
          >
            <Check className="w-4 h-4 mr-2" /> {saving ? 'Saving Plan...' : 'Activate Diet Plan'}
          </Button>
        )}
      </div>
    </div>
  );
};
