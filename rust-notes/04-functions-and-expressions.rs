// ============================================================
//  FILE 4 : Functions & Expressions
// ============================================================
//  Topic  : fn, parameters, return values, expressions vs
//           statements, early return, diverging functions,
//           function pointers, nested functions
//
//  WHY THIS MATTERS:
//  Functions are the building blocks of Rust programs.
//  Understanding the expression-based nature of Rust is key —
//  almost everything is an expression that returns a value,
//  which enables concise, functional-style code.
// ============================================================

// ============================================================
// STORY: IRCTC Ticket Counter Clerks
//
// At the IRCTC reservation office, each clerk (function) has
// a specific job:
// - Clerk 1: Takes your name and class → returns ticket
// - Clerk 2: Calculates fare based on distance
// - Clerk 3: Validates PNR and returns status
//
// Each clerk takes INPUT (parameters), does PROCESSING, and
// gives OUTPUT (return value). Some clerks do work but return
// nothing (unit type) — like the clerk who stamps your form.
//
// The key insight: Rust clerks always "express" their result
// as the LAST expression — no "return" stamp needed.
// ============================================================

fn main() {
    // ──────────────────────────────────────────────────────────
    // SECTION 1 — Basic Functions: Simple Clerks
    // ──────────────────────────────────────────────────────────
    // WHY: Functions organize code into reusable units.
    // fn keyword, snake_case naming, explicit types on params.

    greet_passenger("Ramesh");
    // Output: Namaste, Ramesh! Welcome to IRCTC.

    greet_passenger("Sharma ji");
    // Output: Namaste, Sharma ji! Welcome to IRCTC.

    // ──────────────────────────────────────────────────────────
    // SECTION 2 — Parameters & Return Values: Fare Clerk
    // ──────────────────────────────────────────────────────────
    // WHY: Rust requires explicit type annotations on ALL
    // function parameters and return types (no inference here).

    let fare = calculate_fare(500, "3AC");
    println!("Fare for 500km in 3AC: ₹{:.2}", fare);
    // Output: Fare for 500km in 3AC: ₹750.00

    let fare_sl = calculate_fare(500, "SL");
    println!("Fare for 500km in SL: ₹{:.2}", fare_sl);
    // Output: Fare for 500km in SL: ₹250.00

    // Multiple return values using tuple
    let (base, tax, total) = fare_with_tax(1000, "2AC");
    println!("Base: ₹{}, Tax: ₹{:.2}, Total: ₹{:.2}", base, tax, total);
    // Output: Base: ₹1500, Tax: ₹270.00, Total: ₹1770.00

    // ──────────────────────────────────────────────────────────
    // SECTION 3 — Expressions vs Statements
    // ──────────────────────────────────────────────────────────
    // WHY: This is FUNDAMENTAL to Rust. An expression returns
    // a value; a statement does not.
    //
    // EXPRESSION: evaluates to a value → 5 + 3, if/else, block
    // STATEMENT: performs action, no value → let x = 5;

    // Block expression — the last line (without ;) is returned
    let platform = {
        let train = "Rajdhani";
        let number = 12301;
        format!("{} ({})", train, number) // no semicolon = return value
    };
    println!("Train: {}", platform);
    // Output: Train: Rajdhani (12301)

    // If/else as expression
    let distance = 1200;
    let train_type = if distance > 1000 { "Superfast" } else { "Express" };
    println!("{}km → {}", distance, train_type);
    // Output: 1200km → Superfast

    // CAUTION: Adding ; makes it a statement (returns ())
    // let x = { 5; };  // x is (), not 5!
    let x = { 5 };      // x is 5

    // Statement examples (no value returned):
    // let y = 10;           ← statement
    // fn foo() {}           ← statement
    // let z = (let w = 5);  ← ERROR: let is a statement, not expression

    // Match as expression
    let class = "1AC";
    let berth_count = match class {
        "1AC" => 18,
        "2AC" => 46,
        "3AC" => 64,
        "SL"  => 72,
        _     => 0,
    };
    println!("{} has {} berths", class, berth_count);
    // Output: 1AC has 18 berths

    // ──────────────────────────────────────────────────────────
    // SECTION 4 — Early Return: Express Counter
    // ──────────────────────────────────────────────────────────
    // WHY: Use `return` for early exits. The last expression
    // is the implicit return — explicit `return` is for
    // short-circuiting.

    println!("PNR 1234567890: {}", check_pnr("1234567890"));
    // Output: PNR 1234567890: Confirmed

    println!("PNR 123: {}", check_pnr("123"));
    // Output: PNR 123: Invalid PNR

    println!("Waitlist position: {}", get_waitlist_position(15));
    // Output: Waitlist position: High chance

    // ──────────────────────────────────────────────────────────
    // SECTION 5 — Functions with No Return: Stamp Clerk
    // ──────────────────────────────────────────────────────────
    // WHY: Functions that return nothing actually return ()
    // (unit type). You can omit the return type.

    stamp_ticket("Ramesh", "12301");
    // Output: ✓ Ticket stamped for Ramesh on train 12301

    // Explicit unit return (same as above, just explicit)
    // fn stamp_ticket(name: &str) -> () { ... }

    // ──────────────────────────────────────────────────────────
    // SECTION 6 — Nested Functions: Counter Within Counter
    // ──────────────────────────────────────────────────────────
    // WHY: You can define functions inside other functions.
    // They can't capture variables from outer scope (unlike
    // closures — see File 17).

    fn format_pnr(digits: &str) -> String {
        // Nested helper — only visible inside this scope
        fn add_dashes(s: &str) -> String {
            let chars: Vec<char> = s.chars().collect();
            format!("{}-{}-{}",
                    &s[..3],
                    &s[3..7],
                    &s[7..])
        }
        add_dashes(digits)
    }

    println!("Formatted PNR: {}", format_pnr("1234567890"));
    // Output: Formatted PNR: 123-4567-890

    // ──────────────────────────────────────────────────────────
    // SECTION 7 — Function Pointers: Assigning Clerks
    // ──────────────────────────────────────────────────────────
    // WHY: Functions are first-class — you can store them in
    // variables, pass them to other functions, and return them.

    // Function pointer type: fn(params) -> return_type
    let fare_fn: fn(u32, &str) -> f64 = calculate_fare;
    println!("Via pointer: ₹{}", fare_fn(300, "SL"));
    // Output: Via pointer: ₹150

    // Passing function as parameter
    let prices = [100, 250, 500, 1000];
    let discounted: Vec<f64> = prices.iter()
        .map(|&p| apply_discount(p, senior_discount))
        .collect();
    println!("Senior prices: {:?}", discounted);
    // Output: Senior prices: [60.0, 150.0, 300.0, 600.0]

    let tatkal: Vec<f64> = prices.iter()
        .map(|&p| apply_discount(p, tatkal_surcharge))
        .collect();
    println!("Tatkal prices: {:?}", tatkal);
    // Output: Tatkal prices: [130.0, 325.0, 650.0, 1300.0]

    // ──────────────────────────────────────────────────────────
    // SECTION 8 — Diverging Functions: Emergency Stop
    // ──────────────────────────────────────────────────────────
    // WHY: Some functions never return — they panic, loop
    // forever, or exit. Return type is `!` (never type).

    // panic!("Emergency!") → never returns
    // loop {} → runs forever
    // std::process::exit(1) → terminates program

    // The `!` type can coerce to any type, which is useful:
    let status: &str = if true {
        "Running"
    } else {
        panic!("Should not happen") // ! coerces to &str
    };
    println!("Status: {}", status);
    // Output: Status: Running

    // ──────────────────────────────────────────────────────────
    // SECTION 9 — Practical Patterns: IRCTC System
    // ──────────────────────────────────────────────────────────
    // WHY: Real-world function patterns you'll use constantly.

    // Builder pattern with method chaining
    let receipt = build_receipt("Ramesh", "Delhi", "Mumbai", 1500.0);
    println!("{}", receipt);
    // Output:
    // === IRCTC RECEIPT ===
    // Passenger: Ramesh
    // Route: Delhi → Mumbai
    // Fare: ₹1500.00
    // ====================

    // Guard clauses (early return pattern)
    println!("Can book: {}", can_book_tatkal(9, true));
    // Output: Can book: true
    println!("Can book: {}", can_book_tatkal(11, true));
    // Output: Can book: false

    // ──────────────────────────────────────────────────────────
    // SECTION 10 — const fn: Compile-Time Clerks
    // ──────────────────────────────────────────────────────────
    // WHY: const fn runs at compile time. Result is baked
    // into the binary — zero runtime cost.

    const PLATFORM_COUNT: u32 = count_platforms(8, 4);
    println!("Total platforms: {}", PLATFORM_COUNT);
    // Output: Total platforms: 12

    // const fn can be used for const and static values
    static TOTAL_COACHES: u32 = count_platforms(16, 2);
    println!("Total coaches: {}", TOTAL_COACHES);
    // Output: Total coaches: 18

    println!("\n--- IRCTC counter is now closed. Thank you! ---");
}

// ============================================================
// Function Declarations (outside main)
// ============================================================

/// Greets a passenger at the counter
fn greet_passenger(name: &str) {
    println!("Namaste, {}! Welcome to IRCTC.", name);
}

/// Calculates fare based on distance and class
fn calculate_fare(distance_km: u32, class: &str) -> f64 {
    let rate = match class {
        "1AC" => 3.0,
        "2AC" => 2.0,
        "3AC" => 1.5,
        "SL"  => 0.5,
        _     => 1.0,
    };
    distance_km as f64 * rate
}

/// Returns (base_fare, tax, total) as a tuple
fn fare_with_tax(distance_km: u32, class: &str) -> (f64, f64, f64) {
    let base = calculate_fare(distance_km, class);
    let tax = base * 0.18; // 18% GST
    (base, tax, base + tax)
}

/// Validates PNR and returns status — uses early return
fn check_pnr(pnr: &str) -> &str {
    if pnr.len() != 10 {
        return "Invalid PNR"; // early return
    }

    // In real code, we'd check a database
    "Confirmed" // implicit return (last expression)
}

/// Returns waitlist assessment
fn get_waitlist_position(position: u32) -> &'static str {
    if position <= 5 {
        return "Almost confirmed";
    }
    if position <= 20 {
        return "High chance";
    }
    if position <= 50 {
        return "Moderate chance";
    }
    "Low chance" // implicit return for everything else
}

/// Stamps a ticket — returns nothing (unit type)
fn stamp_ticket(name: &str, train: &str) {
    println!("✓ Ticket stamped for {} on train {}", name, train);
}

/// Discount function type example
fn senior_discount(price: u32) -> f64 {
    price as f64 * 0.6 // 40% off for seniors
}

/// Tatkal surcharge function
fn tatkal_surcharge(price: u32) -> f64 {
    price as f64 * 1.3 // 30% extra for tatkal
}

/// Higher-order function: applies a pricing function
fn apply_discount(price: u32, strategy: fn(u32) -> f64) -> f64 {
    strategy(price)
}

/// Builds a formatted receipt string
fn build_receipt(name: &str, from: &str, to: &str, fare: f64) -> String {
    format!(
        "=== IRCTC RECEIPT ===\nPassenger: {}\nRoute: {} → {}\nFare: ₹{:.2}\n====================",
        name, from, to, fare
    )
}

/// Guard clause pattern for tatkal booking
fn can_book_tatkal(hour: u32, has_id: bool) -> bool {
    if hour < 10 || hour > 12 {
        return false; // tatkal window: 10 AM - 12 PM
    }
    if !has_id {
        return false;
    }
    // Note: adjusted the check - 10 <= hour <= 12
    hour >= 10 && hour <= 12 && has_id
}

/// Compile-time function
const fn count_platforms(main: u32, sub: u32) -> u32 {
    main + sub
}

// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. fn params MUST have type annotations — no inference
// 2. Last expression (no ;) is the implicit return value
// 3. Adding ; turns expression into statement (returns ())
// 4. Expressions: if/else, match, blocks all return values
// 5. Statements: let bindings, fn declarations, ; expressions
// 6. Use `return` only for early exits, not normal returns
// 7. Functions returning nothing return () (unit type)
// 8. Function pointers: fn(T) -> U — first-class values
// 9. const fn runs at compile time — zero runtime cost
// 10. IRCTC clerk rule: "Every clerk (function) must clearly
//     state what they need (params), what they give back
//     (return type), and their last word is their answer
//     (implicit return)."
// ============================================================
