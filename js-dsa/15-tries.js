// ============================================================
// FILE 15: TRIES (PREFIX TREES)
// Topic: Trie Data Structure, Autocomplete, and Prefix Operations
// WHY: Tries power autocomplete, spell-checkers, and prefix searches.
//      Google India processes 8.5 billion searches daily. As you type
//      "best restaurants in", the Trie finds all matching queries from
//      millions of stored searches in O(m) time, where m = prefix length.
//      No other data structure matches this for prefix operations.
// ============================================================

// ============================================================
// EXAMPLE 1 — What is a Trie? Google India's Autocomplete
// Story: Google India's search bar handles 300M+ daily users
//        typing queries in English, Hindi, and regional languages.
//        When you type "best res", the autocomplete suggests
//        "best restaurants in mumbai", "best restaurants near me",
//        "best resort in goa". Behind this is a Trie — a tree
//        where each node is a character, and paths from root to
//        marked nodes form complete words/queries.
// ============================================================

// WHY: A Trie stores strings char-by-char. Words sharing a prefix share the
// same path: "cat", "car", "card" share c→a. Each path to an end-of-word = a stored word.

class TrieNode {
  constructor() {
    this.children = new Map(); // char → TrieNode
    this.isEndOfWord = false;  // Does a valid word end here?
  }
}


// ============================================================
// EXAMPLE 2 — Trie Class Implementation
// Story: The Google India search team in Hyderabad implemented
//        the core Trie operations. Insert adds a new search query.
//        Search checks if an exact query exists. StartsWith finds
//        if any stored query begins with a prefix. These three
//        operations form the backbone of autocomplete.
// ============================================================

// WHY: All operations traverse char by char — O(m) where m = word/prefix length.

class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  // --- INSERT: Add a word to the Trie ---
  // Big-O: O(m) where m = word length
  // Space: O(m) in worst case (all new nodes)
  insert(word) {
    let current = this.root;

    for (const char of word) {
      // If character path doesn't exist, create it
      if (!current.children.has(char)) {
        current.children.set(char, new TrieNode());
      }
      current = current.children.get(char); // Move to next node
    }

    current.isEndOfWord = true; // Mark the end of the word
  }

  // --- SEARCH: Check if exact word exists ---
  // Big-O: O(m) where m = word length
  search(word) {
    const node = this._findNode(word);
    // Word exists only if we reach the end AND it is marked as end-of-word
    return node !== null && node.isEndOfWord;
  }

  // --- STARTS WITH: Check if any word starts with prefix ---
  // Big-O: O(m) where m = prefix length
  startsWith(prefix) {
    return this._findNode(prefix) !== null;
  }

  // --- HELPER: Traverse to the node at end of string ---
  // Returns null if the path doesn't exist
  _findNode(str) {
    let current = this.root;

    for (const char of str) {
      if (!current.children.has(char)) {
        return null; // Path doesn't exist
      }
      current = current.children.get(char);
    }

    return current;
  }

  // --- DELETE: Remove word, clean up unused nodes --- O(m)
  delete(word) {
    this._deleteHelper(this.root, word, 0);
  }

  _deleteHelper(node, word, depth) {
    if (node === null) return false;

    // Base case: reached the end of the word
    if (depth === word.length) {
      if (!node.isEndOfWord) return false; // Word doesn't exist
      node.isEndOfWord = false;            // Unmark end of word

      // Return true if this node has no children (safe to delete)
      return node.children.size === 0;
    }

    const char = word[depth];
    const childNode = node.children.get(char);

    if (!childNode) return false; // Word doesn't exist

    const shouldDeleteChild = this._deleteHelper(childNode, word, depth + 1);

    if (shouldDeleteChild) {
      node.children.delete(char); // Remove the child node

      // Return true if this node is also deletable (no other children, not end of another word)
      return node.children.size === 0 && !node.isEndOfWord;
    }

    return false;
  }

  // --- GET ALL WORDS WITH PREFIX --- O(m + k)
  getWordsWithPrefix(prefix) {
    const node = this._findNode(prefix);
    if (node === null) return [];

    const results = [];
    this._collectWords(node, prefix, results);
    return results;
  }

  _collectWords(node, currentWord, results) {
    if (node.isEndOfWord) {
      results.push(currentWord); // Found a complete word
    }

    // DFS through all children
    for (const [char, childNode] of node.children) {
      this._collectWords(childNode, currentWord + char, results);
    }
  }

  // --- AUTOCOMPLETE: Return top N matches --- O(m + k)
  autocomplete(prefix, limit = 5) {
    const allWords = this.getWordsWithPrefix(prefix);
    return allWords.slice(0, limit); // Return at most `limit` suggestions
  }
}

// --- Demo ---
console.log('=== TRIE BASIC OPERATIONS ===');
const trie = new Trie();

const queries = [
  'best restaurants in mumbai', 'best restaurants in delhi',
  'best restaurants near me', 'best resort in goa',
  'best resort in kerala', 'best movies 2024',
  'best mobile under 20000', 'best mobile under 15000',
  'best laptop for coding'
];
queries.forEach(q => trie.insert(q));

console.log('Search "best resort in goa":', trie.search('best resort in goa'));  // true
console.log('Search "best resort":', trie.search('best resort'));                 // false
console.log('StartsWith "best res":', trie.startsWith('best res'));              // true

console.log('\nAutocomplete "best res":');
trie.autocomplete('best res').forEach(s => console.log('  ', s));

// Delete
trie.delete('best movies 2024');
console.log('\nAfter delete — search "best movies 2024":', trie.search('best movies 2024')); // false


// ============================================================
// EXAMPLE 3 — Space Complexity and Optimization
// Story: Google India stores billions of search queries. A naive
//        Trie with ALPHABET_SIZE (26) pointers per node wastes
//        massive memory. Using a Map (hash table) for children
//        saves space — only storing characters that actually exist.
//        A compressed Trie (Radix/Patricia) merges single-child
//        chains further.
// ============================================================

// WHY: Understanding Trie space complexity helps you decide when
// a Trie is worth the memory cost vs simpler alternatives.

console.log('\n=== SPACE COMPLEXITY ===');
console.log('Worst case: O(ALPHABET_SIZE * m * n), where m=word length, n=word count');
console.log('Our Map-based children: only stores existing chars, saves memory');
console.log('Compressed Trie (Radix/Patricia): merges single-child chains into one node');


// ============================================================
// EXAMPLE 4 — Count Words with Given Prefix
// Story: Google India's analytics team wants to know how many
//        search queries start with "best mobile" — for trend
//        analysis and ad pricing. Counting words by prefix is a
//        natural Trie operation: traverse to the prefix node and
//        count all end-of-word markers in its subtree.
// ============================================================

// WHY: This extends the startsWith operation to count matches,
// useful for frequency analysis and ranking.

function countWordsWithPrefix(trie, prefix) {
  const node = trie._findNode(prefix);
  if (node === null) return 0;
  return countEndOfWords(node);
}

function countEndOfWords(node) {
  let count = node.isEndOfWord ? 1 : 0;
  for (const [, childNode] of node.children) {
    count += countEndOfWords(childNode);
  }
  return count;
}

// Big-O: O(m + k) where m = prefix length, k = nodes in subtree

console.log('\n=== COUNT WORDS WITH PREFIX ===');
console.log('Words starting with "best res":', countWordsWithPrefix(trie, 'best res'));
console.log('Words starting with "best mobile":', countWordsWithPrefix(trie, 'best mobile'));
console.log('Words starting with "best":', countWordsWithPrefix(trie, 'best'));
console.log('Words starting with "worst":', countWordsWithPrefix(trie, 'worst'));


// ============================================================
// EXAMPLE 5 — Longest Common Prefix
// Story: Flipkart's URL routing system stores paths like
//        /products/electronics/mobiles and /products/electronics/laptops.
//        Finding the longest common prefix (/products/electronics/)
//        helps optimize route caching. A Trie finds this by
//        traversing until a node has more than one child.
// ============================================================

// WHY: Classic Trie application, common in interviews.

function longestCommonPrefix(words) {
  if (words.length === 0) return '';

  // Build a Trie from all words
  const lcpTrie = new Trie();
  words.forEach(w => lcpTrie.insert(w));

  // Traverse from root while:
  // 1. Current node has exactly one child
  // 2. Current node is NOT an end of word (unless it is the only word)
  let current = lcpTrie.root;
  let prefix = '';

  while (current.children.size === 1 && !current.isEndOfWord) {
    const [char, childNode] = current.children.entries().next().value;
    prefix += char;
    current = childNode;
  }

  return prefix;
}

// Big-O: O(S) insertion + O(m) traversal

console.log('\n=== LONGEST COMMON PREFIX ===');
console.log('LCP ["flower","flow","flight"]:', longestCommonPrefix(['flower', 'flow', 'flight'])); // "fl"
console.log('LCP ["interview","internal","internet"]:', longestCommonPrefix(['interview', 'internal', 'internet'])); // "inter"


// ============================================================
// EXAMPLE 6 — Word Search: Is Any Trie Word a Prefix of Input?
// Story: Paytm's content moderation system stores banned word
//        prefixes in a Trie: "spam", "scam", "xxx". When a user
//        posts a message, they check if any banned word is a prefix
//        of any word in the message. This is the reverse of
//        startsWith: instead of "does any stored word start with X",
//        it is "does X start with any stored word".
// ============================================================

// WHY: Reverse-prefix check for content filtering and blocklisting.

function hasWordAsPrefix(trie, str) {
  // Check if any word in the Trie is a prefix of the given string
  let current = trie.root;

  for (const char of str) {
    if (current.isEndOfWord) {
      return true; // Found a stored word that is a prefix of str
    }
    if (!current.children.has(char)) {
      return false; // No matching path
    }
    current = current.children.get(char);
  }

  return current.isEndOfWord;
}

// Big-O: O(m) where m = length of input string

console.log('\n=== WORD SEARCH: IS ANY TRIE WORD A PREFIX? ===');
const filterTrie = new Trie();
['spam', 'scam', 'hack', 'xxx'].forEach(w => filterTrie.insert(w));

console.log('"spammer" contains banned prefix?', hasWordAsPrefix(filterTrie, 'spammer'));   // true
console.log('"hello" contains banned prefix?', hasWordAsPrefix(filterTrie, 'hello'));       // false


// ============================================================
// EXAMPLE 7 — Trie vs HashMap: When to Use Which
// Story: During a system design interview at Google India, the
//        candidate suggested using a HashMap for autocomplete.
//        The interviewer asked: "How do you find all keys starting
//        with 'best'?" With HashMap, you scan ALL keys — O(n).
//        With Trie, you traverse to 'best' and DFS — O(m + k).
//        For prefix-heavy operations, Trie wins decisively.
// ============================================================

// WHY: This comparison helps you choose the right data structure.
// Both have their strengths — neither is universally better.

console.log('\n=== TRIE vs HASHMAP ===');
console.log('Trie:  insert O(m), search O(m), prefix search O(m+k) — excellent for autocomplete');
console.log('HashMap: insert O(m), search O(m), prefix search O(n*m) — must scan all keys');
console.log('Use Trie for prefix ops (autocomplete, spell check, IP routing)');
console.log('Use HashMap for exact lookups only, or when memory is constrained');



// ============================================================
// EXAMPLE 8 — Real-World Applications
// Story: Trie-based systems power some of India's most-used
//        digital services. From Google search suggestions to
//        PhonePe's UPI ID lookup to IRCTC's station name
//        autocomplete — Tries handle billions of prefix queries
//        daily across the Indian tech ecosystem.
// ============================================================

console.log('\n=== REAL-WORLD TRIE APPLICATIONS ===');
console.log('1. Autocomplete (Google, YouTube, Amazon)');
console.log('2. Spell checker (Google Docs, Grammarly)');
console.log('3. IP routing (longest prefix match in routers)');
console.log('4. Phone directory / contacts search');
console.log('5. T9 predictive text (old phone keyboards)');


// ============================================================
// EXAMPLE 9 — Practical: Build Trie + Autocomplete System +
//             Solve Prefix Problems
// Story: The Google India campus hiring team set up a live coding
//        round at IIT Bombay. Candidates had to build a complete
//        autocomplete system with ranking. The top candidates
//        also solved the word break problem using Trie — a
//        classic DP + Trie combination.
// ============================================================

// --- Problem 1: Autocomplete with Frequency Ranking ---
class AutocompleteTrie {
  constructor() {
    this.root = new TrieNode();
  }

  // Insert with frequency count
  insert(word, frequency = 1) {
    let current = this.root;

    for (const char of word) {
      if (!current.children.has(char)) {
        current.children.set(char, new TrieNode());
      }
      current = current.children.get(char);
    }

    current.isEndOfWord = true;
    current.frequency = (current.frequency || 0) + frequency;
  }

  // Get top K suggestions sorted by frequency
  suggest(prefix, k = 5) {
    const node = this._findNode(prefix);
    if (node === null) return [];

    const suggestions = [];
    this._collect(node, prefix, suggestions);

    // Sort by frequency (descending) and return top K
    suggestions.sort((a, b) => b.frequency - a.frequency);
    return suggestions.slice(0, k).map(s => s.word);
  }

  _findNode(str) {
    let current = this.root;
    for (const char of str) {
      if (!current.children.has(char)) return null;
      current = current.children.get(char);
    }
    return current;
  }

  _collect(node, currentWord, results) {
    if (node.isEndOfWord) {
      results.push({ word: currentWord, frequency: node.frequency || 0 });
    }
    for (const [char, childNode] of node.children) {
      this._collect(childNode, currentWord + char, results);
    }
  }
}

console.log('\n=== AUTOCOMPLETE WITH RANKING ===');
const autocomplete = new AutocompleteTrie();

// Simulate search query frequencies
autocomplete.insert('best restaurants in mumbai', 5000);
autocomplete.insert('best restaurants near me', 8000);
autocomplete.insert('best resort in goa', 3000);
autocomplete.insert('best restaurants in bangalore', 4000);

console.log('Suggestions for "best res" (top 3):');
autocomplete.suggest('best res', 3).forEach((s, i) => console.log(`  ${i + 1}. ${s}`));

// --- Problem 2: Word Break Problem (DP + Trie) ---
// WHY: Given a string and a dictionary, can the string be segmented
// into valid dictionary words? Trie enables efficient prefix checking.

function wordBreak(s, wordDict) {
  const dictTrie = new Trie();
  wordDict.forEach(w => dictTrie.insert(w));

  // dp[i] = true if s[0..i-1] can be segmented into valid words
  const dp = new Array(s.length + 1).fill(false);
  dp[0] = true; // Empty string is always valid

  for (let i = 1; i <= s.length; i++) {
    for (let j = 0; j < i; j++) {
      if (dp[j] && dictTrie.search(s.substring(j, i))) {
        dp[i] = true;
        break;
      }
    }
  }

  return dp[s.length];
}

// Big-O: O(n^2 * m) where n = string length, m = average word length

console.log('\n=== WORD BREAK PROBLEM ===');
console.log('Can "ilikecoding" be segmented?',
  wordBreak('ilikecoding', ['i', 'like', 'coding', 'code'])); // true
console.log('Can "catsandog" be segmented?',
  wordBreak('catsandog', ['cats', 'dog', 'sand', 'and', 'cat'])); // false
console.log('Can "applepenapple" be segmented?',
  wordBreak('applepenapple', ['apple', 'pen'])); // true

// --- Problem 3: Replace Words (Root Replacement) ---
// WHY: Given a list of root words and a sentence, replace every word
// in the sentence with its shortest root. Trie makes root lookup O(m).

function replaceWords(roots, sentence) {
  const rootTrie = new Trie();
  roots.forEach(r => rootTrie.insert(r));

  return sentence.split(' ').map(word => {
    // Find the shortest root that is a prefix of this word
    let current = rootTrie.root;
    let prefix = '';

    for (const char of word) {
      if (current.isEndOfWord) return prefix; // Found shortest root
      if (!current.children.has(char)) return word; // No root matches
      current = current.children.get(char);
      prefix += char;
    }

    return current.isEndOfWord ? prefix : word;
  }).join(' ');
}

// Big-O: O(S) where S = total characters in sentence

console.log('\n=== REPLACE WORDS ===');
const roots = ['cat', 'bat', 'rat'];
const sentence = 'the cattle was rattled by the battery';
console.log('Original:', sentence);
console.log('Replaced:', replaceWords(roots, sentence));
// "the cat was rat by the bat"


// --- Problem 4: Search Suggestions System (Amazon-style) ---
// WHY: Show up to 3 suggestions as each character is typed.
function searchSuggestions(products, searchWord) {
  const sugTrie = new Trie();
  products.forEach(p => sugTrie.insert(p));
  const results = [];
  let prefix = '';
  for (const char of searchWord) {
    prefix += char;
    const matches = sugTrie.getWordsWithPrefix(prefix);
    matches.sort();
    results.push(matches.slice(0, 3));
  }
  return results;
}

// Big-O: O(n * m * log(m)) for sorting + O(m * k) for Trie ops
console.log('\n=== SEARCH SUGGESTIONS (Amazon-style) ===');
const products = ['mobile', 'mouse', 'moneypot', 'monitor', 'mousepad'];
const suggestions = searchSuggestions(products, 'mouse');
suggestions.forEach((sugg, i) => {
  console.log(`  After typing "${'mouse'.substring(0, i + 1)}":`, sugg);
});


// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. A Trie (Prefix Tree) stores strings character-by-character.
//    Each path from root to end-of-word = a stored string.
// 2. TrieNode has: children (Map<char, TrieNode>), isEndOfWord (boolean).
// 3. Core operations — ALL O(m) where m = word/prefix length:
//    - insert(word): create nodes for each char, mark end
//    - search(word): traverse chars, check isEndOfWord
//    - startsWith(prefix): traverse chars, return true if path exists
//    - delete(word): unmark end, clean up unused nodes
// 4. getWordsWithPrefix(prefix): O(m + k) — traverse to prefix node,
//    DFS to collect all words. k = total chars in results.
// 5. Space: O(ALPHABET * m * n) worst case. Use Map for children
//    to save space (only store existing characters).
// 6. Compressed Trie (Patricia/Radix): merges single-child chains
//    into single nodes with edge labels. Saves nodes.
// 7. Trie vs HashMap:
//    - Trie:    O(m + k) prefix search — excellent for autocomplete
//    - HashMap: O(n * m) prefix search — must scan all keys
//    - HashMap: O(1) exact lookup — better for non-prefix operations
// 8. Real-world uses: autocomplete, spell checker, IP routing,
//    phone directory, content filtering, URL routing.
// 9. Common interview patterns:
//    - Word Break (DP + Trie)
//    - Replace Words (shortest root prefix)
//    - Search Suggestions (autocomplete at each keystroke)
//    - Longest Common Prefix
// 10. For production autocomplete, combine Trie with frequency
//     ranking to show most popular suggestions first.
// ============================================================

console.log('\n=== ALL TRIE EXAMPLES COMPLETE ===');
