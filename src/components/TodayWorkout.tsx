import React from 'react';
import { Dumbbell, Heart, Zap, ZapOff, Target, Footprints, Flame, Moon, Check, RotateCcw, Repeat } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useUserWorkouts, parseSets } from '@/hooks/useUserWorkouts';
import { useWorkoutLogs } from '@/hooks/useWorkoutLogs';
import { useAnimatedProgress } from '@/hooks/useAnimatedProgress';

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
  tuesday: 'text-primary',
  wednesday: 'text-primary',
  thursday: 'text-primary',
  friday: 'text-primary',
  saturday: 'text-primary',
  sunday: 'text-muted-foreground',
};

interface TodayWorkoutProps {
  onSetComplete?: () => void;
  autoStart?: boolean;
  onToggleAutoStart?: () => void;
}

export const TodayWorkout: React.FC<TodayWorkoutProps> = ({ 
  onSetComplete,
  autoStart = true,
  onToggleAutoStart,
}) => {
  const { getTodaySchedule, getTodayName, useSameDaily, toggleUseSameDaily, loading: scheduleLoading } = useUserWorkouts();
  const { todayProgress, updateSetProgress, resetTodayProgress, calculateTotalProgress, loading: progressLoading } = useWorkoutLogs();
  
  const todaySchedule = getTodaySchedule();
  const todayName = getTodayName();

  const handleSetClick = async (exerciseId: string, exerciseName: string, totalSets: number) => {
    const currentSets = todayProgress[exerciseId] || 0;
    const newSets = currentSets >= totalSets ? 0 : currentSets + 1;
    
    // Build all exercises list to sync all to database for accurate calendar display
    const allExercises = todaySchedule?.exercises.map(ex => ({
      id: ex.id,
      name: ex.name,
      totalSets: parseSets(ex.setsReps) || 1
    })) || [];
    
    await updateSetProgress(exerciseId, exerciseName, newSets, totalSets, allExercises);
    
    // Auto-start timer when completing ANY set (not when resetting to 0)
    if (newSets > 0 && newSets > currentSets && onSetComplete) {
      onSetComplete();
    }
  };

  const getExerciseProgress = (exerciseId: string, totalSets: number): number => {
    const completed = todayProgress[exerciseId] || 0;
    return Math.round((completed / totalSets) * 100);
  };

  const { percentage: totalProgress } = calculateTotalProgress(todaySchedule);
  const animatedTotalProgress = useAnimatedProgress(totalProgress);

  if (scheduleLoading || progressLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground animate-pulse">Loading workout...</p>
      </div>
    );
  }

  if (!todaySchedule) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No schedule found for today</p>
      </div>
    );
  }

  const dayKey = todaySchedule.day;

  return (
    <div className="space-y-6">
      {/* Top Banner / Settings */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-card/60 border border-border/50 backdrop-blur-sm">
        {/* Day Header */}
        <div className="flex items-center gap-3.5">
          <div className={`w-12 h-12 rounded-2xl bg-background/80 border border-border/50 flex items-center justify-center shadow-inner ${dayColors[dayKey]}`}>
            {dayIcons[dayKey]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-xl font-bold tracking-tight ${dayColors[dayKey]}`}>{todaySchedule.title}</h3>
              <Badge variant="outline" className="text-xs px-2.5 py-0.5 bg-background/50 border-primary/30">
                {useSameDaily ? 'Daily Routine' : todayName}
              </Badge>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground mt-0.5">{todaySchedule.subtitle}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
          {onToggleAutoStart && (
            <button
              type="button"
              onClick={onToggleAutoStart}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs md:text-sm font-medium border transition-all ${
                autoStart
                  ? 'bg-primary/15 text-primary border-primary/40 hover:bg-primary/25'
                  : 'bg-muted/40 text-muted-foreground border-border/30 hover:bg-muted hover:text-foreground'
              }`}
              title={autoStart ? 'Auto-start Rest Timer is ON' : 'Auto-start Rest Timer is OFF'}
            >
              {autoStart ? <Zap className="w-3.5 h-3.5 text-primary" /> : <ZapOff className="w-3.5 h-3.5 text-muted-foreground" />}
              <span>Auto Timer: {autoStart ? 'ON' : 'OFF'}</span>
            </button>
          )}

          <div className="flex items-center gap-2.5 bg-muted/40 px-3 py-1.5 rounded-xl border border-border/30">
            <Repeat className="w-4 h-4 text-primary" />
            <Label htmlFor="same-daily" className="text-xs md:text-sm cursor-pointer font-medium">
              Same routine daily
            </Label>
            <Switch
              id="same-daily"
              checked={useSameDaily}
              onCheckedChange={toggleUseSameDaily}
            />
          </div>

          <Button 
            size="sm" 
            variant="ghost" 
            onClick={resetTodayProgress}
            className="text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-xl"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Reset All
          </Button>
        </div>
      </div>

      {/* Overall Progress Status */}
      <div className="space-y-2 bg-card/40 border border-border/40 p-4 rounded-2xl">
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground font-medium">Workout Completion</span>
          <span className="font-bold text-primary text-base">{animatedTotalProgress}%</span>
        </div>
        <Progress value={animatedTotalProgress} className="h-2.5 rounded-full" activeOnProgress />
      </div>

      {/* Exercises Grid - Responsive for PC (1 col mobile, 2 col tablet, 3 col desktop) */}
      {todaySchedule.exercises.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {todaySchedule.exercises.map((exercise) => {
            const totalSets = parseSets(exercise.setsReps);
            const completedSets = todayProgress[exercise.id] || 0;
            const isCompleted = totalSets ? completedSets >= totalSets : completedSets >= 1;
            const progressPercent = totalSets 
              ? getExerciseProgress(exercise.id, totalSets)
              : (completedSets >= 1 ? 100 : 0);
            
            return (
              <Card
                key={exercise.id}
                className={`transition-all duration-300 border rounded-2xl cursor-pointer hover:shadow-lg ${
                  isCompleted 
                    ? 'bg-primary/10 border-primary/40 shadow-primary/5' 
                    : 'bg-card/70 hover:bg-card hover:border-primary/30 border-border/60'
                }`}
                onClick={() => handleSetClick(exercise.id, exercise.name, totalSets || 1)}
              >
                <CardContent className="p-4 space-y-3.5">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl bg-background/70 border border-border/50 flex items-center justify-center shrink-0 ${dayColors[dayKey]}`}>
                      <Dumbbell className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-base truncate ${isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {exercise.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs bg-background/60 font-mono">
                          {exercise.setsReps}
                        </Badge>
                        {totalSets && (
                          <span className="text-xs font-semibold text-muted-foreground">
                            {completedSets}/{totalSets} sets
                          </span>
                        )}
                      </div>
                    </div>
                    {isCompleted && (
                      <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4 text-primary font-bold" />
                      </div>
                    )}
                  </div>
                  
                  {/* Set Progress Bar & Set Bubbles */}
                  {totalSets && totalSets > 1 && (
                    <div className="space-y-2 pt-1">
                      <Progress 
                        value={progressPercent} 
                        className="h-1.5 rounded-full"
                        activeOnProgress
                      />
                      <div className="flex justify-between gap-1">
                        {Array.from({ length: totalSets }).map((_, idx) => (
                          <div
                            key={idx}
                            className={`flex-1 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                              idx < completedSets 
                                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30' 
                                : 'bg-muted/70 text-muted-foreground hover:bg-muted'
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
        <Card className="bg-card/30 border-dashed rounded-2xl p-8 text-center">
          <CardContent className="space-y-2">
            <Moon className="w-10 h-10 mx-auto text-muted-foreground/60" />
            <p className="text-base font-semibold text-muted-foreground">Rest Day - Take time to recover!</p>
            <p className="text-xs text-muted-foreground/60">Your muscles grow and rebuild during rest!</p>
          </CardContent>
        </Card>
      )}

      <p className="text-center text-xs text-muted-foreground pt-2">
        💡 Click on an exercise card or set button to mark a set complete
      </p>
    </div>
  );
};

export default TodayWorkout;
