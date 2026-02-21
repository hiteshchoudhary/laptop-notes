// ============================================================
// FILE 04: EXECUTION CONTEXT
// Topic: The environment where JavaScript code evaluates and executes
// WHY: Every line of JavaScript runs inside an "execution context" — an
//   internal data structure that manages variables, scope chains, and the
//   `this` binding. Understanding execution contexts demystifies hoisting,
//   closures, scope, and the Temporal Dead Zone (TDZ).
// ============================================================

// ============================================================
// EXAMPLE 1 — Flipkart Big Billion Days
// Story: During Flipkart's Big Billion Days sale, thousands of JavaScript
//   functions execute simultaneously on the user's browser: validateCart(),
//   applyOffer(), calculateDelivery(), processPayment(). Each function
//   creates its own EXECUTION CONTEXT — an isolated environment that holds
//   its variables, knows its scope chain, and determines what `this` means.
//   Without execution contexts, variables from one function would collide
//   with another's, and the entire checkout would break.
// ============================================================

// WHY: An execution context is the ENGINE'S internal bookkeeping for
// running code. It answers: "What variables exist here? What scope am
// I in? What is `this`?"

console.log("=== EXAMPLE 1: What is an Execution Context? ===");
console.log("");

// --- Execution Context Structure ---
//
//  +------------------------------------------+
//  |  Execution Context                       |
//  |                                          |
//  |  +------------------------------------+  |
//  |  | Variable Environment (VE)         |  |
//  |  |  - var declarations               |  |
//  |  |  - function declarations          |  |
//  |  |  - arguments object               |  |
//  |  +------------------------------------+  |
//  |                                          |
//  |  +------------------------------------+  |
//  |  | Lexical Environment (LE)          |  |
//  |  |  - let / const declarations       |  |
//  |  |  - block-scoped variables         |  |
//  |  |  - outer environment reference    |  |
//  |  +------------------------------------+  |
//  |                                          |
//  |  +------------------------------------+  |
//  |  | This Binding                      |  |
//  |  |  - determined by how function     |  |
//  |  |    is called                      |  |
//  |  +------------------------------------+  |
//  +------------------------------------------+

console.log("  Execution Context contains:");
console.log("  1. Variable Environment (var, function declarations)");
console.log("  2. Lexical Environment (let, const, block scope)");
console.log("  3. This Binding (determined by call-site)");
console.log("");

// ============================================================
// EXAMPLE 2 — Three Types of Execution Contexts
// Story: At Infosys, a training module explains that there are three
//   types of execution contexts: Global (when the script first loads),
//   Function (every time a function is called), and Eval (the rarely-used
//   eval() function). 99% of the time you deal with Global and Function.
// ============================================================

// WHY: Understanding the types helps you know when contexts are created.
// The Global EC is created when the script loads. Function ECs are created
// on every function CALL (not definition).

console.log("=== EXAMPLE 2: Types of Execution Contexts ===");

// TYPE 1: Global Execution Context
// Created when the script first runs
// - Creates the global object (window in browser, global in Node.js)
// - Sets `this` to the global object
// - Only ONE global context per program

// TYPE 2: Function Execution Context
// Created every time a function is CALLED
// - Each call creates a NEW context (even for the same function)
// - Has its own Variable Environment and Lexical Environment
// - Determines `this` based on how the function is called

// TYPE 3: Eval Execution Context
// Created when eval() is called
// - Executes string as code
// - AVOID eval() — it's slow and dangerous
// - Rarely used in modern JavaScript

// Demonstration:
var globalVar = "I'm in Global EC";    // Global EC's Variable Environment

function outerFunction() {
    // New Function EC created when called
    var outerVar = "I'm in outerFunction's EC";

    function innerFunction() {
        // Another new Function EC created when called
        var innerVar = "I'm in innerFunction's EC";
        console.log("  " + innerVar);
        console.log("  " + outerVar);   // Accessible via scope chain
        console.log("  " + globalVar);  // Accessible via scope chain
    }

    innerFunction();  // Creates Function EC #2
}

outerFunction();      // Creates Function EC #1
console.log("");

// ============================================================
// EXAMPLE 3 — Creation Phase vs Execution Phase
// Story: When a Wipro developer's code seems to "magically" know about
//   variables before they're assigned, they're seeing the CREATION PHASE
//   in action. The engine first scans for declarations (setting up memory)
//   and then executes code line by line. This two-phase process is why
//   hoisting exists.
// ============================================================

// WHY: Each execution context goes through TWO phases. The creation phase
// explains hoisting — one of the most confusing parts of JavaScript.
// Understanding these phases makes hoisting obvious, not magical.

console.log("=== EXAMPLE 3: Creation Phase vs Execution Phase ===");

// --- Phase 1: CREATION PHASE ---
// Before any code executes, the engine:
// 1. Creates the Variable Environment
// 2. Scans for var declarations -> set to undefined
// 3. Scans for function declarations -> fully hoisted (complete function)
// 4. Scans for let/const declarations -> placed in TDZ (Temporal Dead Zone)
// 5. Determines `this` binding

// --- Phase 2: EXECUTION PHASE ---
// Code runs line by line:
// 1. var variables get assigned their values
// 2. let/const variables get assigned (removed from TDZ)
// 3. Function calls create new execution contexts

// Step-by-step trace:
console.log("  --- Tracing: Creation Phase ---");

// BEFORE any code runs, the engine does this:
// var userName     -> allocated, set to undefined
// var userAge      -> allocated, set to undefined
// function greet() -> allocated, FULLY HOISTED (function body available)
// let userCity     -> allocated, placed in TDZ (cannot access yet)

console.log("  var userName = undefined  (creation phase)");
console.log("  var userAge = undefined   (creation phase)");
console.log("  function greet = [Function] (FULLY hoisted!)");
console.log("  let userCity = <TDZ>      (cannot access yet)");
console.log("");

// Now let's see it in action:
console.log("  --- Tracing: Execution Phase ---");

// This works because greet is fully hoisted:
console.log("  greet() before definition:", greet("Priya")); // Works!

// This shows undefined (var is hoisted but not assigned):
console.log("  userName before assignment:", userName); // undefined

// This would throw ReferenceError (TDZ):
// console.log(userCity); // ReferenceError: Cannot access 'userCity' before init

var userName = "Rajesh";
var userAge = 28;
let userCity = "Bengaluru";

function greet(name) {
    return `Hello, ${name}!`;
}

console.log("  userName after assignment:", userName); // "Rajesh"
console.log("  userCity after assignment:", userCity); // "Bengaluru"
console.log("");

// ============================================================
// EXAMPLE 4 — Variable Environment vs Lexical Environment
// Story: At Tata Consultancy Services, a senior developer explains
//   the subtle difference to juniors: Variable Environment holds `var`
//   and function declarations (function-scoped). Lexical Environment
//   holds `let` and `const` (block-scoped). When you enter a new block
//   { }, a new Lexical Environment is created, but the Variable
//   Environment stays the same.
// ============================================================

// WHY: This distinction explains why `var` ignores blocks but `let`/`const`
// respect them. It's the underlying mechanism for block scoping.

console.log("=== EXAMPLE 4: Variable Environment vs Lexical Environment ===");

// --- Diagram ---
//
//  function example() {
//    var x = 1;         // Variable Environment (function-scoped)
//    let y = 2;         // Lexical Environment (function-level block)
//
//    if (true) {
//      var z = 3;       // SAME Variable Environment (var ignores blocks!)
//      let w = 4;       // NEW Lexical Environment (block-scoped)
//      const v = 5;     // NEW Lexical Environment (block-scoped)
//    }
//
//    console.log(x);    // 1 (VE)
//    console.log(y);    // 2 (LE)
//    console.log(z);    // 3 (VE - var leaks out of block!)
//    console.log(w);    // ReferenceError (LE destroyed when block ended!)
//  }
//
//  Variable Environment (entire function):
//  +--------+-----------+
//  | x      | 1         |
//  | z      | 3         |  <- var z is HERE, not in block's LE
//  +--------+-----------+
//
//  Lexical Environment (function body):
//  +--------+-----------+
//  | y      | 2         |
//  +--------+-----------+
//      |
//      | outer reference
//      v
//  Lexical Environment (if block) -- DESTROYED after block:
//  +--------+-----------+
//  | w      | 4         |
//  | v      | 5         |
//  +--------+-----------+

function scopeDemo() {
    var funcScoped = "I'm in Variable Environment";
    let blockScoped = "I'm in Lexical Environment";

    if (true) {
        var alsoFuncScoped = "I leak out of blocks!";  // Goes to VE
        let staysInBlock = "I stay in this block";     // Goes to block's LE
        const alsoStays = "Me too!";                   // Goes to block's LE

        console.log("  Inside block:");
        console.log("    funcScoped:", funcScoped);
        console.log("    blockScoped:", blockScoped);
        console.log("    alsoFuncScoped:", alsoFuncScoped);
        console.log("    staysInBlock:", staysInBlock);
    }

    console.log("  Outside block:");
    console.log("    funcScoped:", funcScoped);
    console.log("    alsoFuncScoped:", alsoFuncScoped);    // Works! var leaks
    // console.log(staysInBlock);  // ReferenceError! let doesn't leak
    // console.log(alsoStays);     // ReferenceError! const doesn't leak
    console.log("    staysInBlock: <not accessible> (block-scoped)");
}

scopeDemo();
console.log("");

// ============================================================
// EXAMPLE 5 — Scope Chain
// Story: At Swiggy, the delivery fee calculation function is nested inside
//   the order processing function, which is inside the restaurant module.
//   When the delivery fee function needs the restaurant's city, it looks
//   UP the scope chain — first in its own scope, then in order processing's
//   scope, then in the restaurant module's scope. This chain is how
//   inner functions access outer variables.
// ============================================================

// WHY: The scope chain is the mechanism behind closures and variable
// resolution. Each execution context has a reference to its OUTER
// lexical environment, forming a chain back to the global scope.

console.log("=== EXAMPLE 5: Scope Chain ===");

// --- Scope Chain Diagram ---
//
//  innerFunction's EC
//  +--------------------+
//  | LE: { innerVar }   |
//  | outer ref -------->+--- outerFunction's EC
//  +--------------------+   +--------------------+
//                           | LE: { outerVar }   |
//                           | outer ref -------->+--- Global EC
//                           +--------------------+   +------------------+
//                                                    | LE: { globalVar }|
//                                                    | outer ref: null  |
//                                                    +------------------+
//
//  Variable lookup: innerVar -> own LE (found!)
//  Variable lookup: outerVar -> own LE (not found) -> outer LE (found!)
//  Variable lookup: globalVar -> own LE -> outer LE -> global LE (found!)
//  Variable lookup: unknown -> own LE -> outer LE -> global LE -> NOT FOUND!
//                                                    -> ReferenceError

const restaurantCity = "Mumbai";  // Global EC

function processOrder(orderId) {
    const orderType = "delivery";  // processOrder's EC

    function calculateFee(distance) {
        const baseFee = 30;  // calculateFee's EC

        // Scope chain in action:
        console.log(`  Order #${orderId}`);        // Found in processOrder's EC
        console.log(`  Type: ${orderType}`);        // Found in processOrder's EC
        console.log(`  City: ${restaurantCity}`);   // Found in Global EC
        console.log(`  Distance: ${distance} km`);  // Found in own EC
        console.log(`  Fee: Rs ${baseFee + distance * 5}`);
    }

    calculateFee(3);  // Creates calculateFee's EC
}

processOrder(1001);  // Creates processOrder's EC
console.log("");

// ============================================================
// EXAMPLE 6 — The `this` Binding in Execution Context
// Story: At Ola, a developer was confused why `this` inside a callback
//   didn't refer to the ride object. The answer lies in HOW the function
//   is called — `this` is determined at the time the execution context
//   is CREATED, not when the function is DEFINED.
// ============================================================

// WHY: `this` is part of the execution context. Its value is set during
// the CREATION PHASE based on how the function is called. Different call
// patterns produce different `this` values.

console.log("=== EXAMPLE 6: `this` Binding ===");

// --- this Determination Rules (in priority order) ---
//
// 1. new keyword:        this = new empty object
// 2. call/apply/bind:    this = explicitly passed object
// 3. Method call:        this = object before the dot
// 4. Regular function:   this = undefined (strict) or global (sloppy)
// 5. Arrow function:     this = inherited from enclosing scope (lexical)

const ride = {
    id: "RIDE-5001",
    driver: "Amit",
    getInfo: function() {
        // Method call: this = ride object
        return `${this.driver} is driving ${this.id}`;
    },
    getInfoArrow: () => {
        // Arrow function: this = enclosing scope's this (global/undefined)
        // NOT the ride object!
        return `Driver: ${typeof this === 'object' ? 'global this' : this}`;
    },
};

console.log("  Method call: ride.getInfo()");
console.log("  Result:", ride.getInfo());

console.log("  Arrow in object: ride.getInfoArrow()");
console.log("  Result:", ride.getInfoArrow(), "(arrow inherits outer this)");

// Extracted method loses its `this`:
const extracted = ride.getInfo;
// console.log(extracted()); // undefined.id -> error in strict mode

// Fixed with bind:
const bound = ride.getInfo.bind(ride);
console.log("  Bound method:", bound());
console.log("");

// ============================================================
// EXAMPLE 7 — Step-by-Step Execution Context Walkthrough
// Story: During a coding interview at Google Bangalore, a candidate
//   is asked to trace through a code snippet step by step, showing
//   what the call stack and execution contexts look like at each point.
//   This is a common interview topic because it tests deep understanding
//   of JavaScript internals.
// ============================================================

// WHY: Tracing through execution contexts step by step is the best way
// to truly understand hoisting, scope, closures, and the call stack.

console.log("=== EXAMPLE 7: Step-by-Step Walkthrough ===");
console.log("");

var color = "blue";      // Step 1: Global EC, creation phase: color = undefined
                          // Step 2: Global EC, execution phase: color = "blue"

function first() {
    var a = 10;           // Step 4: first() EC, creation phase: a = undefined
                          // Step 5: first() EC, execution phase: a = 10
    second();             // Step 6: Call second(), push new EC
    console.log("  first: a =", a, ", color =", color);  // Step 11
}

function second() {
    var b = 20;           // Step 7: second() EC, creation phase: b = undefined
                          // Step 8: second() EC, execution phase: b = 20
    third();              // Step 9: Call third(), push new EC
    console.log("  second: b =", b);  // Step 13 (after third returns)
}

function third() {
    var c = 30;
    console.log("  third: c =", c, ", color =", color);  // Step 10
    // third() returns, its EC is popped off the stack
}

// Step 3: Call first()
first();
console.log("");

// --- Call Stack at Step 10 (deepest point) ---
//
//  +---------------------------+
//  |  third() EC               |  <- TOP (currently executing)
//  |  VE: { c: 30 }           |
//  |  Scope: third -> global   |
//  +---------------------------+
//  |  second() EC              |
//  |  VE: { b: 20 }           |
//  |  Scope: second -> global  |
//  +---------------------------+
//  |  first() EC               |
//  |  VE: { a: 10 }           |
//  |  Scope: first -> global   |
//  +---------------------------+
//  |  Global EC                |  <- BOTTOM (always present)
//  |  VE: { color: "blue",    |
//  |    first: fn, second: fn, |
//  |    third: fn }            |
//  +---------------------------+

console.log("  Call stack at deepest point:");
console.log("  [TOP]    third() EC  { c: 30 }");
console.log("           second() EC { b: 20 }");
console.log("           first() EC  { a: 10 }");
console.log("  [BOTTOM] Global EC   { color: 'blue' }");
console.log("");

// ============================================================
// EXAMPLE 8 — Block Scoping Creates New Lexical Environments
// Story: At Zomato, a developer used `var` inside a for loop to create
//   event handlers for restaurant cards. All handlers referenced the
//   SAME variable (classic closure bug). Switching to `let` fixed it
//   because `let` creates a NEW Lexical Environment per iteration.
// ============================================================

// WHY: Each block `{ }` with `let`/`const` creates a new Lexical
// Environment. This is crucial for understanding the classic for-loop
// closure problem.

console.log("=== EXAMPLE 8: Block Scoping ===");

// Classic bug with var:
console.log("  var in loop (classic bug):");
var varFunctions = [];
for (var i = 0; i < 3; i++) {
    varFunctions.push(function() { return i; });
    // All three functions share the SAME `i` from the Variable Environment
}
console.log("  Results:", varFunctions.map(f => f()));  // [3, 3, 3] !!!

// --- Why var produces [3, 3, 3] ---
//
// Loop's Variable Environment (shared):
// +-------+-------+
// | i     |   3   |  <- After loop, i = 3
// +-------+-------+
// All three functions reference THIS SAME `i`

// Fixed with let:
console.log("  let in loop (fixed):");
let letFunctions = [];
for (let j = 0; j < 3; j++) {
    letFunctions.push(function() { return j; });
    // Each iteration creates a NEW Lexical Environment with its own `j`
}
console.log("  Results:", letFunctions.map(f => f()));  // [0, 1, 2] !!!

// --- Why let produces [0, 1, 2] ---
//
// Iteration 0: Lexical Environment { j: 0 } -> function captures this
// Iteration 1: Lexical Environment { j: 1 } -> function captures this
// Iteration 2: Lexical Environment { j: 2 } -> function captures this
// Each function has its OWN `j`!

console.log("");

// ============================================================
// EXAMPLE 9 — The Temporal Dead Zone (TDZ)
// Story: A new hire at Razorpay encountered a confusing error:
//   "Cannot access 'paymentId' before initialization." The variable
//   WAS declared with `let`, and they thought `let` doesn't hoist.
//   But it DOES hoist — it just can't be ACCESSED until the declaration
//   line. The period between hoisting and declaration is the TDZ.
// ============================================================

// WHY: The TDZ is one of the most misunderstood parts of JavaScript.
// `let` and `const` ARE hoisted (the engine knows about them during
// creation phase), but they live in the TDZ until their declaration
// line executes. Accessing them in the TDZ throws a ReferenceError.

console.log("=== EXAMPLE 9: Temporal Dead Zone ===");

// --- TDZ Timeline ---
//
//  {
//    // -------- TDZ for `x` starts (creation phase) --------
//    // x is hoisted but CANNOT be accessed
//    // typeof x -> ReferenceError (not even typeof is safe!)
//
//    console.log(x);  // ReferenceError: Cannot access 'x' before initialization
//
//    // -------- TDZ for `x` ends (declaration reached) --------
//    let x = 42;
//    console.log(x);  // 42 (works fine now)
//  }

// Demonstrate TDZ:
console.log("  TDZ demonstration:");

// var: no TDZ, initialized to undefined
console.log("  var before decl:", typeof varTDZ); // "undefined" (no error)
var varTDZ = "hello";

// let: TDZ exists
try {
    // Even typeof throws in TDZ (unlike var!)
    // (wrapping in try/catch so file keeps running)
    console.log("  let before decl: attempting access...");
    // Uncommenting below would throw:
    // console.log(letTDZ);  // ReferenceError!
    console.log("  (skipped to avoid ReferenceError)");
} catch (e) {
    console.log("  Error:", e.message);
}
let letTDZ = "world";
console.log("  let after decl:", letTDZ);  // "world"
console.log("");

// TDZ is PER-BLOCK, not per-function:
{
    // TDZ for `blockVar` starts here
    // console.log(blockVar); // Would throw ReferenceError
    let blockVar = "I'm block-scoped";
    console.log("  Block-scoped let:", blockVar);
    // TDZ for `blockVar` ends at the let declaration
}
console.log("");

// ============================================================
// EXAMPLE 10 — The arguments Object
// Story: At Mindtree, legacy code uses the `arguments` object heavily.
//   The `arguments` object lives in the Variable Environment of function
//   execution contexts. It's array-LIKE (has length, numeric indices)
//   but is NOT an actual array. Modern code should use rest parameters.
// ============================================================

// WHY: The `arguments` object is part of the Variable Environment.
// Understanding where it lives and its quirks helps you understand
// older code and why rest parameters are preferred.

console.log("=== EXAMPLE 10: The arguments Object ===");

function legacySum() {
    // `arguments` is created in the Variable Environment
    // It's array-like: has .length and numeric indices
    // But NOT a real array: no .map, .filter, .reduce
    console.log("  arguments:", Array.from(arguments));
    console.log("  arguments.length:", arguments.length);
    console.log("  Is array?", Array.isArray(arguments)); // false

    // Convert to real array:
    const argsArray = Array.from(arguments);
    return argsArray.reduce((sum, n) => sum + n, 0);
}

console.log("  Sum:", legacySum(10, 20, 30, 40)); // 100

// Modern alternative: rest parameters
function modernSum(...numbers) {
    // `numbers` is a real array — no conversion needed
    console.log("  rest params:", numbers);
    console.log("  Is array?", Array.isArray(numbers)); // true
    return numbers.reduce((sum, n) => sum + n, 0);
}

console.log("  Sum:", modernSum(10, 20, 30, 40)); // 100
console.log("");

// ============================================================
// EXAMPLE 11 — Execution Context for Closures
// Story: At BookMyShow, a seat selection module uses closures to maintain
//   state. When the user clicks different seats, each click handler
//   "remembers" its seat number because of closures. The closure works
//   because the inner function's execution context keeps a reference to
//   the outer function's Lexical Environment, even after the outer
//   function has returned.
// ============================================================

// WHY: Closures are a direct consequence of how execution contexts and
// scope chains work. The inner function's context retains a reference
// to the outer context's Lexical Environment.

console.log("=== EXAMPLE 11: Closures and Execution Context ===");

function createSeatSelector(seatNumber) {
    // createSeatSelector's EC has: { seatNumber: "A15" }
    const price = 350;

    return function selectSeat() {
        // selectSeat's EC has scope chain pointing to createSeatSelector's LE
        // Even though createSeatSelector has RETURNED, its LE survives
        // because selectSeat holds a reference to it
        console.log(`  Selecting seat ${seatNumber} for Rs ${price}`);
    };
}

const selectA15 = createSeatSelector("A15");
const selectB20 = createSeatSelector("B20");

// createSeatSelector has returned, but its Lexical Environment survives:
selectA15(); // "Selecting seat A15 for Rs 350"
selectB20(); // "Selecting seat B20 for Rs 350"

// --- Memory Diagram ---
//
//  selectA15 (function) ---> Closure Scope ---> { seatNumber: "A15", price: 350 }
//                                                (createSeatSelector's LE, call 1)
//
//  selectB20 (function) ---> Closure Scope ---> { seatNumber: "B20", price: 350 }
//                                                (createSeatSelector's LE, call 2)
//
//  Two DIFFERENT Lexical Environments survive because two different
//  execution contexts were created (two calls to createSeatSelector).

// Practical closure: counter
function createCounter(initialValue) {
    let count = initialValue;

    return {
        increment: () => ++count,
        decrement: () => --count,
        getCount: () => count,
    };
}

const counter = createCounter(0);
console.log("  Counter:", counter.increment(), counter.increment(), counter.increment());
console.log("  Current count:", counter.getCount()); // 3
console.log("  After decrement:", counter.decrement()); // 2
console.log("");

// ============================================================
// EXAMPLE 12 — Putting It All Together: Complete Trace
// Story: In a coding interview at Microsoft Hyderabad, a candidate
//   traces through a complete code snippet, showing the creation phase,
//   execution phase, scope chain, and call stack at each step.
// ============================================================

// WHY: A complete trace ties together all the concepts: execution context
// creation, hoisting, scope chains, and the call stack.

console.log("=== EXAMPLE 12: Complete Execution Trace ===");
console.log("");

// Trace this code:
var language = "JavaScript";

function outer() {
    var x = 10;
    let y = 20;

    function inner() {
        var z = 30;
        console.log(`  inner: x=${x}, y=${y}, z=${z}, language=${language}`);
    }

    inner();
    console.log(`  outer: x=${x}, y=${y}, language=${language}`);
}

// --- STEP-BY-STEP TRACE ---
//
// STEP 1: Global EC - Creation Phase
//   VE: { language: undefined, outer: <function> }
//   LE: { }
//   this: global object
//
// STEP 2: Global EC - Execution Phase
//   language = "JavaScript"
//   Call outer() -> push new EC
//
// STEP 3: outer() EC - Creation Phase
//   VE: { x: undefined, inner: <function> }
//   LE: { y: <TDZ> }
//   this: global (non-strict) or undefined (strict)
//   Scope chain: outer -> global
//
// STEP 4: outer() EC - Execution Phase
//   x = 10
//   y = 20 (exits TDZ)
//   Call inner() -> push new EC
//
// STEP 5: inner() EC - Creation Phase
//   VE: { z: undefined }
//   LE: { }
//   Scope chain: inner -> outer -> global
//
// STEP 6: inner() EC - Execution Phase
//   z = 30
//   console.log: x=10 (from outer), y=20 (from outer), z=30 (own), language="JavaScript" (global)
//   inner() returns -> pop EC
//
// STEP 7: Back in outer() EC
//   console.log: x=10, y=20, language="JavaScript"
//   outer() returns -> pop EC
//
// STEP 8: Back in Global EC
//   Program continues...

outer();
console.log("");

console.log("  Trace summary:");
console.log("  1. Global EC created (language=undefined, outer=fn)");
console.log("  2. language='JavaScript', outer() called");
console.log("  3. outer EC created (x=undefined, y=TDZ, inner=fn)");
console.log("  4. x=10, y=20, inner() called");
console.log("  5. inner EC created (z=undefined)");
console.log("  6. z=30, logs values via scope chain, returns");
console.log("  7. Back in outer, logs values, returns");
console.log("  8. Back in Global EC");
console.log("");

// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. An Execution Context is the environment where JS code runs. It has:
//    Variable Environment (var, functions), Lexical Environment (let, const),
//    and a this binding.
//
// 2. Three types: Global EC (one per program), Function EC (one per call),
//    Eval EC (rare, avoid eval).
//
// 3. Two phases: CREATION PHASE (scan declarations, set up memory, determine
//    this) and EXECUTION PHASE (run code line by line, assign values).
//
// 4. Hoisting is explained by the creation phase: var -> undefined,
//    function declarations -> fully hoisted, let/const -> TDZ.
//
// 5. Variable Environment holds var and function declarations (function-scoped).
//    Lexical Environment holds let/const (block-scoped). Each block { } with
//    let/const creates a new Lexical Environment.
//
// 6. Scope Chain: each EC references its outer Lexical Environment, forming
//    a chain. Variable lookup walks this chain from inner to outer.
//
// 7. `this` is determined during the creation phase based on HOW the function
//    is called (new > call/apply/bind > method > regular > arrow).
//
// 8. Closures work because the inner function's EC retains a reference to
//    the outer function's Lexical Environment, keeping it alive in memory.
// ============================================================

console.log("=== KEY TAKEAWAYS ===");
console.log("1. EC = Variable Environment + Lexical Environment + this binding");
console.log("2. Three types: Global, Function, Eval");
console.log("3. Two phases: Creation (set up memory) -> Execution (run code)");
console.log("4. Hoisting: var=undefined, function=hoisted, let/const=TDZ");
console.log("5. VE=function-scoped (var), LE=block-scoped (let/const)");
console.log("6. Scope chain: inner -> outer -> ... -> global");
console.log("7. this: determined by call-site, not definition");
console.log("8. Closures: inner function keeps outer LE alive");
