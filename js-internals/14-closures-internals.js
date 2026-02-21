// ============================================================
// FILE 14: CLOSURES INTERNALS IN V8
// Topic: How V8 stores closures, Context objects, and memory implications
// WHY: Every "Add to Cart" button, every event handler, every
// callback creates a closure. V8 allocates heap-based Context
// objects to keep captured variables alive. Understanding this
// reveals why some patterns silently leak megabytes of memory.
// ============================================================

// ============================================================
// EXAMPLE 1 — Myntra's Product Grid
// Story: Myntra displays 50+ products on a single page. Each
// product card has an "Add to Cart" button with a click handler
// that captures that product's ID, price, and seller info.
// That's 50 closures, each holding references via V8 Context
// objects on the heap.
// ============================================================

// WHY: A closure is a function + a reference to a V8 Context
// object on the heap that holds captured variables.

// --- What is a Closure? (At the Engine Level) ---
function createProductHandler(productId, price) {
    // V8 creates a Context object on the heap: { productId, price }
    return function addToCart() {
        // This function has a hidden [[Environment]] slot
        // pointing to the Context object above
        console.log(`Adding product ${productId} (Rs.${price}) to cart`);
    };
}

const handler1 = createProductHandler("SHIRT-001", 999);
const handler2 = createProductHandler("JEANS-002", 1499);
handler1();  // Adding product SHIRT-001 (Rs.999) to cart
handler2();  // Adding product JEANS-002 (Rs.1499) to cart

// ============================================================
// EXAMPLE 2 — V8's Context Object Deep Dive
// Story: Myntra's recommendation engine creates closures for each
// panel. Memory grew unexpectedly. Understanding V8's Context
// object explained why.
// ============================================================

// WHY: When inner functions capture variables, V8 creates a Context
// object on the HEAP. It survives the function call.

console.log("\n" + "=".repeat(60));
console.log("V8 CONTEXT OBJECTS");
console.log("=".repeat(60));

// ASCII Diagram: Stack Frame vs Context Object
//   STACK (short-lived)              HEAP (long-lived)
//   ┌─────────────────┐
//   │ createHandler()  │            ┌────────────────────┐
//   │  productId ──────┼───────────►│ Context Object     │
//   │  price ──────────┼───────────►│  productId: "X"    │
//   │  localVar = 42   │            │  price: 999        │
//   └─────────────────┘            └──────────┬─────────┘
//   (gone after return)                        │
//                                   handler.[[Environment]]
//   The Context stays alive because handler references it.

function demonstrateContext() {
    let captured = "I live on the heap!";
    let notCaptured = "I die with the stack frame";
    // V8 only puts 'captured' in the Context (escape analysis)
    return function inner() { console.log(captured); };
}

const fn = demonstrateContext();
fn();  // "I live on the heap!"

// ============================================================
// EXAMPLE 3 — Context Chain (Nested Closures)
// Story: Myntra's filter system: category → brand → price.
// Each level captures variables, forming a chain of Contexts.
// ============================================================

// WHY: Nested closures create a CHAIN of Context objects.
// Variable lookup walks this chain (like the prototype chain).

console.log("\n" + "=".repeat(60));
console.log("CONTEXT CHAIN");
console.log("=".repeat(60));

function categoryFilter(category) {
    return function brandFilter(brand) {
        return function priceFilter(maxPrice) {
            // Walks: Context 3 → 2 → 1 to find 'category'
            console.log(`Filter: ${category} > ${brand} < Rs.${maxPrice}`);
        };
    };
}

const myntraFilter = categoryFilter("Shirts")("Nike");
myntraFilter(2000);

//   priceFilter.[[Environment]] → Context 3: { maxPrice }
//     → parent → Context 2: { brand }
//       → parent → Context 1: { category }
//         → parent → Global Context

// ============================================================
// EXAMPLE 4 — The Shared Context Problem
// Story: Myntra's product card creates multiple handlers in one
// function. ALL handlers share a SINGLE Context — even if each
// only uses one variable from it.
// ============================================================

// WHY: V8 creates ONE shared Context per scope. ALL inner
// functions reference it. This causes "accidental capture."

console.log("\n" + "=".repeat(60));
console.log("SHARED CONTEXT PROBLEM");
console.log("=".repeat(60));

function createProductCard(product) {
    const name = product.name;
    const price = product.price;
    const hugeImageData = new Array(100000).fill(0);  // 800KB+

    function getName() { return name; }
    function getPrice() { return price; }
    function getImage() { return hugeImageData.length; }

    // ALL three share ONE Context: { name, price, hugeImageData }
    // Even if we only keep getName(), hugeImageData stays alive!
    return { getName, getPrice, getImage };
}

const card = createProductCard({ name: "T-Shirt", price: 999 });
console.log("Name:", card.getName(), "Price:", card.getPrice());

//   SHARED Context Object
//   ┌──────────────────────────────┐
//   │ name: "T-Shirt"              │
//   │ price: 999                   │
//   │ hugeImageData: Array(100000) │  ← stuck in memory!
//   └───────┬──────────┬──────────┬┘
//   getName.[[Env]]  getPrice  getImage

console.log("WARNING: All inner functions share ONE Context");
console.log("hugeImageData stays alive even if getImage is unused!");

// ============================================================
// EXAMPLE 5 — The Accidental Capture Problem
// Story: Myntra's team found a memory leak: a timer callback in
// the same scope as a large dataset kept it alive forever, even
// though the callback never used it.
// ============================================================

// WHY: Sibling functions share a Context. Capturing one variable
// forces ALL variables in that Context to stay alive.

console.log("\n" + "=".repeat(60));
console.log("ACCIDENTAL CAPTURE (MEMORY LEAK)");
console.log("=".repeat(60));

// --- THE LEAK ---
function setupPage_LEAKY() {
    const products = new Array(50000).fill({ name: "item" });  // ~4MB
    const pageTitle = "Myntra Sale";
    const timer = setInterval(() => {
        // Only uses pageTitle, but products is in the shared Context!
    }, 60000);
    return () => clearInterval(timer);
}

// --- THE FIX: separate scopes ---
function setupPage_FIXED() {
    const pageTitle = "Myntra Sale";
    const count = (function() {
        const products = new Array(50000).fill({ name: "item" });
        return products.length;  // products eligible for GC after this
    })();
    const timer = setInterval(() => {
        // pageTitle and count are small — no large capture
    }, 60000);
    return () => clearInterval(timer);
}

const cleanup1 = setupPage_LEAKY();
const cleanup2 = setupPage_FIXED();
cleanup1(); cleanup2();  // Clean up timers

console.log("LEAK: Large array in same scope as timer");
console.log("FIX: Move large data into separate function scope");

// ============================================================
// EXAMPLE 6 — eval() Forces Full Context Capture
// Story: Myntra's legacy code had eval() that forced V8 to
// capture EVERY variable, causing 10x memory usage.
// ============================================================

// WHY: eval() and `with` are scope-analysis killers. V8 can't
// determine what eval() might access, so it captures everything.

console.log("\n" + "=".repeat(60));
console.log("EVAL AND CONTEXT DEOPTIMIZATION");
console.log("=".repeat(60));

function normalClosure() {
    const a = 1, b = 2, hugeData = new Array(10000);
    return function() { return a; };  // Only 'a' captured
}

function evalClosure() {
    const a = 1, b = 2, hugeData = new Array(10000);
    return function(code) { return eval(code); };  // ALL captured
}

const normal = normalClosure();
const evalBased = evalClosure();
console.log("Normal captures only 'a':", normal());
console.log("eval captures everything:", evalBased("b"));  // 2
console.log("Even hugeData:", evalBased("hugeData.length"));  // 10000
console.log("NEVER use eval() inside closures!");

// ============================================================
// EXAMPLE 7 — [[Scopes]] — Inspecting Closures
// Story: Myntra's performance team uses Chrome DevTools to
// inspect what a function has closed over.
// ============================================================

// WHY: [[Scopes]] in DevTools shows the Context chain, helping
// debug memory leaks and verify V8's capture decisions.

console.log("\n" + "=".repeat(60));
console.log("[[SCOPES]] — INSPECTING CLOSURES");
console.log("=".repeat(60));

function outerScope() {
    const outerVar = "I'm in outer";
    return (function middleScope() {
        const middleVar = "I'm in middle";
        return function innerScope() {
            console.log(outerVar, middleVar);
        };
    })();
}

const deepClosure = outerScope();
deepClosure();

// In Chrome DevTools Console: console.dir(deepClosure)
//   [[Scopes]]: Scopes[3]
//     0: Closure (middleScope) {middleVar: "I'm in middle"}
//     1: Closure (outerScope) {outerVar: "I'm in outer"}
//     2: Global {...}
console.log("Use node --inspect + Chrome DevTools to see [[Scopes]]");

// ============================================================
// EXAMPLE 8 — Closure vs bind()
// Story: Myntra's React components use both .bind() and arrow
// functions. They have different internal mechanisms.
// ============================================================

// WHY: bind() creates a JSBoundFunction with stored this + args.
// Closures use Context objects. Different mechanisms, similar goals.

console.log("\n" + "=".repeat(60));
console.log("CLOSURE vs BIND()");
console.log("=".repeat(60));

function createHandlerClosure(id) {
    return function() { console.log("  Closure:", id); };
}
function genericHandler(id) { console.log("  Bind:", id); }

const closureH = createHandlerClosure("DRESS-003");
const boundH = genericHandler.bind(null, "DRESS-003");
closureH();  // Closure: function + Context { id }
boundH();    // Bind: JSBoundFunction + stored args

console.log("Closure: function + Context object (heap)");
console.log("Bind: JSBoundFunction + bound this + bound args");

// ============================================================
// EXAMPLE 9 — Arrow Functions Capture `this` via Closure
// Story: Myntra adopted arrow functions after ES6. Arrow
// functions capture `this` from the enclosing scope.
// ============================================================

// WHY: Arrow functions don't have their own `this`. They capture
// it via closure (stored in the Context object).

console.log("\n" + "=".repeat(60));
console.log("ARROW FUNCTIONS AND `this` CAPTURE");
console.log("=".repeat(60));

class ProductCard {
    constructor(name, price) { this.name = name; this.price = price; }
    setupHandlers() {
        const arrowH = () => console.log(`  Arrow: ${this.name} @ Rs.${this.price}`);
        const regularH = function() { console.log(`  Regular: ${this ? this.name : "undefined"}`); };
        return { arrowH, regularH };
    }
}

const pc = new ProductCard("Kurta", 1299);
const { arrowH, regularH } = pc.setupHandlers();
arrowH();     // Arrow: Kurta @ Rs.1299 (this is captured in Context)
regularH();   // Regular: undefined (this depends on call site)

// ============================================================
// EXAMPLE 10 — Memory Impact and Fixing Closure Leaks
// Story: Myntra's infinite scroll creates closures per product.
// After 1000 products, closures consume significant memory.
// ============================================================

console.log("\n" + "=".repeat(60));
console.log("MEMORY IMPLICATIONS AND FIXES");
console.log("=".repeat(60));

function simulateScroll(count) {
    const handlers = [];
    const memBefore = process.memoryUsage().heapUsed;
    for (let i = 0; i < count; i++) {
        const data = { id: `P-${i}`, desc: "A".repeat(1000) };
        handlers.push(() => data.id);
    }
    const memMB = ((process.memoryUsage().heapUsed - memBefore) / 1024 / 1024).toFixed(2);
    console.log(`${count} closures: ~${memMB} MB`);
    return handlers;
}

simulateScroll(5000);

// --- Fix patterns ---
console.log("\nFix 1: Nullify references when done");
function createDisposable() {
    let cache = new Array(100000).fill("data");
    return {
        use() { return cache ? cache.length : null; },
        dispose() { cache = null; console.log("  Cache freed"); }
    };
}
const disposable = createDisposable();
console.log("Before:", disposable.use());
disposable.dispose();
console.log("After:", disposable.use());

console.log("\nFix 2: Extract only needed data from closure scope");
console.log("Fix 3: Use event delegation (ONE handler for all products)");
console.log("Fix 4: Use WeakRef for non-critical cached data");

// ============================================================
// EXAMPLE 11 — Classic Loop Closure Problem
// Story: Myntra's legacy jQuery code had the classic var-in-loop
// closure bug. Understanding scope isolation fixes it.
// ============================================================

console.log("\n" + "=".repeat(60));
console.log("LOOP CLOSURE PROBLEM");
console.log("=".repeat(60));

// var: all closures share ONE variable (function-scoped)
const handlers = [];
for (var i = 0; i < 5; i++) {
    handlers.push(function() { return i; });
}
console.log("var loop:", handlers.map(h => h()));  // [5,5,5,5,5]

// let: each iteration gets its own Context with fresh binding
const handlersLet = [];
for (let k = 0; k < 5; k++) {
    handlersLet.push(function() { return k; });
}
console.log("let loop:", handlersLet.map(h => h()));  // [0,1,2,3,4]

// ASCII Diagram: let in for-loop
//   Iteration 0: Context { k: 0 } → closure captures this
//   Iteration 1: Context { k: 1 } → closure captures this
//   Iteration 2: Context { k: 2 } → closure captures this
//   Each iteration creates a FRESH Context

// ============================================================
// EXAMPLE 12 — Closure vs Class Performance
// Story: Myntra's SSR creates thousands of instances per request.
// Classes share methods via prototype; closures create new
// function objects per instance.
// ============================================================

console.log("\n" + "=".repeat(60));
console.log("CLOSURE vs CLASS PERFORMANCE");
console.log("=".repeat(60));

function createCounterClosure() {
    let count = 0;
    return { inc() { count++; }, get() { return count; } };
}

class CounterClass {
    #count = 0;
    inc() { this.#count++; }
    get() { return this.#count; }
}

const N = 100000;
console.time("Closure x" + N);
for (let i = 0; i < N; i++) createCounterClosure();
console.timeEnd("Closure x" + N);

console.time("Class x" + N);
for (let i = 0; i < N; i++) new CounterClass();
console.timeEnd("Class x" + N);

console.log("Classes share methods via prototype → less memory");
console.log("Closures create new function objects per instance");

// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. A closure is a function + reference to a V8 Context object
//    on the heap that holds captured variables.
//
// 2. V8 creates ONE shared Context per scope — ALL inner functions
//    share it. This causes "accidental capture."
//
// 3. The accidental capture problem: a timer using one variable
//    keeps ALL variables in the scope alive.
//
// 4. eval() forces V8 to capture EVERY variable (deoptimization).
//
// 5. Arrow functions capture `this` via closure (in Context),
//    unlike regular functions which get `this` at call time.
//
// 6. Fix leaks: nullify refs, separate scopes, WeakRef, or
//    event delegation instead of per-element closures.
//
// 7. Classes are more memory-efficient than closures for many
//    instances (shared methods via prototype).
// ============================================================

console.log("\n" + "=".repeat(60));
console.log("FILE 14 COMPLETE — Closures Internals");
console.log("=".repeat(60));
