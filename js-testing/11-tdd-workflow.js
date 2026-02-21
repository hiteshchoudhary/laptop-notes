// ============================================================
// FILE 11: TEST-DRIVEN DEVELOPMENT (TDD) WORKFLOW
// Topic: Build software by writing tests FIRST, then code to pass them
// WHY: TDD flips the traditional workflow — instead of writing code
//   and hoping it works, you define what "working" means upfront.
//   This leads to cleaner APIs, fewer bugs, and code that is
//   testable by design. Critical for payment and financial systems.
// ============================================================

// ============================================================
// EXAMPLE 1 — Razorpay's Refund Calculator: Built Test-First
// Story: Razorpay processes millions of transactions daily across
//   India. Their refund module handles partial refunds, full refunds,
//   and GST reversals. The team used TDD — writing tests FIRST that
//   defined exactly how every refund scenario should work. Result:
//   zero production bugs in the refund module for 18+ months.
// ============================================================

// WHY: TDD is not about testing — it is about DESIGN.
// When you write the test first, you design the API from the
// consumer's perspective before writing a single line of logic.

// --- The TDD Cycle ---
// Phase 1: RED    — Write a test that FAILS (code doesn't exist yet)
// Phase 2: GREEN  — Write the MINIMUM code to make the test pass
// Phase 3: REFACTOR — Clean up code while keeping all tests green
// Then repeat for the next requirement.

// --- Why TDD matters ---
// - Forces you to think about API design BEFORE implementation
// - Catches edge cases early (you think about them while writing tests)
// - 100% test coverage by default (every line exists to pass a test)
// - Tests become documentation of intended behavior
// - Refactoring becomes fearless — tests catch regressions instantly
// - You write LESS code overall (only what's needed to pass tests)

// --- TDD in numbers (Razorpay's internal data) ---
// Before TDD: avg 3.2 bugs per module per quarter in payment code
// After TDD:  avg 0.1 bugs per module per quarter in refund module
// Code written per feature: 15% less (no speculative/unused code)
// Time to onboard new engineer: 40% faster (tests explain behavior)


// ============================================================
// EXAMPLE 2 — TDD Walkthrough: Steps 1-3 (Full Refund)
// Story: You just joined the Razorpay payments team. The tech lead
//   says: "Build a RefundCalculator using TDD." Here is how you
//   build it one Red-Green-Refactor cycle at a time.
// ============================================================

// WHY: The best way to learn TDD is to see the FULL evolution.
// Most tutorials show the final code. We show every step, including
// the moments where the test fails (RED) and exactly why it fails.
// Watch the code EVOLVE from nothing to a fully-featured module.

// --- Step 1: RED — Write a failing test for full refund ---
// test('should calculate full refund', () => {
//   const calc = new RefundCalculator();
//   const result = calc.calculateRefund(1000, 'full');
//   expect(result.refundAmount).toBe(1000);
//   expect(result.status).toBe('approved');
// });
// RESULT: RED — RefundCalculator doesn't exist yet!

// --- Step 2: GREEN — Write minimum code to pass ---
class RefundCalculator_v1 {
  calculateRefund(originalAmount, type) {
    return { refundAmount: originalAmount, status: 'approved' };
  }
}

const calc_v1 = new RefundCalculator_v1();
console.log("--- Step 2: GREEN ---");
console.log("Full refund:", calc_v1.calculateRefund(1000, 'full'));
// Output: { refundAmount: 1000, status: 'approved' }

// --- Step 3: REFACTOR ---
// Is there anything to clean up? Code is simple enough. No duplication,
// no unnecessary complexity. When we have more code, refactoring will
// matter more. For now, we move to the next requirement.
//
// IMPORTANT: The refactor step is NOT optional. It's when you:
// - Extract helper functions
// - Rename variables for clarity
// - Remove duplication between code paths
// - Simplify complex conditionals
// The key rule: ALL tests must still pass after refactoring.


// ============================================================
// EXAMPLE 3 — TDD Walkthrough: Steps 4-5 (Partial Refund)
// Story: Product manager says "We need partial refunds." The team
//   writes a new failing test, then extends the code.
// ============================================================

// --- Step 4: RED — Test partial refund ---
// test('should calculate partial refund (percentage)', () => {
//   const result = calc.calculateRefund(1000, 'partial', 50);
//   expect(result.refundAmount).toBe(500);   // 50% of 1000
// });
// RED — Our v1 ignores the percentage parameter!

// --- Step 5: GREEN — Add percentage logic ---
class RefundCalculator_v2 {
  calculateRefund(originalAmount, type, percentage = 100) {
    let refundAmount = type === 'full'
      ? originalAmount
      : (originalAmount * percentage) / 100;
    return { refundAmount, status: 'approved' };
  }
}

const calc_v2 = new RefundCalculator_v2();
console.log("\n--- Step 5: GREEN ---");
console.log("Full:", calc_v2.calculateRefund(1000, 'full'));
console.log("50%:", calc_v2.calculateRefund(1000, 'partial', 50));
console.log("25%:", calc_v2.calculateRefund(2000, 'partial', 25));


// ============================================================
// EXAMPLE 4 — TDD Walkthrough: Steps 6-7 (Validation)
// Story: QA asks "What if someone requests 150% refund?" A failing
//   test is written, then validation logic is added.
// ============================================================

// WHY: TDD excels at catching edge cases. While writing tests, you
// naturally ask: "What if the percentage is 150%? What if it's zero?"
// These questions arise DURING test writing, not after deployment.

// --- Step 6: RED — Test over-refund rejection ---
// test('should not allow refund greater than original', () => {
//   const result = calc.calculateRefund(1000, 'partial', 150);
//   expect(result.status).toBe('rejected');
// });

// --- Step 7: GREEN — Add validation ---
class RefundCalculator_v3 {
  calculateRefund(originalAmount, type, percentage = 100) {
    let refundAmount = type === 'full'
      ? originalAmount
      : (originalAmount * percentage) / 100;

    if (refundAmount > originalAmount) {
      return { refundAmount: 0, status: 'rejected', reason: 'Refund exceeds original' };
    }
    return { refundAmount, status: 'approved' };
  }
}

const calc_v3 = new RefundCalculator_v3();
console.log("\n--- Step 7: GREEN ---");
console.log("150% refund:", calc_v3.calculateRefund(1000, 'partial', 150));
// { refundAmount: 0, status: 'rejected', reason: 'Refund exceeds original' }


// ============================================================
// EXAMPLE 5 — TDD Walkthrough: Steps 8-9 (GST Reversal)
// Story: India's tax law requires GST reversal on refunds. Razorpay's
//   tax team says: "Refunds must show the GST component at 18%."
// ============================================================

// WHY: In India, when a refund is issued, the GST collected on that
// transaction must also be reversed. This is a legal requirement
// under the GST Act. Getting it wrong means tax compliance violations.

// --- Step 8: RED — Test GST reversal ---
// test('should handle refund with GST reversal', () => {
//   const result = calc.calculateRefund(1000, 'full', 100, { includeGST: true, gstRate: 18 });
//   expect(result.gstReversed).toBeCloseTo(152.54);
// });

// --- Step 9: GREEN — Add GST calculation ---
class RefundCalculator_v4 {
  calculateRefund(originalAmount, type, percentage = 100, options = {}) {
    let refundAmount = type === 'full'
      ? originalAmount
      : (originalAmount * percentage) / 100;

    if (refundAmount > originalAmount) {
      return { refundAmount: 0, status: 'rejected', reason: 'Refund exceeds original' };
    }

    const result = { refundAmount, status: 'approved' };

    // GST reversal: extract GST component from the amount
    if (options.includeGST && options.gstRate) {
      const baseAmount = refundAmount / (1 + options.gstRate / 100);
      result.gstReversed = Math.round(baseAmount * (options.gstRate / 100) * 100) / 100;
      result.totalRefund = refundAmount;
    }
    return result;
  }
}

const calc_v4 = new RefundCalculator_v4();
console.log("\n--- Step 9: GREEN ---");
console.log("Full + GST:", calc_v4.calculateRefund(1000, 'full', 100, { includeGST: true, gstRate: 18 }));
// { refundAmount: 1000, status: 'approved', gstReversed: 152.54, totalRefund: 1000 }


// ============================================================
// EXAMPLE 6 — TDD Walkthrough: Steps 10-11 (Date Validation)
// Story: Razorpay policy: refunds must be within 30 days. A failing
//   test is written for an expired request, then date logic is added.
// ============================================================

// --- Step 10: RED — Reject refund after 30-day window ---
// --- Step 11: GREEN — Add date validation ---
class RefundCalculator {
  calculateRefund(originalAmount, type, percentage = 100, options = {}) {
    // Date validation
    if (options.transactionDate && options.refundDate && options.maxRefundDays) {
      const diffMs = Math.abs(options.refundDate - options.transactionDate);
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays > options.maxRefundDays) {
        return { refundAmount: 0, status: 'rejected', reason: 'Refund window expired', daysSinceTransaction: diffDays };
      }
    }

    let refundAmount = type === 'full' ? originalAmount : (originalAmount * percentage) / 100;

    if (refundAmount > originalAmount) {
      return { refundAmount: 0, status: 'rejected', reason: 'Refund exceeds original' };
    }

    const result = { refundAmount, status: 'approved' };

    if (options.includeGST && options.gstRate) {
      const baseAmount = refundAmount / (1 + options.gstRate / 100);
      result.gstReversed = Math.round(baseAmount * (options.gstRate / 100) * 100) / 100;
    }
    return result;
  }
}

const calculator = new RefundCalculator();
console.log("\n--- Step 11: GREEN ---");
console.log("Within window:", calculator.calculateRefund(1000, 'full', 100, {
  transactionDate: new Date('2024-01-01'), refundDate: new Date('2024-01-15'), maxRefundDays: 30
}));
console.log("Expired:", calculator.calculateRefund(1000, 'full', 100, {
  transactionDate: new Date('2024-01-01'), refundDate: new Date('2024-02-15'), maxRefundDays: 30
}));


// ============================================================
// EXAMPLE 7 — The Complete Evolution: Test Suite as Documentation
// Story: After 5 Red-Green-Refactor cycles, the Razorpay team has a
//   fully tested RefundCalculator. Reading the test suite tells you
//   EXACTLY what the module does — no separate docs needed.
// ============================================================

// WHY: TDD gives you a complete history of WHY each piece of code exists.

// Complete test suite:
// describe('RefundCalculator', () => {
//   test('should calculate full refund');                    // Cycle 1
//   test('should calculate partial refund (percentage)');    // Cycle 2
//   test('should reject refund exceeding original');         // Cycle 3
//   test('should handle refund with GST reversal');          // Cycle 4
//   test('should reject refund after 30-day window');        // Cycle 5
// });

console.log("\n--- Complete Test Verification ---");
const scenarios = [
  { desc: "Full refund",        args: [1000, 'full'] },
  { desc: "Partial 50%",        args: [1000, 'partial', 50] },
  { desc: "Over-refund (150%)", args: [1000, 'partial', 150] },
  { desc: "Full + GST 18%",     args: [1000, 'full', 100, { includeGST: true, gstRate: 18 }] },
  { desc: "Expired (45 days)",  args: [1000, 'full', 100, {
    transactionDate: new Date('2024-01-01'), refundDate: new Date('2024-02-15'), maxRefundDays: 30
  }]},
];
scenarios.forEach(s => {
  console.log(`  ${s.desc}:`, JSON.stringify(calculator.calculateRefund(...s.args)));
});


// ============================================================
// EXAMPLE 8 — When TDD Works Best (and When It Does Not)
// Story: Razorpay's architect explains TDD is not a silver bullet.
//   TDD for business logic, "test after" for UI prototyping.
// ============================================================

console.log("\n--- When to Use TDD ---");
console.log("TDD excels for: business logic, algorithms, validators, API contracts, state machines");
console.log("TDD is hard for: UI components, exploratory code, prototypes, third-party integrations");

// --- TDD vs Test-After ---
// Both valid! TDD for critical logic, test-after for everything else.
const teamGuidelines = {
  useTDD: ["Payment processing", "Tax calculations", "Auth rules", "Data validation"],
  useTestAfter: ["UI components", "Admin dashboards", "Migration scripts", "Experimental features"]
};
console.log("\nTeam Guidelines:", teamGuidelines);

// --- TDD vs Test-After: A side-by-side comparison ---
// TDD Approach:
//   1. Write failing test for "refund should not exceed original"
//   2. Write if (refundAmount > originalAmount) check
//   3. Refactor
//   Result: Edge case caught DURING development
//
// Test-After Approach:
//   1. Write entire refund calculator based on requirements
//   2. Write tests to verify
//   3. Realize you forgot the "refund exceeds original" case
//   4. Add test, fix code
//   Result: Same code, but edge case found AFTER, requiring a fix
//
// Both produce working code. TDD finds problems earlier.
// Neither is "wrong" — they're tools for different situations.


// ============================================================
// EXAMPLE 9 — Common TDD Mistakes
// Story: A new Razorpay engineer writes 20 tests before any code.
//   All 20 fail. They are overwhelmed. The tech lead explains the
//   common mistakes that make TDD feel painful.
// ============================================================

console.log("\n--- Common TDD Mistakes ---");
console.log("  1. Writing too many tests at once — stick to ONE at a time");
console.log("  2. Testing implementation details instead of behavior");
console.log("     BAD:  expect(calculator._internalState).toBe(...)");
console.log("     GOOD: expect(calculator.calculateRefund(...)).toEqual(...)");
console.log("  3. Making too big a step — write MINIMUM code to pass");
console.log("  4. Skipping refactor step — RED->GREEN->RED->GREEN = messy code");
console.log("  5. Testing trivial code — getters, setters, constructors add no value");


// ============================================================
// EXAMPLE 10 — Practical: TDD a CouponValidator
// Story: Swiggy's coupon system validates discount codes with complex
//   rules. TDD makes each rule a separate cycle.
// ============================================================

// --- Requirement: CouponValidator ---
// 1. Validate coupon code format (alphanumeric, 6-12 chars)
// 2. Check if coupon is expired
// 3. Check if coupon has remaining uses
// 4. Calculate discount amount (percentage or flat)
// 5. Cap discount at maxDiscount if specified

// RED: Test 1 — "should accept valid coupon format"
// test('should accept valid coupon format', () => {
//   const validator = new CouponValidator();
//   expect(validator.isValidFormat('SAVE20')).toBe(true);
//   expect(validator.isValidFormat('hi')).toBe(false);
// });
// RED: fails because CouponValidator doesn't exist!

// GREEN: implement isValidFormat
// RED: Test 2 — "should reject expired coupon"
// GREEN: implement isExpired check
// RED: Test 3 — "should reject coupon at usage limit"
// GREEN: implement hasRemainingUses
// RED: Test 4 — "should calculate percentage discount"
// GREEN: implement calculateDiscount
// RED: Test 5 — "should cap discount at maxDiscount"
// GREEN: add maxDiscount check

// After 5 Red-Green-Refactor cycles, here is the final class:

class CouponValidator {
  isValidFormat(code) {
    return /^[A-Z0-9]{6,12}$/.test(code);
  }

  calculateDiscount(coupon, orderAmount) {
    if (!this.isValidFormat(coupon.code)) {
      return { valid: false, reason: 'Invalid coupon format' };
    }
    if (new Date(coupon.expiryDate) < new Date()) {
      return { valid: false, reason: 'Coupon expired' };
    }
    if (coupon.usedCount >= coupon.maxUses) {
      return { valid: false, reason: 'Usage limit reached' };
    }

    let discount = coupon.type === 'percentage'
      ? (orderAmount * coupon.value) / 100
      : coupon.value;

    if (coupon.maxDiscount && discount > coupon.maxDiscount) discount = coupon.maxDiscount;
    if (discount > orderAmount) discount = orderAmount;

    return {
      valid: true,
      discount: Math.round(discount * 100) / 100,
      finalAmount: Math.round((orderAmount - discount) * 100) / 100
    };
  }
}

const cv = new CouponValidator();
console.log("\n--- CouponValidator TDD Results ---");
console.log("Format 'SAVE20':", cv.isValidFormat('SAVE20'));     // true
console.log("Format 'hi':", cv.isValidFormat('hi'));             // false

const validCoupon = {
  code: 'DIWALI50', type: 'percentage', value: 50,
  maxDiscount: 500, expiryDate: '2026-12-31', usedCount: 3, maxUses: 100
};
console.log("50% off Rs 2000:", cv.calculateDiscount(validCoupon, 2000));
// { valid: true, discount: 500, finalAmount: 1500 }

const expired = {
  code: 'OLD2023', type: 'flat', value: 100,
  expiryDate: '2023-01-01', usedCount: 0, maxUses: 10
};
console.log("Expired coupon:", cv.calculateDiscount(expired, 1000));
// { valid: false, reason: 'Coupon expired' }

// Notice how TDD built this class incrementally:
// Cycle 1: isValidFormat() — just format checking
// Cycle 2: isExpired() — date comparison
// Cycle 3: hasRemainingUses() — counter check
// Cycle 4: calculateDiscount() — percentage and flat
// Cycle 5: maxDiscount cap — business rule
// Each cycle added ONE capability, driven by ONE failing test.

// --- The TDD Rhythm ---
// A good TDD session has a rhythm like breathing:
//   Write test (inhale — think about what you want)
//   Make it pass (exhale — write the code)
//   Clean up (pause — reflect and improve)
//   Repeat
//
// Each cycle: 2-10 minutes. If longer, your step is too big.
// A typical 2-hour TDD session: 12-60 cycles.
// At the end: well-tested, clean code that grew organically.


// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. TDD = Red (failing test) -> Green (minimum code) -> Refactor
//    (clean up). Never have more than one failing test at a time.
// 2. TDD is about DESIGN, not testing. Writing tests first forces
//    you to design the API from the caller's perspective.
// 3. Each TDD cycle should take 2-10 minutes. If longer, your step
//    is too big — break it into smaller pieces.
// 4. TDD excels for business logic, algorithms, validators. It is
//    harder for UI, prototypes, and third-party integrations.
// 5. Common mistakes: too many tests at once, testing implementation
//    details, skipping refactor, making GREEN steps too large.
// 6. TDD and test-after are BOTH valid. Use TDD for critical logic.
// 7. Tests written through TDD serve as living documentation —
//    reading the suite tells you exactly what the code does.
// ============================================================
