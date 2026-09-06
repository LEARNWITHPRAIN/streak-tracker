import { useState, useEffect, useCallback, useRef } from 'react';

// ── Types ───────────────────────────────────────────────────────────────────
type NotifPermission = 'default' | 'granted' | 'denied';

interface ReminderSettings {
  enabled: boolean;
  hour: number;   // 0-23
  minute: number; // 0 or 30
}

const REMINDER_KEY = 'yodha_reminder_settings';

function loadReminderSettings(): ReminderSettings {
  try {
    const raw = localStorage.getItem(REMINDER_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { enabled: false, hour: 20, minute: 0 }; // default: 8:00 PM
}

function saveReminderSettings(s: ReminderSettings) {
  localStorage.setItem(REMINDER_KEY, JSON.stringify(s));
}

// ── Calculate ms until the next occurrence of HH:MM ────────────────────────
function msUntilNextTime(hour: number, minute: number): number {
  const now = new Date();
  const target = new Date(now);
  target.setHours(hour, minute, 0, 0);
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1); // tomorrow
  }
  return target.getTime() - now.getTime();
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
  const [reminder, setReminderState] = useState<ReminderSettings>(loadReminderSettings);
  const reminderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // ── Schedule/reschedule reminder whenever settings change ──────────────
  const scheduleReminder = useCallback((settings: ReminderSettings) => {
    // Clear existing timer
    if (reminderTimerRef.current) clearTimeout(reminderTimerRef.current);
    if (!settings.enabled || !swReady) return;
    if (notifPermission !== 'granted') return;

    const delay = msUntilNextTime(settings.hour, settings.minute);

    reminderTimerRef.current = setTimeout(async () => {
      const reg = await navigator.serviceWorker.ready;
      reg.active?.postMessage({
        type: 'SHOW_NOTIFICATION',
        title: 'Yodha Mode 🔥',
        body: "Don't break your streak! Log today's tasks now.",
        tag: 'yodha-daily-reminder',
        url: '/dashboard',
      });
      // Reschedule for tomorrow
      scheduleReminder(settings);
    }, delay);
  }, [swReady, notifPermission]);

  useEffect(() => {
    scheduleReminder(reminder);
    return () => { if (reminderTimerRef.current) clearTimeout(reminderTimerRef.current); };
  }, [reminder, scheduleReminder]);

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
  const sendTestNotification = useCallback(async (title: string, body: string) => {
    if (notifPermission !== 'granted' || !swReady) return;
    const reg = await navigator.serviceWorker.ready;
    reg.active?.postMessage({ type: 'SHOW_NOTIFICATION', title, body, tag: 'yodha-test', url: '/dashboard' });
  }, [notifPermission, swReady]);

  // ── Public API: update reminder settings ──────────────────────────────
  const updateReminder = useCallback((patch: Partial<ReminderSettings>) => {
    setReminderState((prev) => {
      const next = { ...prev, ...patch };
      saveReminderSettings(next);
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
    // Reminder
    reminder,
    updateReminder,
  };
};
