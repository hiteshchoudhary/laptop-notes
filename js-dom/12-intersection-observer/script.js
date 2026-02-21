// ============================================================
// FILE 12: INTERSECTION OBSERVER
// Topic: Efficiently detecting when elements enter or exit the viewport
// WHY: IntersectionObserver is the modern, performant way to implement lazy
// loading, infinite scroll, and scroll-triggered animations. Amazon India uses
// it to load product images only when visible, saving bandwidth for millions
// of users on Jio 4G networks across tier-2 and tier-3 cities.
// ============================================================

// --- Helper: Log to console AND an on-page output element ---
function log(msg, targetId) {
    console.log(msg);
    const el = document.getElementById(targetId);
    if (el) el.textContent += msg + '\n';
}

log('=== IntersectionObserver Tutorial ===', 'log-1');


// ============================================================
// EXAMPLE 1 — What Is IntersectionObserver? The Amazon India Story
// Story: Amazon India serves customers from Mumbai with fiber broadband
// to villages in Rajasthan with spotty 4G. Loading all 200 product images
// upfront wastes bandwidth and slows the page. IntersectionObserver detects
// which cards are VISIBLE and loads only those images. Result: 40% faster
// page load on slow networks.
// ============================================================

// WHY: Before IntersectionObserver, developers used scroll handlers with
// getBoundingClientRect() — expensive because it forces layout recalculation
// on EVERY scroll frame. IntersectionObserver is asynchronous and browser-optimized.

// --- The old way (DON'T do this) ---
// window.addEventListener('scroll', () => {
//     document.querySelectorAll('img[data-src]').forEach(img => {
//         const rect = img.getBoundingClientRect(); // Forces layout 60x/sec!
//         if (rect.top < window.innerHeight) img.src = img.dataset.src;
//     });
// });

// --- The new way: browser does geometry math efficiently ---
// Your callback only fires when elements ACTUALLY enter or exit the viewport.

log('IntersectionObserver replaces scroll+getBoundingClientRect for visibility detection.', 'log-1');
log('Async, browser-optimized, no layout thrashing.', 'log-1');


// ============================================================
// EXAMPLE 2 — Creating Your First IntersectionObserver
// Story: Amazon India's product listing has a grid of cards, each starting
// with a grey placeholder. As the user scrolls, cards entering the viewport
// fade in with the actual product image. One observer watches all cards.
// ============================================================

// WHY: The constructor takes a callback and options object.
// The callback receives an array of IntersectionObserverEntry objects.

// NOTE: When you first observe(el), the callback fires IMMEDIATELY with
// the current intersection state. This is by design.

const basicObserver = new IntersectionObserver((entries, observerRef) => {
    entries.forEach(entry => {
        const card = entry.target;
        const status = card.querySelector('.obs-status');

        if (entry.isIntersecting) {
            card.classList.add('visible');
            if (status) status.textContent = `Visible (${(entry.intersectionRatio * 100).toFixed(0)}%)`;
            log(`${card.dataset.label}: VISIBLE (ratio: ${entry.intersectionRatio.toFixed(2)})`, 'log-2');
        } else {
            card.classList.remove('visible');
            if (status) status.textContent = 'Not visible';
            log(`${card.dataset.label}: NOT VISIBLE`, 'log-2');
        }
    });
}, { threshold: [0, 0.5, 1] });

document.querySelectorAll('.observe-target').forEach(card => basicObserver.observe(card));


// ============================================================
// EXAMPLE 3 — Observer Options: root, rootMargin, threshold
// Story: Amazon's product detail page has a scrollable "Similar Products"
// carousel inside a div. They need to detect visibility WITHIN that
// container and start loading images 200px BEFORE they become visible.
// ============================================================

// WHY: Three options control WHERE, WHEN, and HOW MUCH visibility
// triggers the callback. Understanding them unlocks advanced patterns.

// root: null = viewport (default). Set to scrollable element.
// rootMargin: Expand/shrink detection area (CSS margin format)
//   '200px 0px' — Detect 200px BEFORE entering viewport (preload!)
//   '0px'       — exact viewport boundary
//   '-100px 0px' — only when 100px INSIDE viewport
//   '0px 0px -50%' — when crossing viewport middle
// threshold: How much must be visible to trigger callback
//   0   = 1 pixel visible (default)
//   0.5 = 50% visible
//   1   = 100% visible
//   Array = fire at each level

const thresholdFill = document.getElementById('threshold-fill');
const thresholdRatio = document.getElementById('threshold-ratio');

const thresholdObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach(entry => {
            const ratio = entry.intersectionRatio;
            thresholdFill.style.width = (ratio * 100) + '%';
            thresholdRatio.textContent = ratio.toFixed(2);
            log(`Threshold target: ratio=${ratio.toFixed(2)}, isIntersecting=${entry.isIntersecting}`, 'log-3');
        });
    },
    {
        root: null,
        rootMargin: '0px',
        threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
    }
);

const thresholdTarget = document.getElementById('threshold-target');
if (thresholdTarget) thresholdObserver.observe(thresholdTarget);


// ============================================================
// EXAMPLE 4 — IntersectionObserverEntry Deep Dive
// Story: Amazon's analytics team tracks which products users ACTUALLY SEE
// (not just scroll past). A product counts as "viewed" only if 50% visible
// for at least 1 second. The entry object provides all geometric data.
// ============================================================

// WHY: The entry object has many properties. Knowing each helps build
// precise visibility logic.

// entry.target             — the observed DOM element
// entry.isIntersecting     — boolean: currently visible?
// entry.intersectionRatio  — 0 to 1: fraction visible
// entry.boundingClientRect — element's full bounding box
// entry.intersectionRect   — visible portion's bounding box
// entry.rootBounds         — root element's bounding box
// entry.time               — DOMHighResTimeStamp

const viewTimers = new Map();

const viewabilityTracker = new IntersectionObserver(
    (entries) => {
        entries.forEach(entry => {
            const productId = entry.target.dataset.productId;
            const badge = document.getElementById('badge-' + productId);

            if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
                if (!viewTimers.has(productId)) {
                    viewTimers.set(productId, setTimeout(() => {
                        log(`Product ${productId} viewed for 1 second!`, 'log-4');
                        if (badge) {
                            badge.textContent = 'Viewed!';
                            badge.classList.add('viewed');
                        }
                        viewTimers.delete(productId);
                        viewabilityTracker.unobserve(entry.target);
                    }, 1000));
                }
            } else {
                if (viewTimers.has(productId)) {
                    clearTimeout(viewTimers.get(productId));
                    viewTimers.delete(productId);
                }
            }
        });
    },
    { threshold: [0, 0.5] }
);

document.querySelectorAll('.viewable').forEach(card => viewabilityTracker.observe(card));
log('Viewability tracker: products must be 50% visible for 1 second.', 'log-4');


// ============================================================
// EXAMPLE 5 — Observer Lifecycle: observe, unobserve, disconnect
// Story: Amazon's infinite scroll loads new product batches. Each batch
// needs lazy-load observation. Once an image loads, no need to keep
// observing — it wastes memory. On pages with thousands of cards,
// proper cleanup prevents memory leaks.
// ============================================================

// WHY: Observers consume memory per observed element. Failing to unobserve
// loaded elements on long-running pages causes memory leaks.

// observer.observe(el)      — start watching an element
// observer.unobserve(el)    — stop watching ONE element
// observer.disconnect()     — stop watching ALL elements
// observer.takeRecords()    — get pending undelivered entries

let allObserversActive = true;

document.getElementById('disconnect-all').addEventListener('click', () => {
    basicObserver.disconnect();
    viewabilityTracker.disconnect();
    allObserversActive = false;
    log('All observers DISCONNECTED. Elements will no longer be tracked.', 'log-5');
});

document.getElementById('reconnect-all').addEventListener('click', () => {
    if (!allObserversActive) {
        document.querySelectorAll('.observe-target').forEach(c => basicObserver.observe(c));
        document.querySelectorAll('.viewable').forEach(c => viewabilityTracker.observe(c));
        allObserversActive = true;
        log('Observers RECONNECTED.', 'log-5');
    }
});


// ============================================================
// EXAMPLE 6 — Lazy Loading Images: data-src to src
// Story: Amazon's product page has 200+ images (~50KB each = 10MB total).
// Lazy loading only loads ~20 visible images (1MB). On Jio 4G (avg 10Mbps),
// this cuts initial load from 8 seconds to under 1 second.
// ============================================================

// WHY: Most common IntersectionObserver use case. Pattern: hold real URL
// in data-src, swap to src when visible.

// HTML: <img data-src="/images/product.jpg" src="/images/placeholder.png" class="lazy-image" />
// CSS:  .lazy-image { opacity: 0; transition: opacity 0.3s; }
//       .lazy-image.loaded { opacity: 1; }

const imageObserver = new IntersectionObserver(
    (entries, observer) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            const img = entry.target;
            const realSrc = img.dataset.src;
            if (realSrc) {
                img.src = realSrc;
                img.removeAttribute('data-src');
                img.addEventListener('load', () => {
                    img.classList.add('loaded');
                    log('Loaded: ' + realSrc, 'log-6');
                });
                img.addEventListener('error', () => {
                    img.alt = 'Failed to load';
                    log('Failed: ' + realSrc, 'log-6');
                });
            }
            observer.unobserve(img); // Done with this image
        });
    },
    { rootMargin: '200px 0px', threshold: 0 } // Preload 200px early
);

document.querySelectorAll('.lazy-gallery .lazy-image').forEach(img => imageObserver.observe(img));
log('Lazy image observer active with rootMargin: 200px (preload).', 'log-6');


// ============================================================
// EXAMPLE 7 — Native loading="lazy" vs IntersectionObserver
// Story: Amazon's team debated native lazy loading vs IntersectionObserver.
// For most images, native works great. But for the "Deal of the Day"
// carousel with custom animations and preloading, they needed IO's control.
// ============================================================

// WHY: Use native loading="lazy" when possible (simplest). Use IO when
// you need custom rootMargin, animations, analytics, or non-image content.

// Native: <img src="/product.jpg" loading="lazy" alt="Product" /> — that's it!

// Use IntersectionObserver when you need:
// 1. Custom preload distance (rootMargin)
// 2. Fade-in or other visual effects
// 3. Non-image lazy loading (video, iframes, components)
// 4. Threshold-based logic (e.g., 50% visible)
// 5. Scrollable container (not viewport)
// 6. Analytics tracking on visibility

if ('loading' in HTMLImageElement.prototype) {
    log('Browser supports native loading="lazy"', 'log-7');
} else {
    log('No native lazy loading — IntersectionObserver required', 'log-7');
}
log('This tutorial uses IntersectionObserver for full control (rootMargin + fade-in).', 'log-7');


// ============================================================
// EXAMPLE 8 — Infinite Scroll with Sentinel Element
// Story: Amazon's search loads 20 products at a time. An invisible
// "sentinel" div at the bottom triggers loading when it enters the
// viewport. Cleaner and more reliable than scroll position math.
// ============================================================

// WHY: Sentinel + IntersectionObserver is the modern infinite scroll pattern.
// No scroll math, no throttling needed.

const infiniteList = document.getElementById('infinite-product-list');
const loadingIndicator = document.getElementById('loading-indicator');
const infiniteStatus = document.getElementById('infinite-status');
let infinitePage = 0;
let infiniteLoading = false;
let infiniteHasMore = true;

function createInfiniteCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
        <div class="card-image"></div>
        <h3>${product.name}</h3>
        <p class="price">Rs. ${product.price.toLocaleString('en-IN')}</p>
    `;
    return card;
}

const sentinelObserver = new IntersectionObserver(
    async (entries) => {
        const entry = entries[0];
        if (!entry.isIntersecting || infiniteLoading || !infiniteHasMore) return;

        infiniteLoading = true;
        infinitePage++;
        log(`Sentinel visible! Loading page ${infinitePage}...`, 'log-8');
        loadingIndicator.style.display = 'flex';

        // Simulated API response
        await new Promise(r => setTimeout(r, 1000));

        const data = {
            products: Array.from({ length: 8 }, (_, i) => ({
                id: (infinitePage - 1) * 8 + i + 1,
                name: `Product ${(infinitePage - 1) * 8 + i + 1}`,
                price: Math.floor(Math.random() * 5000) + 500
            })),
            hasMore: infinitePage < 5
        };

        data.products.forEach(p => {
            infiniteList.appendChild(createInfiniteCard(p));
            log(`  Added: ${p.name} - Rs.${p.price}`, 'log-8');
        });

        infiniteHasMore = data.hasMore;
        loadingIndicator.style.display = 'none';

        if (!infiniteHasMore) {
            sentinelObserver.disconnect();
            infiniteStatus.textContent = 'All products loaded.';
            log('All products loaded.', 'log-8');
        }

        infiniteLoading = false;
    },
    { rootMargin: '400px 0px' } // Start loading 400px before sentinel visible
);

const sentinel = document.getElementById('scroll-sentinel');
if (sentinel) sentinelObserver.observe(sentinel);


// ============================================================
// EXAMPLE 9 — Section Highlighting: Active Nav Link on Scroll
// Story: Amazon's product detail page has sticky nav — "Overview",
// "Specifications", "Reviews", "Q&A". The matching link highlights as
// the user scrolls through each section. IntersectionObserver makes this
// simple without scroll position calculations.
// ============================================================

// WHY: Scroll spy with IntersectionObserver is simpler and more performant
// than scroll position math.

let currentSection = null;
const navLinks = document.querySelectorAll('.nav-link');

const scrollSpyObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && currentSection !== entry.target.id) {
                currentSection = entry.target.id;
                navLinks.forEach(l => l.classList.remove('active'));
                const activeLink = document.querySelector(`.nav-link[data-section="${currentSection}"]`);
                if (activeLink) activeLink.classList.add('active');
                log('Active section: ' + currentSection, 'log-9');
            }
        });
    },
    { rootMargin: '0px 0px -60% 0px', threshold: 0 }
    // Negative bottom margin: section must be in TOP portion of viewport
);

document.querySelectorAll('main > section').forEach(s => scrollSpyObserver.observe(s));


// ============================================================
// EXAMPLE 10 — Fade-In Animation on Scroll
// Story: Amazon's Great Indian Festival sale page has promotional banners
// that fade in and slide up as the user scrolls. Each card gets a staggered
// delay for a sequential animation effect.
// ============================================================

// WHY: IntersectionObserver is perfect for triggering CSS animations
// when elements enter the viewport.

// CSS:
// .fade-in { opacity: 0; transform: translateY(30px); transition: all 0.6s ease; }
// .fade-in.visible { opacity: 1; transform: translateY(0); }

const fadeInObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            entry.target.classList.add('visible');

            // Stagger child animations
            entry.target.querySelectorAll('.animate-child').forEach((child, i) => {
                child.style.transitionDelay = `${i * 100}ms`;
                child.classList.add('visible');
            });

            fadeInObserver.unobserve(entry.target); // Animate only once
            log('Faded in: ' + (entry.target.textContent?.slice(0, 30).trim() || 'element'), 'log-10');
        });
    },
    { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
);

document.querySelectorAll('.fade-in').forEach(el => fadeInObserver.observe(el));


// ============================================================
// EXAMPLE 11 — Performance: One Observer for Many Elements
// Story: Amazon's search shows 200+ products. Creating one observer per
// product wastes resources. One observer watches all 200 — the browser
// batches geometry calculations efficiently.
// ============================================================

// WHY: IntersectionObserver is designed for one-to-many observation.
// The browser optimizes internal calculations. Per-element observers
// defeat this optimization.

let observedTotal = 0;
let loadedTotal = 0;
let batchTotal = 0;

const efficientObserver = new IntersectionObserver(
    (entries) => {
        batchTotal++;
        document.getElementById('batch-count').textContent = batchTotal;
        log(`Batch ${batchTotal}: ${entries.length} elements changed`, 'log-11');

        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            loadedTotal++;
            document.getElementById('loaded-count').textContent = loadedTotal;
            efficientObserver.unobserve(entry.target);
        });
    },
    { rootMargin: '200px 0px' }
);

// GOOD: One observer, many elements
// BAD: Separate observer per element
// cards.forEach(card => { new IntersectionObserver(...).observe(card); });
// 200 observers for 200 elements — wasteful!

// Observe all product cards and gallery items for stats
document.querySelectorAll('.product-card, .gallery-card, .gallery-item').forEach(el => {
    efficientObserver.observe(el);
    observedTotal++;
});
document.getElementById('observed-count').textContent = observedTotal;
log(`Efficient observer tracking ${observedTotal} elements.`, 'log-11');


// ============================================================
// EXAMPLE 12 — Practical: Image Gallery with Lazy Loading + Fade-In
// Story: Amazon's product detail page has 10-15 images per product.
// Only first 2-3 load immediately. Rest lazy-load with fade-in as user
// scrolls. Combines lazy loading and animation in one observer.
// ============================================================

// WHY: Production-ready implementation combining multiple patterns.

// CSS:
// .gallery-item img { opacity: 0; transform: scale(0.98); transition: all 0.5s ease; }
// .gallery-item--loaded img { opacity: 1; transform: scale(1); }

const galleryObserver = new IntersectionObserver(
    (entries, observer) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            const container = entry.target;
            const img = container.querySelector('img');
            const realSrc = img?.dataset.src;
            if (!img || !realSrc) { observer.unobserve(container); return; }

            log(`Loading gallery image: ${realSrc}`, 'log-12');
            const tempImg = new Image();

            tempImg.onload = () => {
                img.src = realSrc;
                img.removeAttribute('data-src');
                requestAnimationFrame(() => container.classList.add('gallery-item--loaded'));
                log(`Loaded and faded in: ${realSrc}`, 'log-12');
            };

            tempImg.onerror = () => {
                container.classList.add('gallery-item--error');
                log(`Error loading: ${realSrc}`, 'log-12');
            };

            tempImg.src = realSrc;
            observer.unobserve(container);
        });
    },
    { rootMargin: '300px 0px', threshold: 0.1 }
);

document.querySelectorAll('.gallery-item').forEach(item => galleryObserver.observe(item));


// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. IntersectionObserver asynchronously detects when elements enter/exit
//    the viewport (or a scrollable container). Replaces scroll + getBoundingClientRect().
//
// 2. Constructor: new IntersectionObserver(callback, { root, rootMargin, threshold }).
//    root=null means viewport. rootMargin expands detection. threshold sets visibility level.
//
// 3. Callback receives IntersectionObserverEntry array. Key: isIntersecting (boolean),
//    intersectionRatio (0-1), target (element).
//
// 4. Lifecycle: observe() to start, unobserve() to stop one, disconnect() to stop all.
//    Always unobserve after handling (e.g., lazy load).
//
// 5. Lazy loading: data-src -> src when visible. rootMargin preloads before visible.
//
// 6. Native loading="lazy" is simpler but less flexible. Use IO for custom margins,
//    animations, analytics, or non-image content.
//
// 7. Infinite scroll: sentinel element at bottom. When it intersects, load more.
//
// 8. Scroll spy: rootMargin '0px 0px -60% 0px' highlights nav links by section.
//
// 9. ONE observer for MANY elements. Browser batches geometry calculations.
//
// 10. Fade-in: add CSS class when isIntersecting. Combine with CSS transitions.
