import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface MealLog {
  id: string;
  user_id: string;
  logged_at: string;
  meal_name: string;
  calories_kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  source: 'manual' | 'ai_scan';
  notes?: string | null;
  created_at?: string;
}

export interface NewMealInput {
  meal_name: string;
  calories_kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g?: number;
  source?: 'manual' | 'ai_scan';
  notes?: string;
}

export function useMealLogs(selectedDate: Date = new Date()) {
  const { user } = useAuth();
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Start & end of selected day (local time converted to ISO)
  const dateRange = useMemo(() => {
    const start = new Date(selectedDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(selectedDate);
    end.setHours(23, 59, 59, 999);
    return {
      start: start.toISOString(),
      end: end.toISOString(),
    };
  }, [selectedDate]);

  const fetchMeals = useCallback(async () => {
    if (!user) {
      setMeals([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('meal_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('logged_at', dateRange.start)
        .lte('logged_at', dateRange.end)
        .order('logged_at', { ascending: false });

      if (error) throw error;
      setMeals((data as MealLog[]) || []);
    } catch (err) {
      console.error('Error fetching meals:', err);
    } finally {
      setLoading(false);
    }
  }, [user, dateRange]);

  useEffect(() => {
    fetchMeals();
  }, [fetchMeals]);

  const addMeal = useCallback(
    async (input: NewMealInput): Promise<boolean> => {
      if (!user) {
        toast.error('Please sign in to log meals');
        return false;
      }

      try {
        const payload = {
          user_id: user.id,
          meal_name: input.meal_name.trim(),
          calories_kcal: Number(input.calories_kcal) || 0,
          protein_g: Number(input.protein_g) || 0,
          carbs_g: Number(input.carbs_g) || 0,
          fat_g: Number(input.fat_g) || 0,
          fiber_g: Number(input.fiber_g) || 0,
          source: input.source || 'manual',
          notes: input.notes || null,
          logged_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
          .from('meal_logs')
          .insert(payload)
          .select()
          .single();

        if (error) throw error;

        setMeals((prev) => [data as MealLog, ...prev]);
        toast.success(`Logged "${input.meal_name}"! 🍽️`);
        return true;
      } catch (err) {
        console.error('Error logging meal:', err);
        toast.error('Failed to log meal. Please try again.');
        return false;
      }
    },
    [user]
  );

  const deleteMeal = useCallback(
    async (id: string): Promise<boolean> => {
      if (!user) return false;

      try {
        const { error } = await supabase
          .from('meal_logs')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;

        setMeals((prev) => prev.filter((m) => m.id !== id));
        toast.success('Meal deleted');
        return true;
      } catch (err) {
        console.error('Error deleting meal:', err);
        toast.error('Failed to delete meal');
        return false;
      }
    },
    [user]
  );

  // Totals for today
  const totals = useMemo(() => {
    return meals.reduce(
      (acc, meal) => ({
        calories: acc.calories + Number(meal.calories_kcal || 0),
        protein: acc.protein + Number(meal.protein_g || 0),
        carbs: acc.carbs + Number(meal.carbs_g || 0),
        fat: acc.fat + Number(meal.fat_g || 0),
        fiber: acc.fiber + Number(meal.fiber_g || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    );
  }, [meals]);

  return {
    meals,
    loading,
    totals,
    addMeal,
    deleteMeal,
    refetch: fetchMeals,
  };
}
