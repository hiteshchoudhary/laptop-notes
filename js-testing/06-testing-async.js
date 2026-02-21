// ============================================================
// FILE 06: TESTING ASYNCHRONOUS CODE
// Topic: Mastering async testing — Promises, async/await, callbacks, timers, and race conditions
// WHY: Modern JavaScript is fundamentally asynchronous. If you cannot
//   test async code correctly, your tests will pass even when your
//   code is broken — the most dangerous kind of false confidence.
// ============================================================

// ============================================================
// EXAMPLE 1 — PhonePe UPI Payment Flow
// Story: PhonePe processes over 5 billion UPI transactions per month.
//   Every payment follows an async pipeline: initiate → wait for bank
//   response → verify → confirm. If any step's Promise rejects, the
//   user must see a meaningful error — not a silent failure.
// ============================================================

// WHY: Before we test anything async, we need async code to test.
// --- Payment Service (the code under test) ---

function initiatePayment(upiId, amount) {
  return new Promise((resolve, reject) => {
    if (!upiId || !upiId.includes("@")) { reject(new Error("Invalid UPI ID")); return; }
    if (amount <= 0) { reject(new Error("Amount must be positive")); return; }
    setTimeout(() => {
      resolve({ transactionId: "TXN" + Date.now(), status: "INITIATED", upiId, amount });
    }, 100);
  });
}

function verifyPayment(transactionId) {
  return new Promise((resolve, reject) => {
    if (!transactionId || !transactionId.startsWith("TXN")) { reject(new Error("Invalid transaction ID")); return; }
    setTimeout(() => resolve({ transactionId, status: "VERIFIED", bankRef: "BANK" + Math.floor(Math.random() * 100000) }), 50);
  });
}

function confirmPayment(transactionId) {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ transactionId, status: "SUCCESS", message: "Payment successful" }), 30);
  });
}

// Full payment pipeline — initiate, verify, confirm
async function processFullPayment(upiId, amount) {
  const initResult = await initiatePayment(upiId, amount);
  const verifyResult = await verifyPayment(initResult.transactionId);
  const confirmResult = await confirmPayment(verifyResult.transactionId);
  return { ...confirmResult, amount, upiId };
}

// ============================================================
// EXAMPLE 2 — Testing Promises (Return the Promise)
// Story: PhonePe's QA team noticed failed API calls wouldn't fail
//   their tests. The runner finished BEFORE the Promise resolved.
//   The fix: return the Promise from the test function.
// ============================================================

// WHY: If you don't return a Promise (or use async/await), the test
// runner sees a synchronous function that doesn't throw — it passes
// immediately, and your assertion never runs.

// WRONG: This test ALWAYS passes, even if initiatePayment rejects!
// test('bad test - forgetting to return', () => {
//   initiatePayment('merchant@ybl', 500).then(result => {
//     expect(result.status).toBe('INITIATED');  // Runs AFTER test passes!
//   });
// });

// CORRECT: Return the Promise so the test runner waits for it
// test('initiates payment for valid UPI ID', () => {
//   return initiatePayment('merchant@ybl', 500).then(result => {
//     expect(result.status).toBe('INITIATED');
//     expect(result.amount).toBe(500);
//   });
// });

// WHY: .resolves and .rejects matchers make Promise testing readable.
// test('payment resolves with correct status', () => {
//   return expect(initiatePayment('user@okaxis', 1000)).resolves.toMatchObject({ status: 'INITIATED' });
// });
// test('payment rejects for invalid UPI ID', () => {
//   return expect(initiatePayment('invalid-id', 500)).rejects.toThrow('Invalid UPI ID');
// });

console.log("--- Promise Return Pattern ---");
console.log("RULE: Always return the Promise from the test function.");
console.log("resolves/rejects matchers: expect(promise).resolves.toBe(value)");
console.log("");

// ============================================================
// EXAMPLE 3 — Testing async/await (Preferred Pattern)
// Story: PhonePe's senior engineers mandated async/await in all new
//   tests. It reads like synchronous code, makes error paths obvious,
//   and eliminates the "forgotten return" bug.
// ============================================================

// WHY: async/await is the cleanest way to test async code.
// The test runner automatically waits for the async function to complete.

// test('full payment pipeline succeeds', async () => {
//   const result = await processFullPayment('shop@ybl', 2500);
//   expect(result.status).toBe('SUCCESS');
//   expect(result.amount).toBe(2500);
// });

// WHY: For error paths, use .rejects — NOT try/catch (fragile).
// test('rejects invalid UPI - clean', async () => {
//   await expect(initiatePayment('bad-id', 100)).rejects.toThrow('Invalid UPI ID');
// });
// test('rejects negative amount', async () => {
//   await expect(initiatePayment('user@ybl', -500)).rejects.toThrow('Amount must be positive');
// });

console.log("--- async/await Tests ---");
console.log("PREFER: await expect(fn()).rejects.toThrow('message')");
console.log("AVOID: try/catch in tests — easy to forget the fail case.");
console.log("");

// ============================================================
// EXAMPLE 4 — Testing Callbacks (Legacy Pattern)
// Story: PhonePe maintains legacy gateway integrations using the
//   callback pattern. These tests require the special `done` parameter
//   that tells the runner "wait until I call done()."
// ============================================================

// WHY: The `done` callback signals test completion for callback-based APIs.

function checkBalance(accountId, callback) {
  setTimeout(() => {
    if (!accountId) { callback(new Error("Account ID required"), null); return; }
    callback(null, { accountId, balance: 50000, currency: "INR" });
  }, 100);
}

// test('checks balance successfully', (done) => {
//   checkBalance('ACC123', (error, result) => {
//     try {
//       expect(error).toBeNull();
//       expect(result.balance).toBe(50000);
//       done();        // Signal: test complete and passed
//     } catch (err) {
//       done(err);     // Signal: test failed with this error
//     }
//   });
// });

// WHY: The try/catch is critical! Without it, a failed expect() throws,
// done() never gets called, and you get a confusing timeout error.

// Timeout config: test('slow op', (done) => { ... }, 15000); // 15s

console.log("--- Callback Testing with done() ---");
console.log("done() for success, done(error) for failure.");
console.log("Default timeout: 5 seconds if done() not called.");
console.log("");

// ============================================================
// EXAMPLE 5 — Testing Timers with Fake Timers
// Story: PhonePe shows a "payment processing" spinner with a 30s
//   timeout. Testing with real timers = 30 seconds per test!
//   Fake timers let us fast-forward time instantly.
// ============================================================

// WHY: Fake timers replace global timer functions so you control the clock.

function createPaymentTimeout(onTimeout, delayMs = 30000) {
  let resolved = false;
  const timerId = setTimeout(() => {
    if (!resolved) { resolved = true; onTimeout("Payment timed out. Please try again."); }
  }, delayMs);
  return {
    resolve: () => { resolved = true; clearTimeout(timerId); },
    isResolved: () => resolved,
  };
}

function debounce(fn, delayMs) {
  let timerId = null;
  return function (...args) {
    clearTimeout(timerId);
    timerId = setTimeout(() => fn.apply(this, args), delayMs);
  };
}

// beforeEach(() => vi.useFakeTimers());
// afterEach(() => vi.restoreAllTimers());

// test('calls timeout after 30 seconds', () => {
//   const onTimeout = vi.fn();
//   createPaymentTimeout(onTimeout, 30000);
//   vi.advanceTimersByTime(29000);
//   expect(onTimeout).not.toHaveBeenCalled();     // Not yet
//   vi.advanceTimersByTime(1000);
//   expect(onTimeout).toHaveBeenCalledWith('Payment timed out. Please try again.');
// });

// test('does not timeout if resolved before deadline', () => {
//   const onTimeout = vi.fn();
//   const payment = createPaymentTimeout(onTimeout, 30000);
//   vi.advanceTimersByTime(5000);
//   payment.resolve();                              // Bank responds early
//   vi.advanceTimersByTime(30000);
//   expect(onTimeout).not.toHaveBeenCalled();       // Timeout was cancelled
// });

// test('debounce waits before executing', () => {
//   const mockFn = vi.fn();
//   const debouncedFn = debounce(mockFn, 300);
//   debouncedFn('a'); debouncedFn('ab'); debouncedFn('abc');  // Rapid calls
//   expect(mockFn).not.toHaveBeenCalled();
//   vi.advanceTimersByTime(300);
//   expect(mockFn).toHaveBeenCalledTimes(1);
//   expect(mockFn).toHaveBeenCalledWith('abc');               // Only last call
// });

console.log("--- Fake Timers ---");
console.log("vi.useFakeTimers() / vi.advanceTimersByTime(ms) / vi.restoreAllTimers()");
console.log("");

// ============================================================
// EXAMPLE 6 — Testing Race Conditions
// Story: PhonePe had a bug where two simultaneous UPI requests would
//   race. Testing Promise.race and Promise.allSettled prevents this.
// ============================================================

// WHY: Async operations overlap. Test that concurrent code handles order correctly.

function fetchFromPrimaryBank(txnId) {
  return new Promise((r) => setTimeout(() => r({ txnId, source: "primary", status: "OK" }), 200));
}
function fetchFromFallbackBank(txnId) {
  return new Promise((r) => setTimeout(() => r({ txnId, source: "fallback", status: "OK" }), 500));
}
function fetchWithFallback(txnId) {
  return Promise.race([fetchFromPrimaryBank(txnId), fetchFromFallbackBank(txnId)]);
}
function fetchFromAllBanks(txnId) {
  return Promise.allSettled([fetchFromPrimaryBank(txnId), fetchFromFallbackBank(txnId), Promise.reject(new Error("Third bank down"))]);
}

// test('race returns the fastest response', async () => {
//   const result = await fetchWithFallback('TXN001');
//   expect(result.source).toBe('primary');       // Primary is faster (200ms vs 500ms)
// });

// test('allSettled captures all results including failures', async () => {
//   const results = await fetchFromAllBanks('TXN002');
//   expect(results).toHaveLength(3);
//   expect(results[0].status).toBe('fulfilled');
//   expect(results[2].status).toBe('rejected');
//   expect(results[2].reason.message).toBe('Third bank down');
// });

console.log("--- Race Conditions ---");
console.log("Promise.race — first to settle wins");
console.log("Promise.allSettled — wait for ALL, capture each outcome");
console.log("");

// ============================================================
// EXAMPLE 7 — Common Async Testing Mistakes
// Story: A PhonePe intern wrote 50 async tests — all green. Senior
//   dev found NONE actually tested anything. Every test was missing
//   `await` or `return`, so assertions ran after the test passed.
// ============================================================

// --- Mistake 1: Forgetting await ---
// BAD:  expect(initiatePayment('user@ybl', 100)).resolves.toMatchObject({ status: 'INITIATED' });
// GOOD: await expect(initiatePayment('user@ybl', 100)).resolves.toMatchObject({ status: 'INITIATED' });

// --- Mistake 2: Not testing rejection paths ---
// BAD:  Only testing success. What about invalid UPI? Negative amount?
// GOOD: Test BOTH resolve and reject for every async function.

// --- Mistake 3: Mixing done and Promises ---
// BAD:  test('x', (done) => { somePromise().then(() => { done(); }); });
// GOOD: Use EITHER done OR async/await, never both.

console.log("--- Common Mistakes ---");
console.log("1. Forgetting await → test passes before assertion runs");
console.log("2. Not testing rejections → silent production failures");
console.log("3. Mixing done + Promises → double resolution warnings");
console.log("");

// ============================================================
// EXAMPLE 8 — Testing Retry Logic
// Story: PhonePe's verification retries up to 3 times on temporary
//   errors with exponential backoff. Testing requires mocking the
//   API to fail twice, then succeed on the third attempt.
// ============================================================

async function withRetry(fn, maxRetries = 3, baseDelay = 100) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try { return await fn(); }
    catch (error) {
      lastError = error;
      if (error.nonRetriable) throw error; // Don't retry auth failures
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, baseDelay * Math.pow(2, attempt - 1)));
      }
    }
  }
  throw lastError;
}

// test('succeeds after 2 failures', async () => {
//   const mockApi = vi.fn()
//     .mockRejectedValueOnce(new Error('Bank timeout'))
//     .mockRejectedValueOnce(new Error('Bank timeout'))
//     .mockResolvedValueOnce({ status: 'VERIFIED' });
//   vi.useFakeTimers();
//   const resultPromise = withRetry(mockApi, 3, 100);
//   await vi.advanceTimersByTimeAsync(100);   // 1st retry delay
//   await vi.advanceTimersByTimeAsync(200);   // 2nd retry delay
//   const result = await resultPromise;
//   expect(result.status).toBe('VERIFIED');
//   expect(mockApi).toHaveBeenCalledTimes(3);
//   vi.useRealTimers();
// });

// test('does not retry non-retriable errors', async () => {
//   const authError = new Error('Invalid credentials');
//   authError.nonRetriable = true;
//   const mockApi = vi.fn().mockRejectedValue(authError);
//   await expect(withRetry(mockApi, 3)).rejects.toThrow('Invalid credentials');
//   expect(mockApi).toHaveBeenCalledTimes(1);  // Only 1 attempt!
// });

console.log("--- Retry Logic Testing ---");
console.log("mockRejectedValueOnce for sequential failures then success.");
console.log("Test: retries succeed, retries exhausted, non-retriable skipped.");
console.log("");

// ============================================================
// EXAMPLE 9 — Practical: Full UPI Payment Test Suite
// Story: Complete test file a PhonePe engineer would write, covering
//   all async patterns in one cohesive suite.
// ============================================================

// describe('UPI Payment Service', () => {
//   beforeEach(() => vi.useFakeTimers());
//   afterEach(() => { vi.restoreAllTimers(); vi.restoreAllMocks(); });
//
//   describe('initiatePayment', () => {
//     test('resolves with transaction details', async () => {
//       const result = await initiatePayment('merchant@ybl', 1500);
//       expect(result).toMatchObject({ status: 'INITIATED', upiId: 'merchant@ybl', amount: 1500 });
//       expect(result.transactionId).toMatch(/^TXN/);
//     });
//     test('rejects invalid UPI ID', async () => {
//       await expect(initiatePayment('invalid', 100)).rejects.toThrow('Invalid UPI ID');
//     });
//     test('rejects zero amount', async () => {
//       await expect(initiatePayment('user@ybl', 0)).rejects.toThrow('Amount must be positive');
//     });
//   });
//
//   describe('processFullPayment', () => {
//     test('completes full flow', async () => {
//       const result = await processFullPayment('shop@okicici', 2500);
//       expect(result.status).toBe('SUCCESS');
//       expect(result.amount).toBe(2500);
//     });
//     test('fails early if initiation fails', async () => {
//       await expect(processFullPayment('bad-upi', 100)).rejects.toThrow('Invalid UPI ID');
//     });
//   });
//
//   describe('payment timeout', () => {
//     test('fires after delay', () => {
//       const onTimeout = vi.fn();
//       createPaymentTimeout(onTimeout, 30000);
//       vi.advanceTimersByTime(29999);
//       expect(onTimeout).not.toHaveBeenCalled();
//       vi.advanceTimersByTime(1);
//       expect(onTimeout).toHaveBeenCalledWith('Payment timed out. Please try again.');
//     });
//     test('cancels when resolved', () => {
//       const onTimeout = vi.fn();
//       const payment = createPaymentTimeout(onTimeout, 30000);
//       vi.advanceTimersByTime(10000);
//       payment.resolve();
//       vi.advanceTimersByTime(30000);
//       expect(onTimeout).not.toHaveBeenCalled();
//     });
//   });
//
//   describe('withRetry', () => {
//     test('succeeds on first attempt', async () => {
//       const fn = vi.fn().mockResolvedValue('OK');
//       const result = await withRetry(fn, 3);
//       expect(result).toBe('OK');
//       expect(fn).toHaveBeenCalledTimes(1);
//     });
//   });
// });

console.log("--- Complete UPI Test Suite Structure ---");
console.log("describe('initiatePayment')    — valid & invalid inputs");
console.log("describe('processFullPayment')  — full pipeline");
console.log("describe('payment timeout')     — fake timer tests");
console.log("describe('withRetry')           — retry logic");
console.log("");

// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. ALWAYS return or await Promises in tests — otherwise assertions
//    run after the test has already passed (the #1 async testing bug).
//
// 2. Use async/await as your default pattern. It's the most readable
//    and least error-prone approach for testing async code.
//
// 3. Use .resolves/.rejects for clean assertion syntax:
//    await expect(fn()).resolves.toBe(value)
//    await expect(fn()).rejects.toThrow('error')
//
// 4. Use done() ONLY for legacy callback-based APIs. Never mix done
//    with Promises — pick one pattern per test.
//
// 5. Use fake timers (vi.useFakeTimers) to test setTimeout/setInterval
//    without waiting. Always restore real timers in afterEach.
//
// 6. Test race conditions with Promise.race and Promise.allSettled.
//    Don't assume async operations complete in a specific order.
//
// 7. Test retry logic by mocking sequential failures then success.
//    Also test: all retries exhausted, and non-retriable errors.
//
// 8. Test BOTH success and failure paths for every async function.
//    Untested rejection paths cause uncaught exceptions in production.
//
// 9. Common mistakes to avoid:
//    - Forgetting await → test passes before assertion runs
//    - Not testing rejections → silent production failures
//    - Mixing done + Promises → double resolution
//
// 10. Structure async test suites with describe blocks for each
//     operation, testing all paths: success, error, timeout, retry.
//
// QUICK REFERENCE:
// ┌────────────────────────┬──────────────────────────────────────────┐
// │ Pattern                │ When to use                              │
// ├────────────────────────┼──────────────────────────────────────────┤
// │ return promise.then()  │ Promise chains (less common now)         │
// │ async/await            │ DEFAULT choice for all async tests       │
// │ .resolves/.rejects     │ Clean one-liner assertions on Promises   │
// │ done callback          │ Legacy callback APIs only                │
// │ vi.useFakeTimers()     │ setTimeout, setInterval, debounce        │
// │ Promise.allSettled     │ Testing parallel ops with partial failure │
// │ mockRejectedValueOnce  │ Simulating retry sequences               │
// └────────────────────────┴──────────────────────────────────────────┘
// ============================================================

console.log("=== File 06 Complete: Testing Asynchronous Code ===");
