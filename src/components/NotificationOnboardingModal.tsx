import React, { useState } from 'react';
import { Bell, Dumbbell, Clock, CheckCircle2, ShieldCheck, X } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';
import { Button } from '@/components/ui/button';

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i);
const MINUTE_OPTIONS = [0, 30];

function formatTime(hour: number, minute: number): string {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  const m = minute === 0 ? '00' : '30';
  const ampm = hour < 12 ? 'AM' : 'PM';
  return `${h}:${m} ${ampm}`;
}

interface NotificationOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  todayProgress?: number;
}

export const NotificationOnboardingModal: React.FC<NotificationOnboardingModalProps> = ({
  isOpen,
  onClose,
  todayProgress = 0,
}) => {
  const {
    notifPermission,
    requestNotificationPermission,
    dualReminders,
    updateDualReminders,
    sendTestNotification,
  } = usePWA();

  const [workoutEnabled, setWorkoutEnabled] = useState(dualReminders.workout.enabled);
  const [workoutHour, setWorkoutHour] = useState(dualReminders.workout.hour); // default 19 (7 PM)
  const [workoutMinute, setWorkoutMinute] = useState(dualReminders.workout.minute);

  const [isRequesting, setIsRequesting] = useState(false);
  const [stepSuccess, setStepSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSaveAndEnable = async () => {
    setIsRequesting(true);

    // Save preferences
    updateDualReminders({
      workout: {
        enabled: workoutEnabled,
        hour: workoutHour,
        minute: workoutMinute,
      },
      hasPromptedOnboarding: true,
    });

    let permission = notifPermission;
    if (permission !== 'granted') {
      permission = await requestNotificationPermission();
    }

    setIsRequesting(false);

    if (permission === 'granted') {
      setStepSuccess(true);
      sendTestNotification(
        'Reminders Configured! 🚀',
        `Daily workout reminder active for ${formatTime(workoutHour, workoutMinute)}`
      );
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      onClose();
    }
  };

  const handleDismiss = () => {
    updateDualReminders({ hasPromptedOnboarding: true });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-lg rounded-3xl bg-card border border-border/80 shadow-2xl p-6 md:p-8 space-y-6 relative overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative background glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
          title="Dismiss"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary/30 to-orange-500/30 border border-primary/40 flex items-center justify-center shrink-0 shadow-inner">
            <Bell className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-foreground">
              Stay On Track & Streak Ready 🔥
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Choose your notification time so you never break your streak.
            </p>
          </div>
        </div>

        {stepSuccess ? (
          <div className="py-8 flex flex-col items-center justify-center space-y-3 text-center animate-scale-in">
            <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center text-green-400">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Notifications Active!</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              We will notify you at your selected time. You're set up for greatness!
            </p>
          </div>
        ) : (
          <>
            {/* Reminder Item: Workout Progress */}
            <div className="rounded-2xl bg-muted/30 border border-border/60 p-4 space-y-3 transition-all hover:border-primary/40">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center shrink-0">
                    <Dumbbell className="w-4.5 h-4.5 text-orange-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Daily Workout Reminder</h4>
                    <p className="text-xs text-muted-foreground">
                      Notifies you with your live progress % ({todayProgress}% done today)
                    </p>
                  </div>
                </div>

                {/* Toggle */}
                <button
                  type="button"
                  onClick={() => setWorkoutEnabled(!workoutEnabled)}
                  className={`relative w-11 h-6 rounded-full transition-colors shrink-0 mt-1 ${
                    workoutEnabled ? 'bg-primary' : 'bg-muted border border-border'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                      workoutEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {workoutEnabled && (
                <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-3 animate-fade-in">
                  <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-orange-400" />
                    Notify me at:
                  </span>
                  <div className="flex items-center gap-2">
                    <select
                      value={workoutHour}
                      onChange={(e) => setWorkoutHour(parseInt(e.target.value))}
                      className="px-2.5 py-1.5 rounded-lg bg-background border border-border/70 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {HOUR_OPTIONS.map((h) => (
                        <option key={h} value={h}>
                          {h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`}
                        </option>
                      ))}
                    </select>
                    <select
                      value={workoutMinute}
                      onChange={(e) => setWorkoutMinute(parseInt(e.target.value))}
                      className="px-2.5 py-1.5 rounded-lg bg-background border border-border/70 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {MINUTE_OPTIONS.map((m) => (
                        <option key={m} value={m}>
                          {m === 0 ? ':00' : ':30'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Notification permission prompt note */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 text-[11px] text-muted-foreground">
              <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
              <span>You will be prompted once by your browser to allow notifications.</span>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
              <Button
                onClick={handleSaveAndEnable}
                disabled={isRequesting}
                className="w-full sm:flex-1 py-5 rounded-xl font-bold text-sm bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all"
              >
                {isRequesting ? 'Enabling...' : 'Enable Notifications'}
              </Button>
              <Button
                variant="ghost"
                onClick={handleDismiss}
                className="w-full sm:w-auto text-xs text-muted-foreground hover:text-foreground py-2"
              >
                Maybe Later
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
