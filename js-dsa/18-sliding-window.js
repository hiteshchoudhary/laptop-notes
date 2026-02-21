// ============================================================
// FILE 18: SLIDING WINDOW TECHNIQUE
// Topic: Optimizing subarray/substring problems with the sliding window pattern
// WHY: Sliding window turns O(n*k) brute-force problems into O(n) solutions.
//   It's one of the most common interview patterns and powers real-time
//   analytics, streaming data processing, and rate limiting systems.
// ============================================================

// ============================================================
// HOTSTAR — THE SLIDING WINDOW STORY
// Disney+ Hotstar streams IPL to 25 million concurrent viewers. Their analytics
// team needs to find the maximum concurrent viewers in any 5-minute window
// across a day's data (17,280 data points). Brute force checks every window
// by summing 5 values each time — O(n*k). Sliding window maintains a running
// sum, adding the new point and removing the old — O(n). At Hotstar's scale,
// that's the difference between real-time dashboards and crashed servers.
// ============================================================

// ============================================================
// EXAMPLE 1 — What is Sliding Window?
// Story: PhonePe monitors transaction volumes. To detect fraud spikes, they
// analyze rolling 10-minute windows of transaction counts. Instead of
// re-counting all 10 minutes of data for each new minute, they "slide" the
// window: add the newest minute's data, remove the oldest. This is the
// sliding window technique in action.
// ============================================================

// WHY: Many problems ask about contiguous subarrays or substrings.
// Sliding window processes these in O(n) by maintaining a "window" that
// slides across the data, updating state incrementally instead of recomputing.

// --- Two Types of Sliding Window ---
// 1. FIXED-SIZE WINDOW: Window size k is given. Slide by adding right, removing left.
//    Example: "Max sum of k consecutive elements"
//
// 2. VARIABLE-SIZE WINDOW: Window grows/shrinks based on condition.
//    Example: "Smallest subarray with sum >= target"

console.log("=== SLIDING WINDOW: TWO TYPES ===");
console.log("FIXED:    Window size k is constant. Slide one step at a time.");
console.log("VARIABLE: Window expands/contracts based on a condition.\n");

// ============================================================
// EXAMPLE 2 — Problem 1: Maximum Sum Subarray of Size K (Fixed Window)
// Story: Zomato tracks daily order counts for each restaurant. They want to
// find the best 7-day streak (highest total orders) for each restaurant
// to award "Trending Restaurant of the Week". With millions of restaurants,
// brute force O(n*k) is too slow — sliding window does it in O(n).
// ============================================================

// WHY: This is the simplest sliding window problem. It demonstrates the
// core idea: instead of re-summing k elements each time, add the new
// element entering the window and subtract the one leaving.

// --- Brute Force: O(n * k) ---
function maxSumBrute(arr, k) {
  let maxSum = -Infinity;
  // Check every window of size k
  for (let i = 0; i <= arr.length - k; i++) {
    let windowSum = 0;
    for (let j = i; j < i + k; j++) {
      windowSum += arr[j]; // Sum k elements for each window
    }
    maxSum = Math.max(maxSum, windowSum);
  }
  return maxSum;
}

// --- Sliding Window: O(n) ---
function maxSumSlidingWindow(arr, k) {
  if (arr.length < k) return null;

  // Step 1: Compute sum of first window
  let windowSum = 0;
  for (let i = 0; i < k; i++) {
    windowSum += arr[i];
  }
  let maxSum = windowSum;

  // Step 2: Slide the window — add right, remove left
  for (let i = k; i < arr.length; i++) {
    windowSum += arr[i];       // Add element entering the window (right)
    windowSum -= arr[i - k];   // Remove element leaving the window (left)
    maxSum = Math.max(maxSum, windowSum);
  }

  return maxSum;
}

console.log("=== PROBLEM 1: MAX SUM SUBARRAY OF SIZE K ===");
const orders = [100, 200, 300, 400, 500, 200, 100, 600, 700];
const k1 = 3;

console.log(`Orders: [${orders}]`);
console.log(`Window size k = ${k1}`);
console.log(`Brute Force result: ${maxSumBrute(orders, k1)}`);          // O(n*k)
console.log(`Sliding Window result: ${maxSumSlidingWindow(orders, k1)}`); // O(n)

// Step-by-step trace
console.log("\nStep-by-step trace:");
let traceSum = orders[0] + orders[1] + orders[2];
console.log(`  Window [100, 200, 300] = ${traceSum}`);
for (let i = 3; i < orders.length; i++) {
  const removed = orders[i - 3];
  const added = orders[i];
  traceSum = traceSum + added - removed;
  console.log(`  Slide: remove ${removed}, add ${added} -> Window sum = ${traceSum}`);
}

console.log(`\nBig-O: Brute force O(n*k) = O(${orders.length}*${k1}) = O(${orders.length * k1})`);
console.log(`Big-O: Sliding window O(n) = O(${orders.length})\n`);

// ============================================================
// EXAMPLE 3 — Problem 2: Maximum of All Subarrays of Size K (Monotonic Deque)
// Story: CRED analyzes credit card spending patterns. For each sliding window
// of k months, they need the maximum spend — not just the sum. A naive approach
// checks all k elements per window (O(n*k)). Using a monotonic deque that
// maintains elements in decreasing order, each element enters and exits the
// deque at most once — O(n) total.
// ============================================================

// WHY: This is a harder sliding window variant. The monotonic deque keeps
// track of potential maximums efficiently. This pattern appears in stock
// price analysis, temperature monitoring, and rate-limiting.

// --- Monotonic Deque Approach: O(n) ---
// Deque stores INDICES (not values) in decreasing order of their values.
// Front of deque = index of current maximum.
// When sliding:
//   1. Remove front if it's outside window
//   2. Remove all back elements smaller than new element (they'll never be max)
//   3. Add new element index to back

function maxOfSubarrays(arr, k) {
  const result = [];
  const deque = []; // Stores indices, values are decreasing

  for (let i = 0; i < arr.length; i++) {
    // Remove indices outside the current window
    while (deque.length > 0 && deque[0] < i - k + 1) {
      deque.shift();
    }

    // Remove all indices whose values are smaller than arr[i]
    // They can never be the maximum for any future window
    while (deque.length > 0 && arr[deque[deque.length - 1]] <= arr[i]) {
      deque.pop();
    }

    // Add current index
    deque.push(i);

    // Window is fully formed when i >= k - 1
    if (i >= k - 1) {
      result.push(arr[deque[0]]); // Front of deque is the max
    }
  }

  return result;
}

console.log("=== PROBLEM 2: MAXIMUM OF ALL SUBARRAYS OF SIZE K ===");
const spending = [1, 3, -1, -3, 5, 3, 6, 7];
const k2 = 3;

console.log(`Array: [${spending}]`);
console.log(`k = ${k2}`);
console.log(`Maximums: [${maxOfSubarrays(spending, k2)}]`);

// Trace
console.log("\nStep-by-step trace:");
console.log("  i=0: deque=[0]          (val: 1)");
console.log("  i=1: deque=[1]          (val: 3, removed 1<=3)");
console.log("  i=2: deque=[1,2]        (val: 3,-1) -> max=3");
console.log("  i=3: deque=[1,2,3]->pop 2, deque=[1,3] (val: 3,-3) -> max=3");
console.log("  i=4: deque=[4]          (val: 5, removed all<=5) -> max=5");
console.log("  i=5: deque=[4,5]        (val: 5,3) -> max=5");
console.log("  i=6: deque=[6]          (val: 6, removed all<=6) -> max=6");
console.log("  i=7: deque=[7]          (val: 7, removed all<=7) -> max=7");
console.log(`\nBig-O: O(n) — each element enters/exits deque at most once\n`);

// ============================================================
// EXAMPLE 4 — Problem 3: Smallest Subarray with Sum >= Target (Variable Window)
// Story: Razorpay monitors payment batches. They need to find the smallest
// consecutive batch of transactions whose total exceeds a threshold (potential
// fraud indicator). Variable sliding window: expand right until sum >= target,
// then shrink left to find the minimum window.
// ============================================================

// WHY: Variable window is the second major pattern. Instead of fixed size,
// the window expands and contracts based on a condition. This is used for
// minimum/maximum subarray problems with a target condition.

// Big-O: Time O(n), Space O(1)
// Each element is added once (right pointer) and removed at most once (left pointer)
function minSubarrayWithSum(arr, target) {
  let left = 0;
  let windowSum = 0;
  let minLength = Infinity;
  let bestWindow = null;

  for (let right = 0; right < arr.length; right++) {
    // Expand: add right element to window
    windowSum += arr[right];

    // Shrink: while condition is met, try to minimize
    while (windowSum >= target) {
      if (right - left + 1 < minLength) {
        minLength = right - left + 1;
        bestWindow = arr.slice(left, right + 1);
      }
      windowSum -= arr[left]; // Remove left element
      left++;                 // Shrink window
    }
  }

  return { minLength: minLength === Infinity ? 0 : minLength, window: bestWindow };
}

console.log("=== PROBLEM 3: SMALLEST SUBARRAY WITH SUM >= TARGET ===");
const payments = [2, 3, 1, 2, 4, 3];
const target3 = 7;

console.log(`Payments: [${payments}]`);
console.log(`Target sum: >= ${target3}`);
const result3 = minSubarrayWithSum(payments, target3);
console.log(`Smallest subarray: [${result3.window}] (length: ${result3.minLength})`);

// Trace
console.log("\nStep-by-step trace:");
console.log("  right=0: sum=2, window=[2]");
console.log("  right=1: sum=5, window=[2,3]");
console.log("  right=2: sum=6, window=[2,3,1]");
console.log("  right=3: sum=8 >= 7! minLen=4. Shrink: remove 2, sum=6 < 7");
console.log("  right=4: sum=10 >= 7! minLen=3. Shrink: remove 3, sum=7 >= 7! minLen=2");
console.log("  Shrink: remove 1, sum=6 < 7");
console.log("  right=5: sum=9 >= 7! minLen=2. Shrink: remove 2, sum=7 >= 7! minLen=2");
console.log("  Shrink: remove 4, sum=3 < 7");
console.log(`\nBig-O: O(n) — left and right each traverse array once\n`);

// ============================================================
// EXAMPLE 5 — Problem 4: Longest Substring Without Repeating Characters
// Story: Flipkart's search engine processes user queries. They need to find
// the longest substring of unique characters in each search query (for
// autocomplete optimization). Variable window expands until a duplicate
// is found, then shrinks past the duplicate.
// ============================================================

// WHY: This is one of the most frequently asked interview questions (LeetCode #3).
// It demonstrates variable window with a Set/Map for tracking uniqueness.

// Big-O: Time O(n), Space O(min(n, alphabet_size))
function longestSubstringWithoutRepeats(s) {
  const charIndex = new Map(); // char -> last seen index
  let left = 0;
  let maxLength = 0;
  let bestStart = 0;

  for (let right = 0; right < s.length; right++) {
    const char = s[right];

    // If char is in window (seen at or after left), shrink past it
    if (charIndex.has(char) && charIndex.get(char) >= left) {
      left = charIndex.get(char) + 1; // Move left past the duplicate
    }

    charIndex.set(char, right); // Update last seen index

    if (right - left + 1 > maxLength) {
      maxLength = right - left + 1;
      bestStart = left;
    }
  }

  return {
    length: maxLength,
    substring: s.slice(bestStart, bestStart + maxLength),
  };
}

console.log("=== PROBLEM 4: LONGEST SUBSTRING WITHOUT REPEATING CHARS ===");
const testStrings = ["abcabcbb", "bbbbb", "pwwkew", "razorpay"];

testStrings.forEach((s) => {
  const result = longestSubstringWithoutRepeats(s);
  console.log(`  "${s}" -> "${result.substring}" (length: ${result.length})`);
});

// Detailed trace for "abcabcbb"
console.log('\nTrace for "abcabcbb":');
console.log("  right=0 'a': map={a:0}, left=0, window='a', len=1");
console.log("  right=1 'b': map={a:0,b:1}, left=0, window='ab', len=2");
console.log("  right=2 'c': map={a:0,b:1,c:2}, left=0, window='abc', len=3");
console.log("  right=3 'a': duplicate! left=0+1=1, map={a:3,b:1,c:2}, window='bca', len=3");
console.log("  right=4 'b': duplicate! left=1+1=2, map={a:3,b:4,c:2}, window='cab', len=3");
console.log("  right=5 'c': duplicate! left=2+1=3, map={a:3,b:4,c:5}, window='abc', len=3");
console.log("  right=6 'b': duplicate! left=4+1=5, map={a:3,b:6,c:5}, window='cb', len=2");
console.log("  right=7 'b': duplicate! left=6+1=7, map={a:3,b:7,c:5}, window='b', len=1");
console.log(`\nBig-O: O(n) time, O(min(n, charset)) space\n`);

// ============================================================
// EXAMPLE 6 — Problem 5: Longest Substring with At Most K Distinct Characters
// Story: Netflix India categorizes shows by language. They analyze viewing
// sequences to find the longest streak where a user watches shows in at most
// K different languages — useful for personalized language recommendations.
// ============================================================

// WHY: This extends the "no repeats" problem by allowing up to K distinct
// characters. It demonstrates the expand-shrink pattern with a frequency map.

// Big-O: Time O(n), Space O(k)
function longestSubstringKDistinct(s, k) {
  if (k === 0 || s.length === 0) return { length: 0, substring: "" };

  const charFreq = new Map(); // char -> frequency in current window
  let left = 0;
  let maxLength = 0;
  let bestStart = 0;

  for (let right = 0; right < s.length; right++) {
    const char = s[right];
    charFreq.set(char, (charFreq.get(char) || 0) + 1);

    // Shrink window while we have more than k distinct characters
    while (charFreq.size > k) {
      const leftChar = s[left];
      charFreq.set(leftChar, charFreq.get(leftChar) - 1);
      if (charFreq.get(leftChar) === 0) {
        charFreq.delete(leftChar); // Remove character entirely when freq = 0
      }
      left++;
    }

    if (right - left + 1 > maxLength) {
      maxLength = right - left + 1;
      bestStart = left;
    }
  }

  return { length: maxLength, substring: s.slice(bestStart, bestStart + maxLength) };
}

console.log("=== PROBLEM 5: LONGEST SUBSTRING WITH AT MOST K DISTINCT ===");
const tests5 = [
  { s: "eceba", k: 2 },
  { s: "aabbcc", k: 2 },
  { s: "aabbcc", k: 3 },
];

tests5.forEach(({ s, k }) => {
  const result = longestSubstringKDistinct(s, k);
  console.log(`  "${s}" (k=${k}) -> "${result.substring}" (length: ${result.length})`);
});

// Trace for "eceba", k=2
console.log('\nTrace for "eceba", k=2:');
console.log("  right=0 'e': freq={e:1}, distinct=1 <= 2, window='e', len=1");
console.log("  right=1 'c': freq={e:1,c:1}, distinct=2 <= 2, window='ec', len=2");
console.log("  right=2 'e': freq={e:2,c:1}, distinct=2 <= 2, window='ece', len=3");
console.log("  right=3 'b': freq={e:2,c:1,b:1}, distinct=3 > 2! Shrink:");
console.log("    remove 'e': freq={e:1,c:1,b:1}, still 3. Shrink:");
console.log("    remove 'c': freq={e:1,b:1}, distinct=2. window='eb', len=2");
console.log("  right=4 'a': freq={e:1,b:1,a:1}, distinct=3 > 2! Shrink:");
console.log("    remove 'e': freq={b:1,a:1}, distinct=2. window='ba', len=2");
console.log(`  Answer: "ece" (length 3)\n`);

// ============================================================
// EXAMPLE 7 — Problem 6: Minimum Window Substring
// Story: Naukri.com matches job postings to candidate skills. Given a posting
// with required skills "ABC" and a candidate's skill sequence "ADOBECODEBANC",
// find the smallest contiguous window containing all required skills. This
// is the classic minimum window substring problem.
// ============================================================

// WHY: This is one of the hardest sliding window problems (LeetCode #76).
// It combines variable window, frequency maps, and a "formed" counter.
// Mastering this means you can handle any sliding window interview question.

// Big-O: Time O(n + m) where n = s.length, m = t.length. Space O(m)
function minWindowSubstring(s, t) {
  if (t.length > s.length) return "";

  // Frequency map of characters we need
  const need = new Map();
  for (const char of t) {
    need.set(char, (need.get(char) || 0) + 1);
  }

  const windowFreq = new Map();
  let formed = 0;          // How many unique chars in t have desired frequency
  const required = need.size; // How many unique chars in t we need

  let left = 0;
  let minLength = Infinity;
  let minStart = 0;

  for (let right = 0; right < s.length; right++) {
    const char = s[right];
    windowFreq.set(char, (windowFreq.get(char) || 0) + 1);

    // Check if current char's frequency matches what we need
    if (need.has(char) && windowFreq.get(char) === need.get(char)) {
      formed++;
    }

    // Shrink window while all required characters are present
    while (formed === required) {
      // Update minimum
      if (right - left + 1 < minLength) {
        minLength = right - left + 1;
        minStart = left;
      }

      // Remove left character and shrink
      const leftChar = s[left];
      windowFreq.set(leftChar, windowFreq.get(leftChar) - 1);
      if (need.has(leftChar) && windowFreq.get(leftChar) < need.get(leftChar)) {
        formed--; // Lost a required character
      }
      left++;
    }
  }

  return minLength === Infinity ? "" : s.slice(minStart, minStart + minLength);
}

console.log("=== PROBLEM 6: MINIMUM WINDOW SUBSTRING ===");
const testCases6 = [
  { s: "ADOBECODEBANC", t: "ABC" },
  { s: "a", t: "a" },
  { s: "a", t: "aa" },
];

testCases6.forEach(({ s, t }) => {
  const result = minWindowSubstring(s, t);
  console.log(`  s="${s}", t="${t}" -> "${result}"`);
});

// Trace for s="ADOBECODEBANC", t="ABC"
console.log('\nTrace for s="ADOBECODEBANC", t="ABC":');
console.log("  need: {A:1, B:1, C:1}, required=3 unique chars");
console.log("  right=0 'A': formed=1 (A met)");
console.log("  right=1 'D': formed=1");
console.log("  right=2 'O': formed=1");
console.log("  right=3 'B': formed=2 (B met)");
console.log("  right=4 'E': formed=2");
console.log("  right=5 'C': formed=3 (C met)! Window='ADOBEC' len=6");
console.log("    Shrink: remove A, formed=2. minLen=6");
console.log("  right=9 'A': formed=3! Window='CODEBA' len=6");
console.log("  ...eventually finds 'BANC' len=4");
console.log(`  Answer: "BANC"\n`);

// ============================================================
// EXAMPLE 8 — Summary: When to Use Sliding Window
// Story: An Amazon SDE-2 interviewer tells you: "If you see these keywords
// in a problem — contiguous, subarray, substring, window, consecutive,
// maximum/minimum of k elements — think sliding window FIRST. It converts
// O(n*k) brute force into O(n) elegance."
// ============================================================

console.log("\n=== WHEN TO USE SLIDING WINDOW ===");
console.log("Keywords that signal sliding window:");
console.log("  - 'contiguous subarray' or 'substring'");
console.log("  - 'window of size k'");
console.log("  - 'maximum/minimum sum of k elements'");
console.log("  - 'longest/shortest substring with condition'");
console.log("  - 'at most k distinct characters'");
console.log("");
console.log("Decision tree:");
console.log("  Is window size fixed? -> Fixed sliding window");
console.log("  Is window size variable? -> Two-pointer / variable window");
console.log("  Need max of each window? -> Monotonic deque");
console.log("  Need to track frequencies? -> HashMap + window");

// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. Sliding window converts O(n*k) brute force to O(n) by maintaining
//    a running window state and updating incrementally.
// 2. FIXED WINDOW: size k is given. Init first k, then slide (add right,
//    remove left). Used for: max sum, average, count in k-element windows.
// 3. VARIABLE WINDOW: expand right until condition met, shrink left to
//    optimize. Used for: smallest/longest subarray with a condition.
// 4. Monotonic Deque: maintains max/min of sliding window in O(n). Elements
//    enter/exit deque at most once.
// 5. Minimum Window Substring: hardest pattern. Use need map + window freq
//    + formed counter. O(n + m) time.
// 6. ALWAYS ask: "Can I avoid recomputing by adjusting the previous window?"
//    If yes, use sliding window.
// 7. Two pointers (left/right) are the mechanism. Sliding window is the
//    pattern. They work together.
// ============================================================

console.log("\n=== BIG-O SUMMARY ===");
console.log("+------------------------------------------+-----------+----------+");
console.log("| Problem                                  | Brute     | Window   |");
console.log("+------------------------------------------+-----------+----------+");
console.log("| Max sum subarray of size k               | O(n*k)    | O(n)     |");
console.log("| Max of all subarrays of size k           | O(n*k)    | O(n)     |");
console.log("| Smallest subarray with sum >= target     | O(n^2)    | O(n)     |");
console.log("| Longest substring no repeats             | O(n^2)    | O(n)     |");
console.log("| Longest substring k distinct             | O(n^2)    | O(n)     |");
console.log("| Minimum window substring                 | O(n^2)    | O(n+m)   |");
console.log("+------------------------------------------+-----------+----------+");
