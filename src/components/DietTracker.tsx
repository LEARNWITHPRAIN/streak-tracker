import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Utensils, Plus, Trash2, Apple, Camera, Loader2, Pencil, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ProgressCircle } from '@/components/ProgressCircle';
import { MacroCircle } from '@/components/MacroCircle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { UpgradeModal } from '@/components/UpgradeModal';

interface MealLog {
  id: string;
  meal_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  created_at: string;
}

interface NutritionGoals {
  calorie_goal: number;
  protein_goal: number;
  carbs_goal: number;
  fats_goal: number;
}

export const DietTracker: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [goals, setGoals] = useState<NutritionGoals>({
    calorie_goal: 2500,
    protein_goal: 150,
    carbs_goal: 250,
    fats_goal: 65,
  });
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mealName, setMealName] = useState('');
  const [mealCalories, setMealCalories] = useState('');
  const [mealProtein, setMealProtein] = useState('');
  const [mealCarbs, setMealCarbs] = useState('');
  const [mealFats, setMealFats] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  
  // Goal editing state
  const [editGoalDialog, setEditGoalDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState<'calories' | 'protein' | 'carbs' | 'fats' | null>(null);
  const [editGoalValue, setEditGoalValue] = useState('');
  const [savingGoal, setSavingGoal] = useState(false);
  
  // Subscription state
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('inactive');
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  
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

  const fetchGoals = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('calorie_goal, protein_goal, carbs_goal, fats_goal, subscription_status')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!error && data) {
      setGoals({
        calorie_goal: data.calorie_goal || 2500,
        protein_goal: data.protein_goal || 150,
        carbs_goal: data.carbs_goal || 250,
        fats_goal: data.fats_goal || 65,
      });
      setSubscriptionStatus(data.subscription_status || 'inactive');
    }
  }, [user]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchMeals(), fetchGoals()]);
      setLoading(false);
    };
    loadData();
  }, [fetchMeals, fetchGoals]);

  const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);
  const totalProtein = meals.reduce((sum, meal) => sum + meal.protein, 0);
  const totalCarbs = meals.reduce((sum, meal) => sum + meal.carbs, 0);
  const totalFats = meals.reduce((sum, meal) => sum + meal.fats, 0);
  const progressPercentage = Math.min((totalCalories / goals.calorie_goal) * 100, 100);

  const resetForm = () => {
    setMealName('');
    setMealCalories('');
    setMealProtein('');
    setMealCarbs('');
    setMealFats('');
  };

  const openEditGoal = (type: 'calories' | 'protein' | 'carbs' | 'fats') => {
    setEditingGoal(type);
    const goalMap = {
      calories: goals.calorie_goal,
      protein: goals.protein_goal,
      carbs: goals.carbs_goal,
      fats: goals.fats_goal,
    };
    setEditGoalValue(String(goalMap[type]));
    setEditGoalDialog(true);
  };

  const handleSaveGoal = async () => {
    if (!user || !editingGoal) return;

    const value = parseInt(editGoalValue, 10);
    if (isNaN(value) || value <= 0) {
      toast({
        title: 'Invalid value',
        description: 'Please enter a valid number',
        variant: 'destructive',
      });
      return;
    }

    setSavingGoal(true);

    const columnMap = {
      calories: 'calorie_goal',
      protein: 'protein_goal',
      carbs: 'carbs_goal',
      fats: 'fats_goal',
    } as const;

    const { error } = await supabase
      .from('profiles')
      .update({ [columnMap[editingGoal]]: value })
      .eq('user_id', user.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update goal',
        variant: 'destructive',
      });
    } else {
      setGoals(prev => ({
        ...prev,
        [columnMap[editingGoal]]: value,
      }));
      toast({
        title: 'Goal Updated',
        description: `${editingGoal.charAt(0).toUpperCase() + editingGoal.slice(1)} goal set to ${value}${editingGoal === 'calories' ? ' kcal' : 'g'}`,
      });
      setEditGoalDialog(false);
    }

    setSavingGoal(false);
  };

  const getGoalLabel = () => {
    if (!editingGoal) return '';
    const labels = {
      calories: 'Daily Calorie Goal (kcal)',
      protein: 'Daily Protein Goal (g)',
      carbs: 'Daily Carbs Goal (g)',
      fats: 'Daily Fats Goal (g)',
    };
    return labels[editingGoal];
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

  const handleScanMealClick = () => {
    if (subscriptionStatus !== 'active') {
      setUpgradeModalOpen(true);
    } else {
      cameraInputRef.current?.click();
    }
  };

  const handleSubscriptionSuccess = () => {
    setSubscriptionStatus('active');
  };

  const isSubscribed = subscriptionStatus === 'active';

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

      {/* Progress Section */}
      <div className="glass rounded-2xl p-6">
        <div className="flex flex-col items-center gap-4">
          {/* Main Calorie Circle */}
          <div className="relative group">
            <ProgressCircle percentage={progressPercentage} size={120} strokeWidth={10}>
              <Apple className="w-4 h-4 text-primary mb-0.5" />
              <span className="text-xl font-bold">{totalCalories}</span>
              <span className="text-[9px] text-muted-foreground">/{goals.calorie_goal} kcal</span>
            </ProgressCircle>
            <button
              onClick={() => openEditGoal('calories')}
              className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary/20 hover:bg-primary/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              title="Edit calorie goal"
            >
              <Pencil className="w-3 h-3 text-primary" />
            </button>
          </div>
          
          <div className="text-center">
            <p className="text-sm font-semibold text-primary">Daily Calories</p>
            <p className="text-xs text-muted-foreground">
              {goals.calorie_goal - totalCalories > 0 
                ? `${goals.calorie_goal - totalCalories} kcal remaining` 
                : 'Goal reached! 🎉'}
            </p>
          </div>

          {/* Macro Circles */}
          <div className="flex justify-center gap-6 pt-2">
            <MacroCircle
              label="Protein"
              current={totalProtein}
              goal={goals.protein_goal}
              color="hsl(142, 76%, 36%)"
              onEdit={() => openEditGoal('protein')}
            />
            <MacroCircle
              label="Carbs"
              current={totalCarbs}
              goal={goals.carbs_goal}
              color="hsl(38, 92%, 50%)"
              onEdit={() => openEditGoal('carbs')}
            />
            <MacroCircle
              label="Fats"
              current={totalFats}
              goal={goals.fats_goal}
              color="hsl(346, 77%, 49%)"
              onEdit={() => openEditGoal('fats')}
            />
          </div>
        </div>
      </div>

      {/* Edit Goal Dialog */}
      <Dialog open={editGoalDialog} onOpenChange={setEditGoalDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-primary">
              Edit Daily Target
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="goal-value">{getGoalLabel()}</Label>
              <Input
                id="goal-value"
                type="number"
                value={editGoalValue}
                onChange={(e) => setEditGoalValue(e.target.value)}
                placeholder="Enter target"
              />
            </div>
            <div className="flex gap-2">
              <DialogClose asChild>
                <Button variant="outline" className="flex-1">Cancel</Button>
              </DialogClose>
              <Button
                onClick={handleSaveGoal}
                disabled={savingGoal || !editGoalValue}
                className="flex-1"
                variant="glow"
              >
                {savingGoal ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
          <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
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

      {/* Upgrade Modal */}
      <UpgradeModal
        open={upgradeModalOpen}
        onOpenChange={setUpgradeModalOpen}
        onSuccess={handleSubscriptionSuccess}
      />

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button 
          onClick={handleScanMealClick}
          className="flex-1 h-14 text-lg font-semibold" 
          variant="glow"
          disabled={analyzing}
        >
          {analyzing ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : isSubscribed ? (
            <>
              <Camera className="w-5 h-5 mr-2" />
              Scan Meal
            </>
          ) : (
            <>
              <Lock className="w-5 h-5 mr-2" />
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
