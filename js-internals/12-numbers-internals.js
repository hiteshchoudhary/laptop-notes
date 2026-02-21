// ============================================================
// FILE 12: NUMBERS INTERNALS
// Topic: How JavaScript stores and processes numbers under the hood
// WHY: JavaScript has ONE number type — IEEE 754 double-precision
//   64-bit floating point. This single design choice causes the
//   famous 0.1 + 0.2 !== 0.3 bug, limits safe integers to 2^53,
//   and means money calculations can silently lose precision.
//   Understanding number internals prevents real financial bugs.
// ============================================================

// ============================================================
// EXAMPLE 1 — PhonePe: The Rs. 0.1 + Rs. 0.2 Bug
// Story: PhonePe processes billions of UPI transactions. Early in
//   their journey, a developer wrote: if (amount1 + amount2 === 0.3)
//   and it NEVER evaluated to true! A ₹0.30 transaction was being
//   rejected as "invalid amount." The fix? Work in paise (paisa
//   as integers). Razorpay, Stripe, and every serious payment
//   system stores money as the smallest unit (paise/cents) in integers.
// ============================================================

// WHY: 0.1 + 0.2 !== 0.3 in JavaScript. This isn't a bug in JS —
// it's a fundamental limitation of binary floating-point representation.

console.log("=== The Famous 0.1 + 0.2 Problem ===");
console.log("0.1 + 0.2 =", 0.1 + 0.2);           // 0.30000000000000004
console.log("0.1 + 0.2 === 0.3?", 0.1 + 0.2 === 0.3);  // false!
console.log();

// Why does this happen? Let's understand from the ground up.


// ============================================================
// EXAMPLE 2 — IEEE 754 Double-Precision Format
// Story: Think of it like writing fractions in binary. Just as
//   1/3 = 0.333333... repeats forever in decimal, 1/10 = 0.0001100110011...
//   repeats forever in binary. With only 52 bits for the fraction,
//   you MUST round — and rounding introduces error.
// ============================================================

// WHY: ALL JavaScript numbers are IEEE 754 double-precision 64-bit
// floating point. There is no separate "integer" type at the language level.

//
// IEEE 754 DOUBLE-PRECISION FORMAT (64 bits total):
//
// ┌───┬─────────────┬────────────────────────────────────────────────────────┐
// │ S │  Exponent   │                    Mantissa (Fraction)                 │
// │ 1 │  11 bits    │                    52 bits                             │
// │bit│             │                                                        │
// └───┴─────────────┴────────────────────────────────────────────────────────┘
//  │        │                           │
//  │        │                           └─ Fractional part (precision)
//  │        └─ Determines magnitude (how big/small: 2^exponent)
//  └─ Sign bit (0 = positive, 1 = negative)
//
// Value = (-1)^sign × 2^(exponent - 1023) × (1 + mantissa)
//
// 52 bits of mantissa ≈ 15-17 significant decimal digits of precision

console.log("=== IEEE 754 Format ===");
console.log("64 bits = 1 sign + 11 exponent + 52 mantissa");
console.log("Precision: ~15-17 significant decimal digits");
console.log();

// Demonstrate precision limits:
console.log("Precision examples:");
console.log("  0.1 stored as:", (0.1).toPrecision(20));     // 0.10000000000000000555
console.log("  0.2 stored as:", (0.2).toPrecision(20));     // 0.20000000000000001110
console.log("  0.3 stored as:", (0.3).toPrecision(20));     // 0.29999999999999998890
console.log("  0.1+0.2      :", (0.1 + 0.2).toPrecision(20)); // 0.30000000000000004441
console.log();

// Why 0.1 is repeating in binary:
console.log("Why 0.1 repeats in binary:");
console.log("  Decimal 0.1 = Binary 0.0001100110011001100110011... (repeating!)");
console.log("  Just like 1/3 = 0.33333... in decimal, 1/10 is repeating in binary.");
console.log("  With 52 bits, we must ROUND — introducing a tiny error.\n");


// ============================================================
// EXAMPLE 3 — Zerodha: MAX_SAFE_INTEGER and Large Numbers
// Story: Zerodha's trading system uses order IDs that are large
//   numbers. When an order ID exceeded 2^53, JavaScript started
//   losing precision — two DIFFERENT order IDs compared as equal!
//   They switched to string IDs for anything beyond safe integer range.
// ============================================================

// WHY: With 52 bits of mantissa + 1 implicit bit, JavaScript can
// represent integers exactly up to 2^53 - 1. Beyond that, precision
// is lost — consecutive integers can't be distinguished.

console.log("=== MAX_SAFE_INTEGER ===");
console.log("Number.MAX_SAFE_INTEGER:", Number.MAX_SAFE_INTEGER);  // 9007199254740991
console.log("That's 2^53 - 1 =", Math.pow(2, 53) - 1);
console.log();

// Beyond MAX_SAFE_INTEGER — precision lost!
const big = Number.MAX_SAFE_INTEGER;
console.log("MAX_SAFE_INTEGER:     ", big);       // 9007199254740991
console.log("MAX_SAFE_INTEGER + 1: ", big + 1);   // 9007199254740992
console.log("MAX_SAFE_INTEGER + 2: ", big + 2);   // 9007199254740992 (SAME!)
console.log("MAX_SAFE_INTEGER + 3: ", big + 3);   // 9007199254740994
console.log("MAX_SAFE_INTEGER + 4: ", big + 4);   // 9007199254740996
console.log();

// This is DANGEROUS:
console.log("9007199254740992 === 9007199254740993?", 9007199254740992 === 9007199254740993);
// true! Two different numbers are considered equal!

console.log();
console.log("Number.isSafeInteger(9007199254740991):", Number.isSafeInteger(9007199254740991)); // true
console.log("Number.isSafeInteger(9007199254740992):", Number.isSafeInteger(9007199254740992)); // false
console.log();

// Related constants:
console.log("Number.MIN_SAFE_INTEGER:", Number.MIN_SAFE_INTEGER);  // -9007199254740991
console.log("Number.MAX_VALUE:", Number.MAX_VALUE);                // 1.7976931348623157e+308
console.log("Number.MIN_VALUE:", Number.MIN_VALUE);                // 5e-324 (smallest positive)
console.log("Number.EPSILON:", Number.EPSILON);                    // 2.220446049250313e-16
console.log();


// ============================================================
// EXAMPLE 4 — Flipkart: V8 Internal Number Types (Smi vs HeapNumber)
// Story: Flipkart's search results display product counts and
//   prices. V8 stores the count (small integer) COMPLETELY
//   differently from the price (floating point). Understanding
//   this explains why integer math is significantly faster.
// ============================================================

// WHY: V8 has TWO internal representations for numbers:
// - Smi (Small Integer): stored directly in the pointer, no heap allocation!
// - HeapNumber: boxed double-precision float on the heap (needs GC)

//
// V8 INTERNAL NUMBER STORAGE:
//
// ┌──────────────────────────────────────────────────────────────┐
// │                                                              │
// │  Smi (Small Integer):                                        │
// │  ┌─────────────────────────────────────────────┬───┐        │
// │  │          31-bit integer value                │ 0 │        │
// │  └─────────────────────────────────────────────┴───┘        │
// │  The trailing 0 bit is a tag that tells V8 "this is a Smi"  │
// │  No heap allocation! Value stored directly in the pointer!  │
// │  Range: -2^30 to 2^30 - 1 (-1073741824 to 1073741823)      │
// │                                                              │
// │  HeapNumber (boxed double):                                  │
// │  ┌──────────────┐                                            │
// │  │ Pointer ──────────→ ┌──────────────────────┐              │
// │  └──────────────┘      │ Map (hidden class)   │              │
// │                        │ 64-bit IEEE 754 value│              │
// │                        └──────────────────────┘              │
// │  Requires heap allocation + GC! Slower than Smi.            │
// │                                                              │
// └──────────────────────────────────────────────────────────────┘
//

console.log("=== V8 Internal: Smi vs HeapNumber ===");
console.log();

// Smi range
const SMI_MIN = -(2 ** 30);         // -1073741824
const SMI_MAX = 2 ** 30 - 1;        // 1073741823

console.log("Smi range: ", SMI_MIN, "to", SMI_MAX);
console.log("  42         → Smi (no heap allocation!)");
console.log("  -1000      → Smi");
console.log("  1073741823 → Smi (2^30 - 1, max Smi)");
console.log("  1073741824 → HeapNumber (too large for Smi!)");
console.log("  3.14       → HeapNumber (not an integer)");
console.log("  NaN        → HeapNumber");
console.log("  Infinity   → HeapNumber");
console.log();

// Why Smi matters for performance:
console.log("Why Smi matters:");
console.log("  Smi arithmetic: no heap allocation, no unboxing, no GC pressure");
console.log("  HeapNumber arithmetic: allocate result on heap, may trigger GC");
console.log("  Integer loops are fast because loop counters are Smis!\n");

// Benchmark: Smi vs HeapNumber arithmetic
function benchSmi() {
    let total = 0;
    const start = process.hrtime.bigint();
    for (let i = 0; i < 1_000_000; i++) {
        total += i;  // Smi + Smi = Smi (or HeapNumber for large total)
    }
    const end = process.hrtime.bigint();
    return { total, ms: Number(end - start) / 1_000_000 };
}

function benchHeapNumber() {
    let total = 0.1;  // Start with a float — forces HeapNumber
    const start = process.hrtime.bigint();
    for (let i = 0; i < 1_000_000; i++) {
        total += i + 0.1;  // Always HeapNumber arithmetic
    }
    const end = process.hrtime.bigint();
    return { total, ms: Number(end - start) / 1_000_000 };
}

// Warm up
benchSmi(); benchHeapNumber();

const smiResult = benchSmi();
const heapResult = benchHeapNumber();

console.log(`Smi (integer) arithmetic:      ${smiResult.ms.toFixed(2)} ms`);
console.log(`HeapNumber (float) arithmetic: ${heapResult.ms.toFixed(2)} ms`);
console.log(`Integer math is ~${(heapResult.ms / smiResult.ms).toFixed(1)}x faster (Smi optimization)\n`);


// ============================================================
// EXAMPLE 5 — Razorpay: Special Number Values
// Story: Razorpay's API receives payment amounts from merchants.
//   A buggy merchant SDK sent NaN as the amount. The system didn't
//   catch it because NaN !== NaN (the only value not equal to itself).
//   They now use Number.isNaN() for all amount validation.
// ============================================================

// WHY: JavaScript has several "special" number values that behave
// in unexpected ways. You MUST know about them.

console.log("=== Special Number Values ===\n");

// --- NaN (Not a Number) ---
console.log("--- NaN ---");
console.log("typeof NaN:", typeof NaN);          // "number" (ironic!)
console.log("NaN === NaN:", NaN === NaN);         // false!
console.log("NaN !== NaN:", NaN !== NaN);         // true!
console.log("isNaN('hello'):", isNaN("hello"));   // true (coerces to number first!)
console.log("Number.isNaN('hello'):", Number.isNaN("hello")); // false (strict, no coercion)
console.log("Number.isNaN(NaN):", Number.isNaN(NaN));         // true
console.log();

// Ways to get NaN:
console.log("Ways to produce NaN:");
console.log("  0 / 0:", 0 / 0);                              // NaN
console.log("  undefined + 1:", undefined + 1);               // NaN
console.log("  parseInt('abc'):", parseInt("abc"));            // NaN
console.log("  Math.sqrt(-1):", Math.sqrt(-1));               // NaN
console.log("  Number('hello'):", Number("hello"));           // NaN
console.log();

// --- Infinity ---
console.log("--- Infinity ---");
console.log("1 / 0:", 1 / 0);                    // Infinity
console.log("-1 / 0:", -1 / 0);                   // -Infinity
console.log("Infinity + Infinity:", Infinity + Infinity);     // Infinity
console.log("Infinity - Infinity:", Infinity - Infinity);     // NaN
console.log("Number.isFinite(Infinity):", Number.isFinite(Infinity));   // false
console.log("Number.isFinite(42):", Number.isFinite(42));               // true
console.log();

// --- Negative Zero (-0) ---
console.log("--- Negative Zero ---");
console.log("-0 === 0:", -0 === 0);               // true (!)
console.log("Object.is(-0, 0):", Object.is(-0, 0)); // false (correctly distinguishes)
console.log("-0 toString:", (-0).toString());      // "0" (hides the negative!)
console.log("1 / -0:", 1 / -0);                   // -Infinity (reveals it)
console.log("1 / 0:", 1 / 0);                     // Infinity
console.log();

// When does -0 matter?
console.log("When -0 matters:");
console.log("  Direction of movement (going left at 0 vs right at 0)");
console.log("  Mathematical functions near zero");
console.log("  Usually: it doesn't matter. But know it exists!\n");


// ============================================================
// EXAMPLE 6 — CRED: Number.isInteger and Number.isSafeInteger
// Story: CRED's reward points must be whole numbers. They use
//   Number.isInteger() to validate, and Number.isSafeInteger()
//   to ensure points haven't exceeded precision limits.
// ============================================================

console.log("=== Number Checking Methods ===");
console.log();

// Number.isInteger() — is it a whole number?
console.log("Number.isInteger(42):", Number.isInteger(42));           // true
console.log("Number.isInteger(42.0):", Number.isInteger(42.0));       // true (42.0 === 42)
console.log("Number.isInteger(42.5):", Number.isInteger(42.5));       // false
console.log("Number.isInteger('42'):", Number.isInteger("42"));       // false (no coercion!)
console.log();

// Number.isSafeInteger() — integer AND within 2^53 range?
console.log("Number.isSafeInteger(42):", Number.isSafeInteger(42));               // true
console.log("Number.isSafeInteger(2**53):", Number.isSafeInteger(2**53));         // false
console.log("Number.isSafeInteger(2**53 - 1):", Number.isSafeInteger(2**53 - 1)); // true
console.log();

// Number.isFinite() — not NaN, not Infinity?
console.log("Number.isFinite(42):", Number.isFinite(42));              // true
console.log("Number.isFinite(Infinity):", Number.isFinite(Infinity));  // false
console.log("Number.isFinite(NaN):", Number.isFinite(NaN));            // false
console.log();

// Object.is() — strict equality that handles NaN and -0 correctly
console.log("Object.is(NaN, NaN):", Object.is(NaN, NaN));    // true (unlike ===)
console.log("Object.is(-0, 0):", Object.is(-0, 0));            // false (unlike ===)
console.log("Object.is(42, 42):", Object.is(42, 42));          // true
console.log();


// ============================================================
// EXAMPLE 7 — Swiggy: Floating Point Arithmetic Pitfalls
// Story: Swiggy's order total calculation went wrong when adding
//   multiple small amounts. ₹19.90 + ₹5.10 didn't equal ₹25.00
//   exactly, causing "amount mismatch" errors with payment gateways.
// ============================================================

console.log("=== Floating Point Pitfalls ===\n");

// Common gotchas:
console.log("Gotcha 1: Simple addition fails");
console.log("  19.90 + 5.10 =", 19.90 + 5.10);           // 25 (lucky!)
console.log("  0.1 + 0.2 =", 0.1 + 0.2);                  // 0.30000000000000004
console.log("  1.1 + 2.2 =", 1.1 + 2.2);                   // 3.3000000000000003
console.log();

console.log("Gotcha 2: Comparison fails");
console.log("  0.1 + 0.2 === 0.3:", 0.1 + 0.2 === 0.3);   // false
console.log("  1.1 + 2.2 === 3.3:", 1.1 + 2.2 === 3.3);    // false
console.log();

console.log("Gotcha 3: Accumulated error");
let sum = 0;
for (let i = 0; i < 10; i++) { sum += 0.1; }
console.log("  0.1 added 10 times:", sum);                   // 0.9999999999999999
console.log("  Expected 1.0, got:", sum === 1.0 ? "correct!" : "WRONG!");
console.log();

// --- EPSILON comparison ---
console.log("Solution 1: EPSILON comparison");
function nearlyEqual(a, b) {
    return Math.abs(a - b) < Number.EPSILON;
}
console.log("  nearlyEqual(0.1 + 0.2, 0.3):", nearlyEqual(0.1 + 0.2, 0.3)); // true
console.log("  But EPSILON is very small (2.2e-16) — may not work for larger numbers");
console.log();

// Better: relative comparison
function relativelyEqual(a, b, tolerance = 1e-9) {
    return Math.abs(a - b) <= tolerance * Math.max(Math.abs(a), Math.abs(b));
}
console.log("  relativelyEqual(0.1 + 0.2, 0.3):", relativelyEqual(0.1 + 0.2, 0.3)); // true
console.log();


// ============================================================
// EXAMPLE 8 — Razorpay: The "Work in Paise" Pattern
// Story: Razorpay's entire API works in PAISE (1/100 of a Rupee).
//   Instead of ₹199.99, they store 19999 paise. All arithmetic is
//   done in integers — no floating point errors possible. At display
//   time, they divide by 100 to show Rupees.
// ============================================================

// WHY: The correct way to handle money in JavaScript is to avoid
// floating-point entirely. Work in the smallest currency unit
// (paise, cents) as integers. Only convert to the major unit for display.

console.log("=== The 'Work in Paise' Pattern ===\n");

// BAD: Using floating-point for money
console.log("BAD: Floating-point money");
const priceBad = 199.99;
const taxBad = priceBad * 0.18;
const totalBad = priceBad + taxBad;
console.log(`  Price: ₹${priceBad}`);
console.log(`  Tax (18%): ₹${taxBad}`);           // 35.9982 (maybe?)
console.log(`  Total: ₹${totalBad}`);              // possible rounding error
console.log();

// GOOD: Work in paise (integers)
console.log("GOOD: Integer money (paise)");
const pricePaise = 19999;                          // ₹199.99 = 19999 paise
const taxPaise = Math.round(pricePaise * 18 / 100); // 3600 paise
const totalPaise = pricePaise + taxPaise;           // 23599 paise — exact!

// Only convert to Rupees for display
function formatRupees(paise) {
    const rupees = (paise / 100).toFixed(2);
    return `Rs. ${rupees}`;
}

console.log(`  Price: ${formatRupees(pricePaise)} (stored as ${pricePaise} paise)`);
console.log(`  Tax (18%): ${formatRupees(taxPaise)} (stored as ${taxPaise} paise)`);
console.log(`  Total: ${formatRupees(totalPaise)} (stored as ${totalPaise} paise)`);
console.log("  All arithmetic in integers — no floating-point error!\n");

// Real-world Razorpay API example:
console.log("Razorpay API example:");
const razorpayOrder = {
    amount: 50000,              // ₹500.00 in paise
    currency: "INR",
    receipt: "order_rcptid_11"
};
console.log("  API request:", JSON.stringify(razorpayOrder));
console.log("  amount: 50000 means ₹500.00 (always in paise)\n");

// Complete money utility:
class Money {
    constructor(paise) {
        if (!Number.isInteger(paise)) {
            throw new Error("Money must be initialized with integer paise");
        }
        this.paise = paise;
    }

    static fromRupees(rupees) {
        return new Money(Math.round(rupees * 100));
    }

    add(other) {
        return new Money(this.paise + other.paise);
    }

    subtract(other) {
        return new Money(this.paise - other.paise);
    }

    multiply(factor) {
        return new Money(Math.round(this.paise * factor));
    }

    percent(pct) {
        return new Money(Math.round(this.paise * pct / 100));
    }

    toRupees() {
        return this.paise / 100;
    }

    toString() {
        return `Rs. ${this.toRupees().toFixed(2)}`;
    }
}

console.log("Money utility class:");
const itemPrice = new Money(19999);        // ₹199.99
const gst = itemPrice.percent(18);         // 18% GST
const delivery = new Money(4900);          // ₹49.00
const orderTotal = itemPrice.add(gst).add(delivery);

console.log(`  Item: ${itemPrice} (${itemPrice.paise} paise)`);
console.log(`  GST:  ${gst} (${gst.paise} paise)`);
console.log(`  Delivery: ${delivery} (${delivery.paise} paise)`);
console.log(`  Total: ${orderTotal} (${orderTotal.paise} paise)`);
console.log("  All integer arithmetic — precise to the paisa!\n");


// ============================================================
// EXAMPLE 9 — Groww: BigInt for Arbitrary Precision
// Story: Groww's cryptocurrency trading desk needs to handle
//   amounts like 21000000000000000000 (21 quintillion) satoshis.
//   Regular JavaScript numbers can't represent this precisely.
//   BigInt to the rescue — arbitrary precision integer arithmetic.
// ============================================================

// WHY: BigInt is a relatively new primitive type (ES2020) that can
// represent integers of ANY size. No precision loss, no MAX_SAFE_INTEGER.

console.log("=== BigInt ===\n");

// Creating BigInts
const big1 = 9007199254740993n;  // Beyond MAX_SAFE_INTEGER — BigInt handles it!
const big2 = BigInt("900719925474099300000000");
const big3 = BigInt(42);

console.log("BigInt literal:", big1);
console.log("BigInt from string:", big2);
console.log("BigInt from number:", big3);
console.log("typeof BigInt:", typeof big1);  // "bigint"
console.log();

// BigInt arithmetic
console.log("BigInt arithmetic:");
console.log("  big1 + 1n =", big1 + 1n);           // 9007199254740994n
console.log("  big1 * 2n =", big1 * 2n);            // 18014398509481986n
console.log("  big1 ** 2n =", big1 ** 2n);           // huge number!
console.log();

// CANNOT mix BigInt and Number!
console.log("Mixing BigInt and Number:");
// console.log(big1 + 1);  // TypeError: Cannot mix BigInt and other types
console.log("  big1 + 1 → TypeError! Must use: big1 + 1n");
console.log("  Number(big1) + 1 → works but may lose precision");
console.log("  big1 + BigInt(1) → works correctly");
console.log();

// Comparisons work across types (with ==, not ===)
console.log("Comparisons:");
console.log("  42n === 42:", 42n === 42);     // false (different types)
console.log("  42n == 42:", 42n == 42);       // true (coercion)
console.log("  42n < 43:", 42n < 43);         // true (cross-type comparison OK)
console.log();

// BigInt limitations:
console.log("BigInt limitations:");
console.log("  - No decimals: 3n / 2n = 1n (integer division, truncates)");
console.log("    3n / 2n:", 3n / 2n);         // 1n (not 1.5!)
console.log("  - Not supported in JSON.stringify (throws TypeError)");
console.log("  - Slower than regular numbers (arbitrary precision has overhead)");
console.log("  - Can't use with Math.* functions");
console.log();


// ============================================================
// EXAMPLE 10 — Practical: Number Puzzles and Edge Cases
// Story: These are real bugs that have bitten Indian startup
//   engineers. Each one looks innocent but has a surprising result.
// ============================================================

console.log("=== Number Puzzles and Edge Cases ===\n");

// Puzzle 1: String to number coercion
console.log("Puzzle 1: + operator with strings");
console.log("  '5' + 3 =", "5" + 3);          // "53" (string concat!)
console.log("  '5' - 3 =", "5" - 3);          // 2 (numeric subtraction!)
console.log("  '5' * '3' =", "5" * "3");      // 15 (numeric multiplication)
console.log("  + is overloaded: string + anything = string concat");
console.log("  Other operators always convert to number\n");

// Puzzle 2: parseInt gotchas
console.log("Puzzle 2: parseInt surprises");
console.log("  parseInt('08'):", parseInt("08"));           // 8
console.log("  parseInt('0x10'):", parseInt("0x10"));       // 16 (hex!)
console.log("  parseInt('123abc'):", parseInt("123abc"));   // 123 (stops at non-digit)
console.log("  parseInt(''):", parseInt(""));               // NaN
console.log("  parseInt(0.0000005):", parseInt(0.0000005)); // 5 (!)
console.log("    → 0.0000005.toString() = '5e-7', parseInt('5e-7') = 5\n");

// Puzzle 3: Precision at the limits
console.log("Puzzle 3: Large number precision");
console.log("  9999999999999999:", 9999999999999999);        // 10000000000000000!
console.log("  10000000000000001:", 10000000000000001);      // 10000000000000000!
console.log("  Numbers this large can't represent every integer.\n");

// Puzzle 4: toFixed rounding
console.log("Puzzle 4: toFixed rounding surprises");
console.log("  (1.255).toFixed(2):", (1.255).toFixed(2));    // "1.25" (not "1.26"!)
console.log("  (1.265).toFixed(2):", (1.265).toFixed(2));    // "1.27"
console.log("  1.255 is actually stored as 1.25499999... → rounds DOWN");
console.log("  For financial rounding, use Math.round(x * 100) / 100\n");

// Puzzle 5: Floating point equality
console.log("Puzzle 5: When floating point IS exact");
console.log("  0.5 + 0.25 === 0.75:", 0.5 + 0.25 === 0.75);  // true!
console.log("  0.5 + 0.5 === 1.0:", 0.5 + 0.5 === 1.0);      // true!
console.log("  Powers of 2 fractions (1/2, 1/4, 1/8) are exact in binary!");
console.log("  It's fractions like 1/10, 1/5, 1/3 that cause problems.\n");


// ============================================================
// EXAMPLE 11 — Number Conversion Methods
// Story: Comprehensive guide to converting between strings and
//   numbers — essential for processing user input, API responses,
//   and database values.
// ============================================================

console.log("=== Number Conversion Methods ===\n");

// String → Number
console.log("String → Number:");
console.log("  Number('42'):", Number("42"));               // 42
console.log("  Number('42.5'):", Number("42.5"));           // 42.5
console.log("  Number(''):", Number(""));                   // 0 (surprise!)
console.log("  Number(' '):", Number(" "));                 // 0 (surprise!)
console.log("  Number('42abc'):", Number("42abc"));         // NaN
console.log("  +'42':", +"42");                             // 42 (unary plus)
console.log("  parseInt('42.9'):", parseInt("42.9"));       // 42 (truncates decimal)
console.log("  parseFloat('42.9'):", parseFloat("42.9"));   // 42.9
console.log();

// Number → String
console.log("Number → String:");
console.log("  (42).toString():", (42).toString());           // "42"
console.log("  (255).toString(16):", (255).toString(16));     // "ff" (hex)
console.log("  (255).toString(2):", (255).toString(2));       // "11111111" (binary)
console.log("  (42.567).toFixed(2):", (42.567).toFixed(2));   // "42.57"
console.log("  (1234567.89).toLocaleString('en-IN'):", (1234567.89).toLocaleString("en-IN")); // "12,34,567.89"
console.log();

// Indian number formatting (lakhs, crores)
console.log("Indian number formatting:");
const amount = 12345678.50;
console.log(`  ${amount} in Indian format: ₹${amount.toLocaleString("en-IN")}`);
console.log(`  Using Intl: ${new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount)}`);
console.log();


// ============================================================
// EXAMPLE 12 — Summary: Number Best Practices
// Story: Compilation of number-handling best practices from
//   Indian fintech companies (Razorpay, PhonePe, Paytm).
// ============================================================

console.log("=== Number Best Practices ===\n");

console.log("1. MONEY: Always work in smallest unit (paise/cents) as integers");
console.log("   Never use floating-point for financial calculations!\n");

console.log("2. COMPARISON: Never use === for floating-point equality");
console.log("   Use Math.abs(a - b) < tolerance instead\n");

console.log("3. VALIDATION: Use Number.isNaN(), not isNaN()");
console.log("   Use Number.isFinite() before calculations\n");

console.log("4. LARGE INTEGERS: Use BigInt (123n) for > 2^53");
console.log("   Or use string IDs for database identifiers\n");

console.log("5. PARSING: Prefer Number() over parseInt() for full string conversion");
console.log("   Always provide radix to parseInt: parseInt(str, 10)\n");

console.log("6. DISPLAY: Use toLocaleString('en-IN') for Indian formatting");
console.log("   Use Intl.NumberFormat for currency formatting\n");

console.log("7. PERFORMANCE: Keep numbers as integers (Smi range) when possible");
console.log("   Integer arithmetic is faster than floating-point in V8\n");


// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. ALL JavaScript numbers are IEEE 754 double-precision 64-bit
//    floating point: 1 sign + 11 exponent + 52 mantissa bits.
//
// 2. 0.1 + 0.2 !== 0.3 because 0.1 and 0.2 can't be represented
//    exactly in binary — they're repeating fractions (like 1/3 in decimal).
//
// 3. MAX_SAFE_INTEGER = 2^53 - 1 (9007199254740991). Beyond this,
//    integers lose precision and different values compare as equal.
//
// 4. V8 uses Smi (Small Integer, -2^30 to 2^30-1) stored in the
//    pointer itself — no heap allocation. HeapNumber for everything
//    else. Integer math is significantly faster.
//
// 5. Special values: NaN !== NaN (use Number.isNaN()), -0 === 0
//    (use Object.is()), Infinity from division by zero.
//
// 6. For money: ALWAYS work in paise/cents as integers. Convert
//    to rupees only for display. This is how Razorpay, Stripe,
//    and every serious payment system works.
//
// 7. BigInt (123n) provides arbitrary-precision integers. Can't
//    mix with Number, no decimals, slower than regular numbers.
//
// 8. Number.EPSILON for floating-point comparison tolerance.
//    (1.255).toFixed(2) = "1.25" not "1.26" — rounding surprises!
//
// 9. Use Number.isInteger(), Number.isSafeInteger(), Number.isFinite()
//    for robust input validation.
//
// 10. For Indian formatting: toLocaleString('en-IN') gives lakhs
//     and crores formatting automatically.
// ============================================================

console.log("=== FILE 12 COMPLETE ===");
console.log("Numbers in JavaScript are deceptively complex.");
console.log("Respect the IEEE 754, and your calculations will be correct!\n");
