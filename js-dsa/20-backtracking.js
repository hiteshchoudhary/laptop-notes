// ============================================================
// FILE 20: BACKTRACKING
// Topic: Solving constraint-satisfaction problems by trying choices and undoing them
// WHY: Backtracking solves problems where you must explore all possible
//   combinations/permutations/configurations. It powers puzzle solvers,
//   route planners, game AI, and constraint satisfaction engines used by
//   companies like MakeMyTrip, Google Maps, and chess engines.
// ============================================================

// ============================================================
// MAKEMYTRIP — THE BACKTRACKING STORY
// When you search Delhi to New York on MakeMyTrip, the system explores all
// possible flight combinations: Delhi->Dubai->NYC, Delhi->London->NYC,
// Delhi->Dubai->London->NYC... If a route hits a dead end (no connecting
// flight, too expensive, or exceeds time limit), the system BACKTRACKS —
// undoes the last choice and tries the next option. This systematic
// "try, fail, undo, try again" approach is backtracking. It's DFS on a
// decision tree with pruning to skip hopeless branches early.
// ============================================================

// ============================================================
// EXAMPLE 1 — What is Backtracking?
// Story: Imagine you're in a maze at Science City, Ahmedabad. At each fork,
// you choose a path. If you hit a dead end, you backtrack to the last fork
// and try the other path. You don't restart from the entrance — you undo
// just enough to try the next option. This is backtracking: systematic
// exploration with efficient undo.
// ============================================================

// WHY: Backtracking is DFS on a decision tree. At each node, you make a
// choice. If the choice leads to a dead end, you UNDO it (backtrack) and
// try the next option. Pruning skips branches that can't lead to a solution.

// --- The Backtracking Template ---
console.log("=== BACKTRACKING TEMPLATE ===");
console.log(`
function backtrack(state, choices) {
  // BASE CASE: reached a goal
  if (isGoal(state)) {
    results.push(copy(state));  // Save the solution
    return;
  }

  for (const choice of choices) {
    if (!isValid(choice)) continue;  // PRUNE: skip invalid choices

    makeChoice(state, choice);        // CHOOSE: modify state
    backtrack(state, remainingChoices); // EXPLORE: recurse
    undoChoice(state, choice);        // UNDO: restore state (BACKTRACK)
  }
}
`);
console.log("Key idea: CHOOSE -> EXPLORE -> UNDO");
console.log("Backtracking = DFS on decision tree + pruning\n");

// ============================================================
// EXAMPLE 2 — Problem 1: Generate All Subsets (Power Set)
// Story: Flipkart's recommendation engine generates all possible product
// bundles from a set of items. For {laptop, mouse, keyboard}, the bundles
// are: {}, {laptop}, {mouse}, {keyboard}, {laptop,mouse}, {laptop,keyboard},
// {mouse,keyboard}, {laptop,mouse,keyboard}. That's 2^3 = 8 subsets — the
// power set. Backtracking builds each subset by including or excluding
// each element.
// ============================================================

// WHY: Generating all subsets is the simplest backtracking problem. It
// demonstrates the "include or exclude" decision at each step.
// For n elements, there are 2^n subsets.

// Big-O: Time O(2^n * n), Space O(n) recursion depth
// 2^n subsets, each takes O(n) to copy
function generateSubsets(nums) {
  const results = [];

  function backtrack(index, current) {
    // BASE CASE: processed all elements
    if (index === nums.length) {
      results.push([...current]); // Copy current subset to results
      return;
    }

    // CHOICE 1: Exclude nums[index]
    backtrack(index + 1, current);

    // CHOICE 2: Include nums[index]
    current.push(nums[index]);      // CHOOSE
    backtrack(index + 1, current);   // EXPLORE
    current.pop();                   // UNDO (backtrack)
  }

  backtrack(0, []);
  return results;
}

console.log("=== PROBLEM 1: GENERATE ALL SUBSETS (POWER SET) ===");
const items = [1, 2, 3];
console.log(`Input: [${items}]`);
const subsets = generateSubsets(items);
console.log(`All subsets (2^${items.length} = ${subsets.length}):`);
subsets.forEach((s) => console.log(`  [${s}]`));

// Each element: include or exclude = 2 choices -> 2^n subsets
console.log(`\nBig-O: Time O(2^n * n), Space O(n)\n`);

// ============================================================
// EXAMPLE 3 — Problem 2: Generate All Permutations
// Story: IRCTC assigns seat numbers to a group of passengers. For 3 passengers
// {Arun, Bharti, Chetan}, all possible seating arrangements are:
// ABC, ACB, BAC, BCA, CAB, CBA — that's 3! = 6 permutations. The system
// generates all arrangements to find the optimal one based on preferences.
// ============================================================

// WHY: Permutations are orderings. Unlike subsets (include/exclude),
// permutations use all elements but in different orders.
// For n elements, there are n! permutations.

// Big-O: Time O(n! * n), Space O(n)
function generatePermutations(nums) {
  const results = [];

  function backtrack(current, remaining) {
    // BASE CASE: no more elements to arrange
    if (remaining.length === 0) {
      results.push([...current]);
      return;
    }

    for (let i = 0; i < remaining.length; i++) {
      current.push(remaining[i]);                  // CHOOSE
      const newRemaining = [
        ...remaining.slice(0, i),
        ...remaining.slice(i + 1),
      ];
      backtrack(current, newRemaining);             // EXPLORE
      current.pop();                                // UNDO
    }
  }

  backtrack([], nums);
  return results;
}

// Alternative: swap-based (more efficient, in-place)
// Big-O: Time O(n! * n), Space O(n) for recursion
function permuteSwap(nums) {
  const results = [];

  function backtrack(start) {
    if (start === nums.length) {
      results.push([...nums]);
      return;
    }

    for (let i = start; i < nums.length; i++) {
      [nums[start], nums[i]] = [nums[i], nums[start]]; // CHOOSE (swap)
      backtrack(start + 1);                              // EXPLORE
      [nums[start], nums[i]] = [nums[i], nums[start]]; // UNDO (swap back)
    }
  }

  backtrack(0);
  return results;
}

console.log("=== PROBLEM 2: GENERATE ALL PERMUTATIONS ===");
const passengers = [1, 2, 3];
console.log(`Input: [${passengers}]`);
const perms = generatePermutations(passengers);
console.log(`All permutations (${passengers.length}! = ${perms.length}):`);
perms.forEach((p) => console.log(`  [${p}]`));

console.log("\nSwap-based approach:");
const perms2 = permuteSwap([1, 2, 3]);
perms2.forEach((p) => console.log(`  [${p}]`));

// Swap method: fix position 0, recurse on rest. n choices for pos 0, n-1 for pos 1...
console.log(`\nBig-O: Time O(n! * n), Space O(n)\n`);

// ============================================================
// EXAMPLE 4 — Problem 3: Combination Sum
// Story: Paytm Wallet users can top up with fixed denominations: Rs.100,
// Rs.200, Rs.500. To reach exactly Rs.800, what are all possible combinations
// of top-ups? [100,100,100,100,100,100,100,100], [100,100,100,500],
// [200,200,200,200], etc. Elements can be reused. Backtracking explores
// all combinations, pruning when the sum exceeds the target.
// ============================================================

// WHY: Combination Sum tests the ability to handle repeated elements and
// pruning. Sorting the candidates enables early termination when the
// running sum exceeds the target.

// Big-O: Time O(n^(t/min)) where t=target, min=smallest candidate
// Space O(t/min) recursion depth
function combinationSum(candidates, target) {
  const results = [];
  candidates.sort((a, b) => a - b); // Sort for pruning

  function backtrack(start, current, remaining) {
    // BASE CASE: found a valid combination
    if (remaining === 0) {
      results.push([...current]);
      return;
    }

    for (let i = start; i < candidates.length; i++) {
      // PRUNE: if current candidate exceeds remaining, all future will too (sorted)
      if (candidates[i] > remaining) break;

      current.push(candidates[i]);                     // CHOOSE
      backtrack(i, current, remaining - candidates[i]); // EXPLORE (i, not i+1: reuse allowed)
      current.pop();                                    // UNDO
    }
  }

  backtrack(0, [], target);
  return results;
}

console.log("=== PROBLEM 3: COMBINATION SUM ===");
const denominations = [2, 3, 6, 7];
const targetAmount = 7;
console.log(`Candidates: [${denominations}]`);
console.log(`Target: ${targetAmount}`);
const combos = combinationSum(denominations, targetAmount);
console.log(`Combinations:`);
combos.forEach((c) => console.log(`  [${c}] = ${c.reduce((a, b) => a + b, 0)}`));

// Pruning: sorted candidates + break when candidate > remaining = massive speedup
console.log(`\nBig-O: Time O(n^(t/min)), Space O(t/min)\n`);

// ============================================================
// EXAMPLE 5 — Problem 4: N-Queens
// Story: Chess.com India hosts N-Queens challenges. Place N queens on an
// N x N chessboard so that no two queens attack each other (same row, column,
// or diagonal). The backtracking approach places queens row by row, checking
// column and diagonal conflicts. If no valid column exists in a row, it
// backtracks to the previous row and tries the next column.
// ============================================================

// WHY: N-Queens is THE classic backtracking problem. It demonstrates
// constraint checking, pruning, and the power of systematic search.
// It also has a beautiful visual output.

// Big-O: Time O(N!), Space O(N^2) for board + O(N) for recursion
function solveNQueens(n) {
  const results = [];
  const board = Array.from({ length: n }, () => Array(n).fill("."));

  // Track which columns and diagonals are under attack
  const cols = new Set();         // Columns under attack
  const diag1 = new Set();       // Main diagonals (row - col)
  const diag2 = new Set();       // Anti-diagonals (row + col)

  function isValid(row, col) {
    return !cols.has(col) && !diag1.has(row - col) && !diag2.has(row + col);
  }

  function backtrack(row) {
    // BASE CASE: all queens placed
    if (row === n) {
      results.push(board.map((r) => r.join("")));
      return;
    }

    for (let col = 0; col < n; col++) {
      if (!isValid(row, col)) continue; // PRUNE: skip attacked positions

      // CHOOSE: place queen
      board[row][col] = "Q";
      cols.add(col);
      diag1.add(row - col);
      diag2.add(row + col);

      backtrack(row + 1); // EXPLORE: next row

      // UNDO: remove queen (backtrack)
      board[row][col] = ".";
      cols.delete(col);
      diag1.delete(row - col);
      diag2.delete(row + col);
    }
  }

  backtrack(0);
  return results;
}

// --- ASCII Board Visualization ---
function printBoard(board) {
  const n = board.length;
  const border = "  +" + "---+".repeat(n);
  console.log(border);
  for (let r = 0; r < n; r++) {
    let row = `  |`;
    for (let c = 0; c < n; c++) {
      const cell = board[r][c] === "Q" ? " Q " : " . ";
      row += cell + "|";
    }
    console.log(row);
    console.log(border);
  }
}

console.log("=== PROBLEM 4: N-QUEENS ===");

// 4-Queens
const solutions4 = solveNQueens(4);
console.log(`4-Queens: ${solutions4.length} solutions found\n`);

solutions4.forEach((sol, i) => {
  console.log(`Solution ${i + 1}:`);
  printBoard(sol);
  console.log();
});

// 8-Queens count
const solutions8 = solveNQueens(8);
console.log(`8-Queens: ${solutions8.length} solutions found`);
console.log("First solution:");
printBoard(solutions8[0]);

console.log("\nBacktrack trace (4-Queens):");
console.log("  Row 0: try col 0 -> place Q at (0,0)");
console.log("    Row 1: try col 0 -> CONFLICT (same col). col 1 -> CONFLICT (diag).");
console.log("      col 2 -> place Q at (1,2)");
console.log("      Row 2: all cols conflict -> BACKTRACK to row 1");
console.log("    Row 1: col 3 -> place Q at (1,3)");
console.log("      Row 2: col 1 -> place Q at (2,1)");
console.log("        Row 3: all cols conflict -> BACKTRACK");
console.log("      ...eventually finds (0,1),(1,3),(2,0),(3,2)");
console.log(`\nBig-O: Time O(N!), Space O(N)\n`);

// ============================================================
// EXAMPLE 6 — Problem 5: Sudoku Solver
// Story: The Times of India publishes daily Sudoku puzzles. Their app has
// an auto-solver that fills in empty cells using backtracking: find an empty
// cell, try digits 1-9, check if valid (no repeat in row/col/3x3 box).
// If valid, recurse to next empty cell. If stuck, backtrack and try next digit.
// ============================================================

// WHY: Sudoku is a constraint satisfaction problem perfectly suited for
// backtracking. It demonstrates validity checking in multiple dimensions
// (row, column, box) and the power of pruning.

// Big-O: Time O(9^(empty cells)) worst case, much less with pruning
// Space O(81) for board + O(empty cells) recursion depth
function solveSudoku(board) {
  function isValid(board, row, col, num) {
    const char = String(num);

    // Check row
    for (let c = 0; c < 9; c++) {
      if (board[row][c] === char) return false;
    }

    // Check column
    for (let r = 0; r < 9; r++) {
      if (board[r][col] === char) return false;
    }

    // Check 3x3 box
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let r = boxRow; r < boxRow + 3; r++) {
      for (let c = boxCol; c < boxCol + 3; c++) {
        if (board[r][c] === char) return false;
      }
    }

    return true;
  }

  function findEmpty(board) {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] === ".") return [r, c];
      }
    }
    return null; // No empty cells — puzzle solved!
  }

  function solve(board) {
    const empty = findEmpty(board);
    if (!empty) return true; // No empty cells = solved!

    const [row, col] = empty;

    for (let num = 1; num <= 9; num++) {
      if (isValid(board, row, col, num)) {
        board[row][col] = String(num); // CHOOSE

        if (solve(board)) return true;  // EXPLORE — if solved, done!

        board[row][col] = ".";          // UNDO (backtrack)
      }
    }

    return false; // No valid number works — trigger backtrack
  }

  solve(board);
  return board;
}

function printSudoku(board) {
  for (let r = 0; r < 9; r++) {
    if (r % 3 === 0 && r !== 0) console.log("  ------+-------+------");
    let row = "  ";
    for (let c = 0; c < 9; c++) {
      if (c % 3 === 0 && c !== 0) row += "| ";
      row += board[r][c] + " ";
    }
    console.log(row);
  }
}

console.log("=== PROBLEM 5: SUDOKU SOLVER ===");

const sudokuBoard = [
  ["5", "3", ".", ".", "7", ".", ".", ".", "."],
  ["6", ".", ".", "1", "9", "5", ".", ".", "."],
  [".", "9", "8", ".", ".", ".", ".", "6", "."],
  ["8", ".", ".", ".", "6", ".", ".", ".", "3"],
  ["4", ".", ".", "8", ".", "3", ".", ".", "1"],
  ["7", ".", ".", ".", "2", ".", ".", ".", "6"],
  [".", "6", ".", ".", ".", ".", "2", "8", "."],
  [".", ".", ".", "4", "1", "9", ".", ".", "5"],
  [".", ".", ".", ".", "8", ".", ".", "7", "9"],
];

console.log("Input puzzle:");
printSudoku(sudokuBoard);

console.log("\nSolving...");
solveSudoku(sudokuBoard);

console.log("\nSolved puzzle:");
printSudoku(sudokuBoard);

// For each empty cell: try 1-9, validate, recurse. If stuck, backtrack.
console.log(`\nBig-O: Time O(9^m) where m = empty cells, much less with pruning\n`);

// ============================================================
// EXAMPLE 7 — Problem 6: Generate Valid Parentheses
// Story: Zerodha's trading algorithm generates all valid bracket combinations
// for nested option strategies. For n=3 pairs of parentheses, valid combos
// include ((())), (()()), (())(), ()(()), ()()() — but NOT )()(. The rule:
// at every point, open count >= close count, and total opens = total closes = n.
// ============================================================

// WHY: This is a classic backtracking problem with elegant pruning:
// - Can add '(' if open < n
// - Can add ')' if close < open
// These two rules eliminate all invalid combinations without generating them.

// Big-O: Time O(4^n / sqrt(n)) — Catalan number, Space O(n)
function generateParentheses(n) {
  const results = [];

  function backtrack(current, openCount, closeCount) {
    // BASE CASE: used all parentheses
    if (current.length === 2 * n) {
      results.push(current);
      return;
    }

    // CHOICE 1: Add open parenthesis (if we haven't used all n)
    if (openCount < n) {
      backtrack(current + "(", openCount + 1, closeCount);
    }

    // CHOICE 2: Add close parenthesis (if it won't make invalid)
    if (closeCount < openCount) {
      backtrack(current + ")", openCount, closeCount + 1);
    }
  }

  backtrack("", 0, 0);
  return results;
}

console.log("=== PROBLEM 6: GENERATE VALID PARENTHESES ===");

for (let n = 1; n <= 4; n++) {
  const parens = generateParentheses(n);
  console.log(`n=${n}: ${parens.length} combinations`);
  console.log(`  ${parens.join(", ")}`);
}

console.log("\nDecision tree trace (n=3):");
console.log("  '' -> open=0, close=0");
console.log("    '(' -> open=1, close=0");
console.log("      '((' -> open=2, close=0");
console.log("        '(((' -> open=3, close=0");
console.log("          '((()' -> '(())'  -> '((()))' VALID");
console.log("        '(()' -> open=2, close=1");
console.log("          '(()(') -> '(()()' -> '(()())' VALID");
console.log("          '(())' -> '(())(') -> '(())()' VALID");
console.log("      '()' -> open=1, close=1");
console.log("        '()(') -> '()((') -> '()(())' VALID");
console.log("        '()(' -> '()()' -> '()()()' VALID");
console.log("  Note: ')' is never the first choice (close < open is false)\n");
console.log(`Big-O: Time O(4^n / sqrt(n)) — nth Catalan number\n`);

// ============================================================
// EXAMPLE 8 — Backtracking vs Dynamic Programming
// Story: Flipkart's pricing team faces two kinds of optimization problems:
// 1. "Find the best bundle price" (DP — overlapping subproblems, optimal substructure)
// 2. "Find ALL valid bundle combinations" (Backtracking — enumerate all solutions)
// Knowing which tool to use is the key to efficient solutions.
// ============================================================

// WHY: Students often confuse when to use backtracking vs DP. Understanding
// the distinction is critical for choosing the right approach.

console.log("=== BACKTRACKING vs DYNAMIC PROGRAMMING ===");
console.log("+-------------------+-----------------------------+-----------------------------+");
console.log("| Aspect            | Backtracking                | Dynamic Programming         |");
console.log("+-------------------+-----------------------------+-----------------------------+");
console.log("| Goal              | Find ALL solutions          | Find OPTIMAL solution       |");
console.log("| Approach          | Try all, prune bad branches | Build solution bottom-up    |");
console.log("| Subproblems       | Independent choices         | Overlapping subproblems     |");
console.log("| Complexity        | Usually exponential         | Usually polynomial          |");
console.log("| Memory            | O(recursion depth)          | O(table size)               |");
console.log("| Examples          | N-Queens, Sudoku, combos    | Fibonacci, knapsack, LCS    |");
console.log("+-------------------+-----------------------------+-----------------------------+");
console.log("");
console.log("Rule of thumb:");
console.log("  - Need ALL solutions? -> Backtracking");
console.log("  - Need COUNT or OPTIMAL? -> DP");
console.log("  - Has overlapping subproblems? -> DP");
console.log("  - Need to enumerate/generate? -> Backtracking\n");

// ============================================================
// EXAMPLE 9 — Summary & Decision Guide
// Story: A Microsoft India interviewer shares: "Backtracking is your Swiss
// Army knife for 'generate all' problems. The template is always the same:
// choose, explore, undo. The art is in the pruning — the more you prune,
// the faster your solution. Master the 6 classic problems and you can solve
// any backtracking interview question."
// ============================================================

console.log("=== BACKTRACKING PROBLEM PATTERNS ===");
console.log("+----------------------+-------------------+------------------+");
console.log("| Problem              | Time Complexity   | Key Technique    |");
console.log("+----------------------+-------------------+------------------+");
console.log("| Subsets (Power Set)  | O(2^n * n)        | Include/Exclude  |");
console.log("| Permutations         | O(n! * n)         | Swap & recurse   |");
console.log("| Combination Sum      | O(n^(t/min))      | Reuse + prune    |");
console.log("| N-Queens             | O(N!)             | Row-by-row + sets|");
console.log("| Sudoku Solver        | O(9^m)            | Cell-by-cell     |");
console.log("| Valid Parentheses    | O(4^n/sqrt(n))    | Open/close count |");
console.log("| Word Search          | O(M*N*4^L)        | Grid DFS         |");
console.log("+----------------------+-------------------+------------------+");

console.log("\nWhen to use Backtracking:");
console.log("  1. 'Generate ALL' / 'Find ALL' solutions");
console.log("  2. Constraint satisfaction (Sudoku, N-Queens)");
console.log("  3. Combinatorial search (subsets, permutations, combinations)");
console.log("  4. Decision problems ('is there a valid configuration?')");
console.log("  5. Puzzle solving (crossword, maze, word search)");

// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. Backtracking = DFS on decision tree + pruning. Template: CHOOSE,
//    EXPLORE (recurse), UNDO (backtrack).
// 2. Subsets: include/exclude each element. 2^n possibilities.
// 3. Permutations: swap elements, recurse, swap back. n! possibilities.
// 4. Combination Sum: allow reuse (start from i, not i+1). Sort for pruning.
// 5. N-Queens: row-by-row placement. Use Sets for O(1) column/diagonal checks.
//    Each row gets exactly one queen. Prune conflicts early.
// 6. Sudoku: find empty cell, try 1-9, validate row/col/box, recurse.
//    If no valid number, return false to trigger backtrack.
// 7. Valid Parentheses: two rules — open < n, close < open. These rules
//    prune all invalid combinations automatically.
// 8. PRUNING is the key to performance. Without pruning, backtracking is
//    just brute force. With pruning, it can be surprisingly fast.
// 9. Backtracking for ALL solutions. DP for OPTIMAL/COUNT solutions.
//    If choices are independent with overlapping subproblems -> DP.
//    If you need to enumerate all possibilities -> Backtracking.
// ============================================================

console.log("\n=== BIG-O SUMMARY ===");
console.log("+----------------------------+-------------------+----------+");
console.log("| Problem                    | Time              | Space    |");
console.log("+----------------------------+-------------------+----------+");
console.log("| Subsets                    | O(2^n * n)        | O(n)     |");
console.log("| Permutations               | O(n! * n)         | O(n)     |");
console.log("| Combination Sum            | O(n^(t/min))      | O(t/min) |");
console.log("| N-Queens                   | O(N!)             | O(N)     |");
console.log("| Sudoku                     | O(9^m)            | O(m)     |");
console.log("| Valid Parentheses          | O(4^n / sqrt(n))  | O(n)     |");
console.log("| Word Search                | O(M*N*4^L)        | O(L)     |");
console.log("+----------------------------+-------------------+----------+");
console.log("where n=elements, t=target, m=empty cells, L=word length\n");
