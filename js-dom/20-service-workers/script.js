// ============================================================
// FILE 20: SERVICE WORKERS — OFFLINE-FIRST & NETWORK PROXY
// Topic: Intercepting network requests for offline support, caching, and push notifications
// WHY: In India, where 60%+ of users access the web on flaky
// mobile networks, apps that work offline win. Service Workers
// act as a programmable proxy between app and network, enabling
// cached assets, offline content, and push notifications.
// ============================================================

// NOTE: Service Workers run in BROWSER context only. They require
// HTTPS (except localhost). They run in a separate thread — no
// DOM access. This file contains PAGE code; sw.js is separate.

// --- Helper: log to both console and a DOM output area ---
function log(msg, targetId) {
    console.log(msg);
    const el = document.getElementById(targetId);
    if (el) el.textContent += msg + '\n';
}

// ============================================================
// EXAMPLE 1 — What is a Service Worker? Hotstar's IPL Challenge
// Story: During IPL, Hotstar serves 50M+ concurrent users.
// Millions are on spotty mobile connections — signals drop in
// tunnels, trains, rural areas. Service Workers cache the app
// shell so the UI loads INSTANTLY even offline. API responses
// are cached too, so recent scores remain visible. Users never
// see a blank white screen.
// ============================================================

// WHY: A Service Worker is a script running in the background,
// SEPARATE from the page. It intercepts every fetch request
// and decides how to respond: cache, network, or both.

// --- SW Key Properties ---
// - Separate thread (no DOM access)
// - Acts as network PROXY
// - Intercepts ALL fetch requests in its scope
// - Persists across page loads
// - Requires HTTPS
// - Lifecycle: install -> activate -> fetch
// - Runs even when page is CLOSED (push, sync events)

// | Feature              | Web Worker          | Service Worker        |
// |----------------------|---------------------|-----------------------|
// | Purpose              | Heavy computation   | Network proxy/caching |
// | Lifecycle            | Page-bound          | Independent of pages  |
// | Intercepts requests  | No                  | Yes (fetch event)     |
// | Push notifications   | No                  | Yes                   |
// | Background sync      | No                  | Yes                   |
// | Persists after close | No                  | Yes                   |

// ============================================================
// NETWORK STATUS
// ============================================================

function updateNetworkStatus() {
    const dotEl = document.getElementById('status-dot');
    const textEl = document.getElementById('network-status');
    if (navigator.onLine) {
        if (dotEl) dotEl.className = 'status-dot online';
        if (textEl) textEl.textContent = 'Online';
    } else {
        if (dotEl) dotEl.className = 'status-dot offline';
        if (textEl) textEl.textContent = 'Offline';
    }
}

updateNetworkStatus();
window.addEventListener('online', () => {
    updateNetworkStatus();
    log('Back online!', 'output-1');
});
window.addEventListener('offline', () => {
    updateNetworkStatus();
    log('Gone offline', 'output-1');
});

// ============================================================
// EXAMPLE 2 — Registration
// Story: Hotstar's main page registers a service worker during
// load. Registration tells the browser to download sw.js and
// install it as the proxy for the specified scope.
// ============================================================

// WHY: Registration is the first step. The browser downloads
// the SW file and triggers install if it's new or changed.

function updateLifecycle(step) {
    ['lc-installing', 'lc-waiting', 'lc-active'].forEach(id => {
        document.getElementById(id)?.classList.remove('active', 'pending');
    });
    if (step === 'installing') {
        document.getElementById('lc-installing')?.classList.add('pending');
    } else if (step === 'waiting') {
        document.getElementById('lc-installing')?.classList.add('active');
        document.getElementById('lc-waiting')?.classList.add('pending');
    } else if (step === 'active') {
        document.getElementById('lc-installing')?.classList.add('active');
        document.getElementById('lc-waiting')?.classList.add('active');
        document.getElementById('lc-active')?.classList.add('active');
    }
}

function updateRegStatus(text) {
    const el = document.getElementById('sw-reg-status');
    if (el) el.textContent = text;
}

// --- PAGE CODE ---
async function registerSW() {
    if (!('serviceWorker' in navigator)) {
        log('Service Workers NOT supported in this browser', 'output-2');
        updateRegStatus('Not supported');
        return;
    }

    try {
        const registration = await navigator.serviceWorker.register('./sw.js', {
            scope: './' // Controls all pages under this path
        });
        log('SW registered! Scope: ' + registration.scope, 'output-2');
        updateRegStatus('Registered');

        if (registration.installing) {
            log('SW state: installing', 'output-2');
            updateLifecycle('installing');
        } else if (registration.waiting) {
            log('SW state: waiting', 'output-2');
            updateLifecycle('waiting');
        } else if (registration.active) {
            log('SW state: active', 'output-2');
            updateLifecycle('active');
        }

        // Listen for new versions
        registration.addEventListener('updatefound', () => {
            const newSW = registration.installing;
            log('Update found! New SW installing...', 'output-2');
            updateLifecycle('installing');

            newSW.addEventListener('statechange', () => {
                log('SW state: ' + newSW.state, 'output-2');
                // States: installing -> installed -> activating -> activated
                if (newSW.state === 'installed') {
                    updateLifecycle('waiting');
                    if (navigator.serviceWorker.controller) {
                        log('New version available! Reload to update.', 'output-2');
                    }
                }
                if (newSW.state === 'activated') {
                    updateLifecycle('active');
                }
            });
        });
    } catch (error) {
        log('SW registration failed: ' + error.message, 'output-2');
        updateRegStatus('Failed: ' + error.message);
    }
}

// --- Scope rules ---
// register('/sw.js', { scope: '/' })      -> controls all pages
// register('/sw.js', { scope: '/app/' })   -> controls /app/* only
// sw.js must be at or above the scope level

document.getElementById('register-btn')?.addEventListener('click', registerSW);

// ============================================================
// EXAMPLE 3 — The Service Worker Lifecycle
// Story: Hotstar deploys new SW versions each sprint. A new SW
// doesn't take control immediately — it installs, waits for
// all old tabs to close, then activates. This prevents breaking
// active sessions mid-stream.
// ============================================================

// WHY: The lifecycle ensures reliability. New SW versions
// don't disrupt active users.

// --- LIFECYCLE FLOW ---
// 1. REGISTRATION — browser downloads sw.js
// 2. INSTALL — pre-cache critical assets
// 3. WAITING — waits until all old-version tabs close
//    (OR: call self.skipWaiting() to skip)
// 4. ACTIVATE — clean up old caches, call clients.claim()
// 5. FETCH — intercept network requests, serve from cache/network

// Unregister all SWs
document.getElementById('unregister-btn')?.addEventListener('click', async () => {
    if (!('serviceWorker' in navigator)) return;
    const regs = await navigator.serviceWorker.getRegistrations();
    for (const reg of regs) {
        await reg.unregister();
        log('Unregistered SW: ' + reg.scope, 'output-2');
    }
    updateRegStatus('Unregistered');
    updateLifecycle('none');
});

// Check for update
document.getElementById('update-btn')?.addEventListener('click', async () => {
    if (!('serviceWorker' in navigator)) return;
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg) {
        await reg.update();
        log('Checked for SW updates', 'output-2');
    } else {
        log('No SW registered to update', 'output-2');
    }
});

// Reload when new SW takes over
let refreshing = false;
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
            refreshing = true;
            log('New SW took control. Reloading...', 'output-2');
            // window.location.reload();
        }
    });
}

// ============================================================
// EXAMPLE 4-8 — Install, Activate, Fetch events and
// Cache Strategies are implemented in sw.js
// ============================================================

// ============================================================
// EXAMPLE 7 — Cache Strategies: The Five Patterns
// Story: Hotstar uses different strategies per content type.
// Static assets (logo, fonts) rarely change — cache first.
// Live scores change every ball — network first. App shell
// uses stale-while-revalidate for instant load + freshness.
// ============================================================

// WHY: No single strategy fits all content. Five standard
// patterns cover every use case.

// --- STRATEGY 1: Cache First (Static assets: CSS, JS, fonts) ---
// --- STRATEGY 2: Network First (API data, live scores) ---
// --- STRATEGY 3: Stale While Revalidate (thumbnails, profiles) ---
// --- STRATEGY 4: Cache Only (versioned files like app.abc123.js) ---
// --- STRATEGY 5: Network Only (POST requests, analytics) ---

let simulateOffline = false;

document.getElementById('simulate-offline')?.addEventListener('change', (e) => {
    simulateOffline = e.target.checked;
    log(`Simulate offline: ${simulateOffline}`, 'output-3');
});

// Demo Cache First
document.getElementById('demo-cache-first')?.addEventListener('click', async () => {
    log('--- Demo: Cache First ---', 'output-3');
    const url = './style.css';
    const CACHE = 'demo-cache-v1';

    // Highlight strategy card
    document.querySelectorAll('.strategy-card').forEach(c => c.classList.remove('highlight'));
    document.getElementById('strat-cache-first')?.classList.add('highlight');

    try {
        const cache = await caches.open(CACHE);
        const cached = await cache.match(url);
        if (cached) {
            log('Cache HIT! Serving from cache.', 'output-3');
            const text = await cached.text();
            log(`Cached content length: ${text.length} chars`, 'output-3');
        } else {
            log('Cache MISS. Fetching from network...', 'output-3');
            if (simulateOffline) {
                log('Offline! No cache, no network. FAIL.', 'output-3');
                return;
            }
            const response = await fetch(url);
            log(`Network response: ${response.status}`, 'output-3');
            await cache.put(url, response.clone());
            log('Stored in cache for next time.', 'output-3');
        }
    } catch (err) {
        log(`Error: ${err.message}`, 'output-3');
    }
});

// Demo Network First
document.getElementById('demo-network-first')?.addEventListener('click', async () => {
    log('--- Demo: Network First ---', 'output-3');
    const url = 'https://jsonplaceholder.typicode.com/posts/1';
    const CACHE = 'demo-api-v1';

    document.querySelectorAll('.strategy-card').forEach(c => c.classList.remove('highlight'));
    document.getElementById('strat-network-first')?.classList.add('highlight');

    try {
        if (simulateOffline) throw new Error('Simulated offline');
        const response = await fetch(url);
        log(`Network: ${response.status}`, 'output-3');
        const data = await response.json();
        log(`Title: ${data.title.substring(0, 50)}...`, 'output-3');
        // Cache for offline
        const cache = await caches.open(CACHE);
        await cache.put(url, new Response(JSON.stringify(data)));
        log('Cached for offline fallback.', 'output-3');
    } catch (err) {
        log(`Network failed: ${err.message}. Trying cache...`, 'output-3');
        const cache = await caches.open(CACHE);
        const cached = await cache.match(url);
        if (cached) {
            const data = await cached.json();
            log(`From cache: ${data.title.substring(0, 50)}...`, 'output-3');
        } else {
            log('No cache either. Completely offline!', 'output-3');
        }
    }
});

// Demo Stale While Revalidate
document.getElementById('demo-swr')?.addEventListener('click', async () => {
    log('--- Demo: Stale While Revalidate ---', 'output-3');
    const url = 'https://jsonplaceholder.typicode.com/posts/2';
    const CACHE = 'demo-swr-v1';

    document.querySelectorAll('.strategy-card').forEach(c => c.classList.remove('highlight'));
    document.getElementById('strat-swr')?.classList.add('highlight');

    try {
        const cache = await caches.open(CACHE);
        const cached = await cache.match(url);

        if (cached) {
            const data = await cached.json();
            log(`Served STALE: ${data.title.substring(0, 50)}...`, 'output-3');
        } else {
            log('No stale version in cache.', 'output-3');
        }

        // Revalidate in background
        if (!simulateOffline) {
            log('Revalidating from network in background...', 'output-3');
            const response = await fetch(url);
            const fresh = await response.json();
            await cache.put(url, new Response(JSON.stringify(fresh)));
            log(`Cache updated with fresh data.`, 'output-3');
        } else {
            log('Offline — cannot revalidate.', 'output-3');
        }
    } catch (err) {
        log(`Error: ${err.message}`, 'output-3');
    }
});

// ============================================================
// EXAMPLE 9 — Cache API Deep Dive
// Story: Hotstar manages multiple cache buckets: 'hotstar-assets'
// for static files, 'hotstar-api' for responses.
// ============================================================

// WHY: The Cache API stores and retrieves Request/Response
// pairs. Fine-grained control over what's cached.

document.getElementById('inspect-cache-btn')?.addEventListener('click', async () => {
    const inspector = document.getElementById('cache-inspector');
    if (!inspector) return;

    try {
        const cacheNames = await caches.keys();
        log(`All caches: ${cacheNames.join(', ')}`, 'output-4');

        if (!cacheNames.length) {
            inspector.innerHTML = '<div class="empty-state">No caches found</div>';
            return;
        }

        let html = '';
        for (const name of cacheNames) {
            const cache = await caches.open(name);
            const keys = await cache.keys();
            html += `<div class="cache-group">
                <div class="cache-name">${name} (${keys.length} entries)</div>
                ${keys.map(req => `<div class="cache-url">${req.url}</div>`).join('')}
            </div>`;
        }
        inspector.innerHTML = html;
    } catch (err) {
        inspector.innerHTML = `<div class="empty-state" style="color:var(--danger)">Error: ${err.message}</div>`;
    }
});

document.getElementById('add-to-cache-btn')?.addEventListener('click', async () => {
    try {
        const cache = await caches.open('hotstar-demo-v1');
        const testUrl = './index.html';
        const response = await fetch(testUrl);
        await cache.put(testUrl, response);
        log(`Added ${testUrl} to cache "hotstar-demo-v1"`, 'output-4');
    } catch (err) {
        log(`Error: ${err.message}`, 'output-4');
    }
});

document.getElementById('clear-cache-btn')?.addEventListener('click', async () => {
    const names = await caches.keys();
    for (const name of names) {
        await caches.delete(name);
        log(`Deleted cache: ${name}`, 'output-4');
    }
    log('All caches cleared!', 'output-4');
    document.getElementById('cache-inspector').innerHTML = '<div class="empty-state">All caches cleared</div>';
});

// ============================================================
// EXAMPLE 10 — Updating Service Workers
// Story: Hotstar deploys updates weekly. skipWaiting() and
// clients.claim() force immediate takeover when needed.
// ============================================================

// WHY: Understanding the update flow lets you control when
// users get new code — safely or aggressively.

// --- SW CODE: handle skipWaiting message ---
// self.addEventListener('message', (event) => {
//     if (event.data?.action === 'skipWaiting') self.skipWaiting();
// });

// ============================================================
// EXAMPLE 11 — Background Sync
// Story: A Hotstar user "Likes" a video while on a train.
// Network drops. Without Background Sync, the "Like" is lost.
// With it, the browser queues the action and retries when
// connectivity returns — even if the tab is closed.
// ============================================================

// WHY: Background Sync defers actions until stable connectivity.
// Browser handles retry logic, even with tab closed.

// ============================================================
// EXAMPLE 12 — Push Notifications
// Story: Hotstar sends push notifications for cricket updates:
// "WICKET! Kohli out for 45!" — even when the browser is closed.
// The push event fires in the SW, which shows a notification.
// ============================================================

// WHY: Push notifications re-engage users. SW receives pushes
// from a server even when no tabs are open.

function updatePermBadge() {
    const el = document.getElementById('notif-perm-status');
    if (!el) return;
    if (!('Notification' in window)) {
        el.textContent = 'Not supported';
        el.className = 'perm-badge denied';
        return;
    }
    el.textContent = Notification.permission;
    el.className = 'perm-badge ' + Notification.permission;
}

updatePermBadge();

document.getElementById('notif-permission-btn')?.addEventListener('click', async () => {
    if (!('Notification' in window)) {
        log('Notifications not supported', 'output-5');
        return;
    }
    const permission = await Notification.requestPermission();
    log(`Notification permission: ${permission}`, 'output-5');
    updatePermBadge();
});

document.getElementById('notif-test-btn')?.addEventListener('click', () => {
    if (Notification.permission !== 'granted') {
        log('Permission not granted. Request it first!', 'output-5');
        return;
    }

    // Send test notification (from page, not push)
    const notif = new Notification('Hotstar Update', {
        body: 'WICKET! Kohli out for 45 off 38 balls.',
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect fill="%236366f1" width="64" height="64" rx="12"/><text x="50%" y="50%" text-anchor="middle" dy=".35em" fill="white" font-size="28">H</text></svg>',
        tag: 'test-notification'
    });

    notif.onclick = () => {
        log('Notification clicked!', 'output-5');
        window.focus();
        notif.close();
    };

    log('Test notification sent!', 'output-5');
});

// ============================================================
// EXAMPLE 14 — Checking SW Status and Unregistering
// Story: Hotstar's UI shows connectivity indicators and
// provides debugging tools for the SW.
// ============================================================

// WHY: Transparency about offline status builds user trust.

function getAppStatus() {
    return {
        online: navigator.onLine,
        swSupported: 'serviceWorker' in navigator,
        swActive: !!navigator.serviceWorker?.controller,
        cacheAPI: 'caches' in window
    };
}

document.getElementById('check-status-btn')?.addEventListener('click', () => {
    const status = getAppStatus();
    log('App status: ' + JSON.stringify(status, null, 2), 'output-6');

    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = val ? 'YES' : 'NO';
            el.className = 'status-val ' + (val ? 'yes' : 'no');
        }
    };

    setVal('stat-online', status.online);
    setVal('stat-sw-support', status.swSupported);
    setVal('stat-sw-active', status.swActive);
    setVal('stat-cache', status.cacheAPI);
});

// ============================================================
// AUTO-REGISTER on page load (if supported)
// ============================================================

if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        // Check if already registered
        const existing = await navigator.serviceWorker.getRegistration();
        if (existing) {
            log('SW already registered: ' + existing.scope, 'output-2');
            updateRegStatus('Active');
            if (existing.active) updateLifecycle('active');
            else if (existing.waiting) updateLifecycle('waiting');
            else if (existing.installing) updateLifecycle('installing');
        } else {
            log('No SW registered yet. Click "Register" to start.', 'output-2');
        }
    });
}

// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. Service Worker is a script between app and network —
//    intercepts fetch requests, controls cache/network response.
// 2. Lifecycle: register -> install -> wait -> activate -> fetch.
// 3. Pre-cache critical assets during install with cache.addAll().
// 4. Clean old caches during activate to prevent storage bloat.
// 5. Five strategies: Cache First, Network First, Stale While
//    Revalidate, Cache Only, Network Only.
// 6. Use different named caches per content type.
// 7. skipWaiting() forces immediate activation. clients.claim()
//    takes control of open tabs without reload.
// 8. Background Sync queues offline actions for automatic retry.
// 9. Push notifications work via push event in SW — even when
//    browser is closed. Require permission + VAPID keys.
// 10. SWs require HTTPS, cannot access DOM, run in separate
//     thread. Debug: DevTools > Application > Service Workers.
