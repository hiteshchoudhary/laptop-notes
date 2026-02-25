// ============================================================
// FILE 17: CLOSURES — Anonymous Functions That Capture Context
// ============================================================
// WHY THIS MATTERS:
// Closures are anonymous functions that can capture variables
// from their surrounding scope. They power functional patterns
// like map, filter, and fold. They're essential for callbacks,
// event handlers, iterators, and concurrency in Rust. Almost
// every real Rust program uses closures extensively.
// ============================================================

// ============================================================
// STORY: Ola Surge Pricing Algorithm
// ============================================================
// Picture the Ola ride-hailing app during a Mumbai monsoon.
// The base fare is fixed, but the surge multiplier changes
// based on current demand in an area. Each ride pricing
// closure "captures" the current demand_multiplier from its
// environment — it doesn't need it as a parameter; it just
// grabs it from the surrounding context.
//
// When demand spikes near Andheri station at 6 PM, the closure
// captures a 2.5x multiplier. When it's calm in Powai at
// 2 AM, the same closure logic captures a 1.0x multiplier.
// The function body is the same, but the captured context
// changes everything.
// ============================================================

use std::fmt;

// ============================================================
// 1. CLOSURE SYNTAX — The Basics
// ============================================================
// WHY: Closures use |args| body syntax. They're more concise
// than fn definitions and can capture from their environment.

fn demonstrate_basic_syntax() {
    println!("--- 1. Closure Syntax ---");

    // Full explicit syntax (rare — usually you let Rust infer)
    let add = |x: i32, y: i32| -> i32 { x + y };

    // Type inference — Rust figures out the types
    let multiply = |x, y| x * y;

    // Single expression — no braces needed
    let double = |x: i32| x * 2;

    // No parameters
    let greet = || println!("  Namaste from Ola!");

    // Multi-line closure
    let calculate_fare = |distance_km: f64, surge: f64| {
        let base_fare = 50.0;
        let per_km = 12.0;
        let fare = base_fare + (per_km * distance_km);
        fare * surge
    };

    println!("  add(3, 4) = {}", add(3, 4));
    // Output: add(3, 4) = 7

    println!("  multiply(5, 6) = {}", multiply(5, 6));
    // Output: multiply(5, 6) = 30

    println!("  double(21) = {}", double(21));
    // Output: double(21) = 42

    greet();
    // Output: Namaste from Ola!

    println!("  Fare (10km, 1.5x surge): Rs.{:.0}", calculate_fare(10.0, 1.5));
    // Output: Fare (10km, 1.5x surge): Rs.255

    // WHY: Once Rust infers a closure's type from the first call,
    // that type is fixed. You can't call it with different types.
    let identity = |x| x;
    let _s = identity(5);       // Rust infers i32
    // let _f = identity(5.0);  // ERROR: expected i32, found f64
    println!("  identity(5) = {}", _s);
    // Output: identity(5) = 5
}

// ============================================================
// 2. CAPTURING VARIABLES — The Power of Closures
// ============================================================
// WHY: Closures can use variables from their enclosing scope.
// This is what makes them different from regular functions.
// They capture by reference, mutable reference, or ownership.

fn demonstrate_capturing() {
    println!("\n--- 2. Capturing Variables ---");

    // Capture by immutable reference (Fn)
    let city = String::from("Mumbai");
    let surge_multiplier = 2.0;

    let display_surge = || {
        // WHY: Borrows `city` and `surge_multiplier` immutably.
        // Can be called multiple times. Doesn't modify anything.
        println!("  Surge in {}: {}x", city, surge_multiplier);
    };

    display_surge();
    display_surge(); // Can call multiple times
    // Output: Surge in Mumbai: 2.0x
    // Output: Surge in Mumbai: 2.0x

    // city is still usable because it was only borrowed
    println!("  City still available: {}", city);
    // Output: City still available: Mumbai

    // Capture by mutable reference (FnMut)
    let mut ride_count = 0;
    let mut count_ride = || {
        // WHY: Borrows `ride_count` mutably. Needs `mut` on
        // both the closure variable and the captured variable.
        ride_count += 1;
        println!("  Ride #{} booked", ride_count);
    };

    count_ride();
    count_ride();
    count_ride();
    // Output: Ride #1 booked
    // Output: Ride #2 booked
    // Output: Ride #3 booked

    // After the closure is done being used, we can access ride_count again
    // (the mutable borrow ends when count_ride is no longer used)
    println!("  Total rides: {}", ride_count);
    // Output: Total rides: 3

    // Capture by ownership (FnOnce / move)
    let promo_code = String::from("MONSOON50");

    let consume_promo = || {
        // WHY: This closure takes ownership of promo_code.
        // After this closure is called, promo_code is gone.
        let used = promo_code; // Moves promo_code into closure
        println!("  Applied promo: {}", used);
    };

    consume_promo();
    // Output: Applied promo: MONSOON50

    // promo_code is no longer available — it was moved into the closure
    // println!("{}", promo_code); // ERROR: value used after move
}

// ============================================================
// 3. Fn, FnMut, FnOnce TRAITS — The Three Closure Types
// ============================================================
// WHY: Rust categorizes closures by how they capture:
// - Fn:     borrows immutably (can call many times)
// - FnMut:  borrows mutably (can call many times, may change state)
// - FnOnce: takes ownership (can call only once)
//
// Every Fn is also FnMut, and every FnMut is also FnOnce.
// Fn <: FnMut <: FnOnce (subtype relationship)

fn call_fn(f: &dyn Fn()) {
    // WHY: &dyn Fn() accepts any closure that borrows immutably
    f();
    f(); // Can call multiple times
}

fn call_fn_mut(f: &mut dyn FnMut()) {
    // WHY: &mut dyn FnMut() accepts closures that may mutate
    f();
    f();
}

fn call_fn_once(f: impl FnOnce() -> String) -> String {
    // WHY: FnOnce consumes the closure — can only call once
    f() // Can only call once
}

fn demonstrate_closure_traits() {
    println!("\n--- 3. Fn / FnMut / FnOnce Traits ---");

    // Fn — immutable capture
    let zone = "Andheri";
    let show_zone = || println!("  Zone: {}", zone);
    call_fn(&show_zone);
    // Output: Zone: Andheri
    // Output: Zone: Andheri

    // FnMut — mutable capture
    let mut total_fare = 0.0;
    let mut add_fare = || {
        total_fare += 150.0;
        println!("  Running total: Rs.{:.0}", total_fare);
    };
    call_fn_mut(&mut add_fare);
    // Output: Running total: Rs.150
    // Output: Running total: Rs.300

    // FnOnce — ownership capture
    let voucher = String::from("FIRSTRIDE");
    let use_voucher = || {
        format!("Voucher '{}' redeemed!", voucher)
    };
    let result = call_fn_once(use_voucher);
    println!("  {}", result);
    // Output: Voucher 'FIRSTRIDE' redeemed!
}

// ============================================================
// 4. MOVE KEYWORD — Forcing Ownership Transfer
// ============================================================
// WHY: By default, closures capture by the least restrictive
// mode possible. `move` forces ownership transfer. This is
// essential for threads (closures sent to threads need to own
// their data) and for returning closures from functions.

fn demonstrate_move_closures() {
    println!("\n--- 4. Move Closures ---");

    // Without move — captures by reference
    let rider_name = String::from("Amit");
    let greet_ref = || println!("  Hello, {}!", rider_name);
    greet_ref();
    println!("  Name still here: {}", rider_name); // Still accessible
    // Output: Hello, Amit!
    // Output: Name still here: Amit

    // With move — forces ownership transfer
    let driver_name = String::from("Rajesh");
    let greet_move = move || println!("  Driver: {}", driver_name);
    greet_move();
    // Output: Driver: Rajesh

    // driver_name is no longer available
    // println!("{}", driver_name); // ERROR: value used after move

    // WHY move is essential for threads:
    // Threads might outlive the current function, so they MUST
    // own their data. We'll see this in the concurrency chapter.

    // Move with Copy types — copies the value, original still works
    let surge = 1.5_f64;
    let calc = move || surge * 100.0;
    println!("  Calc result: {}", calc());
    println!("  Surge still available: {}", surge); // f64 is Copy
    // Output: Calc result: 150
    // Output: Surge still available: 1.5

    // Move with partial capture
    let rider = (String::from("Priya"), 25);
    let show = move || {
        println!("  Rider: {}, age {}", rider.0, rider.1);
    };
    show();
    // Output: Rider: Priya, age 25
    // rider is moved — can't use it anymore
}

// ============================================================
// 5. CLOSURES AS FUNCTION PARAMETERS
// ============================================================
// WHY: Passing closures to functions enables the strategy
// pattern, callbacks, and functional programming patterns.

// Using impl Trait (most common, monomorphized, fast)
fn apply_surge(base_fare: f64, strategy: impl Fn(f64) -> f64) -> f64 {
    strategy(base_fare)
}

// Using generic with trait bound (equivalent to above)
fn apply_discount<F>(fare: f64, discount_fn: F) -> f64
where
    F: Fn(f64) -> f64,
{
    discount_fn(fare)
}

// Using dyn Trait (dynamic dispatch, for heterogeneous collections)
fn apply_all_transforms(fare: f64, transforms: &[&dyn Fn(f64) -> f64]) -> f64 {
    let mut result = fare;
    for transform in transforms {
        result = transform(result);
    }
    result
}

// FnMut parameter
fn repeat_action<F: FnMut(usize)>(times: usize, mut action: F) {
    for i in 0..times {
        action(i);
    }
}

fn demonstrate_closures_as_params() {
    println!("\n--- 5. Closures as Function Parameters ---");

    let base = 200.0;

    // Different surge strategies as closures
    let peak_surge = |fare: f64| fare * 2.5;
    let rain_surge = |fare: f64| fare * 1.8;
    let no_surge = |fare: f64| fare;

    println!("  Peak surge: Rs.{:.0}", apply_surge(base, peak_surge));
    // Output: Peak surge: Rs.500

    println!("  Rain surge: Rs.{:.0}", apply_surge(base, rain_surge));
    // Output: Rain surge: Rs.360

    println!("  No surge: Rs.{:.0}", apply_surge(base, no_surge));
    // Output: No surge: Rs.200

    // Discount function
    let member_discount = |fare: f64| fare * 0.9; // 10% off
    println!(
        "  After discount: Rs.{:.0}",
        apply_discount(500.0, member_discount)
    );
    // Output: After discount: Rs.450

    // Chaining transforms
    let add_gst = |fare: f64| fare * 1.18;
    let add_tip = |fare: f64| fare + 20.0;
    let round_up = |fare: f64| (fare / 10.0).ceil() * 10.0;

    let transforms: Vec<&dyn Fn(f64) -> f64> = vec![&add_gst, &add_tip, &round_up];
    let final_fare = apply_all_transforms(200.0, &transforms);
    println!("  After GST + tip + rounding: Rs.{:.0}", final_fare);
    // Output: After GST + tip + rounding: Rs.260

    // FnMut parameter
    let mut log = Vec::new();
    repeat_action(3, |i| {
        log.push(format!("Ride {} dispatched", i + 1));
    });
    println!("  Log: {:?}", log);
    // Output: Log: ["Ride 1 dispatched", "Ride 2 dispatched", "Ride 3 dispatched"]
}

// ============================================================
// 6. RETURNING CLOSURES FROM FUNCTIONS
// ============================================================
// WHY: Returning closures lets you create "closure factories"
// — functions that generate customized functions. Like creating
// a surge pricing closure for a specific city.

// Must use impl Fn or Box<dyn Fn> to return closures
// WHY: Closures have anonymous types — you can't name them directly

fn make_surge_calculator(multiplier: f64) -> impl Fn(f64) -> f64 {
    // WHY: `move` is essential here! The closure must own
    // `multiplier` because the function's scope ends.
    move |base_fare| base_fare * multiplier
}

fn make_zone_pricer(zone: String, base_rate: f64) -> Box<dyn Fn(f64) -> f64> {
    // WHY: Box<dyn Fn> is needed when returning different closures
    // from match arms (they have different concrete types)
    println!("  Creating pricer for zone: {}", zone);
    Box::new(move |distance| {
        let _zone_ref = &zone; // Capture zone
        base_rate * distance
    })
}

// Returning different closures based on conditions
fn get_pricing_strategy(time_of_day: u32) -> Box<dyn Fn(f64) -> f64> {
    match time_of_day {
        6..=9 | 17..=20 => {
            // Peak hours
            Box::new(|fare| fare * 2.0)
        }
        22..=23 | 0..=5 => {
            // Night charges
            Box::new(|fare| fare * 1.5)
        }
        _ => {
            // Normal
            Box::new(|fare| fare)
        }
    }
}

fn demonstrate_returning_closures() {
    println!("\n--- 6. Returning Closures ---");

    // Closure factory
    let mumbai_surge = make_surge_calculator(2.5);
    let delhi_surge = make_surge_calculator(1.8);

    println!("  Mumbai Rs.100 ride: Rs.{:.0}", mumbai_surge(100.0));
    // Output: Mumbai Rs.100 ride: Rs.250

    println!("  Delhi Rs.100 ride: Rs.{:.0}", delhi_surge(100.0));
    // Output: Delhi Rs.100 ride: Rs.180

    // Zone pricer
    let andheri_pricer = make_zone_pricer(String::from("Andheri"), 15.0);
    println!("  Andheri 5km ride: Rs.{:.0}", andheri_pricer(5.0));
    // Output: Creating pricer for zone: Andheri
    //         Andheri 5km ride: Rs.75

    // Time-based pricing
    let morning_rush = get_pricing_strategy(8); // Peak
    let afternoon = get_pricing_strategy(14);    // Normal
    let night = get_pricing_strategy(23);        // Night

    println!("  8 AM (Rs.100): Rs.{:.0}", morning_rush(100.0));
    // Output: 8 AM (Rs.100): Rs.200

    println!("  2 PM (Rs.100): Rs.{:.0}", afternoon(100.0));
    // Output: 2 PM (Rs.100): Rs.100

    println!("  11 PM (Rs.100): Rs.{:.0}", night(100.0));
    // Output: 11 PM (Rs.100): Rs.150
}

// ============================================================
// 7. CLOSURES WITH map, filter, AND OTHER ITERATORS
// ============================================================
// WHY: This is where closures truly shine in Rust. Iterator
// methods take closures to transform, filter, and reduce data.

fn demonstrate_iterator_closures() {
    println!("\n--- 7. Closures with Iterators ---");

    // map — transform each element
    let fares = vec![120.0, 250.0, 80.0, 340.0, 190.0];
    let with_gst: Vec<f64> = fares.iter().map(|fare| fare * 1.18).collect();
    println!("  Original fares: {:?}", fares);
    println!("  With GST (18%): {:?}", with_gst);
    // Output: Original fares: [120.0, 250.0, 80.0, 340.0, 190.0]
    // Output: With GST (18%): [141.6, 295.0, 94.4, 401.2, 224.2]

    // filter — keep elements matching a condition
    let premium_rides: Vec<&f64> = fares.iter().filter(|fare| **fare > 200.0).collect();
    println!("  Premium rides (>200): {:?}", premium_rides);
    // Output: Premium rides (>200): [250.0, 340.0]

    // map + filter chain
    let discounted_premium: Vec<f64> = fares
        .iter()
        .filter(|fare| **fare > 150.0)
        .map(|fare| fare * 0.9) // 10% discount on premium
        .collect();
    println!("  Discounted premium: {:?}", discounted_premium);
    // Output: Discounted premium: [225.0, 306.0, 171.0]

    // fold — accumulate into a single value
    let total: f64 = fares.iter().fold(0.0, |acc, fare| acc + fare);
    println!("  Total fares: Rs.{:.0}", total);
    // Output: Total fares: Rs.980

    // enumerate — get index + value
    println!("  Ride log:");
    fares.iter().enumerate().for_each(|(i, fare)| {
        println!("    Ride {}: Rs.{:.0}", i + 1, fare);
    });
    // Output:
    //   Ride log:
    //     Ride 1: Rs.120
    //     Ride 2: Rs.250
    //     Ride 3: Rs.80
    //     Ride 4: Rs.340
    //     Ride 5: Rs.190

    // find — first element matching condition
    let first_expensive = fares.iter().find(|fare| **fare > 300.0);
    println!("  First ride >300: {:?}", first_expensive);
    // Output: First ride >300: Some(340.0)

    // any / all — boolean checks
    let has_free_ride = fares.iter().any(|fare| *fare == 0.0);
    let all_positive = fares.iter().all(|fare| *fare > 0.0);
    println!("  Any free rides? {}", has_free_ride);
    println!("  All positive fares? {}", all_positive);
    // Output: Any free rides? false
    // Output: All positive fares? true
}

// ============================================================
// 8. PRACTICAL PATTERNS
// ============================================================

// Pattern 1: Configurable validator using closures
struct RideValidator {
    validators: Vec<Box<dyn Fn(&Ride) -> Result<(), String>>>,
}

struct Ride {
    distance_km: f64,
    fare: f64,
    zone: String,
}

impl fmt::Display for Ride {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(
            f,
            "Ride({}, Rs.{:.0}, {})",
            self.distance_km, self.fare, self.zone
        )
    }
}

impl RideValidator {
    fn new() -> Self {
        RideValidator {
            validators: Vec::new(),
        }
    }

    fn add_rule(&mut self, rule: impl Fn(&Ride) -> Result<(), String> + 'static) {
        self.validators.push(Box::new(rule));
    }

    fn validate(&self, ride: &Ride) -> Vec<String> {
        self.validators
            .iter()
            .filter_map(|validator| validator(ride).err())
            .collect()
    }
}

// Pattern 2: Closure-based builder pattern
struct FareCalculator {
    steps: Vec<Box<dyn Fn(f64) -> f64>>,
}

impl FareCalculator {
    fn new() -> Self {
        FareCalculator { steps: Vec::new() }
    }

    fn add_step(mut self, step: impl Fn(f64) -> f64 + 'static) -> Self {
        self.steps.push(Box::new(step));
        self
    }

    fn calculate(&self, base: f64) -> f64 {
        self.steps.iter().fold(base, |fare, step| step(fare))
    }
}

fn demonstrate_practical_patterns() {
    println!("\n--- 8. Practical Patterns ---");

    // Pattern 1: Ride Validator
    let mut validator = RideValidator::new();

    validator.add_rule(|ride| {
        if ride.distance_km > 0.0 {
            Ok(())
        } else {
            Err(String::from("Distance must be positive"))
        }
    });

    validator.add_rule(|ride| {
        if ride.fare >= 30.0 {
            Ok(())
        } else {
            Err(String::from("Minimum fare is Rs.30"))
        }
    });

    validator.add_rule(|ride| {
        let max_per_km = 50.0;
        if ride.fare / ride.distance_km <= max_per_km {
            Ok(())
        } else {
            Err(format!("Fare exceeds Rs.{} per km", max_per_km))
        }
    });

    let good_ride = Ride {
        distance_km: 5.0,
        fare: 150.0,
        zone: String::from("Andheri"),
    };

    let bad_ride = Ride {
        distance_km: 1.0,
        fare: 20.0,
        zone: String::from("Bandra"),
    };

    let overpriced = Ride {
        distance_km: 2.0,
        fare: 500.0,
        zone: String::from("Juhu"),
    };

    println!("  Validating {}:", good_ride);
    let errors = validator.validate(&good_ride);
    if errors.is_empty() {
        println!("    VALID");
    }
    // Output: Validating Ride(5, Rs.150, Andheri):
    //           VALID

    println!("  Validating {}:", bad_ride);
    for error in validator.validate(&bad_ride) {
        println!("    ERROR: {}", error);
    }
    // Output: Validating Ride(1, Rs.20, Bandra):
    //           ERROR: Minimum fare is Rs.30

    println!("  Validating {}:", overpriced);
    for error in validator.validate(&overpriced) {
        println!("    ERROR: {}", error);
    }
    // Output: Validating Ride(2, Rs.500, Juhu):
    //           ERROR: Fare exceeds Rs.50 per km

    // Pattern 2: Fare Calculator Builder
    let calculator = FareCalculator::new()
        .add_step(|fare| fare * 1.5)   // surge 1.5x
        .add_step(|fare| fare + 25.0)  // booking fee
        .add_step(|fare| fare * 1.18)  // GST
        .add_step(|fare| (fare * 100.0).round() / 100.0); // round to 2 decimal

    let final_fare = calculator.calculate(200.0);
    println!("  Builder fare (200 base): Rs.{:.2}", final_fare);
    // Output: Builder fare (200 base): Rs.383.50
}

// ============================================================
// 9. CLOSURE PERFORMANCE — Zero-Cost Abstraction
// ============================================================

fn demonstrate_performance() {
    println!("\n--- 9. Closure Performance ---");

    // WHY: Closures in Rust are zero-cost abstractions.
    // When using impl Fn (static dispatch), the compiler
    // monomorphizes the closure — it's as fast as inline code.

    // Static dispatch (fast — compiler generates specialized code)
    fn apply_static(x: i32, f: impl Fn(i32) -> i32) -> i32 {
        f(x)
    }

    // Dynamic dispatch (small overhead — uses vtable)
    fn apply_dynamic(x: i32, f: &dyn Fn(i32) -> i32) -> i32 {
        f(x)
    }

    let result1 = apply_static(10, |x| x * 2);
    let closure = |x: i32| x * 2;
    let result2 = apply_dynamic(10, &closure);

    println!("  Static dispatch: {}", result1);
    println!("  Dynamic dispatch: {}", result2);
    // Output: Static dispatch: 20
    // Output: Dynamic dispatch: 20

    // Both produce the same result, but static dispatch is faster
    // because the compiler can inline the closure.

    // WHY: Use impl Fn when you can (most cases).
    // Use dyn Fn when you need heterogeneous collections or
    // when you need to return different closures from match arms.

    println!("  impl Fn = static dispatch = zero cost (prefer this)");
    println!("  dyn Fn = dynamic dispatch = small vtable overhead");
}

// ============================================================
// MAIN — Putting It All Together
// ============================================================
fn main() {
    println!("=== RUST CLOSURES: Ola Surge Pricing ===\n");

    demonstrate_basic_syntax();
    demonstrate_capturing();
    demonstrate_closure_traits();
    demonstrate_move_closures();
    demonstrate_closures_as_params();
    demonstrate_returning_closures();
    demonstrate_iterator_closures();
    demonstrate_practical_patterns();
    demonstrate_performance();

    // ============================================================
    // KEY TAKEAWAYS
    // ============================================================
    println!("\n=== KEY TAKEAWAYS ===");
    println!("1. Closure syntax: |args| body (pipes, not parentheses)");
    println!("2. Closures capture variables from their environment");
    println!("3. Three capture modes: by ref (Fn), mut ref (FnMut), ownership (FnOnce)");
    println!("4. `move` forces ownership transfer (essential for threads)");
    println!("5. Pass closures with impl Fn (static) or dyn Fn (dynamic)");
    println!("6. Return closures with impl Fn or Box<dyn Fn>");
    println!("7. Closures power iterators: map, filter, fold, etc.");
    println!("8. Fn is a subtrait of FnMut, FnMut is a subtrait of FnOnce");
    println!("9. Static dispatch (impl Fn) is zero-cost — prefer it");
    println!("10. Closures enable strategy pattern, validators, builders");
}
