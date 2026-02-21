// ============================================================
// FILE 24: LRU CACHE
// Topic: Fixed-size cache that evicts the Least Recently Used item when full
// WHY: LRU Cache is one of the most practical data structures in
// software engineering. It powers browser caches, CDN edge caches,
// database query caches, and DNS resolution. It is also one of the
// most frequently asked system design AND coding interview questions
// (LeetCode #146). Implementing it from scratch tests your knowledge
// of HashMaps, Doubly Linked Lists, and algorithmic design.
// ============================================================

// ============================================================
// SWIGGY STORY
// ============================================================
// Swiggy serves 50 million+ users across India. When a user opens the
// app, they see restaurant menus. Fetching a menu from the database
// takes ~100ms. Swiggy caches the top 1000 most-accessed menus in memory
// (takes ~0.01ms to read). When the cache is full and a NEW menu is
// requested, Swiggy evicts the LEAST RECENTLY USED menu to make room.
// This is the LRU (Least Recently Used) eviction policy — the menu
// nobody has looked at for the longest time gets removed first.

console.log("=== LRU CACHE ===\n");

// ============================================================
// SECTION 1 — WHY NOT JUST USE A HASHMAP + ARRAY?
// ============================================================

// WHY: Understanding why naive approaches fail helps you appreciate
// the HashMap + Doubly Linked List solution.

// Requirements:
//   get(key)       -> O(1) time
//   put(key, value) -> O(1) time
//   Evict LRU item  -> O(1) time

// Attempt 1: HashMap only
//   get: O(1), put: O(1), but NO WAY to know which key is LRU.

// Attempt 2: HashMap + Array (ordered by recency)
//   get: O(1) lookup, but moving element to front of array = O(n) shift.
//   put: O(1) insert at front, but evict from end = O(1). Still get is O(n).

// Attempt 3: HashMap + Doubly Linked List (THE SOLUTION)
//   HashMap: key -> node reference (O(1) lookup)
//   Doubly Linked List: ordered by recency (O(1) add/remove/move)
//   Head = Most Recently Used (MRU)
//   Tail = Least Recently Used (LRU)
//   All operations: O(1)!

// ============================================================
// SECTION 2 — DOUBLY LINKED LIST NODE
// ============================================================

// WHY: Each node stores key + value and has prev/next pointers.
// We store the KEY in the node so that when we evict the tail node,
// we can also delete its entry from the HashMap.

class DoublyLinkedListNode {
  constructor(key, value) {
    this.key = key;
    this.value = value;
    this.prev = null;
    this.next = null;
  }
}

// ============================================================
// EXAMPLE 1 — Full LRU Cache Implementation
// Story: Swiggy's restaurant menu cache. Each restaurant ID is a key,
// the menu object is the value. When a user views a restaurant, it
// moves to the front (most recently used). When cache is full and a
// new restaurant is requested, the least recently viewed one is evicted.
// ============================================================

// WHY: This is the complete, production-quality LRU Cache implementation
// using HashMap + Doubly Linked List. Every operation is O(1).

class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.map = new Map(); // key -> DoublyLinkedListNode

    // Sentinel (dummy) nodes — simplify edge cases (no null checks)
    //   head.next = most recently used
    //   tail.prev = least recently used
    this.head = new DoublyLinkedListNode(0, 0); // Dummy head
    this.tail = new DoublyLinkedListNode(0, 0); // Dummy tail
    this.head.next = this.tail;
    this.tail.prev = this.head;

    // Initial state:  head <-> tail  (empty list)
  }

  // --- HELPER: Remove a node from the linked list --- O(1)
  _removeNode(node) {
    // Unlink node from its neighbors
    const prevNode = node.prev;
    const nextNode = node.next;
    prevNode.next = nextNode;
    nextNode.prev = prevNode;
    // Node is now detached (prev/next still point but list skips it)
  }

  // --- HELPER: Add a node right after head (most recent position) --- O(1)
  _addToFront(node) {
    // Insert between head and head.next
    node.prev = this.head;
    node.next = this.head.next;
    this.head.next.prev = node;
    this.head.next = node;
  }

  // --- HELPER: Move existing node to front (mark as most recently used) --- O(1)
  _moveToFront(node) {
    this._removeNode(node);
    this._addToFront(node);
  }

  // --- GET: Retrieve value by key --- O(1)
  get(key) {
    if (!this.map.has(key)) return -1; // Cache miss

    const node = this.map.get(key);
    this._moveToFront(node); // Mark as most recently used
    return node.value;
  }

  // --- PUT: Insert or update key-value pair --- O(1)
  put(key, value) {
    if (this.map.has(key)) {
      // Key exists — update value and move to front
      const node = this.map.get(key);
      node.value = value;
      this._moveToFront(node);
    } else {
      // New key — create node, add to front
      const newNode = new DoublyLinkedListNode(key, value);
      this.map.set(key, newNode);
      this._addToFront(newNode);

      // If over capacity, evict LRU (tail.prev)
      if (this.map.size > this.capacity) {
        const lruNode = this.tail.prev; // Least recently used
        this._removeNode(lruNode);
        this.map.delete(lruNode.key); // Remove from HashMap too
      }
    }
  }

  // --- PEEK: View current cache state (for debugging) ---
  _getState() {
    const items = [];
    let current = this.head.next;
    while (current !== this.tail) {
      items.push(`${current.key}:${current.value}`);
      current = current.next;
    }
    return `[${items.join(" <-> ")}] (size: ${this.map.size}/${this.capacity})`;
  }
}

// ============================================================
// SECTION 3 — Step-by-Step Trace with ASCII Diagrams
// ============================================================

// WHY: Walking through operations step by step is the best way to
// understand how the doubly linked list maintains recency order.

console.log("=== LRU CACHE STEP-BY-STEP TRACE ===");
console.log("Capacity: 3\n");

const cache = new LRUCache(3);

// Operation 1: put(1, "Biryani Paradise")
cache.put(1, "Biryani Paradise");
console.log("put(1, 'Biryani Paradise')");
console.log("State:", cache._getState());
// head <-> 1:Biryani Paradise <-> tail
// Most recent: 1, Least recent: 1

// Operation 2: put(2, "Pizza Hut")
cache.put(2, "Pizza Hut");
console.log("\nput(2, 'Pizza Hut')");
console.log("State:", cache._getState());
// head <-> 2:Pizza Hut <-> 1:Biryani Paradise <-> tail
// Most recent: 2, Least recent: 1

// Operation 3: put(3, "Dominos")
cache.put(3, "Dominos");
console.log("\nput(3, 'Dominos')");
console.log("State:", cache._getState());
// head <-> 3:Dominos <-> 2:Pizza Hut <-> 1:Biryani Paradise <-> tail
// Most recent: 3, Least recent: 1

// Operation 4: get(1) — access Biryani Paradise, moves to front
const v1 = cache.get(1);
console.log(`\nget(1) = "${v1}" (moves to front)`);
console.log("State:", cache._getState());
// head <-> 1:Biryani Paradise <-> 3:Dominos <-> 2:Pizza Hut <-> tail
// Most recent: 1, Least recent: 2

// Operation 5: put(4, "KFC") — cache full! Evicts LRU (key 2: Pizza Hut)
cache.put(4, "KFC");
console.log("\nput(4, 'KFC') -- CACHE FULL, evicts LRU");
console.log("State:", cache._getState());
// head <-> 4:KFC <-> 1:Biryani Paradise <-> 3:Dominos <-> tail
// Pizza Hut (key 2) was evicted as least recently used!

// Operation 6: get(2) — Pizza Hut was evicted!
const v2 = cache.get(2);
console.log(`\nget(2) = ${v2} (CACHE MISS — was evicted!)`);
console.log("State:", cache._getState());
// -1 returned, state unchanged

// Operation 7: put(5, "McDonald's") — evicts LRU (key 3: Dominos)
cache.put(5, "McDonald's");
console.log("\nput(5, \"McDonald's\") -- evicts LRU");
console.log("State:", cache._getState());
// head <-> 5:McDonald's <-> 4:KFC <-> 1:Biryani Paradise <-> tail
// Dominos (key 3) evicted

// Operation 8: get(3) — Dominos was evicted!
console.log(`\nget(3) = ${cache.get(3)} (CACHE MISS)`);

// Operation 9: Update existing key
cache.put(1, "Biryani Paradise UPDATED");
console.log("\nput(1, 'Biryani Paradise UPDATED') -- update + move to front");
console.log("State:", cache._getState());
// head <-> 1:Biryani Paradise UPDATED <-> 5:McDonald's <-> 4:KFC <-> tail
console.log();

// ============================================================
// ASCII DIAGRAM — Complete Data Structure
// ============================================================
//
//    HashMap (Map)                  Doubly Linked List
//   +-----+-------+         +------+    +------+    +------+    +------+
//   | key | node--+-------->| head |--->|  MRU |--->| .... |--->| tail |
//   +-----+-------+         |      |<---|      |<---|      |<---|      |
//   |  1  |   *---+--.      +------+    +------+    +------+    +------+
//   |  4  |   *---+--+--.     dummy     key:value   key:value    dummy
//   |  5  |   *---+--.  |              most recent              least recent
//   +-----+-------+  |  |
//                     |  |
//                     v  v
//              Nodes in the linked list (direct reference, no search!)
//
// Why this is O(1):
//   get:  Map.get(key) -> node -> read value + move to front (relink pointers)
//   put:  Map.set(key, newNode) -> add to front, if full -> remove tail.prev
//   evict: tail.prev is always the LRU -> remove it + Map.delete(node.key)

// ============================================================
// EXAMPLE 2 — LRU Cache Using JavaScript Map (Simpler Approach)
// Story: A quick-and-dirty LRU for a hackathon project at a startup.
// JavaScript's Map maintains insertion order. By deleting and re-inserting
// a key on access, we effectively move it to the "end" (most recent).
// The "first" key is the least recently used.
// ============================================================

// WHY: This is a clever hack using Map's insertion-order guarantee.
// It's simpler but slightly less explicit than the linked list approach.

class LRUCacheSimple {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map(); // Map maintains insertion order in JS
  }

  // O(1) amortized
  get(key) {
    if (!this.cache.has(key)) return -1;

    const value = this.cache.get(key);
    // Move to end (most recent) by deleting and re-inserting
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  // O(1) amortized
  put(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key); // Remove old entry
    }
    this.cache.set(key, value); // Insert at end (most recent)

    if (this.cache.size > this.capacity) {
      // Evict the FIRST key (least recently used)
      const lruKey = this.cache.keys().next().value;
      this.cache.delete(lruKey);
    }
  }

  _getState() {
    return `[${[...this.cache.entries()].map(([k, v]) => `${k}:${v}`).join(" -> ")}]`;
  }
}

console.log("=== LRU CACHE (MAP-BASED) ===");
const simpleCache = new LRUCacheSimple(2);
simpleCache.put(1, "A");
simpleCache.put(2, "B");
console.log("State:", simpleCache._getState()); // [1:A -> 2:B]
console.log("get(1):", simpleCache.get(1));      // A (moved to end)
console.log("State:", simpleCache._getState()); // [2:B -> 1:A]
simpleCache.put(3, "C");                         // Evicts key 2
console.log("put(3,'C') State:", simpleCache._getState()); // [1:A -> 3:C]
console.log("get(2):", simpleCache.get(2));      // -1 (evicted)
console.log();

// ============================================================
// SECTION 4 — LRU vs Other Cache Eviction Policies
// ============================================================

// WHY: Different caching strategies suit different use cases.
// Understanding the tradeoffs helps in system design interviews.

console.log("=== CACHE EVICTION POLICIES ===");
console.log("+------+-------------------------------+----------------------------------+");
console.log("| Type | Strategy                      | Best For                         |");
console.log("+------+-------------------------------+----------------------------------+");
console.log("| LRU  | Evict least recently USED     | General purpose, web caches      |");
console.log("| LFU  | Evict least FREQUENTLY used   | When popularity matters (CDN)    |");
console.log("| FIFO | Evict oldest inserted          | Simple scenarios, message queues |");
console.log("| TTL  | Evict after time-to-live       | Session data, DNS cache          |");
console.log("| MRU  | Evict most recently used       | Random access patterns (rare)    |");
console.log("| ARC  | Adaptive between LRU/LFU       | Advanced, self-tuning (ZFS)      |");
console.log("+------+-------------------------------+----------------------------------+");
console.log();

// --- FIFO vs LRU ---
// FIFO: evicts oldest by insertion order (no reordering on access)
// LRU:  evicts oldest by ACCESS order (reorders on every get/put)
// Key difference: FIFO ignores access patterns, LRU adapts to them.
console.log();

// --- LRU with TTL ---
// In production, add a TTL (time-to-live) to each entry. On get(),
// check if Date.now() > entry.expiry; if so, delete and return -1.
// This prevents serving stale data in caches like DNS or sessions.
console.log();

// ============================================================
// SECTION 7 — Real-World LRU Usage
// ============================================================

// WHY: Understanding where LRU is used in production helps connect
// the abstract data structure to practical engineering.

console.log("=== REAL-WORLD LRU APPLICATIONS ===");
console.log("+-------------------------+-------------------------------------+");
console.log("| Application             | How LRU is used                     |");
console.log("+-------------------------+-------------------------------------+");
console.log("| Browser Cache           | Cached HTTP responses, evict LRU    |");
console.log("| CDN Edge Cache          | Cache origin responses at edge      |");
console.log("| Redis                   | allkeys-lru eviction policy         |");
console.log("| MySQL Query Cache       | Cache query results, evict LRU      |");
console.log("| DNS Resolver            | Cache DNS lookups with TTL          |");
console.log("| CPU Cache (L1/L2/L3)    | Hardware LRU for cache lines        |");
console.log("| Operating System        | Page replacement (LRU approximation)|");
console.log("| Swiggy/Zomato           | Restaurant menu cache               |");
console.log("| Google Search           | Autocomplete suggestion cache       |");
console.log("+-------------------------+-------------------------------------+");
console.log();

// Both implementations are O(1) per operation. The linked list version
// has true O(1) worst case; the Map version is O(1) amortized.
console.log();

// ============================================================
// SECTION 9 — BIG-O SUMMARY
// ============================================================

console.log("=== LRU CACHE COMPLEXITY ===");
console.log("+--------------------+-----------+-----------+--------------------------+");
console.log("| Operation          | Time      | Space     | Notes                    |");
console.log("+--------------------+-----------+-----------+--------------------------+");
console.log("| get(key)           | O(1)      | O(1)      | Map lookup + list move   |");
console.log("| put(key, value)    | O(1)      | O(1)      | Map set + list add/evict |");
console.log("| evict LRU          | O(1)      | O(1)      | Remove tail.prev         |");
console.log("| Overall space      | —         | O(capacity)| Map + Linked List nodes  |");
console.log("+--------------------+-----------+-----------+--------------------------+");
console.log("| Naive (Map+Array)  | O(n) get  | O(n)      | Array shift is O(n)      |");
console.log("| Map-based shortcut | O(1) avg  | O(n)      | delete+set = move to end |");
console.log("| HashMap+DLL        | O(1) worst| O(n)      | TRUE O(1) all operations |");
console.log("+--------------------+-----------+-----------+--------------------------+");
console.log();

// ============================================================
// SECTION 10 — TESTS
// ============================================================

console.log("=== RUNNING ALL LRU CACHE TESTS ===");

// Test 1: Basic get/put
const t1 = new LRUCache(2);
t1.put(1, 1);
t1.put(2, 2);
console.assert(t1.get(1) === 1, "get(1) should return 1");
t1.put(3, 3); // Evicts key 2
console.assert(t1.get(2) === -1, "get(2) should return -1 (evicted)");
t1.put(4, 4); // Evicts key 1
console.assert(t1.get(1) === -1, "get(1) should return -1 (evicted)");
console.assert(t1.get(3) === 3, "get(3) should return 3");
console.assert(t1.get(4) === 4, "get(4) should return 4");
console.log("Test 1 (Basic get/put): Passed");

// Test 2: Update existing key
const t2 = new LRUCache(2);
t2.put(1, 1);
t2.put(2, 2);
t2.put(1, 10); // Update key 1
console.assert(t2.get(1) === 10, "get(1) should return updated value 10");
t2.put(3, 3); // Should evict key 2 (not 1, since 1 was recently updated)
console.assert(t2.get(2) === -1, "get(2) should be evicted");
console.assert(t2.get(1) === 10, "get(1) should still be 10");
console.log("Test 2 (Update existing): Passed");

// Test 3: Capacity 1
const t3 = new LRUCache(1);
t3.put(1, 1);
t3.put(2, 2); // Evicts 1
console.assert(t3.get(1) === -1, "Capacity 1: key 1 evicted");
console.assert(t3.get(2) === 2, "Capacity 1: key 2 present");
console.log("Test 3 (Capacity 1): Passed");

// Test 4: Access pattern affects eviction order
const t4 = new LRUCache(3);
t4.put(1, 1);
t4.put(2, 2);
t4.put(3, 3);
t4.get(1); // Access key 1, making key 2 the LRU
t4.put(4, 4); // Evicts key 2 (LRU)
console.assert(t4.get(2) === -1, "Key 2 should be evicted (was LRU)");
console.assert(t4.get(1) === 1, "Key 1 should survive (was recently accessed)");
console.log("Test 4 (Access pattern): Passed");

// Test 5: Simple LRU implementation
const t5 = new LRUCacheSimple(2);
t5.put(1, 1);
t5.put(2, 2);
console.assert(t5.get(1) === 1, "Simple LRU get(1)");
t5.put(3, 3);
console.assert(t5.get(2) === -1, "Simple LRU: key 2 evicted");
console.log("Test 5 (Simple LRU): Passed");

// Test 6: Stress test
const t6 = new LRUCache(100);
for (let i = 0; i < 1000; i++) t6.put(i, i);
// Only last 100 keys should remain
console.assert(t6.get(899) === -1, "Key 899 should be evicted");
console.assert(t6.get(900) === 900, "Key 900 should exist");
console.assert(t6.get(999) === 999, "Key 999 should exist");
console.log("Test 6 (Stress test): Passed");

console.log("\nAll LRU Cache tests passed!");

// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. LRU Cache = HashMap + Doubly Linked List. The HashMap gives O(1)
//    key lookup, and the Doubly Linked List gives O(1) add/remove/move.
// 2. Sentinel (dummy) head and tail nodes eliminate null-pointer edge
//    cases and make the code cleaner.
// 3. On get(): move the accessed node to the front (most recently used).
// 4. On put(): if key exists, update and move to front. If new, add to
//    front and evict tail.prev if over capacity.
// 5. The node stores BOTH key and value. The key is needed so we can
//    delete the entry from the HashMap when evicting from the list.
// 6. JavaScript's Map maintains insertion order, enabling a simpler
//    (but less explicit) LRU implementation using delete + re-set.
// 7. LRU is not always the best policy. LFU works better for content
//    with stable popularity. TTL is needed for data that goes stale.
// 8. Real-world LRU: browser cache, CDN, Redis, CPU cache, OS page
//    replacement. It is everywhere in computing.
// 9. Interview tip: This is LeetCode #146. Practice implementing it
//    from scratch in 15 minutes — it tests linked list manipulation,
//    HashMap usage, and edge-case handling simultaneously.
// 10. Big-O: All operations are O(1) time. Space is O(capacity) for
//     storing the HashMap entries and linked list nodes.
