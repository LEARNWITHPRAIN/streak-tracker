// Yodha Mode Service Worker
// Handles: PWA install, background sync, local push notifications

const CACHE_NAME = 'yodha-mode-v1';
const STATIC_ASSETS = ['/', '/dashboard', '/winter-arc', '/manifest.json'];

// ── Install: cache static assets ───────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

// ── Activate: clean old caches ──────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch: network-first strategy ──────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  // Only handle GET requests, ignore API/Supabase calls
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('/api/') || event.request.url.includes('supabase')) return;

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});

// ── Push: handle server push events (future) ───────────────────────────────
self.addEventListener('push', (event) => {
  let data = { title: 'Yodha Mode', body: "Don't forget your daily tasks! 🔥", icon: '/yodha-favicon.png' };
  try {
    data = { ...data, ...event.data.json() };
  } catch {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/yodha-favicon.png',
      badge: '/yodha-favicon.png',
      tag: 'yodha-daily',
      renotify: true,
      vibrate: [200, 100, 200],
      data: { url: data.url || '/dashboard' },
    })
  );
});

// ── Notification click: open/focus app ─────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => c.url.includes(self.location.origin));
      if (existing) {
        existing.focus();
        if ('navigate' in existing) {
          existing.navigate(targetUrl);
        }
      } else {
        self.clients.openWindow(targetUrl);
      }
    })
  );
});

// ── Message: schedule local reminder via setTimeout ────────────────────────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SCHEDULE_REMINDER') {
    const { delayMs, title, body } = event.data;
    setTimeout(() => {
      self.registration.showNotification(title || 'Yodha Mode', {
        body: body || "Time to log your daily tasks! 🔥",
        icon: '/yodha-favicon.png',
        badge: '/yodha-favicon.png',
        tag: 'yodha-reminder',
        renotify: true,
        vibrate: [200, 100, 200],
        data: { url: '/dashboard' },
      });
    }, delayMs || 0);
  }

  if (event.data?.type === 'SHOW_NOTIFICATION') {
    self.registration.showNotification(event.data.title || 'Yodha Mode', {
      body: event.data.body,
      icon: '/yodha-favicon.png',
      badge: '/yodha-favicon.png',
      tag: event.data.tag || 'yodha-notif',
      renotify: true,
      vibrate: [200, 100, 200],
      data: { url: event.data.url || '/dashboard' },
    });
  }
});
