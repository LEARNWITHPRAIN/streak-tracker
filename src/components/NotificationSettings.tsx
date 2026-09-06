import React from 'react';
import { Bell, BellOff, Clock, CheckCircle2, AlertCircle, Download, Smartphone } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

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
    reminder,
    updateReminder,
    isInstalled,
    isIOS,
    isInstallable,
    promptInstall,
  } = usePWA();

  const handleEnableNotifications = async () => {
    const result = await requestNotificationPermission();
    if (result === 'granted') {
      updateReminder({ enabled: true });
    }
  };

  const handleToggleReminder = async () => {
    if (notifPermission !== 'granted') {
      await handleEnableNotifications();
    } else {
      updateReminder({ enabled: !reminder.enabled });
    }
  };

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
      <div className="glass rounded-2xl p-5 border border-border/40 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center">
            <Bell className="w-4.5 h-4.5 text-purple-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-foreground text-sm">Notifications</h3>
            <p className="text-xs text-muted-foreground">Daily reminders to keep your streak alive</p>
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

        {/* Daily reminder toggle */}
        {notifPermission === 'granted' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/40">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Daily Reminder</span>
              </div>
              {/* Toggle */}
              <button
                onClick={handleToggleReminder}
                className={`relative w-11 h-6 rounded-full transition-colors ${reminder.enabled ? 'bg-primary' : 'bg-muted/60 border border-border/60'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${reminder.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* Time picker */}
            {reminder.enabled && (
              <div className="p-3 rounded-xl bg-muted/20 border border-border/30 space-y-2 animate-scale-in">
                <p className="text-xs text-muted-foreground font-medium">Remind me at</p>
                <div className="flex gap-2">
                  <select
                    value={reminder.hour}
                    onChange={(e) => updateReminder({ hour: parseInt(e.target.value) })}
                    className="flex-1 px-3 py-2 rounded-xl bg-background border border-border/50 text-sm text-foreground focus:outline-none focus:border-primary/50"
                  >
                    {HOUR_OPTIONS.map((h) => (
                      <option key={h} value={h}>{h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`}</option>
                    ))}
                  </select>
                  <select
                    value={reminder.minute}
                    onChange={(e) => updateReminder({ minute: parseInt(e.target.value) })}
                    className="w-24 px-3 py-2 rounded-xl bg-background border border-border/50 text-sm text-foreground focus:outline-none focus:border-primary/50"
                  >
                    {MINUTE_OPTIONS.map((m) => (
                      <option key={m} value={m}>{m === 0 ? ':00' : ':30'}</option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-muted-foreground">
                  Next reminder: <span className="text-primary font-semibold">{formatTime(reminder.hour, reminder.minute)}</span> daily
                </p>

                {/* Test notification */}
                <button
                  onClick={() => sendTestNotification('Yodha Mode 🔥', "This is a test reminder — keep that streak alive!")}
                  className="w-full py-2 rounded-xl border border-border/50 text-xs text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors"
                >
                  Send Test Notification
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
