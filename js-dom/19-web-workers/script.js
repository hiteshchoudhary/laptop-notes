// ============================================================
// FILE 19: WEB WORKERS — MULTI-THREADING IN THE BROWSER
// Topic: Offloading heavy computation to background threads
// WHY: JavaScript is single-threaded — heavy computation on
// the main thread blocks the UI, causing frozen screens and
// janky animations. Web Workers run code in a separate thread,
// keeping the UI smooth even during intense processing.
// ============================================================

// NOTE: Web Workers run in a BROWSER context. Node.js uses
// "worker_threads" with a different API. Workers require
// separate script files (or Blob URLs for inline workers).
// Code is labeled "MAIN THREAD" or "WORKER" accordingly.

// --- Helper: log to both console and a DOM output area ---
function log(msg, targetId) {
    console.log(msg);
    const el = document.getElementById(targetId);
    if (el) el.textContent += msg + '\n';
}

// --- Message log helper ---
function addToMessageLog(direction, msg) {
    const logEl = document.getElementById('message-log');
    if (!logEl) return;
    // Clear "empty" placeholder
    const empty = logEl.querySelector('.log-empty');
    if (empty) empty.remove();

    const entry = document.createElement('div');
    entry.className = 'log-entry';
    const time = new Date().toLocaleTimeString();
    entry.innerHTML = `
        <span class="log-time">${time}</span>
        <span class="log-direction ${direction}">${
            direction === 'to-worker' ? 'MAIN->' :
            direction === 'from-worker' ? '<-WORK' : 'ERROR'
        }</span>
        <span class="log-msg">${msg}</span>
    `;
    logEl.appendChild(entry);
    logEl.scrollTop = logEl.scrollHeight;
}

// ============================================================
// EXAMPLE 1 — Why Web Workers? PhonePe's Frozen UI Problem
// Story: PhonePe processes 4B+ transactions monthly. When a
// user exports 6-month transaction history as CSV, processing
// 10,000+ records freezes the UI for 3-5 seconds. Users think
// the app crashed. Workers move heavy work to a background
// thread so the UI stays responsive.
// ============================================================

// WHY: JavaScript has ONE main thread for BOTH code AND UI.
// 3 seconds of computation = 3 seconds of frozen UI.

// --- CPU Core Count ---
const cores = navigator.hardwareConcurrency || 4;
document.getElementById('core-count').textContent = cores;
log(`CPU cores: ${cores}`, 'output-1');

// --- Main thread animation (counter proves UI is alive) ---
let counterValue = 0;
const counterEl = document.getElementById('counter');
const threadIndicator = document.getElementById('main-thread-indicator');

setInterval(() => {
    counterValue++;
    if (counterEl) counterEl.textContent = counterValue;
}, 100);

// --- The problem: blocking the main thread ---
function heavyComputation(iterations) {
    let result = 0;
    for (let i = 0; i < iterations; i++) {
        result += Math.sqrt(i);
    }
    return result;
    // If called directly: buttons unresponsive, animations stop,
    // scrolling impossible, browser may show "Not Responding"
}

// Block main thread button
document.getElementById('block-btn')?.addEventListener('click', () => {
    log('Blocking main thread with heavy computation...', 'output-1');
    log('Watch the spinner and counter FREEZE!', 'output-1');
    if (threadIndicator) {
        threadIndicator.textContent = 'BLOCKED';
        threadIndicator.className = 'thread-indicator blocked';
    }

    const start = performance.now();

    // This blocks the main thread — UI freezes!
    setTimeout(() => {
        heavyComputation(50000000);
        const elapsed = (performance.now() - start).toFixed(0);

        document.getElementById('block-time').textContent = `${elapsed}ms`;
        document.getElementById('block-status').textContent = 'UI was FROZEN!';
        log(`Main thread blocked for ${elapsed}ms. UI was frozen!`, 'output-1');

        if (threadIndicator) {
            threadIndicator.textContent = 'responsive';
            threadIndicator.className = 'thread-indicator responsive';
        }
    }, 50);
});

// ============================================================
// EXAMPLE 2 — Creating a Basic Web Worker (Inline via Blob)
// Story: PhonePe creates a worker for computation. The main
// thread sends data, the worker processes it in the background,
// and sends the result back.
// ============================================================

// WHY: Workers run in a separate thread with their own memory.
// They cannot access the DOM but can do heavy computation
// without affecting the UI.

// --- INLINE WORKER CODE (since we use Blob URLs) ---
const computeWorkerCode = `
    // --- WORKER THREAD ---
    self.onmessage = function(event) {
        const { action, data } = event.data;

        if (action === 'heavyCompute') {
            const start = Date.now();
            let result = 0;
            for (let i = 0; i < data.iterations; i++) {
                result += Math.sqrt(i);
            }
            self.postMessage({
                action: 'computeResult',
                result: result,
                elapsed: Date.now() - start
            });
        }

        if (action === 'cloneTest') {
            // Structured Clone test: verify what arrives
            self.postMessage({
                action: 'cloneResult',
                received: {
                    string: typeof data.string,
                    number: typeof data.number,
                    date: data.date instanceof Date ? 'Date' : typeof data.date,
                    regex: data.regex instanceof RegExp ? 'RegExp' : typeof data.regex,
                    nullVal: data.nullVal,
                    undefinedVal: data.undefinedVal,
                    nested: typeof data.nested
                }
            });
        }

        if (action === 'transferTest') {
            // Receive transferred buffer
            const buffer = data.buffer;
            self.postMessage({
                action: 'transferResult',
                bufferSize: buffer.byteLength,
                msg: 'Worker received the buffer!'
            });
        }
    };
`;

// ============================================================
// EXAMPLE 5 — Inline Workers: No Separate File Needed
// Story: PhonePe's team finds managing separate worker files
// tedious for small utilities. Blob + URL.createObjectURL()
// creates a worker from a code string — no extra files needed.
// ============================================================

// WHY: Inline workers are perfect for small utility workers,
// testing, or when your bundler doesn't support worker files.

function createInlineWorker(code) {
    const blob = new Blob([code], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const worker = new Worker(url);
    // Store URL for cleanup
    worker._blobUrl = url;
    return worker;
}

function terminateWorker(worker) {
    worker.terminate();
    if (worker._blobUrl) URL.revokeObjectURL(worker._blobUrl);
}

// --- Worker button: use worker instead of blocking ---
document.getElementById('worker-btn')?.addEventListener('click', () => {
    log('Starting computation in Web Worker...', 'output-1');
    log('Watch — spinner and counter keep running!', 'output-1');
    addToMessageLog('to-worker', 'heavyCompute: 50,000,000 iterations');

    const worker = createInlineWorker(computeWorkerCode);
    const start = performance.now();

    // Step 2: Send data TO the worker
    worker.postMessage({ action: 'heavyCompute', data: { iterations: 50000000 } });
    // postMessage COPIES data via Structured Clone Algorithm

    // Step 3: Receive results FROM the worker
    worker.onmessage = function(event) {
        const { action, result, elapsed } = event.data;
        if (action === 'computeResult') {
            const totalTime = (performance.now() - start).toFixed(0);
            document.getElementById('worker-time').textContent = `${totalTime}ms`;
            document.getElementById('worker-status').textContent = 'UI stayed smooth!';
            log(`Worker computed in ${elapsed}ms (total: ${totalTime}ms). UI was smooth!`, 'output-1');
            addToMessageLog('from-worker', `computeResult: ${elapsed}ms, result=${result.toFixed(2)}`);
            // Step 5: Terminate when done
            terminateWorker(worker);
        }
    };

    // Step 4: Handle errors
    worker.onerror = function(error) {
        log(`Worker error: ${error.message}`, 'output-1');
        addToMessageLog('error', error.message);
        terminateWorker(worker);
    };
});

// ============================================================
// EXAMPLE 3 — Structured Clone: What Can/Cannot Be Sent
// Story: A PhonePe dev tried sending a DOM element to a
// worker — it crashed. The Structured Clone Algorithm defines
// what data can transfer between threads.
// ============================================================

// WHY: postMessage uses Structured Clone, NOT JSON.stringify.
// It supports more types but still has restrictions.

document.getElementById('clone-test-btn')?.addEventListener('click', () => {
    const worker = createInlineWorker(computeWorkerCode);
    addToMessageLog('to-worker', 'cloneTest: sending various types');

    // --- CAN be sent ---
    const clonableData = {
        string: 'hello',
        number: 42,
        boolean: true,
        nullVal: null,
        undefinedVal: undefined,    // Preserved (unlike JSON!)
        date: new Date(),           // Preserved as Date
        regex: /pattern/gi,         // Preserved as RegExp
        nested: { deep: { object: true } }
    };

    worker.postMessage({ action: 'cloneTest', data: clonableData });

    worker.onmessage = (event) => {
        if (event.data.action === 'cloneResult') {
            const r = event.data.received;
            log('--- Structured Clone Test ---', 'output-4');
            Object.entries(r).forEach(([key, val]) => {
                log(`  ${key}: ${JSON.stringify(val)}`, 'output-4');
            });
            addToMessageLog('from-worker', `cloneResult: ${JSON.stringify(r)}`);
            terminateWorker(worker);
        }
    };

    // --- CANNOT be sent ---
    // Functions:   () => {}           // ERROR: could not be cloned
    // DOM nodes:   document.body      // ERROR: cannot clone
    // Symbols:     Symbol('id')       // ERROR: cannot clone
    // Class instances lose their prototype (sent as plain objects)
    log('Functions, DOM nodes, Symbols CANNOT be sent to workers', 'output-4');
});

// ============================================================
// EXAMPLE 4 — Transferable Objects: Zero-Copy Performance
// Story: PhonePe's encryption worker processes 50MB ArrayBuffers.
// Copying via postMessage is slow. Transferable objects MOVE
// the buffer — zero copy, instant, but the sender loses access.
// ============================================================

// WHY: Transfer MOVES ownership instead of copying. Instant
// for large buffers but destructive to the sender.

document.getElementById('transfer-test-btn')?.addEventListener('click', () => {
    const worker = createInlineWorker(computeWorkerCode);

    // Create a 1MB buffer
    const buffer = new ArrayBuffer(1024 * 1024); // 1 MB
    log(`Before transfer: buffer.byteLength = ${buffer.byteLength}`, 'output-4');
    addToMessageLog('to-worker', `transferTest: 1MB ArrayBuffer`);

    // --- With transfer (MOVES — instant but destructive) ---
    worker.postMessage(
        { action: 'transferTest', data: { buffer: buffer } },
        [buffer] // 2nd arg = transferables list
    );

    // After transfer, sender loses access!
    log(`After transfer: buffer.byteLength = ${buffer.byteLength} (NEUTERED!)`, 'output-4');

    worker.onmessage = (event) => {
        if (event.data.action === 'transferResult') {
            log(`Worker received: ${event.data.bufferSize} bytes`, 'output-4');
            log(`Message: ${event.data.msg}`, 'output-4');
            addToMessageLog('from-worker', `transferResult: ${event.data.bufferSize} bytes`);
            terminateWorker(worker);
        }
    };

    // Transferable types: ArrayBuffer, MessagePort, OffscreenCanvas
});

// ============================================================
// EXAMPLE 6 — Worker Lifecycle and Termination
// Story: PhonePe creates workers for CSV export, encryption,
// data analysis. Each consumes a system thread. Forgetting to
// terminate leads to resource leaks on budget phones.
// ============================================================

// WHY: Workers persist until terminated. Always clean up.
// --- Terminate from main thread: worker.terminate()
// --- Terminate from inside worker: self.close()

// ============================================================
// EXAMPLE 7 — Error Handling in Workers
// Story: A PhonePe worker encounters errors. Without error
// handling, the error is silently swallowed.
// ============================================================

// WHY: Worker errors don't crash the main thread but are
// silently lost unless you listen for them.
// Always use worker.onerror or structured error handling
// (try/catch inside worker + status in messages).

// ============================================================
// EXAMPLE 8 — SharedWorker: Shared Across Tabs
// Story: PhonePe users have multiple tabs open. Regular Workers
// duplicate per tab. SharedWorker is shared across all tabs of
// the same origin — saving resources and enabling cross-tab
// communication through a central hub.
// ============================================================

// WHY: SharedWorkers save resources when multiple tabs need
// the same background processing (e.g., one WebSocket connection).
// Note: SharedWorker requires a separate file, not inline Blob.

// ============================================================
// EXAMPLE 9 — Worker Limitations and Available APIs
// Story: A PhonePe intern tried document.getElementById()
// in a worker — instant crash. Workers have NO DOM access.
// This is by design to prevent race conditions.
// ============================================================

// WHY: Workers are sandboxed. No DOM prevents race conditions.
// But many APIs ARE available for data processing.

// --- CANNOT access ---
// window, document, document.cookie
// localStorage, sessionStorage
// alert(), confirm(), prompt()
// Parent page variables (separate memory space)

// --- CAN access ---
// self (worker global scope)
// fetch() — HTTP requests
// IndexedDB — database
// setTimeout / setInterval — timers
// WebSocket — real-time connections
// crypto — encryption/hashing
// console — debugging
// navigator.onLine — connectivity check
// importScripts('utils.js') — load external scripts
// Blob, FileReader — binary data
// TextEncoder / TextDecoder
// URL / URLSearchParams

// ============================================================
// EXAMPLE 10 — navigator.hardwareConcurrency: Worker Pool
// Story: PhonePe sizes its worker pool based on available cores.
// 8-core phone gets 7 workers; 4-core budget phone gets 3.
// Creating more workers than cores hurts performance.
// ============================================================

// WHY: More workers than CPU cores = context switching overhead.
// Size pools optimally using hardwareConcurrency.

// class WorkerPool {
//     constructor(workerScript, poolSize) {
//         this.size = Math.max(1, Math.min(poolSize, cores - 1));
//         // ... create worker instances, manage queue
//     }
//     execute(data) { ... }
//     terminate() { this.workers.forEach(w => w.terminate()); }
// }

// ============================================================
// EXAMPLE 11 — Practical: Prime Calculator with Live Progress
// Story: Worker computes primes in background with progress
// updates. UI stays responsive throughout.
// ============================================================

// WHY: Complete end-to-end worker pattern: create inline,
// send data, show progress, receive result, clean up.

const primeWorkerCode = `
    self.onmessage = function(event) {
        const { max } = event.data;
        const primes = [];
        function isPrime(n) {
            if (n < 2) return false;
            if (n === 2) return true;
            if (n % 2 === 0) return false;
            for (let i = 3; i <= Math.sqrt(n); i += 2) {
                if (n % i === 0) return false;
            }
            return true;
        }
        for (let i = 2; i <= max; i++) {
            if (isPrime(i)) primes.push(i);
            if (i % 10000 === 0) {
                self.postMessage({
                    type: 'progress', percent: Math.round((i / max) * 100),
                    primesFound: primes.length
                });
            }
        }
        self.postMessage({
            type: 'result', count: primes.length,
            largest: primes[primes.length - 1],
            first10: primes.slice(0, 10), last10: primes.slice(-10)
        });
    };
`;

let primeWorker = null;

function findPrimesWithWorker(max) {
    return new Promise((resolve, reject) => {
        const blob = new Blob([primeWorkerCode], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        primeWorker = new Worker(url);
        const start = Date.now();

        addToMessageLog('to-worker', `findPrimes: max=${max.toLocaleString()}`);
        log(`Finding primes up to ${max.toLocaleString()}... UI stays responsive!`, 'output-2');

        primeWorker.onmessage = function(event) {
            const msg = event.data;
            if (msg.type === 'progress') {
                // Update progress bar
                document.getElementById('prime-progress').style.width = msg.percent + '%';
                document.getElementById('prime-percent').textContent = msg.percent + '%';
                document.getElementById('prime-found').textContent = `${msg.primesFound.toLocaleString()} primes found`;
                addToMessageLog('from-worker', `progress: ${msg.percent}% (${msg.primesFound} primes)`);
            }
            if (msg.type === 'result') {
                const elapsed = Date.now() - start;
                document.getElementById('prime-progress').style.width = '100%';
                document.getElementById('prime-percent').textContent = '100%';
                document.getElementById('prime-found').textContent = `${msg.count.toLocaleString()} primes found`;
                document.getElementById('total-primes').textContent = msg.count.toLocaleString();
                document.getElementById('largest-prime').textContent = msg.largest.toLocaleString();
                document.getElementById('prime-time').textContent = `${elapsed}ms`;

                log(`Done! ${msg.count} primes up to ${max.toLocaleString()}`, 'output-2');
                log(`Largest: ${msg.largest} | Time: ${elapsed}ms`, 'output-2');
                log(`First 10: ${msg.first10.join(', ')}`, 'output-2');
                log(`Last 10: ${msg.last10.join(', ')}`, 'output-2');

                addToMessageLog('from-worker', `result: ${msg.count} primes in ${elapsed}ms`);

                primeWorker.terminate();
                URL.revokeObjectURL(url);
                primeWorker = null;
                resolve(msg);
            }
        };

        primeWorker.onerror = (e) => {
            addToMessageLog('error', e.message);
            primeWorker.terminate();
            URL.revokeObjectURL(url);
            primeWorker = null;
            reject(e);
        };

        primeWorker.postMessage({ max });
    });
}

document.getElementById('prime-start-btn')?.addEventListener('click', async () => {
    const max = Number(document.getElementById('prime-limit').value);
    // Reset UI
    document.getElementById('prime-progress').style.width = '0%';
    document.getElementById('prime-percent').textContent = '0%';
    document.getElementById('prime-found').textContent = '0 primes found';
    document.getElementById('output-2').textContent = '';

    try {
        await findPrimesWithWorker(max);
    } catch (err) {
        log(`Error: ${err.message}`, 'output-2');
    }
});

document.getElementById('prime-cancel-btn')?.addEventListener('click', () => {
    if (primeWorker) {
        primeWorker.terminate();
        primeWorker = null;
        log('Worker cancelled by user', 'output-2');
        addToMessageLog('error', 'Worker terminated by user');
    }
});

// ============================================================
// EXAMPLE 12 — Communication Pattern: Request-Response RPC
// Story: PhonePe's crypto worker handles encrypt, decrypt,
// hash, verify. Each request gets a unique ID to match
// responses even when multiple requests are in flight.
// ============================================================

// WHY: Workers process messages asynchronously. Request IDs
// match responses to their original requests.

// class WorkerRPC {
//     constructor(worker) { ... }
//     call(method, params) {
//         return new Promise((resolve, reject) => {
//             const requestId = this.nextId++;
//             this.pending.set(requestId, { resolve, reject });
//             this.worker.postMessage({ requestId, method, params });
//         });
//     }
// }

// Clear log button
document.getElementById('clear-log-btn')?.addEventListener('click', () => {
    const logEl = document.getElementById('message-log');
    if (logEl) logEl.innerHTML = '<div class="log-empty">Log cleared</div>';
});

// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. Workers run JS in a SEPARATE THREAD, preventing heavy
//    computation from blocking the UI.
// 2. Communication via postMessage/onmessage. Data is COPIED
//    using Structured Clone (not shared).
// 3. Transferable objects (ArrayBuffer) can be MOVED — zero
//    copy but sender loses access.
// 4. Workers CANNOT access: DOM, window, localStorage, cookies.
//    CAN access: fetch, IndexedDB, WebSocket, crypto, timers.
// 5. Inline workers use Blob + URL.createObjectURL() for small
//    utility workers without separate files.
// 6. SharedWorkers are shared across tabs of the same origin.
// 7. Always terminate workers when done — they consume real
//    system resources (threads + memory).
// 8. Use navigator.hardwareConcurrency to size worker pools.
// 9. Use request IDs (RPC pattern) for concurrent requests.
// 10. Ideal for: CSV export, encryption, image processing,
//     data sorting, parsing, mathematical computation.
