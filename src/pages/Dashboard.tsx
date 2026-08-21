import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Flame, LogOut, Headphones, Zap, Calendar, Clock, Repeat, LayoutGrid, User } from 'lucide-react';
import { useTimer } from '@/hooks/useTimer';
import { useAuth } from '@/contexts/AuthContext';
import { useUserWorkouts } from '@/hooks/useUserWorkouts';
import { useWorkoutLogs } from '@/hooks/useWorkoutLogs';
import { useMusicContext } from '@/contexts/MusicContext';
import { supabase } from '@/integrations/supabase/client';
import { ProgressCircle } from '@/components/ProgressCircle';
import { RestTimer } from '@/components/RestTimer';
import { CalendarView } from '@/components/CalendarView';
import { WeeklySchedule } from '@/components/WeeklySchedule';
import { TodayWorkout } from '@/components/TodayWorkout';
import { CustomRoutine } from '@/components/CustomRoutine';
import { MusicPlayer } from '@/components/MusicPlayer';
import { MiniPlayer } from '@/components/MiniPlayer';
import { FuelPlayer } from '@/components/FuelPlayer';
import { ShareProgressCard } from '@/components/ShareProgressCard';


import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const timer = useTimer();
  const { getTodaySchedule, useSameDaily, loading: scheduleLoading, refetch } = useUserWorkouts();
  const { calculateTotalProgress, fetchCalendarHistory, loading: progressLoading } = useWorkoutLogs();
  const { currentTrack } = useMusicContext();
  const [activeTab, setActiveTab] = useState('today');
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarHistory, setCalendarHistory] = useState<Record<string, any>>({});
  const [displayName, setDisplayName] = useState<string | null>(null);

  // Calculate streak from calendar history
  const calculateStreak = useCallback(() => {
    const dates = Object.keys(calendarHistory).sort().reverse();
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const checkKey = checkDate.toISOString().split('T')[0];
      const progress = calendarHistory[checkKey];
      
      if (progress) {
        const percentage = progress.totalExercises > 0 
          ? (progress.completedExercises / progress.totalExercises) * 100 
          : 0;
        
        if (percentage >= 100) {
          streak++;
        } else if (i === 0 && percentage > 0) {
          // Today in progress doesn't break streak
          continue;
        } else {
          break;
        }
      } else if (i > 0) {
        // Missing day breaks streak (except today)
        break;
      }
    }
    
    return streak;
  }, [calendarHistory]);

  const streak = calculateStreak();

  // Get today's schedule - this will update when useSameDaily changes
  const todaySchedule = getTodaySchedule();
  const progressData = calculateTotalProgress(todaySchedule);
  const todayProgressPercent = progressData.percentage;
  const completed = progressData.completed;
  const total = progressData.total;

  // Check if timer is active (running or paused mid-timer)
  const isTimerActive = timer.isRunning || (timer.timeRemaining < timer.settings.restDuration && timer.timeRemaining > 0);

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
      // Fetch display name from profile
      const fetchDisplayName = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('user_id', user.id)
          .single();
        setDisplayName(data?.display_name || null);
      };
      fetchDisplayName();
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

  // Refetch schedule when switching back to today tab (to get updated custom routine)
  useEffect(() => {
    if (activeTab === 'today') {
      refetch();
    }
  }, [activeTab, refetch]);

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
        <div className="container max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
                <Dumbbell className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-primary text-glow">Yodha Mode</h1>
                <p className="text-[10px] text-muted-foreground">
                  {displayName ? `Welcome back, ${displayName}` : 'Welcome Back Yodha'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Streak Counter */}
              {streak > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/20">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-bold text-orange-500">{streak}</span>
                </div>
              )}
              
              <button
                onClick={() => navigate('/profile')}
                className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
                title="Profile Settings"
              >
                <User className="w-4 h-4 text-muted-foreground" />
              </button>
              
              <button
                onClick={handleSignOut}
                className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Progress Section - Shows Timer when running, Progress when not */}
        <section className="glass rounded-2xl p-4 animate-scale-in">
          <div className="flex flex-col items-center gap-3">
            {isTimerActive ? (
              <>
                {/* Timer Display */}
                <ProgressCircle percentage={timer.progress} size={120} strokeWidth={8}>
                  <span className="text-2xl font-bold">{timer.formattedTime}</span>
                  <span className="text-[10px] text-muted-foreground">Rest Timer</span>
                </ProgressCircle>
                
                <div className="text-center">
                  <p className="text-base font-semibold text-primary">Rest Time</p>
                  <p className="text-xs text-muted-foreground">Take a breather before next set</p>
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
                <ProgressCircle percentage={todayProgressPercent} size={120} strokeWidth={8}>
                  <Flame className="w-4 h-4 text-primary mb-1" />
                  <span className="text-2xl font-bold">{todayProgressPercent}%</span>
                  <span className="text-[10px] text-muted-foreground">Complete</span>
                </ProgressCircle>
                
                <div className="text-center flex items-center justify-center gap-2">
                  <p className="text-base font-semibold text-primary">Today's Progress</p>
                  <ShareProgressCard percentage={todayProgressPercent} completed={completed} total={total} />
                </div>
                <p className="text-xs text-muted-foreground">{completed} of {total} sets completed</p>

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
              </>
            )}
          </div>
        </section>

        {/* Tabs - Scrollable for mobile */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <ScrollArea className="w-full whitespace-nowrap">
            <TabsList className="inline-flex w-max bg-muted/50 p-1 gap-1">
              <TabsTrigger value="today" className="px-3 py-2 text-xs data-[state=active]:bg-card">
                <Dumbbell className="w-3.5 h-3.5 mr-1" />
                Today
              </TabsTrigger>
              <TabsTrigger value="custom" className="px-3 py-2 text-xs data-[state=active]:bg-card">
                <Repeat className="w-3.5 h-3.5 mr-1" />
                Custom
              </TabsTrigger>
              <TabsTrigger value="weekly" className="px-3 py-2 text-xs data-[state=active]:bg-card">
                <LayoutGrid className="w-3.5 h-3.5 mr-1" />
                Weekly
              </TabsTrigger>
              <TabsTrigger value="calendar" className="px-3 py-2 text-xs data-[state=active]:bg-card">
                <Calendar className="w-3.5 h-3.5 mr-1" />
                Calendar
              </TabsTrigger>
              <TabsTrigger value="timer" className="px-3 py-2 text-xs data-[state=active]:bg-card">
                <Clock className="w-3.5 h-3.5 mr-1" />
                Timer
              </TabsTrigger>
              <TabsTrigger value="music" className="px-3 py-2 text-xs data-[state=active]:bg-card">
                <Headphones className="w-3.5 h-3.5 mr-1" />
                Music
              </TabsTrigger>
              <TabsTrigger value="fuel" className="px-3 py-2 text-xs data-[state=active]:bg-card">
                <Zap className="w-3.5 h-3.5 mr-1" />
                Fuel
              </TabsTrigger>
            </TabsList>
            <ScrollBar orientation="horizontal" className="invisible" />
          </ScrollArea>

          <TabsContent value="today" className="mt-4">
            <TodayWorkout onSetComplete={timer.startTimer} />
          </TabsContent>

          <TabsContent value="custom" className="mt-4">
            <CustomRoutine />
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

      {/* Mini Player - hidden when on music tab */}
      <MiniPlayer hidden={activeTab === 'music'} />


      {/* Footer - add padding when mini player is visible */}
      <footer className={`container max-w-2xl mx-auto px-4 py-6 text-center ${currentTrack && activeTab !== 'music' ? 'pb-20' : ''}`}>
        <p className="text-xs text-muted-foreground">
          Built with dedication
        </p>
      </footer>
    </div>
  );
};

export default Dashboard;
