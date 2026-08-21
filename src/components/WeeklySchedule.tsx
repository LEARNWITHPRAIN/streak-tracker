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
        <TabsList className="w-full grid grid-cols-7 gap-1.5 bg-card/60 p-1.5 rounded-2xl border border-border/50 h-auto">
          {schedule.map((day) => (
            <TabsTrigger
              key={day.day}
              value={day.day}
              className="text-xs md:text-sm font-semibold py-2.5 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all"
            >
              {day.shortDay}
            </TabsTrigger>
          ))}
        </TabsList>

        {schedule.map((day) => (
          <TabsContent key={day.day} value={day.day} className="mt-6 space-y-4">
            {/* Day Header */}
            {editingDay === day.day ? (
              <div className="flex items-center gap-3 p-4 bg-card/60 rounded-2xl border border-border/50">
                <div className={`w-12 h-12 rounded-xl bg-card flex items-center justify-center ${dayColors[day.day]}`}>
                  {dayIcons[day.day]}
                </div>
                <div className="flex-1 space-y-2">
                  <Input
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="h-9 font-bold bg-background/70 rounded-xl"
                    placeholder="Day title"
                  />
                  <Input
                    value={editForm.subtitle}
                    onChange={(e) => setEditForm({ ...editForm, subtitle: e.target.value })}
                    className="h-8 text-xs bg-background/70 rounded-xl"
                    placeholder="Subtitle"
                  />
                </div>
                <Button size="icon" variant="ghost" onClick={() => saveEditDay(day.day)} className="h-9 w-9 rounded-xl">
                  <Check className="w-4 h-4 text-primary" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setEditingDay(null)} className="h-9 w-9 rounded-xl">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3 p-4 bg-card/60 rounded-2xl border border-border/50 group">
                <div className="flex items-center gap-3.5">
                  <div className={`w-12 h-12 rounded-2xl bg-background/80 border border-border/50 flex items-center justify-center ${dayColors[day.day]}`}>
                    {dayIcons[day.day]}
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${dayColors[day.day]}`}>{day.title}</h3>
                    <p className="text-xs md:text-sm text-muted-foreground">{day.subtitle}</p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => startEditDay(day)}
                  className="rounded-xl text-xs"
                >
                  <Pencil className="w-3.5 h-3.5 mr-1.5" />
                  Edit Day
                </Button>
              </div>
            )}

            {/* Exercises List - Responsive Grid */}
            {day.exercises.length > 0 || addingExercise === day.day ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {day.exercises.map((exercise) => {
                  const isEditing = editingExercise === exercise.id;
                  
                  if (isEditing) {
                    return (
                      <Card key={exercise.id} className="bg-card/70 border-primary/40 rounded-2xl">
                        <CardContent className="p-4 flex items-center gap-2">
                          <Input
                            value={exerciseForm.name}
                            onChange={(e) => setExerciseForm({ ...exerciseForm, name: e.target.value })}
                            className="flex-1 h-9 bg-background/70 rounded-xl"
                            placeholder="Exercise name"
                          />
                          <Input
                            value={exerciseForm.setsReps}
                            onChange={(e) => setExerciseForm({ ...exerciseForm, setsReps: e.target.value })}
                            className="w-20 h-9 bg-background/70 text-center rounded-xl font-mono text-xs"
                            placeholder="3×10"
                          />
                          <Button size="icon" variant="ghost" onClick={() => saveEditExercise(day.day, exercise.id)} className="h-9 w-9 rounded-xl">
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
                        <div className={`w-10 h-10 rounded-xl bg-background/70 border border-border/50 flex items-center justify-center shrink-0 ${dayColors[day.day]}`}>
                          <Dumbbell className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-foreground truncate">
                            {exercise.name}
                          </p>
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
                          <Button size="icon" variant="ghost" onClick={() => deleteExercise(day.day, exercise.id)} className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {/* Add Exercise Form */}
                {addingExercise === day.day && (
                  <Card className="bg-card/60 border-dashed border-primary/50 rounded-2xl">
                    <CardContent className="p-4 flex items-center gap-2">
                      <Input
                        value={newExercise.name}
                        onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
                        className="flex-1 h-9 bg-background/70 rounded-xl"
                        placeholder="Exercise name"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && addExercise(day.day)}
                      />
                      <Input
                        value={newExercise.setsReps}
                        onChange={(e) => setNewExercise({ ...newExercise, setsReps: e.target.value })}
                        className="w-20 h-9 bg-background/70 text-center rounded-xl font-mono text-xs"
                        placeholder="3×10"
                        onKeyDown={(e) => e.key === 'Enter' && addExercise(day.day)}
                      />
                      <Button size="icon" variant="ghost" onClick={() => addExercise(day.day)} className="h-9 w-9 rounded-xl">
                        <Check className="w-4 h-4 text-primary" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setAddingExercise(null)} className="h-9 w-9 rounded-xl">
                        <X className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : day.day === 'sunday' ? (
              <Card className="bg-card/30 border-dashed rounded-2xl p-8 text-center">
                <CardContent className="space-y-2">
                  <Moon className="w-10 h-10 mx-auto text-muted-foreground/60" />
                  <p className="text-base font-semibold text-muted-foreground">Take time to rest and recover</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Your muscles grow and rebuild during rest!</p>
                </CardContent>
              </Card>
            ) : null}

            {/* Add Exercise Button */}
            {addingExercise !== day.day && (
              <Button
                variant="outline"
                size="lg"
                onClick={() => setAddingExercise(day.day)}
                className="w-full border-dashed rounded-2xl py-5 border-border hover:border-primary/50 text-sm font-semibold"
              >
                <Plus className="w-4 h-4 mr-2 text-primary" />
                Add Exercise to {day.title}
              </Button>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
