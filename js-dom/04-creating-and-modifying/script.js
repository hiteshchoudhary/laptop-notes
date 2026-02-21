// ============================================================
// FILE 04: CREATING AND MODIFYING DOM ELEMENTS
// Topic: Dynamically building, inserting, replacing, and removing elements
// WHY: Modern web apps rarely show static HTML. Swiggy loads restaurant
// cards dynamically from JSON, adds cart items without page reload, and
// builds order summaries on the fly. Mastering DOM creation/modification
// is what separates static HTML from dynamic applications.
// ============================================================

// --- Helper: log to both console and on-page output panel ---
function log(msg, targetId) {
  console.log(msg);
  const el = document.getElementById(targetId);
  if (el) el.textContent += msg + '\n';
}

// --- Helper: Escape HTML to prevent XSS ---
function escapeHTML(str) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return String(str).replace(/[&<>"']/g, c => map[c]);
}

// --- DOM Operations Counter ---
let opsCount = 0;
function countOp() {
  opsCount++;
  const counter = document.getElementById('ops-count');
  if (counter) counter.textContent = opsCount;
}

// ============================================================
// EXAMPLE 1 — Swiggy's Dynamic Restaurant Cards
// Story: When you search "Biryani" on Swiggy, the server returns JSON —
// not HTML. JavaScript creates <div> elements for each restaurant, fills
// them with name, rating, delivery time, and inserts them into the page.
// The entire restaurant grid is built dynamically from data. This is
// the power of DOM creation.
// ============================================================

const restaurantData = [
  { name: 'Paradise Biryani', rating: 4.3, time: 30, cuisine: 'Biryani' },
  { name: 'Behrouz Biryani', rating: 4.1, time: 45, cuisine: 'Biryani' },
  { name: 'Meghana Foods', rating: 4.5, time: 25, cuisine: 'South Indian' },
  { name: 'Burger King', rating: 3.9, time: 20, cuisine: 'Fast Food' },
  { name: 'Pizza Hut', rating: 4.0, time: 35, cuisine: 'Pizza' },
  { name: 'Dominos', rating: 3.8, time: 22, cuisine: 'Pizza' },
];

document.getElementById('btn-build-cards').addEventListener('click', () => {
  const out = 'output-1';
  document.getElementById(out).textContent = '';
  const container = document.getElementById('card-container');
  container.innerHTML = '';

  log('--- Building cards from JSON data ---', out);

  // Using DocumentFragment for batch insertion
  const fragment = document.createDocumentFragment();
  countOp();

  restaurantData.forEach((data, i) => {
    const card = document.createElement('div');
    card.className = 'restaurant-card';
    countOp();

    const name = document.createElement('h3');
    name.textContent = data.name;
    countOp();

    const rating = document.createElement('span');
    rating.className = 'rating-badge';
    rating.textContent = `${data.rating} ★`;
    countOp();

    const info = document.createElement('p');
    info.textContent = `${data.cuisine} • ${data.time} min`;
    info.style.color = '#94a3b8';
    info.style.fontSize = '0.85rem';
    countOp();

    card.append(name, rating, info);
    fragment.appendChild(card);
    countOp();

    log(`  Created: ${data.name} (${data.rating} ★, ${data.time} min)`, out);
  });

  container.appendChild(fragment); // ONE reflow
  countOp();

  log('', out);
  log(`Total DOM operations: ${opsCount}`, out);
  log('All cards built from JSON, inserted via DocumentFragment.', out);
});

document.getElementById('btn-clear-cards').addEventListener('click', () => {
  document.getElementById('card-container').replaceChildren();
  countOp();
  log('Cards cleared with replaceChildren()', 'output-1');
});

// ============================================================
// EXAMPLE 2 — createElement() and createTextNode()
// Story: Swiggy creates a restaurant card: Step 1 create the <div>,
// Step 2 create text for the name, Step 3 combine them. These two
// methods are the building blocks of ALL dynamic DOM content.
// ============================================================

// WHY: createElement creates elements. createTextNode creates text.

document.getElementById('btn-create').addEventListener('click', () => {
  const out = 'output-2';
  document.getElementById(out).textContent = '';
  const target = document.getElementById('create-target');
  target.innerHTML = '';

  log('--- createElement & createTextNode ---', out);

  // Step 1: createElement
  const card = document.createElement('div');
  card.className = 'restaurant-card';
  card.id = 'restaurant-42';
  card.dataset.cuisine = 'biryani';
  countOp();
  log('Step 1: const card = document.createElement("div")', out);
  log('  card is created but NOT in DOM yet', out);

  // Step 2: createTextNode
  const text = document.createTextNode('Paradise Biryani');
  countOp();
  log('Step 2: const text = document.createTextNode("Paradise Biryani")', out);

  // Step 3: appendChild
  const heading = document.createElement('h3');
  heading.appendChild(text);
  card.appendChild(heading);
  countOp();
  log('Step 3: heading.appendChild(text), card.appendChild(heading)', out);

  // Shortcut: textContent
  const desc = document.createElement('p');
  desc.textContent = 'Delivers in 30 min'; // simpler than createTextNode
  desc.style.color = '#94a3b8';
  card.appendChild(desc);
  countOp();
  log('Shortcut: desc.textContent = "..." (simpler than createTextNode)', out);

  // Insert into DOM
  target.appendChild(card);
  countOp();
  log('', out);
  log('NOW the card is visible — inserted into DOM!', out);
  log('createElement("div")  -> creates empty <div>', out);
  log('createTextNode("...")  -> creates text node', out);
  log('element.textContent = "..." -> shortcut for text', out);
  log('Created elements are NOT in the DOM until inserted', out);
});

// ============================================================
// EXAMPLE 3 — appendChild() vs append()
// Story: Swiggy built the card div, heading, and rating span as
// detached elements. appendChild() adds one child at a time.
// append() adds MULTIPLE children AND strings in one call.
// ============================================================

// WHY: appendChild is classic. append is modern and more flexible.

document.getElementById('btn-appendchild').addEventListener('click', () => {
  const out = 'output-3';
  document.getElementById(out).textContent = '';
  const target = document.getElementById('append-target');
  target.innerHTML = '';

  const p1 = document.createElement('p');
  p1.textContent = 'Added with appendChild()';
  p1.style.color = '#60a5fa';
  const returned = target.appendChild(p1); // Returns the appended node
  countOp();

  log('--- appendChild() ---', out);
  log('target.appendChild(p1) — returns the appended node', out);
  log(`Returned: <${returned.tagName.toLowerCase()}>`, out);
  log('', out);
  log('appendChild(node):  one node, no strings, returns child, classic', out);
});

document.getElementById('btn-append').addEventListener('click', () => {
  const out = 'output-3';
  document.getElementById(out).textContent = '';
  const target = document.getElementById('append-target');
  target.innerHTML = '';

  const strong = document.createElement('strong');
  strong.textContent = 'Bold text';
  strong.style.color = '#22c55e';

  const em = document.createElement('em');
  em.textContent = 'Italic text';
  em.style.color = '#f59e0b';

  // append() — multiple nodes + strings
  const returned = target.append(
    strong,
    ' — plain string — ',
    em,
    ' — another string'
  );
  countOp();

  log('--- append() ---', out);
  log('target.append(strong, " — string — ", em, " — string")', out);
  log(`Returned: ${returned} (undefined — append returns nothing)`, out);
  log('', out);
  log('append(n1, n2, s):  multiple nodes+strings, returns undefined, modern', out);
});

// ============================================================
// EXAMPLE 4 — prepend(), before(), after(), replaceWith()
// Story: Swiggy adds a "Promoted" badge at the START (prepend), a
// divider AFTER the card (after), a label BEFORE the rating (before),
// and replaces the old delivery estimate (replaceWith).
// ============================================================

// WHY: These methods cover every insertion position cleanly.

let positionCounter = 0;

function resetPositionDemo() {
  const demo = document.getElementById('position-demo');
  demo.innerHTML = '<div class="position-item" id="original-item">Original Item</div>';
  positionCounter = 0;
}

document.getElementById('btn-prepend').addEventListener('click', () => {
  const out = 'output-4';
  document.getElementById(out).textContent = '';
  const original = document.getElementById('original-item');
  if (!original) { resetPositionDemo(); return; }

  positionCounter++;
  const el = document.createElement('div');
  el.className = 'position-item prepended';
  el.textContent = `Prepended #${positionCounter}`;
  original.parentElement.prepend(el);
  countOp();

  log('--- prepend() ---', out);
  log('parent.prepend(el) — inserted as FIRST child', out);
  log('Position: Inside, at start', out);
});

document.getElementById('btn-before').addEventListener('click', () => {
  const out = 'output-4';
  document.getElementById(out).textContent = '';
  const original = document.getElementById('original-item');
  if (!original) { resetPositionDemo(); return; }

  positionCounter++;
  const el = document.createElement('div');
  el.className = 'position-item before-item';
  el.textContent = `Before #${positionCounter}`;
  original.before(el);
  countOp();

  log('--- before() ---', out);
  log('element.before(el) — inserted as PREVIOUS sibling', out);
  log('Position: Outside, before (sibling)', out);
});

document.getElementById('btn-after').addEventListener('click', () => {
  const out = 'output-4';
  document.getElementById(out).textContent = '';
  const original = document.getElementById('original-item');
  if (!original) { resetPositionDemo(); return; }

  positionCounter++;
  const el = document.createElement('div');
  el.className = 'position-item after-item';
  el.textContent = `After #${positionCounter}`;
  original.after(el);
  countOp();

  log('--- after() ---', out);
  log('element.after(el) — inserted as NEXT sibling', out);
  log('Position: Outside, after (sibling)', out);
});

document.getElementById('btn-replace').addEventListener('click', () => {
  const out = 'output-4';
  document.getElementById(out).textContent = '';
  const original = document.getElementById('original-item');
  if (!original) {
    log('Original item already replaced! Click Reset.', out);
    return;
  }

  const el = document.createElement('div');
  el.className = 'position-item replaced';
  el.textContent = 'Replaced! (original is gone)';
  el.id = 'replaced-item';
  original.replaceWith(el);
  countOp();

  log('--- replaceWith() ---', out);
  log('element.replaceWith(newEl) — replaces in place', out);
  log('The original element is removed from DOM', out);
});

document.getElementById('btn-reset-position').addEventListener('click', () => {
  resetPositionDemo();
  document.getElementById('output-4').textContent = 'Reset complete.';
});

// ============================================================
// EXAMPLE 5 — insertBefore() and insertAdjacentHTML()
// Story: Swiggy's cart needs to insert an item between two existing
// items. insertBefore() is classic. insertAdjacentHTML() is modern
// and accepts raw HTML strings at four precise positions.
// ============================================================

// WHY: insertAdjacentHTML is incredibly useful for injecting HTML
// strings at precise positions without innerHTML's drawbacks.

let adjCounter = 0;

function resetAdjacentDemo() {
  document.getElementById('adjacent-demo').innerHTML =
    '<div id="adj-target" class="adj-target">Target Element</div>';
  adjCounter = 0;
}

const adjPositions = {
  'btn-adj-bb': 'beforebegin',
  'btn-adj-ab': 'afterbegin',
  'btn-adj-be': 'beforeend',
  'btn-adj-ae': 'afterend',
};

Object.entries(adjPositions).forEach(([btnId, position]) => {
  document.getElementById(btnId).addEventListener('click', () => {
    const out = 'output-5';
    document.getElementById(out).textContent = '';
    const target = document.getElementById('adj-target');
    if (!target) { resetAdjacentDemo(); return; }

    adjCounter++;
    target.insertAdjacentHTML(position, `<div class="adj-injected">${position} #${adjCounter}</div>`);
    countOp();

    // Visual:
    // <!-- beforebegin -->
    // <div class="adj-target">
    //   <!-- afterbegin -->
    //   ...existing content...
    //   <!-- beforeend -->
    // </div>
    // <!-- afterend -->

    log(`--- insertAdjacentHTML('${position}', html) ---`, out);
    log(`Injected at position: ${position}`, out);
    log('', out);
    log('Positions:', out);
    log('  beforebegin: sibling BEFORE element', out);
    log('  afterbegin:  FIRST child of element', out);
    log('  beforeend:   LAST child of element', out);
    log('  afterend:    sibling AFTER element', out);
  });
});

document.getElementById('btn-adj-reset').addEventListener('click', () => {
  resetAdjacentDemo();
  document.getElementById('output-5').textContent = 'Reset complete.';
});

// ============================================================
// EXAMPLE 6 — remove() and removeChild()
// Story: User removes a cart item on Swiggy. remove() is modern —
// call it on the element itself. removeChild() is classic — call
// on the parent and pass the child.
// ============================================================

// WHY: Removing elements is as important as adding them.

const originalItems = ['Item A', 'Item B', 'Item C', 'Item D'];

function resetRemoveList() {
  const list = document.getElementById('remove-list');
  list.innerHTML = '';
  originalItems.forEach(text => {
    const div = document.createElement('div');
    div.className = 'removable-item';
    div.textContent = text;
    list.appendChild(div);
  });
}

document.getElementById('btn-remove-first').addEventListener('click', () => {
  const out = 'output-6';
  document.getElementById(out).textContent = '';
  const list = document.getElementById('remove-list');
  const first = list.firstElementChild;

  if (!first) {
    log('No items left! Click Reset.', out);
    return;
  }

  const name = first.textContent;
  first.remove(); // Modern: call on element itself
  countOp();

  log('--- remove() (modern) ---', out);
  log(`Removed: "${name}"`, out);
  log('element.remove() — simple, clean', out);
  log(`Remaining: ${list.children.length} items`, out);
});

document.getElementById('btn-remove-last').addEventListener('click', () => {
  const out = 'output-6';
  document.getElementById(out).textContent = '';
  const list = document.getElementById('remove-list');
  const last = list.lastElementChild;

  if (!last) {
    log('No items left! Click Reset.', out);
    return;
  }

  const name = last.textContent;
  const removed = list.removeChild(last); // Classic: returns removed node
  countOp();

  log('--- removeChild() (classic) ---', out);
  log(`Removed: "${name}"`, out);
  log(`Returns removed node: <${removed.tagName.toLowerCase()}>`, out);
  log(`Remaining: ${list.children.length} items`, out);
});

document.getElementById('btn-clear-all').addEventListener('click', () => {
  const out = 'output-6';
  document.getElementById(out).textContent = '';

  const list = document.getElementById('remove-list');
  list.replaceChildren(); // Modern, clean, no arguments = clear all
  countOp();

  log('--- replaceChildren() ---', out);
  log('list.replaceChildren() — clears all children', out);
  log('Modern, clean. Alternatives:', out);
  log('  innerHTML = ""          — fastest but destroys event listeners', out);
  log('  while (el.firstChild) el.firstChild.remove() — preserves refs', out);
  log('  replaceChildren()      — modern, recommended', out);
});

document.getElementById('btn-reset-remove').addEventListener('click', () => {
  resetRemoveList();
  document.getElementById('output-6').textContent = 'Reset complete.';
});

// ============================================================
// EXAMPLE 7 — cloneNode(shallow) vs cloneNode(deep)
// Story: Swiggy's "Order Again" duplicates previous order items into
// the current cart. cloneNode(true) copies element + all descendants.
// cloneNode(false) copies just the element shell, empty inside.
// ============================================================

// WHY: Cloning is faster than creating from scratch. But understand
// shallow vs deep, and know that event listeners are NOT cloned.

document.getElementById('btn-shallow-clone').addEventListener('click', () => {
  const out = 'output-7';
  document.getElementById(out).textContent = '';
  document.getElementById('clone-output').innerHTML = '';

  const original = document.getElementById('original-card');
  const shallow = original.cloneNode(false); // Just the outer element
  shallow.id = 'shallow-clone';
  shallow.textContent = '(Shallow clone — no children!)';
  document.getElementById('clone-output').appendChild(shallow);
  countOp();

  log('--- cloneNode(false) — Shallow ---', out);
  log('Just the outer element with attributes, NO children', out);
  log(`original.children.length: ${original.children.length}`, out);
  log(`shallow.children.length: ${shallow.children.length}`, out);
});

document.getElementById('btn-deep-clone').addEventListener('click', () => {
  const out = 'output-7';
  document.getElementById(out).textContent = '';
  document.getElementById('clone-output').innerHTML = '';

  const original = document.getElementById('original-card');
  const deep = original.cloneNode(true); // Element + all descendants
  deep.id = 'deep-clone'; // Change ID to avoid duplicates!
  document.getElementById('clone-output').appendChild(deep);
  countOp();

  log('--- cloneNode(true) — Deep ---', out);
  log('Element + all descendants included', out);
  log(`original.children.length: ${original.children.length}`, out);
  log(`deep.children.length: ${deep.children.length}`, out);
  log('', out);
  log('WARNINGS:', out);
  log('1. addEventListener listeners are NOT cloned', out);
  log('2. IDs are cloned — creates duplicates! Change or remove them.', out);
  log('   deep.id = "" or deep.removeAttribute("id")', out);
});

// ============================================================
// EXAMPLE 8 — DocumentFragment: Batch Insertions
// Story: Swiggy loads 50 cards on scroll. Naive approach: 50 appends
// = 50 reflows. Smart approach: build all 50 in a DocumentFragment,
// then append once = 1 reflow. Instant vs janky.
// ============================================================

// WHY: DocumentFragment is an invisible container. Appending it
// inserts only its children (fragment disappears). One reflow.

document.getElementById('btn-no-fragment').addEventListener('click', () => {
  const out = 'output-8';
  document.getElementById(out).textContent = '';
  const target = document.getElementById('fragment-target');
  target.innerHTML = '';

  log('--- Without Fragment (BAD) ---', out);
  const start = performance.now();

  // BAD: each appendChild triggers potential reflow
  for (let i = 0; i < 50; i++) {
    const item = document.createElement('span');
    item.className = 'frag-item';
    item.textContent = `R${i + 1}`;
    target.appendChild(item); // reflow each time!
    countOp();
  }

  const time = (performance.now() - start).toFixed(3);
  document.getElementById('perf-no-frag').textContent = `No fragment: ${time}ms`;
  log(`50 individual appends: ${time}ms`, out);
  log('Each appendChild triggers a potential reflow!', out);
});

document.getElementById('btn-with-fragment').addEventListener('click', () => {
  const out = 'output-8';
  document.getElementById(out).textContent = '';
  const target = document.getElementById('fragment-target');
  target.innerHTML = '';

  log('--- With Fragment (GOOD) ---', out);
  const start = performance.now();

  // GOOD: build all in fragment, insert once = 1 reflow
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < 50; i++) {
    const item = document.createElement('span');
    item.className = 'frag-item';
    item.textContent = `R${i + 1}`;
    fragment.appendChild(item); // no reflow
  }
  target.appendChild(fragment); // ONE reflow for all 50
  countOp();

  const time = (performance.now() - start).toFixed(3);
  document.getElementById('perf-frag').textContent = `Fragment: ${time}ms`;
  log(`DocumentFragment batch: ${time}ms`, out);
  log('ONE reflow for all 50 items!', out);
  log('', out);
  log('--- Fragment Properties ---', out);
  log('fragment.nodeType === 11 (DOCUMENT_FRAGMENT_NODE)', out);
  log('After appending to DOM, fragment becomes empty (children moved)', out);
  log('fragment.querySelector() works before insertion', out);
});

// ============================================================
// EXAMPLE 9 — innerHTML vs textContent vs innerText
// Story: Swiggy's developer sets content in a card. innerHTML parses
// HTML (powerful but XSS risk). textContent sets raw text (safe).
// innerText respects CSS visibility. Choosing wrong introduces
// security vulnerabilities.
// ============================================================

// WHY: innerHTML is the #1 source of XSS in web apps.

const originalContentHTML = '<span>Visible Text</span><span style="display:none;">Hidden Text</span>';

document.getElementById('btn-innerhtml').addEventListener('click', () => {
  const out = 'output-9';
  document.getElementById(out).textContent = '';
  const target = document.getElementById('content-target');

  log('--- innerHTML ---', out);
  log(`target.innerHTML: "${target.innerHTML.trim()}"`, out);
  log('', out);
  log('innerHTML parses HTML — creates DOM elements', out);
  log('XSS DANGER: Never innerHTML with user-provided data!', out);
});

document.getElementById('btn-textcontent').addEventListener('click', () => {
  const out = 'output-9';
  document.getElementById(out).textContent = '';
  const target = document.getElementById('content-target');

  log('--- textContent ---', out);
  log(`target.textContent: "${target.textContent}"`, out);
  log('', out);
  log('textContent: raw text, SAFE, includes hidden elements, no reflow', out);
});

document.getElementById('btn-innertext').addEventListener('click', () => {
  const out = 'output-9';
  document.getElementById(out).textContent = '';
  const target = document.getElementById('content-target');

  log('--- innerText ---', out);
  log(`target.innerText: "${target.innerText}"`, out);
  log('', out);
  log('innerText: raw text, SAFE, excludes display:none, causes reflow', out);
});

document.getElementById('btn-xss-demo').addEventListener('click', () => {
  const out = 'output-9';
  document.getElementById(out).textContent = '';

  const malicious = '<img src=x onerror="alert(\'hack\')">';
  log('--- XSS Prevention Demo ---', out);
  log(`Malicious input: ${malicious}`, out);
  log('', out);
  log(`Escaped: ${escapeHTML(malicious)}`, out);
  log('', out);

  // --- Comparison ---
  // Property     | Parses HTML | XSS Risk | Includes Hidden | Reflow
  // -------------|-------------|----------|-----------------|-------
  // innerHTML    | YES         | YES      | N/A             | YES
  // textContent  | NO          | NO       | YES             | NO
  // innerText    | NO          | NO       | NO              | YES

  log('--- Comparison ---', out);
  log('Property     | Parses HTML | XSS Risk | Hidden | Reflow', out);
  log('-------------|-------------|----------|--------|-------', out);
  log('innerHTML    | YES         | YES      | N/A    | YES', out);
  log('textContent  | NO          | NO       | YES    | NO', out);
  log('innerText    | NO          | NO       | NO     | YES', out);
  log('', out);
  log('RULE: NEVER innerHTML with user-provided data.', out);
  log('Use textContent for text. escapeHTML() if you must use innerHTML.', out);
});

document.getElementById('btn-content-reset').addEventListener('click', () => {
  document.getElementById('content-target').innerHTML = originalContentHTML;
  document.getElementById('output-9').textContent = 'Reset complete.';
});

// ============================================================
// EXAMPLE 10 — Template Literals + innerHTML
// Story: For admin dashboards with trusted data, Swiggy devs use
// template literals with innerHTML for rapid prototyping. Fast to
// write, easy to read — but always sanitize user input.
// ============================================================

// WHY: Quickest way to build UI from data. Just sanitize.

document.getElementById('btn-template').addEventListener('click', () => {
  const out = 'output-10';
  document.getElementById(out).textContent = '';
  const target = document.getElementById('template-target');

  const data = { name: 'Paradise Biryani', rating: 4.3, deliveryTime: 30, cuisines: ['Biryani', 'North Indian', 'Mughlai'] };

  target.innerHTML = `
    <div class="restaurant-card">
      <h3>${escapeHTML(data.name)}</h3>
      <span class="rating-badge">${data.rating} ★</span>
      <span style="color:#94a3b8;font-size:0.85rem;margin-left:0.5rem;">${data.deliveryTime} min</span>
      <p style="color:#94a3b8;font-size:0.85rem;margin-top:0.5rem;">${escapeHTML(data.cuisines.join(', '))}</p>
    </div>
  `;
  countOp();

  log('--- Template Literals + innerHTML ---', out);
  log('Built card with template literal:', out);
  log(`  Name: ${data.name}`, out);
  log(`  Rating: ${data.rating}`, out);
  log(`  Time: ${data.deliveryTime} min`, out);
  log(`  Cuisines: ${data.cuisines.join(', ')}`, out);
  log('', out);
  log('Great for rapid prototyping with trusted data', out);
  log('Always use escapeHTML() for any user-provided values', out);
});

// ============================================================
// EXAMPLE 11 — The <template> Tag
// Story: Swiggy defines a card template once in HTML, then clones it
// for each restaurant. Faster than innerHTML (parsed once, cloned
// many times). Content is inert — scripts won't execute, images
// won't load until cloned and inserted.
// ============================================================

// WHY: Browser-native reusable component. Parsed once, cloned N times.

document.getElementById('btn-from-template').addEventListener('click', () => {
  const out = 'output-11';
  document.getElementById(out).textContent = '';
  const output = document.getElementById('template-output');
  output.innerHTML = '';

  const templateData = [
    { name: 'Haldirams', rating: 4.2, time: '25 min' },
    { name: 'KFC', rating: 3.9, time: '20 min' },
    { name: 'Subway', rating: 4.0, time: '15 min' },
  ];

  const template = document.getElementById('card-template');

  log('--- Building from <template> ---', out);
  log(`template.content is a DocumentFragment (inert, not rendered)`, out);
  log('', out);

  const fragment = document.createDocumentFragment();

  templateData.forEach(data => {
    const clone = template.content.cloneNode(true); // deep clone -> DocumentFragment
    clone.querySelector('.card-title').textContent = data.name;
    clone.querySelector('.rating-badge').textContent = `${data.rating} ★`;
    clone.querySelector('.card-time').textContent = data.time;
    fragment.appendChild(clone);
    countOp();

    log(`  Cloned template for: ${data.name}`, out);
  });

  output.appendChild(fragment);
  countOp();

  log('', out);
  log('template.content -> DocumentFragment (inert, not rendered)', out);
  log('cloneNode(true) for each use. Faster than innerHTML parsing.', out);
});

// ============================================================
// EXAMPLE 12 — Performance: Batch DOM Updates
// Story: During Diwali sale, Swiggy shows 200 cards with live order
// counts updating every second. Naive: 200 individual DOM writes.
// Optimized: batch all updates in requestAnimationFrame. Smooth 60fps.
// ============================================================

// WHY: Mixing reads and writes causes "layout thrashing." Batch them.

(function() {
  const out = 'output-12';

  // --- Layout Thrashing (BAD) ---
  // cards.forEach(card => {
  //     const height = card.offsetHeight;          // READ (forces layout)
  //     card.style.height = (height + 10) + 'px';  // WRITE (invalidates layout)
  // });

  // --- Batched (GOOD) ---
  // const heights = Array.from(cards, c => c.offsetHeight); // read ALL first
  // cards.forEach((card, i) => card.style.height = (heights[i] + 10) + 'px'); // write ALL

  // --- requestAnimationFrame ---
  // requestAnimationFrame(() => {
  //     pendingUpdates.forEach((count, id) => {
  //         document.getElementById(id).querySelector('.count').textContent = count;
  //     });
  // });

  log('--- Batch DOM Updates ---', out);
  log('BAD:  read-write-read-write in loop (layout thrashing)', out);
  log('  cards.forEach(card => {', out);
  log('      const h = card.offsetHeight;     // READ (forces layout)', out);
  log('      card.style.height = h + 10 + "px"; // WRITE (invalidates)', out);
  log('  });', out);
  log('', out);
  log('GOOD: read all first, then write all', out);
  log('  const heights = cards.map(c => c.offsetHeight); // READ ALL', out);
  log('  cards.forEach((c,i) => c.style.height = heights[i]+10+"px"); // WRITE ALL', out);
  log('', out);
  log('BEST: use requestAnimationFrame for visual updates', out);
})();

// ============================================================
// EXAMPLE 13 — Complete Practical: Swiggy Cart
// Story: A simplified cart: add items, remove items, update quantities,
// show total. Combines all creation and modification techniques.
// ============================================================

// WHY: Ties everything together into a real-world feature.

const cart = {
  items: [],

  addItem(name, price, qty = 1) {
    const existing = this.items.find(i => i.name === name);
    if (existing) {
      existing.qty += qty;
    } else {
      this.items.push({ name, price, qty });
    }
    this.render();
  },

  removeItem(name) {
    this.items = this.items.filter(i => i.name !== name);
    this.render();
  },

  getTotal() {
    return this.items.reduce((s, i) => s + i.price * i.qty, 0);
  },

  clear() {
    this.items = [];
    this.render();
  },

  render() {
    const container = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total');
    const out = 'output-13';

    // Use DocumentFragment for batch rendering
    const fragment = document.createDocumentFragment();
    countOp();

    if (this.items.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'cart-empty';
      empty.textContent = 'Your cart is empty';
      fragment.appendChild(empty);
    } else {
      this.items.forEach(item => {
        const row = document.createElement('div');
        row.className = 'cart-item';

        const nameEl = document.createElement('span');
        nameEl.className = 'item-name';
        nameEl.textContent = item.name;

        const qtyEl = document.createElement('span');
        qtyEl.className = 'item-qty';
        qtyEl.textContent = `x${item.qty}`;

        const priceEl = document.createElement('span');
        priceEl.className = 'item-price';
        priceEl.textContent = `$${item.price * item.qty}`;

        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn-remove';
        removeBtn.textContent = 'Remove';
        removeBtn.addEventListener('click', () => {
          this.removeItem(item.name);
          log(`Removed: ${item.name}`, out);
        });

        row.append(nameEl, qtyEl, priceEl, removeBtn);
        fragment.appendChild(row);
        countOp();
      });
    }

    container.replaceChildren();
    container.appendChild(fragment); // ONE reflow
    totalEl.textContent = `$${this.getTotal()}`;
    countOp();
  }
};

// Menu button click handlers
document.querySelectorAll('.menu-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const name = btn.dataset.name;
    const price = parseInt(btn.dataset.price);
    cart.addItem(name, price);
    log(`Added: ${name} ($${price})`, 'output-13');
  });
});

document.getElementById('btn-clear-cart').addEventListener('click', () => {
  cart.clear();
  const out = 'output-13';
  document.getElementById(out).textContent = '';
  log('Cart cleared.', out);
});

// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. createElement + appendChild is the fundamental pattern. Created
//    elements are NOT in the DOM until inserted.
// 2. append() is modern: multiple args + strings. Use over appendChild.
// 3. prepend, before, after, replaceWith cover all insertion positions.
// 4. insertAdjacentHTML injects HTML at 4 precise positions.
// 5. cloneNode(true) deep-clones but NOT event listeners. Change IDs.
// 6. DocumentFragment batches insertions — 1 reflow instead of N.
// 7. innerHTML is dangerous with user input — XSS. Use textContent.
// 8. <template> is browser-native reusable component (parsed once).
// 9. Batch reads and writes separately to avoid layout thrashing.
// 10. escapeHTML() prevents XSS when using innerHTML with data.
// ============================================================

console.log('=== FILE 04 COMPLETE: Creating and Modifying DOM ===');
