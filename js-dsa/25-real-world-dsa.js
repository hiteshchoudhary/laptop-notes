// ============================================================
// FILE 25: REAL-WORLD DSA APPLICATIONS
// Topic: Tying all data structures together in practical, interview-ready scenarios
// WHY: Indian tech interviews at Google, Microsoft, Amazon, Flipkart,
// and Razorpay don't just ask "implement a BST." They ask you to BUILD
// something real — an autocomplete system, a social network friend
// suggester, a task scheduler. This file shows how data structures
// combine to solve real engineering problems, which is exactly what
// distinguishes senior engineers from junior ones.
// ============================================================

// Top companies don't test isolated data structures — they test your
// ability to COMBINE them. This file builds 5 complete, runnable systems.

console.log("=== REAL-WORLD DSA APPLICATIONS ===\n");

// ============================================================
// SCENARIO 1 — Autocomplete System (Trie + Priority Queue)
// Story: Google India's search bar. As you type "flip", it suggests
// "flipkart", "flipkart sale", "flipkart app". The system uses a
// Trie to store all past search queries with their frequencies, and
// a priority queue to return the top 3 most-searched suggestions.
// ============================================================

// WHY: Autocomplete is asked at Google, Amazon, and Microsoft interviews.
// It tests Trie traversal, DFS, and sorting/priority queue skills.

// --- Trie Node ---
class TrieNode {
  constructor() {
    this.children = {};    // char -> TrieNode
    this.isEnd = false;    // Marks end of a complete word/query
    this.frequency = 0;    // How many times this query was searched
  }
}

// --- Autocomplete System ---
// insert: O(m) where m = query length
// search (autocomplete): O(p + n*m) where p = prefix length, n = matches, m = avg word length
class AutocompleteSystem {
  constructor() {
    this.root = new TrieNode();
  }

  // Insert a search query with frequency
  insert(query, frequency = 1) {
    let node = this.root;
    for (const char of query.toLowerCase()) {
      if (!node.children[char]) {
        node.children[char] = new TrieNode();
      }
      node = node.children[char];
    }
    node.isEnd = true;
    node.frequency += frequency; // Accumulate frequency
  }

  // DFS to find all complete words under a node
  _findAllWithPrefix(node, prefix) {
    const results = [];
    const dfs = (cur, word) => {
      if (cur.isEnd) results.push({ query: word, frequency: cur.frequency });
      for (const [ch, child] of Object.entries(cur.children)) dfs(child, word + ch);
    };
    dfs(node, prefix);
    return results;
  }

  // Autocomplete: prefix -> top k suggestions sorted by frequency
  // O(p) to reach prefix + O(n) to collect + O(n log n) to sort
  autocomplete(prefix, k = 3) {
    let node = this.root;
    const lp = prefix.toLowerCase();
    for (const ch of lp) { if (!node.children[ch]) return []; node = node.children[ch]; }
    const matches = this._findAllWithPrefix(node, lp);
    matches.sort((a, b) => b.frequency - a.frequency);
    return matches.slice(0, k);
  }

  // Record a new search (updates frequency)
  recordSearch(query) {
    this.insert(query, 1);
  }
}

console.log("=== SCENARIO 1: AUTOCOMPLETE SYSTEM ===");
const autocomplete = new AutocompleteSystem();

// Seed with historical search data
const searchHistory = [
  ["flipkart", 100],
  ["flipkart sale", 80],
  ["flipkart app", 60],
  ["flipkart offers", 50],
  ["flutter", 40],
  ["flowers online", 30],
  ["flight booking", 90],
  ["flight status", 70],
  ["flipkart big billion days", 120],
];

searchHistory.forEach(([query, freq]) => autocomplete.insert(query, freq));

console.log('Typing "flip":');
console.log(autocomplete.autocomplete("flip"));
// Top 3: "flipkart big billion days" (120), "flipkart" (100), "flipkart sale" (80)

console.log('\nTyping "flight":');
console.log(autocomplete.autocomplete("flight"));

autocomplete.recordSearch("flipkart groceries");
autocomplete.recordSearch("flipkart groceries");
console.log('\nAfter searches for "flipkart groceries":');
console.log(autocomplete.autocomplete("flipkart g"));
console.log();

// ============================================================
// SCENARIO 2 — Social Network (Graph + BFS)
// Story: LinkedIn India's "People You May Know" feature. It uses BFS
// to find friends-of-friends (depth 2), counts mutual connections,
// and ranks suggestions by mutual friend count. Also computes the
// "degrees of separation" between any two users using BFS shortest path.
// ============================================================

// WHY: Graph + BFS is tested at every FAANG company. Social network
// problems combine adjacency list representation with BFS traversal.

// --- Social Network using Adjacency List ---
// addFriendship: O(1)
// suggestFriends: O(V + E) — BFS to depth 2
// degreesOfSeparation: O(V + E) — BFS shortest path

class SocialNetwork {
  constructor() {
    this.adjacencyList = new Map(); // user -> Set of friends
  }

  addUser(user) {
    if (!this.adjacencyList.has(user)) {
      this.adjacencyList.set(user, new Set());
    }
  }

  addFriendship(user1, user2) {
    this.addUser(user1);
    this.addUser(user2);
    this.adjacencyList.get(user1).add(user2); // Undirected graph
    this.adjacencyList.get(user2).add(user1);
  }

  // Suggest friends: BFS depth 2, count mutual friends — O(V + E)
  suggestFriends(user) {
    if (!this.adjacencyList.has(user)) return [];
    const direct = this.adjacencyList.get(user);
    const mutuals = new Map();
    for (const friend of direct) {
      for (const fof of this.adjacencyList.get(friend)) {
        if (fof !== user && !direct.has(fof))
          mutuals.set(fof, (mutuals.get(fof) || 0) + 1);
      }
    }
    return [...mutuals.entries()].sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ user: name, mutualFriends: count }));
  }

  // Degrees of separation: BFS shortest path — O(V + E)
  degreesOfSeparation(user1, user2) {
    if (!this.adjacencyList.has(user1) || !this.adjacencyList.has(user2)) return -1;
    if (user1 === user2) return 0;
    const visited = new Set([user1]);
    const queue = [[user1, 0]];
    while (queue.length > 0) {
      const [current, dist] = queue.shift();
      for (const friend of this.adjacencyList.get(current)) {
        if (friend === user2) return dist + 1;
        if (!visited.has(friend)) { visited.add(friend); queue.push([friend, dist + 1]); }
      }
    }
    return -1;
  }
}

console.log("=== SCENARIO 2: SOCIAL NETWORK ===");
const network = new SocialNetwork();

// Build a social network (Indian tech community)
network.addFriendship("Ravi", "Priya");
network.addFriendship("Ravi", "Amit");
network.addFriendship("Ravi", "Sneha");
network.addFriendship("Priya", "Amit");
network.addFriendship("Priya", "Deepak");
network.addFriendship("Amit", "Deepak");
network.addFriendship("Amit", "Kavya");
network.addFriendship("Sneha", "Kavya");
network.addFriendship("Deepak", "Vikram");
network.addFriendship("Kavya", "Vikram");

console.log("Friend suggestions for Ravi:");
console.log(network.suggestFriends("Ravi"));
// Deepak (mutual: Priya, Amit = 2), Kavya (mutual: Amit, Sneha = 2)

console.log("\nDegrees of separation:");
console.log("Ravi <-> Vikram:", network.degreesOfSeparation("Ravi", "Vikram"), "degrees");
console.log("Ravi <-> Priya:", network.degreesOfSeparation("Ravi", "Priya"), "degree");
console.log();

// ============================================================
// SCENARIO 3 — Task Scheduler (Heap/Priority Queue + Queue)
// Story: Flipkart's order processing system. Multiple order types
// (A, B, C) need processing, but the same order type needs a cooldown
// of n slots between executions (e.g., API rate limits). Schedule
// tasks to minimize total processing time.
// ============================================================

// WHY: Task Scheduler (LeetCode #621) is a frequently asked medium/hard
// problem. It combines frequency counting, greedy scheduling, and heap.

// --- Algorithm ---
// 1. Count frequency of each task
// 2. Use a max-heap: always schedule the most frequent task
// 3. After scheduling, reduce count, put in cooldown queue
// 4. After cooldown expires, push back to heap
// O(n * log(26)) = O(n) time since at most 26 task types

// Simple Max Heap (push/pop O(log n))
class MaxHeap {
  constructor() { this.heap = []; }
  push(val) { this.heap.push(val); this._up(this.heap.length - 1); }
  pop() {
    const max = this.heap[0]; const last = this.heap.pop();
    if (this.heap.length > 0) { this.heap[0] = last; this._down(0); }
    return max;
  }
  size() { return this.heap.length; }
  _up(i) {
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.heap[p] >= this.heap[i]) break;
      [this.heap[p], this.heap[i]] = [this.heap[i], this.heap[p]]; i = p;
    }
  }
  _down(i) {
    const n = this.heap.length;
    while (true) {
      let lg = i, l = 2*i+1, r = 2*i+2;
      if (l < n && this.heap[l] > this.heap[lg]) lg = l;
      if (r < n && this.heap[r] > this.heap[lg]) lg = r;
      if (lg === i) break;
      [this.heap[i], this.heap[lg]] = [this.heap[lg], this.heap[i]]; i = lg;
    }
  }
}

function taskScheduler(tasks, cooldown) {
  // Step 1: Count frequency of each task
  const freq = {};
  for (const task of tasks) {
    freq[task] = (freq[task] || 0) + 1;
  }

  // Step 2: Push all frequencies into max heap
  const heap = new MaxHeap();
  for (const count of Object.values(freq)) {
    heap.push(count);
  }

  // Step 3: Schedule tasks
  let totalTime = 0;
  const schedule = [];

  while (heap.size() > 0) {
    const cycle = []; // Tasks in this cooldown cycle
    const temp = [];  // Tasks to push back after cooldown

    // Fill up to (cooldown + 1) slots in this cycle
    for (let i = 0; i <= cooldown; i++) {
      if (heap.size() > 0) {
        const count = heap.pop();
        cycle.push(count);
        if (count > 1) {
          temp.push(count - 1); // Remaining executions
        }
      }
    }

    // Push remaining tasks back to heap
    for (const count of temp) {
      heap.push(count);
    }

    // Time for this cycle: if more tasks remain, full cycle; else just tasks done
    totalTime += heap.size() > 0 ? cooldown + 1 : cycle.length;
  }

  return totalTime;
}

console.log("=== SCENARIO 3: TASK SCHEDULER ===");
console.log("Tasks: [A,A,A,B,B,B], cooldown=2");
console.log("Min time:", taskScheduler(["A","A","A","B","B","B"], 2));
// A -> B -> idle -> A -> B -> idle -> A -> B = 8 slots

console.log("Tasks: [A,A,A,B,B,B], cooldown=0");
console.log("Min time:", taskScheduler(["A","A","A","B","B","B"], 0)); // 6
console.log();

// ============================================================
// SCENARIO 4 — Rate Limiter (Queue / Sliding Window)
// Story: Razorpay's payment API allows a maximum of 100 requests
// per minute per merchant. A sliding window rate limiter tracks
// timestamps of recent requests and blocks excess requests.
// ============================================================

// WHY: Rate limiting is a critical system design topic. It combines
// queue operations with time-based window management.

// --- Sliding Window Rate Limiter ---
// allow: O(1) amortized (queue cleanup is amortized over calls)
// Space: O(maxRequests) in worst case

class RateLimiter {
  constructor(maxRequests, windowMs) {
    this.maxRequests = maxRequests;     // Max requests allowed in window
    this.windowMs = windowMs;           // Window size in milliseconds
    this.requests = new Map();          // clientId -> [timestamps]
  }

  // Check if request is allowed — O(1) amortized
  allow(clientId, timestamp = Date.now()) {
    if (!this.requests.has(clientId)) this.requests.set(clientId, []);
    const ts = this.requests.get(clientId);
    const start = timestamp - this.windowMs;
    while (ts.length > 0 && ts[0] <= start) ts.shift(); // Remove expired
    if (ts.length < this.maxRequests) { ts.push(timestamp); return true; }
    return false; // Rate limited
  }

  remaining(clientId, timestamp = Date.now()) {
    if (!this.requests.has(clientId)) return this.maxRequests;
    const valid = this.requests.get(clientId).filter(ts => ts > timestamp - this.windowMs);
    return Math.max(0, this.maxRequests - valid.length);
  }
}

console.log("=== SCENARIO 4: RATE LIMITER ===");
const limiter = new RateLimiter(5, 10000); // 5 requests per 10 seconds

const now = Date.now();
console.log("Sending 7 requests for merchant_1:");
for (let i = 0; i < 7; i++) {
  const allowed = limiter.allow("merchant_1", now + i * 1000);
  console.log(`  Request ${i + 1} at +${i}s: ${allowed ? "ALLOWED" : "BLOCKED"}`);
}
console.log("Remaining quota:", limiter.remaining("merchant_1", now + 6000));

console.log("\nAfter window slides (11s later):");
console.log("  Request:", limiter.allow("merchant_1", now + 11000) ? "ALLOWED" : "BLOCKED");
console.log();

// ============================================================
// SCENARIO 5 — Text Editor Undo/Redo (Two Stacks)
// Story: VS Code (built by Microsoft, used by most Indian devs)
// implements undo/redo using two stacks. Every action goes on the
// undo stack. Undo pops from undo and pushes to redo. Any new action
// clears the redo stack (you can't redo after a new action).
// ============================================================

// WHY: Undo/Redo is a classic Stack application. It demonstrates
// the Command pattern and is asked at Microsoft and Adobe interviews.

// --- Two Stack Undo/Redo ---
// type/delete/undo/redo: all O(1) time
// Space: O(n) where n = number of actions

class TextEditor {
  constructor() {
    this.text = "";            // Current document text
    this.undoStack = [];       // Stack of actions for undo
    this.redoStack = [];       // Stack of undone actions for redo
  }

  type(str) {
    this.undoStack.push({ action: "type", text: str, position: this.text.length });
    this.text += str;
    this.redoStack = [];
    return this;
  }

  deleteChars(n) {
    const actualN = Math.min(n, this.text.length);
    const deleted = this.text.slice(-actualN);
    this.undoStack.push({ action: "delete", text: deleted, position: this.text.length - actualN });
    this.text = this.text.slice(0, -actualN);
    this.redoStack = [];
    return this;
  }

  undo() {
    if (this.undoStack.length === 0) { console.log("  Nothing to undo!"); return this; }
    const a = this.undoStack.pop(); this.redoStack.push(a);
    if (a.action === "type") this.text = this.text.slice(0, a.position);
    else this.text = this.text.slice(0, a.position) + a.text + this.text.slice(a.position);
    return this;
  }

  redo() {
    if (this.redoStack.length === 0) { console.log("  Nothing to redo!"); return this; }
    const a = this.redoStack.pop(); this.undoStack.push(a);
    if (a.action === "type") this.text = this.text.slice(0, a.position) + a.text + this.text.slice(a.position);
    else this.text = this.text.slice(0, a.position) + this.text.slice(a.position + a.text.length);
    return this;
  }

  getText() { return this.text; }
  getState() { return `"${this.text}" (undo: ${this.undoStack.length}, redo: ${this.redoStack.length})`; }
}

console.log("=== SCENARIO 5: TEXT EDITOR UNDO/REDO ===");
const editor = new TextEditor();

editor.type("Hello");
console.log("Type 'Hello':", editor.getState());

editor.type(" World");
console.log("Type ' World':", editor.getState());

editor.deleteChars(5);
console.log("Delete 5 chars:", editor.getState());

editor.undo();
console.log("Undo:", editor.getState()); // "Hello World"

editor.undo();
console.log("Undo:", editor.getState()); // "Hello"

editor.redo();
console.log("Redo:", editor.getState()); // "Hello World"

editor.type("!");
console.log("Type '!' (clears redo):", editor.getState()); // "Hello World!"
console.log();

// ============================================================
// DSA CHEAT SHEET
// ============================================================

console.log("=== DSA CHEAT SHEET ===");
console.log("Array: Access O(1), Search O(n) | HashMap: All O(1) avg");
console.log("Stack/Queue: Push/Pop O(1) | BST: All O(log n) balanced");
console.log("Heap: Peek O(1), Push/Pop O(log n) | Trie: All O(m) per word");
console.log("Graph: BFS/DFS O(V+E) | LinkedList: Insert/Delete O(1)*\n");

// ============================================================
// ALGORITHM + PATTERN RECOGNITION CHEAT SHEET
// ============================================================

// Key algorithms: Binary Search O(logn), BFS/DFS O(V+E), MergeSort O(nlogn),
// Dijkstra O(ElogV), DP (varies), Greedy O(nlogn), Backtracking O(2^n)
//
// Pattern recognition:
//   "Top K"         -> Heap     | "Shortest path"  -> BFS/Dijkstra
//   "Count ways"    -> DP       | "Min/Max optimal" -> DP
//   "Prefix match"  -> Trie     | "Subarray sum"    -> Sliding Window
//   "All paths"     -> DFS/BT   | "Sorted + search" -> Binary Search
//   "LRU/Cache"     -> Map+DLL  | "Intervals"       -> Sort + Greedy
console.log();

// ============================================================
// SECTION 6 — TESTS
// ============================================================

console.log("=== RUNNING ALL REAL-WORLD DSA TESTS ===");

// Test Autocomplete
const ac = new AutocompleteSystem();
ac.insert("hello", 10);
ac.insert("help", 5);
ac.insert("hero", 3);
ac.insert("world", 8);
const acResults = ac.autocomplete("hel");
console.assert(acResults.length === 2, "Should find 2 matches for 'hel'");
console.assert(acResults[0].query === "hello", "Most frequent should be first");
console.log("Autocomplete: Passed");

// Test Social Network
const sn = new SocialNetwork();
sn.addFriendship("A", "B");
sn.addFriendship("B", "C");
sn.addFriendship("A", "D");
sn.addFriendship("D", "C");
console.assert(sn.degreesOfSeparation("A", "C") === 2, "A to C = 2 degrees");
console.assert(sn.degreesOfSeparation("A", "A") === 0, "Same person = 0");
const suggestions = sn.suggestFriends("A");
console.assert(suggestions.length === 1 && suggestions[0].user === "C", "A should be suggested C");
console.assert(suggestions[0].mutualFriends === 2, "C has 2 mutual friends with A");
console.log("Social Network: Passed");

// Test Task Scheduler
console.assert(taskScheduler(["A","A","A","B","B","B"], 2) === 8, "AAABBB n=2 = 8");
console.assert(taskScheduler(["A","A","A","B","B","B"], 0) === 6, "AAABBB n=0 = 6");
console.assert(taskScheduler(["A"], 2) === 1, "Single task = 1");
console.log("Task Scheduler: Passed");

// Test Rate Limiter
const rl = new RateLimiter(3, 10000); // 3 per 10s
const t = Date.now();
console.assert(rl.allow("c1", t) === true, "1st request allowed");
console.assert(rl.allow("c1", t + 1000) === true, "2nd request allowed");
console.assert(rl.allow("c1", t + 2000) === true, "3rd request allowed");
console.assert(rl.allow("c1", t + 3000) === false, "4th request blocked");
console.assert(rl.allow("c1", t + 11000) === true, "After window, allowed again");
console.assert(rl.allow("c2", t) === true, "Different client allowed");
console.log("Rate Limiter: Passed");

// Test Text Editor
const te = new TextEditor();
te.type("abc");
console.assert(te.getText() === "abc", "Type abc");
te.type("def");
console.assert(te.getText() === "abcdef", "Type def");
te.undo();
console.assert(te.getText() === "abc", "Undo removes def");
te.redo();
console.assert(te.getText() === "abcdef", "Redo restores def");
te.deleteChars(3);
console.assert(te.getText() === "abc", "Delete 3 chars");
te.undo();
console.assert(te.getText() === "abcdef", "Undo restores deleted");
te.type("!");
console.assert(te.getText() === "abcdef!", "Type !");
te.redo(); // Should do nothing
console.assert(te.getText() === "abcdef!", "Redo after new action = no-op");
console.log("Text Editor: Passed");

console.log("\nAll Real-World DSA tests passed!");
console.log();

console.log("=== COURSE RECAP: Files 21-25 ===");
console.log("21: Dynamic Programming | 22: Greedy | 23: Bit Manipulation");
console.log("24: LRU Cache | 25: Real-World DSA Applications");
console.log();

// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. Real-world problems COMBINE multiple data structures. Autocomplete
//    uses Trie + sorting. LRU uses HashMap + Doubly Linked List. Social
//    networks use Graphs + BFS. Master the combinations, not just the
//    individual structures.
// 2. Autocomplete (Trie): insert O(m), search O(p + n*m). Used by every
//    search engine and IDE. Store frequencies, return sorted results.
// 3. Social Network (Graph + BFS): friend suggestions via depth-2 BFS,
//    degrees of separation via shortest-path BFS. Both O(V + E).
// 4. Task Scheduler (Heap + Greedy): always schedule the most frequent
//    task first. Use a max-heap for O(log k) task selection per slot.
// 5. Rate Limiter (Sliding Window Queue): track request timestamps,
//    expire old ones, count within window. O(1) amortized per check.
// 6. Text Editor (Two Stacks): undo stack records actions, redo stack
//    stores undone actions. New actions clear the redo stack. All O(1).
// 7. The DSA Cheat Sheet is your interview quick-reference. Know the
//    Big-O for every data structure and when to use each one.
// 8. Pattern recognition is the #1 interview skill. "Top K" -> Heap,
//    "Shortest path" -> BFS, "Count ways" -> DP. Practice until these
//    patterns become automatic.
// 9. Every scenario in this file is interview-worthy. Practice
//    implementing each one from scratch in under 30 minutes.
// 10. DSA is not about memorization — it is about understanding WHY
//     each structure exists and WHEN to apply it. Build intuition
//     through deliberate practice: 2-3 problems daily for 3 months
//     will transform your problem-solving ability.
