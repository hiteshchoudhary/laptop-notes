// ============================================================
// FILE 09: MEMORY LEAKS
// Topic: How memory leaks happen, how to detect them, and how to fix them
// WHY: A memory leak is memory that SHOULD be freed but ISN'T because
//   something still holds a reference to it. In long-running apps
//   (servers, mobile apps), even tiny leaks accumulate over hours and
//   days, eventually causing slowdowns, OOM crashes, and restarts.
// ============================================================

// ============================================================
// EXAMPLE 1 — Ola Driver App: The Slow Death by Leaks
// Story: Ola's driver app runs 12+ hours non-stop. After 4 hours,
//   drivers notice it getting sluggish. After 8 hours, it's crawling.
//   By hour 12, the app crashes. Investigation reveals multiple memory
//   leaks: unclosed event listeners, growing caches, and closures
//   holding onto huge scope chains. Each leak is small, but they
//   compound relentlessly.
// ============================================================

// WHY: A memory leak isn't a "crash" — it's a slow poison. Memory
// usage climbs steadily over time. The GC works harder and harder,
// causing longer pauses, until eventually there's no memory left.

//
// MEMORY LEAK PATTERN:
//
//  Memory ▲
//    Used │            ╱
//         │          ╱     ← growing without bound!
//         │        ╱
//         │      ╱
//         │    ╱
//         │  ╱
//         │╱
//         └──────────────────────→ Time
//
//  HEALTHY app: Memory rises and falls (GC collects garbage)
//  LEAKING app: Memory only rises (nothing is ever freed)
//

console.log("=== What is a Memory Leak? ===");
console.log("A memory leak = memory that SHOULD be freed but ISN'T");
console.log("because something STILL REFERENCES it, preventing GC.\n");

// Utility: snapshot memory for before/after comparisons
function memUsedMB() {
    return (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
}


// ============================================================
// LEAK 1 — Accidental Globals
// Story: A junior developer at an Indian ed-tech startup forgot
//   to use `let` or `const`. The variable became a global, living
//   forever and holding onto a massive string.
// ============================================================

// WHY: In non-strict mode, assigning to an undeclared variable
// creates a GLOBAL variable. Globals live for the entire program
// lifetime — they're always reachable from the global object.

console.log("=== LEAK 1: Accidental Globals ===");

function processStudentData() {
    // BAD: No let/const — this becomes a global!
    // leakedData = "x".repeat(1000);  // Uncomment to see the leak

    // In strict mode, this would throw: ReferenceError: leakedData is not defined
    // "use strict" at the top of a file prevents this!
}

processStudentData();
// leakedData is now global.leakedData — it NEVER gets garbage collected!

// FIX: Always use let/const and enable strict mode
function processStudentDataFixed() {
    "use strict";
    const localData = "x".repeat(1000);  // Scoped to function — GC'd when function returns
    return localData.length;
}

console.log("BAD:  forgot let/const → global variable → never freed");
console.log("FIX:  always use let/const + 'use strict'");
console.log("FIX2: ESLint rule 'no-undef' catches this at build time\n");


// ============================================================
// LEAK 2 — Forgotten Timers
// Story: Dunzo's delivery tracking page polls the server every 5
//   seconds using setInterval. When the user navigates away, the
//   component is destroyed but the interval keeps running — making
//   HTTP requests to nowhere and accumulating response objects.
// ============================================================

// WHY: setInterval creates a recurring callback that holds references
// to its closure scope. If you never call clearInterval, the callback
// (and everything it references) lives forever.

console.log("=== LEAK 2: Forgotten Timers ===");

// BAD: Interval never cleared
function startTrackingBad() {
    const deliveryData = { orderId: "D001", location: null, history: [] };

    const intervalId = setInterval(() => {
        // This closure captures `deliveryData` — it can never be GC'd!
        deliveryData.location = { lat: 12.97 + Math.random() * 0.01, lng: 77.59 + Math.random() * 0.01 };
        deliveryData.history.push({ ...deliveryData.location, time: Date.now() });
        // history array grows FOREVER — classic leak!
    }, 5000);

    // Oops — we return but never clear the interval!
    // The interval keeps running, deliveryData keeps growing.
    return intervalId;  // At least return the ID so someone CAN clear it
}

// GOOD: Always clear intervals when done
function startTrackingGood() {
    const deliveryData = { orderId: "D002", location: null, history: [] };

    const intervalId = setInterval(() => {
        deliveryData.location = { lat: 12.97, lng: 77.59 };
        deliveryData.history.push({ ...deliveryData.location, time: Date.now() });

        // Safety: cap the history to prevent unbounded growth
        if (deliveryData.history.length > 100) {
            deliveryData.history = deliveryData.history.slice(-50);
        }
    }, 5000);

    // Return a cleanup function
    return function stopTracking() {
        clearInterval(intervalId);
        deliveryData.history = [];  // Explicitly release
        console.log("  Tracking stopped, interval cleared, memory released!");
    };
}

const stopBad = startTrackingBad();
clearInterval(stopBad);  // Clean up for this demo

const stopGood = startTrackingGood();
stopGood();  // Proper cleanup

console.log("BAD:  setInterval runs forever, closure holds data forever");
console.log("FIX:  clearInterval + cap array growth + return cleanup function\n");


// ============================================================
// LEAK 3 — Closures Holding Large Scope
// Story: An engineer at CRED wrote a logging utility that returns
//   a small function, but that function's closure accidentally
//   captures a 100MB config object from the outer scope — keeping
//   it alive long after it's needed.
// ============================================================

// WHY: When an inner function is returned, it captures its ENTIRE
// enclosing scope (technically, V8 optimizes this, but shared scope
// between closures can cause unexpected retention).

console.log("=== LEAK 3: Closures Holding Large Scope ===");

// BAD: Closure captures the entire outer scope
function createLoggerBad() {
    const hugeConfig = {
        rules: new Array(10000).fill("rule data here"),  // Large!
        metadata: "x".repeat(10000)                       // Large!
    };

    const userId = "U001";  // Small — this is all we actually need

    // This closure only uses `userId`, but it captures the ENTIRE scope
    // including `hugeConfig`! V8 MAY optimize this away in some cases,
    // but if another closure in the same scope uses hugeConfig, both
    // closures share the scope and hugeConfig stays alive.
    return function log(message) {
        console.log(`  [${userId}] ${message}`);
    };
}

// GOOD: Only capture what you need
function createLoggerGood() {
    const hugeConfig = {
        rules: new Array(10000).fill("rule data here"),
        metadata: "x".repeat(10000)
    };

    const userId = hugeConfig.rules.length > 0 ? "U001" : "unknown";

    // Explicitly null out hugeConfig before creating the closure
    // (or better: restructure so the closure's scope doesn't include it)
    // hugeConfig = null;  // Can't do this with const, use let instead

    return function log(message) {
        console.log(`  [${userId}] ${message}`);
    };
}

const logBad = createLoggerBad();
const logGood = createLoggerGood();
logBad("This logger might hold onto hugeConfig");
logGood("This logger is lean");
console.log("BAD:  closure captures entire scope including large objects");
console.log("FIX:  extract needed values, null out large objects before returning\n");


// ============================================================
// LEAK 4 — Detached DOM Nodes (Browser-Specific)
// Story: Naukri.com's job listing page dynamically adds/removes
//   job cards. When a card is removed from the DOM, the JavaScript
//   variable still holds a reference to the DOM element — preventing
//   GC from collecting it.
// ============================================================

// WHY: This is a browser-specific leak. In Node.js, there's no DOM,
// but the concept applies to any situation where you remove an object
// from one data structure but keep a reference to it elsewhere.

console.log("=== LEAK 4: Detached DOM Nodes (Concept Demo) ===");

// Simulating the concept without actual DOM:
class SimulatedDOM {
    constructor() {
        this.children = [];
    }
    appendChild(node) {
        this.children.push(node);
    }
    removeChild(node) {
        this.children = this.children.filter(c => c !== node);
    }
}

const document = new SimulatedDOM();
const detachedReferences = [];  // This simulates JS variables holding DOM refs

// BAD: Removing from DOM but keeping JS reference
function createJobCardBad(jobTitle) {
    const card = { element: "div", textContent: jobTitle, data: "x".repeat(500) };
    document.appendChild(card);
    detachedReferences.push(card);  // Saved for later... but never cleaned up!
    return card;
}

const card1 = createJobCardBad("Software Engineer at Infosys");
document.removeChild(card1);  // Removed from "DOM"...
// But detachedReferences[0] still points to it — it's LEAKED!

// GOOD: Clean up all references
function removeJobCardGood(card) {
    document.removeChild(card);
    const idx = detachedReferences.indexOf(card);
    if (idx !== -1) detachedReferences.splice(idx, 1);  // Remove JS reference too!
}

console.log("BAD:  element removed from DOM but JS variable still references it");
console.log("FIX:  null out all JS references when removing from DOM\n");


// ============================================================
// LEAK 5 — Event Listeners Not Removed
// Story: PhonePe's UPI payment page adds a 'message' event listener
//   for payment callbacks. Every time the user revisits the payment
//   page (SPA), a NEW listener is added without removing the old one.
//   After 20 visits, 20 listeners fire for every message event.
// ============================================================

// WHY: Event listeners keep their callback functions alive, which
// keep their closure scope alive. Duplicate listeners waste memory
// AND cause unexpected behavior (handler fires multiple times).

console.log("=== LEAK 5: Event Listeners Not Removed ===");

// Using Node.js EventEmitter to demonstrate
const EventEmitter = require("events");
const paymentBus = new EventEmitter();

// BAD: Adding listeners without removing
function setupPaymentListenerBad(sessionId) {
    paymentBus.on("payment", (data) => {
        // This listener stays forever!
        console.log(`  [Session ${sessionId}] Payment received:`, data.amount);
    });
}

// Simulate user visiting payment page multiple times (SPA navigation)
setupPaymentListenerBad("S001");
setupPaymentListenerBad("S002");
setupPaymentListenerBad("S003");

console.log(`Listener count (BAD): ${paymentBus.listenerCount("payment")}`);
// 3 listeners! Old sessions S001 and S002 are still listening.

// GOOD: Remove old listener before adding new one
function setupPaymentListenerGood(sessionId) {
    // Remove ALL previous listeners for this event
    paymentBus.removeAllListeners("payment");

    paymentBus.on("payment", (data) => {
        console.log(`  [Session ${sessionId}] Payment received:`, data.amount);
    });
}

setupPaymentListenerGood("S004");
console.log(`Listener count (GOOD): ${paymentBus.listenerCount("payment")}`);
// 1 listener! Only the latest session.

// Even better: use AbortController (modern pattern)
// const controller = new AbortController();
// element.addEventListener('click', handler, { signal: controller.signal });
// controller.abort();  // Removes the listener!

paymentBus.removeAllListeners("payment");  // Clean up for demo
console.log("BAD:  listeners accumulate → memory grows, handlers fire multiple times");
console.log("FIX:  removeEventListener / removeAllListeners / AbortController\n");


// ============================================================
// LEAK 6 — Circular References (Historical Problem)
// Story: Early Internet Explorer used reference counting for GC.
//   Two objects referencing each other (A→B, B→A) would NEVER reach
//   zero reference count, even when unreachable. Modern engines use
//   Mark-and-Sweep, which handles this correctly.
// ============================================================

// WHY: Circular references are NOT a leak in modern engines, but
// understanding why they WERE a problem helps appreciate Mark-and-Sweep.

console.log("=== LEAK 6: Circular References ===");

function demonstrateCircularReference() {
    const order = { id: "ORD001" };
    const customer = { name: "Rahul" };

    // Circular reference
    order.customer = customer;   // order → customer
    customer.lastOrder = order;  // customer → order

    return null;  // Both are now unreachable from outside
    // Reference counting: both have refCount=1 (from each other) → NEVER freed
    // Mark-and-Sweep: neither reachable from root → BOTH freed correctly
}

demonstrateCircularReference();
console.log("Circular references: A↔B");
console.log("Reference counting (old IE): LEAK — refCount never reaches 0");
console.log("Mark-and-Sweep (modern V8): NO LEAK — unreachable = garbage\n");


// ============================================================
// LEAK 7 — Growing Arrays/Maps (Unbounded Caches)
// Story: Meesho's product recommendation engine caches results in
//   a Map. Every search adds entries but nothing is ever evicted.
//   After a week, the cache holds millions of entries and the
//   server uses 12GB of RAM.
// ============================================================

// WHY: Caches without eviction policies are one of the most common
// memory leaks in server-side JavaScript. The data structure grows
// monotonically — GC can't help because everything IS reachable.

console.log("=== LEAK 7: Growing Arrays/Maps (Unbounded Caches) ===");

// BAD: Cache that grows forever
const badCache = new Map();

function getRecommendationsBad(userId) {
    if (badCache.has(userId)) {
        return badCache.get(userId);
    }
    const results = { userId, products: Array(100).fill("product"), timestamp: Date.now() };
    badCache.set(userId, results);  // Added but NEVER removed!
    return results;
}

// Simulate many users
for (let i = 0; i < 10000; i++) {
    getRecommendationsBad(`user_${i}`);
}
console.log(`BAD cache size: ${badCache.size} entries (grows forever!)`);

// GOOD: LRU cache with maximum size
class LRUCache {
    constructor(maxSize) {
        this.maxSize = maxSize;
        this.cache = new Map();
    }

    get(key) {
        if (!this.cache.has(key)) return undefined;
        // Move to end (most recently used)
        const value = this.cache.get(key);
        this.cache.delete(key);
        this.cache.set(key, value);
        return value;
    }

    set(key, value) {
        if (this.cache.has(key)) {
            this.cache.delete(key);
        } else if (this.cache.size >= this.maxSize) {
            // Evict oldest entry (first key in Map)
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
        }
        this.cache.set(key, value);
    }

    get size() { return this.cache.size; }
}

const goodCache = new LRUCache(1000);  // Max 1000 entries!

for (let i = 0; i < 10000; i++) {
    goodCache.set(`user_${i}`, { products: ["p1", "p2"] });
}
console.log(`GOOD cache size: ${goodCache.size} entries (capped at 1000!)`);
console.log("FIX: Use LRU cache, TTL-based expiration, or WeakMap\n");


// ============================================================
// LEAK 8 — Console.log in Production
// Story: A developer at a fintech startup left thousands of
//   console.log statements in production code. Chrome DevTools
//   keeps references to logged objects to display them in the
//   Console tab — preventing GC.
// ============================================================

// WHY: console.log keeps references to logged objects so DevTools
// can display them. In production, this means objects that should
// be garbage collected are kept alive by the console.

console.log("=== LEAK 8: Console.log in Production ===");
console.log("When DevTools is open, console.log KEEPS references to logged objects.");
console.log("In Node.js, this is less of a problem (objects are serialized to stdout).");
console.log("In browsers with DevTools open, it IS a leak!\n");

// FIX: Use a proper logging library with levels
const LOG_LEVEL = process.env.NODE_ENV === "production" ? "error" : "debug";

const logger = {
    debug: (...args) => { if (LOG_LEVEL === "debug") console.log("[DEBUG]", ...args); },
    info:  (...args) => { if (["debug", "info"].includes(LOG_LEVEL)) console.log("[INFO]", ...args); },
    error: (...args) => { console.error("[ERROR]", ...args); }  // Always log errors
};

logger.debug("This only shows in development");
logger.info("This shows in development");
logger.error("This always shows");
console.log("FIX: Use logging library with levels, strip console.log in production build\n");


// ============================================================
// EXAMPLE 9 — WeakRef, WeakMap, and FinalizationRegistry
// Story: Razorpay's dashboard caches merchant objects. Using WeakMap,
//   the cache automatically releases merchants that no one references
//   anymore — zero manual cache invalidation needed.
// ============================================================

// WHY: WeakRef and WeakMap hold "weak" references that DON'T prevent
// garbage collection. If the only reference to an object is weak,
// the GC can still collect it.

console.log("=== WeakRef, WeakMap, and FinalizationRegistry ===");

// --- WeakMap: Keys are weakly held ---
// Perfect for caching metadata about objects without preventing their GC
const metadataCache = new WeakMap();

function processMerchant(merchant) {
    // Cache computed metadata weakly
    if (!metadataCache.has(merchant)) {
        metadataCache.set(merchant, {
            processedAt: Date.now(),
            tier: merchant.revenue > 1000000 ? "enterprise" : "standard"
        });
    }
    return metadataCache.get(merchant);
}

let merchant1 = { id: "M001", name: "Chai Point", revenue: 5000000 };
let merchant2 = { id: "M002", name: "Local Shop", revenue: 50000 };

console.log("Merchant 1 metadata:", processMerchant(merchant1));
console.log("Merchant 2 metadata:", processMerchant(merchant2));

merchant1 = null;  // merchant1 object can now be GC'd
// The WeakMap entry for merchant1 will also be automatically removed!
console.log("merchant1 = null → WeakMap entry is auto-removed by GC");
console.log();

// --- WeakRef: Weak reference to a single object ---
console.log("--- WeakRef ---");

let bigObject = { data: "x".repeat(10000), id: "BIG001" };
const weakRef = new WeakRef(bigObject);

console.log("WeakRef deref (before null):", weakRef.deref()?.id);  // "BIG001"
bigObject = null;  // Object is now eligible for GC
// After GC runs, weakRef.deref() will return undefined
console.log("bigObject = null → after GC, weakRef.deref() returns undefined");
console.log();

// --- FinalizationRegistry: Get notified when object is GC'd ---
console.log("--- FinalizationRegistry ---");

const registry = new FinalizationRegistry((heldValue) => {
    console.log(`  [FinalizationRegistry] Object '${heldValue}' was garbage collected!`);
});

let tempObject = { name: "Temporary" };
registry.register(tempObject, "tempObject-label");  // Register with a label
tempObject = null;  // Object is eligible for GC
// When GC collects it, the callback fires with "tempObject-label"
// Note: timing is non-deterministic — callback may fire much later

console.log("FinalizationRegistry: registered. Callback fires after GC collects object.");
console.log("WARNING: Don't rely on FinalizationRegistry for critical cleanup!");
console.log("         GC timing is non-deterministic. Use try/finally for critical resources.\n");


// ============================================================
// EXAMPLE 10 — Detecting Memory Leaks in Node.js
// Story: The Practo engineering team noticed their API server's
//   memory growing 50MB/hour. Here's how they tracked it down
//   using process.memoryUsage() and heap snapshots.
// ============================================================

// WHY: Detecting leaks requires monitoring memory over time.
// A steady upward trend in heapUsed = likely leak.

console.log("=== Detecting Memory Leaks ===\n");

// Method 1: process.memoryUsage() trending
function monitorMemory(label) {
    const mem = process.memoryUsage();
    return {
        label,
        heapUsedMB: (mem.heapUsed / 1024 / 1024).toFixed(2),
        rssMB: (mem.rss / 1024 / 1024).toFixed(2),
    };
}

// Simulate a leaky server
const leakyStore = [];
const snapshots = [];

snapshots.push(monitorMemory("Start"));

for (let cycle = 1; cycle <= 5; cycle++) {
    // Each cycle simulates 1 hour of operation
    for (let i = 0; i < 10000; i++) {
        leakyStore.push({ requestId: `${cycle}_${i}`, response: "data_" + i });
    }
    snapshots.push(monitorMemory(`After cycle ${cycle}`));
}

console.log("Memory Trend (simulated leak):");
console.log("  Phase              │ Heap Used  │ RSS");
console.log("  ───────────────────┼────────────┼──────────");
for (const s of snapshots) {
    console.log(`  ${s.label.padEnd(19)} │ ${s.heapUsedMB.padStart(7)} MB │ ${s.rssMB.padStart(7)} MB`);
}
console.log("  → Heap Used keeps growing = LEAK!\n");

// Clean up
leakyStore.length = 0;

// Method 2: Chrome DevTools for Node.js
console.log("Method 2: Chrome DevTools for Node.js");
console.log("  1. Start Node with: node --inspect server.js");
console.log("  2. Open Chrome → chrome://inspect");
console.log("  3. Click 'Inspect' on your Node process");
console.log("  4. Go to Memory tab → Take Heap Snapshot");
console.log("  5. Do some operations → Take another snapshot");
console.log("  6. Compare snapshots: 'Objects allocated between Snapshot 1 and 2'");
console.log("  7. Look for objects that keep growing in count\n");

// Method 3: Programmatic leak detection
console.log("Method 3: Programmatic leak detection");
console.log("  Monitor heapUsed over time:");
console.log("  - Sample every 30 seconds");
console.log("  - If heapUsed grows >10% over 10 minutes with no drop → alert!");
console.log();


// ============================================================
// EXAMPLE 11 — Practical: Create and Fix Each Leak Pattern
// Story: Let's create each common leak pattern and then fix it,
//   with before/after memory measurements.
// ============================================================

console.log("=== Practical: Leak Patterns — Create and Fix ===\n");

// --- Pattern: Growing event listeners ---
console.log("Pattern: Growing Event Listeners");
const emitter = new EventEmitter();
emitter.setMaxListeners(50);  // Increase limit for demo

const beforeListeners = memUsedMB();
for (let i = 0; i < 20; i++) {
    emitter.on("data", function handler() {
        // Each handler is a new closure — 20 of them!
    });
}
console.log(`  Before: ${beforeListeners} MB | Listeners: 0`);
console.log(`  After:  ${memUsedMB()} MB | Listeners: ${emitter.listenerCount("data")}`);
console.log(`  FIX: emitter.removeAllListeners("data")`);
emitter.removeAllListeners("data");
console.log(`  Fixed:  ${memUsedMB()} MB | Listeners: ${emitter.listenerCount("data")}\n`);

// --- Pattern: Closure retaining large array ---
console.log("Pattern: Closure Retaining Large Array");

function createLeakyProcessor() {
    const hugeData = new Array(100000).fill("leak_data");  // 100K strings
    let counter = 0;

    return function process() {
        counter++;
        // hugeData is captured by this closure even though we never use it!
        return counter;
    };
}

function createCleanProcessor() {
    const hugeData = new Array(100000).fill("leak_data");
    const processedResult = hugeData.length;  // Extract what we need
    let counter = 0;
    // hugeData goes out of scope if no other closure in this scope uses it
    // But to be safe:
    // hugeData = null;  // (use let instead of const if you need this)

    return function process() {
        counter++;
        return { counter, total: processedResult };
    };
}

const leakyFn = createLeakyProcessor();
const cleanFn = createCleanProcessor();
console.log(`  Leaky processor result: ${leakyFn()}`);
console.log(`  Clean processor result: ${JSON.stringify(cleanFn())}`);
console.log("  FIX: Extract needed values, don't capture entire arrays\n");

// --- Pattern: Map used as cache without eviction ---
console.log("Pattern: Map as Unbounded Cache");
const unboundedCache = new Map();
const beforeCache = memUsedMB();

for (let i = 0; i < 50000; i++) {
    unboundedCache.set(`key_${i}`, { data: `value_${i}`, arr: [1, 2, 3] });
}
console.log(`  Before: ${beforeCache} MB | Cache size: 0`);
console.log(`  After:  ${memUsedMB()} MB | Cache size: ${unboundedCache.size}`);

unboundedCache.clear();
console.log(`  Fixed:  ${memUsedMB()} MB | Cache size: ${unboundedCache.size}`);
console.log("  FIX: Use LRU cache with maxSize, or WeakMap for object keys\n");


// ============================================================
// EXAMPLE 12 — Memory Leak Prevention Checklist
// Story: After a week-long memory leak investigation, the team
//   at MakeMyTrip created this checklist for all PR reviews.
// ============================================================

console.log("=== Memory Leak Prevention Checklist ===\n");

console.log("1. TIMERS:");
console.log("   [ ] Every setInterval has a matching clearInterval");
console.log("   [ ] Every setTimeout is cleared if component unmounts");
console.log("   [ ] Intervals are tracked in a variable for cleanup\n");

console.log("2. EVENT LISTENERS:");
console.log("   [ ] Every addEventListener has a matching removeEventListener");
console.log("   [ ] Use AbortController for easy bulk removal");
console.log("   [ ] EventEmitter.listenerCount() is checked in tests\n");

console.log("3. CLOSURES:");
console.log("   [ ] Closures don't capture large objects unnecessarily");
console.log("   [ ] Extract needed values before creating closures");
console.log("   [ ] Null out large variables after extracting data\n");

console.log("4. CACHES:");
console.log("   [ ] Every cache has a maximum size (LRU, TTL, etc.)");
console.log("   [ ] Consider WeakMap for object-keyed caches");
console.log("   [ ] Arrays are bounded (slice, circular buffer)\n");

console.log("5. DOM (Browser):");
console.log("   [ ] DOM references are nulled after element removal");
console.log("   [ ] MutationObserver is disconnected when done");
console.log("   [ ] IntersectionObserver is disconnected when done\n");

console.log("6. GLOBALS:");
console.log("   [ ] 'use strict' or ESLint no-undef rule enabled");
console.log("   [ ] No accidental global variable assignments");
console.log("   [ ] Module-level caches have eviction policies\n");

console.log("7. MONITORING:");
console.log("   [ ] process.memoryUsage() logged periodically in production");
console.log("   [ ] Alerts set for heapUsed exceeding threshold");
console.log("   [ ] Regular heap snapshot analysis in staging\n");


// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. A memory leak is memory that SHOULD be freed but is still
//    referenced by something — GC can't help if it's reachable.
//
// 2. Top leak sources: accidental globals, forgotten timers,
//    closures capturing large scopes, detached DOM nodes,
//    unremoved event listeners, unbounded caches.
//
// 3. Circular references are NOT leaks in modern engines (V8 uses
//    Mark-and-Sweep, not reference counting).
//
// 4. WeakMap/WeakRef hold "weak" references that don't prevent GC.
//    Perfect for caches that should auto-clean.
//
// 5. FinalizationRegistry notifies you when objects are GC'd, but
//    timing is non-deterministic — don't rely on it for critical cleanup.
//
// 6. Detect leaks: watch process.memoryUsage().heapUsed trending
//    upward over time. Use Chrome DevTools heap snapshots to identify
//    what's growing.
//
// 7. Prevention is better than detection: always clear timers,
//    remove listeners, bound caches, use strict mode, and review
//    closure captures during code review.
//
// 8. console.log in browsers with DevTools open can keep objects
//    alive. Use a logging library with levels in production.
// ============================================================

console.log("=== FILE 09 COMPLETE ===");
console.log("Memory leaks are the silent killers of long-running apps.");
console.log("Hunt them early, prevent them always!\n");
