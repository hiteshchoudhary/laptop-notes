// ============================================================
// FILE 05: MOCKING ADVANCED
// Topic: Module mocking, timer mocking, date mocking, and dependency injection
// WHY: Real applications have deeply entangled dependencies — imported
//   modules, timers for debounce/retry, date-dependent logic for expiry
//   checks, and environment variables for API keys. This file teaches
//   you to mock ALL of them for total control in your tests.
// ============================================================

// ============================================================
// EXAMPLE 1 — The Swiggy Delivery Estimator Challenge
// Story: Swiggy's delivery time estimator depends on THREE external
//   systems: Google Maps API (distance/traffic), Redis cache (prep
//   times), and current system time (peak hour detection). If any
//   behaves unpredictably, tests become flaky. Swiggy mocks all three:
//   Maps returns fixed distances, Redis returns cached times, clock
//   is frozen. Result: 100% deterministic tests.
// ============================================================

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
    toBeGreaterThan(n) { if (!(received > n)) throw new Error(`${received} not > ${n}`); },
    toBeLessThan(n) { if (!(received < n)) throw new Error(`${received} not < ${n}`); },
    toBeTruthy() { if (!received) throw new Error(`Expected truthy`); },
    toBeFalsy() { if (received) throw new Error(`Expected falsy`); },
    toContain(i) { if (!(Array.isArray(received)?received.includes(i):String(received).includes(i))) throw new Error(`Missing ${i}`); },
    toHaveProperty(k, v) { if (!(k in received)) throw new Error(`No "${k}"`); if (v !== undefined && received[k] !== v) throw new Error(`"${k}": ${received[k]} != ${v}`); },
    toThrow(m) { let t=false,msg=""; try{received();}catch(e){t=true;msg=e.message;} if(!t)throw new Error("No throw"); if(m&&!msg.includes(m))throw new Error(`"${m}" not in "${msg}"`); },
    not: { toBe(e) { if(received===e) throw new Error(`Expected NOT ${JSON.stringify(e)}`); }, toBeTruthy() { if(received) throw new Error(`Expected falsy`); } },
  };
}
function fn(impl) {
  function m(...a) {
    m._calls.push(a);
    if (m._returnOnceQ.length) return m._returnOnceQ.shift();
    if (m._impl) return m._impl(...a);
    if (m._retVal !== undefined) return m._retVal;
  }
  m._isMock=true; m._calls=[]; m._retVal=undefined; m._returnOnceQ=[]; m._impl=impl||null;
  m.mockReturnValue=(v)=>{m._retVal=v;return m;};
  m.mockReturnValueOnce=(v)=>{m._returnOnceQ.push(v);return m;};
  m.mockImplementation=(f)=>{m._impl=f;return m;};
  m.mockResolvedValue=(v)=>{m._impl=()=>Promise.resolve(v);return m;};
  m.mockRejectedValue=(v)=>{m._impl=()=>Promise.reject(v);return m;};
  m.mockClear=()=>{m._calls=[];return m;};
  m.mockReset=()=>{m._calls=[];m._retVal=undefined;m._returnOnceQ=[];m._impl=null;return m;};
  return m;
}


// ============================================================
// EXAMPLE 2 — Module Mocking: Replacing Entire Imports
// Story: Dunzo's delivery tracking imports GPS, mapping, and weather
//   modules. You can't test ETA if GPS returns your ACTUAL location.
//   Module mocking replaces the ENTIRE import with mock versions.
// ============================================================

// WHY: In real apps, dependencies are imports, not constructor params.
// Module mocking intercepts the import system itself.

// --- Vitest module mock syntax ---
/*
// In test file:
import { describe, test, expect, vi } from 'vitest';

vi.mock('./mapsService.js');      // Auto-mock: all exports become vi.fn()
vi.mock('./weatherService.js');

import { getDistance } from './mapsService.js';    // Now a mock
import { getWeather } from './weatherService.js';  // Now a mock

test('clear weather ETA', () => {
  getDistance.mockReturnValue(5);
  getWeather.mockReturnValue('clear');
  const eta = estimateDelivery('Koramangala', 'Indiranagar');
  expect(eta).toBe(10);  // 5km * 2min/km
});
*/

// --- Simulating module mocking ---
const mapsModule = { getDistance: null };
const weatherModule = { getWeather: null };

function estimateDeliveryTime(origin, destination) {
  const distance = mapsModule.getDistance(origin, destination);
  const weather = weatherModule.getWeather(destination);
  let baseMinutes = distance * 2;
  if (weather === "rain") baseMinutes *= 1.5;
  if (weather === "storm") baseMinutes *= 2;
  return Math.round(baseMinutes);
}

describe("Module Mocking — Delivery Estimator", () => {
  mapsModule.getDistance = fn();
  weatherModule.getWeather = fn();

  test("10 min for 5km in clear weather", () => {
    mapsModule.getDistance.mockReturnValue(5);
    weatherModule.getWeather.mockReturnValue("clear");
    expect(estimateDeliveryTime("Koramangala", "Indiranagar")).toBe(10);
  });

  test("15 min for 5km in rain (1.5x)", () => {
    mapsModule.getDistance.mockReturnValue(5);
    weatherModule.getWeather.mockReturnValue("rain");
    expect(estimateDeliveryTime("HSR", "Whitefield")).toBe(15);
  });

  test("20 min for 5km in storm (2x)", () => {
    mapsModule.getDistance.mockReturnValue(5);
    weatherModule.getWeather.mockReturnValue("storm");
    expect(estimateDeliveryTime("MG Road", "EC")).toBe(20);
  });
});


// ============================================================
// EXAMPLE 3 — Manual Mock with Factory Function
// Story: Razorpay's API client has 15 methods but tests only need 3.
//   Factory mock gives precise control: createOrder, capturePayment,
//   refund. Other methods don't exist — accidental calls fail loudly.
// ============================================================

/*
vi.mock('./razorpayClient', () => ({
  createOrder: vi.fn(),
  capturePayment: vi.fn(),
  refund: vi.fn(),
}));
*/

function createMockRazorpay() {
  return { createOrder: fn(), capturePayment: fn(), refund: fn() };
}

describe("Factory Mock — Razorpay", () => {
  test("create order and capture payment", () => {
    const rp = createMockRazorpay();
    rp.createOrder.mockReturnValue({ id: "order_001", amount: 50000, status: "created" });
    rp.capturePayment.mockReturnValue({ id: "pay_001", status: "captured" });

    const order = rp.createOrder({ amount: 50000, currency: "INR" });
    expect(order.status).toBe("created");
    const pay = rp.capturePayment(order.id, 50000);
    expect(pay.status).toBe("captured");
  });

  test("refund flow", () => {
    const rp = createMockRazorpay();
    rp.refund.mockReturnValue({ id: "rfnd_001", status: "processed" });
    expect(rp.refund("pay_001", { amount: 50000 }).status).toBe("processed");
  });
});

// --- __mocks__/ directory pattern ---
// Place manual mocks in __mocks__/ adjacent to the module:
//   src/services/paymentService.js
//   src/services/__mocks__/paymentService.js  <- auto-used by vi.mock()
// Or adjacent to node_modules for third-party:
//   __mocks__/axios.js   <- mocks the 'axios' package


// ============================================================
// EXAMPLE 4 — Timer Mocking: setTimeout, setInterval, Debounce
// Story: Zomato's order page auto-refreshes every 30s. Debounced
//   search waits 300ms. Retry uses exponential backoff (1s, 2s, 4s).
//   Real timers make tests take minutes. Fake timers: instant.
// ============================================================

// WHY: Timer-dependent code is a major source of slow, flaky tests.
// Fake timers give you a "remote control" for the clock.

// Vitest/Jest API:
// vi.useFakeTimers()         — install
// vi.advanceTimersByTime(ms) — fast-forward
// vi.runAllTimers()          — execute all pending
// vi.useRealTimers()         — restore

class FakeTimers {
  constructor() {
    this.time = 0;
    this.timers = [];
    this.nextId = 1;
    this._origST = null;
    this._origCI = null;
  }
  install() {
    this._origST = globalThis.setTimeout;
    this._origCI = globalThis.clearTimeout;
    const self = this;
    globalThis.setTimeout = (cb, delay) => {
      const id = self.nextId++;
      self.timers.push({ id, cb, at: self.time + delay, done: false });
      return id;
    };
    globalThis.clearTimeout = (id) => {
      const t = self.timers.find((t) => t.id === id);
      if (t) t.done = true;
    };
  }
  advanceTimersByTime(ms) {
    const target = this.time + ms;
    while (this.time < target) {
      const next = this.timers.filter((t) => !t.done && t.at <= target).sort((a, b) => a.at - b.at)[0];
      if (!next) { this.time = target; break; }
      this.time = next.at;
      next.done = true;
      next.cb();
    }
  }
  uninstall() {
    globalThis.setTimeout = this._origST;
    globalThis.clearTimeout = this._origCI;
    this.timers = [];
    this.time = 0;
  }
}

function debounce(func, delay) {
  let tid = null;
  return function (...args) {
    if (tid) clearTimeout(tid);
    tid = setTimeout(() => func(...args), delay);
  };
}

describe("Timer Mocking — Debounce", () => {
  const ft = new FakeTimers();

  test("debounce delays execution", () => {
    ft.install();
    const cb = fn();
    const debounced = debounce(cb, 300);

    debounced("a"); debounced("b"); debounced("c");
    expect(cb._calls.length).toBe(0); // Not yet

    ft.advanceTimersByTime(300);
    expect(cb._calls.length).toBe(1); // Called once with last args
    ft.uninstall();
  });

  test("debounce resets on new call", () => {
    ft.install();
    const cb = fn();
    const debounced = debounce(cb, 300);

    debounced("first");
    ft.advanceTimersByTime(200); // 200ms — not yet
    expect(cb._calls.length).toBe(0);

    debounced("second"); // Resets timer!
    ft.advanceTimersByTime(200); // 400ms total, but only 200 from "second"
    expect(cb._calls.length).toBe(0); // Still waiting

    ft.advanceTimersByTime(100); // 300ms from "second"
    expect(cb._calls.length).toBe(1);
    ft.uninstall();
  });
});

// Testing throttle/polling follows the same pattern:
// vi.advanceTimersByTime(intervalMs) to trigger each tick


// ============================================================
// EXAMPLE 5 — Date Mocking: Freezing Time
// Story: IRCTC's Tatkal opens at 10:00 AM. Swiggy's happy hour is
//   2-5 PM. PhonePe's UPI cutoff is 11 PM. Can't wait for real time!
//   vi.setSystemTime() freezes the clock at any moment.
// ============================================================

// vi.useFakeTimers();
// vi.setSystemTime(new Date('2024-01-26T10:00:00+05:30'));
// expect(new Date().getHours()).toBe(10);
// vi.useRealTimers();

function isTatkalWindow(date) {
  const h = date.getHours();
  return h >= 10 && h < 12;
}

function isHappyHour(date) {
  const h = date.getHours();
  return h >= 14 && h < 17;
}

function getDiscount(date) {
  return isHappyHour(date) ? 20 : 0;
}

function isCouponExpired(coupon, now) {
  return now > new Date(coupon.expiresAt);
}

function getAge(birthDate, now) {
  return Math.floor((now - new Date(birthDate)) / (365.25 * 24 * 60 * 60 * 1000));
}

describe("Date Mocking — Time-Dependent Logic", () => {
  test("Tatkal open at 10 AM", () => {
    expect(isTatkalWindow(new Date("2024-01-26T10:00:00+05:30"))).toBe(true);
  });
  test("Tatkal open at 11:30 AM", () => {
    expect(isTatkalWindow(new Date("2024-01-26T11:30:00+05:30"))).toBe(true);
  });
  test("Tatkal closed at 1 PM", () => {
    expect(isTatkalWindow(new Date("2024-01-26T13:00:00+05:30"))).toBe(false);
  });
  test("Tatkal closed at 9 AM", () => {
    expect(isTatkalWindow(new Date("2024-01-26T09:00:00+05:30"))).toBe(false);
  });
  test("Happy hour discount at 3 PM", () => {
    expect(getDiscount(new Date("2024-03-15T15:00:00+05:30"))).toBe(20);
  });
  test("No discount at 6 PM", () => {
    expect(getDiscount(new Date("2024-03-15T18:00:00+05:30"))).toBe(0);
  });
  test("Expired coupon", () => {
    const coupon = { code: "SAVE20", expiresAt: "2024-01-25T23:59:59+05:30" };
    expect(isCouponExpired(coupon, new Date("2024-01-26T10:00:00+05:30"))).toBe(true);
  });
  test("Valid coupon", () => {
    const coupon = { code: "SAVE20", expiresAt: "2024-01-27T23:59:59+05:30" };
    expect(isCouponExpired(coupon, new Date("2024-01-26T10:00:00+05:30"))).toBe(false);
  });
  test("Age for KYC", () => {
    const now = new Date("2024-01-26");
    expect(getAge("2000-05-15", now)).toBe(23);
    expect(getAge("2006-06-15", now)).toBe(17); // Minor
  });
});


// ============================================================
// EXAMPLE 6 — Mocking fetch / API Calls
// Story: Zomato's restaurant search fetches from REST API. Mock
//   global.fetch to return instantly. No network, no latency, no
//   rate limits, no API key needed.
// ============================================================

/*
// Vitest/Jest:
global.fetch = vi.fn();
test('fetch restaurants', async () => {
  global.fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ restaurants: [{name: 'Paradise', rating: 4.5}] }),
  });
  const result = await searchRestaurants('Biryani');
  expect(result).toHaveLength(1);
  expect(fetch).toHaveBeenCalledWith('https://api.zomato.com/v2/search?q=Biryani');
});

// BETTER: mock the API service module, not global.fetch
vi.mock('./apiClient', () => ({ get: vi.fn(), post: vi.fn() }));
*/

function createMockFetch() {
  const mf = fn();
  mf.respondWith = (data, status = 200) => {
    mf.mockReturnValue({ ok: status >= 200 && status < 300, status, json: () => data });
    return mf;
  };
  mf.respondWithError = (msg) => { mf.mockImplementation(() => { throw new Error(msg); }); return mf; };
  return mf;
}

function searchRestaurants(query, fetchFn) {
  const resp = fetchFn(`https://api.zomato.com/v2/search?q=${query}`);
  if (!resp.ok) throw new Error(`API error: ${resp.status}`);
  return resp.json();
}

describe("Mocking fetch", () => {
  test("successful search", () => {
    const mf = createMockFetch().respondWith({
      restaurants: [{ name: "Paradise Biryani", rating: 4.5 }, { name: "Behrouz", rating: 4.2 }],
    });
    const data = searchRestaurants("Biryani", mf);
    expect(data.restaurants.length).toBe(2);
  });

  test("API error", () => {
    const mf = createMockFetch().respondWith({ error: "Rate limited" }, 429);
    expect(() => searchRestaurants("Pizza", mf)).toThrow("API error: 429");
  });

  test("network failure", () => {
    const mf = createMockFetch().respondWithError("Network failed");
    expect(() => searchRestaurants("Dosa", mf)).toThrow("Network failed");
  });
});


// ============================================================
// EXAMPLE 7 — Partial Mocking: Mock Some, Keep Others Real
// Story: Freshworks has 20 util functions. Mock formatDate() (timezone
//   dependent) but keep formatCurrency, calculatePercentage real.
// ============================================================

/*
vi.mock('./utils', async () => {
  const actual = await vi.importActual('./utils');
  return { ...actual, formatDate: vi.fn().mockReturnValue('26/01/2024') };
});
*/

const utils = {
  formatCurrency(amt) { return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amt); },
  formatDate(d) { return d.toLocaleDateString("en-IN"); },
  calcPercent(part, total) { return total === 0 ? 0 : Math.round((part / total) * 10000) / 100; },
  truncate(text, max) { return text.length <= max ? text : text.slice(0, max - 3) + "..."; },
};

describe("Partial Mocking", () => {
  const origFD = utils.formatDate;

  test("mock formatDate, keep rest real", () => {
    utils.formatDate = fn().mockReturnValue("26/01/2024"); // Mock this one

    expect(utils.formatDate(new Date())).toBe("26/01/2024");    // Mocked
    expect(utils.formatCurrency(1299)).toContain("1,299");      // Real
    expect(utils.calcPercent(75, 200)).toBe(37.5);              // Real
    expect(utils.truncate("Bengaluru is the tech capital of India", 20)).toBe("Bengaluru is the ...");

    utils.formatDate = origFD; // Restore
  });
});


// ============================================================
// EXAMPLE 8 — Mocking Environment Variables
// Story: Paytm reads API keys from process.env. Production uses
//   live keys, tests use test keys. Never hit production in tests!
// ============================================================

/*
describe('Config', () => {
  const origEnv = process.env;
  beforeEach(() => { process.env = { ...origEnv }; });
  afterAll(() => { process.env = origEnv; });

  test('production config', () => {
    process.env.NODE_ENV = 'production';
    process.env.API_URL = 'https://api.paytm.com';
    expect(createConfig().apiUrl).toBe('https://api.paytm.com');
  });
});
*/

function createConfig(env) {
  return {
    apiUrl: env.API_URL || "http://localhost:3000",
    apiKey: env.API_KEY || "dev_key",
    env: env.NODE_ENV || "development",
    cache: env.ENABLE_CACHE === "true",
    retries: parseInt(env.MAX_RETRIES || "3", 10),
  };
}

describe("Environment Variable Mocking", () => {
  test("production config", () => {
    const cfg = createConfig({ API_URL: "https://api.razorpay.com", API_KEY: "rzp_live_x", NODE_ENV: "production", ENABLE_CACHE: "true", MAX_RETRIES: "5" });
    expect(cfg.apiUrl).toBe("https://api.razorpay.com");
    expect(cfg.env).toBe("production");
    expect(cfg.cache).toBe(true);
    expect(cfg.retries).toBe(5);
  });

  test("test config with defaults", () => {
    const cfg = createConfig({ NODE_ENV: "test" });
    expect(cfg.apiUrl).toBe("http://localhost:3000");
    expect(cfg.cache).toBe(false);
    expect(cfg.retries).toBe(3);
  });
});


// ============================================================
// EXAMPLE 9 — Mocking Classes & Dependency Injection
// Story: CRED mandates every service accepts dependencies as params.
//   No function imports its own dependencies. This makes every service
//   testable by default — just pass mocks. They cut mocking boilerplate
//   by 60% and call it "test-friendly architecture."
// ============================================================

// BAD: hard-coded imports (need vi.mock to test)
/*
import { sendEmail } from './email.js';
function processPayment(order) {
  sendEmail(order.email, 'Receipt');  // Can't mock without vi.mock!
}
*/

// GOOD: dependency injection (pass mocks directly)
function createPaymentService({ chargeCard, sendEmail, log }) {
  return {
    async process(order) {
      if (!order.total || order.total <= 0) throw new Error("Invalid total");
      log("info", `Charging Rs.${order.total}`);
      const charge = await chargeCard(order.total, order.method);
      if (charge.status !== "success") {
        log("error", `Failed: ${charge.error}`);
        return { success: false, error: charge.error };
      }
      await sendEmail(order.email, "Receipt", `Rs.${order.total} charged. Txn: ${charge.txnId}`);
      log("info", `Success: ${charge.txnId}`);
      return { success: true, txnId: charge.txnId };
    },
  };
}

describe("Dependency Injection — Payment Service", () => {
  const mkDeps = () => ({ chargeCard: fn(), sendEmail: fn(), log: fn() });

  testAsync("successful payment", async () => {
    const d = mkDeps();
    d.chargeCard.mockResolvedValue({ status: "success", txnId: "TXN-001" });
    d.sendEmail.mockResolvedValue(true);
    const svc = createPaymentService(d);

    const r = await svc.process({ total: 4999, method: "upi", email: "c@e.com" });
    expect(r.success).toBe(true);
    expect(d.chargeCard._calls.length).toBe(1);
    expect(d.sendEmail._calls.length).toBe(1);
    expect(d.log._calls.length).toBeGreaterThan(0);
  });

  testAsync("failed payment skips email", async () => {
    const d = mkDeps();
    d.chargeCard.mockResolvedValue({ status: "failed", error: "Declined" });
    const r = await createPaymentService(d).process({ total: 9999, method: "card", email: "c@e.com" });
    expect(r.success).toBe(false);
    expect(d.sendEmail._calls.length).toBe(0); // No email for failure
  });
});


// ============================================================
// EXAMPLE 10 — Practical: Swiggy Delivery Time Estimator
// Story: The complete estimator from the opening story. Mocks Maps
//   API, Redis cache, and current time — all together.
// ============================================================

function createDeliveryEstimator({ mapsApi, cache, getCurrentTime }) {
  return {
    async estimate(restaurantId, address) {
      // Prep time from cache (default 15 min)
      let prepTime = cache.get(`prep:${restaurantId}`);
      if (prepTime === null || prepTime === undefined) prepTime = 15;

      // Travel time from Maps API
      const location = cache.get(`location:${restaurantId}`);
      const distance = await mapsApi.getDistance(location, address);
      const travelTime = distance * 3; // 3 min/km

      // Peak hour check (12-2 PM lunch, 7-10 PM dinner)
      const hour = getCurrentTime().getHours();
      const isPeak = (hour >= 12 && hour < 14) || (hour >= 19 && hour < 22);
      const multiplier = isPeak ? 1.4 : 1.0;

      const totalMinutes = Math.round((prepTime + travelTime) * multiplier);
      return { prepTime, travelTime: Math.round(travelTime), isPeak, multiplier, totalMinutes };
    },
  };
}

describe("Swiggy Delivery Estimator — Full Mock Integration", () => {
  function mkDeps(hour = 15) {
    return {
      mapsApi: { getDistance: fn().mockResolvedValue(4) },
      cache: {
        get: fn().mockImplementation((key) => {
          if (key.startsWith("prep:")) return 12;
          if (key.startsWith("location:")) return "12.97,77.59";
          return null;
        }),
      },
      getCurrentTime: fn().mockReturnValue(
        new Date(`2024-03-15T${String(hour).padStart(2, "0")}:30:00+05:30`)
      ),
    };
  }

  testAsync("off-peak delivery (3:30 PM)", async () => {
    const d = mkDeps(15);
    const r = await createDeliveryEstimator(d).estimate("rest-001", "Koramangala");
    expect(r.prepTime).toBe(12);
    expect(r.travelTime).toBe(12); // 4km * 3
    expect(r.isPeak).toBe(false);
    expect(r.multiplier).toBe(1.0);
    expect(r.totalMinutes).toBe(24); // (12+12)*1.0
  });

  testAsync("lunch peak (1:30 PM)", async () => {
    const r = await createDeliveryEstimator(mkDeps(13)).estimate("rest-001", "Indiranagar");
    expect(r.isPeak).toBe(true);
    expect(r.multiplier).toBe(1.4);
    expect(r.totalMinutes).toBe(34); // (12+12)*1.4 = 33.6 -> 34
  });

  testAsync("dinner peak (8:30 PM)", async () => {
    const r = await createDeliveryEstimator(mkDeps(20)).estimate("rest-001", "HSR");
    expect(r.isPeak).toBe(true);
    expect(r.multiplier).toBe(1.4);
  });

  testAsync("longer distance (10km)", async () => {
    const d = mkDeps(15);
    d.mapsApi.getDistance.mockResolvedValue(10);
    const r = await createDeliveryEstimator(d).estimate("rest-002", "EC");
    expect(r.travelTime).toBe(30); // 10*3
    expect(r.totalMinutes).toBe(42); // (12+30)*1.0
  });

  testAsync("default prep when not cached", async () => {
    const d = mkDeps(15);
    d.cache.get.mockImplementation((key) => {
      if (key.startsWith("prep:")) return null; // Not cached!
      if (key.startsWith("location:")) return "12.97,77.59";
      return null;
    });
    const r = await createDeliveryEstimator(d).estimate("rest-new", "Whitefield");
    expect(r.prepTime).toBe(15); // Default
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
// 1. Module mocking (vi.mock) replaces entire imports. Auto-mock
//    makes all exports vi.fn(). Factory gives precise control.
//
// 2. Partial mocking (vi.importActual + spread) mocks ONE function
//    while keeping others real.
//
// 3. Timer mocking (vi.useFakeTimers) controls setTimeout/setInterval.
//    advanceTimersByTime for debounce, throttle, retry tests.
//
// 4. Date mocking (vi.setSystemTime) freezes the clock. Essential
//    for expiry, scheduling, and peak-hour logic.
//
// 5. Fetch mocking: mock global.fetch or (better) mock the API
//    service module. Test success, failure, network error paths.
//
// 6. Environment mocking: save/restore process.env. Test different
//    configs without touching real credentials.
//
// 7. DEPENDENCY INJECTION is the #1 pattern for testability.
//    Accept deps as params = no module mocking needed.
//
// 8. The more you mock, the less you test. Mock external boundaries
//    (APIs, DBs). Keep your business logic real.
//
// 9. Always clean up: mockRestore, useRealTimers, restore env.
//    Leaked state = flaky tests.
// ============================================================
