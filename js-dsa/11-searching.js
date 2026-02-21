// ============================================================
// FILE 11: SEARCHING ALGORITHMS
// Topic: Linear Search, Binary Search, and Powerful Variations
// WHY: Searching is the most fundamental operation in computing.
//      Amazon India searches 200M+ product listings every second.
//      Choosing O(log n) over O(n) is the difference between
//      milliseconds and minutes at scale.
// ============================================================

// ============================================================
// EXAMPLE 1 — Linear Search: The Brute Force Scan
// Story: Imagine a new intern at Amazon India's Hyderabad
//        warehouse. They need to find a specific package among
//        thousands on a shelf. With no sorting system, they
//        check each package one by one — package #1, #2, #3...
//        This is linear search. Simple but painfully slow.
// ============================================================

// WHY: Linear search is the simplest search algorithm. It works
// on ANY data — sorted or unsorted. But it checks every element,
// making it O(n). For 200M products, that is 200M comparisons
// in the worst case.

// --- Linear Search Implementation ---
function linearSearch(arr, target) {
  // Walk through every element from index 0 to n-1
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) {
      return i; // Found! Return the index
    }
  }
  return -1; // Not found after checking all elements
}

// Big-O: Time O(n), Space O(1). Best O(1), Worst O(n).

const products = ['Laptop', 'Phone', 'Tablet', 'Headphones', 'Charger', 'Mouse'];
console.log('=== LINEAR SEARCH ===');
console.log('Products:', products);
console.log('Search "Tablet":', linearSearch(products, 'Tablet'));   // 2
console.log('Search "Keyboard":', linearSearch(products, 'Keyboard')); // -1


// ============================================================
// EXAMPLE 2 — Binary Search: The Divide and Conquer Hero
// Story: Amazon India's search team realized that with 200M+
//        products, linear search would take ~200ms per query.
//        They sorted the product index and used binary search:
//        halving the search space each step. Now 200M products
//        need only ~27 comparisons (log2(200M) ~ 27.5). That
//        is the magic of O(log n).
// ============================================================

// WHY: Binary search is the single most important algorithm to master.
// It reduces search from O(n) to O(log n) by eliminating half the
// remaining elements at each step. Prerequisite: data MUST be sorted.

// --- Binary Search: Iterative (Preferred) ---
// WHY iterative over recursive? No call stack overhead, no risk of
// stack overflow on huge arrays.
function binarySearch(arr, target) {
  let left = 0;
  let right = arr.length - 1;

  while (left <= right) {
    // WHY this formula instead of (left + right) / 2?
    // (left + right) can overflow in languages with fixed-size integers.
    // This formula avoids overflow. In JS, numbers are 64-bit floats
    // so overflow isn't an issue, but this is a UNIVERSAL best practice.
    const mid = left + Math.floor((right - left) / 2);

    if (arr[mid] === target) {
      return mid;              // Found target at mid
    } else if (arr[mid] < target) {
      left = mid + 1;          // Target is in the right half
    } else {
      right = mid - 1;         // Target is in the left half
    }
  }

  return -1; // Target not found
}

// Big-O: Time O(log n), Space O(1). For n=1,000,000 → ~20 comparisons.

const sortedPrices = [99, 199, 299, 499, 599, 799, 999, 1299, 1499, 1999, 2499];
console.log('\n=== BINARY SEARCH (ITERATIVE) ===');
console.log('Sorted prices:', sortedPrices);
console.log('Search 799:', binarySearch(sortedPrices, 799));    // 5
console.log('Search 1000:', binarySearch(sortedPrices, 1000));  // -1

// --- Binary Search: Recursive version ---
// WHY: More intuitive, but O(log n) stack space. Risk of stack overflow.
function binarySearchRecursive(arr, target, left = 0, right = arr.length - 1) {
  if (left > right) return -1;
  const mid = left + Math.floor((right - left) / 2);
  if (arr[mid] === target) return mid;
  if (arr[mid] < target) return binarySearchRecursive(arr, target, mid + 1, right);
  return binarySearchRecursive(arr, target, left, mid - 1);
}
// Big-O: Time O(log n), Space O(log n) due to recursion stack

console.log('\n=== BINARY SEARCH (RECURSIVE) ===');
console.log('Search 299:', binarySearchRecursive(sortedPrices, 299));   // 2
console.log('Search 3000:', binarySearchRecursive(sortedPrices, 3000)); // -1


// ============================================================
// EXAMPLE 3 — Binary Search Variations: Real Interview Problems
// Story: During Amazon India's hiring drive in Bangalore, the
//        interview panel asked candidates to solve 6 variations
//        of binary search. These variations appear in 40% of
//        coding interviews. Each twist tests whether you truly
//        understand the algorithm or just memorized the template.
// ============================================================

// --- Variation 1: Find First Occurrence (Leftmost) ---
// WHY: When duplicates exist, standard binary search returns ANY
// occurrence. Often you need the FIRST one (e.g., first order
// placed on a specific date).
function findFirstOccurrence(arr, target) {
  let left = 0;
  let right = arr.length - 1;
  let result = -1;

  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);

    if (arr[mid] === target) {
      result = mid;       // Record this position
      right = mid - 1;    // Keep searching LEFT for an earlier occurrence
    } else if (arr[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return result;
}

// Big-O: O(log n) — same as standard binary search

const ratings = [1, 2, 3, 3, 3, 3, 4, 5, 5, 5];
console.log('\n=== FIND FIRST OCCURRENCE ===');
console.log('Array:', ratings);
console.log('First occurrence of 3:', findFirstOccurrence(ratings, 3)); // 2
console.log('First occurrence of 5:', findFirstOccurrence(ratings, 5)); // 7

// --- Variation 2: Find Last Occurrence (Rightmost) ---
// WHY: Find the last order on a specific date, or the rightmost
// boundary of a value range.
function findLastOccurrence(arr, target) {
  let left = 0;
  let right = arr.length - 1;
  let result = -1;

  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);

    if (arr[mid] === target) {
      result = mid;       // Record this position
      left = mid + 1;     // Keep searching RIGHT for a later occurrence
    } else if (arr[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return result;
}

console.log('\n=== FIND LAST OCCURRENCE ===');
console.log('Last occurrence of 3:', findLastOccurrence(ratings, 3)); // 5
console.log('Last occurrence of 5:', findLastOccurrence(ratings, 5)); // 9

// --- Variation 3: Find Insertion Point (bisect_left equivalent) ---
// WHY: Where would you insert a new value to keep the array sorted?
// Used in maintaining sorted order, ranking systems, etc.
function bisectLeft(arr, target) {
  let left = 0;
  let right = arr.length; // Note: right = length, not length - 1

  while (left < right) {  // Note: < not <=
    const mid = left + Math.floor((right - left) / 2);

    if (arr[mid] < target) {
      left = mid + 1;
    } else {
      right = mid;         // arr[mid] >= target, could be insertion point
    }
  }

  return left; // left === right === insertion point
}

// Big-O: O(log n)

console.log('\n=== INSERTION POINT (bisect_left) ===');
console.log('Insert 300 at index:', bisectLeft(sortedPrices, 300));  // 2 (between 299 and 499)
console.log('Insert 9999 at index:', bisectLeft(sortedPrices, 9999)); // 11 (after everything)

// --- Variation 4: Search in Rotated Sorted Array ---
// WHY: A sorted array rotated at some pivot (e.g., [4,5,6,7,0,1,2]).
// Classic interview question — tests deep understanding of binary search.
function searchRotated(arr, target) {
  let left = 0;
  let right = arr.length - 1;

  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);

    if (arr[mid] === target) return mid;

    // Determine which half is sorted
    if (arr[left] <= arr[mid]) {
      // Left half [left..mid] is sorted
      if (arr[left] <= target && target < arr[mid]) {
        right = mid - 1;   // Target is in the sorted left half
      } else {
        left = mid + 1;    // Target is in the right half
      }
    } else {
      // Right half [mid..right] is sorted
      if (arr[mid] < target && target <= arr[right]) {
        left = mid + 1;    // Target is in the sorted right half
      } else {
        right = mid - 1;   // Target is in the left half
      }
    }
  }

  return -1;
}

// Big-O: O(log n) — still halving each step

const rotated = [15, 18, 22, 30, 2, 5, 8, 10, 12];
console.log('\n=== SEARCH IN ROTATED SORTED ARRAY ===');
console.log('Array:', rotated);
console.log('Search 5:', searchRotated(rotated, 5));    // 5
console.log('Search 30:', searchRotated(rotated, 30));  // 3
console.log('Search 20:', searchRotated(rotated, 20));  // -1

// --- Variation 5: Find Peak Element in Mountain Array ---
// WHY: A mountain array first increases then decreases. Find the peak.
// Example: stock prices that rise then fall — find the highest point.
function findPeakElement(arr) {
  let left = 0;
  let right = arr.length - 1;

  while (left < right) {
    const mid = left + Math.floor((right - left) / 2);

    if (arr[mid] < arr[mid + 1]) {
      left = mid + 1;     // Peak is to the right (still ascending)
    } else {
      right = mid;         // Peak is mid or to the left (descending starts)
    }
  }

  return left; // left === right === peak index
}

// Big-O: O(log n)

const mountain = [1, 3, 7, 12, 18, 15, 9, 6, 2];
console.log('\n=== FIND PEAK ELEMENT ===');
console.log('Mountain array:', mountain);
console.log('Peak index:', findPeakElement(mountain));               // 4
console.log('Peak value:', mountain[findPeakElement(mountain)]);     // 18

// --- Variation 6: Search in 2D Sorted Matrix ---
// WHY: In a matrix where rows and columns are sorted, start from
// the top-right corner. Each comparison eliminates an entire
// row OR column.
function searchMatrix(matrix, target) {
  if (matrix.length === 0 || matrix[0].length === 0) return [-1, -1];

  const rows = matrix.length;
  const cols = matrix[0].length;

  // Start from top-right corner
  let row = 0;
  let col = cols - 1;

  while (row < rows && col >= 0) {
    if (matrix[row][col] === target) {
      return [row, col];      // Found!
    } else if (matrix[row][col] > target) {
      col--;                   // Eliminate this column (go left)
    } else {
      row++;                   // Eliminate this row (go down)
    }
  }

  return [-1, -1]; // Not found
}

// Big-O: O(m + n) — each step eliminates a row or column

const priceMatrix = [
  [100,  200,  300,  400],
  [500,  600,  700,  800],
  [900,  1000, 1100, 1200],
  [1300, 1400, 1500, 1600]
];

console.log('\n=== SEARCH IN 2D SORTED MATRIX ===');
console.log('Search 700:', searchMatrix(priceMatrix, 700));    // [1, 2]
console.log('Search 650:', searchMatrix(priceMatrix, 650));    // [-1, -1]


// ============================================================
// EXAMPLE 4 — Binary Search on Answer: Ship Packages in D Days
// Story: Amazon India's logistics team needs to determine the
//        minimum truck capacity to ship all packages from the
//        Mumbai warehouse within D days. Packages must be shipped
//        in order. Instead of trying every capacity, they binary
//        search on the answer space: the capacity is between
//        max(package) and sum(packages).
// ============================================================

// WHY: Binary search on answer searches for the OPTIMAL VALUE that
// satisfies a condition. The answer space must be monotonic.

function shipWithinDays(weights, days) {
  // Minimum capacity: must carry the heaviest single package
  let left = Math.max(...weights);
  // Maximum capacity: carry everything in one trip
  let right = weights.reduce((sum, w) => sum + w, 0);

  // Binary search on the answer (capacity)
  while (left < right) {
    const mid = left + Math.floor((right - left) / 2);

    if (canShip(weights, days, mid)) {
      right = mid;          // This capacity works, try smaller
    } else {
      left = mid + 1;       // This capacity is too small
    }
  }

  return left; // Minimum capacity that works
}

// Helper: can we ship all packages within `days` using `capacity`?
function canShip(weights, days, capacity) {
  let daysNeeded = 1;
  let currentLoad = 0;

  for (const weight of weights) {
    if (currentLoad + weight > capacity) {
      daysNeeded++;          // Start a new day
      currentLoad = 0;
    }
    currentLoad += weight;
  }

  return daysNeeded <= days;
}

// Big-O: O(n * log(sum - max)) where n = number of packages

const packages = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
console.log('\n=== BINARY SEARCH ON ANSWER: SHIP PACKAGES ===');
console.log('Packages:', packages);
console.log('Min capacity for 5 days:', shipWithinDays(packages, 5));  // 15
console.log('Min capacity for 1 day:', shipWithinDays(packages, 1));   // 55


// ============================================================
// EXAMPLE 5 — Built-in Search Methods & Hash-Based Lookups
// Story: A Flipkart engineer was using Array.indexOf() to check
//        if a user's pincode was serviceable — running O(n) on
//        every API call against 30,000 pincodes. After switching
//        to a Set (O(1) lookup), response time dropped from
//        12ms to 0.01ms. That is 1200x faster.
// ============================================================

// WHY: Knowing Big-O of built-ins prevents accidental O(n) where O(1) is possible.

const pincodes = [110001, 400001, 560001, 600001, 500001, 700001, 302001];
console.log('\n=== BUILT-IN SEARCH METHODS ===');

// Array.indexOf() — O(n): linear scan, returns first index or -1
console.log('indexOf 560001:', pincodes.indexOf(560001));     // 2
console.log('indexOf 999999:', pincodes.indexOf(999999));     // -1

// Array.includes() — O(n): linear scan, returns boolean
console.log('includes 400001:', pincodes.includes(400001));   // true
console.log('includes 123456:', pincodes.includes(123456));   // false

// --- Hash-based structures: O(1) average ---
// WHY: Set/Map use hash tables. For FREQUENT lookups, convert to Set/Map.

const pincodeSet = new Set(pincodes);

// Set.has() — O(1) average
console.log('\nSet.has(560001):', pincodeSet.has(560001));     // true
console.log('Set.has(999999):', pincodeSet.has(999999));       // false

// Map.has() — O(1) average
const pincodeMap = new Map();
pincodes.forEach(p => pincodeMap.set(p, `City-${p}`));

console.log('Map.has(400001):', pincodeMap.has(400001));       // true
console.log('Map.get(400001):', pincodeMap.get(400001));       // City-400001

// Big-O Summary: indexOf/includes O(n), Set.has/Map.has O(1), Binary Search O(log n)


// ============================================================
// EXAMPLE 6 — Practical: Binary Search + Variation Problems
// Story: The Amazon India interview preparation team compiled a
//        practice set for campus placements at IIT Delhi. These
//        are the exact patterns that appear in FAANG interviews.
// ============================================================

// --- Problem 1: Square Root using Binary Search ---
// WHY: Find floor(sqrt(n)) using binary search on answer space.
function mySqrt(n) {
  if (n < 2) return n;

  let left = 1;
  let right = Math.floor(n / 2); // sqrt(n) <= n/2 for n >= 4
  let result = 1;

  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);
    const square = mid * mid;

    if (square === n) {
      return mid;           // Perfect square
    } else if (square < n) {
      result = mid;         // mid could be the floor(sqrt(n))
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return result;
}

// Big-O: O(log n)

console.log('\n=== PROBLEM 1: SQUARE ROOT ===');
console.log('sqrt(25):', mySqrt(25));   // 5
console.log('sqrt(10):', mySqrt(10));   // 3 (floor)
console.log('sqrt(100):', mySqrt(100)); // 10

// --- Problem 2: Find Minimum in Rotated Sorted Array ---
// WHY: Different from searching for a specific target. Here we find
// the rotation pivot (minimum element).
function findMinInRotated(arr) {
  let left = 0;
  let right = arr.length - 1;

  while (left < right) {
    const mid = left + Math.floor((right - left) / 2);

    if (arr[mid] > arr[right]) {
      left = mid + 1;       // Min is in the right half
    } else {
      right = mid;           // Min is mid or in the left half
    }
  }

  return arr[left]; // left === right === index of minimum
}

// Big-O: O(log n)

console.log('\n=== PROBLEM 2: MINIMUM IN ROTATED ARRAY ===');
console.log('Rotated:', rotated);
console.log('Minimum:', findMinInRotated(rotated)); // 2

// --- Problem 3: Search Range (first and last position) ---
// WHY: Combines findFirst and findLast into one problem.
function searchRange(arr, target) {
  return [findFirstOccurrence(arr, target), findLastOccurrence(arr, target)];
}

// Big-O: O(log n) — two binary searches

console.log('\n=== PROBLEM 3: SEARCH RANGE ===');
const nums = [5, 7, 7, 8, 8, 8, 8, 10];
console.log('Array:', nums);
console.log('Range of 8:', searchRange(nums, 8));   // [3, 6]
console.log('Range of 6:', searchRange(nums, 6));   // [-1, -1]

// --- Problem 4: Koko Eating Bananas ---
// WHY: Another binary search on answer. Koko has N piles of bananas
// and H hours. Find minimum eating speed (bananas/hour) to finish.
// This pattern is identical to the ship packages problem.
function minEatingSpeed(piles, h) {
  let left = 1;
  let right = Math.max(...piles);

  while (left < right) {
    const mid = left + Math.floor((right - left) / 2);

    // Calculate hours needed at speed mid
    let hoursNeeded = 0;
    for (const pile of piles) {
      hoursNeeded += Math.ceil(pile / mid);
    }

    if (hoursNeeded <= h) {
      right = mid;          // Speed is enough, try slower
    } else {
      left = mid + 1;       // Too slow, need faster
    }
  }

  return left;
}

// Big-O: O(n * log(max(piles)))

console.log('\n=== PROBLEM 4: KOKO EATING BANANAS ===');
const bananas = [3, 6, 7, 11];
console.log('Piles:', bananas);
console.log('Min speed for 8 hours:', minEatingSpeed(bananas, 8));   // 4
console.log('Min speed for 4 hours:', minEatingSpeed(bananas, 4));   // 11

// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. Linear Search: O(n), works on unsorted data, use when data
//    is small or unsorted.
// 2. Binary Search: O(log n), requires sorted data. Master the
//    iterative template — it avoids stack overflow.
// 3. Overflow bug: Always use mid = left + Math.floor((right - left) / 2)
//    instead of (left + right) / 2.
// 4. Variations are the real interview skill:
//    - First/last occurrence: keep searching after finding target
//    - Insertion point: left < right loop, return left
//    - Rotated array: determine which half is sorted
//    - Peak element: compare mid with mid+1
//    - 2D matrix: start from top-right, O(m + n)
// 5. Binary Search on Answer: when the answer space is monotonic,
//    binary search for the optimal value. (Shipping, eating speed, etc.)
// 6. Built-in methods: Array.indexOf/includes are O(n).
//    Use Set/Map for O(1) lookups when searching frequently.
// 7. The pattern: if the problem involves "find minimum X such that
//    condition is satisfied" — think binary search on answer.
// ============================================================

console.log('\n=== ALL SEARCHING EXAMPLES COMPLETE ===');
