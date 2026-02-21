// ============================================================
// FILE 08: TESTING API CALLS
// Topic: Mocking HTTP requests — from manual fetch mocks to MSW (Mock Service Worker)
// WHY: Real API calls in tests are slow, unreliable, expensive, and
//   rate-limited. You need controlled responses to test all paths:
//   success, error, timeout, auth failure, and network outage.
// ============================================================

// ============================================================
// EXAMPLE 1 — Ola Ride Estimation
// Story: Ola processes millions of ride requests daily. Each request
//   calls Google Maps for distance, a pricing engine for fare, and a
//   driver matching service for ETA. Running real API calls in tests
//   costs thousands in Maps API fees, takes minutes per suite, and
//   fails whenever Google's API has a hiccup. MSW lets Ola's engineers
//   test every scenario in milliseconds with zero API costs.
// ============================================================

// WHY: Real API calls in tests are SLOW (100ms-2s each), FLAKY (network
// issues), EXPENSIVE (API fees), UNCONTROLLABLE (can't force a 500 error),
// and have SIDE EFFECTS (real SMS, real charges).

console.log("--- The Problem with Real API Calls ---");
console.log("Slow, flaky, expensive, uncontrollable, side effects.");
console.log("Solution: Intercept and control API responses in tests.");
console.log("");

// ============================================================
// EXAMPLE 2 — The Ride Service (Code Under Test)
// Story: Simplified version of Ola's ride estimation service. Calls
//   three APIs: geocoding, distance calculation, and fare estimation.
// ============================================================

const BASE_URL = "https://api.ola-internal.com";

async function geocodeAddress(address) {
  const response = await fetch(`${BASE_URL}/geocode?address=${encodeURIComponent(address)}`);
  if (!response.ok) throw new Error(`Geocoding failed: ${response.status}`);
  return response.json();
}

async function calculateDistance(fromCoords, toCoords) {
  const response = await fetch(`${BASE_URL}/distance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ from: fromCoords, to: toCoords }),
  });
  if (!response.ok) throw new Error(`Distance calculation failed: ${response.status}`);
  return response.json();
}

async function estimateFare(distanceKm, rideType = "mini") {
  const response = await fetch(`${BASE_URL}/fare`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer test-token-123" },
    body: JSON.stringify({ distanceKm, rideType }),
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error("Authentication failed. Please login again.");
    throw new Error(`Fare estimation failed: ${response.status}`);
  }
  return response.json();
}

async function getRideEstimate(pickup, dropoff, rideType = "mini") {
  const [pickupCoords, dropoffCoords] = await Promise.all([
    geocodeAddress(pickup), geocodeAddress(dropoff),
  ]);
  const { distanceKm, durationMin } = await calculateDistance(pickupCoords, dropoffCoords);
  const { fare, surgeFactor } = await estimateFare(distanceKm, rideType);
  return { pickup, dropoff, distanceKm, durationMin, fare, surgeFactor, rideType };
}

console.log("--- Ride Service ---");
console.log("geocodeAddress → calculateDistance → estimateFare → result");
console.log("");

// ============================================================
// EXAMPLE 3 — Approach 1: Mock the HTTP Client (global.fetch)
// Story: Ola's first approach was mocking global.fetch directly.
//   Simple but tightly coupled: switching from fetch to axios breaks
//   every test. Still useful for quick unit tests.
// ============================================================

// WHY: Mocking fetch gives total control over responses.
// Downside: coupled to the HTTP library.

// test('geocodeAddress returns coordinates', async () => {
//   global.fetch = vi.fn().mockResolvedValue({
//     ok: true,
//     json: () => Promise.resolve({ lat: 12.9716, lng: 77.5946 }),
//   });
//   const result = await geocodeAddress('Koramangala, Bangalore');
//   expect(result).toEqual({ lat: 12.9716, lng: 77.5946 });
//   expect(global.fetch).toHaveBeenCalledWith(
//     'https://api.ola-internal.com/geocode?address=Koramangala%2C%20Bangalore'
//   );
// });

// test('geocodeAddress throws on API error', async () => {
//   global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });
//   await expect(geocodeAddress('Invalid')).rejects.toThrow('Geocoding failed: 500');
// });

// Sequential mock for multiple fetch calls:
// global.fetch = vi.fn()
//   .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ lat: 12.97, lng: 77.59 }) })  // geocode 1
//   .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ lat: 12.93, lng: 77.61 }) })  // geocode 2
//   .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ distanceKm: 8.5, durationMin: 25 }) })
//   .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ fare: 185, surgeFactor: 1.0 }) });

console.log("--- Approach 1: Mock global.fetch ---");
console.log("Pro: simple, direct control. Con: coupled to fetch library.");
console.log("");

// ============================================================
// EXAMPLE 4 — Approach 2: Mock the Service Layer
// Story: When Ola migrated from fetch to axios, every fetch-mocking
//   test broke. Solution: mock the service module instead. Tests for
//   the handler layer don't care if the service uses fetch or axios.
// ============================================================

// WHY: Mocking at the service layer = better isolation, survives refactors.

// vi.mock('./rideService', () => ({
//   getEstimate: vi.fn(),
//   bookRide: vi.fn(),
//   cancelRide: vi.fn(),
// }));

async function handleEstimateRequest(pickup, dropoff, type) {
  if (!pickup || !dropoff) return { error: "Pickup and dropoff are required" };
  try {
    const estimate = await getRideEstimate(pickup, dropoff, type);
    return { success: true, estimate: { ...estimate, formattedFare: `Rs. ${estimate.fare}` } };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// test('handler formats estimate correctly', async () => {
//   getEstimate.mockResolvedValue({ distanceKm: 12, durationMin: 30, fare: 250, surgeFactor: 1.2 });
//   const result = await handleEstimateRequest('Indiranagar', 'Airport', 'sedan');
//   expect(result.success).toBe(true);
//   expect(result.estimate.formattedFare).toBe('Rs. 250');
// });
// test('handler returns error for missing pickup', async () => {
//   const result = await handleEstimateRequest('', 'Airport', 'mini');
//   expect(result.error).toBe('Pickup and dropoff are required');
// });

console.log("--- Approach 2: Mock the Service Layer ---");
console.log("Pro: decoupled from HTTP library. Con: service itself untested.");
console.log("");

// ============================================================
// EXAMPLE 5 — Approach 3: MSW (Mock Service Worker)
// Story: Ola adopted MSW as the standard. MSW intercepts requests at
//   the network level — your code makes REAL fetch calls, MSW returns
//   controlled responses. Closest thing to testing against a real API.
// ============================================================

// WHY: MSW intercepts at the NETWORK level. Your code doesn't know
// it's being mocked. Catches URL construction, header, and body bugs
// that code-level mocks miss.

// import { http, HttpResponse } from 'msw';
// import { setupServer } from 'msw/node';

// const handlers = [
//   http.get('https://api.ola-internal.com/geocode', ({ request }) => {
//     const url = new URL(request.url);
//     const address = url.searchParams.get('address');
//     const coords = {
//       'Koramangala': { lat: 12.9352, lng: 77.6245 },
//       'Whitefield':  { lat: 12.9698, lng: 77.7500 },
//       'Airport':     { lat: 13.1986, lng: 77.7066 },
//     };
//     return HttpResponse.json(coords[address] || { lat: 12.9716, lng: 77.5946 });
//   }),
//
//   http.post('https://api.ola-internal.com/distance', async ({ request }) => {
//     const body = await request.json();
//     const dist = Math.sqrt(
//       Math.pow(body.to.lat - body.from.lat, 2) + Math.pow(body.to.lng - body.from.lng, 2)
//     ) * 111;
//     return HttpResponse.json({ distanceKm: Math.round(dist * 10) / 10, durationMin: Math.round(dist * 3) });
//   }),
//
//   http.post('https://api.ola-internal.com/fare', async ({ request }) => {
//     const authHeader = request.headers.get('Authorization');
//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//       return new HttpResponse(null, { status: 401 });
//     }
//     const body = await request.json();
//     const ratePerKm = { mini: 10, sedan: 15, suv: 20 }[body.rideType] || 10;
//     return HttpResponse.json({ fare: Math.round(body.distanceKm * ratePerKm + 50), surgeFactor: 1.0 });
//   }),
// ];
// const server = setupServer(...handlers);

console.log("--- MSW Setup ---");
console.log("Define handlers: http.get(), http.post()");
console.log("Create server: setupServer(...handlers)");
console.log("Handlers return HttpResponse.json(data)");
console.log("");

// ============================================================
// EXAMPLE 6 — MSW Lifecycle
// Story: Ola follows strict lifecycle: start before all, reset after
//   each, close after all. Prevents test pollution from handler overrides.
// ============================================================

// beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));  // Fail on unexpected requests
// afterEach(() => server.resetHandlers());                           // Clean up per-test overrides
// afterAll(() => server.close());                                    // Stop server

console.log("--- MSW Lifecycle ---");
console.log("beforeAll: server.listen()   |  afterEach: server.resetHandlers()  |  afterAll: server.close()");
console.log("");

// ============================================================
// EXAMPLE 7 — Testing Error Scenarios with MSW
// Story: Ola tests what happens when Maps is down (500), ride is
//   outside service area (404), auth expires (401), and network fails.
//   server.use() overrides the handler for just one test.
// ============================================================

// WHY: Error handling is where bugs hide. server.use() lets you simulate
// specific failures without affecting other tests.

// test('handles geocoding failure (500)', async () => {
//   server.use(http.get('https://api.ola-internal.com/geocode', () => {
//     return new HttpResponse(null, { status: 500 });
//   }));
//   await expect(getRideEstimate('A', 'B', 'mini')).rejects.toThrow('Geocoding failed: 500');
// });

// test('handles auth failure (401)', async () => {
//   server.use(http.post('https://api.ola-internal.com/fare', () => {
//     return new HttpResponse(null, { status: 401 });
//   }));
//   await expect(getRideEstimate('A', 'B', 'mini')).rejects.toThrow('Authentication failed');
// });

// test('handles network failure', async () => {
//   server.use(http.get('https://api.ola-internal.com/geocode', () => {
//     return HttpResponse.error();    // Simulates network error
//   }));
//   await expect(getRideEstimate('A', 'B', 'mini')).rejects.toThrow();
// });

console.log("--- Error Scenarios ---");
console.log("server.use(handler) — override for one test only");
console.log("HttpResponse(null, { status: 500 }) / HttpResponse.error()");
console.log("");

// ============================================================
// EXAMPLE 8 — Verifying Request Payloads and Headers
// Story: Ola's security team requires correct auth token, content type,
//   and body. MSW handlers can capture and verify the request sent.
// ============================================================

// WHY: Not enough to test responses — verify your code sends the RIGHT request.

// test('sends auth header with fare request', async () => {
//   let capturedAuth;
//   server.use(http.post('https://api.ola-internal.com/fare', async ({ request }) => {
//     capturedAuth = request.headers.get('Authorization');
//     return HttpResponse.json({ fare: 200, surgeFactor: 1.0 });
//   }));
//   await getRideEstimate('A', 'B', 'mini');
//   expect(capturedAuth).toBe('Bearer test-token-123');
// });

// test('sends ride type in fare body', async () => {
//   let capturedBody;
//   server.use(http.post('https://api.ola-internal.com/fare', async ({ request }) => {
//     capturedBody = await request.json();
//     return HttpResponse.json({ fare: 300, surgeFactor: 1.0 });
//   }));
//   await getRideEstimate('A', 'B', 'suv');
//   expect(capturedBody.rideType).toBe('suv');
// });

// test('encodes address in URL', async () => {
//   let capturedUrl;
//   server.use(http.get('https://api.ola-internal.com/geocode', ({ request }) => {
//     capturedUrl = request.url;
//     return HttpResponse.json({ lat: 12.97, lng: 77.59 });
//   }));
//   await geocodeAddress('MG Road, Bangalore');
//   expect(capturedUrl).toContain('address=MG%20Road%2C%20Bangalore');
// });

console.log("--- Request Verification ---");
console.log("Capture body: await request.json()");
console.log("Capture headers: request.headers.get('Authorization')");
console.log("");

// ============================================================
// EXAMPLE 9 — Testing Delayed Responses and Retry Logic
// Story: Ola shows "Finding rides..." while the API responds. MSW's
//   delay() simulates slow servers. Stateful handlers test retry logic.
// ============================================================

// import { delay } from 'msw';
// test('handles slow response', async () => {
//   server.use(http.get('https://api.ola-internal.com/geocode', async () => {
//     await delay(2000);                              // 2 second delay
//     return HttpResponse.json({ lat: 12.97, lng: 77.59 });
//   }));
//   const result = await getRideEstimate('A', 'B');
//   expect(result).toBeDefined();
// });

// Stateful handler for retry testing:
// test('retries and succeeds on third attempt', async () => {
//   let callCount = 0;
//   server.use(http.get('https://api.ola-internal.com/geocode', () => {
//     callCount++;
//     if (callCount <= 2) return new HttpResponse(null, { status: 503 }); // Fail first 2
//     return HttpResponse.json({ lat: 12.97, lng: 77.59 });              // Succeed on 3rd
//   }));
//   // const result = await geocodeWithRetry('Koramangala');
//   // expect(callCount).toBe(3);
// });

async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      if (response.status < 500) throw new Error(`Client error: ${response.status}`);
      lastError = new Error(`Server error: ${response.status}`);
    } catch (error) { lastError = error; }
    if (attempt < maxRetries) await new Promise((r) => setTimeout(r, 100 * attempt));
  }
  throw lastError;
}

console.log("--- Delayed Responses & Retry ---");
console.log("delay(2000) — simulate slow API. delay('infinite') — simulate hang.");
console.log("Stateful handlers: track callCount, fail first N, then succeed.");
console.log("");

// ============================================================
// EXAMPLE 10 — MSW for Browser vs Node
// Story: MSW works in BOTH Node (unit tests) and browser (integration).
//   Same handlers, different runtime — share handler files.
// ============================================================

// Node (unit tests):   import { setupServer } from 'msw/node';
// Browser (dev/test):  import { setupWorker } from 'msw/browser';
// Shared handlers:     import { handlers } from './mocks/handlers';

console.log("--- MSW: Node vs Browser ---");
console.log("Node: setupServer(). Browser: setupWorker(). Same handlers.");
console.log("");

// ============================================================
// EXAMPLE 11 — Practical: Complete Ride Estimation Test Suite
// Story: Complete test file using MSW for all API mocking.
// ============================================================

// describe('Ride Estimation Service', () => {
//   beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
//   afterEach(() => server.resetHandlers());
//   afterAll(() => server.close());
//
//   describe('Happy Path', () => {
//     test('returns estimate for valid route', async () => {
//       const result = await getRideEstimate('Koramangala', 'Airport', 'mini');
//       expect(result.pickup).toBe('Koramangala');
//       expect(result.fare).toBeGreaterThan(0);
//       expect(result.distanceKm).toBeGreaterThan(0);
//     });
//     test('sedan costs more than mini', async () => {
//       const mini = await getRideEstimate('Koramangala', 'Airport', 'mini');
//       const sedan = await getRideEstimate('Koramangala', 'Airport', 'sedan');
//       expect(sedan.fare).toBeGreaterThan(mini.fare);
//     });
//   });
//
//   describe('Error Handling', () => {
//     test('geocoding 500', async () => {
//       server.use(http.get(`${BASE_URL}/geocode`, () => new HttpResponse(null, { status: 500 })));
//       await expect(getRideEstimate('A', 'B')).rejects.toThrow('Geocoding failed: 500');
//     });
//     test('auth 401', async () => {
//       server.use(http.post(`${BASE_URL}/fare`, () => new HttpResponse(null, { status: 401 })));
//       await expect(getRideEstimate('A', 'B')).rejects.toThrow('Authentication failed');
//     });
//     test('network error', async () => {
//       server.use(http.get(`${BASE_URL}/geocode`, () => HttpResponse.error()));
//       await expect(getRideEstimate('A', 'B')).rejects.toThrow();
//     });
//   });
//
//   describe('Request Validation', () => {
//     test('sends auth header', async () => {
//       let authHeader;
//       server.use(http.post(`${BASE_URL}/fare`, async ({ request }) => {
//         authHeader = request.headers.get('Authorization');
//         return HttpResponse.json({ fare: 200, surgeFactor: 1.0 });
//       }));
//       await getRideEstimate('A', 'B', 'mini');
//       expect(authHeader).toBe('Bearer test-token-123');
//     });
//   });
// });

console.log("--- Complete MSW Test Suite ---");
console.log("Happy Path → Error Handling → Request Validation");
console.log("");

// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. Never make real API calls in tests. They're slow, flaky, expensive.
//
// 2. Three mocking approaches (lowest to highest fidelity):
//    a) Mock fetch/axios directly — quick but brittle
//    b) Mock the service module — decoupled but less realistic
//    c) MSW (Mock Service Worker) — network-level, most realistic
//
// 3. MSW intercepts at the network level. Your code makes real fetch
//    calls. Catches URL, header, and body bugs code-level mocks miss.
//
// 4. MSW lifecycle: listen() in beforeAll, resetHandlers() in afterEach,
//    close() in afterAll. Prevents test pollution.
//
// 5. server.use() overrides handlers per-test for error scenarios.
//    Override lasts until server.resetHandlers() is called.
//
// 6. Test error scenarios: 500, 404, 401, network errors, timeouts.
//
// 7. Verify request payloads: capture body, headers, URL in the handler.
//
// 8. Use delay() for loading states and timeouts.
//
// 9. MSW works in Node (setupServer) and browser (setupWorker).
//
// 10. For retry logic, use stateful MSW handlers that return different
//     responses on each call.
// ============================================================

console.log("=== File 08 Complete: Testing API Calls ===");
