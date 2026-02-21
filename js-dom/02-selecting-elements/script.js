// ============================================================
// FILE 02: SELECTING ELEMENTS
// Topic: Finding and selecting DOM elements — the foundation of all DOM manipulation
// WHY: Before you can change anything on a web page, you must first FIND
// it. Selecting elements efficiently is like searching for the right
// restaurant on Zomato — you need the right filters. Wrong strategies
// lead to bugs, slow performance, and brittle code.
// ============================================================

// --- Helper: log to both console and on-page output panel ---
function log(msg, targetId) {
  console.log(msg);
  const el = document.getElementById(targetId);
  if (el) el.textContent += msg + '\n';
}

// Helper: clear all card highlights
function clearHighlights() {
  document.querySelectorAll('.restaurant-card').forEach(card => {
    card.classList.remove('highlighted', 'dimmed', 'selected');
  });
}

// ============================================================
// EXAMPLE 1 — Zomato's Restaurant Search
// Story: Zomato displays thousands of restaurant cards on a single page.
// When a user applies a filter ("Pure Veg" + "4-star and above"), Zomato's
// JavaScript must find all matching cards instantly. Using the wrong
// selector makes filtering sluggish on budget phones. The right method
// keeps the experience snappy even with thousands of elements.
// ============================================================

// The restaurant grid in the HTML is our live playground.

// ============================================================
// EXAMPLE 2 — getElementById() — The Fastest Lookup
// Story: When Zomato auto-focuses the search box on page load, they use
// getElementById('search-box'). IDs are unique, so the browser maintains
// a hash map making this O(1). It is the FASTEST way to select.
// ============================================================

// WHY: getElementById is most performant because browsers index IDs.

// Key Points:
// 1. Returns single element or null (never a collection)
// 2. Only on `document`, not on individual elements
// 3. Do NOT include '#': getElementById('search-box'), not '#search-box'
// 4. Duplicate IDs? Returns the first one (but HTML is invalid)

document.getElementById('btn-getbyid').addEventListener('click', () => {
  const out = 'output-2';
  document.getElementById(out).textContent = '';
  clearHighlights();

  const searchBox = document.getElementById('search-box');
  log('--- getElementById("search-box") ---', out);
  log(`Element found: ${searchBox !== null}`, out);
  log(`Tag: <${searchBox.tagName.toLowerCase()}>`, out);
  log(`Placeholder: "${searchBox.placeholder}"`, out);
  log(`Type: "${searchBox.type}"`, out);
  log('', out);
  log('getElementById is fastest — O(1) hash lookup', out);
  log('Returns single element or null', out);
  log('Only on document. Do NOT include "#".', out);

  searchBox.focus();
  searchBox.style.borderColor = '#6366f1';
  setTimeout(() => { searchBox.style.borderColor = ''; }, 2000);
});

document.getElementById('btn-getbyid-list').addEventListener('click', () => {
  const out = 'output-2';
  document.getElementById(out).textContent = '';
  clearHighlights();

  const list = document.getElementById('restaurant-list');
  log('--- getElementById("restaurant-list") ---', out);
  log(`Element found: ${list !== null}`, out);
  log(`Tag: <${list.tagName.toLowerCase()}>`, out);
  log(`Children count: ${list.children.length}`, out);
  log(`Class: "${list.className}"`, out);

  list.style.borderColor = '#6366f1';
  setTimeout(() => { list.style.borderColor = ''; }, 2000);
});

// ============================================================
// EXAMPLE 3 — getElementsByClassName() — Live HTMLCollection
// Story: Zomato counts displayed restaurant cards. They use
// getElementsByClassName('restaurant-card'). The result is LIVE — if
// lazy-loaded cards arrive, the collection grows automatically. But
// this also means removing elements while looping causes bugs.
// ============================================================

// WHY: Live collections auto-update when DOM changes. Powerful but
// dangerous if you modify the DOM while iterating.

document.getElementById('btn-getbyclass').addEventListener('click', () => {
  const out = 'output-3';
  document.getElementById(out).textContent = '';
  clearHighlights();

  const cards = document.getElementsByClassName('restaurant-card');
  log('--- getElementsByClassName("restaurant-card") ---', out);
  log(`Type: ${cards.constructor.name}`, out);
  log(`Count: ${cards.length}`, out);
  log(`Is LIVE: YES (auto-updates when DOM changes)`, out);
  log('', out);

  for (let i = 0; i < cards.length; i++) {
    const name = cards[i].querySelector('.restaurant-name').textContent;
    log(`  [${i}] ${name}`, out);
    cards[i].classList.add('highlighted');
  }

  log('', out);
  log('WARNING: Removing while looping causes skips!', out);
  log('Solution: loop backwards or convert to array', out);
});

let liveProofCount = 0;
document.getElementById('btn-live-proof').addEventListener('click', () => {
  const out = 'output-3';
  document.getElementById(out).textContent = '';

  const cards = document.getElementsByClassName('restaurant-card');
  const before = cards.length;

  // Add a new card to prove it is LIVE
  liveProofCount++;
  const newCard = document.createElement('div');
  newCard.className = 'restaurant-card';
  newCard.dataset.cuisine = 'italian';
  newCard.dataset.rating = '4.0';
  newCard.innerHTML = `
    <h3 class="restaurant-name">Live Card ${liveProofCount}</h3>
    <span class="rating">4.0</span>
    <p class="cuisine-tag">Italian</p>
    <button class="add-to-cart">Add to Cart</button>
  `;
  document.getElementById('restaurant-list').appendChild(newCard);

  const after = cards.length;

  log('--- LIVE Collection Proof ---', out);
  log(`Before adding card: ${before}`, out);
  log(`After adding card:  ${after}`, out);
  log(`Collection auto-updated: ${after > before}`, out);
  log('', out);
  log('The HTMLCollection grew without re-querying!', out);
});

// ============================================================
// EXAMPLE 4 — getElementsByTagName() — Live HTMLCollection by Tag
// Story: Zomato's SEO team checks all <h3> headings and <img> alt
// attributes. getElementsByTagName is fast and targeted.
// ============================================================

// WHY: Direct and fast for getting all elements of a specific tag.

document.getElementById('btn-getbytag-h3').addEventListener('click', () => {
  const out = 'output-4';
  document.getElementById(out).textContent = '';

  const headings = document.getElementsByTagName('h3');
  log('--- getElementsByTagName("h3") ---', out);
  log(`Count: ${headings.length}`, out);
  log('', out);

  for (const h of headings) {
    log(`  <h3> "${h.textContent}"`, out);
  }
});

document.getElementById('btn-getbytag-all').addEventListener('click', () => {
  const out = 'output-4';
  document.getElementById(out).textContent = '';

  const everything = document.getElementsByTagName('*');
  log('--- getElementsByTagName("*") ---', out);
  log(`Total elements on page: ${everything.length}`, out);

  // Count by tag
  const counts = {};
  for (const el of everything) {
    const tag = el.tagName.toLowerCase();
    counts[tag] = (counts[tag] || 0) + 1;
  }
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  log('', out);
  log('Top tags:', out);
  sorted.slice(0, 10).forEach(([tag, count]) => {
    log(`  <${tag}>: ${count}`, out);
  });
});

// ============================================================
// EXAMPLE 5 — querySelector() — CSS Selector, First Match
// Story: Zomato wants the highest-rated restaurant card. The developer
// uses: document.querySelector('.restaurant-card[data-rating="4.7"]')
// Any CSS selector works — classes, attributes, pseudo-classes,
// combinators, anything.
// ============================================================

// WHY: Most versatile selection method. Returns first match or null.

const qsDemos = [
  { btn: 'btn-qs-id', selector: '#app', desc: 'By ID' },
  { btn: 'btn-qs-class', selector: '.restaurant-card', desc: 'By class (first match)' },
  { btn: 'btn-qs-attr', selector: '[data-rating="4.7"]', desc: 'By attribute' },
  { btn: 'btn-qs-compound', selector: '.restaurant-card.veg-only', desc: 'Compound selector' },
  { btn: 'btn-qs-descendant', selector: '#restaurant-list .rating', desc: 'Descendant' },
  { btn: 'btn-qs-nth', selector: '.restaurant-card:nth-child(2)', desc: 'Nth child' },
];

qsDemos.forEach(({ btn, selector, desc }) => {
  document.getElementById(btn).addEventListener('click', () => {
    const out = 'output-5';
    document.getElementById(out).textContent = '';
    clearHighlights();

    const el = document.querySelector(selector);
    log(`--- querySelector('${selector}') ---`, out);
    log(`Description: ${desc}`, out);
    log(`Found: ${el !== null}`, out);
    if (el) {
      log(`Tag: <${el.tagName.toLowerCase()}>`, out);
      log(`Text: "${el.textContent.trim().slice(0, 50)}"`, out);
      if (el.classList.contains('restaurant-card')) {
        el.classList.add('selected');
      }
    }
    log('', out);
    log('Uses CSS selector syntax — any valid CSS selector works', out);
    log('Returns FIRST match or null. Can be scoped.', out);
  });
});

// ============================================================
// EXAMPLE 6 — querySelectorAll() — CSS Selector, All Matches
// Story: When a user filters "North Indian", Zomato runs:
// querySelectorAll('.restaurant-card[data-cuisine="north-indian"]')
// Returns a STATIC NodeList — safe to iterate and modify.
// ============================================================

// WHY: Go-to method for selecting multiple elements. Static = safe.

document.getElementById('btn-qsa-cards').addEventListener('click', () => {
  const out = 'output-6';
  document.getElementById(out).textContent = '';
  clearHighlights();

  const allCards = document.querySelectorAll('.restaurant-card');
  log('--- querySelectorAll(".restaurant-card") ---', out);
  log(`Type: ${allCards.constructor.name}`, out);
  log(`Count: ${allCards.length}`, out);
  log(`Is STATIC: YES (snapshot, never updates)`, out);
  log('', out);
  allCards.forEach((card, i) => {
    const name = card.querySelector('.restaurant-name').textContent;
    log(`  [${i}] ${name}`, out);
    card.classList.add('highlighted');
  });
});

document.getElementById('btn-qsa-ni').addEventListener('click', () => {
  const out = 'output-6';
  document.getElementById(out).textContent = '';
  clearHighlights();

  const northIndian = document.querySelectorAll('[data-cuisine="north-indian"]');
  const allCards = document.querySelectorAll('.restaurant-card');

  log('--- querySelectorAll(\'[data-cuisine="north-indian"]\') ---', out);
  log(`Matches: ${northIndian.length}`, out);
  log('', out);

  allCards.forEach(card => card.classList.add('dimmed'));
  northIndian.forEach(card => {
    card.classList.remove('dimmed');
    card.classList.add('selected');
    log(`  ${card.querySelector('.restaurant-name').textContent}`, out);
  });
});

document.getElementById('btn-qsa-multi').addEventListener('click', () => {
  const out = 'output-6';
  document.getElementById(out).textContent = '';

  const mixed = document.querySelectorAll('.restaurant-name, .rating');
  log('--- querySelectorAll(".restaurant-name, .rating") ---', out);
  log(`Matches: ${mixed.length}`, out);
  log('', out);
  mixed.forEach((el, i) => {
    log(`  [${i}] <${el.tagName.toLowerCase()}> "${el.textContent.trim()}"`, out);
  });
  log('', out);
  log('Supports forEach() natively. Safe to modify DOM while looping.', out);
});

// ============================================================
// EXAMPLE 7 — Live vs Static Collections Deep Dive
// Story: A Zomato developer mixed live and static collections without
// knowing the difference. After infinite scroll added new cards, the
// live collection grew but the static one didn't. Some code worked;
// other code broke. Team rule: use querySelectorAll by default.
// ============================================================

// WHY: This is one of the most common sources of DOM bugs.

document.getElementById('btn-iter-demo').addEventListener('click', () => {
  const out = 'output-7';
  document.getElementById(out).textContent = '';

  log('--- HTMLCollection has no forEach ---', out);
  const cards = document.getElementsByClassName('restaurant-card');
  log(`typeof cards.forEach: ${typeof cards.forEach}`, out);
  log('', out);

  log('But HTMLCollection IS iterable (for...of works):', out);
  for (const card of cards) {
    log(`  ${card.querySelector('.restaurant-name').textContent}`, out);
  }
  log('', out);

  log('Convert with Array.from() for full Array methods:', out);
  const arr = Array.from(cards);
  log(`Array.isArray(arr): ${Array.isArray(arr)}`, out);
  log(`arr.map works: ${typeof arr.map === 'function'}`, out);
  log('', out);
  log('getElementsBy* -> LIVE (auto-update, HTMLCollection lacks forEach)', out);
  log('querySelectorAll -> STATIC (snapshot, NodeList has forEach)', out);
});

// ============================================================
// EXAMPLE 8 — Converting Collections to Arrays
// Story: Zomato wants to sort restaurant cards by rating using
// Array.sort(). But NodeList and HTMLCollection aren't true Arrays.
// Conversion is required for map, filter, sort, reduce.
// ============================================================

// WHY: Array methods are essential for data transformation.
// DOM collections must be converted to use them.

document.getElementById('btn-array-from').addEventListener('click', () => {
  const out = 'output-8';
  document.getElementById(out).textContent = '';

  const cards = document.querySelectorAll('.restaurant-card');

  // Array.from with mapping function
  const ratings = Array.from(cards, card => parseFloat(card.dataset.rating));
  log('--- Array.from() with map function ---', out);
  log(`Ratings: [${ratings.join(', ')}]`, out);
  log(`Is array: ${Array.isArray(ratings)}`, out);

  // Spread operator
  const names = [...cards].map(c => c.querySelector('.restaurant-name').textContent);
  log(`Names: [${names.join(', ')}]`, out);
  log('', out);
  log('Array.from(collection, mapFn) — convert + transform in one step', out);
  log('[...collection] — spread operator alternative', out);
});

document.getElementById('btn-sort-rating').addEventListener('click', () => {
  const out = 'output-8';
  document.getElementById(out).textContent = '';
  clearHighlights();

  const cards = document.querySelectorAll('.restaurant-card');
  const container = document.getElementById('restaurant-list');

  // Sort by rating (descending) — appendChild MOVES elements
  const sorted = Array.from(cards).sort((a, b) =>
    parseFloat(b.dataset.rating) - parseFloat(a.dataset.rating)
  );

  log('--- Sort by Rating (Descending) ---', out);
  sorted.forEach((card, i) => {
    container.appendChild(card); // appendChild MOVES, not copies
    const name = card.querySelector('.restaurant-name').textContent;
    const rating = card.dataset.rating;
    log(`  ${i + 1}. ${name} (${rating})`, out);
  });
  log('', out);
  log('appendChild() moves elements — cards are now reordered in DOM!', out);
});

// ============================================================
// EXAMPLE 9 — closest() — Find Nearest Ancestor
// Story: When a user clicks "Add to Cart" inside a restaurant card,
// the handler needs the parent card. closest('.restaurant-card') walks
// UP the DOM tree from the button. Essential for event delegation.
// ============================================================

// WHY: closest() searches upward; querySelector searches downward.

document.getElementById('restaurant-list').addEventListener('click', (e) => {
  if (e.target.matches('.add-to-cart')) {
    const out = 'output-9';
    document.getElementById(out).textContent = '';
    clearHighlights();

    const button = e.target;
    const card = button.closest('.restaurant-card');
    const name = card.querySelector('.restaurant-name').textContent;

    card.classList.add('selected');

    log('--- closest() in action ---', out);
    log(`Button clicked inside: "${name}"`, out);
    log(`button.closest('.restaurant-card') found the parent card`, out);
    log(`card.dataset.cuisine: "${card.dataset.cuisine}"`, out);
    log(`card.dataset.rating: "${card.dataset.rating}"`, out);
    log('', out);
    log('closest() searches UP the DOM tree (ancestors)', out);
    log('Checks the element itself first. Returns null if no match.', out);
  }
});

// ============================================================
// EXAMPLE 10 — matches() — Test if Element Matches Selector
// Story: Zomato's event delegation handler checks: "Did the user click
// a .restaurant-card, the .add-to-cart button, or something else?"
// matches() is a yes/no check without searching the DOM.
// ============================================================

// WHY: Boolean check on a single element. Perfect for event delegation.

document.getElementById('btn-matches').addEventListener('click', () => {
  const out = 'output-10';
  document.getElementById(out).textContent = '';

  const cards = document.querySelectorAll('.restaurant-card');
  log('--- matches() tests ---', out);

  cards.forEach(card => {
    const name = card.querySelector('.restaurant-name').textContent;
    log(`"${name}":`, out);
    log(`  matches('.restaurant-card'): ${card.matches('.restaurant-card')}`, out);
    log(`  matches('[data-cuisine]'): ${card.matches('[data-cuisine]')}`, out);
    log(`  matches('.veg-only'): ${card.matches('.veg-only')}`, out);
    log(`  matches('span'): ${card.matches('span')}`, out);
    log('', out);
  });

  log('matches() tests if element matches a CSS selector (boolean)', out);
  log('Does NOT search DOM — just checks the element', out);
});

// ============================================================
// EXAMPLE 11 — Performance: getElementById vs querySelector
// Story: A code review caught querySelector('#search-box') instead of
// getElementById('search-box'). Both work, but getElementById is 2-5x
// faster (hash map). For one-off lookups it's negligible, but in hot
// loops it adds up. Team rule: getElementById for IDs, querySelector
// for complex selectors.
// ============================================================

// WHY: Picking the faster method when both are equally readable.

document.getElementById('btn-perf').addEventListener('click', () => {
  const out = 'output-11';
  document.getElementById(out).textContent = '';

  // Benchmark getElementById vs querySelector
  const iterations = 10000;

  const s1 = performance.now();
  for (let i = 0; i < iterations; i++) {
    document.getElementById('search-box');
  }
  const t1 = (performance.now() - s1).toFixed(3);

  const s2 = performance.now();
  for (let i = 0; i < iterations; i++) {
    document.querySelector('#search-box');
  }
  const t2 = (performance.now() - s2).toFixed(3);

  const s3 = performance.now();
  for (let i = 0; i < iterations; i++) {
    document.getElementsByClassName('restaurant-card');
  }
  const t3 = (performance.now() - s3).toFixed(3);

  const s4 = performance.now();
  for (let i = 0; i < iterations; i++) {
    document.querySelectorAll('.restaurant-card');
  }
  const t4 = (performance.now() - s4).toFixed(3);

  log(`--- Performance: ${iterations.toLocaleString()} lookups ---`, out);
  log('', out);
  log(`getElementById('search-box'):           ${t1}ms`, out);
  log(`querySelector('#search-box'):            ${t2}ms`, out);
  log(`getElementsByClassName('restaurant-card'): ${t3}ms`, out);
  log(`querySelectorAll('.restaurant-card'):     ${t4}ms`, out);
  log('', out);
  log('--- When to use what ---', out);
  log('Find by ID:           getElementById', out);
  log('Find by class (live): getElementsByClassName', out);
  log('Complex selector:     querySelector / querySelectorAll', out);
  log('Need array methods:   querySelectorAll + Array.from', out);
});

// ============================================================
// EXAMPLE 12 — document.forms, document.images, document.links
// Story: Zomato's QA automation verifies: one form on login page,
// 20+ images on homepage, correct footer links. Built-in shortcuts
// make this instant without selectors.
// ============================================================

// WHY: Legacy shortcuts that are still useful and performant.

document.getElementById('btn-shortcuts').addEventListener('click', () => {
  const out = 'output-12';
  document.getElementById(out).textContent = '';

  log('--- Document Shortcuts ---', out);
  log(`document.forms.length: ${document.forms.length}`, out);
  log(`document.images.length: ${document.images.length}`, out);
  log(`document.links.length: ${document.links.length}`, out);
  log(`document.scripts.length: ${document.scripts.length}`, out);
  log('', out);

  if (document.forms.length > 0) {
    log(`document.forms[0].name: "${document.forms[0].name}"`, out);
  }

  log('', out);
  log('All return live HTMLCollections. Named access supported.', out);
  log('document.forms["login"] -> form with name="login"', out);
});

// ============================================================
// EXAMPLE 13 — Chaining Selectors & Complete Practical
// Story: Zomato chains calls: find container, then search within it.
// Cleaner, more maintainable, and narrows the search scope.
// ============================================================

// WHY: Scoping queries to containers improves readability and perf.

document.getElementById('btn-chain').addEventListener('click', () => {
  const out = 'output-13';
  document.getElementById(out).textContent = '';
  clearHighlights();

  // Chained/scoped query
  const list = document.querySelector('#restaurant-list');
  const firstNI = list.querySelector('[data-cuisine="north-indian"]');
  const rating = firstNI.querySelector('.rating');

  firstNI.classList.add('selected');

  log('--- Chained Selection ---', out);
  log('const list = document.querySelector("#restaurant-list");', out);
  log('const firstNI = list.querySelector(\'[data-cuisine="north-indian"]\');', out);
  log('const rating = firstNI.querySelector(".rating");', out);
  log('', out);
  log(`Restaurant: ${firstNI.querySelector('.restaurant-name').textContent}`, out);
  log(`Rating: ${rating.textContent}`, out);
  log('', out);
  log('Scoping narrows search = better readability and performance', out);
});

document.getElementById('btn-filter-ni').addEventListener('click', () => {
  const out = 'output-13';
  document.getElementById(out).textContent = '';
  clearHighlights();

  const allCards = document.querySelectorAll('.restaurant-card');
  const northIndian = document.querySelectorAll('[data-cuisine="north-indian"]');

  allCards.forEach(card => card.classList.add('dimmed'));
  northIndian.forEach(card => {
    card.classList.remove('dimmed');
    card.classList.add('selected');
  });

  log('--- Filter: North Indian ---', out);
  northIndian.forEach(card => {
    const name = card.querySelector('.restaurant-name').textContent;
    const rating = card.dataset.rating;
    log(`  ${name} (${rating})`, out);
  });
});

document.getElementById('btn-filter-sort').addEventListener('click', () => {
  const out = 'output-13';
  document.getElementById(out).textContent = '';
  clearHighlights();

  const cards = document.querySelectorAll('.restaurant-card');
  const sorted = [...cards].sort((a, b) => parseFloat(b.dataset.rating) - parseFloat(a.dataset.rating));
  const container = document.getElementById('restaurant-list');

  log('--- Sort by Rating (Descending) ---', out);
  sorted.forEach(card => {
    container.appendChild(card);
    const name = card.querySelector('.restaurant-name').textContent;
    log(`  ${name} (${card.dataset.rating})`, out);
  });
});

document.getElementById('btn-filter-reset').addEventListener('click', () => {
  document.getElementById('output-13').textContent = '';
  clearHighlights();
  log('Highlights cleared.', 'output-13');
});

// ============================================================
// EXAMPLE 14 — Common Selection Mistakes
// Story: Zomato's code review checklist includes these common mistakes
// found in pull requests from new developers. Knowing these upfront
// saves hours of debugging and prevents production bugs.
// ============================================================

// WHY: Every mistake here has been made in real codebases.

document.getElementById('btn-mistakes-demo').addEventListener('click', () => {
  const out = 'output-14';
  document.getElementById(out).textContent = '';

  // Mistake 1: Forgetting that getElementById returns null for missing IDs
  log('--- Safe Patterns ---', out);
  log('', out);
  log('1. Always null-check getElementById:', out);
  const el = document.getElementById('nonexistent');
  log(`   getElementById('nonexistent'): ${el}`, out);
  if (el) {
    el.textContent = 'hi';
  } else {
    log('   Safely handled null!', out);
  }
  log('', out);

  // Mistake 2: Using '#' in getElementById
  log('2. No "#" in getElementById:', out);
  const wrong = document.getElementById('#search-box');
  const right = document.getElementById('search-box');
  log(`   getElementById('#search-box'): ${wrong}  <-- null!`, out);
  log(`   getElementById('search-box'):  ${right !== null}  <-- found!`, out);
  log('', out);

  // Mistake 3: getElementById only on document
  log('3. getElementById only on document:', out);
  log('   someDiv.getElementById() -> TypeError', out);
  log('   document.getElementById() -> correct', out);
  log('', out);

  // Mistake 4: querySelectorAll is NOT an array
  log('4. querySelectorAll returns NodeList, not Array:', out);
  const cards = document.querySelectorAll('.restaurant-card');
  log(`   typeof cards.map: ${typeof cards.map} (undefined!)`, out);
  log(`   typeof Array.from(cards).map: ${typeof Array.from(cards).map} (function!)`, out);
  log('', out);

  // Mistake 5: Live collection gotcha
  log('5. Live collections: use for...of or Array.from():', out);
  const live = document.getElementsByClassName('restaurant-card');
  log(`   HTMLCollection forEach: ${typeof live.forEach}`, out);
  log(`   for...of: works (iterable)`, out);
  log(`   Array.from(): works (converts to Array)`, out);
});

// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. getElementById() is fastest — O(1). No '#' in argument.
// 2. getElementsByClassName/TagName return LIVE HTMLCollections.
// 3. querySelector = first CSS match. querySelectorAll = all matches (STATIC).
// 4. Live vs Static: getElementsBy* = live; querySelectorAll = static.
// 5. Convert to Array with Array.from() or [...spread] for map/filter/sort.
// 6. closest() searches UP (ancestors); querySelector searches DOWN.
// 7. matches() tests if element matches selector (boolean check).
// 8. document.forms, .images, .links are fast built-in shortcuts.
// 9. Chain selectors for readability: container.querySelector('.child').
// 10. Always null-check selection results before accessing properties.
// ============================================================

console.log('=== FILE 02 COMPLETE: Selecting Elements ===');
