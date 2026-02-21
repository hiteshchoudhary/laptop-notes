// ============================================================
// FILE 22: HISTORY API AND CLIENT-SIDE ROUTING
// Topic: Navigate between views without page reloads using the History API
// WHY: Modern apps like MakeMyTrip show flights, hotels, trains in different
// "pages" but never reload. The URL changes, back button works, links are
// shareable. This magic is the History API + client-side routing —
// essential for building any Single Page Application (SPA).
// ============================================================

// ============================================================
// HELPER: log to console AND to an on-page output element
// ============================================================
function log(msg, targetId) {
    console.log(msg);
    const el = document.getElementById(targetId);
    if (el) el.textContent += msg + '\n';
}

// ============================================================
// EXAMPLE 1 — MakeMyTrip Tab Navigation
// Story: MakeMyTrip lets users switch between flights, hotels, trains tabs.
// Each tab updates the URL (/flights, /hotels, /trains) so users can share
// links and use the back button. But the page never reloads — header, footer,
// and search state persist. This seamless experience is the History API.
// ============================================================

// NOTE: History API and routing code runs in the BROWSER.

// ============================================================
// SECTION 1: window.location — Understanding the Current URL
// ============================================================

// WHY: Before changing URLs, you must understand how they are structured.

// URL: https://www.makemytrip.com/flights/search?from=DEL&to=BOM#results
// location.href      = full URL string
// location.protocol  = "https:"
// location.hostname  = "www.makemytrip.com"
// location.pathname  = "/flights/search"
// location.search    = "?from=DEL&to=BOM"
// location.hash      = "#results"
// location.origin    = "https://www.makemytrip.com"

function updateURLInspector() {
    document.getElementById('url-href').textContent = window.location.href;
    document.getElementById('url-protocol').textContent = window.location.protocol;
    document.getElementById('url-hostname').textContent = window.location.hostname;
    document.getElementById('url-pathname').textContent = window.location.pathname;
    document.getElementById('url-search').textContent = window.location.search || '(none)';
    document.getElementById('url-hash').textContent = window.location.hash || '(none)';
    document.getElementById('url-origin').textContent = window.location.origin;
}

updateURLInspector();

// ============================================================
// SECTION 2: Navigating with location Methods
// ============================================================

// WHY: These cause FULL PAGE RELOADS — the "old way." Understanding them
// shows why the History API is better.

// location.assign(url)  — navigate + add history (back works)
// location.replace(url) — navigate + replace history (no back)
// location.reload()     — refresh the page
// Use replace() after login: user should not "back" to login page

// ============================================================
// EXAMPLE 2 — Zomato Restaurant Tabs
// Story: Early Zomato used hash routing. Clicking "Menu", "Photos", or
// "Reviews" tabs changed the URL from #menu to #photos to #reviews. The
// page never reloaded and the hash change was captured by JavaScript.
// This was the simplest form of client-side routing.
// ============================================================

// ============================================================
// SECTION 3: Hash-Based Routing
// ============================================================

// WHY: Hash (#...) is never sent to the server — purely client-side.
// No server config needed. Still used in some apps.

// window.location.hash = '#reviews';  // URL becomes ...#reviews (no reload)
// const tabName = window.location.hash.substring(1); // 'reviews'

// Limitations: ugly URLs (/app#/flights), poor SEO, hash meant for anchors

// ============================================================
// SECTION 4: History API — The Modern Approach
// ============================================================

// WHY: History API changes the URL path (not just hash) without reloading.
// Clean URLs (/flights, /hotels), SEO-friendly. Used by React Router, Vue Router.

// --- history.pushState(state, title, url) ---
// Changes URL without reload, adds new history entry (back button works)

// --- history.replaceState(state, title, url) ---
// Same but REPLACES current entry (no new back entry)
// Use case: updating URL with search filters/pagination

// ============================================================
// DOM: SPA Tab Navigation with pushState
// ============================================================

const tabBtns = document.querySelectorAll('.tab-btn');
const views = document.querySelectorAll('.view');

// Map route paths to view IDs
const routeViewMap = {
    '/flights': 'view-flights',
    '/hotels': 'view-hotels',
    '/trains': 'view-trains',
    '/about': 'view-about',
};

function showView(route, fromPopstate) {
    const viewId = routeViewMap[route] || 'view-404';

    // Update active tab
    tabBtns.forEach(function (btn) {
        btn.classList.toggle('active', btn.dataset.route === route);
    });

    // Show the matching view, hide others
    views.forEach(function (v) {
        v.classList.toggle('active', v.id === viewId);
    });

    // Push to history unless this came from popstate (back/forward)
    if (!fromPopstate) {
        const state = { route: route, timestamp: Date.now() };
        history.pushState(state, '', route);
        log('pushState -> URL: ' + route + '  (state: ' + JSON.stringify(state) + ')', 'nav-log');
    } else {
        log('popstate  -> URL: ' + route + '  (back/forward)', 'nav-log');
    }

    updateURLInspector();
    updateHistoryLength();
}

// Tab click handlers
tabBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
        showView(btn.dataset.route, false);
    });
});

// ============================================================
// SECTION 5: popstate Event — Back/Forward Button
// ============================================================

// WHY: pushState adds entries, but you must HANDLE back/forward clicks.
// Fires when: user clicks Back/Forward, history.back/forward/go()
// Does NOT fire when: pushState/replaceState is called
// event.state = the state object from pushState (null for initial page)

window.addEventListener('popstate', function (event) {
    const route = event.state ? event.state.route : '/flights';
    showView(route, true);
    log('popstate event fired. state: ' + JSON.stringify(event.state), 'history-log');
});

// ============================================================
// SECTION 6: History Navigation Methods
// ============================================================

// WHY: Programmatic back/forward for custom navigation buttons.
// history.back()    — same as browser Back button
// history.forward() — same as browser Forward button
// history.go(-2)    — go back 2 entries
// history.go(0)     — reload current page
// history.length    — total entries in session history

document.getElementById('btn-back').addEventListener('click', function () {
    history.back();
    log('history.back() called', 'history-log');
});

document.getElementById('btn-forward').addEventListener('click', function () {
    history.forward();
    log('history.forward() called', 'history-log');
});

document.getElementById('btn-go-minus2').addEventListener('click', function () {
    history.go(-2);
    log('history.go(-2) called', 'history-log');
});

function updateHistoryLength() {
    document.getElementById('history-length').textContent = history.length;
}
updateHistoryLength();

// ============================================================
// SECTION 7: State Object
// ============================================================

// WHY: Store metadata with each history entry. When user presses back,
// you get the state back — no need to re-parse the URL.

// const flightState = {
//     section: 'flights',
//     searchParams: { from: 'DEL', to: 'BOM', passengers: 2 },
//     scrollPosition: 450  // Remember scroll position
// };
// history.pushState(flightState, '', '/flights/search?from=DEL&to=BOM');
// On popstate: window.scrollTo(0, event.state.scrollPosition);

// Can contain: strings, numbers, arrays, objects, Date
// Cannot contain: functions, DOM elements, class instances
// Size limit: ~640KB per entry

// Search Flights button demo — pushState with search params
document.getElementById('btn-search-flights').addEventListener('click', function () {
    const state = {
        route: '/flights',
        searchParams: { from: 'DEL', to: 'BOM', date: '2025-03-15' }
    };
    history.pushState(state, '', '/flights/search?from=DEL&to=BOM&date=2025-03-15');
    log('pushState -> /flights/search?from=DEL&to=BOM&date=2025-03-15', 'nav-log');
    updateURLInspector();
    updateHistoryLength();
});

// ============================================================
// EXAMPLE 3 — BigBasket Product Browsing
// Story: BigBasket lets you browse categories and individual products. Each
// product has a URL like /product/amul-butter. The app matches URL patterns
// to decide what to render — this pattern matching is the core of a router.
// ============================================================

// ============================================================
// SECTION 8: URL and URLSearchParams
// ============================================================

// WHY: Real apps have complex URLs with query strings. These APIs parse safely.

// URL Constructor example:
// const url = new URL('https://www.makemytrip.com/flights/search?from=DEL&to=BOM&date=2025-03-15#results');
// url.origin   -> 'https://www.makemytrip.com'
// url.pathname -> '/flights/search'
// url.search   -> '?from=DEL&to=BOM&date=2025-03-15'

// URLSearchParams example:
// const params = new URLSearchParams('from=DEL&to=BOM');
// params.get('from')  -> 'DEL'
// params.has('to')    -> true
// params.set('class', 'business');
// params.append('passengers', '2');
// params.delete('date');
// params.toString()   -> 'from=DEL&to=BOM&class=business&passengers=2'

// Multiple values with same key:
// filters.append('airline', 'IndiGo');
// filters.append('airline', 'Air India');
// filters.getAll('airline') -> ['IndiGo', 'Air India']

// ============================================================
// DOM: URLSearchParams Builder
// ============================================================

const currentParams = new URLSearchParams();
const builtUrlEl = document.getElementById('built-url');

function updateBuiltUrl() {
    const str = currentParams.toString();
    builtUrlEl.textContent = str ? '?' + str : '(empty)';
}

document.getElementById('btn-add-param').addEventListener('click', function () {
    const key = document.getElementById('param-key').value.trim();
    const val = document.getElementById('param-val').value.trim();
    if (!key) return;
    currentParams.append(key, val);
    updateBuiltUrl();
    log('append("' + key + '", "' + val + '") -> ?' + currentParams.toString(), 'params-log');
    document.getElementById('param-key').value = '';
    document.getElementById('param-val').value = '';
});

document.getElementById('btn-clear-params').addEventListener('click', function () {
    // URLSearchParams has no clear() — recreate
    for (const key of Array.from(currentParams.keys())) {
        currentParams.delete(key);
    }
    updateBuiltUrl();
    log('Cleared all params', 'params-log');
});

// ============================================================
// SECTION 9: Route Pattern Matching — /product/:id
// ============================================================

// WHY: SPAs match URL patterns like /product/:id. This is how framework routers work.

function matchRoute(pattern, path) {
    const paramNames = [];
    const regexStr = pattern.replace(/:([a-zA-Z]+)/g, function (_, name) {
        paramNames.push(name);
        return '([^/]+)';
    });
    const match = path.match(new RegExp('^' + regexStr + '$'));
    if (!match) return null;
    const params = {};
    paramNames.forEach(function (name, i) { params[name] = match[i + 1]; });
    return params;
}

// Route patterns to test against
const testPatterns = [
    '/product/:id',
    '/category/:cat/product/:id',
    '/',
    '/about',
];

document.getElementById('btn-test-route').addEventListener('click', function () {
    const path = document.getElementById('route-test-input').value.trim();
    if (!path) return;

    log('\nTesting path: "' + path + '"', 'route-match-log');

    let matched = false;
    testPatterns.forEach(function (pattern) {
        const result = matchRoute(pattern, path);
        if (result) {
            log('  MATCH: ' + pattern + ' -> ' + JSON.stringify(result), 'route-match-log');
            matched = true;
        }
    });
    if (!matched) {
        log('  No pattern matched.', 'route-match-log');
    }
});

// ============================================================
// SECTION 10: Building a Simple SPA Router
// ============================================================

// WHY: Combine History API + URL parsing + route matching into a working router.

class SPARouter {
    constructor() {
        this.routes = [];
        this.notFoundHandler = null;
    }

    on(pattern, handler) {
        const paramNames = [];
        const regexStr = pattern.replace(/:([a-zA-Z]+)/g, function (_, name) {
            paramNames.push(name);
            return '([^/]+)';
        });
        this.routes.push({
            pattern: pattern,
            regex: new RegExp('^' + regexStr + '$'),
            paramNames: paramNames,
            handler: handler
        });
        return this;
    }

    notFound(handler) { this.notFoundHandler = handler; return this; }

    navigate(path) {
        log('[Router] Navigate: ' + path, 'router-log');
        this.handleRoute(path);
    }

    handleRoute(path) {
        const parts = path.split('?');
        const pathname = parts[0];
        const query = new URLSearchParams(parts[1] || '');

        for (var i = 0; i < this.routes.length; i++) {
            var route = this.routes[i];
            var match = pathname.match(route.regex);
            if (match) {
                var params = {};
                route.paramNames.forEach(function (n, idx) {
                    params[n] = decodeURIComponent(match[idx + 1]);
                });
                log('[Router] Matched: ' + route.pattern + ', params: ' + JSON.stringify(params), 'router-log');
                route.handler({ params: params, query: query, path: pathname });
                return;
            }
        }
        if (this.notFoundHandler) {
            log('[Router] 404: ' + path, 'router-log');
            this.notFoundHandler({ path: pathname });
        }
    }
}

// ============================================================
// SECTION 11: Practical — Mini SPA with Route Handlers
// ============================================================

// WHY: Let us use the router to build a MakeMyTrip-like SPA.

const routerViewEl = document.getElementById('router-view');
const miniRouter = new SPARouter();

miniRouter
    .on('/', function (ctx) {
        var html = '<strong>HOME:</strong> Welcome to MakeMyTrip!';
        if (ctx.query.get('promo')) html += '<br>PROMO: ' + ctx.query.get('promo');
        routerViewEl.innerHTML = html;
    })
    .on('/about', function () {
        routerViewEl.innerHTML = '<strong>ABOUT:</strong> India\'s leading travel platform. Founded 2000, Gurugram.';
    })
    .on('/product/:id', function (ctx) {
        var products = {
            'goa-resort': { name: 'Goa Beach Resort', price: 'Rs.5,500/night' },
            'kerala-houseboat': { name: 'Kerala Houseboat', price: 'Rs.8,000/night' },
        };
        var p = products[ctx.params.id];
        if (p) {
            routerViewEl.innerHTML = '<strong>PRODUCT:</strong> ' + p.name + ' &mdash; ' + p.price;
            if (ctx.query.get('checkin')) {
                routerViewEl.innerHTML += '<br>Check-in: ' + ctx.query.get('checkin');
            }
        } else {
            routerViewEl.innerHTML = '<strong>Product "' + ctx.params.id + '" not found</strong>';
        }
    })
    .on('/category/:category', function (ctx) {
        routerViewEl.innerHTML = '<strong>CATEGORY:</strong> ' + ctx.params.category.toUpperCase();
    })
    .notFound(function (ctx) {
        routerViewEl.innerHTML = '<strong>404:</strong> "' + ctx.path + '" not found';
    });

document.querySelectorAll('.router-link').forEach(function (btn) {
    btn.addEventListener('click', function () {
        miniRouter.navigate(btn.dataset.path);
    });
});

// ============================================================
// SECTION 12: Server-Side Fallback
// ============================================================

// WHY: When user refreshes /product/goa-resort, browser requests that path
// from server. If server has no file there, user gets 404. Server must
// return index.html for ALL routes.

// Nginx:   try_files $uri $uri/ /index.html;
// Express: app.get("*", (req, res) => res.sendFile("index.html"));
// Apache:  RewriteRule ^(.*)$ /index.html [L]

// ============================================================
// SECTION 13: Route Guards
// ============================================================

// WHY: Check conditions before allowing navigation (auth, permissions).

// function demonstrateGuards() {
//     const isLoggedIn = false;
//     const routes = {
//         '/': { view: 'Home', auth: false },
//         '/bookings': { view: 'Bookings', auth: true },
//         '/login': { view: 'Login', auth: false },
//     };
//     function navigate(path) {
//         const route = routes[path];
//         if (!route) { console.log('[Guard] 404'); return; }
//         if (route.auth && !isLoggedIn) {
//             console.log('[Guard] ' + path + ' requires login -> /login');
//             // Use replaceState so "back" won't loop
//             navigate('/login');
//             return;
//         }
//         console.log('[Guard] Rendering: ' + route.view);
//     }
// }

// ============================================================
// SECTION 14: Hash vs History API Comparison
// ============================================================

// Hash:    /app#/flights | No server config | Poor SEO | No state
// History: /flights      | Server fallback  | Good SEO | State object
// Use Hash for simple apps. Use History API for production SPAs.

// ============================================================
// KEY TAKEAWAYS
// ============================================================

(function () {
    var t = 'takeaways-log';
    log('=== KEY TAKEAWAYS ===', t);
    log('', t);
    log(' 1. window.location gives every URL part: pathname, search, hash, origin.', t);
    log(' 2. location.assign() navigates with history; replace() without. Use', t);
    log('    replace() after login redirects.', t);
    log(' 3. Hash routing (#/page) needs no server config but URLs are ugly.', t);
    log(' 4. history.pushState(state, "", url) changes URL without reload and', t);
    log('    adds a history entry — foundation of SPA routing.', t);
    log(' 5. replaceState() updates URL without adding history entry — for', t);
    log('    filters, pagination, and similar updates.', t);
    log(' 6. popstate fires on back/forward clicks. Always listen for it.', t);
    log(' 7. URLSearchParams makes query string parsing easy and safe.', t);
    log(' 8. Route matching converts /product/:id to regex. This is what', t);
    log('    framework routers do under the hood.', t);
    log(' 9. Server MUST return index.html for all routes with History API.', t);
    log('10. Route guards check auth before rendering. Use replaceState for', t);
    log('    redirects to avoid infinite back-button loops.', t);
})();

// Initialize: show flights tab by default
showView('/flights', false);
