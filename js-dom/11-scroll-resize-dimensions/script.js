// ============================================================
// FILE 11: SCROLL, RESIZE & ELEMENT DIMENSIONS
// Topic: Measuring elements, tracking scroll position, and responding to viewport changes
// WHY: Every modern e-commerce site like Myntra relies on scroll-driven
// interactions — infinite scroll, sticky headers, progress bars, and responsive
// layout adjustments. Mastering dimensions and scroll APIs is essential for
// building performant, polished user interfaces.
// ============================================================

// --- Helper: Log to console AND an on-page output element ---
function log(msg, targetId) {
    console.log(msg);
    const el = document.getElementById(targetId);
    if (el) el.textContent += msg + '\n';
}

// ============================================================
// EXAMPLE 1 — Element Dimensions: Measuring a Myntra Product Card
// Story: Myntra's product listing shows hundreds of cards in a grid.
// The layout engine must know exact dimensions of each card — padding,
// borders, scrollable overflow — to calculate cards per row and when
// to trigger the next page load.
// ============================================================

// WHY: JavaScript provides three dimension property pairs on every element.
// Each measures something different. Confusing them is a common bug.

// --- offsetWidth / offsetHeight ---
// TOTAL outer size: content + padding + border + scrollbar

// --- clientWidth / clientHeight ---
// INNER usable area: content + padding (NO border, NO scrollbar)

// --- scrollWidth / scrollHeight ---
// TOTAL scrollable content size, even the part hidden by overflow.

// Quick comparison:
// -------------------------------------------------------
// Property         | Includes padding | border | scrollbar
// -------------------------------------------------------
// offsetWidth/H    |       Yes        |  Yes   |   Yes
// clientWidth/H    |       Yes        |  No    |   No
// scrollWidth/H    |       Yes        |  No    |   No (total)
// -------------------------------------------------------

const demoCard = document.getElementById('demo-card');
const cardDesc = document.getElementById('card-description');

demoCard.addEventListener('click', () => {
    const logTarget = 'dimensions-log';
    const el = document.getElementById(logTarget);
    if (el) el.textContent = ''; // Clear previous

    log('=== Product Card Dimensions ===', logTarget);
    log(`offsetWidth: ${demoCard.offsetWidth}px  (content + padding + border)`, logTarget);
    log(`offsetHeight: ${demoCard.offsetHeight}px`, logTarget);
    log(`clientWidth: ${demoCard.clientWidth}px  (content + padding, NO border)`, logTarget);
    log(`clientHeight: ${demoCard.clientHeight}px`, logTarget);
    log(`scrollWidth: ${demoCard.scrollWidth}px  (total scrollable)`, logTarget);
    log(`scrollHeight: ${demoCard.scrollHeight}px`, logTarget);

    log('', logTarget);
    log('=== Description Overflow Check ===', logTarget);
    log(`desc.scrollHeight: ${cardDesc.scrollHeight}px (total content)`, logTarget);
    log(`desc.clientHeight: ${cardDesc.clientHeight}px (visible area)`, logTarget);

    // --- Practical: Check if an element has scrollable overflow ---
    const hasVerticalScroll = cardDesc.scrollHeight > cardDesc.clientHeight;
    log(`Vertical scroll needed? ${hasVerticalScroll}`, logTarget);

    // Show/hide "Read More" based on overflow
    const readMoreBtn = document.getElementById('read-more-btn');
    if (readMoreBtn) readMoreBtn.style.display = hasVerticalScroll ? 'inline' : 'none';

    // --- offsetLeft / offsetTop ---
    // Position relative to the offsetParent (nearest positioned ancestor).
    log('', logTarget);
    log(`offsetLeft: ${demoCard.offsetLeft}px, offsetTop: ${demoCard.offsetTop}px`, logTarget);
    log(`offsetParent: ${demoCard.offsetParent?.tagName || 'null'}`, logTarget);
});

log('Click the product card to measure dimensions.', 'dimensions-log');


// ============================================================
// EXAMPLE 2 — getBoundingClientRect(): Positioning a Quick-View Popup
// Story: When a Myntra user hovers a product card, a "Quick View" popup
// appears near the card. Positioning needs exact viewport-relative
// coordinates so the popup doesn't go off-screen on small mobile devices.
// ============================================================

// WHY: getBoundingClientRect() returns position and size relative to the
// VIEWPORT. Unlike offsetTop/offsetLeft (relative to offset parent),
// viewport coords are what you need for UI positioning.

// IMPORTANT: These values CHANGE as the user scrolls!
// For document-relative position, add scroll offset:
// const absoluteTop = rect.top + window.scrollY;

const popup = document.getElementById('quick-view-popup');
const popupTitle = document.getElementById('popup-title');
const popupRect = document.getElementById('popup-rect');

function positionQuickView(cardElement, popupElement) {
    const rect = cardElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;

    if (rect.right + 240 < viewportWidth) {
        popupElement.style.left = rect.right + 10 + 'px';
    } else {
        popupElement.style.left = (rect.left - 250) + 'px';
    }
    popupElement.style.top = rect.top + 'px';
    popupElement.style.display = 'block';

    popupTitle.textContent = cardElement.dataset.name || 'Product';
    popupRect.textContent =
        `top: ${rect.top.toFixed(0)}  left: ${rect.left.toFixed(0)}\n` +
        `bottom: ${rect.bottom.toFixed(0)}  right: ${rect.right.toFixed(0)}\n` +
        `width: ${rect.width.toFixed(0)}  height: ${rect.height.toFixed(0)}`;

    log(`Popup positioned for "${cardElement.dataset.name}" at left:${popupElement.style.left} top:${popupElement.style.top}`, 'rect-log');
}

document.querySelectorAll('.mini-card').forEach(card => {
    card.addEventListener('mouseenter', () => positionQuickView(card, popup));
    card.addEventListener('mouseleave', () => { popup.style.display = 'none'; });
});


// ============================================================
// EXAMPLE 3 — Window and Document Dimensions
// Story: Myntra's responsive layout checks viewport size to decide between
// mobile (< 768px), tablet (768-1024px), or desktop (> 1024px) layouts.
// They also need full document height for scroll progress calculations.
// ============================================================

// WHY: Multiple ways to get "window size" mean different things.
// Using the wrong one causes subtle bugs on mobile (URL bar changes height).

// window.innerWidth / innerHeight — viewport including scrollbar
// document.documentElement.clientWidth/Height — usable content area (no scrollbar)
// document.documentElement.scrollHeight — total document height (with overflow)

function getLayoutMode() {
    const width = document.documentElement.clientWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
}

function updateDimensionPanel() {
    document.getElementById('layout-mode').textContent = getLayoutMode();
    document.getElementById('win-inner-w').textContent = window.innerWidth + 'px';
    document.getElementById('win-inner-h').textContent = window.innerHeight + 'px';
    document.getElementById('doc-client-w').textContent = document.documentElement.clientWidth + 'px';
    document.getElementById('doc-client-h').textContent = document.documentElement.clientHeight + 'px';
    document.getElementById('doc-scroll-h').textContent = document.documentElement.scrollHeight + 'px';
}

updateDimensionPanel();


// ============================================================
// EXAMPLE 4 — Scroll Position: Tracking How Far the User Scrolled
// Story: Myntra tracks scroll depth — past the header (120px) triggers
// sticky compact header, 80% down triggers pre-loading of next product
// batch. Scroll position is the foundation of these features.
// ============================================================

// WHY: Knowing scroll position enables sticky headers, infinite scroll,
// progress indicators, and scroll-triggered animations.

// window.scrollY — vertical scroll offset (also window.pageYOffset)
// window.scrollX — horizontal scroll offset

function getScrollTop() {
    return window.scrollY || document.documentElement.scrollTop || 0;
}

function getScrollPercentage() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight;
    const viewportHeight = window.innerHeight;
    const scrollableDistance = docHeight - viewportHeight;
    if (scrollableDistance <= 0) return 100;
    return Math.min(100, Math.round((scrollTop / scrollableDistance) * 100));
}


// ============================================================
// EXAMPLE 5 — Programmatic Scrolling: scrollTo, scrollBy, scrollIntoView
// Story: Myntra has "Back to Top", "Jump to Reviews", and category
// navigation. All need programmatic scroll — smooth, responsive, native.
// ============================================================

// WHY: Programmatic scrolling powers navigation, "back to top" buttons,
// anchor links, and scroll-to-element features with smooth behavior.

// window.scrollTo(0, 0);               // Jump to top
// window.scrollTo({ top: 0, behavior: 'smooth' }); // Smooth to top
// window.scrollBy(0, 200);             // Scroll down 200px relative
// window.scrollBy({ top: -100, behavior: 'smooth' }); // Smooth up 100px

// element.scrollIntoView();                         // Jump to element
// element.scrollIntoView({ behavior: 'smooth' });   // Smooth scroll
// element.scrollIntoView({ behavior: 'smooth', block: 'center' }); // Center it

document.getElementById('scroll-to-top').addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    log('scrollTo({ top: 0, behavior: "smooth" })', 'scroll-prog-log');
});

document.getElementById('scroll-down-200').addEventListener('click', () => {
    window.scrollBy({ top: 200, behavior: 'smooth' });
    log('scrollBy({ top: 200, behavior: "smooth" })', 'scroll-prog-log');
});

document.getElementById('scroll-to-section-8').addEventListener('click', () => {
    const target = document.getElementById('example-8');
    if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        log('scrollIntoView({ behavior: "smooth", block: "center" }) -> Section 8', 'scroll-prog-log');
    }
});


// ============================================================
// EXAMPLE 6 — Scroll Events and Performance: Throttling
// Story: Myntra listens to scroll for infinite loading. But scroll events
// fire 60+ times/second! Without throttling, expensive DOM measurements
// on every fire caused jank during Big Billion Day sale. Throttling fixed it.
// ============================================================

// WHY: Scroll events fire EXTREMELY frequently. Without throttle/rAF,
// you cause layout thrashing and jank. ALWAYS throttle scroll handlers.

// --- BAD: Unthrottled (runs 60+ times/sec with layout thrashing) ---
// window.addEventListener('scroll', () => {
//     const rect = el.getBoundingClientRect(); // Forces layout recalc!
// });

// --- GOOD: Throttle with requestAnimationFrame (once per frame) ---
function throttleWithRAF(callback) {
    let ticking = false;
    return function (...args) {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(() => {
                callback.apply(this, args);
                ticking = false;
            });
        }
    };
}

// --- Throttle with time interval ---
function throttle(callback, delay) {
    let lastCall = 0;
    return function (...args) {
        const now = Date.now();
        if (now - lastCall >= delay) {
            lastCall = now;
            callback.apply(this, args);
        }
    };
}

// Frame budget at 60fps = ~16.67ms. A 5ms scroll handler eats 30%.
// Throttling keeps the handler to once per frame or less.

let rawScrollCount = 0;
let throttledScrollCount = 0;

window.addEventListener('scroll', () => {
    rawScrollCount++;
    document.getElementById('raw-scroll-count').textContent = rawScrollCount;
}, { passive: true });

const throttledCounter = throttleWithRAF(() => {
    throttledScrollCount++;
    document.getElementById('throttled-scroll-count').textContent = throttledScrollCount;
});

window.addEventListener('scroll', throttledCounter, { passive: true });


// ============================================================
// EXAMPLE 7 — Resize Event and Debouncing
// Story: When a Myntra user rotates their phone or resizes the browser,
// the product grid recalculates column count. Resize fires continuously
// while dragging — we only need one calculation AFTER resizing stops.
// ============================================================

// WHY: Resize fires continuously while dragging. DEBOUNCE waits until
// the user STOPS, then acts once. Different from throttle (ongoing updates).

function debounce(callback, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => callback.apply(this, args), delay);
    };
}

// Throttle: "Run at most once every X ms" — good for scroll
// Debounce: "Run once after X ms of silence" — good for resize

function rebuildProductGrid(mode) {
    const columns = mode === 'mobile' ? 2 : mode === 'tablet' ? 3 : 4;
    document.getElementById('grid-columns').textContent = columns;
    log(`Rebuilding grid with ${columns} columns (${mode} mode)`, 'debounce-log');
}

const handleResize = debounce(() => {
    const mode = getLayoutMode();
    rebuildProductGrid(mode);
    updateDimensionPanel();
    log(`Debounced resize handler fired. Layout: ${mode}`, 'resize-log');
}, 250);

window.addEventListener('resize', handleResize);

// Initial grid columns
rebuildProductGrid(getLayoutMode());


// ============================================================
// EXAMPLE 8 — ResizeObserver: Watching Individual Elements
// Story: Myntra's product card description shows "Read More" only if text
// overflows. Card width changes with grid layout (2-4 columns). Instead
// of window resize + manual checks, ResizeObserver watches each card
// individually — fires only when THAT card's size changes.
// ============================================================

// WHY: Window resize tells you the WINDOW changed. Elements change size
// for many reasons (sidebar toggle, accordion, flex changes). ResizeObserver
// watches the ELEMENT directly.

// Advantages over window resize:
// 1. Fires on ANY layout change affecting the element
// 2. No manual query/check needed
// 3. Browser batches observations per frame
// 4. Works for dynamic content (accordion, sidebar toggle)

const resizableContainer = document.getElementById('resizable-container');
const observedCard = document.getElementById('observed-card');
const observedDesc = document.getElementById('observed-desc');
const resizeReadout = document.getElementById('resize-readout');

const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
        const { width, height } = entry.contentRect;
        resizeReadout.textContent = `Width: ${Math.round(width)}px  Height: ${Math.round(height)}px`;
        log(`ResizeObserver: ${Math.round(width)}x${Math.round(height)}`, 'resize-observer-log');

        // Check if description overflows
        if (observedDesc) {
            const overflows = observedDesc.scrollHeight > observedDesc.clientHeight;
            const btn = document.getElementById('observed-read-more');
            if (btn) btn.style.display = overflows ? 'inline' : 'none';
        }
    }
});

// Entry properties: entry.target, entry.contentRect,
// entry.borderBoxSize, entry.contentBoxSize
resizeObserver.observe(resizableContainer);
log('ResizeObserver watching resizable container. Drag the handle to resize.', 'resize-observer-log');


// ============================================================
// EXAMPLE 9 — Sticky Header Pattern
// Story: Myntra's header has a large logo, search bar, and nav links.
// Scrolling past 120px reveals a compact sticky header with just search
// and cart. Saves space while keeping key actions accessible.
// ============================================================

// WHY: Complex sticky headers (class toggling, compact mode) need
// JavaScript scroll detection beyond CSS position:sticky.

const SCROLL_THRESHOLD = 120;
let isSticky = false;

const compactHeader = document.getElementById('compact-header');
const scrollPercentBadge = document.getElementById('scroll-percent-badge');


// ============================================================
// EXAMPLE 10 — Scroll Progress Bar
// Story: Myntra Studio (blog section) shows a thin pink progress bar at
// the top indicating how much of an article has been read. Encourages
// scrolling and gives a sense of progress through long content.
// ============================================================

// WHY: Scroll progress bars combine scroll tracking with dynamic styling.

const progressBar = document.getElementById('scroll-progress-bar');


// ============================================================
// CENTRALIZED SCROLL HANDLER — Example 12 Pattern
// Story: Combining sticky header, scroll progress, back-to-top, and
// scroll telemetry into one cohesive experience. Best practice: ONE
// centralized throttled scroll handler instead of four separate ones.
// ============================================================

// WHY: Real apps combine many scroll features. Centralizing them in one
// handler prevents performance conflicts and layout thrashing.

// { passive: true } tells browser this handler won't call preventDefault().
// Browser can start scrolling immediately without waiting. Always use
// passive for scroll/touch events when you don't need preventDefault().
//
// PERFORMANCE TIP: Reading scroll/dimension values is cheap.
// Writing styles is what triggers reflow. Batch reads before writes:
// BAD:  read -> write -> read -> write (layout thrashing)
// GOOD: read -> read -> write -> write (one reflow)

const backToTop = document.getElementById('back-to-top');

const masterScrollHandler = throttleWithRAF(() => {
    const scrollY = window.scrollY;
    const pct = getScrollPercentage();

    // --- Sticky Header ---
    if (scrollY > SCROLL_THRESHOLD && !isSticky) {
        isSticky = true;
        compactHeader.classList.add('visible');
        log('Sticky header activated at scroll: ' + scrollY, 'sticky-log');
    } else if (scrollY <= SCROLL_THRESHOLD && isSticky) {
        isSticky = false;
        compactHeader.classList.remove('visible');
        log('Sticky header deactivated', 'sticky-log');
    }

    // --- Progress Bar ---
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollable > 0) {
        progressBar.style.width = Math.min(100, (scrollY / scrollable) * 100) + '%';
    }

    // --- Scroll Percent Badge ---
    scrollPercentBadge.textContent = pct + '%';

    // --- Scroll Telemetry ---
    document.getElementById('scroll-y').textContent = scrollY + 'px';
    document.getElementById('scroll-pct').textContent = pct + '%';

    const distToBottom = document.documentElement.scrollHeight - (scrollY + window.innerHeight);
    document.getElementById('near-bottom').textContent = distToBottom < 300 ? 'Yes!' : 'No';

    // --- Back to Top ---
    if (scrollY > 400) {
        backToTop.classList.add('visible');
    } else {
        backToTop.classList.remove('visible');
    }
});

window.addEventListener('scroll', masterScrollHandler, { passive: true });

backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    log('Back-to-top clicked', 'master-log');
});

log('Centralized scroll handler initialized (sticky + progress + back-to-top + telemetry).', 'master-log');


// ============================================================
// EXAMPLE 11 — Infinite Scroll Skeleton
// Story: Myntra loads 40 products at a time. Near-bottom scroll triggers
// next batch fetch with skeleton loading placeholders. Replaced "Load More"
// button, increasing engagement by 30%.
// ============================================================

// WHY: Infinite scroll = scroll position detection + async loading +
// skeleton placeholders. Foundational e-commerce pattern.

const infiniteList = document.getElementById('infinite-product-list');
const skeletonContainer = document.getElementById('skeleton-container');
const infiniteStatus = document.getElementById('infinite-status');

const productNames = [
    'Cotton Kurta', 'Slim Jeans', 'Polo T-Shirt', 'Running Shoes',
    'Leather Belt', 'Aviator Sunglasses', 'Denim Jacket', 'Formal Trousers',
    'Sneakers', 'Wool Sweater', 'Silk Saree', 'Sports Watch'
];

let infinitePage = 1;
let infiniteLoading = false;
let infiniteHasMore = true;

function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card mini-card';
    card.innerHTML = `
        <div class="card-image"></div>
        <h3>${product.name}</h3>
        <p class="price">Rs. ${product.price.toLocaleString('en-IN')}</p>
    `;
    return card;
}

function loadProducts(page) {
    const products = [];
    for (let i = 0; i < 8; i++) {
        products.push({
            id: (page - 1) * 8 + i + 1,
            name: productNames[Math.floor(Math.random() * productNames.length)],
            price: Math.floor(Math.random() * 4000) + 500
        });
    }
    return products;
}

// Load initial products
loadProducts(1).forEach(p => infiniteList.appendChild(createProductCard(p)));

function setupInfiniteScroll() {
    const threshold = 300;

    function isNearBottom() {
        const distToBottom = document.documentElement.scrollHeight - (window.scrollY + window.innerHeight);
        return distToBottom < threshold;
    }

    const handleScroll = throttle(async () => {
        if (infiniteLoading || !infiniteHasMore) return;
        if (isNearBottom()) {
            infiniteLoading = true;
            infinitePage++;
            log(`Loading page ${infinitePage}...`, 'infinite-log');

            skeletonContainer.style.display = 'grid';
            infiniteStatus.textContent = 'Loading more products...';

            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 1200));

            const products = loadProducts(infinitePage);
            products.forEach(p => {
                infiniteList.appendChild(createProductCard(p));
                log(`  Added: ${p.name} - Rs.${p.price}`, 'infinite-log');
            });

            skeletonContainer.style.display = 'none';

            if (infinitePage >= 5) {
                infiniteHasMore = false;
                infiniteStatus.textContent = 'All products loaded!';
                log('All products loaded. No more pages.', 'infinite-log');
            } else {
                infiniteStatus.textContent = '';
                log(`Page ${infinitePage} loaded.`, 'infinite-log');
            }

            infiniteLoading = false;
        }
    }, 200);

    window.addEventListener('scroll', handleScroll, { passive: true });
    return {
        destroy: () => { window.removeEventListener('scroll', handleScroll); },
        reset: () => { infinitePage = 1; infiniteHasMore = true; infiniteLoading = false; }
    };
}

const infiniteScroll = setupInfiniteScroll();
log('Infinite scroll initialized. Scroll to bottom to load more.', 'infinite-log');


// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. Three dimension pairs: offsetWidth (total box), clientWidth (inner usable),
//    scrollWidth (total scrollable content). Know which to use when.
//
// 2. getBoundingClientRect() gives VIEWPORT-relative position. Add scrollY/scrollX
//    for document-relative position.
//
// 3. window.innerWidth includes scrollbar. document.documentElement.clientWidth
//    gives the actual content area width.
//
// 4. ALWAYS throttle scroll handlers using requestAnimationFrame or a timer.
//    Unthrottled scroll handlers are the #1 cause of scroll jank.
//
// 5. Use debounce for resize events (act once after user stops) and throttle
//    for scroll events (keep responding while scrolling).
//
// 6. ResizeObserver watches individual elements — better than window resize
//    for most use cases (sidebar toggling, accordion expanding, etc.).
//
// 7. Use { passive: true } on scroll/touch event listeners when you don't
//    call preventDefault(). Significantly improves scroll performance.
//
// 8. scrollIntoView({ behavior: 'smooth' }) is the simplest way to scroll
//    to an element. Use scrollTo() for absolute positions.
//
// 9. Combine multiple scroll-dependent features into ONE throttled handler
//    to minimize layout thrashing and event listener overhead.
//
// 10. Infinite scroll = scroll position detection + async data loading +
//     skeleton placeholders. Always track isLoading and hasMore state.
