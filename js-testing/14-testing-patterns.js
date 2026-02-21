// ============================================================
// FILE 14: TESTING PATTERNS
// Topic: Proven patterns that make tests readable, maintainable, and scalable
// WHY: As your application grows, ad-hoc testing becomes unmaintainable.
//   Testing patterns are battle-tested strategies that keep your suite
//   organized and resilient. They are the difference between 50 tests
//   that help you and 500 tests that slow you down.
// ============================================================

// ============================================================
// EXAMPLE 1 — Amazon India: Managing 50+ Checkout Edge Cases
// Story: Amazon India's checkout handles guest vs logged-in, COD vs
//   prepaid, single vs multi-seller, domestic vs imported products.
//   Without testing patterns, 2000+ tests would be an unreadable mess.
//   With factories, parameterized tests, and state machine testing,
//   a new engineer understands any test in under 2 minutes. When
//   "Buy Now, Pay Later" was added, 30 test cases were written in
//   a single afternoon — the patterns made it trivial.
// ============================================================

// ============================================================
// EXAMPLE 2 — Pattern 1: Test Data Factories (Builder Pattern)
// Story: Amazon India had 200 tests, each creating user objects with
//   15 fields. When a "preferredLanguage" field was added, 200 tests
//   broke. Factories fixed this: one function creates valid data with
//   defaults, each test overrides only what matters.
// ============================================================

// WHY: Factories eliminate boilerplate and make tests self-documenting.

function createUser(overrides = {}) {
  return {
    id: overrides.id || Math.floor(Math.random() * 10000),
    name: overrides.name || 'Test User',
    email: overrides.email || `test_${Date.now()}@example.com`,
    phone: overrides.phone || '9876543210',
    city: overrides.city || 'Bengaluru',
    state: overrides.state || 'Karnataka',
    pincode: overrides.pincode || '560001',
    isPrime: overrides.isPrime !== undefined ? overrides.isPrime : false,
    verified: overrides.verified !== undefined ? overrides.verified : true,
    orderCount: overrides.orderCount || 0,
    ...overrides,
  };
}

function createProduct(overrides = {}) {
  return {
    id: overrides.id || Math.floor(Math.random() * 10000),
    name: overrides.name || 'Test Product',
    price: overrides.price || 999,
    category: overrides.category || 'Electronics',
    seller: overrides.seller || 'Amazon India',
    inStock: overrides.inStock !== undefined ? overrides.inStock : true,
    isImported: overrides.isImported || false,
    gstRate: overrides.gstRate || 18,
    ...overrides,
  };
}

function createOrder(overrides = {}) {
  const items = overrides.items || [createProduct()];
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  return {
    id: overrides.id || 'ORD_' + Date.now(),
    userId: overrides.userId || 'user_1',
    items,
    subtotal,
    discount: overrides.discount || 0,
    total: subtotal - (overrides.discount || 0),
    paymentMethod: overrides.paymentMethod || 'UPI',
    status: overrides.status || 'pending',
    ...overrides,
  };
}

console.log("--- Pattern 1: Test Data Factories ---");
// Now tests show ONLY relevant data:
const primeUser = createUser({ isPrime: true });
console.log("Prime user:", primeUser.name, "isPrime:", primeUser.isPrime);

const expensiveProduct = createProduct({ name: 'MacBook Air', price: 125000 });
console.log("Product:", expensiveProduct.name, "Rs", expensiveProduct.price);

const multiOrder = createOrder({
  items: [createProduct({ name: 'Phone', price: 15000 }), createProduct({ name: 'Cover', price: 500 })],
  paymentMethod: 'COD',
});
console.log("Order:", multiOrder.items.length, "items, total:", multiOrder.total, multiOrder.paymentMethod);

// --- Why factories beat manual creation ---
// Without factory: you create the SAME 15-field object in 200 tests.
//   When a field is added, 200 tests break.
// With factory: one function creates valid data. 200 tests call it.
//   When a field is added, update ONE function. Zero tests break.
//
// Factory tips:
// - Defaults should represent the MOST COMMON valid case
// - Use Math.random() or Date.now() for unique IDs (no collisions)
// - Support nested factories: createOrder() calls createProduct()
// - Name overrides clearly: createUser({ isPrime: true }) is self-documenting


// ============================================================
// EXAMPLE 3 — Pattern 2: Parameterized Tests (Data-Driven Testing)
// Story: Amazon India's delivery calculator has 12 rules. Instead of
//   12 nearly identical tests, one test runs with 12 data sets.
// ============================================================

// WHY: Eliminates duplication. Adding a new case = adding one row.

function calculateDeliveryCharge(weight, distance, isPrime, isFragile) {
  if (isPrime) return 0;
  let charge = weight <= 0.5 ? 40 : weight <= 2 ? 70 : weight <= 5 ? 120 : 200;
  if (distance > 500) charge += 50;
  if (distance > 1000) charge += 50;
  if (isFragile) charge += 30;
  return charge;
}

// In Jest/Vitest:
// test.each([
//   [0.3, 100, false, false, 40],
//   [1.5, 100, false, false, 70],
//   [0.3, 100, true,  false, 0],     // Prime = free
//   [0.3, 800, false, true,  120],   // Far + fragile
// ])('delivery(%f kg, %f km, prime=%s) = Rs %i',
//   (w, d, p, f, expected) => expect(calculateDeliveryCharge(w,d,p,f)).toBe(expected)
// );

console.log("\n--- Pattern 2: Parameterized Tests ---");
const cases = [
  { w: 0.3,  d: 100,  p: false, f: false, exp: 40,  desc: "Light, short" },
  { w: 1.5,  d: 100,  p: false, f: false, exp: 70,  desc: "Medium weight" },
  { w: 4.0,  d: 100,  p: false, f: false, exp: 120, desc: "Heavy" },
  { w: 10.0, d: 100,  p: false, f: false, exp: 200, desc: "Very heavy" },
  { w: 0.3,  d: 800,  p: false, f: false, exp: 90,  desc: "Light + far" },
  { w: 0.3,  d: 1200, p: false, f: false, exp: 140, desc: "Light + very far" },
  { w: 0.3,  d: 100,  p: true,  f: false, exp: 0,   desc: "Prime = free" },
  { w: 0.3,  d: 100,  p: false, f: true,  exp: 70,  desc: "Light + fragile" },
];
cases.forEach(tc => {
  const actual = calculateDeliveryCharge(tc.w, tc.d, tc.p, tc.f);
  console.log(`  ${actual === tc.exp ? 'PASS' : 'FAIL'}: ${tc.desc} => Rs ${actual}`);
});


// ============================================================
// EXAMPLE 4 — Pattern 3: Testing Error Boundaries
// Story: Amazon India's checkout showed raw stack traces when the
//   inventory service errored. Now they test that errors are caught
//   and shown as friendly messages — never leaking internals.
// ============================================================

// WHY: Errors WILL happen. Test that they're handled gracefully.

class OrderProcessor {
  processOrder(order) {
    if (!order) throw new Error('Order is required');
    if (!order.items || order.items.length === 0) throw new Error('Order must have items');
    if (order.total > 500000) throw new Error('Order exceeds Rs 5,00,000 limit');
    return { success: true, orderId: 'ORD_' + Date.now() };
  }

  safeProcess(order) {
    try {
      return this.processOrder(order);
    } catch (error) {
      const messages = {
        'Order is required': 'Something went wrong. Please try again.',
        'Order must have items': 'Your cart is empty.',
        'Order exceeds Rs 5,00,000 limit': 'Please split into multiple orders.',
      };
      return { success: false, userMessage: messages[error.message] || 'Unexpected error.' };
      // NO stack trace, NO internal details leaked!
    }
  }
}

// test('should not leak stack traces', () => {
//   const result = processor.safeProcess(null);
//   expect(result.success).toBe(false);
//   expect(result.userMessage).toBeDefined();
//   expect(result.stack).toBeUndefined();   // No leak!
// });

const proc = new OrderProcessor();
console.log("\n--- Pattern 3: Error Boundary Tests ---");
console.log("Null order:", proc.safeProcess(null));
console.log("Empty cart:", proc.safeProcess({ items: [], total: 0 }));
console.log("Over limit:", proc.safeProcess(createOrder({ items: [createProduct({ price: 600000 })] })));


// ============================================================
// EXAMPLE 5 — Pattern 4: Arrange-Act-Assert-Cleanup (AAAC)
// Story: Amazon's DB integration tests leaked connections. After 200
//   tests, the pool was exhausted. Adding explicit Cleanup solved it.
// ============================================================

// WHY: AAA is standard. Add Cleanup when using real resources.

// test('save order to DB', async () => {
//   // ARRANGE
//   const db = await connectTestDB();
//   const order = createOrder();
//   // ACT
//   const saved = await db.saveOrder(order);
//   // ASSERT
//   expect(saved.id).toBeDefined();
//   // CLEANUP — release resources!
//   await db.deleteOrder(saved.id);
//   await db.close();
// });

console.log("\n--- Pattern 4: AAAC ---");
const order = createOrder({ items: [createProduct({ price: 2500 }), createProduct({ price: 800 })] });
console.log("ARRANGE: Created order with 2 items");
const total = order.items.reduce((s, i) => s + i.price, 0);
console.log("ACT: Calculated total =", total);
console.log("ASSERT:", total === 3300 ? 'PASS' : 'FAIL');
console.log("CLEANUP: Close DB connection, delete temp data");


// ============================================================
// EXAMPLE 6 — Pattern 5: Test Fixtures
// Story: Amazon's address validation tests need 50 addresses — valid,
//   invalid, edge cases. Loaded from fixture files, not hardcoded.
// ============================================================

// WHY: Fixtures externalize test data. Tests stay clean, data is reusable.

// __fixtures__/valid-addresses.json, __fixtures__/invalid-addresses.json

const validAddresses = [
  { line1: "42, Brigade Road", city: "Bengaluru", state: "Karnataka", pincode: "560001" },
  { line1: "15, Connaught Place", city: "New Delhi", state: "Delhi", pincode: "110001" },
];
const invalidAddresses = [
  { line1: "", city: "Mumbai", state: "Maharashtra", pincode: "400001", reason: "Empty line1" },
  { line1: "123 St", city: "Mumbai", state: "Maharashtra", pincode: "ABC001", reason: "Non-numeric pincode" },
];

function validateAddress(addr) {
  const errors = [];
  if (!addr.line1 || !addr.line1.trim()) errors.push('Address line required');
  if (!addr.city || !addr.city.trim()) errors.push('City required');
  if (!addr.pincode || !/^\d{6}$/.test(addr.pincode)) errors.push('Valid 6-digit pincode required');
  return { valid: errors.length === 0, errors };
}

console.log("\n--- Pattern 5: Test Fixtures ---");
validAddresses.forEach(a => console.log(`  Valid ${a.city}:`, validateAddress(a).valid ? 'PASS' : 'FAIL'));
invalidAddresses.forEach(a => console.log(`  Invalid (${a.reason}):`, !validateAddress(a).valid ? 'PASS' : 'FAIL'));


// ============================================================
// EXAMPLE 7 — Pattern 6: Contract Testing
// Story: Amazon's backend changed { price: 999 } to { price: "999" }
//   (number to string). Frontend broke. Contract tests catch type
//   changes by verifying response SHAPE, not exact values.
// ============================================================

// WHY: Ensures frontend and backend agree on API shape.

// test('product API matches contract', async () => {
//   const response = await request(app).get('/api/products/1');
//   expect(response.body).toMatchObject({
//     id: expect.any(Number),
//     name: expect.any(String),
//     price: expect.any(Number),        // Would catch string conversion!
//     inStock: expect.any(Boolean),
//     categories: expect.any(Array),
//   });
// });

function validateContract(response) {
  const errors = [];
  if (typeof response.id !== 'number') errors.push('id must be number');
  if (typeof response.name !== 'string') errors.push('name must be string');
  if (typeof response.price !== 'number') errors.push('price must be number');
  if (typeof response.inStock !== 'boolean') errors.push('inStock must be boolean');
  return { valid: errors.length === 0, errors };
}

console.log("\n--- Pattern 6: Contract Testing ---");
console.log("Valid:", validateContract({ id: 42, name: 'Phone', price: 999, inStock: true }));
console.log("Broken:", validateContract({ id: 42, name: 'Phone', price: "999", inStock: true }));

// --- Jest matchers for contract testing ---
// expect(response).toMatchObject({
//   id: expect.any(Number),
//   name: expect.any(String),
//   price: expect.any(Number),
//   tags: expect.arrayContaining([expect.any(String)]),
//   seller: expect.objectContaining({ name: expect.any(String) }),
// });
//
// This checks SHAPE and TYPES, not exact values.
// If backend changes price from Number to String, test fails immediately.
// If backend adds a new field, test still passes (toMatchObject is partial).


// ============================================================
// EXAMPLE 8 — Pattern 7: Testing State Machines
// Story: Amazon's order system: pending -> confirmed -> shipped ->
//   delivered. A bug once let "delivered" go back to "pending" —
//   customer got the order AND a full refund. State machine tests
//   verify all valid AND invalid transitions.
// ============================================================

// WHY: Prevents impossible states like delivered -> pending.

class OrderStateMachine {
  constructor() {
    this.transitions = {
      'pending':          ['confirmed', 'cancelled'],
      'confirmed':        ['shipped', 'cancelled'],
      'shipped':          ['out_for_delivery', 'returned'],
      'out_for_delivery': ['delivered', 'returned'],
      'delivered':        ['return_requested'],
      'return_requested': ['returned', 'return_rejected'],
      'returned':         [],
      'cancelled':        [],
    };
  }

  canTransition(from, to) {
    return (this.transitions[from] || []).includes(to);
  }

  transition(order, newStatus) {
    if (!this.canTransition(order.status, newStatus)) {
      return { success: false, error: `Cannot go from "${order.status}" to "${newStatus}"` };
    }
    return { success: true, from: order.status, to: newStatus };
  }
}

// test.each([['pending','confirmed'], ['confirmed','shipped'], ['shipped','out_for_delivery']])
//   ('should allow %s -> %s', (from, to) => expect(sm.canTransition(from, to)).toBe(true));
// test.each([['delivered','pending'], ['cancelled','confirmed'], ['pending','delivered']])
//   ('should REJECT %s -> %s', (from, to) => expect(sm.canTransition(from, to)).toBe(false));

const sm = new OrderStateMachine();
console.log("\n--- Pattern 7: State Machine Tests ---");
console.log("Valid transitions:");
[['pending','confirmed'],['confirmed','shipped'],['shipped','out_for_delivery'],['out_for_delivery','delivered']]
  .forEach(([f,t]) => console.log(`  ${f} -> ${t}: ${sm.canTransition(f,t) ? 'PASS' : 'FAIL'}`));

console.log("Invalid transitions (all should be rejected):");
[['delivered','pending'],['shipped','pending'],['cancelled','confirmed'],['pending','delivered']]
  .forEach(([f,t]) => console.log(`  ${f} -> ${t}: ${!sm.canTransition(f,t) ? 'PASS' : 'FAIL'}`));


// ============================================================
// EXAMPLE 9 — Anti-Patterns: What NOT to Do
// Story: Amazon's 800-test suite: 30% flaky, 10s per test, any code
//   change broke dozens of tests. A test health audit found 4 anti-
//   patterns. Fixing them cut runtime 70%, flakiness under 2%.
// ============================================================

console.log("\n--- Anti-Patterns ---");
console.log("1. TESTING IMPLEMENTATION DETAILS");
console.log("   BAD:  expect(order._internalCache.size).toBe(3);");
console.log("   GOOD: expect(order.getTotal()).toBe(3000);");

console.log("2. SHARED MUTABLE STATE");
console.log("   BAD:  let counter = 0; (shared between tests)");
console.log("   GOOD: beforeEach(() => { counter = 0; });");

console.log("3. TIMING DEPENDENCIES");
console.log("   BAD:  await sleep(2000); expect(result).toBeDefined();");
console.log("   GOOD: await waitFor(() => expect(result).toBeDefined());");

console.log("4. OVER-MOCKING");
console.log("   BAD:  Mock DB, mock service, mock validator = testing mocks!");
console.log("   GOOD: Mock only external deps. Let internal code run for real.");

console.log("5. BAD TEST NAMES");
console.log("   BAD:  test('test calculateTotal')");
console.log("   GOOD: test('should apply 10% discount for orders above Rs 5000')");


// ============================================================
// EXAMPLE 10 — Practical: All Patterns Applied Together
// Story: Apply all 7 patterns to Amazon India's checkout system.
// ============================================================

console.log("\n--- Practical: All Patterns Applied ---");

// Factory
const customer = createUser({ isPrime: true, city: 'Mumbai' });
const items = [createProduct({ name: 'Laptop', price: 65000 }), createProduct({ name: 'Mouse', price: 800 })];
console.log("Factory: customer + 2 products created");

// Parameterized
function calculateDiscount(total, isPrime, coupon) {
  let d = 0;
  if (isPrime && total > 5000) d += total * 0.05;
  if (coupon === 'SAVE10') d += total * 0.10;
  if (coupon === 'FLAT500') d += 500;
  return Math.min(d, total);
}
console.log("Parameterized discount tests:");
[{ t: 10000, p: true, c: null, e: 500 }, { t: 10000, p: false, c: 'SAVE10', e: 1000 },
 { t: 10000, p: true, c: 'SAVE10', e: 1500 }, { t: 3000, p: true, c: null, e: 0 }]
  .forEach(tc => {
    const a = calculateDiscount(tc.t, tc.p, tc.c);
    console.log(`  Rs ${tc.t}, Prime=${tc.p}, coupon=${tc.c}: ${a === tc.e ? 'PASS' : 'FAIL'} (Rs ${a})`);
  });

// State machine lifecycle
console.log("State machine lifecycle:");
const lifecycle = ['pending', 'confirmed', 'shipped', 'out_for_delivery', 'delivered'];
let curr = lifecycle[0];
for (let i = 1; i < lifecycle.length; i++) {
  const r = sm.transition({ status: curr }, lifecycle[i]);
  console.log(`  ${curr} -> ${lifecycle[i]}: ${r.success ? 'PASS' : 'FAIL'}`);
  if (r.success) curr = lifecycle[i];
}
console.log("  Final status:", curr);

// --- When to use which pattern ---
// Starting a new test file? Use this decision guide:
//
// Need test data?           -> Pattern 1: Factory
// Same test, many inputs?   -> Pattern 2: Parameterized (test.each)
// Testing failure modes?    -> Pattern 3: Error Boundaries
// Using real resources?     -> Pattern 4: AAAC (with cleanup)
// Complex shared test data? -> Pattern 5: Fixtures (JSON files)
// Testing API responses?    -> Pattern 6: Contract Testing
// Testing status flows?     -> Pattern 7: State Machine
//
// Most test files use 2-3 patterns. Factories are used in almost
// every test file. Parameterized tests are common for validators.
// State machine tests are specific to workflow/status code.


// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. Test Data Factories: createUser(), createProduct() with defaults.
//    Override only what matters. Tests become self-documenting.
// 2. Parameterized Tests: test.each runs same test with different data.
//    Adding a case = adding one row. Great for validators/calculators.
// 3. Error Boundaries: Test that errors are caught, logged, and shown
//    as friendly messages. Never leak stack traces to users.
// 4. AAAC: Arrange, Act, Assert, Cleanup. Always clean up resources.
// 5. Fixtures: Externalize test data to JSON files. Reusable, clean.
// 6. Contract Testing: Verify API SHAPE and TYPES, not exact values.
// 7. State Machine: Test all valid AND invalid transitions.
// 8. Anti-patterns to avoid: testing implementation details, shared
//    mutable state, timing dependencies, over-mocking, bad names.
// ============================================================
