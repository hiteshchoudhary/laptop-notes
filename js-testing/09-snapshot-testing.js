// ============================================================
// FILE 09: SNAPSHOT TESTING
// Topic: Capturing output, comparing against stored snapshots, and managing snapshot lifecycle
// WHY: Snapshot tests are an automated way to detect unexpected changes
//   in your output — rendered HTML, API responses, config objects.
//   They're a safety net that says "this changed — was it intentional?"
// ============================================================

// ============================================================
// EXAMPLE 1 — CRED Rewards Page
// Story: CRED's rewards page displays exclusive offers based on credit
//   score and spending. After a routine refactor, a developer changed
//   reward tier labels from "Gold" to "gold" (lowercase). No unit test
//   caught it because none explicitly checked the tier label. A snapshot
//   test would have flagged the change instantly.
// ============================================================

// WHY: Snapshot testing catches changes you didn't write explicit
// assertions for. It's a broad safety net — not a replacement for
// unit tests, but a complement that catches visual regressions.

console.log("--- What is Snapshot Testing? ---");
console.log("1. First run: capture output, save to .snap file");
console.log("2. Next runs: compare current output to stored snapshot");
console.log("3. If different: test FAILS, shows exact diff");
console.log("4. Developer reviews: was this change intentional?");
console.log("");

// ============================================================
// EXAMPLE 2 — Basic Snapshot Testing
// Story: CRED's order confirmation includes transaction details. The
//   product team tweaks the layout every sprint. Snapshot tests alert
//   the team whenever rendered output changes — even a single character.
// ============================================================

// WHY: toMatchSnapshot() serializes any value and stores it.
// On subsequent runs, any difference fails the test.

function generateOrderConfirmation(order) {
  const subtotal = order.items.reduce((sum, i) => sum + i.quantity * i.price, 0);
  return {
    orderId: order.id,
    customerName: order.customer.name,
    items: order.items.map((item) => ({
      name: item.name, quantity: item.quantity, price: item.price,
      total: item.quantity * item.price,
    })),
    subtotal,
    gst: Math.round(subtotal * 0.18),
    grandTotal: Math.round(subtotal * 1.18),
    rewardPoints: Math.floor(subtotal / 100),
    tier: determineTier(subtotal),
    message: `Thank you, ${order.customer.name}! Your order #${order.id} has been confirmed.`,
  };
}

function determineTier(amount) {
  if (amount >= 50000) return "Platinum";
  if (amount >= 20000) return "Gold";
  if (amount >= 5000) return "Silver";
  return "Bronze";
}

// test('order confirmation matches snapshot', () => {
//   const order = {
//     id: 'CRED-2024-001',
//     customer: { name: 'Rahul Sharma' },
//     items: [
//       { name: 'Premium Credit Card Holder', quantity: 1, price: 2999 },
//       { name: 'CRED Travel Kit', quantity: 2, price: 1499 },
//     ],
//   };
//   const confirmation = generateOrderConfirmation(order);
//   expect(confirmation).toMatchSnapshot();
//   // First run: creates __snapshots__/09-snapshot-testing.test.js.snap
//   // Next runs: compares current value to stored snapshot
// });

// The .snap file stores a human-readable serialized format:
// exports[`order confirmation matches snapshot 1`] = `
// {
//   "orderId": "CRED-2024-001",
//   "customerName": "Rahul Sharma",
//   "items": [...],
//   "subtotal": 5997,
//   "tier": "Silver",
//   ...
// }`;

console.log("--- Basic Snapshot ---");
console.log("expect(value).toMatchSnapshot()");
console.log("Stored in __snapshots__/ directory. Commit to version control.");
console.log("");

// ============================================================
// EXAMPLE 3 — Inline Snapshots
// Story: CRED's API team uses inline snapshots for small values.
//   Instead of a separate .snap file, the snapshot is stored RIGHT
//   IN the test file. The test runner auto-fills on the first run.
// ============================================================

// WHY: Great for small values. Visible during code review without
// opening a separate .snap file.

// test('tier determination', () => {
//   expect(determineTier(60000)).toMatchInlineSnapshot(`"Platinum"`);
//   expect(determineTier(25000)).toMatchInlineSnapshot(`"Gold"`);
//   expect(determineTier(8000)).toMatchInlineSnapshot(`"Silver"`);
//   expect(determineTier(1000)).toMatchInlineSnapshot(`"Bronze"`);
// });

// On FIRST run, vitest auto-fills the inline snapshot:
// Before: expect(determineTier(60000)).toMatchInlineSnapshot();
// After:  expect(determineTier(60000)).toMatchInlineSnapshot(`"Platinum"`);

console.log("--- Inline Snapshots ---");
console.log("toMatchInlineSnapshot() — stored in the test file itself.");
console.log("Auto-filled on first run. Great for small values.");
console.log("");

// ============================================================
// EXAMPLE 4 — Snapshot Testing HTML Templates
// Story: CRED renders email confirmations as HTML. The exact structure
//   matters — broken tags or wrong content breaks email layout.
//   Snapshots capture the ENTIRE structure and flag any change.
// ============================================================

function renderConfirmationEmail(order) {
  const c = generateOrderConfirmation(order);
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    .header { background: #1a1a2e; color: #e0e0e0; padding: 20px; text-align: center; }
    .tier-badge { padding: 4px 12px; border-radius: 12px; font-weight: bold; }
    .total-row { font-weight: bold; font-size: 1.2em; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Order Confirmed!</h1>
    <p>${c.message}</p>
    <span class="tier-badge tier-${c.tier}">${c.tier} Member</span>
  </div>
  <table>
    <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
    <tbody>
      ${c.items.map(i => `<tr><td>${i.name}</td><td>${i.quantity}</td><td>Rs. ${i.price}</td><td>Rs. ${i.total}</td></tr>`).join("")}
    </tbody>
    <tfoot>
      <tr><td colspan="3">Subtotal</td><td>Rs. ${c.subtotal}</td></tr>
      <tr><td colspan="3">GST (18%)</td><td>Rs. ${c.gst}</td></tr>
      <tr class="total-row"><td colspan="3">Grand Total</td><td>Rs. ${c.grandTotal}</td></tr>
    </tfoot>
  </table>
  <p>You earned <strong>${c.rewardPoints} CRED coins</strong>!</p>
</body>
</html>`.trim();
}

// test('email HTML matches snapshot', () => {
//   const order = {
//     id: 'CRED-2024-042', customer: { name: 'Ananya Iyer' },
//     items: [{ name: 'Wireless Earbuds', quantity: 1, price: 4999 }],
//   };
//   expect(renderConfirmationEmail(order)).toMatchSnapshot();
// });

console.log("--- HTML Snapshots ---");
console.log("Snapshot entire HTML templates. Catches structural changes.");
console.log("Review HTML snapshots carefully in PRs — they're verbose.");
console.log("");

// ============================================================
// EXAMPLE 5 — Updating Snapshots
// Story: CRED changed "Silver" to "Classic". Snapshot test fails (as
//   expected). Developer reviews diff, confirms intentional, updates.
// ============================================================

// WHY: When a snapshot fails, you have two choices:
// 1. The change is a BUG → fix your code, don't update snapshot
// 2. The change is INTENTIONAL → update the snapshot

// npx vitest --update     (or -u)     — Vitest
// npx jest --updateSnapshot (or -u)   — Jest
// In watch mode: press 'u' to update interactively

// DANGER: Blindly running --update defeats the purpose!
// Always review the diff BEFORE updating.

// Example failure output:
// - "tier": "Silver",
// + "tier": "Classic",

console.log("--- Updating Snapshots ---");
console.log("npx vitest -u  |  npx jest -u");
console.log("ALWAYS review diff before updating. Blind updates = useless tests.");
console.log("");

// ============================================================
// EXAMPLE 6 — Property Matchers (Handling Dynamic Values)
// Story: CRED's order has a createdAt timestamp and random ID that
//   change every run. Property matchers say "I don't care about the
//   exact value, just the TYPE."
// ============================================================

// WHY: Timestamps, random IDs, UUIDs break plain snapshots.
// Property matchers replace dynamic values with type checks.

function createOrder(items, customer) {
  return {
    orderId: "CRED-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
    createdAt: new Date(),
    updatedAt: new Date(),
    customer,
    items,
    status: "confirmed",
    totalAmount: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
  };
}

// BAD: Fails every run because orderId and createdAt change
// expect(createOrder([...], customer)).toMatchSnapshot();

// GOOD: Property matchers for dynamic values
// test('order with dynamic values', () => {
//   const order = createOrder(
//     [{ name: 'Earbuds', quantity: 1, price: 4999 }],
//     { name: 'Vikram', email: 'vikram@cred.club' }
//   );
//   expect(order).toMatchSnapshot({
//     orderId: expect.any(String),       // Any string is fine
//     createdAt: expect.any(Date),       // Any Date is fine
//     updatedAt: expect.any(Date),
//   });
// });

// The snapshot stores:  "orderId": Any<String>, "createdAt": Any<Date>

console.log("--- Property Matchers ---");
console.log("toMatchSnapshot({ id: expect.any(String), date: expect.any(Date) })");
console.log("Dynamic values replaced with type checks in the snapshot.");
console.log("");

// ============================================================
// EXAMPLE 7 — What to Snapshot (and What NOT to Snapshot)
// Story: A CRED intern snapshotted everything — CSS classes, Redux
//   store, entire DOM trees. Every small change broke 50+ snapshots.
//   Team started blindly updating. Snapshots became useless noise.
// ============================================================

// GOOD candidates:
// - Rendered HTML/JSX (catches structural changes)
// - API response shapes (catches contract changes)
// - Configuration objects (catches accidental config changes)
// - Error messages (catches when text changes unexpectedly)

// BAD candidates:
// - Large objects (100+ lines) — unreadable diffs, reviewers skip them
// - Frequently changing objects — constant updates = "update fatigue"
// - CSS class names / internal IDs — implementation details
// - Random/time-dependent values without matchers — new every run
// - Third-party library output — changes on library updates

console.log("--- What to Snapshot ---");
console.log("GOOD: HTML output, API shapes, config, error messages.");
console.log("BAD:  Large objects, changing data, CSS classes, random values.");
console.log("Rule: If you'd blindly update it, don't snapshot it.");
console.log("");

// ============================================================
// EXAMPLE 8 — Snapshot Best Practices
// Story: CRED's tech lead wrote guidelines that transformed snapshots
//   from noisy tests everyone ignored into valuable safety nets.
// ============================================================

// 1. Keep snapshots SMALL and FOCUSED
//    BAD:  expect(renderEntirePage()).toMatchSnapshot();
//    GOOD: expect(renderRewardCard(reward)).toMatchSnapshot();

// 2. Name your snapshots for readability
//    expect(badge).toMatchSnapshot('gold tier badge');

// 3. Review .snap changes in code review like any other code

// 4. Use inline snapshots for values under ~5 lines
//    expect(formatCurrency(1299)).toMatchInlineSnapshot(`"Rs. 1,299"`);

// 5. Combine snapshots with targeted assertions
//    expect(confirmation.grandTotal).toBe(7076);        // Critical logic
//    expect(confirmation).toMatchSnapshot();             // Structure safety net

console.log("--- Best Practices ---");
console.log("1. Small & focused — snapshot sections, not pages");
console.log("2. Name snapshots: toMatchSnapshot('descriptive name')");
console.log("3. Review .snap changes in PRs like code changes");
console.log("4. Inline for small values, file for large ones");
console.log("5. Combine with targeted assertions for critical logic");
console.log("");

// ============================================================
// EXAMPLE 9 — Custom Serializers
// Story: CRED uses custom Date formatting. The default serializer
//   shows raw ISO strings. A custom serializer makes dates readable.
// ============================================================

// In vitest.config.js: { snapshotSerializers: ['./my-date-serializer.js'] }
//
// my-date-serializer.js:
// module.exports = {
//   test(val) { return val instanceof Date; },
//   print(val) { return `Date<${val.toISOString().split('T')[0]}>`; },
// };
// Without serializer: "createdAt": 2024-01-15T10:30:00.000Z
// With serializer:    "createdAt": Date<2024-01-15>

console.log("--- Custom Serializers ---");
console.log("Transform how types appear in snapshots.");
console.log("Use for: date formatting, stripping volatile fields.");
console.log("");

// ============================================================
// EXAMPLE 10 — Snapshot File Management
// Story: CRED's repo grew to 200+ snapshot files. Some were orphaned.
//   Others were 10,000+ lines from over-snapshotting.
// ============================================================

// Cleaning orphaned snapshots:
//   npx vitest --update  (removes snapshots for deleted tests)
//   npx jest --ci        (fails if obsolete snapshots exist)

// Git practices:
//   DO commit .snap files (they're the expected output)
//   DO review .snap changes in PRs
//   DO NOT .gitignore snapshot files
//   DO clean up obsolete snapshots regularly

console.log("--- Snapshot File Management ---");
console.log("Commit .snap files. Review in PRs. Clean up orphaned ones.");
console.log("");

// ============================================================
// EXAMPLE 11 — Practical: Complete CRED Test Suite
// Story: Realistic test file combining object snapshots, HTML
//   snapshots, inline snapshots, and property matchers.
// ============================================================

function formatCurrency(amount) {
  return "Rs. " + amount.toLocaleString("en-IN");
}

function renderRewardSummary(order) {
  const c = generateOrderConfirmation(order);
  return `<div class="reward-summary">
  <div class="tier-badge ${c.tier.toLowerCase()}">${c.tier} Member</div>
  <p>You earned <strong>${c.rewardPoints}</strong> CRED coins</p>
  <p>${c.message}</p>
</div>`;
}

// describe('Order Snapshots', () => {
//   const order = {
//     id: 'CRED-2024-001', customer: { name: 'Rahul Sharma' },
//     items: [
//       { name: 'Card Holder', quantity: 1, price: 2999 },
//       { name: 'Travel Kit', quantity: 2, price: 1499 },
//     ],
//   };
//
//   test('confirmation object', () => {
//     const c = generateOrderConfirmation(order);
//     expect(c.grandTotal).toBe(7076);           // Targeted assertion
//     expect(c.tier).toBe('Silver');              // Targeted assertion
//     expect(c).toMatchSnapshot('silver order');  // Structure snapshot
//   });
//
//   test('Bronze tier', () => {
//     const o = { id: 'B', customer: { name: 'X' }, items: [{ name: 'A', quantity: 1, price: 299 }] };
//     expect(generateOrderConfirmation(o)).toMatchSnapshot('bronze');
//   });
//
//   test('Platinum tier', () => {
//     const o = { id: 'P', customer: { name: 'VIP' }, items: [{ name: 'Bag', quantity: 1, price: 55000 }] };
//     expect(generateOrderConfirmation(o)).toMatchSnapshot('platinum');
//   });
//
//   test('email HTML', () => {
//     expect(renderConfirmationEmail(order)).toMatchSnapshot('email');
//   });
//
//   test('tier determination (inline)', () => {
//     expect(determineTier(100)).toMatchInlineSnapshot(`"Bronze"`);
//     expect(determineTier(5000)).toMatchInlineSnapshot(`"Silver"`);
//     expect(determineTier(20000)).toMatchInlineSnapshot(`"Gold"`);
//     expect(determineTier(50000)).toMatchInlineSnapshot(`"Platinum"`);
//   });
//
//   test('currency formatting (inline)', () => {
//     expect(formatCurrency(1299)).toMatchInlineSnapshot(`"Rs. 1,299"`);
//     expect(formatCurrency(100000)).toMatchInlineSnapshot(`"Rs. 1,00,000"`);
//   });
//
//   test('dynamic order with property matchers', () => {
//     const o = createOrder([{ name: 'Earbuds', quantity: 1, price: 4999 }], { name: 'Priya' });
//     expect(o).toMatchSnapshot({ orderId: expect.any(String), createdAt: expect.any(Date), updatedAt: expect.any(Date) });
//   });
//
//   test('reward summary HTML', () => {
//     expect(renderRewardSummary(order)).toMatchSnapshot('reward summary');
//   });
//
//   test('empty order', () => {
//     const o = { id: 'E', customer: { name: 'Empty' }, items: [] };
//     const c = generateOrderConfirmation(o);
//     expect(c.subtotal).toBe(0);
//     expect(c.tier).toBe('Bronze');
//     expect(c).toMatchSnapshot('empty order');
//   });
// });

console.log("--- Complete Snapshot Suite ---");
console.log("Object + HTML + inline + property matchers + edge cases.");
console.log("");

// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. Snapshot testing captures output and compares on subsequent runs.
//    Any difference fails the test and shows the exact diff.
//
// 2. toMatchSnapshot() → .snap file. toMatchInlineSnapshot() → inline.
//    Use inline for small values (< 5 lines).
//
// 3. Update with --update/-u. ALWAYS review diff before updating.
//
// 4. Property matchers for dynamic values:
//    toMatchSnapshot({ id: expect.any(String), date: expect.any(Date) })
//
// 5. GOOD to snapshot: HTML output, API shapes, config, errors.
//    BAD to snapshot: large objects, CSS classes, random values.
//
// 6. Keep snapshots small and focused. Name them descriptively.
//
// 7. Combine snapshots with targeted assertions for critical logic.
//
// 8. Commit .snap files. Review changes in PRs like code changes.
//
// 9. Custom serializers format complex types for readable snapshots.
//
// 10. Workflow: test fails → review diff → fix bug OR update snapshot.
// ============================================================

console.log("=== File 09 Complete: Snapshot Testing ===");
