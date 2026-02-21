// ============================================================
// FILE 10: ADVANCED SORTING — MERGE SORT, QUICK SORT, AND BEYOND
// Topic: O(n log n) comparison sorts and O(n) non-comparison sorts
// WHY: Merge sort and quick sort are the workhorses of real-world
//   sorting. Understanding their divide-and-conquer strategies
//   unlocks efficient algorithms for millions of data points.
// ============================================================

// ============================================================
// EXAMPLE 1 — Google India Web Indexing
// Story: Google India indexes billions of web pages for search.
//   Sorting by PageRank, relevance, and freshness requires
//   O(n log n) algorithms. Merge sort guarantees predictable
//   performance. Quick sort's cache-friendliness makes it faster
//   in practice for in-memory data.
// ============================================================

// WHY: O(n^2) sorts from File 09 cannot handle millions of items.
// O(n log n) is the theoretical lower bound for comparison sorts.
// For n = 1,000,000:
//   O(n^2)     = 10^12 operations (~17 minutes)
//   O(n log n) = 2*10^7 operations (~0.02 seconds)

// ============================================================
// EXAMPLE 2 — Merge Sort: Divide, Sort, Merge
// Story: During India's census, each state sorts its records
//   locally. Then pairs of states merge their sorted records.
//   This continues until one sorted national database remains.
// ============================================================

// WHY: Merge sort splits in half, recursively sorts each half,
// then merges. Merge step is O(n). With log n levels, total is
// O(n log n) — always, with no worst case.

// --- Splitting and Merging Tree (ASCII Art) ---
// Split phase:           Merge phase:
// [38, 27, 43, 3]        [3, 27, 38, 43]
//    /         \             /         \
// [38, 27]   [43, 3]    [27, 38]    [3, 43]
//  /   \      /   \      /   \       /   \
// [38] [27]  [43] [3]  [38] [27]   [43] [3]

// --- merge: combine two sorted arrays into one sorted array ---
// Uses two pointers, one for each input array. Compare the current
// elements and pick the smaller one. Append remaining elements.
// Time: O(n + m) where n, m are the lengths of left and right
// Space: O(n + m) for the result array
function merge(left, right) {
  const result = [];
  let i = 0; // pointer for left array
  let j = 0; // pointer for right array

  // Compare elements from both arrays, pick the smaller one
  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) {
      result.push(left[i]);  // left element is smaller or equal
      i++;
    } else {
      result.push(right[j]); // right element is smaller
      j++;
    }
  }

  // One array is exhausted. Append all remaining elements from the other.
  while (i < left.length) { result.push(left[i]); i++; }
  while (j < right.length) { result.push(right[j]); j++; }

  return result;
}

// --- mergeSort: recursive divide-and-conquer ---
function mergeSort(arr, depth = 0) {
  const indent = "  ".repeat(depth);
  if (arr.length <= 1) {
    console.log(`${indent}mergeSort([${arr}]) -> base case`);
    return arr;
  }
  console.log(`${indent}mergeSort([${arr.join(", ")}])`);
  const mid = Math.floor(arr.length / 2);
  const left = arr.slice(0, mid), right = arr.slice(mid);
  console.log(`${indent}  split -> [${left}] and [${right}]`);
  const sortedL = mergeSort(left, depth + 1);
  const sortedR = mergeSort(right, depth + 1);
  const merged = merge(sortedL, sortedR);
  console.log(`${indent}  merge [${sortedL}] + [${sortedR}] -> [${merged}]`);
  return merged;
}

console.log("=== Merge Sort (with trace) ===");
const mergeSorted = mergeSort([38, 27, 43, 3, 9, 82, 10]);
console.log("Result:", mergeSorted);
console.log();

// Big-O for Merge Sort:
// Best:    O(n log n) — always splits and merges
// Average: O(n log n)
// Worst:   O(n log n) — guaranteed! No bad cases.
// Space:   O(n) — needs temporary arrays for merging
// Stable:  YES — equal elements maintain relative order (left[i] <= right[j])
// Adaptive: No — does the same amount of work regardless of input order
//
// Advantages:
//   - Guaranteed O(n log n) — no worst case degradation
//   - Stable sort — important for multi-key sorting
//   - Great for linked lists (no random access needed, O(1) merge space)
//   - Great for external sorting (merge sorted chunks from disk)
//
// Disadvantages:
//   - O(n) extra space for temporary arrays
//   - Not in-place
//   - Slightly slower than quicksort in practice due to memory allocation

function mergeSortClean(arr) {
  if (arr.length <= 1) return arr;
  const mid = Math.floor(arr.length / 2);
  return merge(mergeSortClean(arr.slice(0, mid)), mergeSortClean(arr.slice(mid)));
}

// ============================================================
// EXAMPLE 3 — Quick Sort: Pivot, Partition, Recurse
// Story: Flipkart's warehouse sorts packages by pincode. A worker
//   picks a "pivot" package, splits: lower pincodes left, higher
//   right. Each sub-pile sorted the same way.
// ============================================================

// WHY: Quick sort is in-place (O(log n) stack), cache-friendly,
// and fastest comparison sort in practice for random data.

// --- Lomuto Partition Scheme ---
// Pivot is the LAST element. We maintain a boundary `i` such that
// all elements before `i` are <= pivot.
//
// [  <= pivot  |  > pivot  |  unknown  | pivot ]
//              i           j                    end
//
// Walk j from low to high-1. If arr[j] <= pivot, swap it into
// the "less than" partition and advance the boundary i.
function lomutoPartition(arr, low, high) {
  const pivot = arr[high];
  let i = low;
  for (let j = low; j < high; j++) {
    if (arr[j] <= pivot) { [arr[i], arr[j]] = [arr[j], arr[i]]; i++; }
  }
  [arr[i], arr[high]] = [arr[high], arr[i]];
  return i;
}

function quickSortLomuto(arr, low = 0, high = arr.length - 1, depth = 0) {
  if (low < high) {
    const indent = "  ".repeat(depth);
    console.log(`${indent}quickSort([${arr.slice(low, high + 1)}]) pivot=${arr[high]}`);
    const pi = lomutoPartition(arr, low, high);
    console.log(`${indent}  partitioned: [${arr.slice(low, high + 1)}] pivot@${pi}`);
    quickSortLomuto(arr, low, pi - 1, depth + 1);
    quickSortLomuto(arr, pi + 1, high, depth + 1);
  }
  return arr;
}

console.log("=== Quick Sort - Lomuto (with trace) ===");
quickSortLomuto([...[ 10, 80, 30, 90, 40, 50, 70]]);
console.log();

// --- Hoare Partition ---
// WHY: Two pointers from both ends, ~3x fewer swaps than Lomuto.
function hoarePartition(arr, low, high) {
  const pivot = arr[low];
  let i = low - 1, j = high + 1;
  while (true) {
    do { i++; } while (arr[i] < pivot);
    do { j--; } while (arr[j] > pivot);
    if (i >= j) return j;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function quickSortHoare(arr, low = 0, high = arr.length - 1) {
  if (low < high) {
    const pi = hoarePartition(arr, low, high);
    quickSortHoare(arr, low, pi);
    quickSortHoare(arr, pi + 1, high);
  }
  return arr;
}

console.log("=== Quick Sort - Hoare ===");
const hArr = [10, 80, 30, 90, 40, 50, 70];
console.log("Before:", hArr.join(", "));
quickSortHoare(hArr);
console.log("After: ", hArr.join(", "));
console.log();

// --- Pivot Choice ---
// Bad: sorted array + last/first pivot -> O(n^2)
// Good: random pivot -> expected O(n log n) on any input
// Best: median-of-three
console.log("=== Pivot Choice ===");
console.log("Bad: sorted + last pivot -> O(n^2). Each partition is [n-1] and [].");
console.log("Good: random pivot -> expected O(n log n).");
console.log("Best: median-of-three avoids worst case on sorted data.");
console.log();

function quickSortRandom(arr, low = 0, high = arr.length - 1) {
  if (low < high) {
    const ri = low + Math.floor(Math.random() * (high - low + 1));
    [arr[ri], arr[high]] = [arr[high], arr[ri]];
    const pi = lomutoPartition(arr, low, high);
    quickSortRandom(arr, low, pi - 1);
    quickSortRandom(arr, pi + 1, high);
  }
  return arr;
}

console.log("Random pivot on sorted input (worst case for naive quicksort):");
const si = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
console.log("Before:", si.join(", "));
quickSortRandom(si);
console.log("After: ", si.join(", "));
console.log("(No O(n^2) degradation because pivot is randomized!)");
console.log();

// Big-O for Quick Sort:
// Best:    O(n log n) — balanced partitions every time
// Average: O(n log n) — random pivot gives this in expectation
// Worst:   O(n^2) — sorted input + bad pivot (first/last), but random avoids
// Space:   O(log n) for recursion stack (in-place partitioning)
// Stable:  NO — partitioning changes relative order of equal elements
//
// Advantages:
//   - In-place: O(log n) stack space vs merge sort's O(n) extra arrays
//   - Cache-friendly: sequential access pattern during partitioning
//   - Fastest comparison sort in practice for random in-memory data
//
// Disadvantages:
//   - O(n^2) worst case (mitigated by random / median-of-three pivot)
//   - NOT stable — cannot preserve relative order of equal elements
//   - Not ideal for linked lists (partitioning needs random access)

// ============================================================
// EXAMPLE 4 — Counting Sort: Beyond Comparison
// Story: India Post sorts 10M letters by PIN code (6-digit
//   integers). Counting sort does it in O(n + k) — faster than
//   any comparison sort's O(n log n) lower bound!
// ============================================================

// WHY: Comparison sorts cannot beat O(n log n). But if values are
// integers in a known range, counting sort achieves O(n + k).

function countingSort(arr) {
  if (arr.length <= 1) return arr;
  const max = Math.max(...arr), min = Math.min(...arr);
  const range = max - min + 1;
  console.log(`  Range: ${min} to ${max} (k = ${range})`);

  // Step 1: Count occurrences
  const count = new Array(range).fill(0);
  for (const num of arr) count[num - min]++;
  console.log(`  Counts: [${count}]`);

  // Step 2: Prefix sums
  for (let i = 1; i < range; i++) count[i] += count[i - 1];
  console.log(`  Prefix: [${count}]`);

  // Step 3: Place elements (backwards for stability)
  const output = new Array(arr.length);
  for (let i = arr.length - 1; i >= 0; i--) {
    output[count[arr[i] - min] - 1] = arr[i];
    count[arr[i] - min]--;
  }
  console.log(`  Output: [${output}]`);
  return output;
}

console.log("=== Counting Sort ===");
const scores = [4, 2, 2, 8, 3, 3, 1, 7, 5, 4, 3, 2, 8, 1, 4];
const sortedScores = countingSort(scores);
console.log("Result:", sortedScores.join(", "));
console.log();

// Big-O for Counting Sort:
// Time:  O(n + k) where k = range of values (max - min + 1)
// Space: O(n + k) — count array of size k, output array of size n
// Stable: YES — if we iterate backwards in step 3
//
// When k <= n: effectively O(n) — linear time sorting!
// When k >> n: O(k) dominates — worse than O(n log n) comparison sorts
//
// Limitations:
//   - Only works for integers (or values that map to integers)
//   - Range k must be reasonable (k = 10^9 -> 4GB of memory!)
//   - Not in-place (needs count + output arrays)

// ============================================================
// EXAMPLE 5 — Radix Sort: Digit by Digit
// Story: Aadhaar numbers (12 digits) sorted for de-duplication.
//   Radix sort processes one digit at a time using counting sort.
//   12 passes of O(n) each = O(12n) = O(n).
// ============================================================

// WHY: Radix sort sorts digit by digit (LSD to MSD), using a
// stable sort (counting sort) per digit position.

function radixSort(arr) {
  if (arr.length <= 1) return arr;
  const result = [...arr];
  const max = Math.max(...result);
  const digits = Math.floor(Math.log10(max)) + 1;
  console.log(`  Max: ${max}, Digits: ${digits}`);

  let exp = 1;
  for (let d = 0; d < digits; d++) {
    const count = new Array(10).fill(0);
    const output = new Array(result.length);

    for (const num of result) count[Math.floor(num / exp) % 10]++;
    for (let i = 1; i < 10; i++) count[i] += count[i - 1];
    for (let i = result.length - 1; i >= 0; i--) {
      const digit = Math.floor(result[i] / exp) % 10;
      output[count[digit] - 1] = result[i];
      count[digit]--;
    }
    for (let i = 0; i < result.length; i++) result[i] = output[i];

    console.log(`  Pass ${d + 1} (${exp}s): [${result}]`);
    exp *= 10;
  }
  return result;
}

console.log("=== Radix Sort (LSD) ===");
console.log("Input: 170, 45, 75, 90, 802, 24, 2, 66, 345, 111");
const radixSorted = radixSort([170, 45, 75, 90, 802, 24, 2, 66, 345, 111]);
console.log("Result:", radixSorted.join(", "));
console.log();

// Big-O for Radix Sort:
// Time:  O(d * (n + k)) where d = digits, k = base (10 for decimal)
// Space: O(n + k) — for counting sort's arrays at each pass
// Stable: YES — counting sort preserves order at each digit
//
// For fixed-length integers (d = constant): effectively O(n)
// For Aadhaar (12 digits, base 10): O(12 * (n + 10)) = O(n)
//
// Limitations:
//   - Only works for integers or fixed-length strings
//   - d (number of digits) matters — very large numbers = many passes
//   - Not in-place (needs temporary arrays at each pass)

// ============================================================
// EXAMPLE 6 — Performance Comparison
// ============================================================

function genRandom(size) { return Array.from({ length: size }, () => Math.floor(Math.random() * size)); }

function qsClean(arr, lo = 0, hi = arr.length - 1) {
  if (lo < hi) {
    const ri = lo + Math.floor(Math.random() * (hi - lo + 1));
    [arr[ri], arr[hi]] = [arr[hi], arr[ri]];
    const p = arr[hi]; let i = lo;
    for (let j = lo; j < hi; j++) if (arr[j] <= p) { [arr[i], arr[j]] = [arr[j], arr[i]]; i++; }
    [arr[i], arr[hi]] = [arr[hi], arr[i]];
    qsClean(arr, lo, i - 1); qsClean(arr, i + 1, hi);
  }
  return arr;
}

function csClean(arr) {
  const max = Math.max(...arr), min = Math.min(...arr), range = max - min + 1;
  const count = new Array(range).fill(0);
  for (const n of arr) count[n - min]++;
  const out = [];
  for (let i = 0; i < range; i++) for (let j = 0; j < count[i]; j++) out.push(i + min);
  return out;
}

console.log("=== Performance Comparison ===");
for (const size of [10000, 50000]) {
  console.log(`\n--- n = ${size.toLocaleString()} ---`);
  const orig = genRandom(size);
  let t, c;

  c = [...orig]; t = Date.now(); mergeSortClean(c);   console.log(`  Merge Sort:    ${Date.now() - t}ms`);
  c = [...orig]; t = Date.now(); qsClean(c);          console.log(`  Quick Sort:    ${Date.now() - t}ms`);
  c = [...orig]; t = Date.now(); csClean(c);           console.log(`  Counting Sort: ${Date.now() - t}ms`);
  c = [...orig]; t = Date.now(); c.sort((a, b) => a - b); console.log(`  JS .sort():    ${Date.now() - t}ms`);
}
console.log();

// ============================================================
// EXAMPLE 7 — When to Use Which Sort
// ============================================================

console.log("=== When to Use Which Sort ===");
console.log("+---------------------------------+-------------------------------+");
console.log("| Scenario                        | Best Choice                   |");
console.log("+---------------------------------+-------------------------------+");
console.log("| Small n (< 20)                  | Insertion Sort                |");
console.log("| Nearly sorted data              | Insertion Sort / TimSort      |");
console.log("| Need stability + guaranteed     | Merge Sort O(n log n)         |");
console.log("|   O(n log n) performance        |                               |");
console.log("| General purpose, in-memory      | Quick Sort (random pivot)     |");
console.log("| Linked list sorting             | Merge Sort (no random access) |");
console.log("| External sorting (disk/tape)    | Merge Sort (sequential I/O)   |");
console.log("| Integers in bounded range       | Counting Sort O(n + k)        |");
console.log("| Fixed-length integers/strings   | Radix Sort O(d * (n + k))     |");
console.log("| JavaScript application code     | Array.sort() with comparator  |");
console.log("| Need in-place + fast            | Quick Sort                    |");
console.log("+---------------------------------+-------------------------------+");
console.log();

// ============================================================
// EXAMPLE 8 — Merge Sort on Linked List (Preview)
// Story: When Zomato merges two sorted restaurant lists from
//   different cities, they use merge sort. On linked lists,
//   merge sort is especially efficient — no extra space needed
//   for the merge step because we just re-point node pointers.
// ============================================================

// WHY: Merge sort is the ideal sort for linked lists because:
// 1. Finding the middle: slow/fast pointer technique O(n)
// 2. Merging: re-point next pointers, no extra array needed — O(1) space
// 3. No random access needed (unlike quick sort which needs pivot swaps)

class ListNode {
  constructor(val) { this.val = val; this.next = null; }
}

function sortLinkedList(head) {
  if (!head || !head.next) return head;
  let slow = head, fast = head.next;
  while (fast && fast.next) { slow = slow.next; fast = fast.next.next; }
  const right = slow.next; slow.next = null;
  return mergeLLists(sortLinkedList(head), sortLinkedList(right));
}

function mergeLLists(l1, l2) {
  const dummy = new ListNode(0); let c = dummy;
  while (l1 && l2) {
    if (l1.val <= l2.val) { c.next = l1; l1 = l1.next; }
    else { c.next = l2; l2 = l2.next; }
    c = c.next;
  }
  c.next = l1 || l2;
  return dummy.next;
}

console.log("=== Merge Sort on Linked List ===");
let llH = new ListNode(4); llH.next = new ListNode(2);
llH.next.next = new ListNode(1); llH.next.next.next = new ListNode(3);
llH.next.next.next.next = new ListNode(5);

function printLL(h) { const v = []; while (h) { v.push(h.val); h = h.next; } console.log(v.join(" -> ") + " -> null"); }
console.log("Before:"); printLL(llH);
llH = sortLinkedList(llH);
console.log("After: "); printLL(llH); // 1 -> 2 -> 3 -> 4 -> 5
console.log();

// ============================================================
// EXAMPLE 9 — Practical: Sorting Indian E-commerce Data
// Story: BigBasket sorts grocery items by multiple criteria:
//   category (alphabetical), then price (ascending), then rating
//   (descending). Multi-key sorting relies on a stable sort
//   and a well-crafted comparator function.
// ============================================================

// WHY: Real-world sorting often involves multiple keys. A stable
// sort preserves the relative order of elements that compare equal
// on the primary key, so secondary/tertiary keys remain sorted.

console.log("=== Practical: Multi-Key Sorting ===");
const groceries = [
  { name: "Amul Butter", cat: "Dairy", price: 56, rating: 4.5 },
  { name: "Tata Salt", cat: "Essentials", price: 24, rating: 4.2 },
  { name: "Mother Dairy Milk", cat: "Dairy", price: 68, rating: 4.7 },
  { name: "Aashirvaad Atta", cat: "Essentials", price: 320, rating: 4.6 },
  { name: "Amul Cheese", cat: "Dairy", price: 99, rating: 4.3 },
  { name: "Tata Tea", cat: "Beverages", price: 185, rating: 4.4 },
];

const sorted = [...groceries].sort((a, b) => {
  if (a.cat !== b.cat) return a.cat.localeCompare(b.cat);
  if (a.price !== b.price) return a.price - b.price;
  return b.rating - a.rating;
});

let lastCat = "";
for (const item of sorted) {
  if (item.cat !== lastCat) {
    console.log(`\n  [${item.cat}]`);
    lastCat = item.cat;
  }
  console.log(`    Rs.${item.price} Rating:${item.rating} ${item.name}`);
}
console.log();

// WHY stability matters here:
// Because JS .sort() uses TimSort (which is stable), when two items
// have the same category, their relative price ordering is preserved
// from the secondary sort criterion. An unstable sort could scramble them.

// ============================================================
// EXAMPLE 10 — The Complete Sorting Landscape
// Story: A senior engineer at Flipkart creates a reference card
//   for the team. Every algorithm has its niche. The art of
//   engineering is choosing the right one for each situation.
// ============================================================

// WHY: Having this mental model lets you make informed decisions.
// Most of the time, JS .sort() (TimSort) is the right answer.
// But knowing alternatives lets you optimize when it matters.

console.log("=== The Complete Sorting Landscape ===");
console.log("| Algorithm  | Best     | Average  | Worst    | Space  | Stable |");
console.log("|------------|----------|----------|----------|--------|--------|");
console.log("| Bubble     | O(n)     | O(n^2)   | O(n^2)   | O(1)   | Yes    |");
console.log("| Selection  | O(n^2)   | O(n^2)   | O(n^2)   | O(1)   | No     |");
console.log("| Insertion  | O(n)     | O(n^2)   | O(n^2)   | O(1)   | Yes    |");
console.log("| Merge Sort | O(nlogn) | O(nlogn) | O(nlogn) | O(n)   | Yes    |");
console.log("| Quick Sort | O(nlogn) | O(nlogn) | O(n^2)*  | O(logn)| No     |");
console.log("| Counting   | O(n+k)   | O(n+k)   | O(n+k)   | O(n+k) | Yes    |");
console.log("| Radix      | O(dn)    | O(dn)    | O(dn)    | O(n+k) | Yes    |");
console.log("| JS .sort() | O(n)     | O(nlogn) | O(nlogn) | O(n)   | Yes    |");
console.log("* avoidable with random/median-of-three pivot");
console.log();

// The O(n log n) lower bound:
// Any comparison-based sort MUST make at least O(n log n) comparisons.
// This is proven by the decision tree model: n! possible orderings
// require log2(n!) = O(n log n) comparisons to distinguish.
// Non-comparison sorts (counting, radix, bucket) bypass this by
// using the actual values, not just comparisons between pairs.

// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. Merge Sort: O(n log n) always, stable, O(n) space. Best for
//    linked lists and external sorting.
// 2. Quick Sort: O(n log n) avg, in-place O(log n), cache-friendly.
//    Use random pivot to avoid O(n^2). NOT stable.
// 3. Lomuto: simpler. Hoare: ~3x fewer swaps, more efficient.
// 4. Counting Sort: O(n+k) for integers in known range.
// 5. Radix Sort: O(d*(n+k)), digit-by-digit using counting sort.
// 6. O(n log n) lower bound applies ONLY to comparison sorts.
// 7. Stability matters for multi-key sorting. Merge sort and
//    counting sort are stable; quick sort is NOT.
// 8. In practice: JS .sort() (TimSort) handles most cases well.
//    Understand the internals so you know WHEN it might not
//    be the best choice (e.g., integer arrays -> counting sort).

console.log("=== FILE 10 COMPLETE ===");
