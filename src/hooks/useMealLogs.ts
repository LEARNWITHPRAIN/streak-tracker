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

/** Returns a stable "YYYY-MM-DD" string for today in local timezone */
function getTodayDateStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/** Parse a "YYYY-MM-DD" string into start/end ISO timestamps in local time */
function dateStrToRange(dateStr: string): { start: string; end: string } {
  const [y, m, d] = dateStr.split('-').map(Number);
  const start = new Date(y, m - 1, d, 0, 0, 0, 0);
  const end = new Date(y, m - 1, d, 23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

/** Human-readable label for a date string */
export function dateStrLabel(dateStr: string): string {
  const today = getTodayDateStr();
  const yesterday = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();
  if (dateStr === today) return 'Today';
  if (dateStr === yesterday) return 'Yesterday';
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function useMealLogs() {
  const { user } = useAuth();

  // Stable date string — never re-creates a Date object each render
  const [selectedDateStr, setSelectedDateStr] = useState<string>(getTodayDateStr);

  const [meals, setMeals] = useState<MealLog[]>([]);
  const [loading, setLoading] = useState(true);

  const dateRange = useMemo(() => dateStrToRange(selectedDateStr), [selectedDateStr]);

  const isToday = selectedDateStr === getTodayDateStr();

  const goToPrevDay = useCallback(() => {
    setSelectedDateStr((prev) => {
      const [y, m, d] = prev.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      dt.setDate(dt.getDate() - 1);
      return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    });
  }, []);

  const goToNextDay = useCallback(() => {
    setSelectedDateStr((prev) => {
      const [y, m, d] = prev.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      dt.setDate(dt.getDate() + 1);
      return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    });
  }, []);

  const goToToday = useCallback(() => {
    setSelectedDateStr(getTodayDateStr());
  }, []);

  const goToDate = useCallback((dateStr: string) => {
    setSelectedDateStr(dateStr);
  }, []);

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
        const now = new Date();
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
          logged_at: now.toISOString(),
        };

        const { data, error } = await supabase
          .from('meal_logs')
          .insert(payload)
          .select()
          .single();

        if (error) throw error;

        // Only add optimistically if the current view is today's date
        const currentStr = getTodayDateStr();
        if (selectedDateStr === currentStr) {
          setMeals((prev) => [data as MealLog, ...prev]);
        }

        toast.success(`Logged "${input.meal_name}"! 🍽️`);
        return true;
      } catch (err) {
        console.error('Error logging meal:', err);
        toast.error('Failed to log meal. Please try again.');
        return false;
      }
    },
    [user, selectedDateStr]
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

  // Totals for selected day
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
    // Date navigation
    selectedDateStr,
    isToday,
    goToPrevDay,
    goToNextDay,
    goToToday,
    goToDate,
    dateLabel: dateStrLabel(selectedDateStr),
  };
}
