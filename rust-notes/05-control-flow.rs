// ============================================================
//  FILE 5 : Control Flow
// ============================================================
//  Topic  : if/else, loop, while, for, break with value,
//           continue, labels, nested loops, ranges
//
//  WHY THIS MATTERS:
//  Control flow directs your program's execution path. Rust's
//  loops and conditionals are EXPRESSIONS — they return values.
//  `loop` with `break value` is unique to Rust and incredibly
//  useful for retry logic and search patterns.
// ============================================================

// ============================================================
// STORY: Mumbai Auto-Rickshaw Meter
//
// Imagine a Mumbai auto-rickshaw ride:
// - if/else: "Meter se jaoge ya fixed?" (By meter or fixed?)
// - loop: The meter keeps ticking until you say "Ruko bhaiya!"
// - while: Drive while the CNG tank has gas
// - for: Visit each stop on the route, one by one
// - break with value: "Kitna hua?" — the meter stops and
//   returns the final fare
//
// The rickshaw doesn't stop randomly — it follows the route
// (control flow), checks conditions (traffic lights), and
// the meter (loop) gives a final reading (break with value).
// ============================================================

fn main() {
    // ──────────────────────────────────────────────────────────
    // SECTION 1 — if/else: Traffic Light Decisions
    // ──────────────────────────────────────────────────────────
    // WHY: if/else is an EXPRESSION in Rust — it returns a
    // value. Conditions must be bool (no truthy/falsy).

    let traffic_signal = "red";

    if traffic_signal == "green" {
        println!("Auto: Chalo bhaiya!");
    } else if traffic_signal == "yellow" {
        println!("Auto: Dhire dhire...");
    } else {
        println!("Auto: Ruko, signal hai.");
    }
    // Output: Auto: Ruko, signal hai.

    // if as expression (like ternary in other languages)
    let fare_type = "meter";
    let base_fare = if fare_type == "meter" { 23 } else { 50 };
    println!("Base fare: ₹{}", base_fare);
    // Output: Base fare: ₹23

    // Both branches must return same type
    // let x = if true { 5 } else { "hello" };  // ERROR: mismatched types

    // No truthy/falsy — must be explicit bool
    let passengers = 3;
    // if passengers { ... }  // ERROR: expected bool, found i32
    if passengers > 0 {
        println!("Passengers: {}", passengers);
    }
    // Output: Passengers: 3

    // Nested if-else (but prefer match for complex logic)
    let hour = 14;
    let shift = if hour < 6 {
        "Night"
    } else if hour < 12 {
        "Morning"
    } else if hour < 18 {
        "Afternoon"
    } else {
        "Evening"
    };
    println!("Shift: {}", shift);
    // Output: Shift: Afternoon

    // let-if pattern (if let — preview, full coverage in enums)
    let maybe_tip: Option<u32> = Some(20);
    if let Some(tip) = maybe_tip {
        println!("Tip received: ₹{}", tip);
    }
    // Output: Tip received: ₹20

    // ──────────────────────────────────────────────────────────
    // SECTION 2 — loop: The Running Meter
    // ──────────────────────────────────────────────────────────
    // WHY: `loop` runs forever until `break`. Unlike while(true),
    // Rust's loop can RETURN a value via `break value`.

    // Basic loop with break
    let mut meter = 0;
    loop {
        meter += 1;
        if meter >= 5 {
            println!("Meter stopped at: ₹{}", meter * 14);
            break;
        }
    }
    // Output: Meter stopped at: ₹70

    // Loop returning a value — unique to Rust!
    let mut distance = 0;
    let final_fare = loop {
        distance += 1;
        if distance >= 10 {
            break distance * 14 + 23; // break WITH value
        }
    };
    println!("Final fare for {}km: ₹{}", distance, final_fare);
    // Output: Final fare for 10km: ₹163

    // This is powerful for retry logic:
    let mut attempts = 0;
    let connection = loop {
        attempts += 1;
        if attempts == 3 {
            break "Connected!";
        }
        println!("Attempt {}... retrying", attempts);
    };
    println!("{} (after {} attempts)", connection, attempts);
    // Output:
    // Attempt 1... retrying
    // Attempt 2... retrying
    // Connected! (after 3 attempts)

    // ──────────────────────────────────────────────────────────
    // SECTION 3 — while: Drive While There's CNG
    // ──────────────────────────────────────────────────────────
    // WHY: while loops check a condition before each iteration.
    // Use when you don't know how many iterations upfront.

    let mut cng_level = 5;
    while cng_level > 0 {
        println!("CNG level: {} bars — driving...", cng_level);
        cng_level -= 1;
    }
    println!("CNG empty! Time to refuel.");
    // Output:
    // CNG level: 5 bars — driving...
    // CNG level: 4 bars — driving...
    // CNG level: 3 bars — driving...
    // CNG level: 2 bars — driving...
    // CNG level: 1 bars — driving...
    // CNG empty! Time to refuel.

    // while with complex condition
    let mut speed = 0;
    let mut in_traffic = true;
    while speed < 40 && in_traffic {
        speed += 10;
        if speed >= 30 {
            in_traffic = false;
        }
        println!("Speed: {} km/h", speed);
    }
    // Output:
    // Speed: 10 km/h
    // Speed: 20 km/h
    // Speed: 30 km/h

    // while let — great with iterators and Option
    let mut stops = vec!["Andheri", "Bandra", "Dadar"];
    while let Some(stop) = stops.pop() {
        println!("Crossed: {}", stop);
    }
    // Output:
    // Crossed: Dadar
    // Crossed: Bandra
    // Crossed: Andheri

    // ──────────────────────────────────────────────────────────
    // SECTION 4 — for: Following the Route
    // ──────────────────────────────────────────────────────────
    // WHY: for loops are the most common in Rust. They work
    // with iterators and ranges — safe, fast, and idiomatic.

    // Range (exclusive end)
    println!("\n--- Route stops ---");
    for km in 1..6 {
        println!("Km {}: ₹{}", km, km * 14 + 23);
    }
    // Output:
    // Km 1: ₹37
    // Km 2: ₹51
    // Km 3: ₹65
    // Km 4: ₹79
    // Km 5: ₹93

    // Inclusive range
    for stop in 1..=3 {
        println!("Stop {} of 3", stop);
    }
    // Output:
    // Stop 1 of 3
    // Stop 2 of 3
    // Stop 3 of 3

    // Iterating over array
    let landmarks = ["Gateway of India", "Marine Drive", "CST Station"];
    for place in &landmarks {
        println!("Passing: {}", place);
    }
    // Output:
    // Passing: Gateway of India
    // Passing: Marine Drive
    // Passing: CST Station

    // enumerate — index + value
    for (i, place) in landmarks.iter().enumerate() {
        println!("  {}. {}", i + 1, place);
    }
    // Output:
    //   1. Gateway of India
    //   2. Marine Drive
    //   3. CST Station

    // Iterating over string characters
    let route = "Mumbai";
    for ch in route.chars() {
        print!("{} ", ch);
    }
    println!();
    // Output: M u m b a i

    // rev — reverse iteration
    print!("Countdown: ");
    for n in (1..=5).rev() {
        print!("{} ", n);
    }
    println!("Go!");
    // Output: Countdown: 5 4 3 2 1 Go!

    // step_by — custom step size
    print!("Every 5km: ");
    for km in (0..=20).step_by(5) {
        print!("{} ", km);
    }
    println!();
    // Output: Every 5km: 0 5 10 15 20

    // zip — parallel iteration
    let stops = ["Andheri", "Bandra", "Dadar"];
    let times = [10, 18, 25];
    for (stop, time) in stops.iter().zip(times.iter()) {
        println!("{}: {} min", stop, time);
    }
    // Output:
    // Andheri: 10 min
    // Bandra: 18 min
    // Dadar: 25 min

    // ──────────────────────────────────────────────────────────
    // SECTION 5 — break & continue: Traffic Signals
    // ──────────────────────────────────────────────────────────
    // WHY: break exits the loop; continue skips to the next
    // iteration. Both work in loop, while, and for.

    // continue — skip certain stops
    println!("\n--- Skipping closed stops ---");
    let stops = ["Andheri", "CLOSED", "Bandra", "CLOSED", "Dadar"];
    for stop in &stops {
        if *stop == "CLOSED" {
            continue; // skip this stop
        }
        println!("Stopping at: {}", stop);
    }
    // Output:
    // Stopping at: Andheri
    // Stopping at: Bandra
    // Stopping at: Dadar

    // break — stop early when destination found
    let route = ["Churchgate", "Marine Lines", "Charni Road", "Mumbai Central", "Dadar"];
    let destination = "Charni Road";
    for stop in &route {
        println!("At: {}", stop);
        if *stop == destination {
            println!("Destination reached!");
            break;
        }
    }
    // Output:
    // At: Churchgate
    // At: Marine Lines
    // At: Charni Road
    // Destination reached!

    // ──────────────────────────────────────────────────────────
    // SECTION 6 — Loop Labels: Multi-Lane Traffic
    // ──────────────────────────────────────────────────────────
    // WHY: Labels let you break/continue outer loops from
    // inside nested loops. Prefix with 'label_name.

    println!("\n--- Grid search ---");
    'outer: for row in 0..5 {
        for col in 0..5 {
            if row == 2 && col == 3 {
                println!("Found target at ({}, {})", row, col);
                break 'outer; // breaks the OUTER loop
            }
        }
    }
    // Output: Found target at (2, 3)

    // continue with label
    'routes: for route in 1..=3 {
        for stop in 1..=3 {
            if route == 2 && stop == 2 {
                println!("Route {} stop {} — detour, skipping route", route, stop);
                continue 'routes; // skip to next route
            }
            println!("Route {} Stop {}", route, stop);
        }
    }
    // Output:
    // Route 1 Stop 1
    // Route 1 Stop 2
    // Route 1 Stop 3
    // Route 2 Stop 1
    // Route 2 stop 2 — detour, skipping route
    // Route 3 Stop 1
    // Route 3 Stop 2
    // Route 3 Stop 3

    // loop with label returning value
    let mut x = 0;
    let result = 'search: loop {
        x += 1;
        if x * x > 100 {
            break 'search x; // return x from labeled loop
        }
    };
    println!("First x where x² > 100: {}", result);
    // Output: First x where x² > 100: 11

    // ──────────────────────────────────────────────────────────
    // SECTION 7 — Practical Patterns: Real Rickshaw Logic
    // ──────────────────────────────────────────────────────────
    // WHY: Common patterns you'll see in real Rust code.

    // Pattern 1: Find first match
    let fares = [45, 67, 23, 89, 12, 56];
    let mut cheapest = i32::MAX;
    for fare in &fares {
        if *fare < cheapest {
            cheapest = *fare;
        }
    }
    println!("Cheapest fare: ₹{}", cheapest);
    // Output: Cheapest fare: ₹12

    // Idiomatic way using iterator
    let cheapest = fares.iter().min().unwrap();
    println!("Cheapest (idiomatic): ₹{}", cheapest);
    // Output: Cheapest (idiomatic): ₹12

    // Pattern 2: Accumulate with for
    let distances = [3, 7, 2, 5, 8];
    let mut total = 0;
    for d in &distances {
        total += d;
    }
    println!("Total distance: {} km", total);
    // Output: Total distance: 25 km

    // Idiomatic: iterator sum
    let total: i32 = distances.iter().sum();
    println!("Total (idiomatic): {} km", total);
    // Output: Total (idiomatic): 25 km

    // Pattern 3: Input validation loop
    let inputs = ["abc", "", "42"];
    for input in &inputs {
        let result = loop {
            if let Ok(num) = input.parse::<i32>() {
                break Some(num);
            } else {
                break None;
            }
        };
        println!("Parse '{}': {:?}", input, result);
    }
    // Output:
    // Parse 'abc': None
    // Parse '': None
    // Parse '42': Some(42)

    // Pattern 4: Matrix iteration
    println!("\n--- Fare chart ---");
    let classes = ["SL", "3AC", "2AC"];
    let distances = [100, 500, 1000];
    for class in &classes {
        print!("{:>4}:", class);
        for &dist in &distances {
            let rate: f64 = match *class {
                "SL"  => 0.5,
                "3AC" => 1.5,
                "2AC" => 2.0,
                _     => 1.0,
            };
            print!(" ₹{:>6.0}", dist as f64 * rate);
        }
        println!();
    }
    // Output:
    //   SL: ₹    50 ₹   250 ₹   500
    //  3AC: ₹   150 ₹   750 ₹  1500
    //  2AC: ₹   200 ₹  1000 ₹  2000

    // ──────────────────────────────────────────────────────────
    // SECTION 8 — Loop Performance Notes
    // ──────────────────────────────────────────────────────────
    // WHY: Know when to use which loop.
    //
    // for ... in   → most common, safest (iterator-based)
    // loop         → infinite/retry/search with break value
    // while        → condition-based, less common
    // while let    → great with Option/Result unwrapping
    //
    // for is FASTER than manual indexing because:
    // 1. No bounds checking per iteration
    // 2. Compiler can vectorize/unroll
    // 3. Iterator optimizations (chain, zip, etc.)

    // BAD: manual indexing (bounds check every iteration)
    let arr = [1, 2, 3, 4, 5];
    // for i in 0..arr.len() { arr[i] ... }

    // GOOD: iterator (no bounds check needed)
    for val in &arr {
        let _ = val;
    }

    println!("\n--- Auto-rickshaw ride complete! Meter says: ₹163 ---");
}

// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. if/else is an EXPRESSION — use it to assign values
// 2. Conditions must be bool — no truthy/falsy like JS
// 3. loop runs forever; use break to exit, break VALUE to return
// 4. loop + break value is unique to Rust — perfect for retries
// 5. while checks condition before each iteration
// 6. while let is great for draining Option/iterators
// 7. for ... in is the most idiomatic — uses iterators
// 8. 'label: loop/for lets you break/continue outer loops
// 9. for is faster than manual indexing (no bounds checks)
// 10. Rickshaw bhaiya's rule: "Follow the route (for), keep
//     the meter running (loop), stop when the passenger says
//     (break), and always give the final reading (break value)!"
// ============================================================
