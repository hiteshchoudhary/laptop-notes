// ============================================================
// FILE 06: EVENT FUNDAMENTALS
// Topic: Understanding browser events and the event-driven programming model
// WHY: Every interaction a user has with a web page — clicking a button,
// hovering over a menu, scrolling through content — fires an event.
// Mastering events is the bridge between static HTML and dynamic apps.
// ============================================================

// --- Helper: log to both console and an on-page output panel ---
function log(msg, targetId) {
  console.log(msg);
  const el = document.getElementById(targetId);
  if (el) el.textContent += msg + '\n';
}


// ============================================================
// EXAMPLE 1 — What Are Events? The BookMyShow Seat Map
// Story: When you open BookMyShow to book a movie ticket, the seat
// selection page is a grid of clickable seats. Every single click,
// hover, and scroll on that page fires a browser event. Without
// events, that seat map would be a lifeless image — no interaction.
// ============================================================

// WHY: Events are the foundation of interactivity. The browser constantly
// watches for user actions and system signals, then notifies your code.

// --- The Event-Driven Programming Model ---
// Traditional programming: code runs top to bottom, sequentially.
// Event-driven programming: code WAITS for something to happen, then responds.

// Think of it like a BookMyShow ticket counter:
//   - The cashier (your code) doesn't run around looking for customers.
//   - The cashier WAITS at the counter.
//   - When a customer arrives (event fires), the cashier responds.

// The three pieces of every event interaction:
//   1. Event Target — the element the event happens on (a seat button)
//   2. Event Type — what happened ("click", "mouseover", "scroll")
//   3. Event Handler — the function that runs in response

function createBookMyShowSeatGrid() {
  const ROWS = 5, COLS = 8, MAX_SEATS = 6;
  const PRICE_MAP = { "Premium": 350, "Executive": 250, "Normal": 150 };
  const container = document.getElementById("seat-container");
  if (!container) return;

  const selectedSeats = new Set();
  const grid = document.createElement("div");
  grid.id = "seat-grid";
  const rowLabels = ["A", "B", "C", "D", "E"];

  for (let r = 0; r < ROWS; r++) {
    for (let c = 1; c <= COLS; c++) {
      const seat = document.createElement("div");
      const seatId = `${rowLabels[r]}${c}`;
      const category = r < 2 ? "Premium" : r < 4 ? "Executive" : "Normal";
      seat.id = seatId;
      seat.className = `seat ${category.toLowerCase()}`;
      seat.textContent = seatId;
      seat.dataset.price = PRICE_MAP[category];
      seat.dataset.category = category;
      // Mark a few as booked for realism
      if ((r === 1 && c === 3) || (r === 2 && c === 5) || (r === 3 && c === 7)) {
        seat.classList.add("booked");
        seat.title = "Already booked";
      }
      grid.appendChild(seat);
    }
  }
  container.appendChild(grid);

  // --- Single delegated click handler on the grid ---
  grid.addEventListener("click", function (event) {
    const seat = event.target;
    if (!seat.classList.contains("seat")) return;
    if (seat.classList.contains("booked")) {
      log("That seat is already booked!", "output-1");
      return;
    }

    const seatId = seat.id;
    const price = parseInt(seat.dataset.price);

    if (selectedSeats.has(seatId)) {
      selectedSeats.delete(seatId);
      seat.classList.remove("selected");
      seat.dispatchEvent(new CustomEvent("seatDeselected", {
        detail: { seatId, price }, bubbles: true
      }));
      log(`Deselected ${seatId} (${seat.dataset.category} - Rs.${price})`, "output-1");
    } else {
      if (selectedSeats.size >= MAX_SEATS) {
        log(`Max ${MAX_SEATS} seats allowed!`, "output-1");
        return;
      }
      selectedSeats.add(seatId);
      seat.classList.add("selected");
      seat.dispatchEvent(new CustomEvent("seatSelected", {
        detail: { seatId, price }, bubbles: true
      }));
      log(`Selected ${seatId} (${seat.dataset.category} - Rs.${price})`, "output-1");
    }
  });

  // --- Hover effects using mouseenter/mouseleave (no child flicker) ---
  grid.addEventListener("mouseover", function (e) {
    if (e.target.classList.contains("seat") &&
        !e.target.classList.contains("selected") &&
        !e.target.classList.contains("booked")) {
      e.target.style.opacity = "0.75";
    }
  });
  grid.addEventListener("mouseout", function (e) {
    if (e.target.classList.contains("seat") &&
        !e.target.classList.contains("selected")) {
      e.target.style.opacity = "1";
    }
  });

  // --- Price calculator listens for custom events ---
  let totalPrice = 0;
  document.addEventListener("seatSelected", (e) => {
    totalPrice += e.detail.price;
    document.getElementById("seat-count").textContent = selectedSeats.size;
    document.getElementById("total-price").textContent = totalPrice;
  });
  document.addEventListener("seatDeselected", (e) => {
    totalPrice -= e.detail.price;
    document.getElementById("seat-count").textContent = selectedSeats.size;
    document.getElementById("total-price").textContent = totalPrice;
  });

  // --- One-time welcome using { once: true } ---
  grid.addEventListener("click", () => {
    log("Welcome to BookMyShow! Select up to 6 seats.", "output-1");
  }, { once: true });
}


// ============================================================
// EXAMPLE 2 — Three Ways to Attach Event Handlers
// Story: BookMyShow's early website in 2007 used inline onclick
// attributes. As the app grew, they migrated to addEventListener
// for better separation of concerns and flexibility.
// ============================================================

// WHY: There are three ways to attach event handlers. Understanding
// all three helps you read legacy code and know why addEventListener wins.

// --- Method 1: Inline HTML Handlers (AVOID) ---
// <button onclick="alert('Seat booked!')">Book Seat A1</button>
// Problems with inline handlers:
// - Mixes HTML structure with JavaScript logic (hard to maintain)
// - Can only attach ONE handler per event per element
// - Hard to debug — errors reference "onclick" attribute, not a file
// - Security risk — similar to eval(), blocked by strict CSP policies

// --- Method 2: DOM Property Handlers (el.onclick) ---
// seatA1.onclick = function () { ... };
// If another part of the code does this, the FIRST handler is gone.
// Only the second handler will ever fire.

// --- Method 3: addEventListener (THE MODERN WAY) ---
// BOTH handlers fire on click. Neither overwrites the other.
// Why addEventListener wins:
// 1. Multiple handlers on the same event — no overwriting
// 2. Control over capturing vs bubbling phase (see File 07)
// 3. Options: { once: true }, { passive: true }, { signal }
// 4. Clean removal with removeEventListener

function setupAttachmentDemo() {
  const btnProp = document.getElementById("btn-property");
  const btnAEL = document.getElementById("btn-addEventListener");
  if (!btnProp || !btnAEL) return;

  // Method 2: Property — second assignment OVERWRITES first
  btnProp.onclick = function () {
    log("Property handler 1 — YOU WILL NEVER SEE THIS (overwritten)", "output-2");
  };
  btnProp.onclick = function () {
    log("Property handler 2 — This REPLACED handler 1", "output-2");
  };

  // Method 3: addEventListener — BOTH fire
  btnAEL.addEventListener("click", function () {
    log("addEventListener handler 1: Highlighting seat", "output-2");
  });
  btnAEL.addEventListener("click", function () {
    log("addEventListener handler 2: Updating price (BOTH fire!)", "output-2");
  });
}


// ============================================================
// EXAMPLE 3 — The Event Object
// Story: When a BookMyShow user clicks a seat, the handler receives
// an Event object packed with details: what was clicked, when, etc.
// ============================================================

// WHY: The Event object is your window into what happened. Key
// properties tell you exactly what, where, when, and how.

// Quick summary of the key distinction:
// target:        WHO was actually clicked (could be any descendant)
// currentTarget: WHO is listening (the element addEventListener was called on)
// These are the same ONLY when the user clicks the listener element directly.

function setupEventInspector() {
  const area = document.getElementById("event-inspector-area");
  if (!area) return;

  area.addEventListener("click", function (event) {
    document.getElementById("info-type").textContent = event.type;
    document.getElementById("info-target").textContent =
      `<${event.target.tagName.toLowerCase()}> .${event.target.className}`;
    document.getElementById("info-currentTarget").textContent =
      `<${event.currentTarget.tagName.toLowerCase()}> #${event.currentTarget.id}`;
    document.getElementById("info-timestamp").textContent =
      event.timeStamp.toFixed(2) + " ms since page load";
    document.getElementById("info-trusted").textContent = event.isTrusted;
    document.getElementById("info-coords").textContent =
      `(${event.clientX}, ${event.clientY})`;
  });
}


// ============================================================
// EXAMPLE 4 — Common Mouse Event Types
// Story: On BookMyShow, hovering over a seat shows a tooltip with
// the price, clicking selects it, double-clicking opens seat details.
// Different mouse events power different interactions.
// ============================================================

// WHY: Understanding subtle differences (mouseover vs mouseenter)
// prevents bugs that plague even experienced developers.

// --- Click Events ---
// click, dblclick, contextmenu (right-click)

// --- Hover Events (WITH bubbling) ---
// mouseover/mouseout — fire on entering/leaving element OR its children
//   Causes flickering with nested elements!

// --- Hover Events (WITHOUT bubbling) ---
// mouseenter/mouseleave — fire ONLY on the element itself
//   Smooth, no child re-triggers. Preferred for hover effects.

function setupMouseDemo() {
  const area = document.getElementById("mouse-demo-area");
  if (!area) return;

  area.addEventListener("click", () => log("click fired", "output-4"));
  area.addEventListener("dblclick", () => log("dblclick fired", "output-4"));
  area.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    log("contextmenu (right-click) fired — default prevented", "output-4");
  });
  area.addEventListener("mouseenter", () => log("mouseenter (no bubble, smooth)", "output-4"));
  area.addEventListener("mouseleave", () => log("mouseleave (no bubble, smooth)", "output-4"));
  area.addEventListener("mousedown", () => log("mousedown (instant on press)", "output-4"));
  area.addEventListener("mouseup", () => log("mouseup (on release)", "output-4"));
}


// ============================================================
// EXAMPLE 5 — removeEventListener and the Function Reference Trap
// Story: BookMyShow had a memory leak: users on long sessions saw
// slowdown because old listeners were never removed. The fix?
// Named functions and proper removeEventListener calls.
// ============================================================

// WHY: removeEventListener requires the EXACT same function reference.
// Anonymous functions CANNOT be removed — always use named references.

// IMPORTANT: The capture flag must also match!
// seat.addEventListener("click", handler, true);       // capture phase
// seat.removeEventListener("click", handler, true);    // must also pass true
// seat.removeEventListener("click", handler);          // FAILS — capture mismatch

function setupRemoveListenerDemo() {
  const addBtn = document.getElementById("add-listener-btn");
  const removeBtn = document.getElementById("remove-listener-btn");
  const testBtn = document.getElementById("test-click-btn");
  if (!addBtn || !removeBtn || !testBtn) return;

  // Named function — can be removed
  function handleTestClick() {
    log("Listener fired! (named function reference)", "output-5");
  }

  addBtn.addEventListener("click", function () {
    testBtn.addEventListener("click", handleTestClick);
    log("Listener ADDED to test button (named ref: handleTestClick)", "output-5");
  });

  removeBtn.addEventListener("click", function () {
    testBtn.removeEventListener("click", handleTestClick);
    log("Listener REMOVED from test button (same ref: handleTestClick)", "output-5");
  });
}


// ============================================================
// EXAMPLE 6 — { once: true } and { passive: true } Options
// Story: BookMyShow shows a tutorial overlay on first visit. "Got It"
// fires once. The mobile seat map uses passive listeners for smooth
// scrolling on budget Android phones.
// ============================================================

// WHY: { once: true } auto-removes after first fire. { passive: true }
// boosts scroll/touch performance by telling the browser you won't
// call preventDefault().

// --- { once: true } — Auto-remove after first fire ---
// After this fires, the listener is automatically removed.
// Subsequent clicks do nothing. No memory leak. No double-dismiss.

// --- { passive: true } — Performance boost for scroll/touch ---
// { passive: true } tells the browser: "I promise NOT to call
// preventDefault(). You can scroll immediately without waiting."

// NOTE: Chrome 56+ sets passive: true by DEFAULT for touchstart
// and touchmove on document-level listeners. Explicit is still clearer.

function setupOncePassiveDemo() {
  const onceBtn = document.getElementById("once-btn");
  const status = document.getElementById("once-status");
  const scrollArea = document.getElementById("passive-scroll-area");
  const scrollPos = document.getElementById("scroll-pos");
  if (!onceBtn) return;

  onceBtn.addEventListener("click", function () {
    log("FIRED! This handler auto-removes. Click again — nothing happens.", "output-6");
    status.textContent = "Fired (removed)";
    status.classList.add("fired");
  }, { once: true });

  if (scrollArea) {
    scrollArea.addEventListener("scroll", function () {
      if (scrollPos) scrollPos.textContent = `Scroll Y: ${this.scrollTop}`;
      log(`Passive scroll: ${this.scrollTop}px`, "output-6");
    }, { passive: true });
  }
}


// ============================================================
// EXAMPLE 7 — event.preventDefault()
// Story: BookMyShow's "Apply Coupon" form validates client-side
// before submitting. Without preventDefault, the form reloads
// the page, losing the user's seat selections.
// ============================================================

// WHY: preventDefault stops default browser behavior (form submit,
// link navigation) without stopping event propagation.

// --- Common Defaults You Might Prevent ---
// <form> submit  → page reload
// <a> click      → navigate to href
// contextmenu    → browser right-click menu
// Ctrl+S keydown → browser save dialog

function setupPreventDefaultDemo() {
  const form = document.getElementById("coupon-form");
  const link = document.getElementById("prevented-link");
  const ctxArea = document.getElementById("context-menu-area");
  if (!form) return;

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    const code = document.getElementById("coupon-input").value;
    if (code.length !== 8) {
      log(`Invalid coupon "${code}". Must be exactly 8 characters. (Page did NOT reload!)`, "output-7");
    } else {
      log(`Validating coupon: ${code}... (preventDefault stopped page reload)`, "output-7");
    }
  });

  if (link) {
    link.addEventListener("click", function (event) {
      event.preventDefault();
      log("Link click prevented! Would have navigated to: " + this.href, "output-7");
    });
  }

  if (ctxArea) {
    ctxArea.addEventListener("contextmenu", function (event) {
      event.preventDefault();
      log(`Custom context menu at (${event.clientX}, ${event.clientY}) — browser menu blocked`, "output-7");
    });
  }
}


// ============================================================
// EXAMPLE 8 — Custom Events and dispatchEvent
// Story: BookMyShow's seat module and price calculator are built
// by separate teams. When a seat is selected, the seat module
// dispatches a custom event that the price module listens for.
// Loose coupling, clean architecture.
// ============================================================

// WHY: Custom events let different parts of your app communicate
// without tight coupling — the pub-sub pattern built into the DOM.

// NOTE: Dispatched events have isTrusted = false. User events = true.

function setupCustomEventDemo() {
  const dispatchBtn = document.getElementById("dispatch-btn");
  const progBtn = document.getElementById("dispatch-programmatic");
  if (!dispatchBtn) return;

  // Listener (separate module)
  document.addEventListener("seatBooked", function (event) {
    log(`[Price Module] Received seatBooked event!`, "output-8");
    log(`  detail: seatId=${event.detail.seatId}, price=Rs.${event.detail.price}`, "output-8");
    log(`  isTrusted: ${event.isTrusted} (script-generated = false)`, "output-8");
    log(`  bubbles: ${event.bubbles}`, "output-8");
  });

  // Dispatcher
  dispatchBtn.addEventListener("click", function () {
    const event = new CustomEvent("seatBooked", {
      detail: { seatId: "A5", price: 350, category: "Premium" },
      bubbles: true,
      cancelable: true
    });
    log("[Seat Module] Dispatching custom 'seatBooked' event...", "output-8");
    this.dispatchEvent(event);
  });

  // Programmatic click (isTrusted = false)
  if (progBtn) {
    progBtn.addEventListener("click", function (event) {
      log(`Programmatic click — isTrusted: ${event.isTrusted}`, "output-8");
    });
  }
}


// ============================================================
// EXAMPLE 9 — AbortController for Bulk Listener Cleanup
// Story: BookMyShow's SPA removes ALL seat listeners when navigating
// away. AbortController makes this a one-liner.
// ============================================================

// WHY: AbortController is the modern way to bulk-remove listeners.
// One abort() call removes every listener that shares the signal.

function setupAbortControllerDemo() {
  const setupBtn = document.getElementById("setup-abort-btn");
  const abortBtn = document.getElementById("abort-btn");
  const testBtn = document.getElementById("abort-test-btn");
  if (!setupBtn) return;

  let controller = null;

  setupBtn.addEventListener("click", function () {
    if (controller) {
      log("Listeners already set up. Abort first.", "output-9");
      return;
    }
    controller = new AbortController();

    testBtn.addEventListener("click", () => {
      log("Click handler fired (via signal)", "output-9");
    }, { signal: controller.signal });

    testBtn.addEventListener("mouseenter", () => {
      log("Mouseenter handler fired (via signal)", "output-9");
    }, { signal: controller.signal });

    document.addEventListener("keydown", (e) => {
      log(`Keydown: ${e.key} (via signal)`, "output-9");
    }, { signal: controller.signal });

    log("3 listeners set up (click, mouseenter, keydown) — all sharing one signal", "output-9");
  });

  abortBtn.addEventListener("click", function () {
    if (!controller) {
      log("No listeners to abort. Set up first.", "output-9");
      return;
    }
    controller.abort();
    controller = null;
    log("controller.abort() called — ALL 3 listeners removed instantly!", "output-9");
  });
}


// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. Events are the core of web interactivity — every user action
//    fires an event that your code can listen for and respond to.
//
// 2. Always use addEventListener over inline/property handlers.
//    It supports multiple handlers, options, and clean removal.
//
// 3. The Event object (type, target, currentTarget, timeStamp)
//    tells you everything about what happened.
//
// 4. mouseenter/mouseleave over mouseover/mouseout to avoid flicker.
//
// 5. removeEventListener needs the SAME function reference.
//
// 6. { once: true } auto-removes after first fire.
//
// 7. { passive: true } boosts scroll/touch performance.
//
// 8. event.preventDefault() stops default browser behavior.
//
// 9. Custom events (CustomEvent + dispatchEvent) enable loose coupling.
//
// 10. AbortController: one abort() removes all linked listeners.
// ============================================================


// --- Initialize all demos on DOM ready ---
document.addEventListener("DOMContentLoaded", function () {
  createBookMyShowSeatGrid();
  setupAttachmentDemo();
  setupEventInspector();
  setupMouseDemo();
  setupRemoveListenerDemo();
  setupOncePassiveDemo();
  setupPreventDefaultDemo();
  setupCustomEventDemo();
  setupAbortControllerDemo();

  console.log("=== FILE 06 COMPLETE: Event Fundamentals ===");
  console.log("Next: 07-event-propagation");
});
