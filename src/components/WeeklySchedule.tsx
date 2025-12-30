import React, { useState } from 'react';
import { Dumbbell, Heart, Zap, Target, Footprints, Flame, Moon, Check, Pencil, Trash2, Plus, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUserWorkouts, Exercise, DaySchedule } from '@/hooks/useUserWorkouts';

const dayIcons: Record<string, React.ReactNode> = {
  monday: <Dumbbell className="w-5 h-5" />,
  tuesday: <Target className="w-5 h-5" />,
  wednesday: <Heart className="w-5 h-5" />,
  thursday: <Footprints className="w-5 h-5" />,
  friday: <Zap className="w-5 h-5" />,
  saturday: <Flame className="w-5 h-5" />,
  sunday: <Moon className="w-5 h-5" />,
};

const dayColors: Record<string, string> = {
  monday: 'text-primary',
  tuesday: 'text-secondary',
  wednesday: 'text-accent',
  thursday: 'text-primary',
  friday: 'text-secondary',
  saturday: 'text-accent',
  sunday: 'text-muted-foreground',
};

export const WeeklySchedule: React.FC = () => {
  const { schedule, loading, updateDayWorkout } = useUserWorkouts();
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [editingExercise, setEditingExercise] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', subtitle: '' });
  const [exerciseForm, setExerciseForm] = useState({ name: '', setsReps: '' });
  const [addingExercise, setAddingExercise] = useState<string | null>(null);
  const [newExercise, setNewExercise] = useState({ name: '', setsReps: '' });
  
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

  const startEditDay = (day: DaySchedule) => {
    setEditForm({ title: day.title, subtitle: day.subtitle });
    setEditingDay(day.day);
  };

  const saveEditDay = async (dayName: string) => {
    const day = schedule.find(d => d.day === dayName);
    if (day) {
      await updateDayWorkout(dayName, { ...day, title: editForm.title, subtitle: editForm.subtitle });
    }
    setEditingDay(null);
  };

  const startEditExercise = (exercise: Exercise) => {
    setExerciseForm({ name: exercise.name, setsReps: exercise.setsReps });
    setEditingExercise(exercise.id);
  };

  const saveEditExercise = async (dayName: string, exerciseId: string) => {
    const day = schedule.find(d => d.day === dayName);
    if (day) {
      const updatedExercises = day.exercises.map(e => 
        e.id === exerciseId ? { ...e, name: exerciseForm.name, setsReps: exerciseForm.setsReps } : e
      );
      await updateDayWorkout(dayName, { ...day, exercises: updatedExercises });
    }
    setEditingExercise(null);
  };

  const deleteExercise = async (dayName: string, exerciseId: string) => {
    const day = schedule.find(d => d.day === dayName);
    if (day) {
      const updatedExercises = day.exercises.filter(e => e.id !== exerciseId);
      await updateDayWorkout(dayName, { ...day, exercises: updatedExercises });
    }
  };

  const addExercise = async (dayName: string) => {
    if (!newExercise.name.trim()) return;
    
    const day = schedule.find(d => d.day === dayName);
    if (day) {
      const newEx: Exercise = {
        id: `${dayName}-${Date.now()}`,
        name: newExercise.name,
        setsReps: newExercise.setsReps || '3×10'
      };
      const updatedExercises = [...day.exercises, newEx];
      await updateDayWorkout(dayName, { ...day, exercises: updatedExercises });
    }
    setNewExercise({ name: '', setsReps: '' });
    setAddingExercise(null);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground animate-pulse">Loading schedule...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold text-foreground">Weekly Workout Split</h2>
        <p className="text-xs text-muted-foreground">Your structured training program</p>
      </div>

      <Tabs defaultValue={today} className="w-full">
        <TabsList className="w-full grid grid-cols-7 gap-1 bg-card/50 p-1 h-auto">
          {schedule.map((day) => (
            <TabsTrigger
              key={day.day}
              value={day.day}
              className="text-xs px-1 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {day.shortDay}
            </TabsTrigger>
          ))}
        </TabsList>

        {schedule.map((day) => (
          <TabsContent key={day.day} value={day.day} className="mt-4 space-y-3">
            {/* Day Header */}
            {editingDay === day.day ? (
              <div className="flex items-center gap-2 mb-4">
                <div className={`w-10 h-10 rounded-xl bg-card flex items-center justify-center ${dayColors[day.day]}`}>
                  {dayIcons[day.day]}
                </div>
                <div className="flex-1 space-y-1">
                  <Input
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="h-8 font-bold bg-background/50"
                    placeholder="Day title"
                  />
                  <Input
                    value={editForm.subtitle}
                    onChange={(e) => setEditForm({ ...editForm, subtitle: e.target.value })}
                    className="h-7 text-xs bg-background/50"
                    placeholder="Subtitle"
                  />
                </div>
                <Button size="icon" variant="ghost" onClick={() => saveEditDay(day.day)} className="h-8 w-8">
                  <Check className="w-4 h-4 text-primary" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setEditingDay(null)} className="h-8 w-8">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3 mb-4 group">
                <div className={`w-10 h-10 rounded-xl bg-card flex items-center justify-center ${dayColors[day.day]}`}>
                  {dayIcons[day.day]}
                </div>
                <div className="flex-1">
                  <h3 className={`font-bold ${dayColors[day.day]}`}>{day.title}</h3>
                  <p className="text-xs text-muted-foreground">{day.subtitle}</p>
                </div>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={() => startEditDay(day)}
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Pencil className="w-3 h-3" />
                </Button>
              </div>
            )}

            {/* Exercises List */}
            {day.exercises.length > 0 || addingExercise === day.day ? (
              <div className="grid gap-2">
                {day.exercises.map((exercise) => {
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
                          <Button size="icon" variant="ghost" onClick={() => saveEditExercise(day.day, exercise.id)} className="h-8 w-8">
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
                        <div className={`w-8 h-8 rounded-lg bg-background/50 flex items-center justify-center ${dayColors[day.day]}`}>
                          <Dumbbell className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">
                            {exercise.name}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs bg-background/50">
                          {exercise.setsReps}
                        </Badge>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="icon" variant="ghost" onClick={() => startEditExercise(exercise)} className="h-6 w-6">
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => deleteExercise(day.day, exercise.id)} className="h-6 w-6 text-destructive">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {/* Add Exercise Form */}
                {addingExercise === day.day && (
                  <Card className="bg-card/50 border-dashed">
                    <CardContent className="p-3 flex items-center gap-2">
                      <Input
                        value={newExercise.name}
                        onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
                        className="flex-1 h-8 bg-background/50"
                        placeholder="Exercise name"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && addExercise(day.day)}
                      />
                      <Input
                        value={newExercise.setsReps}
                        onChange={(e) => setNewExercise({ ...newExercise, setsReps: e.target.value })}
                        className="w-20 h-8 bg-background/50 text-center"
                        placeholder="3×10"
                        onKeyDown={(e) => e.key === 'Enter' && addExercise(day.day)}
                      />
                      <Button size="icon" variant="ghost" onClick={() => addExercise(day.day)} className="h-8 w-8">
                        <Check className="w-4 h-4 text-primary" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setAddingExercise(null)} className="h-8 w-8">
                        <X className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : day.day === 'sunday' ? (
              <Card className="bg-card/30 border-dashed">
                <CardContent className="p-6 text-center">
                  <Moon className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Take time to rest and recover</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Your muscles grow during rest!</p>
                </CardContent>
              </Card>
            ) : null}

            {/* Add Exercise Button */}
            {addingExercise !== day.day && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAddingExercise(day.day)}
                className="w-full border-dashed"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Exercise
              </Button>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
