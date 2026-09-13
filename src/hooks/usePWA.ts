import { useState, useEffect, useCallback, useRef } from 'react';

// ── Types ───────────────────────────────────────────────────────────────────
type NotifPermission = 'default' | 'granted' | 'denied';

export interface DualReminderSettings {
  // Workout progress reminder
  workout: {
    enabled: boolean;
    hour: number;   // 0-23
    minute: number; // 0 or 30
  };
  hasPromptedOnboarding: boolean;
}

// Fallback legacy interface
interface LegacyReminderSettings {
  enabled: boolean;
  hour: number;
  minute: number;
}

const REMINDER_KEY = 'yodha_dual_reminder_settings';
const LEGACY_REMINDER_KEY = 'yodha_reminder_settings';

const DEFAULT_SETTINGS: DualReminderSettings = {
  workout: {
    enabled: true,
    hour: 19, // 7:00 PM
    minute: 0,
  },
  hasPromptedOnboarding: false,
};

function loadDualReminderSettings(): DualReminderSettings {
  try {
    const raw = localStorage.getItem(REMINDER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        workout: { ...DEFAULT_SETTINGS.workout, ...parsed.workout },
        hasPromptedOnboarding: parsed.hasPromptedOnboarding ?? false,
      };
    }

    // Check if legacy setting exists
    const legacyRaw = localStorage.getItem(LEGACY_REMINDER_KEY);
    if (legacyRaw) {
      const legacy: LegacyReminderSettings = JSON.parse(legacyRaw);
      return {
        workout: {
          enabled: legacy.enabled,
          hour: legacy.hour ?? 19,
          minute: legacy.minute ?? 0,
        },
        hasPromptedOnboarding: true,
      };
    }
  } catch {}
  return DEFAULT_SETTINGS;
}

function saveDualReminderSettings(s: DualReminderSettings) {
  localStorage.setItem(REMINDER_KEY, JSON.stringify(s));
}

// ── Calculate ms until the next occurrence of HH:MM ────────────────────────
export function msUntilNextTime(hour: number, minute: number): number {
  const now = new Date();
  const target = new Date(now);
  target.setHours(hour, minute, 0, 0);
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1); // tomorrow
  }
  return target.getTime() - now.getTime();
}

/**
 * Retrieve today's workout progress percentage from localStorage (synced by useTodayProgress)
 */
export function getStoredTodayWorkoutProgress(): number {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const raw = localStorage.getItem(`today-workout-progress-${todayStr}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      // parsed is { [exerciseId]: setsDone }
      let totalDone = 0;
      Object.values(parsed).forEach((v) => {
        if (typeof v === 'number') totalDone += v;
      });
      // Try reading user's cached schedule to calculate actual percentage
      const cachedSchedRaw = localStorage.getItem('user-schedule');
      if (cachedSchedRaw) {
        const sched = JSON.parse(cachedSchedRaw);
        const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        const todayDay = sched.find((d: any) => d.day === dayName);
        if (todayDay && Array.isArray(todayDay.exercises) && todayDay.exercises.length > 0) {
          let totalTargetSets = 0;
          let completedSets = 0;
          todayDay.exercises.forEach((ex: any) => {
            const match = ex.setsReps ? String(ex.setsReps).match(/^(\d+)/) : null;
            const targetSets = match ? parseInt(match[1], 10) : 1;
            totalTargetSets += targetSets;
            completedSets += Math.min(parsed[ex.id] || 0, targetSets);
          });
          if (totalTargetSets > 0) {
            return Math.round((completedSets / totalTargetSets) * 100);
          }
        }
      }
      if (totalDone > 0) return Math.min(100, totalDone * 10);
    }
  } catch (e) {
    console.warn('Could not read stored workout progress:', e);
  }
  return 0;
}

// ── Hook ────────────────────────────────────────────────────────────────────
export const usePWA = () => {
  // Install prompt
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  // Notifications
  const [notifPermission, setNotifPermission] = useState<NotifPermission>('default');
  const [swReady, setSwReady] = useState(false);
  const [dualReminders, setDualReminders] = useState<DualReminderSettings>(loadDualReminderSettings);
  const workoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Register service worker ────────────────────────────────────────────
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      setSwReady(true);
      console.log('[YodhaMode SW] registered', reg.scope);
    }).catch((e) => console.warn('[YodhaMode SW] registration failed', e));
  }, []);

  // ── Detect if already installed ────────────────────────────────────────
  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) setIsInstalled(true);
    const iOS = /ipad|iphone|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);
    if (iOS && (navigator as any).standalone) setIsInstalled(true);
  }, []);

  // ── Capture beforeinstallprompt ────────────────────────────────────────
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    });
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // ── Sync notification permission on mount ──────────────────────────────
  useEffect(() => {
    if ('Notification' in window) {
      setNotifPermission(Notification.permission as NotifPermission);
    }
  }, []);

  // ── Schedule Workout reminder ────────────────────────────────────────────
  const scheduleWorkout = useCallback((settings: DualReminderSettings) => {
    if (workoutTimerRef.current) clearTimeout(workoutTimerRef.current);
    if (!settings.workout.enabled || !swReady || notifPermission !== 'granted') return;

    const delay = msUntilNextTime(settings.workout.hour, settings.workout.minute);
    workoutTimerRef.current = setTimeout(async () => {
      try {
        const pct = getStoredTodayWorkoutProgress();
        const bodyText = pct >= 100
          ? "You crushed 100% of today's workout! Outstanding dedication, warrior 🔥"
          : pct > 0
          ? `You have completed ${pct}% of today's workout! Step in and finish strong 🔥`
          : "You haven't started today's workout yet! Complete it to keep your streak alive 🔥";

        const reg = await navigator.serviceWorker.ready;
        reg.active?.postMessage({
          type: 'SHOW_NOTIFICATION',
          title: "Complete Today's Workout 💪",
          body: bodyText,
          tag: 'yodha-workout-progress',
          url: '/dashboard',
        });
      } catch (err) {
        console.warn('Failed to dispatch workout notification:', err);
      }
      scheduleWorkout(settings);
    }, delay);
  }, [swReady, notifPermission]);

  // Schedule timer whenever settings or permissions change
  useEffect(() => {
    scheduleWorkout(dualReminders);
    return () => {
      if (workoutTimerRef.current) clearTimeout(workoutTimerRef.current);
    };
  }, [dualReminders, scheduleWorkout]);

  // ── Public API: trigger install ────────────────────────────────────────
  const promptInstall = useCallback(async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    if (!deferredPrompt) return 'unavailable';
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setIsInstallable(false);
    return outcome;
  }, [deferredPrompt]);

  // ── Public API: request notification permission ────────────────────────
  const requestNotificationPermission = useCallback(async (): Promise<NotifPermission> => {
    if (!('Notification' in window)) return 'denied';
    const result = await Notification.requestPermission();
    setNotifPermission(result as NotifPermission);
    return result as NotifPermission;
  }, []);

  // ── Public API: send a one-off notification right now ─────────────────
  const sendTestNotification = useCallback(async (title: string, body: string, url = '/dashboard') => {
    if (notifPermission !== 'granted' || !swReady) return;
    const reg = await navigator.serviceWorker.ready;
    reg.active?.postMessage({
      type: 'SHOW_NOTIFICATION',
      title,
      body,
      tag: 'yodha-test-' + Date.now(),
      url,
    });
  }, [notifPermission, swReady]);

  // ── Public API: update reminder settings ─────────────────────────
  const updateDualReminders = useCallback((patch: Partial<DualReminderSettings> | ((prev: DualReminderSettings) => DualReminderSettings)) => {
    setDualReminders((prev) => {
      const next = typeof patch === 'function' ? patch(prev) : { ...prev, ...patch };
      saveDualReminderSettings(next);
      return next;
    });
  }, []);

  // Legacy helper mapping for backwards compatibility
  const reminder = {
    enabled: dualReminders.workout.enabled,
    hour: dualReminders.workout.hour,
    minute: dualReminders.workout.minute,
  };

  const updateReminder = useCallback((patch: { enabled?: boolean; hour?: number; minute?: number }) => {
    setDualReminders((prev) => {
      const next: DualReminderSettings = {
        ...prev,
        workout: {
          ...prev.workout,
          ...(patch.enabled !== undefined && { enabled: patch.enabled }),
          ...(patch.hour !== undefined && { hour: patch.hour }),
          ...(patch.minute !== undefined && { minute: patch.minute }),
        },
      };
      saveDualReminderSettings(next);
      return next;
    });
  }, []);

  return {
    // Install
    isInstallable,
    isInstalled,
    isIOS,
    promptInstall,
    // Notifications
    notifPermission,
    swReady,
    requestNotificationPermission,
    sendTestNotification,
    // Reminder Preferences
    dualReminders,
    updateDualReminders,
    // Legacy fallback
    reminder,
    updateReminder,
  };
};
