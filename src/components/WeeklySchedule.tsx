import React, { useState, useEffect } from 'react';
import { Dumbbell, Heart, Zap, Target, Footprints, Flame, Moon, Check, Pencil, Trash2, Plus, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Exercise {
  id: string;
  name: string;
  setsReps: string;
}

interface DaySchedule {
  day: string;
  shortDay: string;
  title: string;
  subtitle: string;
  exercises: Exercise[];
}

const defaultSchedule: DaySchedule[] = [
  {
    day: 'monday',
    shortDay: 'Mon',
    title: 'Push Day',
    subtitle: 'Chest & Triceps',
    exercises: [
      { id: 'mon-1', name: 'Bench Press', setsReps: '4x8' },
      { id: 'mon-2', name: 'Incline Dumbbell Press', setsReps: '3x10' },
      { id: 'mon-3', name: 'Dips', setsReps: '3x12' },
      { id: 'mon-4', name: 'Tricep Pushdowns', setsReps: '3x15' },
    ],
  },
  {
    day: 'tuesday',
    shortDay: 'Tue',
    title: 'Pull Day',
    subtitle: 'Back & Biceps',
    exercises: [
      { id: 'tue-1', name: 'Pull-ups', setsReps: '4x8' },
      { id: 'tue-2', name: 'Barbell Rows', setsReps: '4x10' },
      { id: 'tue-3', name: 'Face Pulls', setsReps: '3x15' },
      { id: 'tue-4', name: 'Bicep Curls', setsReps: '3x12' },
    ],
  },
  {
    day: 'wednesday',
    shortDay: 'Wed',
    title: 'Active Recovery',
    subtitle: 'Mobility & Light Cardio',
    exercises: [
      { id: 'wed-1', name: 'Yoga Flow', setsReps: '20 min' },
      { id: 'wed-2', name: 'Light Cardio', setsReps: '15 min' },
      { id: 'wed-3', name: 'Stretching', setsReps: '10 min' },
    ],
  },
  {
    day: 'thursday',
    shortDay: 'Thu',
    title: 'Legs & Core',
    subtitle: 'Lower Body Power',
    exercises: [
      { id: 'thu-1', name: 'Squats', setsReps: '4x8' },
      { id: 'thu-2', name: 'Romanian Deadlifts', setsReps: '3x10' },
      { id: 'thu-3', name: 'Walking Lunges', setsReps: '3x12' },
      { id: 'thu-4', name: 'Plank Hold', setsReps: '3x45s' },
    ],
  },
  {
    day: 'friday',
    shortDay: 'Fri',
    title: 'Upper Body Focus',
    subtitle: 'Shoulders & Arms',
    exercises: [
      { id: 'fri-1', name: 'Overhead Press', setsReps: '4x8' },
      { id: 'fri-2', name: 'Lateral Raises', setsReps: '3x12' },
      { id: 'fri-3', name: 'Hammer Curls', setsReps: '3x10' },
      { id: 'fri-4', name: 'Skull Crushers', setsReps: '3x12' },
    ],
  },
  {
    day: 'saturday',
    shortDay: 'Sat',
    title: 'Full Body Intensity',
    subtitle: 'Compound Movements',
    exercises: [
      { id: 'sat-1', name: 'Deadlifts', setsReps: '5x5' },
      { id: 'sat-2', name: 'Clean & Press', setsReps: '4x6' },
      { id: 'sat-3', name: 'Burpees', setsReps: '3x15' },
    ],
  },
  {
    day: 'sunday',
    shortDay: 'Sun',
    title: 'Rest Day',
    subtitle: 'Recovery & Relaxation',
    exercises: [],
  },
];

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
  const [schedule, setSchedule] = useState<DaySchedule[]>(defaultSchedule);
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [editingExercise, setEditingExercise] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', subtitle: '' });
  const [exerciseForm, setExerciseForm] = useState({ name: '', setsReps: '' });
  const [addingExercise, setAddingExercise] = useState<string | null>(null);
  const [newExercise, setNewExercise] = useState({ name: '', setsReps: '' });
  
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

  useEffect(() => {
    const savedSchedule = localStorage.getItem('weekly-schedule');
    if (savedSchedule) {
      setSchedule(JSON.parse(savedSchedule));
    }
    
    const saved = localStorage.getItem('weekly-completed-exercises');
    if (saved) {
      const savedDate = localStorage.getItem('weekly-completed-date');
      const currentWeek = getWeekNumber(new Date());
      if (savedDate !== currentWeek.toString()) {
        localStorage.setItem('weekly-completed-date', currentWeek.toString());
        localStorage.removeItem('weekly-completed-exercises');
      } else {
        setCompletedExercises(new Set(JSON.parse(saved)));
      }
    }
  }, []);

  const saveSchedule = (newSchedule: DaySchedule[]) => {
    setSchedule(newSchedule);
    localStorage.setItem('weekly-schedule', JSON.stringify(newSchedule));
  };

  const getWeekNumber = (date: Date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  const toggleExercise = (exerciseId: string) => {
    const newCompleted = new Set(completedExercises);
    if (newCompleted.has(exerciseId)) {
      newCompleted.delete(exerciseId);
    } else {
      newCompleted.add(exerciseId);
    }
    setCompletedExercises(newCompleted);
    localStorage.setItem('weekly-completed-exercises', JSON.stringify([...newCompleted]));
  };

  const startEditDay = (day: DaySchedule) => {
    setEditForm({ title: day.title, subtitle: day.subtitle });
    setEditingDay(day.day);
  };

  const saveEditDay = (dayName: string) => {
    const newSchedule = schedule.map(d => 
      d.day === dayName ? { ...d, title: editForm.title, subtitle: editForm.subtitle } : d
    );
    saveSchedule(newSchedule);
    setEditingDay(null);
  };

  const startEditExercise = (exercise: Exercise) => {
    setExerciseForm({ name: exercise.name, setsReps: exercise.setsReps });
    setEditingExercise(exercise.id);
  };

  const saveEditExercise = (dayName: string, exerciseId: string) => {
    const newSchedule = schedule.map(d => {
      if (d.day === dayName) {
        return {
          ...d,
          exercises: d.exercises.map(e => 
            e.id === exerciseId ? { ...e, name: exerciseForm.name, setsReps: exerciseForm.setsReps } : e
          )
        };
      }
      return d;
    });
    saveSchedule(newSchedule);
    setEditingExercise(null);
  };

  const deleteExercise = (dayName: string, exerciseId: string) => {
    const newSchedule = schedule.map(d => {
      if (d.day === dayName) {
        return { ...d, exercises: d.exercises.filter(e => e.id !== exerciseId) };
      }
      return d;
    });
    saveSchedule(newSchedule);
  };

  const addExercise = (dayName: string) => {
    if (!newExercise.name.trim()) return;
    
    const newSchedule = schedule.map(d => {
      if (d.day === dayName) {
        return {
          ...d,
          exercises: [...d.exercises, {
            id: `${dayName}-${Date.now()}`,
            name: newExercise.name,
            setsReps: newExercise.setsReps || '3x10'
          }]
        };
      }
      return d;
    });
    saveSchedule(newSchedule);
    setNewExercise({ name: '', setsReps: '' });
    setAddingExercise(null);
  };

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
                  const isCompleted = completedExercises.has(exercise.id);
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
                            placeholder="3x10"
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
                      className={`transition-all duration-200 group ${
                        isCompleted ? 'bg-primary/10 border-primary/30' : 'bg-card/50 hover:bg-card/80'
                      }`}
                    >
                      <CardContent className="p-3 flex items-center gap-3">
                        <Checkbox
                          checked={isCompleted}
                          onCheckedChange={() => toggleExercise(exercise.id)}
                          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        <div className={`w-8 h-8 rounded-lg bg-background/50 flex items-center justify-center ${dayColors[day.day]}`}>
                          <Dumbbell className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
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
                        {isCompleted && <Check className="w-4 h-4 text-primary" />}
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
                        placeholder="3x10"
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
