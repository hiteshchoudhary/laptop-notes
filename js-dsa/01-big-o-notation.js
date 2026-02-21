// ============================================================
// FILE 01: BIG-O NOTATION
// Topic: Understanding how algorithm performance scales with input size
// WHY: Every engineering decision — from choosing a sort algorithm to
//   designing a database query — depends on understanding Big-O.
//   Without it, you are guessing. With it, you can predict and prevent disasters.
// ============================================================

// ============================================================
// EXAMPLE 1 — The IRCTC Tatkal Booking Meltdown
// Story: Every morning at 10:00 AM, over 10 million users hit IRCTC
//   simultaneously to book Tatkal tickets. If the train search algorithm
//   is O(n^2), the servers crash under load. If it is O(n log n), the
//   system handles the surge smoothly. Big-O is the difference between
//   a working railway booking system and national outrage on Twitter.
// ============================================================

// WHY: Big-O notation is a mathematical way to describe how the runtime
// or memory usage of an algorithm grows as the input size (n) increases.
// It does NOT measure exact time — it measures the RATE OF GROWTH.

// --- What Big-O IS and IS NOT ---
// Big-O IS:    A way to classify algorithms by their growth rate
// Big-O IS:    Always about the WORST CASE (upper bound)
// Big-O IS NOT: An exact measurement of seconds or milliseconds
// Big-O IS NOT: Dependent on hardware or language

// ============================================================
// EXAMPLE 2 — O(1) Constant Time: The PNR Status Lookup
// Story: When you check your PNR status on IRCTC, the system looks up
//   your record by PNR number — a direct key lookup in a hash table.
//   Whether there are 1,000 or 100 million bookings, your lookup takes
//   the same amount of time. That is O(1).
// ============================================================

// WHY: O(1) means the operation takes the same time regardless of input size.
// No matter how big the data grows, the time stays constant.

// --- O(1) Constant Time Examples ---

// Example 1: Array index access — direct memory offset calculation
function getFirstElement(arr) {
  return arr[0]; // O(1) — address = base + 0 * elementSize
}
// Accessing arr[0] or arr[999999] takes the same time
console.log("O(1) — Array access:", getFirstElement([10, 20, 30]));
// Output: 10

// Example 2: Hash map lookup — hash function computes index directly
function getPNRStatus(pnrMap, pnrNumber) {
  return pnrMap.get(pnrNumber); // O(1) average
}
const pnrDatabase = new Map();
pnrDatabase.set("4512789034", "CONFIRMED");
pnrDatabase.set("4512789035", "RAC 12");
pnrDatabase.set("4512789036", "WL 45");
console.log("O(1) — PNR Lookup:", getPNRStatus(pnrDatabase, "4512789035"));
// Output: RAC 12

// Example 3: Push/pop at end of array
function addBooking(bookings, booking) {
  bookings.push(booking); // O(1) amortized — appends at end
  return bookings;
}
console.log("O(1) — Push:", addBooking(["Delhi-Mumbai"], "Chennai-Kolkata"));
// Output: ["Delhi-Mumbai", "Chennai-Kolkata"]

// Example 4: Simple arithmetic — fixed number of operations
function calculateFare(baseFare, taxPercent) {
  return baseFare + (baseFare * taxPercent / 100); // O(1) — constant work
}
console.log("O(1) — Fare:", calculateFare(500, 18)); // Output: 590

// ============================================================
// EXAMPLE 3 — O(log n) Logarithmic: Binary Search for Trains
// Story: IRCTC has 12,000+ trains sorted by train number. Binary search
//   cuts the list in half each step. 12,000 trains? Only ~14 comparisons.
//   Doubling the data only adds ONE more step. That is O(log n).
// ============================================================

// WHY: O(log n) halves the problem at each step. 1 billion items = ~30 steps.

// --- O(log n) Logarithmic Time ---
function binarySearchTrain(sortedTrains, targetNumber) {
  let left = 0, right = sortedTrains.length - 1, steps = 0;
  while (left <= right) {
    steps++;
    const mid = Math.floor((left + right) / 2);
    if (sortedTrains[mid] === targetNumber) {
      console.log(`  Found in ${steps} steps (out of ${sortedTrains.length} trains)`);
      return mid;
    } else if (sortedTrains[mid] < targetNumber) {
      left = mid + 1;  // Discard left half
    } else {
      right = mid - 1; // Discard right half
    }
  }
  return -1;
}

const trainNumbers = Array.from({ length: 1000 }, (_, i) => 10001 + i * 3);
console.log("\nO(log n) — Binary Search for train:");
binarySearchTrain(trainNumbers, 10001 + 500 * 3);
// Output: Found in ~10 steps (out of 1000 trains). log2(1000) ~ 10.

// ============================================================
// EXAMPLE 4 — O(n) Linear Time: Scanning All Passengers
// Story: Before departure, the TTE must scan the entire passenger list.
//   500 passengers = 500 checks. 1000 = 1000. That is O(n).
// ============================================================

// WHY: O(n) visits every element once. Double input = double time.

// --- O(n) Linear Time ---
function findPassenger(passengers, name) {
  for (let i = 0; i < passengers.length; i++) { // O(n)
    if (passengers[i] === name) return i;
  }
  return -1;
}
console.log("\nO(n) — Linear search:", findPassenger(["Arjun", "Priya", "Rahul", "Vikram"], "Vikram"));
// Output: 3

function totalRevenue(tickets) {
  let sum = 0;
  for (const t of tickets) sum += t.price; // O(n) — visit each ticket once
  return sum;
}
console.log("O(n) — Revenue:", totalRevenue([{ price: 1500 }, { price: 1200 }, { price: 1800 }]));
// Output: 4500

// ============================================================
// EXAMPLE 5 — O(n log n) Linearithmic: Sorting Train Schedules
// Story: When IRCTC shows "Sort by departure time" for 500 trains,
//   it uses merge sort — O(n log n). This is the theoretical best for
//   comparison-based sorting, handling millions of records efficiently.
// ============================================================

// WHY: O(n log n) is the optimal comparison sort. Most built-in sorts use it.

// --- O(n log n) — Merge Sort ---
function mergeSort(arr) {
  if (arr.length <= 1) return arr;
  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));   // T(n/2)
  const right = mergeSort(arr.slice(mid));      // T(n/2)
  return merge(left, right);                    // O(n) merge step
  // Total: T(n) = 2T(n/2) + O(n) = O(n log n) by Master Theorem
}

function merge(left, right) {
  const result = [];
  let i = 0, j = 0;
  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) result.push(left[i++]);
    else result.push(right[j++]);
  }
  return [...result, ...left.slice(i), ...right.slice(j)];
}

console.log("\nO(n log n) — Merge Sort:", mergeSort([1430, 600, 2200, 830, 1100, 500]));
// Output: [500, 600, 830, 1100, 1430, 2200]

// ============================================================
// EXAMPLE 6 — O(n^2) Quadratic: The Nested Loop Disaster
// Story: IRCTC checking every passenger against every other to find
//   duplicates using nested loops. 10,000 passengers = 100 million
//   comparisons. This is why O(n^2) crashes Tatkal servers.
// ============================================================

// WHY: O(n^2) means nested loops over the same data. It is acceptable
// for small inputs (< 1000) but devastating for large datasets. Always
// look for a hash-map-based O(n) alternative when you see O(n^2).

// --- O(n^2) Quadratic Time ---

// BAD: Find duplicate PNR bookings with nested loop — O(n^2)
function findDuplicatesBrute(bookings) {
  const dupes = [];
  for (let i = 0; i < bookings.length; i++) {        // O(n)
    for (let j = i + 1; j < bookings.length; j++) {  // O(n) for each i
      if (bookings[i] === bookings[j]) {              // Total: O(n^2)
        dupes.push(bookings[i]);
      }
    }
  }
  return dupes;
}

// GOOD: Find duplicates with a Set — O(n)
function findDuplicatesOptimal(bookings) {
  const seen = new Set();
  const dupes = [];
  for (const b of bookings) {    // O(n) — single pass
    if (seen.has(b)) dupes.push(b); // O(1) — hash set lookup
    else seen.add(b);               // O(1) — hash set insert
  }
  return dupes;
}

const bookings = ["PNR001", "PNR002", "PNR003", "PNR001", "PNR002"];
console.log("\nO(n^2) — Brute duplicates:", findDuplicatesBrute(bookings));
console.log("O(n)   — Optimal duplicates:", findDuplicatesOptimal(bookings));

// Bubble Sort — classic O(n^2)
function bubbleSort(arr) {
  const r = [...arr];
  for (let i = 0; i < r.length - 1; i++)       // O(n) outer
    for (let j = 0; j < r.length - 1 - i; j++) // O(n) inner → O(n^2)
      if (r[j] > r[j + 1]) [r[j], r[j + 1]] = [r[j + 1], r[j]];
  return r;
}
console.log("O(n^2) — Bubble sort:", bubbleSort([64, 34, 25, 12, 22, 11, 90]));

// ============================================================
// EXAMPLE 7 — O(2^n) Exponential: The Fibonacci Trap
// Story: A naive algorithm trying all possible seat combinations is O(2^n).
//   With 40 seats, that is over 1 TRILLION combinations. The server would
//   still be computing when the train arrives at its destination.
// ============================================================

// WHY: O(2^n) doubles with each additional input. Never usable without memoization.

// --- O(2^n) Exponential Time ---
function fibNaive(n) {
  if (n <= 1) return n;
  return fibNaive(n - 1) + fibNaive(n - 2); // Two recursive calls = O(2^n)
}

function fibMemo(n, memo = {}) {
  if (n in memo) return memo[n]; // O(1) lookup — skip repeated work
  if (n <= 1) return n;
  memo[n] = fibMemo(n - 1, memo) + fibMemo(n - 2, memo); // Each n computed ONCE
  return memo[n]; // Total: O(n)
}

console.log("\nO(2^n) — Naive fib(10):", fibNaive(10));  // 55
console.log("O(n)   — Memo fib(45):", fibMemo(45));      // 1134903170

// Power set — all subsets — O(2^n)
function powerSet(arr) {
  const result = [[]];
  for (const item of arr) {
    const newSubs = [];
    for (const sub of result) newSubs.push([...sub, item]);
    result.push(...newSubs);
  }
  return result; // 2^n subsets, total work O(n * 2^n)
}
console.log("O(2^n) — Power set [1,2,3]:", powerSet([1, 2, 3]));
// Output: 8 subsets (2^3)

// ============================================================
// EXAMPLE 8 — O(n!) Factorial: Generating All Permutations
// Story: If IRCTC tried every possible order to allocate 15 berths,
//   that is 15! = 1,307,674,368,000 permutations. For 20? 77,000 YEARS.
// ============================================================

// WHY: O(n!) is the worst common complexity. Even n > 12 is impractical.

// --- O(n!) Factorial Time ---
function permutations(arr) {
  if (arr.length <= 1) return [arr];
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    for (const perm of permutations(rest))
      result.push([arr[i], ...perm]); // n * (n-1)! = n!
  }
  return result;
}
console.log("\nO(n!) — Permutations [1,2,3]:", permutations([1, 2, 3]).length, "= 3!");
console.log("O(n!) — Permutations [1,2,3,4]:", permutations([1, 2, 3, 4]).length, "= 4!");

// ============================================================
// EXAMPLE 9 — Big-O Comparison Chart (ASCII Art)
// Story: IRCTC engineering pins this chart on every developer's desk.
// ============================================================

console.log(`
// ============================================================
// BIG-O COMPLEXITY COMPARISON CHART
// ============================================================
//
// Time |
//  ^   |                                                 * O(n!)
//  |   |                                *              * O(2^n)
//  |   |                           *              *
//  |   |            *         *                        * O(n^2)
//  |   |       *        *                         *
//  |   |   **                     *                    * O(n log n)
//  |   | *            *                                * O(n)
//  |   *    *                                          * O(log n)
//  |   *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * O(1)
//  +--------------------------------------------------------> Input (n)
//
// RANKING: O(1) > O(log n) > O(n) > O(n log n) > O(n^2) > O(2^n) > O(n!)
//
// PRACTICAL LIMITS (10^8 ops/sec):
// O(n) → n ~ 10^8 | O(n log n) → n ~ 10^7 | O(n^2) → n ~ 10^4
// O(2^n) → n ~ 25  | O(n!) → n ~ 12
// ============================================================
`);

// ============================================================
// EXAMPLE 10 — Time Complexity vs Space Complexity
// Story: IRCTC servers have limited RAM. An algorithm might be fast
//   but use enormous memory. Trading time for space is a fundamental
//   tradeoff in systems design at every Indian tech company.
// ============================================================

// WHY: Big-O applies to both time AND space. An algorithm can be
// O(n) time but O(1) space (in-place) or O(n) space (extra array).

// --- Time vs Space Tradeoff ---
function hasDuplicatesBrute(arr) { // O(n^2) time, O(1) space
  for (let i = 0; i < arr.length; i++)
    for (let j = i + 1; j < arr.length; j++)
      if (arr[i] === arr[j]) return true;
  return false;
}

function hasDuplicatesSet(arr) { // O(n) time, O(n) space
  const seen = new Set();
  for (const item of arr) {
    if (seen.has(item)) return true;
    seen.add(item);
  }
  return false;
}

console.log("Has dupes (brute O(n^2) time, O(1) space):", hasDuplicatesBrute([12, 45, 23, 12]));
console.log("Has dupes (set   O(n)   time, O(n) space):", hasDuplicatesSet([12, 45, 23, 12]));

// ============================================================
// EXAMPLE 11 — Best Case, Average Case, Worst Case
// Story: Searching for a train: best case = first result, average =
//   middle, worst = last or absent. Big-O always reports WORST CASE.
// ============================================================

// WHY: Big-O = worst case. Big-Omega = best. Big-Theta = average.
// We use Big-O because we must guarantee performance under heaviest load.

function linearSearch(arr, target) {
  // Best: O(1), Average: O(n/2)=O(n), Worst: O(n). Big-O: O(n).
  for (let i = 0; i < arr.length; i++) if (arr[i] === target) return i;
  return -1;
}
console.log("\nBest case (first):", linearSearch([10, 20, 30, 40, 50], 10));
console.log("Worst case (last):", linearSearch([10, 20, 30, 40, 50], 50));

// ============================================================
// EXAMPLE 12 — How to Analyze Code: Rules for Counting
// Story: At IRCTC code reviews, senior engineers teach juniors to
//   analyze Big-O by counting loops and dropping constants.
// ============================================================

// WHY: Follow these rules:
// Rule 1: Simple statement = O(1)
// Rule 2: Single loop over n = O(n)
// Rule 3: Nested loops multiply: O(n) * O(n) = O(n^2)
// Rule 4: Sequential loops add: O(n) + O(m) = O(n + m)
// Rule 5: Drop constants: O(2n) = O(n)
// Rule 6: Drop non-dominant: O(n^2 + n) = O(n^2)

// --- Dropping Constants ---
function exampleDropConstants(arr) {
  // Two separate loops = O(n) + O(n) = O(2n) = O(n)
  for (let i = 0; i < arr.length; i++) {     // O(n)
    // some work
  }
  for (let j = 0; j < arr.length; j++) {     // O(n)
    // some work
  }
  // Total: O(2n) but we DROP the constant → O(n)
}

// --- Dropping Non-Dominant Terms ---
function exampleDropTerms(arr) {
  // O(n^2) + O(n) = O(n^2 + n) = O(n^2)
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length; j++) {   // O(n^2) — dominant
      // some work
    }
  }
  for (let k = 0; k < arr.length; k++) {     // O(n) — non-dominant, ignored
    // some work
  }
  // Total: O(n^2) — the n^2 dominates and n is dropped
}

// --- Different Inputs ---
function twoInputs(arrA, arrB) {
  // TWO different inputs — do NOT combine into n^2!
  for (let i = 0; i < arrA.length; i++) {    // O(a)
    for (let j = 0; j < arrB.length; j++) {  // O(b)
      // some work
    }
  }
  // Total: O(a * b) — NOT O(n^2) because a and b are independent
}

// ============================================================
// EXAMPLE 13 — Amortized Analysis: array.push()
// Story: V8 allocates arrays with extra capacity. Most push() calls
//   are O(1), but occasional resizes are O(n). Amortized = O(1).
// ============================================================

// WHY: Amortized analysis averages occasional expensive ops over many cheap ones.
// push() is O(1) amortized:
// - Most pushes: O(1) — write to next slot
// - Occasional resize: O(n) — copy all elements
// - Over n pushes: total = O(n), per push = O(1)

const amortizedDemo = [];
for (let i = 0; i < 10; i++) amortizedDemo.push(i); // O(1) amortized each
console.log("\nAmortized O(1) push:", amortizedDemo);

// ============================================================
// EXAMPLE 14 — Space Complexity: In-Place vs Extra Space
// Story: IRCTC sorting 10M records: in-place (O(1) space) saves RAM.
// ============================================================

// WHY: Space complexity = EXTRA memory. Recursive calls use stack space.

function reverseInPlace(arr) { // Time O(n), Space O(1)
  let l = 0, r = arr.length - 1;
  while (l < r) { [arr[l], arr[r]] = [arr[r], arr[l]]; l++; r--; }
  return arr;
}
console.log("\nO(1) space — In-place reverse:", reverseInPlace([1, 2, 3, 4, 5]));

function factorialRecursive(n) { // Time O(n), Space O(n) — n stack frames
  if (n <= 1) return 1;
  return n * factorialRecursive(n - 1);
}
function factorialIterative(n) { // Time O(n), Space O(1)
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}
console.log("Recursive factorial (O(n) space):", factorialRecursive(10)); // 3628800
console.log("Iterative factorial (O(1) space):", factorialIterative(10)); // 3628800

// ============================================================
// EXAMPLE 15 — Practical: Analyze These Code Snippets
// Story: IRCTC technical interview — determine the Big-O of each snippet.
// ============================================================

// WHY: Identifying Big-O on sight is the key skill for interviews.

// Snippet 1: O(1) — mathematical formula, no loops
function snippet1(n) { return n * (n + 1) / 2; }
console.log("\nSnippet 1 — O(1):", snippet1(100)); // 5050

// Snippet 2: O(n) — one loop
function snippet2(n) { let s = 0; for (let i = 1; i <= n; i++) s += i; return s; }
console.log("Snippet 2 — O(n):", snippet2(100)); // 5050

// Snippet 3: O(n^2) — nested loops
function snippet3(n) { let c = 0; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) c++; return c; }
console.log("Snippet 3 — O(n^2):", snippet3(10)); // 100

// Snippet 4: O(n) — constant inner loop (5 is constant, NOT n)
function snippet4(n) { let c = 0; for (let i = 0; i < n; i++) for (let j = 0; j < 5; j++) c++; return c; }
console.log("Snippet 4 — O(n) not O(n^2):", snippet4(10)); // 50

// Snippet 5: O(log n) — halving each iteration
function snippet5(n) { let c = 0, i = n; while (i > 1) { i = Math.floor(i / 2); c++; } return c; }
console.log("Snippet 5 — O(log n):", snippet5(1024)); // 10

// Snippet 6: O(n log n) — loop * halving
function snippet6(n) { let c = 0; for (let i = 0; i < n; i++) { let j = n; while (j > 1) { j = Math.floor(j / 2); c++; } } return c; }
console.log("Snippet 6 — O(n log n):", snippet6(16)); // 64

// Snippet 7: O(sqrt(n)) — prime check up to sqrt
function snippet7(n) { if (n < 2) return false; for (let i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; }
console.log("Snippet 7 — O(sqrt(n)):", snippet7(97)); // true

// Snippet 8: O(n) — two pointers meeting in middle
function snippet8(arr) { let l = 0, r = arr.length - 1; while (l < r) { l++; r--; } return "done"; }
console.log("Snippet 8 — O(n):", snippet8([1, 2, 3, 4, 5]));

// Snippet 9: O(n + m) — two independent arrays
function snippet9(a1, a2) { let c = 0; for (const x of a1) c++; for (const x of a2) c++; return c; }
console.log("Snippet 9 — O(n+m):", snippet9([1, 2, 3], [4, 5])); // 5

// Snippet 10: O(2^n) — double recursion
function snippet10(n) { if (n <= 0) return 1; return snippet10(n - 1) + snippet10(n - 1); }
console.log("Snippet 10 — O(2^n):", snippet10(5)); // 32

// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. Big-O describes the GROWTH RATE of time/space as input grows
// 2. Ranking: O(1) > O(log n) > O(n) > O(n log n) > O(n^2) > O(2^n) > O(n!)
// 3. Always analyze WORST CASE — that is what Big-O represents
// 4. Drop constants (O(2n) = O(n)) and non-dominant terms (O(n^2 + n) = O(n^2))
// 5. Space complexity = EXTRA memory used, including recursive call stack
// 6. Amortized analysis: occasional expensive ops averaged over many cheap ones
// 7. Two separate loops = O(n + n) = O(n), NOT O(n^2)
// 8. Nested loops = multiply: O(n * m). Sequential loops = add: O(n + m)
// 9. O(log n) = halving the problem each step (binary search pattern)
// 10. In interviews: first solve, then optimize. Know the Big-O of your solution.
// ============================================================
