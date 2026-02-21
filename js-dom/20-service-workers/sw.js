// ============================================================
// SERVICE WORKER FILE (sw.js) — Hotstar-Style Offline-First
// This file runs in a separate thread, NOT on the page.
// It intercepts fetch requests and manages caching.
// ============================================================

// WHY: This is the core of Service Worker power — a programmable
// proxy between your app and the network.

// ============================================================
// EXAMPLE 4 — Install Event: Pre-Caching Critical Assets
// Story: Hotstar pre-caches the app shell during install: HTML,
// CSS, JS, logo, fonts. These load instantly even offline.
// If any asset fails to cache, install fails — guaranteeing
// the cache is complete or nothing.
// ============================================================

// WHY: Pre-caching during install ensures critical assets are
// available offline from the very first visit.

const CACHE_NAME = 'hotstar-app-v1';
const API_CACHE = 'hotstar-api-v1';

const CRITICAL_ASSETS = [
    './',
    './index.html',
    './style.css',
    './script.js'
];

self.addEventListener('install', (event) => {
    console.log('[SW] Installing');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Pre-caching critical assets');
                return cache.addAll(CRITICAL_ASSETS);
                // If ANY fails, entire install fails
            })
            .then(() => self.skipWaiting()) // Activate immediately
    );
});

// ============================================================
// EXAMPLE 5 — Activate Event: Cleaning Up Old Caches
// Story: Hotstar bumps cache from 'hotstar-v1' to 'hotstar-v2'.
// The activate event deletes old caches — without cleanup,
// cache versions accumulate forever, wasting storage.
// ============================================================

// WHY: Cache cleanup prevents storage bloat across deployments.

self.addEventListener('activate', (event) => {
    console.log('[SW] Activating');
    const keepCaches = [CACHE_NAME, API_CACHE];
    event.waitUntil(
        caches.keys()
            .then(names => Promise.all(
                names
                    .filter(name => !keepCaches.includes(name))
                    .map(name => {
                        console.log('[SW] Deleting old cache:', name);
                        return caches.delete(name);
                    })
            ))
            .then(() => self.clients.claim()) // Control all open tabs
    );
});

// ============================================================
// EXAMPLE 6 — Fetch Event: Intercepting Requests
// Story: Every request passes through the SW's fetch event.
// You decide: serve from cache? network? fallback?
// ============================================================

// WHY: The fetch event is the CORE of SW power. It turns your
// SW into a programmable proxy with full control.

// ============================================================
// EXAMPLE 7 — Cache Strategies: The Five Patterns
// Story: Hotstar uses different strategies per content type.
// ============================================================

// WHY: No single strategy fits all content.

// --- STRATEGY 1: Cache First (Static assets: CSS, JS, fonts) ---
// --- STRATEGY 2: Network First (API data, live scores) ---
// --- STRATEGY 3: Stale While Revalidate (thumbnails, profiles) ---
// --- STRATEGY 4: Cache Only (versioned files) ---
// --- STRATEGY 5: Network Only (POST requests, analytics) ---

// ============================================================
// EXAMPLE 8 — Strategy Router: Different Strategy Per Resource
// Story: Hotstar's SW routes requests to the right strategy.
// ============================================================

// WHY: Production SWs need multiple strategies, organized
// by URL pattern or resource type.

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Skip non-GET requests (POST, PUT, DELETE)
    if (event.request.method !== 'GET') return;

    // Skip cross-origin requests
    if (url.origin !== self.location.origin) {
        return;
    }

    // Static assets: Cache First
    if (url.pathname.match(/\.(css|js|woff2?|png|jpg|svg|ico)$/)) {
        event.respondWith(
            caches.match(event.request).then(cached => {
                if (cached) return cached;
                return fetch(event.request).then(response => {
                    const clone = response.clone(); // Can only read body once
                    caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
                    return response;
                });
            })
        );
        return;
    }

    // API: Network First
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    const clone = response.clone();
                    caches.open(API_CACHE).then(c => c.put(event.request, clone));
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // HTML pages: Stale While Revalidate
    if (event.request.destination === 'document') {
        event.respondWith(
            caches.open(CACHE_NAME).then(cache =>
                cache.match(event.request).then(cached => {
                    const fetchPromise = fetch(event.request)
                        .then(response => {
                            cache.put(event.request, response.clone());
                            return response;
                        })
                        .catch(() => cached);
                    return cached || fetchPromise;
                })
            )
        );
        return;
    }

    // Default fallback: Cache First
    event.respondWith(
        caches.match(event.request).then(cached => {
            return cached || fetch(event.request);
        })
    );
});

// ============================================================
// EXAMPLE 10 — Handle skipWaiting message from page
// ============================================================

self.addEventListener('message', (event) => {
    if (event.data?.action === 'skipWaiting') {
        self.skipWaiting();
    }
});

// ============================================================
// EXAMPLE 11 — Background Sync
// Story: Queued offline actions retry when connectivity returns.
// ============================================================

// WHY: Background Sync defers actions until stable connectivity.

self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-actions') {
        event.waitUntil(syncPending());
    }
});

async function syncPending() {
    // Read from IndexedDB, send to server, remove on success
    console.log('[SW] Syncing pending actions...');
    // In production:
    // const pending = await getAllFromIndexedDB('pendingActions');
    // for (const action of pending) {
    //     await fetch('/api/sync', { method: 'POST', body: JSON.stringify(action) });
    //     await deleteFromIndexedDB('pendingActions', action.id);
    // }
}

// ============================================================
// EXAMPLE 12 — Push Notifications
// Story: Hotstar sends push notifications for cricket updates.
// ============================================================

// WHY: Push notifications re-engage users even when browser closed.

self.addEventListener('push', (event) => {
    let data;
    try {
        data = event.data.json();
    } catch {
        data = {
            title: 'Update',
            body: event.data?.text() || 'New notification'
        };
    }

    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: data.icon || '/images/logo-192.png',
            badge: '/images/badge-72.png',
            vibrate: [200, 100, 200],
            tag: data.tag || 'default',
            actions: [
                { action: 'open', title: 'Watch Now' },
                { action: 'dismiss', title: 'Dismiss' }
            ],
            data: { url: data.url || '/' }
        })
    );
});

// --- Handle notification click ---
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    if (event.action === 'dismiss') return;

    const targetUrl = event.notification.data.url;
    event.waitUntil(
        self.clients.matchAll({ type: 'window' }).then(clients => {
            const existing = clients.find(c => c.url === targetUrl);
            if (existing) return existing.focus();
            return self.clients.openWindow(targetUrl);
        })
    );
});
