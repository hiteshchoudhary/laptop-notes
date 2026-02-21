// ============================================================
// FILE 15: ASYNC INTERNALS IN V8
// Topic: Promises, async/await, and generators — V8's async state machines
// WHY: Every Swiggy order flows through multiple async steps:
// payment, restaurant notification, delivery assignment. V8
// transforms async/await into state machines with implicit
// promises, microtask queues, and suspended contexts. Understanding
// this reveals the true cost of async and how to predict order.
// ============================================================

// ============================================================
// EXAMPLE 1 — Swiggy's Order Pipeline
// Story: When you place a Swiggy order: (1) validate order,
// (2) process payment, (3) notify restaurant, (4) assign delivery.
// Each step is async and V8 manages the flow as a state machine
// with microtask checkpoints.
// ============================================================

// WHY: Promises are not just wrapped callbacks — they have specific
// ordering guarantees via the microtask queue.

// --- Promise States ---
//   ┌─────────┐
//   │ PENDING  │ ← initial
//   └────┬─────┘
//   ┌────┴────────────────┐
//   ▼                     ▼
//  ┌───────────┐   ┌───────────┐
//  │ FULFILLED │   │ REJECTED  │   Once settled, NEVER changes.
//  └───────────┘   └───────────┘

console.log("=".repeat(60));
console.log("PROMISE STATES AND V8 INTERNALS");
console.log("=".repeat(60));

const orderPromise = new Promise((resolve, reject) => {
    // V8 creates JSPromise: { state: "pending", result: undefined,
    //   reactions: [] (linked list of .then handlers) }
    console.log("1. Order placed (PENDING)");
    setTimeout(() => resolve({ orderId: "SWG-12345", total: 450 }), 100);
});

orderPromise
    .then(order => { console.log("3. Validated:", order.orderId); return order; })
    .then(order => { console.log("4. Payment processed for Rs." + order.total); });

console.log("2. Runs BEFORE .then() (synchronous code first)");

// ============================================================
// EXAMPLE 2 — Microtask vs Macrotask Queue
// Story: Swiggy's notification system sends real-time updates.
// .then() callbacks are microtasks — executed BEFORE the next
// macrotask (setTimeout).
// ============================================================

// WHY: Understanding the microtask/macrotask distinction is
// essential for predicting async execution order.

console.log("\n" + "=".repeat(60));
console.log("MICROTASK vs MACROTASK");
console.log("=".repeat(60));

//   EVENT LOOP:
//   1. Execute synchronous code
//   2. Drain ALL microtasks (Promise .then, queueMicrotask)
//   3. Execute ONE macrotask (setTimeout, I/O)
//   4. Drain ALL microtasks again
//   5. Repeat from 3

console.log("A: Synchronous start");
setTimeout(() => console.log("F: setTimeout (macrotask)"), 0);

Promise.resolve()
    .then(() => {
        console.log("C: First microtask");
        Promise.resolve().then(() => console.log("D: Nested microtask"));
    })
    .then(() => console.log("E: Chained microtask"));

queueMicrotask(() => console.log("C2: queueMicrotask"));
console.log("B: Synchronous end");
// Order: A, B, C, C2, D, E, F

// ============================================================
// EXAMPLE 3 — Promise Reaction Chain
// Story: Swiggy's order tracking chains 5+ .then() calls. V8
// stores these as a linked list of PromiseReaction objects.
// ============================================================

// WHY: .then() doesn't execute — it registers a reaction. When
// the promise settles, reactions become microtasks.

console.log("\n" + "=".repeat(60));
console.log("PROMISE REACTION CHAIN");
console.log("=".repeat(60));

//   Promise A (pending)
//   reactions: Reaction1{fn1, promiseB} → Reaction2{fn2, promiseC}
//   When A resolves → enqueue PromiseReactionJob for each

const pA = new Promise(r => setTimeout(() => r("order-data"), 200));
const pB = pA.then(d => { console.log("  Reaction 1:", d); return d + " → validated"; });
const pC = pB.then(d => { console.log("  Reaction 2:", d); return d + " → paid"; });
pC.then(d => console.log("  Reaction 3:", d));

console.log("Each .then() returns a NEW promise:", pA !== pB);

// ============================================================
// EXAMPLE 4 — async/await State Machine
// Story: Swiggy's codebase uses async/await. V8 transforms it
// into a state machine with implicit promises and generator-like
// suspend/resume at each await point.
// ============================================================

// WHY: async/await is syntactic sugar over promises + generators.
// Each await is a state transition that suspends the function.

console.log("\n" + "=".repeat(60));
console.log("ASYNC/AWAIT STATE MACHINE");
console.log("=".repeat(60));

async function processOrder(orderId) {
    console.log("  Step 1: Validating", orderId);
    const v = await validateOrder(orderId);     // State 0 → 1
    console.log("  Step 2: Payment");
    const p = await processPayment(v);          // State 1 → 2
    console.log("  Step 3: Notify restaurant");
    const n = await notifyRestaurant(p);        // State 2 → 3
    return n;
}

function validateOrder(id) { return new Promise(r => setTimeout(() => r({ id, valid: true }), 50)); }
function processPayment(o) { return new Promise(r => setTimeout(() => r({ ...o, paid: true }), 50)); }
function notifyRestaurant(o) { return new Promise(r => setTimeout(() => r({ ...o, notified: true }), 50)); }

// V8 transforms this into:
//   ┌──────────┐  await   ┌──────────┐  await   ┌──────────┐  await   ┌──────────┐
//   │ State 0  │ ────────►│ State 1  │ ────────►│ State 2  │ ────────►│ State 3  │
//   │ validate │ suspend  │ payment  │ suspend  │ notify   │ suspend  │ return   │
//   └──────────┘ resume   └──────────┘ resume   └──────────┘ resume   └──────────┘
//                  ▲                     ▲                     ▲
//              microtask             microtask             microtask

processOrder("SWG-99999").then(r => console.log("  Complete:", JSON.stringify(r)));

// ============================================================
// EXAMPLE 5 — Await Microtask Overhead
// Story: Swiggy's team noticed unnecessary awaits slowed their
// hot path. Even awaiting an already-resolved promise creates a
// microtask checkpoint — the function suspends and resumes.
// ============================================================

// WHY: Even `await 1` suspends the function. V8 wraps the value
// in Promise.resolve() and schedules a microtask to resume.

console.log("\n" + "=".repeat(60));
console.log("AWAIT MICROTASK OVERHEAD");
console.log("=".repeat(60));

async function unnecessaryAwaits() {
    const a = await 1;    // Suspends! Even though 1 is not a promise
    const b = await 2;    // Suspends again!
    return a + b;
}

async function optimized() {
    return 1 + 2;  // One promise, no intermediate suspensions
}

console.log("3 awaits = 3 microtask turns for synchronous values");
console.log("V8 7.2+ optimized await from 3 microtasks to 1 per point");

// ============================================================
// EXAMPLE 6 — Generator Internals
// Story: Swiggy's data pipeline uses generators for lazy processing.
// Generators are the foundation upon which async/await was built.
// ============================================================

// WHY: Generators suspend/resume execution contexts. This is the
// SAME mechanism V8 uses for async/await internally.

console.log("\n" + "=".repeat(60));
console.log("GENERATOR INTERNALS");
console.log("=".repeat(60));

function* orderProcessor(orders) {
    for (const order of orders) {
        // yield SUSPENDS: saves context (stack → heap)
        // .next() RESUMES: restores context (heap → stack)
        const result = yield { ...order, status: "processing" };
        console.log(`  Order ${order.id}: ${result}`);
    }
    return "complete";
}

//   GeneratorObject (on heap when suspended):
//   ┌─────────────────────────────────┐
//   │ [[GeneratorState]]: "suspended" │
//   │ [[GeneratorContext]]:           │
//   │   local vars, loop counter, IP │
//   └─────────────────────────────────┘

const gen = orderProcessor([{ id: "ORD-1" }, { id: "ORD-2" }, { id: "ORD-3" }]);
console.log(gen.next());           // { value: {id:"ORD-1", status:"processing"}, done: false }
console.log(gen.next("approved")); // Order ORD-1: approved
console.log(gen.next("approved")); // Order ORD-2: approved
console.log(gen.next("approved")); // { value: "complete", done: true }

// ============================================================
// EXAMPLE 7 — Generator Context: Stack to Heap
// Story: Swiggy's streaming API emits order events lazily.
// yield moves the execution context from STACK to HEAP.
// ============================================================

// WHY: yield saves the full execution context (locals, IP) to
// the heap. .next() restores it to the stack.

console.log("\n" + "=".repeat(60));
console.log("STACK ↔ HEAP CONTEXT SWITCHING");
console.log("=".repeat(60));

//   BEFORE yield:  context on STACK (fast, temporary)
//   YIELD:         context copied STACK → HEAP, stack frame popped
//   .next():       context copied HEAP → STACK, execution resumes

function* ctxDemo() {
    let localA = 100;
    yield "checkpoint 1";       // localA (100) saved to heap
    localA += 50;
    yield "checkpoint 2";       // localA (150) saved to heap
    return `Final: ${localA}`;
}

const cg = ctxDemo();
console.log(cg.next());  // { value: "checkpoint 1", done: false }
console.log(cg.next());  // { value: "checkpoint 2", done: false }
console.log(cg.next());  // { value: "Final: 150", done: true }

// ============================================================
// EXAMPLE 8 — Async Generators and for await...of
// Story: Swiggy's live order tracking streams status updates.
// Async generators combine lazy (generator) with non-blocking
// (async) for async iterables.
// ============================================================

console.log("\n" + "=".repeat(60));
console.log("ASYNC GENERATORS AND for await...of");
console.log("=".repeat(60));

async function* orderStatusStream(orderId) {
    const statuses = ["Placed", "Accepted", "Preparing", "Out for Delivery", "Delivered"];
    for (const status of statuses) {
        await new Promise(r => setTimeout(r, 30));
        yield { orderId, status };
    }
}

// for await...of: calls [Symbol.asyncIterator]() → .next() returns Promise
async function trackOrder() {
    for await (const update of orderStatusStream("SWG-77777")) {
        console.log(`  [${update.status}]`);
    }
    console.log("  Tracking complete!");
}
trackOrder();

// ============================================================
// EXAMPLE 9 — Error Propagation
// Story: Swiggy's payment processing must handle failures at
// every step. Rejected promises propagate until caught.
// ============================================================

// WHY: Errors "fall through" .then() chains until .catch().
// In async functions, try/catch works naturally.

console.log("\n" + "=".repeat(60));
console.log("ERROR PROPAGATION");
console.log("=".repeat(60));

//   reject("fail").then(fn1).then(fn2).catch(errFn)
//                    SKIP     SKIP     CAUGHT

async function processPaymentWithErrors(orderId) {
    try {
        await new Promise((_, rej) => setTimeout(() => rej(new Error("Insufficient balance")), 50));
    } catch (error) {
        console.log(`  Payment failed: ${error.message}`);
        return { status: "refunded", orderId };
    }
}
processPaymentWithErrors("SWG-FAIL").then(r => console.log("  Result:", r));

// Unhandled rejection detection
process.on("unhandledRejection", (reason) => {
    console.log("  CAUGHT unhandled rejection:", reason.message || reason);
});
console.log("Node.js 15+: unhandled rejections terminate the process!");

// ============================================================
// EXAMPLE 10 — Promise Concurrency Patterns
// Story: Swiggy's homepage loads data from 5 microservices.
// The right concurrency pattern determines 200ms vs 1000ms.
// ============================================================

console.log("\n" + "=".repeat(60));
console.log("PROMISE CONCURRENCY PATTERNS");
console.log("=".repeat(60));

function fetchSvc(name, delay, fail = false) {
    return new Promise((res, rej) => setTimeout(() =>
        fail ? rej(new Error(`${name} failed`)) : res({ service: name }), delay));
}

setTimeout(async () => {
    // Promise.all — ALL must succeed
    const all = await Promise.all([fetchSvc("restaurants", 50), fetchSvc("reviews", 80)]);
    console.log("  all:", all.map(r => r.service).join(", "));

    // Promise.allSettled — waits for ALL, never rejects
    const settled = await Promise.allSettled([fetchSvc("a", 30), fetchSvc("b", 50, true)]);
    settled.forEach(r => console.log(`  settled: ${r.status}`, r.value?.service || r.reason?.message));

    // Promise.race — first to settle wins
    const race = await Promise.race([fetchSvc("slow", 100), fetchSvc("fast", 30)]);
    console.log("  race winner:", race.service);

    // Promise.any — first to FULFILL wins (ignores rejections)
    const any = await Promise.any([fetchSvc("x", 80, true), fetchSvc("y", 50)]);
    console.log("  any winner:", any.service);
}, 500);

// ============================================================
// EXAMPLE 11 — Execution Order Prediction Challenge
// Story: Swiggy's interview asks candidates to predict output
// order. Understanding the event loop makes this deterministic.
// ============================================================

console.log("\n" + "=".repeat(60));
console.log("EXECUTION ORDER CHALLENGE");
console.log("=".repeat(60));

setTimeout(() => {
    async function challenge() {
        console.log("  1");
        setTimeout(() => console.log("  6 (macrotask)"), 0);
        const p = new Promise(r => { console.log("  2 (executor is SYNC)"); r(); });
        p.then(() => console.log("  4 (microtask)"));
        console.log("  3");
        await Promise.resolve();
        console.log("  5 (after await)");
    }
    console.log("\n--- Challenge ---");
    challenge();
}, 1500);

// ============================================================
// EXAMPLE 12 — Async Performance: Sequential vs Parallel
// Story: Swiggy optimized order processing from 3s to 800ms by
// parallelizing independent async operations.
// ============================================================

console.log("\n" + "=".repeat(60));
console.log("ASYNC PERFORMANCE");
console.log("=".repeat(60));

async function fetchData(id) {
    return new Promise(r => setTimeout(() => r({ id }), 100));
}

// BAD: Sequential (300ms)
async function sequential() {
    const start = Date.now();
    await fetchData(1); await fetchData(2); await fetchData(3);
    console.log(`  Sequential: ${Date.now() - start}ms`);
}

// GOOD: Parallel (100ms)
async function parallel() {
    const start = Date.now();
    await Promise.all([fetchData(1), fetchData(2), fetchData(3)]);
    console.log(`  Parallel: ${Date.now() - start}ms`);
}

setTimeout(async () => {
    console.log("\n--- Performance ---");
    await sequential();
    await parallel();
}, 2000);

// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. Promises: pending → fulfilled/rejected (immutable once settled).
//    .then() registers PromiseReaction records → microtasks on settle.
//
// 2. Microtasks drain COMPLETELY before the next macrotask.
//    Microtasks can enqueue more microtasks, all run first.
//
// 3. async/await compiles to a state machine. Each await suspends
//    (context → heap) and creates a microtask checkpoint.
//
// 4. Generators: yield moves stack frame to heap. .next() restores.
//    async/await uses the same mechanism internally.
//
// 5. V8 7.2+ optimized await from 3 microtasks to 1 per point.
//
// 6. Use Promise.all() for independent operations. Sequential
//    awaits for independent tasks is the #1 async mistake.
//
// 7. Always handle rejections: try/catch, .catch(), and
//    process.on('unhandledRejection') globally.
// ============================================================

console.log("\n" + "=".repeat(60));
console.log("FILE 15 COMPLETE — Async Internals");
console.log("=".repeat(60));
