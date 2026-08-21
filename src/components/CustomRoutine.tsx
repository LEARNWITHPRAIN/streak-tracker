import React, { useState, useEffect, useCallback } from 'react';
import { Dumbbell, Pencil, Trash2, Plus, X, Check, Repeat } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Exercise } from '@/hooks/useUserWorkouts';
import { Json } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { z } from 'zod';

const CUSTOM_ROUTINE_KEY = 'custom';

// Validation schemas
const exerciseSchema = z.object({
  name: z.string().trim().min(1, 'Exercise name is required').max(100, 'Exercise name must be 100 characters or less'),
  setsReps: z.string().trim().min(1, 'Sets/reps is required').max(20, 'Sets/reps must be 20 characters or less'),
});

const routineHeaderSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(100, 'Title must be 100 characters or less'),
  subtitle: z.string().trim().min(1, 'Subtitle is required').max(200, 'Subtitle must be 200 characters or less'),
});

interface CustomRoutineData {
  title: string;
  subtitle: string;
  exercises: Exercise[];
}

const defaultCustomRoutine: CustomRoutineData = {
  title: 'Daily Routine',
  subtitle: 'Same workout every day',
  exercises: [
    { id: 'custom-1', name: 'Push-ups', setsReps: '3×15' },
    { id: 'custom-2', name: 'Squats', setsReps: '3×15' },
    { id: 'custom-3', name: 'Plank', setsReps: '3×30s' },
  ],
};

export const CustomRoutine: React.FC = () => {
  const { user } = useAuth();
  const [routine, setRoutine] = useState<CustomRoutineData>(defaultCustomRoutine);
  const [loading, setLoading] = useState(true);
  const [editingHeader, setEditingHeader] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', subtitle: '' });
  const [editingExercise, setEditingExercise] = useState<string | null>(null);
  const [exerciseForm, setExerciseForm] = useState({ name: '', setsReps: '' });
  const [addingExercise, setAddingExercise] = useState(false);
  const [newExercise, setNewExercise] = useState({ name: '', setsReps: '' });

  const fetchCustomRoutine = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_workouts')
        .select('*')
        .eq('user_id', user.id)
        .eq('day', CUSTOM_ROUTINE_KEY)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setRoutine({
          title: data.title,
          subtitle: data.subtitle,
          exercises: data.exercises as unknown as Exercise[],
        });
      } else {
        await initializeCustomRoutine();
      }
    } catch (error) {
      console.error('Error fetching custom routine:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const initializeCustomRoutine = async () => {
    if (!user) return;

    try {
      const { error } = await supabase.from('user_workouts').insert({
        user_id: user.id,
        day: CUSTOM_ROUTINE_KEY,
        short_day: 'Daily',
        title: defaultCustomRoutine.title,
        subtitle: defaultCustomRoutine.subtitle,
        exercises: defaultCustomRoutine.exercises as unknown as Json,
      });

      if (error) throw error;
      setRoutine(defaultCustomRoutine);
    } catch (error) {
      console.error('Error initializing custom routine:', error);
    }
  };

  const updateRoutine = async (updates: Partial<CustomRoutineData>) => {
    if (!user) return;

    const updatedRoutine = { ...routine, ...updates };

    try {
      const { error } = await supabase
        .from('user_workouts')
        .update({
          title: updatedRoutine.title,
          subtitle: updatedRoutine.subtitle,
          exercises: updatedRoutine.exercises as unknown as Json,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('day', CUSTOM_ROUTINE_KEY);

      if (error) throw error;
      setRoutine(updatedRoutine);
    } catch (error) {
      console.error('Error updating custom routine:', error);
      toast.error('Failed to update routine');
    }
  };

  useEffect(() => {
    fetchCustomRoutine();
  }, [fetchCustomRoutine]);

  const startEditHeader = () => {
    setEditForm({ title: routine.title, subtitle: routine.subtitle });
    setEditingHeader(true);
  };

  const saveEditHeader = async () => {
    const validation = routineHeaderSchema.safeParse(editForm);
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }
    await updateRoutine({ title: validation.data.title, subtitle: validation.data.subtitle });
    setEditingHeader(false);
  };

  const startEditExercise = (exercise: Exercise) => {
    setExerciseForm({ name: exercise.name, setsReps: exercise.setsReps });
    setEditingExercise(exercise.id);
  };

  const saveEditExercise = async (exerciseId: string) => {
    const validation = exerciseSchema.safeParse(exerciseForm);
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }
    const updatedExercises = routine.exercises.map(e =>
      e.id === exerciseId ? { ...e, name: validation.data.name, setsReps: validation.data.setsReps } : e
    );
    await updateRoutine({ exercises: updatedExercises });
    setEditingExercise(null);
  };

  const deleteExercise = async (exerciseId: string) => {
    const updatedExercises = routine.exercises.filter(e => e.id !== exerciseId);
    await updateRoutine({ exercises: updatedExercises });
  };

  const addExercise = async () => {
    const validation = exerciseSchema.safeParse({
      name: newExercise.name,
      setsReps: newExercise.setsReps || '3×10',
    });
    
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    const newEx: Exercise = {
      id: `custom-${Date.now()}`,
      name: validation.data.name,
      setsReps: validation.data.setsReps,
    };
    const updatedExercises = [...routine.exercises, newEx];
    await updateRoutine({ exercises: updatedExercises });
    setNewExercise({ name: '', setsReps: '' });
    setAddingExercise(false);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground animate-pulse">Loading routine...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="p-4 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-sm">
          <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
            <Repeat className="w-4 h-4 text-primary" />
          </div>
          <span className="text-primary font-semibold text-xs md:text-sm">
            Active default template when "Same routine every day" is toggled on.
          </span>
        </div>
      </div>

      {/* Routine Header */}
      {editingHeader ? (
        <div className="flex items-center gap-3 p-4 bg-card/60 rounded-2xl border border-border/50">
          <div className="w-12 h-12 rounded-xl bg-card flex items-center justify-center text-primary">
            <Dumbbell className="w-6 h-6" />
          </div>
          <div className="flex-1 space-y-2">
            <Input
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value.slice(0, 100) })}
              className="h-9 font-bold bg-background/70 rounded-xl"
              placeholder="Routine title"
              maxLength={100}
            />
            <Input
              value={editForm.subtitle}
              onChange={(e) => setEditForm({ ...editForm, subtitle: e.target.value.slice(0, 200) })}
              className="h-8 text-xs bg-background/70 rounded-xl"
              placeholder="Subtitle"
              maxLength={200}
            />
          </div>
          <Button size="icon" variant="ghost" onClick={saveEditHeader} className="h-9 w-9 rounded-xl">
            <Check className="w-4 h-4 text-primary" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => setEditingHeader(false)} className="h-9 w-9 rounded-xl">
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 p-4 bg-card/60 rounded-2xl border border-border/50 group">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-background/80 border border-border/50 flex items-center justify-center text-primary">
              <Dumbbell className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">{routine.title}</h3>
              <p className="text-xs md:text-sm text-muted-foreground">{routine.subtitle}</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={startEditHeader}
            className="rounded-xl text-xs"
          >
            <Pencil className="w-3.5 h-3.5 mr-1.5" />
            Edit Routine
          </Button>
        </div>
      )}

      {/* Exercises Grid - Responsive for PC */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {routine.exercises.map((exercise) => {
          const isEditing = editingExercise === exercise.id;

          if (isEditing) {
            return (
              <Card key={exercise.id} className="bg-card/70 border-primary/40 rounded-2xl">
                <CardContent className="p-4 flex items-center gap-2">
                  <Input
                    value={exerciseForm.name}
                    onChange={(e) => setExerciseForm({ ...exerciseForm, name: e.target.value.slice(0, 100) })}
                    className="flex-1 h-9 bg-background/70 rounded-xl"
                    placeholder="Exercise name"
                    maxLength={100}
                  />
                  <Input
                    value={exerciseForm.setsReps}
                    onChange={(e) => setExerciseForm({ ...exerciseForm, setsReps: e.target.value.slice(0, 20) })}
                    className="w-20 h-9 bg-background/70 text-center rounded-xl font-mono text-xs"
                    placeholder="3×10"
                    maxLength={20}
                  />
                  <Button size="icon" variant="ghost" onClick={() => saveEditExercise(exercise.id)} className="h-9 w-9 rounded-xl">
                    <Check className="w-4 h-4 text-primary" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setEditingExercise(null)} className="h-9 w-9 rounded-xl">
                    <X className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          }

          return (
            <Card
              key={exercise.id}
              className="transition-all duration-200 group bg-card/60 hover:bg-card hover:border-primary/30 border-border/60 rounded-2xl"
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-background/70 border border-border/50 flex items-center justify-center text-primary shrink-0">
                  <Dumbbell className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{exercise.name}</p>
                  <div className="mt-1">
                    <Badge variant="outline" className="text-xs bg-background/60 font-mono">
                      {exercise.setsReps}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => startEditExercise(exercise)} className="h-8 w-8 rounded-lg hover:bg-muted">
                    <Pencil className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => deleteExercise(exercise.id)} className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Add Exercise Form */}
        {addingExercise && (
          <Card className="bg-card/60 border-dashed border-primary/50 rounded-2xl">
            <CardContent className="p-4 flex items-center gap-2">
              <Input
                value={newExercise.name}
                onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value.slice(0, 100) })}
                className="flex-1 h-9 bg-background/70 rounded-xl"
                placeholder="Exercise name"
                autoFocus
                maxLength={100}
                onKeyDown={(e) => e.key === 'Enter' && addExercise()}
              />
              <Input
                value={newExercise.setsReps}
                onChange={(e) => setNewExercise({ ...newExercise, setsReps: e.target.value.slice(0, 20) })}
                className="w-20 h-9 bg-background/70 text-center rounded-xl font-mono text-xs"
                placeholder="3×10"
                maxLength={20}
                onKeyDown={(e) => e.key === 'Enter' && addExercise()}
              />
              <Button size="icon" variant="ghost" onClick={addExercise} className="h-9 w-9 rounded-xl">
                <Check className="w-4 h-4 text-primary" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => setAddingExercise(false)} className="h-9 w-9 rounded-xl">
                <X className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Exercise Button */}
      {!addingExercise && (
        <Button
          variant="outline"
          size="lg"
          onClick={() => setAddingExercise(true)}
          className="w-full border-dashed rounded-2xl py-5 border-border hover:border-primary/50 text-sm font-semibold"
        >
          <Plus className="w-4 h-4 mr-2 text-primary" />
          Add Custom Exercise
        </Button>
      )}
    </div>
  );
};
