// ============================================================
// FILE 13: STRING INTERNALS IN V8
// Topic: How V8 stores, optimizes, and manipulates strings internally
// WHY: Strings are the most common data type in web applications.
// V8 uses 5+ internal representations to avoid unnecessary copying.
// Understanding these reveals why some string operations are O(1)
// while others silently trigger expensive O(n) flattening.
// ============================================================

// ============================================================
// EXAMPLE 1 — Zomato's Restaurant Universe
// Story: Zomato manages 500,000+ restaurant listings across India.
// Every restaurant name, review, cuisine tag, and search query is
// a string. When a user types "biryani" in Hyderabad, V8 processes
// millions of string comparisons, concatenations, and slices.
// ============================================================

// WHY: JS strings are NOT sequences of "characters" — they are
// immutable sequences of 16-bit (2-byte) UTF-16 code units.

// --- Strings Are Immutable Sequences of UTF-16 Code Units ---
const restaurantName = "Zomato";
console.log("Restaurant name:", restaurantName);
console.log("Length (code units):", restaurantName.length);  // 6
console.log("Memory ~=", restaurantName.length * 2, "bytes (+overhead)");

// Immutability: you cannot change a string in place
let greeting = "Hello";
greeting[0] = "J";           // Silently fails (no error in sloppy mode)
console.log("After mutation attempt:", greeting);  // Still "Hello"

// Every "modification" creates a brand new string
let modified = "J" + greeting.slice(1);
console.log("New string:", modified);  // "Jello"

// ============================================================
// EXAMPLE 2 — UTF-16 Encoding and Surrogate Pairs
// Story: Zomato expanded to UAE and Turkey. Restaurant names now
// include Arabic and Turkish characters. Some reviewers use emoji
// ratings. V8 must handle all of these — and the encoding choice
// has profound consequences for string.length.
// ============================================================

// WHY: UTF-16 uses 1 code unit (2 bytes) for common chars or
// 2 code units (4 bytes) for emoji/rare characters. This is
// WHY string.length can be "wrong" for emoji.

const hindi = "नमस्ते";
console.log("\n--- UTF-16 Code Units ---");
console.log("Hindi greeting:", hindi, "Length:", hindi.length);

for (let i = 0; i < hindi.length; i++) {
    console.log(`  Index ${i}: '${hindi[i]}' → U+${hindi.charCodeAt(i).toString(16).toUpperCase().padStart(4, '0')}`);
}

// --- Surrogate Pairs: emoji/rare chars need 2 code units ---
//  HIGH SURROGATE: U+D800 to U+DBFF (1024 values)
//  LOW SURROGATE:  U+DC00 to U+DFFF (1024 values)
//  Together: 1024 x 1024 = 1,048,576 additional characters

const emoji = "😀";
console.log("\n--- Surrogate Pairs ---");
console.log("Emoji:", emoji, "emoji.length:", emoji.length);  // 2 (NOT 1!)

// ASCII Diagram: How a surrogate pair works
//   Code Point: U+1F600 (Grinning Face)
//   Step 1: Subtract 0x10000 → 0xF600
//   Step 2: High 10 bits → 0xD83D, Low 10 bits → 0xDE00
//   In memory: [ 0xD83D ] [ 0xDE00 ]
//               index 0     index 1

console.log("charCodeAt(0):", emoji.charCodeAt(0).toString(16));  // d83d
console.log("charCodeAt(1):", emoji.charCodeAt(1).toString(16));  // de00
console.log("codePointAt(0):", emoji.codePointAt(0).toString(16));  // 1f600

const fromCP = String.fromCodePoint(0x1F600);
console.log("String.fromCodePoint(0x1F600):", fromCP);  // 😀

// ============================================================
// EXAMPLE 3 — Iterating Code Points Correctly
// Story: Zomato's review system lets users post emoji reactions.
// A review like "Great food! 👨‍🍳🔥" must be counted correctly.
// The naive .length approach fails badly for emoji.
// ============================================================

// WHY: for...of iterates code POINTS (not code units), making it
// the correct way to iterate over Unicode characters.

const review = "Great 👨‍🍳🔥";
console.log("\n--- Iterating Code Points ---");
console.log("Review:", review, ".length:", review.length);

const codePoints = [...review];
console.log("Spread/for...of count:", codePoints.length);

// WARNING: Even for...of doesn't handle grapheme clusters perfectly.
// "👨‍🍳" is 3 code points joined by ZWJ (Zero Width Joiner)
const chef = "👨‍🍳";
console.log("Chef emoji code points:");
for (const cp of chef) {
    console.log(`  '${cp}' → U+${cp.codePointAt(0).toString(16).toUpperCase()}`);
}

// ============================================================
// EXAMPLE 4 — V8 Internal String Representations
// Story: When Zomato builds a restaurant page, it concatenates
// name, location, rating, and reviews. V8 doesn't naively copy
// bytes — it uses 5+ internal string types to defer copying.
// ============================================================

// WHY: This is the core insight. V8 has 5+ string representations
// that explain why some patterns are fast and others hit cliffs.

console.log("\n" + "=".repeat(60));
console.log("V8 INTERNAL STRING TYPES");
console.log("=".repeat(60));

// ASCII Diagram: V8 String Type Hierarchy
//   String (abstract base)
//   ├── SeqString          → contiguous chars in memory
//   │   ├── SeqOneByteString  → Latin-1 (1 byte/char) for ASCII
//   │   └── SeqTwoByteString  → UTF-16 (2 bytes/char)
//   ├── ConsString          → tree node: left + right pointers
//   ├── SlicedString        → parent pointer + offset + length
//   ├── ThinString          → redirect pointer (after flattening)
//   └── ExternalString      → data outside V8 heap (C++ addon)

// --- 1. SeqString: flat array of characters ---
const seq = "Biryani Paradise";  // SeqOneByteString (ASCII)
console.log("\n1. SeqString: '" + seq + "' → contiguous bytes");
console.log("   ASCII → SeqOneByteString (1 byte/char, saves 50%)");

const seqUnicode = "बिरयानी पैराडाइस";  // SeqTwoByteString
console.log("   Hindi → SeqTwoByteString (2 bytes/char)");

// --- 2. ConsString: O(1) concatenation via tree node ---
console.log("\n2. ConsString (Concatenation String):");
const part1 = "Zomato - ";
const part2 = "Order Food Online";
const concatenated = part1 + part2;  // ConsString!

//   concatenated (ConsString)
//   ┌──────────────────┐
//   │ left ─────────────┼──→ "Zomato - " (SeqString)
//   │ right ────────────┼──→ "Order Food Online" (SeqString)
//   └──────────────────┘
//   NO bytes copied! Just a tree node.

console.log("   '" + part1 + "' + '" + part2 + "' → tree node, O(1)");

// Chaining creates a ConsString TREE (rope data structure)
const a = "Restaurant: ", b = "Biryani ", c = "Palace, ", d = "Hyderabad";
const chain = a + b + c + d;
//         chain (ConsString)
//        /          \
//     (ConsString)   "Hyderabad"
//     /          \
//  (ConsString)  "Palace, "
//  /          \
// "Restaurant: "  "Biryani "

console.log("   a + b + c + d → ConsString tree (rope)");

// --- 3. SlicedString: O(1) substring, shares parent memory ---
console.log("\n3. SlicedString:");
const fullAddress = "123 MG Road, Bengaluru, Karnataka 560001";
const city = fullAddress.substring(14, 23);  // SlicedString
//   city → { parent: fullAddress, offset: 14, length: 9 }
console.log("   substring(14,23) → '" + city + "' (shares parent memory)");
console.log("   CAVEAT: keeps ENTIRE parent alive in memory!");

// --- 4. ThinString: redirect after ConsString is flattened ---
console.log("\n4. ThinString: old ConsString → redirect to flat copy");

// --- 5. ExternalString: data outside V8 heap ---
console.log("5. ExternalString: data in C++ addon memory");

// ============================================================
// EXAMPLE 5 — String Interning
// Story: Zomato's search index has millions of entries. Common
// words like "biryani" appear thousands of times. V8 stores
// identical short strings just ONCE in memory.
// ============================================================

// WHY: String interning makes equality comparison O(1) — just
// compare memory pointers instead of every character.

console.log("\n" + "=".repeat(60));
console.log("STRING INTERNING");
console.log("=".repeat(60));

const tag1 = "biryani";  // Interned
const tag2 = "biryani";  // Same pointer as tag1!
console.log("tag1 === tag2:", tag1 === tag2);  // true (pointer comparison)

// V8 auto-interns: string literals, property names, short strings
const menu = {};
menu["biryani"] = 350;  // Property key → interned

const dynamic = ["b", "i", "r", "y", "a", "n", "i"].join("");
console.log("dynamic === tag1:", dynamic === tag1);  // true (value-equal)
// If not interned, falls back to char-by-char comparison

// ============================================================
// EXAMPLE 6 — ConsString Flattening Cost
// Story: Zomato's review page builds a long review by concat.
// This creates a deep ConsString tree. The FIRST character
// access forces O(n) flattening — the hidden cost.
// ============================================================

// WHY: ConsString concat is O(1), but char access forces O(n) flatten.

console.log("\n" + "=".repeat(60));
console.log("CONSSTRING FLATTENING");
console.log("=".repeat(60));

let reviewText = "";
const sentences = ["Amazing biryani! ", "Generous portions. ",
    "On-time delivery. ", "Will reorder. ", "Five stars! "];

for (const s of sentences) reviewText += s;  // ConsString tree

//   reviewText: ConsString tree with 5 nodes, NO bytes copied
console.log("Built review with 5 concatenations (no copy yet)");

const firstChar = reviewText[0];  // Forces O(n) flattening!
console.log("reviewText[0]:", firstChar, "→ FLATTENED entire tree");
console.log("Subsequent access is now O(1)");

// ============================================================
// EXAMPLE 7 — Template Literals Internals
// Story: Zomato's notification system sends personalized messages.
// Template literals compile to concatenation under the hood.
// ============================================================

// WHY: `Hello ${name}` compiles to "Hello " + name internally.

console.log("\n" + "=".repeat(60));
console.log("TEMPLATE LITERALS INTERNALS");
console.log("=".repeat(60));

const userName = "Rahul";
const orderCount = 42;
const template = `Welcome ${userName}! You have ${orderCount} orders.`;
const concatVersion = "Welcome " + userName + "! You have " + orderCount + " orders.";
console.log("Template === Concat:", template === concatVersion);  // true

// Tagged templates receive parsed parts
function highlight(strings, ...values) {
    return strings.reduce((r, s, i) =>
        r + s + (i < values.length ? `[${values[i]}]` : ""), "");
}
console.log(highlight`User ${userName} placed ${orderCount} orders`);
// The 'strings' array is FROZEN and CACHED by V8

// ============================================================
// EXAMPLE 8 — Unicode Normalization
// Story: Zomato searches must match "cafe" with "cafe" even
// when one uses a combining accent and the other a precomposed
// character. Without normalization, they're not equal!
// ============================================================

// WHY: Same visual character can have multiple Unicode reps.

console.log("\n" + "=".repeat(60));
console.log("UNICODE NORMALIZATION");
console.log("=".repeat(60));

const precomposed = "\u00E9";     // e (precomposed)
const decomposed = "e\u0301";     // e + combining accent
console.log("Precomposed length:", precomposed.length);  // 1
console.log("Decomposed length:", decomposed.length);    // 2
console.log("Strict equal:", precomposed === decomposed);  // false!
console.log("NFC equal:", precomposed.normalize("NFC") === decomposed.normalize("NFC"));  // true

// NFC — Canonical Composition (most compact, recommended)
// NFD — Canonical Decomposition
// NFKC/NFKD — Compatibility variants
function normalizeSearch(query) {
    return query.normalize("NFC").toLowerCase().trim();
}
console.log("Normalized:", normalizeSearch("  Cafe\u0301  "));  // "cafe"

// ============================================================
// EXAMPLE 9 — Rope Data Structure Concept
// Story: Text editors like VS Code use a "Rope" for large docs.
// V8's ConsString is essentially a simplified rope.
// ============================================================

// WHY: Ropes are the theoretical foundation of ConsString.

console.log("\n" + "=".repeat(60));
console.log("ROPE DATA STRUCTURE");
console.log("=".repeat(60));

//   Rope for "Hello World":
//        (11)
//       /    \
//    (5)      (6)
//    /  \    /    \
//  "He" "llo" "Wor"  "ld"
//  Concat: O(1), Index: O(log n), Flatten: O(n)

class Rope {
    constructor(str) { this.root = str; this.length = str.length; }
    concat(other) {
        const r = new Rope("");
        r.root = { left: this.root, right: other.root || other };
        r.length = this.length + (other.length || other.length);
        return r;
    }
    flatten(node = this.root) {
        if (typeof node === "string") return node;
        return this.flatten(node.left) + this.flatten(node.right);
    }
}

const combined = new Rope("Zomato ").concat(new Rope("delivers ")).concat(new Rope("happiness!"));
console.log("Rope flattened:", combined.flatten());

// ============================================================
// EXAMPLE 10 — Performance: Join vs Concat vs Template
// Story: Zomato's backend generates HTML for restaurant cards.
// The right string-building strategy matters at scale.
// ============================================================

// WHY: Array.join() vs += vs template have different profiles.

console.log("\n" + "=".repeat(60));
console.log("PERFORMANCE COMPARISON");
console.log("=".repeat(60));

const iterations = 10000;

function concatMethod() {
    let r = "";
    for (let i = 0; i < iterations; i++) r += "item-" + i + ", ";
    return r;
}
function joinMethod() {
    const p = [];
    for (let i = 0; i < iterations; i++) p.push("item-" + i);
    return p.join(", ");
}
function templateMethod() {
    let r = "";
    for (let i = 0; i < iterations; i++) r += `item-${i}, `;
    return r;
}

console.time("Concatenation (+=)"); concatMethod(); console.timeEnd("Concatenation (+=)");
console.time("Array.join()"); joinMethod(); console.timeEnd("Array.join()");
console.time("Template literal"); templateMethod(); console.timeEnd("Template literal");
// Array.join often wins for 1000s of pieces (pre-calculates total length)

// ============================================================
// EXAMPLE 11 — String Comparison Gotchas and Surrogate Handling
// Story: Zomato's search must handle locale-aware sorting and
// its review character counter must not break on emoji.
// ============================================================

console.log("\n" + "=".repeat(60));
console.log("STRING COMPARISON GOTCHAS");
console.log("=".repeat(60));

const cities = ["Ahmedabad", "ahmedabad", "Bangalore", "chennai"];
console.log("Default sort:", [...cities].sort());  // uppercase < lowercase
const collator = new Intl.Collator("en-IN", { sensitivity: "base" });
console.log("Locale sort:", [...cities].sort(collator.compare));

console.log("'Z' < 'a':", 'Z' < 'a');    // true (90 < 97)
console.log("'10' < '9':", '10' < '9');   // true (string compare!)

// --- Practical: safe surrogate pair handling ---
console.log("\n--- Surrogate Pair Handling ---");

function safeCharCount(str) { return [...str].length; }
function safeTruncate(str, max) {
    const pts = [...str];
    return pts.length <= max ? str : pts.slice(0, max).join("") + "...";
}

const testReview = "Love this place! 🍕🔥 Best pizza in Mumbai!";
console.log(".length:", testReview.length, "safe count:", safeCharCount(testReview));
console.log("Safe truncate(20):", safeTruncate(testReview, 20));

// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. JS strings are immutable sequences of UTF-16 code units,
//    NOT characters. Emoji use 2 code units (surrogate pairs).
//
// 2. V8 has 5+ internal string types: SeqString (flat), ConsString
//    (tree for O(1) concat), SlicedString (O(1) substring),
//    ThinString (redirect), ExternalString (outside V8 heap).
//
// 3. ConsString is a rope: concatenation is O(1), but first
//    character access forces O(n) flattening.
//
// 4. String interning: identical short strings share memory,
//    making === comparison O(1) via pointer comparison.
//
// 5. Use for...of or Array.from for correct Unicode iteration,
//    and .normalize() before comparing accented strings.
//
// 6. Array.join() is often fastest for building from many pieces.
//
// 7. SlicedString keeps the entire parent alive in memory.
// ============================================================

console.log("\n" + "=".repeat(60));
console.log("FILE 13 COMPLETE — String Internals");
console.log("=".repeat(60));
