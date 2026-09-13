import { useState, useEffect, useCallback, useRef } from 'react';

// ── Types ───────────────────────────────────────────────────────────────────
export type NotifPermission = 'default' | 'granted' | 'denied';

export interface DualReminderSettings {
  workout: {
    enabled: boolean;
    hour: number;   // 0-23
    minute: number; // 0-59
  };
  hasPromptedOnboarding: boolean;
}

interface LegacyReminderSettings {
  enabled: boolean;
  hour: number;
  minute: number;
}

const REMINDER_KEY = 'yodha_dual_reminder_settings';
const LEGACY_REMINDER_KEY = 'yodha_reminder_settings';

export const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i);
export const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, i) => i);

export const formatTime = (hour: number, minute: number): string => {
  const period = hour >= 12 ? 'PM' : 'AM';
  const h = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const m = minute < 10 ? `0${minute}` : `${minute}`;
  return `${h}:${m} ${period}`;
};

const DEFAULT_SETTINGS: DualReminderSettings = {
  workout: {
    enabled: true,
    hour: 19, // 7:00 PM default
    minute: 0,
  },
  hasPromptedOnboarding: false,
};

export function loadDualReminderSettings(): DualReminderSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(REMINDER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        workout: {
          enabled: parsed.workout?.enabled ?? DEFAULT_SETTINGS.workout.enabled,
          hour: typeof parsed.workout?.hour === 'number' ? parsed.workout.hour : DEFAULT_SETTINGS.workout.hour,
          minute: typeof parsed.workout?.minute === 'number' ? parsed.workout.minute : DEFAULT_SETTINGS.workout.minute,
        },
        hasPromptedOnboarding: parsed.hasPromptedOnboarding ?? false,
      };
    }

    // Check legacy setting
    const legacyRaw = localStorage.getItem(LEGACY_REMINDER_KEY);
    if (legacyRaw) {
      const legacy: LegacyReminderSettings = JSON.parse(legacyRaw);
      return {
        workout: {
          enabled: legacy.enabled ?? true,
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
  if (typeof window === 'undefined') return;
  localStorage.setItem(REMINDER_KEY, JSON.stringify(s));
  // Broadcast update to all components & tabs
  window.dispatchEvent(new CustomEvent('yodha-reminders-updated', { detail: s }));
}

// ── Calculate ms until the next occurrence of HH:MM ────────────────────────
export function msUntilNextTime(hour: number, minute: number): number {
  const now = new Date();
  const target = new Date(now);
  target.setHours(hour, minute, 0, 0);
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1); // tomorrow
  }
  return Math.max(500, target.getTime() - now.getTime());
}

/**
 * Generates user-customized motivating notification text
 */
export function getMotivatingWorkoutMessage(customName?: string | null): { title: string; body: string } {
  const name =
    customName?.trim() ||
    (typeof window !== 'undefined' ? localStorage.getItem('yodha_display_name')?.trim() : '') ||
    'Warrior';

  const pct = getStoredTodayWorkoutProgress();

  const title = `Hey ${name}, your workout timing is now here! 💪`;
  let body = `Time to crush today's workout! Step in and keep your warrior streak alive 🔥`;

  if (pct > 0 && pct < 100) {
    body = `You have completed ${pct}% of today's workout! Step in, finish strong and crush your goals 🔥`;
  } else if (pct >= 100) {
    body = `You crushed 100% of today's workout! Outstanding dedication, warrior 🔥`;
  }

  return { title, body };
}

/**
 * Universal notification dispatcher (Service Worker + fallback Window Notification)
 */
export async function dispatchNotification(title: string, body: string, url = '/dashboard') {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission !== 'granted') return false;

  // 1. Try Service Worker showNotification
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, {
          body,
          icon: '/yodha-favicon.png',
          badge: '/yodha-favicon.png',
          tag: 'yodha-workout-' + Date.now(),
          renotify: true,
          vibrate: [200, 100, 200, 100, 200],
          data: { url },
        });
        return true;
      }
    } catch (swErr) {
      console.warn('[Yodha SW] showNotification error, falling back:', swErr);
    }
  }

  // 2. Fallback to standard Window Notification
  try {
    const notif = new Notification(title, {
      body,
      icon: '/yodha-favicon.png',
      tag: 'yodha-workout-' + Date.now(),
    });
    notif.onclick = () => {
      window.focus();
      window.location.href = url;
    };
    return true;
  } catch (winErr) {
    console.warn('[Yodha] Window Notification error:', winErr);
    return false;
  }
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
      let totalDone = 0;
      Object.values(parsed).forEach((v) => {
        if (typeof v === 'number') totalDone += v;
      });
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
  const [notifPermission, setNotifPermission] = useState<NotifPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission as NotifPermission;
    }
    return 'default';
  });
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

    navigator.serviceWorker.ready.then(() => setSwReady(true));
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

  // ── Synchronize dualReminders across components & tabs ──────────────────
  useEffect(() => {
    const handleUpdate = () => {
      setDualReminders(loadDualReminderSettings());
    };
    window.addEventListener('yodha-reminders-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('yodha-reminders-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // ── Schedule Workout reminder ────────────────────────────────────────────
  const scheduleWorkout = useCallback((settings: DualReminderSettings) => {
    if (workoutTimerRef.current) clearTimeout(workoutTimerRef.current);
    if (!settings.workout.enabled) return;
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const delay = msUntilNextTime(settings.workout.hour, settings.workout.minute);

    // 1. Set exact setTimeout
    workoutTimerRef.current = setTimeout(async () => {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const sentKey = `yodha_workout_reminded_${todayStr}_${settings.workout.hour}_${settings.workout.minute}`;

      if (!localStorage.getItem(sentKey)) {
        localStorage.setItem(sentKey, 'true');
        const { title, body } = getMotivatingWorkoutMessage();
        await dispatchNotification(title, body, '/dashboard');
      }

      scheduleWorkout(settings);
    }, delay);

    // 2. Also register in service worker if controller is available
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const { title, body } = getMotivatingWorkoutMessage();
      navigator.serviceWorker.controller.postMessage({
        type: 'SCHEDULE_REMINDER',
        delayMs: delay,
        title,
        body,
      });
    }
  }, []);

  // Reschedule timer whenever dualReminders or permission change
  useEffect(() => {
    scheduleWorkout(dualReminders);
    return () => {
      if (workoutTimerRef.current) clearTimeout(workoutTimerRef.current);
    };
  }, [dualReminders, scheduleWorkout, notifPermission]);

  // ── Heartbeat Interval Check (Runs every 15 seconds to ensure notifications fire on time) ──
  useEffect(() => {
    const checkAndTrigger = () => {
      if (typeof window === 'undefined' || !('Notification' in window)) return;
      if (Notification.permission !== 'granted') return;

      const current = loadDualReminderSettings();
      if (!current.workout.enabled) return;

      const now = new Date();
      const currentH = now.getHours();
      const currentM = now.getMinutes();

      if (currentH === current.workout.hour && currentM === current.workout.minute) {
        const todayStr = now.toISOString().split('T')[0];
        const sentKey = `yodha_workout_reminded_${todayStr}_${currentH}_${currentM}`;
        if (!localStorage.getItem(sentKey)) {
          localStorage.setItem(sentKey, 'true');
          const { title, body } = getMotivatingWorkoutMessage();
          dispatchNotification(title, body, '/dashboard');
        }
      }
    };

    // Run on interval
    const interval = setInterval(checkAndTrigger, 15000);

    // Run on tab focus & visibility change
    const onVisibility = () => {
      if (!document.hidden) checkAndTrigger();
    };
    window.addEventListener('focus', checkAndTrigger);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', checkAndTrigger);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

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
    if (result === 'granted') {
      // Immediately schedule with granted permission
      scheduleWorkout(loadDualReminderSettings());
    }
    return result as NotifPermission;
  }, [scheduleWorkout]);

  // ── Public API: send a notification right now (for tests or direct triggers) ──
  const sendTestNotification = useCallback(async (customTitle?: string, customBody?: string, url = '/dashboard') => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const defaultMsg = getMotivatingWorkoutMessage();
    const finalTitle = customTitle || defaultMsg.title;
    const finalBody = customBody || defaultMsg.body;

    await dispatchNotification(finalTitle, finalBody, url);
  }, []);

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
