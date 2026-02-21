// ============================================================
// FILE 09: SORTING BASICS — BUBBLE, SELECTION, AND INSERTION SORT
// Topic: Fundamental O(n^2) sorting algorithms and their trade-offs
// WHY: Understanding basic sorts builds intuition for why O(n log n)
//   sorts exist and when simple sorts are actually the best choice.
//   Insertion sort is used inside TimSort and IntroSort for small arrays.
// ============================================================

// ============================================================
// EXAMPLE 1 — Flipkart Product Sorting
// Story: Flipkart sorts 50 million products by price, rating,
//   relevance, and recency. Choosing the wrong algorithm could
//   mean 30 seconds of server time instead of 3 seconds. For
//   small result pages (20 items), even bubble sort is fine.
//   For the full catalog, they need O(n log n) algorithms.
// ============================================================

// WHY: Sorting is the most studied problem in computer science.
// It enables binary search (O(log n) instead of O(n)), deduplication,
// grouping, and efficient merging. Almost every application sorts data.

// ============================================================
// EXAMPLE 2 — Sorting Fundamentals
// Story: Before a cricket match at Wankhede Stadium, players
//   line up by jersey number. The coach needs to know: will the
//   sort keep players with the same number in their original
//   order (stable)? Does it need extra space (in-place)?
// ============================================================

// WHY: Before learning any algorithm, understand these properties:
// - STABLE: equal elements keep their original relative order
//   Example: sorting by price, products with same price stay in
//   their original order (important for multi-key sorting)
// - IN-PLACE: uses O(1) extra memory (no extra array needed)
// - ADAPTIVE: runs faster on nearly-sorted data

// --- Comparison Table (ASCII) ---
//
// | Algorithm    | Best     | Average  | Worst    | Space | Stable | Adaptive |
// |------------- |----------|----------|----------|-------|--------|----------|
// | Bubble Sort  | O(n)     | O(n^2)   | O(n^2)   | O(1)  | Yes    | Yes      |
// | Selection    | O(n^2)   | O(n^2)   | O(n^2)   | O(1)  | No     | No       |
// | Insertion    | O(n)     | O(n^2)   | O(n^2)   | O(1)  | Yes    | Yes      |
// | JS .sort()   | O(n)     | O(n logn)| O(n logn)| O(n)  | Yes    | Yes      |
//
// All three basic sorts: O(1) space (in-place), O(n^2) average time.
// For n = 1,000: ~1,000,000 comparisons (manageable).
// For n = 1,000,000: ~1,000,000,000,000 comparisons (too slow!).

// ============================================================
// EXAMPLE 3 — Bubble Sort
// Story: At an SBI bank branch in Lucknow, customers in a queue
//   need to be sorted by token number. The guard walks along the
//   line, swapping adjacent people if they're in the wrong order.
//   He repeats until no swaps are needed — the line is sorted.
// ============================================================

// WHY: Bubble sort is the simplest sorting algorithm to understand.
// It repeatedly compares adjacent elements and swaps them if they
// are in the wrong order. Like bubbles rising to the surface,
// the largest elements "bubble up" to the end of the array.

// --- Bubble Sort Implementation ---
function bubbleSort(arr) {
  const n = arr.length;
  let swapCount = 0;
  let passCount = 0;

  // Outer loop: each pass guarantees one more element is in place
  for (let i = 0; i < n - 1; i++) {
    let swapped = false; // optimization: early termination flag
    passCount++;

    console.log(`  Pass ${i + 1}: [${arr.join(", ")}]`);

    // Inner loop: compare adjacent pairs
    // (n - 1 - i) because last i elements are already sorted
    for (let j = 0; j < n - 1 - i; j++) {
      if (arr[j] > arr[j + 1]) {
        // Swap adjacent elements
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        swapped = true;
        swapCount++;
      }
    }

    // Optimization: if no swaps happened, array is already sorted!
    if (!swapped) {
      console.log(`  Pass ${i + 1}: No swaps → array is sorted! Early exit.`);
      break;
    }
  }

  console.log(`  Result: [${arr.join(", ")}]`);
  console.log(`  Passes: ${passCount}, Swaps: ${swapCount}`);
  return arr;
}

console.log("=== Bubble Sort ===");
console.log("Unsorted array:");
bubbleSort([64, 34, 25, 12, 22, 11, 90]);
console.log();

// Best case: already sorted → O(n) with the swapped flag
console.log("Already sorted (best case):");
bubbleSort([1, 2, 3, 4, 5]);
console.log();

// Worst case: reverse sorted → O(n^2), every pair swapped
console.log("Reverse sorted (worst case):");
bubbleSort([5, 4, 3, 2, 1]);
console.log();

// Big-O for Bubble Sort:
// Best:    O(n) — already sorted, one pass with no swaps
// Average: O(n^2) — roughly n^2/4 swaps
// Worst:   O(n^2) — reverse sorted, n*(n-1)/2 comparisons
// Space:   O(1) — in-place
// Stable:  YES — equal elements are never swapped
// Adaptive: YES — fast on nearly sorted data

// ============================================================
// EXAMPLE 4 — Selection Sort
// Story: A teacher at Delhi Public School arranges students by
//   height for a class photo. She scans the entire line to find
//   the shortest student, pulls them to the front. Then finds
//   the next shortest from the remaining students, and so on.
//   She always scans the entire unsorted portion — no shortcuts.
// ============================================================

// WHY: Selection sort is intuitive: find the minimum, place it,
// repeat. Its key characteristic is minimal SWAPS — only O(n)
// swaps regardless of input. But it always does O(n^2) comparisons,
// even if the array is already sorted. Not adaptive, not stable.

// --- Selection Sort Implementation ---
function selectionSort(arr) {
  const n = arr.length;
  let comparisons = 0;
  let swaps = 0;

  for (let i = 0; i < n - 1; i++) {
    let minIdx = i; // assume current position has the minimum

    // Find the actual minimum in the unsorted portion
    for (let j = i + 1; j < n; j++) {
      comparisons++;
      if (arr[j] < arr[minIdx]) {
        minIdx = j;
      }
    }

    // Swap the minimum with the current position (if different)
    if (minIdx !== i) {
      [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
      swaps++;
    }

    console.log(`  Step ${i + 1}: min=${arr[i]}, placed at index ${i} → [${arr.join(", ")}]`);
  }

  console.log(`  Comparisons: ${comparisons}, Swaps: ${swaps}`);
  return arr;
}

console.log("=== Selection Sort ===");
console.log("Unsorted array:");
selectionSort([64, 25, 12, 22, 11]);
console.log();

// Even on sorted input, selection sort does ALL comparisons
console.log("Already sorted (still O(n^2) comparisons!):");
selectionSort([1, 2, 3, 4, 5]);
console.log();

// Big-O for Selection Sort:
// Best:    O(n^2) — always scans entire unsorted portion
// Average: O(n^2)
// Worst:   O(n^2)
// Space:   O(1) — in-place
// Stable:  NO — swapping can change relative order of equal elements
//   Example: [3a, 3b, 1] → find min=1, swap 3a↔1 → [1, 3b, 3a] — 3a and 3b reordered!
// Adaptive: NO — same work regardless of input order
// Advantage: minimum number of swaps: O(n). Useful when writes are expensive.

// WHY is selection sort NOT stable?
console.log("Selection sort is NOT stable — proof:");
console.log("Input:  [3, 3, 1] where first 3 is '3a', second is '3b'");
console.log("Step 1: Find min=1, swap with index 0: [1, 3b, 3a]");
console.log("3a moved after 3b — relative order of equal elements changed!");
console.log();

// ============================================================
// EXAMPLE 5 — Insertion Sort
// Story: At a Rummy card game during Diwali at a family home in
//   Chennai, each player picks up cards one by one and inserts
//   each card into the correct position in their sorted hand.
//   You shift cards right to make room, then slide the new card
//   in. This is exactly insertion sort.
// ============================================================

// WHY: Insertion sort is the most practical of the O(n^2) sorts.
// It is adaptive (O(n) on nearly sorted data), stable, in-place,
// and has very low overhead. It's used as the base case in TimSort
// (JavaScript's .sort()) and IntroSort (C++'s std::sort()) for
// sub-arrays smaller than ~16-32 elements.

// --- Insertion Sort Implementation ---
function insertionSort(arr) {
  const n = arr.length;
  let comparisons = 0;
  let shifts = 0;

  console.log(`  Start: [${arr.join(", ")}]`);

  // Start from index 1 (index 0 is already "sorted")
  for (let i = 1; i < n; i++) {
    const key = arr[i]; // the card we're inserting
    let j = i - 1;

    // Shift elements that are greater than key to the right
    while (j >= 0 && arr[j] > key) {
      comparisons++;
      arr[j + 1] = arr[j]; // shift right
      shifts++;
      j--;
    }
    if (j >= 0) comparisons++; // one more comparison that failed the while condition

    arr[j + 1] = key; // insert the key at the correct position

    console.log(`  Insert ${key} at index ${j + 1}: [${arr.join(", ")}]`);
  }

  console.log(`  Comparisons: ${comparisons}, Shifts: ${shifts}`);
  return arr;
}

console.log("=== Insertion Sort ===");
console.log("Unsorted array:");
insertionSort([12, 11, 13, 5, 6]);
console.log();

// Best case: already sorted → O(n), just one comparison per element
console.log("Already sorted (best case O(n)):");
insertionSort([1, 2, 3, 4, 5]);
console.log();

// Nearly sorted: very few shifts needed → nearly O(n)
console.log("Nearly sorted (adaptive — very fast):");
insertionSort([1, 2, 4, 3, 5]);
console.log();

// Worst case: reverse sorted → O(n^2), maximum shifts
console.log("Reverse sorted (worst case O(n^2)):");
insertionSort([5, 4, 3, 2, 1]);
console.log();

// Big-O for Insertion Sort:
// Best:    O(n) — already sorted, one comparison per element
// Average: O(n^2) — roughly n^2/4 shifts
// Worst:   O(n^2) — reverse sorted, n*(n-1)/2 shifts
// Space:   O(1) — in-place
// Stable:  YES — equal elements maintain their relative order
// Adaptive: YES — faster on nearly-sorted data
// Advantage: best for small arrays (n < 20) and nearly-sorted data

// ============================================================
// EXAMPLE 6 — Performance Comparison
// Story: A Flipkart engineer benchmarks sorting 10,000 product
//   prices. Bubble sort takes ~150ms, selection sort ~100ms
//   (fewer swaps), insertion sort ~50ms (data is semi-sorted).
//   But JavaScript's built-in .sort() finishes in under 2ms.
// ============================================================

// WHY: Seeing the actual speed difference makes Big-O tangible.
// Let's measure all three sorts on random data.

function generateRandomArray(size) {
  return Array.from({ length: size }, () => Math.floor(Math.random() * size));
}

// Pure implementations without console logs (for benchmarking)
function bubbleSortPure(arr) {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    for (let j = 0; j < n - 1 - i; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        swapped = true;
      }
    }
    if (!swapped) break;
  }
  return arr;
}

function selectionSortPure(arr) {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < n; j++) {
      if (arr[j] < arr[minIdx]) minIdx = j;
    }
    if (minIdx !== i) [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
  }
  return arr;
}

function insertionSortPure(arr) {
  const n = arr.length;
  for (let i = 1; i < n; i++) {
    const key = arr[i];
    let j = i - 1;
    while (j >= 0 && arr[j] > key) {
      arr[j + 1] = arr[j];
      j--;
    }
    arr[j + 1] = key;
  }
  return arr;
}

console.log("=== Performance Comparison (n = 5000) ===");
const testSize = 5000;
const original = generateRandomArray(testSize);

// Bubble Sort
let copy1 = [...original];
let start = Date.now();
bubbleSortPure(copy1);
console.log(`Bubble Sort:    ${Date.now() - start}ms`);

// Selection Sort
let copy2 = [...original];
start = Date.now();
selectionSortPure(copy2);
console.log(`Selection Sort: ${Date.now() - start}ms`);

// Insertion Sort
let copy3 = [...original];
start = Date.now();
insertionSortPure(copy3);
console.log(`Insertion Sort: ${Date.now() - start}ms`);

// Built-in sort (TimSort)
let copy4 = [...original];
start = Date.now();
copy4.sort((a, b) => a - b);
console.log(`JS .sort():     ${Date.now() - start}ms`);
console.log();

// ============================================================
// EXAMPLE 7 — JavaScript's Array.sort() Deep Dive
// Story: A junior developer at Infosys sorts user ages:
//   [10, 9, 80, 3].sort() returns [10, 3, 80, 9] — WRONG!
//   JavaScript's default sort converts elements to STRINGS and
//   sorts lexicographically. "10" < "3" because "1" < "3".
//   Always use a comparator for numbers!
// ============================================================

// WHY: JavaScript's .sort() uses TimSort (a hybrid of merge sort
// and insertion sort). It is O(n log n), stable, and adaptive.
// But the DEFAULT comparison is LEXICOGRAPHIC (string-based).
// This is the most common JS sorting bug.

console.log("=== JavaScript .sort() Gotchas ===");

// THE BUG: default sort is lexicographic
const ages = [10, 9, 80, 3, 21];
console.log("Default sort:      ", [...ages].sort());
// [10, 21, 3, 80, 9] — WRONG! Sorted as strings!

// THE FIX: use a comparator
console.log("Numeric sort (asc):", [...ages].sort((a, b) => a - b));
// [3, 9, 10, 21, 80] — correct!

console.log("Numeric sort (desc):", [...ages].sort((a, b) => b - a));
// [80, 21, 10, 9, 3]

// --- Custom comparators for objects ---
const flipkartProducts = [
  { name: "iPhone 15", price: 79999, rating: 4.5 },
  { name: "Samsung S24", price: 69999, rating: 4.7 },
  { name: "OnePlus 12", price: 49999, rating: 4.6 },
  { name: "Pixel 8", price: 59999, rating: 4.8 },
  { name: "Nothing Phone 2", price: 49999, rating: 4.3 },
];

// Sort by price ascending
const byPrice = [...flipkartProducts].sort((a, b) => a.price - b.price);
console.log("\nSorted by price:");
byPrice.forEach(p => console.log(`  Rs.${p.price} - ${p.name}`));

// Sort by rating descending, then by price ascending (multi-key sort)
const byRatingThenPrice = [...flipkartProducts].sort((a, b) => {
  if (b.rating !== a.rating) return b.rating - a.rating; // higher rating first
  return a.price - b.price; // if same rating, lower price first
});
console.log("\nSorted by rating (desc) then price (asc):");
byRatingThenPrice.forEach(p => console.log(`  ★${p.rating} Rs.${p.price} - ${p.name}`));
console.log();

// WHY stability matters for multi-key sorting:
// TimSort is STABLE, so if we sort by price first, then by rating,
// products with the same rating keep their price-sorted order.
// An unstable sort would scramble them.

// ============================================================
// EXAMPLE 8 — Sorting Algorithm Selection Guide
// Story: A senior engineer at Flipkart creates a decision guide
//   for the team. "Use insertion sort for small sub-arrays in
//   our TimSort implementation. Use counting sort for sorting
//   by pincode (fixed range). Use merge sort for sorting CSV
//   exports (needs stability and predictable time)."
// ============================================================

console.log("=== Sorting Algorithm Selection Guide ===");
console.log("┌─────────────────────┬──────────────────────────────────────┐");
console.log("│ Scenario            │ Best Algorithm                       │");
console.log("├─────────────────────┼──────────────────────────────────────┤");
console.log("│ n < 20              │ Insertion Sort (low overhead)        │");
console.log("│ Nearly sorted       │ Insertion Sort (O(n) best case)      │");
console.log("│ Minimal swaps       │ Selection Sort (O(n) swaps)          │");
console.log("│ General purpose     │ JS .sort() / TimSort                 │");
console.log("│ Need stability      │ Merge Sort / Insertion Sort          │");
console.log("│ Large dataset       │ Quick Sort / Merge Sort (File 10)    │");
console.log("│ Integers in range   │ Counting Sort / Radix Sort (File 10) │");
console.log("│ Linked list         │ Merge Sort (File 10)                 │");
console.log("└─────────────────────┴──────────────────────────────────────┘");
console.log();

// ============================================================
// EXAMPLE 9 — Bonus: Visualizing Sort Step-by-Step
// Story: A CodeChef tutorial for Indian college students shows
//   each sort visually, step by step, so the "aha moment" clicks.
// ============================================================

// --- Visual Bubble Sort on Small Array ---
console.log("=== Visual Sort Trace ===");
function bubbleSortVisual(arr) {
  const a = [...arr];
  const n = a.length;
  console.log("Bubble Sort Trace:");
  console.log(`  Start:   [${a.join(", ")}]`);
  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    for (let j = 0; j < n - 1 - i; j++) {
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        swapped = true;
      }
    }
    const sorted = a.slice(n - 1 - i).join(", ");
    const unsorted = a.slice(0, n - 1 - i).join(", ");
    console.log(`  Pass ${i + 1}:  [${unsorted} | ${sorted}]  (| = sorted boundary)`);
    if (!swapped) { console.log("  → No swaps, done!"); break; }
  }
  console.log(`  Result:  [${a.join(", ")}]`);
  return a;
}
bubbleSortVisual([38, 27, 43, 3, 9, 82, 10]);
console.log();

// --- Visual Selection Sort ---
function selectionSortVisual(arr) {
  const a = [...arr];
  const n = a.length;
  console.log("Selection Sort Trace:");
  console.log(`  Start:   [${a.join(", ")}]`);
  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < n; j++) {
      if (a[j] < a[minIdx]) minIdx = j;
    }
    if (minIdx !== i) {
      console.log(`  Step ${i + 1}:  min=${a[minIdx]} at idx ${minIdx}, swap with idx ${i}`);
      [a[i], a[minIdx]] = [a[minIdx], a[i]];
    } else {
      console.log(`  Step ${i + 1}:  min=${a[i]} already at idx ${i}`);
    }
    const sorted = a.slice(0, i + 1).join(", ");
    const unsorted = a.slice(i + 1).join(", ");
    console.log(`          [${sorted} | ${unsorted}]`);
  }
  console.log(`  Result:  [${a.join(", ")}]`);
  return a;
}
selectionSortVisual([29, 10, 14, 37, 13]);
console.log();

// --- Visual Insertion Sort ---
function insertionSortVisual(arr) {
  const a = [...arr];
  const n = a.length;
  console.log("Insertion Sort Trace:");
  console.log(`  Start:   [${a.join(", ")}]`);
  for (let i = 1; i < n; i++) {
    const key = a[i];
    let j = i - 1;
    let shifted = [];
    while (j >= 0 && a[j] > key) {
      shifted.push(a[j]);
      a[j + 1] = a[j];
      j--;
    }
    a[j + 1] = key;
    if (shifted.length > 0) {
      console.log(`  Insert ${key}: shifted [${shifted.join(", ")}] right → [${a.join(", ")}]`);
    } else {
      console.log(`  Insert ${key}: already in place → [${a.join(", ")}]`);
    }
  }
  console.log(`  Result:  [${a.join(", ")}]`);
  return a;
}
insertionSortVisual([5, 2, 4, 6, 1, 3]);
console.log();

// ============================================================
// EXAMPLE 10 — Practical: Sorting Flipkart Search Results
// Story: A user searches "laptop" on Flipkart. The backend
//   returns 10,000 results. For the first page (20 items),
//   we could use insertion sort. For the full result set sorted
//   by relevance, we need O(n log n) — covered in File 10.
// ============================================================

console.log("=== Practical: Sorting Flipkart Results ===");
const laptops = [
  { name: "HP Pavilion", price: 55999, rating: 4.2, reviews: 1230 },
  { name: "Lenovo IdeaPad", price: 42999, rating: 4.5, reviews: 3450 },
  { name: "Dell Inspiron", price: 48999, rating: 4.3, reviews: 2100 },
  { name: "Asus VivoBook", price: 39999, rating: 4.1, reviews: 890 },
  { name: "Acer Aspire", price: 37999, rating: 4.4, reviews: 1560 },
  { name: "MacBook Air M2", price: 99999, rating: 4.8, reviews: 5600 },
  { name: "Lenovo ThinkPad", price: 72999, rating: 4.6, reviews: 2800 },
];

// Sort by "popularity" (reviews * rating) using insertion sort
// since it's a small array and may be nearly sorted already
function insertionSortByKey(arr, keyFn) {
  const a = [...arr];
  for (let i = 1; i < a.length; i++) {
    const key = a[i];
    const keyVal = keyFn(key);
    let j = i - 1;
    while (j >= 0 && keyFn(a[j]) > keyVal) {
      a[j + 1] = a[j];
      j--;
    }
    a[j + 1] = key;
  }
  return a;
}

const byPopularity = insertionSortByKey(laptops, l => -(l.reviews * l.rating));
console.log("Sorted by popularity (reviews x rating):");
byPopularity.forEach((l, i) => {
  const score = (l.reviews * l.rating).toFixed(0);
  console.log(`  ${i + 1}. ${l.name} — Rs.${l.price} ★${l.rating} (${l.reviews} reviews, score=${score})`);
});
console.log();

// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. Bubble Sort: compare adjacent pairs, swap if wrong order.
//    Best O(n) with early-exit flag. Average/Worst O(n^2). Stable.
// 2. Selection Sort: find min, swap to front. ALWAYS O(n^2),
//    not adaptive, not stable. Only advantage: O(n) swaps.
// 3. Insertion Sort: insert each element into sorted prefix.
//    Best O(n) for nearly sorted. Average/Worst O(n^2). Stable.
//    Used inside TimSort/IntroSort for small sub-arrays.
// 4. JS .sort() uses TimSort: O(n log n), stable, adaptive.
//    ALWAYS use a comparator for numbers: (a, b) => a - b.
//    Default .sort() converts to strings — common bug!
// 5. For n < 20 or nearly sorted data: insertion sort wins.
//    For large data: need O(n log n) sorts (File 10).
// 6. Stability matters for multi-key sorting: sort by secondary
//    key first, then primary key. Stable sort preserves order.
// 7. All O(n^2) sorts use O(1) extra space (in-place).

console.log("=== FILE 09 COMPLETE ===");
