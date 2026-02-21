// ============================================================
// FILE 10: EVENT LOOP INTERNALS
// Topic: How JavaScript processes asynchronous code — the full picture
// WHY: JavaScript is single-threaded, yet it handles thousands of
//   concurrent operations. The event loop is the mechanism that makes
//   this possible. Misunderstanding it causes bugs that are almost
//   impossible to debug — race conditions, blocked UIs, and starvation.
//   Mastering it is the difference between guessing and knowing.
// ============================================================

// ============================================================
// EXAMPLE 1 — Razorpay: Juggling Payments, Webhooks, and UI
// Story: When a customer pays on Razorpay, multiple things happen
//   concurrently: the payment API responds, a webhook fires to the
//   merchant's server, the UI updates with a success animation,
//   and analytics events are queued. All of this is orchestrated
//   by the event loop — a single thread processing tasks in a
//   precise, predictable order.
// ============================================================

// WHY: The event loop is the heart of JavaScript's concurrency model.
// It's not multi-threading — it's a single thread that multiplexes
// work by processing one task at a time from multiple queues.

//
// THE BIG PICTURE:
//
// ┌─────────────────────────────────────────────────────────────────┐
// │ JAVASCRIPT RUNTIME                                              │
// │                                                                 │
// │  ┌──────────────┐     ┌──────────────────────────────────────┐ │
// │  │  CALL STACK   │     │  WEB APIs / libuv (C++ layer)        │ │
// │  │               │     │                                      │ │
// │  │  main()       │────→│  setTimeout()    ──→ Timer thread    │ │
// │  │  fn1()        │     │  fetch()         ──→ Network thread  │ │
// │  │  fn2()        │     │  fs.readFile()   ──→ I/O thread      │ │
// │  │               │     │  crypto.pbkdf2() ──→ Worker thread   │ │
// │  └──────────────┘     └──────────┬───────────────────────────┘ │
// │         ▲                         │                             │
// │         │                         ▼                             │
// │         │              ┌──────────────────────┐                │
// │         │              │  CALLBACK QUEUES      │                │
// │         │              │                       │                │
// │         │              │  Microtask Queue:     │                │
// │         │              │  [Promise.then, ...]  │                │
// │         │              │                       │                │
// │         │              │  Macrotask Queue:     │                │
// │         │              │  [setTimeout cb, ...] │                │
// │         │              └──────────┬────────────┘                │
// │         │                         │                             │
// │         │    ┌────────────────────┘                             │
// │         │    │                                                   │
// │         │    ▼                                                   │
// │    ┌─────────────────┐                                          │
// │    │   EVENT LOOP     │  ← checks: is call stack empty?         │
// │    │   (coordinator)  │     yes → pick next task from queues     │
// │    └─────────────────┘                                          │
// └─────────────────────────────────────────────────────────────────┘
//

console.log("=== The Big Picture ===");
console.log("Call Stack (LIFO) — where JS code actually executes");
console.log("Web APIs/libuv — async operations run here (separate threads)");
console.log("Callback Queues — completed async operations wait here");
console.log("Event Loop — moves callbacks from queues to call stack\n");


// ============================================================
// EXAMPLE 2 — Jio: Macrotasks vs Microtasks
// Story: JioMeet's video call needs to handle: UI rendering (macro),
//   promise resolutions from WebRTC (micro), and setTimeout-based
//   heartbeats (macro). The order in which these process determines
//   whether the call is smooth or glitchy.
// ============================================================

// WHY: There are TWO types of task queues, and their priority
// is the single most important thing to understand about the event loop.

//
// TASK TYPES:
//
// ┌──────────────────────────────────────────────────────────┐
// │ MICROTASK QUEUE (high priority)                          │
// │ ─ Promise.then / .catch / .finally callbacks             │
// │ ─ queueMicrotask()                                       │
// │ ─ MutationObserver (browser)                             │
// │ ─ process.nextTick() (Node.js — even HIGHER priority!)  │
// │                                                          │
// │ DRAINS COMPLETELY between each macrotask!                │
// └──────────────────────────────────────────────────────────┘
//
// ┌──────────────────────────────────────────────────────────┐
// │ MACROTASK QUEUE (normal priority)                        │
// │ ─ setTimeout / setInterval callbacks                     │
// │ ─ setImmediate (Node.js)                                 │
// │ ─ I/O callbacks (fs.readFile, network, etc.)             │
// │ ─ UI rendering tasks (browser — requestAnimationFrame)   │
// │                                                          │
// │ ONE macrotask processed per event loop iteration          │
// └──────────────────────────────────────────────────────────┘
//

console.log("=== Macrotasks vs Microtasks ===");
console.log("Microtasks: Promise.then, queueMicrotask, process.nextTick");
console.log("Macrotasks: setTimeout, setInterval, setImmediate, I/O");
console.log("RULE: ALL microtasks drain before the next macrotask runs!\n");


// ============================================================
// EXAMPLE 3 — Basic Ordering: setTimeout vs Promise
// Story: A Flipkart engineer bets their colleague that setTimeout(0)
//   runs before Promise.resolve().then(). They lose the bet — and
//   learn about microtask priority the hard way.
// ============================================================

console.log("=== QUIZ 1: setTimeout vs Promise ===");
console.log("Predict the output order:\n");

setTimeout(() => console.log("  4. setTimeout callback"), 0);

Promise.resolve().then(() => console.log("  3. Promise.then callback"));

console.log("  1. Synchronous code — first line");
console.log("  2. Synchronous code — second line");

// Explanation:
// Step 1: console.log("1...") — synchronous, runs immediately
// Step 2: console.log("2...") — synchronous, runs immediately
// Step 3: Promise.then callback — microtask, runs after all sync code
// Step 4: setTimeout callback — macrotask, runs after microtasks
//
// Output:
//   1. Synchronous code — first line
//   2. Synchronous code — second line
//   3. Promise.then callback
//   4. setTimeout callback


// ============================================================
// EXAMPLE 4 — PhonePe: process.nextTick Priority
// Story: PhonePe's payment SDK uses process.nextTick to ensure
//   critical callback registration happens BEFORE any I/O or
//   Promise callbacks. This guarantees the SDK is fully initialized
//   before any payment events fire.
// ============================================================

// WHY: process.nextTick() has HIGHER priority than even Promise
// microtasks. It runs at the END of the current operation, BEFORE
// the event loop continues to microtasks.

console.log("\n=== QUIZ 2: nextTick vs Promise vs setTimeout ===");
console.log("Predict the output order:\n");

// We need a macrotask boundary to see the ordering clearly
setTimeout(() => {
    console.log("--- Inside setTimeout (new macrotask) ---");

    // Schedule all three from within the same macrotask:
    setTimeout(() => console.log("  C. setTimeout (macrotask)"), 0);

    Promise.resolve().then(() => console.log("  B. Promise.then (microtask)"));

    process.nextTick(() => console.log("  A. process.nextTick (highest priority)"));

    console.log("  0. Synchronous (runs first)");

    // Output order:
    //   0. Synchronous (runs first)
    //   A. process.nextTick (highest priority)
    //   B. Promise.then (microtask)
    //   C. setTimeout (macrotask)
}, 0);

//
// PRIORITY ORDER:
//
//  ┌─────────────────────────────────────────────┐
//  │  1. Synchronous code (call stack)            │  ← HIGHEST
//  │  2. process.nextTick queue                   │
//  │  3. Microtask queue (Promise.then, etc.)     │
//  │  4. Macrotask queue (setTimeout, I/O, etc.)  │  ← LOWEST
//  └─────────────────────────────────────────────┘
//


// ============================================================
// EXAMPLE 5 — Swiggy: Event Loop Phases in Node.js
// Story: Swiggy's order processing server handles HTTP requests (I/O),
//   scheduled cleanup (timers), and health checks (check phase).
//   Understanding Node.js event loop phases helps them control
//   exactly WHEN each type of callback runs.
// ============================================================

// WHY: Node.js event loop has 6 phases, not just "macro vs micro."
// Each phase has its own queue of callbacks to process.

//
// NODE.JS EVENT LOOP PHASES:
//
//    ┌───────────────────────────────────────────────┐
//    │                                               │
//    │  ┌─────────────────┐                          │
//    │  │ 1. TIMERS        │  setTimeout, setInterval │
//    │  └────────┬─────────┘                          │
//    │           ▼                                    │
//    │  ┌─────────────────┐                          │
//    │  │ 2. PENDING       │  System-level callbacks  │
//    │  │    CALLBACKS     │  (TCP errors, etc.)      │
//    │  └────────┬─────────┘                          │
//    │           ▼                                    │
//    │  ┌─────────────────┐                          │
//    │  │ 3. IDLE/PREPARE  │  Internal use only       │
//    │  └────────┬─────────┘                          │
//    │           ▼                                    │
//    │  ┌─────────────────┐                          │
//    │  │ 4. POLL          │  Retrieve new I/O events │
//    │  │                  │  Execute I/O callbacks   │
//    │  └────────┬─────────┘                          │
//    │           ▼                                    │
//    │  ┌─────────────────┐                          │
//    │  │ 5. CHECK         │  setImmediate callbacks  │
//    │  └────────┬─────────┘                          │
//    │           ▼                                    │
//    │  ┌─────────────────┐                          │
//    │  │ 6. CLOSE         │  close event callbacks   │
//    │  │    CALLBACKS     │  (socket.on('close'))    │
//    │  └────────┬─────────┘                          │
//    │           │                                    │
//    │           └────────────────────────────────────┘
//    │                    (loop back to timers)
//
// Between EVERY phase: drain nextTick queue, then drain microtask queue

console.log("\n=== Node.js Event Loop Phases ===");
console.log("Phase 1: Timers      — setTimeout, setInterval");
console.log("Phase 2: Pending     — system-level callbacks (TCP errors)");
console.log("Phase 3: Idle        — internal use");
console.log("Phase 4: Poll        — I/O callbacks (fs, net, etc.)");
console.log("Phase 5: Check       — setImmediate");
console.log("Phase 6: Close       — socket.on('close') etc.");
console.log("Between each phase: nextTick queue → microtask queue\n");


// ============================================================
// EXAMPLE 6 — Zerodha: setTimeout vs setImmediate
// Story: Zerodha's trading engine uses setImmediate for processing
//   order confirmations after I/O, and setTimeout for retry delays.
//   The ordering between them depends on WHERE they're called from.
// ============================================================

console.log("=== QUIZ 3: setTimeout(0) vs setImmediate ===");
console.log("Predict: which runs first?\n");

// Case 1: Called from main module (top-level)
// The order is NON-DETERMINISTIC! It depends on how fast the event loop starts.
setTimeout(() => console.log("  setTimeout from main"), 0);
setImmediate(() => console.log("  setImmediate from main"));
console.log("  From main module: order is non-deterministic!\n");

// Case 2: Called from within an I/O callback
// setImmediate ALWAYS runs first (because we're in the poll phase,
// and check phase comes right after poll, before timers)
const fs = require("fs");

fs.readFile(__filename, () => {
    setTimeout(() => console.log("  setTimeout from I/O callback"), 0);
    setImmediate(() => console.log("  setImmediate from I/O callback (runs first!)"));
    console.log("  Inside I/O callback: setImmediate ALWAYS before setTimeout\n");
});


// ============================================================
// EXAMPLE 7 — CRED: Microtask Starvation
// Story: A CRED developer used recursive Promise.then() to process
//   a large queue. Each promise resolved and created another promise.
//   The microtask queue NEVER emptied — setTimeout callbacks, I/O,
//   and rendering were completely starved. The UI froze solid.
// ============================================================

// WHY: Microtasks drain COMPLETELY before the next macrotask.
// If microtasks keep adding more microtasks, macrotasks NEVER run.
// This is called "starvation."

console.log("=== Microtask Starvation ===");

// BAD: Recursive microtask — starves everything else
// WARNING: This would freeze your process! Don't actually run this.
/*
function infiniteMicrotask() {
    Promise.resolve().then(() => {
        console.log("microtask");
        infiniteMicrotask();  // Adds another microtask!
    });
}
infiniteMicrotask();  // setTimeout callbacks will NEVER run!
*/

console.log("BAD: Recursive Promise.then creates infinite microtasks");
console.log("     setTimeout, I/O, rendering — all starved forever!");
console.log();

// GOOD: Use setTimeout to yield to the event loop
function processQueueSafely(items, index) {
    if (index >= items.length) return;

    // Process one item
    const item = items[index];
    // ... do work ...

    // Yield to event loop using setTimeout (macrotask)
    setTimeout(() => processQueueSafely(items, index + 1), 0);
}

console.log("GOOD: Use setTimeout to break up work and yield to event loop");
console.log("      This lets I/O, timers, and rendering proceed between items\n");

// Even better: use setImmediate in Node.js
function processQueueBetter(items, index) {
    if (index >= items.length) return;
    const item = items[index];
    // ... do work ...
    setImmediate(() => processQueueBetter(items, index + 1));
}

console.log("BETTER: setImmediate in Node.js — runs in check phase, very efficient\n");


// ============================================================
// EXAMPLE 8 — Naukri: queueMicrotask() Explained
// Story: Naukri.com's frontend uses queueMicrotask() to schedule
//   small cleanup tasks that must run before the next render but
//   after the current synchronous code completes.
// ============================================================

// WHY: queueMicrotask() is the explicit way to add to the microtask
// queue. It's like Promise.resolve().then() but without creating
// a Promise object — more efficient for simple scheduling.

console.log("=== queueMicrotask() ===");

setTimeout(() => {
    console.log("--- queueMicrotask demo ---");

    queueMicrotask(() => console.log("  2. queueMicrotask (microtask)"));
    console.log("  1. synchronous code");
    queueMicrotask(() => console.log("  3. second queueMicrotask"));

    // Output: 1, 2, 3
    // queueMicrotask is equivalent to Promise.resolve().then()
    // but doesn't create a Promise object
}, 50);


// ============================================================
// EXAMPLE 9 — MakeMyTrip: Complex Output Order Puzzles
// Story: MakeMyTrip's technical interview includes event loop
//   ordering questions. Here are 5 puzzles that test deep
//   understanding of the event loop.
// ============================================================

console.log("\n=== OUTPUT ORDER PUZZLES ===\n");

// --- PUZZLE 1: Mixed Async ---
console.log("PUZZLE 1: Mixed Async");
console.log("Code:");
console.log('  console.log("A");');
console.log('  setTimeout(() => console.log("B"), 0);');
console.log('  Promise.resolve().then(() => console.log("C"));');
console.log('  console.log("D");');
console.log("");
console.log("Answer: A, D, C, B");
console.log("Why: A,D are sync. C is microtask (before macrotask). B is macrotask.\n");

// --- PUZZLE 2: Nested Promises ---
console.log("PUZZLE 2: Nested Promises");
console.log("Code:");
console.log('  Promise.resolve().then(() => {');
console.log('    console.log("P1");');
console.log('    Promise.resolve().then(() => console.log("P2"));');
console.log('  });');
console.log('  Promise.resolve().then(() => console.log("P3"));');
console.log("");
console.log("Answer: P1, P3, P2");
console.log("Why: P1 and P3 are queued at same level. P2 is queued DURING P1's execution.");
console.log("     Microtask queue after P1 runs: [P3, P2]. So P3 before P2.\n");

// --- PUZZLE 3: setTimeout inside Promise ---
console.log("PUZZLE 3: setTimeout inside Promise");
console.log("Code:");
console.log('  setTimeout(() => console.log("T1"), 0);');
console.log('  Promise.resolve().then(() => {');
console.log('    console.log("P1");');
console.log('    setTimeout(() => console.log("T2"), 0);');
console.log('  });');
console.log("");
console.log("Answer: P1, T1, T2");
console.log("Why: P1 is microtask (runs first). T1 was queued before T2. Both are macrotasks.\n");

// --- PUZZLE 4: async/await desugaring ---
console.log("PUZZLE 4: async/await");
console.log("Code:");
console.log('  async function foo() {');
console.log('    console.log("F1");');
console.log('    await Promise.resolve();');
console.log('    console.log("F2");  // This is like .then(() => console.log("F2"))');
console.log('  }');
console.log('  console.log("A");');
console.log('  foo();');
console.log('  console.log("B");');
console.log("");
console.log("Answer: A, F1, B, F2");
console.log("Why: A is sync. foo() starts → F1 is sync (before await). B is sync.");
console.log("     F2 is in microtask queue (after await). Runs after all sync code.\n");

// --- PUZZLE 5: nextTick + Promise + setTimeout ---
console.log("PUZZLE 5: The Ultimate Priority Test");
console.log("Code:");
console.log('  setTimeout(() => {');
console.log('    console.log("T");');
console.log('    process.nextTick(() => console.log("NT-inner"));');
console.log('    Promise.resolve().then(() => console.log("P-inner"));');
console.log('  }, 0);');
console.log('  process.nextTick(() => console.log("NT"));');
console.log('  Promise.resolve().then(() => console.log("P"));');
console.log('  console.log("S");');
console.log("");
console.log("Answer: S, NT, P, T, NT-inner, P-inner");
console.log("Why: S is sync. NT is nextTick (highest async priority).");
console.log("     P is microtask. T is macrotask. After T runs,");
console.log("     NT-inner (nextTick) before P-inner (promise microtask).\n");


// ============================================================
// EXAMPLE 10 — Hotstar: requestAnimationFrame and requestIdleCallback
// Story: Hotstar's live sports overlay uses requestAnimationFrame
//   for smooth 60fps score animations, and requestIdleCallback
//   for lazy-loading related content when the browser is idle.
//   (Browser-only APIs, but important to understand.)
// ============================================================

// WHY: In browsers, the event loop also handles rendering.
// rAF runs before repaint (for smooth animations).
// rIC runs when the browser has nothing else to do.

console.log("=== Browser: requestAnimationFrame & requestIdleCallback ===\n");

//
// BROWSER EVENT LOOP (one iteration):
//
// ┌────────────────────────────────────────────────────────────┐
// │                                                            │
// │  1. Pick ONE macrotask from queue (setTimeout, click, etc.)│
// │     ↓                                                      │
// │  2. Drain ALL microtasks (Promise.then, queueMicrotask)    │
// │     ↓                                                      │
// │  3. If it's time to render (~16.6ms for 60fps):            │
// │     a. Run requestAnimationFrame callbacks                 │
// │     b. Style calculation → Layout → Paint → Composite      │
// │     ↓                                                      │
// │  4. If idle time remains:                                  │
// │     Run requestIdleCallback                                │
// │     ↓                                                      │
// │  5. Go back to step 1                                      │
// │                                                            │
// └────────────────────────────────────────────────────────────┘
//

console.log("requestAnimationFrame (rAF):");
console.log("  - Runs BEFORE the browser repaints (~60 times/sec)");
console.log("  - Use for: animations, DOM measurements, visual updates");
console.log("  - Runs AFTER microtasks, BEFORE paint");
console.log();

console.log("requestIdleCallback (rIC):");
console.log("  - Runs when the browser is IDLE (no tasks, no rendering)");
console.log("  - Use for: analytics, lazy loading, prefetching");
console.log("  - Has a deadline — don't do too much work!");
console.log("  - Not available in all browsers; polyfill with setTimeout\n");


// ============================================================
// EXAMPLE 11 — Urban Company: setTimeout(fn, 0) is Not Immediate
// Story: An Urban Company engineer assumed setTimeout(fn, 0) meant
//   "run immediately." In reality, there's a minimum delay — and
//   for nested timeouts, browsers enforce a 4ms minimum (though
//   modern engines are reducing this).
// ============================================================

// WHY: setTimeout(fn, 0) doesn't mean "run now." It means "run as
// soon as possible, but after the current call stack clears, all
// microtasks drain, and the timer phase of the event loop arrives."

console.log("=== setTimeout(fn, 0) is Not Immediate ===");

const timerStart = Date.now();
setTimeout(() => {
    const actual = Date.now() - timerStart;
    console.log(`  setTimeout(fn, 0) actual delay: ${actual}ms`);
    console.log("  Minimum delay: ~1ms in modern engines (was 4ms in older specs)");
    console.log("  In browsers, nested setTimeout (depth > 5) enforces 4ms minimum");
}, 0);

// Demonstrating nested setTimeout delays
console.log("Nested setTimeout delay demonstration:");
let depth = 0;
const nestStart = Date.now();
function nestedTimeout() {
    depth++;
    if (depth <= 8) {
        const elapsed = Date.now() - nestStart;
        console.log(`  Depth ${depth}: ${elapsed}ms elapsed`);
        setTimeout(nestedTimeout, 0);
    }
}
setTimeout(nestedTimeout, 0);
console.log();


// ============================================================
// EXAMPLE 12 — Practical: Building an Event Loop Visualizer
// Story: Let's build a simple event loop visualizer that shows
//   the order in which different types of tasks execute.
// ============================================================

console.log("=== Practical: Event Loop Visualizer ===\n");

function runEventLoopDemo() {
    const executionOrder = [];

    function log(msg) {
        executionOrder.push(msg);
    }

    // Schedule various tasks
    setTimeout(() => {
        log("MACRO-1: setTimeout(0)");

        // Inside this macrotask, schedule more
        process.nextTick(() => log("NEXTTICK-3: inside setTimeout"));
        Promise.resolve().then(() => log("MICRO-4: Promise inside setTimeout"));
        queueMicrotask(() => log("MICRO-5: queueMicrotask inside setTimeout"));

        // After all microtasks from this macrotask:
        setTimeout(() => {
            log("MACRO-6: nested setTimeout");
            // Print the final order
            console.log("Execution Order:");
            executionOrder.forEach((msg, i) => console.log(`  ${i + 1}. ${msg}`));
            console.log();
        }, 0);
    }, 0);

    setImmediate(() => log("IMMEDIATE-2: setImmediate"));

    process.nextTick(() => log("NEXTTICK-1: from main"));
    Promise.resolve().then(() => log("MICRO-2: Promise from main"));
    log("SYNC: main script");

    // Expected order (approximately):
    // 1. SYNC: main script           (synchronous)
    // 2. NEXTTICK-1: from main       (nextTick — highest async priority)
    // 3. MICRO-2: Promise from main  (microtask)
    // 4+ The rest depends on timer resolution and phase timing
}

runEventLoopDemo();


// ============================================================
// EXAMPLE 13 — Event Loop Anti-Patterns and Best Practices
// Story: After years of debugging async issues at Indian startups,
//   senior engineers compiled these patterns to avoid and embrace.
// ============================================================

// Using a delayed wrapper to let previous demos finish first
setTimeout(() => {
    console.log("=== Event Loop Best Practices ===\n");

    // Anti-pattern 1: Blocking the event loop
    console.log("ANTI-PATTERN 1: Blocking the event loop");
    console.log("  BAD:  while(Date.now() < start + 1000) {}  // blocks for 1 second!");
    console.log("  BAD:  JSON.parse(hugeString)                // can block for 100ms+");
    console.log("  BAD:  crypto.pbkdf2Sync(...)                // use async version!");
    console.log("  GOOD: Break CPU-heavy work into chunks with setImmediate()\n");

    // Anti-pattern 2: Unhandled promise rejections
    console.log("ANTI-PATTERN 2: Unhandled promise rejections");
    console.log("  BAD:  someAsyncFn();  // no .catch(), no try/catch");
    console.log("  GOOD: someAsyncFn().catch(handleError);");
    console.log("  GOOD: try { await someAsyncFn(); } catch(e) { handleError(e); }");
    console.log("  Node.js: process.on('unhandledRejection', handler)\n");

    // Anti-pattern 3: Mixing callbacks and promises
    console.log("ANTI-PATTERN 3: Mixing callbacks and promises");
    console.log("  BAD:  function fetch(url, callback) { ... return promise; }");
    console.log("  GOOD: Pick one pattern. Prefer async/await everywhere.\n");

    // Best practice: Use async/await for clarity
    console.log("BEST PRACTICE: async/await for readable async code");
    console.log("  async function processPayment(orderId) {");
    console.log("    const order = await getOrder(orderId);");
    console.log("    const payment = await chargeCard(order);");
    console.log("    await sendReceipt(payment);");
    console.log("    return payment;");
    console.log("  }");
    console.log("  Clean, sequential reading order. Errors propagate naturally.\n");

    // Best practice: Parallelize independent operations
    console.log("BEST PRACTICE: Promise.all for independent operations");
    console.log("  const [user, orders, recommendations] = await Promise.all([");
    console.log("    getUser(id),");
    console.log("    getOrders(id),");
    console.log("    getRecommendations(id)");
    console.log("  ]);");
    console.log("  Three I/O operations run concurrently — 3x faster!\n");
}, 200);


// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. JavaScript is SINGLE-THREADED. The event loop enables concurrency
//    by multiplexing tasks from different queues on that one thread.
//
// 2. PRIORITY ORDER: Synchronous > process.nextTick > Microtasks
//    (Promise.then, queueMicrotask) > Macrotasks (setTimeout, I/O).
//
// 3. ALL microtasks drain completely between each macrotask.
//    Infinite microtasks = starvation (no setTimeout, no I/O, no rendering).
//
// 4. Node.js event loop has 6 phases: timers → pending → idle →
//    poll → check → close. nextTick + microtasks drain between each phase.
//
// 5. setTimeout(fn, 0) is NOT immediate. Minimum ~1ms delay, and it
//    runs in the timer phase (after microtasks drain).
//
// 6. setImmediate runs in the check phase — AFTER I/O callbacks in
//    the poll phase. Inside I/O callbacks, setImmediate always before setTimeout.
//
// 7. async/await is syntactic sugar over Promises. Code after `await`
//    runs as a microtask (like .then() callback).
//
// 8. Never block the event loop with synchronous heavy computation.
//    Use worker threads, child processes, or chunked processing.
//
// 9. requestAnimationFrame (browser) runs before repaint — use for
//    animations. requestIdleCallback runs during idle time.
//
// 10. Master the output-order puzzles. They're the best way to verify
//     you truly understand the event loop.
// ============================================================

console.log("=== FILE 10 COMPLETE ===");
console.log("The event loop is JavaScript's heartbeat.");
console.log("Every async operation you write dances to its rhythm.\n");
