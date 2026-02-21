// ============================================================
// FILE 08: RECURSION — DIVIDE, CONQUER, AND SELF-SIMILARITY
// Topic: Recursive thinking, call stack, memoization, and patterns
// WHY: Recursion is the backbone of trees, graphs, backtracking,
//   and divide-and-conquer algorithms. Without understanding
//   recursion, advanced DSA topics become impenetrable.
// ============================================================

// ============================================================
// EXAMPLE 1 — IRCTC Train Route Finder
// Story: IRCTC needs to find all possible train routes from
//   Delhi to Chennai. At each junction (Agra, Bhopal, Nagpur),
//   the path branches into sub-routes. Each branch recursively
//   explores further junctions until reaching Chennai (base
//   case) or a dead end.
// ============================================================

// WHY: Finding all paths in a network is naturally recursive.
// Each junction says: "Try every outgoing track, and let each
// sub-route figure itself out." This is recursion — breaking a
// big problem into smaller identical sub-problems.

// ============================================================
// EXAMPLE 2 — What Is Recursion?
// Story: A manager at TCS asks her team lead for a headcount.
//   The lead asks each sub-team lead, who asks their members.
//   Individual members (base case) report 1. Each lead sums
//   up the responses and reports back up the chain.
// ============================================================

// WHY: Recursion = a function that calls itself. It needs:
// 1. BASE CASE — when to stop (prevent infinite recursion)
// 2. RECURSIVE CASE — reduce the problem size and call self
//
// Without a base case, recursion runs forever (until stack overflow).
// Without reducing the problem, the base case is never reached.
// Both are REQUIRED for correct recursion.

// --- Factorial ---
// n! = n * (n-1)!, base: 0! = 1! = 1
// --- Simple Example: Factorial ---
// Mathematical definition: n! = n * (n-1) * (n-2) * ... * 1
// Recursive definition:   factorial(n) = n * factorial(n - 1)
// Base case:              factorial(0) = factorial(1) = 1

function factorial(n) {
  // Base case: stop when n is 0 or 1
  if (n <= 1) return 1;

  // Recursive case: multiply n by factorial of (n-1)
  return n * factorial(n - 1);
}

console.log("=== Factorial ===");
console.log("0! =", factorial(0)); // 1
console.log("1! =", factorial(1)); // 1
console.log("5! =", factorial(5)); // 120
console.log("10! =", factorial(10)); // 3628800

// Big-O: Time O(n), Space O(n) — n stack frames on the call stack

// Call stack trace for factorial(5):
// factorial(5) -> 5 * factorial(4)
//   factorial(4) -> 4 * factorial(3)
//     factorial(3) -> 3 * factorial(2)
//       factorial(2) -> 2 * factorial(1)
//         factorial(1) -> 1  (base case reached!)
//       returns 2 * 1 = 2
//     returns 3 * 2 = 6
//   returns 4 * 6 = 24
// returns 5 * 24 = 120
//
// Each call waits for the inner call to complete before it can multiply.
// This "waiting" is what consumes stack space.
console.log();

// ============================================================
// EXAMPLE 3 — How Recursion Uses the Call Stack
// Story: Think of recursion like a stack of thali plates at an
//   Udupi restaurant. Each call adds a plate. The base case is
//   the bottom plate. Results return as plates are removed.
// ============================================================

// WHY: Each recursive call creates a new stack frame. The call
// stack holds ~10K-15K frames in Node.js. Exceeding causes:
// RangeError: Maximum call stack size exceeded

function factorialWithTrace(n, depth = 0) {
  const indent = "  ".repeat(depth);
  console.log(`${indent}factorial(${n}) called`);
  if (n <= 1) { console.log(`${indent}-> base case! returning 1`); return 1; }
  const result = n * factorialWithTrace(n - 1, depth + 1);
  console.log(`${indent}-> returning ${n} * ${result / n} = ${result}`);
  return result;
}

console.log("=== Call Stack Trace ===");
factorialWithTrace(4);
console.log();

// ============================================================
// EXAMPLE 4 — Fibonacci (Classic Recursion Problem)
// Story: A Byju's math course teaches Fibonacci: 0, 1, 1, 2,
//   3, 5, 8... Naive recursion is elegant but exponentially slow.
// ============================================================

// WHY: Fibonacci demonstrates both recursive elegance AND the
// danger of naive recursion — the same sub-problems are solved
// repeatedly, leading to O(2^n) time.

// --- Naive Fibonacci: O(2^n) time! ---
function fibNaive(n) {
  if (n <= 0) return 0; // fib(0) = 0
  if (n === 1) return 1; // fib(1) = 1
  return fibNaive(n - 1) + fibNaive(n - 2); // fib(n) = fib(n-1) + fib(n-2)
}

console.log("=== Fibonacci (Naive) ===");
console.log("Fibonacci sequence: 0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55...");
console.log("fib(0) =", fibNaive(0));   // 0
console.log("fib(1) =", fibNaive(1));   // 1
console.log("fib(10) =", fibNaive(10)); // 55
// DO NOT try fibNaive(50) — it will take MINUTES!

// --- Recursion Tree for fib(5) (ASCII Art) ---
//                         fib(5)
//                        /      \
//                   fib(4)       fib(3)
//                  /     \       /    \
//             fib(3)   fib(2) fib(2) fib(1)
//            /    \    /   \   /   \
//       fib(2) fib(1) f(1) f(0) f(1) f(0)
//       /   \
//    fib(1) fib(0)
//
// fib(3) computed TWICE, fib(2) THREE times!
// Big-O: Time O(2^n), Space O(n) depth

// --- Counting calls to prove exponential growth ---
let fibCallCount = 0;
function fibCounted(n) {
  fibCallCount++;
  if (n <= 0) return 0;
  if (n === 1) return 1;
  return fibCounted(n - 1) + fibCounted(n - 2);
}

fibCallCount = 0; fibCounted(10);
console.log(`fib(10): ${fibCallCount} calls`);    // 177
fibCallCount = 0; fibCounted(20);
console.log(`fib(20): ${fibCallCount} calls`);    // 21891
fibCallCount = 0; fibCounted(30);
console.log(`fib(30): ${fibCallCount} calls`);    // 2692537
console.log("Calls roughly DOUBLE with each +10 in n");
console.log();

// ============================================================
// EXAMPLE 5 — Memoization: Caching Recursive Results
// Story: Zerodha's option pricing computes the same sub-calcs
//   repeatedly. Memoizing rescues fib from O(2^n) to O(n).
// ============================================================

// WHY: Memoization stores results of previous calls and returns
// cached results on repeat inputs. Transforms exponential -> polynomial.

function fibMemo(n, memo = {}) {
  if (n in memo) return memo[n]; // cache hit!
  if (n <= 0) return 0;
  if (n === 1) return 1;
  memo[n] = fibMemo(n - 1, memo) + fibMemo(n - 2, memo);
  return memo[n];
}

// Big-O for memoized fibonacci:
// Time:  O(n) — each fib(k) computed only once, cached for reuse
// Space: O(n) — memo object + call stack

console.log("=== Fibonacci (Memoized) — O(n) ===");
console.log("fib(10) =", fibMemo(10));  // 55
console.log("fib(50) =", fibMemo(50));  // 12586269025 — instant!
console.log("fib(80) =", fibMemo(80));  // 23416728348467684 — still instant!
console.log();

// --- Iterative Fibonacci: O(n) time, O(1) space ---
// WHY: When we don't need the full memo table, iteration is even
// better. Just track the previous two values and compute forward.
function fibIterative(n) {
  if (n <= 0) return 0;
  if (n === 1) return 1;
  let a = 0, b = 1;
  for (let i = 2; i <= n; i++) { [a, b] = [b, a + b]; }
  return b;
}
console.log("fib(50) iterative =", fibIterative(50));
console.log();

// ============================================================
// EXAMPLE 6 — Recursion vs Iteration
// Story: A debate at a Wipro tech talk: "Can every recursive
//   solution be rewritten iteratively?" YES! But recursive
//   solutions are often cleaner for tree/graph problems. The
//   trade-off is readability vs. stack space.
// ============================================================

// WHY: Any recursion can be converted to iteration using an
// explicit stack. Recursion is essentially syntactic sugar for
// stack-based iteration. Choose based on clarity and constraints.

// --- Sum of array elements: recursive vs iterative ---

// Recursive: O(n) time, O(n) space (n stack frames)
function sumRecursive(arr, i = 0) {
  if (i >= arr.length) return 0; // base case: past the end
  return arr[i] + sumRecursive(arr, i + 1); // add current + rest
}

// Iterative: O(n) time, O(1) space — no stack overhead
function sumIterative(arr) {
  let total = 0;
  for (const num of arr) total += num;
  return total;
}

console.log("=== Recursion vs Iteration: Sum ===");
console.log("Recursive:", sumRecursive([10, 20, 30, 40, 50])); // 150
console.log("Iterative:", sumIterative([10, 20, 30, 40, 50])); // 150
console.log();

// ============================================================
// EXAMPLE 7 — Stack Overflow
// Story: A junior developer at Freshworks writes a recursive
//   function without a base case. Node.js crashes with:
//   "RangeError: Maximum call stack size exceeded"
//   The default V8 stack holds ~10K-15K frames.
// ============================================================

// WHY: Understanding stack overflow helps you decide when to use
// recursion vs iteration. Very deep recursion (n > 10,000) should
// use iteration with an explicit stack instead.

function causeStackOverflow(n) {
  // NO base case — infinite recursion!
  // return causeStackOverflow(n + 1);
  // Uncomment above to see: RangeError: Maximum call stack size exceeded
}

// Safe recursive depth test — catches the error to report max depth
function testMaxDepth(n = 0) {
  try { return testMaxDepth(n + 1); }
  catch (e) { return n; } // this is how deep we got before overflow
}

console.log("=== Stack Overflow ===");
console.log("Max recursion depth on this system:", testMaxDepth());
console.log();

// ============================================================
// EXAMPLE 7B — Tail Recursion
// Story: A CS professor at IIT Bombay explains tail call
//   optimization: if the recursive call is the LAST thing a
//   function does, the compiler can reuse the stack frame.
//   JS V8 does NOT optimize this, but it is good to know.
// ============================================================

// WHY: In tail recursion, the recursive call is the last operation.
// No computation happens AFTER the call returns. Some languages
// (Scheme, Erlang) optimize this to O(1) space.

// Regular recursion: multiplication happens AFTER the recursive call returns
function factorialRegular(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1); // must wait for result, then multiply
}

// Tail recursion: recursive call IS the last operation, result passed as accumulator
function factorialTail(n, accumulator = 1) {
  if (n <= 1) return accumulator;
  return factorialTail(n - 1, n * accumulator); // tail position!
}

console.log("=== Tail Recursion ===");
console.log("Regular factorial(5):", factorialRegular(5)); // 120
console.log("Tail factorial(5):", factorialTail(5));       // 120

// Trace of tail recursion — no unwinding needed:
// factorialTail(5, 1) -> factorialTail(4, 5)
// factorialTail(4, 5) -> factorialTail(3, 20)
// factorialTail(3, 20) -> factorialTail(2, 60)
// factorialTail(2, 60) -> factorialTail(1, 120)
// returns 120 directly — each call could reuse the same stack frame
console.log();

// ============================================================
// PROBLEM 1 — Power Function: x^n in O(log n)
// Story: Razorpay calculates (1 + rate)^years for compound
//   interest. Using x^n = (x^(n/2))^2 halves the problem.
// ============================================================

// WHY: "Exponentiation by squaring" — halves the problem at each step.
// Time: O(log n), Space: O(log n) stack frames.
//
// Key insight:
//   If n is even: x^n = (x^(n/2))^2      — ONE recursive call
//   If n is odd:  x^n = x * x^(n-1)      — reduces to even case
//   Base case:    x^0 = 1

function power(x, n) {
  if (n === 0) return 1;             // base case
  if (n < 0) return 1 / power(x, -n); // handle negative exponents

  if (n % 2 === 0) {
    const half = power(x, n / 2);   // only ONE recursive call
    return half * half;              // square the result
  }
  return x * power(x, n - 1);       // reduce odd to even
}

console.log("=== Problem 1: Power Function O(log n) ===");
console.log("2^10 =", power(2, 10));  // 1024
console.log("3^5  =", power(3, 5));   // 243
console.log("2^-3 =", power(2, -3));  // 0.125

// Trace: power(2,10) -> half=power(2,5) -> 2*power(2,4)
//   -> half=power(2,2) -> half=power(2,1) -> 2*power(2,0)=2
//   -> 2*2=4 -> 4*4=16 -> 2*16=32 -> 32*32=1024
console.log();

// ============================================================
// PROBLEM 2 — Flatten Nested Array
// Story: Myntra receives nested category arrays from vendors.
//   Frontend needs a flat array for the filter sidebar.
// ============================================================

// WHY: Recursion handles arbitrary nesting depth naturally.
// Time: O(n) total elements, Space: O(d) max depth.
function flatten(arr) {
  const result = [];
  for (const item of arr) {
    if (Array.isArray(item)) result.push(...flatten(item));
    else result.push(item);
  }
  return result;
}

console.log("=== Problem 2: Flatten Nested Array ===");
console.log(flatten([1, [2, [3, 4]], 5]));
// [1, 2, 3, 4, 5]
console.log(flatten(["Clothing", ["Shirts", ["Formal", "Casual"]], "Shoes"]));
// ["Clothing", "Shirts", "Formal", "Casual", "Shoes"]
console.log(flatten([1, [2, [3, [4, [5]]]]]));
// [1, 2, 3, 4, 5] — works with arbitrary nesting depth

// Note: JavaScript has Array.prototype.flat(Infinity) built-in.
// But understanding the recursion behind it is the educational point!
console.log();

// ============================================================
// PROBLEM 3 — Count Nested Object Keys
// Story: Paytm's config system stores deeply nested JSON.
//   Admin tool counts all keys for a complexity score.
// ============================================================

// WHY: Object traversal is inherently recursive. Same pattern
// as DOM traversal, file system walking, AST parsing.
function countKeys(obj) {
  let count = 0;
  for (const key in obj) {
    count++;
    if (typeof obj[key] === "object" && obj[key] !== null && !Array.isArray(obj[key]))
      count += countKeys(obj[key]);
  }
  return count;
}

console.log("=== Problem 3: Count Nested Object Keys ===");
const config = {
  app: {
    name: "Paytm",
    version: "10.5",
    features: {
      upi: { enabled: true, limit: 100000 },
      wallet: { enabled: true },
    },
  },
  server: {
    host: "api.paytm.com",
    port: 443,
  },
};
console.log("Total keys:", countKeys(config));
// app(1) + name(1) + version(1) + features(1) + upi(1) + enabled(1)
// + limit(1) + wallet(1) + enabled(1) + server(1) + host(1) + port(1) = 12
console.log();

// ============================================================
// PROBLEM 4 — Tower of Hanoi
// Story: Ancient puzzle at Nehru Science Centre, Mumbai. Move
//   N disks from peg A to C using B. The recursive solution
//   is beautifully simple despite O(2^n) moves.
// ============================================================

// WHY: Classic recursion. Three steps:
// 1. Move n-1 disks from source to auxiliary
// 2. Move the largest disk from source to destination
// 3. Move n-1 disks from auxiliary to destination
function towerOfHanoi(n, from, to, aux, moves = []) {
  if (n === 0) return moves;
  towerOfHanoi(n - 1, from, aux, to, moves);
  moves.push(`Move disk ${n}: ${from} -> ${to}`);
  towerOfHanoi(n - 1, aux, to, from, moves);
  return moves;
}

console.log("=== Problem 4: Tower of Hanoi ===");
towerOfHanoi(3, "A", "C", "B").forEach(m => console.log("  " + m));
console.log(`Total moves for 3 disks: ${Math.pow(2, 3) - 1}`); // 7
console.log(`Moves for 64 disks: 2^64 - 1 = ~1.8 * 10^19`);
// Big-O: Time O(2^n), Space O(n) stack depth
console.log();

// ============================================================
// PROBLEM 5 — Generate All Subsets (Power Set)
// Story: Amazon India's bundle system generates all possible
//   product combinations. For 3 items: 2^3 = 8 subsets.
// ============================================================

// WHY: At each element, choose include or exclude. Binary choice
// at each step = recursion tree with 2^n leaves.
// Time: O(2^n), Space: O(n) depth + O(2^n * n) output.
function generateSubsets(arr) {
  const result = [];
  function backtrack(index, current) {
    if (index === arr.length) { result.push([...current]); return; }
    backtrack(index + 1, current);             // exclude
    current.push(arr[index]);
    backtrack(index + 1, current);             // include
    current.pop();                             // backtrack
  }
  backtrack(0, []);
  return result;
}

console.log("=== Problem 5: Power Set (All Subsets) ===");
const items = ["Phone", "Case", "Charger"];
const subsets = generateSubsets(items);
console.log(`${items.length} items -> ${subsets.length} subsets (2^${items.length} = ${Math.pow(2, items.length)})`);
subsets.forEach(s => console.log("  {" + s.join(", ") + "}"));

// Recursion tree for [A, B, C]:
//                     []
//                   /     \
//              []           [A]
//             / \          /   \
//          []   [B]     [A]   [A,B]
//         / \   / \    / \    /   \
//       [] [C] [B] [B,C] [A] [A,C] [A,B] [A,B,C]
console.log();

// ============================================================
// EXAMPLE 8 — When to Use Recursion vs Iteration
// Story: At a system design review at Infosys, the architect
//   decides: "Use recursion for tree traversal (natural fit)
//   but iteration for the loop that processes each node's data
//   (avoids stack overhead)." Knowing when to use each is a
//   mark of engineering maturity.
// ============================================================

// WHY: Choose the right tool for the job.

console.log("=== When to Use Recursion ===");
console.log("USE recursion for:");
console.log("  - Tree/graph traversal (DFS, inorder, preorder, postorder)");
console.log("  - Divide-and-conquer (merge sort, quick sort)");
console.log("  - Backtracking (N-queens, Sudoku solver, permutations)");
console.log("  - Nested data structures (JSON, DOM, file systems)");
console.log("  - Mathematical recurrences (factorial, fibonacci, combinations)");
console.log();
console.log("AVOID recursion for:");
console.log("  - Simple loops (for/while is clearer and uses O(1) space)");
console.log("  - Very deep problems (n > 10,000 — use iteration + explicit stack)");
console.log("  - When performance is critical and stack overhead matters");
console.log("  - Tail-recursive functions in JS (V8 does not optimize them)");
console.log();

// ============================================================
// BONUS — IRCTC All Routes (Recursive Backtracking)
// ============================================================
function findAllRoutes(graph, start, end, path = [], all = []) {
  path.push(start);
  if (start === end) all.push([...path]);
  else for (const nb of (graph[start] || []))
    if (!path.includes(nb)) findAllRoutes(graph, nb, end, path, all);
  path.pop(); // backtrack
  return all;
}

console.log("=== IRCTC: All Routes Delhi -> Chennai ===");
const rail = {
  Delhi: ["Agra", "Jaipur", "Lucknow"], Agra: ["Bhopal", "Jhansi"],
  Jaipur: ["Ahmedabad"], Lucknow: ["Varanasi"], Bhopal: ["Nagpur"],
  Jhansi: ["Nagpur"], Ahmedabad: ["Mumbai"], Varanasi: ["Nagpur"],
  Nagpur: ["Hyderabad"], Mumbai: ["Chennai"], Hyderabad: ["Chennai"], Chennai: []
};
findAllRoutes(rail, "Delhi", "Chennai").forEach((r, i) =>
  console.log(`  Route ${i + 1}: ${r.join(" -> ")}`)
);
console.log();

// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. Recursion = function calling itself. Needs BASE CASE + RECURSIVE CASE.
// 2. Each call pushes a stack frame. Too many -> stack overflow.
// 3. Naive recursion can be O(2^n). Memoization caches results -> O(n).
// 4. Power function: x^n in O(log n) by squaring halves.
// 5. Flatten, count keys = recursive tree walking for nested data.
// 6. Tower of Hanoi: O(2^n) moves, no faster solution exists.
// 7. Power Set: 2^n subsets via include/exclude backtracking.
// 8. Use recursion for trees, graphs, backtracking. Use iteration
//    for simple loops and very deep problems.

console.log("=== FILE 08 COMPLETE ===");
