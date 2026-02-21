// ============================================================
// FILE 18: PERFORMANCE PROFILING AND OPTIMIZATION
// Topic: Measuring, profiling, and optimizing JavaScript in V8
// WHY: Hotstar streams IPL finals to 50 million concurrent users.
// A 100ms delay means millions of buffering screens. Profiling
// identified 3 functions consuming 80% of CPU. Optimizing those
// 3 (not the other 200) cut latency by 60%. The lesson: measure
// first, optimize second, measure again.
// ============================================================

// ============================================================
// EXAMPLE 1 — Hotstar's IPL Performance Crisis
// Story: During the 2024 IPL final, Hotstar saw a 5-second spike.
// The profiler revealed a JSON serialization function called
// 50,000 times/sec, each allocating 2MB of temps. Fix: pre-
// serialize static data. Latency dropped from 5s to 200ms.
// ============================================================

// WHY: Profiling is the ONLY reliable way to find bottlenecks.
// Developer intuition is wrong ~80% of the time.

console.log("=".repeat(60));
console.log("RULE #1: MEASURE, DON'T GUESS");
console.log("=".repeat(60));

console.log(`
  1. Measure BEFORE optimizing — can't improve what you can't measure
  2. Optimize the bottleneck (80% time in 20% of code)
  3. Measure AFTER — verify the optimization actually helped
`);

// ============================================================
// EXAMPLE 2 — performance.now(): High-Resolution Timing
// Story: Hotstar's video player measures frame decode time with
// microsecond precision. Date.now() only gives milliseconds.
// ============================================================

// WHY: performance.now() has microsecond precision, is monotonic
// (never goes backward), and is relative to process start.

console.log("\n" + "=".repeat(60));
console.log("HIGH-RESOLUTION TIMING");
console.log("=".repeat(60));

const { performance, PerformanceObserver } = require("perf_hooks");

const dateStart = Date.now();
let sum = 0;
for (let i = 0; i < 100000; i++) sum += i;
console.log("Date.now() precision:", Date.now() - dateStart, "ms (integer)");

const perfStart = performance.now();
sum = 0;
for (let i = 0; i < 100000; i++) sum += i;
console.log("performance.now():", (performance.now() - perfStart).toFixed(4), "ms (sub-ms!)");

console.log("performance.now() is monotonic — never goes backward");
console.log("Date.now() can jump due to NTP clock adjustments");

// ============================================================
// EXAMPLE 3 — console.time() / console.timeEnd()
// Story: Hotstar devs use console.time for quick benchmarks —
// zero setup, zero dependencies.
// ============================================================

console.log("\n" + "=".repeat(60));
console.log("CONSOLE.TIME() — QUICK BENCHMARKING");
console.log("=".repeat(60));

console.time("Array creation");
const bigArray = new Array(1000000).fill(0).map((_, i) => i);
console.timeEnd("Array creation");

// Multiple simultaneous timers
console.time("Sort");
console.time("Total");
bigArray.sort((a, b) => a - b);
console.timeEnd("Sort");

console.time("Search");
bigArray.indexOf(500000);
console.timeEnd("Search");
console.timeEnd("Total");

// console.timeLog — check elapsed without stopping
console.time("Multi-step");
for (let i = 0; i < 500000; i++) { /* step 1 */ }
console.timeLog("Multi-step", "after step 1");
for (let i = 0; i < 500000; i++) { /* step 2 */ }
console.timeEnd("Multi-step");

// ============================================================
// EXAMPLE 4 — Performance Marks and Measures
// Story: Hotstar's video player uses marks to measure time-to-
// first-frame. These integrate with Chrome DevTools timeline.
// ============================================================

// WHY: performance.mark() and measure() create named timestamps
// that appear in DevTools and can be collected by analytics.

console.log("\n" + "=".repeat(60));
console.log("PERFORMANCE MARKS AND MEASURES");
console.log("=".repeat(60));

performance.mark("video-load-start");
const videoData = new Array(100000).fill("frame-data");
performance.mark("decode-start");
videoData.forEach((f, i) => { if (i % 25000 === 0) performance.mark(`frame-${i}`); });
performance.mark("decode-end");
performance.mark("video-load-end");

performance.measure("Total Load", "video-load-start", "video-load-end");
performance.measure("Decode", "decode-start", "decode-end");

//   Timeline:
//   ├─ video-load-start
//   │    ├─ decode-start
//   │    │    ├── frame-0, frame-25000, ...
//   │    │    └─ decode-end
//   │    └─ video-load-end
//   Measures: |── Total Load ──|   |── Decode ──|

performance.getEntriesByType("measure").forEach(m =>
    console.log(`  ${m.name}: ${m.duration.toFixed(4)} ms`)
);
performance.clearMarks();
performance.clearMeasures();

// ============================================================
// EXAMPLE 5 — PerformanceObserver
// Story: Hotstar's monitoring auto-collects metrics via observer
// pattern instead of polling.
// ============================================================

console.log("\n" + "=".repeat(60));
console.log("PERFORMANCE OBSERVER");
console.log("=".repeat(60));

const obs = new PerformanceObserver((list) => {
    list.getEntries().forEach(e =>
        console.log(`  [Observer] ${e.name}: ${e.duration.toFixed(4)} ms`));
});
obs.observe({ entryTypes: ["measure"] });

performance.mark("s1"); let r = 0;
for (let i = 0; i < 1000000; i++) r += Math.sqrt(i);
performance.mark("e1");
performance.measure("sqrt-loop", "s1", "e1");

performance.mark("s2");
Array.from({ length: 50000 }, () => Math.random()).sort();
performance.mark("e2");
performance.measure("random-sort", "s2", "e2");

setTimeout(() => { obs.disconnect(); performance.clearMarks(); performance.clearMeasures(); }, 100);

// ============================================================
// EXAMPLE 6 — Node.js Profiling: --prof
// Story: Hotstar's streaming server consumed 90% CPU. node --prof
// revealed the hot functions.
// ============================================================

console.log("\n" + "=".repeat(60));
console.log("NODE.JS V8 PROFILING (--prof)");
console.log("=".repeat(60));

console.log(`
  $ node --prof script.js          # Generate V8 log
  $ node --prof-process isolate-*.log > profile.txt

  Output shows:
  ┌──────────────────────────────────────┐
  │ ticks  total  name                   │
  │ 1523   45.2%  processFrame           │
  │  892   26.5%  parseJSON              │
  │   30    0.9%  formatOutput           │
  │ Summary: JS 72.6%, C++ 15.5%, GC 11%│
  └──────────────────────────────────────┘
`);

// ============================================================
// EXAMPLE 7 — Chrome DevTools Flame Charts
// Story: Hotstar's front-end team uses flame charts to find
// rendering bottlenecks in the video player.
// ============================================================

console.log("\n" + "=".repeat(60));
console.log("FLAME CHARTS");
console.log("=".repeat(60));

console.log(`
  $ node --inspect script.js   # then chrome://inspect

  Flame Chart:
  ┌──────────────────────────────────────────────┐
  │ main()                                       │
  ├──────────────────┬───────────────────────────┤
  │ processOrders()  │ generateReport()          │
  ├──────┬───────────┤──────────────┬────────────┤
  │ db() │ validate()│ format()     │ compress() │
  └──────┴───────────┴──────────────┴────────────┘
  X-axis: TIME (width = duration — wider = slower)
  Y-axis: CALL STACK DEPTH (deeper = more nesting)

  Look for: wide bars (slow), tall stacks (deep), repeats
`);

// ============================================================
// EXAMPLE 8 — process.memoryUsage() and process.cpuUsage()
// Story: Hotstar's auto-scaler monitors CPU and memory. When
// CPU exceeds 80%, it spins up new instances.
// ============================================================

console.log("\n" + "=".repeat(60));
console.log("PROCESS METRICS");
console.log("=".repeat(60));

const mem = process.memoryUsage();
console.log("Memory:");
console.log(`  rss:       ${(mem.rss / 1024 / 1024).toFixed(2)} MB (total process memory)`);
console.log(`  heapTotal: ${(mem.heapTotal / 1024 / 1024).toFixed(2)} MB (V8 heap allocated)`);
console.log(`  heapUsed:  ${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB (V8 heap in use)`);
console.log(`  external:  ${(mem.external / 1024 / 1024).toFixed(2)} MB (C++ objects)`);

//   ┌─────────────────────────────────────────┐
//   │              RSS (total)                 │
//   │  ┌──────────────────────────┐           │
//   │  │   V8 Heap (heapTotal)    │           │
//   │  │  ┌────────────────┐      │           │
//   │  │  │   heapUsed     │ free │           │
//   │  │  └────────────────┘      │           │
//   │  └──────────────────────────┘           │
//   │  external │ arrayBuffers │ code/stacks  │
//   └─────────────────────────────────────────┘

const cpuBefore = process.cpuUsage();
let cpuResult = 0;
for (let i = 0; i < 5000000; i++) cpuResult += Math.sin(i) * Math.cos(i);
const cpuDelta = process.cpuUsage(cpuBefore);
console.log("\nCPU Usage:");
console.log(`  user:   ${(cpuDelta.user / 1000).toFixed(2)} ms (JS execution)`);
console.log(`  system: ${(cpuDelta.system / 1000).toFixed(2)} ms (OS kernel)`);

// ============================================================
// EXAMPLE 9 — Benchmarking Best Practices
// Story: Hotstar's intern benchmarked concat vs join and got
// misleading results. The benchmark was flawed — no warmup,
// dead code elimination, and monomorphic optimization.
// ============================================================

console.log("\n" + "=".repeat(60));
console.log("BENCHMARKING BEST PRACTICES");
console.log("=".repeat(60));

function benchWithWarmup(fn, label, iters = 10000) {
    for (let i = 0; i < 1000; i++) fn();  // JIT warmup
    const start = performance.now();
    for (let i = 0; i < iters; i++) fn();
    console.log(`  ${label}: ${(performance.now() - start).toFixed(2)} ms`);
}

console.log("Pitfall 1: No warmup → measuring interpreter, not JIT");
console.log("Pitfall 2: Dead code → V8 eliminates unused results");
console.log("Pitfall 3: Monomorphic → benchmarks hit mono-cache, real code doesn't\n");

benchWithWarmup(() => {
    const a = new Array(100); for (let i = 0; i < 100; i++) a[i] = i * 2; return a;
}, "for loop fill");

benchWithWarmup(() => Array.from({ length: 100 }, (_, i) => i * 2), "Array.from");

benchWithWarmup(() => new Array(100).fill(0).map((_, i) => i * 2), "fill + map");

// ============================================================
// EXAMPLE 10 — Memory Profiling: Finding Leaks
// Story: Hotstar's proxy leaked memory — RSS grew from 200MB
// to 2GB in 24 hours. Heap snapshots found an unbounded cache.
// ============================================================

console.log("\n" + "=".repeat(60));
console.log("MEMORY LEAK DETECTION");
console.log("=".repeat(60));

// Leak: unbounded cache
class LeakyCache {
    constructor() { this.cache = {}; }
    set(k, v) { this.cache[k] = v; }  // Never evicts!
}

// Fix: LRU cache with max size
class BoundedCache {
    constructor(max = 1000) { this.max = max; this.cache = new Map(); }
    set(k, v) {
        if (this.cache.has(k)) this.cache.delete(k);
        else if (this.cache.size >= this.max) {
            this.cache.delete(this.cache.keys().next().value);  // Evict oldest
        }
        this.cache.set(k, v);
    }
    get(k) {
        if (!this.cache.has(k)) return undefined;
        const v = this.cache.get(k);
        this.cache.delete(k); this.cache.set(k, v);  // Move to end
        return v;
    }
}

const leaky = new LeakyCache(), bounded = new BoundedCache(5);
for (let i = 0; i < 10; i++) { leaky.set(`k${i}`, i); bounded.set(`k${i}`, i); }
console.log("Leaky cache:", Object.keys(leaky.cache).length);  // 10 (growing)
console.log("Bounded cache:", bounded.cache.size);               // 5 (capped)

console.log(`
  Finding leaks:
  1. Take heap snapshot (baseline)
  2. Run suspected leaky operation 100x
  3. Take second snapshot
  4. Compare: sort by "# Delta" to find growing objects
`);

// ============================================================
// EXAMPLE 11 — Practical: Profile → Identify → Optimize → Verify
// Story: Hotstar's chat consumed 40% CPU. Profiler found regex
// compiled on every message. Cached the regex → CPU dropped to 5%.
// ============================================================

console.log("\n" + "=".repeat(60));
console.log("FULL OPTIMIZATION WORKFLOW");
console.log("=".repeat(60));

// --- SLOW VERSION ---
function processChat_SLOW(messages) {
    const results = [];
    for (const msg of messages) {
        // BUG 1: Regex compiled every iteration
        const urlRegex = new RegExp("https?:\\/\\/[\\w\\-]+(\\.[\\w\\-]+)+[\\w\\-.,@?^=%&:/~+#]*", "gi");
        // BUG 2: New Date every iteration (same value)
        const ts = new Date().toISOString();
        // BUG 3: String concat in loop (O(n^2))
        let processed = "";
        for (const w of msg.split(" ")) processed = processed + w.toLowerCase() + " ";
        results.push({ text: processed.trim(), urls: msg.match(urlRegex) || [], ts });
    }
    return results;
}

// --- FAST VERSION ---
const URL_REGEX = /https?:\/\/[\w\-]+(\.[\w\-]+)+[\w\-.,@?^=%&:/~+#]*/gi;

function processChat_FAST(messages) {
    const results = [], ts = new Date().toISOString();
    for (const msg of messages) {
        URL_REGEX.lastIndex = 0;
        const words = msg.split(" ");
        results.push({
            text: words.map(w => w.toLowerCase()).join(" "),
            urls: msg.match(URL_REGEX) || [], ts
        });
    }
    return results;
}

const testMsgs = Array.from({ length: 10000 }, (_, i) =>
    `Check https://hotstar.com/live for IPL ${i} and https://example.com`);

const m1 = process.memoryUsage().heapUsed;
console.time("SLOW");
processChat_SLOW(testMsgs);
console.timeEnd("SLOW");
console.log(`  Memory: ${((process.memoryUsage().heapUsed - m1) / 1024 / 1024).toFixed(2)} MB`);

const m2 = process.memoryUsage().heapUsed;
console.time("FAST");
processChat_FAST(testMsgs);
console.timeEnd("FAST");
console.log(`  Memory: ${((process.memoryUsage().heapUsed - m2) / 1024 / 1024).toFixed(2)} MB`);

// ============================================================
// EXAMPLE 12 — Microbenchmark Pitfalls
// Story: Hotstar's intern concluded "for is 10x faster than
// forEach." In production: negligible difference.
// ============================================================

console.log("\n" + "=".repeat(60));
console.log("MICROBENCHMARK PITFALLS");
console.log("=".repeat(60));

const data = Array.from({ length: 100000 }, (_, i) => i);

function forLoop() { let t = 0; for (let i = 0; i < data.length; i++) t += data[i]; return t; }
function forEachLoop() { let t = 0; data.forEach(v => { t += v; }); return t; }
function reduceLoop() { return data.reduce((a, v) => a + v, 0); }

for (let i = 0; i < 100; i++) { forLoop(); forEachLoop(); reduceLoop(); }

console.time("for x1000"); for (let i = 0; i < 1000; i++) forLoop(); console.timeEnd("for x1000");
console.time("forEach x1000"); for (let i = 0; i < 1000; i++) forEachLoop(); console.timeEnd("forEach x1000");
console.time("reduce x1000"); for (let i = 0; i < 1000; i++) reduceLoop(); console.timeEnd("reduce x1000");

console.log("Real-world: GC pauses, polymorphism, cache misses differ from benchmarks");

// ============================================================
// EXAMPLE 13 — Optimization Checklist
// Story: Hotstar's performance team maintains a checklist every
// PR goes through.
// ============================================================

console.log("\n" + "=".repeat(60));
console.log("OPTIMIZATION CHECKLIST");
console.log("=".repeat(60));

console.log(`
  HIGH IMPACT:
  [ ] Avoid object creation in hot loops
  [ ] Cache regex compilations
  [ ] Array.join() for large string builds
  [ ] Promise.all() for independent async ops
  [ ] Map over Object for frequent add/delete
  [ ] Pre-allocate arrays when size is known

  MEDIUM IMPACT:
  [ ] Consistent argument types (avoid polymorphism)
  [ ] TypedArrays for numeric data
  [ ] Debounce/throttle event handlers
  [ ] WeakMap/WeakRef for caches
  [ ] Avoid eval() and dynamic function creation

  MEASUREMENT:
  [ ] node --prof for CPU profiling
  [ ] Heap snapshots for memory leaks
  [ ] performance.mark/measure for custom metrics
  [ ] Monitor process.memoryUsage() in production
  [ ] Warmup + multiple iterations for benchmarks
`);

// ============================================================
// EXAMPLE 14 — Real-Time Monitoring
// Story: Hotstar runs continuous monitoring in production,
// collecting metrics every 30 seconds.
// ============================================================

console.log("=".repeat(60));
console.log("PRODUCTION MONITORING");
console.log("=".repeat(60));

class PerfMonitor {
    constructor(intervalMs = 5000) { this.intervalMs = intervalMs; this.samples = []; }
    start() {
        this.timer = setInterval(() => {
            const m = process.memoryUsage();
            const sample = {
                ts: Date.now(),
                rss_mb: (m.rss / 1024 / 1024).toFixed(2),
                heap_pct: ((m.heapUsed / m.heapTotal) * 100).toFixed(1)
            };
            this.samples.push(sample);
            console.log(`  [${new Date().toISOString()}] RSS: ${sample.rss_mb}MB Heap: ${sample.heap_pct}%`);
        }, this.intervalMs);
    }
    stop() { clearInterval(this.timer); return this.samples; }
}

const monitor = new PerfMonitor(500);
monitor.start();
setTimeout(() => { new Array(1000000).fill("x").map(s => s.toUpperCase()); }, 250);
setTimeout(() => {
    const samples = monitor.stop();
    console.log(`  Collected ${samples.length} samples`);
}, 1200);

// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. ALWAYS measure before optimizing. Developer intuition about
//    bottlenecks is wrong ~80% of the time.
//
// 2. performance.now() for microsecond precision. console.time()
//    for quick benchmarks. performance.mark/measure for DevTools.
//
// 3. node --prof for CPU profiles. Chrome DevTools (--inspect)
//    for flame charts and heap snapshots.
//
// 4. Flame charts: width = duration (wider = slower), height =
//    call stack depth.
//
// 5. Memory leaks: compare heap snapshots to find growing objects.
//    Common: unbounded caches, event listeners, closure captures.
//
// 6. Benchmarking pitfalls: JIT warmup, dead code elimination,
//    monomorphic optimization, CPU cache effects.
//
// 7. process.memoryUsage() and process.cpuUsage() are essential
//    for production monitoring.
// ============================================================

console.log("\n" + "=".repeat(60));
console.log("FILE 18 COMPLETE — Performance Profiling");
console.log("=".repeat(60));
