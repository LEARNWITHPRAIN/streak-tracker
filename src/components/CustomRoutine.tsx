import React, { useState, useEffect, useCallback } from 'react';
import { Dumbbell, Pencil, Trash2, Plus, X, Check, Repeat } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Exercise } from '@/hooks/useUserWorkouts';
import { Json } from '@/integrations/supabase/types';

const CUSTOM_ROUTINE_KEY = 'custom';

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
        // Initialize custom routine for new users
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
    await updateRoutine({ title: editForm.title, subtitle: editForm.subtitle });
    setEditingHeader(false);
  };

  const startEditExercise = (exercise: Exercise) => {
    setExerciseForm({ name: exercise.name, setsReps: exercise.setsReps });
    setEditingExercise(exercise.id);
  };

  const saveEditExercise = async (exerciseId: string) => {
    const updatedExercises = routine.exercises.map(e =>
      e.id === exerciseId ? { ...e, name: exerciseForm.name, setsReps: exerciseForm.setsReps } : e
    );
    await updateRoutine({ exercises: updatedExercises });
    setEditingExercise(null);
  };

  const deleteExercise = async (exerciseId: string) => {
    const updatedExercises = routine.exercises.filter(e => e.id !== exerciseId);
    await updateRoutine({ exercises: updatedExercises });
  };

  const addExercise = async () => {
    if (!newExercise.name.trim()) return;

    const newEx: Exercise = {
      id: `custom-${Date.now()}`,
      name: newExercise.name,
      setsReps: newExercise.setsReps || '3×10',
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
    <div className="space-y-4">
      {/* Header Info */}
      <div className="p-3 rounded-lg bg-primary/10 border border-primary/30 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <Repeat className="w-4 h-4 text-primary" />
          <span className="text-primary font-medium">
            This routine is used when "Same routine every day" is enabled
          </span>
        </div>
      </div>

      {/* Routine Header */}
      {editingHeader ? (
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-card flex items-center justify-center text-primary">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div className="flex-1 space-y-1">
            <Input
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              className="h-8 font-bold bg-background/50"
              placeholder="Routine title"
            />
            <Input
              value={editForm.subtitle}
              onChange={(e) => setEditForm({ ...editForm, subtitle: e.target.value })}
              className="h-7 text-xs bg-background/50"
              placeholder="Subtitle"
            />
          </div>
          <Button size="icon" variant="ghost" onClick={saveEditHeader} className="h-8 w-8">
            <Check className="w-4 h-4 text-primary" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => setEditingHeader(false)} className="h-8 w-8">
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-3 mb-4 group">
          <div className="w-10 h-10 rounded-xl bg-card flex items-center justify-center text-primary">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-primary">{routine.title}</h3>
            <p className="text-xs text-muted-foreground">{routine.subtitle}</p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={startEditHeader}
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Pencil className="w-3 h-3" />
          </Button>
        </div>
      )}

      {/* Exercises List */}
      <div className="grid gap-2">
        {routine.exercises.map((exercise) => {
          const isEditing = editingExercise === exercise.id;

          if (isEditing) {
            return (
              <Card key={exercise.id} className="bg-card/50">
                <CardContent className="p-3 flex items-center gap-2">
                  <Input
                    value={exerciseForm.name}
                    onChange={(e) => setExerciseForm({ ...exerciseForm, name: e.target.value })}
                    className="flex-1 h-8 bg-background/50"
                    placeholder="Exercise name"
                  />
                  <Input
                    value={exerciseForm.setsReps}
                    onChange={(e) => setExerciseForm({ ...exerciseForm, setsReps: e.target.value })}
                    className="w-20 h-8 bg-background/50 text-center"
                    placeholder="3×10"
                  />
                  <Button size="icon" variant="ghost" onClick={() => saveEditExercise(exercise.id)} className="h-8 w-8">
                    <Check className="w-4 h-4 text-primary" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setEditingExercise(null)} className="h-8 w-8">
                    <X className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          }

          return (
            <Card
              key={exercise.id}
              className="transition-all duration-200 group bg-card/50 hover:bg-card/80"
            >
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-background/50 flex items-center justify-center text-primary">
                  <Dumbbell className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{exercise.name}</p>
                </div>
                <Badge variant="outline" className="text-xs bg-background/50">
                  {exercise.setsReps}
                </Badge>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="icon" variant="ghost" onClick={() => startEditExercise(exercise)} className="h-6 w-6">
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => deleteExercise(exercise.id)} className="h-6 w-6 text-destructive">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Add Exercise Form */}
        {addingExercise && (
          <Card className="bg-card/50 border-dashed">
            <CardContent className="p-3 flex items-center gap-2">
              <Input
                value={newExercise.name}
                onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
                className="flex-1 h-8 bg-background/50"
                placeholder="Exercise name"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && addExercise()}
              />
              <Input
                value={newExercise.setsReps}
                onChange={(e) => setNewExercise({ ...newExercise, setsReps: e.target.value })}
                className="w-20 h-8 bg-background/50 text-center"
                placeholder="3×10"
                onKeyDown={(e) => e.key === 'Enter' && addExercise()}
              />
              <Button size="icon" variant="ghost" onClick={addExercise} className="h-8 w-8">
                <Check className="w-4 h-4 text-primary" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => setAddingExercise(false)} className="h-8 w-8">
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
          size="sm"
          onClick={() => setAddingExercise(true)}
          className="w-full border-dashed"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Exercise
        </Button>
      )}
    </div>
  );
};
