import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Flame, LogOut, Headphones } from 'lucide-react';
import { useTimer } from '@/hooks/useTimer';
import { useAuth } from '@/contexts/AuthContext';
import { useUserWorkouts } from '@/hooks/useUserWorkouts';
import { useWorkoutLogs } from '@/hooks/useWorkoutLogs';
import { ProgressCircle } from '@/components/ProgressCircle';
import { RestTimer } from '@/components/RestTimer';
import { CalendarView } from '@/components/CalendarView';
import { WeeklySchedule } from '@/components/WeeklySchedule';
import { TodayWorkout } from '@/components/TodayWorkout';
import { MusicPlayer } from '@/components/MusicPlayer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const timer = useTimer();
  const { getTodaySchedule, loading: scheduleLoading } = useUserWorkouts();
  const { calculateTotalProgress, fetchCalendarHistory, loading: progressLoading } = useWorkoutLogs();
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarHistory, setCalendarHistory] = useState<Record<string, any>>({});

  const todaySchedule = getTodaySchedule();
  const { percentage: todayProgress, completed, total } = calculateTotalProgress(todaySchedule);

  // Fetch calendar history for current month
  const loadCalendarHistory = useCallback(async () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    
    const history = await fetchCalendarHistory(startDate, endDate);
    setCalendarHistory(history);
  }, [currentMonth, fetchCalendarHistory]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadCalendarHistory();
    }
  }, [user, loadCalendarHistory]);

  // Listen for progress updates to refresh calendar
  useEffect(() => {
    const handleProgressUpdate = () => {
      loadCalendarHistory();
    };
    
    window.addEventListener('workout-progress-updated', handleProgressUpdate);
    
    return () => {
      window.removeEventListener('workout-progress-updated', handleProgressUpdate);
    };
  }, [loadCalendarHistory]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading || scheduleLoading || progressLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

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
                <h1 className="text-xl font-bold text-primary text-glow">Yodha Mode</h1>
                <p className="text-xs text-muted-foreground">Daily Progress Tracker</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </header>

      <main className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Progress Section - Shows Timer when running, Progress when not */}
        <section className="glass rounded-2xl p-6 animate-scale-in">
          <div className="flex flex-col items-center gap-4">
            {timer.isRunning || (timer.timeRemaining < timer.settings.restDuration && timer.timeRemaining > 0) ? (
              <>
                {/* Timer Display */}
                <ProgressCircle percentage={timer.progress} size={140} strokeWidth={10}>
                  <span className="text-3xl font-bold">{timer.formattedTime}</span>
                  <span className="text-xs text-muted-foreground">Rest Timer</span>
                </ProgressCircle>
                
                <div className="text-center">
                  <p className="text-lg font-semibold text-primary">Rest Time</p>
                  <p className="text-sm text-muted-foreground">Take a breather before next set</p>
                </div>

                <div className="flex gap-2">
                  {timer.isRunning ? (
                    <button 
                      onClick={timer.pauseTimer}
                      className="px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 text-sm font-medium transition-colors"
                    >
                      Pause
                    </button>
                  ) : (
                    <button 
                      onClick={timer.resumeTimer}
                      className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium transition-colors"
                    >
                      Resume
                    </button>
                  )}
                  <button 
                    onClick={timer.resetTimer}
                    className="px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 text-sm font-medium transition-colors"
                  >
                    Skip
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Daily Progress Circle */}
                <ProgressCircle percentage={todayProgress} size={140} strokeWidth={10}>
                  <Flame className="w-5 h-5 text-primary mb-1" />
                  <span className="text-3xl font-bold">{todayProgress}%</span>
                  <span className="text-xs text-muted-foreground">Complete</span>
                </ProgressCircle>
                
                <div className="text-center">
                  <p className="text-lg font-semibold text-primary">Today's Progress</p>
                  <p className="text-sm text-muted-foreground">{completed} of {total} sets completed</p>
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
              </>
            )}
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
            <TabsTrigger value="music" className="flex-1 data-[state=active]:bg-card">
              <Headphones className="w-4 h-4 mr-1" />
              Music
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="mt-4">
            <TodayWorkout onSetComplete={timer.startTimer} />
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

          <TabsContent value="music" className="mt-4">
            <MusicPlayer />
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

export default Dashboard;
