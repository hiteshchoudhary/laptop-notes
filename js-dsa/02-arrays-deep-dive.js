// ============================================================
// FILE 02: ARRAYS DEEP DIVE
// Topic: Mastering arrays — the foundational data structure in JavaScript
// WHY: Arrays are the backbone of every application. From Zomato's restaurant
//   listings to Flipkart's product catalog, understanding array internals and
//   algorithms means the difference between a 50ms response and a 5-second hang.
// ============================================================

// ============================================================
// EXAMPLE 1 — Zomato Restaurant Listings
// Story: When you open Zomato in Bangalore, it shows 500+ restaurants
//   sorted by distance, rating, or delivery time. Each is an array
//   operation. Sorting by rating? O(n log n). Finding the nearest? O(n).
//   Accessing the #1 rated? O(1) index lookup.
// ============================================================

// WHY: Arrays store elements in contiguous memory. Index access is O(1)
// because the address is base + index * elementSize.

// --- Array Internals: Contiguous Memory (in theory) ---
// In theory, arrays are contiguous blocks of memory.
// In V8 (Node.js engine), arrays are more nuanced:
// V8 uses different backing stores depending on the content.

// Dense array — no holes, stored as a flat C-style array internally
const denseArray = [10, 20, 30, 40, 50]; // PACKED in V8 — fastest access
console.log("Dense array:", denseArray);

// Sparse array — has holes, V8 falls back to a dictionary/hash map
const sparseArray = [1, , , , 5]; // Holes at index 1, 2, 3 — HOLEY in V8
console.log("Sparse array:", sparseArray);
console.log("Sparse[1]:", sparseArray[1]); // undefined (hole, NOT the value undefined)

// ============================================================
// EXAMPLE 2 — V8 Element Kinds
// Story: Zomato's engineering discovered mixing types in arrays caused
//   a 3x slowdown. V8 classifies arrays by "element kinds" and uses
//   the most efficient storage. Mixing types forces the slowest storage.
// ============================================================

// WHY: Keeping arrays homogeneous gives best V8 performance.

// --- V8 Element Kinds (fastest to slowest) ---

// PACKED_SMI — all small integers, no holes — FASTEST
const smiArray = [1, 2, 3, 4, 5];
// Stored as raw integers internally, no boxing overhead
console.log("PACKED_SMI:", smiArray);

// PACKED_DOUBLE — has at least one floating-point number
const doubleArray = [1, 2, 3.5, 4, 5];
// Still fast: stored as unboxed IEEE 754 doubles
console.log("PACKED_DOUBLE:", doubleArray);

// PACKED_ELEMENTS — mixed types (numbers + strings + objects)
const mixedArray = [1, "hello", { name: "Zomato" }, true];
// Slowest packed: each element is a boxed JS value, V8 must check types
console.log("PACKED_ELEMENTS:", mixedArray);

// HOLEY variants — any of the above with holes (missing indices)
const holeyArray = [1, 2, , 4, 5]; // HOLEY_SMI
// Slower: V8 must check prototype chain for missing indices
console.log("HOLEY_SMI:", holeyArray);

// KEY RULES:
// 1. Element kinds only DEGRADE, never upgrade back.
//    Once an array becomes HOLEY or PACKED_ELEMENTS, it stays that way.
// 2. Pre-allocate with fill() to avoid holes.

// GOOD: Creates PACKED_SMI — no holes
const goodArray = new Array(100).fill(0);
// BAD: Creates HOLEY_SMI — 100 holes! V8 marks it as holey forever.
const badArray = new Array(100);

console.log("Good (filled):", goodArray.slice(0, 5));
console.log("Bad (holey):", badArray.slice(0, 5));

// ============================================================
// EXAMPLE 3 — Array Operations and Their Big-O
// Story: Zomato processes millions of orders daily. Every order involves
//   array operations. Knowing Big-O of each prevents performance bugs.
// ============================================================

// WHY: push() is O(1) but unshift() is O(n). This knowledge matters.

// --- Access by Index: O(1) ---
const restaurants = ["Biryani House", "Dosa Palace", "Chai Point", "Pizza Hub"];
console.log("\n--- Array Operations Big-O ---");
console.log("O(1) — Access:", restaurants[2]); // Chai Point

// --- Push/Pop (end): O(1) amortized ---
const cart = ["Butter Chicken", "Naan"];
cart.push("Raita"); // O(1) amortized
console.log("O(1) — Push:", cart);
console.log("O(1) — Pop:", cart.pop(), "| Cart:", cart);

// --- Shift/Unshift (start): O(n) — must shift ALL elements ---
const queue = ["Order1", "Order2", "Order3"];
queue.unshift("Priority"); // O(n) — shifts everything right
console.log("O(n) — Unshift:", queue);
console.log("O(n) — Shift:", queue.shift(), "| Queue:", queue);

// --- Splice: O(n) ---
const menu = ["Idli", "Dosa", "Vada", "Upma"];
menu.splice(2, 1, "Medu Vada"); // O(n) — elements after index shift
console.log("O(n) — Splice:", menu);

// --- indexOf/includes: O(n), Slice: O(n) ---
console.log("O(n) — indexOf:", ["Biryani", "Pulao", "Fried Rice"].indexOf("Fried Rice"));
console.log("O(n) — Slice:", [10, 20, 30, 40, 50].slice(1, 4));

console.log(`
+-------------------+----------+----------------------------------+
| Operation         | Big-O    | Why                              |
+-------------------+----------+----------------------------------+
| Access arr[i]     | O(1)     | Direct memory offset             |
| Push/Pop (end)    | O(1)*    | Append/remove at end (*amort.)   |
| Shift/Unshift     | O(n)     | Must shift all elements          |
| Splice            | O(n)     | Shifting elements after point    |
| indexOf/includes  | O(n)     | Linear scan                      |
| Slice             | O(n)     | Copy elements to new array       |
| Sort              | O(n lg n)| Comparison-based sorting         |
+-------------------+----------+----------------------------------+
`);

// ============================================================
// EXAMPLE 4 — Two-Pointer: Pair with Target Sum
// Story: Zomato wants two restaurants whose combined delivery time
//   matches a customer's window. Two pointers on a sorted list find
//   the pair in O(n) instead of O(n^2) brute force.
// ============================================================

// WHY: Two-pointer converts O(n^2) to O(n) for sorted arrays.

// --- Two-Pointer: Target Sum in Sorted Array ---
// Big-O: Time O(n), Space O(1)

function twoSumSorted(sortedArr, target) {
  let left = 0;                             // Start pointer at beginning
  let right = sortedArr.length - 1;         // End pointer at end

  while (left < right) {
    const sum = sortedArr[left] + sortedArr[right];

    if (sum === target) {
      return [left, right];                 // Found the pair!
    } else if (sum < target) {
      left++;                               // Sum too small — need bigger number
    } else {
      right--;                              // Sum too big — need smaller number
    }
  }
  // O(n) — each element visited at most once by either pointer
  return null;
}

const deliveryTimes = [10, 15, 20, 25, 30, 35, 40, 45];
console.log("--- Two-Pointer: Pair with target sum ---");
console.log("Target 50:", twoSumSorted(deliveryTimes, 50));
// Output: [0,6] — 10 + 40 = 50
console.log("Target 55:", twoSumSorted(deliveryTimes, 55));
// Output: [1,6] — 15 + 40 = 55
console.log("Target 100:", twoSumSorted(deliveryTimes, 100));
// Output: null — no pair sums to 100

// ============================================================
// EXAMPLE 5 — Kadane's Algorithm: Maximum Subarray Sum
// Story: Zomato analyzes daily profit/loss per zone. Given profits
//   and losses, find the contiguous period with maximum total profit.
// ============================================================

// WHY: Brute force checks O(n^2) subarrays. Kadane's does O(n).

// --- Kadane's Algorithm ---
// Big-O: Time O(n), Space O(1)

function maxSubarraySum(arr) {
  let maxSum = arr[0];          // Best sum found so far
  let currentSum = arr[0];      // Current running sum

  for (let i = 1; i < arr.length; i++) {
    // Decision: extend current subarray or start fresh at arr[i]
    // If currentSum + arr[i] < arr[i], better to start new subarray
    currentSum = Math.max(arr[i], currentSum + arr[i]);
    maxSum = Math.max(maxSum, currentSum); // Track the overall maximum
  }

  return maxSum;
  // O(n) — single pass through the array
}

// Extended version: return the actual subarray, not just the sum
function maxSubarrayWithIndices(arr) {
  let maxSum = arr[0], curSum = arr[0];
  let start = 0, end = 0, tempStart = 0;

  for (let i = 1; i < arr.length; i++) {
    if (arr[i] > curSum + arr[i]) {
      curSum = arr[i];
      tempStart = i;           // New subarray starts here
    } else {
      curSum += arr[i];
    }

    if (curSum > maxSum) {
      maxSum = curSum;
      start = tempStart;       // Record start of best subarray
      end = i;                 // Record end of best subarray
    }
  }
  // Time: O(n), Space: O(1) (ignoring the output slice)
  return { maxSum, subarray: arr.slice(start, end + 1) };
}

const dailyProfits = [-2, 1, -3, 4, -1, 2, 1, -5, 4];
console.log("\n--- Kadane's Algorithm ---");
console.log("Array:", dailyProfits);
console.log("Max subarray sum:", maxSubarraySum(dailyProfits));
// Output: 6 (subarray [4, -1, 2, 1])
console.log("With indices:", maxSubarrayWithIndices(dailyProfits));
// Output: { maxSum: 6, subarray: [4, -1, 2, 1] }

// ============================================================
// EXAMPLE 6 — Prefix Sum: Range Sum Queries
// Story: Zomato's dashboard shows "total orders between day X and Y".
//   With prefix sums, after O(n) preprocessing, every query is O(1).
// ============================================================

// WHY: Prefix sum trades O(n) preprocessing for O(1) per query.

// --- Prefix Sum Array ---
// Big-O: Preprocessing O(n), Each query O(1)
//
// How it works:
// prefix[0] = 0 (empty sum)
// prefix[1] = arr[0]
// prefix[2] = arr[0] + arr[1]
// prefix[i] = sum of arr[0..i-1]
// Range sum arr[left..right] = prefix[right+1] - prefix[left]

function buildPrefixSum(arr) {
  const prefix = new Array(arr.length + 1).fill(0);
  for (let i = 0; i < arr.length; i++) {
    prefix[i + 1] = prefix[i] + arr[i]; // Running cumulative sum
  }
  return prefix; // O(n) — one pass to build
}

function rangeSum(prefix, left, right) {
  return prefix[right + 1] - prefix[left]; // O(1) — just a subtraction!
}

const dailyOrders = [5, 12, 8, 3, 15, 7, 20, 1, 9, 11];
const prefix = buildPrefixSum(dailyOrders);
console.log("\n--- Prefix Sum ---");
console.log("Daily orders:", dailyOrders);
console.log("Prefix array:", prefix);
// [0, 5, 17, 25, 28, 43, 50, 70, 71, 80, 91]
console.log("Sum days 2-5:", rangeSum(prefix, 2, 5)); // 33 (8+3+15+7)
console.log("Sum days 0-3:", rangeSum(prefix, 0, 3)); // 28 (5+12+8+3)
console.log("Sum days 7-9:", rangeSum(prefix, 7, 9)); // 21 (1+9+11)

// ============================================================
// EXAMPLE 7 — Dutch National Flag: Three-Way Partition
// Story: Zomato classifies restaurants into Red (poor), Yellow (avg),
//   Green (excellent). Partition an array of 0s, 1s, 2s in one pass.
// ============================================================

// WHY: Sorts 3 values in O(n) time, O(1) space — better than general sort.

// --- Dutch National Flag ---
// Big-O: Time O(n), Space O(1)
function dutchNationalFlag(arr) {
  let low = 0, mid = 0, high = arr.length - 1;
  while (mid <= high) {
    if (arr[mid] === 0) {
      [arr[low], arr[mid]] = [arr[mid], arr[low]];
      low++; mid++;
    } else if (arr[mid] === 1) {
      mid++;
    } else {
      [arr[mid], arr[high]] = [arr[high], arr[mid]];
      high--; // Do NOT increment mid — swapped element needs checking
    }
  }
  return arr;
}

const scores = [2, 0, 1, 2, 0, 1, 0, 2, 1, 0];
console.log("\n--- Dutch National Flag ---");
console.log("Before:", [...scores]);
console.log("After:", dutchNationalFlag(scores)); // [0,0,0,0,1,1,1,2,2,2]

// ============================================================
// EXAMPLE 8 — Rotate Array by K Positions
// Story: Zomato rotates "Featured Restaurants" every hour. The three
//   reversals trick does this in O(n) time, O(1) space.
// ============================================================

// WHY: Naive shift-k-times is O(n*k). Reversal trick is O(n).

// --- Three Reversals Trick ---
// Big-O: Time O(n), Space O(1)
function reverseSection(arr, start, end) {
  while (start < end) {
    [arr[start], arr[end]] = [arr[end], arr[start]];
    start++; end--;
  }
}

function rotateArray(arr, k) {
  const n = arr.length;
  k = k % n;
  if (k === 0) return arr;
  reverseSection(arr, 0, n - 1);    // Reverse all
  reverseSection(arr, 0, k - 1);    // Reverse first k
  reverseSection(arr, k, n - 1);    // Reverse rest
  return arr; // Total: 3 reversals of O(n) = O(n)
}

const featured = [1, 2, 3, 4, 5, 6, 7];
console.log("\n--- Rotate Array ---");
console.log("Rotate by 3:", rotateArray([...featured], 3)); // [5,6,7,1,2,3,4]

// ============================================================
// EXAMPLE 9 — Merge Two Sorted Arrays
// Story: Zomato merges restaurant lists from two cities, both already
//   sorted by rating, into one unified sorted list.
// ============================================================

// WHY: Merge is the foundation of merge sort and data aggregation.

// --- Merge Sorted Arrays ---
// Big-O: Time O(n + m), Space O(n + m) for the result

function mergeSortedArrays(arr1, arr2) {
  const result = [];
  let i = 0, j = 0;

  // Compare elements from both arrays, pick the smaller one
  while (i < arr1.length && j < arr2.length) {
    if (arr1[i] <= arr2[j]) {
      result.push(arr1[i]);
      i++;
    } else {
      result.push(arr2[j]);
      j++;
    }
  }

  // Append remaining elements from whichever array is not exhausted
  while (i < arr1.length) result.push(arr1[i++]);
  while (j < arr2.length) result.push(arr2[j++]);

  return result;
  // O(n + m) — each element from both arrays visited exactly once
}

const bangaloreRatings = [3.5, 4.0, 4.2, 4.8]; // sorted
const mumbaiRatings = [3.8, 4.1, 4.5, 4.9];    // sorted
console.log("\n--- Merge Sorted Arrays ---");
console.log("Bangalore:", bangaloreRatings);
console.log("Mumbai:", mumbaiRatings);
console.log("Merged:", mergeSortedArrays(bangaloreRatings, mumbaiRatings));
// Output: [3.5, 3.8, 4.0, 4.1, 4.2, 4.5, 4.8, 4.9]

// ============================================================
// EXAMPLE 10 — Move Zeroes to End
// Story: Zomato's pipeline has cancelled orders marked 0. Move all
//   zeros to the end while keeping non-zero order intact.
// ============================================================

// WHY: Two-pointer in-place manipulation demonstrates the write-pointer pattern.

// --- Move Zeroes to End (maintaining relative order) ---
// Big-O: Time O(n), Space O(1)

function moveZeroes(arr) {
  let writePointer = 0; // Where to write the next non-zero element

  // First pass: move all non-zero elements to the front
  for (let readPointer = 0; readPointer < arr.length; readPointer++) {
    if (arr[readPointer] !== 0) {
      arr[writePointer] = arr[readPointer];
      writePointer++;
    }
  }

  // Second pass: fill remaining positions with zeros
  while (writePointer < arr.length) {
    arr[writePointer] = 0;
    writePointer++;
  }

  return arr;
  // O(n) — two passes, each O(n). Total O(2n) = O(n). Space O(1).
}

const orderIds = [0, 1001, 0, 1003, 0, 0, 1007, 1008, 0, 1010];
console.log("\n--- Move Zeroes ---");
console.log("Before:", [...orderIds]);
console.log("After:", moveZeroes(orderIds));
// [1001, 1003, 1007, 1008, 1010, 0, 0, 0, 0, 0]

// ============================================================
// EXAMPLE 11 — Find Missing Number
// Story: Zomato order IDs 0 to n, one missing after a glitch. Find it.
// ============================================================

// WHY: Using the mathematical sum formula avoids sorting and extra space.
// Expected sum of 0..n minus actual sum = the missing number.

// --- Find Missing Number ---
// Big-O: Time O(n), Space O(1)

function findMissingNumber(arr, n) {
  // Expected sum of 0 to n = n * (n + 1) / 2
  const expectedSum = n * (n + 1) / 2;

  // Actual sum of array elements
  let actualSum = 0;
  for (const num of arr) {
    actualSum += num;
  }

  return expectedSum - actualSum; // The difference is the missing number
  // O(n) time — single pass. O(1) space — just arithmetic.
}

console.log("\n--- Missing Number ---");
console.log("Missing from [0..9]:", findMissingNumber([0, 1, 2, 3, 5, 6, 7, 8, 9], 9)); // 4
console.log("Missing from [0..5]:", findMissingNumber([0, 1, 3, 4, 5], 5)); // 2

// ============================================================
// EXAMPLE 12 — Maximum Profit (Buy/Sell Stock)
// Story: Zomato stock over 7 days. Find max profit buying then selling.
// ============================================================

// WHY: Brute force checks all O(n^2) buy-sell pairs. Optimal approach
// tracks the minimum price seen so far and computes profit at each step.

// --- Maximum Profit (Single Transaction) ---
// Big-O: Time O(n), Space O(1)

function maxProfit(prices) {
  let minPrice = Infinity;     // Lowest price seen so far
  let maxProfitSoFar = 0;      // Best profit seen so far

  for (const price of prices) {
    minPrice = Math.min(minPrice, price);           // Track minimum
    const profit = price - minPrice;                 // Profit if we sell today
    maxProfitSoFar = Math.max(maxProfitSoFar, profit); // Track best profit
  }

  return maxProfitSoFar;
  // O(n) — single pass, O(1) extra space
}

const stockPrices = [120, 95, 110, 85, 130, 105, 140];
console.log("\n--- Max Profit ---");
console.log("Prices:", stockPrices);
console.log("Max profit:", maxProfit(stockPrices));
// Output: 55 (buy at 85, sell at 140)

// ============================================================
// EXAMPLE 13 — Sliding Window: Max Sum of K Consecutive
// Story: Zomato finds k consecutive days with highest total orders.
//   Sliding window avoids recalculating — O(n) instead of O(n*k).
// ============================================================

// WHY: Sliding window avoids recalculating the entire window sum from
// scratch. It adds the new element and removes the old one — O(1) per step.

// --- Sliding Window: Max Sum of K Consecutive Elements ---
// Big-O: Time O(n), Space O(1)

function maxSumKConsecutive(arr, k) {
  if (arr.length < k) return null;

  // Calculate sum of first window
  let windowSum = 0;
  for (let i = 0; i < k; i++) {
    windowSum += arr[i];
  }

  let maxSum = windowSum;

  // Slide the window: add right element, remove left element
  for (let i = k; i < arr.length; i++) {
    windowSum += arr[i];        // Add new element entering the window
    windowSum -= arr[i - k];    // Remove element leaving the window
    maxSum = Math.max(maxSum, windowSum);
  }

  return maxSum;
  // O(n) — one pass after initial window setup
}

const weeklyOrders = [100, 200, 300, 150, 400, 350, 250, 500, 100, 450];
console.log("\n--- Sliding Window ---");
console.log("Daily orders:", weeklyOrders);
console.log("Max sum of 3 consecutive:", maxSumKConsecutive(weeklyOrders, 3));
// 1100 (350 + 250 + 500)

// ============================================================
// EXAMPLE 14 — Remove Duplicates from Sorted Array (In-Place)
// Story: Sorted list with duplicate restaurant IDs. Remove in-place.
// ============================================================

// Big-O: Time O(n), Space O(1)
function removeDuplicatesSorted(arr) {
  if (arr.length <= 1) return arr.length;
  let write = 1;
  for (let i = 1; i < arr.length; i++)
    if (arr[i] !== arr[i - 1]) arr[write++] = arr[i];
  return { count: write, unique: arr.slice(0, write) };
}

console.log("\n--- Remove Duplicates ---");
console.log(removeDuplicatesSorted([1, 1, 2, 2, 2, 3, 4, 4, 5, 5, 5]));
// { count: 5, unique: [1, 2, 3, 4, 5] }

// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. Array access by index is O(1) — the fundamental advantage of arrays
// 2. push/pop (end) = O(1), shift/unshift (start) = O(n) — HUGE difference
// 3. Keep arrays homogeneous (same type) for V8 optimization
// 4. Avoid sparse arrays (holes) — they downgrade V8 element kinds
// 5. Two-pointer technique: O(n) for sorted array problems
// 6. Kadane's algorithm: max subarray sum in O(n)
// 7. Prefix sum: O(n) preprocessing for O(1) range sum queries
// 8. Dutch National Flag: 3-way partition in O(n) time, O(1) space
// 9. Three-reversals trick: rotate array in O(n) time, O(1) space
// 10. Sliding window: avoid recalculating overlapping portions — O(n)
// ============================================================
