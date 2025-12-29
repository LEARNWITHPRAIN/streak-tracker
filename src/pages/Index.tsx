import React, { useState } from 'react';
import { Dumbbell, RotateCcw, Zap, Target, CheckCircle, Clock, SkipForward } from 'lucide-react';
import { useExercises } from '@/hooks/useExercises';
import { useTimer } from '@/hooks/useTimer';
import { ProgressCircle } from '@/components/ProgressCircle';
import { ExerciseCard } from '@/components/ExerciseCard';
import { RestTimer } from '@/components/RestTimer';
import { CalendarView } from '@/components/CalendarView';
import { AddExerciseForm } from '@/components/AddExerciseForm';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Index = () => {
  const {
    exercises,
    history,
    stats,
    completionPercentage,
    nextExercise,
    updateExerciseStatus,
    addExercise,
    editExercise,
    deleteExercise,
    resetToday,
  } = useExercises();

  const timer = useTimer();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const handleMarkDone = () => {
    if (nextExercise) {
      updateExerciseStatus(nextExercise.id, 'done');
      timer.startTimer();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="container max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-primary text-glow">One-Arm Pushup</h1>
                <p className="text-xs text-muted-foreground">Daily Progress Tracker</p>
              </div>
            </div>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={resetToday}
              className="text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Progress Section */}
        <section className="glass rounded-2xl p-6 animate-scale-in">
          <div className="flex flex-col items-center gap-4">
            <ProgressCircle percentage={completionPercentage} size={140} strokeWidth={10}>
              <span className="text-3xl font-bold">{completionPercentage}%</span>
              <span className="text-xs text-muted-foreground">Complete</span>
            </ProgressCircle>

            <div className="grid grid-cols-4 gap-4 w-full">
              <div className="stat-card">
                <Target className="w-4 h-4 text-muted-foreground" />
                <span className="text-xl font-bold">{stats.total}</span>
                <span className="text-xs text-muted-foreground">TOTAL</span>
              </div>
              <div className="stat-card">
                <CheckCircle className="w-4 h-4 text-primary" />
                <span className="text-xl font-bold text-primary">{stats.done}</span>
                <span className="text-xs text-muted-foreground">DONE</span>
              </div>
              <div className="stat-card">
                <Clock className="w-4 h-4 text-secondary" />
                <span className="text-xl font-bold text-secondary">{stats.pending}</span>
                <span className="text-xs text-muted-foreground">PENDING</span>
              </div>
              <div className="stat-card">
                <SkipForward className="w-4 h-4 text-muted-foreground" />
                <span className="text-xl font-bold">{stats.skipped}</span>
                <span className="text-xs text-muted-foreground">SKIPPED</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500 ease-out"
                  style={{ 
                    width: `${completionPercentage}%`,
                    boxShadow: completionPercentage > 0 ? '0 0 10px hsl(var(--primary) / 0.5)' : 'none'
                  }}
                />
              </div>
              <p className="text-center text-sm text-muted-foreground mt-2">
                {stats.done} of {stats.total} exercises completed
              </p>
            </div>
          </div>
        </section>

        {/* Next Exercise Card */}
        {nextExercise && (
          <section className="bg-primary rounded-2xl p-6 glow-primary-intense animate-slide-up">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-primary-foreground" />
              <span className="text-xs font-semibold text-primary-foreground/80 uppercase tracking-wide">
                Next Exercise
              </span>
            </div>
            <h2 className="text-xl font-bold text-primary-foreground mb-4">
              {nextExercise.name}
            </h2>
            <Button 
              onClick={handleMarkDone}
              className="w-full bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold"
            >
              Mark as Done →
            </Button>
          </section>
        )}

        {/* Tabs for Exercises and Calendar */}
        <Tabs defaultValue="exercises" className="w-full">
          <TabsList className="w-full bg-muted/50 p-1">
            <TabsTrigger value="exercises" className="flex-1 data-[state=active]:bg-card">
              All Exercises
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex-1 data-[state=active]:bg-card">
              Calendar
            </TabsTrigger>
            <TabsTrigger value="timer" className="flex-1 data-[state=active]:bg-card">
              Timer
            </TabsTrigger>
          </TabsList>

          <TabsContent value="exercises" className="mt-4 space-y-3">
            <h3 className="text-lg font-semibold">All Exercises</h3>
            
            <div className="space-y-2">
              {exercises.map((exercise) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  isNext={nextExercise?.id === exercise.id}
                  onStatusChange={updateExerciseStatus}
                  onEdit={editExercise}
                  onDelete={deleteExercise}
                  onTimerStart={timer.startTimer}
                />
              ))}
            </div>

            <AddExerciseForm onAdd={addExercise} />

            <p className="text-center text-sm text-muted-foreground py-4">
              Keep pushing toward your one-arm pushup goal! 💪
            </p>
          </TabsContent>

          <TabsContent value="calendar" className="mt-4">
            <CalendarView
              history={history}
              currentMonth={currentMonth}
              onMonthChange={setCurrentMonth}
            />
          </TabsContent>

          <TabsContent value="timer" className="mt-4">
            <RestTimer
              isRunning={timer.isRunning}
              timeRemaining={timer.timeRemaining}
              formattedTime={timer.formattedTime}
              isComplete={timer.isComplete}
              progress={timer.progress}
              settings={timer.settings}
              onStart={timer.startTimer}
              onPause={timer.pauseTimer}
              onResume={timer.resumeTimer}
              onReset={timer.resetTimer}
              onUpdateSettings={timer.updateSettings}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="container max-w-2xl mx-auto px-4 py-8 text-center">
        <p className="text-sm text-muted-foreground">
          Built with dedication 🔥
        </p>
      </footer>
    </div>
  );
};

export default Index;
