// ============================================================
// FILE 03: STRINGS AND PATTERNS
// Topic: String manipulation, pattern matching, and classic string algorithms
// WHY: Strings are everywhere — from Naukri.com matching resumes to keywords,
//   to WhatsApp searching chat history, to Google autocomplete. Mastering
//   string algorithms is essential for interviews and real-world systems.
// ============================================================

// ============================================================
// EXAMPLE 1 — Naukri.com Resume Keyword Matching
// Story: Naukri.com processes 10+ million resumes. When a recruiter searches
//   "React developer Bangalore 5 years", the system must match keywords
//   across millions of documents. Naive string matching is O(n*m) per
//   document. Optimized algorithms achieve sub-second search at scale.
// ============================================================

// WHY: In JavaScript, strings are IMMUTABLE. Every operation creates a
// new string. Understanding this prevents the #1 performance pitfall.

// --- String Immutability in JavaScript ---
// Every string operation creates a NEW string. The original is never modified.

let greeting = "Namaste";
// greeting[0] = "n"; // This SILENTLY FAILS in non-strict mode
// Strings cannot be modified in place — you must create a new string

const modified = "n" + greeting.slice(1); // Creates entirely new string "namaste"
console.log("Original:", greeting);  // "Namaste" — unchanged, immutable
console.log("Modified:", modified);   // "namaste" — brand new string in memory

// ============================================================
// EXAMPLE 2 — String Operations Big-O
// Story: Naukri's search team learned that building result HTML by
//   concatenating strings in a loop was O(n^2). Switching to array.join()
//   made it O(n). Response time dropped from 3 seconds to 50ms.
// ============================================================

// WHY: String concat in a loop = O(n^2). Each concat copies all previous chars.

// --- String Operations Big-O ---
console.log("\n--- String Operations Big-O ---");
console.log("O(1) — charAt:", "Naukri"[2]); // 'u'

// BAD: O(n^2) — concatenation in loop
function buildStringBad(n) {
  let result = "";
  for (let i = 0; i < n; i++) result += "a"; // Copies grow: 1+2+...+n = O(n^2)
  return result;
}

// GOOD: O(n) — array.join()
function buildStringGood(n) {
  const parts = [];
  for (let i = 0; i < n; i++) parts.push("a"); // O(1) amortized each
  return parts.join(""); // O(n) single concatenation
}

console.log("Bad O(n^2):", buildStringBad(10).length, "chars");
console.log("Good O(n):", buildStringGood(10).length, "chars");

// indexOf/includes: O(n*m) worst case
const resume = "Experienced React developer with 5 years in Bangalore";
console.log("O(n*m) — indexOf:", resume.indexOf("developer")); // 20
console.log("O(n*m) — includes:", resume.includes("Bangalore")); // true

console.log(`
+-------------------+----------+----------------------------------+
| String Operation  | Big-O    | Why                              |
+-------------------+----------+----------------------------------+
| Access char [i]   | O(1)     | Direct index                     |
| Concat a+b        | O(n+m)   | Creates new string               |
| Concat in loop    | O(n^2)   | Copies grow: 1+2+...+n           |
| array.join()      | O(n)     | Single allocation + copy         |
| substring/slice   | O(k)     | Copies k characters              |
| indexOf/includes  | O(n*m)   | Naive search                     |
| split             | O(n)     | Scans entire string              |
+-------------------+----------+----------------------------------+
`);

// ============================================================
// EXAMPLE 3 — Reverse a String
// Story: Naukri's spam detection reverses strings to check for
//   obfuscated keywords hidden in resumes.
// ============================================================

// WHY: Tests understanding of immutability and basic algorithms.

// --- Reverse String: Two Approaches ---

// Approach 1: split-reverse-join — O(n) time, O(n) space
function reverseString1(str) {
  return str.split("").reverse().join("");
  // split: O(n) — creates array of chars
  // reverse: O(n) — in-place array reversal
  // join: O(n) — concatenate back to string
  // Total: O(3n) = O(n)
}

// Approach 2: Two-pointer on array — O(n) time, O(n) space
function reverseString2(str) {
  const chars = str.split(""); // Must copy because strings are immutable
  let left = 0, right = chars.length - 1;
  while (left < right) {
    [chars[left], chars[right]] = [chars[right], chars[left]]; // Swap
    left++;
    right--;
  }
  return chars.join("");
}

console.log("--- Reverse String ---");
console.log("Method 1 (split-reverse-join):", reverseString1("Bangalore"));
console.log("Method 2 (two-pointer):", reverseString2("Bangalore"));
// Both output: "erolagnaB"

// ============================================================
// EXAMPLE 4 — Check Palindrome
// Story: Naukri's content moderation checks usernames and slugs for
//   palindrome patterns as part of pattern detection.
// ============================================================

// WHY: Classic two-pointer. Optimal: check from both ends, no copy.

// --- Palindrome Check ---
// Big-O: Time O(n), Space O(n) for cleaned string
function isPalindrome(str) {
  const cleaned = str.toLowerCase().replace(/[^a-z0-9]/g, "");
  let left = 0, right = cleaned.length - 1;
  while (left < right) {
    if (cleaned[left] !== cleaned[right]) return false;
    left++; right--;
  }
  return true;
}

console.log("\n--- Palindrome Check ---");
console.log("'madam':", isPalindrome("madam"));         // true
console.log("'racecar':", isPalindrome("racecar"));     // true
console.log("'A man a plan a canal Panama':", isPalindrome("A man a plan a canal Panama")); // true

// ============================================================
// EXAMPLE 5 — Anagram Check
// Story: Naukri detects duplicate job postings by checking if titles
//   are anagrams: "Software Engineer" and "Engineer Software" get flagged.
// ============================================================

// WHY: Frequency counter pattern — one of the most versatile tools.

// --- Anagram Check: Frequency Counter ---
// Big-O: Time O(n + m), Space O(k) where k = unique characters
function areAnagrams(str1, str2) {
  if (str1.length !== str2.length) return false;
  const freq = new Map();
  for (const char of str1) freq.set(char, (freq.get(char) || 0) + 1);
  for (const char of str2) {
    if (!freq.has(char) || freq.get(char) === 0) return false;
    freq.set(char, freq.get(char) - 1);
  }
  return true;
}

// Alternative: Sort both and compare — O(n log n)
function areAnagramsSort(s1, s2) {
  if (s1.length !== s2.length) return false;
  return s1.split("").sort().join("") === s2.split("").sort().join("");
}

console.log("\n--- Anagram Check ---");
console.log("'listen' & 'silent':", areAnagrams("listen", "silent"));     // true
console.log("'triangle' & 'integral':", areAnagrams("triangle", "integral")); // true
console.log("Sort method:", areAnagramsSort("listen", "silent"));          // true

// ============================================================
// EXAMPLE 6 — Longest Substring Without Repeating Characters
// Story: Naukri's search suggestions use the longest non-repeating
//   substring to find the most "unique" part of a query. Classic
//   sliding window problem.
// ============================================================

// WHY: Instead of checking O(n^2) substrings, the window does O(n).

// --- Sliding Window ---
// Big-O: Time O(n), Space O(min(n, alphabet_size))
function longestUniqueSubstring(str) {
  const charIndex = new Map();
  let maxLen = 0, start = 0;
  for (let end = 0; end < str.length; end++) {
    const char = str[end];
    if (charIndex.has(char) && charIndex.get(char) >= start) {
      start = charIndex.get(char) + 1; // Shrink past the duplicate
    }
    charIndex.set(char, end);
    maxLen = Math.max(maxLen, end - start + 1);
  }
  return maxLen;
}

console.log("\n--- Longest Unique Substring ---");
console.log("'abcabcbb':", longestUniqueSubstring("abcabcbb"));     // 3 ("abc")
console.log("'bbbbb':", longestUniqueSubstring("bbbbb"));           // 1 ("b")
console.log("'pwwkew':", longestUniqueSubstring("pwwkew"));         // 3 ("wke")

// ============================================================
// EXAMPLE 7 — String Compression (Run-Length Encoding)
// Story: Naukri compresses resume text fields before storage.
//   "aaabbbcc" becomes "a3b3c2". Return original if not shorter.
// ============================================================

// WHY: Runner technique — track current char and count while iterating.

// --- String Compression ---
// Big-O: Time O(n), Space O(n)
function compressString(str) {
  if (str.length <= 1) return str;
  const parts = [];
  let count = 1;
  for (let i = 1; i <= str.length; i++) {
    if (i < str.length && str[i] === str[i - 1]) {
      count++;
    } else {
      parts.push(str[i - 1] + count);
      count = 1;
    }
  }
  const compressed = parts.join("");
  return compressed.length < str.length ? compressed : str;
}

console.log("\n--- String Compression ---");
console.log("'aaabbbcc':", compressString("aaabbbcc")); // "a3b3c2"
console.log("'abc':", compressString("abc"));           // "abc" (compressed longer)
console.log("'aaaaaa':", compressString("aaaaaa"));     // "a6"

// ============================================================
// EXAMPLE 8 — Character Frequencies
// Story: Naukri counts character frequency to detect spam resumes.
//   Abnormal distributions flag content for manual review.
// ============================================================

// WHY: Frequency counting with Map is the foundation for many string
// algorithms: anagram check, first unique char, most common char, etc.

// --- Character Frequency Counter ---
// Big-O: Time O(n), Space O(k) where k = unique characters
function charFrequency(str) {
  const freq = new Map();
  for (const char of str) {
    if (char === " ") continue;
    const lower = char.toLowerCase();
    freq.set(lower, (freq.get(lower) || 0) + 1);
  }
  return freq;
}

console.log("\n--- Character Frequencies ---");
const freq = charFrequency("Naukri is the best job portal");
for (const [char, count] of [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)) {
  console.log(`  '${char}': ${count}`);
}

// ============================================================
// EXAMPLE 9 — First Non-Repeating Character
// Story: Naukri's URL slug generator needs the first unique character
//   in a company name for a distinctive identifier.
// ============================================================

// WHY: Two passes: count, then find first with count 1.

// Big-O: Time O(n), Space O(k)
function firstNonRepeating(str) {
  const freq = new Map();
  for (const char of str) freq.set(char, (freq.get(char) || 0) + 1);
  for (let i = 0; i < str.length; i++)
    if (freq.get(str[i]) === 1) return { char: str[i], index: i };
  return null;
}

console.log("\n--- First Non-Repeating ---");
console.log("'aabccbd':", firstNonRepeating("aabccbd")); // { char: 'd', index: 6 }
console.log("'aabbcc':", firstNonRepeating("aabbcc"));   // null

// ============================================================
// EXAMPLE 10 — String Rotation Check
// Story: Naukri checks if two company names are rotations of each other.
//   Trick: if s2 is a rotation of s1, then s2 is inside (s1 + s1).
// ============================================================

// WHY: Reduces rotation check to substring search — O(n).

// Big-O: Time O(n), Space O(n) for the doubled string
function isRotation(s1, s2) {
  if (s1.length !== s2.length) return false;
  if (s1.length === 0) return true;
  return (s1 + s1).includes(s2); // "waterbottlewaterbottle" contains "erbottlewat"
}

console.log("\n--- String Rotation ---");
console.log("'waterbottle' & 'erbottlewat':", isRotation("waterbottle", "erbottlewat")); // true
console.log("'hello' & 'llohe':", isRotation("hello", "llohe")); // true
console.log("'hello' & 'world':", isRotation("hello", "world")); // false

// ============================================================
// EXAMPLE 11 — KMP Pattern Matching (Simplified)
// Story: Naukri's full-text search uses KMP to find patterns in resume
//   text. Unlike naive O(n*m), KMP never backtracks — O(n + m).
// ============================================================

// WHY: KMP is the gold standard for exact string matching. It uses a
// prefix table (failure function) to skip redundant comparisons.

// --- KMP: Build Prefix Table (LPS Array) ---
// Big-O: O(m)
function buildPrefixTable(pattern) {
  const lps = new Array(pattern.length).fill(0);
  let length = 0, i = 1;
  while (i < pattern.length) {
    if (pattern[i] === pattern[length]) {
      length++;
      lps[i] = length;
      i++;
    } else {
      if (length !== 0) length = lps[length - 1]; // Try shorter prefix
      else { lps[i] = 0; i++; }
    }
  }
  return lps;
}

// --- KMP: Search ---
// Big-O: O(n + m) total
function kmpSearch(text, pattern) {
  if (pattern.length === 0) return [];
  const lps = buildPrefixTable(pattern);
  const matches = [];
  let i = 0, j = 0;
  while (i < text.length) {
    if (text[i] === pattern[j]) { i++; j++; }
    if (j === pattern.length) {
      matches.push(i - j);
      j = lps[j - 1];
    } else if (i < text.length && text[i] !== pattern[j]) {
      if (j !== 0) j = lps[j - 1]; // Use prefix table — NO backtracking
      else i++;
    }
  }
  return matches;
}

console.log("\n--- KMP Pattern Matching ---");
const resumeText = "javascript developer with javascript and react javascript skills";
console.log("'javascript' found at:", kmpSearch(resumeText, "javascript"));
// Output: [0, 27, 47]
console.log("LPS for 'ABABAC':", buildPrefixTable("ABABAC"));
// Output: [0, 0, 1, 2, 3, 0]

// ============================================================
// EXAMPLE 12 — Practical String Problems
// Story: Common problems from Naukri-listed tech company interviews
//   (Flipkart, Razorpay, PhonePe, Swiggy).
// ============================================================

// --- Problem 1: All Unique Characters ---
// Big-O: Time O(n), Space O(k)
function hasAllUniqueChars(str) {
  const seen = new Set();
  for (const c of str) { if (seen.has(c)) return false; seen.add(c); }
  return true;
}
console.log("\n--- Practical Problems ---");
console.log("Unique 'abcdef':", hasAllUniqueChars("abcdef")); // true
console.log("Unique 'hello':", hasAllUniqueChars("hello"));   // false

// --- Problem 2: Reverse Words ---
// Big-O: Time O(n), Space O(n)
function reverseWords(s) { return s.split(" ").reverse().join(" "); }
console.log("Reverse words:", reverseWords("Naukri is the best portal"));

// --- Problem 3: Title Case ---
function titleCase(str) {
  return str.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
}
console.log("Title case:", titleCase("naukri dot com"));

// --- Problem 4: One Edit Away ---
// Big-O: Time O(n), Space O(1)
function oneEditAway(s1, s2) {
  if (Math.abs(s1.length - s2.length) > 1) return false;
  let edits = 0, i = 0, j = 0;
  while (i < s1.length && j < s2.length) {
    if (s1[i] !== s2[j]) {
      edits++;
      if (edits > 1) return false;
      if (s1.length > s2.length) i++;
      else if (s1.length < s2.length) j++;
      else { i++; j++; }
    } else { i++; j++; }
  }
  return edits + (s1.length - i) + (s2.length - j) <= 1;
}
console.log("One edit 'pale'->'ple':", oneEditAway("pale", "ple"));   // true
console.log("One edit 'pale'->'bake':", oneEditAway("pale", "bake")); // false

// --- Problem 5: Longest Palindromic Substring ---
// Big-O: Time O(n^2), Space O(1) — expand around center
function longestPalindromicSubstring(str) {
  if (str.length < 2) return str;
  let start = 0, maxLen = 1;
  function expand(left, right) {
    while (left >= 0 && right < str.length && str[left] === str[right]) {
      if (right - left + 1 > maxLen) { start = left; maxLen = right - left + 1; }
      left--; right++;
    }
  }
  for (let i = 0; i < str.length; i++) {
    expand(i, i);     // Odd-length palindromes
    expand(i, i + 1); // Even-length palindromes
  }
  return str.substring(start, start + maxLen);
}
console.log("Longest palindrome 'racecarxyz':", longestPalindromicSubstring("racecarxyz"));
// Output: "racecar"

// --- Problem 6: Group Anagrams ---
// Big-O: Time O(n * k log k), Space O(n * k)
function groupAnagrams(words) {
  const groups = new Map();
  for (const word of words) {
    const key = word.split("").sort().join("");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(word);
  }
  return [...groups.values()];
}
console.log("Group anagrams:", groupAnagrams(["eat", "tea", "tan", "ate", "nat", "bat"]));
// [["eat","tea","ate"], ["tan","nat"], ["bat"]]

// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. Strings in JS are IMMUTABLE — every operation creates a new string
// 2. NEVER concatenate in a loop — use array.join(): O(n) vs O(n^2)
// 3. Frequency counter (Map) solves anagram, first unique, duplicate problems
// 4. Two-pointer: palindrome check in O(n) time, O(1) space
// 5. Sliding window: longest unique substring in O(n)
// 6. String rotation trick: (s1 + s1).includes(s2) — elegant O(n)
// 7. KMP: pattern matching in O(n + m), avoids naive O(n * m)
// 8. indexOf/includes are O(n*m) worst case — use KMP for repeated searches
// 9. split() creates an array — O(n) time and space
// 10. Always clarify character set (ASCII vs Unicode) and case sensitivity
// ============================================================
