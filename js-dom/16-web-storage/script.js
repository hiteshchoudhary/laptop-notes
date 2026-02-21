// ============================================================
// FILE 16: WEB STORAGE — LOCALSTORAGE & SESSIONSTORAGE
// Topic: Persisting data in the browser across page loads
// WHY: Modern web apps need to remember user preferences,
// cache data for performance, and maintain state between
// page refreshes — Web Storage makes this possible without
// hitting a server on every interaction.
// ============================================================

// NOTE: All code in this file runs in a BROWSER context.
// You need an HTML page with a <script> tag or browser DevTools console.
// Node.js does NOT have localStorage or sessionStorage.
// DevTools > Application > Local Storage to inspect stored data.

// --- Helper: log to both console and a DOM output area ---
function log(msg, targetId) {
    console.log(msg);
    const el = document.getElementById(targetId);
    if (el) el.textContent += msg + '\n';
}

// ============================================================
// EXAMPLE 1 — Flipkart's Dark Mode Preference
// Story: Flipkart serves 400M+ users. When a customer toggles
// dark mode at midnight while browsing deals, that preference
// must survive page refreshes and browser restarts. localStorage
// makes this seamless — no server round-trip needed.
// ============================================================

// WHY: localStorage persists data with NO expiration date.
// Data survives refreshes, tab closes, and browser restarts.
// Scoped to the ORIGIN (protocol + domain + port).

// --- Theme Manager ---
const ThemeManager = {
    STORAGE_KEY: 'flipkart_theme',

    init() {
        const saved = localStorage.getItem(this.STORAGE_KEY) || 'light';
        log(`Theme initialized: ${saved}`, 'output-1');
        this.updateUI(saved);
    },

    toggle() {
        const current = localStorage.getItem(this.STORAGE_KEY) || 'light';
        const next = current === 'light' ? 'dark' : 'light';
        localStorage.setItem(this.STORAGE_KEY, next);
        log(`Theme switched to: ${next}`, 'output-1');
        this.updateUI(next);
    },

    updateUI(theme) {
        const statusEl = document.getElementById('theme-status');
        if (statusEl) {
            statusEl.textContent = theme.toUpperCase();
            statusEl.className = 'badge ' + theme;
        }
    }
};

// WHY: Always check for null, not undefined, when reading
// localStorage.getItem('nonExistentKey') returns null (NOT undefined)

document.getElementById('theme-toggle-btn')?.addEventListener('click', () => {
    ThemeManager.toggle();
    refreshInspector();
});

ThemeManager.init();

// ============================================================
// EXAMPLE 2 — sessionStorage for Flipkart's Search Session
// Story: When a user searches for "iPhone 15" on Flipkart,
// the search term should persist on refresh but NOT carry over
// to a new tab. sessionStorage is perfect for ephemeral,
// tab-scoped data.
// ============================================================

// WHY: sessionStorage has the same API as localStorage, but
// its lifetime is tied to the browser tab. Close tab = data gone.

// --- Comparison Table ---
// | Feature            | localStorage        | sessionStorage       |
// |--------------------|---------------------|----------------------|
// | Persistence        | Until cleared       | Until tab closes     |
// | Shared across tabs | YES (same origin)   | NO (tab-scoped)      |
// | Capacity           | ~5-10 MB            | ~5-10 MB             |
// | Survives refresh   | YES                 | YES                  |
// | Survives restart   | YES                 | NO                   |

document.getElementById('search-save-btn')?.addEventListener('click', () => {
    const query = document.getElementById('search-input').value;
    if (!query) { log('Enter a search term first!', 'output-2'); return; }
    sessionStorage.setItem('searchQuery', query);
    log(`Saved to sessionStorage: "${query}"`, 'output-2');
    log('This will persist on refresh but NOT in a new tab.', 'output-2');
    refreshInspector();
});

document.getElementById('search-load-btn')?.addEventListener('click', () => {
    const saved = sessionStorage.getItem('searchQuery');
    if (saved !== null) {
        document.getElementById('search-input').value = saved;
        log(`Loaded from sessionStorage: "${saved}"`, 'output-2');
    } else {
        log('No saved search (null). Try saving one first.', 'output-2');
    }
});

// Restore on load
const savedSearch = sessionStorage.getItem('searchQuery');
if (savedSearch) {
    document.getElementById('search-input').value = savedSearch;
    log(`Restored search from sessionStorage: "${savedSearch}"`, 'output-2');
}

// ============================================================
// EXAMPLE 3 — Full API: removeItem, clear, key, length
// Story: Flipkart tracks recently viewed products. The full
// Web Storage API provides methods to manage stored data:
// iterate keys, remove specific items, or wipe everything.
// ============================================================

// WHY: Beyond get/set, you need tools to manage and iterate data.

document.getElementById('set-btn')?.addEventListener('click', () => {
    const key = document.getElementById('key-input').value;
    const value = document.getElementById('value-input').value;
    if (!key) { log('Key is required!', 'output-3'); return; }
    localStorage.setItem(key, value);
    log(`SET: "${key}" = "${value}"`, 'output-3');
    refreshInspector();
});

document.getElementById('get-btn')?.addEventListener('click', () => {
    const key = document.getElementById('key-input').value;
    if (!key) { log('Enter a key to get!', 'output-3'); return; }
    const value = localStorage.getItem(key);
    log(`GET: "${key}" => ${value === null ? 'null (not found)' : '"' + value + '"'}`, 'output-3');
});

// --- removeItem ---
document.getElementById('remove-btn')?.addEventListener('click', () => {
    const key = document.getElementById('key-input').value;
    if (!key) { log('Enter a key to remove!', 'output-3'); return; }
    localStorage.removeItem(key);
    log(`REMOVED: "${key}"`, 'output-3');
    refreshInspector();
});

// --- clear: removes ALL keys for this origin (use with caution!) ---
document.getElementById('clear-btn')?.addEventListener('click', () => {
    localStorage.clear();
    log('CLEARED: All localStorage data removed!', 'output-3');
    refreshInspector();
});

// --- length + key(index): iterate all stored items ---
function listAllItems() {
    log(`Items stored: ${localStorage.length}`, 'output-3');
    for (let i = 0; i < localStorage.length; i++) {
        const keyName = localStorage.key(i);
        log(`  ${keyName}: ${localStorage.getItem(keyName)}`, 'output-3');
    }
    // Order of keys is NOT guaranteed — do not rely on index ordering
}

// ============================================================
// EXAMPLE 4 — Storing Objects & Arrays (The JSON Gotcha)
// Story: Flipkart's cart has multiple items with name, price,
// quantity. localStorage only stores STRINGS. Storing an object
// directly produces "[object Object]" — a classic bug.
// ============================================================

// WHY: localStorage values are ALWAYS strings. Anything else
// gets silently converted via .toString(). This is gotcha #1.

document.getElementById('store-wrong-btn')?.addEventListener('click', () => {
    // --- The WRONG way ---
    const cartItem = { name: 'iPhone 15', price: 79999, qty: 1 };
    localStorage.setItem('cart_wrong', cartItem);
    const retrieved = localStorage.getItem('cart_wrong');
    log('--- The WRONG way ---', 'output-4');
    log(`Stored object directly. Retrieved: "${retrieved}"`, 'output-4');
    log('The object\'s .toString() is called silently — data is LOST!', 'output-4');
    refreshInspector();
});

document.getElementById('store-right-btn')?.addEventListener('click', () => {
    // --- The RIGHT way: JSON.stringify + JSON.parse ---
    const cart = [
        { name: 'iPhone 15', price: 79999, qty: 1, seller: 'Flipkart' },
        { name: 'AirPods Pro', price: 24999, qty: 2, seller: 'Apple Store' },
        { name: 'Spigen Case', price: 999, qty: 1, seller: 'Spigen Official' }
    ];
    // Serialize to JSON string before storing
    localStorage.setItem('flipkartCart', JSON.stringify(cart));
    // Deserialize back when reading
    const savedCart = JSON.parse(localStorage.getItem('flipkartCart'));

    log('--- The RIGHT way: JSON.stringify + JSON.parse ---', 'output-4');
    log(`Stored ${savedCart.length} items. First: ${savedCart[0].name}`, 'output-4');
    log(`typeof savedCart: "${typeof savedCart}" (it's an array)`, 'output-4');

    // WHY: Dates are another gotcha — JSON.parse does NOT restore Date objects
    const withDate = { created: new Date() };
    localStorage.setItem('dated', JSON.stringify(withDate));
    const parsed = JSON.parse(localStorage.getItem('dated'));
    log(`Date gotcha — typeof parsed.created: "${typeof parsed.created}" (NOT a Date!)`, 'output-4');
    log('You must manually convert: new Date(parsed.created)', 'output-4');
    refreshInspector();
});

// WHY: Always wrap JSON.parse in try-catch — corrupted data crashes it
function safeGetJSON(key) {
    try {
        const raw = localStorage.getItem(key);
        return raw !== null ? JSON.parse(raw) : null;
    } catch (error) {
        console.error(`Failed to parse "${key}":`, error.message);
        localStorage.removeItem(key); // Clean up corrupted data
        return null;
    }
}

document.getElementById('safe-get-btn')?.addEventListener('click', () => {
    log('--- Safe JSON retrieval with try-catch ---', 'output-4');
    const myCart = safeGetJSON('flipkartCart');
    if (myCart) {
        log(`Safe retrieval: ${myCart.length} items found`, 'output-4');
        myCart.forEach(item => log(`  ${item.name} - Rs.${item.price}`, 'output-4'));
    } else {
        log('No cart data found (or corrupted). Store items first!', 'output-4');
    }
    // Also try the wrong one
    const wrong = safeGetJSON('cart_wrong');
    if (wrong === null) {
        log('cart_wrong could not be parsed (corrupted "[object Object]")', 'output-4');
    }
});

// ============================================================
// EXAMPLE 5 — Storage Limits and Checking Availability
// Story: Flipkart's mobile site is used on budget phones in
// Tier-2 cities. Private/incognito mode may throw errors when
// using localStorage. Production apps must handle this.
// ============================================================

// WHY: ~5-10 MB per origin. Private mode may disable storage.

function isStorageAvailable(type) {
    try {
        const storage = window[type];
        const testKey = '__storage_test__';
        storage.setItem(testKey, 'test');
        storage.removeItem(testKey);
        return true;
    } catch (e) {
        return (
            e instanceof DOMException &&
            (e.name === 'QuotaExceededError' ||
             e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
            localStorage && localStorage.length !== 0
        );
    }
}

// --- Checking how much storage is used ---
function getStorageUsage() {
    let totalSize = 0;
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        // Each character in JavaScript is 2 bytes (UTF-16 encoding)
        totalSize += (key.length + value.length) * 2;
    }
    return {
        bytes: totalSize,
        kb: (totalSize / 1024).toFixed(2),
        mb: (totalSize / (1024 * 1024)).toFixed(4)
    };
}

// WHY: Monitoring storage usage helps you avoid QuotaExceededError.
// When storage is full, setItem() throws — always handle this.

document.getElementById('check-avail-btn')?.addEventListener('click', () => {
    const localAvail = isStorageAvailable('localStorage');
    const sessionAvail = isStorageAvailable('sessionStorage');
    log(`localStorage available: ${localAvail}`, 'output-5');
    log(`sessionStorage available: ${sessionAvail}`, 'output-5');
    if (!localAvail) {
        log('localStorage NOT available — use in-memory fallback', 'output-5');
    }
});

document.getElementById('check-usage-btn')?.addEventListener('click', () => {
    const usage = getStorageUsage();
    log(`Storage usage: ${usage.bytes} bytes (${usage.kb} KB, ${usage.mb} MB)`, 'output-5');

    const usageText = document.getElementById('usage-text');
    const usageFill = document.getElementById('usage-fill');
    if (usageText) usageText.textContent = `${usage.kb} KB / ~5120 KB`;
    const percent = Math.min((usage.bytes / (5 * 1024 * 1024)) * 100, 100);
    if (usageFill) usageFill.style.width = Math.max(percent, 0.5) + '%';
});

// ============================================================
// EXAMPLE 6 — The storage Event: Cross-Tab Communication
// Story: A Flipkart user has two tabs open. In Tab 1, they
// add an item to cart. Tab 2 should INSTANTLY update the cart
// count — the 'storage' event fires in OTHER tabs when
// localStorage changes, enabling cross-tab sync.
// ============================================================

// WHY: The storage event ONLY fires in OTHER tabs/windows of
// the same origin, NOT in the tab that made the change.

window.addEventListener('storage', function(event) {
    log(`Key: ${event.key}`, 'output-6');
    log(`Old Value: ${event.oldValue}`, 'output-6');
    log(`New Value: ${event.newValue}`, 'output-6');
    log(`URL: ${event.url}`, 'output-6');

    const indicator = document.getElementById('cross-tab-indicator');
    if (indicator) {
        indicator.textContent = `Storage changed in another tab! Key: "${event.key}"`;
        indicator.classList.add('updated');
    }

    if (event.key === 'flipkartCart') {
        const updatedCart = JSON.parse(event.newValue) || [];
        const count = updatedCart.reduce((sum, item) => sum + item.qty, 0);
        log(`Cart updated from another tab! Count: ${count}`, 'output-6');
    }
    if (event.key === null) {
        log('All storage was cleared in another tab!', 'output-6');
    }
    refreshInspector();
});

document.getElementById('cross-tab-btn')?.addEventListener('click', () => {
    const cart = [
        { name: 'iPhone 15', price: 79999, qty: 1 },
        { name: 'AirPods Pro', price: 24999, qty: Math.ceil(Math.random() * 3) }
    ];
    localStorage.setItem('flipkartCart', JSON.stringify(cart));
    log('Cart updated in THIS tab. Check OTHER tabs for storage event!', 'output-6');
    refreshInspector();
});

// ============================================================
// EXAMPLE 7 — Same-Origin Policy for Storage
// Story: Flipkart's main site and seller portal are different
// origins. Data stored on one cannot be read from the other.
// ============================================================

// WHY: Origin = Protocol + Domain + Port. Different = isolated.

// SAME ORIGIN (share localStorage):
// https://flipkart.com/page1 <-> https://flipkart.com/page2

// DIFFERENT ORIGIN (isolated):
// https://flipkart.com     <-> http://flipkart.com        (protocol)
// https://flipkart.com     <-> https://seller.flipkart.com (subdomain)
// https://flipkart.com     <-> https://flipkart.com:8080   (port)

// ============================================================
// EXAMPLE 7 (UI) — Recently Viewed Products
// Story: Flipkart implements a "Recently Viewed" section that
// survives page refreshes using localStorage. Max 5 items,
// newest first.
// ============================================================

// WHY: Combining patterns shows how real apps use localStorage.

const RecentlyViewed = {
    KEY: 'flipkart_recently_viewed',
    MAX: 5,

    getAll() {
        try { return JSON.parse(localStorage.getItem(this.KEY)) || []; }
        catch { return []; }
    },

    add(product) {
        let items = this.getAll().filter(i => i.id !== product.id);
        items.unshift({ ...product, viewedAt: Date.now() });
        if (items.length > this.MAX) items = items.slice(0, this.MAX);
        localStorage.setItem(this.KEY, JSON.stringify(items));
        log(`Added "${product.name}" to recently viewed`, 'output-7');
        this.render();
    },

    render() {
        const container = document.getElementById('recently-viewed');
        if (!container) return;
        const items = this.getAll();
        if (!items.length) {
            container.innerHTML = '';
            log('No recently viewed products', 'output-7');
            return;
        }
        container.innerHTML = items.map((item, i) =>
            `<div class="recent-item">
                <div class="recent-name">${item.name}</div>
                <div class="recent-price">Rs.${Number(item.price).toLocaleString('en-IN')}</div>
            </div>`
        ).join('');
    }
};

// Bind "View Product" buttons
document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const card = btn.closest('.product-card');
        const product = {
            id: Number(card.dataset.id),
            name: card.dataset.name,
            price: Number(card.dataset.price)
        };
        RecentlyViewed.add(product);
        refreshInspector();
    });
});

// Render on load (persisted data!)
RecentlyViewed.render();
if (RecentlyViewed.getAll().length > 0) {
    log(`Persisted: ${RecentlyViewed.getAll().map(p => p.name).join(', ')}`, 'output-7');
}

// ============================================================
// EXAMPLE 8 — Wrapper Utility: Typed Get/Set with Expiry (TTL)
// Story: Flipkart caches product recommendations for 30 min.
// localStorage has no built-in expiry, so we build a wrapper
// that stores a timestamp alongside the data.
// ============================================================

// WHY: localStorage has NO expiry. A TTL wrapper embeds an
// expiration timestamp and checks it on retrieval.

const FlipkartStorage = {
    set(key, value, ttl = null) {
        const item = { value, timestamp: Date.now(), ttl };
        try {
            localStorage.setItem(key, JSON.stringify(item));
        } catch (e) {
            if (e.name === 'QuotaExceededError') {
                console.warn('localStorage full!');
            }
        }
    },

    get(key) {
        try {
            const raw = localStorage.getItem(key);
            if (raw === null) return null;
            const item = JSON.parse(raw);
            if (!item || !item.timestamp) return raw; // Legacy data

            if (item.ttl !== null && (Date.now() - item.timestamp) > item.ttl) {
                localStorage.removeItem(key);         // Expired
                return null;
            }
            return item.value;
        } catch (e) {
            return null;
        }
    },

    remove(key) { localStorage.removeItem(key); }
};

// --- TTL demo buttons ---
document.getElementById('ttl-store-btn')?.addEventListener('click', () => {
    // Store product recommendations for 30 seconds (demo: using 30s instead of 30min)
    FlipkartStorage.set('recommendations', [
        { id: 101, name: 'Boat Rockerz 450', price: 1499 },
        { id: 102, name: 'Noise ColorFit Pro 4', price: 3499 },
        { id: 103, name: 'realme Buds Air 5', price: 2999 }
    ], 30 * 1000); // 30 second TTL for demo (production: 30 * 60 * 1000)

    log('Stored recommendations with 30-second TTL', 'output-8');
    log('They will expire after 30 seconds. Try reading after that!', 'output-8');
    refreshInspector();
});

document.getElementById('ttl-read-btn')?.addEventListener('click', () => {
    const recs = FlipkartStorage.get('recommendations');
    if (recs) {
        log('Recommendations (still valid):', 'output-8');
        recs.forEach(r => log(`  ${r.name} - Rs.${r.price}`, 'output-8'));
    } else {
        log('Recommendations: EXPIRED or not set!', 'output-8');
    }
    refreshInspector();
});

// Store theme preference with NO expiry (persists forever)
document.getElementById('ttl-store-theme-btn')?.addEventListener('click', () => {
    FlipkartStorage.set('userTheme', 'dark', null);
    log('Stored theme: "dark" with NO TTL (persists forever)', 'output-8');
    refreshInspector();
});

document.getElementById('ttl-read-theme-btn')?.addEventListener('click', () => {
    const theme = FlipkartStorage.get('userTheme');
    log(`Theme: ${theme || 'not set'}`, 'output-8');
});

// ============================================================
// EXAMPLE 9 — When to Use What: Storage Comparison
// Story: Flipkart's engineering team debates storage for each
// feature. Choosing wrong leads to security holes or data loss.
// ============================================================

// WHY: No single mechanism fits all. Know the trade-offs.

// | Feature          | localStorage | sessionStorage | Cookies         | IndexedDB       |
// |------------------|-------------|----------------|-----------------|-----------------|
// | Capacity         | ~5-10 MB    | ~5-10 MB       | ~4 KB/cookie    | Hundreds of MB+ |
// | Persistence      | Forever     | Tab session    | Configurable    | Forever         |
// | Sent to server?  | NO          | NO             | YES (every req) | NO              |
// | API              | Sync        | Sync           | Sync            | Async           |
// | Data format      | Strings     | Strings        | Strings         | Structured/Blob |
// | Good for         | Preferences | Temp state     | Auth tokens     | Large datasets  |

// Decision guide:
// Theme preference      -> localStorage
// Search query in flow  -> sessionStorage
// Auth token            -> HttpOnly cookie (NOT localStorage!)
// Product catalog cache -> IndexedDB

// ============================================================
// EXAMPLE 10 — Security: Never Store Sensitive Data
// Story: An Indian fintech stored JWTs in localStorage. An XSS
// vulnerability let attackers steal tokens via injected scripts,
// compromising thousands of accounts.
// ============================================================

// WHY: localStorage has ZERO access controls. Any JS on your
// origin (including XSS injections) can read every key.

// DANGEROUS — NEVER do this:
// localStorage.setItem('authToken', 'eyJhbGciOiJIUzI1NiIs...');
// localStorage.setItem('password', 'user123password');
// localStorage.setItem('cardNumber', '4111-1111-1111-1111');

// SAFE — non-sensitive preferences:
// localStorage.setItem('theme', 'dark');
// localStorage.setItem('language', 'en');

// For auth tokens, use HttpOnly cookies set by the server:
// Set-Cookie: token=abc123; HttpOnly; Secure; SameSite=Strict

// ============================================================
// STORAGE INSPECTOR — Real-time view of all stored data
// ============================================================

function refreshInspector() {
    // localStorage
    const localEl = document.getElementById('local-inspector');
    if (localEl) {
        if (localStorage.length === 0) {
            localEl.innerHTML = '<div class="inspector-empty">Empty</div>';
        } else {
            let html = '';
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const val = localStorage.getItem(key);
                const display = val.length > 60 ? val.substring(0, 60) + '...' : val;
                html += `<div class="inspector-row">
                    <span class="inspector-key">${key}</span>
                    <span class="inspector-value">${display}</span>
                </div>`;
            }
            localEl.innerHTML = html;
        }
    }

    // sessionStorage
    const sessionEl = document.getElementById('session-inspector');
    if (sessionEl) {
        if (sessionStorage.length === 0) {
            sessionEl.innerHTML = '<div class="inspector-empty">Empty</div>';
        } else {
            let html = '';
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                const val = sessionStorage.getItem(key);
                const display = val.length > 60 ? val.substring(0, 60) + '...' : val;
                html += `<div class="inspector-row">
                    <span class="inspector-key">${key}</span>
                    <span class="inspector-value">${display}</span>
                </div>`;
            }
            sessionEl.innerHTML = html;
        }
    }
}

document.getElementById('refresh-inspector-btn')?.addEventListener('click', refreshInspector);

// Initial inspector render
refreshInspector();

// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. localStorage persists forever; sessionStorage lives only
//    for the current tab session.
// 2. Both store ONLY strings — use JSON.stringify/JSON.parse
//    for objects and arrays.
// 3. Always wrap JSON.parse in try-catch for corrupted data.
// 4. The 'storage' event fires in OTHER tabs only — useful for
//    cross-tab sync like cart updates.
// 5. Check storage availability before use (private browsing
//    may block it).
// 6. Build a TTL wrapper since localStorage has no expiry.
// 7. NEVER store auth tokens, passwords, or PII — use HttpOnly
//    cookies for sensitive data.
// 8. Storage is scoped to origin (protocol + domain + port).
// 9. Capacity is ~5-10 MB per origin.
// 10. Choose right storage: localStorage for preferences,
//     sessionStorage for temp state, cookies for auth,
//     IndexedDB for large structured data.
