// ============================================================
// FILE 10: KEYBOARD, MOUSE, AND TOUCH EVENTS
// Topic: Handling keyboard shortcuts, mouse interactions, and touch gestures
// WHY: Modern web apps must respond to keyboards (desktop power users),
// mice (precision interactions), and touch (mobile users). Zerodha Kite
// serves all three — keyboard shortcuts for rapid trading, mouse hovers
// for stock tooltips, and touch gestures for mobile chart navigation.
// ============================================================

// --- Helper: log to both console and an on-page output panel ---
function log(msg, targetId) {
  console.log(msg);
  const el = document.getElementById(targetId);
  if (el) el.textContent += msg + '\n';
}


// ============================================================
// EXAMPLE 1 — Zerodha Kite: Keyboard Shortcuts
// Story: Zerodha Kite handles Rs. 15+ lakh crore in daily trading
// volume. Professional traders use keyboard shortcuts (B for Buy,
// S for Sell, Ctrl+F for search) for split-second decisions.
// ============================================================

// WHY: A well-built shortcut system checks for active input elements
// and prevents conflicts with browser defaults.

// ============================================================
// EXAMPLE 2 — Keyboard Events: keydown, keyup, keypress
// Story: Zerodha Kite's shortcuts fire on keydown (not keyup) so
// traders feel instant response. keypress is deprecated and was
// never reliable for special keys like arrows or Escape.
// ============================================================

// WHY: There are three keyboard events. Knowing which to use
// prevents bugs with special keys and repeat behavior.

// --- keydown — fires on press, REPEATS if held. Use for shortcuts. ---
// --- keyup — fires on release, NO repeat. Use for modifier tracking. ---
// --- keypress — DEPRECATED. Only character keys. Don't use. ---

// --- Auto-Repeat Behavior (holding "A" key) ---
// keydown "a"   <- first press
// keydown "a"   <- repeat (event.repeat = true)
// keyup   "a"   <- released (fires ONCE)

// ============================================================
// EXAMPLE 3 — event.key vs event.keyCode vs event.code
// Story: Zerodha originally used event.keyCode (numbers like 66
// for "B"). They migrated to event.key (readable "b") for clarity.
// event.code identifies physical key position for WASD controls.
// ============================================================

// --- event.key (MODERN — USE THIS) ---
// Returns the character: "a", "A", "Enter", "Escape", "ArrowUp"
// Affected by Shift and keyboard layout.

// --- event.code (MODERN — FOR PHYSICAL KEYS) ---
// Returns the physical key: "KeyA", "Digit1", "Enter", "ShiftLeft"
// NOT affected by Shift or layout.

// --- event.keyCode (DEPRECATED — DON'T USE) ---
// Returns number: 65 for A, 13 for Enter. Browser-inconsistent.

// ============================================================
// EXAMPLE 4 — Modifier Keys
// Story: Zerodha uses Ctrl+B for Buy, Ctrl+S for Sell, Ctrl+K
// for command palette. Must handle Mac (Cmd) vs Windows (Ctrl).
// ============================================================

// event.ctrlKey  — Ctrl held
// event.shiftKey — Shift held
// event.altKey   — Alt (Option on Mac) held
// event.metaKey  — Meta (Cmd on Mac, Windows key on PC) held

// --- Cross-Platform Pattern ---
// const mod = event.ctrlKey || event.metaKey; // Ctrl OR Cmd

function setupKeyboardShortcuts() {
  const shortcuts = {
    b: { desc: "Open Buy form", statusId: "sc-b", mod: false },
    s: { desc: "Open Sell form", statusId: "sc-s", mod: false },
    w: { desc: "Toggle Watchlist", statusId: "sc-w", mod: false },
    Escape: { desc: "Close panel", statusId: "sc-escape", mod: false },
  };

  // Modifier shortcuts handled separately
  const modShortcuts = {
    s: { desc: "Save", statusId: "sc-ctrl-s" },
    k: { desc: "Command palette", statusId: "sc-ctrl-k" },
  };

  document.addEventListener("keydown", function (event) {
    // Guard: skip if user is typing in an input
    const active = document.activeElement;
    const isTyping = active && (
      active.tagName === "INPUT" || active.tagName === "TEXTAREA" ||
      active.tagName === "SELECT" || active.isContentEditable
    );

    const mod = event.ctrlKey || event.metaKey;

    // Check modifier shortcuts first (Ctrl+S, Ctrl+K)
    if (mod && modShortcuts[event.key]) {
      event.preventDefault();
      const sc = modShortcuts[event.key];
      const statusEl = document.getElementById(sc.statusId);
      if (statusEl) {
        statusEl.textContent = "FIRED!";
        statusEl.classList.add("fired");
        setTimeout(() => {
          statusEl.textContent = "—";
          statusEl.classList.remove("fired");
        }, 1500);
      }
      log(`Shortcut: Ctrl+${event.key.toUpperCase()} — ${sc.desc}`, "output-1");
      return;
    }

    // Skip regular shortcuts during typing (except Escape)
    if (isTyping && event.key !== "Escape") return;
    if (mod) return; // Has modifier but not a modifier shortcut

    // Help shortcut (Shift+?)
    if (event.key === "?") {
      const statusEl = document.getElementById("sc-help");
      if (statusEl) {
        statusEl.textContent = "FIRED!";
        statusEl.classList.add("fired");
        setTimeout(() => { statusEl.textContent = "—"; statusEl.classList.remove("fired"); }, 1500);
      }
      log("Shortcut: ? — Show keyboard shortcuts help", "output-1");
      return;
    }

    const sc = shortcuts[event.key];
    if (!sc) return;

    event.preventDefault();
    const statusEl = document.getElementById(sc.statusId);
    if (statusEl) {
      statusEl.textContent = "FIRED!";
      statusEl.classList.add("fired");
      setTimeout(() => {
        statusEl.textContent = "—";
        statusEl.classList.remove("fired");
      }, 1500);
    }
    log(`Shortcut: ${event.key === "Escape" ? "Esc" : event.key.toUpperCase()} — ${sc.desc}`, "output-1");
  });
}


// ============================================================
// EXAMPLE 5 — Live Key Press Display
// ============================================================

function setupKeyDisplay() {
  const displayKey = document.getElementById("display-key");
  const displayCode = document.getElementById("display-code");
  const displayKeycode = document.getElementById("display-keycode");
  const displayType = document.getElementById("display-type");
  if (!displayKey) return;

  const modIds = { ctrl: "mod-ctrl", shift: "mod-shift", alt: "mod-alt", meta: "mod-meta", repeat: "mod-repeat" };

  function updateModifiers(event) {
    document.getElementById(modIds.ctrl).classList.toggle("active", event.ctrlKey);
    document.getElementById(modIds.shift).classList.toggle("active", event.shiftKey);
    document.getElementById(modIds.alt).classList.toggle("active", event.altKey);
    document.getElementById(modIds.meta).classList.toggle("active", event.metaKey);
    document.getElementById(modIds.repeat).classList.toggle("active", event.repeat);
  }

  document.addEventListener("keydown", function (event) {
    displayKey.textContent = event.key;
    displayCode.textContent = event.code;
    displayKeycode.textContent = `${event.keyCode} (deprecated)`;
    displayType.textContent = "keydown";

    updateModifiers(event);

    // Highlight cards
    document.querySelectorAll(".key-card").forEach(c => c.classList.add("active"));
    setTimeout(() => {
      document.querySelectorAll(".key-card").forEach(c => c.classList.remove("active"));
    }, 200);

    if (!event.repeat) {
      log(`keydown: key="${event.key}" code="${event.code}" keyCode=${event.keyCode}`, "output-2");
    }
  });

  document.addEventListener("keyup", function (event) {
    displayType.textContent = "keyup";
    updateModifiers(event);
    log(`keyup:   key="${event.key}" code="${event.code}"`, "output-2");
  });
}


// ============================================================
// EXAMPLE 6 — Mouse Events: click, dblclick, contextmenu
// Story: Zerodha's watchlist: single click selects stock, double
// click opens chart, right-click shows Buy/Sell context menu.
// ============================================================

// WHY: Mouse events beyond click are crucial for power-user UIs.

// --- Event Firing Sequence for Double Click ---
// mousedown → mouseup → click → mousedown → mouseup → click → dblclick
// Both click events fire BEFORE dblclick!

function setupClickDemo() {
  const target = document.getElementById("click-target");
  if (!target) return;

  target.addEventListener("mousedown", () => log("mousedown (instant on press)", "output-6"));
  target.addEventListener("mouseup", () => log("mouseup (on release)", "output-6"));
  target.addEventListener("click", () => log("click (after mouseup)", "output-6"));
  target.addEventListener("dblclick", () => log("dblclick (after 2 full click cycles)", "output-6"));
  target.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    log("contextmenu (right-click) — default prevented", "output-6");
  });
}


// ============================================================
// EXAMPLE 7 — Mouse Position: clientX/Y, pageX/Y, offsetX/Y
// Story: Zerodha's chart crosshair follows the cursor, showing
// the price at the exact position. Different coordinate systems
// serve different positioning needs.
// ============================================================

// ┌─────────────────────────────────────────────────┐
// │ clientX/Y — VIEWPORT relative (0,0 = window)   │
// │   Not affected by scroll. For: fixed tooltips.  │
// │                                                 │
// │ pageX/Y — DOCUMENT relative (0,0 = page top)   │
// │   Includes scroll offset. For: absolute pos.    │
// │                                                 │
// │ offsetX/Y — ELEMENT relative (0,0 = element)    │
// │   For: canvas drawing, within-element position. │
// │                                                 │
// │ screenX/Y — MONITOR relative. Rarely needed.    │
// └─────────────────────────────────────────────────┘

function setupMouseTracking() {
  const area = document.getElementById("mouse-area");
  const crosshair = document.getElementById("crosshair");
  const coordLabel = document.getElementById("coord-label");
  if (!area) return;

  // --- event.button: 0=Left, 1=Middle, 2=Right, 3=Back, 4=Forward ---
  // --- event.buttons: bitmask of all held (1=Left, 2=Right, 4=Middle) ---

  area.addEventListener("mousemove", function (event) {
    crosshair.style.display = "block";
    crosshair.style.left = event.offsetX + "px";
    crosshair.style.top = event.offsetY + "px";
    coordLabel.style.display = "none";

    document.getElementById("coord-client").textContent = `(${event.clientX}, ${event.clientY})`;
    document.getElementById("coord-page").textContent = `(${event.pageX}, ${event.pageY})`;
    document.getElementById("coord-offset").textContent = `(${event.offsetX}, ${event.offsetY})`;
  });

  area.addEventListener("mouseleave", function () {
    crosshair.style.display = "none";
    coordLabel.style.display = "block";
  });

  area.addEventListener("mousedown", function (event) {
    const buttonNames = { 0: "Left", 1: "Middle", 2: "Right", 3: "Back", 4: "Forward" };
    document.getElementById("coord-button").textContent =
      `${event.button} (${buttonNames[event.button] || "Unknown"})`;
    log(`mousedown: button=${event.button} (${buttonNames[event.button]}) at offset(${event.offsetX}, ${event.offsetY})`, "output-3");
  });

  area.addEventListener("contextmenu", (e) => e.preventDefault());
}


// ============================================================
// EXAMPLE 8 — Pointer Events: The Unified Input Model
// Story: Zerodha's chart works identically with mouse, touch, and
// stylus because they use Pointer Events — one API for all inputs.
// ============================================================

// WHY: Pointer events unify mouse, touch, and pen into one API.
// Write one set of handlers that works everywhere.

// --- Core Events ---
// pointerdown, pointermove, pointerup    — main trio
// pointerenter, pointerleave             — like mouseenter/leave
// pointercancel                          — interrupted (phone call)

// --- Extra Properties ---
// event.pointerId    — unique ID (important for multi-touch)
// event.pointerType  — "mouse", "touch", or "pen"
// event.isPrimary    — true for first/main pointer
// event.pressure     — 0 to 1 (press force)

// setPointerCapture: events continue even if pointer leaves element.
// Essential for drag operations.

function setupDraggable() {
  const el = document.getElementById("draggable");
  const container = document.getElementById("drag-container");
  if (!el || !container) return;

  let isDragging = false, offX = 0, offY = 0;

  el.addEventListener("pointerdown", function (event) {
    isDragging = true;
    const rect = this.getBoundingClientRect();
    offX = event.clientX - rect.left;
    offY = event.clientY - rect.top;

    this.setPointerCapture(event.pointerId);
    this.classList.add("dragging");
    this.style.transition = "none";
    document.getElementById("drag-pointer").textContent = event.pointerType;
    log(`pointerdown: id=${event.pointerId} type=${event.pointerType}`, "output-4");
  });

  el.addEventListener("pointermove", function (event) {
    if (!isDragging) return;
    const pRect = container.getBoundingClientRect();

    let x = event.clientX - pRect.left - offX;
    let y = event.clientY - pRect.top - offY;

    // Constrain to parent
    x = Math.max(0, Math.min(container.offsetWidth - this.offsetWidth, x));
    y = Math.max(0, Math.min(container.offsetHeight - this.offsetHeight, y));

    this.style.left = x + "px";
    this.style.top = y + "px";
    document.getElementById("drag-pos").textContent = `x: ${Math.round(x)}, y: ${Math.round(y)}`;
  });

  el.addEventListener("pointerup", function (event) {
    if (!isDragging) return;
    isDragging = false;
    this.releasePointerCapture(event.pointerId);
    this.classList.remove("dragging");
    log(`pointerup: released at (${parseInt(this.style.left)}, ${parseInt(this.style.top)})`, "output-4");
  });

  el.addEventListener("pointercancel", function (event) {
    isDragging = false;
    this.releasePointerCapture(event.pointerId);
    this.classList.remove("dragging");
    log("pointercancel: drag interrupted", "output-4");
  });

  // Prevent browser scroll/zoom on the draggable element
  el.style.touchAction = "none";
}


// ============================================================
// EXAMPLE 9 — Drawing Area with Pointer Events
// Story: A drawing canvas that works with mouse, touch, and pen.
// Uses pointer events for unified input handling.
// ============================================================

function setupDrawingArea() {
  const canvas = document.getElementById("draw-canvas");
  const colorInput = document.getElementById("draw-color");
  const sizeInput = document.getElementById("draw-size");
  const sizeDisplay = document.getElementById("size-display");
  const clearBtn = document.getElementById("clear-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let isDrawing = false;
  let lastX = 0, lastY = 0;

  // Set actual canvas resolution to match CSS size
  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
  }
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  canvas.addEventListener("pointerdown", function (event) {
    isDrawing = true;
    const rect = this.getBoundingClientRect();
    lastX = event.clientX - rect.left;
    lastY = event.clientY - rect.top;
    this.setPointerCapture(event.pointerId);
    log(`Drawing started (${event.pointerType}, pressure: ${event.pressure.toFixed(2)})`, "output-5");
  });

  canvas.addEventListener("pointermove", function (event) {
    if (!isDrawing) return;
    const rect = this.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.strokeStyle = colorInput.value;
    ctx.lineWidth = parseInt(sizeInput.value);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();

    lastX = x;
    lastY = y;
  });

  canvas.addEventListener("pointerup", function (event) {
    isDrawing = false;
    this.releasePointerCapture(event.pointerId);
  });

  canvas.addEventListener("pointercancel", function () {
    isDrawing = false;
  });

  canvas.style.touchAction = "none";

  sizeInput.addEventListener("input", function () {
    sizeDisplay.textContent = this.value;
  });

  clearBtn.addEventListener("click", function () {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    log("Canvas cleared", "output-5");
  });
}


// ============================================================
// EXAMPLE 10 — Shortcut Hints Overlay
// Story: Hold Ctrl/Cmd to reveal shortcut hints on buttons,
// similar to VS Code and other professional tools.
// ============================================================

function setupShortcutHints() {
  document.addEventListener("keydown", function (event) {
    if (event.ctrlKey || event.metaKey) {
      document.body.classList.add("show-hints");
    }
  });

  document.addEventListener("keyup", function (event) {
    if (!event.ctrlKey && !event.metaKey) {
      document.body.classList.remove("show-hints");
    }
  });

  // Handle blur (user switches tabs with Ctrl held)
  window.addEventListener("blur", function () {
    document.body.classList.remove("show-hints");
  });

  log("Hold Ctrl/Cmd to reveal shortcut hints on the buttons.", "output-7");
}


// ============================================================
// EXAMPLE 11 — Touch Events: Multi-Touch Gestures
// Story: Zerodha's mobile app uses touch events for pinch-zoom on
// charts and swipe to dismiss. The touches array tracks all active
// fingers simultaneously.
// ============================================================

// WHY: Multi-touch gestures (pinch, rotate) still require Touch Events.
// The touches array lets you track multiple contact points.

// --- Events ---
// touchstart, touchmove, touchend, touchcancel

// --- Touch Lists ---
// event.touches         — ALL active touches on screen
// event.targetTouches   — touches on the event target element
// event.changedTouches  — touches that CHANGED in this event

// --- Each Touch has: identifier, clientX/Y, pageX/Y, target, force ---

// --- Pinch-Zoom (conceptual) ---
// Track distance between 2 touches on touchstart.
// On touchmove, compare current distance to initial distance.
// zoom = currentDistance / initialDistance

// --- Swipe Detection (conceptual) ---
// Record startX/Y on touchstart.
// On touchend, compute delta. If abs(dx) > threshold → horizontal swipe.


// ============================================================
// EXAMPLE 12 — When to Use Which Event Type
// ============================================================

// ┌─────────────────────────────────────────────────────────┐
// │ Need multi-touch (pinch, rotate)?                      │
// │   YES → Touch Events                                   │
// │   NO  → Need mouse + touch + pen?                      │
// │           YES → Pointer Events (DEFAULT CHOICE)        │
// │           NO  → Desktop-only? → Mouse Events           │
// └─────────────────────────────────────────────────────────┘

// Mouse events are SYNTHESIZED from touch on mobile:
// touchstart → touchend → mousemove → mousedown → mouseup → click
// This causes ~300ms delay. Pointer events don't have this issue.

// Don't mix mouse + touch for the same interaction. Use pointer events.


// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. Keyboard: use keydown (repeats on hold). keypress is deprecated.
//
// 2. event.key = character ("a"). event.code = physical ("KeyA").
//
// 3. Modifiers: ctrlKey, shiftKey, altKey, metaKey.
//    Cross-platform: (ctrlKey || metaKey).
//
// 4. Shortcuts: check activeElement, skip during text input,
//    always preventDefault on matched shortcuts.
//
// 5. Mouse: mousedown → mouseup → click. dblclick after 2 cycles.
//
// 6. Coordinates: clientX/Y (viewport), pageX/Y (document),
//    offsetX/Y (element).
//
// 7. event.button: 0=left, 1=middle, 2=right.
//
// 8. Pointer Events unify mouse + touch + pen. Default choice.
//
// 9. Touch Events: for multi-touch. event.touches tracks fingers.
//
// 10. Drag: pointerdown + setPointerCapture, pointermove for position,
//     pointerup + releasePointerCapture. touch-action: none on element.
// ============================================================


// --- Initialize all demos on DOM ready ---
document.addEventListener("DOMContentLoaded", function () {
  setupKeyboardShortcuts();
  setupKeyDisplay();
  setupMouseTracking();
  setupDraggable();
  setupDrawingArea();
  setupClickDemo();
  setupShortcutHints();

  console.log("=== FILE 10 COMPLETE: Keyboard, Mouse, and Touch Events ===");
  console.log("Series complete! DOM events fully covered: fundamentals,");
  console.log("propagation, delegation, forms, and all input types.");
});
