import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Flame, LogOut, Headphones, Zap, ZapOff, Calendar, Clock, Repeat, LayoutGrid, User, MessageSquareHeart, Snowflake } from 'lucide-react';
import { useTimer } from '@/hooks/useTimer';
import { useAuth } from '@/contexts/AuthContext';
import { useWinterArc } from '@/hooks/useWinterArc';
import { useUserWorkouts } from '@/hooks/useUserWorkouts';
import { useWorkoutLogs } from '@/hooks/useWorkoutLogs';
import { useMusicContext } from '@/contexts/MusicContext';
import { useAnimatedProgress } from '@/hooks/useAnimatedProgress';
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
  const { calculateTotalProgress, fetchCalendarHistory, loading: progressLoading, refetch: refetchLogs } = useWorkoutLogs();
  const { currentTrack } = useMusicContext();
  const [activeTab, setActiveTab] = useState('today');
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarHistory, setCalendarHistory] = useState<Record<string, any>>({});
  const [displayName, setDisplayName] = useState<string | null>(null);
  // Skip-animation state: when timer is skipped, circle sweeps from 0 → current %
  const [justSkipped, setJustSkipped] = useState(false);
  const [skipAnimTarget, setSkipAnimTarget] = useState(0);
  const skipAnimTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipAnimProgress = useAnimatedProgress(skipAnimTarget, 900);

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
  const animatedDailyProgress = useAnimatedProgress(todayProgressPercent);
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
      refetchLogs();
      loadCalendarHistory();
    };
    
    window.addEventListener('workout-progress-updated', handleProgressUpdate);
    
    return () => {
      window.removeEventListener('workout-progress-updated', handleProgressUpdate);
    };
  }, [loadCalendarHistory, refetchLogs]);

  // Refetch schedule when switching back to today tab (to get updated custom routine)
  useEffect(() => {
    if (activeTab === 'today') {
      refetch();
    }
  }, [activeTab, refetch]);

  // Only auto-start the rest timer when the auto-timer toggle is on
  const handleSetComplete = useCallback(() => {
    if (timer.settings.autoStart) {
      timer.startTimer();
    }
  }, [timer.settings.autoStart, timer.startTimer]);

  // Skip timer: reset timer and play 0→% animation on the progress circle
  const handleSkipTimer = useCallback(() => {
    timer.resetTimer();
    // Start skip animation: circle goes from 0 → todayProgressPercent
    setJustSkipped(true);
    setSkipAnimTarget(0);
    requestAnimationFrame(() => setSkipAnimTarget(todayProgressPercent));
    if (skipAnimTimeout.current) clearTimeout(skipAnimTimeout.current);
    skipAnimTimeout.current = setTimeout(() => setJustSkipped(false), 1100);
  }, [timer, todayProgressPercent]);

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
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shadow-lg shadow-primary/10">
                <Dumbbell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-primary text-glow">Yodha Mode</h1>
                <p className="text-xs text-muted-foreground">
                  {displayName ? `Welcome back, ${displayName}` : 'Welcome Back Yodha'}
                </p>
              </div>
              {/* Winter Arc entry point */}
              <WinterArcIconButton />
            </div>
            
            <div className="flex items-center gap-2.5">
              {/* Streak Counter */}
              {streak > 0 && (
                <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-orange-500/20 border border-orange-500/30">
                  <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
                  <span className="text-sm font-bold text-orange-500">{streak} Day Streak</span>
                </div>
              )}
              
              <button
                onClick={() => navigate('/feedback')}
                className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-colors border border-border/40 text-muted-foreground group"
                title="Give Feedback"
              >
                <MessageSquareHeart className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </button>

              <button
                onClick={() => navigate('/profile')}
                className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors border border-border/40"
                title="Profile Settings"
              >
                <User className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
              </button>
              
              <button
                onClick={handleSignOut}
                className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors border border-border/40"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Progress Section - Responsive Hero Banner */}
        <section className="glass rounded-2xl p-6 md:p-8 animate-scale-in border border-border/60 shadow-xl">
          {isTimerActive ? (
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Timer Display */}
              <div className="flex items-center gap-6">
                <ProgressCircle percentage={timer.progress} size={130} strokeWidth={8}>
                  <span className="text-2xl md:text-3xl font-bold">{timer.formattedTime}</span>
                  <span className="text-[10px] text-muted-foreground">Rest Timer</span>
                </ProgressCircle>
                
                <div className="text-left">
                  <p className="text-lg md:text-xl font-bold text-primary">Rest Time Active</p>
                  <p className="text-sm text-muted-foreground mt-1">Take a breather and recharge before your next set</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-center">
                {/* Auto Timer Toggle Button */}
                <button
                  type="button"
                  onClick={() => timer.updateSettings({ autoStart: !timer.settings.autoStart })}
                  className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all border ${
                    timer.settings.autoStart
                      ? 'bg-primary/20 text-primary border-primary/40 hover:bg-primary/30 shadow-sm shadow-primary/20'
                      : 'bg-muted/70 text-muted-foreground border-border/50 hover:bg-muted hover:text-foreground'
                  }`}
                  title={timer.settings.autoStart ? 'Auto Timer is ON: click to turn OFF' : 'Auto Timer is OFF: click to turn ON'}
                >
                  {timer.settings.autoStart ? (
                    <>
                      <Zap className="w-4 h-4 text-primary animate-pulse" />
                      <span>Auto Timer: ON</span>
                    </>
                  ) : (
                    <>
                      <ZapOff className="w-4 h-4 text-muted-foreground" />
                      <span>Auto Timer: OFF</span>
                    </>
                  )}
                </button>

                {timer.isRunning ? (
                  <button 
                    onClick={timer.pauseTimer}
                    className="flex-1 md:flex-none px-6 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-sm font-semibold transition-colors"
                  >
                    Pause
                  </button>
                ) : (
                  <button 
                    onClick={timer.resumeTimer}
                    className="flex-1 md:flex-none px-6 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-semibold transition-colors shadow-lg shadow-primary/20"
                  >
                    Resume
                  </button>
                )}
                <button 
                  onClick={handleSkipTimer}
                  className="flex-1 md:flex-none px-6 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-sm font-semibold transition-colors"
                >
                  Skip
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
              {/* Daily Progress Circle — animates from 0 when timer is skipped */}
              <div className="shrink-0">
                <ProgressCircle
                  percentage={justSkipped ? skipAnimProgress : animatedDailyProgress}
                  size={130}
                  strokeWidth={8}
                >
                  <Flame className="w-5 h-5 text-primary mb-1" />
                  <span className="text-2xl md:text-3xl font-bold">
                    {justSkipped ? skipAnimProgress : animatedDailyProgress}%
                  </span>
                  <span className="text-[10px] text-muted-foreground">Complete</span>
                </ProgressCircle>
              </div>
              
              <div className="flex-1 w-full space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-xl md:text-2xl font-bold text-foreground">Today's Workout Progress</h2>
                      <ShareProgressCard percentage={todayProgressPercent} completed={completed} total={total} />
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {completed} of {total} sets completed {todayProgressPercent >= 100 ? '🎉 Full workout crushed!' : ''}
                    </p>
                  </div>
                  <div className="text-sm font-semibold px-3 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 self-start sm:self-auto">
                    {total - completed} sets remaining
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full pt-1">
                  <div className="h-3 bg-muted/70 rounded-full overflow-hidden p-0.5 border border-border/30">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                      style={{ 
                        width: `${animatedDailyProgress}%`,
                        boxShadow: animatedDailyProgress > 0 ? '0 0 14px hsl(var(--primary) / 0.6)' : 'none'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Tabs - Responsive grid on PC, scrollable on mobile */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="w-full overflow-x-auto pb-1 md:pb-0">
            <TabsList className="w-full flex md:grid md:grid-cols-7 bg-muted/40 p-1.5 gap-1.5 rounded-2xl border border-border/50 min-w-max md:min-w-0">
              <TabsTrigger value="today" className="px-4 py-2.5 text-xs md:text-sm font-medium rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all">
                <Dumbbell className="w-4 h-4 mr-1.5" />
                Today
              </TabsTrigger>
              <TabsTrigger value="custom" className="px-4 py-2.5 text-xs md:text-sm font-medium rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all">
                <Repeat className="w-4 h-4 mr-1.5" />
                Custom
              </TabsTrigger>
              <TabsTrigger value="weekly" className="px-4 py-2.5 text-xs md:text-sm font-medium rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all">
                <LayoutGrid className="w-4 h-4 mr-1.5" />
                Weekly
              </TabsTrigger>
              <TabsTrigger value="calendar" className="px-4 py-2.5 text-xs md:text-sm font-medium rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all">
                <Calendar className="w-4 h-4 mr-1.5" />
                Calendar
              </TabsTrigger>
              <TabsTrigger value="timer" className="px-4 py-2.5 text-xs md:text-sm font-medium rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all">
                <Clock className="w-4 h-4 mr-1.5" />
                Timer
              </TabsTrigger>
              <TabsTrigger value="music" className="px-4 py-2.5 text-xs md:text-sm font-medium rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all">
                <Headphones className="w-4 h-4 mr-1.5" />
                Music
              </TabsTrigger>
              <TabsTrigger value="fuel" className="px-4 py-2.5 text-xs md:text-sm font-medium rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all">
                <Zap className="w-4 h-4 mr-1.5" />
                Fuel
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="today" className="mt-6">
            <TodayWorkout 
              onSetComplete={handleSetComplete}
              autoStart={timer.settings.autoStart}
              onToggleAutoStart={() => timer.updateSettings({ autoStart: !timer.settings.autoStart })}
            />
          </TabsContent>

          <TabsContent value="custom" className="mt-6">
            <CustomRoutine />
          </TabsContent>

          <TabsContent value="weekly" className="mt-6">
            <WeeklySchedule />
          </TabsContent>

          <TabsContent value="calendar" className="mt-6">
            <CalendarView
              history={calendarHistory}
              currentMonth={currentMonth}
              onMonthChange={setCurrentMonth}
            />
          </TabsContent>

          <TabsContent value="timer" className="mt-6">
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

          <TabsContent value="music" className="mt-6">
            <MusicPlayer />
          </TabsContent>

          <TabsContent value="fuel" className="mt-6">
            <FuelPlayer />
          </TabsContent>

        </Tabs>
      </main>

      {/* Mini Player - hidden when on music tab */}
      <MiniPlayer hidden={activeTab === 'music'} />


      {/* Footer - add padding when mini player is visible */}
      <footer className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center ${currentTrack && activeTab !== 'music' ? 'pb-24' : ''}`}>
        <p className="text-xs text-muted-foreground">
          Built with dedication • Yodha Mode
        </p>
      </footer>
    </div>
  );
};

export default Dashboard;

// ── Winter Arc Header Icon ─────────────────────────────────────────────────
const WinterArcIconButton: React.FC = () => {
  const navigate = useNavigate();
  const { enrolled, arcDayCount, streak } = useWinterArc();

  return (
    <button
      onClick={() => navigate('/winter-arc')}
      className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-br from-orange-500/15 to-blue-500/10 border border-orange-500/30 hover:from-orange-500/25 hover:to-blue-500/20 transition-all group shadow-sm shadow-orange-500/10"
      title={enrolled ? `Winter Arc — Day ${arcDayCount}` : 'Join Winter Arc'}
    >
      {/* Icon */}
      <div className="relative">
        <Snowflake className="w-4 h-4 text-blue-300/80 group-hover:text-blue-200 transition-colors" />
        <Flame className="w-2.5 h-2.5 text-orange-500 absolute -bottom-0.5 -right-0.5 animate-pulse" />
      </div>

      {/* Label when enrolled */}
      {enrolled && arcDayCount > 0 ? (
        <div className="flex items-center gap-1">
          <span className="text-xs font-bold text-orange-400 hidden sm:block">Day {arcDayCount}</span>
          {streak.current_streak > 0 && (
            <span className="text-[10px] font-bold text-orange-500 hidden sm:block">🔥{streak.current_streak}</span>
          )}
        </div>
      ) : (
        <span className="text-xs font-bold text-orange-400 hidden sm:block">Winter Arc</span>
      )}
    </button>
  );
};

