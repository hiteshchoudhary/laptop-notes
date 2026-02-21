// ============================================================
// FILE 03: THE COMPILATION PIPELINE
// Topic: How V8 transforms parsed code into bytecode and then optimized machine code
// WHY: When your JavaScript runs slowly, the bottleneck is often in HOW
//   the engine compiles and optimizes your code. Understanding V8's
//   compilation pipeline — from Ignition bytecodes through TurboFan
//   optimizations — lets you write code that the engine loves to optimize.
// ============================================================

// ============================================================
// EXAMPLE 1 — Zerodha Kite's Real-Time Trading
// Story: Zerodha Kite processes real-time stock prices for 10+ million
//   active traders. The price calculation functions (profit/loss, margin
//   requirements, portfolio value) execute MILLIONS of times per second.
//   V8's JIT compiler detects these "hot" functions and compiles them into
//   near-native machine code — turning interpreted JavaScript into something
//   almost as fast as C++. This is why Kite feels responsive even during
//   market volatility when lakhs of price updates flood in simultaneously.
// ============================================================

// WHY: The compilation pipeline is where performance magic happens.
// V8 doesn't just interpret your code — it watches, profiles, and
// compiles hot paths into optimized machine code. Understanding this
// pipeline is the key to writing high-performance JavaScript.

console.log("=== EXAMPLE 1: The V8 Compilation Pipeline ===");
console.log("");

// --- The Complete V8 Pipeline ---
//
//  Source Code ("function add(a,b) { return a+b; }")
//        |
//        v
//  +-------------+
//  | Parser      |   Step 1: Parse source into AST
//  +------+------+   (covered in File 02)
//         |
//         v
//  +-------------+
//  |    AST      |   Abstract Syntax Tree
//  +------+------+
//         |
//         v
//  +-------------+
//  | Ignition    |   Step 2: Interpreter generates bytecode
//  | Interpreter |   - Fast to generate
//  +------+------+   - Collects TYPE FEEDBACK while running
//         |
//         v
//  +-------------+
//  | Bytecode    |   Compact, portable, intermediate representation
//  +------+------+   Runs in the Ignition VM (register-based)
//         |
//         | (runtime type feedback collected)
//         |
//         v
//  +-------------------+
//  | Is this code HOT? |   Step 3: Profiling
//  | (called many      |   Ignition counts function invocations
//  |  times?)          |   and loop iterations
//  +---+----------+----+
//      |          |
//     NO         YES
//      |          |
//      v          v
//  Stay in    +------------------+
//  Ignition   | TurboFan         |   Step 4: Optimizing Compiler
//  (bytecode) | (JIT Compiler)   |   - Speculative optimizations
//             +--------+---------+   - Based on type feedback
//                      |
//                      v
//             +------------------+
//             | Optimized        |   Native machine code
//             | Machine Code     |   (x86, ARM, etc.)
//             +--------+---------+
//                      |
//                      | (assumption violated?)
//                      |
//                      v
//             +------------------+
//             | DEOPTIMIZE       |   Bail out!
//             | (back to         |   Fall back to Ignition bytecode
//             |  Ignition)       |
//             +------------------+

console.log("  Parser -> AST -> Ignition (bytecode) -> TurboFan (machine code)");
console.log("                                ^                    |");
console.log("                                |--- DEOPTIMIZE <---+");
console.log("");

// ============================================================
// EXAMPLE 2 — Ignition: The Bytecode Interpreter
// Story: At Ola, when the ride booking app loads, Ignition immediately
//   starts interpreting the JavaScript. It generates compact bytecodes —
//   like assembly language for a virtual machine. This bytecode is much
//   more efficient than re-parsing the AST every time, and it's portable
//   across different CPU architectures.
// ============================================================

// WHY: Ignition bytecodes are the fundamental building blocks of JS execution
// in V8. Understanding them helps you see what the engine actually executes.

console.log("=== EXAMPLE 2: Ignition Bytecodes ===");

// For this simple function:
function add(a, b) {
    return a + b;
}

// V8's Ignition generates bytecodes roughly like:
//
//  Bytecode:
//    Ldar a1         ; Load argument 'a' into accumulator
//    Add a2, [0]     ; Add argument 'b', store feedback at slot 0
//    Return          ; Return value in accumulator

// More detailed example:
// function calculateTotal(price, qty, tax) {
//     const subtotal = price * qty;
//     const total = subtotal + (subtotal * tax);
//     return total;
// }
//
// Ignition bytecodes (simplified):
//   LdaSmi [0]            ; Load Small Integer 0 (not shown in optimized)
//   Ldar a0               ; Load 'price' into accumulator
//   Mul a1, [0]           ; Multiply by 'qty', type feedback slot 0
//   Star r0               ; Store result in register r0 (subtotal)
//   Ldar r0               ; Load subtotal into accumulator
//   Mul a2, [1]           ; Multiply by 'tax', type feedback slot 1
//   Add r0, [2]           ; Add subtotal, type feedback slot 2
//   Star r1               ; Store result in register r1 (total)
//   Ldar r1               ; Load total into accumulator
//   Return                ; Return the accumulator value

console.log("  Bytecode for add(a, b):");
console.log("    Ldar a1       ; Load argument 'a' into accumulator");
console.log("    Add a2, [0]   ; Add argument 'b' to accumulator");
console.log("    Return        ; Return accumulator value");
console.log("");

// --- Common V8 Bytecodes ---
//
// +------------------+------------------------------------------+
// | Bytecode         | What It Does                             |
// +------------------+------------------------------------------+
// | LdaSmi [n]       | Load Small Integer n into accumulator    |
// | LdaConstant [n]  | Load constant from constant pool         |
// | Ldar rN          | Load register N into accumulator         |
// | Star rN          | Store accumulator into register N         |
// | Add rN, [slot]   | Add register to accumulator              |
// | Sub rN, [slot]   | Subtract register from accumulator       |
// | Mul rN, [slot]   | Multiply register with accumulator       |
// | Div rN, [slot]   | Divide accumulator by register           |
// | TestEqual rN     | Test equality, result in accumulator     |
// | Jump [offset]    | Unconditional jump                       |
// | JumpIfTrue [off] | Jump if accumulator is true              |
// | CallProperty rN  | Call method on object                    |
// | Return           | Return value in accumulator              |
// +------------------+------------------------------------------+

console.log("  How to see bytecodes yourself:");
console.log("  node --print-bytecode --print-bytecode-filter=add script.js");
console.log("");

// ============================================================
// EXAMPLE 3 — Viewing Bytecode in Practice
// Story: A performance engineer at CRED wanted to understand why one
//   function was slower than another. By running Node.js with the
//   --print-bytecode flag, they could see the actual bytecodes V8
//   generated and identify unnecessary operations.
// ============================================================

// WHY: You can actually SEE the bytecodes V8 generates. This is
// an invaluable debugging and learning tool.

console.log("=== EXAMPLE 3: How to View Bytecodes ===");
console.log("");
console.log("  Step 1: Create a file (bytecode-demo.js):");
console.log('    function greet(name) { return "Hello " + name; }');
console.log('    greet("Mumbai");');
console.log("");
console.log("  Step 2: Run with bytecode flag:");
console.log("    node --print-bytecode --print-bytecode-filter=greet bytecode-demo.js");
console.log("");
console.log("  Step 3: You'll see output like:");
console.log("    [generated bytecode for function: greet]");
console.log("    Parameter count 2");
console.log("    Register count 1");
console.log("    Frame size 8");
console.log("       0 : LdaConstant [0]     ; Load 'Hello '");
console.log("       2 : Star r0             ; Store in register 0");
console.log("       4 : Ldar a0             ; Load argument 'name'");
console.log("       6 : Add r0, [0]         ; Concatenate strings");
console.log("       9 : Return              ; Return result");
console.log("");

// ============================================================
// EXAMPLE 4 — Type Feedback and Profiling
// Story: At Paytm, the wallet balance calculation function is called
//   for every transaction. Ignition notices that the function ALWAYS
//   receives numbers. It records this "type feedback" in special
//   data structures called Feedback Vectors. TurboFan later uses this
//   feedback to generate optimized code that skips type checks.
// ============================================================

// WHY: Type feedback is the BRIDGE between interpretation and compilation.
// Without type feedback, TurboFan couldn't make assumptions about types.
// Understanding type feedback helps you write code that optimizes well.

console.log("=== EXAMPLE 4: Type Feedback ===");

// Ignition collects type feedback at specific "feedback slots"
// Each operation (Add, Mul, etc.) has a feedback slot [n]

// For this function:
function calculateDiscount(price, discount) {
    return price - (price * discount);
}

// When called as: calculateDiscount(1000, 0.1)
// Ignition records at the Mul slot: "Both operands were Smi/HeapNumber"
// Ignition records at the Sub slot: "Both operands were Smi/HeapNumber"

// After many calls with numbers, the feedback is:
//   Mul slot: MONOMORPHIC (always numbers)
//   Sub slot: MONOMORPHIC (always numbers)

// This tells TurboFan: "Compile assuming numbers. Don't add type checks."

// --- Feedback States ---
//
// UNINITIALIZED  ->  No calls yet, no feedback
//      |
//      v
// MONOMORPHIC    ->  Always seen ONE type (best for optimization!)
//      |
//      v
// POLYMORPHIC    ->  Seen 2-4 different types (can still optimize, less ideal)
//      |
//      v
// MEGAMORPHIC    ->  Seen many types (V8 gives up on specialization)

console.log("  Type feedback states:");
console.log("  UNINITIALIZED -> MONOMORPHIC -> POLYMORPHIC -> MEGAMORPHIC");
console.log("");

// Demonstrate monomorphic (fast) vs megamorphic (slow)
function processValue(x) {
    return x.toString();
}

// Monomorphic: always same type
const monoStart = process.hrtime.bigint();
for (let i = 0; i < 1_000_000; i++) {
    processValue(42);  // Always number -> MONOMORPHIC
}
const monoEnd = process.hrtime.bigint();

// Megamorphic: many different types
const megaStart = process.hrtime.bigint();
const types = [42, "hello", true, 0, 99, { x: 1 }, [1, 2], 3.14, 77, "world"];
for (let i = 0; i < 1_000_000; i++) {
    processValue(types[i % types.length]); // Many types -> MEGAMORPHIC
}
const megaEnd = process.hrtime.bigint();

console.log(`  Monomorphic (always number): ${Number(monoEnd - monoStart) / 1_000_000}ms`);
console.log(`  Megamorphic (mixed types):   ${Number(megaEnd - megaStart) / 1_000_000}ms`);
console.log("");

// ============================================================
// EXAMPLE 5 — TurboFan: The Optimizing Compiler
// Story: Dream11's fantasy cricket scoring function runs for every ball
//   bowled during an IPL match — with 10 crore users' scores updating
//   simultaneously. TurboFan compiles this scoring function into optimized
//   machine code that runs at near-native speed, making real-time scoring
//   feasible at India-scale.
// ============================================================

// WHY: TurboFan is where the magic happens. It takes bytecodes and
// type feedback, and generates machine code that runs 10-100x faster
// than interpreted bytecodes. Understanding its optimizations helps you
// write code that TurboFan loves.

console.log("=== EXAMPLE 5: TurboFan Optimizing Compiler ===");

// --- TurboFan's Optimization Phases ---
//
//  Bytecode + Type Feedback
//        |
//        v
//  +---------------------+
//  | Build TurboFan      |  Sea-of-nodes graph (intermediate representation)
//  | Graph               |
//  +----------+----------+
//             |
//             v
//  +---------------------+
//  | Inlining            |  Inline small called functions (no call overhead)
//  +----------+----------+
//             |
//             v
//  +---------------------+
//  | Type Specialization |  Use type feedback to remove type checks
//  +----------+----------+  "a is always Number" -> skip typeof check
//             |
//             v
//  +---------------------+
//  | Constant Folding    |  2 + 3 -> 5 (compute at compile time)
//  +----------+----------+
//             |
//             v
//  +---------------------+
//  | Dead Code           |  Remove unreachable code
//  | Elimination         |
//  +----------+----------+
//             |
//             v
//  +---------------------+
//  | Register Allocation |  Map variables to CPU registers
//  +----------+----------+
//             |
//             v
//  +---------------------+
//  | Machine Code        |  x86-64, ARM64, etc.
//  | Generation          |
//  +---------------------+

console.log("  TurboFan optimization phases:");
console.log("  1. Build graph (sea-of-nodes IR)");
console.log("  2. Inlining (inline small functions)");
console.log("  3. Type specialization (use type feedback)");
console.log("  4. Constant folding (2+3 -> 5 at compile time)");
console.log("  5. Dead code elimination (remove unreachable code)");
console.log("  6. Register allocation (map to CPU registers)");
console.log("  7. Machine code generation (native instructions)");
console.log("");

// ============================================================
// EXAMPLE 6 — Speculative Optimization
// Story: At MakeMyTrip, the fare calculation function always receives
//   {origin: string, destination: string, passengers: number}. TurboFan
//   SPECULATES that this will continue to be the case and compiles
//   optimized code that directly accesses properties at known memory offsets
//   — no hash table lookup needed. This is 10x faster.
// ============================================================

// WHY: TurboFan's power comes from SPECULATION — it makes assumptions
// based on what it has OBSERVED and generates code for that assumption.
// This is what makes JIT-compiled JS competitive with static languages.

console.log("=== EXAMPLE 6: Speculative Optimization ===");

// TurboFan sees: add(a, b) always called with two numbers
// It SPECULATES: "a and b will always be numbers"
// It COMPILES: machine code with ONLY number addition (no type checks)

// In pseudocode, interpreted version:
// function add(a, b) {
//   if (typeof a === 'number' && typeof b === 'number') {
//     return a + b;                    // Number addition
//   } else if (typeof a === 'string' || typeof b === 'string') {
//     return String(a) + String(b);    // String concatenation
//   } else {
//     return ToPrimitive(a) + ToPrimitive(b);  // Complex coercion
//   }
// }

// TurboFan optimized version (pseudocode):
// function add_optimized(a, b) {
//   // Type guard (cheap check)
//   if (!IsNumber(a) || !IsNumber(b)) goto DEOPTIMIZE;
//   return a + b;  // Direct CPU add instruction
// }

console.log("  Interpreted add: check types -> coerce -> add (slow)");
console.log("  TurboFan add:    guard check -> CPU add instruction (fast!)");
console.log("");

// ============================================================
// EXAMPLE 7 — Deoptimization (Bailout)
// Story: A Flipkart engineer wrote a product comparison function that
//   usually receives product objects. But during a sale, an edge case
//   sent a null value. TurboFan had compiled the function assuming objects
//   — the null caused a DEOPTIMIZATION. The function fell back to the
//   interpreter, causing a brief performance hiccup during peak load.
// ============================================================

// WHY: When TurboFan's speculative assumptions are WRONG, it must
// throw away the optimized machine code and fall back to the interpreter.
// This is called deoptimization. It's expensive and should be avoided.

console.log("=== EXAMPLE 7: Deoptimization ===");

// --- Deoptimization Flow ---
//
//  TurboFan: "add() always gets numbers"
//  Compiles optimized machine code for numbers
//       |
//       | Someone calls: add("hello", "world")
//       |
//       v
//  TYPE GUARD FAILS!
//  "a" is not a number!
//       |
//       v
//  DEOPTIMIZE:
//  1. Throw away optimized machine code
//  2. Reconstruct interpreter state (variables, stack)
//  3. Fall back to Ignition (slow path)
//  4. Continue executing in interpreter
//       |
//       v
//  Ignition collects NEW type feedback
//  (now knows about both numbers AND strings)
//       |
//       v
//  TurboFan may re-optimize with broader assumptions
//  (but broader = less optimized)

function polymorphicAdd(a, b) {
    return a + b;
}

// Phase 1: Warm up with numbers (TurboFan optimizes for numbers)
for (let i = 0; i < 100000; i++) {
    polymorphicAdd(i, i + 1);
}
console.log("  Phase 1: 100,000 calls with numbers (optimized)");

// Phase 2: Call with string (causes deoptimization!)
const stringResult = polymorphicAdd("Mumbai", " Indians");
console.log(`  Phase 2: Called with strings -> "${stringResult}" (DEOPTIMIZED!)`);

// Phase 3: V8 may re-optimize with polymorphic feedback
for (let i = 0; i < 100000; i++) {
    polymorphicAdd(i, i + 1);
}
console.log("  Phase 3: Re-optimized (but now handles both types = less optimal)");
console.log("");

// How to detect deoptimizations:
console.log("  Detect deoptimizations:");
console.log("  node --trace-deopt script.js");
console.log("  Look for: '[deoptimizing ... reason: ...]' in output");
console.log("");

// ============================================================
// EXAMPLE 8 — Why Type Stability Matters
// Story: At Groww (investment app), the portfolio value calculator
//   ALWAYS receives number inputs. The engineering team enforces this
//   through TypeScript and runtime checks. By keeping types stable,
//   they ensure V8 generates the most optimized machine code possible
//   for their most critical computation paths.
// ============================================================

// WHY: Type stability is THE most important thing you can do for V8
// performance. Functions that always receive the same types get
// monomorphic feedback and the best optimizations.

console.log("=== EXAMPLE 8: Type Stability ===");

// BAD: type-unstable function
function badProcess(input) {
    if (typeof input === 'number') return input * 2;
    if (typeof input === 'string') return input.toUpperCase();
    if (Array.isArray(input)) return input.length;
    return null;
}

// GOOD: separate functions, each type-stable
function doubleNumber(n) { return n * 2; }
function uppercaseString(s) { return s.toUpperCase(); }
function arrayLength(arr) { return arr.length; }

// Benchmark: type-stable vs type-unstable
const stableStart = process.hrtime.bigint();
for (let i = 0; i < 5_000_000; i++) {
    doubleNumber(i);
}
const stableEnd = process.hrtime.bigint();

const unstableStart = process.hrtime.bigint();
const inputs = [42, "hello", [1, 2, 3], 100, "world", [4, 5]];
for (let i = 0; i < 5_000_000; i++) {
    badProcess(inputs[i % inputs.length]);
}
const unstableEnd = process.hrtime.bigint();

console.log(`  Type-stable (always number):  ${Number(stableEnd - stableStart) / 1_000_000}ms`);
console.log(`  Type-unstable (mixed types):  ${Number(unstableEnd - unstableStart) / 1_000_000}ms`);
console.log("  Type-stable functions optimize better in V8!");
console.log("");

// ============================================================
// EXAMPLE 9 — Inline Caching (IC)
// Story: At Nykaa's product listing page, each product object has the
//   same shape: {name, price, brand, rating}. V8's inline caches remember
//   WHERE these properties are stored in memory, so the second access to
//   product.price is much faster than the first — no hash table lookup needed.
// ============================================================

// WHY: Inline caching is one of V8's most important optimizations.
// It caches the memory layout of objects so property access is fast.
// Objects with the same "shape" share the same cache.

console.log("=== EXAMPLE 9: Inline Caching ===");

// When V8 first sees: obj.price
// It must look up "price" in the object's property storage (slow)
// After the first lookup, V8 CACHES:
//   "For objects with this Hidden Class, 'price' is at offset 16"

// --- Inline Cache States ---
//
// UNINITIALIZED  ->  Never accessed this property
//      |
//      v
// MONOMORPHIC    ->  Always the same object shape (FASTEST)
//      |              "price is at offset 16, always"
//      v
// POLYMORPHIC    ->  2-4 different shapes (still OK)
//      |              "if shape A: offset 16, if shape B: offset 24"
//      v
// MEGAMORPHIC    ->  Many shapes (falls back to generic lookup, SLOW)
//                    "just do a hash table lookup every time"

// GOOD: Same shape (monomorphic IC)
function getPrice(product) {
    return product.price;  // IC site
}

// All products have the same shape -> monomorphic -> fast!
const products = [];
for (let i = 0; i < 10000; i++) {
    products.push({ name: `Product ${i}`, price: i * 100, brand: "TestBrand" });
}

const icStart = process.hrtime.bigint();
let total = 0;
for (const p of products) {
    total += getPrice(p);  // Monomorphic: same shape every time
}
const icEnd = process.hrtime.bigint();
console.log(`  Monomorphic IC (same shape): ${Number(icEnd - icStart) / 1_000_000}ms, total: ${total}`);

// BAD: Different shapes (megamorphic IC)
function getPriceBad(product) {
    return product.price;  // IC site
}

const mixedProducts = [];
for (let i = 0; i < 10000; i++) {
    // Each object has different properties in different order -> different shapes!
    if (i % 4 === 0) mixedProducts.push({ price: i * 100, name: `A${i}` });
    else if (i % 4 === 1) mixedProducts.push({ name: `B${i}`, price: i * 100, brand: "X" });
    else if (i % 4 === 2) mixedProducts.push({ brand: "Y", price: i * 100 });
    else mixedProducts.push({ rating: 5, brand: "Z", price: i * 100, name: `D${i}` });
}

const icStart2 = process.hrtime.bigint();
let total2 = 0;
for (const p of mixedProducts) {
    total2 += getPriceBad(p);  // Polymorphic/Megamorphic: different shapes!
}
const icEnd2 = process.hrtime.bigint();
console.log(`  Megamorphic IC (mixed shapes): ${Number(icEnd2 - icStart2) / 1_000_000}ms, total: ${total2}`);
console.log("");

// ============================================================
// EXAMPLE 10 — On-Stack Replacement (OSR)
// Story: At PhonePe, a batch processing loop runs for millions of
//   iterations, computing transaction summaries. V8 doesn't wait for
//   the loop to finish — it performs ON-STACK REPLACEMENT: it compiles
//   the loop to machine code and swaps it in MID-EXECUTION. The loop
//   starts slow (interpreted) and gets fast (compiled) partway through.
// ============================================================

// WHY: OSR is how V8 optimizes long-running loops. Without OSR,
// a loop would have to finish and be called AGAIN to benefit from
// JIT compilation. OSR swaps optimized code in mid-loop.

console.log("=== EXAMPLE 10: On-Stack Replacement (OSR) ===");

// --- How OSR Works ---
//
//  Loop starts running in IGNITION (interpreter)
//       |
//       v
//  Iteration 1, 2, 3 ... (interpreted, collecting type feedback)
//       |
//       v
//  Loop is HOT! (many iterations detected)
//       |
//       v
//  TurboFan compiles the loop body to machine code
//       |
//       v
//  V8 performs ON-STACK REPLACEMENT:
//  - Current interpreter frame is REPLACED with compiled frame
//  - All local variables are transferred
//  - Execution continues from CURRENT iteration (not restart!)
//       |
//       v
//  Iteration N+1, N+2, ... (now running machine code, FAST!)

function sumLoop(n) {
    let sum = 0;
    // This loop will trigger OSR after enough iterations
    for (let i = 0; i < n; i++) {
        sum += i;
    }
    return sum;
}

// First call: interpreted, then OSR kicks in mid-loop
const osrStart = process.hrtime.bigint();
const result1 = sumLoop(10_000_000);
const osrEnd = process.hrtime.bigint();

// Second call: already compiled, fast from the start
const osrStart2 = process.hrtime.bigint();
const result2 = sumLoop(10_000_000);
const osrEnd2 = process.hrtime.bigint();

console.log(`  First call  (with OSR mid-loop): ${Number(osrEnd - osrStart) / 1_000_000}ms`);
console.log(`  Second call (already compiled):   ${Number(osrEnd2 - osrStart2) / 1_000_000}ms`);
console.log(`  Sum: ${result1} (both calls produce same result: ${result1 === result2})`);
console.log("");

// ============================================================
// EXAMPLE 11 — Seeing Optimization/Deoptimization Live
// Story: At Byju's, the quiz scoring engine was mysteriously slow for
//   some quizzes. Using V8's --trace-opt and --trace-deopt flags, the
//   engineering team discovered that a JSON parsing step was returning
//   objects with different shapes, causing repeated deoptimizations of
//   the scoring function. Normalizing the JSON structure fixed it.
// ============================================================

// WHY: V8 provides flags to watch optimization happen in real time.
// This is essential for diagnosing performance issues.

console.log("=== EXAMPLE 11: V8 Optimization Flags ===");
console.log("");
console.log("  # See optimizations:");
console.log("  node --trace-opt script.js");
console.log("  Output: '[marking <functionName> for optimization]'");
console.log("  Output: '[compiling method <functionName> using TurboFan]'");
console.log("");
console.log("  # See deoptimizations:");
console.log("  node --trace-deopt script.js");
console.log("  Output: '[deoptimizing <functionName>: reason]'");
console.log("");
console.log("  # Common deopt reasons:");
console.log("  - 'wrong map'          -> object shape changed");
console.log("  - 'not a Smi'          -> expected small int, got something else");
console.log("  - 'not a Number'       -> expected number, got different type");
console.log("  - 'not a String'       -> expected string, got different type");
console.log("  - 'division by zero'   -> unexpected zero divisor");
console.log("  - 'minus zero'         -> result was -0 instead of 0");
console.log("  - 'NaN'               -> unexpected NaN result");
console.log("  - 'overflow'          -> number exceeded Smi range");
console.log("");

// ============================================================
// EXAMPLE 12 — Practical: Optimization vs Deoptimization Demo
// Story: At Dunzo (quick commerce), the delivery ETA calculation runs
//   thousands of times per minute. The engineering team wrote two versions:
//   one with consistent types (fast) and one with occasional type changes
//   (slow due to deoptimizations). The difference was 3x in throughput.
// ============================================================

// WHY: This practical example shows the REAL performance impact of
// writing type-stable vs type-unstable code.

console.log("=== EXAMPLE 12: Optimization Demo ===");

// Version 1: Type-stable (V8 loves this)
function stableCalc(distance, speed) {
    const time = distance / speed;
    const surcharge = distance > 5 ? distance * 0.5 : 0;
    return time * 60 + surcharge; // minutes + surcharge
}

// Warm up: always numbers
for (let i = 0; i < 10000; i++) {
    stableCalc(i * 0.1, 30);
}

const sStart = process.hrtime.bigint();
for (let i = 0; i < 5_000_000; i++) {
    stableCalc(i * 0.1, 30 + (i % 20));
}
const sEnd = process.hrtime.bigint();

// Version 2: Type-unstable (deoptimization risk)
function unstableCalc(distance, speed) {
    const time = distance / speed;
    const surcharge = distance > 5 ? distance * 0.5 : 0;
    return time * 60 + surcharge;
}

// Warm up with numbers, then pollute with strings
for (let i = 0; i < 10000; i++) {
    unstableCalc(i * 0.1, 30);
}
// Pollute type feedback
unstableCalc("10", "30");       // string inputs!
unstableCalc(undefined, null);  // weird inputs!

const uStart = process.hrtime.bigint();
for (let i = 0; i < 5_000_000; i++) {
    unstableCalc(i * 0.1, 30 + (i % 20));
}
const uEnd = process.hrtime.bigint();

console.log(`  Type-stable:   ${Number(sEnd - sStart) / 1_000_000}ms (5M iterations)`);
console.log(`  Type-unstable: ${Number(uEnd - uStart) / 1_000_000}ms (5M iterations)`);
console.log("  Type stability makes a real difference in hot loops!");
console.log("");

// ============================================================
// EXAMPLE 13 — Summary: Writing V8-Friendly Code
// Story: At Razorpay, the payments SDK engineering guidelines include
//   specific rules for writing "V8-friendly" code. These aren't
//   micro-optimizations — they're fundamental patterns that let
//   the engine do its best work.
// ============================================================

console.log("=== EXAMPLE 13: V8-Friendly Code Guidelines ===");
console.log("");
console.log("  1. TYPE STABILITY: Keep function argument types consistent");
console.log("     Bad:  add(1, 2); add('a', 'b'); add(true, null);");
console.log("     Good: addNumbers(1, 2); concatStrings('a', 'b');");
console.log("");
console.log("  2. OBJECT SHAPE: Create objects with same properties, same order");
console.log("     Bad:  {a:1, b:2} then {b:2, a:1} (different shapes!)");
console.log("     Good: Always {a:_, b:_} in same order");
console.log("");
console.log("  3. AVOID delete: It changes object shape, breaks inline caches");
console.log("     Bad:  delete obj.property;");
console.log("     Good: obj.property = undefined;");
console.log("");
console.log("  4. AVOID arguments OBJECT: Use rest parameters instead");
console.log("     Bad:  function f() { return arguments[0]; }");
console.log("     Good: function f(...args) { return args[0]; }");
console.log("");
console.log("  5. AVOID try/catch IN HOT LOOPS: (less relevant in modern V8)");
console.log("     Historically prevented optimization; modern V8 handles it better");
console.log("");
console.log("  6. USE MONOMORPHIC OPERATIONS: Same operation on same types");
console.log("     Polymorphic and megamorphic operations are slower");
console.log("");

// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. V8's pipeline: Parser -> AST -> Ignition (bytecode) -> TurboFan (machine code)
//    with type feedback flowing from Ignition to TurboFan.
//
// 2. Ignition generates compact BYTECODES (LdaSmi, Star, Add, Return, etc.)
//    and collects TYPE FEEDBACK while executing them.
//
// 3. "Hot" functions (called many times) get sent to TurboFan for optimization.
//    TurboFan uses type feedback to make SPECULATIVE OPTIMIZATIONS.
//
// 4. If speculation is wrong (type changes), V8 DEOPTIMIZES — throws away
//    machine code and falls back to the interpreter. This is expensive.
//
// 5. TYPE STABILITY is the #1 performance rule: always pass the same types
//    to a function. Monomorphic > Polymorphic > Megamorphic.
//
// 6. Inline caching (IC) remembers where object properties are stored.
//    Objects with the same shape share IC entries. Different shapes = slow.
//
// 7. On-Stack Replacement (OSR) optimizes long-running loops mid-execution.
//    The loop starts interpreted and switches to machine code partway through.
//
// 8. Use V8 flags to observe: --trace-opt, --trace-deopt, --print-bytecode
//    These reveal what V8 is doing to your code.
// ============================================================

console.log("=== KEY TAKEAWAYS ===");
console.log("1. Pipeline: AST -> Ignition (bytecode + feedback) -> TurboFan (machine code)");
console.log("2. Ignition generates bytecodes and collects type feedback");
console.log("3. TurboFan speculatively optimizes hot functions using feedback");
console.log("4. Deoptimization happens when type assumptions are violated");
console.log("5. Type stability is the #1 V8 performance rule");
console.log("6. Inline caching makes property access fast for consistent shapes");
console.log("7. OSR optimizes loops mid-execution");
console.log("8. Use --trace-opt and --trace-deopt to observe V8 decisions");
