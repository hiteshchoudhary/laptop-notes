// ============================================================
// FILE 01: DOM INTRODUCTION
// Topic: Understanding the Document Object Model — the live blueprint of every web page
// WHY: Every dynamic web experience — from Flipkart's product filters to
// Swiggy's cart updates — works by reading and modifying the DOM. Without
// understanding the DOM, you cannot build interactive front-end applications.
// ============================================================

// --- Helper: log to both console and on-page output panel ---
function log(msg, targetId) {
  console.log(msg);
  const el = document.getElementById(targetId);
  if (el) el.textContent += msg + '\n';
}

// ============================================================
// EXAMPLE 1 — The Flipkart Blueprint
// Story: When you open Flipkart.com, your browser downloads HTML text —
// just a long string of tags. But the browser parses it into a living
// tree of objects called the DOM. Every product card, every filter
// checkbox, every "Add to Cart" button is a node in that tree.
// ============================================================

// WHY: The DOM is NOT the HTML file. HTML is the blueprint on paper;
// the DOM is the actual building constructed from that blueprint.

// --- What is the DOM? ---
// The Document Object Model is a tree-structured representation of an
// HTML document. Every tag becomes an Element node, every piece of text
// becomes a Text node, and even comments become Comment nodes.

// The visual DOM tree in the HTML section above demonstrates this structure.

// ============================================================
// EXAMPLE 2 — window vs document vs globalThis
// Story: Think of Flipkart's web app as an office building. `window`
// is the entire building — it holds the document, location bar, history,
// timers, and console. `document` is just the main hall where all the
// product displays (HTML content) live. `globalThis` is a universal
// key that works in any JS environment (browser, Node.js, Worker).
// ============================================================

// WHY: Beginners confuse window and document. Understanding the
// hierarchy prevents bugs and clarifies where methods live.

document.getElementById('btn-window').addEventListener('click', () => {
  const out = 'output-2';
  document.getElementById(out).textContent = '';
  log('--- window: The Global Object in Browsers ---', out);
  log(`window.innerWidth: ${window.innerWidth}`, out);
  log(`window.innerHeight: ${window.innerHeight}`, out);
  log(`window.location.href: ${window.location.href}`, out);
  log(`window.navigator.userAgent: ${window.navigator.userAgent.slice(0, 80)}...`, out);
  log(`typeof window: ${typeof window}`, out);
});

document.getElementById('btn-document').addEventListener('click', () => {
  const out = 'output-2';
  document.getElementById(out).textContent = '';
  log('--- document: The HTML Document ---', out);
  log(`document.title: "${document.title}"`, out);
  log(`document.URL: "${document.URL}"`, out);
  log(`document.contentType: "${document.contentType}"`, out);
  log(`document.characterSet: "${document.characterSet}"`, out);
  log(`document.doctype: ${document.doctype.name}`, out);
});

document.getElementById('btn-globalthis').addEventListener('click', () => {
  const out = 'output-2';
  document.getElementById(out).textContent = '';
  log('--- globalThis: The Universal Reference ---', out);
  log(`typeof globalThis: "${typeof globalThis}"`, out);
  log(`globalThis === window: ${globalThis === window}`, out);

  // In browsers: globalThis === window     // true
  // In Node.js:  globalThis === global     // true
  // In Workers:  globalThis === self       // true

  globalThis.flipkartAppVersion = '4.2.1';
  log(`globalThis.flipkartAppVersion: "${globalThis.flipkartAppVersion}"`, out);
  log('', out);
  log('globalThis works in ALL JS environments:', out);
  log('  Browser -> globalThis === window', out);
  log('  Node.js -> globalThis === global', out);
  log('  Workers -> globalThis === self', out);
});

// ============================================================
// EXAMPLE 3 — DOM Tree Structure: Node Types
// Story: On Flipkart's product page, not everything is an HTML element.
// "iPhone 15" is a Text node inside an <h1> Element node. The hidden
// comment "<!-- price API -->" is a Comment node. Understanding node
// types helps you traverse the DOM precisely.
// ============================================================

// WHY: The DOM has different node types. If you only know elements,
// childNodes returning text and comments will confuse you.

// --- Node Types ---
// Node.ELEMENT_NODE   = 1   (e.g., <div>, <span>)
// Node.TEXT_NODE       = 3   (e.g., "Hello World")
// Node.COMMENT_NODE   = 8   (e.g., <!-- comment -->)
// Node.DOCUMENT_NODE  = 9   (the document itself)
// Node.DOCUMENT_FRAGMENT_NODE = 11

document.getElementById('btn-inspect').addEventListener('click', () => {
  const out = 'output-3';
  document.getElementById(out).textContent = '';
  const target = document.getElementById('inspect-target');

  log('--- Inspecting nodes inside #inspect-target ---', out);
  log('', out);

  // --- Quick Reference ---
  // nodeType | nodeName        | nodeValue
  // ---------|-----------------|------------------
  // 1        | Tag name (caps) | null
  // 3        | "#text"         | The text content
  // 8        | "#comment"      | The comment text
  // 9        | "#document"     | null

  function inspectNode(node, depth) {
    const indent = '  '.repeat(depth);
    const type = node.nodeType;
    const typeName =
      type === 1 ? 'ELEMENT' :
      type === 3 ? 'TEXT' :
      type === 8 ? 'COMMENT' :
      type === 9 ? 'DOCUMENT' : `TYPE_${type}`;

    if (type === 3 && !node.nodeValue.trim()) return; // skip whitespace

    let info = `${indent}[${typeName}] nodeName="${node.nodeName}"`;
    if (type === 3) info += ` nodeValue="${node.nodeValue.trim()}"`;
    if (type === 8) info += ` nodeValue="${node.nodeValue.trim()}"`;
    if (type === 1) info += ` nodeValue=${node.nodeValue}`;

    log(info, out);

    for (const child of node.childNodes) {
      inspectNode(child, depth + 1);
    }
  }

  inspectNode(target, 0);
  log('', out);
  log('--- Node Type Constants ---', out);
  log(`ELEMENT_NODE: ${Node.ELEMENT_NODE}`, out);
  log(`TEXT_NODE: ${Node.TEXT_NODE}`, out);
  log(`COMMENT_NODE: ${Node.COMMENT_NODE}`, out);
  log(`DOCUMENT_NODE: ${Node.DOCUMENT_NODE}`, out);
});

// ============================================================
// EXAMPLE 4 — document.documentElement, document.head, document.body
// Story: Flipkart's performance team uses direct properties for top-level
// access: document.documentElement for <html>, document.head for <head>,
// document.body for <body>. These are faster than querying.
// ============================================================

// WHY: These shortcuts are faster and more readable than querySelector.

document.getElementById('btn-shortcuts').addEventListener('click', () => {
  const out = 'output-4';
  document.getElementById(out).textContent = '';
  log('--- Top-Level DOM Shortcuts ---', out);
  log(`document.documentElement -> <${document.documentElement.tagName.toLowerCase()}>`, out);
  log(`document.head -> <${document.head.tagName.toLowerCase()}>`, out);
  log(`document.body -> <${document.body.tagName.toLowerCase()}>`, out);
  log(`document.doctype -> ${document.doctype.name}`, out);
  log('', out);

  // IMPORTANT: document.body is null if script runs in <head>
  // before the browser parses <body>. Use defer or DOMContentLoaded.

  log('--- Hierarchy ---', out);
  log(`document.documentElement.parentNode === document: ${document.documentElement.parentNode === document}`, out);
  log(`document.head.parentNode === document.documentElement: ${document.head.parentNode === document.documentElement}`, out);
  log(`document.body.parentNode === document.documentElement: ${document.body.parentNode === document.documentElement}`, out);
});

// ============================================================
// EXAMPLE 5 — nodeType, nodeName, nodeValue Deep Dive
// Story: Flipkart's accessibility team walks every node on the product
// page. For Element nodes, they check aria-labels. For Text nodes, they
// verify readability. Without nodeType checks, their script would crash.
// ============================================================

// WHY: When traversing the DOM, you must identify what kind of node
// you are looking at before acting on it.

// --- textContent vs nodeValue ---
// For elements: nodeValue is null, textContent is all descendant text
// For text nodes: nodeValue IS the text, textContent is also the text

document.getElementById('btn-nodeprops').addEventListener('click', () => {
  const out = 'output-5';
  document.getElementById(out).textContent = '';
  const p = document.getElementById('price-paragraph');

  log('--- nodeType / nodeName / nodeValue ---', out);
  log(`p.nodeType: ${p.nodeType} (ELEMENT_NODE)`, out);
  log(`p.nodeName: "${p.nodeName}"`, out);
  log(`p.nodeValue: ${p.nodeValue}`, out);
  log(`p.textContent: "${p.textContent}"`, out);
  log('', out);
  log(`p.firstChild.nodeType: ${p.firstChild.nodeType} (TEXT_NODE)`, out);
  log(`p.firstChild.nodeName: "${p.firstChild.nodeName}"`, out);
  log(`p.firstChild.nodeValue: "${p.firstChild.nodeValue}"`, out);
  log('', out);
  log('Element nodes: nodeValue is null, use textContent', out);
  log('Text nodes: nodeValue IS the text content', out);
});

// ============================================================
// EXAMPLE 6 — DOM vs HTML Source
// Story: A junior developer at Flipkart sees different things in
// "View Page Source" and the DevTools Elements panel. Source shows
// original HTML. Elements panel shows the LIVE DOM — modified by
// JavaScript, corrected by the browser, updated by user interactions.
// ============================================================

// WHY: The DOM is a LIVE object. The HTML source is STATIC text.

document.getElementById('btn-domvshtml').addEventListener('click', () => {
  const out = 'output-6';
  document.getElementById(out).textContent = '';

  log('--- DOM vs HTML Source ---', out);
  log('', out);

  // 1. Browser auto-correction:
  const table = document.getElementById('auto-correct-demo');
  log('1. Browser auto-correction:', out);
  log(`   Source: <table><tr><td>...</td></tr></table>`, out);
  log(`   DOM has <tbody>: ${table.querySelector('tbody') !== null}`, out);
  log(`   The browser inserts <tbody> automatically!`, out);
  log('', out);

  // 2. JavaScript modifications:
  log('2. JavaScript modifications:', out);
  log('   Source does NOT change. DOM now has this output panel.', out);
  log('', out);

  // 3. User input:
  const input = document.getElementById('live-input');
  log('3. User input:', out);
  log(`   getAttribute("value"): "${input.getAttribute('value')}" (initial HTML)`, out);
  log(`   input.value property: "${input.value}" (live DOM)`, out);
  log('', out);
  log('View Source = original HTML text (static)', out);
  log('DevTools Elements = live DOM (dynamic)', out);
});

// ============================================================
// EXAMPLE 7 — console.dir() vs console.log() for DOM Elements
// Story: Flipkart's debugging team inspects a product card element.
// console.log(element) shows HTML. console.dir(element) shows the
// JavaScript OBJECT with all properties (id, classList, dataset, etc.).
// ============================================================

// WHY: console.log() shows HTML; console.dir() shows the JS object.

document.getElementById('btn-logdir').addEventListener('click', () => {
  const out = 'output-7';
  document.getElementById(out).textContent = '';
  const card = document.getElementById('demo-card');

  log('--- console.log() vs console.dir() ---', out);
  log('(Check your browser DevTools console!)', out);
  log('', out);

  console.log('console.log(element) shows HTML representation:');
  console.log(card);

  console.log('console.dir(element) shows JavaScript object:');
  console.dir(card);

  log('console.log(element)  -> HTML representation', out);
  log('console.dir(element)  -> JavaScript object with properties', out);
  log('', out);
  log(`Some properties of #demo-card:`, out);
  log(`  id: "${card.id}"`, out);
  log(`  className: "${card.className}"`, out);
  log(`  dataset.id: "${card.dataset.id}"`, out);
  log(`  tagName: "${card.tagName}"`, out);
  log(`  children.length: ${card.children.length}`, out);
});

// ============================================================
// EXAMPLE 8 — Browser Rendering Pipeline
// Story: When a user opens Flipkart's Big Billion Days sale page, the
// browser follows a precise pipeline: parse HTML to DOM, parse CSS to
// CSSOM, merge into Render Tree, compute layout, paint pixels. Flipkart
// optimizes every step to load in under 2 seconds on a Jio phone.
// ============================================================

// WHY: Understanding the rendering pipeline explains WHY certain
// operations are slow and HOW to optimize them.

document.getElementById('btn-pipeline').addEventListener('click', () => {
  const out = 'output-8';
  document.getElementById(out).textContent = '';
  const steps = document.querySelectorAll('.pipeline-step');

  // Reset all
  steps.forEach(s => s.classList.remove('active'));

  // --- The Pipeline ---
  const descriptions = [
    'Step 1: HTML Parsing  -> DOM Tree\n  <script> without defer STOPS parsing (parser blocking).',
    'Step 2: CSS Parsing   -> CSSOM\n  CSSOM blocks rendering (not parsing).',
    'Step 3: DOM + CSSOM   -> Render Tree\n  display:none excluded. Pseudo-elements included.',
    'Step 4: Layout (Reflow)\n  Calculate exact position/size of every element.',
    'Step 5: Paint\n  Draw pixels: text, colors, borders, shadows, images.',
    'Step 6: Compositing\n  Merge layers (GPU). CSS transforms/opacity are cheap here.'
  ];

  steps.forEach((step, i) => {
    setTimeout(() => {
      step.classList.add('active');
      log(descriptions[i], out);
      if (i === steps.length - 1) {
        log('\nPipeline complete!', out);
      }
    }, i * 600);
  });
});

// ============================================================
// EXAMPLE 9 — Why DOM Manipulation is Expensive
// Story: During Big Billion Days, a dev added 10,000 cards one-by-one
// with appendChild(). Each triggered reflow + repaint. Page froze for
// 8 seconds. Senior dev rewrote with DocumentFragment — one insertion,
// one reflow. Page loaded in 200ms.
// ============================================================

// WHY: DOM manipulation triggers reflow and repaint. Minimizing these
// is key to building performant web apps.

// --- What triggers Reflow? ---
// - Adding/removing elements
// - Changing size (width, height, padding, margin)
// - Changing text content
// - READING layout properties (offsetHeight, clientWidth, scrollTop)

// --- What triggers only Repaint? ---
// - Changing color, background-color, visibility, box-shadow

// --- What is "free" (compositing only)? ---
// - transform (translate, rotate, scale)
// - opacity
// These use the GPU — no reflow or repaint.

document.getElementById('btn-bad-insert').addEventListener('click', () => {
  const out = 'output-9';
  const target = document.getElementById('insert-target');
  const perfBad = document.getElementById('perf-bad');
  document.getElementById(out).textContent = '';
  target.innerHTML = '';

  log('--- Bad: Insert 200 items one-by-one ---', out);
  const start = performance.now();

  // BAD: each appendChild triggers reflow
  for (let i = 0; i < 200; i++) {
    const item = document.createElement('span');
    item.className = 'item';
    item.textContent = i;
    target.appendChild(item);
  }

  const time = (performance.now() - start).toFixed(2);
  perfBad.textContent = `One-by-one: ${time}ms`;
  log(`200 individual appends: ${time}ms`, out);
  log('Each appendChild triggers a potential reflow!', out);
});

document.getElementById('btn-good-insert').addEventListener('click', () => {
  const out = 'output-9';
  const target = document.getElementById('insert-target');
  const perfGood = document.getElementById('perf-good');
  document.getElementById(out).textContent = '';
  target.innerHTML = '';

  log('--- Good: Batch with DocumentFragment ---', out);
  const start = performance.now();

  // GOOD: build all in fragment, insert once = 1 reflow
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < 200; i++) {
    const item = document.createElement('span');
    item.className = 'item';
    item.textContent = i;
    fragment.appendChild(item);
  }
  target.appendChild(fragment); // ONE reflow for all 200

  const time = (performance.now() - start).toFixed(2);
  perfGood.textContent = `Fragment batch: ${time}ms`;
  log(`DocumentFragment batch: ${time}ms`, out);
  log('ONE reflow for all 200 items!', out);
  log('', out);
  log('Reflow: recalculates geometry — EXPENSIVE', out);
  log('Repaint: redraws pixels — moderate', out);
  log('Compositing: GPU transform/opacity — CHEAP', out);
});

// ============================================================
// EXAMPLE 10 — DOM Tree Audit (Practical)
// Story: A new hire at Flipkart audits the product page: counts node
// types, measures tree depth. This identifies over-nested markup that
// slows reflow. Google recommends < 1500 nodes, depth < 32.
// ============================================================

// WHY: This combines all concepts into a practical performance exercise.

document.getElementById('btn-audit').addEventListener('click', () => {
  const out = 'output-10';
  document.getElementById(out).textContent = '';

  let elements = 0, textNodes = 0, commentNodes = 0, maxDepth = 0, totalNodes = 0;

  function walk(node, depth) {
    totalNodes++;
    maxDepth = Math.max(maxDepth, depth);
    if (node.nodeType === 1) elements++;
    else if (node.nodeType === 3) textNodes++;
    else if (node.nodeType === 8) commentNodes++;
    for (const child of node.childNodes) walk(child, depth + 1);
  }

  walk(document.body, 0);

  log('--- DOM Audit of THIS Page ---', out);
  log(`  Element nodes: ${elements}`, out);
  log(`  Text nodes: ${textNodes}`, out);
  log(`  Comment nodes: ${commentNodes}`, out);
  log(`  Max depth: ${maxDepth}`, out);
  log(`  Total nodes: ${totalNodes}`, out);
  log('', out);
  log(`Google recommendations:`, out);
  log(`  Total nodes < 1500: ${totalNodes < 1500 ? 'PASS' : 'REVIEW'}`, out);
  log(`  Max depth < 32: ${maxDepth < 32 ? 'PASS' : 'REVIEW'}`, out);
});

// ============================================================
// EXAMPLE 11 — Common Gotchas
// Story: At Flipkart's bootcamp, new hires get the top 5 DOM mistakes
// checklist on Day 1.
// ============================================================

// WHY: Knowing mistakes upfront saves hours of debugging.

// Gotcha 1: Script in <head> without defer -> document.body is null
// Gotcha 2: childNodes includes whitespace text nodes; use children
// Gotcha 3: getElementsBy* is LIVE; querySelectorAll is STATIC
// Gotcha 4: innerHTML += destroys event listeners on existing children
// Gotcha 5: Reading offsetHeight in a DOM-writing loop = layout thrashing

document.getElementById('btn-gotcha-demo').addEventListener('click', () => {
  const out = 'output-11';
  document.getElementById(out).textContent = '';

  const target = document.getElementById('inspect-target');

  log('--- Demo: childNodes vs children ---', out);
  log(`target.childNodes.length: ${target.childNodes.length} (includes whitespace text nodes!)`, out);
  log(`target.children.length: ${target.children.length} (only element nodes)`, out);
  log('', out);

  log('childNodes contents:', out);
  target.childNodes.forEach((node, i) => {
    const type = node.nodeType === 1 ? 'ELEMENT' : node.nodeType === 3 ? 'TEXT' : 'COMMENT';
    const val = node.nodeType === 3 ? `"${node.nodeValue.replace(/\n/g, '\\n').trim() || '(whitespace)'}"` : node.tagName || '';
    log(`  [${i}] ${type}: ${val}`, out);
  });
  log('', out);

  log('children contents:', out);
  Array.from(target.children).forEach((el, i) => {
    log(`  [${i}] <${el.tagName.toLowerCase()}> id="${el.id || ''}"`, out);
  });
  log('', out);
  log('RULE: Use children (not childNodes) unless you need text/comment nodes.', out);
});

// ============================================================
// EXAMPLE 12 — DOM Ready: DOMContentLoaded vs window.onload
// Story: Flipkart's engineers ensure their scripts run only AFTER the
// DOM is fully parsed. DOMContentLoaded fires when HTML is parsed (DOM
// ready). window.onload fires after ALL resources (images, CSS, iframes)
// are loaded. Most interactive scripts use DOMContentLoaded — no need
// to wait for images to start manipulating the DOM.
// ============================================================

// WHY: Running DOM code before the DOM is ready causes null references.

// --- DOMContentLoaded ---
// document.addEventListener('DOMContentLoaded', () => {
//     // DOM is fully parsed. Safe to querySelector, manipulate elements.
//     console.log(document.body); // never null here
// });

// --- window.onload ---
// window.addEventListener('load', () => {
//     // ALL resources loaded. Images have dimensions. CSS applied.
// });

// --- Alternative: <script defer> ---
// <script defer src="app.js"></script>
// defer scripts run after DOM parse, before DOMContentLoaded.

(function() {
  const out = 'output-12';
  const startTime = performance.now();

  document.addEventListener('DOMContentLoaded', () => {
    const dclTime = (performance.now() - startTime).toFixed(2);
    log(`DOMContentLoaded fired at: ${dclTime}ms`, out);
    log('  DOM is fully parsed. Safe to manipulate elements.', out);
    log('', out);
    log('--- DOM Ready Events ---', out);
    log('DOMContentLoaded: DOM parsed, safe to manipulate', out);
    log('window.load: ALL resources loaded (images, CSS)', out);
    log('<script defer>: runs after DOM parse, before DOMContentLoaded', out);
  });

  window.addEventListener('load', () => {
    const loadTime = (performance.now() - startTime).toFixed(2);
    log(`window.load fired at: ${loadTime}ms`, out);
    log('  ALL resources are now loaded.', out);
  });
})();

// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. The DOM is a LIVE tree of objects, not the same as HTML source.
// 2. window = global browser object; document = HTML document;
//    globalThis works in all JS environments.
// 3. Every node has nodeType (1=Element, 3=Text, 8=Comment),
//    nodeName, and nodeValue.
// 4. document.documentElement, .head, .body are instant shortcuts.
// 5. console.dir(element) shows the JS object; console.log() shows HTML.
// 6. Rendering pipeline: HTML -> DOM -> CSSOM -> Render Tree -> Layout
//    -> Paint -> Compositing.
// 7. DOM manipulation is expensive: batch changes, use DocumentFragment,
//    prefer CSS transforms for animations.
// 8. Use .children over .childNodes unless you need text/comment nodes.
// 9. Use DOMContentLoaded or <script defer> to ensure DOM is ready
//    before running your code. Never rely on script placement alone.
// ============================================================

console.log('=== FILE 01 COMPLETE: DOM Introduction ===');
