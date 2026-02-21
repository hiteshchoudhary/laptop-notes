// ============================================================
// FILE 03: MATCHERS AND ASSERTIONS
// Topic: Every matcher in Vitest/Jest — how to verify ANY value
// WHY: Assertions are the "judge" of your tests. A test without
//   assertions just runs code and hopes. Matchers give you precise,
//   expressive ways to verify that your code produces exactly the
//   right output in exactly the right shape.
// ============================================================

// ============================================================
// EXAMPLE 1 — The IRCTC Booking Verification
// Story: IRCTC processes 20 lakh+ bookings daily. After each booking,
//   the system must verify: ticket status MUST be "Confirmed", fare
//   MUST be exactly Rs.1245, passenger list MUST contain "Sharma",
//   PNR MUST match a 10-digit pattern. Each check maps to a different
//   matcher type in testing.
// ============================================================

// WHY: Different data types need different comparison strategies.
// You can't check floating-point with === (0.1 + 0.2 !== 0.3).
// You can't check objects with === (identical objects are !==).

// --- Mini test framework with comprehensive matchers ---
const results = { passed: 0, failed: 0, errors: [] };

function describe(name, fn) { console.log(`\n${name}`); fn(); }
function test(name, fn) {
  try { fn(); results.passed++; console.log(`  PASS: ${name}`); }
  catch (e) { results.failed++; results.errors.push({ name, error: e.message }); console.log(`  FAIL: ${name} -> ${e.message}`); }
}

function expect(received) {
  return {
    toBe(expected) { if (received !== expected) throw new Error(`Expected ${JSON.stringify(expected)} but got ${JSON.stringify(received)}`); },
    toEqual(expected) { if (JSON.stringify(received) !== JSON.stringify(expected)) throw new Error(`Deep equal failed`); },
    toStrictEqual(expected) {
      const r = JSON.stringify(received, (k, v) => v === undefined ? "__undef__" : v);
      const e = JSON.stringify(expected, (k, v) => v === undefined ? "__undef__" : v);
      if (r !== e) throw new Error(`Strict equal failed`);
    },
    toBeTruthy() { if (!received) throw new Error(`Expected truthy, got ${received}`); },
    toBeFalsy() { if (received) throw new Error(`Expected falsy, got ${received}`); },
    toBeNull() { if (received !== null) throw new Error(`Expected null, got ${received}`); },
    toBeUndefined() { if (received !== undefined) throw new Error(`Expected undefined`); },
    toBeDefined() { if (received === undefined) throw new Error(`Expected defined`); },
    toBeGreaterThan(n) { if (!(received > n)) throw new Error(`${received} not > ${n}`); },
    toBeGreaterThanOrEqual(n) { if (!(received >= n)) throw new Error(`${received} not >= ${n}`); },
    toBeLessThan(n) { if (!(received < n)) throw new Error(`${received} not < ${n}`); },
    toBeLessThanOrEqual(n) { if (!(received <= n)) throw new Error(`${received} not <= ${n}`); },
    toBeCloseTo(expected, precision = 2) {
      if (Math.abs(received - expected) >= Math.pow(10, -precision) / 2)
        throw new Error(`${received} not close to ${expected}`);
    },
    toMatch(pattern) {
      const ok = pattern instanceof RegExp ? pattern.test(received) : received.includes(pattern);
      if (!ok) throw new Error(`"${received}" doesn't match ${pattern}`);
    },
    toContain(item) {
      if (!(Array.isArray(received) ? received.includes(item) : String(received).includes(item)))
        throw new Error(`Doesn't contain ${JSON.stringify(item)}`);
    },
    toContainEqual(item) {
      if (!received.some((el) => JSON.stringify(el) === JSON.stringify(item)))
        throw new Error(`Array doesn't contain equal ${JSON.stringify(item)}`);
    },
    toHaveLength(n) { if (received.length !== n) throw new Error(`Length ${received.length}, expected ${n}`); },
    toHaveProperty(keyPath, val) {
      const keys = keyPath.split("."); let cur = received;
      for (const k of keys) { if (!cur || !(k in cur)) throw new Error(`Missing "${keyPath}"`); cur = cur[k]; }
      if (val !== undefined && cur !== val) throw new Error(`"${keyPath}" is ${cur}, expected ${val}`);
    },
    toMatchObject(subset) {
      for (const k of Object.keys(subset))
        if (JSON.stringify(received[k]) !== JSON.stringify(subset[k])) throw new Error(`Mismatch at "${k}"`);
    },
    toThrow(expected) {
      let threw = false, errMsg = "", errType = null;
      try { received(); } catch (e) { threw = true; errMsg = e.message; errType = e.constructor; }
      if (!threw) throw new Error("Expected to throw");
      if (typeof expected === "string" && !errMsg.includes(expected)) throw new Error(`Error "${errMsg}" missing "${expected}"`);
      if (typeof expected === "function" && errType !== expected) throw new Error(`Wrong error type`);
      if (expected instanceof RegExp && !expected.test(errMsg)) throw new Error(`Error doesn't match regex`);
    },
    not: {
      toBe(e) { if (received === e) throw new Error(`Expected NOT ${JSON.stringify(e)}`); },
      toEqual(e) { if (JSON.stringify(received) === JSON.stringify(e)) throw new Error(`Expected NOT equal`); },
      toContain(i) { if (Array.isArray(received) && received.includes(i)) throw new Error(`Should NOT contain ${i}`); },
      toBeNull() { if (received === null) throw new Error("Expected NOT null"); },
      toThrow() { let t = false; try { received(); } catch { t = true; } if (t) throw new Error("Expected NOT to throw"); },
      toHaveProperty(k) { if (received && k in received) throw new Error(`Should NOT have "${k}"`); },
    },
  };
}


// ============================================================
// EXAMPLE 2 — Equality: toBe vs toEqual vs toStrictEqual
// Story: Paytm's checkout team found a bug: two order objects looked
//   identical but toBe() said different. toBe uses === (reference),
//   toEqual checks content. This distinction saves hours of debugging.
// ============================================================

describe("Equality Matchers", () => {
  test("toBe for primitives (strict ===)", () => {
    expect(42).toBe(42);
    expect("hello").toBe("hello");
    expect(true).toBe(true);
    expect(null).toBe(null);
  });

  test("toBe FAILS for objects with same content", () => {
    const obj1 = { name: "Priya" };
    const obj2 = { name: "Priya" };
    // obj1 === obj2 is FALSE — different references
    expect(obj1).not.toBe(obj2);
  });

  test("toEqual compares CONTENT (deep equality)", () => {
    expect({ pnr: "8501234567", fare: 1245 })
      .toEqual({ pnr: "8501234567", fare: 1245 }); // PASSES
  });

  test("toEqual for nested objects", () => {
    expect({
      order: { items: [{ name: "Paneer", price: 250 }], address: { city: "Bengaluru" } }
    }).toEqual({
      order: { items: [{ name: "Paneer", price: 250 }], address: { city: "Bengaluru" } }
    });
  });

  test("toStrictEqual catches undefined properties", () => {
    const a = { name: "Priya", age: undefined };
    const b = { name: "Priya" };
    expect(a).toEqual(b);  // toEqual says EQUAL (ignores undefined)
    // expect(a).toStrictEqual(b) would FAIL — different structure
  });
});


// ============================================================
// EXAMPLE 3 — Truthiness Matchers
// Story: OYO Rooms' search returns different falsy values: null (no
//   rooms), undefined (not searched), 0 (sold out), "" (no name).
//   Each means something different. Truthiness matchers distinguish them.
// ============================================================

describe("Truthiness Matchers", () => {
  test("toBeTruthy/toBeFalsy for broad checks", () => {
    expect("Hello").toBeTruthy();
    expect(42).toBeTruthy();
    expect([]).toBeTruthy();     // Empty array IS truthy!
    expect({}).toBeTruthy();     // Empty object IS truthy!
    expect(false).toBeFalsy();
    expect(0).toBeFalsy();
    expect("").toBeFalsy();
    expect(null).toBeFalsy();
    expect(undefined).toBeFalsy();
  });

  test("specific null/undefined checks", () => {
    expect(null).toBeNull();
    expect({}.missing).toBeUndefined();
    expect({ count: 0 }.count).toBeDefined(); // 0 is defined!
  });
});


// ============================================================
// EXAMPLE 4 — Number Matchers
// Story: Zerodha's margin calculator: stock at Rs.2,456.75 with
//   0.03% brokerage = Rs.0.74. Floating-point is treacherous —
//   0.1 + 0.2 = 0.30000000000000004. toBeCloseTo saves the day.
// ============================================================

describe("Number Matchers", () => {
  test("comparison matchers for ranges", () => {
    const fare = 342;
    expect(fare).toBeGreaterThan(300);
    expect(fare).toBeGreaterThanOrEqual(342);
    expect(fare).toBeLessThan(500);
    expect(fare).toBeLessThanOrEqual(342);
  });

  test("toBeCloseTo for floating-point", () => {
    // expect(0.1 + 0.2).toBe(0.3);     // FAILS! 0.30000000000000004
    expect(0.1 + 0.2).toBeCloseTo(0.3, 5); // PASSES
  });

  test("toBeCloseTo for currency", () => {
    const brokerage = 2456.75 * 0.0003;
    expect(brokerage).toBeCloseTo(0.74, 1);
  });
});


// ============================================================
// EXAMPLE 5 — String Matchers
// Story: DigiLocker's Aadhaar validation: 12 digits, specific format,
//   masked display "XXXX XXXX 1234". String matchers with regex
//   make this testable without manual loops.
// ============================================================

describe("String Matchers", () => {
  test("toMatch with regex", () => {
    expect("1234 5678 9012").toMatch(/^\d{4}\s\d{4}\s\d{4}$/);   // Aadhaar
    expect("8501234567").toMatch(/^\d{10}$/);                      // PNR
    expect("priya@infosys.com").toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/); // Email
  });

  test("toContain for substring", () => {
    const error = "Payment failed: Insufficient balance in UPI account";
    expect(error).toContain("Insufficient balance");
    expect(error).toContain("UPI");
  });

  test("toHaveLength for string length", () => {
    expect("560001").toHaveLength(6); // Pincode
  });
});


// ============================================================
// EXAMPLE 6 — Array and Iterable Matchers
// Story: BookMyShow's seat selection returns available seats. Tests
//   verify the array contains specific seats, has the right length,
//   and includes seat objects with correct properties.
// ============================================================

describe("Array Matchers", () => {
  const seats = ["A1", "A2", "B1", "B3", "C5"];

  test("toContain for primitives in array", () => {
    expect(seats).toContain("A1");
    expect(seats).toContain("C5");
    expect(seats).not.toContain("A3");
  });

  test("toHaveLength", () => { expect(seats).toHaveLength(5); });

  test("toContainEqual for objects in arrays", () => {
    const passengers = [
      { name: "Sharma", seat: "A1" },
      { name: "Patel", seat: "B2" },
    ];
    expect(passengers).toContainEqual({ name: "Patel", seat: "B2" });
  });

  // In Vitest/Jest: expect.arrayContaining([subset])
  // expect(seats).toEqual(expect.arrayContaining(['A1', 'B1']))
  // Order doesn't matter — checks membership only
});


// ============================================================
// EXAMPLE 7 — Object Matchers
// Story: Razorpay's payment response has 20+ fields. Tests verify
//   only critical ones: status, amount, currency. toMatchObject
//   and toHaveProperty let you verify PARTIAL objects.
// ============================================================

describe("Object Matchers", () => {
  const payment = {
    id: "pay_ABC123", status: "captured", amount: 124500,
    currency: "INR", method: "upi", vpa: "priya@okicici",
    notes: { booking_id: "BK-001", route: "BLR-MAS" },
  };

  test("toHaveProperty checks existence and value", () => {
    expect(payment).toHaveProperty("status");
    expect(payment).toHaveProperty("status", "captured");
    expect(payment).toHaveProperty("currency", "INR");
  });

  test("toHaveProperty with nested path", () => {
    expect(payment).toHaveProperty("notes.route", "BLR-MAS");
  });

  test("toMatchObject for partial matching", () => {
    expect(payment).toMatchObject({
      status: "captured", currency: "INR", method: "upi",
    }); // PASSES — ignores the other 5+ properties
  });

  test("not.toHaveProperty for absence", () => {
    expect(payment).not.toHaveProperty("refund_id");
  });

  // In Vitest/Jest: expect.objectContaining(), expect.any(Number)
  // expect(payment).toEqual(expect.objectContaining({
  //   status: 'captured',
  //   amount: expect.any(Number),
  // }));
});


// ============================================================
// EXAMPLE 8 — Exception Matchers
// Story: PhonePe has 15 error types: InsufficientBalance, InvalidUPI,
//   DailyLimitExceeded. Tests verify not just THAT errors throw,
//   but WHICH error with WHAT message.
// ============================================================

function validateUPIId(upiId) {
  if (typeof upiId !== "string") throw new TypeError("UPI ID must be a string");
  if (!upiId.includes("@")) throw new Error("UPI ID must contain @");
  if (upiId.length < 5) throw new Error("UPI ID too short");
  const validHandles = ["@okicici", "@okaxis", "@ybl", "@paytm"];
  const handle = "@" + upiId.split("@")[1];
  if (!validHandles.includes(handle)) throw new Error(`Invalid handle: ${handle}`);
  return true;
}

function transferMoney(from, to, amount) {
  if (amount <= 0) throw new RangeError("Amount must be positive");
  if (amount > 100000) throw new RangeError("Daily limit exceeded");
  if (from === to) throw new Error("Cannot transfer to same account");
  return { status: "success" };
}

describe("Exception Matchers", () => {
  // CRITICAL: toThrow needs a FUNCTION wrapper
  // WRONG: expect(fn(bad)).toThrow()     <- throws BEFORE expect
  // RIGHT: expect(() => fn(bad)).toThrow() <- expect catches it

  test("toThrow checks any error", () => {
    expect(() => validateUPIId(123)).toThrow();
  });

  test("toThrow with string checks message", () => {
    expect(() => validateUPIId("bad")).toThrow("must contain @");
    expect(() => validateUPIId("a@b")).toThrow("too short");
  });

  test("toThrow with error class", () => {
    expect(() => validateUPIId(123)).toThrow(TypeError);
    expect(() => transferMoney("A", "B", -100)).toThrow(RangeError);
  });

  test("toThrow with regex", () => {
    expect(() => transferMoney("A", "B", 200000)).toThrow(/limit exceeded/i);
  });

  test("not.toThrow for valid inputs", () => {
    expect(() => validateUPIId("priya@okicici")).not.toThrow();
  });
});


// ============================================================
// EXAMPLE 9 — Negation & Custom Matchers
// Story: Nykaa created toBeValidMRP() that checks Indian MRP rules:
//   positive, integer, under Rs.10,00,000. Custom matchers encapsulate
//   domain validation. .not inverts ANY matcher.
// ============================================================

describe("Negation with .not", () => {
  test("not.toBe", () => { expect("pending").not.toBe("approved"); });
  test("not.toEqual", () => { expect({ v: false }).not.toEqual({ v: true }); });
  test("not.toContain", () => { expect(["110001", "400001"]).not.toContain("560001"); });
  test("not.toBeNull", () => { expect({ data: [] }).not.toBeNull(); });
});

// Custom matchers in Vitest/Jest:
/*
expect.extend({
  toBeValidMRP(received) {
    const pass = typeof received === 'number' && received > 0 && Number.isInteger(received) && received <= 1000000;
    return { pass, message: () => `${received} is${pass ? ' ' : ' not '}a valid MRP` };
  },
  toBeValidPincode(received) {
    return { pass: /^\d{6}$/.test(received), message: () => `Invalid pincode: ${received}` };
  },
});
// Usage: expect(999).toBeValidMRP();  expect('560001').toBeValidPincode();
*/

// Simulated custom matchers:
function expectCustom(received) {
  return {
    toBeValidMRP() {
      if (!(typeof received === "number" && received > 0 && Number.isInteger(received) && received <= 1000000))
        throw new Error(`${received} is not a valid MRP`);
    },
    toBeValidPincode() {
      if (!/^\d{6}$/.test(received)) throw new Error(`"${received}" invalid pincode`);
    },
  };
}

describe("Custom Matchers — Indian Domain", () => {
  test("valid MRP", () => { expectCustom(999).toBeValidMRP(); expectCustom(49999).toBeValidMRP(); });
  test("valid pincodes", () => { expectCustom("560001").toBeValidPincode(); expectCustom("110001").toBeValidPincode(); });
});


// ============================================================
// EXAMPLE 10 — Practical: Test an E-Commerce Order Object
// Story: A Flipkart order has items, pricing, shipping, customer
//   info. Let's test every aspect using every matcher type.
// ============================================================

function createOrder(items, customer, couponCode) {
  if (!items || items.length === 0) throw new Error("Order must have items");
  if (!customer || !customer.name) throw new Error("Customer name required");
  if (!customer.pincode || !/^\d{6}$/.test(customer.pincode)) throw new Error("Valid pincode required");
  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const gst = Math.round(subtotal * 0.18 * 100) / 100;
  const deliveryCharge = subtotal >= 499 ? 0 : 40;
  let discount = 0;
  if (couponCode === "FIRST50") discount = Math.min(subtotal * 0.5, 200);
  return {
    orderId: "FK-" + Date.now(), customer: { ...customer },
    items: items.map((i) => ({ ...i })),
    pricing: { subtotal, gst, deliveryCharge, discount, total: subtotal + gst + deliveryCharge - discount },
    status: "placed", createdAt: new Date().toISOString(),
  };
}

describe("E-Commerce Order — Full Matcher Demo", () => {
  const items = [{ name: "Wireless Mouse", price: 599, qty: 1 }, { name: "USB-C Cable", price: 199, qty: 2 }];
  const customer = { name: "Arjun Mehta", pincode: "560034", phone: "+919876543210" };

  test("correct structure (toHaveProperty)", () => {
    const order = createOrder(items, customer);
    expect(order).toHaveProperty("orderId");
    expect(order).toHaveProperty("status", "placed");
    expect(order).toHaveProperty("customer.name", "Arjun Mehta");
  });

  test("correct pricing (number matchers)", () => {
    const order = createOrder(items, customer);
    expect(order.pricing.subtotal).toBe(997);
    expect(order.pricing.deliveryCharge).toBe(0);
    expect(order.pricing.gst).toBeGreaterThan(0);
    expect(order.pricing.total).toBeGreaterThan(997);
  });

  test("coupon applied (comparison)", () => {
    const order = createOrder(items, customer, "FIRST50");
    expect(order.pricing.discount).toBeGreaterThan(0);
    expect(order.pricing.discount).toBeLessThanOrEqual(200);
  });

  test("items included (array matchers)", () => { expect(createOrder(items, customer).items).toHaveLength(2); });
  test("orderId format (string matcher)", () => { expect(createOrder(items, customer).orderId).toMatch(/^FK-\d+$/); });
  test("throws for empty items", () => { expect(() => createOrder([], customer)).toThrow("must have items"); });
  test("throws for missing name", () => { expect(() => createOrder(items, { pincode: "560001" })).toThrow("Customer name"); });
  test("throws for bad pincode", () => { expect(() => createOrder(items, { name: "X", pincode: "12" })).toThrow("pincode"); });
});

// --- Print summary ---
console.log(`\n=== RESULTS: ${results.passed} passed, ${results.failed} failed ===`);
if (results.errors.length) results.errors.forEach((e) => console.log(`  - ${e.name}: ${e.error}`));


// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. toBe for primitives (===), toEqual for objects (deep),
//    toStrictEqual for strict deep (catches undefined props).
//
// 2. toBeTruthy/toBeFalsy for broad checks. toBeNull/toBeUndefined
//    /toBeDefined for specific falsy values.
//
// 3. toBeGreaterThan/toBeLessThan for ranges.
//    toBeCloseTo for floating-point (the 0.1+0.2 problem).
//
// 4. toMatch(/regex/) for patterns, toContain for substrings.
//
// 5. toContain for array primitives, toContainEqual for objects,
//    toHaveLength for size.
//
// 6. toHaveProperty('key', val) for existence, toMatchObject for
//    partial matching.
//
// 7. toThrow: ALWAYS wrap in function. Check message, regex, or
//    Error class.
//
// 8. .not inverts ANY matcher. Custom matchers with expect.extend
//    for domain-specific validation.
// ============================================================
