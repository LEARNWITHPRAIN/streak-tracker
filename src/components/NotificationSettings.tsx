import React from 'react';
import { Bell, Clock, CheckCircle2, AlertCircle, Download, Smartphone, Snowflake, Dumbbell, Send } from 'lucide-react';
import { usePWA, getStoredTodayWorkoutProgress } from '@/hooks/usePWA';

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i);
const MINUTE_OPTIONS = [0, 30];

function formatTime(hour: number, minute: number): string {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  const m = minute === 0 ? '00' : '30';
  const ampm = hour < 12 ? 'AM' : 'PM';
  return `${h}:${m} ${ampm}`;
}

export const NotificationSettings: React.FC = () => {
  const {
    notifPermission,
    swReady,
    requestNotificationPermission,
    sendTestNotification,
    dualReminders,
    updateDualReminders,
    isInstalled,
    isIOS,
    isInstallable,
    promptInstall,
  } = usePWA();

  const handleEnableNotifications = async () => {
    const result = await requestNotificationPermission();
    if (result === 'granted') {
      updateDualReminders({
        winterArc: { ...dualReminders.winterArc, enabled: true },
        workout: { ...dualReminders.workout, enabled: true },
      });
    }
  };

  const handleToggleWinterArc = async () => {
    if (notifPermission !== 'granted') {
      await handleEnableNotifications();
    } else {
      updateDualReminders({
        winterArc: {
          ...dualReminders.winterArc,
          enabled: !dualReminders.winterArc.enabled,
        },
      });
    }
  };

  const handleToggleWorkout = async () => {
    if (notifPermission !== 'granted') {
      await handleEnableNotifications();
    } else {
      updateDualReminders({
        workout: {
          ...dualReminders.workout,
          enabled: !dualReminders.workout.enabled,
        },
      });
    }
  };

  const currentWorkoutPct = getStoredTodayWorkoutProgress();

  return (
    <div className="space-y-5">
      {/* Install as App Section */}
      <div className="glass rounded-2xl p-5 border border-border/40 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
            <Smartphone className="w-4.5 h-4.5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-sm">Install App</h3>
            <p className="text-xs text-muted-foreground">Add Yodha Mode to your home screen</p>
          </div>
        </div>

        {isInstalled ? (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
            <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
            <p className="text-xs text-green-400 font-medium">Yodha Mode is installed as an app!</p>
          </div>
        ) : isIOS ? (
          <div className="p-3 rounded-xl bg-muted/30 border border-border/40 space-y-2">
            <p className="text-xs text-muted-foreground font-medium">On iPhone/iPad, install via Safari:</p>
            <ol className="space-y-1.5">
              {['Tap the Share button (↑)', 'Tap "Add to Home Screen"', 'Tap "Add"'].map((s, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="w-4 h-4 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                  {s}
                </li>
              ))}
            </ol>
          </div>
        ) : isInstallable ? (
          <button
            onClick={promptInstall}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary/15 border border-primary/30 text-primary text-sm font-bold hover:bg-primary/25 transition-colors"
          >
            <Download className="w-4 h-4" />
            Install Yodha Mode
          </button>
        ) : (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/30 border border-border/40">
            <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0" />
            <p className="text-xs text-muted-foreground">Your browser will show an install prompt when available.</p>
          </div>
        )}
      </div>

      {/* Notifications Section */}
      <div className="glass rounded-2xl p-5 border border-border/40 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center">
            <Bell className="w-4.5 h-4.5 text-purple-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-foreground text-sm">Notifications & Reminders</h3>
            <p className="text-xs text-muted-foreground">Custom schedules for your scorecard & workout</p>
          </div>
        </div>

        {/* Permission status */}
        {notifPermission === 'denied' ? (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-destructive font-medium">Notifications blocked</p>
              <p className="text-xs text-muted-foreground mt-0.5">Enable notifications in your browser settings to get daily reminders.</p>
            </div>
          </div>
        ) : notifPermission === 'granted' ? (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
            <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
            <p className="text-xs text-green-400 font-medium">Notifications enabled</p>
          </div>
        ) : (
          <button
            onClick={handleEnableNotifications}
            disabled={!swReady}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 text-sm font-bold hover:bg-purple-500/25 transition-colors disabled:opacity-50"
          >
            <Bell className="w-4 h-4" />
            Enable Notifications
          </button>
        )}

        {/* Reminder 1: Winter ARC Scorecard */}
        <div className="p-4 rounded-xl bg-muted/30 border border-border/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
                <Snowflake className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <span className="text-sm font-semibold text-foreground">Winter ARC Scorecard</span>
                <p className="text-[11px] text-muted-foreground">Reminds you to record daily tasks & claim XP</p>
              </div>
            </div>
            {/* Toggle */}
            <button
              onClick={handleToggleWinterArc}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                dualReminders.winterArc.enabled ? 'bg-primary' : 'bg-muted/60 border border-border/60'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                  dualReminders.winterArc.enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {dualReminders.winterArc.enabled && (
            <div className="pt-2 border-t border-border/40 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  Time:
                </span>
                <div className="flex gap-2">
                  <select
                    value={dualReminders.winterArc.hour}
                    onChange={(e) =>
                      updateDualReminders({
                        winterArc: { ...dualReminders.winterArc, hour: parseInt(e.target.value) },
                      })
                    }
                    className="px-2.5 py-1 rounded-lg bg-background border border-border/50 text-xs text-foreground focus:outline-none"
                  >
                    {HOUR_OPTIONS.map((h) => (
                      <option key={h} value={h}>
                        {h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`}
                      </option>
                    ))}
                  </select>
                  <select
                    value={dualReminders.winterArc.minute}
                    onChange={(e) =>
                      updateDualReminders({
                        winterArc: { ...dualReminders.winterArc, minute: parseInt(e.target.value) },
                      })
                    }
                    className="w-16 px-2 py-1 rounded-lg bg-background border border-border/50 text-xs text-foreground focus:outline-none"
                  >
                    {MINUTE_OPTIONS.map((m) => (
                      <option key={m} value={m}>
                        {m === 0 ? ':00' : ':30'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-muted-foreground">
                  Fires at: <strong className="text-foreground">{formatTime(dualReminders.winterArc.hour, dualReminders.winterArc.minute)}</strong> daily
                </span>
                <button
                  onClick={() =>
                    sendTestNotification(
                      'Winter ARC Scorecard ❄️',
                      "Don't let the day slip away! Update your scorecard and bank today's XP.",
                      '/winter-arc'
                    )
                  }
                  className="px-2.5 py-1 rounded-md bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-[11px] font-medium flex items-center gap-1 hover:bg-cyan-500/25 transition-colors"
                >
                  <Send className="w-3 h-3" /> Test
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Reminder 2: Workout Progress */}
        <div className="p-4 rounded-xl bg-muted/30 border border-border/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-500/15 border border-orange-500/30 flex items-center justify-center">
                <Dumbbell className="w-4 h-4 text-orange-400" />
              </div>
              <div>
                <span className="text-sm font-semibold text-foreground">Today's Workout Progress</span>
                <p className="text-[11px] text-muted-foreground">
                  Alerts you with current completion % ({currentWorkoutPct}% right now)
                </p>
              </div>
            </div>
            {/* Toggle */}
            <button
              onClick={handleToggleWorkout}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                dualReminders.workout.enabled ? 'bg-primary' : 'bg-muted/60 border border-border/60'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                  dualReminders.workout.enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {dualReminders.workout.enabled && (
            <div className="pt-2 border-t border-border/40 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-orange-400" />
                  Time:
                </span>
                <div className="flex gap-2">
                  <select
                    value={dualReminders.workout.hour}
                    onChange={(e) =>
                      updateDualReminders({
                        workout: { ...dualReminders.workout, hour: parseInt(e.target.value) },
                      })
                    }
                    className="px-2.5 py-1 rounded-lg bg-background border border-border/50 text-xs text-foreground focus:outline-none"
                  >
                    {HOUR_OPTIONS.map((h) => (
                      <option key={h} value={h}>
                        {h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`}
                      </option>
                    ))}
                  </select>
                  <select
                    value={dualReminders.workout.minute}
                    onChange={(e) =>
                      updateDualReminders({
                        workout: { ...dualReminders.workout, minute: parseInt(e.target.value) },
                      })
                    }
                    className="w-16 px-2 py-1 rounded-lg bg-background border border-border/50 text-xs text-foreground focus:outline-none"
                  >
                    {MINUTE_OPTIONS.map((m) => (
                      <option key={m} value={m}>
                        {m === 0 ? ':00' : ':30'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-muted-foreground">
                  Fires at: <strong className="text-foreground">{formatTime(dualReminders.workout.hour, dualReminders.workout.minute)}</strong> daily
                </span>
                <button
                  onClick={() =>
                    sendTestNotification(
                      "Complete Today's Workout 💪",
                      `You have completed ${currentWorkoutPct}% of today's workout! Step in and finish strong 🔥`,
                      '/dashboard'
                    )
                  }
                  className="px-2.5 py-1 rounded-md bg-orange-500/15 border border-orange-500/30 text-orange-400 text-[11px] font-medium flex items-center gap-1 hover:bg-orange-500/25 transition-colors"
                >
                  <Send className="w-3 h-3" /> Test
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

