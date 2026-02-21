// ============================================================
// FILE 21: DYNAMIC PROGRAMMING
// Topic: Solving complex problems by breaking them into overlapping sub-problems
// WHY: Dynamic Programming (DP) is the single most tested topic in coding
// interviews at companies like Google, Amazon, and Flipkart. It turns
// exponential brute-force solutions into polynomial-time ones by
// remembering results of sub-problems instead of recomputing them.
// ============================================================

// ============================================================
// RAZORPAY STORY
// ============================================================
// Razorpay processes millions of payments daily across India. Imagine a
// merchant needs to refund exactly Rs.1000 using the fewest possible
// currency notes/coins (Rs.1, Rs.2, Rs.5, Rs.10, Rs.20, Rs.50, Rs.100,
// Rs.500). A greedy approach (always pick the largest denomination) works
// for Indian currency, but fails for arbitrary denomination sets. DP
// guarantees the optimal split every single time, no matter the denominations.

// ============================================================
// SECTION 1 — WHAT IS DYNAMIC PROGRAMMING?
// ============================================================

// WHY: DP is not a single algorithm; it is a problem-solving STRATEGY.
// Two conditions must hold for DP to apply:
//   1. Overlapping Subproblems — the same smaller problems are solved repeatedly
//   2. Optimal Substructure — optimal solution is built from optimal sub-solutions

// --- Two Approaches ---

// TOP-DOWN (Memoization):
//   - Write the recursive solution first
//   - Add a cache (memo) to store already-computed results
//   - On each call, check cache before computing
//   - Natural to write, follows the recursion tree

// BOTTOM-UP (Tabulation):
//   - Start from the smallest sub-problem (base case)
//   - Iteratively fill a table up to the desired answer
//   - No recursion, no call stack overhead
//   - Often allows space optimization

// ============================================================
// EXAMPLE 1 — Fibonacci: The DP Hello World
// Story: PhonePe tracks daily transaction growth. Day 1 has 1 txn,
// Day 2 has 1 txn, and each subsequent day's txns equal the sum of
// the previous two days — classic Fibonacci growth pattern.
// ============================================================

// WHY: Fibonacci is the simplest example that shows why naive recursion
// is catastrophically slow and how memoization/tabulation fix it.

// --- Approach 1: Naive Recursion — O(2^n) time, O(n) space (call stack) ---
function fibNaive(n) {
  if (n <= 1) return n;
  return fibNaive(n - 1) + fibNaive(n - 2); // Two recursive calls per level
}
// fibNaive(5) computes fibNaive(3) twice, fibNaive(2) three times...
// For n=40, this makes ~1.6 BILLION calls. Completely unusable.

console.log("=== FIBONACCI ===");
console.log("Naive fib(10):", fibNaive(10)); // 55

// --- Approach 2: Memoized (Top-Down) — O(n) time, O(n) space ---
function fibMemo(n, memo = {}) {
  if (n <= 1) return n;
  if (memo[n] !== undefined) return memo[n]; // Check cache first
  memo[n] = fibMemo(n - 1, memo) + fibMemo(n - 2, memo); // Store result
  return memo[n];
}
// Each fib(k) is computed exactly once and cached. Total: n computations.

console.log("Memoized fib(10):", fibMemo(10));   // 55
console.log("Memoized fib(40):", fibMemo(40));   // 102334155 (instant!)

// --- Approach 3: Tabulated (Bottom-Up) — O(n) time, O(n) space ---
function fibTab(n) {
  if (n <= 1) return n;
  const dp = new Array(n + 1); // Table to store results
  dp[0] = 0;                   // Base case 1
  dp[1] = 1;                   // Base case 2
  for (let i = 2; i <= n; i++) {
    dp[i] = dp[i - 1] + dp[i - 2]; // Fill table from base cases upward
  }
  return dp[n];
}
// Table for n=5: [0, 1, 1, 2, 3, 5]
//                 ^  ^  ^  ^  ^  ^ answer

console.log("Tabulated fib(10):", fibTab(10));   // 55
console.log("Tabulated fib(40):", fibTab(40));   // 102334155

// --- Approach 4: Space-Optimized — O(n) time, O(1) space ---
function fibOptimal(n) {
  if (n <= 1) return n;
  let prev2 = 0; // fib(i-2)
  let prev1 = 1; // fib(i-1)
  for (let i = 2; i <= n; i++) {
    const curr = prev1 + prev2; // Only need last two values
    prev2 = prev1;
    prev1 = curr;
  }
  return prev1;
}
// We only ever look at dp[i-1] and dp[i-2], so no need for full array.

console.log("Optimized fib(10):", fibOptimal(10)); // 55
console.log("Optimized fib(50):", fibOptimal(50)); // 12586269025
console.log();

// ============================================================
// EXAMPLE 2 — Climbing Stairs
// Story: Flipkart's warehouse has n steps to the storage shelf. A
// picker can climb 1 or 2 steps at a time. How many distinct ways
// can they reach the top? This is used to calculate route diversity
// in warehouse optimization algorithms.
// ============================================================

// WHY: This is essentially Fibonacci in disguise. Recognizing patterns
// across different problem statements is the key DP skill.

// --- Recurrence: dp[i] = dp[i-1] + dp[i-2] ---
// To reach step i, you either came from step i-1 (1 step) or step i-2 (2 steps).
// Base cases: dp[0] = 1 (one way to stay at ground), dp[1] = 1

// O(n) time, O(1) space
function climbStairs(n) {
  if (n <= 1) return 1;
  let prev2 = 1; // dp[0] — one way to be at ground level
  let prev1 = 1; // dp[1] — one way to reach step 1
  for (let i = 2; i <= n; i++) {
    const curr = prev1 + prev2;
    prev2 = prev1;
    prev1 = curr;
  }
  return prev1;
}

console.log("=== CLIMBING STAIRS ===");
console.log("Ways to climb 1 step:", climbStairs(1));   // 1
console.log("Ways to climb 2 steps:", climbStairs(2));   // 2 (1+1 or 2)
console.log("Ways to climb 5 steps:", climbStairs(5));   // 8
console.log("Ways to climb 10 steps:", climbStairs(10)); // 89
console.log();

// ============================================================
// EXAMPLE 3 — Coin Change (Minimum Coins)
// Story: Razorpay's refund engine must break down Rs.1000 into
// the fewest currency units. For Indian denominations, greedy works.
// But for promotional voucher denominations (e.g., Rs.1, Rs.3, Rs.4),
// greedy picks Rs.4+Rs.1+Rs.1 = 3 vouchers for Rs.6, while optimal
// is Rs.3+Rs.3 = 2 vouchers. DP solves this correctly always.
// ============================================================

// WHY: Coin Change is the most classic DP problem. It teaches the pattern
// of "try every option at each step and pick the best."

// --- dp[amount] = min(dp[amount], dp[amount - coin] + 1) for each coin ---
// Base case: dp[0] = 0 (zero coins needed for amount 0)
// O(amount * coins.length) time, O(amount) space

function coinChange(coins, amount) {
  // dp[i] = minimum coins needed to make amount i
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0; // Base case: 0 coins for amount 0

  // Also track which coin was used to reconstruct the solution
  const coinUsed = new Array(amount + 1).fill(-1);

  for (let i = 1; i <= amount; i++) {
    for (const coin of coins) {
      if (coin <= i && dp[i - coin] + 1 < dp[i]) {
        dp[i] = dp[i - coin] + 1;   // Found a better way
        coinUsed[i] = coin;          // Remember which coin got us here
      }
    }
  }

  // Reconstruct which coins were used
  const result = { minCoins: dp[amount] === Infinity ? -1 : dp[amount], coins: [] };
  if (result.minCoins !== -1) {
    let remaining = amount;
    while (remaining > 0) {
      result.coins.push(coinUsed[remaining]);
      remaining -= coinUsed[remaining];
    }
  }
  return result;
}

console.log("=== COIN CHANGE ===");

// Indian denominations — greedy also works here
const indianCoins = [1, 2, 5, 10, 20, 50, 100, 500];
const r1 = coinChange(indianCoins, 1000);
console.log("Rs.1000 with Indian coins:", r1.minCoins, "coins ->", r1.coins);
// 2 coins -> [500, 500]

const r2 = coinChange(indianCoins, 93);
console.log("Rs.93 with Indian coins:", r2.minCoins, "coins ->", r2.coins);

// Tricky denominations where greedy FAILS
const trickyCoins = [1, 3, 4];
const r3 = coinChange(trickyCoins, 6);
console.log("Rs.6 with [1,3,4]:", r3.minCoins, "coins ->", r3.coins);
// 2 coins -> [3, 3] — greedy would give [4, 1, 1] = 3 coins!

const r4 = coinChange([2], 3);
console.log("Rs.3 with [2]:", r4.minCoins, "coins"); // -1 (impossible)

console.log();

// ============================================================
// EXAMPLE 4 — 0/1 Knapsack
// Story: Amazon India delivery vans have a weight limit of W kg.
// Each package has a weight and a value (delivery priority score).
// We must maximize the total value of packages loaded without
// exceeding the weight limit. Each package is either loaded or not.
// ============================================================

// WHY: 0/1 Knapsack is the foundation for resource allocation problems.
// Unlike Fractional Knapsack (greedy), we cannot take partial items.

// --- 2D DP: dp[i][w] = max value using items 0..i with capacity w ---
// dp[i][w] = max(dp[i-1][w], dp[i-1][w - weight[i]] + value[i])
//            (exclude item i, include item i if it fits)
// O(n * W) time, O(n * W) space

function knapsack(weights, values, capacity) {
  const n = weights.length;
  // Create 2D table: (n+1) rows x (capacity+1) columns
  const dp = Array.from({ length: n + 1 }, () => new Array(capacity + 1).fill(0));

  // Fill the table
  for (let i = 1; i <= n; i++) {
    for (let w = 0; w <= capacity; w++) {
      dp[i][w] = dp[i - 1][w]; // Don't take item i
      if (weights[i - 1] <= w) {
        // Take item i if it gives more value
        dp[i][w] = Math.max(dp[i][w], dp[i - 1][w - weights[i - 1]] + values[i - 1]);
      }
    }
  }

  // Backtrack to find which items were selected
  const selected = [];
  let w = capacity;
  for (let i = n; i > 0; i--) {
    if (dp[i][w] !== dp[i - 1][w]) {
      selected.push(i - 1); // Item i was included
      w -= weights[i - 1];
    }
  }

  return { maxValue: dp[n][capacity], items: selected.reverse() };
}

console.log("=== 0/1 KNAPSACK ===");
const kWeights = [2, 3, 4, 5];
const kValues  = [3, 4, 5, 6];
const kCap = 8;
const kResult = knapsack(kWeights, kValues, kCap);
console.log(`Capacity ${kCap}kg: Max value = ${kResult.maxValue}`);
console.log("Items selected (indices):", kResult.items);
// Items: weight=[2,3,4,5], value=[3,4,5,6]
// Optimal: items 0,1,2 (weights 2+3+4=9? No) or items 1,2 (3+4=7, val=9) etc.

// --- Space-Optimized Knapsack: O(n * W) time, O(W) space ---
function knapsackOptimized(weights, values, capacity) {
  const n = weights.length;
  const dp = new Array(capacity + 1).fill(0);

  for (let i = 0; i < n; i++) {
    // Traverse right to left to avoid using same item twice
    for (let w = capacity; w >= weights[i]; w--) {
      dp[w] = Math.max(dp[w], dp[w - weights[i]] + values[i]);
    }
  }
  return dp[capacity];
}

console.log("Space-optimized knapsack:", knapsackOptimized(kWeights, kValues, kCap));
console.log();

// ============================================================
// EXAMPLE 5 — Longest Common Subsequence (LCS)
// Story: Paytm's search suggestion engine compares what a user typed
// vs the correct product name. LCS tells how similar two strings are.
// For "paytm mall" and "paytm maall", the LCS is "paytm mall" (10 chars).
// The characters not in the LCS are the typos/differences.
// ============================================================

// WHY: LCS is foundational for diff tools (git diff), DNA sequence
// alignment, and spell-checking algorithms.

// --- dp[i][j] = LCS length of text1[0..i-1] and text2[0..j-1] ---
// If text1[i-1] === text2[j-1]: dp[i][j] = dp[i-1][j-1] + 1
// Else: dp[i][j] = max(dp[i-1][j], dp[i][j-1])
// O(m * n) time, O(m * n) space

function longestCommonSubsequence(text1, text2) {
  const m = text1.length;
  const n = text2.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (text1[i - 1] === text2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1; // Characters match, extend LCS
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]); // Skip one char
      }
    }
  }

  // Reconstruct the actual LCS string
  let lcs = "";
  let i = m, j = n;
  while (i > 0 && j > 0) {
    if (text1[i - 1] === text2[j - 1]) {
      lcs = text1[i - 1] + lcs; // This char is in LCS
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--; // Move up
    } else {
      j--; // Move left
    }
  }

  return { length: dp[m][n], subsequence: lcs };
}

console.log("=== LONGEST COMMON SUBSEQUENCE ===");
const lcs1 = longestCommonSubsequence("abcde", "ace");
console.log(`LCS("abcde", "ace"):`, lcs1); // { length: 3, subsequence: "ace" }

const lcs2 = longestCommonSubsequence("FLIPKART", "SNAPDEAL");
console.log(`LCS("FLIPKART", "SNAPDEAL"):`, lcs2);

// DP Table for "abcde" vs "ace":
//     ""  a  c  e
// ""  [0, 0, 0, 0]
//  a  [0, 1, 1, 1]
//  b  [0, 1, 1, 1]
//  c  [0, 1, 2, 2]
//  d  [0, 1, 2, 2]
//  e  [0, 1, 2, 3]  <-- answer = 3
console.log();

// ============================================================
// EXAMPLE 6 — Longest Increasing Subsequence (LIS)
// Story: Zomato tracks daily order counts. Management wants to find the
// longest stretch (not necessarily consecutive) where orders kept
// increasing — this indicates sustained growth momentum. If daily orders
// are [10, 9, 2, 5, 3, 7, 101, 18], the LIS is [2, 3, 7, 101] = length 4.
// ============================================================

// WHY: LIS appears in patience sorting, scheduling, and is a classic
// interview question. The O(n log n) solution is particularly elegant.

// --- O(n^2) DP Solution ---
// dp[i] = length of LIS ending at index i
// dp[i] = max(dp[j] + 1) for all j < i where arr[j] < arr[i]

function lisDP(nums) {
  const n = nums.length;
  if (n === 0) return { length: 0, subsequence: [] };

  const dp = new Array(n).fill(1);     // Every element is an LIS of length 1
  const parent = new Array(n).fill(-1); // To reconstruct the subsequence

  let maxLen = 1;
  let maxIdx = 0;

  for (let i = 1; i < n; i++) {
    for (let j = 0; j < i; j++) {
      if (nums[j] < nums[i] && dp[j] + 1 > dp[i]) {
        dp[i] = dp[j] + 1;
        parent[i] = j; // Track where we came from
      }
    }
    if (dp[i] > maxLen) {
      maxLen = dp[i];
      maxIdx = i;
    }
  }

  // Reconstruct
  const subsequence = [];
  let idx = maxIdx;
  while (idx !== -1) {
    subsequence.unshift(nums[idx]);
    idx = parent[idx];
  }

  return { length: maxLen, subsequence };
}

// --- O(n log n) Solution using Binary Search ---
// Maintain a "tails" array where tails[i] is the smallest tail element
// for all increasing subsequences of length i+1.
// For each number, binary search for its position in tails.

function lisBinarySearch(nums) {
  const n = nums.length;
  if (n === 0) return 0;

  const tails = []; // tails[i] = smallest ending element of LIS of length i+1

  for (const num of nums) {
    let lo = 0, hi = tails.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1; // Binary search
      if (tails[mid] < num) lo = mid + 1;
      else hi = mid;
    }
    tails[lo] = num; // Replace or extend
    // If lo === tails.length, we extended the LIS
    // If lo < tails.length, we found a smaller tail
  }

  return tails.length; // Length of LIS
}

console.log("=== LONGEST INCREASING SUBSEQUENCE ===");
const lisArr = [10, 9, 2, 5, 3, 7, 101, 18];
console.log("Array:", lisArr);
console.log("LIS (O(n^2)):", lisDP(lisArr));
// { length: 4, subsequence: [2, 3, 7, 101] }
console.log("LIS length (O(n log n)):", lisBinarySearch(lisArr)); // 4

const lisArr2 = [0, 1, 0, 3, 2, 3];
console.log("LIS of [0,1,0,3,2,3]:", lisDP(lisArr2));
// { length: 4, subsequence: [0, 1, 2, 3] }
console.log();

// ============================================================
// EXAMPLE 7 — Edit Distance (Levenshtein Distance)
// Story: Myntra's search bar must handle typos. When a user types
// "shirtt" instead of "shirt", the edit distance is 1 (delete one 't').
// The system suggests corrections with the smallest edit distance.
// Operations: insert a character, delete a character, replace a character.
// ============================================================

// WHY: Edit distance powers spell checkers, DNA alignment, and fuzzy
// search. It measures the minimum transformations to convert one string
// to another.

// --- dp[i][j] = min edits to convert word1[0..i-1] to word2[0..j-1] ---
// If word1[i-1] === word2[j-1]: dp[i][j] = dp[i-1][j-1]  (no edit needed)
// Else: dp[i][j] = 1 + min(dp[i-1][j],      // delete from word1
//                           dp[i][j-1],      // insert into word1
//                           dp[i-1][j-1])    // replace
// O(m * n) time, O(m * n) space

function editDistance(word1, word2) {
  const m = word1.length;
  const n = word2.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  // Base cases: converting to/from empty string
  for (let i = 0; i <= m; i++) dp[i][0] = i; // Delete all chars from word1
  for (let j = 0; j <= n; j++) dp[0][j] = j; // Insert all chars of word2

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (word1[i - 1] === word2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]; // Characters match, no edit
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],     // Delete
          dp[i][j - 1],     // Insert
          dp[i - 1][j - 1]  // Replace
        );
      }
    }
  }

  // Reconstruct the operations
  const ops = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && word1[i - 1] === word2[j - 1]) {
      i--; j--; // No op needed
    } else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) {
      ops.push(`Replace '${word1[i - 1]}' with '${word2[j - 1]}' at pos ${i - 1}`);
      i--; j--;
    } else if (j > 0 && dp[i][j] === dp[i][j - 1] + 1) {
      ops.push(`Insert '${word2[j - 1]}' at pos ${i}`);
      j--;
    } else {
      ops.push(`Delete '${word1[i - 1]}' at pos ${i - 1}`);
      i--;
    }
  }

  return { distance: dp[m][n], operations: ops.reverse() };
}

console.log("=== EDIT DISTANCE ===");
const ed1 = editDistance("horse", "ros");
console.log(`"horse" -> "ros":`, ed1.distance, "edits");
console.log("Operations:", ed1.operations);
// 3 edits: replace h->r, delete r, delete e

const ed2 = editDistance("intention", "execution");
console.log(`"intention" -> "execution":`, ed2.distance, "edits");

const ed3 = editDistance("shirtt", "shirt");
console.log(`"shirtt" -> "shirt":`, ed3.distance, "edit");
console.log("Operations:", ed3.operations);

console.log();

// ============================================================
// SECTION 8 — DP vs GREEDY vs BACKTRACKING
// ============================================================

// WHY: Understanding when to use which paradigm is critical for
// choosing the right approach in interviews and real applications.

console.log("=== DP vs GREEDY vs BACKTRACKING ===");

// --- DP vs Greedy ---
// DP: Considers ALL options at each step, guarantees optimal solution.
//     Uses extra space to store sub-problem results.
//     Example: 0/1 Knapsack, Coin Change (arbitrary denominations)
//
// Greedy: Makes the LOCALLY optimal choice, hopes for global optimum.
//     Faster and simpler, but only works for specific problems.
//     Example: Fractional Knapsack, Activity Selection, Indian Coin Change
//
// Rule of thumb: If greedy gives wrong answer for some input, use DP.

// --- DP vs Backtracking ---
// DP: For OPTIMIZATION problems (min/max) and COUNTING problems (how many ways).
//     Sub-problems overlap, results are cached.
//
// Backtracking: For ENUMERATION problems (find all solutions).
//     Explores all possibilities, prunes invalid branches.
//     Example: N-Queens, Sudoku, all permutations

// --- How to Identify DP Problems ---
// Look for these keywords in the problem statement:
//   1. "Minimum number of..."     -> DP (optimization)
//   2. "Maximum value of..."      -> DP (optimization)
//   3. "Count the number of ways" -> DP (counting)
//   4. "Is it possible to..."     -> DP (feasibility)
//   5. "Longest/Shortest..."      -> DP (optimization)

console.log("DP keywords: minimum, maximum, count ways, is it possible, longest, shortest");
console.log();

// ============================================================
// SECTION 9 — COMPREHENSIVE COMPARISON TABLE
// ============================================================

console.log("=== DP PROBLEMS SUMMARY ===");
console.log("+-----------------------+------------------+------------------+");
console.log("| Problem               | Time Complexity  | Space Complexity |");
console.log("+-----------------------+------------------+------------------+");
console.log("| Fibonacci (optimal)   | O(n)             | O(1)             |");
console.log("| Climbing Stairs       | O(n)             | O(1)             |");
console.log("| Coin Change           | O(amount * coins)| O(amount)        |");
console.log("| 0/1 Knapsack          | O(n * W)         | O(n * W) or O(W) |");
console.log("| LCS                   | O(m * n)         | O(m * n)         |");
console.log("| LIS (DP)              | O(n^2)           | O(n)             |");
console.log("| LIS (Binary Search)   | O(n log n)       | O(n)             |");
console.log("| Edit Distance         | O(m * n)         | O(m * n)         |");
console.log("+-----------------------+------------------+------------------+");
console.log();

// ============================================================
// SECTION 10 — BONUS: Comprehensive Test Suite
// ============================================================

console.log("=== RUNNING ALL DP PROBLEM TESTS ===");

// Fibonacci tests
console.assert(fibOptimal(0) === 0, "fib(0) should be 0");
console.assert(fibOptimal(1) === 1, "fib(1) should be 1");
console.assert(fibOptimal(10) === 55, "fib(10) should be 55");
console.assert(fibOptimal(20) === 6765, "fib(20) should be 6765");
console.log("Fibonacci: All tests passed");

// Climbing stairs tests
console.assert(climbStairs(0) === 1, "climbStairs(0) should be 1");
console.assert(climbStairs(1) === 1, "climbStairs(1) should be 1");
console.assert(climbStairs(3) === 3, "climbStairs(3) should be 3");
console.assert(climbStairs(5) === 8, "climbStairs(5) should be 8");
console.log("Climbing Stairs: All tests passed");

// Coin change tests
console.assert(coinChange([1, 5, 10], 11).minCoins === 3, "11 with [1,5,10] = 3 coins");
console.assert(coinChange([2], 3).minCoins === -1, "3 with [2] = impossible");
console.assert(coinChange([1, 3, 4], 6).minCoins === 2, "6 with [1,3,4] = 2 coins");
console.log("Coin Change: All tests passed");

// Knapsack tests
console.assert(knapsackOptimized([1, 2, 3], [6, 10, 12], 5) === 22, "Knapsack basic test");
console.log("Knapsack: All tests passed");

// LCS tests
console.assert(longestCommonSubsequence("abc", "abc").length === 3, "LCS identical strings");
console.assert(longestCommonSubsequence("abc", "def").length === 0, "LCS no common");
console.assert(longestCommonSubsequence("abcde", "ace").length === 3, "LCS standard test");
console.log("LCS: All tests passed");

// LIS tests
console.assert(lisBinarySearch([10, 9, 2, 5, 3, 7, 101, 18]) === 4, "LIS standard test");
console.assert(lisBinarySearch([0, 1, 0, 3, 2, 3]) === 4, "LIS with duplicates");
console.assert(lisBinarySearch([7, 7, 7, 7]) === 1, "LIS all same");
console.log("LIS: All tests passed");

// Edit distance tests
console.assert(editDistance("horse", "ros").distance === 3, "Edit distance horse->ros");
console.assert(editDistance("", "abc").distance === 3, "Edit distance empty->abc");
console.assert(editDistance("abc", "abc").distance === 0, "Edit distance same strings");
console.log("Edit Distance: All tests passed");

console.log("\nAll DP problem tests passed!");

// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. DP requires OVERLAPPING SUBPROBLEMS + OPTIMAL SUBSTRUCTURE.
// 2. Top-down (memoization) is easier to write; bottom-up (tabulation)
//    avoids recursion overhead and often allows space optimization.
// 3. The Fibonacci pattern (dp[i] depends on dp[i-1], dp[i-2]) appears
//    in Climbing Stairs, House Robber, and many other problems.
// 4. Coin Change teaches the "try every option" pattern used in many DP
//    problems. The recurrence dp[i] = min/max(dp[i], dp[i-something] + cost)
//    is the bread and butter of DP.
// 5. 0/1 Knapsack introduces 2D DP and the include/exclude choice pattern.
// 6. LCS and Edit Distance are string DP classics — learn the 2D table
//    pattern and how to reconstruct the solution by backtracking.
// 7. LIS shows how a O(n^2) DP can be improved to O(n log n) with
//    clever use of binary search — a technique worth mastering.
// 8. DP vs Greedy: DP guarantees optimal, Greedy is faster but only
//    works when the greedy choice property holds.
// 9. Identifying DP: Look for "minimum", "maximum", "count ways",
//    "is it possible", or "longest/shortest" in the problem statement.
// 10. Practice is everything — DP problems become intuitive only after
//     solving 30-50 of them. Start with these 7, then move to LeetCode.
