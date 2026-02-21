// ============================================================
// FILE 05: STACKS
// Topic: The Stack data structure — LIFO principle, implementations, and classic problems
// WHY: Stacks are everywhere — browser back buttons, undo/redo in editors,
//   function call stacks in JS, expression evaluation in compilers. PhonePe's
//   navigation, Chrome's history, VS Code's undo — all stacks.
// ============================================================

// ============================================================
// EXAMPLE 1 — PhonePe Transaction Navigation Stack
// Story: When you use PhonePe, you navigate: Home -> Send Money -> Enter
//   Amount -> Confirm -> Receipt. Each screen is PUSHED onto the stack.
//   Pressing "Back" POPS the current screen, revealing the previous one.
//   This is LIFO — Last In, First Out — like a stack of thalis at a
//   Delhi wedding: you take from the top, not the bottom.
// ============================================================

// WHY: A Stack follows LIFO (Last In, First Out). The last element added
// is the first one removed. Fundamental to recursion, parsing, and navigation.

console.log("=== STACKS: LIFO (Last In, First Out) ===\n");

// ============================================================
// EXAMPLE 2 — Stack Implementation Using Array
// Story: PhonePe's mobile team implements their navigation stack using
//   an array. All operations are O(1). Simple and cache-friendly.
// ============================================================

// WHY: Arrays are the simplest way to implement a stack. push() and pop()
// at the end are both O(1) amortized.

class StackArray {
  constructor() { this.items = []; }

  push(item) { this.items.push(item); return this; } // O(1) amortized
  pop() {
    if (this.isEmpty()) throw new Error("Stack Underflow");
    return this.items.pop(); // O(1)
  }
  peek() { return this.isEmpty() ? undefined : this.items[this.items.length - 1]; } // O(1)
  isEmpty() { return this.items.length === 0; } // O(1)
  size() { return this.items.length; }          // O(1)
  clear() { this.items = []; }                  // O(1)
  display() { console.log("Stack (top->bottom):", [...this.items].reverse().join(" -> ")); }
}

// --- Test ---
console.log("--- Array-Based Stack ---\n");
const navStack = new StackArray();
navStack.push("Home"); navStack.push("Send Money");
navStack.push("Enter Amount"); navStack.push("Confirm"); navStack.push("Receipt");
navStack.display();

console.log("Peek:", navStack.peek());     // Receipt
console.log("Back:", navStack.pop());       // Receipt
console.log("Back:", navStack.pop());       // Confirm
console.log("Now at:", navStack.peek());    // Enter Amount
console.log("Size:", navStack.size());      // 3

console.log(`
+-------------------+----------+----------------------------------+
| Stack Operation   | Big-O    | Why                              |
+-------------------+----------+----------------------------------+
| push(item)        | O(1)*    | Append at end (*amortized)       |
| pop()             | O(1)     | Remove from end                  |
| peek()            | O(1)     | Access last element              |
| isEmpty()         | O(1)     | Check length                     |
| size()            | O(1)     | Return length                    |
+-------------------+----------+----------------------------------+
`);

// ============================================================
// EXAMPLE 3 — Stack Using Linked List
// Story: For backend systems where stack depth is unpredictable, PhonePe
//   uses a linked-list stack. No resizing — O(1) worst case, not amortized.
// ============================================================

// WHY: Linked list stack = O(1) worst case (no resize). More memory per
// element but no capacity limit.

class ListNode {
  constructor(value) { this.value = value; this.next = null; }
}

class StackLinkedList {
  constructor() { this.head = null; this._size = 0; }

  push(item) { // O(1) — always
    const node = new ListNode(item);
    node.next = this.head;
    this.head = node;
    this._size++;
    return this;
  }
  pop() { // O(1)
    if (this.isEmpty()) throw new Error("Stack Underflow");
    const val = this.head.value;
    this.head = this.head.next;
    this._size--;
    return val;
  }
  peek() { return this.isEmpty() ? undefined : this.head.value; }
  isEmpty() { return this.head === null; }
  size() { return this._size; }
  display() {
    const vals = []; let cur = this.head;
    while (cur) { vals.push(cur.value); cur = cur.next; }
    console.log("Stack (top->bottom):", vals.join(" -> "));
  }
}

console.log("--- Linked List Stack ---\n");
const llStack = new StackLinkedList();
llStack.push("Txn 1001: Rs 500"); llStack.push("Txn 1002: Rs 200"); llStack.push("Txn 1003: Rs 1500");
llStack.display();
console.log("Pop:", llStack.pop()); // Txn 1003
console.log("Peek:", llStack.peek()); // Txn 1002

// ============================================================
// EXAMPLE 4 — Problem 1: Valid Parentheses
// Story: PhonePe's expression parser validates mathematical expressions.
//   Before evaluating "((5+3)*2)", verify all brackets are balanced.
//   Stack is the perfect tool: push opening, pop on closing, check match.
// ============================================================

// WHY: #1 classic stack problem. Appears in almost every interview.

// Big-O: Time O(n), Space O(n)
function isValidParentheses(str) {
  const stack = [];
  const match = { ")": "(", "]": "[", "}": "{" };

  for (const char of str) {
    if ("([{".includes(char)) {
      stack.push(char);
    } else if (")]}".includes(char)) {
      if (stack.length === 0 || stack.pop() !== match[char]) return false;
    }
  }
  return stack.length === 0; // All brackets must be matched
}

console.log("\n--- Problem 1: Valid Parentheses ---\n");
console.log("'({[]})':", isValidParentheses("({[]})"));   // true
console.log("'([)]':", isValidParentheses("([)]"));       // false
console.log("'((()))':", isValidParentheses("((()))"));   // true
console.log("')(':", isValidParentheses(")("));           // false

// ============================================================
// EXAMPLE 5 — Problem 2: Reverse Polish Notation
// Story: PhonePe calculates transaction fees using RPN (postfix notation).
//   "5 3 +" instead of "5 + 3". No parentheses needed — stack evaluates
//   it perfectly: push numbers, pop two on operator, push result.
// ============================================================

// WHY: RPN is how calculators and compilers actually work. Clean, unambiguous.

// Big-O: Time O(n), Space O(n)
function evalRPN(tokens) {
  const stack = [];
  for (const token of tokens) {
    if (["+", "-", "*", "/"].includes(token)) {
      const b = stack.pop(), a = stack.pop();
      switch (token) {
        case "+": stack.push(a + b); break;
        case "-": stack.push(a - b); break;
        case "*": stack.push(a * b); break;
        case "/": stack.push(Math.trunc(a / b)); break;
      }
    } else {
      stack.push(Number(token));
    }
  }
  return stack[0];
}

console.log("\n--- Problem 2: Reverse Polish Notation ---\n");
console.log('["2","3","+"] =', evalRPN(["2", "3", "+"]));             // 5
console.log('["2","3","+","4","*"] =', evalRPN(["2", "3", "+", "4", "*"])); // 20
// Trace: 2,3 on stack -> + pops both, pushes 5 -> 4 on stack -> * pops 5,4, pushes 20

// ============================================================
// EXAMPLE 6 — Problem 3: Min Stack — O(1) getMin
// Story: PhonePe tracks minimum transaction in a batch. As transactions
//   are pushed/popped, they need the current minimum at ALL times in O(1).
//   An auxiliary stack tracks minimums alongside the main stack.
// ============================================================

// WHY: Min Stack augments a stack with a secondary stack tracking minimums.
// Common interview question at Amazon, Google, Microsoft.

// Big-O: All operations O(1). Space O(n).
class MinStack {
  constructor() { this.stack = []; this.minStack = []; }

  push(val) {
    this.stack.push(val);
    if (this.minStack.length === 0 || val <= this.minStack[this.minStack.length - 1])
      this.minStack.push(val); // Track new minimum (use <= for duplicates)
  }
  pop() {
    const val = this.stack.pop();
    if (val === this.minStack[this.minStack.length - 1]) this.minStack.pop();
    return val;
  }
  top() { return this.stack[this.stack.length - 1]; }
  getMin() { return this.minStack[this.minStack.length - 1]; } // O(1)!
}

console.log("\n--- Problem 3: Min Stack ---\n");
const minStack = new MinStack();
minStack.push(500); minStack.push(200); minStack.push(800); minStack.push(100); minStack.push(100);
console.log("Min:", minStack.getMin()); // 100
minStack.pop();
console.log("After pop, min:", minStack.getMin()); // 100 (duplicate tracked)
minStack.pop();
console.log("After pop, min:", minStack.getMin()); // 200
minStack.pop();
console.log("After pop, min:", minStack.getMin()); // 200
minStack.pop();
console.log("After pop, min:", minStack.getMin()); // 500

// ============================================================
// EXAMPLE 7 — Problem 4: Next Greater Element (Monotonic Stack)
// Story: Swiggy delivery optimization: for each zone's order count,
//   find the NEXT zone (to the right) with a HIGHER count. Monotonic
//   stack solves this in O(n) instead of O(n^2) brute force.
// ============================================================

// WHY: Monotonic stack is one of the most powerful stack patterns.
// Maintains a decreasing stack; pops when a greater element is found.

// Big-O: Time O(n), Space O(n)
function nextGreaterElement(arr) {
  const result = new Array(arr.length).fill(-1);
  const stack = []; // Stack of INDICES

  for (let i = 0; i < arr.length; i++) {
    while (stack.length > 0 && arr[i] > arr[stack[stack.length - 1]]) {
      result[stack.pop()] = arr[i]; // Current is "next greater" for popped
    }
    stack.push(i);
  }
  // Remaining indices in stack have no next greater (-1)
  return result;
  // Each index pushed once, popped once -> O(2n) = O(n)
}

console.log("\n--- Problem 4: Next Greater Element ---\n");
const orders = [4, 5, 2, 25, 7, 18, 3];
console.log("Orders:", orders);
console.log("Next greater:", nextGreaterElement(orders));
// [5, 25, 25, -1, 18, -1, -1]
// 4->5, 5->25, 2->25, 25->none, 7->18, 18->none, 3->none

// ============================================================
// EXAMPLE 8 — Problem 5: Queue Using Two Stacks
// Story: PhonePe's message system needs FIFO (queue) but the underlying
//   system only provides stacks. Two stacks simulate a queue: inStack
//   for enqueue, outStack for dequeue. Pouring between them reverses
//   order, converting LIFO to FIFO. O(1) amortized per operation.
// ============================================================

// WHY: Teaches composing one data structure from another. Each element
// moves between stacks at most once -> O(1) amortized.

class QueueFromStacks {
  constructor() { this.inStack = []; this.outStack = []; }

  enqueue(item) { this.inStack.push(item); } // O(1)

  dequeue() { // O(1) amortized
    if (this.outStack.length === 0) {
      while (this.inStack.length > 0)
        this.outStack.push(this.inStack.pop()); // Pour — reverses order
    }
    if (this.outStack.length === 0) throw new Error("Queue empty");
    return this.outStack.pop();
  }

  peek() {
    if (this.outStack.length === 0)
      while (this.inStack.length > 0) this.outStack.push(this.inStack.pop());
    return this.outStack[this.outStack.length - 1];
  }

  isEmpty() { return this.inStack.length === 0 && this.outStack.length === 0; }
  size() { return this.inStack.length + this.outStack.length; }
}

console.log("\n--- Problem 5: Queue from Two Stacks ---\n");
const queue = new QueueFromStacks();
queue.enqueue("Order 1"); queue.enqueue("Order 2"); queue.enqueue("Order 3");
console.log("Peek (FIFO):", queue.peek());   // Order 1
console.log("Dequeue:", queue.dequeue());     // Order 1
console.log("Dequeue:", queue.dequeue());     // Order 2
queue.enqueue("Order 4");
console.log("Dequeue:", queue.dequeue());     // Order 3
console.log("Dequeue:", queue.dequeue());     // Order 4

// ============================================================
// EXAMPLE 9 — The JavaScript Call Stack
// Story: Every JS function call pushes a frame onto the CALL STACK.
//   Return pops it. Stack overflow = call stack out of space. This
//   is a direct connection to the stack data structure.
// ============================================================

// WHY: Understanding the call stack is crucial for debugging recursion.

function funcA() {
  console.log("  A starts"); // Stack: [global, A]
  funcB();
  console.log("  A ends");
}
function funcB() {
  console.log("  B starts"); // Stack: [global, A, B]
  funcC();
  console.log("  B ends");
}
function funcC() {
  console.log("  C starts"); // Stack: [global, A, B, C] — deepest
  console.log("  C ends");   // C returns, popped
}

console.log("\n--- JavaScript Call Stack ---\n");
funcA();
// Call stack at deepest: C on top, then B, A, global at bottom

// Stack overflow: too many recursive calls
// function infinite(n) { return infinite(n + 1); }
// infinite(0); // RangeError: Maximum call stack size exceeded
console.log("\n(Stack overflow demo: would crash with RangeError)");

// ============================================================
// EXAMPLE 10 — Browser History: Two Stacks
// Story: Chrome's Back/Forward buttons work as two stacks. Visit pushes
//   to back stack. Back pops from back, pushes to forward. Forward does
//   the reverse. New visit clears forward stack.
// ============================================================

// WHY: Real-world two-stack problem everyone uses daily.

class BrowserHistory {
  constructor(homepage) { this.backStack = [homepage]; this.forwardStack = []; }

  visit(url) {
    this.backStack.push(url);
    this.forwardStack = []; // New visit clears forward
    console.log(`  Visit: ${url}`);
  }
  back() {
    if (this.backStack.length <= 1) return this.backStack[0];
    this.forwardStack.push(this.backStack.pop());
    const page = this.backStack[this.backStack.length - 1];
    console.log(`  Back -> ${page}`);
    return page;
  }
  forward() {
    if (this.forwardStack.length === 0) return this.backStack[this.backStack.length - 1];
    const page = this.forwardStack.pop();
    this.backStack.push(page);
    console.log(`  Forward -> ${page}`);
    return page;
  }
}

console.log("\n--- Browser History ---\n");
const browser = new BrowserHistory("google.com");
browser.visit("flipkart.com");
browser.visit("flipkart.com/phones");
browser.back();    // flipkart.com
browser.back();    // google.com
browser.forward(); // flipkart.com
browser.visit("flipkart.com/electronics"); // Clears forward

// ============================================================
// EXAMPLE 11 — Undo/Redo System
// Story: VS Code's Ctrl+Z (undo) and Ctrl+Y (redo). Every action
//   pushes to undo stack. Undo pops from undo, pushes to redo.
//   New action clears redo stack.
// ============================================================

// WHY: Most practical two-stack application. Every editor uses this.

class UndoRedoSystem {
  constructor() { this.undoStack = []; this.redoStack = []; this.doc = ""; }

  performAction(text) {
    this.undoStack.push(this.doc);
    this.doc += text;
    this.redoStack = [];
    console.log(`  Type "${text}" -> "${this.doc}"`);
  }
  undo() {
    if (this.undoStack.length === 0) { console.log("  Nothing to undo"); return; }
    this.redoStack.push(this.doc);
    this.doc = this.undoStack.pop();
    console.log(`  Undo -> "${this.doc}"`);
  }
  redo() {
    if (this.redoStack.length === 0) { console.log("  Nothing to redo"); return; }
    this.undoStack.push(this.doc);
    this.doc = this.redoStack.pop();
    console.log(`  Redo -> "${this.doc}"`);
  }
}

console.log("\n--- Undo/Redo ---\n");
const editor = new UndoRedoSystem();
editor.performAction("Hello");    // "Hello"
editor.performAction(" World");   // "Hello World"
editor.performAction("!");        // "Hello World!"
editor.undo();                     // "Hello World"
editor.undo();                     // "Hello"
editor.redo();                     // "Hello World"
editor.performAction(" India");   // "Hello World India" — clears redo
editor.redo();                     // Nothing to redo

// ============================================================
// EXAMPLE 12 — Daily Temperatures (Monotonic Stack Variation)
// Story: Swiggy predicts delivery demand spikes. For each day's temp,
//   find how many days until a warmer day. Same monotonic stack pattern
//   as Next Greater Element, but returns index DISTANCE.
// ============================================================

// Big-O: Time O(n), Space O(n)
function dailyTemperatures(temps) {
  const result = new Array(temps.length).fill(0);
  const stack = [];
  for (let i = 0; i < temps.length; i++) {
    while (stack.length > 0 && temps[i] > temps[stack[stack.length - 1]]) {
      const prev = stack.pop();
      result[prev] = i - prev; // Distance to warmer day
    }
    stack.push(i);
  }
  return result;
}

console.log("\n--- Daily Temperatures ---\n");
console.log("Temps:", [30, 28, 35, 32, 38, 25, 27, 40]);
console.log("Wait:", dailyTemperatures([30, 28, 35, 32, 38, 25, 27, 40]));
// [2, 1, 2, 1, 3, 1, 1, 0]

// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. Stack = LIFO. push() adds to top, pop() removes from top. All O(1).
// 2. Array-based: O(1) amortized. Linked-list: O(1) worst case.
// 3. Valid Parentheses: push opening, pop on closing, check match — O(n)
// 4. RPN Evaluation: push numbers, pop two on operator, push result — O(n)
// 5. Min Stack: auxiliary stack tracks minimums — O(1) getMin
// 6. Next Greater Element: monotonic (decreasing) stack — O(n)
// 7. Queue from Two Stacks: inStack + outStack — O(1) amortized
// 8. JS Call Stack: every function call pushes a frame, return pops it
// 9. Browser history and undo/redo = real-world two-stack systems
// 10. Monotonic stack pattern: solves "next greater/smaller" in O(n)
// ============================================================
