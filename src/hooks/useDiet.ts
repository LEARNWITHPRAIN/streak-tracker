import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface DietProfile {
  id: string;
  age: number;
  gender: 'male' | 'female';
  height_cm: number;
  weight_kg: number;
  activity_level: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'super_active';
  goal: 'lose_fat' | 'maintain' | 'gain_muscle';
  daily_calories: number;
  daily_protein_g: number;
  daily_carbs_g: number;
  daily_fat_g: number;
  daily_fiber_g: number;
  is_custom: boolean;
}

export interface MacroCalculationInput {
  age: number;
  gender: 'male' | 'female';
  height_cm: number;
  weight_kg: number;
  activity_level: DietProfile['activity_level'];
  goal: DietProfile['goal'];
}

export interface CalculatedMacros {
  daily_calories: number;
  daily_protein_g: number;
  daily_carbs_g: number;
  daily_fat_g: number;
  daily_fiber_g: number;
}

const ACTIVITY_MULTIPLIERS: Record<DietProfile['activity_level'], number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  super_active: 1.9,
};

export function calculateMacros(input: MacroCalculationInput): CalculatedMacros {
  // Mifflin-St Jeor BMR
  let bmr: number;
  if (input.gender === 'male') {
    bmr = 10 * input.weight_kg + 6.25 * input.height_cm - 5 * input.age + 5;
  } else {
    bmr = 10 * input.weight_kg + 6.25 * input.height_cm - 5 * input.age - 161;
  }

  const tdee = bmr * ACTIVITY_MULTIPLIERS[input.activity_level];

  // Goal adjustment
  let daily_calories: number;
  if (input.goal === 'lose_fat') {
    daily_calories = Math.round(tdee * 0.85); // -15%
  } else if (input.goal === 'gain_muscle') {
    daily_calories = Math.round(tdee * 1.10); // +10%
  } else {
    daily_calories = Math.round(tdee);
  }

  // Protein: 2.0g/kg for muscle gain, 1.8g/kg otherwise
  const proteinMultiplier = input.goal === 'gain_muscle' ? 2.2 : input.goal === 'lose_fat' ? 2.0 : 1.8;
  const daily_protein_g = Math.round(input.weight_kg * proteinMultiplier);

  // Fat: 25-30% of calories
  const fatPercent = input.goal === 'lose_fat' ? 0.25 : 0.28;
  const daily_fat_g = Math.round((daily_calories * fatPercent) / 9);

  // Carbs: remaining calories after protein + fat
  const proteinCalories = daily_protein_g * 4;
  const fatCalories = daily_fat_g * 9;
  const daily_carbs_g = Math.max(0, Math.round((daily_calories - proteinCalories - fatCalories) / 4));

  // Fiber: standard recommendation
  const daily_fiber_g = input.gender === 'male' ? 38 : 25;

  return {
    daily_calories,
    daily_protein_g,
    daily_carbs_g,
    daily_fat_g,
    daily_fiber_g,
  };
}

export function useDiet() {
  const { user } = useAuth();
  const [dietProfile, setDietProfile] = useState<DietProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDietProfile = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('diet_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setDietProfile(data as DietProfile | null);
    } catch (err) {
      console.error('Error fetching diet profile:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDietProfile();
  }, [fetchDietProfile]);

  const saveDietProfile = useCallback(
    async (
      input: MacroCalculationInput,
      customMacros?: Partial<CalculatedMacros>
    ): Promise<boolean> => {
      if (!user) return false;
      try {
        const calculated = calculateMacros(input);
        const macros = customMacros ? { ...calculated, ...customMacros } : calculated;
        const isCustom = Boolean(customMacros);

        const payload = {
          user_id: user.id,
          ...input,
          ...macros,
          is_custom: isCustom,
          updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
          .from('diet_profiles')
          .upsert(payload, { onConflict: 'user_id' })
          .select()
          .single();

        if (error) throw error;
        setDietProfile(data as DietProfile);
        toast.success('Diet profile saved! 🥗');
        return true;
      } catch (err) {
        console.error('Error saving diet profile:', err);
        toast.error('Failed to save diet profile');
        return false;
      }
    },
    [user]
  );

  const updateGoals = useCallback(
    async (goals: Partial<CalculatedMacros>): Promise<boolean> => {
      if (!user || !dietProfile) return false;
      try {
        const { data, error } = await supabase
          .from('diet_profiles')
          .update({ ...goals, is_custom: true, updated_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;
        setDietProfile(data as DietProfile);
        toast.success('Goals updated!');
        return true;
      } catch (err) {
        console.error('Error updating goals:', err);
        toast.error('Failed to update goals');
        return false;
      }
    },
    [user, dietProfile]
  );

  return {
    dietProfile,
    hasDietProfile: dietProfile !== null,
    loading,
    saveDietProfile,
    updateGoals,
    refetch: fetchDietProfile,
  };
}
