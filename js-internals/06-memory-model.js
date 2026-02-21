// ============================================================
// FILE 06: JAVASCRIPT MEMORY MODEL
// Topic: How JavaScript organizes memory with Stack and Heap regions
// WHY: Every variable you create lives in memory — either on the Stack
//   (fast, small, automatic) or the Heap (flexible, large, garbage
//   collected). Misunderstanding this leads to subtle bugs: mutation
//   through shared references, unexpected object equality failures,
//   and memory leaks that crash production apps.
// ============================================================

// ============================================================
// EXAMPLE 1 — Paytm Wallet: Millions of Transaction Objects
// Story: Paytm processes millions of wallet transactions per day. Each
//   transaction is a JavaScript object stored on the Heap. The transaction
//   ID (a number) and the reference to the object live on the Stack. When
//   engineers didn't understand this distinction, they accidentally shared
//   references between concurrent request handlers, causing one user's
//   transaction to overwrite another's. Understanding stack vs heap is
//   not academic — it's the difference between correct and corrupted data
//   at India-scale.
// ============================================================

// WHY: Stack vs Heap is the fundamental memory distinction in JavaScript.
// Primitives go on the stack (copied by value). Objects go on the heap
// (accessed by reference). This determines everything about mutation,
// comparison, and garbage collection.

console.log("=== EXAMPLE 1: Stack vs Heap ===");
console.log("");

// --- Two Memory Regions ---
//
//  +========================+       +================================+
//  |       STACK            |       |          HEAP                  |
//  |  (static, fast, LIFO)  |       |  (dynamic, flexible, GC'd)    |
//  |========================|       |================================|
//  |                        |       |                                |
//  |  Primitives:           |       |  Objects:                      |
//  |  - numbers             |       |  - { key: value }             |
//  |  - strings (small)     |       |  - [arrays]                   |
//  |  - booleans            |       |  - functions                   |
//  |  - null                |       |  - Map, Set, WeakMap           |
//  |  - undefined           |       |  - RegExp                      |
//  |  - symbols             |       |  - Dates                       |
//  |  - bigints (small)     |       |  - Strings (large/dynamic)     |
//  |                        |       |                                |
//  |  References:           |       |                                |
//  |  - pointers to heap    |       |                                |
//  |    objects              |       |                                |
//  |                        |       |                                |
//  |  Stack frame data:     |       |                                |
//  |  - return addresses    |       |                                |
//  |  - local variables     |       |                                |
//  +========================+       +================================+
//
//  STACK properties:                 HEAP properties:
//  - Fixed size per frame            - Dynamic size
//  - LIFO allocation/dealloc         - Garbage collected
//  - Super fast access               - Slower access (pointer chase)
//  - Automatic cleanup on return     - Cleaned by GC (Orinoco in V8)
//  - Limited size (~1-8 MB)          - Large (up to system memory)

console.log("  STACK: primitives, references, frame data (fast, auto-cleanup)");
console.log("  HEAP:  objects, arrays, functions (flexible, garbage collected)");
console.log("");

// ============================================================
// EXAMPLE 2 — Primitives: Stored on Stack, Copied by Value
// Story: At CRED, a rewards calculation function takes a user's credit
//   score as input. When the function receives the score (a number),
//   it gets a COPY. Modifying the copy inside the function does NOT
//   affect the original variable. This is "pass by value" — and it
//   works this way because primitives live on the stack.
// ============================================================

// WHY: Primitives are the "safe" data types — copying is independent,
// comparison is by value, and you can't accidentally mutate someone
// else's variable. This is because they live on the stack.

console.log("=== EXAMPLE 2: Primitives on the Stack ===");

// The 7 primitive types:
// 1. number    - 42, 3.14, NaN, Infinity
// 2. string    - "hello", 'world', `template`
// 3. boolean   - true, false
// 4. null      - intentional absence of value
// 5. undefined - variable declared but not assigned
// 6. symbol    - Symbol('unique')
// 7. bigint    - 42n, BigInt(9007199254740991)

// Primitives are COPIED by value:
let a = 10;
let b = a;    // b gets a COPY of a's value

// --- Stack Memory ---
//
//  STACK:
//  +-------+-------+
//  | a     |  10   |  <- original
//  +-------+-------+
//  | b     |  10   |  <- INDEPENDENT copy
//  +-------+-------+

b = 99;  // Changing b does NOT affect a

console.log("  let a = 10; let b = a; b = 99;");
console.log("  a =", a);  // 10 (unchanged!)
console.log("  b =", b);  // 99 (independent copy)
console.log("");

// Same with strings:
let greeting = "Namaste";
let copy = greeting;
copy = "Hello";

console.log("  greeting =", greeting);  // "Namaste" (unchanged)
console.log("  copy =", copy);          // "Hello" (independent)
console.log("");

// Primitive comparison is by VALUE:
console.log("  5 === 5:", 5 === 5);                     // true (same value)
console.log('  "hello" === "hello":', "hello" === "hello"); // true (same value)
console.log("  true === true:", true === true);           // true
console.log("");

// ============================================================
// EXAMPLE 3 — Objects: Stored on Heap, Accessed by Reference
// Story: At Flipkart, a product object { name: "iPhone 15", price: 79999 }
//   is stored on the HEAP. The variable `product` on the STACK holds only
//   a REFERENCE (pointer) to the heap location. When another variable
//   `featured = product` is assigned, it copies the REFERENCE — not the
//   object. Now BOTH variables point to the SAME object in memory.
//   Modifying through one variable affects the other.
// ============================================================

// WHY: This is the source of the most common bugs in JavaScript.
// When you assign an object to another variable, you're copying
// the REFERENCE, not the object. Both variables point to the same
// heap memory. Mutation through one affects the other.

console.log("=== EXAMPLE 3: Objects on the Heap ===");

let obj1 = { name: "iPhone 15", price: 79999 };
let obj2 = obj1;  // Copies the REFERENCE, not the object!

// --- Memory Layout ---
//
//  STACK:                          HEAP:
//  +-------+---------+             +------------------------+
//  | obj1  | 0xABC   | ---------> | { name: "iPhone 15",  |
//  +-------+---------+        /   |   price: 79999 }      |
//  | obj2  | 0xABC   | ------/    +------------------------+
//  +-------+---------+
//
//  BOTH obj1 and obj2 hold 0xABC — the SAME heap address!
//  There is only ONE object in memory.

obj2.price = 84999;  // Modifying through obj2 ALSO changes obj1's view!

console.log("  let obj1 = { name: 'iPhone 15', price: 79999 };");
console.log("  let obj2 = obj1;");
console.log("  obj2.price = 84999;");
console.log("");
console.log("  obj1.price =", obj1.price);  // 84999 (CHANGED!)
console.log("  obj2.price =", obj2.price);  // 84999
console.log("  obj1 === obj2:", obj1 === obj2);  // true (same reference)
console.log("");

// Two objects with same content are NOT equal:
let objA = { x: 1 };
let objB = { x: 1 };

// --- Memory Layout ---
//
//  STACK:                          HEAP:
//  +-------+---------+             +----------+
//  | objA  | 0x111   | ---------> | { x: 1 } |  <- Object at 0x111
//  +-------+---------+             +----------+
//  | objB  | 0x222   | ---------> | { x: 1 } |  <- DIFFERENT object at 0x222
//  +-------+---------+             +----------+

console.log("  { x: 1 } === { x: 1 }:", objA === objB);  // false!
console.log("  (Different references, even though contents are identical)");
console.log("");

// ============================================================
// EXAMPLE 4 — Reference Behavior with Arrays
// Story: At Swiggy, the recommended restaurants list is an array stored
//   in state. A developer assigned `filteredList = recommendations` thinking
//   they'd get an independent copy. When they sorted filteredList,
//   the original recommendations ALSO got sorted — because arrays are
//   objects, and assignment copies the reference, not the array.
// ============================================================

// WHY: Arrays behave exactly like objects — they're on the heap,
// assigned by reference, and mutation through one reference affects all.

console.log("=== EXAMPLE 4: Array References ===");

const restaurants = ["Biryani House", "Dosa Corner", "Punjabi Dhaba"];
const filtered = restaurants;  // REFERENCE copy, not array copy!

filtered.push("Pizza Palace");

console.log("  Original:", restaurants);
// ["Biryani House", "Dosa Corner", "Punjabi Dhaba", "Pizza Palace"]
console.log("  Filtered:", filtered);
// Same! Because they're the SAME array

console.log("  restaurants === filtered:", restaurants === filtered);  // true
console.log("");

// Fix: Create an actual copy
const properCopy = [...restaurants];  // Spread creates a new array
properCopy.push("Sushi Bar");

console.log("  After spread copy:");
console.log("  Original:", restaurants);  // No "Sushi Bar"
console.log("  Copy:", properCopy);       // Has "Sushi Bar"
console.log("  restaurants === properCopy:", restaurants === properCopy);  // false
console.log("");

// ============================================================
// EXAMPLE 5 — Shallow Copy vs Deep Copy
// Story: At Razorpay, a merchant settings object had nested address
//   information. A developer used Object.assign() to copy the settings,
//   but then modifying the copy's address ALSO changed the original.
//   Object.assign() only does a SHALLOW copy — nested objects are still
//   shared by reference. They needed structuredClone() for a DEEP copy.
// ============================================================

// WHY: Understanding shallow vs deep copy is critical when working
// with nested objects. Shallow copies only copy one level deep —
// nested objects remain shared.

console.log("=== EXAMPLE 5: Shallow Copy vs Deep Copy ===");

// --- Shallow Copy ---
// Copies top-level properties. Nested objects are still shared.

const merchant = {
    name: "Chai Point",
    address: {
        city: "Bengaluru",
        pin: "560001",
    },
    plans: ["basic", "premium"],
};

// Method 1: Object.assign() — SHALLOW
const shallow1 = Object.assign({}, merchant);

// Method 2: Spread operator — SHALLOW
const shallow2 = { ...merchant };

// Modify nested object in the copy:
shallow1.address.city = "Mumbai";
shallow1.plans.push("enterprise");

console.log("  Original merchant.address.city:", merchant.address.city);
// "Mumbai" — CHANGED! Because address is shared.
console.log("  Shallow copy address.city:", shallow1.address.city);
// "Mumbai"

console.log("  Original merchant.plans:", merchant.plans);
// ["basic", "premium", "enterprise"] — CHANGED! Plans array is shared.
console.log("");

// --- Memory Diagram for Shallow Copy ---
//
//  merchant (stack)                    HEAP:
//  +----------+                        +----------------------------+
//  | 0xAAA    | ---------------------> | name: "Chai Point"         |
//  +----------+                        | address: 0xBBB ---------->+---------+
//                                      | plans: 0xCCC ------------>| [...]   |
//  shallow1 (stack)                    +----------------------------+  |
//  +----------+                        +----------------------------+  |
//  | 0xDDD    | ---------------------> | name: "Chai Point" (copy)  |  |
//  +----------+                        | address: 0xBBB ---> SAME! |  |
//                                      | plans: 0xCCC -----> SAME! |
//                                      +----------------------------+

// --- Deep Copy ---
// Creates completely independent copies of ALL levels.

// Reset merchant
merchant.address.city = "Bengaluru";
merchant.plans.length = 2; // Reset

// Method: structuredClone() — DEEP COPY (modern, recommended)
const deep = structuredClone(merchant);

deep.address.city = "Chennai";
deep.plans.push("enterprise");

console.log("  After structuredClone():");
console.log("  Original city:", merchant.address.city);  // "Bengaluru" (unchanged!)
console.log("  Deep copy city:", deep.address.city);      // "Chennai" (independent)
console.log("  Original plans:", merchant.plans);          // ["basic", "premium"]
console.log("  Deep copy plans:", deep.plans);             // ["basic", "premium", "enterprise"]
console.log("");

// Copy methods comparison:
console.log("  Copy Methods:");
console.log("  +---------------------+-------+-------+------------------+");
console.log("  | Method              | Depth | Speed | Handles          |");
console.log("  +---------------------+-------+-------+------------------+");
console.log("  | = assignment        | ref   | fast  | shares reference |");
console.log("  | Object.assign()     | 1     | fast  | top-level only   |");
console.log("  | { ...spread }       | 1     | fast  | top-level only   |");
console.log("  | JSON parse/stringify| all   | slow  | no funcs/dates   |");
console.log("  | structuredClone()   | all   | med   | most types       |");
console.log("  +---------------------+-------+-------+------------------+");
console.log("");

// ============================================================
// EXAMPLE 6 — Pass by Value vs Pass by Reference (Pass by Sharing)
// Story: At TCS, a training quiz asks: "Is JavaScript pass by value or
//   pass by reference?" The correct answer is nuanced: primitives are
//   passed by value (copy), objects are passed by "sharing" (the reference
//   is copied, but the object is not). You CAN mutate the original object
//   through the copy, but reassigning the parameter doesn't affect the
//   original variable.
// ============================================================

// WHY: "Pass by value vs reference" is one of the most asked interview
// questions. The answer reveals deep understanding of the memory model.

console.log("=== EXAMPLE 6: Pass by Value vs Pass by Sharing ===");

// PRIMITIVES: Pass by Value (copy of the value)
function tryToChange(num) {
    num = 999;  // Changes the LOCAL copy only
    console.log("  Inside function: num =", num);
}

let myNum = 42;
tryToChange(myNum);
console.log("  After function: myNum =", myNum);  // 42 (unchanged!)
console.log("");

// OBJECTS: Pass by Sharing (copy of the reference)
function mutateObject(obj) {
    obj.city = "Delhi";  // Mutates the ORIGINAL object through shared reference
    console.log("  Inside function (mutate): obj.city =", obj.city);
}

function reassignObject(obj) {
    obj = { city: "Chennai", brand: "new" };  // Reassigns LOCAL reference
    console.log("  Inside function (reassign): obj.city =", obj.city);
}

let myObj = { city: "Mumbai", brand: "original" };

mutateObject(myObj);
console.log("  After mutate: myObj.city =", myObj.city);  // "Delhi" (CHANGED!)

reassignObject(myObj);
console.log("  After reassign: myObj.city =", myObj.city);  // "Delhi" (NOT changed!)
console.log("  myObj.brand =", myObj.brand);  // "original" (NOT "new")
console.log("");

// --- Why Reassignment Doesn't Affect Original ---
//
//  Before reassign:
//  STACK:                   HEAP:
//  myObj  -> 0xAAA  ------> { city: "Delhi" }
//  obj    -> 0xAAA  --/     (parameter = copy of reference)
//
//  After obj = { new object }:
//  STACK:                   HEAP:
//  myObj  -> 0xAAA  ------> { city: "Delhi" }     (unchanged!)
//  obj    -> 0xBBB  ------> { city: "Chennai" }   (new object)
//
//  Reassigning obj changes the LOCAL copy of the reference.
//  myObj still points to the original object.

// ============================================================
// EXAMPLE 7 — Memory Layout Diagram
// Story: At Infosys' JavaScript training, an instructor draws a
//   comprehensive memory diagram showing how different data types
//   are laid out between stack and heap. This single diagram
//   clarifies 90% of memory-related confusion.
// ============================================================

// WHY: Visualizing the memory layout is the best way to understand
// how JavaScript manages data.

console.log("=== EXAMPLE 7: Complete Memory Layout ===");
console.log("");

let count = 42;
let name = "Priya";
let isActive = true;
let user = { name: "Priya", age: 25 };
let scores = [95, 87, 92];
let greetFn = function(n) { return "Hi " + n; };

console.log("  STACK                              HEAP");
console.log("  +----------+----------+            +---------------------------+");
console.log("  | count    |    42    |            |                           |");
console.log("  +----------+----------+            |  0xA01: {                 |");
console.log('  | name     | "Priya"  |            |    name: "Priya",         |');
console.log("  +----------+----------+            |    age: 25                |");
console.log("  | isActive |   true   |            |  }                        |");
console.log("  +----------+----------+            |                           |");
console.log("  | user     |  0xA01 ----------+--->|  0xA02: [95, 87, 92]     |");
console.log("  +----------+----------+   |        |                           |");
console.log("  | scores   |  0xA02 ------+------->|  0xA03: function(n) {    |");
console.log("  +----------+----------+   |        |    return 'Hi ' + n;     |");
console.log("  | greetFn  |  0xA03 ------+------->|  }                        |");
console.log("  +----------+----------+            +---------------------------+");
console.log("");
console.log("  Primitives (count, name, isActive) -> directly on stack");
console.log("  Objects (user, scores, greetFn) -> reference on stack, data on heap");
console.log("");

// ============================================================
// EXAMPLE 8 — String Interning in V8
// Story: At Zomato, every restaurant listing has a "cuisine" field.
//   Thousands of restaurants share the same cuisine strings: "North Indian",
//   "Chinese", "South Indian". V8 uses STRING INTERNING — it stores only
//   ONE copy of each unique string in memory and reuses it. This saves
//   significant memory when the same strings appear repeatedly.
// ============================================================

// WHY: V8 optimizes string storage. Identical strings MAY share the same
// memory location (interning). This explains some surprising behaviors
// with string comparison and memory usage.

console.log("=== EXAMPLE 8: String Interning ===");

// V8 interns strings that are:
// - String literals in source code
// - Property names (keys) of objects
// - Strings used as identifiers

// Two identical string literals MAY point to the same memory:
const str1 = "North Indian";
const str2 = "North Indian";
console.log("  str1 === str2:", str1 === str2);  // true
// V8 likely stores only ONE "North Indian" string and both reference it

// Dynamically created strings are different objects initially:
const str3 = "North" + " " + "Indian";  // Built at runtime
console.log("  str3 === str1:", str3 === str1);  // true (V8 may intern this too)

// String comparison is always by VALUE (not reference) regardless of interning
// Interning is purely a memory optimization — it doesn't affect behavior

console.log("  Strings are compared by VALUE, not by reference");
console.log("  Interning is a transparent memory optimization");
console.log("");

// ============================================================
// EXAMPLE 9 — SMI (Small Integer) Optimization
// Story: At PhonePe, the UPI transaction counter increments millions
//   of times. V8 stores small integers (SMI) directly on the stack
//   without allocating a heap object. Numbers within the SMI range
//   are "unboxed" — stored as raw values, not as heap-allocated Number
//   objects. This makes integer arithmetic incredibly fast.
// ============================================================

// WHY: V8 has a special optimization for small integers (SMI). They're
// stored as "tagged" values on the stack — no heap allocation needed.
// This makes integer arithmetic as fast as C++.

console.log("=== EXAMPLE 9: SMI Optimization ===");

// V8 internal number representations:
//
// +------------------+--------------------------------------------+
// | Type             | Storage                                    |
// +------------------+--------------------------------------------+
// | SMI (Small Int)  | Tagged pointer on stack (no heap alloc!)   |
// |                  | Range: -2^30 to 2^30-1 (32-bit)           |
// |                  | Range: -2^31 to 2^31-1 (64-bit)           |
// +------------------+--------------------------------------------+
// | HeapNumber       | Heap-allocated 64-bit float                |
// |                  | Used for: large ints, decimals, NaN, Inf   |
// +------------------+--------------------------------------------+

// SMI range on 64-bit systems: approximately -2^31 to 2^31 - 1
const smiMax = 2 ** 31 - 1;  // 2147483647
const smiMin = -(2 ** 31);   // -2147483648

console.log("  SMI range (64-bit): " + smiMin + " to " + smiMax);
console.log("");

// SMI arithmetic is faster because:
// 1. No heap allocation (saved as tagged value on stack)
// 2. No boxing/unboxing overhead
// 3. Direct CPU integer instructions

// Benchmark: SMI range vs HeapNumber
function sumSMI(n) {
    let total = 0;
    for (let i = 0; i < n; i++) {
        total = (total + i) | 0;  // | 0 keeps it as integer (hint to V8)
    }
    return total;
}

function sumFloat(n) {
    let total = 0.1;  // Force HeapNumber (decimal)
    for (let i = 0; i < n; i++) {
        total += i + 0.1;
    }
    return total;
}

const smiStart = process.hrtime.bigint();
sumSMI(10_000_000);
const smiEnd = process.hrtime.bigint();

const floatStart = process.hrtime.bigint();
sumFloat(10_000_000);
const floatEnd = process.hrtime.bigint();

console.log(`  SMI sum (integers):   ${Number(smiEnd - smiStart) / 1_000_000}ms`);
console.log(`  Float sum (decimals): ${Number(floatEnd - floatStart) / 1_000_000}ms`);
console.log("  Integer arithmetic is typically faster (SMI optimization).");
console.log("");

// ============================================================
// EXAMPLE 10 — typeof null === 'object': The Historical Bug
// Story: A developer at Wipro was debugging a null check:
//   `if (typeof value === 'object')` was true even when value was null!
//   This is a famous bug from the VERY FIRST JavaScript implementation
//   in 1995. The original engine used "type tags" at the bit level:
//   objects had tag 0, and null was represented as the NULL pointer (0x00).
//   Since null's bits looked like an object tag, typeof null returns "object".
//   It can never be fixed because too much existing code depends on it.
// ============================================================

// WHY: This is one of JavaScript's most famous quirks. Understanding
// the WHY (type tags in the original C implementation) turns a confusing
// quirk into an interesting piece of history.

console.log("=== EXAMPLE 10: typeof null === 'object' ===");

console.log("  typeof null:", typeof null);         // "object" (BUG!)
console.log("  typeof undefined:", typeof undefined); // "undefined"
console.log("  typeof 42:", typeof 42);               // "number"
console.log("  typeof 'hello':", typeof "hello");     // "string"
console.log("  typeof true:", typeof true);            // "boolean"
console.log("  typeof Symbol():", typeof Symbol());    // "symbol"
console.log("  typeof 42n:", typeof 42n);              // "bigint"
console.log("  typeof {}:", typeof {});                // "object"
console.log("  typeof []:", typeof []);                // "object" (arrays are objects!)
console.log("  typeof function(){}:", typeof function(){}); // "function"
console.log("");

// --- Original V8 C code type tags (simplified) ---
//
// 000 : object
// 001 : integer (31-bit signed)
// 010 : double
// 100 : string
// 110 : boolean
//
// null = machine code NULL pointer = 0x00000000
// Bits: 000 -> matches OBJECT tag!
// Hence: typeof null === "object"
//
// This was proposed to fix in ES2015 (typeof null === "null")
// but rejected because too much code in the wild depends on it.

// Safe null check:
function isObject(val) {
    return val !== null && typeof val === 'object';
}

console.log("  Safe object check: val !== null && typeof val === 'object'");
console.log("  isObject(null):", isObject(null));    // false
console.log("  isObject({}):", isObject({}));         // true
console.log("  isObject([]):", isObject([]));         // true (arrays ARE objects)
console.log("");

// ============================================================
// EXAMPLE 11 — Practical: Demonstrating Reference vs Copy
// Story: At Ola, two ride request handlers accidentally shared the
//   same rider object. When handler A updated the pickup location,
//   handler B's rider object changed too. The fix was simple:
//   create a new object for each handler instead of sharing.
// ============================================================

// WHY: This practical example demonstrates the real-world impact
// of reference sharing and how to prevent accidental mutation.

console.log("=== EXAMPLE 11: Reference vs Copy in Practice ===");

// BUG: Shared reference
function buggyProcess() {
    const riderTemplate = { name: "Rahul", pickup: "Koramangala", drop: "" };

    // Both handlers reference the SAME object!
    const handler1 = riderTemplate;
    const handler2 = riderTemplate;

    handler1.drop = "Whitefield";
    handler2.drop = "Electronic City";

    console.log("  BUGGY: handler1.drop =", handler1.drop);  // "Electronic City" (WRONG!)
    console.log("  BUGGY: handler2.drop =", handler2.drop);  // "Electronic City"
    console.log("  Both changed because they share the same object!");
}

// FIX: Create independent copies
function fixedProcess() {
    const riderTemplate = { name: "Rahul", pickup: "Koramangala", drop: "" };

    // Each handler gets its OWN copy
    const handler1 = { ...riderTemplate };
    const handler2 = { ...riderTemplate };

    handler1.drop = "Whitefield";
    handler2.drop = "Electronic City";

    console.log("  FIXED: handler1.drop =", handler1.drop);  // "Whitefield" (correct!)
    console.log("  FIXED: handler2.drop =", handler2.drop);  // "Electronic City" (correct!)
    console.log("  Independent copies, no shared mutation.");
}

buggyProcess();
console.log("");
fixedProcess();
console.log("");

// ============================================================
// EXAMPLE 12 — Mutation Through Shared References
// Story: At BookMyShow, the event details object is passed to multiple
//   functions: displayEvent(), addToCart(), sendAnalytics(). If any one
//   of these functions modifies the object, ALL of them see the change.
//   This can be a feature (intentional sharing) or a bug (accidental
//   mutation). Understanding references helps you choose deliberately.
// ============================================================

// WHY: Mutation through shared references is both a powerful feature
// and a common source of bugs. Knowing when to share and when to
// copy is a critical skill.

console.log("=== EXAMPLE 12: Mutation Through Shared References ===");

const event = {
    title: "Arijit Singh Live",
    venue: "JLN Stadium, Delhi",
    tickets: { available: 5000, sold: 0 },
};

function sellTicket(evt, quantity) {
    evt.tickets.sold += quantity;
    evt.tickets.available -= quantity;
    // MUTATES the original object through the shared reference
}

function displayStatus(evt) {
    console.log(`  ${evt.title} at ${evt.venue}`);
    console.log(`  Available: ${evt.tickets.available}, Sold: ${evt.tickets.sold}`);
}

displayStatus(event);
sellTicket(event, 100);
console.log("  After selling 100 tickets:");
displayStatus(event);
sellTicket(event, 250);
console.log("  After selling 250 more:");
displayStatus(event);
console.log("");

// Intentional sharing: useful for state management
// Accidental sharing: source of bugs
// Defensive programming: copy when you need independence

// ============================================================
// EXAMPLE 13 — Object.freeze() and Immutability
// Story: At Zerodha, stock exchange market data should NEVER be modified
//   by application code — it should be read-only. They use Object.freeze()
//   to prevent accidental mutations. But freeze is SHALLOW — nested
//   objects can still be mutated unless you deep-freeze.
// ============================================================

// WHY: Object.freeze() provides shallow immutability. Understanding
// its limitations (shallow only) is crucial for preventing mutations.

console.log("=== EXAMPLE 13: Object.freeze() ===");

const marketData = Object.freeze({
    nifty: 22500,
    sensex: 74000,
    metadata: { timestamp: "2024-01-15", exchange: "NSE" },
});

// Attempting to modify frozen properties SILENTLY FAILS (or throws in strict mode):
marketData.nifty = 99999;  // Silently ignored!
console.log("  After trying to change nifty:", marketData.nifty);  // 22500 (unchanged)

// BUT nested objects are NOT frozen:
marketData.metadata.timestamp = "HACKED";
console.log("  After changing nested timestamp:", marketData.metadata.timestamp);  // "HACKED"
console.log("  Object.freeze() is SHALLOW — nested objects are still mutable!");
console.log("");

// Deep freeze utility:
function deepFreeze(obj) {
    Object.freeze(obj);
    Object.keys(obj).forEach(key => {
        if (typeof obj[key] === 'object' && obj[key] !== null && !Object.isFrozen(obj[key])) {
            deepFreeze(obj[key]);
        }
    });
    return obj;
}

const fullyFrozen = deepFreeze({
    index: "Nifty",
    value: 22500,
    components: { top: "Reliance", second: "TCS" },
});

fullyFrozen.value = 0;
fullyFrozen.components.top = "HACKED";
console.log("  Deep frozen value:", fullyFrozen.value);          // 22500 (safe!)
console.log("  Deep frozen nested:", fullyFrozen.components.top); // "Reliance" (safe!)
console.log("");

// ============================================================
// EXAMPLE 14 — Equality and References
// Story: A junior developer at Accenture was confused why two objects
//   with identical contents were not "equal." The answer: === on objects
//   compares REFERENCES (memory addresses), not contents. To compare
//   contents, you need custom comparison or JSON.stringify().
// ============================================================

console.log("=== EXAMPLE 14: Equality with Objects ===");

const cart1 = { items: ["dosa", "chai"], total: 150 };
const cart2 = { items: ["dosa", "chai"], total: 150 };
const cart3 = cart1;

console.log("  cart1 === cart2:", cart1 === cart2);  // false (different references!)
console.log("  cart1 === cart3:", cart1 === cart3);  // true (same reference)
console.log("");

// Content comparison options:
console.log("  Content comparison methods:");
console.log("  JSON.stringify:", JSON.stringify(cart1) === JSON.stringify(cart2)); // true
console.log("  (Works for simple objects, but key order matters and no functions/undefined)");
console.log("");

// Robust comparison:
function deepEqual(a, b) {
    if (a === b) return true;
    if (typeof a !== 'object' || typeof b !== 'object') return false;
    if (a === null || b === null) return false;
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    return keysA.every(key => deepEqual(a[key], b[key]));
}

console.log("  deepEqual(cart1, cart2):", deepEqual(cart1, cart2)); // true
console.log("  deepEqual(cart1, { items: ['dosa'] }):", deepEqual(cart1, { items: ['dosa'] })); // false
console.log("");

// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. Two memory regions: STACK (primitives, references, fast, automatic)
//    and HEAP (objects, arrays, functions, flexible, garbage collected).
//
// 2. Primitives are stored on the stack and copied BY VALUE.
//    `let b = a` creates an independent copy. Changing b doesn't affect a.
//
// 3. Objects are stored on the heap, with references on the stack.
//    `let obj2 = obj1` copies the REFERENCE. Both point to the SAME object.
//    Mutation through one affects the other.
//
// 4. `===` on objects compares REFERENCES (memory addresses), not contents.
//    Two objects with identical contents are NOT equal unless same reference.
//
// 5. Shallow copy (Object.assign, spread) copies top-level properties only.
//    Deep copy (structuredClone) creates fully independent copies.
//
// 6. "Pass by sharing": primitives are passed by value, objects pass a copy
//    of the reference. You CAN mutate through it, but reassignment is local.
//
// 7. V8 optimizations: SMI for small integers (no heap allocation),
//    string interning (share identical strings).
//
// 8. typeof null === 'object' is a historical bug from 1995 (type tags).
//    Always check: val !== null && typeof val === 'object'.
// ============================================================

console.log("=== KEY TAKEAWAYS ===");
console.log("1. Stack = primitives + references (fast). Heap = objects (flexible).");
console.log("2. Primitives: copied by value. Independent copies.");
console.log("3. Objects: reference copied. Both variables share same heap object.");
console.log("4. === on objects compares references, NOT contents.");
console.log("5. Shallow copy (spread) vs Deep copy (structuredClone).");
console.log("6. Pass by sharing: can mutate object, but reassignment is local.");
console.log("7. V8: SMI optimization for small ints, string interning.");
console.log("8. typeof null === 'object' — historical bug, use null check.");
