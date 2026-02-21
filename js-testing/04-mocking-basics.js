// ============================================================
// FILE 04: MOCKING BASICS
// Topic: Test doubles — spies, stubs, and mocks for isolating code
// WHY: Real applications depend on databases, APIs, payment gateways,
//   and email services. You can't call Razorpay's API in every test —
//   it's slow, costs money, and might charge someone. Mocking lets you
//   simulate dependencies with predictable replacements.
// ============================================================

// ============================================================
// EXAMPLE 1 — The Razorpay Testing Challenge
// Story: Razorpay processes Rs.6+ lakh crore annually. Their payment
//   code talks to bank APIs, fraud systems, and notification services.
//   Running real payments in tests would charge real cards and send
//   real SMS. Instead, they mock every external dependency — the test
//   says "pretend the bank returned success" and code runs as if it did.
// ============================================================

// WHY: Mocking gives you: ISOLATION (test YOUR code, not the gateway),
// SPEED (instant vs 200ms+ network), CONTROL (simulate any scenario).

// --- Mini test framework ---
const results = { passed: 0, failed: 0, errors: [] };
function describe(name, fn) { console.log(`\n${name}`); fn(); }
function test(name, fn) {
  try { fn(); results.passed++; console.log(`  PASS: ${name}`); }
  catch (e) { results.failed++; results.errors.push({ name, error: e.message }); console.log(`  FAIL: ${name} -> ${e.message}`); }
}
async function testAsync(name, fn) {
  try { await fn(); results.passed++; console.log(`  PASS: ${name}`); }
  catch (e) { results.failed++; results.errors.push({ name, error: e.message }); console.log(`  FAIL: ${name} -> ${e.message}`); }
}
function expect(received) {
  return {
    toBe(e) { if (received !== e) throw new Error(`Expected ${JSON.stringify(e)} got ${JSON.stringify(received)}`); },
    toEqual(e) { if (JSON.stringify(received) !== JSON.stringify(e)) throw new Error(`Deep equal failed`); },
    toThrow(m) { let t=false,msg=""; try{received();}catch(e){t=true;msg=e.message;} if(!t)throw new Error("Expected throw"); if(m&&!msg.includes(m))throw new Error(`"${m}" not in "${msg}"`); },
    toHaveBeenCalled() { if(!received._isMock)throw new Error("Not mock"); if(!received._calls.length)throw new Error("Not called"); },
    toHaveBeenCalledTimes(n) { if(received._calls.length!==n) throw new Error(`Expected ${n} calls, got ${received._calls.length}`); },
    toHaveBeenCalledWith(...a) { if(!received._calls.some(c=>JSON.stringify(c)===JSON.stringify(a))) throw new Error(`No call with ${JSON.stringify(a)}`); },
    toHaveBeenLastCalledWith(...a) { const l=received._calls[received._calls.length-1]; if(JSON.stringify(l)!==JSON.stringify(a)) throw new Error(`Last call mismatch`); },
    toBeTruthy() { if (!received) throw new Error(`Expected truthy`); },
    toBeGreaterThan(n) { if(!(received>n)) throw new Error(`${received} not > ${n}`); },
    not: {
      toBe(e) { if(received===e) throw new Error(`Expected NOT ${JSON.stringify(e)}`); },
      toHaveBeenCalled() { if(received._isMock&&received._calls.length) throw new Error("Expected NOT called"); },
    },
  };
}


// ============================================================
// EXAMPLE 2 — Three Types of Test Doubles
// Story: Like a Bollywood set — a STUNT DOUBLE (spy) does the action
//   while we record. A MANNEQUIN (stub) stands in crowd scenes — looks
//   real but does nothing. A BODY DOUBLE (mock) is pre-briefed with
//   exact lines and blocking.
// ============================================================

// WHY: Knowing spy vs stub vs mock prevents confusion.
//
// | Type  | Real Runs? | Records? | Controls Return? | Verifies Calls? |
// |-------|-----------|----------|-----------------|----------------|
// | Spy   | YES       | YES      | Optional        | YES            |
// | Stub  | NO        | YES      | YES             | Optional       |
// | Mock  | NO        | YES      | YES             | YES            |
//
// SPY: vi.spyOn(obj, 'method') — wraps real, records calls
// STUB: vi.fn().mockReturnValue(x) — replaces with fixed return
// MOCK: vi.fn() + expectations — records + verifies


// ============================================================
// EXAMPLE 3 — Building a Mock Function (vi.fn / jest.fn)
// Story: PhonePe's testing library has createMock() used by 500+
//   engineers daily. Under the hood: a function that records calls.
//   Let's build one from scratch.
// ============================================================

function createMockFn(impl) {
  function mockFn(...args) {
    mockFn._calls.push(args);
    if (mockFn._returnOnceQueue.length) return mockFn._returnOnceQueue.shift();
    if (mockFn._implementation) return mockFn._implementation(...args);
    if (mockFn._returnValue !== undefined) return mockFn._returnValue;
    return undefined;
  }
  mockFn._isMock = true;
  mockFn._calls = [];
  mockFn._returnValue = undefined;
  mockFn._returnOnceQueue = [];
  mockFn._implementation = impl || null;

  mockFn.mockReturnValue = (v) => { mockFn._returnValue = v; return mockFn; };
  mockFn.mockReturnValueOnce = (v) => { mockFn._returnOnceQueue.push(v); return mockFn; };
  mockFn.mockResolvedValue = (v) => { mockFn._implementation = () => Promise.resolve(v); return mockFn; };
  mockFn.mockRejectedValue = (v) => { mockFn._implementation = () => Promise.reject(v); return mockFn; };
  mockFn.mockImplementation = (f) => { mockFn._implementation = f; return mockFn; };
  mockFn.mockClear = () => { mockFn._calls = []; return mockFn; };
  mockFn.mockReset = () => { mockFn._calls = []; mockFn._returnValue = undefined; mockFn._returnOnceQueue = []; mockFn._implementation = null; return mockFn; };
  return mockFn;
}
const fn = createMockFn;


// ============================================================
// EXAMPLE 4 — Using Mock Functions
// Story: Ola's ride service calls GPS, pricing, and notifications.
//   In tests: GPS returns hardcoded coords, pricing returns Rs.250,
//   notification mock records that SMS was "sent" without sending.
// ============================================================

describe("Mock Functions — Core Features", () => {
  test("mockReturnValue returns fixed value", () => {
    const getPrice = fn().mockReturnValue(250);
    expect(getPrice()).toBe(250);
    expect(getPrice()).toBe(250);
  });

  test("mockReturnValueOnce for sequential returns", () => {
    const fetchStatus = fn()
      .mockReturnValueOnce("pending")
      .mockReturnValueOnce("processing")
      .mockReturnValueOnce("delivered");
    expect(fetchStatus()).toBe("pending");
    expect(fetchStatus()).toBe("processing");
    expect(fetchStatus()).toBe("delivered");
  });

  test("mockImplementation for custom logic", () => {
    const calcTax = fn().mockImplementation((amt) => Math.round(amt * 0.18));
    expect(calcTax(1000)).toBe(180);
    expect(calcTax(500)).toBe(90);
  });

  test("tracking calls and arguments", () => {
    const logger = fn();
    logger("Order placed", { orderId: "ORD-001" });
    logger("Payment received", { amount: 999 });
    logger("Shipped", { tracking: "TRK-123" });

    expect(logger).toHaveBeenCalled();
    expect(logger).toHaveBeenCalledTimes(3);
    expect(logger).toHaveBeenCalledWith("Order placed", { orderId: "ORD-001" });
    expect(logger).toHaveBeenLastCalledWith("Shipped", { tracking: "TRK-123" });

    // Raw call data: logger._calls is [[arg1,arg2], [arg1,arg2], ...]
    console.log("    Calls:", JSON.stringify(logger._calls));
  });
});


// ============================================================
// EXAMPLE 5 — Mocking Async Functions
// Story: Swiggy's restaurant search calls geolocation, catalog, and
//   ratings APIs — each 100-500ms. Mock all three to return instantly.
//   Suite drops from 30s to 0.5s.
// ============================================================

describe("Async Mock Functions", () => {
  testAsync("mockResolvedValue for async success", async () => {
    const fetchRestaurants = fn().mockResolvedValue([
      { name: "Paradise Biryani", rating: 4.5 },
      { name: "Meghana Foods", rating: 4.3 },
    ]);
    const data = await fetchRestaurants("Koramangala");
    expect(data.length).toBe(2);
    expect(fetchRestaurants).toHaveBeenCalledWith("Koramangala");
  });

  testAsync("mockRejectedValue for async failure", async () => {
    const fetchMenu = fn().mockRejectedValue(new Error("Not found"));
    try {
      await fetchMenu("invalid-id");
      expect(true).toBe(false); // Should not reach
    } catch (error) {
      expect(error.message).toBe("Not found");
    }
  });
});


// ============================================================
// EXAMPLE 6 — Spying on Existing Methods
// Story: Flipkart's analytics calls trackEvent() for every user
//   action. Tests spy on it to verify calls without actually sending
//   analytics data to the server.
// ============================================================

// vi.spyOn(obj, 'method') wraps the real method, records calls.
// spy.mockRestore() restores the original.

function spyOn(obj, methodName) {
  const original = obj[methodName];
  const spy = fn();
  spy._original = original;
  obj[methodName] = function (...args) {
    spy(...args);
    return original.apply(this, args);
  };
  obj[methodName]._isMock = true;
  obj[methodName]._calls = spy._calls;
  spy.mockRestore = () => { obj[methodName] = original; };
  return spy;
}

const analytics = {
  events: [],
  trackEvent(name, data) { this.events.push({ name, data }); return true; },
};

describe("Spying on Methods", () => {
  test("spy records calls, real method still runs", () => {
    const spy = spyOn(analytics, "trackEvent");
    analytics.trackEvent("page_view", { page: "/home" });
    analytics.trackEvent("click", { button: "add_to_cart" });

    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenCalledWith("page_view", { page: "/home" });
    expect(analytics.events.length).toBeGreaterThan(0); // Real method worked
    spy.mockRestore();
  });
});


// ============================================================
// EXAMPLE 7 — Practical: Mocking a Payment Gateway
// Story: Razorpay's checkout tests mock the gateway at every level:
//   success, failure, timeout. All tested without touching a real bank.
// ============================================================

class OrderService {
  constructor(paymentGateway, notifier) {
    this.paymentGateway = paymentGateway;
    this.notifier = notifier;
    this.orders = [];
  }

  async placeOrder(orderData) {
    if (!orderData.items || !orderData.items.length) throw new Error("Order must have items");
    if (!orderData.customer?.phone) throw new Error("Customer phone required");

    const total = orderData.items.reduce((s, i) => s + i.price * i.qty, 0);
    const payment = await this.paymentGateway.charge(total, orderData.cardToken);

    if (payment.status !== "success") {
      await this.notifier.sendSMS(orderData.customer.phone, `Payment failed: ${payment.error}`);
      return { success: false, error: payment.error };
    }

    const order = { id: "ORD-" + Date.now(), items: orderData.items, total, paymentId: payment.paymentId, status: "confirmed" };
    this.orders.push(order);
    await this.notifier.sendSMS(orderData.customer.phone, `Order ${order.id} confirmed! Rs.${total}`);
    if (orderData.customer.email) {
      await this.notifier.sendEmail(orderData.customer.email, "Confirmed", `Order ${order.id}`);
    }
    return { success: true, order };
  }
}

describe("OrderService — Mocked Payment & Notifications", () => {
  const mkGateway = () => ({ charge: fn() });
  const mkNotifier = () => ({ sendSMS: fn(), sendEmail: fn() });
  const sampleOrder = {
    items: [{ name: "Headphones", price: 1999, qty: 1 }, { name: "Case", price: 499, qty: 2 }],
    customer: { phone: "+919876543210", email: "c@e.com" },
    cardToken: "tok_visa",
  };

  testAsync("successful order flow", async () => {
    const gw = mkGateway(), nt = mkNotifier();
    const svc = new OrderService(gw, nt);
    gw.charge.mockResolvedValue({ status: "success", paymentId: "pay_001" });
    nt.sendSMS.mockResolvedValue(true);
    nt.sendEmail.mockResolvedValue(true);

    const result = await svc.placeOrder(sampleOrder);

    expect(result.success).toBe(true);
    expect(result.order.total).toBe(2997);
    expect(gw.charge).toHaveBeenCalledTimes(1);
    expect(gw.charge).toHaveBeenCalledWith(2997, "tok_visa");
    expect(nt.sendSMS).toHaveBeenCalledTimes(1);
    expect(nt.sendEmail).toHaveBeenCalledTimes(1);
  });

  testAsync("payment failure sends failure SMS", async () => {
    const gw = mkGateway(), nt = mkNotifier();
    const svc = new OrderService(gw, nt);
    gw.charge.mockResolvedValue({ status: "failed", error: "Insufficient funds" });
    nt.sendSMS.mockResolvedValue(true);

    const result = await svc.placeOrder(sampleOrder);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Insufficient funds");
    expect(nt.sendSMS).toHaveBeenCalledTimes(1);
    expect(nt.sendEmail).not.toHaveBeenCalled();
  });

  testAsync("validates before charging", async () => {
    const gw = mkGateway(), nt = mkNotifier();
    const svc = new OrderService(gw, nt);
    try {
      await svc.placeOrder({ items: [], customer: { phone: "123" } });
      expect(true).toBe(false);
    } catch (e) { expect(e.message).toBe("Order must have items"); }
    expect(gw.charge).not.toHaveBeenCalled();
  });
});


// ============================================================
// EXAMPLE 8 — Mock as Callback
// Story: RedBus's seat selection uses callbacks: selectSeat(id,
//   onSuccess, onFailure). Both callbacks are mocks in tests.
// ============================================================

function selectSeat(seatId, available, onSuccess, onFailure) {
  if (available.includes(seatId)) onSuccess({ seatId, status: "selected", price: 850 });
  else onFailure(new Error(`Seat ${seatId} not available`));
}

describe("Mock as Callback", () => {
  test("calls onSuccess for available seat", () => {
    const ok = fn(), fail = fn();
    selectSeat("A2", ["A1", "A2", "B1"], ok, fail);
    expect(ok).toHaveBeenCalledTimes(1);
    expect(ok).toHaveBeenCalledWith({ seatId: "A2", status: "selected", price: 850 });
    expect(fail).not.toHaveBeenCalled();
  });

  test("calls onFailure for unavailable seat", () => {
    const ok = fn(), fail = fn();
    selectSeat("C5", ["A1", "A2"], ok, fail);
    expect(fail).toHaveBeenCalledTimes(1);
    expect(ok).not.toHaveBeenCalled();
  });
});


// ============================================================
// EXAMPLE 9 — Clearing, Resetting, and Restoring Mocks
// Story: Paytm Mall's test #12 always failed in suite but passed
//   alone. A mock from test #5 wasn't cleared — call count carried
//   over. Now every afterEach includes mockClear().
// ============================================================

// .mockClear()   — Reset calls, KEEP implementation
// .mockReset()   — Clear + remove implementation
// .mockRestore() — Restore ORIGINAL (only with spyOn)

describe("Mock Cleanup", () => {
  test("mockClear resets calls, keeps implementation", () => {
    const calc = fn().mockReturnValue(42);
    calc("first"); calc("second");
    expect(calc).toHaveBeenCalledTimes(2);

    calc.mockClear();
    expect(calc).toHaveBeenCalledTimes(0); // Cleared!
    expect(calc("third")).toBe(42);        // Implementation kept!
  });

  test("mockReset removes everything", () => {
    const calc = fn().mockReturnValue(42);
    calc("call1");
    calc.mockReset();
    expect(calc).toHaveBeenCalledTimes(0);
    expect(calc("call2")).toBe(undefined); // Implementation gone!
  });
});

// In Vitest/Jest: vi.clearAllMocks(), vi.resetAllMocks(), vi.restoreAllMocks()


// ============================================================
// EXAMPLE 10 — Practical: Full Payment Processor
// Story: Complete test suite for payment processing: UPI, fraud
//   detection, ledger recording, and notifications — all mocked.
// ============================================================

class PaymentProcessor {
  constructor(gateway, fraud, ledger, notifier) {
    this.gateway = gateway;
    this.fraud = fraud;
    this.ledger = ledger;
    this.notifier = notifier;
  }

  async process(data) {
    const { amount, customerId, method, phone } = data;
    const fraudCheck = await this.fraud.check(amount, customerId);
    if (fraudCheck.flagged) return { status: "blocked", reason: "Fraud detected" };

    const charge = await this.gateway.charge(amount, method);
    if (charge.status !== "success") return { status: "failed", reason: charge.error };

    await this.ledger.record({ paymentId: charge.paymentId, amount, customerId, method });
    await this.notifier.sendSMS(phone, `Payment of Rs.${amount} successful!`);
    return { status: "success", paymentId: charge.paymentId, amount };
  }
}

describe("PaymentProcessor — Complete Mock Suite", () => {
  const mkDeps = () => ({ gateway: { charge: fn() }, fraud: { check: fn() }, ledger: { record: fn() }, notifier: { sendSMS: fn() } });
  const payData = { amount: 4999, customerId: "C-001", method: "upi", phone: "+919876543210" };

  testAsync("successful payment", async () => {
    const d = mkDeps();
    d.fraud.check.mockResolvedValue({ flagged: false });
    d.gateway.charge.mockResolvedValue({ status: "success", paymentId: "PAY-001" });
    d.ledger.record.mockResolvedValue(true);
    d.notifier.sendSMS.mockResolvedValue(true);

    const r = await new PaymentProcessor(d.gateway, d.fraud, d.ledger, d.notifier).process(payData);
    expect(r.status).toBe("success");
    expect(r.paymentId).toBe("PAY-001");
    expect(d.fraud.check).toHaveBeenCalledWith(4999, "C-001");
    expect(d.gateway.charge).toHaveBeenCalledWith(4999, "upi");
    expect(d.ledger.record).toHaveBeenCalledTimes(1);
    expect(d.notifier.sendSMS).toHaveBeenCalledTimes(1);
  });

  testAsync("blocked by fraud", async () => {
    const d = mkDeps();
    d.fraud.check.mockResolvedValue({ flagged: true });

    const r = await new PaymentProcessor(d.gateway, d.fraud, d.ledger, d.notifier).process(payData);
    expect(r.status).toBe("blocked");
    expect(d.gateway.charge).not.toHaveBeenCalled();
    expect(d.ledger.record).not.toHaveBeenCalled();
  });

  testAsync("gateway failure", async () => {
    const d = mkDeps();
    d.fraud.check.mockResolvedValue({ flagged: false });
    d.gateway.charge.mockResolvedValue({ status: "failed", error: "UPI timeout" });

    const r = await new PaymentProcessor(d.gateway, d.fraud, d.ledger, d.notifier).process(payData);
    expect(r.status).toBe("failed");
    expect(r.reason).toBe("UPI timeout");
    expect(d.ledger.record).not.toHaveBeenCalled();
  });
});

// --- Print summary ---
setTimeout(() => {
  console.log(`\n=== RESULTS: ${results.passed} passed, ${results.failed} failed ===`);
  if (results.errors.length) results.errors.forEach((e) => console.log(`  - ${e.name}: ${e.error}`));
}, 100);


// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. Three test doubles: SPY (records, real runs), STUB (fixed
//    return), MOCK (records + verifies expectations).
//
// 2. vi.fn() / jest.fn() creates a mock. It records all calls
//    and can be configured with mockReturnValue, mockImplementation.
//
// 3. mockResolvedValue for async success, mockRejectedValue for
//    async failure — essential for API call mocking.
//
// 4. Inspect mocks: toHaveBeenCalled, toHaveBeenCalledTimes(n),
//    toHaveBeenCalledWith(args), mock._calls for raw data.
//
// 5. vi.spyOn wraps real methods. Always mockRestore() after.
//
// 6. Cleanup: mockClear (reset calls), mockReset (clear + remove
//    impl), mockRestore (restore original).
//
// 7. Mock external dependencies, not your own logic. If you mock
//    everything, your tests test nothing.
//
// 8. Design for testability: dependency injection (accept deps as
//    params) eliminates the need for module mocking.
// ============================================================
