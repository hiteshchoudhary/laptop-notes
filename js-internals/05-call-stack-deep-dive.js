// ============================================================
// FILE 05: CALL STACK DEEP DIVE
// Topic: The LIFO data structure that manages function execution order
// WHY: The call stack is the single most important runtime data structure
//   in JavaScript. Every function call, every return, every error trace
//   involves the call stack. Understanding it deeply is essential for
//   debugging stack overflows, reading error traces, and understanding
//   why JavaScript is single-threaded.
// ============================================================

// ============================================================
// EXAMPLE 1 — IRCTC Tatkal Booking
// Story: When you book a Tatkal ticket on IRCTC, the checkout process
//   involves a chain of nested function calls: validateUser() calls
//   checkSeatAvailability(), which calls calculateFare(), which calls
//   applyDiscount(). Each of these functions is pushed onto the call
//   stack as a "frame." The stack grows as functions call deeper, and
//   shrinks as functions return. If the chain is too deep (like infinite
//   recursion during peak load), the stack overflows — and the page crashes.
// ============================================================

// WHY: The call stack is how the engine keeps track of "where am I?"
// and "where do I return to?" Without it, the engine wouldn't know
// which function called which, or where to continue after a return.

console.log("=== EXAMPLE 1: The Call Stack ===");
console.log("");

// --- What is the Call Stack? ---
//
// A LIFO (Last In, First Out) data structure that:
// 1. Tracks which function is currently executing
// 2. Tracks which function called the current function
// 3. Stores local variables and return addresses
// 4. Determines where execution continues after a function returns
//
// Think of it like a stack of thali plates in a restaurant:
// - You add plates on TOP (push)
// - You remove plates from TOP (pop)
// - You can only access the TOP plate (current function)

// --- Stack Operations ---
//
// Function CALL   -> PUSH a new frame onto the stack
// Function RETURN -> POP the current frame off the stack
//
//  +-------------------+
//  | applyDiscount()   |  <- TOP: currently executing
//  +-------------------+
//  | calculateFare()   |  <- waiting for applyDiscount to return
//  +-------------------+
//  | checkSeat()       |  <- waiting for calculateFare to return
//  +-------------------+
//  | validateUser()    |  <- waiting for checkSeat to return
//  +-------------------+
//  | main()            |  <- BOTTOM: entry point
//  +-------------------+

// Let's trace a real example:
function validateUser(userId) {
    console.log("  [PUSH] validateUser(" + userId + ")");
    const isValid = checkSeatAvailability(userId, "2A", 42);
    console.log("  [POP]  validateUser returns");
    return isValid;
}

function checkSeatAvailability(userId, coach, seat) {
    console.log("  [PUSH] checkSeatAvailability(" + coach + "-" + seat + ")");
    const fare = calculateFare(coach, seat);
    console.log("  [POP]  checkSeatAvailability returns");
    return fare > 0;
}

function calculateFare(coach, seat) {
    console.log("  [PUSH] calculateFare(" + coach + ", " + seat + ")");
    const basePrice = 500;
    const finalPrice = applyDiscount(basePrice, 0.1);
    console.log("  [POP]  calculateFare returns " + finalPrice);
    return finalPrice;
}

function applyDiscount(price, discount) {
    console.log("  [PUSH] applyDiscount(" + price + ", " + discount + ")");
    const result = price * (1 - discount);
    console.log("  [POP]  applyDiscount returns " + result);
    return result;
}

validateUser("USR-101");
console.log("");

// ============================================================
// EXAMPLE 2 — Stack Frame Contents
// Story: At Paytm, when an error occurs during payment processing, the
//   error stack trace shows each frame: the function name, file, and line
//   number. Each stack frame is a complete snapshot of a function's
//   execution state — it's not just a name, it contains the function's
//   local variables, the return address, and the execution context.
// ============================================================

// WHY: Each stack frame is not just a name — it's a complete execution
// record. Understanding what's IN a frame helps you read error traces
// and understand memory usage.

console.log("=== EXAMPLE 2: Stack Frame Contents ===");

// --- What's Inside a Stack Frame ---
//
//  +----------------------------------+
//  |  Stack Frame for myFunction()    |
//  |                                  |
//  |  Function: myFunction            |
//  |  Return Address: line 42 of      |
//  |                  caller.js       |
//  |  Arguments: (10, "hello")        |
//  |  Local Variables:                |
//  |    - x = 10                      |
//  |    - y = "hello"                 |
//  |    - result = undefined          |
//  |  Execution Context:              |
//  |    - Variable Environment        |
//  |    - Lexical Environment         |
//  |    - this binding                |
//  +----------------------------------+

console.log("  Each stack frame contains:");
console.log("  1. Function reference (which function)");
console.log("  2. Return address (where to go back after return)");
console.log("  3. Arguments passed to the function");
console.log("  4. Local variables");
console.log("  5. Execution context (VE, LE, this)");
console.log("");

// ============================================================
// EXAMPLE 3 — Tracing the Stack: Growing and Shrinking
// Story: An instructor at IIIT Hyderabad uses ASCII diagrams to show
//   students how the call stack grows with each function call and shrinks
//   with each return. The visual trace makes the concept click instantly.
// ============================================================

// WHY: Seeing the stack grow and shrink step by step is the clearest
// way to understand call stack behavior.

console.log("=== EXAMPLE 3: Stack Growing and Shrinking ===");

function a() {
    console.log("  a() executing");
    b();
    console.log("  a() after b returned");
}

function b() {
    console.log("  b() executing");
    c();
    console.log("  b() after c returned");
}

function c() {
    console.log("  c() executing (deepest point)");
}

// Trace:
console.log("  Calling a()...");
a();
console.log("");

// --- Stack at each point ---
//
// Step 1: Before a()       Step 2: a() called       Step 3: b() called
// +-----------+            +-----------+             +-----------+
// | main()    |            |  a()      |             |  b()      |
// +-----------+            +-----------+             +-----------+
//                          | main()    |             |  a()      |
//                          +-----------+             +-----------+
//                                                    | main()    |
//                                                    +-----------+
//
// Step 4: c() called       Step 5: c() returns     Step 6: b() returns
// +-----------+            +-----------+            +-----------+
// |  c()      | <- TOP     |  b()      | <- TOP    |  a()      | <- TOP
// +-----------+            +-----------+            +-----------+
// |  b()      |            |  a()      |            | main()    |
// +-----------+            +-----------+            +-----------+
// |  a()      |            | main()    |
// +-----------+            +-----------+
// | main()    |
// +-----------+

console.log("  Stack trace (deepest point):");
console.log("  [TOP]    c()");
console.log("           b()");
console.log("           a()");
console.log("  [BOTTOM] main()");
console.log("");

// ============================================================
// EXAMPLE 4 — console.trace() and Error.stack
// Story: At Flipkart, a debugging session involved tracking down where
//   a particular function was being called from. Using console.trace()
//   printed the entire call stack, revealing an unexpected caller.
//   Error.stack provides similar information in error objects.
// ============================================================

// WHY: console.trace() and Error.stack are your tools for inspecting
// the call stack at runtime. They're invaluable for debugging.

console.log("=== EXAMPLE 4: console.trace() and Error.stack ===");

function processOrder() {
    calculateTotal();
}

function calculateTotal() {
    addTax();
}

function addTax() {
    // console.trace() prints the call stack at this point
    console.log("  --- console.trace() output ---");
    console.trace("  addTax called");
    console.log("");

    // Error.stack captures the stack as a string
    const stackTrace = new Error().stack;
    console.log("  --- Error.stack output ---");
    console.log("  " + stackTrace.split('\n').slice(0, 5).join('\n  '));
    console.log("");
}

processOrder();

// ============================================================
// EXAMPLE 5 — Stack Overflow
// Story: A junior developer at HCL wrote a recursive function to traverse
//   a deeply nested menu structure (categories -> subcategories -> items).
//   They forgot the base case. The function called itself infinitely,
//   pushing frames until the stack ran out of space — a Stack Overflow.
//   The browser showed: "RangeError: Maximum call stack size exceeded."
// ============================================================

// WHY: Stack overflow is one of the most common runtime errors.
// It happens when the stack grows beyond its limit — usually because
// of infinite or excessively deep recursion.

console.log("=== EXAMPLE 5: Stack Overflow ===");

// --- How Stack Overflow Happens ---
//
//  function infinite() {
//    return infinite();  // No base case!
//  }
//
//  +-------------------+
//  | infinite() #10000 |  <- STACK FULL!
//  +-------------------+
//  | infinite() #9999  |
//  +-------------------+
//  | ...               |
//  +-------------------+
//  | infinite() #2     |
//  +-------------------+
//  | infinite() #1     |
//  +-------------------+
//  | main()            |
//  +-------------------+
//  RangeError: Maximum call stack size exceeded

// Demonstrate (safely):
function causeOverflow(n) {
    return causeOverflow(n + 1);  // No base case = infinite recursion
}

try {
    causeOverflow(0);
} catch (e) {
    console.log("  Error:", e.message);
    console.log("  Error type:", e.constructor.name);
}
console.log("");

// What's the maximum stack size?
function measureStackDepth(depth) {
    try {
        return measureStackDepth(depth + 1);
    } catch (e) {
        return depth;
    }
}

const maxDepth = measureStackDepth(0);
console.log(`  Maximum stack depth on this system: ~${maxDepth} frames`);
console.log("  (Varies by engine, OS, and frame size)");
console.log("  Typical range: 10,000 - 25,000 frames");
console.log("");

// ============================================================
// EXAMPLE 6 — Tail Call Optimization (TCO)
// Story: A computer science student at IISc Bangalore learns about TCO:
//   if the LAST thing a function does is call another function (tail
//   position), the engine can REUSE the current stack frame instead of
//   pushing a new one. This would allow infinite recursion without
//   stack overflow! But there's a catch — only Safari implements it.
// ============================================================

// WHY: TCO is an optimization defined in the ES2015 spec that would
// eliminate stack overflow for tail-recursive functions. Understanding
// why it mostly doesn't work helps you make practical decisions.

console.log("=== EXAMPLE 6: Tail Call Optimization ===");

// --- What is a Tail Call? ---
// A function call in "tail position" = the LAST thing the function does
// No more computation after the call returns

// TAIL CALL (last operation is the recursive call):
function factorialTail(n, accumulator = 1) {
    if (n <= 1) return accumulator;
    return factorialTail(n - 1, n * accumulator);  // Tail position!
    // Nothing happens after this call returns — the engine COULD reuse the frame
}

// NOT A TAIL CALL (multiplication happens AFTER the recursive call):
function factorialNonTail(n) {
    if (n <= 1) return 1;
    return n * factorialNonTail(n - 1);  // NOT tail position!
    // The engine must keep this frame to multiply n * result
}

// --- TCO: Reuse the frame ---
//
// Without TCO (normal):              With TCO:
//
// factorial(5)                        factorial(5, 1)
//   factorial(4)                        -> factorial(4, 5)    [reuse frame]
//     factorial(3)                        -> factorial(3, 20)   [reuse frame]
//       factorial(2)                        -> factorial(2, 60)  [reuse frame]
//         factorial(1)                        -> factorial(1, 120) [reuse frame]
//         return 1                            return 120
//       return 2                          (Only ONE frame used!)
//     return 6
//   return 24
// return 120
// (5 frames used)

console.log("  Tail-recursive factorial(10):", factorialTail(10));
console.log("  Non-tail factorial(10):", factorialNonTail(10));
console.log("");

// TCO status across engines:
console.log("  TCO implementation status:");
console.log("  +------------------+--------+");
console.log("  | Engine           | TCO?   |");
console.log("  +------------------+--------+");
console.log("  | V8 (Chrome/Node) | NO     |  <- Removed after brief experiment");
console.log("  | SpiderMonkey     | NO     |");
console.log("  | JavaScriptCore   | YES    |  <- Safari only engine with TCO!");
console.log("  | Chakra           | NO     |");
console.log("  +------------------+--------+");
console.log("");
console.log("  V8 removed TCO because:");
console.log("  1. Harder to debug (stack frames disappear)");
console.log("  2. Implicit optimization (devs don't know it's happening)");
console.log("  3. Performance overhead for the check itself");
console.log("");

// ============================================================
// EXAMPLE 7 — Converting Recursion to Iteration
// Story: At Myntra, a developer had a recursive function to flatten
//   nested category trees. It crashed on deeply nested categories.
//   They converted it to an iterative version using a manual stack
//   (an array), eliminating the stack overflow risk entirely.
// ============================================================

// WHY: Since TCO isn't reliable, the practical solution for deep
// recursion is converting to iteration. This is a critical skill.

console.log("=== EXAMPLE 7: Recursion -> Iteration ===");

// Recursive Fibonacci (naive, exponential time, stack overflow risk)
function fibRecursive(n) {
    if (n <= 1) return n;
    return fibRecursive(n - 1) + fibRecursive(n - 2);
}

// Iterative Fibonacci (O(n) time, O(1) space, no stack risk)
function fibIterative(n) {
    if (n <= 1) return n;
    let prev = 0, curr = 1;
    for (let i = 2; i <= n; i++) {
        const next = prev + curr;
        prev = curr;
        curr = next;
    }
    return curr;
}

// Compare:
console.log("  Fibonacci(10) recursive:", fibRecursive(10));
console.log("  Fibonacci(10) iterative:", fibIterative(10));

// Performance comparison:
const recStart = process.hrtime.bigint();
for (let i = 0; i < 1000; i++) fibRecursive(20);
const recEnd = process.hrtime.bigint();

const iterStart = process.hrtime.bigint();
for (let i = 0; i < 1000; i++) fibIterative(20);
const iterEnd = process.hrtime.bigint();

console.log(`  Recursive fib(20) x 1000: ${Number(recEnd - recStart) / 1_000_000}ms`);
console.log(`  Iterative fib(20) x 1000: ${Number(iterEnd - iterStart) / 1_000_000}ms`);
console.log("  Iterative is dramatically faster and won't overflow.");
console.log("");

// Converting recursive tree traversal to iterative:
function flattenRecursive(node) {
    const result = [node.name];
    if (node.children) {
        for (const child of node.children) {
            result.push(...flattenRecursive(child));
        }
    }
    return result;
}

function flattenIterative(root) {
    const result = [];
    const stack = [root];  // Manual stack (array)

    while (stack.length > 0) {
        const node = stack.pop();  // Pop from our manual stack
        result.push(node.name);
        if (node.children) {
            // Push children in reverse order so we process left-to-right
            for (let i = node.children.length - 1; i >= 0; i--) {
                stack.push(node.children[i]);
            }
        }
    }
    return result;
}

const tree = {
    name: "Electronics",
    children: [
        { name: "Phones", children: [
            { name: "Apple" }, { name: "Samsung" }, { name: "OnePlus" },
        ]},
        { name: "Laptops", children: [
            { name: "Dell" }, { name: "HP" },
        ]},
    ],
};

console.log("  Recursive flatten:", flattenRecursive(tree));
console.log("  Iterative flatten:", flattenIterative(tree));
console.log("");

// ============================================================
// EXAMPLE 8 — The Trampoline Pattern
// Story: At Zoho, the CRM application needed to process deeply recursive
//   organizational hierarchies (CEO -> VPs -> Directors -> Managers ->
//   Team Leads -> Engineers). Instead of risking stack overflow, they
//   used the trampoline pattern: a loop that "bounces" between function
//   calls, keeping the stack depth constant.
// ============================================================

// WHY: The trampoline pattern is an elegant workaround for the lack of TCO.
// It converts deep recursion into a loop that maintains only one frame.

console.log("=== EXAMPLE 8: Trampoline Pattern ===");

// The trampoline: a loop that executes thunks (deferred function calls)
function trampoline(fn) {
    let result = fn;
    while (typeof result === 'function') {
        result = result();  // "Bounce" — call the returned function
    }
    return result;
}

// Regular recursive factorial (will overflow for large n):
function regularFactorial(n) {
    if (n <= 1) return 1;
    return n * regularFactorial(n - 1);
}

// Trampolined factorial (won't overflow for any n):
function trampolinedFactorial(n, acc = 1) {
    if (n <= 1) return acc;
    // Instead of calling recursively, RETURN A FUNCTION (a thunk)
    return () => trampolinedFactorial(n - 1, n * acc);
}

console.log("  Regular factorial(10):", regularFactorial(10));
console.log("  Trampolined factorial(10):", trampoline(() => trampolinedFactorial(10)));

// The trampoline keeps the stack at depth 1:
//
// Without trampoline:              With trampoline:
//
// factorial(5)                     trampoline loop:
//   factorial(4)                     -> call thunk (n=5)
//     factorial(3)                   -> call thunk (n=4)
//       factorial(2)                 -> call thunk (n=3)
//         factorial(1)               -> call thunk (n=2)
//         return 1                   -> call thunk (n=1)
//       return 2                     -> return 120
//     return 6                     Stack depth: always 2 (trampoline + thunk)
//   return 24
// return 120
// Stack depth: 5

// Test with large numbers:
const bigResult = trampoline(() => trampolinedFactorial(100));
console.log("  Trampolined factorial(100):", bigResult.toString().substring(0, 30) + "...");
console.log("  (No stack overflow even for factorial(100)!)");
console.log("");

// ============================================================
// EXAMPLE 9 — Async and the Call Stack
// Story: At Swiggy, when a user places an order, the checkout function
//   calls validatePayment(), which makes an API call. The API callback
//   does NOT run on the same call stack as the checkout function.
//   It runs on a FRESH call stack, managed by the event loop. This is
//   why async errors don't appear in synchronous stack traces.
// ============================================================

// WHY: Understanding how async callbacks relate to the call stack is
// crucial. Async callbacks DON'T run in the same stack as their caller.
// They run on a fresh stack, scheduled by the event loop.

console.log("=== EXAMPLE 9: Async and the Call Stack ===");

// --- Synchronous: same stack ---
//
// main() -> checkout() -> validatePayment() -> all on SAME stack
//
// --- Asynchronous: different stack ---
//
// Stack 1 (synchronous):
// main() -> checkout() -> scheduleAPI()   <- stack clears here
//
// ...time passes... event loop picks up callback...
//
// Stack 2 (callback):
// apiCallback() -> processResponse()      <- FRESH stack!

function synchronousFlow() {
    console.log("  [sync] Step 1: Start checkout");
    console.log("  [sync] Step 2: Validate (same stack)");
    console.log("  [sync] Step 3: Calculate total (same stack)");
}

function asynchronousFlow() {
    console.log("  [async] Step 1: Start checkout");
    setTimeout(() => {
        // This runs on a COMPLETELY NEW call stack!
        console.log("  [async] Step 3: Callback runs (NEW stack!)");
    }, 0);
    console.log("  [async] Step 2: setTimeout scheduled, stack continues");
    // When this function returns, the call stack is EMPTY
    // Then the event loop picks up the setTimeout callback
    // and puts it on a FRESH call stack
}

synchronousFlow();
console.log("");
asynchronousFlow();
console.log("");

// Give setTimeout a chance to fire:
setTimeout(() => {
    console.log("  [async] Note: callbacks run AFTER the current stack clears");
    console.log("");

    // Continue with examples after async
    runRemainingExamples();
}, 10);

function runRemainingExamples() {

// ============================================================
// EXAMPLE 10 — Stack Depth and Memory
// Story: At Urban Company, a recursive service matching algorithm was
//   consuming excessive memory because each stack frame held a large
//   object. Even though the recursion depth was only 500, the memory
//   usage was significant because stack frames include local variables.
// ============================================================

// WHY: Stack frames consume memory. Deeper stacks = more memory.
// Large local variables in recursive functions multiply the problem.

console.log("=== EXAMPLE 10: Stack Depth and Memory ===");

// Each stack frame holds:
// - Function reference (~8 bytes)
// - Return address (~8 bytes)
// - Arguments (~8 bytes per argument)
// - Local variables (varies)
// - Execution context overhead

// Small frames allow deeper recursion:
function tinyFrame(n) {
    if (n <= 0) return 0;
    return tinyFrame(n - 1);
}

// Large frames exhaust the stack sooner:
function largeFrame(n) {
    // eslint-disable-next-line no-unused-vars
    const bigArray = new Array(1000).fill(0); // ~8KB per frame
    if (n <= 0) return 0;
    return largeFrame(n - 1);
}

function measureDepth(fn) {
    let depth = 0;
    try {
        function recurse(n) {
            depth = n;
            if (fn === 'tiny') {
                return recurse(n + 1);
            } else {
                // eslint-disable-next-line no-unused-vars
                const arr = new Array(100).fill(0);
                return recurse(n + 1);
            }
        }
        recurse(0);
    } catch (e) {
        return depth;
    }
}

const tinyDepth = measureDepth('tiny');
const largeDepth = measureDepth('large');

console.log(`  Tiny frames max depth:  ~${tinyDepth}`);
console.log(`  Large frames max depth: ~${largeDepth}`);
console.log(`  Larger local variables = fewer frames before overflow`);
console.log("");

// ============================================================
// EXAMPLE 11 — Practical: Recursive vs Iterative Fibonacci
// Story: In a coding challenge at a Bangalore startup, two developers
//   implement Fibonacci: one recursively (elegant but slow) and one
//   iteratively (ugly but fast). The recursive version has O(2^n) time
//   complexity and risks stack overflow. The iterative version is O(n)
//   with O(1) space.
// ============================================================

console.log("=== EXAMPLE 11: Fibonacci Showdown ===");

// Recursive (with memoization to make it practical)
function fibMemo(n, memo = {}) {
    if (n <= 1) return n;
    if (memo[n]) return memo[n];
    memo[n] = fibMemo(n - 1, memo) + fibMemo(n - 2, memo);
    return memo[n];
}

// Iterative
function fibIter(n) {
    if (n <= 1) return n;
    let a = 0, b = 1;
    for (let i = 2; i <= n; i++) {
        [a, b] = [b, a + b];
    }
    return b;
}

// Generator-based (lazy, memory efficient)
function* fibGenerator() {
    let a = 0, b = 1;
    while (true) {
        yield a;
        [a, b] = [b, a + b];
    }
}

console.log("  fib(40) memoized:", fibMemo(40));
console.log("  fib(40) iterative:", fibIter(40));

// Generator: get first 10
const gen = fibGenerator();
const first10 = [];
for (let i = 0; i < 10; i++) first10.push(gen.next().value);
console.log("  First 10 (generator):", first10);

// Performance:
const memoStart = process.hrtime.bigint();
for (let i = 0; i < 10000; i++) fibMemo(40);
const memoEnd = process.hrtime.bigint();

const iterStart2 = process.hrtime.bigint();
for (let i = 0; i < 10000; i++) fibIter(40);
const iterEnd2 = process.hrtime.bigint();

console.log(`  Memoized x 10,000: ${Number(memoEnd - memoStart) / 1_000_000}ms`);
console.log(`  Iterative x 10,000: ${Number(iterEnd2 - iterStart2) / 1_000_000}ms`);
console.log("  Iterative wins: no recursion overhead, no stack risk.");
console.log("");

// ============================================================
// EXAMPLE 12 — Reading Stack Traces Like a Pro
// Story: At Amazon India (Hyderabad office), a production bug showed
//   a stack trace 15 frames deep. A senior engineer taught the team
//   how to read it: start from the BOTTOM (entry point), read UP to
//   the TOP (where the error occurred), and focus on YOUR code files
//   (not node_modules or engine internals).
// ============================================================

console.log("=== EXAMPLE 12: Reading Stack Traces ===");

function createPayment(amount) {
    return processPayment(amount);
}

function processPayment(amount) {
    return validateAmount(amount);
}

function validateAmount(amount) {
    if (amount <= 0) {
        // The error captures the stack trace at this point
        throw new Error(`Invalid amount: ${amount}`);
    }
    return true;
}

try {
    createPayment(-500);
} catch (e) {
    console.log("  Error:", e.message);
    console.log("  Stack trace:");
    const lines = e.stack.split('\n');
    lines.forEach((line, i) => {
        if (i === 0) {
            console.log(`  ${line}  <-- The error message`);
        } else if (i <= 4) {
            console.log(`  ${line}  <-- Frame ${i}`);
        }
    });
}
console.log("");

console.log("  How to read a stack trace:");
console.log("  1. TOP line = the error message");
console.log("  2. Second line = where the error OCCURRED");
console.log("  3. Lines below = callers, going deeper to entry point");
console.log("  4. BOTTOM = entry point (main script)");
console.log("  5. Filter out node_modules and engine frames");
console.log("  6. Focus on YOUR code files");
console.log("");

// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. The call stack is a LIFO structure: function call = push frame,
//    function return = pop frame. Only the TOP frame is executing.
//
// 2. Each stack frame contains: function reference, return address,
//    arguments, local variables, and execution context.
//
// 3. JavaScript is single-threaded: ONE call stack, ONE piece of code
//    running at a time. Async callbacks run on FRESH stacks.
//
// 4. Stack overflow (RangeError) happens when recursion is too deep.
//    Max depth: ~10,000-25,000 frames depending on engine and frame size.
//
// 5. Tail Call Optimization (TCO) is in the ES2015 spec but only Safari
//    implements it. V8 (Chrome/Node) does NOT support TCO.
//
// 6. Convert recursion to iteration to avoid stack overflow.
//    Use manual stacks (arrays) for tree/graph traversal.
//
// 7. The trampoline pattern converts recursive functions to loops,
//    keeping stack depth constant regardless of recursion depth.
//
// 8. Use console.trace() and Error.stack to inspect the call stack.
//    Read stack traces bottom-to-top: entry point -> error location.
// ============================================================

console.log("=== KEY TAKEAWAYS ===");
console.log("1. Call stack = LIFO: push on call, pop on return");
console.log("2. Frame = function + return address + locals + context");
console.log("3. Single-threaded: one stack, one thing at a time");
console.log("4. Stack overflow: infinite recursion or too-deep recursion");
console.log("5. TCO: spec says yes, only Safari does it, V8 doesn't");
console.log("6. Convert recursion to iteration for safety");
console.log("7. Trampoline pattern: recursion without growing stack");
console.log("8. console.trace() and Error.stack for debugging");

} // end runRemainingExamples
