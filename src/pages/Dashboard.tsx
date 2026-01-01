import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Flame, LogOut, Headphones, Zap } from 'lucide-react';
import { useTimer } from '@/hooks/useTimer';
import { useAuth } from '@/contexts/AuthContext';
import { useUserWorkouts } from '@/hooks/useUserWorkouts';
import { useWorkoutLogs } from '@/hooks/useWorkoutLogs';
import { useMusicContext } from '@/contexts/MusicContext';
import { ProgressCircle } from '@/components/ProgressCircle';
import { RestTimer } from '@/components/RestTimer';
import { CalendarView } from '@/components/CalendarView';
import { WeeklySchedule } from '@/components/WeeklySchedule';
import { TodayWorkout } from '@/components/TodayWorkout';
import { MusicPlayer } from '@/components/MusicPlayer';
import { MiniPlayer } from '@/components/MiniPlayer';
import { MiniTimerBar } from '@/components/MiniTimerBar';
import { FuelPlayer } from '@/components/FuelPlayer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const timer = useTimer();
  const { getTodaySchedule, useSameDaily, loading: scheduleLoading } = useUserWorkouts();
  const { calculateTotalProgress, fetchCalendarHistory, loading: progressLoading } = useWorkoutLogs();
  const { currentTrack } = useMusicContext();
  const [activeTab, setActiveTab] = useState('today');
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarHistory, setCalendarHistory] = useState<Record<string, any>>({});

  // Get today's schedule - this will update when useSameDaily changes
  const todaySchedule = getTodaySchedule();
  const progressData = calculateTotalProgress(todaySchedule);
  const todayProgressPercent = progressData.percentage;
  const completed = progressData.completed;
  const total = progressData.total;

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
        {/* Progress Section - Always shows progress, timer is in floating bar */}
        <section className="glass rounded-2xl p-6 animate-scale-in">
          <div className="flex flex-col items-center gap-4">
            {/* Daily Progress Circle - Always visible */}
            <ProgressCircle percentage={todayProgressPercent} size={140} strokeWidth={10}>
              <Flame className="w-5 h-5 text-primary mb-1" />
              <span className="text-3xl font-bold">{todayProgressPercent}%</span>
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
                    width: `${todayProgressPercent}%`,
                    boxShadow: todayProgressPercent > 0 ? '0 0 10px hsl(var(--primary) / 0.5)' : 'none'
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
            <TabsTrigger value="fuel" className="flex-1 data-[state=active]:bg-card">
              <Zap className="w-4 h-4 mr-1" />
              Fuel
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

          <TabsContent value="fuel" className="mt-4">
            <FuelPlayer />
          </TabsContent>
        </Tabs>
      </main>

      {/* Mini Timer Bar - floating at bottom when timer is active */}
      <MiniTimerBar
        formattedTime={timer.formattedTime}
        isRunning={timer.isRunning}
        isComplete={timer.isComplete}
        onSkip={timer.resetTimer}
        onAddTime={() => timer.addTime(30)}
        hidden={activeTab === 'timer'}
      />

      {/* Mini Player - hidden when on music tab or when timer bar is showing */}
      <MiniPlayer hidden={activeTab === 'music' || timer.isRunning || timer.isComplete} />

      {/* Footer - add padding when mini player/timer bar is visible */}
      <footer className={`container max-w-2xl mx-auto px-4 py-8 text-center ${
        (currentTrack && activeTab !== 'music') || timer.isRunning || timer.isComplete ? 'pb-24' : ''
      }`}>
        <p className="text-sm text-muted-foreground">
          Built with dedication 🔥
        </p>
      </footer>
    </div>
  );
};

export default Dashboard;
