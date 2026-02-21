// ============================================================
// FILE 03: TRAVERSING THE DOM
// Topic: Navigating between parent, child, and sibling nodes in the DOM tree
// WHY: Selecting a single element is only the start. Real-world apps need
// to walk from one element to its parent, children, or siblings. On IRCTC's
// booking page, clicking a seat navigates to its row, coach, and train.
// DOM traversal connects isolated elements into a meaningful structure.
// ============================================================

// --- Helper: log to both console and on-page output panel ---
function log(msg, targetId) {
  console.log(msg);
  const el = document.getElementById(targetId);
  if (el) el.textContent += msg + '\n';
}

// Helper: clear seat visual states
function clearSeatHighlights() {
  document.querySelectorAll('.seat').forEach(s => {
    s.classList.remove('current', 'sibling-highlight', 'parent-highlight');
  });
}

// ============================================================
// EXAMPLE 1 — The IRCTC Booking Page Tree
// Story: IRCTC's train booking page has a deep hierarchy: header with
// search form, train list, coaches inside trains, seat rows inside
// coaches, individual seats inside rows. When a user clicks a seat,
// the app traverses UP to find coach and train info, and DOWN into
// the seat to check availability. This is DOM traversal in action.
// ============================================================

// --- Seat click handler: build breadcrumb from DOM position ---
document.getElementById('train-list').addEventListener('click', (e) => {
  if (!e.target.matches('.seat')) return;

  const seat = e.target;
  clearSeatHighlights();
  seat.classList.add('current');

  const out = 'output-1';
  document.getElementById(out).textContent = '';

  // Build breadcrumb by traversing UP
  const parts = [];
  parts.push(`Seat ${seat.dataset.seat} (${seat.classList.contains('available') ? 'Available' : 'Booked'})`);

  const coach = seat.closest('.coach');
  if (coach) parts.push(`Coach ${coach.dataset.coach}`);

  const train = seat.closest('.train-card');
  if (train) parts.push(train.querySelector('.train-name').textContent);

  parts.push('Train List');
  parts.push('IRCTC');

  const breadcrumb = parts.reverse().join(' > ');
  document.getElementById('breadcrumb').textContent = breadcrumb;

  log('--- Seat Clicked ---', out);
  log(`Breadcrumb: ${breadcrumb}`, out);
  log('', out);
  log('Built by traversing UP with closest():', out);
  log(`  seat.closest('.coach')      -> Coach ${coach ? coach.dataset.coach : 'N/A'}`, out);
  log(`  seat.closest('.train-card') -> ${train ? train.querySelector('.train-name').textContent : 'N/A'}`, out);
});

// ============================================================
// EXAMPLE 2 — Parent Navigation: parentNode vs parentElement
// Story: A user clicks seat #3 in coach B1 of Rajdhani Express. IRCTC
// needs the parent coach div, then the train card, to display "Coach B1,
// Rajdhani Express." Both parentNode and parentElement walk UP, with a
// subtle difference at the very top of the DOM.
// ============================================================

// WHY: parentNode returns any node type (including Document).
// parentElement returns only Element nodes (null above <html>).

document.getElementById('btn-parent').addEventListener('click', () => {
  const out = 'output-2';
  document.getElementById(out).textContent = '';
  clearSeatHighlights();

  const seat = document.querySelector('.seat[data-seat="3"]');
  seat.classList.add('current');

  log('--- parentNode vs parentElement ---', out);
  log(`Seat: ${seat.dataset.seat}`, out);
  log(`seat.parentNode:    <${seat.parentNode.tagName.toLowerCase()}> (${seat.parentNode.className})`, out);
  log(`seat.parentElement: <${seat.parentElement.tagName.toLowerCase()}> (${seat.parentElement.className})`, out);
  log('(For most elements, they are identical)', out);
  log('', out);

  // Difference at the top
  log('--- Difference at the top of DOM ---', out);
  log(`document.documentElement.parentNode:    ${document.documentElement.parentNode} (Document node)`, out);
  log(`document.documentElement.parentElement: ${document.documentElement.parentElement} (null!)`, out);
  log('', out);

  // Walk all the way up
  log('--- Walking up the ancestor chain ---', out);
  const chain = [];
  let current = seat;
  while (current) {
    chain.push(current.nodeName);
    current = current.parentElement;
  }
  log(`Ancestor chain: ${chain.join(' -> ')}`, out);
  log('', out);
  log('parentNode: returns any node (including Document)', out);
  log('parentElement: returns Element only (null above <html>)', out);
  log('For 99% of cases, they behave identically.', out);
});

// ============================================================
// EXAMPLE 3 — Children: childNodes vs children
// Story: IRCTC counts seats in a row. childNodes returns 7 nodes
// (3 spans + 4 whitespace text nodes). children returns only the 3
// seat elements. This is the most common DOM traversal gotcha.
// ============================================================

// WHY: childNodes = ALL nodes. children = ONLY elements. Use children.

document.getElementById('btn-children').addEventListener('click', () => {
  const out = 'output-3';
  document.getElementById(out).textContent = '';

  const row = document.querySelector('.seat-row');

  log('--- childNodes vs children ---', out);
  log(`row.childNodes.length:   ${row.childNodes.length} (includes whitespace text nodes!)`, out);
  log(`row.children.length:     ${row.children.length} (just the seat spans)`, out);
  log(`row.childElementCount:   ${row.childElementCount}`, out);
  log(`row.hasChildNodes():     ${row.hasChildNodes()}`, out);
  log('', out);

  log('childNodes breakdown:', out);
  row.childNodes.forEach((node, i) => {
    const type = node.nodeType === 1 ? 'ELEMENT' : node.nodeType === 3 ? 'TEXT' : 'OTHER';
    const val = node.nodeType === 1 ? `<${node.tagName.toLowerCase()}>` : `"${node.nodeValue.replace(/\n/g, '\\n').trim() || '(whitespace)'}"`;
    log(`  [${i}] ${type}: ${val}`, out);
  });
  log('', out);

  log('children breakdown:', out);
  Array.from(row.children).forEach((el, i) => {
    log(`  [${i}] <${el.tagName.toLowerCase()}> seat=${el.dataset.seat} (${el.classList.contains('available') ? 'available' : 'booked'})`, out);
  });
  log('', out);
  log('childNodes: ALL nodes (elements + text + comments)', out);
  log('children: ONLY element nodes (what you usually want)', out);
  log('childNodes includes whitespace — often surprising!', out);
});

// ============================================================
// EXAMPLE 4 — first/last Child vs first/last ElementChild
// Story: IRCTC highlights the first seat in each row (window seat
// preference). firstChild returns whitespace. firstElementChild
// returns the actual seat span.
// ============================================================

// WHY: The *Element* variants skip text/comment nodes.

document.getElementById('btn-firstlast').addEventListener('click', () => {
  const out = 'output-4';
  document.getElementById(out).textContent = '';

  const row = document.querySelector('.seat-row');

  log('--- firstChild vs firstElementChild ---', out);
  log(`row.firstChild:         ${row.firstChild.nodeType === 3 ? '#text (whitespace!)' : '<' + row.firstChild.tagName + '>'}`, out);
  log(`row.lastChild:          ${row.lastChild.nodeType === 3 ? '#text (whitespace!)' : '<' + row.lastChild.tagName + '>'}`, out);
  log(`row.firstElementChild:  <${row.firstElementChild.tagName.toLowerCase()}> seat=${row.firstElementChild.dataset.seat}`, out);
  log(`row.lastElementChild:   <${row.lastElementChild.tagName.toLowerCase()}> seat=${row.lastElementChild.dataset.seat}`, out);
  log('', out);

  log('--- Quick Reference ---', out);
  log('Property              | Returns        | Includes text?', out);
  log('----------------------|----------------|---------------', out);
  log('firstChild            | Node or null   | YES', out);
  log('lastChild             | Node or null   | YES', out);
  log('firstElementChild     | Element/null   | NO', out);
  log('lastElementChild      | Element/null   | NO', out);
  log('', out);
  log('RULE: Always prefer the *Element* variant', out);
});

// ============================================================
// EXAMPLE 5 — Sibling Navigation
// Story: Seat 2 is selected. IRCTC highlights adjacent seats 1 and 3
// for group booking. Finding them requires previousElementSibling and
// nextElementSibling.
// ============================================================

// WHY: Sibling navigation moves horizontally within the same parent.

document.getElementById('btn-siblings').addEventListener('click', () => {
  const out = 'output-5';
  document.getElementById(out).textContent = '';
  clearSeatHighlights();

  const seat2 = document.querySelector('.seat[data-seat="2"]');
  seat2.classList.add('current');

  log('--- Sibling Navigation from Seat 2 ---', out);

  if (seat2.previousSibling) {
    log(`seat2.previousSibling:        ${seat2.previousSibling.nodeType === 3 ? '#text (whitespace)' : seat2.previousSibling.tagName}`, out);
  }
  if (seat2.nextSibling) {
    log(`seat2.nextSibling:            ${seat2.nextSibling.nodeType === 3 ? '#text (whitespace)' : seat2.nextSibling.tagName}`, out);
  }

  const prev = seat2.previousElementSibling;
  const next = seat2.nextElementSibling;

  log(`seat2.previousElementSibling: <span> seat=${prev ? prev.dataset.seat : 'null'}`, out);
  log(`seat2.nextElementSibling:     <span> seat=${next ? next.dataset.seat : 'null'}`, out);

  if (prev) prev.classList.add('sibling-highlight');
  if (next) next.classList.add('sibling-highlight');

  log('', out);
  log('--- Quick Reference ---', out);
  log('previousSibling         | Node or null   | YES (includes text)', out);
  log('nextSibling             | Node or null   | YES (includes text)', out);
  log('previousElementSibling  | Element/null   | NO', out);
  log('nextElementSibling      | Element/null   | NO', out);
  log('', out);
  log('RULE: Always use the *Element* variant for siblings', out);
});

document.getElementById('btn-all-siblings').addEventListener('click', () => {
  const out = 'output-5';
  document.getElementById(out).textContent = '';
  clearSeatHighlights();

  const seat2 = document.querySelector('.seat[data-seat="2"]');
  seat2.classList.add('current');

  // Get all siblings function
  function getSiblings(element) {
    const siblings = [];
    let sibling = element.parentElement.firstElementChild;
    while (sibling) {
      if (sibling !== element) siblings.push(sibling);
      sibling = sibling.nextElementSibling;
    }
    return siblings;
  }

  const siblings = getSiblings(seat2);
  log('--- All Siblings of Seat 2 ---', out);
  siblings.forEach(s => {
    log(`  Seat ${s.dataset.seat} (${s.classList.contains('available') ? 'available' : 'booked'})`, out);
    s.classList.add('sibling-highlight');
  });
});

// ============================================================
// EXAMPLE 6 — closest() for Upward Traversal
// Story: IRCTC's seat click handler receives a <span> seat element.
// It needs (1) which seat-row, (2) which coach, (3) which train.
// closest() with a CSS selector jumps directly to the matching
// ancestor — no fragile parentElement.parentElement chains.
// ============================================================

// WHY: closest() replaces parentElement chains. It is resilient to
// HTML structure changes because it searches by selector, not depth.

document.getElementById('btn-closest').addEventListener('click', () => {
  const out = 'output-6';
  document.getElementById(out).textContent = '';
  clearSeatHighlights();

  const seat = document.querySelector('.seat[data-seat="3"]');
  seat.classList.add('current');

  log('--- closest() from Seat 3 ---', out);
  log(`seat.closest('.seat-row'):   ${seat.closest('.seat-row') ? 'found <div.seat-row>' : 'null'}`, out);
  log(`seat.closest('.coach'):      Coach ${seat.closest('.coach')?.dataset.coach || 'null'}`, out);
  log(`seat.closest('.train-card'): Train ${seat.closest('.train-card')?.dataset.train || 'null'}`, out);
  log(`seat.closest('.seat'):       seat=${seat.closest('.seat')?.dataset.seat} (checks self first!)`, out);
  log(`seat.closest('.nonexistent'):${seat.closest('.nonexistent')}`, out);
  log('', out);
  log('closest() searches UP from element to matching ancestor', out);
  log('Checks the element itself first', out);
  log('Returns null if no match. Better than chaining .parentElement.', out);
});

// ============================================================
// EXAMPLE 7 — contains() — Check if Element is Descendant
// Story: IRCTC verifies that a clicked element is inside the trusted
// #search-form, not a fake form from a browser extension. contains()
// answers: "Is element B inside element A?"
// ============================================================

// WHY: Useful for click-outside detection and security validation.

document.getElementById('btn-contains').addEventListener('click', () => {
  const out = 'output-7';
  document.getElementById(out).textContent = '';

  const form = document.getElementById('search-form');
  const btn = document.getElementById('search-btn');
  const trainList = document.getElementById('train-list');

  log('--- contains() Tests ---', out);
  log(`form.contains(searchBtn):  ${form.contains(btn)} (button is inside form)`, out);
  log(`form.contains(form):       ${form.contains(form)} (element contains itself!)`, out);
  log(`form.contains(trainList):  ${form.contains(trainList)} (train list is NOT in form)`, out);
  log(`trainList.contains(document.querySelector('.seat')): ${trainList.contains(document.querySelector('.seat'))}`, out);
  log('', out);
  log('parent.contains(child) -> true if child is inside parent', out);
  log('Element contains itself: el.contains(el) === true', out);
  log('', out);
  log('--- Click Outside Detection Pattern ---', out);
  log('document.addEventListener("click", (e) => {', out);
  log('    if (!dropdown.contains(e.target)) {', out);
  log('        dropdown.style.display = "none";', out);
  log('    }', out);
  log('});', out);
});

// ============================================================
// EXAMPLE 8 — Walking the Entire DOM Tree (Recursive)
// Story: IRCTC's accessibility audit script visits every node on the
// booking page — checks aria attributes on elements, readability on
// text nodes, skips comments. A recursive walker covers everything.
// ============================================================

// WHY: Recursive DOM traversal is fundamental. DOM diffing, HTML
// sanitizers, and accessibility checkers all use this pattern.

document.getElementById('btn-walk').addEventListener('click', () => {
  const out = 'output-8';
  document.getElementById(out).textContent = '';

  log('--- DOM Tree Walk (#irctc-app) ---', out);

  function walkDOM(node, callback, depth = 0) {
    callback(node, depth);
    for (const child of node.childNodes) {
      walkDOM(child, callback, depth + 1);
    }
  }

  const irctcApp = document.getElementById('irctc-app');
  walkDOM(irctcApp, (node, depth) => {
    const indent = '  '.repeat(depth);
    if (node.nodeType === 1) {
      let desc = `<${node.tagName.toLowerCase()}>`;
      if (node.id) desc += `#${node.id}`;
      if (node.className) desc += `.${node.className.split(' ')[0]}`;
      log(`${indent}${desc}`, out);
    } else if (node.nodeType === 3 && node.nodeValue.trim()) {
      log(`${indent}TEXT: "${node.nodeValue.trim()}"`, out);
    }
  });
});

// ============================================================
// EXAMPLE 9 — Table-Specific Traversal: rows, cells, tHead, tBody
// Story: IRCTC shows train schedules in HTML tables. The DOM provides
// special properties (rows, cells, tHead, tBody) that simplify table
// navigation compared to generic children/querySelector.
// ============================================================

// WHY: Table-specific properties are cleaner and faster for tables.

document.getElementById('btn-table').addEventListener('click', () => {
  const out = 'output-9';
  document.getElementById(out).textContent = '';

  const table = document.getElementById('schedule-table');

  log('--- Table Traversal ---', out);
  log(`table.tHead:       ${table.tHead ? '<thead> found' : 'null'}`, out);
  log(`table.tBodies[0]:  ${table.tBodies[0] ? '<tbody> found' : 'null'}`, out);
  log(`table.rows.length: ${table.rows.length} (all <tr> across sections)`, out);
  log('', out);

  // Iterate rows
  for (let i = 0; i < table.rows.length; i++) {
    const row = table.rows[i];
    const cells = Array.from(row.cells).map(c => c.textContent.padEnd(16)).join('| ');
    log(`  Row ${i} (rowIndex=${row.rowIndex}, sectionRowIndex=${row.sectionRowIndex}):`, out);
    log(`    ${cells}`, out);
  }
  log('', out);
  log('table.rows, row.cells, table.tHead, table.tBodies', out);
  log('Much cleaner than querySelectorAll for tables!', out);
});

// ============================================================
// EXAMPLE 10 — Building a Breadcrumb from DOM Position
// Story: IRCTC builds a breadcrumb dynamically:
// "IRCTC > Train List > Rajdhani Express > Coach B1 > Seat 3"
// by walking UP from the selected seat using closest() and collecting
// meaningful labels.
// ============================================================

// WHY: Combines closest(), parentElement, textContent, and dataset.

document.getElementById('btn-breadcrumb').addEventListener('click', () => {
  const out = 'output-10';
  document.getElementById(out).textContent = '';
  clearSeatHighlights();

  const seat = document.querySelector('.coach[data-coach="B1"] .seat[data-seat="3"]');
  seat.classList.add('current');

  function buildBreadcrumb(seatElement) {
    const parts = [];
    parts.push(`Seat ${seatElement.dataset.seat}`);
    const coach = seatElement.closest('.coach');
    if (coach) parts.push(`Coach ${coach.dataset.coach}`);
    const train = seatElement.closest('.train-card');
    if (train) parts.push(train.querySelector('.train-name').textContent);
    if (seatElement.closest('#train-list')) parts.push('Train List');
    parts.push('IRCTC');
    return parts.reverse().join(' > ');
  }

  const breadcrumb = buildBreadcrumb(seat);
  document.getElementById('breadcrumb').textContent = breadcrumb;

  log('--- Breadcrumb Builder ---', out);
  log(`Result: ${breadcrumb}`, out);
  log('', out);
  log('Built using:', out);
  log('  seat.dataset.seat                         -> Seat number', out);
  log('  seat.closest(".coach").dataset.coach       -> Coach ID', out);
  log('  seat.closest(".train-card") .train-name    -> Train name', out);
  log('  seat.closest("#train-list")                -> Section check', out);
});

// ============================================================
// EXAMPLE 11 — TreeWalker and NodeIterator
// Story: IRCTC's tooling team finds all text nodes on the booking
// confirmation page to verify no sensitive data is exposed. TreeWalker
// is a built-in API for efficient filtered traversal.
// ============================================================

// WHY: Purpose-built for DOM traversal with filtering. More efficient
// than manual recursion for large documents.

document.getElementById('btn-treewalker').addEventListener('click', () => {
  const out = 'output-11';
  document.getElementById(out).textContent = '';

  log('--- TreeWalker: All Text Nodes in #irctc-app ---', out);

  const walker = document.createTreeWalker(
    document.getElementById('irctc-app'),
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) =>
        node.nodeValue.trim()
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT
    }
  );

  let node;
  let count = 0;
  while (node = walker.nextNode()) {
    count++;
    log(`  [${count}] "${node.nodeValue.trim()}"`, out);
  }

  log('', out);
  log(`Total non-empty text nodes: ${count}`, out);
  log('', out);
  log('--- TreeWalker vs NodeIterator ---', out);
  log('TreeWalker:    full navigation (parent, child, sibling)', out);
  log('NodeIterator:  flat next/previous only', out);
  log('Both support NodeFilter (SHOW_ELEMENT, SHOW_TEXT, SHOW_COMMENT)', out);
});

// ============================================================
// EXAMPLE 12 — Traversal Cheat Sheet
// (Displayed as HTML in the section above)
// ============================================================

// --- MOVING UP ---
// element.parentElement       -> parent element
// element.closest(selector)   -> nearest ancestor matching selector

// --- MOVING DOWN ---
// element.children            -> child elements (HTMLCollection)
// element.firstElementChild   -> first child element
// element.lastElementChild    -> last child element
// element.childElementCount   -> number of child elements

// --- MOVING SIDEWAYS ---
// element.previousElementSibling  -> previous element
// element.nextElementSibling      -> next element

// --- CHECKING ---
// parent.contains(child)     -> is child inside parent?
// element.matches(selector)  -> does element match selector?

// ============================================================
// EXAMPLE 13 — Practical: IRCTC Seat Finder
// Story: Find all available seats in a specific coach, combining
// traversal techniques into one real-world function.
// ============================================================

// WHY: Real-world traversal combines multiple techniques.

function findAvailableSeats(coachId) {
  const coach = document.querySelector(`.coach[data-coach="${coachId}"]`);
  if (!coach) return [];

  const available = [];
  for (const row of coach.children) {
    if (!row.matches('.seat-row')) continue;
    let seat = row.firstElementChild;
    while (seat) {
      if (seat.classList.contains('available')) {
        available.push({
          seat: seat.dataset.seat,
          coach: coachId,
          prevFree: seat.previousElementSibling?.classList.contains('available') || false,
          nextFree: seat.nextElementSibling?.classList.contains('available') || false
        });
      }
      seat = seat.nextElementSibling;
    }
  }
  return available;
}

document.getElementById('btn-find-b1').addEventListener('click', () => {
  const out = 'output-13';
  document.getElementById(out).textContent = '';
  clearSeatHighlights();

  const results = findAvailableSeats('B1');
  log('--- Available Seats in Coach B1 ---', out);
  results.forEach(r => {
    log(`  Seat ${r.seat} | prevFree: ${r.prevFree} | nextFree: ${r.nextFree}`, out);
    const el = document.querySelector(`.coach[data-coach="B1"] .seat[data-seat="${r.seat}"]`);
    if (el) el.classList.add('current');
  });
  log(`\nTotal available: ${results.length}`, out);
});

document.getElementById('btn-find-a1').addEventListener('click', () => {
  const out = 'output-13';
  document.getElementById(out).textContent = '';
  clearSeatHighlights();

  const results = findAvailableSeats('A1');
  log('--- Available Seats in Coach A1 ---', out);
  results.forEach(r => {
    log(`  Seat ${r.seat} | prevFree: ${r.prevFree} | nextFree: ${r.nextFree}`, out);
    const el = document.querySelector(`.coach[data-coach="A1"] .seat[data-seat="${r.seat}"]`);
    if (el) el.classList.add('current');
  });
  log(`\nTotal available: ${results.length}`, out);
});

// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. Always use *Element* variants (parentElement, children,
//    firstElementChild, nextElementSibling) to skip whitespace.
// 2. parentNode vs parentElement: identical except at top of DOM.
// 3. childNodes = all nodes; children = elements only.
// 4. closest(selector) searches UP — essential for event delegation.
// 5. contains() checks if one element is inside another.
// 6. Tables have special properties: table.rows, row.cells, tHead.
// 7. TreeWalker/NodeIterator are built-in filtered traversal tools.
// 8. Never hardcode depth (parentElement.parentElement). Use closest().
// ============================================================

console.log('=== FILE 03 COMPLETE: Traversing the DOM ===');
