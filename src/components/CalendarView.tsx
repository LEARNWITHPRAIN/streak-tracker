import React, { useMemo } from 'react';
import { Calendar, Flame, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DayProgress } from '@/types/exercise';

interface CalendarViewProps {
  history: Record<string, DayProgress>;
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  history,
  currentMonth,
  onMonthChange,
}) => {
  const monthData = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days: (number | null)[] = [];
    
    // Add empty slots for days before the first day of month
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  }, [currentMonth]);

  const getDateKey = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return `${year}-${month}-${dayStr}`;
  };

  const getDayClass = (day: number | null) => {
    if (day === null) return 'calendar-day calendar-day-empty';
    
    const dateKey = getDateKey(day);
    const today = new Date().toISOString().split('T')[0];
    const progress = history[dateKey];
    
    if (dateKey === today) {
      return 'calendar-day calendar-day-active';
    }
    
    if (progress) {
      const percentage = progress.totalExercises > 0 
        ? (progress.completedExercises / progress.totalExercises) * 100 
        : 0;
      
      if (percentage >= 100) {
        return 'calendar-day calendar-day-completed';
      } else if (percentage > 0) {
        return 'calendar-day calendar-day-partial';
      }
    }
    
    return 'calendar-day calendar-day-normal';
  };

  const getCompletionIndicator = (day: number | null) => {
    if (day === null) return null;
    
    const dateKey = getDateKey(day);
    const progress = history[dateKey];
    
    if (!progress) return null;
    
    const percentage = progress.totalExercises > 0 
      ? (progress.completedExercises / progress.totalExercises) * 100 
      : 0;
    
    if (percentage >= 100) {
      return <span className="absolute bottom-0.5 sm:bottom-1 text-[8px] sm:text-[9px] font-semibold tracking-tight leading-none opacity-90">100%</span>;
    } else if (percentage > 0) {
      return <span className="absolute bottom-0.5 sm:bottom-1 text-[8px] sm:text-[9px] font-semibold tracking-tight leading-none opacity-90">{Math.round(percentage)}%</span>;
    }
    
    return null;
  };

  const calculateStreak = () => {
    const dates = Object.keys(history).sort().reverse();
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < dates.length; i++) {
      const dateKey = dates[i];
      const progress = history[dateKey];
      
      if (!progress) continue;
      
      const percentage = progress.totalExercises > 0 
        ? (progress.completedExercises / progress.totalExercises) * 100 
        : 0;
      
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const checkKey = checkDate.toISOString().split('T')[0];
      
      if (dateKey === checkKey && percentage >= 100) {
        streak++;
      } else if (dateKey === checkKey && percentage === 0) {
        break;
      } else if (dateKey !== checkKey) {
        break;
      }
    }
    
    return streak;
  };

  const streak = calculateStreak();
  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  const goToPreviousMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    onMonthChange(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    onMonthChange(newDate);
  };

  return (
    <div className="glass rounded-2xl p-6 md:p-8 animate-scale-in border border-border/60 shadow-xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-foreground">Workout History & Consistency</h3>
            <p className="text-xs text-muted-foreground">Keep your streak alive every single day</p>
          </div>
        </div>
        
        {streak > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/20 text-primary border border-primary/30">
            <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
            <span className="text-sm font-bold">{streak} Day Streak</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between p-3 bg-card/60 rounded-2xl border border-border/50">
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={goToPreviousMonth}
          className="text-muted-foreground hover:text-foreground rounded-xl"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          <span className="hidden sm:inline text-xs font-semibold">Previous</span>
        </Button>
        <h4 className="font-bold text-base md:text-lg text-primary">{monthName}</h4>
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={goToNextMonth}
          className="text-muted-foreground hover:text-foreground rounded-xl"
        >
          <span className="hidden sm:inline text-xs font-semibold">Next</span>
          <ChevronRight className="w-5 h-5 ml-1" />
        </Button>
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-7 gap-2 text-center">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-xs md:text-sm font-bold text-muted-foreground py-1">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {monthData.map((day, index) => (
            <div
              key={index}
              className={`${getDayClass(day)} relative`}
            >
              <span className="text-sm md:text-base font-semibold">{day}</span>
              {getCompletionIndicator(day)}
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-border/50">
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs md:text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-lg bg-primary glow-primary" />
            <span className="text-muted-foreground font-medium">Today</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-lg bg-primary/20 border border-primary/40" />
            <span className="text-muted-foreground font-medium">100% Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-lg bg-card border border-border" />
            <span className="text-muted-foreground font-medium">Rest / In Progress</span>
          </div>
        </div>
      </div>
    </div>
  );
};
