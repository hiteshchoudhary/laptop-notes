// ============================================================
// FILE 07: LINKED LISTS — SINGLY, DOUBLY, AND CLASSIC PROBLEMS
// Topic: Linked list data structures and pointer manipulation
// WHY: Linked lists teach pointer-based thinking essential for
//   trees, graphs, and low-level memory management. Understanding
//   node-based structures unlocks the rest of DSA.
// ============================================================

// ============================================================
// EXAMPLE 1 — Spotify India Playlist
// Story: Spotify India's playlist is a linked list. Each song
//   is a node pointing to the next track. Users can insert a
//   new song between two tracks, remove a song, or skip ahead
//   — all without shifting an entire array of 500 songs.
// ============================================================

// WHY: Arrays require shifting O(n) elements on insert/delete.
// Linked lists only need to update a few pointers — O(1) if you
// have a reference to the node. This trade-off matters when
// insertions and deletions are frequent.

// --- Linked List vs Array Trade-offs ---
//
// | Operation          | Array      | Linked List        |
// |--------------------|------------|---------------------|
// | Access by index    | O(1)       | O(n) — must traverse |
// | Insert at start    | O(n)       | O(1) — update head   |
// | Insert at end      | O(1)*      | O(1) with tail ptr   |
// | Insert at middle   | O(n)       | O(1) if have node    |
// | Delete at start    | O(n)       | O(1) — update head   |
// | Delete at middle   | O(n)       | O(1) if have node    |
// | Search             | O(n)       | O(n) — must traverse |
// | Cache friendliness | Excellent  | Poor                 |
// * amortized for dynamic arrays

// ============================================================
// EXAMPLE 2 — Singly Linked List (Full Implementation)
// Story: PhonePe builds a transaction history feature. Each
//   transaction is a node pointing to the next (older) one.
//   Users scroll from newest to oldest — a singly linked list.
// ============================================================

// WHY: A singly linked list is the simplest node-based structure.
// It is the foundation for stacks, queues, hash table chaining,
// and adjacency lists in graphs.

// --- What is a Linked List? ---
// A linked list is a sequence of nodes where each node contains:
//   1. A value (the data)
//   2. A pointer to the next node (or null if it is the last)
//
// Unlike arrays, linked list nodes are NOT stored in contiguous memory.
// Each node is a separate object on the heap, connected by references.
//
// Visual representation:
//   head → [value|next] → [value|next] → [value|next] → null
//   Each box is a node. The arrow is the `next` pointer.

// --- Node Class ---
class SLLNode {
  constructor(value) {
    this.value = value;  // the data stored in this node
    this.next = null;    // pointer to next node (null if last)
  }
}

class SinglyLinkedList {
  constructor() { this.head = null; this._size = 0; }

  // append: add to end — O(n) because we must traverse to find the tail
  // (Could be O(1) with a tail pointer, but keeping it simple here)
  append(value) {
    const newNode = new SLLNode(value);
    if (!this.head) {
      this.head = newNode; // first node becomes head
    } else {
      let current = this.head;
      while (current.next) {  // traverse to last node — O(n)
        current = current.next;
      }
      current.next = newNode; // link last node to new node
    }
    this._size++;
    return this; // enable chaining: list.append(1).append(2)
  }

  // prepend: add to front — O(1)
  // New node's next points to current head, then new node becomes head
  prepend(value) {
    const newNode = new SLLNode(value);
    newNode.next = this.head; // new node points to old head
    this.head = newNode;      // new node becomes the head
    this._size++;
    return this;
  }

  // insertAt: insert at specific index — O(n)
  // Traverse to node BEFORE insertion point, then rewire pointers
  insertAt(index, value) {
    if (index < 0 || index > this._size) {
      throw new RangeError(`Index ${index} out of bounds (size=${this._size})`);
    }
    if (index === 0) return this.prepend(value);

    const newNode = new SLLNode(value);
    let current = this.head;
    // traverse to the node BEFORE the insertion point
    for (let i = 0; i < index - 1; i++) {
      current = current.next;
    }
    newNode.next = current.next; // new node points to what was at index
    current.next = newNode;      // previous node points to new node
    this._size++;
    return this;
  }

  // removeAt: remove node at index — O(n)
  // For index 0: just move head forward
  // Otherwise: traverse to node before target, skip over target
  removeAt(index) {
    if (index < 0 || index >= this._size) {
      throw new RangeError(`Index ${index} out of bounds (size=${this._size})`);
    }
    let removedValue;
    if (index === 0) {
      removedValue = this.head.value;
      this.head = this.head.next; // head moves to next node
    } else {
      let current = this.head;
      for (let i = 0; i < index - 1; i++) {
        current = current.next;
      }
      removedValue = current.next.value;
      current.next = current.next.next; // skip over removed node
    }
    this._size--;
    return removedValue;
  }

  // removeValue: remove first occurrence of value — O(n)
  // Handles special case of head removal, then traverses to find value
  removeValue(value) {
    if (!this.head) return false;
    if (this.head.value === value) {
      this.head = this.head.next;
      this._size--;
      return true;
    }
    let current = this.head;
    while (current.next) {
      if (current.next.value === value) {
        current.next = current.next.next; // skip the node with matching value
        this._size--;
        return true;
      }
      current = current.next;
    }
    return false; // value not found
  }

  // get: access by index — O(n), must traverse from head
  get(index) {
    if (index < 0 || index >= this._size) return undefined;
    let current = this.head;
    for (let i = 0; i < index; i++) current = current.next;
    return current.value;
  }

  // contains: check if value exists — O(n) traversal
  contains(value) {
    let current = this.head;
    while (current) {
      if (current.value === value) return true;
      current = current.next;
    }
    return false;
  }

  // indexOf: find index of first occurrence — O(n)
  indexOf(value) {
    let current = this.head;
    let index = 0;
    while (current) {
      if (current.value === value) return index;
      current = current.next;
      index++;
    }
    return -1; // not found
  }

  // toArray: convert linked list to array — O(n)
  toArray() {
    const result = [];
    let current = this.head;
    while (current) {
      result.push(current.value);
      current = current.next;
    }
    return result;
  }

  // print: display the list with arrows — O(n)
  print() {
    console.log(this.toArray().join(" -> ") + " -> null");
  }

  // size — O(1), we maintain a counter
  size() {
    return this._size;
  }
}

// Big-O Summary for SinglyLinkedList:
// append:      O(n) [O(1) with tail pointer]
// prepend:     O(1)
// insertAt:    O(n)
// removeAt:    O(n)
// removeValue: O(n)
// get:         O(n)
// contains:    O(n)
// indexOf:     O(n)
// Space:       O(n)

console.log("=== Singly Linked List (Spotify Playlist) ===");
const playlist = new SinglyLinkedList();
playlist.append("Tum Hi Ho").append("Chaiyya Chaiyya").append("Kal Ho Naa Ho");
playlist.print(); // Tum Hi Ho -> Chaiyya Chaiyya -> Kal Ho Naa Ho -> null

playlist.prepend("Kun Faya Kun");
playlist.insertAt(2, "Jai Ho");
playlist.print(); // Kun Faya Kun -> Tum Hi Ho -> Jai Ho -> Chaiyya Chaiyya -> Kal Ho Naa Ho -> null

console.log("Removed:", playlist.removeAt(2)); // Jai Ho
console.log("Song at index 1:", playlist.get(1)); // Tum Hi Ho
console.log("Contains 'Chaiyya Chaiyya':", playlist.contains("Chaiyya Chaiyya")); // true
console.log("Index of 'Kal Ho Naa Ho':", playlist.indexOf("Kal Ho Naa Ho")); // 2
console.log("Playlist size:", playlist.size()); // 4
console.log();

// ============================================================
// EXAMPLE 3 — Doubly Linked List
// Story: Amazon India's product comparison lets users navigate
//   back and forth between products. Each node has next + prev
//   pointers, enabling O(1) traversal in both directions.
// ============================================================

// WHY: DLL allows O(1) removal if you have the node reference
// (no need to find the previous node). removeLast is O(1) with
// tail pointer — impossible in SLL without traversal.

class DLLNode {
  constructor(value) { this.value = value; this.next = null; this.prev = null; }
}

class DoublyLinkedList {
  constructor() { this.head = null; this.tail = null; this._size = 0; }

  append(value) { // O(1) — tail pointer
    const node = new DLLNode(value);
    if (!this.head) { this.head = node; this.tail = node; }
    else { node.prev = this.tail; this.tail.next = node; this.tail = node; }
    this._size++; return this;
  }

  prepend(value) { // O(1)
    const node = new DLLNode(value);
    if (!this.head) { this.head = node; this.tail = node; }
    else { node.next = this.head; this.head.prev = node; this.head = node; }
    this._size++; return this;
  }

  // insertAt: O(n) — optimized to start from closer end
  insertAt(index, value) {
    if (index < 0 || index > this._size) throw new RangeError("Out of bounds");
    if (index === 0) return this.prepend(value);
    if (index === this._size) return this.append(value);
    const node = new DLLNode(value);
    let current;
    if (index <= this._size / 2) {
      current = this.head;
      for (let i = 0; i < index; i++) current = current.next;
    } else {
      current = this.tail;
      for (let i = this._size - 1; i > index; i--) current = current.prev;
    }
    node.next = current; node.prev = current.prev;
    current.prev.next = node; current.prev = node;
    this._size++; return this;
  }

  removeFirst() { // O(1)
    if (!this.head) return undefined;
    const val = this.head.value;
    if (this.head === this.tail) { this.head = null; this.tail = null; }
    else { this.head = this.head.next; this.head.prev = null; }
    this._size--; return val;
  }

  removeLast() { // O(1) — DLL advantage over SLL!
    if (!this.tail) return undefined;
    const val = this.tail.value;
    if (this.head === this.tail) { this.head = null; this.tail = null; }
    else { this.tail = this.tail.prev; this.tail.next = null; }
    this._size--; return val;
  }

  get(index) { // O(n) — starts from closer end
    if (index < 0 || index >= this._size) return undefined;
    let c;
    if (index <= this._size / 2) { c = this.head; for (let i = 0; i < index; i++) c = c.next; }
    else { c = this.tail; for (let i = this._size - 1; i > index; i--) c = c.prev; }
    return c.value;
  }

  toArray() { const r = []; let c = this.head; while (c) { r.push(c.value); c = c.next; } return r; }
  printForward()  { console.log("Forward:  null <- " + this.toArray().join(" <-> ") + " -> null"); }
  printBackward() {
    const r = []; let c = this.tail; while (c) { r.push(c.value); c = c.prev; }
    console.log("Backward: null <- " + r.join(" <-> ") + " -> null");
  }
  size() { return this._size; }
}

// Big-O Summary for DoublyLinkedList:
// append:      O(1) — tail pointer
// prepend:     O(1)
// removeFirst: O(1)
// removeLast:  O(1) — DLL advantage over SLL! SLL needs O(n) for this
// insertAt:    O(n) — optimized to traverse from closer end
// get:         O(n) — optimized to traverse from closer end
// Space:       O(n) — extra prev pointer per node adds memory overhead

console.log("=== Doubly Linked List (Amazon Product Comparison) ===");
const products = new DoublyLinkedList();
products.append("iPhone 15").append("Samsung S24").append("OnePlus 12").append("Pixel 8");
products.printForward();
// Forward:  null <- iPhone 15 <-> Samsung S24 <-> OnePlus 12 <-> Pixel 8 -> null
products.printBackward();
// Backward: null <- Pixel 8 <-> OnePlus 12 <-> Samsung S24 <-> iPhone 15 -> null

products.prepend("Nothing Phone 2");
console.log("After prepend 'Nothing Phone 2':");
products.printForward();

console.log("Removed last:", products.removeLast()); // Pixel 8
console.log("Removed first:", products.removeFirst()); // Nothing Phone 2
products.printForward(); // iPhone 15 <-> Samsung S24 <-> OnePlus 12
console.log("Size:", products.size()); // 3
console.log();

// ============================================================
// CLASSIC PROBLEM 1 — Reverse a Linked List (Iterative)
// Story: IRCTC shows train stops origin to destination. A user
//   wants the return journey — same stops, reversed. We flip
//   next pointers using prev/curr/next in O(n) time, O(1) space.
// ============================================================

// WHY: The most fundamental pointer manipulation problem.
// Visualization:
// Before: A -> B -> C -> D -> null
// Step 1: null <- A    B -> C -> D
// Step 2: null <- A <- B    C -> D
// Step 3: null <- A <- B <- C    D
// Step 4: null <- A <- B <- C <- D  (D is new head)

function reverseLinkedList(head) {
  let prev = null, curr = head, next = null;
  while (curr !== null) {
    next = curr.next;  // save next
    curr.next = prev;  // reverse pointer
    prev = curr;       // advance prev
    curr = next;       // advance curr
  }
  return prev; // new head
}

console.log("=== Problem 1: Reverse a Linked List ===");
const trainStops = new SinglyLinkedList();
trainStops.append("Delhi").append("Agra").append("Jhansi").append("Bhopal").append("Chennai");
console.log("Original:"); trainStops.print();
trainStops.head = reverseLinkedList(trainStops.head);
console.log("Reversed:"); trainStops.print();
console.log();

// ============================================================
// CLASSIC PROBLEM 2 — Detect Cycle (Floyd's Tortoise and Hare)
// Story: Swiggy's routing must detect if a route loops. Floyd's
//   uses slow (1 step) and fast (2 steps) pointers. If they
//   meet, a cycle exists. O(n) time, O(1) space.
// ============================================================

function hasCycle(head) {
  if (!head || !head.next) return false;
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) return true; // cycle detected!
  }
  return false;
}

console.log("=== Problem 2: Detect Cycle (Floyd's Algorithm) ===");
const noCycle = new SLLNode(1);
noCycle.next = new SLLNode(2); noCycle.next.next = new SLLNode(3);
console.log("1->2->3->null has cycle?", hasCycle(noCycle)); // false

const withCycle = new SLLNode(1);
withCycle.next = new SLLNode(2); withCycle.next.next = new SLLNode(3);
withCycle.next.next.next = new SLLNode(4);
withCycle.next.next.next.next = withCycle.next; // 4 -> 2 (cycle!)
console.log("1->2->3->4->(2) has cycle?", hasCycle(withCycle)); // true
console.log();

// ============================================================
// CLASSIC PROBLEM 3 — Find Middle Node
// Story: BookMyShow's waitlist: find the middle person using
//   slow/fast pointers in one pass. O(n) time, O(1) space.
// ============================================================

function findMiddle(head) {
  if (!head) return null;
  let slow = head, fast = head;
  while (fast && fast.next) { slow = slow.next; fast = fast.next.next; }
  return slow.value;
}

console.log("=== Problem 3: Find Middle Node ===");
const waitlist = new SinglyLinkedList();
waitlist.append("Arun").append("Bhavna").append("Chetan").append("Deepa").append("Esha");
waitlist.print();
console.log("Middle:", findMiddle(waitlist.head)); // Chetan
console.log();

// ============================================================
// CLASSIC PROBLEM 4 — Merge Two Sorted Linked Lists
// Story: Zomato merges two sorted restaurant lists from Google
//   and its own reviews. Two-pointer merge in O(n+m), O(1) space.
// ============================================================

function mergeSortedLists(h1, h2) {
  const dummy = new SLLNode(0);
  let curr = dummy;
  while (h1 && h2) {
    if (h1.value <= h2.value) { curr.next = h1; h1 = h1.next; }
    else { curr.next = h2; h2 = h2.next; }
    curr = curr.next;
  }
  curr.next = h1 || h2;
  return dummy.next;
}

console.log("=== Problem 4: Merge Two Sorted Lists ===");
const l1 = new SinglyLinkedList(); l1.append(1).append(3).append(5).append(7);
const l2 = new SinglyLinkedList(); l2.append(2).append(4).append(6).append(8);
console.log("List 1:"); l1.print();
console.log("List 2:"); l2.print();
const merged = mergeSortedLists(l1.head, l2.head);
let c = merged; const arr = [];
while (c) { arr.push(c.value); c = c.next; }
console.log("Merged:", arr.join(" -> ") + " -> null");
console.log();

// ============================================================
// CLASSIC PROBLEM 5 — Remove Nth Node from End
// Story: Paytm transaction history — delete Nth-from-last entry
//   using two pointers with n-gap in one pass. O(n), O(1).
// ============================================================

function removeNthFromEnd(head, n) {
  const dummy = new SLLNode(0); dummy.next = head;
  let fast = dummy, slow = dummy;
  for (let i = 0; i <= n; i++) fast = fast.next; // n+1 gap
  while (fast) { fast = fast.next; slow = slow.next; }
  console.log(`  Removing: ${slow.next.value}`);
  slow.next = slow.next.next;
  return dummy.next;
}

console.log("=== Problem 5: Remove Nth from End ===");
const txns = new SinglyLinkedList();
txns.append("TXN-100").append("TXN-200").append("TXN-300").append("TXN-400").append("TXN-500");
console.log("Before:"); txns.print();
txns.head = removeNthFromEnd(txns.head, 2); // removes TXN-400
console.log("After removing 2nd from end:"); txns.print();
console.log();

// ============================================================
// EXAMPLE 4 — When to Use Linked Lists
// Story: V8 optimizes arrays with hidden classes and inline
//   caches. For most JS use cases, arrays outperform linked
//   lists due to CPU cache friendliness.
// ============================================================

// WHY: Modern CPUs love contiguous memory (arrays) because of
// cache lines. Linked list nodes scatter across memory, causing
// cache misses. JS arrays handle most use cases well.
// But linked lists are better for specific use cases:

console.log("=== When to Use Linked Lists ===");
console.log("Use Arrays when:");
console.log("  - You need random access by index");
console.log("  - Mostly reading, rarely inserting/deleting in middle");
console.log("  - Cache performance matters (tight loops over data)");
console.log();
console.log("Use Linked Lists when:");
console.log("  - Frequent insert/delete at arbitrary positions");
console.log("  - You already have a reference to the node to operate on");
console.log("  - Building LRU cache (remove + insert at both ends)");
console.log("  - Undo/redo history (doubly linked list)");
console.log("  - Music playlists (insert/remove songs anywhere)");
console.log("  - Implementing stacks, queues, or hash table chaining");
console.log();
console.log("Why JS has no built-in LinkedList:");
console.log("  V8 optimizes arrays with hidden classes and inline caches.");
console.log("  For most JS use cases, arrays outperform linked lists.");
console.log("  Java has java.util.LinkedList; JS does not need one.");
console.log();

// ============================================================
// Big-O Summary of All Operations
// ============================================================
//
// --- Singly Linked List ---
// | Operation    | Time   | Notes                          |
// |------------- |--------|--------------------------------|
// | prepend      | O(1)   | update head                    |
// | append       | O(n)   | traverse to tail (O(1) w/tail) |
// | insertAt     | O(n)   | traverse to position           |
// | removeAt     | O(n)   | traverse to position           |
// | removeValue  | O(n)   | search + remove                |
// | get          | O(n)   | traverse                       |
// | contains     | O(n)   | traverse                       |
// | reverse      | O(n)   | three-pointer technique         |
// | find middle  | O(n)   | slow/fast pointers              |
// | detect cycle | O(n)   | Floyd's tortoise and hare       |
//
// --- Doubly Linked List ---
// | Operation    | Time   | Notes                          |
// |------------- |--------|--------------------------------|
// | prepend      | O(1)   | update head                    |
// | append       | O(1)   | update tail                    |
// | removeFirst  | O(1)   | update head                    |
// | removeLast   | O(1)   | update tail (SLL cannot!)      |
// | insertAt     | O(n)   | traverse from closer end       |
// | get          | O(n)   | traverse from closer end       |

// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. Linked list = nodes with value + pointer(s). No contiguous memory.
//    Each node is independently allocated on the heap.
// 2. Singly LL: each node has `next`. Prepend O(1), append O(n)
//    unless you maintain a tail pointer.
// 3. Doubly LL: each node has `next` + `prev`. Insert/remove from
//    both ends is O(1). removeLast is O(1) — SLL cannot do this.
// 4. Classic problems and their techniques:
//    - Reverse: prev/curr/next pointer flipping. O(n) time, O(1) space.
//    - Cycle detection: Floyd's slow/fast pointers. O(n) time, O(1) space.
//    - Find middle: slow (1 step) and fast (2 steps) pointers.
//    - Merge sorted lists: two-pointer technique. O(n+m) time.
//    - Remove nth from end: two pointers with n-gap. Single pass.
// 5. JS arrays are almost always faster due to cache locality.
//    Use linked lists only when pointer-based operations give
//    a clear algorithmic advantage (LRU cache, undo history, etc.).
// 6. Linked lists are the foundation for trees and graphs —
//    a tree node is just a linked list node with multiple children.

console.log("=== FILE 07 COMPLETE ===");
