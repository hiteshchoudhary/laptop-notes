// ============================================================
// FILE 07: TESTING DOM INTERACTIONS
// Topic: Testing DOM elements, user events, and UI behavior using Testing Library
// WHY: Users interact with your app through the DOM — clicking buttons,
//   typing in inputs, reading text. If you can't test these interactions,
//   you can't verify your app works as users experience it.
// ============================================================

// ============================================================
// EXAMPLE 1 — Myntra's "Add to Bag" Button
// Story: Myntra serves 50 million monthly users. When a customer clicks
//   "Add to Bag", three things must happen: the cart count increments,
//   a toast notification appears, and the button text changes to "Go to
//   Bag". If ANY DOM update fails, the customer abandons the purchase.
// ============================================================

// WHY: The DOM is the final output of your frontend code. Testing it
// means testing what users actually see and interact with.

// --- The DOM Testing Problem ---
// Node.js has NO DOM. No `document`, no `window`, no `querySelector`.
// jsdom: A pure-JavaScript DOM implementation that runs in Node.js.
// Both Jest and Vitest use jsdom as their test environment.

// Configuration:
// vitest.config.js: { test: { environment: 'jsdom' } }
// jest.config.js:   { testEnvironment: 'jsdom' }

console.log("--- The DOM Testing Problem ---");
console.log("Node.js has no DOM. jsdom simulates it for testing.");
console.log("Configure: environment: 'jsdom' in your test config.");
console.log("");

// ============================================================
// EXAMPLE 2 — Testing Library Philosophy & Query Priority
// Story: Myntra switched from Enzyme to Testing Library after realizing
//   they were testing React internals (state, props) instead of user
//   behavior. Testing Library forces tests to interact with the DOM
//   the way users do — by role, label, and text.
// ============================================================

// WHY: "The more your tests resemble the way your software is used,
//  the more confidence they give you." — Kent C. Dodds

// --- Priority 1: getByRole (BEST — accessible to everyone) ---
// getByRole('button', { name: 'Add to Bag' })    — finds button by role+text
// getByRole('link', { name: 'View Cart' })         — finds <a> by role+text
// getByRole('checkbox')                             — finds checkbox input
// Common roles: 'button', 'textbox', 'checkbox', 'radio', 'link', 'heading', 'list'

// --- Priority 2: getByLabelText (form inputs) ---
// getByLabelText('Email Address')   — finds input associated with label

// --- Priority 3: getByPlaceholderText (when no label) ---
// getByPlaceholderText('Search for products...')

// --- Priority 4: getByText (visible text content) ---
// getByText('Free delivery on orders above Rs. 499')
// getByText(/Rs\. 1,299/)    — regex works too!

// --- Priority 5: getByTestId (LAST RESORT — not user-visible) ---
// getByTestId('product-card-123')   — only when nothing else works

console.log("--- Query Priority ---");
console.log("1. getByRole     — best, accessible, resilient to CSS changes");
console.log("2. getByLabelText — form inputs by label");
console.log("3. getByPlaceholderText — when no label exists");
console.log("4. getByText     — visible text content");
console.log("5. getByTestId   — LAST RESORT, not user-visible");
console.log("");

// ============================================================
// EXAMPLE 3 — getBy vs queryBy vs findBy
// Story: Myntra's search page shows "No results found" when empty.
//   Testing it appears needs getByText. Testing it DISAPPEARS needs
//   queryByText (getBy throws if missing). Testing async rendering
//   needs findByText (returns a Promise, waits for element).
// ============================================================

// --- getBy: Element MUST exist (throws if not found) ---
// const button = getByRole('button', { name: 'Add to Bag' });

// --- queryBy: Element MIGHT not exist (returns null) ---
// const error = queryByText('Payment failed');
// expect(error).not.toBeInTheDocument();   // Assert ABSENCE

// --- findBy: Element appears ASYNCHRONOUSLY (returns Promise) ---
// const toast = await findByText('Item added to bag!');   // Waits up to 1s

// Each has an "All" variant: getAllByRole, queryAllByText, findAllByRole

console.log("--- getBy vs queryBy vs findBy ---");
console.log("getBy:   element MUST exist (throws if absent)");
console.log("queryBy: element MIGHT not exist (returns null)");
console.log("findBy:  element appears ASYNC (returns Promise)");
console.log("");

// ============================================================
// EXAMPLE 4 — User Events (Simulating Real Interactions)
// Story: When a Myntra user clicks "Add to Bag", the browser fires
//   pointerdown, mousedown, pointerup, mouseup, click. fireEvent only
//   fires click. userEvent fires the full realistic sequence — catching
//   bugs that only appear with real interaction patterns.
// ============================================================

// WHY: @testing-library/user-event simulates events like a real user.
// Setup: import userEvent from '@testing-library/user-event';
//        const user = userEvent.setup();

// await user.click(button)           — full click sequence + focus
// await user.type(input, 'hello')    — types one character at a time
// await user.clear(input)            — select all + delete
// await user.selectOptions(sel, 'M') — clicks select, chooses option
// await user.tab()                   — moves focus to next element
// await user.keyboard('{Enter}')     — presses Enter key

// userEvent vs fireEvent:
//   fireEvent.click: ONLY click event, no focus, no preceding events
//   userEvent.click: FULL sequence (pointerdown → mousedown → ... → click + focus)
//   PREFER userEvent for all new tests.

console.log("--- User Events ---");
console.log("user.click(btn)       — realistic click sequence + focus");
console.log("user.type(inp, text)  — character-by-character typing");
console.log("user.tab()            — moves focus (triggers blur)");
console.log("PREFER userEvent over fireEvent for realistic testing.");
console.log("");

// ============================================================
// EXAMPLE 5 — DOM Assertions with jest-dom
// Story: Myntra's accessibility team needed tests to verify disabled
//   items, sold-out overlays, and selected sizes. Custom matchers
//   from jest-dom make these assertions readable and expressive.
// ============================================================

// WHY: @testing-library/jest-dom extends expect() with DOM matchers.
// Setup: import '@testing-library/jest-dom';

// expect(el).toBeInTheDocument()            — exists in DOM
// expect(el).toBeVisible()                  — not hidden by CSS
// expect(btn).toBeDisabled() / toBeEnabled()
// expect(el).toHaveTextContent('Add to Bag') — text inside element
// expect(input).toHaveValue('john@example.com')
// expect(el).toHaveClass('active')          — CSS class present
// expect(link).toHaveAttribute('href', '/cart')
// expect(input).toBeRequired() / toBeValid() / toBeInvalid()
// expect(input).toHaveFocus()
// expect(checkbox).toBeChecked()

console.log("--- jest-dom Matchers ---");
console.log("toBeInTheDocument, toBeVisible, toBeDisabled, toHaveTextContent");
console.log("toHaveValue, toHaveClass, toHaveAttribute, toHaveFocus");
console.log("");

// ============================================================
// EXAMPLE 6 — Vanilla JS DOM Components (Code Under Test)
// Story: Myntra's product page has vanilla JS components — a product
//   card with Add to Bag and a size selector. No React, no Vue.
//   Testing Library works beautifully for vanilla JS too.
// ============================================================

// WHY: Testing Library works with ANY DOM manipulation — vanilla JS,
// jQuery, Web Components. Pattern: set up HTML, call function, assert.

function createProductCard(product) {
  const card = document.createElement("div");
  card.className = "product-card";
  card.innerHTML = `
    <img src="${product.image}" alt="${product.name}" />
    <h3>${product.name}</h3>
    <p class="brand">${product.brand}</p>
    <p class="price">Rs. ${product.price.toLocaleString("en-IN")}</p>
    <span class="cart-count" aria-label="Cart count">0</span>
    <button aria-label="Add ${product.name} to bag">Add to Bag</button>
  `;
  let cartCount = 0;
  const button = card.querySelector("button");
  const countSpan = card.querySelector(".cart-count");

  button.addEventListener("click", () => {
    cartCount++;
    countSpan.textContent = String(cartCount);
    if (cartCount === 1) {
      button.textContent = "Go to Bag";
      button.setAttribute("aria-label", "Go to shopping bag");
      const toast = document.createElement("div");
      toast.setAttribute("role", "alert");
      toast.textContent = "Item added to bag!";
      card.appendChild(toast);
      setTimeout(() => toast.remove(), 3000); // Auto-dismiss
    }
  });
  return card;
}

function createSizeSelector(sizes) {
  const container = document.createElement("div");
  container.setAttribute("role", "radiogroup");
  container.setAttribute("aria-label", "Select size");
  const hiddenInput = document.createElement("input");
  hiddenInput.type = "hidden"; hiddenInput.name = "selectedSize";
  container.appendChild(hiddenInput);

  sizes.forEach((size) => {
    const chip = document.createElement("button");
    chip.setAttribute("role", "radio"); chip.setAttribute("aria-checked", "false");
    chip.setAttribute("aria-label", `Size ${size}`); chip.textContent = size;
    chip.addEventListener("click", () => {
      container.querySelectorAll("[role=radio]").forEach((c) => {
        c.classList.remove("selected"); c.setAttribute("aria-checked", "false");
      });
      chip.classList.add("selected"); chip.setAttribute("aria-checked", "true");
      hiddenInput.value = size;
    });
    container.appendChild(chip);
  });
  return container;
}

console.log("--- Vanilla JS Components ---");
console.log("createProductCard()  — product card with Add to Bag");
console.log("createSizeSelector() — size chips with selection logic");
console.log("");

// ============================================================
// EXAMPLE 7 — Writing DOM Tests (Product Card)
// Story: Myntra's test suite for the product card: create the DOM,
//   append to body, query with Testing Library, simulate events,
//   assert state, clean up. This is the fundamental DOM test pattern.
// ============================================================

// describe('Product Card', () => {
//   let container;
//   const product = { id: 'MYN001', name: 'Roadster Slim Fit Jeans',
//                     brand: 'Roadster', price: 1299, image: '/jeans.jpg' };
//
//   beforeEach(() => { container = createProductCard(product); document.body.appendChild(container); });
//   afterEach(() => { document.body.innerHTML = ''; });
//
//   test('renders product details', () => {
//     const card = within(container);
//     expect(card.getByText('Roadster Slim Fit Jeans')).toBeInTheDocument();
//     expect(card.getByText('Roadster')).toBeInTheDocument();
//     expect(card.getByText(/Rs\. 1,299/)).toBeInTheDocument();
//     expect(card.getByRole('img')).toHaveAttribute('alt', 'Roadster Slim Fit Jeans');
//   });
//
//   test('starts with cart count 0', () => {
//     expect(within(container).getByLabelText('Cart count')).toHaveTextContent('0');
//   });
//
//   test('increments count on click', async () => {
//     const user = userEvent.setup();
//     await user.click(within(container).getByRole('button', { name: /add.*to bag/i }));
//     expect(within(container).getByLabelText('Cart count')).toHaveTextContent('1');
//   });
//
//   test('changes button to "Go to Bag"', async () => {
//     const user = userEvent.setup();
//     const btn = within(container).getByRole('button', { name: /add.*to bag/i });
//     await user.click(btn);
//     expect(btn).toHaveTextContent('Go to Bag');
//     expect(btn).toHaveAttribute('aria-label', 'Go to shopping bag');
//   });
//
//   test('shows toast notification', async () => {
//     const user = userEvent.setup();
//     await user.click(within(container).getByRole('button', { name: /add.*to bag/i }));
//     expect(within(container).getByRole('alert')).toHaveTextContent('Item added to bag!');
//   });
//
//   test('toast disappears after 3 seconds', async () => {
//     vi.useFakeTimers();
//     const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
//     await user.click(within(container).getByRole('button', { name: /add.*to bag/i }));
//     expect(within(container).getByRole('alert')).toBeInTheDocument();
//     vi.advanceTimersByTime(3000);
//     expect(within(container).queryByRole('alert')).not.toBeInTheDocument(); // queryBy for absence!
//     vi.useRealTimers();
//   });
// });

console.log("--- Product Card Tests ---");
console.log("Pattern: create element, append, query, simulate, assert, clean up.");
console.log("Use within(container) to scope queries.");
console.log("");

// ============================================================
// EXAMPLE 8 — Testing the Size Selector
// Story: Selected size must be highlighted (CSS class), programmatically
//   indicated (aria-checked), and stored in hidden input. All three
//   must stay in sync.
// ============================================================

// describe('Size Selector', () => {
//   let container;
//   beforeEach(() => { container = createSizeSelector(['S','M','L','XL']); document.body.appendChild(container); });
//   afterEach(() => { document.body.innerHTML = ''; });
//
//   test('renders all sizes', () => {
//     const sizes = within(container).getAllByRole('radio');
//     expect(sizes).toHaveLength(4);
//     expect(sizes.map(s => s.textContent)).toEqual(['S','M','L','XL']);
//   });
//
//   test('no size selected initially', () => {
//     within(container).getAllByRole('radio').forEach(s => {
//       expect(s).toHaveAttribute('aria-checked', 'false');
//       expect(s).not.toHaveClass('selected');
//     });
//   });
//
//   test('clicking selects size', async () => {
//     const user = userEvent.setup();
//     const medium = within(container).getByRole('radio', { name: 'Size M' });
//     await user.click(medium);
//     expect(medium).toHaveAttribute('aria-checked', 'true');
//     expect(medium).toHaveClass('selected');
//   });
//
//   test('clicking new size deselects previous', async () => {
//     const user = userEvent.setup();
//     const medium = within(container).getByRole('radio', { name: 'Size M' });
//     const large = within(container).getByRole('radio', { name: 'Size L' });
//     await user.click(medium);
//     await user.click(large);
//     expect(medium).toHaveAttribute('aria-checked', 'false');
//     expect(large).toHaveAttribute('aria-checked', 'true');
//   });
//
//   test('updates hidden input', async () => {
//     const user = userEvent.setup();
//     await user.click(within(container).getByRole('radio', { name: 'Size L' }));
//     expect(container.querySelector('input[name="selectedSize"]').value).toBe('L');
//   });
// });

console.log("--- Size Selector Tests ---");
console.log("Verify BOTH visual state (class) and programmatic state (aria).");
console.log("");

// ============================================================
// EXAMPLE 9 — Testing Forms and Validation
// Story: Myntra's checkout form has real-time email validation and
//   pincode auto-fill. Each behavior is a DOM interaction to test.
// ============================================================

function createCheckoutForm() {
  const form = document.createElement("form");
  form.setAttribute("aria-label", "Checkout form");
  form.innerHTML = `
    <label for="ck-email">Email</label>
    <input id="ck-email" type="email" required placeholder="Enter your email" />
    <span class="error" role="alert" aria-live="polite"></span>
    <label for="ck-pin">Pincode</label>
    <input id="ck-pin" type="text" required placeholder="6-digit pincode" maxlength="6" />
    <span class="city-display"></span>
    <button type="submit">Place Order</button>
  `;
  const emailInput = form.querySelector("#ck-email");
  const emailError = form.querySelector(".error");
  const pincodeInput = form.querySelector("#ck-pin");
  const cityDisplay = form.querySelector(".city-display");
  const cities = { 560001: "Bangalore, Karnataka", 400001: "Mumbai, Maharashtra", 110001: "New Delhi, Delhi" };

  emailInput.addEventListener("blur", () => {
    if (emailInput.value && !emailInput.value.includes("@")) {
      emailError.textContent = "Please enter a valid email address";
    } else { emailError.textContent = ""; }
  });
  pincodeInput.addEventListener("input", () => {
    cityDisplay.textContent = pincodeInput.value.length === 6 && cities[pincodeInput.value] ? cities[pincodeInput.value] : "";
  });
  form.addEventListener("submit", (e) => { e.preventDefault(); form.setAttribute("data-submitted", "true"); });
  return form;
}

// test('shows error for invalid email on blur', async () => {
//   const form = createCheckoutForm(); document.body.appendChild(form);
//   const user = userEvent.setup();
//   await user.type(screen.getByLabelText('Email'), 'invalid-email');
//   await user.tab();  // triggers blur
//   expect(screen.getByRole('alert')).toHaveTextContent('Please enter a valid email address');
// });
//
// test('auto-fills city for valid pincode', async () => {
//   const form = createCheckoutForm(); document.body.appendChild(form);
//   const user = userEvent.setup();
//   await user.type(screen.getByLabelText('Pincode'), '560001');
//   expect(screen.getByText('Bangalore, Karnataka')).toBeInTheDocument();
// });

console.log("--- Form Testing ---");
console.log("user.type + user.tab for validation testing.");
console.log("Test: validation errors, auto-fill, form submission.");
console.log("");

// ============================================================
// EXAMPLE 10 — Testing Async DOM Updates
// Story: Myntra's wishlist loads items asynchronously. The page shows
//   "Loading..." then renders products. findBy queries wait for
//   elements to appear in the DOM.
// ============================================================

function renderWishlist(container, fetchItems) {
  container.innerHTML = '<p role="status">Loading your wishlist...</p>';
  fetchItems()
    .then((items) => {
      if (items.length === 0) { container.innerHTML = "<p>Your wishlist is empty.</p>"; return; }
      container.innerHTML = `<h2>Wishlist (${items.length})</h2><ul role="list">${items.map(i => `<li>${i.name} — Rs. ${i.price}</li>`).join("")}</ul>`;
    })
    .catch((err) => { container.innerHTML = `<p role="alert">Error: ${err.message}</p>`; });
}

// test('shows loading then items', async () => {
//   const container = document.createElement('div'); document.body.appendChild(container);
//   renderWishlist(container, () => Promise.resolve([{ name: 'Jeans', price: 1299 }]));
//   const heading = await within(container).findByText('Wishlist (1)');  // Waits for async
//   expect(heading).toBeInTheDocument();
// });
// test('shows error on failure', async () => {
//   const container = document.createElement('div'); document.body.appendChild(container);
//   renderWishlist(container, () => Promise.reject(new Error('Network error')));
//   const error = await within(container).findByRole('alert');
//   expect(error).toHaveTextContent('Error: Network error');
// });

console.log("--- Async DOM Testing ---");
console.log("findByText/findByRole — wait for element to appear.");
console.log("Test: loading → success, loading → empty, loading → error.");
console.log("");

// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. DOM testing requires jsdom (or happy-dom) since Node.js has no DOM.
//
// 2. Query by ROLE first, then label, placeholder, text, test-id (last).
//
// 3. Three query variants: getBy (must exist), queryBy (might not),
//    findBy (appears async). Each has an "All" variant.
//
// 4. Use @testing-library/user-event over fireEvent — realistic events.
//
// 5. jest-dom matchers: toBeInTheDocument, toBeVisible, toBeDisabled,
//    toHaveTextContent, toHaveValue, toHaveClass, toHaveAttribute.
//
// 6. Pattern: create → append to body → query → simulate → assert → clean up.
//
// 7. Test BOTH visual (classes, text) and programmatic (aria, form values).
//
// 8. Use within(container) to scope queries and prevent test pollution.
//
// 9. For async DOM: findBy queries wait for elements to appear.
//
// 10. Accessibility in tests: ARIA roles, labels, alerts. Tests that
//     use accessible queries encourage building accessible UIs.
// ============================================================

console.log("=== File 07 Complete: Testing DOM Interactions ===");
