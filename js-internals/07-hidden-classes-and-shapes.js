// ============================================================
// FILE 07: HIDDEN CLASSES AND SHAPES
// Topic: How V8 organizes objects internally for fast property access
// WHY: Every JavaScript object you create gets a hidden blueprint
//   called a "hidden class" (or "Shape" / "Map" in V8 terminology).
//   Understanding this unlocks why some code patterns are 10x faster
//   and why property order matters more than you ever imagined.
// ============================================================

// ============================================================
// EXAMPLE 1 — Flipkart Product Catalog: Millions of Same-Shape Objects
// Story: Flipkart's catalog has 150+ million products. Each product
//   object has the same structure: {id, name, price, category}.
//   When V8 sees millions of objects with identical shape, it creates
//   ONE hidden class and reuses it — turning property access into a
//   simple memory offset calculation instead of a dictionary lookup.
// ============================================================

// WHY: V8 doesn't store properties like a dictionary (hash map) by default.
// It tries to be smarter — it creates a "hidden class" that describes the
// layout of an object, just like a C struct describes memory layout.

// --- What is a Hidden Class? ---
// A hidden class (internally called "Map" in V8, "Shape" in SpiderMonkey)
// is a descriptor that tells V8:
//   1. What properties does this object have?
//   2. In what ORDER were they added?
//   3. At what OFFSET in memory is each property stored?

// Think of it as a blueprint:
//
//   Hidden Class HC0: {}
//     - no properties
//     - transition: add "id" → go to HC1
//
//   Hidden Class HC1: {id}
//     - id at offset 0
//     - transition: add "name" → go to HC2
//
//   Hidden Class HC2: {id, name}
//     - id at offset 0
//     - name at offset 1
//     - transition: add "price" → go to HC3
//
//   Hidden Class HC3: {id, name, price}
//     - id at offset 0
//     - name at offset 1
//     - price at offset 2

// --- Creating Objects with the Same Shape ---
function createProduct(id, name, price) {
    const product = {};
    product.id = id;       // {} → {id}         HC0 → HC1
    product.name = name;   // {id} → {id,name}  HC1 → HC2
    product.price = price; // {id,name} → {id,name,price} HC2 → HC3
    return product;
}

const product1 = createProduct(1, "iPhone 15", 79999);
const product2 = createProduct(2, "Samsung S24", 69999);
const product3 = createProduct(3, "Pixel 8", 59999);

// All three products share the SAME hidden class HC3!
// V8 knows: "id" is always at offset 0, "name" at offset 1, "price" at offset 2
// Accessing product2.price is just: go to offset 2 → done!

console.log("=== Same-Shape Products ===");
console.log("product1:", product1);  // {id: 1, name: 'iPhone 15', price: 79999}
console.log("product2:", product2);  // {id: 2, name: 'Samsung S24', price: 69999}
console.log("product3:", product3);  // {id: 3, name: 'Pixel 8', price: 59999}
console.log("All three share the same hidden class internally!\n");


// ============================================================
// EXAMPLE 2 — Swiggy Order System: Why Property Order Matters
// Story: Swiggy's backend creates order objects. One team writes
//   {orderId, restaurant, total} while another writes
//   {restaurant, orderId, total}. Same properties, different order —
//   V8 treats them as COMPLETELY different shapes, doubling memory
//   overhead and slowing down property access.
// ============================================================

// WHY: Hidden classes are determined by the ORDER in which properties
// are added, not just by which properties exist. This is one of the
// most counterintuitive facts about JavaScript engine internals.

// --- Transition Chain Diagram ---
//
//  Object A: {orderId, restaurant, total}
//
//  HC0: {}
//   │
//   ├──(add orderId)──→ HC1: {orderId}
//   │                     │
//   │                     ├──(add restaurant)──→ HC2: {orderId, restaurant}
//   │                                             │
//   │                                             ├──(add total)──→ HC3: {orderId, restaurant, total}
//   │
//  Object B: {restaurant, orderId, total}
//
//  HC0: {}
//   │
//   ├──(add restaurant)──→ HC4: {restaurant}
//                            │
//                            ├──(add orderId)──→ HC5: {restaurant, orderId}
//                                                 │
//                                                 ├──(add total)──→ HC6: {restaurant, orderId, total}
//
//  HC3 and HC6 are DIFFERENT hidden classes even though the
//  objects have the same properties!

// Demonstrating the problem:
function createOrderA(orderId, restaurant, total) {
    const order = {};
    order.orderId = orderId;         // property added first
    order.restaurant = restaurant;   // property added second
    order.total = total;             // property added third
    return order;
}

function createOrderB(orderId, restaurant, total) {
    const order = {};
    order.restaurant = restaurant;   // DIFFERENT order — restaurant first
    order.orderId = orderId;         // orderId second
    order.total = total;
    return order;
}

const orderA = createOrderA("ORD001", "Biryani Blues", 450);
const orderB = createOrderB("ORD002", "Pizza Hut", 799);

console.log("=== Property Order Matters ===");
console.log("orderA:", orderA);
console.log("orderB:", orderB);
console.log("Same properties, different hidden classes due to addition order!\n");


// ============================================================
// EXAMPLE 3 — Paytm Wallet: Inline Caches (ICs)
// Story: Paytm processes millions of wallet transactions per minute.
//   When a function like `getBalance(wallet)` always receives objects
//   with the same shape, V8's Inline Caches remember exactly where
//   the `balance` property is stored — no lookup needed. But if
//   wallet objects come in different shapes, the IC becomes
//   "megamorphic" and falls back to slow dictionary lookups.
// ============================================================

// WHY: Inline Caches are one of the most important optimizations in V8.
// They "remember" the hidden class of objects seen at a particular
// code location. If the same shape keeps appearing, access is instant.

// --- Monomorphic IC (1 shape — FAST) ---
// The function always sees the same hidden class → cache hit every time

function getBalance(wallet) {
    return wallet.balance;  // IC remembers: "balance is at offset 1 in HC7"
}

// All wallets have the same shape:
const wallet1 = { userId: "U001", balance: 5000 };
const wallet2 = { userId: "U002", balance: 12000 };
const wallet3 = { userId: "U003", balance: 800 };

console.log("=== Inline Caches: Monomorphic ===");
console.log("Balance 1:", getBalance(wallet1));  // 5000 — IC initialized
console.log("Balance 2:", getBalance(wallet2));  // 12000 — IC hit! Same shape
console.log("Balance 3:", getBalance(wallet3));  // 800 — IC hit! Same shape
console.log("All monomorphic — one shape, maximum speed!\n");

// --- Polymorphic IC (2-4 shapes — OKAY) ---
// The function sees a few different shapes → IC stores multiple entries

function getAmount(transaction) {
    return transaction.amount;
}

const txn1 = { amount: 500, type: "credit" };           // Shape A: {amount, type}
const txn2 = { amount: 200, method: "UPI", type: "debit" }; // Shape B: {amount, method, type}
const txn3 = { amount: 1000, type: "credit", note: "rent" }; // Shape C: {amount, type, note}

console.log("=== Inline Caches: Polymorphic ===");
console.log("Txn 1:", getAmount(txn1));  // 500 — IC sees Shape A
console.log("Txn 2:", getAmount(txn2));  // 200 — IC sees Shape B (different!)
console.log("Txn 3:", getAmount(txn3));  // 1000 — IC sees Shape C
console.log("Polymorphic — 3 shapes, still manageable\n");

// --- Megamorphic IC (5+ shapes — SLOW) ---
// The function sees too many different shapes → IC gives up, uses hash lookup

function getName(obj) {
    return obj.name;
}

// Each object has a different shape:
const shapes = [
    { name: "Alice" },
    { name: "Bob", age: 25 },
    { name: "Charlie", age: 30, city: "Delhi" },
    { name: "Diana", role: "admin" },
    { name: "Eve", score: 95, grade: "A" },
    { name: "Frank", x: 1, y: 2, z: 3 },
];

console.log("=== Inline Caches: Megamorphic ===");
shapes.forEach(obj => console.log("Name:", getName(obj)));
console.log("Megamorphic — 6 different shapes, IC gives up, slow dictionary lookup!\n");

//
// IC State Summary:
//
//  ┌──────────────┬────────────────┬─────────────┐
//  │  IC State    │  # of Shapes   │  Speed      │
//  ├──────────────┼────────────────┼─────────────┤
//  │ Uninitialized│  0             │  —          │
//  │ Monomorphic  │  1             │  Fastest    │
//  │ Polymorphic  │  2-4           │  Fast       │
//  │ Megamorphic  │  5+            │  Slow       │
//  └──────────────┴────────────────┴─────────────┘
//


// ============================================================
// EXAMPLE 4 — Zomato: The delete Operator Disaster
// Story: A Zomato engineer used `delete order.deliveryNotes` to
//   remove optional fields from order objects. This kicked V8 out
//   of fast mode — every order object became a "slow dictionary"
//   object, and API response times doubled overnight.
// ============================================================

// WHY: The `delete` operator destroys hidden classes. V8 can't maintain
// a clean transition chain when properties are removed. Instead, it
// converts the object to a "slow mode" hash-map-based storage.

// --- BAD: Using delete ---
function processOrderBad(order) {
    if (!order.deliveryNotes) {
        delete order.deliveryNotes;  // DESTROYS hidden class!
    }
    return order;
}

const orderWithNotes = { id: 1, item: "Biryani", deliveryNotes: "Ring bell" };
const orderWithoutNotes = { id: 2, item: "Pizza", deliveryNotes: "" };

console.log("=== The delete Operator ===");
console.log("Before delete:", orderWithNotes);
processOrderBad(orderWithoutNotes);
console.log("After delete:", orderWithoutNotes);
console.log("orderWithoutNotes is now in 'slow mode' — dictionary storage!\n");

// --- GOOD: Set to undefined instead ---
function processOrderGood(order) {
    if (!order.deliveryNotes) {
        order.deliveryNotes = undefined;  // Keeps hidden class intact!
    }
    return order;
}

const orderGood = { id: 3, item: "Dosa", deliveryNotes: "" };
processOrderGood(orderGood);
console.log("Using undefined instead:", orderGood);
console.log("Hidden class preserved! Still in fast mode.\n");


// ============================================================
// EXAMPLE 5 — Myntra: Constructor Pattern for Consistent Shapes
// Story: Myntra's frontend renders thousands of clothing items.
//   By initializing ALL properties in the constructor (even as
//   undefined), every clothing item gets the exact same hidden class.
//   The rendering loop runs at monomorphic speed — buttery smooth
//   scrolling on even budget phones.
// ============================================================

// WHY: The best practice for hidden classes is to initialize ALL
// properties upfront in the constructor, always in the same order.

// --- BAD: Conditional property addition ---
function createClothingBad(name, price, discount) {
    const item = { name, price };
    if (discount) {
        item.discount = discount;    // Some items get this...
    }
    if (price > 2000) {
        item.isPremium = true;       // Some items get this...
    }
    // Result: multiple hidden classes depending on conditions!
    return item;
}

const shirt = createClothingBad("Shirt", 999, null);      // {name, price}
const dress = createClothingBad("Dress", 2999, 20);        // {name, price, discount, isPremium}
const jeans = createClothingBad("Jeans", 1499, 10);        // {name, price, discount}

console.log("=== BAD: Conditional Properties ===");
console.log("shirt:", shirt);   // shape: {name, price}
console.log("dress:", dress);   // shape: {name, price, discount, isPremium}
console.log("jeans:", jeans);   // shape: {name, price, discount}
console.log("Three different shapes — polymorphic IC!\n");

// --- GOOD: Initialize ALL properties upfront ---
function createClothingGood(name, price, discount) {
    return {
        name: name,
        price: price,
        discount: discount || 0,        // Always present, default 0
        isPremium: price > 2000,         // Always present, computed
    };
}

const shirt2 = createClothingGood("Shirt", 999, null);
const dress2 = createClothingGood("Dress", 2999, 20);
const jeans2 = createClothingGood("Jeans", 1499, 10);

console.log("=== GOOD: All Properties Initialized ===");
console.log("shirt2:", shirt2);  // {name, price, discount, isPremium}
console.log("dress2:", dress2);  // {name, price, discount, isPremium}
console.log("jeans2:", jeans2);  // {name, price, discount, isPremium}
console.log("All three share the SAME hidden class — monomorphic!\n");


// ============================================================
// EXAMPLE 6 — CRED: Class Constructors are Hidden-Class Friendly
// Story: CRED's reward system uses ES6 classes for all reward objects.
//   Every instance created by the constructor gets the same shape
//   automatically, because the constructor always initializes
//   properties in the same order.
// ============================================================

// WHY: ES6 classes (and old-school constructor functions) are the most
// hidden-class-friendly pattern. The constructor runs the same code
// for every instance, guaranteeing identical property order.

class Reward {
    constructor(userId, points, tier) {
        // Always initialized in the SAME order for every instance
        this.userId = userId;
        this.points = points;
        this.tier = tier;
        this.redeemed = false;       // Always present
        this.expiresAt = null;       // Always present (even if null)
        this.history = [];           // Always present (empty array)
    }

    redeem(amount) {
        // Doesn't add new properties — just modifies existing ones
        this.points -= amount;
        this.redeemed = true;
        this.history.push({ amount, date: new Date().toISOString() });
    }
}

const reward1 = new Reward("U100", 5000, "Gold");
const reward2 = new Reward("U200", 12000, "Platinum");
const reward3 = new Reward("U300", 800, "Silver");

console.log("=== Class Constructor Pattern ===");
console.log("reward1:", reward1);
console.log("reward2:", reward2);
console.log("reward3:", reward3);
console.log("All instances share the same hidden class!\n");


// ============================================================
// EXAMPLE 7 — BigBasket: Object.freeze and Object.seal
// Story: BigBasket's pricing engine uses frozen config objects.
//   Once a pricing rule is set, it shouldn't change. Object.freeze()
//   not only prevents mutations but also tells V8 "this shape is
//   final" — enabling additional optimizations.
// ============================================================

// WHY: Object.freeze() and Object.seal() interact with hidden classes
// in interesting ways. They signal to V8 that the object's shape
// is stable, which can enable optimizations.

// --- Object.seal() ---
// Prevents adding/removing properties, but allows changing existing values
// V8 marks the hidden class as "sealed" — no more transitions possible
const sealedConfig = { maxItems: 50, freeDelivery: 499, expressCharge: 59 };
Object.seal(sealedConfig);

sealedConfig.maxItems = 100;           // OK — can modify values
// sealedConfig.newProp = "test";      // TypeError in strict mode — can't add
// delete sealedConfig.maxItems;       // TypeError — can't delete

console.log("=== Object.seal() ===");
console.log("Sealed config:", sealedConfig);
console.log("Can modify values but can't add/remove properties\n");

// --- Object.freeze() ---
// Prevents ALL changes: no add, no delete, no modify
// V8 knows this object will NEVER change — ultimate shape stability
const frozenPricing = { basePrice: 100, gst: 18, deliveryFee: 40 };
Object.freeze(frozenPricing);

// frozenPricing.basePrice = 200;     // TypeError in strict mode — can't modify
// frozenPricing.discount = 10;       // TypeError — can't add
// delete frozenPricing.gst;          // TypeError — can't delete

console.log("=== Object.freeze() ===");
console.log("Frozen pricing:", frozenPricing);
console.log("Completely immutable — V8 can optimize aggressively\n");

// --- Checking status ---
console.log("Is sealed?", Object.isSealed(sealedConfig));    // true
console.log("Is frozen?", Object.isFrozen(frozenPricing));   // true
console.log("Frozen is also sealed?", Object.isSealed(frozenPricing)); // true
console.log();


// ============================================================
// EXAMPLE 8 — Flipkart: Performance Benchmark
// Story: Flipkart's search results page renders 40 products at once.
//   Let's measure the real performance difference between accessing
//   properties on same-shape objects vs different-shape objects.
// ============================================================

// WHY: This benchmark demonstrates the tangible performance impact
// of hidden classes. Same-shape objects are accessed significantly
// faster due to monomorphic inline caches.

// --- Benchmark: Same Shape vs Different Shape ---

function benchmarkSameShape() {
    // All objects have the SAME shape: {id, name, price}
    const products = [];
    for (let i = 0; i < 100000; i++) {
        products.push({ id: i, name: "Product " + i, price: i * 10 });
    }

    const start = process.hrtime.bigint();
    let total = 0;
    for (let i = 0; i < products.length; i++) {
        total += products[i].price;  // Monomorphic IC — same shape every time
    }
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1_000_000;

    return { total, durationMs };
}

function benchmarkDifferentShapes() {
    // Objects have DIFFERENT shapes (different property orders, extra props)
    const products = [];
    for (let i = 0; i < 100000; i++) {
        const obj = {};
        if (i % 5 === 0) { obj.price = i * 10; obj.name = "P" + i; obj.id = i; }
        else if (i % 5 === 1) { obj.id = i; obj.price = i * 10; obj.name = "P" + i; }
        else if (i % 5 === 2) { obj.name = "P" + i; obj.id = i; obj.price = i * 10; }
        else if (i % 5 === 3) { obj.id = i; obj.name = "P" + i; obj.price = i * 10; obj.extra = true; }
        else { obj.price = i * 10; obj.id = i; obj.name = "P" + i; obj.tag = "sale"; }
        products.push(obj);
    }

    const start = process.hrtime.bigint();
    let total = 0;
    for (let i = 0; i < products.length; i++) {
        total += products[i].price;  // Megamorphic IC — different shapes!
    }
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1_000_000;

    return { total, durationMs };
}

console.log("=== Performance Benchmark: Hidden Classes ===");

// Warm up
benchmarkSameShape();
benchmarkDifferentShapes();

// Real run
const sameResult = benchmarkSameShape();
const diffResult = benchmarkDifferentShapes();

console.log(`Same shape:      ${sameResult.durationMs.toFixed(2)} ms (total: ${sameResult.total})`);
console.log(`Different shapes: ${diffResult.durationMs.toFixed(2)} ms (total: ${diffResult.total})`);
console.log(`Difference: ${(diffResult.durationMs / sameResult.durationMs).toFixed(1)}x slower with mixed shapes`);
console.log();


// ============================================================
// EXAMPLE 9 — Summary: Hidden Class Best Practices
// Story: After a V8 performance audit, the Flipkart team established
//   these coding guidelines for all JavaScript developers.
// ============================================================

// WHY: These are practical rules derived from understanding hidden classes.
// Following them ensures your objects stay in "fast mode" and your
// inline caches remain monomorphic.

console.log("=== Hidden Class Best Practices ===");
console.log();

// Rule 1: Initialize all properties in the constructor
class GoodProduct {
    constructor(id, name, price) {
        this.id = id;
        this.name = name;
        this.price = price;
        this.discount = 0;        // Always present
        this.inStock = true;      // Always present
        this.reviews = [];        // Always present
    }
}
console.log("Rule 1: Initialize ALL properties in constructor");
console.log("  new GoodProduct(1, 'Phone', 999):", new GoodProduct(1, "Phone", 999));

// Rule 2: Always add properties in the same order
console.log("\nRule 2: Always add properties in the SAME ORDER");
console.log("  BAD:  {a:1, b:2} and {b:2, a:1} → different shapes");
console.log("  GOOD: {a:1, b:2} and {a:3, b:4} → same shape");

// Rule 3: Don't use delete
console.log("\nRule 3: NEVER use 'delete' on objects");
console.log("  BAD:  delete obj.prop");
console.log("  GOOD: obj.prop = undefined");

// Rule 4: Don't add properties conditionally
console.log("\nRule 4: Don't add properties conditionally");
console.log("  BAD:  if (x) obj.extra = x");
console.log("  GOOD: obj.extra = x || null  (always present)");

// Rule 5: Use classes or factory functions
console.log("\nRule 5: Use classes or factory functions with fixed shapes");
console.log("  Classes guarantee same initialization order every time");

// Rule 6: Avoid Object.assign with varying sources
console.log("\nRule 6: Be careful with Object.assign / spread");
console.log("  Merging objects with different keys creates unpredictable shapes");
console.log();


// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. V8 assigns a "hidden class" (Map/Shape) to every object that
//    describes its property layout — names, order, and memory offsets.
//
// 2. Objects with the SAME properties added in the SAME ORDER share
//    the same hidden class → fast property access via fixed offsets.
//
// 3. Adding properties in different orders creates DIFFERENT hidden
//    classes, even if the final set of properties is identical.
//
// 4. Inline Caches (ICs) remember the hidden class at each property
//    access site. Monomorphic (1 shape) = fast. Megamorphic (5+) = slow.
//
// 5. The `delete` operator destroys hidden classes and puts objects
//    into "slow mode" (dictionary). Use `= undefined` instead.
//
// 6. Always initialize ALL properties in constructors, always in the
//    same order. Use classes or factory functions for consistency.
//
// 7. Object.freeze() and Object.seal() signal shape stability to V8,
//    potentially enabling further optimizations.
//
// 8. In real-world apps (Flipkart, Swiggy, Paytm), consistent object
//    shapes can mean the difference between smooth UX and jank.
// ============================================================

console.log("=== FILE 07 COMPLETE ===");
console.log("Hidden classes are the secret sauce behind V8's speed.");
console.log("Keep your shapes consistent, and V8 will reward you!\n");
