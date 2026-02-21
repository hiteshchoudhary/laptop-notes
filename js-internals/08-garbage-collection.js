// ============================================================
// FILE 08: GARBAGE COLLECTION
// Topic: How V8 automatically reclaims unused memory
// WHY: JavaScript developers rarely think about memory, but V8's
//   garbage collector is constantly running behind the scenes.
//   Understanding HOW it works helps you write code that cooperates
//   with the GC instead of fighting it — avoiding pauses, leaks,
//   and out-of-memory crashes in production.
// ============================================================

// ============================================================
// EXAMPLE 1 — BookMyShow: IPL Ticket Sale Cleanup
// Story: During an IPL final ticket sale, BookMyShow handles 10 million
//   users in 10 minutes. Each user creates cart objects, session data,
//   and search results. After purchase or abandonment, these millions
//   of objects become garbage. V8's garbage collector silently reclaims
//   all that memory so the server doesn't crash.
// ============================================================

// WHY: JavaScript has AUTOMATIC memory management. You don't call
// `free()` or `delete` like in C/C++. The garbage collector (GC)
// figures out which objects are no longer needed and reclaims them.

// --- The Memory Lifecycle ---
//
//   1. ALLOCATE  →  You create an object: let cart = { items: [] }
//   2. USE       →  You read/write it: cart.items.push("ticket")
//   3. RELEASE   →  You stop referencing it: cart = null
//   4. COLLECT   →  GC finds it unreachable and frees the memory
//
// Steps 1-3 are YOUR responsibility. Step 4 is AUTOMATIC.

console.log("=== The Memory Lifecycle ===");

let cart = { userId: "U001", items: ["IPL Final Ticket"], total: 5000 };
console.log("1. Allocated:", cart);

cart.items.push("Parking Pass");
console.log("2. Used:", cart);

cart = null;  // cart is now eligible for garbage collection
console.log("3. Released: cart = null (object is now unreachable)");
console.log("4. GC will collect it automatically when it runs\n");


// ============================================================
// EXAMPLE 2 — Hotstar: Reachability — The Root of Everything
// Story: During a live cricket stream, Hotstar's server maintains
//   connections for millions of viewers. As viewers disconnect,
//   their connection objects become "unreachable" from the root —
//   the GC marks them for collection.
// ============================================================

// WHY: The GC doesn't use reference counting (that has circular
// reference problems). Instead, it uses REACHABILITY from "roots."
// If an object can't be reached from any root, it's garbage.

// --- What are Roots? ---
//
//   ROOT OBJECTS (always reachable):
//   ├── Global object (window / global / globalThis)
//   ├── Currently executing function's local variables (call stack)
//   ├── Closure variables (captured by inner functions)
//   └── Active timers, event listeners, Promises
//
//   From these roots, the GC "walks" all references:
//
//   global
//     ├── viewers (Map)
//     │     ├── "V001" → {socket, buffer, ...}  ← REACHABLE
//     │     └── "V002" → {socket, buffer, ...}  ← REACHABLE
//     │
//     └── (nothing points to disconnected viewer objects)
//                              ↑
//                        UNREACHABLE = GARBAGE

console.log("=== Reachability ===");

// Reachable: referenced by a variable in scope
let viewer1 = { id: "V001", watching: "IND vs AUS" };
let viewer2 = { id: "V002", watching: "IND vs AUS" };

console.log("viewer1 is reachable:", viewer1.id);
console.log("viewer2 is reachable:", viewer2.id);

// Make viewer2 unreachable
viewer2 = null;
console.log("viewer2 = null → object {id: 'V002'} is now unreachable (garbage)\n");


// ============================================================
// EXAMPLE 3 — Paytm: Mark-and-Sweep Algorithm
// Story: Think of Paytm's memory like a warehouse. Mark-and-Sweep
//   is like sending an inspector to tag every box that's still needed
//   (mark phase), then sweeping away all untagged boxes (sweep phase).
// ============================================================

// WHY: Mark-and-Sweep is the foundation of modern GC. V8 builds on
// this with more sophisticated algorithms, but the core idea is the same.

//
// MARK-AND-SWEEP ALGORITHM:
//
// ┌────────────────────────────────────────────────────────┐
// │ HEAP MEMORY                                            │
// │                                                        │
// │  Phase 1: MARK — Start from roots, mark reachable     │
// │                                                        │
// │  [ROOT] ──→ [ObjA ✓] ──→ [ObjB ✓]                    │
// │              │                                         │
// │              └──→ [ObjC ✓]                             │
// │                                                        │
// │  [ObjD ✗]  [ObjE ✗] ──→ [ObjF ✗]                     │
// │  (unreachable — not marked!)                           │
// │                                                        │
// │  Phase 2: SWEEP — Free all unmarked objects            │
// │                                                        │
// │  [ObjA ✓]  [ObjB ✓]  [ObjC ✓]                        │
// │  [       ]  [       ]  [       ]  ← freed memory      │
// └────────────────────────────────────────────────────────┘
//

console.log("=== Mark-and-Sweep ===");
console.log("Phase 1 (Mark): Walk from roots, mark all reachable objects");
console.log("Phase 2 (Sweep): Free all unmarked objects");
console.log("Simple but effective — handles circular references too!\n");

// Circular references are NOT a problem:
let objA = { name: "A" };
let objB = { name: "B" };
objA.ref = objB;  // A → B
objB.ref = objA;  // B → A (circular!)

// If we remove our references:
objA = null;
objB = null;
// Even though A and B reference each other, neither is reachable from any root.
// Mark-and-Sweep correctly identifies them as garbage.
console.log("Circular references: A↔B. After nulling both, GC collects both!");
console.log("(Reference counting would fail here, but Mark-and-Sweep doesn't)\n");


// ============================================================
// EXAMPLE 4 — Flipkart: V8's Generational Garbage Collection
// Story: Flipkart's search creates millions of temporary objects —
//   search results that are displayed and immediately replaced.
//   V8's insight: most objects die young. So it divides the heap
//   into "Young Generation" (nursery) and "Old Generation" (tenured),
//   optimizing GC for each.
// ============================================================

// WHY: Not all objects are equal. Most objects (temporary results,
// intermediate calculations) die within milliseconds. A few (cached
// data, configuration) live for the entire app lifetime. V8 optimizes
// for this pattern with "generational" garbage collection.

//
// V8 HEAP LAYOUT:
//
// ┌───────────────────────────────────────────────────────────┐
// │ V8 HEAP                                                   │
// │                                                           │
// │ ┌─────────────────────┐  ┌──────────────────────────────┐│
// │ │ YOUNG GENERATION    │  │ OLD GENERATION               ││
// │ │ (~1-8 MB)           │  │ (~hundreds of MB to ~1.5 GB) ││
// │ │                     │  │                              ││
// │ │ ┌────────┬────────┐ │  │ Long-lived objects:          ││
// │ │ │ From-  │  To-   │ │  │ - Cached data                ││
// │ │ │ Space  │  Space │ │  │ - Config objects              ││
// │ │ │        │        │ │  │ - Module-level variables      ││
// │ │ │ (new   │(empty, │ │  │ - Objects surviving 2+       ││
// │ │ │ objs   │ used   │ │  │   scavenges (promoted)       ││
// │ │ │ here)  │ for    │ │  │                              ││
// │ │ │        │ copy)  │ │  │ GC: Mark-Compact collector   ││
// │ │ └────────┴────────┘ │  │ (less frequent, more work)   ││
// │ │                     │  │                              ││
// │ │ GC: Scavenger       │  │                              ││
// │ │ (very fast, frequent│  │                              ││
// │ └─────────────────────┘  └──────────────────────────────┘│
// └───────────────────────────────────────────────────────────┘
//

console.log("=== V8 Generational GC ===");
console.log("Young Generation: Small, fast GC (Scavenger)");
console.log("  - New objects are allocated here");
console.log("  - Most objects die here (generational hypothesis)");
console.log("  - GC runs frequently but is very fast (~1ms)");
console.log();
console.log("Old Generation: Large, slower GC (Mark-Compact)");
console.log("  - Objects that survived 2+ young GC cycles");
console.log("  - GC runs less frequently but takes longer");
console.log("  - Uses incremental + concurrent marking to reduce pauses\n");


// ============================================================
// EXAMPLE 5 — Swiggy: Scavenger (Young Generation GC)
// Story: Every Swiggy order search creates temporary objects:
//   restaurant list, filter results, sort comparisons. These are
//   created and discarded in milliseconds. The Scavenger handles
//   this with a clever "semi-space copying" trick.
// ============================================================

// WHY: The Scavenger is V8's young generation GC. It uses two
// equal-sized spaces (from-space and to-space) and copies live
// objects between them. Dead objects are simply left behind.

//
// SCAVENGER — Semi-Space Copying:
//
// Before GC:
// ┌──────────────────────┐  ┌──────────────────────┐
// │ FROM-SPACE           │  │ TO-SPACE (empty)     │
// │ [Obj1✓][Obj2✗][Obj3✓]│  │                      │
// │ [Obj4✗][Obj5✓]       │  │                      │
// └──────────────────────┘  └──────────────────────┘
//   ✓ = reachable, ✗ = garbage
//
// During GC (copy live objects):
// ┌──────────────────────┐  ┌──────────────────────┐
// │ FROM-SPACE           │  │ TO-SPACE             │
// │ [Obj1][Obj2][Obj3]   │  │ [Obj1✓][Obj3✓][Obj5✓]│
// │ [Obj4][Obj5]         │  │                      │
// └──────────────────────┘  └──────────────────────┘
//
// After GC (swap spaces):
// ┌──────────────────────┐  ┌──────────────────────┐
// │ TO-SPACE → new FROM  │  │ FROM-SPACE → new TO  │
// │ [Obj1✓][Obj3✓][Obj5✓]│  │ (empty — freed!)     │
// └──────────────────────┘  └──────────────────────┘
//
// Dead objects (Obj2, Obj4) are never copied — they just vanish!

console.log("=== Scavenger (Young Generation) ===");

// Simulating short-lived objects:
function simulateSearchResults() {
    // These temporary objects are created in Young Generation
    const restaurants = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `Restaurant ${i}`,
        rating: Math.random() * 5,
        distance: Math.random() * 10
    }));

    // Filter and sort — creating more temporary objects
    const filtered = restaurants.filter(r => r.rating > 3.5);
    const sorted = filtered.sort((a, b) => a.distance - b.distance);

    // Only the top 10 "survive" — everything else becomes garbage
    return sorted.slice(0, 10);
}

const topResults = simulateSearchResults();
console.log(`Top ${topResults.length} restaurants found.`);
console.log("~990 temporary objects created and eligible for Scavenger GC!\n");


// ============================================================
// EXAMPLE 6 — Razorpay: Old Generation Mark-Compact
// Story: Razorpay's payment processing server keeps merchant configs,
//   tax rules, and cached exchange rates in memory for hours. These
//   objects survive many young GC cycles and get "promoted" to the
//   Old Generation, where the Mark-Compact collector handles them.
// ============================================================

// WHY: Objects that survive 2+ Scavenger cycles are "promoted" to the
// Old Generation. The Mark-Compact collector runs less frequently but
// handles larger memory. It marks reachable objects, then compacts them
// together to eliminate fragmentation.

//
// MARK-COMPACT (Old Generation):
//
// Before:
// ┌──────────────────────────────────────┐
// │ [Obj1✓] [    ] [Obj3✓] [    ] [Obj5✓]│  ← fragmented
// └──────────────────────────────────────┘
//
// After Mark-Compact:
// ┌──────────────────────────────────────┐
// │ [Obj1✓][Obj3✓][Obj5✓] [           ] │  ← compacted, no gaps
// └──────────────────────────────────────┘

console.log("=== Mark-Compact (Old Generation) ===");
console.log("Step 1: MARK — Walk from roots, mark all reachable");
console.log("Step 2: COMPACT — Slide live objects together, update pointers");
console.log("Result: No fragmentation, contiguous free memory\n");

// Simulating long-lived objects (these would be promoted):
const merchantConfig = {
    merchantId: "razorpay_M001",
    apiKey: "key_xxxx",
    webhookUrl: "https://merchant.com/webhook",
    createdAt: new Date().toISOString()
};

const taxRules = {
    gst: 0.18,
    cess: 0.01,
    tds: 0.10,
    lastUpdated: new Date().toISOString()
};

console.log("merchantConfig and taxRules are long-lived objects.");
console.log("They survive many young GC cycles → promoted to Old Generation.\n");


// ============================================================
// EXAMPLE 7 — Zomato: Incremental and Concurrent Marking
// Story: Zomato's real-time order tracking can't afford GC pauses.
//   V8 uses incremental marking (mark a little, run JS, mark more)
//   and concurrent marking (mark on background thread) to minimize
//   "stop-the-world" pauses.
// ============================================================

// WHY: A full Mark-Sweep on a large heap could take 100ms+ — that's
// a visible jank or API timeout. V8 breaks this work into small pieces
// (incremental) and does some work in parallel (concurrent).

//
// TRADITIONAL GC (stop-the-world):
//
//  JS: ████████████████ ──STOP── ████████████████
//  GC:                  ████████
//                        100ms pause!
//
// INCREMENTAL MARKING:
//
//  JS: ████ ████ ████ ████ ████ ████ ████ ████
//  GC:     █    █    █    █
//          5ms pauses (spread out)
//
// CONCURRENT MARKING:
//
//  JS: ██████████████████████████████████████████
//  GC:   ████████████████  (runs on background thread!)
//        Nearly zero JS pauses!

console.log("=== Incremental & Concurrent Marking ===");
console.log("Incremental: Break marking into small 5ms chunks");
console.log("Concurrent: Run marking on background thread");
console.log("Lazy Sweeping: Sweep pages only when needed for allocation");
console.log("Result: GC pauses reduced from ~100ms to ~1-5ms!\n");


// ============================================================
// EXAMPLE 8 — Practo: Monitoring Memory with process.memoryUsage()
// Story: Practo's telemedicine server handles thousands of video
//   consultations. They monitor memory usage to detect leaks and
//   ensure the server stays healthy under load.
// ============================================================

// WHY: Node.js provides process.memoryUsage() to inspect memory.
// Understanding each field helps you diagnose memory issues.

console.log("=== process.memoryUsage() ===");

function printMemory(label) {
    const mem = process.memoryUsage();
    console.log(`[${label}]`);
    console.log(`  rss:       ${(mem.rss / 1024 / 1024).toFixed(2)} MB  (Resident Set Size — total OS memory)`);
    console.log(`  heapTotal: ${(mem.heapTotal / 1024 / 1024).toFixed(2)} MB  (V8 heap allocated from OS)`);
    console.log(`  heapUsed:  ${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB  (V8 heap actually used)`);
    console.log(`  external:  ${(mem.external / 1024 / 1024).toFixed(2)} MB  (C++ objects bound to JS)`);
    if (mem.arrayBuffers !== undefined) {
        console.log(`  arrayBuffers: ${(mem.arrayBuffers / 1024 / 1024).toFixed(2)} MB  (ArrayBuffer/SharedArrayBuffer)`);
    }
    console.log();
}

printMemory("Baseline");

// Allocate a bunch of objects
const bigArray = [];
for (let i = 0; i < 100000; i++) {
    bigArray.push({ id: i, data: "x".repeat(100) });
}
printMemory("After allocating 100K objects");

// Release them
bigArray.length = 0;  // Clear the array, objects become eligible for GC
printMemory("After clearing array (before GC)");

// Note: GC might not run immediately. In production, you can use:
//   node --expose-gc script.js
//   global.gc();  // Force GC
// But normally, let V8 decide when to GC.


// ============================================================
// EXAMPLE 9 — IRCTC: Node.js Memory Configuration
// Story: IRCTC's ticket booking server handles massive spikes during
//   Tatkal booking (10am sharp). They tune Node.js memory settings
//   to handle the load without OOM crashes.
// ============================================================

// WHY: Node.js has a default heap limit (~1.5GB on 64-bit, ~700MB on
// 32-bit). For memory-intensive applications, you need to know how
// to adjust this.

console.log("=== Node.js Memory Configuration ===");
console.log();

// Default heap size limits:
console.log("Default max old space size:");
console.log("  64-bit systems: ~1.5 GB (newer Node.js: ~4 GB)");
console.log("  32-bit systems: ~700 MB");
console.log();

// How to increase:
console.log("Increase heap size:");
console.log("  node --max-old-space-size=4096 server.js  (4 GB)");
console.log("  node --max-old-space-size=8192 server.js  (8 GB)");
console.log();

// Other useful flags:
console.log("Useful GC flags:");
console.log("  --expose-gc          : Enables global.gc() for manual GC");
console.log("  --trace-gc           : Log GC events to stderr");
console.log("  --trace-gc-verbose   : Detailed GC logging");
console.log("  --max-semi-space-size: Young generation semi-space size (MB)");
console.log("  --gc-interval=N      : Force GC every N allocations (testing)");
console.log();

// Demonstrating what happens at the limit:
console.log("What happens when heap is full?");
console.log("  1. V8 runs increasingly aggressive GC");
console.log("  2. GC pauses get longer (stop-the-world)");
console.log("  3. If still not enough memory: FATAL ERROR");
console.log("     'JavaScript heap out of memory'");
console.log("  4. Process crashes with exit code 134 (SIGABRT)");
console.log();


// ============================================================
// EXAMPLE 10 — Ola: GC Pauses and Performance Impact
// Story: Ola's ride-matching algorithm needs to respond in under
//   50ms. A 100ms GC pause means a rider sees "no cabs available"
//   when there actually are cabs. They learned to minimize GC
//   pressure for latency-sensitive code paths.
// ============================================================

// WHY: GC pauses are the hidden enemy of low-latency applications.
// Understanding when and why GC pauses happen helps you minimize them.

console.log("=== Minimizing GC Pressure ===");
console.log();

// Strategy 1: Reuse objects instead of creating new ones
console.log("Strategy 1: Object pooling (reuse instead of create)");

class DriverMatchPool {
    constructor(size) {
        this.pool = Array.from({ length: size }, () => ({
            driverId: null,
            distance: 0,
            eta: 0,
            score: 0
        }));
        this.index = 0;
    }

    acquire() {
        if (this.index >= this.pool.length) this.index = 0;
        return this.pool[this.index++];
    }
}

const matchPool = new DriverMatchPool(100);
// Instead of: const match = { driverId, distance, eta, score };
// Use:        const match = matchPool.acquire();
//             match.driverId = id; match.distance = d; ...
console.log("  Object pool created with 100 reusable match objects");
console.log("  Zero allocations during hot loop = zero GC pressure!\n");

// Strategy 2: Avoid creating closures in hot loops
console.log("Strategy 2: Avoid closures in hot loops");
console.log("  BAD:  arr.forEach(item => processItem(item))  // new closure each call");
console.log("  GOOD: for (let i = 0; i < arr.length; i++) processItem(arr[i])");
console.log();

// Strategy 3: Use TypedArrays for numeric data
console.log("Strategy 3: Use TypedArrays for numeric data");
const distances = new Float64Array(1000);
for (let i = 0; i < distances.length; i++) {
    distances[i] = Math.random() * 10;  // No boxing, no GC pressure
}
console.log("  Float64Array stores numbers directly — no heap objects per number");
console.log();

// Strategy 4: Pre-size arrays
console.log("Strategy 4: Pre-size arrays to avoid repeated resizing");
console.log("  BAD:  const arr = []; for (...) arr.push(x);  // grows and copies");
console.log("  GOOD: const arr = new Array(knownSize);         // allocated once");
console.log();


// ============================================================
// EXAMPLE 11 — Practical: Memory Growth and GC Tracking
// Story: Let's build a simple memory monitor that shows how V8's
//   GC responds to allocation pressure — just like what you'd see
//   in a production Node.js monitoring dashboard.
// ============================================================

console.log("=== Practical: Memory Growth and GC Tracking ===\n");

function trackMemoryGrowth() {
    const snapshots = [];

    function snapshot(label) {
        const mem = process.memoryUsage();
        snapshots.push({
            label,
            heapUsedMB: (mem.heapUsed / 1024 / 1024).toFixed(2),
            heapTotalMB: (mem.heapTotal / 1024 / 1024).toFixed(2)
        });
    }

    snapshot("Start");

    // Phase 1: Allocate objects (simulating incoming requests)
    const requests = [];
    for (let i = 0; i < 50000; i++) {
        requests.push({
            id: `REQ_${i}`,
            timestamp: Date.now(),
            payload: { data: "x".repeat(50) },
            headers: { auth: "token_xxx", ip: "192.168.1.1" }
        });
    }
    snapshot("After 50K allocations");

    // Phase 2: Process and discard (simulating request completion)
    const results = requests.map(r => r.id);  // Keep only IDs
    requests.length = 0;  // Release request objects
    snapshot("After processing (requests cleared)");

    // Phase 3: Allocate more (next batch)
    const newRequests = [];
    for (let i = 0; i < 50000; i++) {
        newRequests.push({ id: `REQ2_${i}`, ts: Date.now() });
    }
    snapshot("After 50K more allocations");

    // Phase 4: Clear everything
    newRequests.length = 0;
    results.length = 0;
    snapshot("After clearing everything");

    // Print tracking table
    console.log("  Phase                          │ Heap Used  │ Heap Total");
    console.log("  ───────────────────────────────┼────────────┼────────────");
    for (const s of snapshots) {
        const label = s.label.padEnd(31);
        console.log(`  ${label} │ ${s.heapUsedMB.padStart(7)} MB │ ${s.heapTotalMB.padStart(7)} MB`);
    }
    console.log();
    console.log("  Notice: heapTotal may not shrink immediately (V8 keeps memory reserved)");
    console.log("  heapUsed should eventually decrease as GC runs.");
}

trackMemoryGrowth();
console.log();


// ============================================================
// EXAMPLE 12 — The Generational Hypothesis in Action
// Story: This demonstrates the core assumption behind V8's GC:
//   "Most objects die young." We create many short-lived objects
//   and a few long-lived ones to show the pattern.
// ============================================================

console.log("=== The Generational Hypothesis ===\n");

function demonstrateGenerationalHypothesis() {
    let shortLivedCount = 0;
    let longLivedObjects = [];

    // Simulate a server processing requests over "time"
    for (let tick = 0; tick < 100; tick++) {
        // Each tick: many short-lived objects (die immediately)
        for (let i = 0; i < 100; i++) {
            const temp = { tick, i, result: tick * i };  // Born and dies here
            // temp is unused after this loop iteration
            shortLivedCount++;
        }

        // Every 20 ticks: one long-lived object (survives forever)
        if (tick % 20 === 0) {
            longLivedObjects.push({
                snapshot: tick,
                data: `Checkpoint at tick ${tick}`,
                createdAt: Date.now()
            });
        }
    }

    console.log(`  Short-lived objects created: ${shortLivedCount} (all garbage)`);
    console.log(`  Long-lived objects alive:    ${longLivedObjects.length} (promoted to Old Gen)`);
    console.log(`  Ratio: ${(shortLivedCount / longLivedObjects.length).toFixed(0)}:1 short-to-long`);
    console.log("  This is why young generation GC is optimized for throughput!");
}

demonstrateGenerationalHypothesis();
console.log();


// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. V8 uses AUTOMATIC garbage collection based on REACHABILITY.
//    Objects reachable from roots (global, stack, closures) stay alive.
//    Unreachable objects are collected.
//
// 2. Mark-and-Sweep: Mark all reachable objects from roots, then sweep
//    (free) all unmarked objects. Handles circular references correctly.
//
// 3. Generational GC: Young Generation (Scavenger, semi-space copying)
//    for short-lived objects + Old Generation (Mark-Compact) for
//    long-lived objects. Most objects die young!
//
// 4. Scavenger uses "from-space" → "to-space" copying. Live objects
//    are copied, dead objects vanish. Fast but limited to small heap.
//
// 5. Mark-Compact compacts live objects together, eliminating
//    fragmentation in the Old Generation heap.
//
// 6. Incremental + Concurrent marking minimizes "stop-the-world"
//    pauses — critical for latency-sensitive applications.
//
// 7. Use process.memoryUsage() to monitor heap: rss, heapTotal,
//    heapUsed, external. Watch for heapUsed trending upward.
//
// 8. --max-old-space-size controls heap limit. --expose-gc enables
//    manual GC. --trace-gc shows GC events.
//
// 9. Minimize GC pressure: reuse objects (pooling), avoid closures
//    in hot loops, use TypedArrays, pre-size arrays.
//
// 10. V8's GC is highly sophisticated, but it's not magic. Your coding
//     patterns directly influence how efficiently GC can do its job.
// ============================================================

console.log("=== FILE 08 COMPLETE ===");
console.log("V8's garbage collector is your silent partner in memory management.");
console.log("Cooperate with it, don't fight it!\n");
