// ============================================================
// FILE 12: INTEGRATION TESTING
// Topic: Testing multiple units working together as a system
// WHY: Unit tests verify individual functions in isolation, but real
//   bugs often hide in the CONNECTIONS between components. Integration
//   tests catch timing issues, data format mismatches, and ordering
//   problems that only appear when components interact.
// ============================================================

// ============================================================
// EXAMPLE 1 — BookMyShow: When Unit Tests Pass But the System Breaks
// Story: BookMyShow's booking flow touches user auth, seat availability,
//   payment gateway, and email service. Every unit test passed. But in
//   production, the seat lock expired (2 min) before payment completed
//   (3+ min during peak load). Integration tests that ran the FULL
//   pipeline would have caught this timing bug immediately.
// ============================================================

// WHY: Unit tests = testing instruments separately.
// Integration tests = the rehearsal where they play together.

// --- Unit vs Integration: The Core Difference ---
console.log("--- Unit vs Integration ---");
console.log("Unit:        Test ONE function, mock everything else");
console.log("Integration: Test MULTIPLE functions working together");
console.log("E2E:         Test the entire app as a real user\n");

// --- What to Integration Test ---
console.log("What to integration test:");
console.log("  1. API endpoints (request -> middleware -> handler -> response)");
console.log("  2. Database operations (CRUD with real database)");
console.log("  3. Service interactions (service A calls service B)");
console.log("  4. Middleware chains (auth -> rate-limit -> handler -> error)\n");


// ============================================================
// EXAMPLE 2 — Testing Express API Endpoints with Supertest
// Story: BookMyShow uses supertest to test every endpoint. They test
//   the FULL request cycle: HTTP request, authentication middleware,
//   route handler, database query, and response. No mocking internals.
// ============================================================

// WHY: supertest makes real HTTP requests to your Express app WITHOUT
// starting a server. It tests the entire middleware chain.

// --- How supertest works ---
// const request = require('supertest');
// const app = require('./app');
//
// describe('BookMyShow API', () => {
//   test('GET /api/shows without token returns 401', async () => {
//     const response = await request(app).get('/api/shows');
//     expect(response.status).toBe(401);
//     expect(response.body.error).toBe('No token provided');
//   });
//
//   test('GET /api/shows with token returns shows', async () => {
//     const response = await request(app)
//       .get('/api/shows')
//       .set('Authorization', 'Bearer valid-token');
//     expect(response.status).toBe(200);
//     expect(response.body.shows).toHaveLength(2);
//     expect(response.body.shows[0]).toHaveProperty('movie');
//   });
//
//   test('POST /api/bookings creates a booking', async () => {
//     const response = await request(app)
//       .post('/api/bookings')
//       .set('Authorization', 'Bearer valid-token')
//       .send({ showId: 1, seatNumber: 'A12' });
//     expect(response.status).toBe(201);
//     expect(response.body.booking.status).toBe('confirmed');
//   });
// });

// Simulating API tests for educational purposes
function simulateAPI(method, path, token, body) {
  if (!token && path.startsWith('/api')) {
    return { status: 401, body: { error: 'No token provided' } };
  }
  if (method === 'GET' && path === '/api/shows') {
    return { status: 200, body: { shows: [
      { id: 1, movie: 'Jawan', theater: 'PVR Phoenix' },
      { id: 2, movie: 'Pathaan', theater: 'INOX Nariman Point' }
    ]}};
  }
  if (method === 'POST' && path === '/api/bookings') {
    if (!body.showId || !body.seatNumber) {
      return { status: 400, body: { error: 'showId and seatNumber required' } };
    }
    return { status: 201, body: { booking: { id: 'BMS-' + Date.now(), ...body, status: 'confirmed' } } };
  }
}

console.log("--- Supertest API Integration Tests ---");

const t1 = simulateAPI('GET', '/api/shows', null, {});
console.log("Test 1 — No auth token:", t1.status === 401 ? 'PASS' : 'FAIL');
console.log("  Status:", t1.status, "Error:", t1.body.error);

const t2 = simulateAPI('GET', '/api/shows', 'token', {});
console.log("\nTest 2 — Authenticated shows list:", t2.status === 200 ? 'PASS' : 'FAIL');
console.log("  Shows:", t2.body.shows.length, "movies returned");

const t3 = simulateAPI('POST', '/api/bookings', 'token', { showId: 1 });
console.log("\nTest 3 — Missing seatNumber:", t3.status === 400 ? 'PASS' : 'FAIL');
console.log("  Error:", t3.body.error);

const t4 = simulateAPI('POST', '/api/bookings', 'token', { showId: 1, seatNumber: 'A12' });
console.log("\nTest 4 — Successful booking:", t4.status === 201 ? 'PASS' : 'FAIL');
console.log("  Booking status:", t4.body.booking.status);

// --- Key supertest patterns ---
// request(app).get(url)                    — GET request
// request(app).post(url).send(body)        — POST with JSON body
// .set('Authorization', 'Bearer token')    — Set headers
// .expect(200)                             — Assert status code
// .expect('Content-Type', /json/)          — Assert headers


// ============================================================
// EXAMPLE 3 — Database Integration Tests
// Story: BookMyShow uses a real test database (SQLite in-memory).
//   They catch a critical bug: a missing UNIQUE constraint that
//   allows double-booking of the same seat.
// ============================================================

// WHY: Mocking the database tells you nothing about whether your
// SQL queries work, indexes are used, or constraints are enforced.

// --- SQLite in-memory setup ---
// const Database = require('better-sqlite3');
// let db;
// beforeAll(() => {
//   db = new Database(':memory:');
//   db.exec(`
//     CREATE TABLE shows (id INTEGER PRIMARY KEY, movie TEXT, total_seats INTEGER DEFAULT 100);
//     CREATE TABLE bookings (
//       id INTEGER PRIMARY KEY AUTOINCREMENT,
//       show_id INTEGER REFERENCES shows(id),
//       seat_number TEXT NOT NULL,
//       user_id INTEGER NOT NULL,
//       UNIQUE(show_id, seat_number)   -- prevent double booking!
//     );
//   `);
//   db.prepare('INSERT INTO shows VALUES (?, ?, ?)').run(1, 'Jawan', 100);
// });
// afterAll(() => db.close());
// afterEach(() => db.exec('DELETE FROM bookings'));

class InMemoryDB {
  constructor() { this.shows = []; this.bookings = []; }

  addShow(show) { this.shows.push(show); }

  createBooking(showId, userId, seatNumber) {
    const show = this.shows.find(s => s.id === showId);
    if (!show) throw new Error('FOREIGN KEY: Show does not exist');
    const dup = this.bookings.find(b => b.showId === showId && b.seatNumber === seatNumber);
    if (dup) throw new Error('UNIQUE constraint: Seat already booked');
    const booking = { id: this.bookings.length + 1, showId, userId, seatNumber, status: 'confirmed' };
    this.bookings.push(booking);
    return booking;
  }

  getAvailableSeats(showId) {
    const show = this.shows.find(s => s.id === showId);
    const booked = this.bookings.filter(b => b.showId === showId).length;
    return show.totalSeats - booked;
  }

  clear() { this.bookings = []; }
}

const db = new InMemoryDB();
db.addShow({ id: 1, movie: 'Jawan', totalSeats: 100 });

console.log("\n--- Database Integration Tests ---");
console.log("Create booking:", db.createBooking(1, 101, 'A12'));

try { db.createBooking(1, 102, 'A12'); }
catch (e) { console.log("Double booking prevented:", e.message); }

try { db.createBooking(999, 103, 'B1'); }
catch (e) { console.log("Foreign key enforced:", e.message); }

db.createBooking(1, 104, 'A2');
db.createBooking(1, 105, 'A3');
console.log("Available seats:", db.getAvailableSeats(1), "(expected 97)");

// --- Database test best practices ---
// 1. Use beforeAll to create tables and seed reference data
// 2. Use afterEach to clean up test-specific data (DELETE FROM bookings)
// 3. Use afterAll to close the database connection
// 4. Each test should create its OWN data — never depend on another test
// 5. Use transactions + ROLLBACK for fastest cleanup:
//    beforeEach: BEGIN TRANSACTION
//    afterEach:  ROLLBACK (undoes all changes instantly)


// ============================================================
// EXAMPLE 4 — Testing Service-to-Service Interactions
// Story: BookMyShow's booking service calls payment internally.
//   Rule: mock EXTERNAL services (Razorpay API), let INTERNAL
//   services (SeatService, UserService) talk to each other for real.
// ============================================================

// WHY: Mock only what you don't control. Let your own services
// interact naturally to catch real integration bugs.

class SeatService {
  constructor(db) { this.db = db; }
  lockSeat(showId, seatNumber) {
    const existing = this.db.bookings.find(b => b.showId === showId && b.seatNumber === seatNumber);
    if (existing) return { locked: false, reason: 'Seat already taken' };
    return { locked: true, showId, seatNumber, expiresAt: Date.now() + 120000 };
  }
}

class BookingService {
  constructor(seatService, paymentGateway) {
    this.seatService = seatService;
    this.paymentGateway = paymentGateway;
  }

  async createBooking(showId, seatNumber, userId, paymentDetails) {
    const lock = this.seatService.lockSeat(showId, seatNumber);
    if (!lock.locked) return { success: false, error: lock.reason };

    const payment = await this.paymentGateway.charge(paymentDetails);
    if (!payment.success) return { success: false, error: 'Payment failed: ' + payment.error };

    return { success: true, booking: { showId, seatNumber, userId, paymentId: payment.transactionId } };
  }
}

// Mock ONLY the external payment gateway
const mockPayment = {
  async charge(details) {
    if (details.amount <= 0) return { success: false, error: 'Invalid amount' };
    return { success: true, transactionId: 'PAY_' + Date.now(), amount: details.amount };
  }
};

const integrationDb = new InMemoryDB();
integrationDb.addShow({ id: 1, movie: 'Jawan', totalSeats: 100 });
const seatService = new SeatService(integrationDb);
const bookingService = new BookingService(seatService, mockPayment);

(async () => {
  console.log("\n--- Service Integration Tests ---");
  const good = await bookingService.createBooking(1, 'C7', 101, { amount: 350 });
  console.log("Booking:", good.success ? 'PASS' : 'FAIL', good);

  // Same seat again — should fail at seat lock
  const dup = await bookingService.createBooking(1, 'C7', 102, { amount: 350 });
  console.log("Duplicate seat:", !dup.success ? 'PASS' : 'FAIL', dup);

  // Bad payment
  const bad = await bookingService.createBooking(1, 'D1', 103, { amount: -100 });
  console.log("Bad payment:", !bad.success ? 'PASS' : 'FAIL', bad);
})();


// ============================================================
// EXAMPLE 5 — Testing Middleware Chains
// Story: BookMyShow's API chain: auth -> rate-limit -> validation ->
//   handler -> error-handler. Integration tests verify the full chain.
// ============================================================

// WHY: Middleware order matters. Auth MUST run before the handler.
// A missing next() call is invisible in unit tests.

function runMiddlewareChain(middlewares, req) {
  let response = null;
  const res = {
    status(code) { this._code = code; return this; },
    json(data) { response = { status: this._code || 200, ...data }; }
  };
  let i = 0;
  function next() { if (i < middlewares.length) middlewares[i++](req, res, next); }
  next();
  return response || { status: 200, message: 'OK' };
}

const chain = [
  (req, res, next) => {   // Auth
    if (!req.headers.authorization) { res.status(401).json({ error: 'No token' }); return; }
    req.userId = 'user1'; next();
  },
  (req, res, next) => {   // Validation
    if (!req.body.showId) { res.status(400).json({ error: 'showId required' }); return; }
    next();
  },
  (req, res, next) => {   // Handler
    res.status(200).json({ message: 'Booking confirmed', user: req.userId });
  }
];

console.log("\n--- Middleware Chain Tests ---");
console.log("No auth:", runMiddlewareChain(chain, { headers: {}, body: {} }));
console.log("No body:", runMiddlewareChain(chain, { headers: { authorization: 'Bearer x' }, body: {} }));
console.log("Valid:", runMiddlewareChain(chain, { headers: { authorization: 'Bearer x' }, body: { showId: 1 } }));


// ============================================================
// EXAMPLE 6 — Integration Test Patterns
// Story: BookMyShow QA identifies four critical patterns that
//   catch 90% of integration bugs: happy path, partial failure,
//   concurrency, and timeout handling.
// ============================================================

console.log("\n--- Integration Test Patterns ---");
console.log("1. HAPPY PATH: Full flow succeeds end-to-end");
console.log("   Test: Create user -> List shows -> Book seat -> Verify booking");
console.log("2. PARTIAL FAILURE: One step fails, verify cleanup/rollback");
console.log("   Test: Seat locked -> Payment fails -> Verify seat unlocked");
console.log("3. CONCURRENCY: Two users booking same seat simultaneously");
console.log("   Test: User A and B both try seat A12 -> one succeeds, one fails");
console.log("4. TIMEOUT: Downstream service is slow");
console.log("   Test: Payment takes 30s -> Booking fails gracefully\n");


// ============================================================
// EXAMPLE 7 — Test Isolation Strategies
// Story: BookMyShow's tests failed randomly because one test left
//   data that broke another. Three strategies fixed this.
// ============================================================

console.log("--- Test Isolation Strategies ---");
console.log("1. SEPARATE DATABASE: Use dedicated test DB, never share with dev/prod");
console.log("2. TRANSACTION ROLLBACK: Wrap each test in BEGIN/ROLLBACK — no leftover data");
console.log("3. UNIQUE IDS: Prefix test data with unique run ID, clean up after\n");

// --- Docker for test dependencies ---
// --- Docker for test dependencies ---
// docker-compose.test.yml:
// services:
//   postgres:
//     image: postgres:16
//     environment:
//       POSTGRES_DB: bookmyshow_test
//       POSTGRES_USER: test
//       POSTGRES_PASSWORD: test
//     ports: ['5433:5432']
//   redis:
//     image: redis:7
//     ports: ['6380:6379']

console.log("--- Docker for Integration Tests ---");
console.log("docker-compose.test.yml spins up PostgreSQL, Redis, etc.");
console.log("Run:     docker-compose -f docker-compose.test.yml up --abort-on-container-exit");
console.log("Cleanup: docker-compose -f docker-compose.test.yml down -v");
console.log("All isolated, all disposable, all reproducible.\n");


// ============================================================
// EXAMPLE 8 — Practical: Full Booking API Integration Test
// Story: Complete integration test: create user, list shows, book
//   seat, verify booking, check duplicate rejection.
// ============================================================

class BookingAPI {
  constructor() { this.users = new Map(); this.shows = new Map(); this.bookings = new Map(); }

  createUser(name, email) {
    const id = 'user_' + (this.users.size + 1);
    const user = { id, name, email, verified: true };
    this.users.set(id, user);
    return { status: 201, body: user };
  }

  listShows(city) {
    const shows = Array.from(this.shows.values()).filter(s => !city || s.city === city);
    return { status: 200, body: { shows, count: shows.length } };
  }

  createBooking(userId, showId, seatId) {
    if (!this.users.has(userId)) return { status: 404, body: { error: 'User not found' } };
    if (!this.shows.has(showId)) return { status: 404, body: { error: 'Show not found' } };
    const taken = Array.from(this.bookings.values()).find(b => b.showId === showId && b.seatId === seatId);
    if (taken) return { status: 409, body: { error: 'Seat already booked' } };
    const bookingId = 'BK_' + (this.bookings.size + 1);
    const booking = { id: bookingId, userId, showId, seatId, status: 'confirmed' };
    this.bookings.set(bookingId, booking);
    return { status: 201, body: booking };
  }

  seedShows() {
    [{ id: 'show_1', title: 'Pushpa 2', city: 'Mumbai', seats: ['A1','A2','A3','B1','B2'] },
     { id: 'show_2', title: 'Jawan', city: 'Delhi', seats: ['A1','A2','A3'] }]
    .forEach(s => this.shows.set(s.id, s));
  }
}

console.log("--- Full Booking API Integration Test ---");
const api = new BookingAPI();
api.seedShows();

const user = api.createUser('Arjun Kapoor', 'arjun@test.com');
console.log("1. Create user:", user.status === 201 ? 'PASS' : 'FAIL');

const shows = api.listShows('Mumbai');
console.log("2. List Mumbai shows:", shows.body.count === 1 ? 'PASS' : 'FAIL');

const booking = api.createBooking(user.body.id, 'show_1', 'A1');
console.log("3. Book seat A1:", booking.status === 201 ? 'PASS' : 'FAIL');

const duplicate = api.createBooking(user.body.id, 'show_1', 'A1');
console.log("4. Duplicate blocked:", duplicate.status === 409 ? 'PASS' : 'FAIL');

const badShow = api.createBooking(user.body.id, 'show_999', 'A1');
console.log("5. Bad show:", badShow.status === 404 ? 'PASS' : 'FAIL');

const second = api.createBooking(user.body.id, 'show_1', 'B2');
console.log("6. Book seat B2:", second.status === 201 ? 'PASS' : 'FAIL');

console.log("\nThis test catches:");
console.log("  - Auth middleware bugs (user creation/verification)");
console.log("  - Database constraint violations (UNIQUE on seat)");
console.log("  - Foreign key integrity (show must exist)");
console.log("  - API response format correctness");
console.log("  - Business logic (seat availability tracking)");

// --- Running integration tests separately ---
// Integration tests are SLOWER than unit tests.
// Run them as a separate npm script:
//   "test:unit": "jest --testPathPattern=src/",
//   "test:integration": "jest --testPathPattern=tests/integration/",
//   "test:all": "jest"
//
// In CI, run unit tests first (fast feedback),
// then integration tests only if unit tests pass:
//   jobs:
//     unit:  ...
//     integration:
//       needs: unit    # Only runs after unit tests pass


// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. Integration tests verify MULTIPLE units working together.
//    They catch bugs that live in the gaps between components.
// 2. Use supertest to test Express/Fastify APIs without a server.
// 3. Use a REAL test database (SQLite in-memory or dedicated DB).
// 4. Mock EXTERNAL services (payment gateways), let INTERNAL
//    services communicate for real.
// 5. Four critical patterns: happy path, partial failure,
//    concurrency, and timeout handling.
// 6. Isolate tests with: separate DB, transaction rollback,
//    or unique IDs per run. No test should depend on another.
// 7. Integration tests are slower — run them separately and
//    focus on critical paths, not exhaustive coverage.
// ============================================================
