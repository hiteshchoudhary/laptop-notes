// ============================================================
// FILE 10: CODE COVERAGE
// Topic: Measuring test coverage — metrics, tools, reports, thresholds, and the 100% myth
// WHY: Code coverage tells you WHICH lines your tests execute, not
//   WHETHER those lines are correct. Understanding this difference
//   is the key to using coverage as a tool, not a religion.
// ============================================================

// ============================================================
// EXAMPLE 1 — Zerodha's Trading Bug
// Story: Zerodha, India's largest stock broker with 10+ million users,
//   had a bug in their margin calculation. The function had 100% line
//   coverage — every line was executed during tests. But the test only
//   checked valid inputs with positive numbers. No test for negative
//   quantity or zero stock price. The bug went to production and caused
//   incorrect margin calculations. Management mandated 80% coverage,
//   but the lesson was deeper: coverage measures EXECUTION, not CORRECTNESS.
// ============================================================

console.log("--- What is Code Coverage? ---");
console.log("Coverage = which lines/branches/functions were EXECUTED.");
console.log("It does NOT measure whether tests verified correct behavior.");
console.log("100% coverage does not equal bug-free.");
console.log("");

// ============================================================
// EXAMPLE 2 — The Four Coverage Metrics
// Story: Zerodha's report showed Statement 95%, Branch 60%, Function
//   90%, Line 95%. The tech lead pointed out Branch at 60% was the
//   red flag — 40% of if/else paths were untested. That's where bugs hide.
// ============================================================

function calculateMargin(stockPrice, quantity, marginPercent, orderType) {
  // BRANCH 1: stockPrice validation
  if (stockPrice <= 0) {
    throw new Error("Stock price must be positive");           // Branch 1A
  }
  // Branch 1B: implicit else (stockPrice > 0)

  // BRANCH 2: quantity validation
  if (quantity <= 0) {
    throw new Error("Quantity must be positive");              // Branch 2A
  }

  // BRANCH 3: margin range validation
  if (marginPercent < 0 || marginPercent > 100) {
    throw new Error("Margin must be between 0 and 100");       // Branch 3A
  }

  const totalValue = stockPrice * quantity;

  // BRANCH 4: order type determines margin calculation
  let marginRequired;
  if (orderType === "intraday") {
    marginRequired = totalValue * (marginPercent / 100) * 0.5; // Branch 4A: 50% discount
  } else if (orderType === "delivery") {
    marginRequired = totalValue * (marginPercent / 100);       // Branch 4B: full margin
  } else {
    throw new Error(`Unknown order type: ${orderType}`);       // Branch 4C
  }

  // BRANCH 5: minimum margin rule
  const minimumMargin = 500;
  if (marginRequired < minimumMargin) {
    marginRequired = minimumMargin;                            // Branch 5A
  }
  // Branch 5B: above minimum (no change)

  return {
    totalValue,
    marginRequired: Math.round(marginRequired * 100) / 100,
    orderType,
    leveraged: orderType === "intraday",
  };
}

console.log("--- The Four Coverage Metrics ---");
console.log("1. STATEMENT: % of individual statements executed");
console.log("2. BRANCH:    % of decision paths taken (MOST IMPORTANT)");
console.log("   Every if/else, switch, ternary, &&, || has branches");
console.log("3. FUNCTION:  % of functions called at least once");
console.log("4. LINE:      % of executable lines executed");
console.log("");

// ============================================================
// EXAMPLE 3 — Running Coverage Reports
// Story: Zerodha's CI runs coverage on every PR. If it drops below
//   80%, the PR is blocked. They use c8 (V8-native) for speed.
// ============================================================

// Vitest:  npx vitest --coverage
// Jest:    npx jest --coverage

// vitest.config.js:
// export default {
//   test: {
//     coverage: {
//       provider: 'v8',                        // V8 native (fast) or 'istanbul'
//       include: ['src/**/*.{js,ts}'],
//       exclude: ['src/**/*.test.*', 'src/mocks/**'],
//       reporter: ['text', 'html', 'lcov'],    // text=terminal, html=visual, lcov=CI
//       reportsDirectory: './coverage',
//     },
//   },
// };

// jest.config.js:
// module.exports = {
//   collectCoverage: true,
//   coverageProvider: 'v8',
//   collectCoverageFrom: ['src/**/*.{js,ts}', '!src/**/*.test.*'],
//   coverageReporters: ['text', 'html', 'lcov'],
// };

console.log("--- Running Coverage ---");
console.log("npx vitest --coverage  |  npx jest --coverage");
console.log("Providers: c8/V8 (fast, native) or Istanbul (compatible)");
console.log("Reports: text (terminal), html (visual), lcov (CI tools)");
console.log("");

// ============================================================
// EXAMPLE 4 — Reading Coverage Reports
// Story: A junior dev saw 100% line coverage and said "Ship it!"
//   The tech lead pointed to Branch column at 60% — yellow-highlighted
//   partial branches that were never tested. That's where the bug was.
// ============================================================

// Terminal output:
// File              | % Stmts | % Branch | % Funcs | % Lines | Uncovered
// ------------------|---------|----------|---------|---------|----------
// marginCalc.js     |   95.0  |   60.0   |  100.0  |   95.0  | 28-30, 42
// orderService.js   |   90.0  |   75.0   |   80.0  |   90.0  | 15, 45-48
// utils.js          |  100.0  |  100.0   |  100.0  |  100.0  |

// HTML report color coding:
// GREEN:  Line fully covered (all branches taken)
// RED:    Line NEVER executed (completely uncovered)
// YELLOW: Line executed but NOT ALL BRANCHES taken (most dangerous!)
//
// Example:
// GREEN:  if (stockPrice <= 0) {
// RED:      throw new Error('Stock price must be positive');  ← never tested!
// YELLOW: const result = isIntraday ? value * 0.5 : value;   ← only one branch

console.log("--- Reading Reports ---");
console.log("Focus on % Branch and Uncovered Lines.");
console.log("HTML colors: GREEN=covered, RED=uncovered, YELLOW=partial (dangerous)");
console.log("");

// ============================================================
// EXAMPLE 5 — The 100% Coverage Myth (with Proof)
// Story: Zerodha wrote a test that achieved 100% line coverage on
//   divide(). Then a user entered 0 as divisor in production, got
//   Infinity, and placed a trade with "infinite" margin.
// ============================================================

// WHY: 100% line coverage means every line EXECUTED.
// It does NOT mean every SCENARIO was tested.

function divide(a, b) {
  return a / b;   // 100% line coverage with just divide(10, 2)
}

// test('divides two numbers', () => {
//   expect(divide(10, 2)).toBe(5);    // 100% coverage!
// });

// BUT: divide(10, 0) → Infinity     (NOT TESTED!)
//      divide(0, 0)  → NaN          (NOT TESTED!)
//      divide(-10, 3) → -3.33...    (Is this expected?)

console.log("--- The 100% Coverage Myth ---");
console.log("divide(10, 2) → 100% coverage. But divide(10, 0) → Infinity!");
console.log("Coverage measures EXECUTION, not CORRECTNESS.");
console.log("");

// More realistic: Zerodha's margin calculator
// 2 tests cover ~85% lines but only ~50% branches.
// Missing: all error paths + minimum margin rule.
// These are the most common sources of production bugs!

// ============================================================
// EXAMPLE 6 — Fixing the Coverage Gap
// Story: The tech lead added tests targeting each uncovered branch.
//   Branch coverage went from 50% to 100%.
// ============================================================

// describe('calculateMargin', () => {
//   // BRANCH 1A: stockPrice <= 0
//   test('throws for zero stock price', () => {
//     expect(() => calculateMargin(0, 10, 20, 'delivery')).toThrow('Stock price must be positive');
//   });
//   test('throws for negative stock price', () => {
//     expect(() => calculateMargin(-50, 10, 20, 'delivery')).toThrow('Stock price must be positive');
//   });
//
//   // BRANCH 2A: quantity <= 0
//   test('throws for zero quantity', () => {
//     expect(() => calculateMargin(100, 0, 20, 'delivery')).toThrow('Quantity must be positive');
//   });
//
//   // BRANCH 3A: marginPercent out of range
//   test('throws for negative margin', () => {
//     expect(() => calculateMargin(100, 10, -5, 'delivery')).toThrow('Margin must be between 0 and 100');
//   });
//   test('throws for margin over 100', () => {
//     expect(() => calculateMargin(100, 10, 150, 'delivery')).toThrow('Margin must be between 0 and 100');
//   });
//
//   // BRANCH 4A: intraday (50% discount)
//   test('applies 50% discount for intraday', () => {
//     const result = calculateMargin(1000, 10, 20, 'intraday');
//     expect(result.marginRequired).toBe(1000);    // 10000 * 0.20 * 0.5
//     expect(result.leveraged).toBe(true);
//   });
//
//   // BRANCH 4B: delivery (full margin)
//   test('applies full margin for delivery', () => {
//     const result = calculateMargin(1000, 10, 20, 'delivery');
//     expect(result.marginRequired).toBe(2000);    // 10000 * 0.20
//   });
//
//   // BRANCH 4C: unknown order type
//   test('throws for unknown order type', () => {
//     expect(() => calculateMargin(100, 10, 20, 'futures')).toThrow('Unknown order type: futures');
//   });
//
//   // BRANCH 5A: below minimum margin
//   test('enforces minimum margin of 500', () => {
//     const result = calculateMargin(100, 1, 10, 'delivery');
//     expect(result.marginRequired).toBe(500);     // 10 < 500 → 500
//   });
//
//   // BRANCH 5B: above minimum
//   test('no enforcement when above minimum', () => {
//     const result = calculateMargin(1000, 10, 20, 'delivery');
//     expect(result.marginRequired).toBe(2000);    // 2000 > 500 → no change
//   });
// });

console.log("--- Complete Branch Coverage ---");
console.log("Each test targets a specific branch.");
console.log("Result: 100% statement, 100% branch, 100% function, 100% line.");
console.log("");

// ============================================================
// EXAMPLE 7 — Setting Coverage Thresholds
// Story: After the bug, Zerodha's CTO mandated thresholds in CI.
//   If a PR drops coverage below threshold, the build fails.
// ============================================================

// vitest.config.js:
// coverage: {
//   thresholds: {
//     statements: 80,
//     branches: 80,
//     functions: 80,
//     lines: 80,
//   },
// }

// jest.config.js:
// coverageThreshold: {
//   global: { branches: 80, functions: 80, lines: 80, statements: 80 },
//   './src/trading/': { branches: 95 },   // Higher for critical modules
// }

// If not met: ERROR: Coverage for branches (67.3%) does not meet threshold (80%)

console.log("--- Coverage Thresholds ---");
console.log("Set in config. CI fails if coverage drops below.");
console.log("Recommended: 80% overall, 90%+ for critical paths.");
console.log("");

// ============================================================
// EXAMPLE 8 — Ignoring Code from Coverage
// Story: Zerodha has debug logging, generated code, and third-party
//   wrappers that shouldn't count toward coverage.
// ============================================================

// Config exclusion:
// exclude: ['src/**/*.test.*', 'src/mocks/**', 'src/__generated__/**']

// Inline ignore comments:
/* istanbul ignore next */
function debugLog(message) {
  if (process.env.DEBUG) { console.log(`[DEBUG] ${message}`); }
}

// /* c8 ignore next */     — V8/c8 ignore
// /* c8 ignore start */ ... /* c8 ignore stop */

console.log("--- Ignoring Code ---");
console.log("Config: exclude files/directories.");
console.log("Inline: /* istanbul ignore next */ or /* c8 ignore next */");
console.log("Use sparingly! Overuse defeats the purpose.");
console.log("");

// ============================================================
// EXAMPLE 9 — Coverage in CI/CD
// Story: Zerodha's CI generates coverage on every PR. Codecov shows
//   a diff: "+2.3% overall, -0.5% on marginCalc.js".
// ============================================================

// GitHub Actions workflow:
// - run: npx vitest --coverage
// - uses: codecov/codecov-action@v4
//   with:
//     token: ${{ secrets.CODECOV_TOKEN }}
//     files: ./coverage/lcov.info

// Codecov PR comment:
// File             | Before | After  | Change
// Overall          | 82.3%  | 84.6%  | +2.3%
// marginCalc.js    | 60.0%  | 100.0% | +40.0%

console.log("--- Coverage in CI ---");
console.log("Run --coverage, upload lcov.info to Codecov/Coveralls.");
console.log("PR shows coverage diff. Thresholds block merge if not met.");
console.log("");

// ============================================================
// EXAMPLE 10 — Reasonable Coverage Targets
// Story: Zerodha's director set tiered targets. 100% everywhere
//   wastes time on trivial code. Nothing lets coverage rot.
// ============================================================

// Tier 1: Critical (95%+ branch) — trading, payments, auth, compliance
// Tier 2: Important (80%+ branch) — API handlers, business logic, validation
// Tier 3: Standard (70%+ branch) — utilities, UI components, config
// Tier 4: Low priority (50%+)     — debug tools, scripts, generated code

console.log("--- Tiered Targets ---");
console.log("Tier 1 (Critical): 95%+ | Tier 2 (Important): 80%+");
console.log("Tier 3 (Standard): 70%+ | Tier 4 (Low): 50%+");
console.log("");

// ============================================================
// EXAMPLE 11 — Practical: Coverage Gap Analysis
// Story: Portfolio calculator has 100% line coverage but misses edge
//   cases. Let's find the gap and fix it.
// ============================================================

function calculatePortfolioValue(holdings) {
  if (!holdings || holdings.length === 0) {
    return { totalValue: 0, totalGain: 0, gainPercent: 0 };
  }
  let totalInvested = 0, totalCurrent = 0;
  for (const h of holdings) {
    totalInvested += h.buyPrice * h.quantity;
    totalCurrent += h.currentPrice * h.quantity;
  }
  const totalGain = totalCurrent - totalInvested;
  const gainPercent = totalInvested > 0 ? Math.round((totalGain / totalInvested) * 10000) / 100 : 0;
  return {
    totalValue: Math.round(totalCurrent * 100) / 100,
    totalGain: Math.round(totalGain * 100) / 100,
    gainPercent,
  };
}

// 2 tests → 100% line coverage:
// test('calculates value', () => {
//   const result = calculatePortfolioValue([
//     { stock: 'RELIANCE', buyPrice: 2500, currentPrice: 2800, quantity: 10 },
//     { stock: 'TCS', buyPrice: 3500, currentPrice: 3200, quantity: 5 },
//   ]);
//   expect(result.totalValue).toBe(44000);
// });
// test('empty portfolio', () => {
//   expect(calculatePortfolioValue([])).toEqual({ totalValue: 0, totalGain: 0, gainPercent: 0 });
// });

// MISSING: null input, delisted (price=0), all-loss, floating point

// Fixed test suite with proper edge cases:
// test('null input', () => {
//   expect(calculatePortfolioValue(null)).toEqual({ totalValue: 0, totalGain: 0, gainPercent: 0 });
// });
// test('delisted stock (currentPrice=0)', () => {
//   const result = calculatePortfolioValue([{ stock: 'DEWAN', buyPrice: 100, currentPrice: 0, quantity: 100 }]);
//   expect(result.totalGain).toBe(-10000);
//   expect(result.gainPercent).toBe(-100);
// });
// test('all-loss portfolio', () => {
//   const result = calculatePortfolioValue([{ stock: 'PAYTM', buyPrice: 2150, currentPrice: 800, quantity: 20 }]);
//   expect(result.totalGain).toBe(-27000);
// });

console.log("--- Coverage Gap Analysis ---");
console.log("100% line coverage with 2 tests. Looks great!");
console.log("Missing: null, delisted stock, all-loss, floating point.");
console.log("THESE edge cases are where production bugs live.");
console.log("");

// ============================================================
// EXAMPLE 12 — Coverage Anti-Patterns
// Story: A Zerodha intern wrote tests hitting 100% by calling every
//   function without asserting anything. 100% coverage, 0% value.
// ============================================================

// Anti-pattern 1: No assertions
// test('margin calc', () => { calculateMargin(100, 10, 20, 'delivery'); });
// ↑ Runs the code (coverage!) but verifies NOTHING.

// Anti-pattern 2: Testing private internals for numbers
// test('internal state', () => { expect(calc._cache).toBeDefined(); });

// Anti-pattern 3: Snapshot padding
// expect(moduleUnderTest).toMatchSnapshot();  // Executes code, doesn't verify logic

// Anti-pattern 4: Dead code coverage
// Testing unused functions inflates numbers. Delete dead code instead.

console.log("--- Anti-Patterns ---");
console.log("1. Tests without assertions — execution without verification");
console.log("2. Testing private internals — for coverage numbers only");
console.log("3. Snapshot padding — inflates coverage without logic testing");
console.log("4. Dead code coverage — delete unused code, don't test it");
console.log("");

// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. Coverage measures which lines/branches/functions were EXECUTED —
//    NOT whether they produced correct results.
//
// 2. Four metrics: Statement, Branch, Function, Line.
//    BRANCH coverage is most important — it tracks decision paths.
//
// 3. 100% line coverage =/= bug-free. divide(10,2) gives 100% but
//    never tests divide(10,0) which returns Infinity.
//
// 4. Tools: c8/V8 (fast) or Istanbul. Reports: text, HTML, lcov.
//
// 5. HTML reports: GREEN=covered, RED=uncovered, YELLOW=partial branch.
//
// 6. Set thresholds in config (80% recommended). CI fails if not met.
//
// 7. Tiered targets: 95% for critical paths, 80% business logic,
//    70% utilities. Focus effort where bugs cause most damage.
//
// 8. Ignore code selectively: /* istanbul ignore next */ for debug
//    logging and generated code. Use sparingly.
//
// 9. CI integration: upload lcov.info to Codecov/Coveralls for PR diffs.
//
// 10. Anti-patterns: tests without assertions, testing internals,
//     snapshot padding, dead code coverage. Goal is CONFIDENCE, not a number.
// ============================================================

console.log("=== File 10 Complete: Code Coverage ===");
