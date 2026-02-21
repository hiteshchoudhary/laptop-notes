// ============================================================
// FILE 23: BIT MANIPULATION
// Topic: Using bitwise operators for ultra-fast low-level computation
// WHY: Bit manipulation lets you perform operations in O(1) that
// would otherwise require loops. It is used in permissions systems,
// compression, cryptography, and competitive programming. Companies
// like Zerodha use bit flags to store multiple boolean states in a
// single integer, saving memory and enabling O(1) flag checks.
// ============================================================

// ============================================================
// ZERODHA STORY
// ============================================================
// Zerodha manages 10 million+ demat accounts. Each account has
// multiple boolean properties: is_active, has_margin, is_verified,
// has_2fa, is_nri, is_premium, allows_fno, allows_ipo. Storing each
// as a separate boolean uses 8 bytes. Using BIT FLAGS, all 8 booleans
// fit in a SINGLE byte (8 bits), checked in O(1) with bitwise AND.
// At 10 million accounts, this saves 70MB of memory.

console.log("=== BIT MANIPULATION ===\n");

// ============================================================
// SECTION 1 — Binary Number System Recap
// ============================================================

// WHY: Every integer in a computer is stored as binary (base 2).
// JS numbers are 64-bit floats but bitwise ops use 32-bit signed int.

console.log("=== BINARY BASICS ===");
console.log("10 in binary:", (10).toString(2));         // "1010"
console.log("Binary 1010 in decimal:", parseInt("1010", 2)); // 10
console.log("0b1010 =", 0b1010); // Binary literal = 10

// Padding binary output helper
function toBin(n, bits = 8) {
  return (n >>> 0).toString(2).padStart(bits, "0");
}
console.log("5 as 8-bit:", toBin(5));   // "00000101"
console.log();

// ============================================================
// SECTION 2 — Bitwise Operators
// ============================================================

// WHY: These are the building blocks of every bit manipulation trick.

console.log("=== BITWISE OPERATORS ===");

// --- AND (&): both bits must be 1 ---
//   1010 & 1100 = 1000
console.log("10 & 12 =", 10 & 12, "->", toBin(10), "&", toBin(12), "=", toBin(10 & 12));
// Use: masking (extract specific bits), checking if bit is set

// --- OR (|): either bit is 1 ---
//   1010 | 1100 = 1110
console.log("10 | 12 =", (10 | 12), "->", toBin(10), "|", toBin(12), "=", toBin(10 | 12));
// Use: setting bits, combining flags

// --- XOR (^): bits must differ ---
//   1010 ^ 1100 = 0110
console.log("10 ^ 12 =", (10 ^ 12), "->", toBin(10), "^", toBin(12), "=", toBin(10 ^ 12));
// Use: toggling bits, finding unique elements, swapping without temp

// --- NOT (~): flip all bits ---
//   ~1010 = ...0101 (in 32-bit: ~10 = -11, because of two's complement)
console.log("~10 =", ~10, "->", toBin(~10, 32));
// Note: ~n = -(n+1) due to two's complement representation

// --- Left Shift (<<): shift bits left, fill with 0 ---
//   1010 << 2 = 101000
console.log("10 << 2 =", 10 << 2, "->", toBin(10), "<<2 =", toBin(10 << 2));
// Equivalent to: n * 2^k

// --- Right Shift (>>): shift bits right (sign-preserving) ---
//   1010 >> 1 = 0101
console.log("10 >> 1 =", 10 >> 1, "->", toBin(10), ">>1 =", toBin(10 >> 1));
// Equivalent to: Math.floor(n / 2^k) for positive numbers

// --- Unsigned Right Shift (>>>): shift right, fill with 0 (no sign) ---
console.log("-1 >> 1 =", -1 >> 1);   // -1 (sign preserved)
console.log("-1 >>> 1 =", -1 >>> 1); // 2147483647 (sign bit becomes 0)
console.log();

// ============================================================
// SECTION 3 — Essential Bit Tricks
// ============================================================

// WHY: These tricks are used in interviews and systems programming.
// They turn multi-step operations into single O(1) bitwise expressions.

console.log("=== ESSENTIAL BIT TRICKS ===");

// --- Check even/odd: n & 1 ---
// Last bit is 1 for odd, 0 for even. Faster than n % 2.
function isOdd(n) { return (n & 1) === 1; }
console.log("7 is odd:", isOdd(7));   // true  (0111 & 0001 = 0001)
console.log("8 is odd:", isOdd(8));   // false (1000 & 0001 = 0000)

// --- Multiply by 2: n << 1 ---
console.log("5 * 2 =", 5 << 1); // 10

// --- Divide by 2: n >> 1 ---
console.log("10 / 2 =", 10 >> 1); // 5

// --- Check if power of 2: n > 0 && (n & (n-1)) === 0 ---
// Powers of 2 have exactly ONE bit set: 1, 10, 100, 1000...
// n-1 flips that bit and all lower bits: 1000 - 1 = 0111
// AND gives 0 only for powers of 2.
function isPowerOf2(n) { return n > 0 && (n & (n - 1)) === 0; }
console.log("16 is power of 2:", isPowerOf2(16)); // true  (10000 & 01111 = 0)
console.log("18 is power of 2:", isPowerOf2(18)); // false (10010 & 10001 != 0)

// --- Set a bit at position p: n | (1 << p) ---
function setBit(n, p) { return n | (1 << p); }
console.log("Set bit 3 of 5:", toBin(5), "->", toBin(setBit(5, 3))); // 00001101

// --- Clear a bit at position p: n & ~(1 << p) ---
function clearBit(n, p) { return n & ~(1 << p); }
console.log("Clear bit 2 of 5:", toBin(5), "->", toBin(clearBit(5, 2))); // 00000001

// --- Toggle a bit at position p: n ^ (1 << p) ---
function toggleBit(n, p) { return n ^ (1 << p); }
console.log("Toggle bit 1 of 5:", toBin(5), "->", toBin(toggleBit(5, 1))); // 00000111

// --- Check a bit at position p: (n >> p) & 1 ---
function checkBit(n, p) { return (n >> p) & 1; }
console.log("Bit 2 of 5:", checkBit(5, 2), "| Bit 1 of 5:", checkBit(5, 1));

// --- Swap without temp variable using XOR ---
// a ^= b; b ^= a; a ^= b;  -> swaps a and b without a temp variable
let sa = 42, sb = 99;
sa ^= sb; sb ^= sa; sa ^= sb;
console.log("XOR swap: a=42,b=99 -> a=" + sa + ",b=" + sb); // a=99,b=42
console.log();

// ============================================================
// EXAMPLE 1 — Single Number (XOR trick)
// Story: PhonePe processes transaction logs. Due to a bug, every
// transaction ID appears twice in the log except ONE orphan transaction.
// Find the orphan without using extra space. XOR all IDs: duplicates
// cancel out (a ^ a = 0), and the orphan survives (a ^ 0 = a).
// ============================================================

// WHY: This is the most elegant bit manipulation problem. It finds a
// unique element in O(n) time and O(1) space — no hash map needed.

// XOR: a^a=0 (self-inverse), a^0=a (identity), commutative, associative
// O(n) time, O(1) space
function singleNumber(nums) {
  let result = 0;
  for (const num of nums) {
    result ^= num; // XOR all numbers; duplicates cancel out
  }
  return result;
}

console.log("=== SINGLE NUMBER ===");
console.log("Single in [2,2,1]:", singleNumber([2, 2, 1])); // 1
console.log("Single in [4,1,2,1,2]:", singleNumber([4, 1, 2, 1, 2])); // 4
// Trace: 0^4=4, 4^1=5, 5^2=7, 7^1=6, 6^2=4 -> duplicates cancel!
console.log();

// ============================================================
// EXAMPLE 2 — Count Set Bits (Hamming Weight / popcount)
// Story: IRCTC's reservation system uses bitmasks to represent seat
// availability in a train coach. Each bit = 1 seat. Counting set bits
// tells how many seats are occupied. A coach with 64 seats fits in
// one 64-bit integer.
// ============================================================

// WHY: Counting set bits is fundamental to bitmask-based systems.
// Brian Kernighan's trick is an elegant O(k) solution where k = set bits.

// --- Brian Kernighan's trick — O(k) where k = number of set bits ---
// n & (n - 1) clears the LOWEST set bit
// Example: 12 = 1100, 11 = 1011, 1100 & 1011 = 1000 (cleared bit 2)
function countBitsKernighan(n) {
  let count = 0;
  while (n) {
    n &= (n - 1); // Clear lowest set bit
    count++;
  }
  return count;
}

console.log("=== COUNT SET BITS ===");
console.log("Set bits in 11 (1011):", countBitsKernighan(11));     // 3
console.log("Set bits in 255:", countBitsKernighan(255)); // 8
// Trace: 1011 & 1010=1010(cnt=1), 1010 & 1001=1000(cnt=2), 1000 & 0111=0(cnt=3)
console.log();

// ============================================================
// EXAMPLE 3 — Counting Bits for 0 to n (DP + Bits)
// Story: Zerodha's analytics dashboard needs to know the bit-count
// for every account ID from 0 to n for a hash distribution analysis.
// Instead of computing each independently, use a DP formula.
// ============================================================

// WHY: This combines DP with bit manipulation — a common interview
// pattern. The formula dp[i] = dp[i >> 1] + (i & 1) is beautiful.

// --- dp[i] = dp[i >> 1] + (i & 1) ---
// i >> 1 removes the last bit (divide by 2), which we already computed.
// i & 1 adds 1 if the last bit is set.
// O(n) time, O(n) space

function countBitsRange(n) {
  const dp = new Array(n + 1).fill(0);
  for (let i = 1; i <= n; i++) {
    dp[i] = dp[i >> 1] + (i & 1);
    // i>>1 is i with last bit removed -> already in dp
    // i&1 is the last bit itself (0 or 1)
  }
  return dp;
}

console.log("=== COUNTING BITS 0 to n ===");
console.log("Bits for 0-7:", countBitsRange(7));
// [0, 1, 1, 2, 1, 2, 2, 3] corresponding to 0,1,10,11,100,101,110,111
console.log();

// ============================================================
// EXAMPLE 4 — Bit Flags / Bitmask Permission System
// Story: Zerodha's account system manages permissions using bit flags.
// Each permission is a power of 2. Multiple permissions are combined
// with OR. Checking permissions uses AND. This is the same pattern
// used by Unix file permissions (rwx = 421) and feature flags.
// ============================================================

// WHY: Bitmask permissions are used in every major system — Unix,
// databases, API scopes, game engines. Understanding this pattern
// is essential for systems design.

// --- Permission Constants (powers of 2) ---
const PERMISSIONS = {
  READ: 1, WRITE: 2, EXECUTE: 4, DELETE: 8, ADMIN: 16, SUPERADMIN: 32,
  // bit 0    bit 1     bit 2      bit 3      bit 4       bit 5
};

class PermissionManager {
  constructor() {
    this.userPerms = {}; // userId -> bitmask
  }

  // Grant permission: use OR to set bits
  grant(userId, permission) {
    this.userPerms[userId] = (this.userPerms[userId] || 0) | permission;
  }

  // Revoke permission: use AND with NOT to clear bits
  revoke(userId, permission) {
    if (this.userPerms[userId] !== undefined) {
      this.userPerms[userId] &= ~permission;
    }
  }

  // Check permission: use AND to test bits
  has(userId, permission) {
    return (this.userPerms[userId] & permission) === permission;
  }

  // Check all permissions: (perms & required) === required
  hasAll(userId, permissions) {
    return (this.userPerms[userId] & permissions) === permissions;
  }

  // Toggle permission: use XOR to flip bits
  toggle(userId, permission) {
    this.userPerms[userId] = (this.userPerms[userId] || 0) ^ permission;
  }

  // List all active permissions for a user
  listPermissions(userId) {
    const perms = this.userPerms[userId] || 0;
    return Object.entries(PERMISSIONS).filter(([, bit]) => perms & bit).map(([name]) => name);
  }

  getRaw(userId) { return toBin(this.userPerms[userId] || 0); }
}

console.log("=== BIT FLAG PERMISSION SYSTEM ===");
const pm = new PermissionManager();

pm.grant("user1", PERMISSIONS.READ);
pm.grant("user1", PERMISSIONS.WRITE);
console.log("user1 perms:", pm.listPermissions("user1"), "raw:", pm.getRaw("user1"));

pm.grant("admin1", PERMISSIONS.READ | PERMISSIONS.WRITE | PERMISSIONS.DELETE | PERMISSIONS.ADMIN);
console.log("admin1 perms:", pm.listPermissions("admin1"));

console.log("user1 has READ?", pm.has("user1", PERMISSIONS.READ));     // true
console.log("user1 has DELETE?", pm.has("user1", PERMISSIONS.DELETE)); // false

pm.revoke("user1", PERMISSIONS.WRITE);
console.log("After revoking WRITE:", pm.listPermissions("user1")); // ["READ"]

pm.toggle("user1", PERMISSIONS.EXECUTE);
console.log("After toggling EXECUTE:", pm.listPermissions("user1")); // ["READ", "EXECUTE"]
pm.toggle("user1", PERMISSIONS.EXECUTE);
console.log("After toggling EXECUTE again:", pm.listPermissions("user1")); // ["READ"]
console.log();

// ============================================================
// EXAMPLE 5 — Subsets Using Bitmask
// Story: Flipkart's recommendation engine generates all possible
// product bundles from a set of items. For 3 items, there are 2^3 = 8
// possible bundles (including empty). Each bundle is represented by a
// bitmask where bit i = "include item i".
// ============================================================

// WHY: Generating subsets with bitmasks is cleaner than recursion for
// small sets. It's O(2^n * n) — iterate all masks, check each bit.

// --- Iterate 0 to 2^n - 1, each integer represents a subset ---
// For mask=5 (101), items at positions 0 and 2 are included.
// O(2^n * n) time

function subsets(items) {
  const n = items.length;
  const totalSubsets = 1 << n; // 2^n
  const result = [];

  for (let mask = 0; mask < totalSubsets; mask++) {
    const subset = [];
    for (let bit = 0; bit < n; bit++) {
      if (mask & (1 << bit)) { // Check if bit is set in mask
        subset.push(items[bit]);
      }
    }
    result.push(subset);
  }

  return result;
}

console.log("=== SUBSETS USING BITMASK ===");
const products = ["Phone", "Case", "Charger"];
const allSubsets = subsets(products);
console.log(`All ${allSubsets.length} subsets of [${products}]:`);
allSubsets.forEach((s, i) => {
  console.log(`  ${toBin(i, 3)} -> [${s.join(", ")}]`);
});
// 000 -> []
// 001 -> [Phone]
// 010 -> [Case]
// 011 -> [Phone, Case]
// 100 -> [Charger]
// 101 -> [Phone, Charger]
// 110 -> [Case, Charger]
// 111 -> [Phone, Case, Charger]
console.log();

// ============================================================
// SECTION 6 — Find Missing Number with XOR
// ============================================================

// WHY: XOR all numbers 0..n, then XOR with array elements.
// Duplicates cancel, missing number remains. O(n) time, O(1) space.

function findMissing(nums, n) {
  let xor = 0;
  for (let i = 0; i <= n; i++) xor ^= i;    // XOR of 0..n
  for (const num of nums) xor ^= num;        // XOR with array
  return xor; // Only the missing number survives
}

console.log("Missing from [0,1,3,4] (n=4):", findMissing([0, 1, 3, 4], 4)); // 2
console.log("Missing from [0,1,2,4,5] (n=5):", findMissing([0, 1, 2, 4, 5], 5)); // 3
console.log();

// ============================================================
// SECTION 7 — 32-Bit Integer Limit in JavaScript
// ============================================================

// WHY: JavaScript bitwise operators silently convert numbers to 32-bit
// signed integers. This can cause unexpected bugs if you're unaware.

console.log("=== JS 32-BIT LIMIT ===");
console.log("2^31 - 1 =", (2 ** 31 - 1));        // 2147483647 (max 32-bit signed)
console.log("2^31 | 0 =", (2 ** 31) | 0);          // -2147483648 (overflow!)
console.log("2^32 | 0 =", (2 ** 32) | 0);          // 0 (completely lost!)
// For larger numbers, use BigInt: 2n ** 64n = 18446744073709551616
console.log();

// ============================================================
// SECTION 9 — BIG-O SUMMARY
// ============================================================

console.log("=== BIT MANIPULATION COMPLEXITY ===");
console.log("+---------------------------+--------+--------+");
console.log("| Operation                 | Time   | Space  |");
console.log("+---------------------------+--------+--------+");
console.log("| Check even/odd (n & 1)    | O(1)   | O(1)   |");
console.log("| Set/Clear/Toggle bit      | O(1)   | O(1)   |");
console.log("| Check power of 2          | O(1)   | O(1)   |");
console.log("| Single Number (XOR)       | O(n)   | O(1)   |");
console.log("| Count set bits (naive)    | O(32)  | O(1)   |");
console.log("| Count set bits (Kernighan)| O(k)   | O(1)   |");
console.log("| Count bits 0..n (DP)      | O(n)   | O(n)   |");
console.log("| Generate all subsets      | O(2^n) | O(2^n) |");
console.log("| Find missing number       | O(n)   | O(1)   |");
console.log("+---------------------------+--------+--------+");
console.log();

// ============================================================
// SECTION 10 — TESTS
// ============================================================

console.log("=== RUNNING ALL BIT MANIPULATION TESTS ===");

// Even/odd
console.assert(isOdd(7) === true, "7 is odd");
console.assert(isOdd(8) === false, "8 is even");
console.assert(isOdd(0) === false, "0 is even");
console.log("Even/Odd: Passed");

// Power of 2
console.assert(isPowerOf2(1) === true, "1 is 2^0");
console.assert(isPowerOf2(16) === true, "16 is 2^4");
console.assert(isPowerOf2(18) === false, "18 is not power of 2");
console.assert(isPowerOf2(0) === false, "0 is not power of 2");
console.log("Power of 2: Passed");

// Bit operations
console.assert(setBit(5, 3) === 13, "Set bit 3 of 5 = 13");
console.assert(clearBit(5, 2) === 1, "Clear bit 2 of 5 = 1");
console.assert(toggleBit(5, 1) === 7, "Toggle bit 1 of 5 = 7");
console.assert(checkBit(5, 2) === 1, "Bit 2 of 5 is 1");
console.assert(checkBit(5, 1) === 0, "Bit 1 of 5 is 0");
console.log("Bit Operations: Passed");

// Single Number
console.assert(singleNumber([2, 2, 1]) === 1, "Single in [2,2,1]");
console.assert(singleNumber([4, 1, 2, 1, 2]) === 4, "Single in [4,1,2,1,2]");
console.log("Single Number: Passed");

// Count set bits
console.assert(countBitsKernighan(11) === 3, "11 has 3 set bits");
console.assert(countBitsKernighan(255) === 8, "255 has 8 set bits");
console.log("Count Set Bits: Passed");

// Count bits range
const cbr = countBitsRange(7);
console.assert(JSON.stringify(cbr) === JSON.stringify([0, 1, 1, 2, 1, 2, 2, 3]), "Count bits 0-7");
console.log("Count Bits Range: Passed");

// Subsets
console.assert(subsets(["a", "b"]).length === 4, "2 items = 4 subsets");
console.assert(subsets(["a", "b", "c"]).length === 8, "3 items = 8 subsets");
console.log("Subsets: Passed");

// Missing number
console.assert(findMissing([0, 1, 3, 4], 4) === 2, "Missing 2");
console.assert(findMissing([0, 1, 2, 4, 5], 5) === 3, "Missing 3");
console.log("Missing Number: Passed");

// Permission system
const testPm = new PermissionManager();
testPm.grant("t", PERMISSIONS.READ | PERMISSIONS.WRITE);
console.assert(testPm.has("t", PERMISSIONS.READ) === true, "Has READ");
console.assert(testPm.has("t", PERMISSIONS.DELETE) === false, "No DELETE");
testPm.revoke("t", PERMISSIONS.WRITE);
console.assert(testPm.has("t", PERMISSIONS.WRITE) === false, "WRITE revoked");
console.log("Permission System: Passed");

console.log("\nAll Bit Manipulation tests passed!");

// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. Bitwise operators (&, |, ^, ~, <<, >>, >>>) operate on individual
//    bits and are the fastest possible operations — single CPU cycle.
// 2. n & 1 checks odd/even. n & (n-1) clears lowest set bit (used in
//    power-of-2 check and Kernighan's bit counting).
// 3. XOR is magic: a^a=0, a^0=a. This finds unique elements in O(n)
//    time with O(1) space — no hash map needed.
// 4. Bit flags store multiple booleans in one integer. Used in Unix
//    permissions, feature flags, and game state management.
// 5. Bitmask subsets: iterate 0 to 2^n-1, each bit = include/exclude.
//    Clean alternative to recursive subset generation for small n.
// 6. JavaScript bitwise ops work on 32-bit signed integers. Numbers
//    above 2^31-1 overflow silently — use BigInt for larger values.
// 7. Brian Kernighan's trick (n & (n-1)) counts set bits in O(k) time
//    where k is the number of set bits — often much less than 32.
// 8. The DP formula dp[i] = dp[i>>1] + (i&1) counts bits for all
//    numbers 0..n in O(n) time — a beautiful DP + bits combo.
// 9. Bit manipulation is critical for competitive programming and
//    systems-level code. It rarely appears in web dev, but interview
//    questions love it.
// 10. Practice: Single Number, Power of 2, Counting Bits, and Subsets
//     are the most commonly asked bit manipulation interview problems.
