// ============================================================
// FILE 18: FETCH API — MODERN HTTP REQUESTS IN THE BROWSER
// Topic: Making network requests with the Promise-based Fetch API
// WHY: Every modern web app communicates with servers — loading
// data, submitting forms, uploading files. The Fetch API is the
// standard way to make HTTP requests in JavaScript, replacing
// XMLHttpRequest with a cleaner, Promise-based design.
// ============================================================

// NOTE: Fetch works in both BROWSER and modern Node.js (18+).
// CORS and credentials features are browser-only concepts.

// --- Helper: log to both console and a DOM output area ---
function log(msg, targetId) {
    console.log(msg);
    const el = document.getElementById(targetId);
    if (el) el.textContent += msg + '\n';
}

// Base URL for demo API
const API_BASE = 'https://jsonplaceholder.typicode.com';

// ============================================================
// EXAMPLE 1 — Basic GET Request: Zerodha Stock Data
// Story: Zerodha Kite is India's largest stock trading platform,
// serving 10M+ active traders. Every page load fetches real-time
// stock prices, portfolio holdings, and market indices via API.
// Speed and reliability matter when real money is on the line.
// ============================================================

// WHY: fetch() is the modern replacement for XMLHttpRequest.
// Returns a Promise, integrates with async/await.

// --- Stock Ticker (simulated with random prices) ---
const symbols = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK'];
const basePrices = { RELIANCE: 2450, TCS: 3890, INFY: 1620, HDFCBANK: 1710 };
let tickerInterval = null;
let tickerController = null;

class StockTicker {
    constructor(symbols, intervalMs = 2000) {
        this.symbols = symbols;
        this.intervalMs = intervalMs;
        this.controller = null;
        this.intervalId = null;
        this.isRunning = false;
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        log(`Ticker started: ${this.symbols.join(', ')}`, 'output-1');
        document.getElementById('ticker-status').textContent = 'Running';
        document.getElementById('ticker-status').classList.add('running');
        this.fetchPrices();
        this.intervalId = setInterval(() => this.fetchPrices(), this.intervalMs);
    }

    async fetchPrices() {
        this.controller = new AbortController();
        try {
            // Using JSONPlaceholder as demo — simulating stock data
            const res = await fetch(`${API_BASE}/posts/1`, {
                signal: this.controller.signal
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            await res.json();

            // Simulate price changes
            this.symbols.forEach((sym, i) => {
                const base = basePrices[sym];
                const change = (Math.random() - 0.5) * base * 0.02;
                const price = (base + change).toFixed(2);
                const tickEl = document.getElementById(`tick-${i + 1}`);
                if (tickEl) {
                    const priceEl = tickEl.querySelector('.tick-price');
                    const oldPrice = parseFloat(priceEl.textContent) || base;
                    priceEl.textContent = `Rs.${price}`;
                    tickEl.className = 'ticker-item ' + (parseFloat(price) >= oldPrice ? 'up' : 'down');
                }
            });
        } catch (error) {
            if (error.name !== 'AbortError') {
                log(`Ticker error: ${error.message}`, 'output-1');
            }
        }
    }

    stop() {
        if (!this.isRunning) return;
        this.isRunning = false;
        if (this.controller) this.controller.abort();
        if (this.intervalId) clearInterval(this.intervalId);
        log('Ticker stopped', 'output-1');
        document.getElementById('ticker-status').textContent = 'Stopped';
        document.getElementById('ticker-status').classList.remove('running');
    }
}

// WHY: Polling needs proper cleanup (abort + clearInterval)
// to prevent ghost requests and memory leaks.

const ticker = new StockTicker(symbols, 3000);

document.getElementById('ticker-start-btn')?.addEventListener('click', () => ticker.start());
document.getElementById('ticker-stop-btn')?.addEventListener('click', () => ticker.stop());

// React cleanup pattern:
// useEffect(() => {
//     const ticker = new StockTicker(['RELIANCE'], 2000);
//     ticker.start();
//     return () => ticker.stop();
// }, []);

// ============================================================
// EXAMPLE 2 — Response Parsing: json, text, blob, arrayBuffer
// Story: Zerodha returns JSON for stock data, text for status,
// and Blobs for chart images. The Response body is a stream
// that can only be consumed ONCE.
// ============================================================

// WHY: Choose the right parsing method. Calling .json() and
// then .text() on the same response FAILS.

// --- .json() — most common ---
// --- .text() — plain text ---
// --- .blob() — binary (images, files) ---
// --- .arrayBuffer() — raw binary ---

// --- Body can only be read ONCE ---
// Fix: clone() before reading

function updateResponseDisplay(prefix, status, statusOk, contentType, headers, body) {
    const statusEl = document.getElementById(`resp-status-${prefix}`);
    const typeEl = document.getElementById(`resp-type-${prefix}`);
    const headersEl = document.getElementById(`resp-headers-${prefix}`);
    const bodyEl = document.getElementById(`resp-body-${prefix}`);

    if (statusEl) {
        statusEl.textContent = status;
        statusEl.className = 'resp-status ' + (statusOk ? 'ok' : 'error');
    }
    if (typeEl) typeEl.textContent = contentType || '';
    if (headersEl) headersEl.textContent = headers || '';
    if (bodyEl) bodyEl.textContent = typeof body === 'string' ? body : JSON.stringify(body, null, 2);
}

// --- Basic GET with async/await (cleaner) ---
async function doGet(url, outputId, displayPrefix) {
    try {
        log(`GET ${url}`, outputId);
        const response = await fetch(url);

        log(`Status: ${response.status} (ok: ${response.ok})`, outputId);
        log(`Status Text: ${response.statusText}`, outputId);
        log(`Redirected: ${response.redirected}`, outputId);

        // Collect headers
        let headerStr = '';
        response.headers.forEach((value, name) => {
            headerStr += `${name}: ${value}\n`;
        });

        // WHY: fetch ONLY rejects on NETWORK failure (DNS, offline)
        // It does NOT reject on 404 or 500!
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        log(`Response: ${JSON.stringify(data).substring(0, 150)}...`, outputId);

        if (displayPrefix) {
            updateResponseDisplay(displayPrefix, `${response.status} ${response.statusText}`,
                response.ok, response.headers.get('Content-Type'), headerStr, data);
        }
        return data;
    } catch (error) {
        log(`Error: ${error.message}`, outputId);
        if (displayPrefix) {
            updateResponseDisplay(displayPrefix, `ERROR`, false, '', '', error.message);
        }
        return null;
    }
}

document.getElementById('get-users-btn')?.addEventListener('click', () => {
    doGet(`${API_BASE}/users`, 'output-2', '2');
});

document.getElementById('get-posts-btn')?.addEventListener('click', () => {
    doGet(`${API_BASE}/posts/1`, 'output-2', '2');
});

document.getElementById('get-404-btn')?.addEventListener('click', () => {
    doGet(`${API_BASE}/posts/99999`, 'output-2', '2');
});

// ============================================================
// EXAMPLE 3 — Response Headers
// Story: Zerodha's API sends rate limits and cache TTL in
// headers. Reading them helps the app manage retries and caching.
// ============================================================

// WHY: Headers carry metadata for rate limiting, caching, debugging.
// NOTE: CORS restricts visible headers. Server must send
// Access-Control-Expose-Headers for custom headers.

// ============================================================
// EXAMPLE 4 — POST Request: Placing a Stock Order
// Story: When a Zerodha user buys 10 shares of RELIANCE at
// Rs.2450, the app sends a POST with JSON body. The server
// validates and returns a confirmation.
// ============================================================

// WHY: POST sends data to the server. Needs Content-Type header
// and JSON.stringify() for the body.

document.getElementById('post-btn')?.addEventListener('click', async () => {
    try {
        log('--- POST (Create) ---', 'output-3');
        const response = await fetch(`${API_BASE}/posts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
                // 'Authorization': 'Bearer <token>'
            },
            body: JSON.stringify({
                symbol: 'RELIANCE', exchange: 'NSE', type: 'BUY',
                quantity: 10, price: 2450, orderType: 'LIMIT', product: 'CNC'
            }) // Must be a STRING
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(`Order failed: ${err.message}`);
        }

        const result = await response.json();
        log(`Order placed! Response:`, 'output-3');
        log(JSON.stringify(result, null, 2), 'output-3');
    } catch (error) {
        log(`Error: ${error.message}`, 'output-3');
    }
});

// ============================================================
// EXAMPLE 5 — PUT, PATCH, DELETE Requests
// Story: Zerodha lets users modify pending orders and cancel
// them. PUT replaces the resource, PATCH updates fields,
// DELETE removes it.
// ============================================================

// WHY: RESTful APIs use different HTTP methods for operations.

// --- PUT: replace entire resource ---
document.getElementById('put-btn')?.addEventListener('click', async () => {
    try {
        log('--- PUT (Replace) ---', 'output-3');
        const res = await fetch(`${API_BASE}/posts/1`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: 1, title: 'Updated Order', body: 'Modified order data', userId: 1
            })
        });
        if (!res.ok) throw new Error(`PUT failed: ${res.status}`);
        const data = await res.json();
        log(`PUT response:`, 'output-3');
        log(JSON.stringify(data, null, 2), 'output-3');
    } catch (error) {
        log(`Error: ${error.message}`, 'output-3');
    }
});

// --- DELETE: remove resource ---
document.getElementById('delete-btn')?.addEventListener('click', async () => {
    try {
        log('--- DELETE (Remove) ---', 'output-3');
        const res = await fetch(`${API_BASE}/posts/1`, {
            method: 'DELETE'
        });
        if (res.status === 200 || res.status === 204) {
            log(`DELETE successful! Status: ${res.status}`, 'output-3');
        } else {
            throw new Error(`DELETE failed: ${res.status}`);
        }
    } catch (error) {
        log(`Error: ${error.message}`, 'output-3');
    }
});

// ============================================================
// EXAMPLE 6 — Headers Object and FormData Uploads
// Story: Zerodha's KYC flow uploads Aadhaar/PAN documents.
// File uploads use FormData — NOT JSON. Do NOT set Content-Type
// manually; the browser adds the multipart boundary.
// ============================================================

// WHY: Headers API manages request metadata. FormData handles
// file uploads with automatic multipart encoding.

// --- Headers object ---
// const headers = new Headers();
// headers.set('Content-Type', 'application/json');
// headers.append('Accept', 'application/json');

// --- FormData file upload ---
// const formData = new FormData();
// formData.append('document', file); // File from <input type="file">
// DO NOT set Content-Type — browser sets it with boundary automatically

// ============================================================
// Request Builder Panel
// ============================================================

document.getElementById('builder-send-btn')?.addEventListener('click', async () => {
    const method = document.getElementById('builder-method').value;
    const url = document.getElementById('builder-url').value;
    const headerKey = document.getElementById('builder-header-key').value;
    const headerValue = document.getElementById('builder-header-value').value;
    const bodyText = document.getElementById('builder-body').value;

    const spinner = document.getElementById('builder-spinner');
    spinner?.classList.remove('hidden');

    const options = { method };
    const headers = {};
    if (headerKey && headerValue) headers[headerKey] = headerValue;
    if (['POST', 'PUT', 'PATCH'].includes(method) && bodyText) {
        if (!headers['Content-Type']) headers['Content-Type'] = 'application/json';
        options.body = bodyText;
    }
    if (Object.keys(headers).length) options.headers = headers;

    try {
        const response = await fetch(url, options);
        let headerStr = '';
        response.headers.forEach((v, k) => headerStr += `${k}: ${v}\n`);

        const clone = response.clone();
        let body;
        try { body = await response.json(); }
        catch { body = await clone.text(); }

        updateResponseDisplay('4',
            `${response.status} ${response.statusText}`,
            response.ok,
            response.headers.get('Content-Type'),
            headerStr,
            body
        );
    } catch (error) {
        updateResponseDisplay('4', 'NETWORK ERROR', false, '', '', error.message);
    }
    spinner?.classList.add('hidden');
});

// ============================================================
// EXAMPLE 7 — Error Handling: The Fetch Gotcha
// Story: A junior dev at Zerodha never showed error messages.
// Why? fetch() does NOT reject on 404/500 — it only rejects
// on network failures. A 500 is a "successful" fetch.
// ============================================================

// WHY: This is the BIGGEST fetch mistake. Unlike Axios, fetch
// treats any HTTP response as success. Check response.ok.

function showError(msg) {
    const el = document.getElementById('error-display');
    const msgEl = document.getElementById('error-message');
    if (el) el.classList.remove('hidden');
    if (msgEl) msgEl.textContent = msg;
}

function hideError() {
    document.getElementById('error-display')?.classList.add('hidden');
}

// --- WRONG: misses HTTP errors ---
document.getElementById('err-wrong-btn')?.addEventListener('click', async () => {
    hideError();
    log('--- WRONG way (misses HTTP errors) ---', 'output-7');
    try {
        const res = await fetch(`${API_BASE}/posts/99999`);
        const data = await res.json(); // Could be an error object!
        log(`Got data (but might be error!): ${JSON.stringify(data)}`, 'output-7');
        log('No error caught — but response was 404!', 'output-7');
    } catch (error) {
        // Only catches NETWORK errors, not 404/500!
        log(`Caught: ${error.message}`, 'output-7');
    }
});

// --- RIGHT: check response.ok ---
document.getElementById('err-right-btn')?.addEventListener('click', async () => {
    hideError();
    log('--- RIGHT way (checks response.ok) ---', 'output-7');
    try {
        const response = await fetch(`${API_BASE}/posts/99999`);
        if (!response.ok) {
            let errorMessage;
            try { errorMessage = (await response.json()).message; }
            catch { errorMessage = response.statusText; }
            throw new Error(`HTTP ${response.status}: ${errorMessage}`);
        }
        return await response.json();
    } catch (error) {
        log(`Properly caught: ${error.message}`, 'output-7');
        showError(error.message);
    }
});

// --- Network error ---
document.getElementById('err-network-btn')?.addEventListener('click', async () => {
    hideError();
    log('--- Network error (bad URL) ---', 'output-7');
    try {
        const response = await fetch('https://this-domain-does-not-exist-12345.com/api');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
    } catch (error) {
        log(`Network error caught: ${error.message}`, 'output-7');
        showError(`Network failure: ${error.message}`);
    }
});

// --- Reusable fetch wrapper ---
async function apiFetch(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: { 'Content-Type': 'application/json', ...options.headers }
    });
    if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        error.status = response.status;
        throw error;
    }
    if (response.status === 204) return null;
    return response.json();
}

// ============================================================
// EXAMPLE 8 — AbortController: Cancelling Requests
// Story: When a Zerodha user types in the search bar, each
// keystroke fires an API call. Without cancellation, old
// responses may arrive after newer ones, showing stale data.
// AbortController cancels outdated requests instantly.
// ============================================================

// WHY: Essential for search-as-you-type, timeouts, and cleanup.

// --- Basic abort demo ---
let abortDemoController = null;

document.getElementById('abort-start-btn')?.addEventListener('click', async () => {
    const spinner = document.getElementById('abort-spinner');
    spinner?.classList.remove('hidden');
    abortDemoController = new AbortController();
    log('Starting slow request... (click Cancel to abort)', 'output-5');

    try {
        // Simulate slow request using delay
        const res = await fetch(`${API_BASE}/posts`, { signal: abortDemoController.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        log(`Received ${data.length} posts`, 'output-5');
    } catch (err) {
        if (err.name === 'AbortError') {
            log('Request CANCELLED (AbortError)', 'output-5');
        } else {
            log(`Error: ${err.message}`, 'output-5');
        }
    }
    spinner?.classList.add('hidden');
});

document.getElementById('abort-cancel-btn')?.addEventListener('click', () => {
    if (abortDemoController) {
        abortDemoController.abort(); // Cancel the request
        log('Abort signal sent!', 'output-5');
    }
});

// --- Timeout pattern ---
async function fetchWithTimeout(url, options = {}, timeoutMs = 5000) {
    const ctrl = new AbortController();
    const timeoutId = setTimeout(() => ctrl.abort(), timeoutMs);

    try {
        const res = await fetch(url, { ...options, signal: ctrl.signal });
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') throw new Error('Request timed out');
        throw error;
    }
}

// --- Search-as-you-type with abort ---
let currentSearchController = null;

document.getElementById('search-input')?.addEventListener('input', async (e) => {
    const query = e.target.value.trim();
    const resultsEl = document.getElementById('search-results');
    if (!query) { resultsEl.innerHTML = ''; return; }

    // Cancel previous request
    if (currentSearchController) currentSearchController.abort();
    currentSearchController = new AbortController();

    try {
        const res = await fetch(
            `${API_BASE}/posts?_limit=5&title_like=${encodeURIComponent(query)}`,
            { signal: currentSearchController.signal }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const posts = await res.json();

        resultsEl.innerHTML = posts.length
            ? posts.map(p => `<div class="search-result-item">${p.id}. ${p.title}</div>`).join('')
            : '<div class="search-result-item" style="color:#64748b">No results found</div>';
    } catch (error) {
        if (error.name === 'AbortError') return; // Expected
        resultsEl.innerHTML = `<div class="search-result-item" style="color:var(--danger)">Error: ${error.message}</div>`;
    }
});

// ============================================================
// EXAMPLE 9 — Credentials and CORS
// Story: kite.zerodha.com calls api.zerodha.com (different
// origin). Cross-origin requests need CORS headers from the
// server. Auth cookies need the credentials option.
// ============================================================

// WHY: CORS is a browser security feature. Servers must
// explicitly allow cross-origin requests.

// --- credentials option ---
// fetch('https://api.zerodha.com/portfolio', {
//     credentials: 'include'  // Send cookies cross-origin
//     // 'omit'        — never send cookies
//     // 'same-origin' — only for same-origin (default)
//     // 'include'     — always send cookies
//     // Server MUST respond with: Access-Control-Allow-Credentials: true
// });

// --- CORS flow ---
// 1. Browser sends Origin header with request
// 2. Server responds with Access-Control-Allow-Origin
// 3. If missing/mismatched, browser BLOCKS the response

// --- Preflight (OPTIONS) for non-simple requests ---
// Custom headers, PUT/DELETE, JSON content-type trigger preflight

// ============================================================
// EXAMPLE 10 — Request and Response Objects
// Story: Zerodha creates reusable Request objects for common
// endpoints. Useful for Service Workers and testing.
// ============================================================

// WHY: Request/Response are the objects underlying fetch.
// Service Workers intercept Request objects for caching.

// const stockRequest = new Request('https://api.zerodha.com/stocks/RELIANCE', {
//     method: 'GET', mode: 'cors', cache: 'no-cache', redirect: 'follow'
// });

// Mock Response for testing:
// const mockResponse = new Response(
//     JSON.stringify({ symbol: 'RELIANCE', price: 2450 }),
//     { status: 200, headers: { 'Content-Type': 'application/json' } }
// );

// ============================================================
// EXAMPLE 11 — Retry with Exponential Backoff
// Story: During 9:15 AM market open, Zerodha handles massive
// load. APIs may fail intermittently. Retries wait progressively
// longer (1s, 2s, 4s) to avoid overwhelming the server.
// ============================================================

// WHY: Blind retries can DDoS your own server. Exponential
// backoff gives the server time to recover.

async function fetchWithRetry(url, options = {}, maxRetries = 3, outputId = 'output-6') {
    const attemptsEl = document.getElementById('retry-attempts');
    const fillEl = document.getElementById('retry-fill');

    // Show attempt indicators
    if (attemptsEl) {
        attemptsEl.innerHTML = Array.from({ length: maxRetries + 1 }, (_, i) =>
            `<span class="retry-attempt pending" id="retry-${i}">Attempt ${i + 1}</span>`
        ).join('');
    }

    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const attemptEl = document.getElementById(`retry-${attempt}`);
        if (attemptEl) attemptEl.className = 'retry-attempt active';
        if (fillEl) fillEl.style.width = `${((attempt + 1) / (maxRetries + 1)) * 100}%`;

        try {
            const res = await fetch(url, options);
            if (res.status >= 400 && res.status < 500) {
                throw new Error(`Client error: ${res.status}`); // Don't retry 4xx
            }
            if (!res.ok) throw new Error(`Server error: ${res.status}`);
            const data = await res.json();
            if (attemptEl) attemptEl.className = 'retry-attempt success';
            log(`Attempt ${attempt + 1}: SUCCESS`, outputId);
            return data;
        } catch (error) {
            lastError = error;
            if (attemptEl) attemptEl.className = 'retry-attempt fail';
            if (error.message.startsWith('Client error')) {
                log(`Attempt ${attempt + 1}: Client error (not retrying)`, outputId);
                throw error;
            }
            if (attempt < maxRetries) {
                const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
                log(`Attempt ${attempt + 1} failed, retrying in ${delay.toFixed(0)}ms...`, outputId);
                await new Promise(r => setTimeout(r, delay));
            }
        }
    }
    throw new Error(`Failed after ${maxRetries + 1} attempts: ${lastError.message}`);
}

document.getElementById('retry-success-btn')?.addEventListener('click', async () => {
    document.getElementById('output-6').textContent = '';
    try {
        const data = await fetchWithRetry(`${API_BASE}/posts/1`, {}, 3);
        log(`Final result: ${data.title}`, 'output-6');
    } catch (err) {
        log(`Failed: ${err.message}`, 'output-6');
    }
});

document.getElementById('retry-fail-btn')?.addEventListener('click', async () => {
    document.getElementById('output-6').textContent = '';
    try {
        // This URL will 404 which is a client error, won't retry
        const data = await fetchWithRetry(`${API_BASE}/posts/999999`, {}, 3);
        log(`Result: ${JSON.stringify(data)}`, 'output-6');
    } catch (err) {
        log(`Final failure: ${err.message}`, 'output-6');
    }
});

// ============================================================
// EXAMPLE 12 — Practical: Stock Ticker with Polling and Abort
// Story: Zerodha's dashboard shows live prices updating every
// 2 seconds. When the user navigates away, polling stops to
// prevent memory leaks. Combines setInterval, fetch, abort.
// ============================================================

// WHY: Polling needs proper cleanup (abort + clearInterval)
// to prevent ghost requests and memory leaks.
// (Implemented above in the StockTicker class)

// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. fetch() returns a Promise. Use async/await for clean syntax.
// 2. CRITICAL: fetch does NOT reject on 404/500. Always check
//    response.ok before parsing the body.
// 3. Response body can only be read ONCE. Use .clone() if needed.
// 4. POST needs Content-Type header + JSON.stringify(). FormData
//    uploads should NOT set Content-Type manually.
// 5. AbortController cancels requests — essential for search,
//    timeouts, and component cleanup.
// 6. CORS is browser-only. Server controls access via headers.
// 7. credentials: 'include' sends cookies cross-origin.
// 8. Exponential backoff: wait 1s, 2s, 4s between retries.
// 9. Clean up polling with clearInterval() + abort().
// 10. Request/Response objects power Service Worker caching.
