// ============================================================
// FILE 25: PERFORMANCE AND DOM OPTIMIZATION
// Topic: Making web apps fast by understanding the browser rendering pipeline
// WHY: Flipkart Lite loads in under 1 second on 2G networks. This is not
// magic — it is deep understanding of how browsers render pages and ruthless
// optimization of every DOM operation. 53% of mobile visitors abandon pages
// taking over 3 seconds. In India, with budget phones and slow networks,
// performance is survival.
// ============================================================

// ============================================================
// HELPER: log to console AND to an on-page output element
// ============================================================
function log(msg, targetId) {
    console.log(msg);
    var el = document.getElementById(targetId);
    if (el) el.textContent += msg + '\n';
}

// ============================================================
// EXAMPLE 1 — Flipkart Lite: The 1-Second PWA
// Story: In 2015, Flipkart shut down their mobile site and went app-only.
// But they missed 60% of users who would not install the app. So they built
// Flipkart Lite — a PWA loading in under 1 second on 2G, works offline,
// uses 1/3 the data. Every DOM access is batched, every image lazy-loaded,
// every reflow eliminated. Time-on-site jumped 70%.
// ============================================================

// NOTE: Performance code runs in BROWSER. Concepts apply to any web app.

// ============================================================
// SECTION 1: The Browser Rendering Pipeline
// ============================================================

// WHY: To optimize, you must understand how HTML/CSS/JS become pixels.

// HTML -> DOM --+
//               +-> Render Tree -> Layout -> Paint -> Composite
// CSS  -> CSSOM +
//
// Changing "width"     -> Layout + Paint + Composite (EXPENSIVE)
// Changing "color"     -> Paint + Composite (MODERATE)
// Changing "transform" -> Composite only (CHEAP — GPU!)

(function () {
    log('=== Browser Rendering Pipeline ===', 'pipeline-log');
    log('HTML -> DOM -> Render Tree -> Layout -> Paint -> Composite', 'pipeline-log');
    log('', 'pipeline-log');
    log('Changing "width"     -> Layout + Paint + Composite (EXPENSIVE)', 'pipeline-log');
    log('Changing "color"     -> Paint + Composite (MODERATE)', 'pipeline-log');
    log('Changing "transform" -> Composite only (CHEAP — GPU!)', 'pipeline-log');
})();

// ============================================================
// SECTION 2: Reflow vs Repaint
// ============================================================

// WHY: Reflow (layout recalculation) is the MOST EXPENSIVE operation.
// Understanding what triggers it is key to fast DOM code.

// --- REFLOW triggers (expensive) ---
// width, height, padding, margin, font-size, display
// Adding/removing DOM elements, resizing window
// READING: offsetWidth, clientHeight, getBoundingClientRect()

// --- REPAINT triggers (moderate) ---
// color, background-color, visibility, box-shadow

// --- COMPOSITE only (cheap — GPU accelerated) ---
// transform, opacity (skip Layout AND Paint!)

// ============================================================
// SECTION 3: Layout Thrashing — The Performance Killer
// ============================================================

// WHY: Interleaving DOM reads and writes forces the browser to recalculate
// layout on EVERY read. In a loop, this is catastrophic.

// --- BAD: Read-write-read-write in loop ---
// for each card: read offsetWidth -> write style.height -> next read forces reflow

// --- GOOD: Batch reads first, then batch writes ---
// Read all widths first -> then write all heights -> 2 reflows total

// ============================================================
// EXAMPLE 2 — Myntra Product Grid
// Story: Myntra shows hundreds of product cards. Each needs equal height.
// Naive code reads each card height and sets it — layout thrashing. By
// batching reads and writes with requestAnimationFrame, they reduced
// layout time from 800ms to 15ms.
// ============================================================

// Create thrash grid cards
var thrashGrid = document.getElementById('thrash-grid');
var NUM_CARDS = 100;
for (var i = 0; i < NUM_CARDS; i++) {
    var card = document.createElement('div');
    card.className = 'thrash-card';
    thrashGrid.appendChild(card);
}

var reflowCountEl = document.getElementById('reflow-count');

document.getElementById('btn-bad-thrash').addEventListener('click', function () {
    var cards = thrashGrid.querySelectorAll('.thrash-card');
    var start = performance.now();

    // BAD: Read-write-read-write loop — forces reflow on EVERY read
    for (var i = 0; i < cards.length; i++) {
        var width = cards[i].offsetWidth;  // READ -> forces reflow
        cards[i].style.height = width + 'px'; // WRITE -> invalidates layout
    }

    var duration = (performance.now() - start).toFixed(2);
    document.getElementById('bad-time').textContent = duration + 'ms';
    reflowCountEl.textContent = NUM_CARDS + ' (one per read-write)';

    log('BAD: ' + NUM_CARDS + ' cards x read-write loop = ~' + NUM_CARDS + ' reflows: ' + duration + 'ms', 'thrash-log');
    updateSpeedup();
});

document.getElementById('btn-good-thrash').addEventListener('click', function () {
    var cards = thrashGrid.querySelectorAll('.thrash-card');
    var start = performance.now();

    // GOOD: Batch ALL reads first, THEN batch all writes
    var widths = [];
    for (var i = 0; i < cards.length; i++) {
        widths.push(cards[i].offsetWidth); // ALL reads
    }
    for (var j = 0; j < cards.length; j++) {
        cards[j].style.height = widths[j] + 'px'; // ALL writes
    }

    var duration = (performance.now() - start).toFixed(2);
    document.getElementById('good-time').textContent = duration + 'ms';
    reflowCountEl.textContent = '2 (one for reads, one for writes)';

    log('GOOD: Batch reads then writes = 2 reflows: ' + duration + 'ms', 'thrash-log');
    updateSpeedup();
});

document.getElementById('btn-reset-thrash').addEventListener('click', function () {
    var cards = thrashGrid.querySelectorAll('.thrash-card');
    for (var i = 0; i < cards.length; i++) {
        cards[i].style.height = '40px';
    }
    document.getElementById('bad-time').textContent = '\u2014';
    document.getElementById('good-time').textContent = '\u2014';
    document.getElementById('speedup').textContent = '\u2014';
    reflowCountEl.textContent = '0';
});

function updateSpeedup() {
    var bad = parseFloat(document.getElementById('bad-time').textContent);
    var good = parseFloat(document.getElementById('good-time').textContent);
    if (!isNaN(bad) && !isNaN(good) && good > 0) {
        document.getElementById('speedup').textContent = (bad / good).toFixed(1) + 'x';
    }
}

// ============================================================
// SECTION 4: requestAnimationFrame for Batch Updates
// ============================================================

// WHY: rAF schedules code before the next paint. Browser batches all DOM
// writes inside rAF into ONE reflow.

// Pattern: Read now -> write in rAF
// const widths = cards.map(c => c.offsetWidth);     // READS (now)
// requestAnimationFrame(() => {
//     cards.forEach((c, i) => c.style.height = widths[i] + 'px'); // WRITES (batched)
// });

// ============================================================
// SECTION 5: GPU-Accelerated Properties
// ============================================================

// WHY: GPU handles transform and opacity without Layout or Paint steps.
// Perfect for smooth 60fps animation even on a Rs.7,000 Redmi phone.

// FAST (composite only): transform, opacity
// SLOW (triggers reflow): top, left, width, height
//
// BAD:  element.style.left = "100px";          // Reflow every frame
// GOOD: element.style.transform = "translateX(100px)"; // GPU, no reflow
//
// will-change: hint to browser. Use sparingly, remove after animation.

// ============================================================
// SECTION 6: DocumentFragment — Batch DOM Insertions
// ============================================================

// WHY: Each appendChild potentially triggers a reflow. DocumentFragment
// is in-memory — build everything there, insert once = one reflow.

var insertContainer = document.getElementById('insert-container');

document.getElementById('btn-bad-insert').addEventListener('click', function () {
    insertContainer.innerHTML = '';
    var start = performance.now();

    // BAD: Individual appends
    for (var i = 0; i < 500; i++) {
        var div = document.createElement('div');
        div.className = 'insert-item';
        insertContainer.appendChild(div);  // Reflow on EVERY append!
    }

    var duration = (performance.now() - start).toFixed(2);
    document.getElementById('bad-insert-time').textContent = duration + 'ms';
    log('BAD: 500 individual appends: ' + duration + 'ms', 'fragment-log');
});

document.getElementById('btn-good-insert').addEventListener('click', function () {
    insertContainer.innerHTML = '';
    var start = performance.now();

    // GOOD: DocumentFragment — all in memory, one insert
    var fragment = document.createDocumentFragment();
    for (var i = 0; i < 500; i++) {
        var div = document.createElement('div');
        div.className = 'insert-item';
        fragment.appendChild(div);  // In memory — no reflow!
    }
    insertContainer.appendChild(fragment); // ONE reflow

    var duration = (performance.now() - start).toFixed(2);
    document.getElementById('good-insert-time').textContent = duration + 'ms';
    log('GOOD: DocumentFragment (500 cards, 1 reflow): ' + duration + 'ms', 'fragment-log');
});

document.getElementById('btn-clear-insert').addEventListener('click', function () {
    insertContainer.innerHTML = '';
    document.getElementById('bad-insert-time').textContent = '\u2014';
    document.getElementById('good-insert-time').textContent = '\u2014';
});

// Alternative: display:none -> modify -> display:block = single reflow

// ============================================================
// SECTION 7: Virtual Scrolling
// ============================================================

// WHY: Flipkart has 10,000+ products. Rendering 10,000 DOM nodes kills
// performance. Virtual scrolling renders only the ~20 visible items.

var TOTAL_ITEMS = 10000;
var ITEM_HEIGHT = 44;
var BUFFER = 5;
var allProducts = [];
for (var p = 0; p < TOTAL_ITEMS; p++) {
    allProducts.push({
        name: 'Product ' + (p + 1),
        price: 'Rs.' + (500 + p * 7).toLocaleString()
    });
}

var viewport = document.getElementById('virtual-viewport');
var spacer = document.getElementById('virtual-spacer');
var content = document.getElementById('virtual-content');
var vDomCount = document.getElementById('v-dom-count');
var vRange = document.getElementById('v-range');
var vMemory = document.getElementById('v-memory');

// Set total height for scrollbar accuracy
spacer.style.height = (TOTAL_ITEMS * ITEM_HEIGHT) + 'px';

function renderVirtualItems() {
    var scrollTop = viewport.scrollTop;
    var viewportHeight = viewport.clientHeight;
    var visibleCount = Math.ceil(viewportHeight / ITEM_HEIGHT);

    var startIdx = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER);
    var endIdx = Math.min(TOTAL_ITEMS - 1, startIdx + visibleCount + BUFFER * 2);

    var html = '';
    for (var i = startIdx; i <= endIdx; i++) {
        html += '<div class="v-item" style="height:' + ITEM_HEIGHT + 'px">' +
            '<span class="v-name">' + allProducts[i].name + '</span>' +
            '<span class="v-price">' + allProducts[i].price + '</span></div>';
    }

    content.innerHTML = html;
    content.style.transform = 'translateY(' + (startIdx * ITEM_HEIGHT) + 'px)';

    var rendered = endIdx - startIdx + 1;
    vDomCount.textContent = rendered;
    vRange.textContent = startIdx + '-' + endIdx;
    vMemory.textContent = Math.round((1 - rendered / TOTAL_ITEMS) * 100) + '%';
}

viewport.addEventListener('scroll', renderVirtualItems);
renderVirtualItems();

log('Virtual scroll: ' + TOTAL_ITEMS + ' items, only ~' + (Math.ceil(320 / ITEM_HEIGHT) + BUFFER * 2) + ' DOM nodes rendered', 'virtual-log');
log('Memory saved: ~' + Math.round((1 - 30 / TOTAL_ITEMS) * 100) + '%', 'virtual-log');

// ============================================================
// EXAMPLE 3 — Nykaa Infinite Scroll
// Story: Nykaa's beauty products page uses infinite scroll. Without
// debouncing, the scroll event fires 100+ times per second, each triggering
// expensive calculations. Debouncing to 150ms reduced CPU usage 80%.
// ============================================================

// ============================================================
// SECTION 8: Debouncing and Throttling
// ============================================================

// WHY: Scroll fires on every pixel (100+ times/sec). Resize fires
// continuously. Without control, handlers cause jank.

// Debounce: wait until user STOPS, then run once
function debounce(fn, delay) {
    var timer = null;
    return function () {
        var context = this;
        var args = arguments;
        if (timer) clearTimeout(timer);
        timer = setTimeout(function () { fn.apply(context, args); timer = null; }, delay);
    };
}

// Throttle: run at most once per interval
function throttle(fn, interval) {
    var lastTime = 0;
    return function () {
        var now = Date.now();
        if (now - lastTime >= interval) {
            lastTime = now;
            fn.apply(this, arguments);
        }
    };
}

// --- Usage examples ---
// window.addEventListener('scroll', throttle(handleScroll, 100));  // Max 10 calls/sec
// input.addEventListener('input', debounce(search, 300));           // Wait until typing stops
// window.addEventListener('resize', debounce(recalcLayout, 200));   // Wait until resize stops

// --- Passive event listeners for scroll (bonus perf tip) ---
// document.addEventListener('scroll', handler, { passive: true });
// Tells browser: "I won't call preventDefault()" — browser can optimize

// DOM: Debounce/Throttle demo
var rawCount = 0;
var debounceCountVal = 0;
var throttleCountVal = 0;

var rawCountEl = document.getElementById('raw-count');
var debounceCountEl = document.getElementById('debounce-count');
var throttleCountEl = document.getElementById('throttle-count');

var debouncedHandler = debounce(function () {
    debounceCountVal++;
    debounceCountEl.textContent = debounceCountVal;
    log('Debounced: fired (total: ' + debounceCountVal + ')', 'debounce-log');
}, 300);

var throttledHandler = throttle(function () {
    throttleCountVal++;
    throttleCountEl.textContent = throttleCountVal;
    log('Throttled: fired (total: ' + throttleCountVal + ')', 'debounce-log');
}, 200);

document.getElementById('debounce-input').addEventListener('input', function () {
    rawCount++;
    rawCountEl.textContent = rawCount;
    debouncedHandler();
    throttledHandler();
});

// ============================================================
// SECTION 9: requestIdleCallback
// ============================================================

// WHY: Non-urgent work (analytics, prefetch) should run when browser is idle.

// requestIdleCallback((deadline) => {
//     while (deadline.timeRemaining() > 0) {
//         processNextAnalyticsEvent();
//     }
//     if (hasMoreWork()) requestIdleCallback(processMore);
// }, { timeout: 2000 }); // Force run within 2s even if not idle

// ============================================================
// SECTION 10: CSS Containment and content-visibility
// ============================================================

// WHY: content-visibility: auto tells the browser to skip rendering off-screen
// elements entirely. Flipkart reduced initial render time 50% with this.

// .product-card {
//   content-visibility: auto;
//   contain-intrinsic-size: 0 320px; /* estimated height for scrollbar */
// }
// Off-screen cards are NOT rendered (skips Layout + Paint)
// When card scrolls into view, browser renders it on demand

// ============================================================
// SECTION 11: Image Optimization
// ============================================================

// WHY: Images are 50-80% of page bytes. Lazy load + responsive = huge savings.
// 1. Native lazy:    <img loading="lazy" ...>
// 2. Responsive:     srcset="img-400.jpg 400w, img-800.jpg 800w"
//                    sizes="(max-width:600px) 100vw, 50vw"
// 3. Modern formats: <picture><source type="image/avif"><source type="image/webp">
//    AVIF: 50% smaller. WebP: 30% smaller than JPEG.
// 4. Set width/height on <img> to prevent CLS

// ============================================================
// SECTION 12: Resource Hints
// ============================================================

// WHY: Start loading critical resources BEFORE browser discovers them naturally.

(function () {
    log('=== Resource Hints ===', 'resource-log');
    log('Preload (this page, critical):', 'resource-log');
    log('  <link rel="preload" href="/fonts/Inter.woff2" as="font">', 'resource-log');
    log('  Use for: fonts, above-the-fold images, critical CSS/JS', 'resource-log');
    log('', 'resource-log');
    log('Prefetch (next page, idle):', 'resource-log');
    log('  <link rel="prefetch" href="/product/123.json">', 'resource-log');
    log('  Use for: resources likely needed on next navigation', 'resource-log');
    log('', 'resource-log');
    log('Preconnect: saves DNS(50ms) + TCP(100ms) + TLS(100ms) = ~250ms', 'resource-log');
})();

// ============================================================
// SECTION 13: Core Web Vitals
// ============================================================

// WHY: Google uses these as ranking factors. Poor scores = lower SEO ranking.

// LCP (Largest Contentful Paint) — Loading
//   Good: <2.5s | Needs work: 2.5-4s | Poor: >4s
//   Fix: preload hero image, use CDN, optimize server response time

// INP (Interaction to Next Paint) — Interactivity
//   Good: <200ms | Needs work: 200-500ms | Poor: >500ms
//   Fix: break long tasks, use web workers, reduce JS bundle size

// CLS (Cumulative Layout Shift) — Visual Stability
//   Good: <0.1 | Needs work: 0.1-0.25 | Poor: >0.25
//   Fix: set img dimensions, use placeholders, avoid dynamic inserts above viewport

document.getElementById('btn-simulate-metrics').addEventListener('click', function () {
    // Simulate realistic metric values with progressive animation
    var lcp = (0.8 + Math.random() * 2.5).toFixed(1);   // 0.8-3.3s
    var inp = Math.round(50 + Math.random() * 350);       // 50-400ms
    var cls = (Math.random() * 0.3).toFixed(2);            // 0.00-0.30

    // LCP
    var lcpBar = document.getElementById('lcp-bar');
    var lcpScore = document.getElementById('lcp-score');
    var lcpPct = Math.min(100, (parseFloat(lcp) / 5) * 100);
    lcpBar.style.width = lcpPct + '%';
    lcpBar.className = 'vital-bar' + (lcp > 4 ? ' poor' : lcp > 2.5 ? ' warning' : '');
    lcpScore.textContent = lcp + 's';
    lcpScore.className = 'vital-score' + (lcp > 4 ? ' poor' : lcp > 2.5 ? ' warning' : '');

    // INP
    var inpBar = document.getElementById('inp-bar');
    var inpScore = document.getElementById('inp-score');
    var inpPct = Math.min(100, (inp / 600) * 100);
    inpBar.style.width = inpPct + '%';
    inpBar.className = 'vital-bar' + (inp > 500 ? ' poor' : inp > 200 ? ' warning' : '');
    inpScore.textContent = inp + 'ms';
    inpScore.className = 'vital-score' + (inp > 500 ? ' poor' : inp > 200 ? ' warning' : '');

    // CLS
    var clsBar = document.getElementById('cls-bar');
    var clsScore = document.getElementById('cls-score');
    var clsPct = Math.min(100, (parseFloat(cls) / 0.4) * 100);
    clsBar.style.width = clsPct + '%';
    clsBar.className = 'vital-bar' + (cls > 0.25 ? ' poor' : cls > 0.1 ? ' warning' : '');
    clsScore.textContent = cls;
    clsScore.className = 'vital-score' + (cls > 0.25 ? ' poor' : cls > 0.1 ? ' warning' : '');

    log('Simulated metrics:', 'metrics-log');
    log('  LCP: ' + lcp + 's ' + (lcp > 4 ? '(POOR)' : lcp > 2.5 ? '(NEEDS WORK)' : '(GOOD)'), 'metrics-log');
    log('  INP: ' + inp + 'ms ' + (inp > 500 ? '(POOR)' : inp > 200 ? '(NEEDS WORK)' : '(GOOD)'), 'metrics-log');
    log('  CLS: ' + cls + ' ' + (cls > 0.25 ? '(POOR)' : cls > 0.1 ? '(NEEDS WORK)' : '(GOOD)'), 'metrics-log');
});

// Measure in code:
// const lcp = new PerformanceObserver((list) => {
//     const e = list.getEntries().at(-1);
//     console.log('LCP:', e.startTime.toFixed(0) + 'ms');
// });
// lcp.observe({ type: 'largest-contentful-paint', buffered: true });

// ============================================================
// SECTION 14: Practical — Optimizing a Slow Product Listing
// ============================================================

// WHY: Apply everything to a real Flipkart-like page, step by step.

// BEFORE: 500 cards, no lazy load, no throttle, animate left/top
// LCP: 6.2s | INP: 450ms | CLS: 0.35 | DOM: 500 nodes

// Step 1 - DocumentFragment: 500 cards, 1 reflow
// Step 2 - Virtual scroll: 500 -> 20 DOM nodes (96% fewer)
// Step 3 - Throttle scroll: 100 calls/s -> 10 calls/s (80% less CPU)
// Step 4 - GPU animations: transform instead of left/top (no reflow)
// Step 5 - Lazy images + WebP + srcset (85% less data)
// Step 6 - Preconnect CDN + preload hero (saves 250ms + 400ms)
// Step 7 - content-visibility: auto (50% faster initial render)

// ============================================================
// SECTION 15: Performance Checklist
// ============================================================

// DOM:  [ ] Batch reads then writes (no thrashing)
//       [ ] DocumentFragment for batch inserts
//       [ ] Virtual scroll for 100+ items
//       [ ] content-visibility: auto for off-screen
// Anim: [ ] Only transform and opacity (GPU)
//       [ ] Never animate top/left/width/height
//       [ ] requestAnimationFrame for JS animation
// Events:[ ] Throttle scroll/resize (100ms)
//       [ ] Debounce input/search (300ms)
//       [ ] requestIdleCallback for non-urgent work
// Images:[ ] loading="lazy" + explicit width/height
//       [ ] WebP/AVIF with fallbacks + srcset
// Load: [ ] Preconnect CDN, preload fonts/hero
//       [ ] Prefetch next-page resources
//       [ ] Code-split JS (load what is needed)

// ============================================================
// KEY TAKEAWAYS
// ============================================================

(function () {
    var t = 'takeaways-log';
    log('=== KEY TAKEAWAYS ===', t);
    log('', t);
    log(' 1. Rendering pipeline: DOM -> CSSOM -> Render Tree -> Layout -> Paint ->', t);
    log('    Composite. Skipping steps = faster rendering.', t);
    log(' 2. Reflow is most expensive. Triggered by geometry changes AND by', t);
    log('    reading layout properties (offsetWidth, getBoundingClientRect).', t);
    log(' 3. Layout thrashing (read-write loop) is the #1 killer. Batch reads', t);
    log('    first, then writes. Use requestAnimationFrame.', t);
    log(' 4. GPU properties (transform, opacity) skip Layout and Paint. Use', t);
    log('    them for animation instead of top/left/width/height.', t);
    log(' 5. DocumentFragment: build in memory, insert once = 1 reflow instead', t);
    log('    of N. Alternative: display:none -> modify -> display:block.', t);
    log(' 6. Virtual scrolling: 10,000 items but only 20 DOM nodes. Massive', t);
    log('    memory and layout savings.', t);
    log(' 7. Throttle scroll (10 calls/s), debounce input (wait until stopped).', t);
    log(' 8. Images: lazy load, set dimensions (prevent CLS), modern formats,', t);
    log('    srcset for responsive sizing.', t);
    log(' 9. Resource hints: preconnect (250ms saved), preload hero (400ms),', t);
    log('    prefetch next-page data.', t);
    log('10. Core Web Vitals: LCP <2.5s, INP <200ms, CLS <0.1. Use', t);
    log('    PerformanceObserver and Lighthouse to measure and improve.', t);
})();
