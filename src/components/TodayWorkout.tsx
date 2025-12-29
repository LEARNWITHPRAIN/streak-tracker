import React, { useState, useEffect } from 'react';
import { Dumbbell, Heart, Zap, Target, Footprints, Flame, Moon, Check, RotateCcw, Repeat } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useWeeklySchedule, parseSets, DaySchedule } from '@/hooks/useWeeklySchedule';

interface SetProgress {
  [exerciseId: string]: number; // Number of sets completed
}

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

const getTodayKey = () => new Date().toISOString().split('T')[0];

export const TodayWorkout: React.FC = () => {
  const { getTodaySchedule, getTodayName, useSameDaily, toggleUseSameDaily } = useWeeklySchedule();
  const [setProgress, setSetProgress] = useState<SetProgress>({});
  const todaySchedule = getTodaySchedule();
  const todayName = getTodayName();
  
  useEffect(() => {
    const savedProgress = localStorage.getItem(`today-workout-progress-${getTodayKey()}`);
    if (savedProgress) {
      setSetProgress(JSON.parse(savedProgress));
    }
  }, []);

  const saveProgress = (newProgress: SetProgress) => {
    setSetProgress(newProgress);
    localStorage.setItem(`today-workout-progress-${getTodayKey()}`, JSON.stringify(newProgress));
    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event('workout-progress-updated'));
  };

  const handleSetClick = (exerciseId: string, totalSets: number) => {
    const currentSets = setProgress[exerciseId] || 0;
    const newSets = currentSets >= totalSets ? 0 : currentSets + 1;
    saveProgress({ ...setProgress, [exerciseId]: newSets });
  };

  const resetProgress = () => {
    saveProgress({});
  };

  const getExerciseProgress = (exerciseId: string, totalSets: number): number => {
    const completed = setProgress[exerciseId] || 0;
    return Math.round((completed / totalSets) * 100);
  };

  const getTotalProgress = (): number => {
    if (!todaySchedule || todaySchedule.exercises.length === 0) return 0;
    
    let totalSets = 0;
    let completedSets = 0;
    
    todaySchedule.exercises.forEach(ex => {
      const sets = parseSets(ex.setsReps);
      if (sets) {
        totalSets += sets;
        completedSets += Math.min(setProgress[ex.id] || 0, sets);
      } else {
        // For time-based exercises, count as 1 set
        totalSets += 1;
        if (setProgress[ex.id] && setProgress[ex.id] >= 1) {
          completedSets += 1;
        }
      }
    });
    
    return totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
  };

  if (!todaySchedule) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No schedule found for today</p>
      </div>
    );
  }

  const dayKey = todaySchedule.day;
  const totalProgress = getTotalProgress();

  return (
    <div className="space-y-4">
      {/* Same Daily Toggle */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50">
        <div className="flex items-center gap-2">
          <Repeat className="w-4 h-4 text-muted-foreground" />
          <Label htmlFor="same-daily" className="text-sm cursor-pointer">
            Same routine every day
          </Label>
        </div>
        <Switch
          id="same-daily"
          checked={useSameDaily}
          onCheckedChange={toggleUseSameDaily}
        />
      </div>

      {/* Day Header */}
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-xl bg-card flex items-center justify-center ${dayColors[dayKey]}`}>
          {dayIcons[dayKey]}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className={`text-lg font-bold ${dayColors[dayKey]}`}>{todaySchedule.title}</h3>
            <Badge variant="outline" className="text-xs">
              {useSameDaily ? 'Daily' : todayName}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{todaySchedule.subtitle}</p>
        </div>
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={resetProgress}
          className="text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="w-4 h-4 mr-1" />
          Reset
        </Button>
      </div>

      {/* Overall Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Today's Progress</span>
          <span className="font-semibold text-primary">{totalProgress}%</span>
        </div>
        <Progress value={totalProgress} className="h-2" />
      </div>

      {/* Exercises List */}
      {todaySchedule.exercises.length > 0 ? (
        <div className="grid gap-2">
          {todaySchedule.exercises.map((exercise) => {
            const totalSets = parseSets(exercise.setsReps);
            const completedSets = setProgress[exercise.id] || 0;
            const isCompleted = totalSets ? completedSets >= totalSets : completedSets >= 1;
            const progressPercent = totalSets 
              ? getExerciseProgress(exercise.id, totalSets)
              : (completedSets >= 1 ? 100 : 0);
            
            return (
              <Card
                key={exercise.id}
                className={`transition-all duration-200 cursor-pointer ${
                  isCompleted ? 'bg-primary/10 border-primary/30' : 'bg-card/50 hover:bg-card/80'
                }`}
                onClick={() => handleSetClick(exercise.id, totalSets || 1)}
              >
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-background/50 flex items-center justify-center ${dayColors[dayKey]}`}>
                      <Dumbbell className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {exercise.name}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs bg-background/50">
                          {exercise.setsReps}
                        </Badge>
                        {totalSets && (
                          <span className="text-xs text-muted-foreground">
                            {completedSets}/{totalSets} sets
                          </span>
                        )}
                      </div>
                    </div>
                    {isCompleted && <Check className="w-5 h-5 text-primary" />}
                  </div>
                  
                  {/* Set Progress Bar */}
                  {totalSets && totalSets > 1 && (
                    <div className="space-y-1">
                      <Progress 
                        value={progressPercent} 
                        className="h-1.5"
                      />
                      <div className="flex justify-between">
                        {Array.from({ length: totalSets }).map((_, idx) => (
                          <div
                            key={idx}
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                              idx < completedSets 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {idx + 1}
                          </div>
                        ))}
                      </div>
                    </div>
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
            <p className="text-sm text-muted-foreground">Rest Day - Take time to recover!</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Your muscles grow during rest!</p>
          </CardContent>
        </Card>
      )}

      <p className="text-center text-xs text-muted-foreground pt-2">
        Tap an exercise to mark a set complete
      </p>
    </div>
  );
};
