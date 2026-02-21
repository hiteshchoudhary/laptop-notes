// ============================================================
// FILE 13: END-TO-END (E2E) TESTING
// Topic: Testing the entire application as a real user would
// WHY: Unit tests verify functions, integration tests verify services,
//   but E2E tests verify the COMPLETE user experience — from opening
//   the browser to clicking buttons to seeing results. If E2E tests
//   pass, you know a real human can use your application.
// ============================================================

// ============================================================
// EXAMPLE 1 — IRCTC: Testing for 10 Million Daily Users
// Story: IRCTC serves 10M+ users daily during peak booking hours.
//   The entire flow — login, search trains, select seats, pay, and
//   download ticket — must work flawlessly across browsers. Playwright
//   E2E tests run nightly, catching 40+ regressions before production,
//   including a CSS bug that hid the "Pay Now" button on Safari and
//   a JS error that broke captcha on Firefox.
// ============================================================

// WHY: E2E tests catch bugs no other test type can find — layout
// issues, browser-specific behavior, and real user interaction flows.

// --- The Testing Pyramid ---
//         /\          E2E (few, slow, high confidence)
//        /  \
//       /----\        Integration (moderate)
//      /------\
//     /--------\      Unit (many, fast, focused)

console.log("--- Testing Pyramid ---");
console.log("E2E:         5-15 critical journeys, slow, highest confidence");
console.log("Integration: 50-200 service tests, medium speed");
console.log("Unit:        500-5000 function tests, fast, focused\n");


// ============================================================
// EXAMPLE 2 — E2E vs Integration: The Key Difference
// Story: IRCTC's tech lead draws the line: integration tests send
//   HTTP requests directly; E2E tests open a REAL browser and click
//   like a human. Both valuable, different scope.
// ============================================================

console.log("--- E2E vs Integration ---");
console.log("Integration: No browser, uses supertest/HTTP client, tests APIs");
console.log("E2E:         Real browser (Chromium/Firefox/WebKit), tests UI\n");


// ============================================================
// EXAMPLE 3 — Playwright: The Modern E2E Framework
// Story: IRCTC evaluated Selenium (slow), Cypress (Chrome-only), and
//   Playwright (modern, cross-browser, fast). They chose Playwright
//   because many Indian users browse on Safari (iPhone) and Firefox.
// ============================================================

// WHY: Playwright is the modern standard — faster than Selenium,
// more capable than Cypress, supports all major browsers.

console.log("--- Framework Comparison ---");
console.log("Selenium:   Legacy. Slow, complex, flaky. Use for old projects.");
console.log("Cypress:    Good DX, but primarily Chrome. Limited cross-browser.");
console.log("Playwright: Modern standard. Cross-browser, fast, auto-waiting.\n");

// Setup: npm init playwright@latest
// Creates: playwright.config.js, tests/, .github/workflows/

// --- Playwright features that set it apart ---
// - Auto-waiting: no sleep() needed, waits for elements automatically
// - Cross-browser: Chromium, Firefox, WebKit in one test suite
// - Multi-tab/multi-window: test complex flows (OAuth popups, etc.)
// - Network interception: mock API responses in the browser
// - Mobile emulation: test on iPhone/Android viewports
// - API testing: can also test REST APIs directly (not just browser)
// - Trace viewer: detailed timeline of every action for debugging
// - Codegen: record browser actions and generate test code


// ============================================================
// EXAMPLE 4 — Basic Playwright Test Structure
// Story: An IRCTC intern writes their first Playwright test. The
//   senior engineer walks through the syntax step by step.
// ============================================================

// WHY: Every Playwright test follows the same pattern:
// navigate, interact, assert.

// test('user can search for trains', async ({ page }) => {
//   // Navigate
//   await page.goto('https://irctc.co.in');
//   // Interact
//   await page.fill('#from', 'Delhi');
//   await page.fill('#to', 'Mumbai');
//   await page.click('button:has-text("Search")');
//   // Assert
//   await expect(page.locator('.results')).toBeVisible();
// });

console.log("--- Basic Test Structure ---");
console.log("test('description', async ({ page }) => {");
console.log("  await page.goto(url);           // Navigate");
console.log("  await page.fill(selector, val); // Interact");
console.log("  await page.click(selector);");
console.log("  await expect(locator).toBeVisible(); // Assert");
console.log("});\n");


// ============================================================
// EXAMPLE 5 — Locators: Finding Elements Reliably
// Story: IRCTC switched from CSS selectors (.btn-primary.mt-3) to
//   stable locators (getByRole, getByTestId). Flakiness dropped 80%.
// ============================================================

// WHY: Fragile locators = flaky tests. Stable locators = reliable tests.

const locators = [
  { method: "getByRole('button', { name: 'Search' })", stability: "Excellent", why: "Accessibility-based, rarely changes" },
  { method: "getByText('Book Now')",                    stability: "Good",      why: "Based on visible text" },
  { method: "getByTestId('search-btn')",                stability: "Excellent", why: "Dedicated test attribute" },
  { method: "getByLabel('From Station')",               stability: "Good",      why: "Based on form labels" },
  { method: "getByPlaceholder('Enter station')",        stability: "Fair",      why: "Placeholders can change" },
  { method: "locator('.btn-primary.mt-3')",             stability: "Poor",      why: "CSS classes change often" },
];

console.log("--- Locator Priority (best to worst) ---");
locators.forEach((loc, i) => {
  console.log(`  ${i + 1}. ${loc.method} — ${loc.stability}: ${loc.why}`);
});


// ============================================================
// EXAMPLE 6 — Actions and Assertions
// Story: IRCTC's team creates a reference of all Playwright actions
//   and assertions used across their 25 E2E tests.
// ============================================================

console.log("\n--- Actions (what the 'user' does) ---");
console.log("  click:        await page.click('button#search');");
console.log("  fill:         await page.fill('#from', 'Delhi');");
console.log("  check:        await page.check('#agree-terms');");
console.log("  selectOption: await page.selectOption('#class', 'sleeper');");
console.log("  press:        await page.press('#search', 'Enter');");
console.log("  hover:        await page.hover('.train-card');");
console.log("  setInputFiles:await page.setInputFiles('#upload', 'doc.pdf');");

console.log("\n--- Assertions (what we verify) ---");
console.log("  toBeVisible:   await expect(locator).toBeVisible();");
console.log("  toHaveText:    await expect(locator).toHaveText('Rs 500');");
console.log("  toHaveURL:     await expect(page).toHaveURL(/booking/);");
console.log("  toHaveCount:   await expect(locator).toHaveCount(5);");
console.log("  toBeEnabled:   await expect(locator).toBeEnabled();");
console.log("  toBeChecked:   await expect(locator).toBeChecked();");


// ============================================================
// EXAMPLE 7 — Auto-Waiting: No More sleep()
// Story: IRCTC's Selenium tests had sleep(3000) everywhere. Sometimes
//   too short (fail), sometimes too long (slow). Playwright auto-waits
//   until elements are ready, eliminating this entire class of bugs.
// ============================================================

// WHY: Most E2E flakiness comes from timing. Playwright auto-waiting
// eliminates it entirely.

console.log("\n--- Auto-Waiting ---");
console.log("BAD (Selenium): await sleep(3000); await page.click('#btn');");
console.log("GOOD (Playwright): await page.click('#btn');  // Waits automatically!");
console.log("\nPlaywright auto-checks before acting:");
console.log("  1. Element exists in DOM");
console.log("  2. Element is visible (not hidden by CSS)");
console.log("  3. Element is stable (not animating)");
console.log("  4. Element is enabled (not disabled)");
console.log("  5. No overlay blocking it\n");

// Custom waits for rare cases:
// await page.waitForSelector('.results');         // Wait for element to appear
// await page.waitForURL('**/booking/confirmed');  // Wait for navigation
// await page.waitForResponse('**/api/trains');    // Wait for API call to complete
// await page.waitForLoadState('networkidle');     // Wait for all network to settle
// await page.waitForTimeout(1000);               // AVOID! Hard wait, last resort only

// --- Why auto-waiting matters ---
// Old Selenium test: 30% flaky because of timing
// Same test in Playwright: <2% flaky because of auto-waiting
// This single feature makes Playwright tests dramatically more reliable.
// If you're used to Selenium/Cypress and adding sleeps everywhere,
// Playwright feels like magic. Just write the action; it waits for you.


// ============================================================
// EXAMPLE 8 — Network Interception
// Story: IRCTC can't depend on the real Railways API during testing.
//   Playwright intercepts API calls and returns mock responses.
// ============================================================

// WHY: Control API responses in E2E tests. Test error states, slow
// responses, and edge cases without a backend.

// test('show trains from mocked API', async ({ page }) => {
//   await page.route('**/api/trains', route => route.fulfill({
//     status: 200,
//     contentType: 'application/json',
//     body: JSON.stringify({ trains: [
//       { name: 'Rajdhani Express', departure: '06:00', price: 2500 },
//       { name: 'Shatabdi Express', departure: '08:00', price: 1800 }
//     ]})
//   }));
//   await page.goto('/search');
//   await page.click('button:has-text("Search")');
//   await expect(page.getByText('Rajdhani Express')).toBeVisible();
// });

// Test error: route.fulfill({ status: 500 })
// Test slow:  await delay(3000); then route.fulfill(...)
// Block:      route.abort()

console.log("--- Network Interception ---");
console.log("Mock success: route.fulfill({ status: 200, body: mockData })");
console.log("Mock error:   route.fulfill({ status: 500 })");
console.log("Mock slow:    await delay(3000); route.fulfill(...)");
console.log("Block:        route.abort()");


// ============================================================
// EXAMPLE 9 — Screenshots, Videos, and Codegen
// Story: When a test fails in CI, Playwright captures screenshots
//   and videos automatically. The codegen tool records browser actions
//   and generates test code — saving hours of manual writing.
// ============================================================

// playwright.config.js
// module.exports = defineConfig({
//   use: {
//     screenshot: 'only-on-failure',
//     video: 'retain-on-failure',
//     trace: 'on-first-retry',
//   },
//   projects: [
//     { name: 'chromium', use: { browserName: 'chromium' } },
//     { name: 'firefox',  use: { browserName: 'firefox' } },
//     { name: 'webkit',   use: { browserName: 'webkit' } },
//   ]
// });

console.log("\n--- Debugging Tools ---");
console.log("Screenshots: screenshot: 'only-on-failure' in config");
console.log("Videos:      video: 'retain-on-failure' in config");
console.log("Traces:      trace: 'on-first-retry' in config");
console.log("Codegen:     npx playwright codegen https://example.com");
console.log("  (Opens browser, records your actions, generates test code!)\n");


// ============================================================
// EXAMPLE 10 — Running Tests and CI Integration
// Story: IRCTC runs tests headed (local debugging), headless (CI),
//   and debug mode (step-through). GitHub Actions runs headless on
//   every PR, blocking merge if any journey fails.
// ============================================================

console.log("--- Running Playwright ---");
console.log("All tests:     npx playwright test");
console.log("See browser:   npx playwright test --headed");
console.log("Debug mode:    npx playwright test --debug");
console.log("Single file:   npx playwright test login.spec.js");
console.log("Single browser:npx playwright test --project=firefox");
console.log("Show report:   npx playwright show-report\n");

// --- GitHub Actions CI for Playwright ---
// .github/workflows/e2e.yml
// name: E2E Tests
// on: [push, pull_request]
// jobs:
//   e2e:
//     runs-on: ubuntu-latest
//     steps:
//       - uses: actions/checkout@v4
//       - uses: actions/setup-node@v4
//         with: { node-version: 20 }
//       - run: npm ci
//       - run: npx playwright install --with-deps  # Install browsers!
//       - run: npx playwright test
//       - uses: actions/upload-artifact@v4
//         if: always()
//         with:
//           name: playwright-report
//           path: playwright-report/
//
// Key: npx playwright install --with-deps installs Chromium, Firefox,
// and WebKit PLUS their system dependencies (fonts, libs, etc.)
// This is the most common CI issue — if tests fail in CI but pass
// locally, it's usually because browsers weren't installed.


// ============================================================
// EXAMPLE 11 — Best Practices
// Story: IRCTC's suite grew to 150 tests (slow, 30% flaky). They
//   cut to 25 critical journeys: 8 min runtime, <2% flakiness.
// ============================================================

console.log("--- E2E Best Practices ---");
console.log("1. Test USER JOURNEYS, not individual pages");
console.log("   Good: login -> search -> book -> confirm (one test)");
console.log("2. Use data-testid for stable selectors");
console.log("   Good: page.getByTestId('book-btn')");
console.log("3. Clean up test data (create before, delete after)");
console.log("4. Keep suite SMALL: 5-15 critical paths");
console.log("5. Avoid sleep/hard waits — use Playwright's auto-waiting");
console.log("6. Run in parallel: workers: 4 in config");
console.log("7. Visual regression: expect(page).toHaveScreenshot()\n");


// ============================================================
// EXAMPLE 12 — Practical: E2E Test for Booking Flow
// Story: The most critical IRCTC user journey: login, search trains,
//   select train, fill passenger details, pay, and confirm.
// ============================================================

// test.describe('IRCTC Booking Flow', () => {
//   test('login -> search -> book -> confirm', async ({ page }) => {
//     // LOGIN
//     await page.goto('/login');
//     await page.getByLabel('Username').fill('testuser');
//     await page.getByLabel('Password').fill('SecurePass123!');
//     await page.getByRole('button', { name: 'Sign In' }).click();
//     await expect(page).toHaveURL('/dashboard');
//
//     // SEARCH
//     await page.getByTestId('from-station').fill('New Delhi - NDLS');
//     await page.getByTestId('to-station').fill('Mumbai Central - MMCT');
//     await page.getByTestId('journey-date').fill('2024-03-15');
//     await page.getByRole('button', { name: 'Search' }).click();
//     await expect(page.locator('.train-card')).toHaveCount(5);
//
//     // SELECT TRAIN
//     await page.locator('.train-card').first().getByRole('button', { name: 'Book Now' }).click();
//
//     // PASSENGER DETAILS
//     await page.getByLabel('Travel Class').selectOption('3A');
//     await page.getByTestId('passenger-name-1').fill('Test User');
//     await page.getByTestId('passenger-age-1').fill('28');
//     await page.getByRole('button', { name: 'Continue to Payment' }).click();
//
//     // PAYMENT
//     await page.getByLabel('UPI ID').fill('testuser@upi');
//     await page.getByRole('button', { name: 'Pay Now' }).click();
//     await expect(page.getByText('Payment successful')).toBeVisible({ timeout: 15000 });
//
//     // CONFIRMATION
//     await expect(page).toHaveURL(/booking\/confirmed/);
//     await expect(page.getByText('Booking Confirmed')).toBeVisible();
//     await expect(page.getByText('PNR')).toBeVisible();
//     await page.screenshot({ path: 'screenshots/confirmed.png', fullPage: true });
//   });
// });

// Simulated flow for educational output
class SimulatedPage {
  constructor() { this.actions = []; }
  async goto(url) { this.actions.push(`Navigate to ${url}`); }
  async fill(sel, val) { this.actions.push(`Fill ${sel} with "${val}"`); }
  async click(sel) { this.actions.push(`Click ${sel}`); }
  async select(sel, val) { this.actions.push(`Select "${val}" in ${sel}`); }
}

async function simulateBooking() {
  const page = new SimulatedPage();
  await page.goto('/login');
  await page.fill('#username', 'testuser');
  await page.fill('#password', 'SecurePass123!');
  await page.click('button[Sign In]');
  await page.fill('#from', 'New Delhi - NDLS');
  await page.fill('#to', 'Mumbai Central - MMCT');
  await page.click('button[Search]');
  await page.click('.train-card:first .book-btn');
  await page.select('#class', '3A');
  await page.fill('#name', 'Test User');
  await page.click('button[Continue]');
  await page.fill('#upi', 'testuser@upi');
  await page.click('button[Pay Now]');
  return page.actions;
}

console.log("--- Simulated E2E Booking Flow ---");
simulateBooking().then(actions => {
  actions.forEach((a, i) => console.log(`  Step ${i + 1}: ${a}`));
  console.log(`  Total: ${actions.length} steps`);
});


// ============================================================
// EXAMPLE 13 — Page Object Model (POM)
// Story: IRCTC's selectors were scattered across 25 test files.
//   Login page redesign required updates in 15 tests. POM pattern:
//   each page gets a class — UI change = update ONE class.
// ============================================================

class LoginPage {
  constructor(page) {
    this.page = page;
    this.usernameInput = page.locator('#username');
    this.passwordInput = page.locator('#password');
    this.signInButton = page.locator('button[type="submit"]');
  }
  async goto() { await this.page.goto('/login'); }
  async login(user, pass) {
    await this.usernameInput.fill(user);
    await this.passwordInput.fill(pass);
    await this.signInButton.click();
  }
}

class SearchPage {
  constructor(page) {
    this.page = page;
    this.from = page.locator('#from');
    this.to = page.locator('#to');
    this.searchBtn = page.locator('button[name="Search"]');
  }
  async search(from, to) {
    await this.from.fill(from);
    await this.to.fill(to);
    await this.searchBtn.click();
  }
}

// Usage in test:
// test('book ticket', async ({ page }) => {
//   const login = new LoginPage(page);
//   const search = new SearchPage(page);
//   await login.goto();
//   await login.login('testuser', 'pass');
//   await search.search('Delhi', 'Mumbai');
// });

console.log("\n--- Page Object Model ---");
console.log("LoginPage: encapsulates login selectors and actions");
console.log("SearchPage: encapsulates search selectors and actions");
console.log("Benefit: UI change = update ONE class, not 15 test files");

// --- How POM scales ---
// Small project (5 tests):  POM is optional, direct selectors are fine
// Medium project (15 tests): POM saves time when UI changes happen
// Large project (50+ tests): POM is essential, without it tests are unmaintainable
//
// POM files should live alongside test files:
// tests/
//   e2e/
//     pages/
//       LoginPage.js
//       SearchPage.js
//       BookingPage.js
//       PaymentPage.js
//     specs/
//       booking-flow.spec.js    (uses LoginPage, SearchPage, BookingPage, PaymentPage)
//       search-only.spec.js     (uses LoginPage, SearchPage)

// --- Visual Regression Testing (bonus) ---
// Playwright can compare screenshots pixel-by-pixel:
// await expect(page).toHaveScreenshot('homepage.png');
// On first run: saves a reference screenshot
// On subsequent runs: compares current to reference
// If pixels differ: test FAILS with a visual diff image
// Great for catching CSS regressions (wrong font, misaligned button, etc.)


// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. E2E tests verify the complete user experience in a real browser.
// 2. Use Playwright — modern, fast, supports all major browsers.
// 3. Stable locators: getByRole() > getByTestId() > CSS selectors.
// 4. Playwright auto-waits — no sleep() needed!
// 5. Network interception: mock external APIs in E2E tests.
// 6. Screenshots/videos on failure for easy debugging.
// 7. Codegen (npx playwright codegen) generates tests by recording.
// 8. Keep suite small: 5-15 critical user journeys.
// 9. Run in CI (GitHub Actions) on every PR.
// 10. Page Object Model keeps large test suites maintainable.
// ============================================================
