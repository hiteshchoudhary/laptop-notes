// ============================================================
// FILE 01: TESTING FUNDAMENTALS
// Topic: Why testing matters and building your first tests from scratch
// WHY: Every line of untested code is a liability. Testing gives you
//   confidence to ship, documents behavior for your team, and catches
//   regressions before your users do. This file builds intuition from zero.
// ============================================================

// ============================================================
// EXAMPLE 1 — The Flipkart Big Billion Days Disaster
// Story: During Flipkart's Big Billion Days sale, a price calculation
//   bug in the discount engine set a laptop's price to Rs.1 instead of
//   Rs.10,000. Over 500 orders shipped at that price before anyone
//   noticed. A single unit test — `expect(applyDiscount(10000, 10)).toBe(9000)`
//   — would have caught it in 2 seconds during CI.
// ============================================================

// WHY: Let's first understand what testing IS before writing any code.
// Testing = running your code with known inputs and verifying the outputs
// match your expectations. That's it. Everything else is tooling around this idea.

// --- The Cost of NOT Testing ---
// Flipkart's price bug: 500 orders x Rs.9,999 loss = Rs.49,99,500 lost
// That's nearly Rs.50 lakh from ONE untested function.

function applyDiscount(price, discountPercent) {
  // BUG: Someone wrote `price - discountPercent` instead of calculating percentage
  // return price - discountPercent;  // Rs.10,000 - 10 = Rs.9,990? No — even worse bugs happen

  // CORRECT implementation:
  if (price < 0 || discountPercent < 0 || discountPercent > 100) {
    throw new Error("Invalid price or discount");
  }
  const discountAmount = (price * discountPercent) / 100;
  return price - discountAmount;
}

// A simple test would have caught this instantly:
// applyDiscount(10000, 10) should return 9000, NOT 9990 or 1

console.log("applyDiscount(10000, 10):", applyDiscount(10000, 10));
// Output: applyDiscount(10000, 10): 9000


// ============================================================
// EXAMPLE 2 — Why Test? The Four Pillars of Confidence
// Story: PhonePe processes 4+ billion UPI transactions monthly. Every
//   code change goes through 15,000+ automated tests. If even ONE test
//   fails, the deployment stops. This is why India's UPI system rarely
//   goes down despite constant feature updates.
// ============================================================

// WHY: Testing gives you four superpowers:
// 1. CONFIDENCE — deploy on Friday afternoon without fear
// 2. DOCUMENTATION — tests describe what the code SHOULD do
// 3. REGRESSION PREVENTION — old bugs don't come back
// 4. REFACTORING SAFETY — restructure code knowing nothing broke

// --- Pillar 1: Confidence ---
// Without tests, every deployment is a gamble.
// With tests, you KNOW the critical paths work.

function calculateGST(amount, gstRate) {
  // GST calculation — used in every Indian e-commerce checkout
  if (typeof amount !== "number" || typeof gstRate !== "number") {
    throw new TypeError("Amount and GST rate must be numbers");
  }
  if (amount < 0) throw new RangeError("Amount cannot be negative");
  return Math.round(amount * gstRate) / 100; // Return in paise precision
}

// --- Pillar 2: Documentation ---
// This test tells you EXACTLY what calculateGST should do:
// test: calculateGST(1000, 18) should return 180
// test: calculateGST(0, 18) should return 0
// test: calculateGST(-100, 18) should throw RangeError
// Tests ARE documentation that can never go stale.

// --- Pillar 3: Regression Prevention ---
// Two months later, someone "optimizes" calculateGST.
// Tests catch if the optimization broke the Rs.0 edge case.

// --- Pillar 4: Refactoring Safety ---
// You want to rename variables, extract functions, restructure.
// Tests let you do this fearlessly.


// ============================================================
// EXAMPLE 3 — Types of Tests: The Testing Pyramid
// Story: Ola Cabs has three layers of testing. Unit tests check fare
//   calculation in isolation. Integration tests verify that fare +
//   payment + rider notification work together. E2E tests simulate
//   a real user booking a ride from the app. 70% of their 8,000 tests
//   are unit tests — fast, cheap, and laser-focused.
// ============================================================

// WHY: Not all tests are equal. Understanding the types helps you
// invest your testing effort where it gives maximum return.

// --- The Testing Pyramid ---
//
//          /  E2E  \           <- Few (slow, expensive, brittle)
//         /----------\
//        / Integration \       <- Some (moderate speed/cost)
//       /----------------\
//      /   Unit  Tests    \    <- Many (fast, cheap, focused)
//     /____________________\
//
// Rule of thumb: 70% unit, 20% integration, 10% E2E

// --- UNIT TEST ---
// Tests ONE function in isolation. No dependencies, no network, no DB.
// Fast: runs in milliseconds.

function calculateFare(distanceKm, ratePerKm, surgeFactor = 1) {
  const baseFare = 50; // Rs.50 base fare (like Ola minimum)
  const fare = baseFare + distanceKm * ratePerKm * surgeFactor;
  return Math.round(fare * 100) / 100; // Round to 2 decimal places
}

// Unit test examples (conceptual):
// calculateFare(5, 12) => 50 + 60 = 110
// calculateFare(5, 12, 1.5) => 50 + 90 = 140 (surge pricing)
// calculateFare(0, 12) => 50 (minimum fare)
console.log("Fare (5km, Rs.12/km):", calculateFare(5, 12));
// Output: Fare (5km, Rs.12/km): 110
console.log("Fare (5km, Rs.12/km, 1.5x surge):", calculateFare(5, 12, 1.5));
// Output: Fare (5km, Rs.12/km, 1.5x surge): 140

// --- INTEGRATION TEST ---
// Tests how multiple units work TOGETHER.
// Example: fare calculation + payment processing + receipt generation

function processRide(distanceKm, ratePerKm, paymentMethod) {
  const fare = calculateFare(distanceKm, ratePerKm);
  const gst = calculateGST(fare, 5); // 5% GST on ride
  const total = fare + gst;
  return {
    fare,
    gst,
    total,
    paymentMethod,
    status: "completed",
  };
}

console.log("Ride receipt:", processRide(10, 15, "UPI"));
// Output: Ride receipt: { fare: 200, gst: 10, total: 210, paymentMethod: 'UPI', status: 'completed' }

// --- E2E (End-to-End) TEST ---
// Simulates real user: open app → enter destination → book ride → pay → rate driver
// Uses tools like Playwright, Cypress, or Selenium
// Slowest but tests the REAL user journey
// Example (pseudocode):
// 1. Open Ola app
// 2. Enter "Koramangala to Indiranagar"
// 3. Click "Book Ola Mini"
// 4. Wait for driver assignment
// 5. Verify fare shown matches calculation
// 6. Complete ride, verify receipt


// ============================================================
// EXAMPLE 4 — The Testing Trophy (Kent C. Dodds' Model)
// Story: Freshworks, the Chennai-based SaaS unicorn, shifted from
//   the testing pyramid to the testing trophy model. They found that
//   integration tests caught 80% of bugs while being nearly as fast
//   as unit tests. Their defect rate dropped 40% after the shift.
// ============================================================

// WHY: The testing trophy is a modern alternative to the pyramid.
// It emphasizes integration tests as the sweet spot for confidence-per-effort.

// --- The Testing Trophy ---
//
//      Static Analysis     (ESLint, TypeScript — catches typos/type errors)
//           |
//      Unit Tests          (individual functions)
//           |
//   >> Integration Tests << (the SWEET SPOT — modules working together)
//           |
//      E2E Tests           (full user flows)
//
// Key insight: Integration tests give the most confidence per test dollar.
// Unit tests can pass while the modules don't work together.

// --- Static Analysis (the free layer) ---
// TypeScript catches: `calculateFare("five", 12)` — type error!
// ESLint catches: `if (fare = 100)` — assignment instead of comparison!
// These aren't "tests" but they catch bugs before tests even run.

// --- What to Test vs What NOT to Test ---

// DO TEST:
// 1. Business logic — calculateFare, applyDiscount, validatePAN
// 2. Edge cases — empty arrays, null inputs, boundary values
// 3. Error paths — network failures, invalid data, permission denied
// 4. Integration points — does payment + notification work together?

// DO NOT TEST:
// 1. Framework internals — don't test if React renders a <div>
// 2. Simple getters/setters — `user.getName()` returns `this.name`
// 3. Third-party libraries — Lodash already has tests
// 4. Constants — `expect(TAX_RATE).toBe(0.18)` tests nothing useful
// 5. Implementation details — HOW it works, not WHAT it does


// ============================================================
// EXAMPLE 5 — Testing Frameworks: The Landscape
// Story: Zerodha, India's largest stockbroker, migrated from Mocha to
//   Vitest in 2023. Their test suite went from 45 seconds to 8 seconds.
//   The native ESM support meant no more babel transforms. The Kite
//   trading platform now runs 2,000 tests in under 10 seconds.
// ============================================================

// WHY: Choosing the right framework saves hundreds of developer-hours.
// Let's understand what's available and when to use each.

// --- Framework Comparison ---
//
// | Framework    | Speed    | ESM Support | Config | Ecosystem    |
// |-------------|----------|-------------|--------|--------------|
// | Vitest      | Fastest  | Native      | Minimal| Growing fast |
// | Jest        | Fast     | Via config  | Medium | Massive      |
// | Mocha       | Medium   | Via config  | Manual | Mature       |
// | node:test   | Fast     | Native      | Zero   | Built-in     |
//
// Recommendation for new projects: Vitest
// For existing Jest projects: Stay with Jest (migration optional)
// For simple scripts: node:test (zero install)

// --- Vitest vs Jest ---
// Vitest:
//   - Native ESM (import/export just works)
//   - Vite-powered (reuses your Vite config)
//   - Jest-compatible API (easy migration)
//   - Watch mode is blazing fast (HMR-based)
//   - Better TypeScript support out of the box
//
// Jest:
//   - Massive ecosystem (more plugins, more examples)
//   - Battle-tested at Facebook scale
//   - Better snapshot testing
//   - More IDE integrations
//   - Been around since 2014 (proven stability)


// ============================================================
// EXAMPLE 6 — Building a Mini Test Framework from Scratch
// Story: Before MakeMyTrip adopted Jest, their QA team used a
//   custom 50-line test runner. It was crude but it caught bugs.
//   Understanding how test runners work under the hood makes you
//   a better tester — you stop treating the framework as magic.
// ============================================================

// WHY: Building from scratch teaches you that test frameworks are
// just functions. assert() + try/catch + colored output = a test runner.

// --- Step 1: The assert function ---
// This is the atom of testing: check a condition, throw if false.

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

// Usage:
assert(applyDiscount(10000, 10) === 9000, "10% off Rs.10,000 should be Rs.9,000");
assert(applyDiscount(500, 50) === 250, "50% off Rs.500 should be Rs.250");
console.log("Basic assertions passed!");
// Output: Basic assertions passed!

// --- Step 2: The test() function ---
// Wraps each test in try/catch so one failure doesn't stop everything.

const testResults = { passed: 0, failed: 0, errors: [] };

function test(name, fn) {
  try {
    fn();
    testResults.passed++;
    console.log(`  PASS: ${name}`);
  } catch (error) {
    testResults.failed++;
    testResults.errors.push({ name, error: error.message });
    console.log(`  FAIL: ${name}`);
    console.log(`    -> ${error.message}`);
  }
}

// --- Step 3: The describe() function ---
// Groups related tests under a label.

function describe(suiteName, fn) {
  console.log(`\n${suiteName}`);
  fn();
}

// --- Step 4: A simple expect() function ---
// Returns an object with matcher methods.

function expect(received) {
  return {
    toBe(expected) {
      assert(
        received === expected,
        `Expected ${expected} but received ${received}`
      );
    },
    toEqual(expected) {
      assert(
        JSON.stringify(received) === JSON.stringify(expected),
        `Expected ${JSON.stringify(expected)} but received ${JSON.stringify(received)}`
      );
    },
    toThrow() {
      let threw = false;
      try {
        received(); // received should be a function
      } catch (e) {
        threw = true;
      }
      assert(threw, "Expected function to throw but it did not");
    },
    not: {
      toBe(expected) {
        assert(
          received !== expected,
          `Expected ${received} to NOT be ${expected}`
        );
      },
    },
  };
}

// --- Step 5: Use our mini framework! ---

describe("applyDiscount", () => {
  test("should apply 10% discount correctly", () => {
    expect(applyDiscount(10000, 10)).toBe(9000);
  });

  test("should apply 50% discount correctly", () => {
    expect(applyDiscount(500, 50)).toBe(250);
  });

  test("should return full price for 0% discount", () => {
    expect(applyDiscount(1000, 0)).toBe(1000);
  });

  test("should return 0 for 100% discount", () => {
    expect(applyDiscount(1000, 100)).toBe(0);
  });

  test("should throw for negative price", () => {
    expect(() => applyDiscount(-100, 10)).toThrow();
  });

  test("should throw for discount over 100%", () => {
    expect(() => applyDiscount(1000, 150)).toThrow();
  });
});

describe("calculateFare", () => {
  test("should calculate base fare + distance", () => {
    expect(calculateFare(5, 12)).toBe(110); // 50 + 60
  });

  test("should apply surge pricing", () => {
    expect(calculateFare(5, 12, 1.5)).toBe(140); // 50 + 90
  });

  test("should return base fare for 0 distance", () => {
    expect(calculateFare(0, 12)).toBe(50);
  });
});

// Print summary
console.log(`\n--- Results: ${testResults.passed} passed, ${testResults.failed} failed ---`);


// ============================================================
// EXAMPLE 7 — Real Test File Structure (Vitest/Jest)
// Story: Paytm's checkout team writes one test file per module.
//   `checkout.test.js` mirrors `checkout.js`. Every PR must include
//   tests or explain why not. Their code review template has a checkbox:
//   "Tests added or updated? [ ]"
// ============================================================

// WHY: Knowing the standard structure means you can read ANY team's tests.
// describe → test → expect is the universal language of JavaScript testing.

// --- Standard Vitest/Jest Test File ---
// File: src/utils/pricing.test.js

/*
import { describe, test, expect } from 'vitest';   // Vitest imports
import { applyDiscount, calculateGST } from './pricing.js';

describe('Pricing Module', () => {

  describe('applyDiscount', () => {
    test('should apply percentage discount correctly', () => {
      // Arrange
      const price = 10000;
      const discount = 10;

      // Act
      const result = applyDiscount(price, discount);

      // Assert
      expect(result).toBe(9000);
    });

    test('should handle zero discount', () => {
      expect(applyDiscount(1000, 0)).toBe(1000);
    });

    test('should throw for invalid inputs', () => {
      expect(() => applyDiscount(-100, 10)).toThrow();
      expect(() => applyDiscount(100, -10)).toThrow();
      expect(() => applyDiscount(100, 150)).toThrow();
    });
  });

  describe('calculateGST', () => {
    test('should calculate 18% GST on Rs.1000', () => {
      expect(calculateGST(1000, 18)).toBe(180);
    });

    test('should return 0 for zero amount', () => {
      expect(calculateGST(0, 18)).toBe(0);
    });
  });

});
*/


// ============================================================
// EXAMPLE 8 — Test File Naming & Running Tests
// Story: Groww, the Bengaluru investment platform, uses a strict
//   naming convention: every `*.js` file has a corresponding `*.test.js`.
//   Their CI pipeline auto-discovers test files by pattern. If you name
//   your test file wrong, CI won't find it and you'll ship untested code.
// ============================================================

// WHY: Test discovery depends on naming. Get it wrong, and your tests
// exist but never run — a false sense of security.

// --- Naming Conventions ---
// Convention 1: *.test.js (most common)
//   src/utils/pricing.js       -> src/utils/pricing.test.js
//   src/services/payment.js    -> src/services/payment.test.js
//
// Convention 2: *.spec.js (common in Angular world)
//   src/utils/pricing.js       -> src/utils/pricing.spec.js
//
// Convention 3: __tests__/ directory (Jest default)
//   src/utils/pricing.js       -> src/utils/__tests__/pricing.test.js
//
// Recommendation: Use *.test.js, keep test next to source file.
// It's easier to find and keeps related code together.

// --- Running Tests ---
//
// Vitest:
//   npx vitest                    # Run all tests (watch mode)
//   npx vitest run                # Run once (CI mode)
//   npx vitest pricing.test.js    # Run specific file
//   npx vitest --reporter=verbose # Detailed output
//
// Jest:
//   npx jest                      # Run all tests
//   npx jest --watch              # Watch mode
//   npx jest pricing.test.js      # Run specific file
//   npx jest --coverage           # Generate coverage report
//
// Node.js built-in (node:test):
//   node --test                   # Run all *.test.js files
//   node --test pricing.test.js   # Run specific file
//   node --test --watch           # Watch mode (Node 19+)


// ============================================================
// EXAMPLE 9 — Practical: Full Mini Framework in Action
// Story: A startup in Hyderabad couldn't afford CI/CD tooling in
//   their early days. Their CTO wrote a 30-line test runner that ran
//   via `node test.js`. It caught 3 critical bugs in their first month.
//   You don't need fancy tools to start testing — you need the habit.
// ============================================================

// WHY: Let's put it all together — a realistic scenario using our
// mini framework, then show the Vitest equivalent.

// --- The module under test: Indian PAN Card Validator ---

function validatePAN(pan) {
  // PAN format: AAAAA9999A (5 letters, 4 digits, 1 letter)
  // Fourth character: type — C (Company), P (Person), H (HUF), etc.
  if (typeof pan !== "string") return { valid: false, error: "PAN must be a string" };

  const panUpper = pan.toUpperCase().trim();
  if (panUpper.length !== 10) return { valid: false, error: "PAN must be 10 characters" };

  const panRegex = /^[A-Z]{3}[CPHFATBLJ][A-Z]\d{4}[A-Z]$/;
  if (!panRegex.test(panUpper)) return { valid: false, error: "Invalid PAN format" };

  const typeMap = {
    C: "Company", P: "Person", H: "HUF", F: "Firm",
    A: "AOP", T: "Trust", B: "BOI", L: "Local Authority", J: "AJP",
  };

  return {
    valid: true,
    pan: panUpper,
    holderType: typeMap[panUpper[3]],
  };
}

// --- Tests using our mini framework ---

describe("PAN Card Validator", () => {
  test("should validate correct individual PAN", () => {
    const result = validatePAN("ABCPD1234E");
    expect(result.valid).toBe(true);
    expect(result.holderType).toBe("Person");
  });

  test("should validate correct company PAN", () => {
    const result = validatePAN("ABCCD1234E");
    expect(result.valid).toBe(true);
    expect(result.holderType).toBe("Company");
  });

  test("should reject PAN with wrong length", () => {
    const result = validatePAN("ABC123");
    expect(result.valid).toBe(false);
  });

  test("should reject PAN with invalid type character", () => {
    const result = validatePAN("ABCXD1234E"); // X is not a valid type
    expect(result.valid).toBe(false);
  });

  test("should handle non-string input", () => {
    const result = validatePAN(12345);
    expect(result.valid).toBe(false);
  });

  test("should handle lowercase input", () => {
    const result = validatePAN("abcpd1234e");
    expect(result.valid).toBe(true);
  });

  test("should handle whitespace", () => {
    const result = validatePAN("  ABCPD1234E  ");
    expect(result.valid).toBe(true);
  });
});

// Print final summary
console.log(`\n=== FINAL RESULTS: ${testResults.passed} passed, ${testResults.failed} failed ===`);
if (testResults.errors.length > 0) {
  console.log("Failures:");
  testResults.errors.forEach((e) => console.log(`  - ${e.name}: ${e.error}`));
}

// --- Equivalent in Vitest (for reference) ---
/*
import { describe, test, expect } from 'vitest';
import { validatePAN } from './panValidator.js';

describe('PAN Card Validator', () => {
  test('should validate correct individual PAN', () => {
    const result = validatePAN('ABCPD1234E');
    expect(result).toEqual({
      valid: true,
      pan: 'ABCPD1234E',
      holderType: 'Person'
    });
  });

  test('should reject invalid PAN format', () => {
    expect(validatePAN('INVALID')).toMatchObject({
      valid: false,
      error: expect.stringContaining('must be')
    });
  });
});
*/


// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. Testing is just: run code → check output → report pass/fail.
//    Under the hood, every framework does this.
//
// 2. The Testing Pyramid: 70% unit tests (fast, cheap), 20%
//    integration (moderate), 10% E2E (slow, expensive).
//
// 3. The Testing Trophy (modern): invest most in integration
//    tests — they catch the most real-world bugs.
//
// 4. Test what matters: business logic, edge cases, error paths.
//    Don't test framework internals or trivial getters.
//
// 5. Vitest = best for new projects (fast, native ESM).
//    Jest = fine for existing projects (huge ecosystem).
//    node:test = great for zero-dependency scripts.
//
// 6. You can build a working test framework in ~30 lines of JS.
//    assert() + test() + describe() + expect() = done.
//
// 7. Naming matters: *.test.js, keep tests next to source code.
//    Wrong name = tests exist but CI never runs them.
//
// 8. Start with ONE test. One test is infinitely better than zero.
//    The Flipkart bug: one test, two seconds, Rs.50 lakh saved.
// ============================================================
