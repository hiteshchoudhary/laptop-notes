// ============================================================
// FILE 11: JIT OPTIMIZATION
// Topic: How V8's Just-In-Time compiler makes JavaScript fast
// WHY: JavaScript starts as text, gets interpreted, and then —
//   for hot functions — gets compiled to optimized machine code
//   at RUNTIME. This JIT compilation is why JavaScript can approach
//   C++ speeds for certain workloads. Understanding it helps you
//   write code that V8 can optimize aggressively.
// ============================================================

// ============================================================
// EXAMPLE 1 — Zerodha: Trading Engine at Near-C++ Speed
// Story: Zerodha's Kite platform processes millions of stock orders
//   daily. Their order matching engine has a hot inner loop that
//   V8's TurboFan compiles down to highly optimized machine code.
//   A function called 10,000 times with consistent types gets
//   specialized integer arithmetic — no type checks, no boxing,
//   pure speed. This is why Kite handles 15 million orders/day
//   on a JavaScript-based stack.
// ============================================================

// WHY: JIT = Just-In-Time compilation. Unlike C++ (compiled before
// running) or Python (always interpreted), JavaScript engines compile
// code AT RUNTIME, using information gathered while the code runs.

//
// V8 COMPILATION PIPELINE:
//
//  JavaScript Source Code
//        │
//        ▼
//  ┌──────────────┐
//  │   PARSER      │  Parses JS → AST (Abstract Syntax Tree)
//  └──────┬────────┘
//         ▼
//  ┌──────────────┐
//  │   IGNITION    │  Interpreter: AST → Bytecode
//  │  (Interpreter)│  Executes bytecode directly
//  │               │  Collects TYPE FEEDBACK (profiling data)
//  └──────┬────────┘
//         │
//         │ function called many times (becomes "hot")
//         │ + type feedback looks stable
//         ▼
//  ┌──────────────┐
//  │   TURBOFAN    │  Optimizing JIT Compiler
//  │  (Compiler)   │  Bytecode + Type Feedback → Optimized Machine Code
//  │               │  Speculative optimization based on profiling
//  └──────┬────────┘
//         │
//         │ if assumptions are violated (type change, etc.)
//         │
//         ▼
//  ┌──────────────┐
//  │  DEOPTIMIZE   │  Throw away optimized code
//  │  (Bail out)   │  Fall back to Ignition (interpreter)
//  └──────────────┘
//

console.log("=== V8 Compilation Pipeline ===");
console.log("Source → Parser → AST → Ignition (bytecode) → TurboFan (machine code)");
console.log("If assumptions break → Deoptimize → back to Ignition\n");


// ============================================================
// EXAMPLE 2 — Groww: Function Heat Levels
// Story: Groww's mutual fund SIP calculator has functions that run
//   once (cold), functions called a few times (warm), and the core
//   NAV calculation loop that runs millions of times (hot). V8
//   treats each differently.
// ============================================================

// WHY: Not every function gets compiled. V8 only invests compilation
// effort in functions that run frequently enough to justify the cost.

console.log("=== Function Heat Levels ===");
console.log();

// COLD: Called rarely — stays as interpreted bytecode
function parseConfig(configStr) {
    // Called once at startup. Not worth compiling.
    return JSON.parse(configStr);
}

// WARM: Called a moderate number of times
function formatCurrency(amount) {
    // Called a few hundred times. May get basic optimization.
    return "Rs. " + amount.toFixed(2);
}

// HOT: Called millions of times — TurboFan optimizes this!
function calculateSIPReturns(monthly, rate, months) {
    // Called in a tight loop for every NAV calculation.
    // TurboFan compiles this to optimized machine code.
    let total = 0;
    const monthlyRate = rate / 12 / 100;
    for (let i = 0; i < months; i++) {
        total = (total + monthly) * (1 + monthlyRate);
    }
    return total;
}

console.log("Cold function (parseConfig): interpreted bytecode, runs once");
console.log("Warm function (formatCurrency): basic optimization");
console.log("Hot function (calculateSIPReturns): TurboFan optimized machine code!");
console.log();

// Demonstrate the hot function
const sipResult = calculateSIPReturns(10000, 12, 240); // 10K/month, 12%, 20 years
console.log(`SIP Result: Rs. ${sipResult.toFixed(2)} (20 years of Rs. 10,000/month at 12%)\n`);


// ============================================================
// EXAMPLE 3 — Paytm: Type Feedback and Speculative Optimization
// Story: Paytm's wallet balance calculation always receives numbers.
//   V8's Ignition interpreter records this: "addBalance always gets
//   (number, number)." TurboFan then generates machine code that
//   ASSUMES numbers — no type checks needed. Pure integer add!
// ============================================================

// WHY: Type feedback is how V8 decides what optimizations to apply.
// Ignition records the types of arguments and return values at each
// call site. TurboFan uses this data to generate specialized code.

console.log("=== Type Feedback and Speculative Optimization ===");

// V8 records: "add() always receives integers"
function add(a, b) {
    return a + b;
}

// Phase 1: Type feedback collection (Ignition)
console.log("Phase 1: Ignition collects type feedback");
for (let i = 0; i < 100; i++) {
    add(i, i + 1);  // Always integers!
}
console.log("  add() called 100 times with integers");
console.log("  Type feedback: (int32, int32) → int32");
console.log();

// Phase 2: TurboFan optimization
console.log("Phase 2: TurboFan generates optimized code");
console.log("  add(a, b) compiled as: INT32_ADD(a, b)");
console.log("  No type checks, no boxing, no overflow guards (for small ints)");
console.log("  Machine instruction: just a CPU ADD instruction!\n");

//
// What TurboFan generates (conceptually):
//
//  UNOPTIMIZED (Ignition bytecode):
//  ┌─────────────────────────────────────┐
//  │ 1. Load a                           │
//  │ 2. Check: is a a number?            │
//  │ 3. Load b                           │
//  │ 4. Check: is b a number?            │
//  │ 5. Check: is it int or float?       │
//  │ 6. Perform add (with overflow check)│
//  │ 7. Box result as HeapNumber         │
//  │ 8. Return                           │
//  └─────────────────────────────────────┘
//
//  OPTIMIZED (TurboFan machine code):
//  ┌─────────────────────────────────────┐
//  │ 1. ADD reg_a, reg_b → reg_result    │  ← One CPU instruction!
//  │ 2. Return reg_result (as Smi)       │
//  └─────────────────────────────────────┘
//
//  10x fewer instructions = 10x faster
//

// But what if we violate the assumption?
console.log("What if we call add() with strings?");
add("hello", " world");  // TYPE CHANGE! V8 must deoptimize
console.log('  add("hello", " world") → DEOPTIMIZATION!');
console.log("  TurboFan's optimized code is thrown away.");
console.log("  Falls back to Ignition bytecode interpreter.");
console.log("  May re-optimize later with broader type assumptions.\n");


// ============================================================
// EXAMPLE 4 — Flipkart: Type Specialization in Detail
// Story: Flipkart's price comparison function is called millions
//   of times. Depending on types, V8 generates completely different
//   machine code — integer add vs float add vs string concatenation.
// ============================================================

// WHY: The `+` operator in JavaScript can mean addition, string
// concatenation, or even object-to-primitive conversion. V8 needs
// type information to know which machine instruction to emit.

console.log("=== Type Specialization ===");

// Same function, DIFFERENT generated code depending on types:
function combine(a, b) {
    return a + b;
}

// If always called with integers:
//   Generated code: INT32_ADD(a, b)  — single CPU instruction
console.log("combine(1, 2):", combine(1, 2));                  // 3
console.log("  → V8 specializes to: INT32_ADD\n");

// If called with floats:
//   Generated code: FLOAT64_ADD(a, b)  — floating point unit
console.log("combine(1.5, 2.7):", combine(1.5, 2.7));          // 4.2
console.log("  → V8 specializes to: FLOAT64_ADD\n");

// If called with strings:
//   Generated code: STRING_CONCAT(a, b)  — allocate new string, copy
console.log('combine("Hi ", "Rahul"):', combine("Hi ", "Rahul")); // "Hi Rahul"
console.log("  → V8 specializes to: STRING_CONCAT\n");

// The problem: if you mix types, V8 can't specialize
console.log("Mixing types in the same function = V8 can't specialize effectively.");
console.log("It generates slower, generic code that handles all possibilities.\n");


// ============================================================
// EXAMPLE 5 — Razorpay: Deoptimization Triggers
// Story: Razorpay's payment amount validation function was running
//   blazing fast until a new API version started sending amounts
//   as strings instead of numbers. Suddenly, V8 deoptimized the
//   function, and P99 latency jumped from 2ms to 15ms.
// ============================================================

// WHY: Deoptimization happens when V8's assumptions about types or
// object shapes are violated. The optimized machine code is thrown
// away, and execution falls back to the interpreter.

console.log("=== Deoptimization Triggers ===\n");

// Trigger 1: Type change
console.log("TRIGGER 1: Type Change");
function validateAmount(amount) {
    return amount > 0 && amount < 1000000;
}

// Train with numbers:
for (let i = 0; i < 10000; i++) validateAmount(i);
console.log("  Trained with numbers → optimized for int32 comparison");

// Then pass a string:
validateAmount("500");  // DEOPT! String comparison is different from number comparison
console.log('  validateAmount("500") → DEOPTIMIZED!\n');

// Trigger 2: Hidden class change
console.log("TRIGGER 2: Hidden Class Change");
function getPrice(product) {
    return product.price;
}

const p1 = { name: "Phone", price: 15000 };
const p2 = { name: "Laptop", price: 50000 };
for (let i = 0; i < 10000; i++) { getPrice(p1); getPrice(p2); }
console.log("  Trained with {name, price} shape → monomorphic IC");

const p3 = { price: 1000, name: "Cable", category: "accessories" };
getPrice(p3);  // Different shape!
console.log("  getPrice({price, name, category}) → Different shape → DEOPT!\n");

// Trigger 3: Out-of-bounds array access
console.log("TRIGGER 3: Out-of-Bounds Array Access");
function sumArray(arr) {
    let total = 0;
    for (let i = 0; i < arr.length; i++) {
        total += arr[i];
    }
    return total;
}

const nums = [1, 2, 3, 4, 5];
for (let i = 0; i < 10000; i++) sumArray(nums);
console.log("  Trained with in-bounds access → optimized");

// Accessing beyond array length:
function sumArrayBuggy(arr) {
    let total = 0;
    for (let i = 0; i <= arr.length; i++) {  // <= instead of <
        total += arr[i];  // arr[5] is undefined → type changes to NaN
    }
    return total;
}
console.log("  arr[arr.length] → undefined → type violation → DEOPT!\n");

// Trigger 4: Using arguments object (in some patterns)
console.log("TRIGGER 4: arguments Object (some patterns)");
console.log("  Leaking 'arguments' to other functions prevents optimization.");
console.log("  FIX: Use rest parameters (...args) instead.\n");

// Trigger 5: eval and with
console.log("TRIGGER 5: eval() and with");
console.log("  eval() can modify any variable in scope → V8 can't optimize.");
console.log("  with() creates dynamic scope → V8 can't optimize.");
console.log("  FIX: Never use eval() or with. Period.\n");


// ============================================================
// EXAMPLE 6 — CRED: Writing JIT-Friendly Code
// Story: CRED's rewards point calculation runs for every transaction.
//   After a performance audit, they rewrote their hot functions to
//   be JIT-friendly, reducing calculation time by 8x.
// ============================================================

// WHY: Certain coding patterns make it easy for TurboFan to
// optimize. Others make it impossible. Here's what to do.

console.log("=== JIT-Friendly Coding Patterns ===\n");

// Rule 1: Monomorphic functions (consistent argument types)
console.log("RULE 1: Keep functions monomorphic");
// BAD:
function processBad(input) {
    return input.value * 2;  // What type is input? Changes every call!
}
processBad({ value: 10 });
processBad({ value: 20, extra: true });  // Different shape!
processBad({ x: 1, value: 30 });        // Yet another shape!

// GOOD:
class RewardInput {
    constructor(value) {
        this.value = value;
        this.multiplier = 1;
    }
}
function processGood(input) {
    return input.value * 2;  // Always same shape!
}
processGood(new RewardInput(10));
processGood(new RewardInput(20));
processGood(new RewardInput(30));
console.log("  BAD:  3 different shapes → polymorphic → slow");
console.log("  GOOD: class ensures same shape → monomorphic → fast\n");

// Rule 2: Avoid type changes in variables
console.log("RULE 2: Don't change variable types");
console.log("  BAD:  let x = 42; x = 'hello'; x = [1,2,3];");
console.log("  GOOD: let num = 42; let str = 'hello'; let arr = [1,2,3];\n");

// Rule 3: Use consistent array element types
console.log("RULE 3: Keep arrays homogeneous");
// BAD:
const mixedArray = [1, "two", 3, null, { four: 4 }];
// V8 stores as PACKED_ELEMENTS (generic) → slow

// GOOD:
const intArray = [1, 2, 3, 4, 5];
// V8 stores as PACKED_SMI_ELEMENTS → fast, optimized integer operations

console.log("  BAD:  [1, 'two', null, {four:4}] → generic elements → slow");
console.log("  GOOD: [1, 2, 3, 4, 5] → packed SMI elements → fast\n");

// Rule 4: Use TypedArrays for numeric computation
console.log("RULE 4: TypedArrays for heavy numeric computation");
const prices = new Float64Array(10000);
for (let i = 0; i < prices.length; i++) {
    prices[i] = Math.random() * 1000;
}
console.log("  Float64Array → contiguous memory, no type checks, SIMD-friendly\n");

// Rule 5: Avoid delete, eval, with, arguments leaking
console.log("RULE 5: Avoid optimization killers");
console.log("  - delete obj.prop     → destroys hidden class");
console.log("  - eval('code')        → can modify any scope variable");
console.log("  - with(obj) {}        → dynamic scope resolution");
console.log("  - leaking arguments   → prevents stack frame optimization");
console.log("  - debugger statement  → prevents optimization of function\n");


// ============================================================
// EXAMPLE 7 — Byju's: Function Inlining
// Story: Byju's learning platform has small helper functions that
//   are called millions of times in content rendering. V8's TurboFan
//   INLINES these functions — the function body is copied directly
//   into the caller, eliminating call overhead entirely.
// ============================================================

// WHY: Function calls have overhead: save registers, set up stack
// frame, jump to function code, return, restore registers. For small
// functions called in hot loops, this overhead matters. Inlining
// eliminates it entirely.

console.log("=== Function Inlining ===\n");

// Small function — candidate for inlining
function square(x) {
    return x * x;
}

// Hot loop calling square()
function sumOfSquares(n) {
    let total = 0;
    for (let i = 0; i < n; i++) {
        total += square(i);  // TurboFan may inline this
    }
    return total;
}

//
// BEFORE INLINING:
// ┌──────────────────────────┐
// │ sumOfSquares(n):         │
// │   for i = 0 to n:       │
// │     CALL square(i)  ──────→ square(x): return x * x
// │     total += result ◄──────
// └──────────────────────────┘
//
// AFTER INLINING:
// ┌──────────────────────────┐
// │ sumOfSquares(n):         │
// │   for i = 0 to n:       │
// │     total += i * i  ← inlined! No function call overhead
// └──────────────────────────┘
//

const result = sumOfSquares(1000);
console.log(`Sum of squares (1-999): ${result}`);
console.log("TurboFan inlines small functions → no call overhead");
console.log("Inlining criteria: function must be small, called frequently,");
console.log("and TurboFan must be able to prove the callee is always the same.\n");

// Functions that WON'T be inlined:
console.log("Functions that typically WON'T be inlined:");
console.log("  - Large functions (too much code to copy)");
console.log("  - Functions called via dynamic dispatch (obj[methodName]())");
console.log("  - Functions with try/catch (improved in recent V8 versions)");
console.log("  - Recursive functions (would inline infinitely)\n");


// ============================================================
// EXAMPLE 8 — PhonePe: Escape Analysis
// Story: PhonePe's UPI transaction creates a temporary Point object
//   for coordinate calculation. Escape analysis determines that the
//   object never "escapes" the function — so V8 allocates it on the
//   STACK instead of the heap, avoiding GC overhead entirely.
// ============================================================

// WHY: Objects allocated on the heap need garbage collection.
// If V8 can prove an object never escapes the function (isn't returned,
// isn't stored in a global), it can allocate on the stack — free instantly.

console.log("=== Escape Analysis ===\n");

// Object that DOESN'T escape — candidate for stack allocation
function calculateDistance(x1, y1, x2, y2) {
    // This object is only used within this function
    const point = { dx: x2 - x1, dy: y2 - y1 };
    return Math.sqrt(point.dx * point.dx + point.dy * point.dy);
}

// After escape analysis + scalar replacement:
// V8 replaces the object with individual variables:
function calculateDistanceOptimized(x1, y1, x2, y2) {
    const dx = x2 - x1;  // No object! Just local variables
    const dy = y2 - y1;   // Stack-allocated, zero GC cost
    return Math.sqrt(dx * dx + dy * dy);
}

console.log("Distance:", calculateDistance(0, 0, 3, 4));  // 5
console.log("Optimized:", calculateDistanceOptimized(0, 0, 3, 4));  // 5

//
// ESCAPE ANALYSIS:
//
// ┌──────────────────────────────────────────────┐
// │ Object doesn't escape function?              │
// │   YES → Allocate on stack (free = automatic) │
// │   YES → Or "scalar replace" (decompose into  │
// │         individual variables)                 │
// │   NO  → Allocate on heap (needs GC)          │
// └──────────────────────────────────────────────┘
//

console.log("\nEscape analysis lets V8 avoid heap allocation for temporary objects.");
console.log("This reduces GC pressure significantly in hot code paths.\n");

// Object that DOES escape — must be heap-allocated
function createPoint(x, y) {
    return { x, y };  // Returned to caller → ESCAPES → must be on heap
}
console.log("Object returned from function → escapes → must be heap-allocated.\n");


// ============================================================
// EXAMPLE 9 — Benchmark: JIT-Friendly vs JIT-Hostile Code
// Story: Let's measure the REAL performance difference between
//   code that V8 can optimize and code that fights optimization.
// ============================================================

console.log("=== Benchmark: JIT-Friendly vs JIT-Hostile ===\n");

// --- JIT-Friendly: Consistent types, same shapes ---
function benchmarkFriendly() {
    function addNumbers(a, b) {
        return a + b;
    }

    const start = process.hrtime.bigint();
    let total = 0;
    for (let i = 0; i < 1_000_000; i++) {
        total += addNumbers(i, i + 1);  // Always integers
    }
    const end = process.hrtime.bigint();
    return { total, ms: Number(end - start) / 1_000_000 };
}

// --- JIT-Hostile: Mixed types, inconsistent shapes ---
function benchmarkHostile() {
    function addAnything(a, b) {
        return a + b;
    }

    const start = process.hrtime.bigint();
    let total = 0;
    for (let i = 0; i < 1_000_000; i++) {
        if (i % 3 === 0) {
            total += addAnything(i, i + 1);                // numbers
        } else if (i % 3 === 1) {
            addAnything("str" + i, "str" + (i + 1));       // strings
        } else {
            addAnything(i, String(i + 1));                 // mixed!
        }
    }
    const end = process.hrtime.bigint();
    return { total, ms: Number(end - start) / 1_000_000 };
}

// Warm up
benchmarkFriendly();
benchmarkHostile();

// Real run
const friendly = benchmarkFriendly();
const hostile = benchmarkHostile();

console.log(`JIT-Friendly (consistent types): ${friendly.ms.toFixed(2)} ms`);
console.log(`JIT-Hostile (mixed types):       ${hostile.ms.toFixed(2)} ms`);
console.log(`Difference: JIT-hostile is ~${(hostile.ms / friendly.ms).toFixed(1)}x slower`);
console.log();


// ============================================================
// EXAMPLE 10 — V8 Internal Flags (Advanced)
// Story: V8 has special flags for debugging JIT behavior.
//   These are invaluable for understanding what V8 does with
//   your code, but they're NOT for production use.
// ============================================================

console.log("=== V8 Internal Flags (Advanced) ===\n");

// %OptimizeFunctionOnNextCall(fn) — force TurboFan compilation
// %GetOptimizationStatus(fn) — check if function is optimized
// Usage: node --allow-natives-syntax script.js

console.log("Run with: node --allow-natives-syntax script.js");
console.log();
console.log("Available V8 intrinsics:");
console.log("  %OptimizeFunctionOnNextCall(fn)  — force JIT compilation");
console.log("  %GetOptimizationStatus(fn)       — check optimization status");
console.log("  %NeverOptimizeFunction(fn)       — prevent JIT compilation");
console.log("  %DeoptimizeFunction(fn)          — force deoptimization");
console.log("  %DebugPrint(obj)                 — print internal representation");
console.log("  %HasFastProperties(obj)          — check if object is in fast mode");
console.log();

// Optimization status codes:
console.log("Optimization Status Codes:");
console.log("  1  = Function is optimized (TurboFan)");
console.log("  2  = Function is not optimized");
console.log("  3  = Function is always optimized (built-in)");
console.log("  4  = Function is never optimized");
console.log("  6  = Function is maybe deoptimized");
console.log();

// Useful V8 flags for profiling:
console.log("Useful V8 profiling flags:");
console.log("  --trace-opt               — log optimizations");
console.log("  --trace-deopt             — log deoptimizations");
console.log("  --trace-ic                — log inline cache transitions");
console.log("  --print-opt-code          — print optimized machine code");
console.log("  --prof                    — generate CPU profile (v8.log)");
console.log("  --prof-process v8.log     — process the profile");
console.log();

// Example: Using --trace-opt and --trace-deopt
console.log("Example: Detecting deoptimizations");
console.log("  $ node --trace-deopt script.js 2>&1 | grep DEOPT");
console.log("  [deoptimizing (DEOPT eager): begin ... reason: wrong map]");
console.log("  This tells you WHICH function was deoptimized and WHY.\n");


// ============================================================
// EXAMPLE 11 — Array Element Kinds (V8 Internals)
// Story: V8 tracks the "element kind" of arrays — SMI (integers),
//   DOUBLE (floats), or ELEMENTS (anything). Once an array
//   transitions to a more general kind, it NEVER goes back.
// ============================================================

console.log("=== Array Element Kinds ===\n");

//
// ARRAY ELEMENT KIND TRANSITIONS (one-way lattice):
//
//  PACKED_SMI_ELEMENTS ──→ PACKED_DOUBLE_ELEMENTS ──→ PACKED_ELEMENTS
//         │                        │                        │
//         ▼                        ▼                        ▼
//  HOLEY_SMI_ELEMENTS ──→ HOLEY_DOUBLE_ELEMENTS ──→ HOLEY_ELEMENTS
//
//  PACKED = dense (no holes)
//  HOLEY  = sparse (has gaps like arr[100] = 1 on a 3-element array)
//  SMI    = small integers only (fastest)
//  DOUBLE = floating point numbers (fast)
//  ELEMENTS = anything (slowest — generic)
//
//  Transitions are ONE-WAY. Once you put a string in a SMI array,
//  it becomes ELEMENTS forever, even if you remove the string!
//

// SMI array — fastest!
const smiArray = [1, 2, 3, 4, 5];
console.log("SMI array [1,2,3,4,5]: PACKED_SMI_ELEMENTS (fastest)");

// Add a float → transitions to DOUBLE
const doubleArray = [1, 2, 3, 4, 5];
doubleArray.push(3.14);
console.log("After push(3.14): PACKED_DOUBLE_ELEMENTS (still fast)");

// Add a string → transitions to ELEMENTS (generic)
const genericArray = [1, 2, 3, 4, 5];
genericArray.push("six");
console.log('After push("six"): PACKED_ELEMENTS (slowest, generic)');

// Create a hole → transitions to HOLEY
const holeyArray = [1, 2, 3];
holeyArray[100] = 4;  // Creates a hole at indices 3-99
console.log("After arr[100]=4: HOLEY_SMI_ELEMENTS (has gaps, needs bounds checks)");

console.log();
console.log("Best practice: Keep arrays homogeneous and dense.");
console.log("  - All integers → PACKED_SMI (fastest)");
console.log("  - All floats → PACKED_DOUBLE (fast)");
console.log("  - Mixed types → PACKED_ELEMENTS (slow)");
console.log("  - Holes → HOLEY_* (adds bounds checking overhead)\n");


// ============================================================
// EXAMPLE 12 — JIT Optimization Summary
// ============================================================

console.log("=== JIT Optimization Cheat Sheet ===\n");

console.log("DO (JIT-friendly):");
console.log("  [x] Use consistent types for function arguments");
console.log("  [x] Create objects with same shape (same constructor/factory)");
console.log("  [x] Keep arrays homogeneous (all same type)");
console.log("  [x] Use TypedArrays for heavy numeric work");
console.log("  [x] Keep functions small (helps inlining)");
console.log("  [x] Use classes for consistent object shapes");
console.log("  [x] Prefer for loops over forEach for hot paths");
console.log();

console.log("DON'T (JIT-hostile):");
console.log("  [ ] Mix types in function arguments");
console.log("  [ ] Use delete on objects");
console.log("  [ ] Use eval() or with");
console.log("  [ ] Create holes in arrays (arr[1000] = x on a small array)");
console.log("  [ ] Mix number types with strings in arrays");
console.log("  [ ] Leak the arguments object");
console.log("  [ ] Change variable types (let x = 1; x = 'hi';)");
console.log();


// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. V8 has a 2-tier compilation pipeline: Ignition (interpreter)
//    for all code, TurboFan (optimizing compiler) for hot functions.
//
// 2. Type feedback: Ignition records types at every call site.
//    TurboFan uses this to generate specialized machine code.
//
// 3. Speculative optimization: V8 assumes types won't change and
//    generates optimized code. If the assumption breaks → DEOPT.
//
// 4. Deoptimization triggers: type changes, hidden class changes,
//    out-of-bounds array access, eval, with, arguments leaking.
//
// 5. Monomorphic functions (consistent types) are fast.
//    Polymorphic = okay. Megamorphic = slow.
//
// 6. Inlining: small hot functions are copied into callers,
//    eliminating function call overhead.
//
// 7. Escape analysis: objects that don't escape a function can be
//    stack-allocated or scalar-replaced — zero GC cost.
//
// 8. Array element kinds: SMI (fastest) → DOUBLE → ELEMENTS (slowest).
//    Transitions are one-way — keep arrays homogeneous!
//
// 9. Use V8 flags (--trace-opt, --trace-deopt) to understand
//    what V8 does with your code. Never use in production.
//
// 10. Write predictable code: consistent types, consistent shapes,
//     no dynamic features (eval, with, delete). V8 rewards consistency.
// ============================================================

console.log("=== FILE 11 COMPLETE ===");
console.log("V8's JIT compiler is your performance partner.");
console.log("Write predictable code, and it will make it blazing fast!\n");
