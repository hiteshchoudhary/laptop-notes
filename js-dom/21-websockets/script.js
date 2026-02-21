// ============================================================
// FILE 21: WEBSOCKETS — REAL-TIME BIDIRECTIONAL COMMUNICATION
// Topic: Persistent connections for live data streaming between client and server
// WHY: Traditional HTTP is request-response: the client asks, the server answers,
// connection closes. Apps like live scores, chat, stock tickers need data pushed
// FROM server TO client instantly. WebSocket opens a persistent two-way channel.
// ============================================================

// ============================================================
// HELPER: log to console AND to an on-page output element
// ============================================================
function log(msg, targetId) {
    console.log(msg);
    const el = document.getElementById(targetId);
    if (el) el.textContent += msg + '\n';
}

// ============================================================
// EXAMPLE 1 — Dream11 Live Score Problem
// Story: Dream11 has 150 million fantasy cricket league users. During an IPL
// match, every ball changes scores and leaderboard rankings. If each user
// polls the server every second, that is 150M requests/sec. WebSocket solves
// this: one persistent connection per user, server pushes only when needed.
// ============================================================

// NOTE: WebSocket code runs in the BROWSER. Node.js uses libraries like 'ws'.

// ============================================================
// MOCK WEBSOCKET — Simulates lifecycle when no real server available
// ============================================================

class MockWebSocket {
    constructor(url) {
        this.url = url;
        this.readyState = 0; // CONNECTING
        this.binaryType = 'blob';
        this._listeners = { open: [], message: [], close: [], error: [] };

        // Simulate the handshake delay
        setTimeout(() => {
            if (this.readyState === 0) {
                this.readyState = 1; // OPEN
                this._emit('open', {});
            }
        }, 400 + Math.random() * 300);
    }

    send(data) {
        if (this.readyState !== 1) throw new Error('WebSocket is not open');
        // Echo back after a small delay (simulates echo server)
        setTimeout(() => {
            if (this.readyState === 1) {
                this._emit('message', { data: data });
            }
        }, 80 + Math.random() * 120);
    }

    close(code, reason) {
        if (this.readyState >= 2) return;
        this.readyState = 2; // CLOSING
        setTimeout(() => {
            this.readyState = 3; // CLOSED
            this._emit('close', { code: code || 1000, reason: reason || '', wasClean: true });
        }, 100);
    }

    addEventListener(type, fn) {
        if (this._listeners[type]) this._listeners[type].push(fn);
    }

    removeEventListener(type, fn) {
        if (this._listeners[type]) {
            this._listeners[type] = this._listeners[type].filter(f => f !== fn);
        }
    }

    _emit(type, event) {
        if (typeof this['on' + type] === 'function') this['on' + type](event);
        (this._listeners[type] || []).forEach(fn => fn(event));
    }
}

// Try real WebSocket first, fall back to Mock
function createWebSocket(url) {
    try {
        const ws = new WebSocket(url);
        // If it errors within 2s, we will handle it in onerror
        return ws;
    } catch (e) {
        log('Real WebSocket unavailable, using mock.', 'connection-log');
        return new MockWebSocket(url);
    }
}

// ============================================================
// SECTION 1: HTTP vs WebSocket
// ============================================================

// WHY: You need to understand what problem WebSocket solves before using it.

// --- HTTP Polling (the old way) ---
// function pollForScores() {
//     setInterval(async () => {
//         const response = await fetch('https://api.dream11.example/live-score');
//         const data = await response.json();
//         console.log('Score update:', data);
//         // Problem: 150M users x 1 request/2sec = 75M requests/sec. Most say "no change."
//     }, 2000);
// }

// --- HTTP Long Polling (slightly better) ---
// async function longPollForScores() {
//     while (true) {
//         try {
//             const response = await fetch('https://api.dream11.example/live-score?wait=true');
//             const data = await response.json();
//             console.log('Score update:', data);
//         } catch (err) {
//             await new Promise(resolve => setTimeout(resolve, 3000));
//         }
//     }
// }

// --- WebSocket (the right way) ---
// ONE connection, server pushes whenever it wants
// const ws = new WebSocket('wss://live.dream11.example/scores');
// ws.onmessage = (event) => console.log('Live:', JSON.parse(event.data));

// ============================================================
// SECTION 2: Creating a WebSocket Connection
// ============================================================

// WHY: The constructor initiates a handshake — starts as HTTP with "Upgrade"
// header, then switches protocol. This is the "opening handshake."

// ws://  = unencrypted (like http://)
// wss:// = encrypted with TLS (like https://) — ALWAYS use in production
// const ws = new WebSocket('wss://live.dream11.example/match/ipl-2025-final');

// With sub-protocols (optional):
// const ws = new WebSocket('wss://live.dream11.example/match/1', ['json', 'protobuf']);

// ============================================================
// SECTION 3: WebSocket Events — The Four Lifecycle Events
// ============================================================

// WHY: WebSocket has exactly 4 events. Understanding when each fires is critical.

// EVENT 1: onopen — fires when handshake completes
// EVENT 2: onmessage — fires every time server sends data
//   event.data can be String (JSON), Blob, or ArrayBuffer
// EVENT 3: onerror — fires on connection error
//   After onerror, onclose will ALSO fire
// EVENT 4: onclose — fires when connection closes
//   event.code: 1000=normal, 1006=abnormal
//   event.reason: string
//   event.wasClean: true if closed gracefully

// ============================================================
// DOM: Connection Demo
// ============================================================

const STATES = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'];
const STATE_CLASSES = ['connecting', 'open', 'closing', 'closed'];
let ws = null;
let heartbeatTimer = null;
let pongTimer = null;

const dot = document.getElementById('status-dot');
const label = document.getElementById('connection-label');
const badge = document.getElementById('ready-state-badge');
const btnConnect = document.getElementById('btn-connect');
const btnDisconnect = document.getElementById('btn-disconnect');
const chatInput = document.getElementById('chat-input');
const btnSend = document.getElementById('btn-send');
const chatMessages = document.getElementById('chat-messages');
const btnStartHB = document.getElementById('btn-start-heartbeat');
const btnStopHB = document.getElementById('btn-stop-heartbeat');

function updateStatusUI(state) {
    dot.className = 'status-dot ' + STATE_CLASSES[state];
    label.textContent = STATES[state];
    badge.textContent = STATES[state] + ' (' + state + ')';
}

log('=== WebSocket Creation ===', 'connection-log');
log('Browser sends HTTP GET with Upgrade: websocket header', 'connection-log');
log('Server responds with HTTP 101 Switching Protocols', 'connection-log');
log('After handshake, both sides speak WebSocket protocol', 'connection-log');

btnConnect.addEventListener('click', function () {
    if (ws && ws.readyState < 2) return;

    log('\nConnecting...', 'connection-log');
    updateStatusUI(0);
    btnConnect.disabled = true;

    // Try a public echo server, fall back to mock
    ws = createWebSocket('wss://echo.websocket.org');

    // If real WS fails quickly, switch to mock
    const fallbackTimeout = setTimeout(() => {
        if (ws.readyState === 0 && !(ws instanceof MockWebSocket)) {
            ws.close();
            log('Public echo server unavailable, switching to mock...', 'connection-log');
            ws = new MockWebSocket('wss://mock-echo.local');
            attachWSHandlers(ws);
        }
    }, 3000);

    function attachWSHandlers(socket) {
        socket.onopen = function () {
            clearTimeout(fallbackTimeout);
            updateStatusUI(1);
            log('EVENT: onopen — Connected!', 'connection-log');
            btnDisconnect.disabled = false;
            chatInput.disabled = false;
            btnSend.disabled = false;
            btnStartHB.disabled = false;
            addChatMessage('Connected to server', 'system');
        };

        socket.onmessage = function (event) {
            log('EVENT: onmessage — data: ' + (typeof event.data === 'string' ? event.data.substring(0, 100) : '[binary]'), 'connection-log');

            // Handle heartbeat pong
            try {
                const parsed = JSON.parse(event.data);
                if (parsed.type === 'ping') {
                    log('Received ping echo — simulating pong', 'heartbeat-log');
                    handlePong();
                    return;
                }
            } catch (e) { /* not JSON, show as chat */ }

            addChatMessage(event.data, 'received');
        };

        socket.onerror = function (event) {
            log('EVENT: onerror — connection error', 'connection-log');
        };

        socket.onclose = function (event) {
            updateStatusUI(3);
            log('EVENT: onclose — code: ' + event.code + ', reason: ' + (event.reason || 'none') + ', clean: ' + event.wasClean, 'connection-log');
            btnConnect.disabled = false;
            btnDisconnect.disabled = true;
            chatInput.disabled = true;
            btnSend.disabled = true;
            btnStartHB.disabled = true;
            btnStopHB.disabled = true;
            stopHeartbeat();
            addChatMessage('Disconnected', 'system');
        };
    }

    attachWSHandlers(ws);
});

btnDisconnect.addEventListener('click', function () {
    if (ws && ws.readyState === 1) {
        log('\nGraceful disconnect...', 'connection-log');
        ws.close(1000, 'User clicked disconnect');
    }
});

// ============================================================
// EXAMPLE 2 — Hotstar Watch Party
// Story: Disney+ Hotstar streams live IPL matches. During a Virat Kohli
// century, millions react with emojis simultaneously. The watch party
// syncs reactions in real-time using WebSocket. Each reaction is a tiny
// message — send() handles it instantly.
// ============================================================

// ============================================================
// SECTION 4: Sending Data — ws.send()
// ============================================================

// WHY: WebSocket is bidirectional. You can send text, JSON, or binary data.

// --- Sending JSON (most common) ---
// const message = { type: 'reaction', emoji: 'bat', userId: 'user_12345', timestamp: Date.now() };
// ws.send(JSON.stringify(message));

// --- Sending binary data (ArrayBuffer) ---
// const buffer = new ArrayBuffer(4);
// const view = new DataView(buffer);
// view.setUint16(0, 100); // score
// view.setUint16(2, 6);   // runs on last ball
// ws.send(buffer);

// --- Always check readyState before sending ---
// if (ws.readyState === WebSocket.OPEN) ws.send(data);

// --- Check bufferedAmount for flow control ---
// if (ws.bufferedAmount < 1024) ws.send(data);

// ============================================================
// SECTION 5: WebSocket readyState
// ============================================================

// WHY: You must check readyState before sending. Sending on a closed connection throws.
// CONNECTING = 0 | OPEN = 1 | CLOSING = 2 | CLOSED = 3

function safeSend(socket, data) {
    switch (socket.readyState) {
        case 0: log('Still connecting... queue for later', 'connection-log'); break;
        case 1: socket.send(typeof data === 'string' ? data : JSON.stringify(data)); break;
        case 2: log('Connection closing, cannot send', 'connection-log'); break;
        case 3: log('Connection closed, cannot send', 'connection-log'); break;
    }
}

// ============================================================
// DOM: Chat Demo
// ============================================================

function addChatMessage(text, type) {
    const div = document.createElement('div');
    div.className = 'chat-msg ' + type;
    div.textContent = text;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function sendChatMessage() {
    const text = chatInput.value.trim();
    if (!text || !ws || ws.readyState !== 1) return;
    addChatMessage(text, 'sent');
    safeSend(ws, text);
    chatInput.value = '';
}

btnSend.addEventListener('click', sendChatMessage);
chatInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') sendChatMessage();
});

// ============================================================
// SECTION 6: Closing — ws.close()
// ============================================================

// WHY: Graceful disconnect tells the server why you are leaving.
// ws.close();                              // Normal closure
// ws.close(1000, 'User navigated away');   // With reason
// ws.close(4001, 'Match ended');           // 4000-4999 = app-specific codes

// CLOSE_CODES:
// NORMAL: 1000, GOING_AWAY: 1001,
// MATCH_ENDED: 4001, USER_LOGOUT: 4002, SESSION_EXPIRED: 4003
// After close(), readyState changes to CLOSING(2), then onclose fires

// ============================================================
// EXAMPLE 3 — Zerodha Kite Live Stock Ticker
// Story: Zerodha streams live stock prices to millions of traders. Each tick
// is a tiny binary message — JSON would waste bandwidth. They use a binary
// protocol with structured message types. Reconnection must be instant — a
// missed price update could lose lakhs of rupees in seconds.
// ============================================================

// ============================================================
// SECTION 7: Message Protocol — JSON with Type Field
// ============================================================

// WHY: A typed protocol lets both sides understand each message, like HTTP methods.

const MessageTypes = {
    SUBSCRIBE: 'subscribe', UNSUBSCRIBE: 'unsubscribe',
    PRICE_UPDATE: 'price_update', ERROR: 'error', PING: 'ping', PONG: 'pong',
};

function createMessage(type, data) {
    return JSON.stringify({
        type,
        data,
        timestamp: Date.now(),
        id: Math.random().toString(36).slice(2, 10)
    });
}

// ============================================================
// SECTION 8: Reconnection with Exponential Backoff
// ============================================================

// WHY: Connections drop. Your app MUST reconnect. But don't hammer the server —
// use exponential backoff: 1s, 2s, 4s, 8s... with jitter to prevent thundering herd.

let reconnectState = {
    retryCount: 0,
    maxRetries: 10,
    baseDelay: 1000,
    maxDelay: 30000,
    timer: null,
    active: false
};

const retryCountEl = document.getElementById('retry-count');
const retryDelayEl = document.getElementById('retry-delay');
const btnSimulateDrop = document.getElementById('btn-simulate-drop');
const btnStopReconnect = document.getElementById('btn-stop-reconnect');

function scheduleReconnect() {
    if (reconnectState.retryCount >= reconnectState.maxRetries) {
        log('Max retries (' + reconnectState.maxRetries + ') reached. Giving up.', 'reconnect-log');
        reconnectState.active = false;
        btnStopReconnect.disabled = true;
        return;
    }

    const delay = Math.min(
        reconnectState.baseDelay * Math.pow(2, reconnectState.retryCount),
        reconnectState.maxDelay
    );
    const jitter = delay * 0.3 * Math.random(); // Stagger 150M users reconnecting
    const totalDelay = Math.round(delay + jitter);

    reconnectState.retryCount++;
    retryCountEl.textContent = reconnectState.retryCount;
    retryDelayEl.textContent = (totalDelay / 1000).toFixed(1) + 's';

    log('Attempt ' + reconnectState.retryCount + ' — reconnecting in ' + (totalDelay / 1000).toFixed(1) + 's (backoff: ' + (delay / 1000).toFixed(1) + 's + jitter: ' + (jitter / 1000).toFixed(1) + 's)', 'reconnect-log');

    reconnectState.timer = setTimeout(function () {
        log('Reconnecting... (attempt ' + reconnectState.retryCount + ')', 'reconnect-log');
        // Simulate: 50% chance of success after attempt 3
        if (reconnectState.retryCount >= 3 && Math.random() > 0.5) {
            log('Reconnected successfully! Retry count reset to 0.', 'reconnect-log');
            reconnectState.retryCount = 0;
            retryCountEl.textContent = '0';
            retryDelayEl.textContent = '\u2014';
            reconnectState.active = false;
            btnStopReconnect.disabled = true;
        } else {
            log('Connection failed.', 'reconnect-log');
            if (reconnectState.active) scheduleReconnect();
        }
    }, totalDelay);
}

btnSimulateDrop.addEventListener('click', function () {
    if (reconnectState.active) return;
    reconnectState.retryCount = 0;
    reconnectState.active = true;
    retryCountEl.textContent = '0';
    btnStopReconnect.disabled = false;
    log('\n=== Connection dropped! Starting exponential backoff... ===', 'reconnect-log');
    scheduleReconnect();
});

btnStopReconnect.addEventListener('click', function () {
    if (reconnectState.timer) clearTimeout(reconnectState.timer);
    reconnectState.active = false;
    reconnectState.retryCount = 0;
    retryCountEl.textContent = '0';
    retryDelayEl.textContent = '\u2014';
    btnStopReconnect.disabled = true;
    log('Reconnection stopped by user.', 'reconnect-log');
});

// ============================================================
// SECTION 9: Heartbeat / Ping-Pong
// ============================================================

// WHY: Proxies and firewalls kill idle connections after 30-60s. Heartbeats keep alive.

function startHeartbeat() {
    const interval = 5000; // 5s for demo (real: 25s)
    const timeout = 3000;

    stopHeartbeat();
    log('Heartbeat started (every 5s for demo)', 'heartbeat-log');

    heartbeatTimer = setInterval(function () {
        if (!ws || ws.readyState !== 1) {
            log('Connection not open — stopping heartbeat', 'heartbeat-log');
            stopHeartbeat();
            return;
        }
        log('PING sent (timestamp: ' + Date.now() + ')', 'heartbeat-log');
        safeSend(ws, createMessage('ping', { timestamp: Date.now() }));

        pongTimer = setTimeout(function () {
            log('No pong received within ' + (timeout / 1000) + 's — connection may be dead!', 'heartbeat-log');
        }, timeout);
    }, interval);
}

function handlePong() {
    if (pongTimer) {
        clearTimeout(pongTimer);
        pongTimer = null;
    }
    log('PONG received — connection alive', 'heartbeat-log');
}

function stopHeartbeat() {
    if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
    if (pongTimer) { clearTimeout(pongTimer); pongTimer = null; }
    log('Heartbeat stopped', 'heartbeat-log');
}

btnStartHB.addEventListener('click', function () {
    startHeartbeat();
    btnStartHB.disabled = true;
    btnStopHB.disabled = false;
});

btnStopHB.addEventListener('click', function () {
    stopHeartbeat();
    btnStartHB.disabled = false;
    btnStopHB.disabled = true;
});

// ============================================================
// SECTION 10: Binary Data Transfer
// ============================================================

// WHY: Binary is 5-10x more compact than JSON for high-frequency data like stock ticks.

document.getElementById('btn-binary-demo').addEventListener('click', function () {
    const targetId = 'binary-log';
    document.getElementById(targetId).textContent = '';

    log('=== Binary Data Demo (Zerodha Kite Stock Tick) ===', targetId);

    // Build a binary stock tick: 12 bytes
    const buffer = new ArrayBuffer(12);
    const view = new DataView(buffer);
    view.setUint32(0, 1001);       // Symbol ID (RELIANCE)
    view.setFloat32(4, 2450.75);   // Price
    view.setUint32(8, 150000);     // Volume

    log('', targetId);
    log('Encoding stock tick as binary:', targetId);
    log('  Bytes 0-3:  Symbol ID  = ' + view.getUint32(0) + ' (RELIANCE)', targetId);
    log('  Bytes 4-7:  Price      = Rs.' + view.getFloat32(4).toFixed(2), targetId);
    log('  Bytes 8-11: Volume     = ' + view.getUint32(8).toLocaleString(), targetId);
    log('  Total: 12 bytes', targetId);

    // JSON equivalent
    const jsonMsg = JSON.stringify({ symbolId: 1001, price: 2450.75, volume: 150000 });
    log('', targetId);
    log('JSON equivalent: ' + jsonMsg, targetId);
    log('  Total: ' + jsonMsg.length + ' bytes', targetId);
    log('', targetId);
    log('Binary is ' + (jsonMsg.length / 12).toFixed(1) + 'x more compact!', targetId);
    log('For 1M ticks/sec: ' + (12 / 1024 / 1024 * 1000000).toFixed(1) + ' MB vs ' + (jsonMsg.length / 1024 / 1024 * 1000000).toFixed(1) + ' MB', targetId);

    // ws.binaryType = 'arraybuffer';
    // Receive: if (event.data instanceof ArrayBuffer) { const v = new DataView(event.data); ... }
});

// ============================================================
// SECTION 11: WebSocket vs Server-Sent Events (SSE)
// ============================================================

// WHY: SSE is simpler but one-way (server-to-client). Choose the right tool.
// (Comparison table is in the HTML)

// SSE Example for comparison:
// const source = new EventSource('https://api.dream11.example/live-stream');
// source.onmessage = (e) => console.log('SSE:', e.data);
// source.addEventListener('score', (e) => console.log('Score:', e.data));
// SSE reconnects automatically — no manual reconnection code needed!

// ============================================================
// SECTION 12: Security
// ============================================================

// WHY: WebSocket bypasses same-origin after handshake. Secure it properly.

(function () {
    const t = 'security-log';
    log('=== WebSocket Security ===', t);
    log('', t);
    log('1. ALWAYS use wss:// (encrypted)', t);
    log('   Bad:  ws://api.dream11.com/live     — unencrypted, MITM attacks', t);
    log('   Good: wss://api.dream11.com/live    — TLS encrypted', t);
    log('', t);
    log('2. Server checks Origin header during handshake', t);
    log('   if (request.headers.origin !== "https://dream11.com") reject();', t);
    log('', t);
    log('3. Authentication options:', t);
    log('   Option A: Token in URL (visible in server logs — less secure)', t);
    log('     new WebSocket("wss://api.com/live?token=eyJhbGci...");', t);
    log('   Option B: Send auth as first message (preferred)', t);
    log('     ws.onopen = () => ws.send(JSON.stringify({ type: "auth", token }));', t);
    log('   Option C: Cookie-based (automatic if same domain)', t);
    log('', t);
    log('4. Rate limit messages on server — prevent flooding', t);
    log('5. Validate/sanitize ALL incoming messages — never trust client data', t);
})();

// ============================================================
// EXAMPLE 4 — Swiggy Delivery Chat
// Story: Swiggy chat lets customers talk to delivery partners in real-time.
// Connection status shows green/red dot. When network drops (common on
// Indian mobile), the app reconnects and syncs missed messages.
// ============================================================

// ============================================================
// SECTION 13: Practical — Live Chat Room with Connection Status
// ============================================================

// WHY: Combines everything: connection management, protocol, reconnection, UI status.

// The LiveChatRoom class is demonstrated via the Chat Demo section above,
// which uses the real/mock WebSocket connection with all lifecycle handling.

// ============================================================
// KEY TAKEAWAYS
// ============================================================

(function () {
    const t = 'takeaways-log';
    log('=== KEY TAKEAWAYS ===', t);
    log('', t);
    log(' 1. WebSocket provides persistent, bidirectional communication — unlike', t);
    log('    HTTP request-response. Use it for real-time features.', t);
    log(' 2. Four events: onopen, onmessage, onerror, onclose. Handle all four.', t);
    log(' 3. Always check ws.readyState before ws.send(). OPEN = 1.', t);
    log(' 4. Use typed message protocol ({ type: "...", data: {...} }) so both', t);
    log('    sides understand each message.', t);
    log(' 5. Exponential backoff with jitter for reconnection — never hammer server.', t);
    log(' 6. Heartbeat ping/pong keeps connections alive past proxy timeouts (25-30s).', t);
    log(' 7. Binary data (ArrayBuffer) is 5-10x more compact than JSON for ticks.', t);
    log(' 8. SSE over WebSocket when you only need server-to-client push.', t);
    log(' 9. ALWAYS use wss://. Auth via first message, not URL tokens.', t);
    log('10. Buffer messages while disconnected, flush on reconnect.', t);
})();
