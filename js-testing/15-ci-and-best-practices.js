// ============================================================
// FILE 15: CI/CD AND TESTING BEST PRACTICES
// Topic: Automating tests in CI pipelines and building a testing culture
// WHY: Tests are only valuable if they run automatically. A test suite
//   that sits on a developer's machine but never runs in CI is like a
//   fire alarm with no batteries. CI ensures every code change is
//   verified, coverage is tracked, and broken code never ships.
// ============================================================

// ============================================================
// EXAMPLE 1 — Flipkart: 15,000 Tests in 4 Minutes
// Story: Flipkart runs 15,000 tests on every PR using GitHub Actions.
//   No PR merges if any test fails. Coverage reports post as PR
//   comments. During Big Billion Days (India's biggest sale), this
//   pipeline prevented 12 critical bugs from reaching production.
//   Engineers deploy 30+ times daily with confidence, serving 100M+
//   users, because the CI pipeline is their safety net.
// ============================================================

// WHY: CI means "run tests automatically on every code change."
// Catches bugs in minutes, not days.

console.log("--- What is CI? ---");
console.log("CI = Run tests automatically on every push/PR");
console.log("Without CI: Bugs hide for days, found during 'integration hell'");
console.log("With CI:    Bugs caught in minutes, fixed while context is fresh\n");

const ciProviders = {
  "GitHub Actions": "Free for public repos, built into GitHub",
  "GitLab CI":      "Built into GitLab, YAML config",
  "CircleCI":       "Fast, Docker-based, good free tier",
  "Jenkins":        "Self-hosted, enterprise, highly customizable"
};
console.log("CI Providers:");
Object.entries(ciProviders).forEach(([name, desc]) => console.log(`  ${name}: ${desc}`));


// ============================================================
// EXAMPLE 2 — GitHub Actions Workflow for JavaScript Testing
// Story: Flipkart's DevOps team sets up the CI pipeline: checkout
//   code, install Node.js, run npm ci, execute tests with coverage.
//   The entire pipeline takes under 4 minutes.
// ============================================================

// WHY: GitHub Actions is the most popular CI for JS projects.

const workflow = `
# .github/workflows/tests.yml
name: Tests
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'             # Cache node_modules for speed
      - run: npm ci                # Clean install (not npm install)
      - run: npm run lint
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v4
        with:
          token: \${{ secrets.CODECOV_TOKEN }}
`;
console.log("\n--- GitHub Actions Workflow ---");
console.log(workflow);

// npm ci vs npm install:
// - npm ci: Deletes node_modules first, installs EXACT versions from
//   package-lock.json. Faster, deterministic, reliable. Use in CI.
// - npm install: Updates package-lock.json if versions drift. Fine for
//   local dev, but can cause "works on my machine" issues in CI.
// Always use npm ci in your CI pipeline. Always.


// ============================================================
// EXAMPLE 3 — Matrix Testing: Multiple Node.js Versions
// Story: Flipkart's libraries must work on Node 18, 20, and 22.
//   Matrix strategy tests all three in parallel automatically.
// ============================================================

const matrixYaml = `
strategy:
  matrix:
    node-version: [18, 20, 22]   # 3 parallel jobs!
steps:
  - uses: actions/setup-node@v4
    with:
      node-version: \${{ matrix.node-version }}
  - run: npm ci && npm test
`;
console.log("--- Matrix Testing ---");
console.log(matrixYaml);
console.log("Also works with OS: [ubuntu-latest, macos-latest, windows-latest]");
console.log("3 OS x 3 versions = 9 parallel jobs!\n");


// ============================================================
// EXAMPLE 4 — Caching Dependencies for Faster CI
// Story: Flipkart's CI took 8 min because npm downloaded 400MB
//   every run. Caching reduced it to 2 min — 75% improvement.
// ============================================================

console.log("--- Caching ---");
console.log("Method 1 (recommended): cache: 'npm' in setup-node action");
console.log("Method 2 (manual): actions/cache with key = hash of package-lock.json");
console.log("Impact: 8 min -> 2 min (75% faster)\n");


// ============================================================
// EXAMPLE 5 — Coverage Thresholds in CI
// Story: Flipkart set 85% threshold. A PR that dropped coverage to
//   83% was blocked — developer had to add tests before merging.
//   Coverage never dipped below 85% again.
// ============================================================

// WHY: Thresholds prevent gradual coverage erosion.

const jestCoverage = {
  coverageThreshold: {
    global: { branches: 80, functions: 85, lines: 85, statements: 85 },
    './src/payments/': { branches: 95, functions: 95, lines: 95 },  // Critical code = higher bar
  }
};

// Vitest equivalent:
// test: { coverage: { thresholds: { branches: 80, functions: 85, lines: 85 } } }

console.log("--- Coverage Thresholds ---");
console.log("Jest config:", JSON.stringify(jestCoverage, null, 2));
console.log("\nGuidelines:");
console.log("  General code: 80-90%");
console.log("  Critical paths (payments, auth): 95%+");
console.log("  Do NOT mandate 100% — leads to testing trivial code\n");

// --- Understanding coverage reports ---
// After running tests with --coverage, you get:
// File         | % Stmts | % Branch | % Funcs | % Lines |
// -------------|---------|----------|---------|---------|
// UserService  |   92.5  |   85.0   |  100.0  |  92.5   |
// PaymentSvc   |   97.8  |   95.0   |  100.0  |  97.8   |
// utils/       |   78.0  |   60.0   |   85.0  |  78.0   |
//
// Read this as: "92.5% of UserService's statements were executed during tests"
// Focus on BRANCHES (if/else paths) — this is where untested logic hides.
// Low branch coverage means there are code paths nobody has tested.


// ============================================================
// EXAMPLE 6 — Pre-Commit Hooks: Test Before You Commit
// Story: An engineer committed broken code at 11 PM. CI failed at
//   midnight. Morning standup derailed. Solution: pre-commit hooks
//   that run tests BEFORE the commit is created.
// ============================================================

// WHY: Shift testing left — catch bugs before they enter git history.

// Setup:
// $ npm install --save-dev husky lint-staged
// $ npx husky init

// .husky/pre-commit:
// npx lint-staged

// package.json:
const lintStagedConfig = {
  "lint-staged": {
    "*.{js,ts}": ["eslint --fix", "jest --bail --findRelatedTests"]
    // --bail: stop on first failure
    // --findRelatedTests: only test files affected by changes
  }
};

console.log("--- Pre-Commit Hooks ---");
console.log("Setup: npm install --save-dev husky lint-staged && npx husky init");
console.log("Config:", JSON.stringify(lintStagedConfig, null, 2));
console.log("\nFlow: git commit -> husky -> lint-staged -> eslint + tests -> commit or block\n");


// ============================================================
// EXAMPLE 7 — Test Organization: Where to Put Your Tests
// Story: Flipkart's 15,000 tests use a hybrid approach: unit tests
//   next to source files (co-located), integration and E2E tests in
//   separate directories.
// ============================================================

console.log("--- Test Organization ---");
console.log(`
HYBRID APPROACH (recommended):
  src/
    services/
      UserService.js
      UserService.test.js          # Unit tests: co-located
      PaymentService.js
      PaymentService.test.js

  tests/
    integration/                   # Integration: separate
      booking-flow.test.js
      payment-flow.test.js
    e2e/                           # E2E: separate
      booking-journey.spec.js
    fixtures/                      # Shared test data
      users.json
      products.json
`);


// ============================================================
// EXAMPLE 8 — Test Naming: Describe Behavior, Not Implementation
// Story: Flipkart's code review requires behavior-focused test names.
//   "test validatePassword" was rejected — renamed to "should reject
//   password shorter than 8 characters."
// ============================================================

console.log("--- Test Naming ---");
console.log("BAD:");
console.log("  test('test validatePassword')");
console.log("  test('test calculateTotal')");
console.log("  test('it works')");
console.log("\nGOOD:");
console.log("  test('should reject password shorter than 8 characters')");
console.log("  test('should apply 10% discount for orders above Rs 5000')");
console.log("  test('should return 401 for expired JWT tokens')");
console.log("\nPattern: 'should [behavior] when [condition]'\n");


// ============================================================
// EXAMPLE 9 — What NOT to Test
// Story: Flipkart's early suite tested Express internals and lodash.
//   Zero value, maintenance cost. They created a "Do Not Test" list.
// ============================================================

console.log("--- What NOT to Test ---");
console.log("  Framework code:    Express routes correctly? Trust Express.");
console.log("  Third-party libs:  lodash.get() works? lodash tests that.");
console.log("  Trivial code:      Getters that just return a property.");
console.log("  Config files:      Verified by the build process itself.");
console.log("  Constants:         MAX_RETRIES === 3 is testing the language.");
console.log("\nWhat TO test:");
console.log("  YOUR business logic:  Discount calculations, validation rules");
console.log("  YOUR API endpoints:   Request/response contract, error handling");
console.log("  YOUR state machines:  Order status transitions, auth flows");
console.log("  YOUR integrations:    How YOUR code calls external services");
console.log("  Bug regression:       Write a test for every bug you fix\n");


// ============================================================
// EXAMPLE 10 — PR Review Testing Checklist
// Story: Flipkart's reviewers use a standardized checklist. Caught
//   200+ test quality issues in the first quarter.
// ============================================================

console.log("--- PR Testing Checklist ---");
const checklist = [
  "Happy path tested",
  "Error/edge cases tested",
  "No flaky tests (no sleep, no timing)",
  "Mocks are minimal and realistic",
  "Test names describe behavior",
  "No test.only() or test.skip() committed",
  "Coverage maintained or improved",
  "Tests are independent (no shared state)",
  "Cleanup handled (no leaked resources)",
  "No sensitive data (no real API keys or PII)",
];
checklist.forEach(item => console.log(`  [ ] ${item}`));


// ============================================================
// EXAMPLE 11 — Parallel Execution and Sharding
// Story: 15,000 tests ran sequentially: 45 minutes. With parallel
//   workers + 3-machine sharding: under 4 minutes. 11x speedup.
// ============================================================

console.log("\n--- Parallel Execution ---");
console.log("Jest:    jest --maxWorkers=4        (4 parallel workers)");
console.log("Vitest:  vitest --pool=threads      (worker threads, fastest)");

console.log("\n--- Sharding Across CI Machines ---");
console.log(`
jobs:
  test:
    strategy:
      matrix:
        shard: [1, 2, 3]          # 3 machines!
    steps:
      - run: npx jest --shard=\${{ matrix.shard }}/3
      # Machine 1: tests 1-5000
      # Machine 2: tests 5001-10000
      # Machine 3: tests 10001-15000
`);
console.log("Impact: 45 min (serial) -> 12 min (parallel) -> 4 min (sharded)\n");


// ============================================================
// EXAMPLE 12 — The Testing Philosophy
// Story: Flipkart's VP of Engineering tells every new hire: "We
//   don't test for coverage numbers. We test for confidence."
// ============================================================

console.log("--- The Testing Philosophy ---\n");
const philosophy = [
  ["Test for confidence, not coverage numbers",
   "95% coverage means nothing if the 5% untested is payment processing."],
  ["Test behavior, not implementation",
   "Tests should survive a refactor. Change HOW, not WHAT = tests pass."],
  ["A test should fail for the right reason",
   "If it fails for a CSS class change, it's testing the wrong thing."],
  ["The best test catches a real bug",
   "Write regression tests for every bug fix. That bug never returns."],
  ["Tests are code — same quality standards",
   "Refactor tests. Use meaningful names. Review in PRs."],
  ["Fast tests get run. Slow tests get skipped.",
   "If your suite takes 30 min, devs stop running it locally."],
];
philosophy.forEach(([principle, explanation], i) => {
  console.log(`  ${i + 1}. ${principle}`);
  console.log(`     ${explanation}\n`);
});


// ============================================================
// EXAMPLE 13 — Practical: Complete CI Setup for a New Project
// Story: Setting up CI from scratch: GitHub Actions, Jest config,
//   Husky hooks, and test organization. Production-ready, copy-paste.
// ============================================================

// --- package.json scripts ---
const scripts = {
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage",
  "test:unit": "jest --testPathPattern=src/",
  "test:integration": "jest --testPathPattern=tests/integration/",
  "test:e2e": "npx playwright test",
  "test:ci": "jest --ci --coverage --maxWorkers=4",
  "lint": "eslint src/ tests/",
  "prepare": "husky"
};
console.log("--- package.json scripts ---");
console.log(JSON.stringify({ scripts }, null, 2));

// --- Complete CI workflow ---
const completeCI = `
# .github/workflows/ci.yml
name: CI Pipeline
on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'npm' }
      - run: npm ci
      - run: npm run lint

  unit-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix: { node-version: [18, 20, 22] }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: \${{ matrix.node-version }}, cache: 'npm' }
      - run: npm ci
      - run: npm run test:unit -- --ci --coverage
      - uses: codecov/codecov-action@v4
        if: matrix.node-version == 20

  integration-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    services:
      postgres:
        image: postgres:16
        env: { POSTGRES_DB: testdb, POSTGRES_USER: test, POSTGRES_PASSWORD: test }
        ports: ['5432:5432']
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'npm' }
      - run: npm ci
      - run: npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    needs: integration-tests
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'npm' }
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with: { name: playwright-report, path: playwright-report/ }
`;
console.log("\n--- Complete CI Workflow ---");
console.log(completeCI);


// ============================================================
// EXAMPLE 14 — The Flipkart Way: Summary
// Story: The complete testing culture that enables 15,000 tests in
//   4 minutes and 30 deploys per day with confidence.
// ============================================================

console.log("--- The Flipkart Way ---\n");
const summary = {
  tools: {
    unit: "Jest / Vitest", integration: "Supertest + real DB",
    e2e: "Playwright", ci: "GitHub Actions",
    coverage: "Codecov (85% threshold)", preCommit: "Husky + lint-staged"
  },
  metrics: {
    tests: "15,000", ciTime: "4 min", deploys: "30+/day",
    coverage: "87%", flakiness: "<2%", bugsCaught: "12 critical in Big Billion Days"
  }
};
console.log("Tools:");
Object.entries(summary.tools).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
console.log("\nMetrics:");
Object.entries(summary.metrics).forEach(([k, v]) => console.log(`  ${k}: ${v}`));


// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. CI runs tests automatically on every push/PR. Use GitHub
//    Actions — free, fast, built into GitHub.
// 2. npm ci (not npm install) in CI: clean, reproducible, fast.
// 3. Matrix testing: Node 18, 20, 22 in parallel.
// 4. Cache node_modules: 75% faster pipeline.
// 5. Coverage thresholds: fail CI if coverage drops below 80-85%.
// 6. Pre-commit hooks (Husky + lint-staged): catch bugs before commit.
// 7. Organization: co-located unit tests, separate integration/E2E.
// 8. Test naming: "should [behavior] when [condition]".
// 9. Do NOT test: framework internals, third-party libs, trivial code.
// 10. Parallel + sharding: 15,000 tests in 4 minutes.
// 11. Philosophy: confidence over coverage, behavior over implementation.
// 12. PR checklist: happy path, edge cases, no flaky tests, clean mocks.
// ============================================================
