// ============================================================
// FILE 22: GREEDY ALGORITHMS
// Topic: Making locally optimal choices at each step to find the global optimum
// WHY: Greedy algorithms are simpler and faster than DP when they work.
// They appear in scheduling, compression (Huffman), and graph algorithms
// (Dijkstra, Prim, Kruskal). Knowing WHEN greedy works — and when it
// doesn't — separates good engineers from great ones.
// ============================================================

// Indian Railways operates the world's 4th largest rail network. At New
// Delhi station, the station master must schedule the MAXIMUM number of
// trains on a single platform. Greedy: pick earliest departure, repeat.

// WHY: Greedy makes the locally optimal choice at each step, never looks
// back. Works when: Greedy Choice Property + Optimal Substructure.
// Greedy vs DP: Greedy is faster but only works for specific problems.
// Rule: If greedy works, prefer it. If counterexample exists, use DP.

console.log("=== GREEDY ALGORITHMS ===\n");

// ============================================================
// EXAMPLE 1 — Activity / Meeting Selection
// Story: A Bengaluru co-working space has ONE conference room. Multiple
// startups want to book it. Each startup has a start time and end time.
// We must schedule the MAXIMUM number of non-overlapping meetings.
// ============================================================

// WHY: Activity Selection is the textbook greedy problem. It proves that
// "pick the one that finishes earliest" always gives the most activities.

// --- Algorithm ---
// 1. Sort activities by END time (ascending)
// 2. Pick the first activity (earliest finish)
// 3. For each remaining activity: if its start >= last selected's end, pick it
// O(n log n) for sort + O(n) for selection = O(n log n) total

function activitySelection(activities) {
  // Each activity: { name, start, end }
  // Sort by end time
  const sorted = [...activities].sort((a, b) => a.end - b.end);

  const selected = [sorted[0]]; // Always pick the one that finishes first
  let lastEnd = sorted[0].end;

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].start >= lastEnd) {
      // This activity starts after (or when) the last one ended
      selected.push(sorted[i]);
      lastEnd = sorted[i].end;
    }
    // Otherwise skip — it overlaps with our last selection
  }

  return selected;
}

// Proof: earliest-finishing activity leaves most room for remaining. By
// induction, greedy selection is always at least as good as optimal.

console.log("=== ACTIVITY SELECTION ===");
const meetings = [
  { name: "Razorpay",  start: 1, end: 3 },
  { name: "Zerodha",   start: 2, end: 5 },
  { name: "CRED",      start: 4, end: 7 },
  { name: "PhonePe",   start: 1, end: 8 },
  { name: "Swiggy",    start: 5, end: 9 },
  { name: "Flipkart",  start: 8, end: 10 },
  { name: "Meesho",    start: 9, end: 11 },
];

const selected = activitySelection(meetings);
console.log("Selected meetings:", selected.map(m => `${m.name}(${m.start}-${m.end})`));
// Razorpay(1-3), CRED(4-7), Flipkart(8-10) = 3 meetings (maximum possible)
console.log("Count:", selected.length);
console.log();

// ============================================================
// EXAMPLE 2 — Fractional Knapsack
// Story: A Delhivery truck has 50kg capacity. It carries spice shipments
// from different sellers — each with a weight and value. Unlike 0/1
// knapsack, we CAN split packages. Take full high-value packages first,
// then fill remaining capacity with a fraction of the next best.
// ============================================================

// WHY: Fractional Knapsack shows why greedy works when you CAN take
// fractions (continuous) but fails for 0/1 (discrete) choices.

// --- Algorithm ---
// 1. Calculate value/weight ratio for each item
// 2. Sort by ratio (descending)
// 3. Take items greedily: full item if it fits, fraction of last item
// O(n log n) for sort + O(n) = O(n log n) total

function fractionalKnapsack(items, capacity) {
  // Each item: { name, weight, value }
  const sorted = [...items]
    .map(item => ({ ...item, ratio: item.value / item.weight }))
    .sort((a, b) => b.ratio - a.ratio); // Sort by value/weight DESC

  let totalValue = 0;
  let remaining = capacity;
  const taken = [];

  for (const item of sorted) {
    if (remaining <= 0) break;

    if (item.weight <= remaining) {
      // Take the whole item
      taken.push({ name: item.name, fraction: 1, value: item.value });
      totalValue += item.value;
      remaining -= item.weight;
    } else {
      // Take a fraction
      const fraction = remaining / item.weight;
      const partialValue = item.value * fraction;
      taken.push({ name: item.name, fraction: fraction.toFixed(2), value: partialValue.toFixed(2) });
      totalValue += partialValue;
      remaining = 0;
    }
  }

  return { totalValue: totalValue.toFixed(2), taken };
}

console.log("=== FRACTIONAL KNAPSACK ===");
const spices = [
  { name: "Saffron",   weight: 10, value: 600 },  // ratio: 60
  { name: "Cardamom",  weight: 20, value: 500 },  // ratio: 25
  { name: "Turmeric",  weight: 30, value: 400 },  // ratio: 13.3
];
const fkResult = fractionalKnapsack(spices, 50);
console.log("Max value:", fkResult.totalValue);
console.log("Items taken:", fkResult.taken);
// Take all Saffron (10kg, 600), all Cardamom (20kg, 500),
// 20/30 of Turmeric (20kg, 266.67) = 1366.67 total
console.log();

// ============================================================
// EXAMPLE 3 — Minimum Coins (Greedy vs DP)
// Story: Razorpay processes UPI refunds. For Indian denominations,
// greedy (pick largest coin first) works perfectly. But for custom
// promotional voucher denominations, greedy can FAIL spectacularly.
// ============================================================

// WHY: This is the critical lesson — greedy is not always correct.
// Knowing when it fails is as important as knowing when it works.

// --- Greedy Coin Change ---
// Pick the largest denomination that fits, subtract, repeat
// O(amount * denominations) in worst case

function greedyCoinChange(coins, amount) {
  // Sort coins descending
  const sorted = [...coins].sort((a, b) => b - a);
  const result = [];
  let remaining = amount;

  for (const coin of sorted) {
    while (remaining >= coin) {
      result.push(coin);
      remaining -= coin;
    }
  }

  return remaining === 0 ? result : null; // null if impossible
}

// --- DP Coin Change (for comparison) ---
function dpCoinChange(coins, amount) {
  const dp = new Array(amount + 1).fill(Infinity);
  const coinUsed = new Array(amount + 1).fill(-1);
  dp[0] = 0;

  for (let i = 1; i <= amount; i++) {
    for (const coin of coins) {
      if (coin <= i && dp[i - coin] + 1 < dp[i]) {
        dp[i] = dp[i - coin] + 1;
        coinUsed[i] = coin;
      }
    }
  }

  if (dp[amount] === Infinity) return null;

  const result = [];
  let rem = amount;
  while (rem > 0) {
    result.push(coinUsed[rem]);
    rem -= coinUsed[rem];
  }
  return result;
}

console.log("=== COIN CHANGE: GREEDY vs DP ===");

// Case 1: Indian denominations — greedy works!
const indianDenoms = [1, 2, 5, 10, 20, 50, 100, 500];
console.log("Indian Rs.93:");
console.log("  Greedy:", greedyCoinChange(indianDenoms, 93));
// [50, 20, 20, 2, 1] = 5 coins
console.log("  DP:", dpCoinChange(indianDenoms, 93));
// Same answer — greedy is optimal here

// Case 2: Custom denominations — greedy FAILS!
console.log("\nCustom [1,3,4], amount=6:");
console.log("  Greedy:", greedyCoinChange([1, 3, 4], 6)); // [4,1,1] = 3 coins (WRONG)
console.log("  DP:", dpCoinChange([1, 3, 4], 6));          // [3,3] = 2 coins (CORRECT)
// Greedy picks 4 first, then needs 1+1. But 3+3 is better.

console.log("\nCustom [1,5,6,9], amount=11:");
console.log("  Greedy:", greedyCoinChange([1, 5, 6, 9], 11)); // [9,1,1] = 3 coins
console.log("  DP:", dpCoinChange([1, 5, 6, 9], 11));          // [5,6] = 2 coins
console.log();

// ============================================================
// EXAMPLE 4 — Jump Game
// Story: Ola's route planner calculates if a driver can reach the
// destination given fuel stops. Each stop tells the maximum distance
// you can drive from there. Can you reach the last stop?
// ============================================================

// WHY: Jump Game teaches the "track farthest reachable" greedy pattern
// — useful in many array-based greedy problems.

// --- Algorithm ---
// Track the farthest position reachable so far.
// At each index, update farthest = max(farthest, i + nums[i]).
// If i > farthest, we're stuck. If farthest >= last index, we can reach.
// O(n) time, O(1) space

function canJump(nums) {
  let farthest = 0; // Farthest index reachable so far

  for (let i = 0; i < nums.length; i++) {
    if (i > farthest) return false; // Can't reach this index
    farthest = Math.max(farthest, i + nums[i]);
    if (farthest >= nums.length - 1) return true; // Can reach the end
  }

  return true;
}

// --- Jump Game II: Minimum jumps to reach end ---
// Greedy: at each "level", find the farthest you can reach, then jump
// O(n) time, O(1) space

function minJumps(nums) {
  if (nums.length <= 1) return 0;

  let jumps = 0;
  let currentEnd = 0;   // End of current jump range
  let farthest = 0;     // Farthest reachable from current range

  for (let i = 0; i < nums.length - 1; i++) {
    farthest = Math.max(farthest, i + nums[i]);
    if (i === currentEnd) {
      // Must jump — we've explored all positions in current range
      jumps++;
      currentEnd = farthest;
      if (currentEnd >= nums.length - 1) break;
    }
  }

  return jumps;
}

console.log("=== JUMP GAME ===");
console.log("Can reach end of [2,3,1,1,4]?", canJump([2, 3, 1, 1, 4])); // true
console.log("Can reach end of [3,2,1,0,4]?", canJump([3, 2, 1, 0, 4])); // false (stuck at index 3)
console.log("Min jumps for [2,3,1,1,4]:", minJumps([2, 3, 1, 1, 4]));     // 2
console.log("Min jumps for [2,3,0,1,4]:", minJumps([2, 3, 0, 1, 4]));     // 2
console.log();

// ============================================================
// EXAMPLE 5 — Huffman Coding (Simplified)
// Story: Hotstar streams cricket matches across India. Video data must
// be compressed for low-bandwidth rural connections. Huffman coding
// assigns shorter bit codes to frequent characters (like 'a', 'e') and
// longer codes to rare ones (like 'z', 'q'), reducing total file size.
// Used in gzip, JPEG, and MP3.
// ============================================================

// WHY: Huffman Coding is a real-world greedy algorithm used in virtually
// every compression algorithm. It demonstrates greedy optimality.

// --- Algorithm ---
// 1. Count frequency of each character
// 2. Create a leaf node for each character
// 3. While more than one node: merge two with lowest frequency
// 4. The resulting tree gives variable-length prefix codes
// O(n log n) where n = number of unique characters (heap operations)

class HuffmanNode {
  constructor(char, freq) {
    this.char = char;   // null for internal nodes
    this.freq = freq;
    this.left = null;   // 0-edge
    this.right = null;  // 1-edge
  }
}

function buildHuffmanTree(text) {
  // Step 1: Count frequencies
  const freq = {};
  for (const ch of text) {
    freq[ch] = (freq[ch] || 0) + 1;
  }

  // Step 2: Create nodes and use array as simple priority queue
  // (In production, use a min-heap for O(log n) extract-min)
  let nodes = Object.entries(freq).map(([ch, f]) => new HuffmanNode(ch, f));

  // Step 3: Merge until one tree remains
  while (nodes.length > 1) {
    nodes.sort((a, b) => a.freq - b.freq); // Sort by frequency (min first)
    const left = nodes.shift();   // Lowest frequency
    const right = nodes.shift();  // Second lowest

    const merged = new HuffmanNode(null, left.freq + right.freq);
    merged.left = left;
    merged.right = right;
    nodes.push(merged);
  }

  return nodes[0]; // Root of Huffman tree
}

function generateCodes(root, prefix = "", codes = {}) {
  if (!root) return codes;
  if (root.char !== null) {
    codes[root.char] = prefix || "0"; // Single-char edge case
    return codes;
  }
  generateCodes(root.left, prefix + "0", codes);
  generateCodes(root.right, prefix + "1", codes);
  return codes;
}

function huffmanEncode(text) {
  if (text.length === 0) return { codes: {}, encoded: "", ratio: 0 };

  const tree = buildHuffmanTree(text);
  const codes = generateCodes(tree);
  const encoded = [...text].map(ch => codes[ch]).join("");

  const originalBits = text.length * 8; // ASCII: 8 bits per char
  const compressedBits = encoded.length;
  const ratio = ((1 - compressedBits / originalBits) * 100).toFixed(1);

  return { codes, encoded, originalBits, compressedBits, ratio };
}

console.log("=== HUFFMAN CODING ===");
const hText = "aaaaabbbccdd";
const hResult = huffmanEncode(hText);
console.log(`Text: "${hText}"`);
console.log("Codes:", hResult.codes);
console.log(`Original: ${hResult.originalBits} bits, Compressed: ${hResult.compressedBits} bits (${hResult.ratio}% smaller)`);
// Key property: NO code is a prefix of another (prefix-free).
console.log();

// ============================================================
// EXAMPLE 6 — Merge Overlapping Intervals
// Story: BookMyShow event scheduling — multiple events at different
// times may overlap. Merge overlapping events to find actual time
// blocks when the venue is occupied. Used for calendar blocking at
// companies like Google, Zoho, and Freshworks.
// ============================================================

// WHY: Interval merging is extremely common in interviews and real
// systems (calendar apps, resource scheduling, IP range merging).

// --- Algorithm ---
// 1. Sort intervals by start time
// 2. For each interval: if it overlaps with current merged interval,
//    extend the end; otherwise start a new merged interval
// O(n log n) for sort + O(n) = O(n log n) total

function mergeIntervals(intervals) {
  if (intervals.length <= 1) return intervals;

  // Sort by start time
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);

  const merged = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const lastMerged = merged[merged.length - 1];

    if (current[0] <= lastMerged[1]) {
      // Overlapping — extend the end
      lastMerged[1] = Math.max(lastMerged[1], current[1]);
    } else {
      // Non-overlapping — start new interval
      merged.push(current);
    }
  }

  return merged;
}

console.log("=== MERGE OVERLAPPING INTERVALS ===");
const intervals = [[1, 3], [2, 6], [8, 10], [15, 18]];
console.log("Input:", JSON.stringify(intervals));
console.log("Merged:", JSON.stringify(mergeIntervals(intervals)));
// [[1,6], [8,10], [15,18]] — first two intervals overlap

console.log("Merged [[1,4],[4,5]]:", JSON.stringify(mergeIntervals([[1, 4], [4, 5]]))); // [[1,5]]
console.log();

// ============================================================
// EXAMPLE 7 — Gas Station Circuit
// Story: Ola electric auto-rickshaws run a circular route through
// Bengaluru. There are n charging stations along the route. Each
// station provides some charge, and travelling to the next station
// costs some charge. Can the auto complete the full circuit, and
// if so, from which station should it start?
// ============================================================

// WHY: Gas Station is a clever greedy problem that combines circular
// array traversal with surplus/deficit tracking.

// --- Algorithm ---
// Key insight: If total gas >= total cost, a solution EXISTS.
// Track cumulative surplus. If it goes negative, the start must be
// AFTER the current station (reset start to next station).
// O(n) time, O(1) space

function canCompleteCircuit(gas, cost) {
  let totalSurplus = 0; // Total gas - total cost
  let currentSurplus = 0; // Running surplus from current start
  let start = 0;

  for (let i = 0; i < gas.length; i++) {
    const net = gas[i] - cost[i]; // Net gain/loss at station i
    totalSurplus += net;
    currentSurplus += net;

    if (currentSurplus < 0) {
      // Can't reach station i+1 from current start
      // New start must be after station i
      start = i + 1;
      currentSurplus = 0; // Reset running surplus
    }
  }

  // If total surplus >= 0, the circuit is possible from 'start'
  return totalSurplus >= 0 ? start : -1;
}

console.log("=== GAS STATION CIRCUIT ===");
const gas1 = [1, 2, 3, 4, 5];
const cost1 = [3, 4, 5, 1, 2];
console.log("Gas:", gas1, "Cost:", cost1);
console.log("Start at station:", canCompleteCircuit(gas1, cost1)); // 3

const gas2 = [2, 3, 4];
const cost2 = [3, 4, 3];
console.log("Gas:", gas2, "Cost:", cost2);
console.log("Start at station:", canCompleteCircuit(gas2, cost2)); // -1 (impossible)
console.log();

// ============================================================
// SECTION 8 — GREEDY SUMMARY + GREEDY vs DP
// ============================================================

// Greedy works: Activity Selection, Fractional Knapsack, Huffman, Jump Game
// Greedy FAILS: 0/1 Knapsack, Coin Change (arbitrary), Edit Distance, LCS/LIS
// Rule: Try greedy first. If counterexample exists, switch to DP.
console.log();

// ============================================================
// SECTION 10 — TESTS
// ============================================================

console.log("=== RUNNING ALL GREEDY TESTS ===");

// Activity Selection
const as = activitySelection([
  { name: "A", start: 0, end: 6 },
  { name: "B", start: 1, end: 4 },
  { name: "C", start: 3, end: 5 },
  { name: "D", start: 5, end: 7 },
  { name: "E", start: 3, end: 9 },
  { name: "F", start: 5, end: 9 },
  { name: "G", start: 6, end: 10 },
  { name: "H", start: 8, end: 11 },
]);
console.assert(as.length === 3, "Activity selection should pick 3 activities");
console.log("Activity Selection: Passed");

// Fractional Knapsack
const fk = fractionalKnapsack(
  [{ name: "A", weight: 10, value: 60 }, { name: "B", weight: 20, value: 100 }, { name: "C", weight: 30, value: 120 }],
  50
);
console.assert(parseFloat(fk.totalValue) === 240, "Fractional knapsack value should be 240");
console.log("Fractional Knapsack: Passed");

// Coin Change
console.assert(greedyCoinChange([1, 5, 10, 25], 30).length === 2, "30 cents = quarter + nickel");
console.log("Greedy Coin Change: Passed");

// Jump Game
console.assert(canJump([2, 3, 1, 1, 4]) === true, "Should reach end");
console.assert(canJump([3, 2, 1, 0, 4]) === false, "Should not reach end");
console.assert(minJumps([2, 3, 1, 1, 4]) === 2, "Min jumps should be 2");
console.log("Jump Game: Passed");

// Merge Intervals
const mi = mergeIntervals([[1, 3], [2, 6], [8, 10], [15, 18]]);
console.assert(mi.length === 3, "Should merge to 3 intervals");
console.assert(mi[0][0] === 1 && mi[0][1] === 6, "First merged interval should be [1,6]");
console.log("Merge Intervals: Passed");

// Gas Station
console.assert(canCompleteCircuit([1, 2, 3, 4, 5], [3, 4, 5, 1, 2]) === 3, "Start at station 3");
console.assert(canCompleteCircuit([2, 3, 4], [3, 4, 3]) === -1, "Impossible circuit");
console.log("Gas Station: Passed");

console.log("\nAll Greedy algorithm tests passed!");

// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. Greedy makes the locally optimal choice at each step. It's simpler
//    and faster than DP but only works when the problem has the "greedy
//    choice property" — local optimality leads to global optimality.
// 2. Activity Selection (sort by end time) is the canonical greedy problem.
//    It has a mathematical proof of optimality.
// 3. Fractional Knapsack works with greedy (sort by value/weight ratio),
//    but 0/1 Knapsack does NOT — you need DP for the discrete version.
// 4. Coin Change with standard denominations works greedily, but arbitrary
//    denominations can fail. ALWAYS verify greedy with counterexamples!
// 5. Jump Game's "track farthest reachable" is a powerful greedy pattern.
// 6. Huffman Coding is a real-world greedy algorithm used in compression.
//    It proves that greedy choices (merge smallest frequencies) produce
//    optimal prefix-free codes.
// 7. Interval problems (merge, schedule) almost always start with sorting
//    by start or end time — this is the greedy setup.
// 8. Gas Station uses surplus/deficit tracking — a non-obvious greedy
//    insight that eliminates the need to try all starting points.
// 9. Decision rule: Try greedy first (simpler). If you can find a
//    counterexample where greedy fails, switch to DP.
// 10. In interviews, ALWAYS discuss whether greedy works before coding.
//     Showing you understand its limitations scores major points.
