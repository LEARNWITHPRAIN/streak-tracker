import React, { useState, useEffect, useCallback } from 'react';
import { Utensils, Plus, Trash2, Apple } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ProgressCircle } from '@/components/ProgressCircle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface MealLog {
  id: string;
  meal_name: string;
  calories: number;
  created_at: string;
}

export const DietTracker: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [calorieGoal, setCalorieGoal] = useState(2500);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mealName, setMealName] = useState('');
  const [mealCalories, setMealCalories] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const fetchMeals = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching meals:', error);
    } else {
      setMeals(data || []);
    }
  }, [user, today]);

  const fetchCalorieGoal = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('calorie_goal')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!error && data?.calorie_goal) {
      setCalorieGoal(data.calorie_goal);
    }
  }, [user]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchMeals(), fetchCalorieGoal()]);
      setLoading(false);
    };
    loadData();
  }, [fetchMeals, fetchCalorieGoal]);

  const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);
  const progressPercentage = Math.min((totalCalories / calorieGoal) * 100, 100);

  const handleAddMeal = async () => {
    if (!mealName.trim() || !mealCalories || !user) return;

    const calories = parseInt(mealCalories, 10);
    if (isNaN(calories) || calories <= 0) {
      toast({
        title: 'Invalid calories',
        description: 'Please enter a valid calorie amount',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from('meal_logs').insert({
      user_id: user.id,
      meal_name: mealName.trim(),
      calories,
      date: today,
    });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to add meal. Please try again.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Meal Added',
        description: `${mealName} (${calories} kcal) added to today's log`,
      });
      setMealName('');
      setMealCalories('');
      setDialogOpen(false);
      fetchMeals();
    }

    setSubmitting(false);
  };

  const handleDeleteMeal = async (mealId: string) => {
    const { error } = await supabase
      .from('meal_logs')
      .delete()
      .eq('id', mealId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete meal',
        variant: 'destructive',
      });
    } else {
      fetchMeals();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <Utensils className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-primary text-glow">Nutrition Command</h2>
          <p className="text-xs text-muted-foreground">Track your daily fuel intake</p>
        </div>
      </div>

      {/* Calorie Progress Circle */}
      <div className="glass rounded-2xl p-6">
        <div className="flex flex-col items-center gap-4">
          <ProgressCircle percentage={progressPercentage} size={140} strokeWidth={10}>
            <Apple className="w-5 h-5 text-primary mb-1" />
            <span className="text-2xl font-bold">{totalCalories}</span>
            <span className="text-[10px] text-muted-foreground">of {calorieGoal} kcal</span>
          </ProgressCircle>
          
          <div className="text-center">
            <p className="text-base font-semibold text-primary">Daily Calories</p>
            <p className="text-xs text-muted-foreground">
              {calorieGoal - totalCalories > 0 
                ? `${calorieGoal - totalCalories} kcal remaining` 
                : 'Goal reached!'}
            </p>
          </div>
        </div>
      </div>

      {/* Today's Meals */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Today's Meals ({meals.length})
        </h3>

        {meals.length === 0 ? (
          <div className="glass rounded-xl p-8 text-center">
            <Utensils className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">No meals logged yet</p>
            <p className="text-sm text-muted-foreground/70">Start logging your nutrition</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {meals.map((meal) => (
              <div
                key={meal.id}
                className="glass rounded-xl p-4 flex items-center gap-4 transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Apple className="w-5 h-5 text-primary" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{meal.meal_name}</p>
                  <p className="text-sm text-muted-foreground">{meal.calories} kcal</p>
                </div>

                <button
                  onClick={() => handleDeleteMeal(meal.id)}
                  className="w-9 h-9 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground flex items-center justify-center transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Meal Button */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button className="w-full h-14 text-lg font-semibold" variant="glow">
            <Plus className="w-5 h-5 mr-2" />
            Log Meal
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-primary">Add Meal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="meal-name">Meal Name</Label>
              <Input
                id="meal-name"
                placeholder="e.g., Oats & Whey"
                value={mealName}
                onChange={(e) => setMealName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="calories">Calories</Label>
              <Input
                id="calories"
                type="number"
                placeholder="e.g., 450"
                value={mealCalories}
                onChange={(e) => setMealCalories(e.target.value)}
              />
            </div>
            <Button
              onClick={handleAddMeal}
              disabled={submitting || !mealName.trim() || !mealCalories}
              className="w-full h-12"
              variant="glow"
            >
              {submitting ? 'Adding...' : 'Add to Daily Total'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
