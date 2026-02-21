// ============================================================
// FILE 24: BROWSER APIS GRAB BAG — MODERN WEB CAPABILITIES
// Topic: Essential browser APIs for clipboard, geolocation, notifications, and more
// WHY: Modern browsers can access the clipboard, detect location, send
// notifications, check battery, and communicate across tabs. Indian apps
// like Paytm, Ola, Swiggy, and PhonePe use these APIs daily to create
// native-app-like experiences on the web.
// ============================================================

// ============================================================
// HELPER: log to console AND to an on-page output element
// ============================================================
function log(msg, targetId) {
    console.log(msg);
    var el = document.getElementById(targetId);
    if (el) el.textContent += msg + '\n';
}

// ============================================================
// EXAMPLE 1 — Indian Apps Using Browser APIs
// Story: Paytm lets you copy a UPI ID with one click (Clipboard API). Ola
// finds your pickup location automatically (Geolocation). Swiggy notifies
// you when food is out for delivery (Notification API). PhonePe vibrates
// your phone on payment success (Vibration API). Each "native feeling"
// feature is a simple browser API call.
// ============================================================

// NOTE: All code runs in BROWSER context. Many APIs require HTTPS + user permission.

// ============================================================
// SECTION 1: Clipboard API
// ============================================================

// WHY: Paytm shows your UPI ID with a "Copy" button. One click copies
// "rahul@paytm" to clipboard. Without this, users manually select and copy.

// --- Write to clipboard (Copy) ---
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        log('Copied "' + text + '" to clipboard!', 'clipboard-log');
        return true;
    } catch (err) {
        log('Clipboard API failed, using fallback: ' + err.message, 'clipboard-log');
        return fallbackCopy(text);
    }
}

// --- Read from clipboard (Paste) ---
async function pasteFromClipboard() {
    try {
        var text = await navigator.clipboard.readText();
        log('Pasted: "' + text + '"', 'clipboard-log');
        return text;
    } catch (err) {
        log('Paste failed (permission denied or not supported): ' + err.message, 'clipboard-log');
        return null;
    }
}

// --- Fallback for older browsers ---
function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    try {
        document.execCommand('copy');
        log('Copied via fallback (execCommand)', 'clipboard-log');
        return true;
    } catch (e) { return false; }
    finally { document.body.removeChild(ta); }
}

// --- Clipboard events ---
// document.addEventListener('copy', (e) => {
//     e.clipboardData.setData('text/plain', 'Modified!'); e.preventDefault();
// });
// document.addEventListener('paste', (e) => {
//     console.log('Pasted:', e.clipboardData.getData('text/plain'));
// });

// DOM: Clipboard demo
var clipboardInput = document.getElementById('clipboard-input');
var clipboardResult = document.getElementById('clipboard-result');

document.getElementById('btn-copy').addEventListener('click', async function () {
    var text = clipboardInput.value;
    var ok = await copyToClipboard(text);
    clipboardResult.textContent = ok ? 'Copied!' : 'Failed';
    clipboardResult.className = 'result-badge ' + (ok ? 'success' : 'error');
    if (ok) setTimeout(function () { clipboardResult.textContent = ''; clipboardResult.className = 'result-badge'; }, 2000);
});

document.getElementById('btn-paste').addEventListener('click', async function () {
    var text = await pasteFromClipboard();
    if (text !== null) {
        clipboardInput.value = text;
        clipboardResult.textContent = 'Pasted!';
        clipboardResult.className = 'result-badge success';
    }
});

// ============================================================
// SECTION 2: Geolocation API
// ============================================================

// WHY: Ola needs GPS to show nearby cabs. Swiggy needs location for nearby
// restaurants. Without this, users must manually type their location.

// getCurrentPosition: one-time | watchPosition: continuous | clearWatch: stop
// Options: enableHighAccuracy, timeout, maximumAge
// Error codes: 1=PERMISSION_DENIED, 2=POSITION_UNAVAILABLE, 3=TIMEOUT

document.getElementById('btn-get-location').addEventListener('click', function () {
    if (!navigator.geolocation) {
        log('Geolocation not supported in this browser', 'geo-log');
        return;
    }

    log('Requesting location...', 'geo-log');
    document.getElementById('geo-lat').textContent = '...';
    document.getElementById('geo-lng').textContent = '...';
    document.getElementById('geo-accuracy').textContent = '...';

    navigator.geolocation.getCurrentPosition(
        function (pos) {
            var lat = pos.coords.latitude.toFixed(6);
            var lng = pos.coords.longitude.toFixed(6);
            var acc = Math.round(pos.coords.accuracy);
            document.getElementById('geo-lat').textContent = lat;
            document.getElementById('geo-lng').textContent = lng;
            document.getElementById('geo-accuracy').textContent = acc + 'm';
            log('Lat: ' + lat + ', Lng: ' + lng + ', Accuracy: ' + acc + 'm', 'geo-log');
            if (pos.coords.altitude !== null) log('Altitude: ' + pos.coords.altitude.toFixed(1) + 'm', 'geo-log');
            if (pos.coords.speed !== null) log('Speed: ' + pos.coords.speed + ' m/s', 'geo-log');
        },
        function (err) {
            var reasons = { 1: 'PERMISSION_DENIED', 2: 'POSITION_UNAVAILABLE', 3: 'TIMEOUT' };
            document.getElementById('geo-lat').textContent = 'Error';
            document.getElementById('geo-lng').textContent = 'Error';
            document.getElementById('geo-accuracy').textContent = '—';
            log('Error (' + (reasons[err.code] || 'unknown') + '): ' + err.message, 'geo-log');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
});

// --- Continuous tracking (Ola ride tracking) ---
// var watchId = navigator.geolocation.watchPosition(callback, error, options);
// navigator.geolocation.clearWatch(watchId); // stop tracking

// ============================================================
// EXAMPLE 2 — Swiggy Order Notifications
// Story: You order butter chicken, then switch to Instagram. 20 minutes
// later, a notification pops up: "Your food is out for delivery! ETA 10
// minutes." You did not need the Swiggy tab open — the Notification API
// pushed it to your OS notification center.
// ============================================================

// ============================================================
// SECTION 3: Notification API
// ============================================================

// WHY: Notifications appear outside the browser — in the OS. They work
// even when the user is on a different tab. Critical for delivery updates.

// Permission states: 'default' (not asked), 'granted', 'denied' (cannot re-ask!)

var notifPermEl = document.getElementById('notif-permission');

function updateNotifPermUI() {
    if (!('Notification' in window)) {
        notifPermEl.textContent = 'Notifications not supported';
        return;
    }
    notifPermEl.textContent = 'Permission: ' + Notification.permission;
    notifPermEl.className = 'result-badge ' + (Notification.permission === 'granted' ? 'success' : '');
    document.getElementById('btn-send-notif').disabled = Notification.permission !== 'granted';
}

updateNotifPermUI();

document.getElementById('btn-request-notif').addEventListener('click', async function () {
    if (!('Notification' in window)) {
        log('Notification API not supported', 'notif-log');
        return;
    }
    var result = await Notification.requestPermission();
    log('Permission result: ' + result, 'notif-log');
    updateNotifPermUI();
});

document.getElementById('btn-send-notif').addEventListener('click', function () {
    if (Notification.permission !== 'granted') return;

    var n = new Notification('Swiggy - Order Update', {
        body: 'Your Butter Chicken is out for delivery! ETA 10 min.',
        tag: 'order-SWG-123',
        data: { url: '/orders/tracking' }
    });

    n.onclick = function () {
        window.focus();
        n.close();
    };

    log('Notification sent: "Butter Chicken out for delivery"', 'notif-log');
});

// ============================================================
// SECTION 4: Vibration API
// ============================================================

// WHY: PhonePe vibrates on payment success — tactile confirmation. Mobile only.
// navigator.vibrate(200);                      // Single 200ms buzz
// navigator.vibrate([100, 50, 100, 50, 200]);  // Pattern
// navigator.vibrate(0);                         // Stop

// ============================================================
// SECTION 5: Fullscreen API
// ============================================================

// WHY: Video players (Hotstar), games, presentations need fullscreen mode.

document.getElementById('btn-fullscreen').addEventListener('click', async function () {
    var target = document.getElementById('fullscreen-target');
    try {
        if (!document.fullscreenElement) {
            await target.requestFullscreen();
            log('Entered fullscreen', 'fullscreen-log');
        } else {
            await document.exitFullscreen();
            log('Exited fullscreen', 'fullscreen-log');
        }
    } catch (err) {
        log('Fullscreen error: ' + err.message, 'fullscreen-log');
    }
});

document.addEventListener('fullscreenchange', function () {
    log('fullscreenchange: ' + (document.fullscreenElement ? 'fullscreen' : 'normal'), 'fullscreen-log');
});

// ============================================================
// SECTION 6: Page Visibility API
// ============================================================

// WHY: Pause video, stop animations, reduce API polling when tab is hidden.
// Saves CPU, battery, bandwidth.

var visCount = 0;
var visDot = document.getElementById('vis-dot');
var visLabel = document.getElementById('vis-label');
var visCountEl = document.getElementById('vis-count');

function updateVisibility() {
    var hidden = document.visibilityState === 'hidden';
    visDot.className = 'vis-dot' + (hidden ? ' hidden' : '');
    visLabel.textContent = document.visibilityState;
    log('Visibility: ' + document.visibilityState, 'visibility-log');
}

document.addEventListener('visibilitychange', function () {
    visCount++;
    visCountEl.textContent = visCount;
    updateVisibility();
});

updateVisibility();
log('Switch to another tab and back to see this change!', 'visibility-log');

// Fun trick: change title when tab is hidden
var originalTitle = document.title;
document.addEventListener('visibilitychange', function () {
    document.title = document.hidden ? 'Come back! | JS DOM Course' : originalTitle;
});

// ============================================================
// SECTION 7: Battery Status API
// ============================================================

// WHY: Reduce animations/quality on low battery. Limited support (Chrome/Edge).
// async function checkBattery() {
//     if (!navigator.getBattery) return;
//     const battery = await navigator.getBattery();
//     console.log('Level:', Math.round(battery.level * 100) + '%');
//     console.log('Charging:', battery.charging);
//     battery.addEventListener('levelchange', () => {
//         if (battery.level < 0.15) console.log('LOW BATTERY');
//     });
// }

// ============================================================
// SECTION 8: Network Information API
// ============================================================

// WHY: India has wildly varying speeds — 5G in Mumbai, 2G in villages.
// JioCinema auto-adjusts video quality. Flipkart shows lite version on slow networks.

var netDot = document.getElementById('net-dot');
var netLabel = document.getElementById('net-label');
var netDetails = document.getElementById('network-details');

function updateNetworkUI() {
    var online = navigator.onLine;
    netDot.className = 'net-dot' + (online ? '' : ' offline');
    netLabel.textContent = online ? 'Online' : 'Offline';

    var detailsHTML = '';

    if (navigator.connection) {
        var c = navigator.connection;
        detailsHTML += '<span class="net-detail"><strong>Type:</strong> ' + (c.effectiveType || 'unknown') + '</span>';
        detailsHTML += '<span class="net-detail"><strong>Downlink:</strong> ' + (c.downlink || '?') + ' Mbps</span>';
        detailsHTML += '<span class="net-detail"><strong>Save Data:</strong> ' + (c.saveData ? 'Yes' : 'No') + '</span>';
        log('Connection: ' + c.effectiveType + ', ' + c.downlink + ' Mbps, saveData: ' + c.saveData, 'network-log');
    } else {
        detailsHTML = '<span class="net-detail">Detailed network info not available (Chrome/Edge only)</span>';
        log('navigator.connection not supported. Online: ' + online, 'network-log');
    }

    netDetails.innerHTML = detailsHTML;
}

window.addEventListener('online', function () {
    updateNetworkUI();
    log('EVENT: online — back online!', 'network-log');
});

window.addEventListener('offline', function () {
    updateNetworkUI();
    log('EVENT: offline — connection lost!', 'network-log');
});

if (navigator.connection) {
    navigator.connection.addEventListener('change', function () {
        updateNetworkUI();
        log('EVENT: connection change', 'network-log');
    });
}

updateNetworkUI();

// ============================================================
// EXAMPLE 3 — PhonePe Multi-Tab Sync
// Story: A user has PhonePe open in two tabs. They pay in Tab 1. Tab 2
// immediately updates the balance without refreshing. This cross-tab sync
// uses Broadcast Channel API — no server needed, purely client-side.
// ============================================================

// ============================================================
// SECTION 9: Broadcast Channel API
// ============================================================

// WHY: Changes in one tab (login, payment, theme) should reflect in all
// other tabs instantly without server round-trips.

var channel = new BroadcastChannel('js-dom-course-ch24');
var broadcastReceived = document.getElementById('broadcast-received');

document.getElementById('btn-broadcast').addEventListener('click', function () {
    var msg = document.getElementById('broadcast-input').value.trim();
    if (!msg) return;

    channel.postMessage({
        type: 'chat',
        text: msg,
        timestamp: Date.now(),
        tabId: Math.random().toString(36).slice(2, 6)
    });

    log('Broadcast sent: "' + msg + '"', 'broadcast-log');
    log('(Open this page in another tab to receive it)', 'broadcast-log');
});

channel.onmessage = function (event) {
    var data = event.data;
    // Clear empty placeholder
    var empty = broadcastReceived.querySelector('.empty-msg');
    if (empty) empty.remove();

    var div = document.createElement('div');
    div.className = 'bc-msg';
    var time = new Date(data.timestamp).toLocaleTimeString();
    div.innerHTML = '<span class="bc-time">' + time + '</span>' + data.text;
    broadcastReceived.appendChild(div);
    broadcastReceived.scrollTop = broadcastReceived.scrollHeight;

    log('Received from tab ' + data.tabId + ': "' + data.text + '"', 'broadcast-log');
};

// --- Alternative: localStorage event (older browsers) ---
// window.addEventListener('storage', (event) => {
//     console.log('Key changed:', event.key);
//     console.log('Old:', event.oldValue, 'New:', event.newValue);
//     // NOTE: storage event does NOT fire in the tab that made the change
// });

// --- Cross-tab sync use cases in Indian apps ---
// PhonePe: payment in Tab 1 -> balance updates in Tab 2
// Flipkart: add to cart in Tab 1 -> cart count updates in Tab 2
// Any app: logout in one tab -> all tabs redirect to login
// Theme/language: change in settings tab -> all tabs update

// ============================================================
// SECTION 10: Performance API
// ============================================================

// WHY: "If you cannot measure it, you cannot improve it." Microsecond
// precision timing for API calls, rendering, and Core Web Vitals.

// --- performance.now() — high-resolution timer ---
// --- Custom marks and measures ---
// --- PerformanceObserver — real-time monitoring ---
// --- Navigation timing ---

var perfResults = document.getElementById('perf-results');

document.getElementById('btn-perf-measure').addEventListener('click', function () {
    perfResults.innerHTML = '';

    // Mark and measure demo
    performance.mark('demo-start');

    // Simulate some work
    var sum = 0;
    for (var i = 0; i < 1000000; i++) sum += Math.sqrt(i);

    performance.mark('demo-end');
    performance.measure('demo-work', 'demo-start', 'demo-end');

    var measures = performance.getEntriesByName('demo-work');
    var duration = measures.length ? measures[0].duration.toFixed(2) : '?';

    perfResults.innerHTML = '<div class="perf-result"><span class="perf-label">Mark/Measure</span><span class="perf-value">' + duration + 'ms</span></div>';
    log('performance.mark("demo-start") -> work -> mark("demo-end")', 'perf-log');
    log('performance.measure("demo-work"): ' + duration + 'ms', 'perf-log');

    performance.clearMarks();
    performance.clearMeasures();
});

document.getElementById('btn-perf-sort').addEventListener('click', function () {
    perfResults.innerHTML = '';

    var sizes = [1000, 10000, 100000];
    var html = '';

    sizes.forEach(function (size) {
        var arr = Array.from({ length: size }, function () { return Math.random(); });
        var start = performance.now();
        arr.sort(function (a, b) { return a - b; });
        var dur = (performance.now() - start).toFixed(2);

        html += '<div class="perf-result"><span class="perf-label">Sort ' + size.toLocaleString() + '</span><span class="perf-value">' + dur + 'ms</span></div>';
        log('Sort ' + size.toLocaleString() + ' items: ' + dur + 'ms', 'perf-log');
    });

    perfResults.innerHTML = html;
});

// ============================================================
// SECTION 11: Practical — Combined Utility Class
// ============================================================

// WHY: Drop-in utility combining the most useful APIs.

var BrowserUtils = {
    copyToClipboard: async function (text) {
        try {
            if (navigator.clipboard) { await navigator.clipboard.writeText(text); return true; }
        } catch (e) {}
        var ta = document.createElement('textarea');
        ta.value = text; ta.style.cssText = 'position:fixed;opacity:0';
        document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); return true; }
        catch (e) { return false; }
        finally { document.body.removeChild(ta); }
    },

    setupNetworkMonitor: function (onOnline, onOffline) {
        var handler = function () { navigator.onLine ? (onOnline && onOnline()) : (onOffline && onOffline()); };
        window.addEventListener('online', handler);
        window.addEventListener('offline', handler);
        return function () { window.removeEventListener('online', handler); window.removeEventListener('offline', handler); };
    },

    setupVisibilityMonitor: function (onVisible, onHidden) {
        var handler = function () { document.visibilityState === 'visible' ? (onVisible && onVisible()) : (onHidden && onHidden()); };
        document.addEventListener('visibilitychange', handler);
        return function () { document.removeEventListener('visibilitychange', handler); };
    },

    notify: async function (title, options) {
        if (!('Notification' in window)) return null;
        if (Notification.permission === 'default') await Notification.requestPermission();
        if (Notification.permission === 'granted') return new Notification(title, options);
        return null;
    },

    getConnectionQuality: function () {
        if (!navigator.connection) return { type: 'unknown', online: navigator.onLine };
        return {
            type: navigator.connection.effectiveType,
            downlink: navigator.connection.downlink,
            saveData: navigator.connection.saveData,
            online: navigator.onLine,
        };
    },

    measure: function (label, fn) {
        var s = performance.now();
        var result = fn();
        console.log('[Perf] ' + label + ': ' + (performance.now() - s).toFixed(2) + 'ms');
        return result;
    }
};

// ============================================================
// KEY TAKEAWAYS
// ============================================================

(function () {
    var t = 'takeaways-log';
    log('=== KEY TAKEAWAYS ===', t);
    log('', t);
    log(' 1. Clipboard: navigator.clipboard.writeText/readText. Always provide', t);
    log('    execCommand fallback for older browsers.', t);
    log(' 2. Geolocation: getCurrentPosition (one-time), watchPosition (continuous),', t);
    log('    clearWatch (stop). Handle permission denied gracefully.', t);
    log(' 3. Notifications: requestPermission once, then new Notification().', t);
    log('    If denied, you CANNOT ask again — respect their choice.', t);
    log(' 4. Vibration: navigator.vibrate(ms) or vibrate([pattern]). Mobile only.', t);
    log(' 5. Fullscreen: element.requestFullscreen() — must be from user gesture.', t);
    log(' 6. Page Visibility: visibilitychange event. Pause video, reduce polling', t);
    log('    when tab is hidden. Save CPU and battery.', t);
    log(' 7. Battery: navigator.getBattery() for charging status and level.', t);
    log('    Reduce features on low battery. Limited browser support.', t);
    log(' 8. Network: navigator.connection.effectiveType (4g/3g/2g).', t);
    log('    online/offline events for connectivity status.', t);
    log(' 9. Broadcast Channel: Cross-tab messaging without a server. Use for', t);
    log('    login/logout sync, theme, cart updates across tabs.', t);
    log('10. Performance: performance.now() for microsecond timing. mark/measure', t);
    log('    for named timings. PerformanceObserver for Core Web Vitals.', t);
})();
