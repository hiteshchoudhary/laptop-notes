// ============================================================
// FILE 04: HASH TABLES
// Topic: Hash tables — the most important data structure in computing
// WHY: Hash tables power O(1) lookups everywhere — from Aadhaar's 1.4 billion
//   ID-to-record mapping to every database index, DNS lookup, and caching layer.
//   Understanding how they work under the hood is non-negotiable for any engineer.
// ============================================================

// ============================================================
// EXAMPLE 1 — Aadhaar (UIDAI): 1.4 Billion Records, O(1) Lookup
// Story: India's Aadhaar system maps 1.4 billion unique 12-digit IDs to
//   citizen records (name, address, biometrics). When you verify identity
//   at a bank, the system looks up your Aadhaar in a hash table — O(1)
//   regardless of whether there are 1 million or 1.4 billion records.
// ============================================================

// WHY: A hash table maps keys to values using a hash function.
// Key -> hash function -> index -> stored value
// Average time for get/set/delete: O(1)

console.log("=== HASH TABLE FUNDAMENTALS ===\n");

// ============================================================
// EXAMPLE 2 — Building a Hash Table from Scratch
// Story: Aadhaar's engineering built their hash table from scratch for
//   12-digit number collision patterns. Let us build one step by step.
// ============================================================

// WHY: Building from scratch reveals what Map/Object do internally.

class HashTable {
  constructor(initialSize = 16) {
    this.buckets = new Array(initialSize).fill(null).map(() => []);
    this.size = 0;
    this.capacity = initialSize;
  }

  // Hash Function: key -> integer index. Big-O: O(k) where k = key length
  _hash(key) {
    let hash = 0;
    const str = String(key);
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) % this.capacity;
      // WHY 31? Odd prime — spreads bits evenly, same as Java's String.hashCode()
    }
    return hash;
  }

  // Set: O(1) average, O(n) worst case (all keys collide)
  set(key, value) {
    if (this.size / this.capacity > 0.75) this._resize();
    const index = this._hash(key);
    const bucket = this.buckets[index];
    for (let i = 0; i < bucket.length; i++) {
      if (bucket[i][0] === key) { bucket[i][1] = value; return; } // Update
    }
    bucket.push([key, value]); // Insert new
    this.size++;
  }

  // Get: O(1) average, O(n) worst case
  get(key) {
    const bucket = this.buckets[this._hash(key)];
    for (const [k, v] of bucket) if (k === key) return v;
    return undefined;
  }

  // Delete: O(1) average, O(n) worst case
  delete(key) {
    const bucket = this.buckets[this._hash(key)];
    for (let i = 0; i < bucket.length; i++) {
      if (bucket[i][0] === key) { bucket.splice(i, 1); this.size--; return true; }
    }
    return false;
  }

  // Has: O(1) average
  has(key) { return this.get(key) !== undefined; }

  // Keys/Values/Entries: O(n + capacity)
  keys() { return this.buckets.flat().map(([k]) => k); }
  values() { return this.buckets.flat().map(([, v]) => v); }
  entries() { return this.buckets.flat(); }

  // Resize: O(n) — rehash all entries when load factor > 0.75
  _resize() {
    const old = this.buckets;
    this.capacity *= 2;
    this.buckets = new Array(this.capacity).fill(null).map(() => []);
    this.size = 0;
    for (const bucket of old)
      for (const [key, value] of bucket) this.set(key, value);
  }

  display() {
    console.log(`HashTable (size=${this.size}, cap=${this.capacity}, load=${(this.size/this.capacity).toFixed(2)}):`);
    for (let i = 0; i < this.capacity; i++)
      if (this.buckets[i].length > 0)
        console.log(`  [${i}]: ${this.buckets[i].map(([k,v]) => `${k}:${v}`).join(", ")}`);
  }
}

// --- Test the HashTable ---
console.log("--- Custom HashTable ---");
const aadhaarDB = new HashTable(8); // Start small to observe resizing behavior

// Insert Aadhaar records
aadhaarDB.set("123456789012", "Arjun Sharma, Delhi");
aadhaarDB.set("234567890123", "Priya Patel, Mumbai");
aadhaarDB.set("345678901234", "Rahul Verma, Bangalore");
aadhaarDB.set("456789012345", "Sneha Reddy, Hyderabad");
aadhaarDB.set("567890123456", "Vikram Singh, Jaipur");
aadhaarDB.set("678901234567", "Deepa Nair, Kochi");
aadhaarDB.set("789012345678", "Amit Gupta, Kolkata");

aadhaarDB.display();
// Notice: capacity may have doubled due to load factor exceeding 0.75

// Retrieve — O(1) average
console.log("\nGet '345678901234':", aadhaarDB.get("345678901234"));
// Output: Rahul Verma, Bangalore

// Check existence — O(1) average
console.log("Has '999999999999':", aadhaarDB.has("999999999999")); // false

// Delete — O(1) average
console.log("Delete '456789012345':", aadhaarDB.delete("456789012345"));
console.log("Has after delete:", aadhaarDB.has("456789012345")); // false

// Keys, Values
console.log("All keys:", aadhaarDB.keys());
console.log("Size:", aadhaarDB.size);

// ============================================================
// EXAMPLE 3 — Collision Handling
// Story: When two Aadhaar numbers hash to the same index — like two
//   passengers assigned the same berth — we need a strategy. Two main
//   approaches: chaining (lists) and open addressing (probing).
// ============================================================

// WHY: Collisions are inevitable (Pigeonhole Principle). The strategy
// determines real-world performance.

// --- Chaining (used above): linked list/array at each bucket ---
// --- Open Addressing: probe for next empty slot ---

class HashTableLinearProbe {
  constructor(size = 16) {
    this.capacity = size;
    this.keys = new Array(size).fill(null);
    this.values = new Array(size).fill(null);
    this.size = 0;
  }

  _hash(key) {
    let hash = 0;
    for (let i = 0; i < String(key).length; i++)
      hash = (hash * 31 + String(key).charCodeAt(i)) % this.capacity;
    return hash;
  }

  // Linear Probing: if slot taken, try slot+1, slot+2, ...
  set(key, value) {
    let index = this._hash(key);
    while (this.keys[index] !== null && this.keys[index] !== key)
      index = (index + 1) % this.capacity; // Wrap around
    if (this.keys[index] === null) this.size++;
    this.keys[index] = key;
    this.values[index] = value;
  }

  get(key) {
    let index = this._hash(key), probes = 0;
    while (this.keys[index] !== null) {
      if (this.keys[index] === key) return this.values[index];
      index = (index + 1) % this.capacity;
      if (++probes >= this.capacity) break;
    }
    return undefined;
  }
}

console.log("\n--- Open Addressing (Linear Probing) ---");
const openTable = new HashTableLinearProbe(16);
openTable.set("Mumbai", "Maharashtra");
openTable.set("Delhi", "NCR");
openTable.set("Chennai", "Tamil Nadu");
console.log("Get Mumbai:", openTable.get("Mumbai"));
console.log("Get Delhi:", openTable.get("Delhi"));

// ============================================================
// EXAMPLE 4 — Load Factor and Big-O Summary
// Story: Aadhaar monitors load factor (entries/capacity). Above 0.75,
//   the table doubles and all entries rehash. This is why inserts are
//   O(1) AMORTIZED — occasional O(n) resize spread over many O(1)s.
// ============================================================

console.log(`
+-------------------+----------+----------------------------------+
| Hash Table Op     | Average  | Worst Case                       |
+-------------------+----------+----------------------------------+
| set(key, value)   | O(1)*    | O(n) — all keys collide          |
| get(key)          | O(1)     | O(n) — all in same bucket        |
| delete(key)       | O(1)     | O(n)                             |
| has(key)          | O(1)     | O(n)                             |
| keys/values       | O(n+c)  | c = capacity                      |
| resize            | O(n)     | Rehash everything                 |
+-------------------+----------+----------------------------------+
* amortized — occasional O(n) resize spread across many O(1) inserts
`);

// ============================================================
// EXAMPLE 5 — Map vs Object in JavaScript
// Story: Razorpay switched from Objects to Maps for payment metadata.
//   Maps preserve insertion order, accept any key type, and have no
//   prototype pollution. Performance improved 15%.
// ============================================================

// WHY: Map and Object are both hash tables but with critical differences.

console.log("--- Map vs Object ---\n");

// KEY TYPES: Object coerces to string, Map keeps actual type
const obj = {};
obj[1] = "one"; obj["1"] = "one-string";
console.log("Object: obj[1] === obj['1']:", obj[1] === obj["1"]); // true! Collision.

const map = new Map();
map.set(1, "one"); map.set("1", "one-string");
console.log("Map: get(1):", map.get(1), "| get('1'):", map.get("1")); // Different!

// ORDER: Object sorts numeric keys first; Map preserves insertion order
const objOrder = { b: 2, a: 1, 3: "three", 1: "one" };
console.log("\nObject keys:", Object.keys(objOrder)); // ["1","3","b","a"]
const mapOrder = new Map([["b",2],["a",1],[3,"three"],[1,"one"]]);
console.log("Map keys:", [...mapOrder.keys()]); // ["b","a",3,1]

// SIZE: Object O(n), Map O(1)
console.log("\nMap .size:", mapOrder.size); // O(1)

// PROTOTYPE POLLUTION: Object inherits toString etc.
console.log("'toString' in {}:", "toString" in {}); // true — dangerous!
console.log("Map has 'toString':", new Map().has("toString")); // false — safe

console.log(`
+-------------------+------------------+------------------+
| Feature           | Object           | Map              |
+-------------------+------------------+------------------+
| Key types         | String/Symbol    | Any type         |
| Order             | Numeric first    | Insertion order  |
| Size              | O(n) to compute  | O(1) .size       |
| Prototype         | Yes (pollution!) | No               |
| Perf (add/delete) | Slower           | Faster           |
+-------------------+------------------+------------------+
USE Object: JSON data, config, static structure
USE Map: dynamic key-value stores, caches, counters
`);

// ============================================================
// EXAMPLE 6 — Set: Unique Values Collection
// Story: Aadhaar deduplication uses Sets to ensure no duplicate IDs.
//   O(1) add, has, delete — essential for real-time duplicate detection.
// ============================================================

// WHY: Set = hash table with only keys. O(1) for add/has/delete.

console.log("--- Set Operations ---\n");

const uniqueIDs = new Set();

// add: O(1) amortized
uniqueIDs.add("AADH001");
uniqueIDs.add("AADH002");
uniqueIDs.add("AADH003");
uniqueIDs.add("AADH001"); // Duplicate — silently ignored!
console.log("Size after adding 4 (with 1 duplicate):", uniqueIDs.size); // 3

// has: O(1)
console.log("Has AADH002:", uniqueIDs.has("AADH002")); // true
console.log("Has AADH999:", uniqueIDs.has("AADH999")); // false

// delete: O(1)
uniqueIDs.delete("AADH002");
console.log("After deleting AADH002:", [...uniqueIDs]); // ["AADH001", "AADH003"]

// --- Common Set Operations: Union, Intersection, Difference ---

// Union: A ∪ B — all unique elements from both sets
function setUnion(setA, setB) {
  return new Set([...setA, ...setB]); // O(n + m)
}

// Intersection: A ∩ B — elements in both sets
function setIntersection(setA, setB) {
  return new Set([...setA].filter(x => setB.has(x))); // O(n)
}

// Difference: A - B — elements in A but not in B
function setDifference(setA, setB) {
  return new Set([...setA].filter(x => !setB.has(x))); // O(n)
}

const frontend = new Set(["React", "JavaScript", "CSS", "HTML"]);
const backend = new Set(["Node.js", "JavaScript", "MongoDB", "Express"]);

console.log("\nUnion:", [...setUnion(frontend, backend)]);
console.log("Intersection:", [...setIntersection(frontend, backend)]); // ["JavaScript"]
console.log("Difference:", [...setDifference(frontend, backend)]); // ["React","CSS","HTML"]

// ============================================================
// EXAMPLE 7 — Frequency Counter Pattern
// Story: Aadhaar analytics counts registrations per state. Frequency
//   counter using Map replaces O(n^2) nested loops with O(n).
// ============================================================

// WHY: One of the most versatile patterns in programming.

// Big-O: Time O(n), Space O(k) unique elements
function frequencyCounter(arr) {
  const freq = new Map();
  for (const item of arr) freq.set(item, (freq.get(item) || 0) + 1);
  return freq;
}

const states = ["Maharashtra", "Karnataka", "Maharashtra", "Tamil Nadu",
  "Karnataka", "Karnataka", "Delhi", "Maharashtra"];
console.log("\n--- Frequency Counter ---");
const stateFreq = frequencyCounter(states);
for (const [state, count] of [...stateFreq.entries()].sort((a, b) => b[1] - a[1]))
  console.log(`  ${state}: ${count}`);

// ============================================================
// EXAMPLE 8 — Two-Sum: O(n) with Hash Map
// Story: Flipkart pricing engine: find two products that exactly match
//   a budget. Hash map checks if complement was already seen.
// ============================================================

// WHY: Two-Sum is LeetCode #1. Hash map = O(n) vs brute force O(n^2).

// Big-O: Time O(n), Space O(n)

function twoSum(nums, target) {
  const seen = new Map(); // value -> index

  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i]; // What do we need to reach target?

    if (seen.has(complement)) {           // O(1) lookup
      return [seen.get(complement), i];   // Found the pair!
    }

    seen.set(nums[i], i);                 // Store current number and its index
  }

  return null; // No pair found
  // O(n) time — single pass. O(n) space — Map stores up to n entries.
}

// Compare with brute force — O(n^2):
function twoSumBrute(nums, target) {
  for (let i = 0; i < nums.length; i++)
    for (let j = i + 1; j < nums.length; j++)
      if (nums[i] + nums[j] === target) return [i, j];
  return null;
}

const prices = [100, 250, 400, 150, 600, 350];
console.log("\n--- Two-Sum ---");
console.log("Prices:", prices, "Target: 500");
console.log("Hash map O(n):", twoSum(prices, 500));
// Trace: i=0: comp=400, seen={}. Store {100:0}.
//        i=1: comp=250, seen={100:0}. Store {100:0,250:1}.
//        i=2: comp=100, seen has 100 at index 0. Return [0,2]!
console.log("Brute O(n^2):", twoSumBrute(prices, 500)); // Same answer: [0, 2]

// ============================================================
// EXAMPLE 9 — Group Anagrams
// Story: Naukri groups job postings that are anagrams. Sort each word
//   as key, group by that key in a Map.
// ============================================================

// Big-O: Time O(n * k log k), Space O(n * k)
function groupAnagrams(strs) {
  const groups = new Map();
  for (const str of strs) {
    const key = str.split("").sort().join(""); // Sorted string = anagram key
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(str);
  }
  return [...groups.values()];
}

// Optimal: frequency string as key — O(n * k) instead of O(n * k log k)
function groupAnagramsOptimal(strs) {
  const groups = new Map();
  for (const str of strs) {
    const count = new Array(26).fill(0);
    for (const c of str) count[c.charCodeAt(0) - 97]++;
    const key = count.join("#");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(str);
  }
  return [...groups.values()];
}

console.log("\n--- Group Anagrams ---");
console.log(groupAnagrams(["eat", "tea", "tan", "ate", "nat", "bat"]));

// ============================================================
// EXAMPLE 10 — Subarray Sum Equals K (Prefix Sum + Map)
// Story: PhonePe tracks daily amounts. Count subarrays summing to K.
//   Prefix sum + hash map achieves O(n) instead of O(n^2).
// ============================================================

// Big-O: Time O(n), Space O(n)
function subarraySumK(nums, k) {
  const prefixCount = new Map([[0, 1]]); // Empty prefix = 0 seen once
  let currentSum = 0, count = 0;
  for (const num of nums) {
    currentSum += num;
    if (prefixCount.has(currentSum - k))
      count += prefixCount.get(currentSum - k);
    prefixCount.set(currentSum, (prefixCount.get(currentSum) || 0) + 1);
  }
  return count;
}

console.log("\n--- Subarray Sum = K ---");
console.log("[1,2,3,-1,4,-2,1] k=5:", subarraySumK([1, 2, 3, -1, 4, -2, 1], 5));

// ============================================================
// EXAMPLE 11 — Longest Consecutive Sequence
// Story: Aadhaar enrollment has gaps. Find longest consecutive run.
//   Set gives O(n) by checking if num is sequence START (no num-1).
// ============================================================

// Big-O: Time O(n), Space O(n)
function longestConsecutive(nums) {
  const numSet = new Set(nums);
  let maxLen = 0;
  for (const num of numSet) {
    if (!numSet.has(num - 1)) { // Only start from beginning of sequence
      let cur = num, len = 1;
      while (numSet.has(cur + 1)) { cur++; len++; }
      maxLen = Math.max(maxLen, len);
    }
  }
  return maxLen;
}

console.log("\n--- Longest Consecutive ---");
console.log("[100,4,200,1,3,2]:", longestConsecutive([100, 4, 200, 1, 3, 2])); // 4

// ============================================================
// EXAMPLE 12 — LRU Cache (Map preserves insertion order)
// Story: Aadhaar caches recent lookups. LRU evicts the oldest entry
//   when full. Map's order + O(1) ops = perfect LRU.
// ============================================================

// Big-O: get and put both O(1)
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
  }
  get(key) {
    if (!this.cache.has(key)) return -1;
    const val = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, val); // Move to end (most recent)
    return val;
  }
  put(key, value) {
    if (this.cache.has(key)) this.cache.delete(key);
    else if (this.cache.size >= this.capacity) {
      const lruKey = this.cache.keys().next().value;
      this.cache.delete(lruKey); // Evict least recent (first in Map)
    }
    this.cache.set(key, value);
  }
}

console.log("\n--- LRU Cache ---");
const cache = new LRUCache(3);
cache.put("A001", "Arjun"); cache.put("A002", "Priya"); cache.put("A003", "Rahul");
console.log("Get A001:", cache.get("A001")); // "Arjun" — moves to end
cache.put("A004", "Sneha"); // Evicts A002 (least recent)
console.log("Get A002:", cache.get("A002")); // -1 (evicted)
console.log("Cache:", [...cache.cache.entries()]);

// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. Hash tables provide O(1) average for get/set/delete — fastest lookup
// 2. Hash function: key -> integer index. Good hash = uniform distribution
// 3. Collisions: handle with chaining (lists) or open addressing (probing)
// 4. Load factor = entries/capacity. Resize at 0.75 (chaining) or 0.5 (probing)
// 5. Use Map over Object for: any key type, ordered iteration, no prototype pollution
// 6. Use Set for: uniqueness checks, O(1) membership, set operations
// 7. Frequency counter (Map): count occurrences in O(n) — solves many problems
// 8. Two-Sum: check complement in Map — O(n) vs O(n^2)
// 9. Prefix sum + Map: count subarrays with target sum in O(n)
// 10. LRU Cache: Map insertion order + O(1) ops = elegant implementation
// ============================================================
