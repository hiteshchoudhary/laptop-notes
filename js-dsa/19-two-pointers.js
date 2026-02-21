// ============================================================
// FILE 19: TWO POINTERS TECHNIQUE
// Topic: Solving array and string problems efficiently with two-pointer patterns
// WHY: Two pointers eliminate the need for nested loops, turning O(n^2) into
//   O(n). This technique is essential for sorted array problems, pair finding,
//   in-place modifications, and partition problems in interviews.
// ============================================================

// ============================================================
// PAYTM — THE TWO POINTERS STORY
// Paytm's marketplace matches buyers and sellers in real-time. Buyers list
// their maximum price (sorted ascending), sellers list their minimum price
// (sorted descending). One pointer starts from the lowest buyer offer, another
// from the highest seller offer. They converge toward the middle — when a
// buyer's price >= seller's price, it's a match! This converging two-pointer
// pattern finds the best trade match in O(n) instead of O(n^2).
// ============================================================

// ============================================================
// EXAMPLE 1 — What is Two Pointers?
// Story: At a Reliance Jio store, customers queue for SIM cards. The manager
// has two assistants: one starts checking from the front of the queue, the
// other from the back. They move toward each other, processing customers
// from both ends simultaneously. Two pointers working together finish in
// half the time of a single pass from one end.
// ============================================================

// WHY: Two pointers use two indices that traverse data — either toward each
// other (converging), in the same direction (fast/slow), or across two arrays.
// This avoids nested loops and reduces time complexity from O(n^2) to O(n).

console.log("=== TWO POINTER PATTERNS ===");
console.log("Pattern 1: OPPOSITE DIRECTION (converging)");
console.log("  Left starts at beginning, right at end, they meet in middle");
console.log("  Use: sorted array pair finding, palindrome check\n");
console.log("Pattern 2: SAME DIRECTION (fast/slow)");
console.log("  Slow pointer writes, fast pointer scans ahead");
console.log("  Use: remove duplicates, move zeros, partition\n");
console.log("Pattern 3: TWO ARRAYS");
console.log("  One pointer per array, both move forward");
console.log("  Use: merge sorted arrays, intersection\n");

// ============================================================
// EXAMPLE 2 — Problem: Two Sum in Sorted Array (Converging Pointers)
// Story: PhonePe has a sorted list of UPI transaction amounts. They need to
// find two transactions that sum to a flagged amount (potential split payment
// fraud). With sorted data, one pointer at the smallest amount and one at the
// largest converge toward the target sum in O(n).
// ============================================================

// WHY: This is the canonical two-pointer problem. It demonstrates why
// sorted data + two pointers = O(n) instead of O(n^2) brute force.

// Big-O: Time O(n), Space O(1)
function twoSumSorted(arr, target) {
  let left = 0;
  let right = arr.length - 1;

  while (left < right) {
    const sum = arr[left] + arr[right];

    if (sum === target) {
      return [left, right]; // Found the pair!
    } else if (sum < target) {
      left++;  // Sum too small — need a bigger number, move left right
    } else {
      right--; // Sum too big — need a smaller number, move right left
    }
  }

  return [-1, -1]; // No pair found
}

console.log("=== PROBLEM 1: TWO SUM (SORTED ARRAY) ===");
const amounts = [100, 200, 300, 400, 500, 600, 700, 800];
const targetSum = 900;

console.log(`Sorted amounts: [${amounts}]`);
console.log(`Target sum: ${targetSum}`);
const [i1, i2] = twoSumSorted(amounts, targetSum);
console.log(`Pair found at indices [${i1}, ${i2}]: ${amounts[i1]} + ${amounts[i2]} = ${targetSum}`);

console.log(`\nBig-O: O(n) time, O(1) space — single pass with two pointers\n`);

// ============================================================
// EXAMPLE 3 — Problem: Three Sum (Fix One + Two Pointer)
// Story: Amazon India's pricing algorithm needs to find three products whose
// prices sum to exactly a budget. Brute force checks all triples O(n^3).
// Three Sum: sort the array, fix one element, use two pointers on the rest
// for O(n^2) — a massive improvement at scale.
// ============================================================

// WHY: Three Sum is one of the top 10 most asked interview questions.
// It combines sorting + two pointers and teaches duplicate handling.

// Big-O: Time O(n^2), Space O(1) excluding output
function threeSum(arr, target) {
  arr.sort((a, b) => a - b); // Sort first: O(n log n)
  const results = [];

  for (let i = 0; i < arr.length - 2; i++) {
    // Skip duplicate values for the first element
    if (i > 0 && arr[i] === arr[i - 1]) continue;

    let left = i + 1;
    let right = arr.length - 1;

    while (left < right) {
      const sum = arr[i] + arr[left] + arr[right];

      if (sum === target) {
        results.push([arr[i], arr[left], arr[right]]);

        // Skip duplicates for second and third elements
        while (left < right && arr[left] === arr[left + 1]) left++;
        while (left < right && arr[right] === arr[right - 1]) right--;

        left++;
        right--;
      } else if (sum < target) {
        left++;
      } else {
        right--;
      }
    }
  }

  return results;
}

console.log("=== PROBLEM 2: THREE SUM ===");
const prices = [-1, 0, 1, 2, -1, -4];
const target3sum = 0;

console.log(`Array: [${prices}]`);
console.log(`Target: ${target3sum}`);
const triplets = threeSum(prices, target3sum);
console.log(`Triplets that sum to ${target3sum}:`);
triplets.forEach((t) => console.log(`  [${t}] -> sum = ${t.reduce((a, b) => a + b)}`));

console.log(`\nBig-O: O(n^2) time — O(n log n) sort + O(n^2) two-pointer passes\n`);

// ============================================================
// EXAMPLE 4 — Problem: Container With Most Water
// Story: Tata Steel has water storage tanks of varying heights arranged in a
// row. They need to find which two tanks to connect to hold the maximum water.
// Water level is limited by the shorter tank. Two pointers from both ends,
// always moving the shorter side inward (since moving the taller side can
// only decrease or maintain the area).
// ============================================================

// WHY: This is a classic greedy + two-pointer problem (LeetCode #11).
// The key insight: moving the shorter line inward is the only way to
// potentially find a taller line that increases the area.

// Big-O: Time O(n), Space O(1)
function containerWithMostWater(heights) {
  let left = 0;
  let right = heights.length - 1;
  let maxArea = 0;
  let bestLeft = 0, bestRight = 0;

  while (left < right) {
    const width = right - left;
    const height = Math.min(heights[left], heights[right]);
    const area = width * height;

    if (area > maxArea) {
      maxArea = area;
      bestLeft = left;
      bestRight = right;
    }

    // Move the shorter side inward — only way to potentially increase area
    if (heights[left] < heights[right]) {
      left++;
    } else {
      right--;
    }
  }

  return { maxArea, left: bestLeft, right: bestRight };
}

console.log("=== PROBLEM 3: CONTAINER WITH MOST WATER ===");
const tankHeights = [1, 8, 6, 2, 5, 4, 8, 3, 7];

console.log(`Heights: [${tankHeights}]`);
const containerResult = containerWithMostWater(tankHeights);
console.log(`Max water: ${containerResult.maxArea}`);
console.log(`Between indices ${containerResult.left} (h=${tankHeights[containerResult.left]}) and ${containerResult.right} (h=${tankHeights[containerResult.right]})`);

console.log(`\nBig-O: O(n) single pass, O(1) space\n`);

// ============================================================
// EXAMPLE 5 — Pattern 2: Same Direction (Fast/Slow Pointers)
// Story: Myntra's product catalog has sorted product IDs with duplicates
// (from warehouse merges). They need to remove duplicates in-place without
// extra memory. Slow pointer marks the write position, fast pointer scans
// ahead for the next unique element.
// ============================================================

// WHY: Same-direction two pointers are essential for in-place array
// modifications. The slow pointer maintains the "result so far" while
// the fast pointer explores ahead.

// --- Remove Duplicates from Sorted Array ---
// Big-O: Time O(n), Space O(1) — in-place
function removeDuplicates(arr) {
  if (arr.length <= 1) return arr.length;

  let slow = 0; // Write position (last unique element)

  for (let fast = 1; fast < arr.length; fast++) {
    if (arr[fast] !== arr[slow]) {
      slow++;              // Move write position forward
      arr[slow] = arr[fast]; // Write the new unique element
    }
    // If arr[fast] === arr[slow], just skip (fast moves, slow stays)
  }

  return slow + 1; // Length of unique portion
}

console.log("=== PROBLEM 4: REMOVE DUPLICATES (SORTED ARRAY) ===");
const productIds = [1, 1, 2, 2, 2, 3, 4, 4, 5];
console.log(`Original: [${productIds}]`);
const uniqueLength = removeDuplicates(productIds);
console.log(`After removing duplicates: [${productIds.slice(0, uniqueLength)}]`);
console.log(`Unique count: ${uniqueLength}`);

console.log("  Slow pointer = write position, fast pointer = scanner\n");

// --- Move Zeros to End ---
// Big-O: Time O(n), Space O(1)
function moveZeros(arr) {
  let slow = 0; // Position to write next non-zero

  // First pass: move all non-zeros to front
  for (let fast = 0; fast < arr.length; fast++) {
    if (arr[fast] !== 0) {
      [arr[slow], arr[fast]] = [arr[fast], arr[slow]]; // Swap
      slow++;
    }
  }

  return arr;
}

console.log("=== PROBLEM 5: MOVE ZEROS TO END ===");
const withZeros = [0, 1, 0, 3, 12, 0, 5];
console.log(`Original: [${[...withZeros]}]`);
moveZeros(withZeros);
console.log(`After move: [${withZeros}]`);

console.log(`\nBig-O: O(n) single pass, O(1) space\n`);

// ============================================================
// EXAMPLE 6 — Pattern 3: Two Arrays
// Story: Flipkart and Amazon both maintain sorted lists of product categories.
// To find common categories (for price comparison), one pointer per list
// advances through both lists simultaneously. Equal values = intersection.
// Smaller value advances its pointer.
// ============================================================

// --- Merge Two Sorted Arrays ---
// Big-O: Time O(n + m), Space O(n + m)
function mergeSortedArrays(arr1, arr2) {
  const result = [];
  let i = 0, j = 0;

  while (i < arr1.length && j < arr2.length) {
    if (arr1[i] <= arr2[j]) {
      result.push(arr1[i]);
      i++;
    } else {
      result.push(arr2[j]);
      j++;
    }
  }

  // Add remaining elements
  while (i < arr1.length) result.push(arr1[i++]);
  while (j < arr2.length) result.push(arr2[j++]);

  return result;
}

console.log("=== PROBLEM 6: MERGE TWO SORTED ARRAYS ===");
const flipkartCategories = [1, 3, 5, 7, 9];
const amazonCategories = [2, 4, 6, 8, 10];
console.log(`Array 1: [${flipkartCategories}]`);
console.log(`Array 2: [${amazonCategories}]`);
console.log(`Merged: [${mergeSortedArrays(flipkartCategories, amazonCategories)}]`);

// --- Intersection of Two Sorted Arrays ---
// Big-O: Time O(n + m), Space O(min(n, m))
function intersectionSorted(arr1, arr2) {
  const result = [];
  let i = 0, j = 0;

  while (i < arr1.length && j < arr2.length) {
    if (arr1[i] === arr2[j]) {
      result.push(arr1[i]);
      i++;
      j++;
    } else if (arr1[i] < arr2[j]) {
      i++;
    } else {
      j++;
    }
  }

  return result;
}

console.log("\n=== PROBLEM 7: INTERSECTION OF SORTED ARRAYS ===");
const list1 = [1, 2, 3, 4, 5, 6];
const list2 = [2, 4, 6, 8, 10];
console.log(`Array 1: [${list1}]`);
console.log(`Array 2: [${list2}]`);
console.log(`Intersection: [${intersectionSorted(list1, list2)}]`);
console.log(`\nBig-O: O(n + m) time — each pointer moves at most n or m times\n`);

// ============================================================
// EXAMPLE 7 — Problem: Valid Palindrome
// Story: BookMyShow validates coupon codes. Valid codes read the same forwards
// and backwards (ignoring non-alphanumeric characters and case). Two pointers
// from both ends skip non-alpha chars and compare — O(n) with no extra space.
// ============================================================

// Big-O: Time O(n), Space O(1)
function isValidPalindrome(s) {
  let left = 0;
  let right = s.length - 1;

  const isAlphaNum = (c) => /[a-zA-Z0-9]/.test(c);

  while (left < right) {
    // Skip non-alphanumeric from left
    while (left < right && !isAlphaNum(s[left])) left++;
    // Skip non-alphanumeric from right
    while (left < right && !isAlphaNum(s[right])) right--;

    if (s[left].toLowerCase() !== s[right].toLowerCase()) {
      return false;
    }

    left++;
    right--;
  }

  return true;
}

console.log("=== PROBLEM 8: VALID PALINDROME ===");
const palindromeTests = [
  "A man, a plan, a canal: Panama",
  "race a car",
  "Was it a car or a cat I saw?",
  " ",
];

palindromeTests.forEach((s) => {
  console.log(`  "${s}" -> ${isValidPalindrome(s)}`);
});

console.log(`\nBig-O: O(n) time, O(1) space\n`);

// ============================================================
// EXAMPLE 8 — Problem: Sort Colors (Dutch National Flag)
// Story: India Post sorts mail into three categories: local (0), state (1),
// national (2). With millions of letters, they need a single-pass O(n)
// algorithm. Three pointers: low tracks where 0s end, mid scans current,
// high tracks where 2s begin. This partitions the array in one pass.
// ============================================================

// WHY: The Dutch National Flag problem (by Dijkstra himself!) is a classic
// three-pointer partition problem. It demonstrates how to sort with only
// 3 distinct values in O(n) time and O(1) space.

// Big-O: Time O(n), Space O(1)
function sortColors(arr) {
  let low = 0;              // Everything before low is 0
  let mid = 0;              // Current element being examined
  let high = arr.length - 1; // Everything after high is 2

  // Invariant:
  // [0..low-1] = all 0s
  // [low..mid-1] = all 1s
  // [mid..high] = unknown
  // [high+1..n-1] = all 2s

  while (mid <= high) {
    if (arr[mid] === 0) {
      // Swap with low position, advance both
      [arr[low], arr[mid]] = [arr[mid], arr[low]];
      low++;
      mid++;
    } else if (arr[mid] === 1) {
      // 1 is in correct zone, just advance mid
      mid++;
    } else {
      // arr[mid] === 2: swap with high position, shrink high
      [arr[mid], arr[high]] = [arr[high], arr[mid]];
      high--;
      // DON'T advance mid — need to check what was swapped from high
    }
  }

  return arr;
}

console.log("=== PROBLEM 9: SORT COLORS (DUTCH NATIONAL FLAG) ===");
const colors = [2, 0, 2, 1, 1, 0, 1, 2, 0];
console.log(`Original: [${[...colors]}]`);
sortColors(colors);
console.log(`Sorted:   [${colors}]`);

console.log(`\nBig-O: O(n) single pass, O(1) space\n`);

// ============================================================
// EXAMPLE 9 — Problem: Trapping Rain Water
// Story: During Mumbai monsoons, BMC engineers model water accumulation between
// buildings. Each building has a height. Water trapped at any position equals
// min(tallest building to its left, tallest building to its right) minus its
// own height. Two pointers from both ends track running left-max and right-max,
// processing the shorter side first.
// ============================================================

// WHY: Trapping Rain Water is a legendary interview problem (LeetCode #42).
// The two-pointer approach is the most elegant solution: O(n) time, O(1) space.
// The key insight: water at position i depends on min(leftMax, rightMax) - height[i].
// If leftMax < rightMax, the water is bounded by leftMax regardless of what's
// on the right. So we can process from the shorter side.

// Big-O: Time O(n), Space O(1)
function trapRainWater(heights) {
  let left = 0;
  let right = heights.length - 1;
  let leftMax = 0;
  let rightMax = 0;
  let totalWater = 0;
  const waterAtPosition = new Array(heights.length).fill(0);

  while (left < right) {
    if (heights[left] < heights[right]) {
      // Left side is the bottleneck
      if (heights[left] >= leftMax) {
        leftMax = heights[left]; // Update left max — no water here
      } else {
        const water = leftMax - heights[left];
        waterAtPosition[left] = water;
        totalWater += water; // Water = leftMax - current height
      }
      left++;
    } else {
      // Right side is the bottleneck
      if (heights[right] >= rightMax) {
        rightMax = heights[right]; // Update right max — no water here
      } else {
        const water = rightMax - heights[right];
        waterAtPosition[right] = water;
        totalWater += water;
      }
      right--;
    }
  }

  return { totalWater, waterAtPosition };
}

console.log("=== PROBLEM 10: TRAPPING RAIN WATER ===");
const buildings = [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1];

console.log(`Heights: [${buildings}]`);
const trapResult = trapRainWater(buildings);
console.log(`Total water trapped: ${trapResult.totalWater}`);
console.log(`Water at each position: [${trapResult.waterAtPosition}]`);

// Key insight: process from shorter side. If h[left]<h[right], water at
// left is bounded by leftMax. If h[right]<=h[left], water at right is
// bounded by rightMax.

console.log(`\nBig-O: O(n) time, O(1) space (excluding visualization array)\n`);

// ============================================================
// EXAMPLE 10 — When to Use Two Pointers: Decision Guide
// Story: A Google India interviewer shares the decision framework: "When
// you see sorted arrays, pair-finding, or in-place modification — think
// two pointers. When you see subarray/substring with a condition — think
// sliding window. Both are two-pointer techniques at heart."
// ============================================================

console.log("=== WHEN TO USE TWO POINTERS ===");
console.log("+------------------------------+----------------------------+");
console.log("| Signal                       | Pattern                    |");
console.log("+------------------------------+----------------------------+");
console.log("| Sorted array + pair finding  | Converging (opposite dir)  |");
console.log("| Sum = target in sorted       | Converging                 |");
console.log("| Palindrome check             | Converging                 |");
console.log("| Remove duplicates in-place   | Same direction (fast/slow) |");
console.log("| Partition array              | Same direction or 3-way    |");
console.log("| Merge sorted arrays          | Two arrays                 |");
console.log("| Container with most water    | Converging (greedy)        |");
console.log("| Trapping rain water          | Converging + running max   |");
console.log("+------------------------------+----------------------------+");

console.log("\nNote: Sliding Window IS a form of two pointers (left/right bounds).\n");

// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. Two Pointers converts O(n^2) nested loops into O(n) single pass
//    by strategically moving two indices through the data.
// 2. CONVERGING (opposite direction): sorted arrays, pair finding,
//    palindrome. Start from both ends, move toward each other.
// 3. SAME DIRECTION (fast/slow): in-place modification, remove duplicates,
//    move zeros. Slow = write position, fast = scanner.
// 4. TWO ARRAYS: merge, intersection. One pointer per array.
// 5. THREE POINTERS: Dutch National Flag (Sort Colors). Partition into
//    3 groups in single pass O(n).
// 6. Trapping Rain Water: converging pointers + running max from both sides.
//    Water = min(leftMax, rightMax) - height. Process shorter side.
// 7. Three Sum: fix one element + two-pointer on remaining = O(n^2).
//    Always sort first and skip duplicates.
// 8. Key insight for converging pointers: if sum < target, move left right
//    (need bigger); if sum > target, move right left (need smaller).
// ============================================================

console.log("=== BIG-O SUMMARY ===");
console.log("+-----------------------------------+---------+---------+");
console.log("| Problem                           | Time    | Space   |");
console.log("+-----------------------------------+---------+---------+");
console.log("| Two Sum (sorted)                  | O(n)    | O(1)    |");
console.log("| Three Sum                         | O(n^2)  | O(1)*   |");
console.log("| Container With Most Water         | O(n)    | O(1)    |");
console.log("| Remove Duplicates                 | O(n)    | O(1)    |");
console.log("| Move Zeros                        | O(n)    | O(1)    |");
console.log("| Merge Sorted Arrays               | O(n+m)  | O(n+m)  |");
console.log("| Intersection Sorted               | O(n+m)  | O(min)  |");
console.log("| Valid Palindrome                  | O(n)    | O(1)    |");
console.log("| Sort Colors (Dutch Flag)          | O(n)    | O(1)    |");
console.log("| Trapping Rain Water               | O(n)    | O(1)    |");
console.log("+-----------------------------------+---------+---------+");
console.log("* excluding output array");
