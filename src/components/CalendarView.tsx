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
      return <span className="absolute bottom-0.5 text-[8px]">✓</span>;
    } else if (percentage > 0) {
      return <span className="absolute bottom-0.5 text-[8px]">{Math.round(percentage)}%</span>;
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
    <div className="glass rounded-2xl p-6 animate-scale-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Calendar</h3>
        </div>
        
        {streak > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 text-primary">
            <Flame className="w-4 h-4" />
            <span className="text-sm font-semibold">{streak} day streak</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-4">
        <Button 
          size="icon" 
          variant="ghost" 
          onClick={goToPreviousMonth}
          className="text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h4 className="font-medium">{monthName}</h4>
        <Button 
          size="icon" 
          variant="ghost" 
          onClick={goToNextMonth}
          className="text-muted-foreground hover:text-foreground"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center text-xs text-muted-foreground font-medium py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {monthData.map((day, index) => (
          <div
            key={index}
            className={`${getDayClass(day)} relative`}
          >
            {day}
            {getCompletionIndicator(day)}
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-primary glow-primary" />
            <span className="text-muted-foreground">Today</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-primary/20 border border-primary/30" />
            <span className="text-muted-foreground">Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-primary/20 border border-primary/30" />
            <span className="text-muted-foreground">Partial</span>
          </div>
        </div>
      </div>
    </div>
  );
};
