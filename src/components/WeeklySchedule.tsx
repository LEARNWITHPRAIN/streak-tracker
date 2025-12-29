import React, { useState, useEffect } from 'react';
import { Dumbbell, Heart, Zap, Target, Footprints, Flame, Moon, Check } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

interface Exercise {
  id: string;
  name: string;
  setsReps: string;
  icon: React.ReactNode;
}

interface DaySchedule {
  day: string;
  shortDay: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  exercises: Exercise[];
}

const weekSchedule: DaySchedule[] = [
  {
    day: 'monday',
    shortDay: 'Mon',
    title: 'Push Day',
    subtitle: 'Chest & Triceps',
    icon: <Dumbbell className="w-5 h-5" />,
    color: 'text-primary',
    exercises: [
      { id: 'mon-1', name: 'Bench Press', setsReps: '4x8', icon: <Dumbbell className="w-4 h-4" /> },
      { id: 'mon-2', name: 'Incline Dumbbell Press', setsReps: '3x10', icon: <Dumbbell className="w-4 h-4" /> },
      { id: 'mon-3', name: 'Dips', setsReps: '3x12', icon: <Target className="w-4 h-4" /> },
      { id: 'mon-4', name: 'Tricep Pushdowns', setsReps: '3x15', icon: <Zap className="w-4 h-4" /> },
    ],
  },
  {
    day: 'tuesday',
    shortDay: 'Tue',
    title: 'Pull Day',
    subtitle: 'Back & Biceps',
    icon: <Target className="w-5 h-5" />,
    color: 'text-secondary',
    exercises: [
      { id: 'tue-1', name: 'Pull-ups', setsReps: '4x8', icon: <Target className="w-4 h-4" /> },
      { id: 'tue-2', name: 'Barbell Rows', setsReps: '4x10', icon: <Dumbbell className="w-4 h-4" /> },
      { id: 'tue-3', name: 'Face Pulls', setsReps: '3x15', icon: <Zap className="w-4 h-4" /> },
      { id: 'tue-4', name: 'Bicep Curls', setsReps: '3x12', icon: <Dumbbell className="w-4 h-4" /> },
    ],
  },
  {
    day: 'wednesday',
    shortDay: 'Wed',
    title: 'Active Recovery',
    subtitle: 'Mobility & Light Cardio',
    icon: <Heart className="w-5 h-5" />,
    color: 'text-accent',
    exercises: [
      { id: 'wed-1', name: 'Yoga Flow', setsReps: '20 min', icon: <Heart className="w-4 h-4" /> },
      { id: 'wed-2', name: 'Light Cardio', setsReps: '15 min', icon: <Footprints className="w-4 h-4" /> },
      { id: 'wed-3', name: 'Stretching', setsReps: '10 min', icon: <Heart className="w-4 h-4" /> },
    ],
  },
  {
    day: 'thursday',
    shortDay: 'Thu',
    title: 'Legs & Core',
    subtitle: 'Lower Body Power',
    icon: <Footprints className="w-5 h-5" />,
    color: 'text-primary',
    exercises: [
      { id: 'thu-1', name: 'Squats', setsReps: '4x8', icon: <Footprints className="w-4 h-4" /> },
      { id: 'thu-2', name: 'Romanian Deadlifts', setsReps: '3x10', icon: <Dumbbell className="w-4 h-4" /> },
      { id: 'thu-3', name: 'Walking Lunges', setsReps: '3x12', icon: <Footprints className="w-4 h-4" /> },
      { id: 'thu-4', name: 'Plank Hold', setsReps: '3x45s', icon: <Target className="w-4 h-4" /> },
    ],
  },
  {
    day: 'friday',
    shortDay: 'Fri',
    title: 'Upper Body Focus',
    subtitle: 'Shoulders & Arms',
    icon: <Zap className="w-5 h-5" />,
    color: 'text-secondary',
    exercises: [
      { id: 'fri-1', name: 'Overhead Press', setsReps: '4x8', icon: <Dumbbell className="w-4 h-4" /> },
      { id: 'fri-2', name: 'Lateral Raises', setsReps: '3x12', icon: <Zap className="w-4 h-4" /> },
      { id: 'fri-3', name: 'Hammer Curls', setsReps: '3x10', icon: <Dumbbell className="w-4 h-4" /> },
      { id: 'fri-4', name: 'Skull Crushers', setsReps: '3x12', icon: <Target className="w-4 h-4" /> },
    ],
  },
  {
    day: 'saturday',
    shortDay: 'Sat',
    title: 'Full Body Intensity',
    subtitle: 'Compound Movements',
    icon: <Flame className="w-5 h-5" />,
    color: 'text-accent',
    exercises: [
      { id: 'sat-1', name: 'Deadlifts', setsReps: '5x5', icon: <Flame className="w-4 h-4" /> },
      { id: 'sat-2', name: 'Clean & Press', setsReps: '4x6', icon: <Zap className="w-4 h-4" /> },
      { id: 'sat-3', name: 'Burpees', setsReps: '3x15', icon: <Flame className="w-4 h-4" /> },
    ],
  },
  {
    day: 'sunday',
    shortDay: 'Sun',
    title: 'Rest Day',
    subtitle: 'Recovery & Relaxation',
    icon: <Moon className="w-5 h-5" />,
    color: 'text-muted-foreground',
    exercises: [],
  },
];

export const WeeklySchedule: React.FC = () => {
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

  useEffect(() => {
    const saved = localStorage.getItem('weekly-completed-exercises');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Reset if it's a new week
      const savedDate = localStorage.getItem('weekly-completed-date');
      const currentWeek = getWeekNumber(new Date());
      if (savedDate !== currentWeek.toString()) {
        localStorage.setItem('weekly-completed-date', currentWeek.toString());
        localStorage.removeItem('weekly-completed-exercises');
      } else {
        setCompletedExercises(new Set(parsed));
      }
    }
  }, []);

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

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold text-foreground">Weekly Workout Split</h2>
        <p className="text-xs text-muted-foreground">Your structured training program</p>
      </div>

      <Tabs defaultValue={today} className="w-full">
        <TabsList className="w-full grid grid-cols-7 gap-1 bg-card/50 p-1 h-auto">
          {weekSchedule.map((day) => (
            <TabsTrigger
              key={day.day}
              value={day.day}
              className="text-xs px-1 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {day.shortDay}
            </TabsTrigger>
          ))}
        </TabsList>

        {weekSchedule.map((day) => (
          <TabsContent key={day.day} value={day.day} className="mt-4 space-y-3">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl bg-card flex items-center justify-center ${day.color}`}>
                {day.icon}
              </div>
              <div>
                <h3 className={`font-bold ${day.color}`}>{day.title}</h3>
                <p className="text-xs text-muted-foreground">{day.subtitle}</p>
              </div>
            </div>

            {day.exercises.length > 0 ? (
              <div className="grid gap-2">
                {day.exercises.map((exercise) => {
                  const isCompleted = completedExercises.has(exercise.id);
                  return (
                    <Card
                      key={exercise.id}
                      className={`transition-all duration-200 ${
                        isCompleted ? 'bg-primary/10 border-primary/30' : 'bg-card/50 hover:bg-card/80'
                      }`}
                    >
                      <CardContent className="p-3 flex items-center gap-3">
                        <Checkbox
                          checked={isCompleted}
                          onCheckedChange={() => toggleExercise(exercise.id)}
                          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        <div className={`w-8 h-8 rounded-lg bg-background/50 flex items-center justify-center ${day.color}`}>
                          {exercise.icon}
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                            {exercise.name}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs bg-background/50">
                          {exercise.setsReps}
                        </Badge>
                        {isCompleted && (
                          <Check className="w-4 h-4 text-primary" />
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="bg-card/30 border-dashed">
                <CardContent className="p-6 text-center">
                  <Moon className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Take time to rest and recover</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Your muscles grow during rest!</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
