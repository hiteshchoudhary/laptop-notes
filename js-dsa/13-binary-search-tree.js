// ============================================================
// FILE 13: BINARY SEARCH TREE (BST)
// Topic: BST Operations, Validation, LCA, and Balancing
// WHY: A BST is a binary tree with an ordering property that
//      enables O(log n) search, insert, and delete — when balanced.
//      BookMyShow uses BST-like structures to quickly find the
//      cheapest seat >= Rs.500 or the most expensive <= Rs.2000
//      among millions of listings.
// ============================================================

// ============================================================
// EXAMPLE 1 — BST Property and Why It Matters
// Story: BookMyShow manages seat pricing across 8,000+ screens
//        in India. When a user filters "show me seats between
//        Rs.500 and Rs.2000", the system needs to search through
//        thousands of price points instantly. A BST stores prices
//        such that left < root < right, enabling O(log n) range
//        queries. Without this ordering, every query would be a
//        full O(n) scan.
// ============================================================

// WHY: left < root < right for every node — this ordering is what makes
// O(log n) search, insert, and delete possible.

class TreeNode {
  constructor(value) {
    this.value = value;
    this.left = null;
    this.right = null;
  }
}

// --- BST Class Implementation ---
class BST {
  constructor() {
    this.root = null;
  }

  // --- INSERT ---
  // WHY: Compare the value with each node and go left (smaller) or
  // right (larger) until you find an empty spot.
  // Big-O: O(log n) average, O(n) worst case (degenerate/skewed tree)
  insert(value) {
    const newNode = new TreeNode(value);

    if (this.root === null) {
      this.root = newNode;
      return this;
    }

    let current = this.root;

    while (true) {
      // Ignore duplicates (or handle as you prefer)
      if (value === current.value) return this;

      if (value < current.value) {
        // Go left
        if (current.left === null) {
          current.left = newNode;  // Found the spot
          return this;
        }
        current = current.left;
      } else {
        // Go right
        if (current.right === null) {
          current.right = newNode; // Found the spot
          return this;
        }
        current = current.right;
      }
    }
  }

  // --- SEARCH ---
  // WHY: Same logic as insert — compare and traverse left or right.
  // Big-O: O(log n) average, O(n) worst case
  search(value) {
    let current = this.root;

    while (current !== null) {
      if (value === current.value) return current;   // Found!
      if (value < current.value) {
        current = current.left;    // Go left
      } else {
        current = current.right;   // Go right
      }
    }

    return null; // Not found
  }

  // --- FIND MIN ---
  // WHY: The minimum value in a BST is the leftmost node.
  // Big-O: O(h) where h = height
  findMin(node = this.root) {
    if (node === null) return null;
    let current = node;
    while (current.left !== null) {
      current = current.left;
    }
    return current;
  }

  // --- FIND MAX ---
  // WHY: The maximum value in a BST is the rightmost node.
  // Big-O: O(h) where h = height
  findMax(node = this.root) {
    if (node === null) return null;
    let current = node;
    while (current.right !== null) {
      current = current.right;
    }
    return current;
  }

  // --- DELETE ---
  // WHY: Deletion in a BST has 3 cases. This is the trickiest BST operation.
  // Big-O: O(log n) average, O(n) worst case
  delete(value) {
    this.root = this._deleteNode(this.root, value);
  }

  _deleteNode(node, value) {
    if (node === null) return null;

    if (value < node.value) {
      // Value is in left subtree
      node.left = this._deleteNode(node.left, value);
    } else if (value > node.value) {
      // Value is in right subtree
      node.right = this._deleteNode(node.right, value);
    } else {
      // FOUND the node to delete! Handle 3 cases:

      // Case 1: LEAF node (no children) — just remove it
      if (node.left === null && node.right === null) {
        return null;
      }

      // Case 2: ONE CHILD — replace node with its child
      if (node.left === null) return node.right;
      if (node.right === null) return node.left;

      // Case 3: TWO CHILDREN — replace with inorder successor
      // Inorder successor = smallest node in right subtree
      const successor = this.findMin(node.right);
      node.value = successor.value;                           // Copy successor's value
      node.right = this._deleteNode(node.right, successor.value); // Delete successor
    }

    return node;
  }

  // --- INORDER TRAVERSAL ---
  // WHY: Inorder traversal of a BST gives SORTED output.
  // This is the defining characteristic of BSTs!
  // Big-O: O(n)
  inorderTraversal(node = this.root, result = []) {
    if (node === null) return result;
    this.inorderTraversal(node.left, result);
    result.push(node.value);
    this.inorderTraversal(node.right, result);
    return result;
  }

  // --- PREORDER TRAVERSAL ---
  // Big-O: O(n)
  preorderTraversal(node = this.root, result = []) {
    if (node === null) return result;
    result.push(node.value);
    this.preorderTraversal(node.left, result);
    this.preorderTraversal(node.right, result);
    return result;
  }
}

// --- Demo: Build and use a BST ---
console.log('=== BST CREATION AND OPERATIONS ===');

const bst = new BST();
//        50
//       /  \
//      30   70
//     / \   / \
//    20 40 60  80
//   /           \
//  10           90

[50, 30, 70, 20, 40, 60, 80, 10, 90].forEach(v => bst.insert(v));

console.log('Inorder (sorted):', bst.inorderTraversal());
// [10, 20, 30, 40, 50, 60, 70, 80, 90]

console.log('Search 40:', bst.search(40)?.value);   // 40
console.log('Search 45:', bst.search(45));           // null

console.log('Min:', bst.findMin()?.value);           // 10
console.log('Max:', bst.findMax()?.value);            // 90


// ============================================================
// EXAMPLE 2 — BST Deletion: The Three Cases
// Story: BookMyShow needs to remove sold-out show timings from
//        the pricing BST. Deleting a node with two children is
//        the tricky case — you must find the inorder successor
//        (next higher price) to maintain BST ordering. Getting
//        this wrong corrupts the entire search structure.
// ============================================================

console.log('\n=== BST DELETION ===');
console.log('Before deletion:', bst.inorderTraversal());
// [10, 20, 30, 40, 50, 60, 70, 80, 90]

// Case 1: Delete leaf (10)
bst.delete(10);
console.log('After deleting 10 (leaf):', bst.inorderTraversal());
// [20, 30, 40, 50, 60, 70, 80, 90]

// Case 2: Delete node with one child (20 has no left child now)
bst.delete(20);
console.log('After deleting 20 (one child):', bst.inorderTraversal());
// [30, 40, 50, 60, 70, 80, 90]

// Case 3: Delete node with two children (50 — the root!)
bst.delete(50);
console.log('After deleting 50 (two children):', bst.inorderTraversal());
// [30, 40, 60, 70, 80, 90]
// 60 (inorder successor of 50) becomes the new root

// Delete non-existent value — no change
bst.delete(999);
console.log('After deleting 999 (not found):', bst.inorderTraversal());


// ============================================================
// EXAMPLE 3 — Validate BST
// Story: A junior developer at BookMyShow accidentally built a
//        tree without enforcing BST ordering. Queries started
//        returning wrong results. The senior engineer wrote a
//        validator that checks: is every node greater than all
//        nodes in its left subtree and less than all nodes in
//        its right subtree?
// ============================================================

// WHY: The naive approach checking only immediate children is WRONG.
// Must pass min/max bounds recursively.

// CORRECT approach (pass bounds — the naive "check immediate children" is WRONG):
function isValidBST(node, min = -Infinity, max = Infinity) {
  if (node === null) return true;

  // This node must be within (min, max) range
  if (node.value <= min || node.value >= max) return false;

  // Left subtree: all values must be < node.value
  // Right subtree: all values must be > node.value
  return (
    isValidBST(node.left, min, node.value) &&
    isValidBST(node.right, node.value, max)
  );
}

// Big-O: O(n) — visit every node once

console.log('\n=== VALIDATE BST ===');
console.log('Our BST is valid?', isValidBST(bst.root)); // true

// Build an INVALID BST to test
//      5
//     / \
//    3   7
//   / \
//  2   8  ← 8 > 5, violates BST at grandparent level!
const invalidBST = new TreeNode(5);
invalidBST.left = new TreeNode(3);
invalidBST.right = new TreeNode(7);
invalidBST.left.left = new TreeNode(2);
invalidBST.left.right = new TreeNode(8); // WRONG: 8 > 5

console.log('Invalid BST — correct check:', isValidBST(invalidBST)); // false (8 > 5 at grandparent)


// ============================================================
// EXAMPLE 4 — Inorder Successor, Predecessor, and Kth Smallest
// Story: On BookMyShow, after showing a user the Rs.500 seat,
//        the system suggests the "next cheapest available" seat.
//        That is the inorder successor. Or "previous cheapest"
//        which is the inorder predecessor. Finding the kth
//        cheapest seat (kth smallest element) uses the same
//        inorder traversal idea.
// ============================================================

// WHY: Inorder successor/predecessor and kth smallest are classic
// BST problems that test your understanding of inorder traversal.

// --- Inorder Successor (next larger value) ---
function inorderSuccessor(root, target) {
  let successor = null;
  let current = root;

  while (current !== null) {
    if (target < current.value) {
      successor = current;       // This could be the successor
      current = current.left;    // Look for a closer (smaller) candidate
    } else {
      current = current.right;   // Target >= current, go right
    }
  }

  return successor;
}

// Big-O: O(h) where h = height

// --- Inorder Predecessor (previous smaller value) ---
function inorderPredecessor(root, target) {
  let predecessor = null;
  let current = root;

  while (current !== null) {
    if (target > current.value) {
      predecessor = current;     // This could be the predecessor
      current = current.right;   // Look for a closer (larger) candidate
    } else {
      current = current.left;    // Target <= current, go left
    }
  }

  return predecessor;
}

// Big-O: O(h)

// Rebuild a fresh BST for these demos
const bst2 = new BST();
[50, 30, 70, 20, 40, 60, 80].forEach(v => bst2.insert(v));

console.log('\n=== INORDER SUCCESSOR & PREDECESSOR ===');
console.log('BST:', bst2.inorderTraversal());
// [20, 30, 40, 50, 60, 70, 80]

console.log('Successor of 30:', inorderSuccessor(bst2.root, 30)?.value);   // 40
console.log('Successor of 80:', inorderSuccessor(bst2.root, 80)?.value);   // undefined
console.log('Predecessor of 40:', inorderPredecessor(bst2.root, 40)?.value); // 30
console.log('Predecessor of 20:', inorderPredecessor(bst2.root, 20)?.value); // undefined

// --- Kth Smallest Element ---
// WHY: Inorder traversal gives sorted order. Stop at the kth element.
function kthSmallest(root, k) {
  const stack = [];
  let current = root;
  let count = 0;

  // Iterative inorder traversal — stops at kth element
  while (current !== null || stack.length > 0) {
    while (current !== null) {
      stack.push(current);
      current = current.left;
    }

    current = stack.pop();
    count++;

    if (count === k) return current.value; // Found kth smallest!

    current = current.right;
  }

  return -1; // k is larger than tree size
}

// Big-O: O(h + k) — go to leftmost (h steps), then k more steps

console.log('\n=== KTH SMALLEST ELEMENT ===');
console.log('1st smallest:', kthSmallest(bst2.root, 1)); // 20
console.log('3rd smallest:', kthSmallest(bst2.root, 3)); // 40
console.log('5th smallest:', kthSmallest(bst2.root, 5)); // 60
console.log('7th smallest:', kthSmallest(bst2.root, 7)); // 80


// ============================================================
// EXAMPLE 5 — Lowest Common Ancestor (LCA) in BST
// Story: BookMyShow wants to display all price ranges between
//        two selected seats. The lowest common ancestor in the
//        pricing BST gives the "branching point" — from there,
//        you can find all prices in between. In a BST, LCA is
//        elegant: exploit the ordering property.
// ============================================================

// WHY: LCA in a BST is simpler than in a general binary tree because
// the BST ordering tells you exactly which direction to go.

function lowestCommonAncestor(root, p, q) {
  let current = root;

  while (current !== null) {
    if (p < current.value && q < current.value) {
      // Both values are in the left subtree
      current = current.left;
    } else if (p > current.value && q > current.value) {
      // Both values are in the right subtree
      current = current.right;
    } else {
      // Split point: p and q are on different sides (or one equals current)
      // THIS is the LCA
      return current;
    }
  }

  return null;
}

// Big-O: O(h) — just traverse down the tree once

console.log('\n=== LOWEST COMMON ANCESTOR ===');
console.log('LCA(20, 40):', lowestCommonAncestor(bst2.root, 20, 40)?.value); // 30
console.log('LCA(20, 60):', lowestCommonAncestor(bst2.root, 20, 60)?.value); // 50
console.log('LCA(60, 80):', lowestCommonAncestor(bst2.root, 60, 80)?.value); // 70


// ============================================================
// EXAMPLE 6 — BST from Sorted Array and Degenerate Trees
// Story: BookMyShow receives seat prices already sorted. If they
//        insert [100, 200, 300, 400, 500] sequentially into a
//        BST, it becomes a linked list (right-skewed). Search
//        degrades to O(n). The fix: pick the MIDDLE element as
//        root, recurse on each half — creating a BALANCED BST.
// ============================================================

// WHY: This demonstrates why balanced BSTs matter and how to
// construct one from sorted data.

// --- BST from Sorted Array → Balanced BST ---
function sortedArrayToBST(arr, left = 0, right = arr.length - 1) {
  if (left > right) return null;

  const mid = left + Math.floor((right - left) / 2);
  const node = new TreeNode(arr[mid]);   // Middle element becomes root

  node.left = sortedArrayToBST(arr, left, mid - 1);   // Left half
  node.right = sortedArrayToBST(arr, mid + 1, right);  // Right half

  return node;
}

// Big-O: Time O(n), Space O(log n) recursion stack

const sortedPrices = [100, 200, 300, 400, 500, 600, 700, 800, 900];
const balancedBST = sortedArrayToBST(sortedPrices);

console.log('\n=== BST FROM SORTED ARRAY ===');
console.log('Input:', sortedPrices);

// Helper to get inorder traversal without class
function inorder(node, result = []) {
  if (node === null) return result;
  inorder(node.left, result);
  result.push(node.value);
  inorder(node.right, result);
  return result;
}

function getHeight(node) {
  if (node === null) return -1;
  return Math.max(getHeight(node.left), getHeight(node.right)) + 1;
}

console.log('Inorder (sorted):', inorder(balancedBST));
// [100, 200, 300, 400, 500, 600, 700, 800, 900]
console.log('Height of balanced BST:', getHeight(balancedBST)); // 3

// --- Degenerate BST (inserting sorted data sequentially) ---
// WHY: This is the WORST CASE for BSTs. Every insert goes right,
// creating a linked list. All operations become O(n).

const degenerateBST = new BST();
[100, 200, 300, 400, 500].forEach(v => degenerateBST.insert(v));

console.log('\n=== DEGENERATE BST (Worst Case) ===');
console.log('Inorder:', degenerateBST.inorderTraversal());
console.log('Height:', getHeight(degenerateBST.root)); // 4 (essentially a linked list)
console.log('For 5 nodes, balanced height would be:', Math.floor(Math.log2(5))); // 2
console.log('Degenerate height:', 4, '— O(n) operations!');


// ============================================================
// EXAMPLE 7 — Self-Balancing Trees & Floor/Ceil Operations
// Story: BookMyShow's production systems use self-balancing trees
//        (like Red-Black Trees) to guarantee O(log n) worst case.
//        JavaScript's V8 engine uses Red-Black Trees internally
//        for Map/Set when keys are integers. Java's TreeMap and
//        C++ std::map also use Red-Black Trees. Understanding
//        WHY they exist is crucial even if you do not implement them.
// ============================================================

// WHY: Regular BSTs can degenerate to O(n). Self-balancing trees
// guarantee O(log n) by rebalancing after every insert/delete.

console.log('\n=== SELF-BALANCING TREES (Concepts) ===');
console.log('AVL Tree: strict balance (|height diff| <= 1), rotations on insert/delete');
console.log('Red-Black Tree: relaxed balance, fewer rotations, used in Java TreeMap, C++ std::map');
console.log('B-Tree/B+ Tree: multi-way, disk-optimized, used in MongoDB/PostgreSQL indexes');

// --- Floor and Ceil in BST ---
// WHY: Floor(x) = largest value <= x. Ceil(x) = smallest value >= x.
// Used in "find nearest available seat price".

function floor(root, target) {
  let result = null;
  let current = root;

  while (current !== null) {
    if (current.value === target) return current.value;

    if (current.value < target) {
      result = current.value;  // Candidate for floor
      current = current.right; // Try to find a closer (larger) value
    } else {
      current = current.left;  // current is too large
    }
  }

  return result;
}

function ceil(root, target) {
  let result = null;
  let current = root;

  while (current !== null) {
    if (current.value === target) return current.value;

    if (current.value > target) {
      result = current.value;  // Candidate for ceil
      current = current.left;  // Try to find a closer (smaller) value
    } else {
      current = current.right; // current is too small
    }
  }

  return result;
}

// Big-O: O(h) for both

console.log('\n=== FLOOR & CEIL IN BST ===');
// balancedBST has: [100, 200, 300, 400, 500, 600, 700, 800, 900]
console.log('Floor(350):', floor(balancedBST, 350));  // 300
console.log('Floor(50):', floor(balancedBST, 50));    // null
console.log('Ceil(350):', ceil(balancedBST, 350));    // 400
console.log('Ceil(950):', ceil(balancedBST, 950));    // null

// --- Range Query: Find all values in [low, high] ---
// WHY: BST ordering lets us prune entire subtrees. O(h + k).
function rangeQuery(node, low, high, result = []) {
  if (node === null) return result;
  if (node.value > low) rangeQuery(node.left, low, high, result);
  if (node.value >= low && node.value <= high) result.push(node.value);
  if (node.value < high) rangeQuery(node.right, low, high, result);
  return result;
}

console.log('\n=== RANGE QUERY ===');
console.log('Values in [250, 650]:', rangeQuery(balancedBST, 250, 650)); // [300, 400, 500, 600]
console.log('Values in [100, 300]:', rangeQuery(balancedBST, 100, 300)); // [100, 200, 300]

// ============================================================
// EXAMPLE 8 — Practical: Complete BST Problem Set
// Story: The BookMyShow engineering team runs a weekly DSA
//        problem-solving session. This week: BST problems that
//        appear in FAANG interviews. These test deep understanding
//        of BST properties, not just basic operations.
// ============================================================

// --- Problem 1: Check if array is preorder of a BST ---
// WHY: Given a preorder traversal, verify it could come from a valid BST.
function isValidPreorder(preorder) {
  let minBound = -Infinity;
  const stack = [];

  for (const value of preorder) {
    if (value < minBound) return false;

    // Pop elements smaller than current — they are in the left subtree
    // of a previously seen ancestor. Current must be in right subtree.
    while (stack.length > 0 && stack[stack.length - 1] < value) {
      minBound = stack.pop();
    }

    stack.push(value);
  }

  return true;
}

// Big-O: O(n)

console.log('\n=== PROBLEM 1: VALID PREORDER ===');
console.log('Is [50,30,20,40,70,60,80] valid preorder?', isValidPreorder([50,30,20,40,70,60,80])); // true
console.log('Is [50,30,60,20,40] valid preorder?', isValidPreorder([50,30,60,20,40])); // false

// --- Problem 2: Two Sum in BST ---
// WHY: Find if two nodes in BST sum to a target.
function twoSumBST(root, target) {
  const seen = new Set();

  function dfs(node) {
    if (node === null) return false;

    if (seen.has(target - node.value)) return true;
    seen.add(node.value);

    return dfs(node.left) || dfs(node.right);
  }

  return dfs(root);
}

// Big-O: O(n) time, O(n) space

console.log('\n=== PROBLEM 2: TWO SUM IN BST ===');
console.log('Two sum = 90?', twoSumBST(bst2.root, 90));    // true (20+70)
console.log('Two sum = 15?', twoSumBST(bst2.root, 15));     // false


// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. BST Property: left < root < right for ALL subtrees, not
//    just immediate children.
// 2. Operations: insert O(log n) avg, search O(log n) avg,
//    delete O(log n) avg — all O(n) worst case for skewed trees.
// 3. Deletion has 3 cases: leaf (remove), one child (replace),
//    two children (replace with inorder successor).
// 4. Inorder traversal of BST = SORTED output. This is the key
//    reason BSTs exist.
// 5. Validate BST: pass min/max bounds recursively, NOT just
//    check immediate children.
// 6. LCA in BST: if both < root go left, both > root go right,
//    else current node is the LCA. O(h).
// 7. Kth smallest: iterative inorder, stop at k. O(h + k).
// 8. Sorted array to balanced BST: pick middle as root, recurse.
//    Prevents degenerate (linked list) BSTs.
// 9. Degenerate BST: inserting sorted data makes a linked list.
//    All operations become O(n).
// 10. Self-balancing trees (AVL, Red-Black) guarantee O(log n)
//     worst case. Used in production systems everywhere.
// ============================================================

console.log('\n=== ALL BST EXAMPLES COMPLETE ===');
