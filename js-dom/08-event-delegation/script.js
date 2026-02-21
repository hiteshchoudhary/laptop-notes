// ============================================================
// FILE 08: EVENT DELEGATION
// Topic: Handling events efficiently with a single listener on a parent element
// WHY: When your page has hundreds or thousands of interactive elements
// (like a product listing), attaching a listener to each one wastes memory
// and breaks when new elements are added dynamically. Delegation solves both.
// ============================================================

// --- Helper: log to both console and an on-page output panel ---
function log(msg, targetId) {
  console.log(msg);
  const el = document.getElementById(targetId);
  if (el) el.textContent += msg + '\n';
}


// ============================================================
// EXAMPLE 1 — The Flipkart Product Listing Problem
// Story: Flipkart's search results page shows 1000+ product cards.
// Each card has "Add to Cart", "Wishlist", and "Quick View" buttons.
// Attaching 3 listeners per card = 3000+ listeners on one page.
// Users on budget Android phones experience lag and crashes.
// ============================================================

// WHY: Attaching individual listeners to hundreds of elements wastes
// memory, slows page load, and fails for dynamically added elements.

// --- The Naive Approach (DON'T do this) ---
// const cards = document.querySelectorAll(".product-card");
// cards.forEach(card => { ... }); // 3 listeners per card
// Problems: 3000 listeners, 3000 closures, breaks on infinite scroll

// --- The Solution: Event Delegation ---
// One listener on the parent container. Because events bubble up,
// a click on any card or button reaches the parent. The parent
// checks event.target to decide what action to take.

function setupProductGrid() {
  const grid = document.getElementById("product-grid");
  const addBtn = document.getElementById("add-product-btn");
  if (!grid) return;

  let productCounter = 0;
  const products = [
    { name: "iPhone 16", price: "79,999" },
    { name: "Samsung Galaxy S24", price: "64,999" },
    { name: "OnePlus 12", price: "49,999" },
    { name: "Pixel 8 Pro", price: "54,999" },
  ];

  function createProductCard(name, price, id) {
    const card = document.createElement("div");
    card.className = "product-card";
    card.dataset.productId = `PROD-${id}`;
    card.innerHTML = `
      <h4>${name}</h4>
      <div class="price">Rs. ${price}</div>
      <div class="card-actions">
        <button class="cart-btn" data-action="cart">Add to Cart</button>
        <button class="wish-btn" data-action="wishlist">Wishlist</button>
        <button class="del-btn" data-action="delete">Remove</button>
      </div>
    `;
    return card;
  }

  // Add initial products
  products.forEach(p => {
    productCounter++;
    grid.appendChild(createProductCard(p.name, p.price, productCounter));
  });

  // --- SINGLE delegated click handler on the grid ---
  // This is the ONLY listener. It handles ALL cards, ALL buttons.
  grid.addEventListener("click", function (event) {
    // event.target.closest() walks UP the DOM tree from event.target
    // Returns first ancestor matching selector, or null
    // Essential for delegation — handles nested children
    const addBtn = event.target.closest("[data-action='cart']");
    const wishBtn = event.target.closest("[data-action='wishlist']");
    const delBtn = event.target.closest("[data-action='delete']");
    const card = event.target.closest(".product-card");

    if (addBtn && card) {
      log(`Added to cart: ${card.dataset.productId} — ${card.querySelector("h4").textContent}`, "output-1");
      addBtn.textContent = "Added!";
      addBtn.style.background = "#16a34a";
      setTimeout(() => {
        addBtn.textContent = "Add to Cart";
        addBtn.style.background = "";
      }, 1000);
      return;
    }

    if (wishBtn && card) {
      const isActive = wishBtn.textContent.includes("Saved");
      wishBtn.textContent = isActive ? "Wishlist" : "Saved!";
      log(`${isActive ? "Removed from" : "Added to"} wishlist: ${card.dataset.productId}`, "output-1");
      return;
    }

    if (delBtn && card) {
      card.style.transition = "opacity 0.3s, transform 0.3s";
      card.style.opacity = "0";
      card.style.transform = "scale(0.9)";
      log(`Removed: ${card.dataset.productId}`, "output-1");
      setTimeout(() => card.remove(), 300);
      return;
    }

    if (card) {
      log(`Navigate to product: ${card.dataset.productId}`, "output-1");
    }
  });

  // Add product dynamically — proving delegation works on new elements
  if (addBtn) {
    addBtn.addEventListener("click", function () {
      productCounter++;
      const names = ["iPad Air", "MacBook Pro", "AirPods Pro", "Apple Watch", "Galaxy Tab"];
      const prices = ["59,999", "1,49,999", "24,999", "41,900", "34,999"];
      const i = (productCounter - 1) % names.length;
      const card = createProductCard(names[i], prices[i], productCounter);
      grid.appendChild(card);
      log(`Added new product: PROD-${productCounter} (delegation auto-handles it!)`, "output-1");
      document.getElementById("dynamic-count");
    });
  }
}


// ============================================================
// EXAMPLE 2 — The Delegation Workhorse: event.target.closest()
// Story: Flipkart's "Add to Cart" button has an icon inside:
// <button class="add-to-cart"><img src="cart.svg"> Add</button>
// Clicking the ICON means event.target is <img>, not the button.
// closest() walks up the tree to find the actual button.
// ============================================================

// WHY: event.target gives the DEEPEST clicked element. closest()
// finds the relevant ancestor by walking up the DOM tree.

// --- How closest() works ---
// event.target = <svg class="cart-icon">
// event.target.closest(".add-to-cart") = <button class="add-to-cart">
// event.target.closest(".product-card") = <div class="product-card">
// event.target.closest(".search-bar") = null (no match found)

function setupClosestDemo() {
  const card = document.querySelector(".product-card-demo");
  if (!card) return;

  card.addEventListener("click", function (event) {
    const output = document.getElementById("output-2");
    output.textContent = "";

    log(`event.target: <${event.target.tagName.toLowerCase()}> class="${event.target.className}"`, "output-2");
    log(`closest(".add-to-cart"): ${event.target.closest(".add-to-cart") ? "FOUND" : "null"}`, "output-2");
    log(`closest(".product-card-demo"): ${event.target.closest(".product-card-demo") ? "FOUND" : "null"}`, "output-2");
    log(`closest(".search-bar"): ${event.target.closest(".search-bar") ? "FOUND" : "null"}`, "output-2");

    const addBtn = event.target.closest(".add-to-cart");
    if (addBtn) {
      log(`\nAction: Add to cart — product ${this.dataset.productId}`, "output-2");
    } else {
      log(`\nAction: Navigate to product ${this.dataset.productId}`, "output-2");
    }
  });
}


// ============================================================
// EXAMPLE 3 — Multiple Action Buttons in One Listener
// Story: Flipkart's order history has 5 action buttons per order:
// Track, Cancel, Return, Review, Reorder. 50 orders visible = 250
// potential listeners. One delegated listener handles them all
// using data-action attributes.
// ============================================================

// WHY: data-action attributes let you route multiple actions through
// a single delegation listener with a clean switch statement.

function setupOrderActions() {
  const orderList = document.getElementById("order-list");
  if (!orderList) return;

  orderList.addEventListener("click", function (event) {
    const button = event.target.closest("[data-action]");
    if (!button) return;

    const orderItem = button.closest(".order-item");
    if (!orderItem) return;
    const orderId = orderItem.dataset.orderId;
    const action = button.dataset.action;

    switch (action) {
      case "track":
        log(`Tracking order: ${orderId}`, "output-3");
        break;
      case "cancel":
        log(`Cancelling order: ${orderId}`, "output-3");
        break;
      case "return":
        log(`Initiating return: ${orderId}`, "output-3");
        break;
      case "review":
        log(`Opening review form: ${orderId}`, "output-3");
        break;
      case "reorder":
        log(`Reordering: ${orderId}`, "output-3");
        break;
      default:
        log(`Unknown action: ${action}`, "output-3");
    }
  });
}


// ============================================================
// EXAMPLE 4 — Performance: 1000 Listeners vs 1 Delegated
// Story: Flipkart's performance team benchmarked both approaches.
// The results were stark, especially on mid-range Android devices.
// ============================================================

// WHY: The numbers motivate the switch to delegation.

function setupBenchmarks() {
  const benchIndividual = document.getElementById("bench-individual");
  const benchDelegated = document.getElementById("bench-delegated");
  const container = document.getElementById("bench-container");
  if (!benchIndividual || !container) return;

  benchIndividual.addEventListener("click", function () {
    container.innerHTML = "";
    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      const div = document.createElement("div");
      div.textContent = `Item ${i}`;
      div.addEventListener("click", function () {}); // Individual listener
      container.appendChild(div);
    }
    const elapsed = (performance.now() - start).toFixed(2);
    log(`1000 individual listeners: ${elapsed}ms setup time`, "output-4");
    container.innerHTML = "";
  });

  benchDelegated.addEventListener("click", function () {
    container.innerHTML = "";
    const start = performance.now();
    container.addEventListener("click", function (e) {
      const item = e.target.closest("div");
      if (item) { /* handle */ }
    });
    for (let i = 0; i < 1000; i++) {
      const div = document.createElement("div");
      div.textContent = `Item ${i}`;
      container.appendChild(div);
    }
    const elapsed = (performance.now() - start).toFixed(2);
    log(`1 delegated listener + 1000 elements: ${elapsed}ms setup time`, "output-4");
    container.innerHTML = "";
  });
}


// ============================================================
// EXAMPLE 5 — Dynamic Lists: Add/Remove Without Re-attaching
// Story: Flipkart's infinite scroll adds 20 new product cards on
// each scroll. With delegation, new cards automatically work —
// no listener re-attachment needed.
// ============================================================

// WHY: Delegation's killer feature: handles elements that don't exist
// yet when the listener is set up. Essential for dynamic UIs.

// Removing elements also needs no cleanup:
// productGrid.querySelector(`[data-product-id="${id}"]`)?.remove();
// No removeEventListener needed — element is gone, parent doesn't care.

function setupDynamicList() {
  const list = document.getElementById("dynamic-list");
  const addBtn = document.getElementById("add-dynamic-btn");
  const countDisplay = document.getElementById("dynamic-count");
  if (!list || !addBtn) return;

  let counter = 0;

  // Set up delegation ONCE — before any items exist
  list.addEventListener("click", function (event) {
    const delBtn = event.target.closest("[data-action='remove']");
    if (delBtn) {
      const item = delBtn.closest(".dynamic-item");
      if (item) {
        item.style.opacity = "0";
        item.style.transform = "translateX(100px)";
        log(`Removed: ${item.querySelector("span").textContent}`, "output-5");
        setTimeout(() => {
          item.remove();
          counter--;
          countDisplay.textContent = counter;
        }, 300);
      }
    }
  });

  addBtn.addEventListener("click", function () {
    counter++;
    const item = document.createElement("div");
    item.className = "dynamic-item";
    item.innerHTML = `
      <span>Dynamic Item #${counter}</span>
      <button data-action="remove">Remove</button>
    `;
    list.appendChild(item);
    countDisplay.textContent = counter;
    log(`Added: Dynamic Item #${counter} (delegation auto-handles it!)`, "output-5");
  });
}


// ============================================================
// EXAMPLE 6 — Practical: Todo List with Add, Complete, Delete
// Story: Building a Flipkart warehouse task board. Tasks are added,
// completed, and deleted — all via delegation. New tasks added
// dynamically are instantly interactive.
// ============================================================

// WHY: The classic delegation exercise combining dynamic creation,
// multiple actions, and proper event handling.

function createTodoApp() {
  const todoForm = document.getElementById("todo-form");
  const todoInput = document.getElementById("todo-input");
  const todoList = document.getElementById("todo-list");
  if (!todoForm || !todoList) return;

  let taskId = 0;

  function updateStats() {
    const total = todoList.querySelectorAll(".todo-item").length;
    const completed = todoList.querySelectorAll(".todo-item.completed").length;
    document.getElementById("todo-total").textContent = total;
    document.getElementById("todo-completed").textContent = completed;
  }

  // --- Add task via form submit ---
  todoForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const text = todoInput.value.trim();
    if (!text) return;

    taskId++;
    const li = document.createElement("li");
    li.className = "todo-item";
    li.dataset.taskId = `task-${taskId}`;
    li.innerHTML = `
      <input type="checkbox" class="todo-checkbox">
      <span class="todo-text">${text}</span>
      <button data-action="edit">Edit</button>
      <button data-action="delete">Delete</button>
    `;
    todoList.appendChild(li);
    todoInput.value = "";
    todoInput.focus();
    updateStats();
    log(`Added task: "${text}" (task-${taskId})`, "output-6");
  });

  // --- SINGLE delegated listener for ALL actions ---
  todoList.addEventListener("click", function (event) {
    const item = event.target.closest(".todo-item");
    if (!item) return;

    // Toggle complete (checkbox)
    if (event.target.classList.contains("todo-checkbox")) {
      const isComplete = event.target.checked;
      item.classList.toggle("completed", isComplete);
      updateStats();
      log(`Task ${item.dataset.taskId}: ${isComplete ? "completed" : "uncompleted"}`, "output-6");
      return;
    }

    // Action buttons
    const btn = event.target.closest("[data-action]");
    if (!btn) return;

    if (btn.dataset.action === "delete") {
      item.style.transition = "opacity 0.3s, transform 0.3s";
      item.style.opacity = "0";
      item.style.transform = "translateX(100px)";
      log(`Deleted: ${item.querySelector(".todo-text").textContent}`, "output-6");
      setTimeout(() => {
        item.remove();
        updateStats();
      }, 300);
      return;
    }

    if (btn.dataset.action === "edit") {
      const textEl = item.querySelector(".todo-text");
      const newText = prompt("Edit task:", textEl.textContent);
      if (newText && newText.trim()) {
        textEl.textContent = newText.trim();
        log(`Edited ${item.dataset.taskId}: "${newText.trim()}"`, "output-6");
      }
    }
  });
}


// ============================================================
// EXAMPLE 7 — Delegation with Non-Click Events
// Story: Flipkart's product filter sidebar has checkboxes, radios,
// range sliders, and selects. All handled by delegating the
// 'change' event on the filter container.
// ============================================================

// WHY: Delegation works with any bubbling event — not just clicks.

// --- When NOT to Use Delegation ---
// Events that DON'T bubble (delegation fails):
// focus → use focusin instead
// blur  → use focusout instead
// mouseenter → use mouseover (but fires on children too)
// load, unload, resize — no bubbling alternatives
// Also avoid for: high-frequency events (mousemove), isolated widgets

function setupFilterDelegation() {
  const filterPanel = document.getElementById("filter-panel");
  if (!filterPanel) return;

  // Delegate 'change' for checkboxes, selects, ranges
  filterPanel.addEventListener("change", function (event) {
    const target = event.target;
    switch (target.type) {
      case "checkbox":
        log(`Filter: ${target.name} = ${target.value} — ${target.checked ? "ON" : "OFF"}`, "output-7");
        break;
      case "select-one":
        log(`Sort changed: ${target.value || "(none)"}`, "output-7");
        break;
      case "range":
        const val = parseInt(target.value).toLocaleString();
        log(`Price range: Rs. ${val}`, "output-7");
        document.getElementById("range-value").textContent = `Rs. ${val}`;
        break;
    }
    log("  Refreshing products with updated filters...", "output-7");
  });

  // Delegate 'input' for real-time search
  filterPanel.addEventListener("input", function (event) {
    if (event.target.name === "search") {
      log(`Search filter: "${event.target.value}"`, "output-7");
    }
    if (event.target.type === "range") {
      const val = parseInt(event.target.value).toLocaleString();
      document.getElementById("range-value").textContent = `Rs. ${val}`;
    }
  });

  // Delegate focusin/focusout (focus/blur don't bubble!)
  filterPanel.addEventListener("focusin", function (e) {
    if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") {
      e.target.style.borderColor = "#6366f1";
    }
  });
  filterPanel.addEventListener("focusout", function (e) {
    if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") {
      e.target.style.borderColor = "";
    }
  });
}


// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. Event delegation = ONE listener on parent instead of many
//    on children. Leverages event bubbling.
//
// 2. event.target.closest(selector) is the workhorse — finds
//    the relevant ancestor from whatever was actually clicked.
//
// 3. Standard pattern:
//    parent.addEventListener('click', e => {
//        const item = e.target.closest('.item');
//        if (!item) return;
//        // handle item
//    });
//
// 4. data-action attributes route multiple actions in one listener.
//
// 5. Delegation auto-handles dynamically added elements.
//
// 6. Performance: 1 delegated listener beats 1000 individual ones.
//
// 7. Non-bubbling events can't be delegated. Use focusin/focusout.
//
// 8. Guard clauses: if (!item) return and if (!this.contains(item)) return.
//
// 9. Works with any bubbling event: click, change, input, keydown.
//
// 10. Know when NOT to delegate: isolated widgets, high-frequency events.
// ============================================================


// --- Initialize all demos on DOM ready ---
document.addEventListener("DOMContentLoaded", function () {
  setupProductGrid();
  setupClosestDemo();
  setupOrderActions();
  setupBenchmarks();
  setupDynamicList();
  createTodoApp();
  setupFilterDelegation();

  console.log("=== FILE 08 COMPLETE: Event Delegation ===");
  console.log("Next: 09-form-handling — Forms, Validation, and FormData");
});
