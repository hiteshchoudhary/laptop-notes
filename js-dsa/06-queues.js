// ============================================================
// FILE 06: QUEUES — FIFO, PRIORITY QUEUES, AND DEQUES
// Topic: Queue data structures and their variants
// WHY: Queues are fundamental to scheduling, buffering, and
//   breadth-first traversal. Every web server, task runner, and
//   message broker uses queues under the hood.
// ============================================================

// ============================================================
// EXAMPLE 1 — Ola Ride Request Queue
// Story: Ola receives thousands of ride requests per minute.
//   Each request enters a queue — first come, first served.
//   The dispatcher dequeues the oldest request and assigns
//   the nearest available driver. FIFO ensures fairness.
// ============================================================

// WHY: A Queue follows FIFO (First In, First Out). The element
// that enters first leaves first — like standing in line at SBI.
// Operations: enqueue (add rear), dequeue (remove front),
// front (peek), isEmpty, size.

// --- Real-world queue examples ---
// - Printer queue: documents print in the order they were submitted
// - Customer service line at SBI bank: first customer, first served
// - Task scheduling: OS runs processes in FIFO order (basic scheduler)
// - Message queues (RabbitMQ, Kafka): producers enqueue, consumers dequeue

// ============================================================
// EXAMPLE 1B — Queue Using Array (Simple but Flawed)
// Story: A small chai stall near Connaught Place uses a
//   handwritten list to track orders. Adding to the end is
//   easy, but crossing off the first entry means rewriting
//   every subsequent entry. As the list grows, this slows down.
// ============================================================

// WHY: JavaScript arrays have push() O(1) and shift() O(n).
// shift() is O(n) because every remaining element must be
// re-indexed. For small queues this is fine, but for queues
// processing millions of items (like Ola requests), it is too slow.

class ArrayQueue {
  constructor() {
    this.items = [];
  }

  // enqueue: add to the rear — O(1) amortized
  enqueue(item) {
    this.items.push(item);
  }

  // dequeue: remove from front — O(n) because of shift()!
  // Every remaining element shifts left by one index
  dequeue() {
    if (this.isEmpty()) return undefined;
    return this.items.shift(); // O(n) — the problem!
  }

  // front: peek at front element without removing — O(1)
  front() {
    if (this.isEmpty()) return undefined;
    return this.items[0];
  }

  // isEmpty — O(1)
  isEmpty() {
    return this.items.length === 0;
  }

  // size — O(1)
  size() {
    return this.items.length;
  }

  // print the queue contents for debugging
  print() {
    console.log("Queue (front -> rear):", this.items.join(" -> "));
  }
}

// Big-O Summary for ArrayQueue:
// enqueue: O(1) amortized
// dequeue: O(n) — THIS IS THE PROBLEM
// front:   O(1)
// isEmpty: O(1)
// size:    O(1)

console.log("=== Array-Based Queue (Ola Ride Requests) ===");
const olaQueue = new ArrayQueue();
olaQueue.enqueue("Ride#101 - Koramangala to Airport");
olaQueue.enqueue("Ride#102 - Indiranagar to MG Road");
olaQueue.enqueue("Ride#103 - Whitefield to Electronic City");
olaQueue.print();
console.log("Assigning:", olaQueue.dequeue()); // Ride#101
console.log("Next:", olaQueue.front());        // Ride#102
console.log("Pending:", olaQueue.size());      // 2
console.log();

// ============================================================
// EXAMPLE 2 — Queue Using Linked List (Optimal)
// Story: Ola upgrades to a linked-list queue. Each ride request
//   is a node pointing to the next. Enqueue at tail, dequeue
//   from head — both O(1). Handles Mumbai peak-hour surges.
// ============================================================

// WHY: Linked-list queue gives O(1) enqueue AND O(1) dequeue.
// We maintain head (front) and tail (rear) pointers.
class QueueNode {
  constructor(value) { this.value = value; this.next = null; }
}

class LinkedListQueue {
  constructor() { this.head = null; this.tail = null; this._size = 0; }

  enqueue(value) { // O(1)
    const node = new QueueNode(value);
    if (this.isEmpty()) { this.head = node; this.tail = node; }
    else { this.tail.next = node; this.tail = node; }
    this._size++;
  }
  dequeue() { // O(1)
    if (this.isEmpty()) return undefined;
    const val = this.head.value;
    this.head = this.head.next;
    if (!this.head) this.tail = null;
    this._size--;
    return val;
  }
  front()   { return this.isEmpty() ? undefined : this.head.value; }
  isEmpty() { return this._size === 0; }
  size()    { return this._size; }
  print() {
    const items = []; let c = this.head;
    while (c) { items.push(c.value); c = c.next; }
    console.log("Queue:", items.join(" → "));
  }
}

// Big-O Summary for LinkedListQueue:
// enqueue: O(1)
// dequeue: O(1)
// front:   O(1)
// isEmpty: O(1)
// size:    O(1)
// ALL operations are O(1)! This is the ideal queue implementation.

console.log("=== Linked-List Queue (Ola Upgraded) ===");
const olaLL = new LinkedListQueue();
olaLL.enqueue("Ride#201 - Bandra to Andheri");
olaLL.enqueue("Ride#202 - Juhu to Powai");
olaLL.enqueue("Ride#203 - Dadar to Thane");
olaLL.print();
// Queue: Ride#201 - Bandra to Andheri -> Ride#202 - Juhu to Powai -> Ride#203 - Dadar to Thane
console.log("Assigned:", olaLL.dequeue());
// Assigned: Ride#201 - Bandra to Andheri
console.log("Queue size after dequeue:", olaLL.size()); // 2
console.log();

// ============================================================
// EXAMPLE 3 — Circular Buffer Queue (Fixed Capacity)
// Story: Ola's dispatch server has a fixed buffer of 1000 slots.
//   Head and tail pointers wrap with modulo — O(1) everything
//   with zero dynamic allocation. Full buffer rejects new items.
// ============================================================

// WHY: A circular buffer uses modulo arithmetic on a fixed array.
// No shifting, no allocation — pure O(1) with minimal memory.
//
// How modulo wrapping works:
//   capacity = 4, indices: [0, 1, 2, 3]
//   After enqueue 4 items: head=0, tail=0 (wrapped: (0+4)%4 = 0)
//   After dequeue 2: head=2, tail=0
//   After enqueue 2 more: head=2, tail=2 (wrapped again)
//   The array is reused without ever needing to shift elements!

class CircularQueue {
  constructor(capacity) {
    this.capacity = capacity;
    this.items = new Array(capacity);
    this.headIdx = 0; this.tailIdx = 0; this._size = 0;
  }
  enqueue(value) { // O(1)
    if (this.isFull()) { console.log("Full! Cannot enqueue:", value); return false; }
    this.items[this.tailIdx] = value;
    this.tailIdx = (this.tailIdx + 1) % this.capacity;
    this._size++; return true;
  }
  dequeue() { // O(1)
    if (this.isEmpty()) return undefined;
    const val = this.items[this.headIdx];
    this.items[this.headIdx] = undefined;
    this.headIdx = (this.headIdx + 1) % this.capacity;
    this._size--; return val;
  }
  front()   { return this.isEmpty() ? undefined : this.items[this.headIdx]; }
  isFull()  { return this._size === this.capacity; }
  isEmpty() { return this._size === 0; }
  size()    { return this._size; }
  print() {
    const r = [];
    for (let i = 0; i < this._size; i++) r.push(this.items[(this.headIdx + i) % this.capacity]);
    console.log(`CircularQueue [cap=${this.capacity}]:`, r.join(" → "));
  }
}

console.log("=== Circular Buffer Queue ===");
const cq = new CircularQueue(4);
cq.enqueue("A"); cq.enqueue("B"); cq.enqueue("C"); cq.enqueue("D");
cq.print(); // A → B → C → D
cq.enqueue("E"); // Full!
cq.dequeue(); cq.dequeue(); // remove A, B
cq.enqueue("E"); cq.enqueue("F"); // wraps around
cq.print(); // C → D → E → F
console.log("Front element:", cq.front()); // C
console.log("Size:", cq.size()); // 4
console.log("Is full:", cq.isFull()); // true
console.log();

// Big-O Summary for CircularQueue:
// enqueue: O(1)
// dequeue: O(1)
// front:   O(1)
// Space:   O(capacity) — fixed, no growth

// ============================================================
// EXAMPLE 4 — Deque (Double-Ended Queue)
// Story: At Zomato's support center, regular complaints enter
//   from the rear. VIP escalations are pushed to the front.
//   Agents pick from front; supervisors remove from rear.
// ============================================================

// WHY: A Deque allows insert/remove from BOTH ends in O(1).
// It generalizes stacks and queues. Used in sliding window algorithms.
class DequeNode {
  constructor(value) { this.value = value; this.next = null; this.prev = null; }
}

class Deque {
  constructor() { this.head = null; this.tail = null; this._size = 0; }
  addFront(value) { // O(1)
    const node = new DequeNode(value);
    if (this.isEmpty()) { this.head = node; this.tail = node; }
    else { node.next = this.head; this.head.prev = node; this.head = node; }
    this._size++;
  }
  addRear(value) { // O(1)
    const node = new DequeNode(value);
    if (this.isEmpty()) { this.head = node; this.tail = node; }
    else { node.prev = this.tail; this.tail.next = node; this.tail = node; }
    this._size++;
  }
  removeFront() { // O(1)
    if (this.isEmpty()) return undefined;
    const val = this.head.value;
    this.head = this.head.next;
    this.head ? (this.head.prev = null) : (this.tail = null);
    this._size--; return val;
  }
  removeRear() { // O(1)
    if (this.isEmpty()) return undefined;
    const val = this.tail.value;
    this.tail = this.tail.prev;
    this.tail ? (this.tail.next = null) : (this.head = null);
    this._size--; return val;
  }
  isEmpty() { return this._size === 0; }
  size()    { return this._size; }
  print() {
    const items = []; let c = this.head;
    while (c) { items.push(c.value); c = c.next; }
    console.log("Deque:", items.join(" <-> "));
  }
}

console.log("=== Deque (Zomato Support) ===");
const support = new Deque();
support.addRear("Complaint#1 - Late delivery");
support.addRear("Complaint#2 - Wrong order");
support.addFront("ESCALATION - Partner issue");
support.print();
console.log("Agent picks:", support.removeFront());   // ESCALATION
console.log("Supervisor resolves:", support.removeRear()); // Complaint#2
console.log();

// ============================================================
// EXAMPLE 5 — Priority Queue (Array-Based)
// Story: Ola Premier rides get assigned before Mini even if
//   the Mini request came first. The dispatcher scans for the
//   highest-priority ride on each dequeue.
// ============================================================

// WHY: Priority Queue dequeues by priority, not arrival order.
// Array version: enqueue O(1), dequeue O(n) (scans for min).
// Heap-based PQ (File 14) achieves O(log n) for both.
class PriorityQueue {
  constructor() { this.items = []; }
  enqueue(value, priority) { this.items.push({ value, priority }); } // O(1)
  dequeue() { // O(n) — scan for highest priority (lowest number)
    if (this.isEmpty()) return undefined;
    let minIdx = 0;
    for (let i = 1; i < this.items.length; i++) {
      if (this.items[i].priority < this.items[minIdx].priority) minIdx = i;
    }
    return this.items.splice(minIdx, 1)[0];
  }
  isEmpty() { return this.items.length === 0; }
  size()    { return this.items.length; }
}

console.log("=== Priority Queue (Ola Ride Types) ===");
const olaPQ = new PriorityQueue();
olaPQ.enqueue("Mini - Koramangala", 3);
olaPQ.enqueue("Premier - Airport", 1);
olaPQ.enqueue("Prime - MG Road", 2);
console.log("First:", olaPQ.dequeue().value);  // Premier - Airport
console.log("Second:", olaPQ.dequeue().value); // Prime - MG Road
console.log();

// ============================================================
// PROBLEM 1 — Implement Stack Using Two Queues
// Story: A Paytm developer simulates LIFO using only queue APIs.
// ============================================================

// WHY: Classic problem testing understanding of both structures.
// Push O(n): enqueue to q2, drain q1 into q2, swap. Pop O(1).
class StackUsingQueues {
  constructor() { this.q1 = new LinkedListQueue(); this.q2 = new LinkedListQueue(); }
  push(value) {
    this.q2.enqueue(value);
    while (!this.q1.isEmpty()) this.q2.enqueue(this.q1.dequeue());
    [this.q1, this.q2] = [this.q2, this.q1];
  }
  pop()     { return this.q1.dequeue(); }
  top()     { return this.q1.front(); }
  isEmpty() { return this.q1.isEmpty(); }
}

console.log("=== Problem 1: Stack Using Two Queues ===");
const fakeStack = new StackUsingQueues();
fakeStack.push(10);
fakeStack.push(20);
fakeStack.push(30);
console.log("Top:", fakeStack.top());  // 30 (LIFO — last pushed)
console.log("Pop:", fakeStack.pop());  // 30
console.log("Pop:", fakeStack.pop());  // 20
console.log("Pop:", fakeStack.pop());  // 10
console.log("Is empty:", fakeStack.isEmpty()); // true
console.log();

// ============================================================
// PROBLEM 2 — Generate Binary Numbers 1 to N Using Queue
// Story: Infosys coding challenge: generate binary strings 1-N
//   without decimal conversion. BFS-like queue approach.
// ============================================================

// WHY: Enqueue "1", dequeue it, enqueue dequeued+"0" and +"1".
// Produces binary numbers in order. Time: O(n), Space: O(n).
function generateBinaryNumbers(n) {
  const result = [], queue = new LinkedListQueue();
  queue.enqueue("1");
  for (let i = 0; i < n; i++) {
    const curr = queue.dequeue();
    result.push(curr);
    queue.enqueue(curr + "0");
    queue.enqueue(curr + "1");
  }
  return result;
}

console.log("=== Problem 2: Binary Numbers 1 to N ===");
console.log("Binary 1-10:", generateBinaryNumbers(10));
console.log();

// ============================================================
// PROBLEM 3 — First Non-Repeating Character in a Stream
// Story: Hotstar streams cricket commentary char by char.
//   At each moment, find the first unrepeated character.
// ============================================================

// WHY: Queue + frequency map. Pop front while count > 1.
// Time: O(n) overall — each character enters/exits queue at most once.
function firstNonRepeating(stream) {
  const freq = {}, queue = new ArrayQueue(), results = [];
  for (const ch of stream) {
    freq[ch] = (freq[ch] || 0) + 1;
    queue.enqueue(ch);
    while (!queue.isEmpty() && freq[queue.front()] > 1) queue.dequeue();
    results.push(queue.isEmpty() ? null : queue.front());
  }
  return results;
}

console.log("=== Problem 3: First Non-Repeating in Stream ===");
const stream = "aabcbcd";
const nonRep = firstNonRepeating(stream);
for (let i = 0; i < stream.length; i++)
  console.log(`After '${stream.slice(0, i + 1)}': ${nonRep[i]}`);
console.log();

// ============================================================
// PROBLEM 4 — Ring Buffer — Overwrite Oldest
// Story: A Jio CCTV system stores the last N frames. When full,
//   oldest frame is silently overwritten. Never "fills up."
// ============================================================

// WHY: Unlike CircularQueue that rejects on full, ring buffer
// overwrites. Ideal for logs, telemetry, streaming data.
class RingBuffer {
  constructor(cap) {
    this.cap = cap; this.items = new Array(cap).fill(null);
    this.writeIdx = 0; this._count = 0;
  }
  write(value) { // O(1) — always succeeds
    this.items[this.writeIdx] = value;
    this.writeIdx = (this.writeIdx + 1) % this.cap;
    this._count++;
  }
  readAll() { // O(capacity)
    if (this._count < this.cap) return this.items.slice(0, this._count);
    const r = [];
    for (let i = 0; i < this.cap; i++) r.push(this.items[(this.writeIdx + i) % this.cap]);
    return r;
  }
  print() { console.log("RingBuffer:", this.readAll().join(" → ")); }
}

console.log("=== Problem 4: Ring Buffer ===");
const cctv = new RingBuffer(4);
cctv.write("Frame-1"); cctv.write("Frame-2"); cctv.write("Frame-3"); cctv.write("Frame-4");
cctv.print(); // Frame-1 → Frame-2 → Frame-3 → Frame-4
cctv.write("Frame-5"); cctv.write("Frame-6"); // overwrites Frame-1, Frame-2
cctv.print(); // Frame-3 → Frame-4 → Frame-5 → Frame-6
console.log();

// ============================================================
// EXAMPLE 6 — BFS Preview (Queue in Action)
// Story: Google Maps India finds shortest route from Bangalore
//   to Mysore by exploring cities level by level with a queue.
// ============================================================

// WHY: BFS is the most important queue application. It explores
// nodes level-by-level, guaranteeing shortest path in unweighted graphs.
function bfsPreview(graph, start) {
  const visited = new Set(), queue = new LinkedListQueue(), order = [];
  queue.enqueue(start); visited.add(start);
  while (!queue.isEmpty()) {
    const node = queue.dequeue();
    order.push(node);
    for (const neighbor of (graph[node] || [])) {
      if (!visited.has(neighbor)) { visited.add(neighbor); queue.enqueue(neighbor); }
    }
  }
  return order;
}

console.log("=== BFS Preview (Cities from Bangalore) ===");
const cityGraph = {
  Bangalore: ["Mysore", "Tumkur", "Hosur"], Mysore: ["Ooty", "Coorg"],
  Tumkur: ["Davangere"], Hosur: ["Chennai"],
  Ooty: [], Coorg: [], Davangere: [], Chennai: []
};
console.log("BFS order:", bfsPreview(cityGraph, "Bangalore"));
console.log();

// ============================================================
// EXAMPLE 7 — Round-Robin Task Scheduling
// Story: ISRO's ground station shares CPU among telemetry tasks.
//   Each gets a fixed quantum. Unfinished tasks return to rear.
// ============================================================

// WHY: Round-robin uses a queue to ensure fair CPU sharing.
// Time quantum controls responsiveness vs throughput.
function roundRobinScheduler(tasks, quantum) {
  const queue = new LinkedListQueue(), timeline = [];
  let clock = 0;
  for (const t of tasks) queue.enqueue({ ...t, remaining: t.burstTime });
  while (!queue.isEmpty()) {
    const task = queue.dequeue();
    const run = Math.min(task.remaining, quantum);
    timeline.push(`[${clock}-${clock + run}] ${task.name}`);
    clock += run; task.remaining -= run;
    if (task.remaining > 0) queue.enqueue(task);
    else timeline.push(`  -> ${task.name} COMPLETED at t=${clock}`);
  }
  return timeline;
}

console.log("=== Round-Robin Scheduling (quantum=3) ===");
const tasks = [
  { name: "Telemetry-A", burstTime: 5 },
  { name: "Telemetry-B", burstTime: 3 },
  { name: "Telemetry-C", burstTime: 7 },
];
roundRobinScheduler(tasks, 3).forEach(l => console.log(l));
console.log();

// ============================================================
// Big-O Summary of All Queue Variants
// ============================================================
//
// | Queue Type       | enqueue | dequeue | front | Space       |
// |------------------|---------|---------|-------|-------------|
// | Array Queue      | O(1)*   | O(n)    | O(1)  | O(n) dynamic |
// | Linked List Queue| O(1)    | O(1)    | O(1)  | O(n) dynamic |
// | Circular Buffer  | O(1)    | O(1)    | O(1)  | O(k) fixed   |
// | Deque (DLL)      | O(1)    | O(1)    | O(1)  | O(n) dynamic |
// | Priority Queue   | O(1)    | O(n)    | O(n)  | O(n) dynamic |
// | PQ (Heap, F.14)  | O(logn) | O(logn) | O(1)  | O(n) dynamic |
//
// * amortized

// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. Queue = FIFO. First in, first out — like a line at SBI bank.
// 2. Array queue: enqueue O(1), dequeue O(n) — shift() is slow!
// 3. Linked-list queue: enqueue O(1), dequeue O(1) — optimal.
// 4. Circular buffer: O(1) everything, fixed capacity, no allocation.
// 5. Deque: insert/remove from both ends O(1).
// 6. Priority Queue (array): enqueue O(1), dequeue O(n).
//    Heap-based PQ (File 14): both O(log n).
// 7. BFS and round-robin scheduling rely on queues.
// 8. Ring buffer overwrites oldest — ideal for logs and telemetry.

console.log("=== FILE 06 COMPLETE ===");
