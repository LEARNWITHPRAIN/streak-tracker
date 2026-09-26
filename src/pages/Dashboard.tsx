import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Flame, LogOut, Headphones, Zap, ZapOff, Calendar, Clock, LayoutGrid, User, MessageSquareHeart, TrendingUp, Sparkles } from 'lucide-react';
import { useTimer } from '@/hooks/useTimer';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
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
import { MusicPlayer } from '@/components/MusicPlayer';
import { MiniPlayer } from '@/components/MiniPlayer';
import { FuelPlayer } from '@/components/FuelPlayer';
import { ExerciseProgressSection } from '@/components/ExerciseProgressSection';
import { ShareProgressCard } from '@/components/ShareProgressCard';
import { NotificationOnboardingModal } from '@/components/NotificationOnboardingModal';
import { DisplayNameModal } from '@/components/DisplayNameModal';
import { toast } from 'sonner';
import DayDetailModal, { ExerciseLog } from '@/components/DayDetailModal';
import { usePWA } from '@/hooks/usePWA';
import { TrialPaywallModal } from '@/components/paywall/TrialPaywallModal';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const { notifPermission, dualReminders } = usePWA();
  const { 
    isPremium, 
    status: subStatus, 
    trialEnd, 
    loading: subLoading,
    isPaywallOpen,
    paywallReason,
    closePaywall,
  } = useSubscription();
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const timer = useTimer();
  const { 
    schedule, 
    customRoutine, 
    getTodaySchedule, 
    useSameDaily, 
    loading: scheduleLoading, 
    initializePlanSchedule, 
    refetch,
    getScheduleForDate,
    setDateWorkoutDay,
    selectedWorkoutDay,
  } = useUserWorkouts();
  const { calculateTotalProgress, fetchCalendarHistory, fetchDayDetailedLogs, loading: progressLoading, refetch: refetchLogs } = useWorkoutLogs();
  const { currentTrack } = useMusicContext();
  const [activeTab, setActiveTab] = useState('today');
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarHistory, setCalendarHistory] = useState<Record<string, any>>({});
  const [displayName, setDisplayName] = useState<string | null>(null);
  // Day detail modal
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [dayLogs, setDayLogs] = useState<ExerciseLog[]>([]);
  // Skip-animation state: when timer is skipped, circle sweeps from 0 ΓåÆ current %
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

  const trialDaysLeft = useMemo(() => {
    if (subStatus === 'trialing' && trialEnd) {
      return Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
    }
    return null;
  }, [subStatus, trialEnd]);

  // Get today's schedule - this will update when useSameDaily or selected workout changes
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
    const activeToday = getTodaySchedule();
    const history = await fetchCalendarHistory(startDate, endDate, schedule, customRoutine, useSameDaily, activeToday);
    setCalendarHistory(history);
  }, [currentMonth, fetchCalendarHistory, schedule, customRoutine, useSameDaily, getTodaySchedule]);

  // Scheduled split for the selected calendar day
  const selectedDaySchedule = useMemo(() => {
    if (!selectedDay) return null;
    return getScheduleForDate(selectedDay);
  }, [selectedDay, getScheduleForDate]);

  // Fetch detailed logs for a specific day (for modal)
  const handleDayClick = useCallback(async (dateKey: string) => {
    setSelectedDay(dateKey);
    setDayLogs([]);
    const daySched = getScheduleForDate(dateKey);
    try {
      const detailed = await fetchDayDetailedLogs(dateKey, schedule, customRoutine, useSameDaily, daySched);
      setDayLogs(detailed);
    } catch (err) {
      console.error('Error fetching day logs:', err);
    }
  }, [fetchDayDetailedLogs, schedule, customRoutine, useSameDaily, getScheduleForDate]);

  // Handle switching routine for a specific date from DayDetailModal
  const handleModalSelectRoutine = useCallback(async (newDay: string) => {
    if (!selectedDay) return;
    setDateWorkoutDay(selectedDay, newDay);
    const newSched = schedule.find(s => s.day.toLowerCase() === newDay.toLowerCase()) || null;
    if (newSched) {
      toast.success(`Updated routine to ${newSched.title}`);
      try {
        const detailed = await fetchDayDetailedLogs(selectedDay, schedule, customRoutine, useSameDaily, newSched);
        setDayLogs(detailed);
      } catch (err) {
        console.error('Error refreshing day logs after routine change:', err);
      }
    }
    loadCalendarHistory();
  }, [selectedDay, setDateWorkoutDay, schedule, customRoutine, useSameDaily, fetchDayDetailedLogs, loadCalendarHistory]);

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
        try {
          const { data } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('user_id', user.id)
            .maybeSingle();
          
          const fetchedName = data?.display_name?.trim() || null;
          setDisplayName(fetchedName);

          // If user has not configured their display name yet, prompt them first
          if (!fetchedName) {
            setShowNameModal(true);
          } else if (!dualReminders.hasPromptedOnboarding && notifPermission !== 'denied') {
            // Display name present — prompt notifications if not yet configured
            setShowNotifModal(true);
          }
        } catch (err) {
          console.error('Error fetching display name:', err);
          setShowNameModal(true);
        }
      };
      fetchDisplayName();
    }
  }, [user, loadCalendarHistory, dualReminders.hasPromptedOnboarding, notifPermission]);

  // Listen for programmatic tab switch events (e.g. from Weekly tab "Do Workout")
  useEffect(() => {
    const handleSwitchTab = (e: any) => {
      if (e.detail) {
        setActiveTab(e.detail);
      }
    };
    window.addEventListener('switch-dashboard-tab', handleSwitchTab);
    return () => window.removeEventListener('switch-dashboard-tab', handleSwitchTab);
  }, []);

  // Listen for progress and routine selection updates to refresh calendar
  useEffect(() => {
    const handleProgressUpdate = () => {
      refetchLogs();
      loadCalendarHistory();
      if (selectedDay) {
        handleDayClick(selectedDay);
      }
    };
    
    window.addEventListener('workout-progress-updated', handleProgressUpdate);
    window.addEventListener('today-workout-selected', handleProgressUpdate);
    window.addEventListener('date-routine-updated', handleProgressUpdate);
    
    return () => {
      window.removeEventListener('workout-progress-updated', handleProgressUpdate);
      window.removeEventListener('today-workout-selected', handleProgressUpdate);
      window.removeEventListener('date-routine-updated', handleProgressUpdate);
    };
  }, [loadCalendarHistory, refetchLogs, selectedDay, handleDayClick]);

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

  // Skip timer: reset timer and play 0ΓåÆ% animation on the progress circle
  const handleSkipTimer = useCallback(() => {
    timer.resetTimer();
    // Start skip animation: circle goes from 0 ΓåÆ todayProgressPercent
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
    <div className="min-h-screen bg-background w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/50 w-full max-w-full overflow-hidden">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 sm:flex-initial">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-primary/20 flex items-center justify-center shadow-lg shadow-primary/10 shrink-0">
                <Dumbbell className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-bold text-primary text-glow truncate leading-tight">Yodha Mode</h1>
                <p className="text-[11px] sm:text-xs text-muted-foreground truncate leading-tight">
                  {displayName ? `Welcome, ${displayName}` : 'Welcome Back Yodha'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {/* Streak Counter */}
              {streak > 0 && (
                <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-orange-500/20 border border-orange-500/30 shrink-0">
                  <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500 animate-pulse shrink-0" />
                  <span className="text-xs sm:text-sm font-bold text-orange-500 whitespace-nowrap">
                    {streak} <span className="hidden xs:inline">Day</span> Streak
                  </span>
                </div>
              )}

              {/* Subscription / Trial Status Badge */}
              {subStatus === 'trialing' && trialDaysLeft !== null && (
                <button
                  onClick={() => navigate('/profile')}
                  className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-primary/20 border border-primary/40 text-primary hover:bg-primary/30 transition-all shrink-0 cursor-pointer"
                  title="Trial Active — Manage in Profile"
                >
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  <span className="text-xs sm:text-sm font-bold whitespace-nowrap">
                    Trial ({trialDaysLeft}d)
                  </span>
                </button>
              )}

              {subStatus === 'active' && (
                <button
                  onClick={() => navigate('/profile')}
                  className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 hover:bg-amber-500/30 transition-all shrink-0 cursor-pointer"
                  title="Yodha Pro Active"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="text-xs sm:text-sm font-bold whitespace-nowrap">
                    PRO
                  </span>
                </button>
              )}

              {!isPremium && !subLoading && (
                <button
                  onClick={() => navigate('/profile')}
                  className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-xs sm:text-sm shadow-md hover:brightness-110 active:scale-95 transition-all shrink-0 cursor-pointer"
                  title="Start 7-Day Free Trial"
                >
                  <Flame className="w-3.5 h-3.5 fill-white" />
                  <span className="whitespace-nowrap">Free Trial</span>
                </button>
              )}

              <button
                onClick={() => navigate('/feedback')}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-muted/50 flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-colors border border-border/40 text-muted-foreground group shrink-0"
                title="Give Feedback"
              >
                <MessageSquareHeart className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </button>

              <button
                onClick={() => navigate('/profile')}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors border border-border/40 shrink-0"
                title="Profile Settings"
              >
                <User className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
              </button>
              
              <button
                onClick={handleSignOut}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors border border-border/40 shrink-0"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 overflow-hidden">
        {/* Progress Section - Responsive Hero Banner */}
        <section className="glass rounded-2xl p-4 sm:p-6 md:p-8 animate-scale-in border border-border/60 shadow-xl overflow-hidden">
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
              {/* Daily Progress Circle ΓÇö animates from 0 when timer is skipped */}
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
                      {completed} of {total} sets completed {todayProgressPercent >= 100 ? '≡ƒÄë Full workout crushed!' : ''}
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-full overflow-hidden">
          <div className="w-full max-w-full overflow-x-auto pb-1.5 md:pb-0 scrollbar-none touch-pan-x overscroll-x-contain">
            <TabsList className="inline-flex md:grid md:grid-cols-7 bg-muted/40 p-1 sm:p-1.5 gap-1 sm:gap-1.5 rounded-2xl border border-border/50 min-w-max md:min-w-0">
              <TabsTrigger value="today" className="px-4 py-2.5 text-xs md:text-sm font-medium rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all">
                <Dumbbell className="w-4 h-4 mr-1.5" />
                Today
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
              <TabsTrigger value="progress" className="px-4 py-2.5 text-xs md:text-sm font-medium rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all">
                <TrendingUp className="w-4 h-4 mr-1.5" />
                Progress
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="today" className="mt-6">
            <TodayWorkout 
              onSetComplete={handleSetComplete}
              autoStart={timer.settings.autoStart}
              onToggleAutoStart={() => timer.updateSettings({ autoStart: !timer.settings.autoStart })}
              onNavigateToWeekly={() => setActiveTab('weekly')}
            />
          </TabsContent>

          <TabsContent value="weekly" className="mt-6">
            <WeeklySchedule />
          </TabsContent>

          <TabsContent value="calendar" className="mt-6">
            <CalendarView
              history={calendarHistory}
              currentMonth={currentMonth}
              onMonthChange={setCurrentMonth}
              onDayClick={handleDayClick}
              getScheduleForDate={getScheduleForDate}
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

          <TabsContent value="progress" className="mt-6">
            <ExerciseProgressSection />
          </TabsContent>


        </Tabs>

      </main>

      {/* Mini Player - hidden when on music tab */}
      <MiniPlayer hidden={activeTab === 'music'} />


      {/* Footer - add padding when mini player is visible */}
      <footer className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center ${currentTrack && activeTab !== 'music' ? 'pb-24' : ''}`}>
        <p className="text-xs text-muted-foreground">
          Built with dedication ΓÇó Yodha Mode
        </p>
      </footer>

      {/* Display Name Modal (Prompted first if user has no display_name configured) */}
      {user && (
        <DisplayNameModal
          isOpen={showNameModal}
          userId={user.id}
          onSuccess={(savedName) => {
            setDisplayName(savedName);
            setShowNameModal(false);
            if (!dualReminders.hasPromptedOnboarding && notifPermission !== 'denied') {
              setTimeout(() => {
                setShowNotifModal(true);
              }, 400);
            }
          }}
        />
      )}

      {/* Notification Onboarding Prompt Modal on sign in / sign up */}
      <NotificationOnboardingModal
        isOpen={showNotifModal && !showNameModal}
        onClose={() => setShowNotifModal(false)}
        todayProgress={todayProgressPercent}
      />

      {/* Day Detail Modal ΓÇö shown when user clicks a calendar day */}
      {selectedDay && (
        <DayDetailModal
          date={selectedDay}
          logs={dayLogs}
          daySchedule={selectedDaySchedule}
          schedule={schedule}
          onSelectRoutine={handleModalSelectRoutine}
          onClose={() => setSelectedDay(null)}
        />
      )}

      {/* Trial Paywall Modal: pops out when user tries to perform actions without an active trial or subscription */}
      <TrialPaywallModal
        isOpen={isPaywallOpen && !isPremium}
        isMandatory={false}
        reason={paywallReason}
        onClose={closePaywall}
      />
    </div>
  );
};

export default Dashboard;

