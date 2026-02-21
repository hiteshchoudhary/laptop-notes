// ============================================================
// FILE 12: TREES — BASICS & TRAVERSALS
// Topic: Binary Trees, Traversals, and Core Tree Operations
// WHY: Trees model hierarchical data everywhere — file systems,
//      HTML DOM, org charts, and product categories. Flipkart's
//      entire category navigation is a tree. Understanding tree
//      traversals unlocks solutions to 30%+ of coding interviews.
// ============================================================

// ============================================================
// EXAMPLE 1 — What is a Tree? Flipkart's Category Hierarchy
// Story: Flipkart organizes 150M+ products into a category tree.
//        Electronics → Mobiles → Samsung → Galaxy S24. When you
//        click "Electronics" in the dropdown, Flipkart traverses
//        the tree to show subcategories. Every e-commerce site,
//        every file browser, every database index is a tree.
// ============================================================

// WHY: A tree is a non-linear data structure with nodes connected
// by edges, forming a parent-child hierarchy. Unlike arrays and
// linked lists (linear), trees allow O(log n) operations when balanced.

// --- Tree Terminology ---
// Root: topmost node | Parent: has children | Child: has parent
// Sibling: same parent | Leaf: no children | Depth: distance from root
// Height: distance to deepest leaf | Subtree: node + all descendants

// --- Binary Tree: each node has at most 2 children (left, right) ---

class TreeNode {
  constructor(value) {
    this.value = value;
    this.left = null;     // Left child
    this.right = null;    // Right child
  }
}

// --- Build a sample tree manually ---
//         1
//        / \
//       2   3
//      / \   \
//     4   5   6
//    /       / \
//   7       8   9

const root = new TreeNode(1);
root.left = new TreeNode(2);
root.right = new TreeNode(3);
root.left.left = new TreeNode(4);
root.left.right = new TreeNode(5);
root.right.right = new TreeNode(6);
root.left.left.left = new TreeNode(7);
root.right.right.left = new TreeNode(8);
root.right.right.right = new TreeNode(9);

console.log('=== BINARY TREE CREATED ===');
console.log('Root:', root.value);                      // 1
console.log('Root.left:', root.left.value);             // 2
console.log('Root.right:', root.right.value);           // 3
console.log('Root.left.left:', root.left.left.value);   // 4


// ============================================================
// EXAMPLE 2 — Tree Traversals: The Core of Tree Mastery
// Story: Flipkart's search indexing team needs to visit every
//        product category node to build the search index. The
//        ORDER in which you visit nodes matters hugely. Inorder
//        gives sorted data from a BST. Preorder lets you copy
//        the tree. Postorder lets you delete it safely. Level-
//        order shows the category breadth at each depth level.
// ============================================================

// WHY: There are 4 main traversals. Mastering all 4 (recursive + iterative)
// is essential for tree problems.

// --- Traversal 1: INORDER (Left → Root → Right) ---
// WHY: For a BST, inorder gives SORTED order.

// Recursive version (natural, clean)
function inorderRecursive(node, result = []) {
  if (node === null) return result;

  inorderRecursive(node.left, result);    // Visit left subtree
  result.push(node.value);                // Visit root
  inorderRecursive(node.right, result);   // Visit right subtree

  return result;
}

// Iterative version using explicit stack (avoids stack overflow)
function inorderIterative(root) {
  const result = [];
  const stack = [];
  let current = root;

  while (current !== null || stack.length > 0) {
    // Go as far left as possible
    while (current !== null) {
      stack.push(current);
      current = current.left;
    }

    // Process the node
    current = stack.pop();
    result.push(current.value);

    // Move to right subtree
    current = current.right;
  }

  return result;
}

// Big-O: Time O(n) — visit every node. Space O(h) where h = height.

console.log('\n=== INORDER TRAVERSAL (Left → Root → Right) ===');
console.log('Recursive:', inorderRecursive(root));   // [7, 4, 2, 5, 1, 3, 8, 6, 9]
console.log('Iterative:', inorderIterative(root));   // [7, 4, 2, 5, 1, 3, 8, 6, 9]

// --- Traversal 2: PREORDER (Root → Left → Right) ---
// WHY: Visits root FIRST. Useful for copying/serializing trees.

function preorderRecursive(node, result = []) {
  if (node === null) return result;

  result.push(node.value);                 // Visit root FIRST
  preorderRecursive(node.left, result);    // Then left subtree
  preorderRecursive(node.right, result);   // Then right subtree

  return result;
}

function preorderIterative(root) {
  if (root === null) return [];

  const result = [];
  const stack = [root];

  while (stack.length > 0) {
    const node = stack.pop();
    result.push(node.value);

    // Push right first so left is processed first (LIFO)
    if (node.right) stack.push(node.right);
    if (node.left) stack.push(node.left);
  }

  return result;
}

// Big-O: Time O(n), Space O(h)

console.log('\n=== PREORDER TRAVERSAL (Root → Left → Right) ===');
console.log('Recursive:', preorderRecursive(root));   // [1, 2, 4, 7, 5, 3, 6, 8, 9]
console.log('Iterative:', preorderIterative(root));   // [1, 2, 4, 7, 5, 3, 6, 8, 9]

// --- Traversal 3: POSTORDER (Left → Right → Root) ---
// WHY: Visits root LAST. Useful for deletion and expression evaluation.

function postorderRecursive(node, result = []) {
  if (node === null) return result;

  postorderRecursive(node.left, result);   // Left subtree first
  postorderRecursive(node.right, result);  // Right subtree second
  result.push(node.value);                 // Visit root LAST

  return result;
}

function postorderIterative(root) {
  if (root === null) return [];

  const result = [];
  const stack = [root];

  while (stack.length > 0) {
    const node = stack.pop();
    result.push(node.value);

    // Push left first, then right (reverse of preorder logic)
    if (node.left) stack.push(node.left);
    if (node.right) stack.push(node.right);
  }

  // Reverse the result: we collected Root→Right→Left, we need Left→Right→Root
  return result.reverse();
}

// Big-O: Time O(n), Space O(h)

console.log('\n=== POSTORDER TRAVERSAL (Left → Right → Root) ===');
console.log('Recursive:', postorderRecursive(root));   // [7, 4, 5, 2, 8, 9, 6, 3, 1]
console.log('Iterative:', postorderIterative(root));   // [7, 4, 5, 2, 8, 9, 6, 3, 1]

// --- Traversal 4: LEVEL-ORDER (BFS) ---
// WHY: Process nodes level by level using a QUEUE. Essential for
// shortest path, level-by-level processing, and tree width.

function levelOrder(root) {
  if (root === null) return [];

  const result = [];
  const queue = [root];  // Initialize queue with root

  while (queue.length > 0) {
    const levelSize = queue.length;   // Nodes at current level
    const currentLevel = [];

    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift();       // Dequeue front node
      currentLevel.push(node.value);

      // Enqueue children for next level
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }

    result.push(currentLevel);
  }

  return result;
}

// Flat level-order (without grouping by level)
function levelOrderFlat(root) {
  if (root === null) return [];

  const result = [];
  const queue = [root];

  while (queue.length > 0) {
    const node = queue.shift();
    result.push(node.value);

    if (node.left) queue.push(node.left);
    if (node.right) queue.push(node.right);
  }

  return result;
}

// Big-O: Time O(n), Space O(w) where w = max width of tree

console.log('\n=== LEVEL-ORDER TRAVERSAL (BFS) ===');
console.log('By levels:', levelOrder(root));
// [[1], [2, 3], [4, 5, 6], [7, 8, 9]]
console.log('Flat:', levelOrderFlat(root));
// [1, 2, 3, 4, 5, 6, 7, 8, 9]


// ============================================================
// EXAMPLE 3 — Tree Properties: Height, Count, Balance
// Story: Flipkart's engineering team monitors the category tree
//        health. If the tree becomes unbalanced (one branch much
//        deeper than another), search performance degrades from
//        O(log n) to O(n). They compute height, node count, and
//        balance factor to detect and fix imbalances.
// ============================================================

// --- Height of Tree ---
// WHY: Height determines worst-case traversal time. Balanced = O(log n),
// unbalanced = O(n).
function treeHeight(node) {
  if (node === null) return -1;  // Convention: empty tree has height -1
  // Some use 0 for null — then leaf has height 1. Both are valid.
  // Using -1 means leaf has height 0, which is more standard.

  const leftHeight = treeHeight(node.left);
  const rightHeight = treeHeight(node.right);

  return Math.max(leftHeight, rightHeight) + 1;
}

// Big-O: Time O(n) — must visit every node. Space O(h) — recursion stack.

console.log('\n=== TREE PROPERTIES ===');
console.log('Height of tree:', treeHeight(root));  // 3

// --- Maximum Depth (same as height, different convention) ---
// WHY: LeetCode uses "maxDepth" which counts nodes on longest path.
function maxDepth(node) {
  if (node === null) return 0;
  return Math.max(maxDepth(node.left), maxDepth(node.right)) + 1;
}

console.log('Max depth:', maxDepth(root));  // 4 (counts nodes, not edges)

// --- Minimum Depth ---
// WHY: Minimum depth is the shortest path from root to a LEAF.
// Tricky: a node with only one child is NOT a leaf path endpoint.
function minDepth(node) {
  if (node === null) return 0;

  // If one child is null, we must go through the other child
  if (node.left === null) return minDepth(node.right) + 1;
  if (node.right === null) return minDepth(node.left) + 1;

  return Math.min(minDepth(node.left), minDepth(node.right)) + 1;
}

console.log('Min depth:', minDepth(root));  // 3

// --- Count Total Nodes ---
function countNodes(node) {
  if (node === null) return 0;
  return 1 + countNodes(node.left) + countNodes(node.right);
}

// Big-O: O(n)

console.log('Total nodes:', countNodes(root));  // 9

// --- Count Leaf Nodes ---
function countLeaves(node) {
  if (node === null) return 0;
  if (node.left === null && node.right === null) return 1;  // It is a leaf
  return countLeaves(node.left) + countLeaves(node.right);
}

// Big-O: O(n)

console.log('Leaf nodes:', countLeaves(root));  // 4 (nodes 7, 5, 8, 9)

// --- Check if Balanced ---
// WHY: |height(left) - height(right)| <= 1 for EVERY node.

function isBalanced(node) {
  return checkBalance(node) !== -1;
}

function checkBalance(node) {
  if (node === null) return 0;

  const leftHeight = checkBalance(node.left);
  if (leftHeight === -1) return -1;   // Left subtree is unbalanced

  const rightHeight = checkBalance(node.right);
  if (rightHeight === -1) return -1;  // Right subtree is unbalanced

  // Check balance at this node
  if (Math.abs(leftHeight - rightHeight) > 1) return -1;

  return Math.max(leftHeight, rightHeight) + 1;
}

// Big-O: O(n) — single pass, much better than naive O(n^2)

console.log('Is balanced?', isBalanced(root));  // false (left has depth 3, right has depth 2 at node 3)

// --- Build a balanced tree to test ---
//        10
//       /  \
//      5    15
//     / \   / \
//    3   7 12  20

const balancedRoot = new TreeNode(10);
balancedRoot.left = new TreeNode(5);
balancedRoot.right = new TreeNode(15);
balancedRoot.left.left = new TreeNode(3);
balancedRoot.left.right = new TreeNode(7);
balancedRoot.right.left = new TreeNode(12);
balancedRoot.right.right = new TreeNode(20);

console.log('Balanced tree is balanced?', isBalanced(balancedRoot));  // true


// ============================================================
// EXAMPLE 4 — Invert a Binary Tree (The Famous Interview Question)
// Story: A Flipkart engineer was once asked to "mirror" the
//        category tree for a right-to-left locale (Arabic/Hebrew).
//        This is the famous "invert binary tree" problem that
//        even tripped up the creator of Homebrew in his Google
//        interview. The solution is elegantly simple.
// ============================================================

// WHY: Swap left/right at every node — tests recursive thinking.

function invertTree(node) {
  if (node === null) return null;

  // Swap left and right children
  const temp = node.left;
  node.left = node.right;
  node.right = temp;

  // Recursively invert subtrees
  invertTree(node.left);
  invertTree(node.right);

  return node;
}

// Big-O: Time O(n) — visit every node. Space O(h) — recursion stack.

// Build a fresh tree for inversion demo
//      1
//     / \
//    2   3
//   / \
//  4   5

const invertDemo = new TreeNode(1);
invertDemo.left = new TreeNode(2);
invertDemo.right = new TreeNode(3);
invertDemo.left.left = new TreeNode(4);
invertDemo.left.right = new TreeNode(5);

console.log('\n=== INVERT BINARY TREE ===');
console.log('Before inversion (inorder):', inorderRecursive(invertDemo));
// [4, 2, 5, 1, 3]

invertTree(invertDemo);

console.log('After inversion (inorder):', inorderRecursive(invertDemo));
// [3, 1, 5, 2, 4]
// The tree is now:
//      1
//     / \
//    3   2
//       / \
//      5   4

// Invert back to verify
invertTree(invertDemo);
console.log('After re-inversion (back to original):', inorderRecursive(invertDemo));


// ============================================================
// EXAMPLE 5 — Check if Two Trees are Identical
// Story: Flipkart runs A/B tests where two versions of the
//        category tree are deployed. Before going live, they
//        need to verify that the trees are structurally and
//        value-wise identical. A recursive comparison does this
//        in O(n) time.
// ============================================================

// WHY: Compare two trees by traversing them simultaneously.

function areIdentical(node1, node2) {
  // Both null — identical empty subtrees
  if (node1 === null && node2 === null) return true;

  // One null, one not — not identical
  if (node1 === null || node2 === null) return false;

  // Check: same value AND both subtrees are identical
  return (
    node1.value === node2.value &&
    areIdentical(node1.left, node2.left) &&
    areIdentical(node1.right, node2.right)
  );
}

// Big-O: Time O(n), Space O(h)

// Build two identical trees
const tree1 = new TreeNode(1);
tree1.left = new TreeNode(2);
tree1.right = new TreeNode(3);

const tree2 = new TreeNode(1);
tree2.left = new TreeNode(2);
tree2.right = new TreeNode(3);

const tree3 = new TreeNode(1);
tree3.left = new TreeNode(2);
tree3.right = new TreeNode(4);  // Different!

console.log('\n=== CHECK IF TWO TREES ARE IDENTICAL ===');
console.log('tree1 === tree2?', areIdentical(tree1, tree2));  // true
console.log('tree1 === tree3?', areIdentical(tree1, tree3));  // false


// ============================================================
// EXAMPLE 6 — Practical: Build a Tree, Run All Traversals,
//             Solve Height/Balance/Invert Problems
// Story: The Flipkart coding bootcamp final exam. Build a tree
//        from an array (level-order), run all 4 traversals, and
//        solve 5 property-based problems. This exercise ties
//        together everything from this file.
// ============================================================

// --- Build Binary Tree from Level-Order Array ---
// WHY: LeetCode uses arrays to represent trees. null = no child.

function buildTreeFromArray(arr) {
  if (!arr || arr.length === 0 || arr[0] === null) return null;

  const root = new TreeNode(arr[0]);
  const queue = [root];
  let i = 1;

  while (queue.length > 0 && i < arr.length) {
    const node = queue.shift();

    // Left child
    if (i < arr.length && arr[i] !== null) {
      node.left = new TreeNode(arr[i]);
      queue.push(node.left);
    }
    i++;

    // Right child
    if (i < arr.length && arr[i] !== null) {
      node.right = new TreeNode(arr[i]);
      queue.push(node.right);
    }
    i++;
  }

  return root;
}

// Big-O: Time O(n), Space O(n)

const treeArray = [1, 2, 3, 4, 5, null, 6, 7, null, null, null, null, null, 8, 9];
const builtTree = buildTreeFromArray(treeArray);

console.log('\n=== BUILD TREE FROM ARRAY ===');
console.log('Input array:', treeArray);
console.log('Inorder:', inorderRecursive(builtTree));
console.log('Preorder:', preorderRecursive(builtTree));
console.log('Postorder:', postorderRecursive(builtTree));
console.log('Level-order:', levelOrder(builtTree));

// --- Path Sum: Does any root-to-leaf path sum equal target? ---
// WHY: Classic tree recursion problem. Tests root-to-leaf path thinking.
function hasPathSum(node, targetSum) {
  if (node === null) return false;

  // If leaf node, check if remaining sum equals this node's value
  if (node.left === null && node.right === null) {
    return node.value === targetSum;
  }

  // Check left and right subtrees with reduced target
  return (
    hasPathSum(node.left, targetSum - node.value) ||
    hasPathSum(node.right, targetSum - node.value)
  );
}

// Big-O: Time O(n), Space O(h)

//        10
//       /  \
//      5    15
//     / \   / \
//    3   7 12  20

console.log('\n=== PATH SUM ===');
console.log('Has path sum 18?', hasPathSum(balancedRoot, 18));  // true (10→5→3)
console.log('Has path sum 22?', hasPathSum(balancedRoot, 22));  // true (10→5→7)
console.log('Has path sum 50?', hasPathSum(balancedRoot, 50));  // false

// --- Diameter of Binary Tree ---
// WHY: The diameter is the longest path between any two nodes.
// It may or may not pass through the root.
function diameterOfBinaryTree(root) {
  let maxDiameter = 0;

  function height(node) {
    if (node === null) return 0;

    const leftH = height(node.left);
    const rightH = height(node.right);

    // Diameter through this node = leftH + rightH
    maxDiameter = Math.max(maxDiameter, leftH + rightH);

    return Math.max(leftH, rightH) + 1;
  }

  height(root);
  return maxDiameter;
}

// Big-O: O(n) — single pass

console.log('\n=== DIAMETER OF BINARY TREE ===');
console.log('Diameter:', diameterOfBinaryTree(root));           // longest path in our tree
console.log('Balanced diameter:', diameterOfBinaryTree(balancedRoot)); // 4 (3→5→10→15→20)

// --- Summary of all traversals ---
console.log('\n=== TRAVERSAL SUMMARY ===');
console.log('Inorder   (L→Root→R):', inorderRecursive(balancedRoot));
console.log('Preorder  (Root→L→R):', preorderRecursive(balancedRoot));
console.log('Postorder (L→R→Root):', postorderRecursive(balancedRoot));
console.log('Level-order (BFS):   ', levelOrder(balancedRoot));


// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. A tree is a hierarchical data structure with parent-child
//    relationships, one root, and no cycles.
// 2. Binary Tree: each node has at most 2 children (left, right).
//    TreeNode has value, left, right.
// 3. Four traversals — memorize the order:
//    - Inorder:    Left → Root → Right  (sorted for BST)
//    - Preorder:   Root → Left → Right  (copy/serialize)
//    - Postorder:  Left → Right → Root  (delete/evaluate)
//    - Level-order: BFS with queue       (level-by-level)
// 4. Always implement BOTH recursive and iterative versions.
//    Recursive is cleaner; iterative avoids stack overflow.
// 5. Tree properties — height, count, balance — are all solved
//    with simple recursion: solve for left, solve for right, combine.
// 6. Height: max(height(left), height(right)) + 1. O(n).
// 7. Balanced check: O(n) single-pass using height + early termination.
// 8. Invert tree: swap left/right recursively. O(n).
// 9. Two trees identical: compare values + both subtrees. O(n).
// 10. Build from array: use a queue (level-order construction). O(n).
// ============================================================

console.log('\n=== ALL TREE BASICS EXAMPLES COMPLETE ===');
