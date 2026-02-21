// ============================================================
// FILE 07: EVENT PROPAGATION
// Topic: How events travel through the DOM — capturing, target, and bubbling phases
// WHY: When you click a button inside a card inside a list, all three
// elements "see" the event. Understanding propagation order prevents
// mysterious bugs where the wrong handler fires or handlers fire twice.
// ============================================================

// --- Helper: log to both console and an on-page output panel ---
function log(msg, targetId) {
  console.log(msg);
  const el = document.getElementById(targetId);
  if (el) el.textContent += msg + '\n';
}


// ============================================================
// EXAMPLE 1 — Live Propagation Visualizer
// Story: On the Ola app, you see a list of ride options. Each option
// is a card with a "Book Ride" button inside it. Tapping the card
// shows ride details; tapping "Book Ride" initiates booking. But the
// button IS INSIDE the card — so tapping it also taps the card.
// ============================================================

// WHY: Without understanding propagation, clicking "Book Ride" would
// ALSO trigger the card's click handler — opening details AND starting
// a booking simultaneously. A nightmare UX bug.

// ┌─────────────────────────────────────────────────────────────┐
// │   CAPTURING PHASE (1)        BUBBLING PHASE (3)            │
// │   (top → down)               (bottom → up)                 │
// │                                                             │
// │   window          ──┐   ┌──  window                        │
// │   document        ──┤   ├──  document                      │
// │   #ride-list      ──┤   ├──  #ride-list                    │
// │   .ride-card      ──┤   ├──  .ride-card                    │
// │   .book-btn       ──┘   └──  .book-btn                     │
// │                                                             │
// │              TARGET PHASE (2)                               │
// │              (event is AT the .book-btn)                    │
// └─────────────────────────────────────────────────────────────┘

function setupPropagationVisualizer() {
  const grandparent = document.getElementById("grandparent");
  const parent = document.getElementById("parent");
  const child = document.getElementById("child");
  const btn = document.getElementById("target-btn");
  const phaseDisplay = document.getElementById("phase-display");
  if (!grandparent || !btn) return;

  const layers = [grandparent, parent, child];
  const phaseNames = { 1: "CAPTURING", 2: "AT_TARGET", 3: "BUBBLING" };
  let step = 0;

  function clearHighlights() {
    layers.forEach(el => el.classList.remove("capturing", "at-target", "bubbling"));
    btn.classList.remove("at-target");
    phaseDisplay.className = "phase-badge";
    phaseDisplay.textContent = "Click to start";
  }

  function highlightStep(element, phase, delay) {
    setTimeout(() => {
      const cls = phase === 1 ? "capturing" : phase === 2 ? "at-target" : "bubbling";
      element.classList.add(cls);
      phaseDisplay.textContent = `Phase ${phase}: ${phaseNames[phase]}`;
      phaseDisplay.className = `phase-badge ${cls === "at-target" ? "at-target" : cls}`;
    }, delay);
  }

  // Capture phase listeners (fire first, top-down)
  grandparent.addEventListener("click", () => {
    log("1. CAPTURE: grandparent", "output-1");
    highlightStep(grandparent, 1, 0);
  }, true);

  parent.addEventListener("click", () => {
    log("2. CAPTURE: parent", "output-1");
    highlightStep(parent, 1, 0);
  }, true);

  child.addEventListener("click", () => {
    log("3. CAPTURE: child", "output-1");
    highlightStep(child, 1, 0);
  }, true);

  // Target phase
  btn.addEventListener("click", (e) => {
    log(`4. TARGET: button (eventPhase=${e.eventPhase})`, "output-1");
    btn.classList.add("at-target");
    phaseDisplay.textContent = "Phase 2: AT_TARGET";
    phaseDisplay.className = "phase-badge at-target";
  }, true);

  btn.addEventListener("click", (e) => {
    log(`5. TARGET: button (bubble listener, eventPhase=${e.eventPhase})`, "output-1");
  });

  // Bubble phase listeners (fire after, bottom-up)
  child.addEventListener("click", () => {
    log("6. BUBBLE: child", "output-1");
    setTimeout(() => child.classList.add("bubbling"), 0);
  });

  parent.addEventListener("click", () => {
    log("7. BUBBLE: parent", "output-1");
    setTimeout(() => parent.classList.add("bubbling"), 0);
  });

  grandparent.addEventListener("click", () => {
    log("8. BUBBLE: grandparent", "output-1");
    setTimeout(() => grandparent.classList.add("bubbling"), 0);
    // Auto-clear after 2 seconds
    setTimeout(clearHighlights, 2000);
  });

  // Clear on next click
  btn.addEventListener("mousedown", () => {
    clearHighlights();
    document.getElementById("output-1").textContent = "";
  });
}


// ============================================================
// EXAMPLE 2 — The Three Phases of Event Propagation
// Story: Think of Ola's hierarchy. When a complaint (event) arrives,
// it goes from CEO down to support (capturing), the agent handles it
// (target), then the resolution travels back up (bubbling).
// ============================================================

// WHY: Every DOM event goes through three phases. Most developers only
// know about bubbling. Understanding all three gives full control.

function setupPhaseDemo() {
  const runBtn = document.getElementById("run-phase-demo");
  const clearBtn = document.getElementById("clear-phase-demo");
  if (!runBtn) return;

  runBtn.addEventListener("click", function () {
    const output = document.getElementById("output-2");
    output.textContent = "";
    const steps = [
      "Phase 1 — CAPTURING: window → document → html → body → ... → target (top down)",
      "  Event travels DOWN the DOM tree from window to the target element.",
      "  addEventListener(type, fn, true) listens here.",
      "",
      "Phase 2 — TARGET: event is AT the clicked element",
      "  Both capture and bubble listeners fire in REGISTRATION order.",
      "  event.eventPhase === 2",
      "",
      "Phase 3 — BUBBLING: target → ... → body → html → document → window (bottom up)",
      "  Event travels BACK UP. This is the DEFAULT phase.",
      "  addEventListener(type, fn) — no third argument = bubbling.",
    ];
    steps.forEach((line, i) => {
      setTimeout(() => log(line, "output-2"), i * 150);
    });
  });

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      document.getElementById("output-2").textContent = "";
    });
  }
}


// ============================================================
// EXAMPLE 3 — Capturing Phase with addEventListener(type, fn, true)
// Story: Ola's analytics team logs EVERY tap on the ride list —
// even before individual card handlers run. They use a capturing-
// phase listener on the parent container.
// ============================================================

// WHY: By default, addEventListener listens in BUBBLING (phase 3).
// Pass true or { capture: true } to listen in CAPTURING (phase 1).

function setupCaptureDemo() {
  const gp = document.getElementById("capture-grandparent");
  const p = document.getElementById("capture-parent");
  const btn = document.getElementById("capture-btn");
  if (!gp) return;

  // Capturing
  gp.addEventListener("click", () => log("1. CAPTURE: grandparent", "output-3"), true);
  p.addEventListener("click", () => log("2. CAPTURE: parent", "output-3"), true);
  btn.addEventListener("click", () => log("3. CAPTURE: button (at target)", "output-3"), true);

  // Bubbling
  btn.addEventListener("click", () => log("4. BUBBLE: button (at target)", "output-3"));
  p.addEventListener("click", () => log("5. BUBBLE: parent", "output-3"));
  gp.addEventListener("click", () => log("6. BUBBLE: grandparent", "output-3"));

  btn.addEventListener("mousedown", () => {
    document.getElementById("output-3").textContent = "";
  });
}


// ============================================================
// EXAMPLE 4 — event.eventPhase
// Story: Ola's debugging tool logs the exact phase at which each
// handler fires. event.eventPhase returns 1, 2, or 3.
// ============================================================

// WHY: event.eventPhase tells you exactly which phase the event is
// currently in when your handler executes.

// NOTE: At the target element (phase 2), capture and bubble listeners
// fire in the ORDER they were added, not capture-first.

function setupEventPhaseDemo() {
  const outer = document.getElementById("phase-outer");
  const inner = document.getElementById("phase-inner");
  const btn = document.getElementById("phase-btn");
  if (!outer) return;

  const phaseNames = { 0: "NONE", 1: "CAPTURING", 2: "AT_TARGET", 3: "BUBBLING" };

  outer.addEventListener("click", (e) => {
    log(`Outer (capture): eventPhase = ${e.eventPhase} (${phaseNames[e.eventPhase]})`, "output-4");
  }, true);

  inner.addEventListener("click", (e) => {
    log(`Inner (capture): eventPhase = ${e.eventPhase} (${phaseNames[e.eventPhase]})`, "output-4");
  }, true);

  btn.addEventListener("click", (e) => {
    log(`Button (capture): eventPhase = ${e.eventPhase} (${phaseNames[e.eventPhase]})`, "output-4");
  }, true);

  btn.addEventListener("click", (e) => {
    log(`Button (bubble): eventPhase = ${e.eventPhase} (${phaseNames[e.eventPhase]})`, "output-4");
  });

  inner.addEventListener("click", (e) => {
    log(`Inner (bubble): eventPhase = ${e.eventPhase} (${phaseNames[e.eventPhase]})`, "output-4");
  });

  outer.addEventListener("click", (e) => {
    log(`Outer (bubble): eventPhase = ${e.eventPhase} (${phaseNames[e.eventPhase]})`, "output-4");
  });

  btn.addEventListener("mousedown", () => {
    document.getElementById("output-4").textContent = "";
  });
}


// ============================================================
// EXAMPLE 5 — event.target vs event.currentTarget
// Story: Ola's card handler needs to know: did the user click
// the title, the price, or the "Book Ride" button? event.target
// answers this. event.currentTarget is always the listener host.
// ============================================================

// WHY: target = who was ACTUALLY clicked. currentTarget = who is LISTENING.
// This is one of the most commonly confused pairs in JavaScript.

// IMPORTANT: In regular functions, `this` === event.currentTarget
// In arrow functions, `this` is the outer scope — be careful!

function setupTargetDemo() {
  const card = document.getElementById("ride-card");
  if (!card) return;

  card.addEventListener("click", function (event) {
    const output = document.getElementById("output-5");
    output.textContent = "";
    log(`event.target: <${event.target.tagName.toLowerCase()}> "${event.target.textContent.trim().substring(0, 30)}"`, "output-5");
    log(`event.currentTarget: <${event.currentTarget.tagName.toLowerCase()}> #${event.currentTarget.id}`, "output-5");
    log(`this === currentTarget: ${this === event.currentTarget}`, "output-5");

    if (event.target.classList.contains("book-btn-demo")) {
      log("Action: User wants to BOOK this ride", "output-5");
    } else {
      log("Action: User wants to see ride DETAILS", "output-5");
    }
  });
}


// ============================================================
// EXAMPLE 6 — event.stopPropagation()
// Story: Clicking Ola's "Book Ride" button should ONLY book — not
// also trigger the card's detail view. stopPropagation prevents
// the event from reaching the card's handler.
// ============================================================

// WHY: stopPropagation prevents the event from traveling further.
// Use when a child's action should NOT trigger parent handlers.

// --- What stopPropagation does and doesn't do ---
// DOES: Stop event from reaching other elements' handlers
// DOES NOT: Stop other handlers on the SAME element
// DOES NOT: Prevent default browser behavior (use preventDefault)

function setupStopPropDemo() {
  const card = document.getElementById("stop-card");
  const btn = document.getElementById("stop-btn");
  const toggle = document.getElementById("stop-prop-toggle");
  if (!card || !btn) return;

  card.addEventListener("click", function () {
    log("Card handler fired — showing ride details", "output-6");
  });

  btn.addEventListener("click", function (event) {
    if (toggle && toggle.checked) {
      event.stopPropagation();
      log("Button: stopPropagation() called — card handler will NOT fire", "output-6");
    } else {
      log("Button clicked — event WILL bubble to card", "output-6");
    }
  });
}


// ============================================================
// EXAMPLE 7 — event.stopImmediatePropagation()
// Story: Ola's button has handlers from booking and analytics
// modules. If booking validation fails, stopImmediatePropagation
// prevents the analytics handler from logging a false "booked" event.
// ============================================================

// WHY: stopImmediatePropagation is the nuclear option — stops ALL
// remaining handlers, even on the SAME element.

function setupStopImmediateDemo() {
  const card = document.getElementById("immediate-card");
  const btn = document.getElementById("immediate-btn");
  const toggle = document.getElementById("stop-immediate-toggle");
  if (!card || !btn) return;

  card.addEventListener("click", function () {
    log("Parent card handler fired", "output-7");
  });

  // Handler 1: Validation
  btn.addEventListener("click", function (event) {
    if (toggle && toggle.checked) {
      event.stopImmediatePropagation();
      log("Handler 1: Validation FAILED — stopImmediatePropagation() called", "output-7");
      log("  Handlers 2, 3, and parent are ALL blocked", "output-7");
    } else {
      log("Handler 1: Validation passed", "output-7");
    }
  });

  // Handler 2: Booking
  btn.addEventListener("click", function () {
    log("Handler 2: Booking initiated", "output-7");
  });

  // Handler 3: Analytics
  btn.addEventListener("click", function () {
    log("Handler 3: Analytics logged", "output-7");
  });
}


// ============================================================
// EXAMPLE 8 — Events That DON'T Bubble
// Story: Ola's search input uses focus/blur to show a suggestions
// dropdown. Delegating focus on the parent didn't work — because
// focus and blur DON'T bubble.
// ============================================================

// WHY: Not all events bubble. Assuming they do leads to silent failures
// in delegation code. Know the exceptions and their alternatives.

// --- Events that DON'T bubble ---
// focus, blur, mouseenter, mouseleave, load, unload, resize

// --- Bubbling alternatives ---
// focus → focusin (DOES bubble)
// blur  → focusout (DOES bubble)

function setupFocusDemo() {
  const container = document.getElementById("focus-container");
  if (!container) return;

  // FAILS — focus doesn't bubble:
  container.addEventListener("focus", () => {
    log("focus on container — THIS NEVER FIRES (focus doesn't bubble)", "output-8");
  });

  // WORKS — focusin bubbles:
  container.addEventListener("focusin", (e) => {
    log(`focusin BUBBLED to container from: ${e.target.id}`, "output-8");
    e.target.style.borderColor = "#6366f1";
  });

  container.addEventListener("focusout", (e) => {
    log(`focusout BUBBLED to container from: ${e.target.id}`, "output-8");
    e.target.style.borderColor = "";
  });
}


// ============================================================
// EXAMPLE 9 — Deep Nesting Propagation Trace
// Story: Ola's ride card has deep nesting: list > card > info >
// price-row > price-label. Let's trace an event through 5 levels.
// ============================================================

// WHY: Real UIs have deep nesting. Tracing propagation through
// multiple layers makes the concept crystal clear.

function setupDeepNestTrace() {
  const elements = {
    list: document.getElementById("deep-list"),
    card: document.getElementById("deep-card"),
    info: document.getElementById("deep-info"),
    priceRow: document.getElementById("deep-price-row"),
    priceLabel: document.getElementById("deep-price-label"),
  };
  if (!elements.list) return;

  Object.entries(elements).forEach(([name, el]) => {
    if (!el) return;
    el.addEventListener("click", (e) => {
      log(`CAPTURE: ${name.padEnd(12)} (phase ${e.eventPhase})`, "output-9");
      el.classList.add("highlight-capture");
    }, true);
    el.addEventListener("click", (e) => {
      log(`BUBBLE:  ${name.padEnd(12)} (phase ${e.eventPhase})`, "output-9");
      el.classList.add("highlight-bubble");
    });
  });

  // Clear on mousedown
  elements.priceLabel.addEventListener("mousedown", () => {
    document.getElementById("output-9").textContent = "";
    Object.values(elements).forEach(el => {
      if (el) el.classList.remove("highlight-capture", "highlight-bubble");
    });
  });
}


// ============================================================
// EXAMPLE 10 — Practical: Nested Card with Multiple Actions
// Story: Ola's ride card — clicking body shows details, clicking
// internal buttons performs specific actions. Proper propagation
// control prevents action collisions.
// ============================================================

// WHY: The most common real-world propagation scenario. Two clean
// approaches: stopPropagation on children, or check target in parent.

function setupPracticalCard() {
  const card = document.getElementById("practical-card");
  if (!card) return;

  // Card click: show details (but not when action buttons are clicked)
  card.addEventListener("click", function (event) {
    if (event.target.closest(".ride-actions")) return;
    log(`Card clicked — showing details for ride: ${this.dataset.rideId}`, "output-10");
  });

  card.querySelector(".fav-btn").addEventListener("click", function (e) {
    e.stopPropagation();
    this.classList.toggle("active");
    const isFav = this.classList.contains("active");
    this.textContent = isFav ? "\u2665" : "\u2661";
    log(`Favorite ${isFav ? "added" : "removed"} (stopPropagation — card handler skipped)`, "output-10");
  });

  card.querySelector(".share-btn").addEventListener("click", function (e) {
    e.stopPropagation();
    log("Share dialog opened (stopPropagation — card handler skipped)", "output-10");
  });

  card.querySelector(".book-btn-action").addEventListener("click", function (e) {
    e.stopPropagation();
    this.disabled = true;
    this.textContent = "Booking...";
    log("Booking ride... (stopPropagation — card handler skipped)", "output-10");
    setTimeout(() => {
      this.disabled = false;
      this.textContent = "Book";
      log("Ride confirmed!", "output-10");
    }, 1500);
  });
}


// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. Three phases: Capturing (top down), Target, Bubbling (bottom up).
//
// 2. addEventListener(type, fn, true) = capturing phase.
//    addEventListener(type, fn) = bubbling phase (default).
//
// 3. event.eventPhase: 1=capturing, 2=at target, 3=bubbling.
//
// 4. event.target = actually clicked. event.currentTarget = listener host.
//
// 5. stopPropagation: stops other elements' handlers.
//    stopImmediatePropagation: stops ALL remaining handlers.
//
// 6. Non-bubbling events: focus, blur, mouseenter, mouseleave.
//    Use focusin/focusout as bubbling alternatives.
//
// 7. At target, capture/bubble listeners fire in registration order.
//
// 8. Be careful with stopPropagation — can break document-level handlers.
//    Prefer event.target.closest() checks in parent handlers.
//
// 9. Capturing use cases: focus traps, analytics, conditional blocking.
//
// 10. For nested interactive elements: either stopPropagation on children
//     or check event.target.closest() in the parent handler.
// ============================================================


// --- Initialize all demos on DOM ready ---
document.addEventListener("DOMContentLoaded", function () {
  setupPropagationVisualizer();
  setupPhaseDemo();
  setupCaptureDemo();
  setupEventPhaseDemo();
  setupTargetDemo();
  setupStopPropDemo();
  setupStopImmediateDemo();
  setupFocusDemo();
  setupDeepNestTrace();
  setupPracticalCard();

  console.log("=== FILE 07 COMPLETE: Event Propagation ===");
  console.log("Next: 08-event-delegation — One Listener to Rule Them All");
});
