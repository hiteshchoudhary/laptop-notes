// ============================================================
// FILE 16: SHARED MEMORY AND ATOMICS
// Topic: SharedArrayBuffer, Atomics, and thread-safe shared memory
// WHY: JavaScript was born single-threaded, but modern apps need
// parallelism. SharedArrayBuffer lets worker threads share raw
// memory without copying. Atomics provides thread-safe operations
// to prevent race conditions — essential for systems like PhonePe
// handling millions of concurrent UPI transactions.
// ============================================================

// ============================================================
// EXAMPLE 1 — PhonePe's UPI Transaction Counter
// Story: PhonePe processes 4+ billion UPI transactions per month.
// During peak hours, millions of transactions hit simultaneously.
// If two threads increment the same counter without sync,
// transactions get lost. SharedArrayBuffer + Atomics solve this.
// ============================================================

// WHY: Workers communicate via message passing (structured clone)
// which COPIES data. For high-frequency ops, SharedArrayBuffer
// lets threads share the SAME memory — no copying.

console.log("=".repeat(60));
console.log("SHARED MEMORY — THE PROBLEM");
console.log("=".repeat(60));

//   Main Thread                     Worker Thread
//   ┌────────────────┐             ┌────────────────┐
//   │ data = {x: 42} │  postMessage│                │
//   │ serialize ──────┼──(COPY!)──►│ deserialize    │
//   │ data.x = 43    │             │ data.x = 99    │
//   │ (own copy)      │             │ (own copy)      │
//   └────────────────┘             └────────────────┘
//   Changes in one thread INVISIBLE to the other.

console.log("postMessage copies data (structured clone)");
console.log("SharedArrayBuffer: same memory, zero copy");

// ============================================================
// EXAMPLE 2 — SharedArrayBuffer Basics
// Story: PhonePe's real-time dashboard needs a shared counter
// readable/writable from both main and worker threads.
// ============================================================

// WHY: SharedArrayBuffer allocates raw binary memory accessible
// from multiple threads simultaneously.

console.log("\n" + "=".repeat(60));
console.log("SharedArrayBuffer BASICS");
console.log("=".repeat(60));

const sharedBuffer = new SharedArrayBuffer(16);
console.log("SharedArrayBuffer:", sharedBuffer.byteLength, "bytes");

// Need a TypedArray VIEW to read/write
const int32View = new Int32Array(sharedBuffer);  // 4 elements (4 bytes each)
int32View[0] = 100;  // Transaction count
int32View[1] = 200;  // Success count
int32View[2] = 50;   // Failure count
int32View[3] = 0;    // Lock flag
console.log("Values:", Array.from(int32View));

//   SharedArrayBuffer (16 bytes)
//   ┌──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┐ ...
//   │  b0  │  b1  │  b2  │  b3  │  b4  │  b5  │  b6  │  b7  │
//   └──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┘
//   ├──────────────────┤├──────────────────┤
//     Int32 index 0       Int32 index 1
//     (txn=100)           (success=200)

// Different views of the same bytes
const uint8View = new Uint8Array(sharedBuffer);
console.log("Same bytes via Uint8Array:", Array.from(uint8View.slice(0, 4)));

// ============================================================
// EXAMPLE 3 — The Race Condition Problem
// Story: PhonePe's early prototype had two workers incrementing
// a counter. Expected: 2000. Actual: sometimes 1800.
// ============================================================

// WHY: Two threads read-modify-write without sync → lost updates.

console.log("\n" + "=".repeat(60));
console.log("RACE CONDITION");
console.log("=".repeat(60));

//   Thread A                    Thread B
//   1. READ counter (= 100)
//                               2. READ counter (= 100)
//   3. ADD 1 (= 101)
//                               4. ADD 1 (= 101)
//   5. WRITE (= 101)
//                               6. WRITE (= 101)
//   Expected: 102    Actual: 101    LOST UPDATE!

const raceView = new Int32Array(new SharedArrayBuffer(4));
raceView[0] = 0;

// Non-atomic increment (UNSAFE in multi-threaded)
function unsafeIncrement(arr, idx) {
    const current = arr[idx];  // READ
    arr[idx] = current + 1;   // Another thread could write here!
}

for (let i = 0; i < 1000; i++) unsafeIncrement(raceView, 0);
console.log("Single-thread unsafe (1000x):", raceView[0]);  // 1000 here, but < 1000 with real threads

// ============================================================
// EXAMPLE 4 — Atomics: Thread-Safe Operations
// Story: PhonePe fixed race conditions by replacing regular ops
// with Atomics. Each Atomics op is INDIVISIBLE.
// ============================================================

// WHY: Atomics operations complete without interruption — no
// other thread can see a half-completed state.

console.log("\n" + "=".repeat(60));
console.log("ATOMICS — THREAD-SAFE OPERATIONS");
console.log("=".repeat(60));

const atomicView = new Int32Array(new SharedArrayBuffer(32));

// --- Atomics.store() / Atomics.load() ---
Atomics.store(atomicView, 0, 42);
console.log("load:", Atomics.load(atomicView, 0));  // 42

// --- Atomics.add() / Atomics.sub() ---
Atomics.store(atomicView, 1, 100);
const old = Atomics.add(atomicView, 1, 5);  // Returns OLD value
console.log("add(100, 5) → old:", old, "new:", Atomics.load(atomicView, 1));  // 100, 105
Atomics.sub(atomicView, 1, 10);
console.log("sub(10):", Atomics.load(atomicView, 1));  // 95

// --- Atomics.and() / Atomics.or() / Atomics.xor() ---
Atomics.store(atomicView, 2, 0b1111);
Atomics.and(atomicView, 2, 0b1010);
console.log("and(0b1111, 0b1010):", Atomics.load(atomicView, 2));  // 10

Atomics.store(atomicView, 3, 0b1010);
Atomics.or(atomicView, 3, 0b0101);
console.log("or(0b1010, 0b0101):", Atomics.load(atomicView, 3));   // 15

// --- Atomics.exchange() ---
Atomics.store(atomicView, 4, 999);
const exchanged = Atomics.exchange(atomicView, 4, 777);
console.log("exchange(999→777) old:", exchanged);  // 999

// ============================================================
// EXAMPLE 5 — Compare-And-Swap (CAS)
// Story: PhonePe's lock-free counter uses CAS — the fundamental
// building block of all lock-free data structures.
// ============================================================

// WHY: CAS says "change the value ONLY if it's still what I
// expect." All lock-free algorithms are built on CAS.

console.log("\n" + "=".repeat(60));
console.log("COMPARE-AND-SWAP (CAS)");
console.log("=".repeat(60));

Atomics.store(atomicView, 5, 100);

// CAS: expect 100, replace with 200
const actual1 = Atomics.compareExchange(atomicView, 5, 100, 200);
console.log("CAS(100→200):", { actual: actual1, ok: actual1 === 100, new: Atomics.load(atomicView, 5) });

// CAS: expect 100 (but it's 200 now) → FAILS
const actual2 = Atomics.compareExchange(atomicView, 5, 100, 300);
console.log("CAS(100→300):", { actual: actual2, ok: actual2 === 100, new: Atomics.load(atomicView, 5) });

// CAS loop pattern — retry until success
function atomicMultiply(arr, idx, mult) {
    let oldVal;
    do { oldVal = Atomics.load(arr, idx); }
    while (Atomics.compareExchange(arr, idx, oldVal, oldVal * mult) !== oldVal);
    return Atomics.load(arr, idx);
}

Atomics.store(atomicView, 6, 10);
console.log("Atomic multiply(10*5):", atomicMultiply(atomicView, 6, 5));  // 50

// ============================================================
// EXAMPLE 6 — Atomics.wait() and Atomics.notify()
// Story: PhonePe's worker thread pool: workers SLEEP until work
// arrives, then wake up. Like a condition variable in C/C++.
// ============================================================

// WHY: wait/notify enables thread sync without busy-waiting.
// The thread actually sleeps, freeing CPU.

console.log("\n" + "=".repeat(60));
console.log("Atomics.wait() AND Atomics.notify()");
console.log("=".repeat(60));

//   Worker Thread                    Main Thread
//   Atomics.wait(arr, 0, 0)
//   │ (BLOCKS — sleeps)             arr[0] = 1
//   │                                Atomics.notify(arr, 0, 1)
//   ◄── wakes up! ──────────────────┘

const waitView = new Int32Array(new SharedArrayBuffer(4));
waitView[0] = 0;

// Timeout demo (main thread in Node.js can call wait)
console.log("wait(timeout=100ms):", Atomics.wait(waitView, 0, 0, 100));  // "timed-out"

waitView[0] = 1;
console.log("wait(value mismatch):", Atomics.wait(waitView, 0, 0, 100));  // "not-equal"

console.log("notify(no waiters):", Atomics.notify(waitView, 0, 1));  // 0

// ============================================================
// EXAMPLE 7 — Building a Mutex with Atomics
// Story: PhonePe needs a mutex to protect critical sections.
// CAS-based spinlock: the simplest mutual exclusion.
// ============================================================

// WHY: A mutex ensures only ONE thread enters a critical section.

console.log("\n" + "=".repeat(60));
console.log("BUILDING A MUTEX");
console.log("=".repeat(60));

class AtomicMutex {
    constructor(buf, idx) {
        this.view = new Int32Array(buf);
        this.idx = idx;
    }
    lock() {
        while (Atomics.compareExchange(this.view, this.idx, 0, 1) !== 0) {
            Atomics.wait(this.view, this.idx, 1, 1);
        }
    }
    unlock() {
        Atomics.store(this.view, this.idx, 0);
        Atomics.notify(this.view, this.idx, 1);
    }
    tryLock() {
        return Atomics.compareExchange(this.view, this.idx, 0, 1) === 0;
    }
}

const mutex = new AtomicMutex(new SharedArrayBuffer(4), 0);
mutex.lock();
console.log("Lock acquired → critical section");
mutex.unlock();
console.log("Lock released");
console.log("tryLock:", mutex.tryLock());  // true
console.log("tryLock again:", mutex.tryLock());  // false (already locked)
mutex.unlock();

// ============================================================
// EXAMPLE 8 — Node.js worker_threads + SharedArrayBuffer
// Story: PhonePe's fraud detection runs heavy computation in
// workers. SharedArrayBuffer eliminates serialization overhead.
// ============================================================

console.log("\n" + "=".repeat(60));
console.log("WORKER_THREADS EXAMPLE");
console.log("=".repeat(60));

const { Worker, isMainThread, parentPort, workerData } = require("worker_threads");

if (isMainThread) {
    const counterBuffer = new SharedArrayBuffer(4);
    const counterView = new Int32Array(counterBuffer);

    const workerCode = `
        const { workerData, parentPort } = require("worker_threads");
        const view = new Int32Array(workerData.buf);
        for (let i = 0; i < 1000; i++) Atomics.add(view, 0, 1);
        parentPort.postMessage("done");
    `;

    const worker = new Worker(workerCode, { eval: true, workerData: { buf: counterBuffer } });

    // Main thread also increments 1000 times
    for (let i = 0; i < 1000; i++) Atomics.add(counterView, 0, 1);

    worker.on("message", () => {
        console.log("Counter:", Atomics.load(counterView, 0));
        // Should be 2000 (1000 main + 1000 worker, no lost updates)
    });
    worker.on("error", e => console.log("Worker error:", e.message));

    //   Main Thread              Worker Thread
    //   Atomics.add(+1) ───┐ ┌── Atomics.add(+1)
    //                      ▼ ▼
    //                  [ SAB counter ]
    //   Both increment the SAME memory atomically.
}

// ============================================================
// EXAMPLE 9 — Security: Spectre and SharedArrayBuffer
// Story: In 2018, SharedArrayBuffer was disabled due to the
// Spectre CPU vulnerability. Re-enabled with Cross-Origin
// Isolation headers.
// ============================================================

console.log("\n" + "=".repeat(60));
console.log("SECURITY: SPECTRE");
console.log("=".repeat(60));

//   Spectre Attack: SharedArrayBuffer counter as nanosecond timer
//   Worker: while(true) Atomics.add(arr, 0, 1)
//   Main:   t1 = load(); /* probe */ t2 = load(); elapsed = t2-t1

console.log("Spectre (2018): SharedArrayBuffer enabled precise timing attacks");
console.log("Disabled Jan 2018, re-enabled 2021+ with:");
console.log("  Cross-Origin-Embedder-Policy: require-corp");
console.log("  Cross-Origin-Opener-Policy: same-origin");
console.log("Node.js: always available (no browser sandbox)");

// ============================================================
// EXAMPLE 10 — Practical: Shared Ring Buffer
// Story: PhonePe's logging system: workers write log entries,
// main thread reads. Lock-free ring buffer avoids msg passing.
// ============================================================

console.log("\n" + "=".repeat(60));
console.log("SHARED RING BUFFER");
console.log("=".repeat(60));

class SharedRingBuffer {
    // Layout: [writePos, readPos, slot0, slot1, ... slotN]
    constructor(capacity) {
        this.capacity = capacity;
        this.buffer = new SharedArrayBuffer((2 + capacity) * 4);
        this.view = new Int32Array(this.buffer);
    }
    write(value) {
        const wp = Atomics.load(this.view, 0);
        const rp = Atomics.load(this.view, 1);
        if (wp - rp >= this.capacity) return false;  // Full
        Atomics.store(this.view, 2 + (wp % this.capacity), value);
        Atomics.add(this.view, 0, 1);
        return true;
    }
    read() {
        const wp = Atomics.load(this.view, 0);
        const rp = Atomics.load(this.view, 1);
        if (rp >= wp) return null;  // Empty
        const val = Atomics.load(this.view, 2 + (rp % this.capacity));
        Atomics.add(this.view, 1, 1);
        return val;
    }
}

const ring = new SharedRingBuffer(5);
for (let i = 1; i <= 7; i++) {
    console.log(`  Write ${i * 100}: ${ring.write(i * 100) ? "OK" : "FULL"}`);
}
let v;
while ((v = ring.read()) !== null) console.log(`  Read: ${v}`);

// ============================================================
// EXAMPLE 11 — When to Use and TypedArray Summary
// ============================================================

console.log("\n" + "=".repeat(60));
console.log("WHEN TO USE SharedArrayBuffer");
console.log("=".repeat(60));

console.log(`
  USE: heavy computation, high-frequency updates, large shared data
  DON'T: typical web apps, infrequent comms, small payloads

  TypedArray views for SharedArrayBuffer:
  Int8/Uint8 (1B), Int16/Uint16 (2B), Int32/Uint32 (4B), BigInt64/BigUint64 (8B)

  Atomics works with all integer typed arrays.
  Atomics.wait/notify ONLY: Int32Array, BigInt64Array.
  Atomics does NOT work with Float32/Float64Array.
`);

// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. SharedArrayBuffer: raw shared memory across threads — no
//    copying, no serialization.
//
// 2. Without Atomics, shared access causes race conditions.
//    Always use Atomics for shared data.
//
// 3. Atomics.add/sub/and/or/xor: indivisible read-modify-write.
//    Atomics.compareExchange (CAS): foundation of lock-free code.
//
// 4. Atomics.wait() blocks until notified; Atomics.notify() wakes.
//    Efficient sync without busy-waiting.
//
// 5. SharedArrayBuffer was disabled (Spectre 2018), re-enabled
//    with Cross-Origin Isolation headers.
//
// 6. Use for: heavy computation, high-frequency counters.
//    Use postMessage for everything else.
//
// 7. Only integer TypedArrays work with Atomics. wait/notify
//    only works with Int32Array and BigInt64Array.
// ============================================================

console.log("\n" + "=".repeat(60));
console.log("FILE 16 COMPLETE — Shared Memory and Atomics");
console.log("=".repeat(60));
