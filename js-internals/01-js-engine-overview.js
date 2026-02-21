// ============================================================
// FILE 01: JAVASCRIPT ENGINE OVERVIEW
// Topic: What a JS engine is and how it transforms your code into execution
// WHY: Every line of JavaScript you write goes through a complex pipeline
//   before it actually runs. Understanding this pipeline lets you write
//   code that the engine can optimize, and debug issues that seem mysterious.
// ============================================================

// ============================================================
// EXAMPLE 1 — Jio's Billions of Page Views
// Story: Reliance Jio serves billions of page views across JioTV, JioCinema,
//   JioMart, and MyJio apps. Every single page view triggers a JavaScript
//   engine — V8 inside Chrome or Node.js — to parse, compile, and execute
//   the JS code. Understanding how that engine works is the first step
//   to building performant applications at Jio's scale.
// ============================================================

// WHY: Before writing optimized JS, you need to know what a JS engine actually is.
// A JS engine is simply SOFTWARE that reads your JavaScript text and executes it.
// It is not hardware. It is a program, usually written in C++.

// --- What is a JavaScript Engine? ---
// A JavaScript engine is a program that:
// 1. Takes JavaScript source code (text) as input
// 2. Parses it into a data structure (AST)
// 3. Compiles or interprets it
// 4. Executes it and produces results

// Think of it like a translator who reads English and speaks Hindi.
// The engine reads JS and speaks "machine language."

console.log("=== EXAMPLE 1: JS Engine Basics ===");
console.log("This console.log was processed by a JS engine (V8 in Node.js).");
console.log("Engine name:", typeof process !== 'undefined' ? "V8 (Node.js)" : "Browser Engine");
console.log("");

// ============================================================
// EXAMPLE 2 — Major JavaScript Engines
// Story: When Flipkart's engineers build for multiple browsers, they must
//   consider that Chrome uses V8, Firefox uses SpiderMonkey, Safari uses
//   JavaScriptCore, and the old Edge used Chakra. Each engine has slightly
//   different performance characteristics, though all implement the same
//   ECMAScript specification.
// ============================================================

// WHY: Different browsers ship different engines. Knowing this helps you
// understand why performance can vary across browsers.

// --- Major JS Engines ---
//
// +------------------+------------------+-------------------------+
// | Engine           | Used In          | Created By              |
// +------------------+------------------+-------------------------+
// | V8               | Chrome, Node.js, | Google                  |
// |                  | Deno, Edge (new) |                         |
// +------------------+------------------+-------------------------+
// | SpiderMonkey     | Firefox          | Mozilla (first ever     |
// |                  |                  | JS engine, 1995)        |
// +------------------+------------------+-------------------------+
// | JavaScriptCore   | Safari, iOS      | Apple (also called      |
// | (JSC / Nitro)    | browsers         | "Nitro")                |
// +------------------+------------------+-------------------------+
// | Chakra           | Old Edge (pre-   | Microsoft (now          |
// |                  | Chromium)        | discontinued)           |
// +------------------+------------------+-------------------------+
// | Hermes           | React Native     | Meta (optimized for     |
// |                  |                  | mobile startup time)    |
// +------------------+------------------+-------------------------+

console.log("=== EXAMPLE 2: Major JS Engines ===");
const engines = [
    { name: "V8",              usedIn: "Chrome, Node.js, Deno, Edge", by: "Google" },
    { name: "SpiderMonkey",    usedIn: "Firefox",                     by: "Mozilla" },
    { name: "JavaScriptCore",  usedIn: "Safari, all iOS browsers",    by: "Apple" },
    { name: "Chakra",          usedIn: "Old Edge (discontinued)",     by: "Microsoft" },
    { name: "Hermes",          usedIn: "React Native",                by: "Meta" },
];
engines.forEach(e => {
    console.log(`  ${e.name} -> ${e.usedIn} (by ${e.by})`);
});
console.log("");

// ============================================================
// EXAMPLE 3 — The High-Level Engine Pipeline
// Story: At Razorpay, when a merchant's checkout page loads, the JS goes
//   through a multi-stage pipeline: parsing, compiling, optimizing. Each
//   stage matters — a slow parse means a slow checkout, and slow checkouts
//   mean lost revenue. Razorpay engineers optimize bundle sizes precisely
//   because they understand this pipeline.
// ============================================================

// WHY: The engine does NOT just "read and run" your code. It goes through
// a sophisticated multi-stage pipeline. Understanding each stage helps you
// write code that flows through this pipeline efficiently.

// --- The JS Engine Pipeline (Simplified) ---
//
//  +-------------+     +---------+     +-------+     +-------------+
//  | Source Code  | --> | Parser  | --> |  AST  | --> | Interpreter |
//  | (your .js)  |     +---------+     +-------+     | (Ignition)  |
//  +-------------+                                    +------+------+
//                                                            |
//                                                            v
//                                                     +-----------+
//                                                     | Bytecode  |
//                                                     +-----+-----+
//                                                           |
//                                              (hot code detected)
//                                                           |
//                                                           v
//                                                  +----------------+
//                                                  | JIT Compiler   |
//                                                  | (TurboFan)     |
//                                                  +-------+--------+
//                                                          |
//                                                          v
//                                                  +----------------+
//                                                  | Machine Code   |
//                                                  | (native CPU)   |
//                                                  +----------------+

console.log("=== EXAMPLE 3: Engine Pipeline ===");
console.log("Source Code -> Parser -> AST -> Interpreter -> Bytecode");
console.log("                                    |");
console.log("                              (hot code?)");
console.log("                                    |");
console.log("                             JIT Compiler -> Machine Code");
console.log("");

// ============================================================
// EXAMPLE 4 — Interpreter vs Compiler vs JIT
// Story: Think of ISRO mission control. An interpreter is like a translator
//   reading commands aloud one by one in real-time — fast to start, slower
//   overall. A compiler is like translating the entire mission manual into
//   Hindi before the mission — slow to start, but then execution is fast.
//   JIT is ISRO's actual approach: start interpreting immediately, then
//   compile the hot paths that are repeated thousands of times.
// ============================================================

// WHY: JavaScript uses a HYBRID approach. It does not purely interpret or
// purely compile. It starts interpreting immediately (fast startup) and then
// compiles hot code paths for speed. This is JIT compilation.

// --- Interpreter ---
// - Reads code line by line and executes immediately
// - Fast startup (no compilation delay)
// - Slower execution (re-reads the same code every time)

// --- Compiler (Ahead-of-Time / AOT) ---
// - Reads ALL code, translates to machine code BEFORE running
// - Slow startup (must compile everything first)
// - Fast execution (native machine code)

// --- JIT (Just-In-Time) Compiler ---
// - Starts interpreting immediately (fast startup)
// - Monitors which code is "hot" (frequently executed)
// - Compiles hot code to machine code ON THE FLY
// - Best of both worlds: fast startup + fast hot paths

console.log("=== EXAMPLE 4: Interpreter vs Compiler vs JIT ===");

// Demonstration: a "hot" function that would trigger JIT compilation
function addNumbers(a, b) {
    return a + b;  // Called thousands of times -> V8 JIT compiles this
}

const startJIT = Date.now();
let jitResult = 0;
for (let i = 0; i < 1_000_000; i++) {
    jitResult = addNumbers(i, i + 1);  // Hot path -> gets JIT compiled
}
const endJIT = Date.now();
console.log(`  1,000,000 calls to addNumbers: ${endJIT - startJIT}ms`);
console.log(`  Last result: ${jitResult}`);
console.log("  V8 likely JIT-compiled addNumbers after ~1000 calls.");
console.log("");

// ============================================================
// EXAMPLE 5 — V8 Engine Internals: Ignition + TurboFan
// Story: Zerodha's Kite web terminal processes real-time stock data using
//   V8. Ignition (the interpreter) handles initial execution, while
//   TurboFan (the optimizing compiler) kicks in for the price calculation
//   functions that run millions of times per trading session.
// ============================================================

// WHY: V8 is the engine behind Chrome and Node.js — the most widely used
// JS runtime. Understanding its two-tier architecture (Ignition + TurboFan)
// helps you write code that V8 can optimize.

// --- V8's Two-Tier Architecture ---
//
//  Source Code
//       |
//       v
//  +----------+     +-----------+
//  |  Parser  | --> |    AST    |
//  +----------+     +-----+-----+
//                         |
//                         v
//               +------------------+
//               | Ignition         |    <- Interpreter
//               | (generates       |    <- Fast startup
//               |  bytecode)       |    <- Collects type feedback
//               +--------+---------+
//                        |
//              (type feedback + hot code)
//                        |
//                        v
//               +------------------+
//               | TurboFan         |    <- Optimizing JIT Compiler
//               | (generates       |    <- Speculative optimizations
//               |  machine code)   |    <- Can DEOPTIMIZE if assumptions fail
//               +--------+---------+
//                        |
//                        v
//               +------------------+
//               | Optimized        |
//               | Machine Code     |
//               +------------------+

console.log("=== EXAMPLE 5: V8 Ignition + TurboFan ===");
console.log("  Ignition: V8's interpreter. Generates bytecode from AST.");
console.log("  TurboFan: V8's optimizing compiler. Turns hot bytecode into machine code.");
console.log("");

// Ignition collects "type feedback" while interpreting.
// For example, it notices: "add() always receives two numbers"
// TurboFan uses this feedback to generate optimized machine code
// that ASSUMES the inputs are always numbers (no type checks needed).

// --- SpiderMonkey (Firefox) has a DIFFERENT pipeline ---
//
//  Source Code -> Parser -> AST
//       |
//       v
//  Baseline Interpreter (fast, unoptimized)
//       |
//       v
//  Baseline JIT (slightly optimized)
//       |
//       v
//  WarpMonkey (heavily optimized, like TurboFan)

console.log("  SpiderMonkey pipeline:");
console.log("  Baseline Interpreter -> Baseline JIT -> WarpMonkey");
console.log("");

// ============================================================
// EXAMPLE 6 — Why JS Needs JIT (Dynamic Types)
// Story: At Ola, a ride fare function might receive a number OR a string
//   (from user input vs database). In C++, you declare types at compile time.
//   In JS, variables can change types at runtime. This dynamic nature means
//   you CANNOT compile ahead-of-time — hence the need for JIT.
// ============================================================

// WHY: JS is dynamically typed. The engine discovers types at RUNTIME,
// not compile time. This is WHY JIT exists — you compile based on what
// you OBSERVE at runtime, not what is declared in source code.

console.log("=== EXAMPLE 6: Why JS Needs JIT ===");

// In C++:  int add(int a, int b) { return a + b; }
// The compiler KNOWS a and b are integers. It generates optimal machine code.

// In JS:
function calculate(a, b) {
    return a + b;
}

// The engine has NO IDEA what a and b are until runtime:
console.log("  calculate(5, 3) =", calculate(5, 3));           // 8 (number + number)
console.log("  calculate('5', '3') =", calculate('5', '3'));     // "53" (string concat!)
console.log("  calculate(5, '3') =", calculate(5, '3'));         // "53" (coercion!)
console.log("  calculate(true, 1) =", calculate(true, 1));       // 2 (boolean coercion!)
console.log("");

// This is why JS can't do AOT compilation like C++ or Rust.
// The JIT compiler watches what types actually flow through the function
// and optimizes for the OBSERVED types.

// If you always call calculate(number, number), V8 compiles an optimized
// version that assumes numbers. If you then call calculate("hello", "world"),
// V8 must DEOPTIMIZE (throw away the optimized code and fall back to interpreter).

// ============================================================
// EXAMPLE 7 — Single-Threaded Execution
// Story: Indian Railways IRCTC runs on a single main thread for its JS
//   frontend. When 10 lakh users try to book Tatkal tickets at 10am,
//   the single-threaded nature of JS means each user's browser can only
//   do ONE thing at a time. Long-running JS blocks the UI — this is why
//   IRCTC seems to "freeze" during peak load.
// ============================================================

// WHY: JavaScript is fundamentally single-threaded. One call stack,
// one piece of code executing at a time. This is THE most important
// architectural fact about JS. Everything else (event loop, async, etc.)
// is built around this constraint.

console.log("=== EXAMPLE 7: Single-Threaded Execution ===");

// One call stack. One line of code at a time.
// This BLOCKS:
function heavyComputation() {
    const start = Date.now();
    let count = 0;
    // Simulating a heavy task (in real life, this blocks the UI)
    while (Date.now() - start < 50) {  // 50ms of blocking
        count++;
    }
    return count;
}

console.log("  Before heavy computation...");
const iterations = heavyComputation();
console.log(`  After heavy computation: ${iterations.toLocaleString()} iterations in ~50ms`);
console.log("  NOTHING else could run during those 50ms.");
console.log("  In a browser, the UI would be frozen/unresponsive.");
console.log("");

// --- The Call Stack (Single Thread) ---
//
//  +-------------------+
//  |                   |    <- Only ONE frame executes at a time
//  |  heavyComputation |
//  |  (currently       |
//  |   running)        |
//  +-------------------+
//  |  main()           |
//  +-------------------+
//     Call Stack

// ============================================================
// EXAMPLE 8 — Where the Engine Lives: Browser vs Node.js
// Story: Zomato's food ordering app uses JS in TWO environments:
//   the browser (Chrome's V8 + Web APIs) for the customer-facing app,
//   and Node.js (V8 + libuv + C++ bindings) for the backend servers.
//   Same engine, but DIFFERENT host environments with different capabilities.
// ============================================================

// WHY: The JS engine is just the core executor. The HOST ENVIRONMENT
// wraps around it and provides extra APIs. Understanding this distinction
// prevents confusion about what is "JavaScript" vs what is "browser API"
// vs what is "Node.js API".

console.log("=== EXAMPLE 8: Engine vs Host Environment ===");

// --- Browser Environment ---
//
//  +--------------------------------------------------+
//  |  Browser (Chrome)                                |
//  |                                                  |
//  |  +------------------+   +---------------------+  |
//  |  | V8 Engine        |   | Web APIs            |  |
//  |  | - Parser         |   | - DOM               |  |
//  |  | - Ignition       |   | - fetch()           |  |
//  |  | - TurboFan       |   | - setTimeout()      |  |
//  |  | - Garbage        |   | - console.log()     |  |
//  |  |   Collector      |   | - localStorage      |  |
//  |  +------------------+   +---------------------+  |
//  |                                                  |
//  |  +---------------------------------------------+ |
//  |  | Event Loop + Callback Queue                 | |
//  |  +---------------------------------------------+ |
//  +--------------------------------------------------+

// --- Node.js Environment ---
//
//  +--------------------------------------------------+
//  |  Node.js                                         |
//  |                                                  |
//  |  +------------------+   +---------------------+  |
//  |  | V8 Engine        |   | Node.js APIs        |  |
//  |  | - Parser         |   | - fs (file system)  |  |
//  |  | - Ignition       |   | - http/https        |  |
//  |  | - TurboFan       |   | - process           |  |
//  |  | - Garbage        |   | - Buffer            |  |
//  |  |   Collector      |   | - console.log()     |  |
//  |  +------------------+   +---------------------+  |
//  |                                                  |
//  |  +---------------------------------------------+ |
//  |  | libuv (Event Loop + Thread Pool)            | |
//  |  +---------------------------------------------+ |
//  +--------------------------------------------------+

console.log("  In Browser: V8 + Web APIs (DOM, fetch, setTimeout)");
console.log("  In Node.js: V8 + Node APIs (fs, http, process) + libuv");
console.log("  Same V8 engine, different surrounding APIs.");
console.log("");

// ============================================================
// EXAMPLE 9 — ECMAScript: The Specification
// Story: When the Bureau of Indian Standards (BIS) defines a standard for
//   electrical outlets, every manufacturer must follow it. Similarly,
//   ECMAScript (ECMA-262) is the SPECIFICATION that defines JavaScript.
//   V8, SpiderMonkey, and JSC are different manufacturers building engines
//   that conform to this specification.
// ============================================================

// WHY: JavaScript is NOT defined by V8 or Chrome. It is defined by the
// ECMAScript specification (ECMA-262). Engines IMPLEMENT this spec.
// New features go through the TC39 committee process (Stage 0 -> Stage 4).

console.log("=== EXAMPLE 9: ECMAScript Specification ===");
console.log("  ECMAScript = the specification (the blueprint)");
console.log("  JavaScript = the implementation (the engine's output)");
console.log("  TC39 = the committee that evolves the spec");
console.log("");
console.log("  Feature proposal stages:");
console.log("  Stage 0: Strawperson (just an idea)");
console.log("  Stage 1: Proposal (problem defined, solution sketched)");
console.log("  Stage 2: Draft (formal spec language written)");
console.log("  Stage 3: Candidate (spec complete, engines start implementing)");
console.log("  Stage 4: Finished (included in the next ECMAScript edition)");
console.log("");

// ============================================================
// EXAMPLE 10 — console.log Is NOT Part of the Engine
// Story: A junior developer at Infosys was surprised to learn that
//   console.log, setTimeout, and fetch are NOT defined in the ECMAScript
//   specification. They are provided by the HOST ENVIRONMENT (browser or
//   Node.js). The JS engine itself only knows about language features:
//   variables, functions, objects, promises, etc.
// ============================================================

// WHY: This is one of the most common misconceptions. Knowing what belongs
// to the engine vs the host environment helps you understand error messages,
// platform differences, and API availability.

console.log("=== EXAMPLE 10: Engine vs Host APIs ===");

// PART OF THE JS ENGINE (ECMAScript spec):
// - Variables: let, const, var
// - Data types: number, string, boolean, object, symbol, bigint, null, undefined
// - Operators: +, -, *, /, ===, typeof, etc.
// - Control flow: if, for, while, switch
// - Functions: function declarations, arrow functions
// - Objects: Object, Array, Map, Set, Promise, Proxy, Reflect
// - Error handling: try/catch/finally, throw
// - Modules: import/export

// NOT PART OF THE ENGINE (provided by host):
// - console.log()        -> Host environment API
// - setTimeout()         -> Host environment API (browser: Web API, Node: libuv)
// - setInterval()        -> Host environment API
// - fetch()              -> Host environment API
// - document / DOM       -> Browser-only API
// - fs.readFile()        -> Node.js-only API
// - process.env          -> Node.js-only API
// - window / globalThis  -> Host-provided global object

const engineFeatures = ["let/const/var", "functions", "Promise", "Map/Set", "Proxy"];
const hostFeatures = ["console.log", "setTimeout", "fetch", "DOM", "fs"];

console.log("  Engine (ECMAScript):", engineFeatures.join(", "));
console.log("  Host (Browser/Node):", hostFeatures.join(", "));
console.log("");

// ============================================================
// EXAMPLE 11 — Practical: V8 Optimization in Action
// Story: At PhonePe, engineers noticed that a payment validation function
//   was running 10x faster after being called thousands of times.
//   They weren't doing anything special — V8's JIT compiler was
//   automatically optimizing the hot function into machine code.
// ============================================================

// WHY: You can observe V8's optimization in action. A function that is
// called many times with consistent types will get JIT-compiled and run
// significantly faster. This is measurable.

console.log("=== EXAMPLE 11: V8 Optimization Benchmark ===");

// Type-stable function (always receives numbers)
function multiply(a, b) {
    return a * b;
}

// Warm up: first few hundred calls are interpreted (slower)
// Then V8 notices the pattern and JIT compiles

// Benchmark: Cold vs Warm
function benchmark(fn, iterations, label) {
    // Warm up
    for (let i = 0; i < 1000; i++) {
        fn(i, i + 1);
    }

    // Measure
    const start = process.hrtime.bigint();
    for (let i = 0; i < iterations; i++) {
        fn(i, i + 1);
    }
    const end = process.hrtime.bigint();
    const ms = Number(end - start) / 1_000_000;
    console.log(`  ${label}: ${ms.toFixed(2)}ms for ${iterations.toLocaleString()} iterations`);
    return ms;
}

benchmark(multiply, 10_000_000, "Type-stable multiply (always numbers)");

// Now with mixed types (causes deoptimization)
function unstableMultiply(a, b) {
    return a * b;
}

// First call with numbers, then with string -> V8 can't optimize well
for (let i = 0; i < 5000; i++) {
    unstableMultiply(i, i + 1);
}
unstableMultiply("hello", 5); // This might cause deoptimization

const start2 = process.hrtime.bigint();
for (let i = 0; i < 10_000_000; i++) {
    unstableMultiply(i, i + 1);
}
const end2 = process.hrtime.bigint();
const ms2 = Number(end2 - start2) / 1_000_000;
console.log(`  Type-unstable multiply (mixed types): ${ms2.toFixed(2)}ms for 10,000,000 iterations`);
console.log("");

// ============================================================
// EXAMPLE 12 — Seeing V8 Flags in Action
// Story: At Dream11, performance engineers use V8 flags to inspect what
//   the engine is doing under the hood. Flags like --trace-opt and
//   --trace-deopt reveal which functions V8 is optimizing and which
//   ones are being deoptimized (falling back to slow path).
// ============================================================

// WHY: V8 provides command-line flags that reveal its internal behavior.
// These flags are invaluable for performance debugging.

console.log("=== EXAMPLE 12: Useful V8 Flags ===");
console.log("  Run these in your terminal to see V8 internals:");
console.log("");
console.log("  # See which functions V8 optimizes:");
console.log("  node --trace-opt script.js");
console.log("");
console.log("  # See which functions V8 DEoptimizes:");
console.log("  node --trace-deopt script.js");
console.log("");
console.log("  # See generated bytecode:");
console.log("  node --print-bytecode --print-bytecode-filter=myFunction script.js");
console.log("");
console.log("  # See optimization decisions:");
console.log("  node --trace-turbo script.js");
console.log("");
console.log("  # Get V8 version:");

// This actually works in Node.js:
if (typeof process !== 'undefined' && process.versions) {
    console.log(`  Current V8 version: ${process.versions.v8}`);
    console.log(`  Node.js version: ${process.version}`);
}
console.log("");

// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. A JS engine is SOFTWARE (usually C++) that executes JavaScript code.
//    Major engines: V8 (Chrome/Node), SpiderMonkey (Firefox), JSC (Safari).
//
// 2. The pipeline: Source Code -> Parser -> AST -> Interpreter (bytecode)
//    -> (hot code) -> JIT Compiler -> Machine Code.
//
// 3. JIT = Just-In-Time compilation. Combines fast startup (interpret first)
//    with fast execution (compile hot code later). This hybrid exists
//    because JS is dynamically typed — can't AOT compile like C++.
//
// 4. V8's architecture: Ignition (interpreter) + TurboFan (optimizing compiler).
//    Ignition generates bytecode and collects type feedback.
//    TurboFan uses that feedback to generate optimized machine code.
//
// 5. JS is SINGLE-THREADED: one call stack, one thing at a time.
//    The event loop (covered later) is how async works despite this.
//
// 6. The engine only knows ECMAScript. console.log, setTimeout, fetch,
//    DOM — these are all HOST ENVIRONMENT APIs, not engine features.
//
// 7. Write type-stable code (always pass same types to a function)
//    so V8 can optimize it effectively. Mixed types cause deoptimization.
//
// 8. Use V8 flags (--trace-opt, --trace-deopt, --print-bytecode) to
//    observe the engine's optimization decisions in real time.
// ============================================================

console.log("=== KEY TAKEAWAYS ===");
console.log("1. JS engine = software that executes JS (V8, SpiderMonkey, JSC)");
console.log("2. Pipeline: Source -> AST -> Bytecode -> (hot) -> Machine Code");
console.log("3. JIT: interpret first (fast start), compile hot code (fast execution)");
console.log("4. V8 = Ignition (interpreter) + TurboFan (optimizing compiler)");
console.log("5. Single-threaded: one call stack, one thing at a time");
console.log("6. console.log is NOT part of the engine — it's a host API");
console.log("7. Type stability helps V8 optimize your functions");
console.log("8. Use V8 flags to see optimization decisions");
