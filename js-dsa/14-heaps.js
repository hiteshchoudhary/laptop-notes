// ============================================================
// FILE 14: HEAPS AND PRIORITY QUEUES
// Topic: Min-Heap, Max-Heap, Heap Sort, and Priority Queue Problems
// WHY: Heaps power the "give me the minimum/maximum instantly"
//      pattern. Swiggy assigns delivery partners by always picking
//      the nearest available — a min-heap gives the minimum in
//      O(1) and rebalances in O(log n). Without heaps, every
//      assignment would require sorting the entire list.
// ============================================================

// ============================================================
// EXAMPLE 1 — What is a Heap? Swiggy's Delivery Assignment
// Story: Swiggy operates in 500+ Indian cities with 300K+
//        delivery partners. When a new order comes in, the system
//        must instantly find the nearest available partner. A
//        min-heap of partner distances gives the closest partner
//        in O(1), and when that partner becomes unavailable,
//        extracting the minimum and rebalancing takes O(log n).
//        Checking all partners linearly would be O(n) per order.
// ============================================================

// WHY: A heap is a COMPLETE binary tree stored as an ARRAY.
// Min-Heap: parent <= children (root = minimum)
// Max-Heap: parent >= children (root = maximum)
// For node at index i: Parent = floor((i-1)/2), Left = 2i+1, Right = 2i+2

// Visual:
//         10          (index 0)
//        /  \
//       20   30       (index 1, 2)
//      / \   / \
//     40 50 60 70     (index 3, 4, 5, 6)
//
// Array: [10, 20, 30, 40, 50, 60, 70]

console.log('=== HEAP ARRAY REPRESENTATION ===');
const heapArray = [10, 20, 30, 40, 50, 60, 70];
console.log('Heap array:', heapArray);
console.log('Root (min):', heapArray[0]);                      // 10
console.log('Parent of index 4:', heapArray[Math.floor((4 - 1) / 2)]); // 20
console.log('Left child of index 1:', heapArray[2 * 1 + 1]);  // 40
console.log('Right child of index 1:', heapArray[2 * 1 + 2]); // 50


// ============================================================
// EXAMPLE 2 — MinHeap Class Implementation
// Story: Swiggy's engineering team in Bangalore built a MinHeap
//        to manage delivery partner distances. The insert method
//        adds a new partner (bubble up to maintain order). The
//        extractMin method assigns the closest partner (remove
//        root, bubble down to restore heap). This runs millions
//        of times per day across all cities.
// ============================================================

// WHY: Every heap operation depends on two primitives: bubble up and bubble down.

class MinHeap {
  constructor() {
    this.heap = [];
  }

  // --- Helper methods ---
  size() { return this.heap.length; }
  isEmpty() { return this.heap.length === 0; }

  _parentIndex(i) { return Math.floor((i - 1) / 2); }
  _leftChildIndex(i) { return 2 * i + 1; }
  _rightChildIndex(i) { return 2 * i + 2; }

  _swap(i, j) {
    [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
  }

  // --- PEEK: Return minimum without removing ---
  // Big-O: O(1) — root is always the minimum
  peek() {
    if (this.isEmpty()) return null;
    return this.heap[0];
  }

  // --- INSERT: Add element and bubble up ---
  // Big-O: O(log n) — at most traverse from leaf to root (height of tree)
  insert(value) {
    this.heap.push(value);           // Add to the end (next available leaf)
    this._bubbleUp(this.heap.length - 1);  // Restore heap property
  }

  _bubbleUp(index) {
    // While not at root AND parent is LARGER than current
    while (index > 0) {
      const parentIdx = this._parentIndex(index);

      if (this.heap[parentIdx] <= this.heap[index]) break; // Heap property satisfied

      this._swap(parentIdx, index);  // Swap with parent
      index = parentIdx;              // Move up
    }
  }

  // --- EXTRACT MIN: Remove and return minimum ---
  // Big-O: O(log n) — at most traverse from root to leaf
  extractMin() {
    if (this.isEmpty()) return null;
    if (this.size() === 1) return this.heap.pop();

    const min = this.heap[0];              // Save the minimum
    this.heap[0] = this.heap.pop();        // Move last element to root
    this._bubbleDown(0);                   // Restore heap property

    return min;
  }

  _bubbleDown(index) {
    const length = this.heap.length;

    while (true) {
      let smallest = index;
      const leftIdx = this._leftChildIndex(index);
      const rightIdx = this._rightChildIndex(index);

      // Check if left child is smaller
      if (leftIdx < length && this.heap[leftIdx] < this.heap[smallest]) {
        smallest = leftIdx;
      }

      // Check if right child is even smaller
      if (rightIdx < length && this.heap[rightIdx] < this.heap[smallest]) {
        smallest = rightIdx;
      }

      // If smallest is still the current node, heap property is satisfied
      if (smallest === index) break;

      this._swap(index, smallest);
      index = smallest;  // Move down
    }
  }

  // --- Display the heap ---
  toArray() { return [...this.heap]; }
}

// --- Demo ---
console.log('\n=== MINHEAP OPERATIONS ===');
const minHeap = new MinHeap();

// Swiggy delivery partner distances (in km)
const distances = [4.5, 2.1, 7.3, 1.8, 5.6, 3.2, 6.0];
console.log('Inserting distances:', distances);

distances.forEach(d => minHeap.insert(d));
console.log('Heap after insertions:', minHeap.toArray());
console.log('Peek (nearest partner):', minHeap.peek()); // 1.8

console.log('\nExtracting partners in order (nearest first):');
while (!minHeap.isEmpty()) {
  console.log('  Assigned partner at', minHeap.extractMin(), 'km');
}
// 1.8, 2.1, 3.2, 4.5, 5.6, 6.0, 7.3 — sorted!


// ============================================================
// EXAMPLE 3 — Heapify: Convert Array to Heap in O(n)
// Story: When Swiggy's system restarts, it loads all 300K partner
//        distances from the database into an array. Converting
//        this array into a heap using individual inserts would be
//        O(n log n). But heapify does it in O(n) by starting from
//        the last non-leaf node and bubbling down. This saves
//        precious startup time in production.
// ============================================================

// WHY: Heapify is O(n), NOT O(n log n) — most nodes are near the bottom
// and need very few swaps.

function heapify(arr) {
  const n = arr.length;

  // Start from the last non-leaf node and work backwards
  // Last non-leaf index = Math.floor(n / 2) - 1
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    bubbleDown(arr, i, n);
  }

  return arr;
}

function bubbleDown(arr, index, length) {
  while (true) {
    let smallest = index;
    const left = 2 * index + 1;
    const right = 2 * index + 2;

    if (left < length && arr[left] < arr[smallest]) smallest = left;
    if (right < length && arr[right] < arr[smallest]) smallest = right;

    if (smallest === index) break;

    [arr[index], arr[smallest]] = [arr[smallest], arr[index]];
    index = smallest;
  }
}

// Big-O: O(n) — NOT O(n log n)

console.log('\n=== HEAPIFY: ARRAY TO HEAP ===');
const rawDistances = [5.6, 3.2, 7.3, 1.8, 4.5, 2.1, 6.0];
console.log('Before heapify:', rawDistances);
heapify(rawDistances);
console.log('After heapify: ', rawDistances);
console.log('Root (min):    ', rawDistances[0]); // 1.8


// ============================================================
// EXAMPLE 4 — Heap Sort: O(n log n) In-Place Sorting
// Story: Swiggy needs to generate a daily report of all delivery
//        times sorted from fastest to slowest. Heap sort builds
//        a max-heap and repeatedly extracts the maximum, placing
//        it at the end. Unlike merge sort, it uses O(1) extra
//        space. Unlike quicksort, it guarantees O(n log n) worst case.
// ============================================================

// WHY: Only comparison sort that is O(n log n) worst case AND in-place O(1).

function heapSort(arr) {
  const n = arr.length;

  // Step 1: Build a MAX-heap (for ascending sort)
  // Big-O: O(n) using heapify
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    bubbleDownMax(arr, i, n);
  }

  // Step 2: Extract max n times, place at end — O(n log n)
  for (let i = n - 1; i > 0; i--) {
    // Swap root (max) with the last unsorted element
    [arr[0], arr[i]] = [arr[i], arr[0]];

    // Bubble down new root within the reduced heap
    bubbleDownMax(arr, 0, i);
  }

  return arr;
}

function bubbleDownMax(arr, index, length) {
  while (true) {
    let largest = index;
    const left = 2 * index + 1;
    const right = 2 * index + 2;

    if (left < length && arr[left] > arr[largest]) largest = left;
    if (right < length && arr[right] > arr[largest]) largest = right;

    if (largest === index) break;

    [arr[index], arr[largest]] = [arr[largest], arr[index]];
    index = largest;
  }
}

// Big-O: Time O(n log n) guaranteed, Space O(1) in-place, Not stable

console.log('\n=== HEAP SORT ===');
const deliveryTimes = [23, 8, 45, 12, 5, 34, 18, 2, 30, 15];
console.log('Before sorting:', [...deliveryTimes]);
heapSort(deliveryTimes);
console.log('After sorting: ', deliveryTimes);
// [2, 5, 8, 12, 15, 18, 23, 30, 34, 45]


// ============================================================
// EXAMPLE 5 — Priority Queue: Heap's Most Common Application
// Story: Zomato's order management system processes orders by
//        priority: Zomato Pro users get priority 1 (highest),
//        regular users get priority 3 (lowest). A priority queue
//        ensures higher-priority orders are processed first,
//        regardless of when they arrived. The heap ensures O(log n)
//        enqueue and O(log n) dequeue.
// ============================================================

// WHY: Each element has a priority. Heap is the standard implementation:
// O(1) peek, O(log n) insert, O(log n) extract.

class PriorityQueue {
  constructor() {
    this.heap = []; // Each element: { value, priority }
  }

  size() { return this.heap.length; }
  isEmpty() { return this.heap.length === 0; }

  // Lower number = higher priority (min-heap on priority)
  _compare(i, j) {
    return this.heap[i].priority - this.heap[j].priority;
  }

  _swap(i, j) {
    [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
  }

  // --- ENQUEUE: Add with priority ---
  // Big-O: O(log n)
  enqueue(value, priority) {
    this.heap.push({ value, priority });
    this._bubbleUp(this.heap.length - 1);
  }

  _bubbleUp(index) {
    while (index > 0) {
      const parentIdx = Math.floor((index - 1) / 2);
      if (this._compare(parentIdx, index) <= 0) break;
      this._swap(parentIdx, index);
      index = parentIdx;
    }
  }

  // --- DEQUEUE: Remove highest priority (lowest number) ---
  // Big-O: O(log n)
  dequeue() {
    if (this.isEmpty()) return null;
    if (this.size() === 1) return this.heap.pop();

    const top = this.heap[0];
    this.heap[0] = this.heap.pop();
    this._bubbleDown(0);

    return top;
  }

  _bubbleDown(index) {
    const length = this.heap.length;

    while (true) {
      let smallest = index;
      const left = 2 * index + 1;
      const right = 2 * index + 2;

      if (left < length && this._compare(left, smallest) < 0) smallest = left;
      if (right < length && this._compare(right, smallest) < 0) smallest = right;

      if (smallest === index) break;

      this._swap(index, smallest);
      index = smallest;
    }
  }

  // --- PEEK: See highest priority without removing ---
  // Big-O: O(1)
  peek() {
    return this.isEmpty() ? null : this.heap[0];
  }
}

// --- Demo ---
console.log('\n=== PRIORITY QUEUE ===');
const orderQueue = new PriorityQueue();

// Zomato orders: lower priority number = process first
orderQueue.enqueue('Order #101 (Regular)', 3);
orderQueue.enqueue('Order #102 (Pro)', 1);
orderQueue.enqueue('Order #103 (Regular)', 3);
orderQueue.enqueue('Order #104 (Gold)', 2);
orderQueue.enqueue('Order #105 (Pro)', 1);

console.log('Processing orders by priority:');
while (!orderQueue.isEmpty()) {
  const order = orderQueue.dequeue();
  console.log(`  Priority ${order.priority}: ${order.value}`);
}
// Pro orders first, then Gold, then Regular


// ============================================================
// EXAMPLE 6 — Problem: Kth Largest Element
// Story: Myntra wants to find the Kth most expensive item in
//        their catalogue without fully sorting 10M+ items. A
//        min-heap of size K gives the answer efficiently: the
//        root of a size-K min-heap is the Kth largest element.
// ============================================================

// WHY: Min-heap of size K gives O(n log K) — much faster than sorting O(n log n).

function kthLargest(arr, k) {
  const heap = new MinHeap();

  for (const num of arr) {
    heap.insert(num);

    // Keep only K elements in the heap
    if (heap.size() > k) {
      heap.extractMin();  // Remove smallest — we want K largest
    }
  }

  // Root of min-heap of size K = Kth largest
  return heap.peek();
}

// Big-O: O(n log k) — n insertions/extractions on a heap of size k

console.log('\n=== KTH LARGEST ELEMENT ===');
const prices = [3, 2, 1, 5, 6, 4, 8, 7, 10, 9];
console.log('Array:', prices);
console.log('1st largest:', kthLargest(prices, 1)); // 10
console.log('3rd largest:', kthLargest(prices, 3)); // 8
console.log('5th largest:', kthLargest(prices, 5)); // 6


// ============================================================
// EXAMPLE 7 — Problem: Top K Frequent Elements
// Story: Flipkart's trending section shows the top K most searched
//        products. They count frequencies with a Map, then use a
//        min-heap of size K to efficiently extract the top K
//        without sorting all frequencies.
// ============================================================

// WHY: Heap of size K reduces from O(n log n) to O(n log K).

function topKFrequent(arr, k) {
  // Count frequencies — O(n)
  const freqMap = new Map();
  for (const item of arr) {
    freqMap.set(item, (freqMap.get(item) || 0) + 1);
  }

  // Min-heap of size K on frequencies
  const pq = new PriorityQueue();

  for (const [item, freq] of freqMap) {
    pq.enqueue(item, freq);  // Priority = frequency (lower freq = higher priority in min-heap)

    if (pq.size() > k) pq.dequeue();
  }

  const result = [];
  while (!pq.isEmpty()) {
    result.push(pq.dequeue().value);
  }

  return result.reverse(); // Most frequent first
}

// Big-O: O(n log k)

console.log('\n=== TOP K FREQUENT ELEMENTS ===');
const searches = ['iphone', 'samsung', 'iphone', 'pixel', 'samsung', 'iphone',
                  'oneplus', 'samsung', 'pixel', 'iphone', 'oneplus'];
console.log('Searches:', searches);
console.log('Top 2 frequent:', topKFrequent(searches, 2)); // ['iphone', 'samsung']


// ============================================================
// EXAMPLE 8 — Problem: Merge K Sorted Arrays
// Story: Swiggy pulls delivery data from K different city databases,
//        each already sorted by delivery time. Merging K sorted
//        arrays into one sorted array using a min-heap takes
//        O(N log K) where N = total elements — far better than
//        concatenating and sorting (O(N log N)).
// ============================================================

// WHY: Min-heap gives smallest among K candidates. Each op is O(log K).

function mergeKSortedArrays(arrays) {
  const result = [];
  const pq = new PriorityQueue();

  // Initialize: add first element of each array to the heap
  for (let i = 0; i < arrays.length; i++) {
    if (arrays[i].length > 0) {
      // Store: { arrayIndex, elementIndex } as value, actual number as priority
      pq.enqueue({ arrayIdx: i, elemIdx: 0 }, arrays[i][0]);
    }
  }

  // Process: extract min, add next element from same array
  while (!pq.isEmpty()) {
    const { value: info, priority: val } = pq.dequeue();
    result.push(val);

    const nextElemIdx = info.elemIdx + 1;
    if (nextElemIdx < arrays[info.arrayIdx].length) {
      pq.enqueue(
        { arrayIdx: info.arrayIdx, elemIdx: nextElemIdx },
        arrays[info.arrayIdx][nextElemIdx]
      );
    }
  }

  return result;
}

// Big-O: O(N log K) where N = total elements, K = number of arrays

console.log('\n=== MERGE K SORTED ARRAYS ===');
const sortedArrays = [
  [1, 4, 7, 10],
  [2, 5, 8, 11],
  [3, 6, 9, 12]
];
console.log('Input arrays:', sortedArrays);
console.log('Merged:', mergeKSortedArrays(sortedArrays));
// [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]



// ============================================================
// EXAMPLE 9 — Problem: Median of a Data Stream
// Story: Swiggy tracks real-time delivery times. As each delivery
//        completes, they need the MEDIAN delivery time. A naive
//        approach (sort after each insertion) is O(n log n) per
//        update. Using two heaps — a max-heap for the lower half
//        and a min-heap for the upper half — gives O(log n) per
//        insertion and O(1) for the median.
// ============================================================

// WHY: Two heaps working together solve the dynamic median problem.

class MaxHeap {
  constructor() {
    this.heap = [];
  }

  size() { return this.heap.length; }
  isEmpty() { return this.heap.length === 0; }
  peek() { return this.isEmpty() ? null : this.heap[0]; }

  insert(value) {
    this.heap.push(value);
    this._bubbleUp(this.heap.length - 1);
  }

  _bubbleUp(index) {
    while (index > 0) {
      const parentIdx = Math.floor((index - 1) / 2);
      if (this.heap[parentIdx] >= this.heap[index]) break;
      [this.heap[parentIdx], this.heap[index]] = [this.heap[index], this.heap[parentIdx]];
      index = parentIdx;
    }
  }

  extractMax() {
    if (this.isEmpty()) return null;
    if (this.size() === 1) return this.heap.pop();
    const max = this.heap[0];
    this.heap[0] = this.heap.pop();
    this._bubbleDown(0);
    return max;
  }

  _bubbleDown(index) {
    const length = this.heap.length;
    while (true) {
      let largest = index;
      const left = 2 * index + 1;
      const right = 2 * index + 2;
      if (left < length && this.heap[left] > this.heap[largest]) largest = left;
      if (right < length && this.heap[right] > this.heap[largest]) largest = right;
      if (largest === index) break;
      [this.heap[index], this.heap[largest]] = [this.heap[largest], this.heap[index]];
      index = largest;
    }
  }
}

class MedianFinder {
  constructor() {
    this.maxHeap = new MaxHeap();  // Lower half (stores smaller values)
    this.minHeap = new MinHeap();  // Upper half (stores larger values)
  }

  // --- ADD NUMBER ---
  // Big-O: O(log n)
  addNum(num) {
    // Step 1: Add to appropriate heap
    if (this.maxHeap.isEmpty() || num <= this.maxHeap.peek()) {
      this.maxHeap.insert(num);  // Goes to lower half
    } else {
      this.minHeap.insert(num);  // Goes to upper half
    }

    // Step 2: Balance heaps (sizes differ by at most 1)
    if (this.maxHeap.size() > this.minHeap.size() + 1) {
      this.minHeap.insert(this.maxHeap.extractMax());
    } else if (this.minHeap.size() > this.maxHeap.size()) {
      this.maxHeap.insert(this.minHeap.extractMin());
    }
  }

  // --- FIND MEDIAN ---
  // Big-O: O(1)
  findMedian() {
    if (this.maxHeap.size() > this.minHeap.size()) {
      return this.maxHeap.peek();  // Odd count: median is the extra element
    }
    return (this.maxHeap.peek() + this.minHeap.peek()) / 2;  // Even count: average
  }
}

// --- Demo ---
console.log('\n=== MEDIAN OF DATA STREAM ===');
const medianFinder = new MedianFinder();
const deliveryStream = [15, 8, 23, 12, 30, 5, 18, 25, 10, 20];

console.log('Delivery times arriving one by one:');
for (const time of deliveryStream) {
  medianFinder.addNum(time);
  console.log(`  Added ${time} → Median: ${medianFinder.findMedian()}`);
}

// Final median: (15 + 18) / 2 = 16.5


// ============================================================
// EXAMPLE 10 — Comparison: When to Use Which Data Structure
// Story: During Swiggy's system design review, the CTO asked
//        the team to justify their data structure choices. Here
//        is the cheat sheet they prepared for heap vs other
//        structures.
// ============================================================

console.log('\n=== WHEN TO USE HEAP ===');
console.log('Use Heap: repeated min/max extraction, priority queue, Top K, merge K sorted');
console.log('Do NOT use Heap: arbitrary search (use BST/hash), sorted traversal (use BST)');
console.log('Heap peek O(1), insert O(log n), extract O(log n), build O(n)');


// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. A Heap is a complete binary tree stored as an array.
//    Min-Heap: parent <= children. Max-Heap: parent >= children.
// 2. Array indices: Parent = floor((i-1)/2), Left = 2i+1, Right = 2i+2.
// 3. Core operations:
//    - peek():       O(1)     — return root
//    - insert():     O(log n) — add to end, bubble up
//    - extractMin(): O(log n) — remove root, move last to root, bubble down
// 4. Heapify: convert array to heap in O(n), NOT O(n log n).
//    Start from last non-leaf, bubble down each node.
// 5. Heap Sort: build max-heap O(n), extract max n times O(n log n).
//    In-place, O(1) space, but not stable.
// 6. Priority Queue: heap is the standard implementation.
//    Enqueue O(log n), Dequeue O(log n), Peek O(1).
// 7. Kth Largest: maintain min-heap of size K. Root = Kth largest.
//    O(n log K) time.
// 8. Top K Frequent: frequency map + min-heap of size K. O(n log K).
// 9. Merge K Sorted: min-heap of K elements, extract-insert cycle.
//    O(N log K) where N = total elements.
// 10. Streaming Median: max-heap (lower half) + min-heap (upper half).
//     Insert O(log n), median O(1).
// ============================================================

console.log('\n=== ALL HEAP EXAMPLES COMPLETE ===');
