// ============================================================
// FILE 02: TEST ANATOMY
// Topic: The structure, lifecycle, and naming of well-written tests
// WHY: Writing tests is easy. Writing GOOD tests — tests that are
//   readable, maintainable, and trustworthy — requires understanding
//   the anatomy. This file teaches the patterns that every professional
//   testing codebase follows.
// ============================================================

// ============================================================
// EXAMPLE 1 — The Zomato Onboarding Checklist
// Story: Every new restaurant on Zomato goes through a structured
//   checklist: (1) verify menu uploaded, (2) verify bank details
//   for payouts, (3) verify FSSAI food safety license. If any step
//   fails, the restaurant doesn't go live. Tests follow the exact
//   same structured, step-by-step verification approach.
// ============================================================

// WHY: The AAA pattern is the most important testing pattern.
// It makes every test predictable, readable, and debuggable.

// --- The AAA Pattern: Arrange -> Act -> Assert ---
// ARRANGE: Set up inputs, create objects, prepare the state.
// ACT:     Call the function or method being tested.
// ASSERT:  Verify the result matches expectations.

// --- The module we'll test throughout this file ---

class ShoppingCart {
  constructor() {
    this.items = [];
    this.couponApplied = null;
  }

  addItem(name, price, quantity = 1) {
    if (price < 0) throw new Error("Price cannot be negative");
    if (quantity < 1) throw new Error("Quantity must be at least 1");
    const existing = this.items.find((item) => item.name === name);
    if (existing) { existing.quantity += quantity; }
    else { this.items.push({ name, price, quantity }); }
    return this;
  }

  removeItem(name) {
    const index = this.items.findIndex((item) => item.name === name);
    if (index === -1) throw new Error(`Item "${name}" not found in cart`);
    this.items.splice(index, 1);
    return this;
  }

  getItemCount() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  getSubtotal() {
    return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  applyCoupon(code, discountPercent) {
    if (this.couponApplied) throw new Error("Only one coupon allowed");
    if (discountPercent <= 0 || discountPercent > 50) {
      throw new Error("Discount must be between 1% and 50%");
    }
    this.couponApplied = { code, discountPercent };
    return this;
  }

  getTotal() {
    const subtotal = this.getSubtotal();
    if (this.couponApplied) {
      const discount = (subtotal * this.couponApplied.discountPercent) / 100;
      return Math.round((subtotal - discount) * 100) / 100;
    }
    return subtotal;
  }

  clear() {
    this.items = [];
    this.couponApplied = null;
    return this;
  }
}

// --- Mini test framework ---
const results = { passed: 0, failed: 0, skipped: 0, errors: [] };
const hooks = { beforeEachFns: [], afterEachFns: [] };

function describe(name, fn) {
  console.log(`\n${name}`);
  const saved = [...hooks.beforeEachFns];
  const savedA = [...hooks.afterEachFns];
  fn();
  hooks.beforeEachFns = saved;
  hooks.afterEachFns = savedA;
}

function test(name, fn) {
  try {
    hooks.beforeEachFns.forEach((h) => h());
    fn();
    results.passed++;
    console.log(`  PASS: ${name}`);
  } catch (error) {
    results.failed++;
    results.errors.push({ name, error: error.message });
    console.log(`  FAIL: ${name} -> ${error.message}`);
  } finally {
    hooks.afterEachFns.forEach((h) => h());
  }
}
const it = test; // Alias — test and it are interchangeable

test.skip = function (name) { results.skipped++; console.log(`  SKIP: ${name}`); };
test.todo = function (name) { console.log(`  TODO: ${name}`); };
function beforeEach(fn) { hooks.beforeEachFns.push(fn); }
function afterEach(fn) { hooks.afterEachFns.push(fn); }

function expect(received) {
  return {
    toBe(expected) { if (received !== expected) throw new Error(`Expected ${JSON.stringify(expected)} but got ${JSON.stringify(received)}`); },
    toEqual(expected) { if (JSON.stringify(received) !== JSON.stringify(expected)) throw new Error(`Expected ${JSON.stringify(expected)} but got ${JSON.stringify(received)}`); },
    toThrow(msg) {
      let threw = false, errMsg = "";
      try { received(); } catch (e) { threw = true; errMsg = e.message; }
      if (!threw) throw new Error("Expected to throw");
      if (msg && !errMsg.includes(msg)) throw new Error(`Expected "${msg}" but got "${errMsg}"`);
    },
    toBeGreaterThan(n) { if (!(received > n)) throw new Error(`Expected ${received} > ${n}`); },
    not: { toBe(expected) { if (received === expected) throw new Error(`Expected NOT ${JSON.stringify(expected)}`); } },
  };
}


// ============================================================
// EXAMPLE 2 — AAA Pattern in Practice
// Story: BigBasket's QA team mandates AAA in every test. New engineers
//   who skip clear sections get PRs sent back. "If I can't find the
//   Arrange, Act, and Assert in 5 seconds, rewrite it," says their lead.
// ============================================================

describe("ShoppingCart — AAA Pattern", () => {
  test("should add an item and calculate subtotal", () => {
    // ARRANGE — set up the cart and item details
    const cart = new ShoppingCart();
    const itemName = "Paneer Tikka";
    const itemPrice = 299;

    // ACT — perform the action being tested
    cart.addItem(itemName, itemPrice);

    // ASSERT — verify the results
    expect(cart.getItemCount()).toBe(1);
    expect(cart.getSubtotal()).toBe(299);
  });

  test("should apply coupon and reduce total", () => {
    // ARRANGE
    const cart = new ShoppingCart();
    cart.addItem("Biryani", 350);
    cart.addItem("Naan", 50, 2);

    // ACT
    cart.applyCoupon("ZOMATO20", 20);

    // ASSERT
    expect(cart.getSubtotal()).toBe(450); // 350 + 100
    expect(cart.getTotal()).toBe(360);    // 450 - 20%
  });
});


// ============================================================
// EXAMPLE 3 — describe() and test() — Grouping Tests
// Story: Dunzo's test suite has 1,200 tests organized into nested
//   describe blocks: Module -> Method -> Scenario. Finding a specific
//   test takes 3 seconds because the hierarchy is crystal clear.
// ============================================================

// WHY: Good grouping makes test output readable and failures locatable.

describe("ShoppingCart", () => {
  describe("addItem()", () => {
    test("should add a new item to empty cart", () => {
      const cart = new ShoppingCart();
      cart.addItem("Masala Dosa", 120);
      expect(cart.getItemCount()).toBe(1);
    });

    test("should increase quantity for duplicate item", () => {
      const cart = new ShoppingCart();
      cart.addItem("Masala Dosa", 120);
      cart.addItem("Masala Dosa", 120, 2);
      expect(cart.getItemCount()).toBe(3);
    });

    test("should throw for negative price", () => {
      const cart = new ShoppingCart();
      expect(() => cart.addItem("Free Item", -10)).toThrow("negative");
    });
  });

  describe("removeItem()", () => {
    test("should remove an existing item", () => {
      const cart = new ShoppingCart();
      cart.addItem("Idli", 60);
      cart.addItem("Vada", 40);
      cart.removeItem("Idli");
      expect(cart.getItemCount()).toBe(1);
    });

    test("should throw when removing non-existent item", () => {
      const cart = new ShoppingCart();
      expect(() => cart.removeItem("Ghost Item")).toThrow("not found");
    });
  });
});


// ============================================================
// EXAMPLE 4 — beforeEach / afterEach — Setup and Teardown
// Story: Urban Company runs tests for their booking system. Each
//   test needs a fresh context. Using beforeEach, they create this
//   setup once instead of repeating it in 40 tests.
// ============================================================

// WHY: Hooks eliminate duplication and ensure test isolation.

// Lifecycle order in Vitest/Jest:
//   beforeAll()     <- connect to DB, start server
//     beforeEach()  <- create fresh test data
//       test()      <- run test
//     afterEach()   <- clean up test data
//   afterAll()      <- disconnect DB, stop server

let sharedCart;

describe("ShoppingCart with beforeEach", () => {
  beforeEach(() => {
    sharedCart = new ShoppingCart();
    sharedCart.addItem("Dal Makhani", 320);
    sharedCart.addItem("Roti", 30, 4);
  });
  afterEach(() => { sharedCart = null; });

  test("should start with pre-loaded items", () => {
    expect(sharedCart.getItemCount()).toBe(5); // 1 + 4
    expect(sharedCart.getSubtotal()).toBe(440); // 320 + 120
  });

  test("should allow adding more items to pre-loaded cart", () => {
    sharedCart.addItem("Raita", 60);
    expect(sharedCart.getItemCount()).toBe(6);
  });

  test("should not see items from previous test (isolation proof)", () => {
    // Raita from previous test does NOT leak — beforeEach resets
    expect(sharedCart.getItemCount()).toBe(5);
  });
});


// ============================================================
// EXAMPLE 5 — test.skip, test.only, test.todo
// Story: Lenskart uses test.skip for tests depending on APIs being
//   redesigned. They use test.todo to plan tests for the virtual
//   try-on feature. "TODO tests are our testing roadmap."
// ============================================================

describe("Test Modifiers", () => {
  test.skip("should handle international shipping (API not ready)");

  // test.only('debug this one test') — runs ONLY this test
  // DANGER: NEVER commit test.only! Use ESLint rule "no-only-tests"

  test("regular test runs normally", () => { expect(1 + 1).toBe(2); });

  test.todo("should apply loyalty points discount");
  test.todo("should handle cart merge when user logs in");
});


// ============================================================
// EXAMPLE 6 — Test Naming Conventions
// Story: Razorpay's 300+ engineers follow strict naming:
//   "should [expected behavior] when [condition]". Badly named
//   tests get flagged by a custom ESLint rule.
// ============================================================

describe("Test Naming Best Practices", () => {
  // Pattern: "should [expected behavior] when [condition/input]"

  test("should return 0 when cart is empty", () => {
    expect(new ShoppingCart().getTotal()).toBe(0);
  });

  test("should throw error when removing item from empty cart", () => {
    expect(() => new ShoppingCart().removeItem("X")).toThrow();
  });

  test("should apply 20% discount when SAVE20 coupon is used", () => {
    const cart = new ShoppingCart();
    cart.addItem("Shirt", 1000);
    cart.applyCoupon("SAVE20", 20);
    expect(cart.getTotal()).toBe(800);
  });

  // BAD names: "test cart", "it works", "test 1", "should work correctly"
  // GOOD names describe behavior + condition precisely
});


// ============================================================
// EXAMPLE 7 — Test Isolation & Flaky Tests
// Story: Myntra's search team had 15 tests passing individually but
//   failing together. Test #3 mutated a shared array, test #8 depended
//   on it. It took 2 days to find. Rule: "No shared mutable state."
//
//   CRED had 12 flaky tests — sometimes pass, sometimes fail. Engineers
//   started ignoring CI. A real bug slipped through. Zero-tolerance now.
// ============================================================

// WHY: Test isolation is non-negotiable. Flaky tests destroy trust.

// BAD — shared mutable state:
// const arr = [1,2,3];
// test('adds', () => { arr.push(4); expect(arr.length).toBe(4); });
// test('check', () => { expect(arr.length).toBe(3); }); // FAIL! arr is [1,2,3,4]

// GOOD — fresh state per test:
describe("Test Isolation", () => {
  test("each test creates its own data", () => {
    const items = [1, 2, 3];
    items.push(4);
    expect(items.length).toBe(4);
  });

  test("not affected by previous test", () => {
    const items = [1, 2, 3];
    expect(items.length).toBe(3); // Fresh array!
  });
});

// --- Common flaky test causes and fixes ---
// 1. TIME: use fake timers instead of real setTimeout
// 2. NETWORK: mock fetch/API calls
// 3. ORDER: no shared mutable state
// 4. RANDOMNESS: test patterns, not exact values
//    BAD:  expect(generateId()).toBe('abc123')
//    GOOD: expect(generateId()).toMatch(/^[a-z0-9]{6}$/)


// ============================================================
// EXAMPLE 8 — Practical: Complete Test Suite for ShoppingCart
// Story: Swiggy Instamart's cart has 45 tests covering every edge
//   case: empty cart, bulk items, coupon stacking (rejected), and
//   unicode item names (trailing space = different item — real bug).
// ============================================================

describe("ShoppingCart — Complete Suite", () => {
  let cart;
  beforeEach(() => { cart = new ShoppingCart(); });
  afterEach(() => { cart = null; });

  describe("empty cart", () => {
    test("should have 0 items", () => { expect(cart.getItemCount()).toBe(0); });
    test("should have Rs.0 total", () => { expect(cart.getTotal()).toBe(0); });
  });

  describe("adding items", () => {
    test("should add single item", () => {
      cart.addItem("Samosa", 20);
      expect(cart.getItemCount()).toBe(1);
      expect(cart.getSubtotal()).toBe(20);
    });

    test("should handle multiple items", () => {
      cart.addItem("Chai", 15);
      cart.addItem("Biscuit", 30);
      cart.addItem("Samosa", 20, 3);
      expect(cart.getItemCount()).toBe(5);
      expect(cart.getSubtotal()).toBe(105);
    });

    test("should merge duplicates", () => {
      cart.addItem("Chai", 15);
      cart.addItem("Chai", 15, 2);
      expect(cart.getItemCount()).toBe(3);
    });

    test("should support method chaining", () => {
      const result = cart.addItem("A", 10).addItem("B", 20);
      expect(result).toBe(cart);
    });
  });

  describe("removing items", () => {
    test("should remove existing item", () => {
      cart.addItem("Chai", 15).addItem("Samosa", 20);
      cart.removeItem("Chai");
      expect(cart.getItemCount()).toBe(1);
    });

    test("should throw for missing item", () => {
      expect(() => cart.removeItem("Ghost")).toThrow("not found");
    });
  });

  describe("coupons", () => {
    test("should apply valid coupon", () => {
      cart.addItem("Laptop Bag", 2000);
      cart.applyCoupon("FLAT10", 10);
      expect(cart.getTotal()).toBe(1800);
    });

    test("should reject second coupon", () => {
      cart.addItem("Item", 100);
      cart.applyCoupon("FIRST", 10);
      expect(() => cart.applyCoupon("SECOND", 20)).toThrow("Only one coupon");
    });

    test("should reject discount over 50%", () => {
      expect(() => cart.applyCoupon("SCAM", 75)).toThrow();
    });
  });

  describe("clear", () => {
    test("should reset to empty state", () => {
      cart.addItem("A", 100).addItem("B", 200);
      cart.applyCoupon("CODE", 10);
      cart.clear();
      expect(cart.getItemCount()).toBe(0);
      expect(cart.getTotal()).toBe(0);
    });
  });

  describe("edge cases", () => {
    test("should handle large quantities", () => {
      cart.addItem("Pen", 5, 10000);
      expect(cart.getSubtotal()).toBe(50000);
    });

    test("should handle decimal prices", () => {
      cart.addItem("Candy", 2.5, 3);
      expect(cart.getSubtotal()).toBe(7.5);
    });
  });
});

// --- Print summary ---
console.log(`\n=== RESULTS: ${results.passed} passed, ${results.failed} failed, ${results.skipped} skipped ===`);
if (results.errors.length > 0) {
  console.log("Failures:");
  results.errors.forEach((e) => console.log(`  - ${e.name}: ${e.error}`));
}


// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. AAA Pattern (Arrange -> Act -> Assert) is the foundation.
//    Use it consistently in every test you write.
//
// 2. describe() groups tests; test()/it() defines cases. Nest
//    describes for Module -> Method -> Scenario hierarchy.
//
// 3. beforeEach/afterEach for per-test setup/teardown.
//    beforeAll/afterAll for expensive one-time setup (DB, server).
//
// 4. test.skip for temporary exclusion, test.only for debugging
//    (NEVER commit!), test.todo for planning future tests.
//
// 5. Name tests clearly: "should [behavior] when [condition]".
//
// 6. Test isolation is non-negotiable. No shared mutable state.
//
// 7. Flaky tests destroy trust. Fix immediately or delete.
//    Causes: time, network, order dependency, randomness.
// ============================================================
