import React, { useState, useEffect } from 'react';
import { Dumbbell, Pencil, Check, X, Flame } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useTimer } from '@/hooks/useTimer';
import { useTodayProgress } from '@/hooks/useTodayProgress';
import { ProgressCircle } from '@/components/ProgressCircle';
import { RestTimer } from '@/components/RestTimer';
import { CalendarView } from '@/components/CalendarView';
import { WeeklySchedule } from '@/components/WeeklySchedule';
import { TodayWorkout } from '@/components/TodayWorkout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Index = () => {
  const timer = useTimer();
  const { todayProgress, todayStats } = useTodayProgress();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarHistory, setCalendarHistory] = useState<Record<string, any>>({});

  // Editable app title
  const [appTitle, setAppTitle] = useState('One-Arm Pushup');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState('');

  useEffect(() => {
    const savedTitle = localStorage.getItem('app-title');
    if (savedTitle) {
      setAppTitle(savedTitle);
    }
    
    // Load calendar history
    const loadHistory = () => {
      const savedHistory = localStorage.getItem('exercise-history');
      if (savedHistory) {
        setCalendarHistory(JSON.parse(savedHistory));
      }
    };
    
    loadHistory();
    
    // Listen for progress updates to refresh calendar
    const handleProgressUpdate = () => {
      loadHistory();
    };
    
    window.addEventListener('workout-progress-updated', handleProgressUpdate);
    
    return () => {
      window.removeEventListener('workout-progress-updated', handleProgressUpdate);
    };
  }, []);

  const handleEditTitle = () => {
    setEditTitleValue(appTitle);
    setIsEditingTitle(true);
  };

  const handleSaveTitle = () => {
    if (editTitleValue.trim()) {
      setAppTitle(editTitleValue.trim());
      localStorage.setItem('app-title', editTitleValue.trim());
    }
    setIsEditingTitle(false);
  };

  const handleCancelEdit = () => {
    setIsEditingTitle(false);
    setEditTitleValue('');
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
              <div className="flex-1">
                {isEditingTitle ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editTitleValue}
                      onChange={(e) => setEditTitleValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveTitle();
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                      className="h-8 text-lg font-bold bg-background/50"
                      autoFocus
                    />
                    <Button size="icon" variant="ghost" onClick={handleSaveTitle} className="h-8 w-8">
                      <Check className="w-4 h-4 text-primary" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={handleCancelEdit} className="h-8 w-8">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group cursor-pointer" onClick={handleEditTitle}>
                    <h1 className="text-xl font-bold text-primary text-glow">{appTitle}</h1>
                    <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                )}
                <p className="text-xs text-muted-foreground">Daily Progress Tracker</p>
              </div>
            </div>
            <div className="w-10" /> {/* Spacer for alignment */}
          </div>
        </div>
      </header>

      <main className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Progress Section - Single Circle */}
        <section className="glass rounded-2xl p-6 animate-scale-in">
          <div className="flex flex-col items-center gap-4">
            {/* Daily Progress Circle */}
            <ProgressCircle percentage={todayProgress} size={140} strokeWidth={10}>
              <Flame className="w-5 h-5 text-primary mb-1" />
              <span className="text-3xl font-bold">{todayProgress}%</span>
              <span className="text-xs text-muted-foreground">Complete</span>
            </ProgressCircle>
            
            <div className="text-center">
              <p className="text-lg font-semibold text-primary">Today's Progress</p>
              <p className="text-sm text-muted-foreground">{todayStats.completed} of {todayStats.total} sets completed</p>
            </div>

            {/* Progress Bar */}
            <div className="w-full">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500 ease-out"
                  style={{ 
                    width: `${todayProgress}%`,
                    boxShadow: todayProgress > 0 ? '0 0 10px hsl(var(--primary) / 0.5)' : 'none'
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Tabs */}
        <Tabs defaultValue="today" className="w-full">
          <TabsList className="w-full bg-muted/50 p-1">
            <TabsTrigger value="today" className="flex-1 data-[state=active]:bg-card">
              Today
            </TabsTrigger>
            <TabsTrigger value="weekly" className="flex-1 data-[state=active]:bg-card">
              Weekly
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex-1 data-[state=active]:bg-card">
              Calendar
            </TabsTrigger>
            <TabsTrigger value="timer" className="flex-1 data-[state=active]:bg-card">
              Timer
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="mt-4">
            <TodayWorkout />
          </TabsContent>

          <TabsContent value="weekly" className="mt-4">
            <WeeklySchedule />
          </TabsContent>

          <TabsContent value="calendar" className="mt-4">
            <CalendarView
              history={calendarHistory}
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
