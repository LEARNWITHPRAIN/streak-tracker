import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Utensils, Plus, Trash2, Apple, Camera, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ProgressCircle } from '@/components/ProgressCircle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  protein: number;
  carbs: number;
  fats: number;
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
  const [mealProtein, setMealProtein] = useState('');
  const [mealCarbs, setMealCarbs] = useState('');
  const [mealFats, setMealFats] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

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
      setMeals((data || []).map(m => ({
        ...m,
        protein: m.protein || 0,
        carbs: m.carbs || 0,
        fats: m.fats || 0,
      })));
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
  const totalProtein = meals.reduce((sum, meal) => sum + meal.protein, 0);
  const totalCarbs = meals.reduce((sum, meal) => sum + meal.carbs, 0);
  const totalFats = meals.reduce((sum, meal) => sum + meal.fats, 0);
  const progressPercentage = Math.min((totalCalories / calorieGoal) * 100, 100);

  const resetForm = () => {
    setMealName('');
    setMealCalories('');
    setMealProtein('');
    setMealCarbs('');
    setMealFats('');
  };

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
      protein: parseInt(mealProtein, 10) || 0,
      carbs: parseInt(mealCarbs, 10) || 0,
      fats: parseInt(mealFats, 10) || 0,
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
      resetForm();
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

  const handleImageCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAnalyzing(true);
    setDialogOpen(true);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        
        try {
          const { data, error } = await supabase.functions.invoke('analyze-food', {
            body: { imageBase64: base64 }
          });

          if (error) {
            throw new Error(error.message);
          }

          if (data.error) {
            throw new Error(data.error);
          }

          // Fill in the form with AI analysis
          setMealName(data.name || '');
          setMealCalories(String(data.calories || ''));
          setMealProtein(String(data.protein || ''));
          setMealCarbs(String(data.carbs || ''));
          setMealFats(String(data.fats || ''));

          toast({
            title: 'Food Analyzed!',
            description: `Detected: ${data.name}`,
          });
        } catch (err) {
          console.error('AI analysis error:', err);
          toast({
            title: 'Analysis Failed',
            description: err instanceof Error ? err.message : 'Could not analyze the image. Please enter manually.',
            variant: 'destructive',
          });
        } finally {
          setAnalyzing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Image capture error:', err);
      setAnalyzing(false);
      toast({
        title: 'Error',
        description: 'Failed to process image',
        variant: 'destructive',
      });
    }

    // Reset the input
    e.target.value = '';
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
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageCapture}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleImageCapture}
        className="hidden"
      />

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

          {/* Macros Summary */}
          <div className="flex gap-4 w-full justify-center">
            <div className="text-center px-4 py-2 rounded-xl bg-muted/50">
              <p className="text-lg font-bold text-foreground">{totalProtein}g</p>
              <p className="text-xs text-muted-foreground">Protein</p>
            </div>
            <div className="text-center px-4 py-2 rounded-xl bg-muted/50">
              <p className="text-lg font-bold text-foreground">{totalCarbs}g</p>
              <p className="text-xs text-muted-foreground">Carbs</p>
            </div>
            <div className="text-center px-4 py-2 rounded-xl bg-muted/50">
              <p className="text-lg font-bold text-foreground">{totalFats}g</p>
              <p className="text-xs text-muted-foreground">Fats</p>
            </div>
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
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    <span>{meal.calories} kcal</span>
                    <span>•</span>
                    <span>P: {meal.protein}g</span>
                    <span>C: {meal.carbs}g</span>
                    <span>F: {meal.fats}g</span>
                  </div>
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

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button 
          onClick={() => cameraInputRef.current?.click()}
          className="flex-1 h-14 text-lg font-semibold" 
          variant="glow"
          disabled={analyzing}
        >
          {analyzing ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Camera className="w-5 h-5 mr-2" />
              Scan Meal
            </>
          )}
        </Button>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="h-14 px-6" variant="outline" onClick={resetForm}>
              <Plus className="w-5 h-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-primary">
                {analyzing ? 'Analyzing Food...' : 'Add Meal'}
              </DialogTitle>
            </DialogHeader>
            
            {analyzing ? (
              <div className="flex flex-col items-center justify-center py-8 gap-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="text-muted-foreground">AI is analyzing your food...</p>
              </div>
            ) : (
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
                  <Label htmlFor="calories">Calories (kcal)</Label>
                  <Input
                    id="calories"
                    type="number"
                    placeholder="e.g., 450"
                    value={mealCalories}
                    onChange={(e) => setMealCalories(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="protein">Protein (g)</Label>
                    <Input
                      id="protein"
                      type="number"
                      placeholder="0"
                      value={mealProtein}
                      onChange={(e) => setMealProtein(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="carbs">Carbs (g)</Label>
                    <Input
                      id="carbs"
                      type="number"
                      placeholder="0"
                      value={mealCarbs}
                      onChange={(e) => setMealCarbs(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fats">Fats (g)</Label>
                    <Input
                      id="fats"
                      type="number"
                      placeholder="0"
                      value={mealFats}
                      onChange={(e) => setMealFats(e.target.value)}
                    />
                  </div>
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
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
