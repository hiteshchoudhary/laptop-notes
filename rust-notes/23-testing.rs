// ============================================================
// 23. TESTING IN RUST
// ============================================================
// WHY THIS MATTERS:
// Testing is not optional in professional software development.
// Rust has a built-in, first-class testing framework — no external
// libraries needed for basic testing. The compiler and cargo work
// together to make writing and running tests effortless. Every
// serious Rust project uses tests, and Rust's type system means
// your tests can focus on logic rather than type-related bugs.
// ============================================================

// ============================================================
// STORY: MARUTI SUZUKI QUALITY CHECK LINE
// ============================================================
// Imagine the Maruti Suzuki factory in Manesar, Haryana.
//
// Every car that rolls off the assembly line goes through a
// rigorous quality inspection before it reaches the showroom:
//
// 1. UNIT CHECKS: Each component is tested individually.
//    Does the engine start? Do the brakes work? Does the AC cool?
//    -> These are like UNIT TESTS — testing one function at a time.
//
// 2. INTEGRATION CHECKS: Components are tested together.
//    Does the engine work with the transmission? Do the electronics
//    integrate with the dashboard?
//    -> These are like INTEGRATION TESTS — testing modules together.
//
// 3. EXPECTED FAILURES: Some tests verify that safety systems
//    activate correctly. The airbag SHOULD deploy on impact.
//    The engine SHOULD shut off if oil pressure drops to zero.
//    -> These are like #[should_panic] tests — verifying correct failure.
//
// 4. SKIPPED CHECKS: Some tests are skipped during daily builds
//    and only run during final certification (e.g., crash tests).
//    -> These are like #[ignore] tests — expensive tests run on demand.
//
// 5. QUALITY REPORTS: After all checks, a report shows which
//    tests passed, failed, or were skipped.
//    -> This is like `cargo test` output.
//
// Let's build our own quality check system for Rust code!
// ============================================================

// ============================================================
// 1. BASIC UNIT TESTS WITH #[test]
// ============================================================
// WHY: Unit tests verify that individual functions work correctly.
// In Rust, test functions are marked with #[test] and live
// alongside the code they test (or in a dedicated test module).

/// Calculates the on-road price of a Maruti car
/// including GST (28%) and registration
fn calculate_on_road_price(ex_showroom: f64, registration: f64) -> f64 {
    let gst = ex_showroom * 0.28;
    ex_showroom + gst + registration
}

/// Checks if a car model is available for immediate delivery
fn is_available(model: &str) -> bool {
    let available_models = vec!["Swift", "Baleno", "Brezza", "Ertiga", "Fronx"];
    available_models.contains(&model)
}

/// Calculates EMI for a car loan
fn calculate_emi(principal: f64, annual_rate: f64, months: u32) -> f64 {
    let monthly_rate = annual_rate / 12.0 / 100.0;
    let factor = (1.0 + monthly_rate).powi(months as i32);
    (principal * monthly_rate * factor) / (factor - 1.0)
}

/// Grades the engine performance based on mileage
fn performance_grade(kmpl: f64) -> &'static str {
    match kmpl as u32 {
        0..=10 => "Poor",
        11..=15 => "Average",
        16..=20 => "Good",
        21..=25 => "Excellent",
        _ => "Outstanding",
    }
}

/// Validates a vehicle registration number (simplified)
fn validate_registration(reg: &str) -> Result<String, String> {
    if reg.len() < 9 || reg.len() > 13 {
        return Err(String::from("Invalid registration length"));
    }
    if !reg.starts_with("MH") && !reg.starts_with("DL") && !reg.starts_with("KA") {
        return Err(format!("Unknown state code in {}", reg));
    }
    Ok(format!("Valid: {}", reg))
}

/// Divides total distance by fuel consumed to get mileage
fn calculate_mileage(distance_km: f64, fuel_litres: f64) -> f64 {
    if fuel_litres == 0.0 {
        panic!("Cannot calculate mileage: fuel consumed is zero!");
    }
    distance_km / fuel_litres
}

// ============================================================
// 2. THE TEST MODULE WITH #[cfg(test)]
// ============================================================
// WHY: The #[cfg(test)] attribute tells the compiler to only
// compile this module when running tests. This means test code
// is NEVER included in your production binary — zero overhead.
// It's like having a separate quality lab that only operates
// during inspection, not during regular production.

#[cfg(test)]
mod tests {
    // WHY: `use super::*` brings everything from the parent module
    // into scope. This is how tests access the functions they test.
    // Tests CAN access private functions — this is intentional in Rust!
    use super::*;

    // --------------------------------------------------------
    // 3. assert! MACRO — BASIC BOOLEAN ASSERTION
    // --------------------------------------------------------
    // WHY: assert! checks that a condition is true. If false,
    // the test panics and fails. It's the simplest assertion.

    #[test]
    fn test_swift_is_available() {
        // assert! takes a boolean expression
        assert!(is_available("Swift"));
        // If Swift were not in the list, this test would FAIL
    }

    #[test]
    fn test_unknown_model_not_available() {
        // Use ! to negate — assert that the condition is FALSE
        assert!(!is_available("Creta")); // Creta is Hyundai, not Maruti!
    }

    // --------------------------------------------------------
    // 4. assert_eq! AND assert_ne! — VALUE COMPARISON
    // --------------------------------------------------------
    // WHY: assert_eq! checks two values are equal. When it fails,
    // it prints BOTH values, making debugging much easier than
    // a plain assert!. assert_ne! checks values are NOT equal.

    #[test]
    fn test_on_road_price_calculation() {
        let price = calculate_on_road_price(800_000.0, 50_000.0);
        // 800000 + (800000 * 0.28) + 50000 = 800000 + 224000 + 50000 = 1074000
        assert_eq!(price, 1_074_000.0);
        // Output on failure:
        // assertion `left == right` failed
        //   left: 1074000.0
        //   right: (whatever wrong value)
    }

    #[test]
    fn test_performance_grades() {
        assert_eq!(performance_grade(8.0), "Poor");
        assert_eq!(performance_grade(14.0), "Average");
        assert_eq!(performance_grade(19.0), "Good");
        assert_eq!(performance_grade(23.0), "Excellent");
        assert_eq!(performance_grade(28.0), "Outstanding");
    }

    #[test]
    fn test_grades_are_distinct() {
        // assert_ne! ensures two values are NOT equal
        assert_ne!(performance_grade(8.0), performance_grade(23.0));
        // WHY: Useful when you want to verify that different inputs
        // produce different outputs
    }

    // --------------------------------------------------------
    // 5. CUSTOM FAILURE MESSAGES
    // --------------------------------------------------------
    // WHY: When a test fails, a good error message saves debugging
    // time. All assert macros accept an optional format string
    // as additional arguments.

    #[test]
    fn test_emi_calculation() {
        let emi = calculate_emi(700_000.0, 8.5, 60);
        // EMI should be approximately 14,369 for these parameters
        let expected_approx = 14_369.0;
        let tolerance = 1.0;

        assert!(
            (emi - expected_approx).abs() < tolerance,
            "EMI calculation wrong! Expected ~{}, got {}. \
             Parameters: principal=700000, rate=8.5%, months=60",
            expected_approx, emi
        );
        // WHY: The custom message tells you exactly what went wrong
        // and what the inputs were. Much better than "assertion failed"!
    }

    #[test]
    fn test_mileage_calculation() {
        let mileage = calculate_mileage(450.0, 25.0);
        assert_eq!(
            mileage, 18.0,
            "Mileage should be 450/25 = 18.0 kmpl, but got {}",
            mileage
        );
    }

    // --------------------------------------------------------
    // 6. TESTING FOR PANICS WITH #[should_panic]
    // --------------------------------------------------------
    // WHY: Sometimes the CORRECT behavior is to panic. Like an
    // airbag deployment test — the test PASSES when the airbag
    // fires (panics). #[should_panic] marks tests that should panic.

    #[test]
    #[should_panic]
    fn test_zero_fuel_panics() {
        // This should panic because fuel is 0
        calculate_mileage(100.0, 0.0);
        // WHY: Without #[should_panic], this test would FAIL because
        // it panics. With it, the panic is the EXPECTED outcome.
    }

    #[test]
    #[should_panic(expected = "fuel consumed is zero")]
    fn test_zero_fuel_panic_message() {
        // WHY: You can specify the expected panic message to ensure
        // the function panics for the RIGHT reason, not just any panic.
        calculate_mileage(200.0, 0.0);
        // This checks that the panic message CONTAINS the expected string
    }

    // --------------------------------------------------------
    // 7. TESTING WITH Result<T, E>
    // --------------------------------------------------------
    // WHY: Instead of panicking on failure, tests can return
    // Result<(), String>. This lets you use the ? operator,
    // making tests that deal with Results much cleaner.

    #[test]
    fn test_valid_registration() -> Result<(), String> {
        let result = validate_registration("MH12AB1234")?;
        // WHY: The ? operator propagates the error, causing the test
        // to fail with the error message. No need for unwrap()!
        assert_eq!(result, "Valid: MH12AB1234");
        Ok(())
    }

    #[test]
    fn test_invalid_registration_length() {
        let result = validate_registration("MH");
        assert!(result.is_err());
        assert_eq!(
            result.unwrap_err(),
            "Invalid registration length"
        );
    }

    #[test]
    fn test_unknown_state_code() {
        let result = validate_registration("XX12AB1234");
        assert!(result.is_err());
        let err_msg = result.unwrap_err();
        assert!(
            err_msg.contains("Unknown state code"),
            "Error message should mention unknown state code, got: {}",
            err_msg
        );
    }

    // --------------------------------------------------------
    // 8. IGNORING TESTS WITH #[ignore]
    // --------------------------------------------------------
    // WHY: Some tests are slow (integration tests, network calls)
    // or require special setup. #[ignore] skips them during normal
    // `cargo test` but you can run them explicitly with
    // `cargo test -- --ignored` or `cargo test -- --include-ignored`.

    #[test]
    #[ignore]
    fn test_full_crash_simulation() {
        // WHY: This simulates an expensive test that takes too long
        // for regular development cycles. Like a crash test at Maruti —
        // you don't do it for every car, only for certification.
        let iterations = 1_000_000;
        let mut total = 0.0;
        for i in 1..=iterations {
            total += calculate_emi(500_000.0 + i as f64, 9.0, 48);
        }
        assert!(total > 0.0, "Total EMI sum should be positive");
    }

    #[test]
    #[ignore = "Requires database connection"]
    fn test_dealership_inventory_sync() {
        // WHY: You can add a reason string to #[ignore] to explain
        // why the test is skipped. This shows up in test output.
        // In a real app, this would connect to a database.
        assert!(true, "Would test DB sync if DB were available");
    }

    // --------------------------------------------------------
    // 9. TESTING PRIVATE FUNCTIONS
    // --------------------------------------------------------
    // WHY: Unlike many languages, Rust allows tests to access
    // private functions! Since the test module is a CHILD of the
    // module being tested, it inherits access to private items.
    // This is intentional — Rust trusts you to test internals.

    // All our functions above (calculate_on_road_price, is_available, etc.)
    // are actually private (no `pub` keyword). Yet our tests can call them!
    // This is because the `tests` module is inside the same module.

    #[test]
    fn test_private_function_access() {
        // calculate_on_road_price is private, but we can test it!
        let price = calculate_on_road_price(500_000.0, 30_000.0);
        assert!(price > 500_000.0, "On-road price should be more than ex-showroom");
    }

    // --------------------------------------------------------
    // 10. MULTIPLE ASSERTIONS IN ONE TEST
    // --------------------------------------------------------
    // WHY: You can have multiple assertions. The test fails at
    // the FIRST failed assertion — remaining assertions don't run.
    // Balance between testing one thing per test and grouping
    // related checks together.

    #[test]
    fn test_all_available_models() {
        // Testing multiple related conditions in one test
        let models = vec!["Swift", "Baleno", "Brezza", "Ertiga", "Fronx"];
        for model in &models {
            assert!(
                is_available(model),
                "{} should be available but isn't!",
                model
            );
        }
    }

    #[test]
    fn test_unavailable_competitors() {
        let competitor_models = vec!["Creta", "Seltos", "Thar", "Hector"];
        for model in &competitor_models {
            assert!(
                !is_available(model),
                "{} is a competitor model and should NOT be available!",
                model
            );
        }
    }

    // --------------------------------------------------------
    // 11. TESTING WITH SETUP (COMMON TEST DATA)
    // --------------------------------------------------------
    // WHY: When multiple tests need the same setup data, create
    // helper functions. Rust doesn't have setUp/tearDown like
    // JUnit, but functions work just as well.

    fn sample_car_data() -> Vec<(&'static str, f64, f64)> {
        // (model, ex_showroom, registration)
        vec![
            ("Swift", 600_000.0, 40_000.0),
            ("Baleno", 700_000.0, 45_000.0),
            ("Brezza", 850_000.0, 55_000.0),
            ("Ertiga", 900_000.0, 60_000.0),
        ]
    }

    #[test]
    fn test_all_prices_positive() {
        for (model, ex_showroom, registration) in sample_car_data() {
            let price = calculate_on_road_price(ex_showroom, registration);
            assert!(
                price > 0.0,
                "Price for {} should be positive, got {}",
                model, price
            );
        }
    }

    #[test]
    fn test_on_road_always_more_than_ex_showroom() {
        for (model, ex_showroom, registration) in sample_car_data() {
            let on_road = calculate_on_road_price(ex_showroom, registration);
            assert!(
                on_road > ex_showroom,
                "On-road price for {} ({}) should exceed ex-showroom ({})",
                model, on_road, ex_showroom
            );
        }
    }
}

// ============================================================
// 12. RUNNING TESTS — CARGO TEST COMMANDS
// ============================================================
// WHY: Knowing how to run specific tests saves time during
// development. You don't always need to run all 500 tests!

// Run all tests:
//   cargo test
//
// Run tests matching a name pattern:
//   cargo test test_emi          # Runs all tests containing "test_emi"
//   cargo test test_valid        # Runs tests matching "test_valid"
//
// Run ignored tests:
//   cargo test -- --ignored      # Run ONLY ignored tests
//   cargo test -- --include-ignored  # Run ALL tests including ignored
//
// Run tests in a specific module:
//   cargo test tests::test_swift  # Module::test_name pattern
//
// Show output (println!) from passing tests:
//   cargo test -- --show-output   # By default, output from passing tests is hidden
//
// Run tests with a single thread (useful for tests that share state):
//   cargo test -- --test-threads=1
//
// List all tests without running them:
//   cargo test -- --list

// ============================================================
// 13. INTEGRATION TESTS (FILE STRUCTURE)
// ============================================================
// WHY: Integration tests live in a separate `tests/` directory
// and test your library's PUBLIC API. They are like the final
// road test at Maruti — testing the whole car, not individual parts.

// Project structure for integration tests:
//   my_project/
//   +-- Cargo.toml
//   +-- src/
//   |   +-- lib.rs          # Your library code
//   +-- tests/
//       +-- integration_test.rs    # Each file is a separate test crate
//       +-- another_test.rs
//       +-- common/
//           +-- mod.rs       # Shared test utilities
//
// In tests/integration_test.rs:
//   use my_project;  // Import your crate like an external user would
//
//   #[test]
//   fn test_public_api() {
//       let result = my_project::public_function();
//       assert_eq!(result, expected_value);
//   }
//
// WHY integration tests are separate:
// - They can only access PUBLIC items (like a real user)
// - Each file in tests/ is compiled as a SEPARATE crate
// - They verify that your public API works correctly
// - They catch issues that unit tests might miss

// ============================================================
// 14. TEST ORGANIZATION BEST PRACTICES
// ============================================================
// WHY: Good test organization makes tests maintainable and
// helps you find and fix issues quickly.

// In comments, as these are conventions, not runnable code:
//
// NAMING CONVENTION:
//   fn test_<function_name>_<scenario>_<expected_result>()
//   Examples:
//     test_calculate_emi_valid_inputs_returns_positive()
//     test_validate_registration_empty_string_returns_error()
//     test_mileage_zero_fuel_panics()
//
// STRUCTURE (Arrange-Act-Assert):
//   #[test]
//   fn test_something() {
//       // Arrange: Set up test data
//       let input = prepare_data();
//
//       // Act: Call the function being tested
//       let result = function_under_test(input);
//
//       // Assert: Verify the result
//       assert_eq!(result, expected);
//   }
//
// WHEN TO USE WHICH TEST TYPE:
//   Unit tests (#[cfg(test)] mod tests):
//     - Test individual functions
//     - Test edge cases and error paths
//     - Test private implementation details
//     - Fast, run frequently
//
//   Integration tests (tests/ directory):
//     - Test public API
//     - Test how modules work together
//     - Test realistic use cases
//     - Slower, run before releases

fn main() {
    println!("=== Rust Testing Demo ===\n");
    println!("This file is designed to be tested with `cargo test`.");
    println!("The main() function demonstrates the functions that are tested.\n");

    // Demonstrate the functions that our tests verify
    println!("--- On-Road Price Calculator ---");
    let swift_price = calculate_on_road_price(600_000.0, 40_000.0);
    println!("Swift on-road price: Rs. {:.0}", swift_price);
    // Output: Swift on-road price: Rs. 808000

    println!("\n--- Model Availability ---");
    println!("Swift available: {}", is_available("Swift"));
    // Output: Swift available: true
    println!("Creta available: {}", is_available("Creta"));
    // Output: Creta available: false

    println!("\n--- EMI Calculator ---");
    let emi = calculate_emi(700_000.0, 8.5, 60);
    println!("EMI for Rs. 7,00,000 at 8.5% for 60 months: Rs. {:.2}", emi);
    // Output: EMI for Rs. 7,00,000 at 8.5% for 60 months: Rs. 14369.09 (approx)

    println!("\n--- Performance Grades ---");
    println!("8 kmpl  -> {}", performance_grade(8.0));
    // Output: 8 kmpl  -> Poor
    println!("14 kmpl -> {}", performance_grade(14.0));
    // Output: 14 kmpl -> Average
    println!("19 kmpl -> {}", performance_grade(19.0));
    // Output: 19 kmpl -> Good
    println!("23 kmpl -> {}", performance_grade(23.0));
    // Output: 23 kmpl -> Excellent

    println!("\n--- Registration Validation ---");
    match validate_registration("MH12AB1234") {
        Ok(msg) => println!("{}", msg),
        Err(e) => println!("Error: {}", e),
    }
    // Output: Valid: MH12AB1234

    match validate_registration("XX99ZZ0000") {
        Ok(msg) => println!("{}", msg),
        Err(e) => println!("Error: {}", e),
    }
    // Output: Error: Unknown state code in XX99ZZ0000

    println!("\n--- Mileage Calculator ---");
    println!("450 km on 25L: {:.1} kmpl", calculate_mileage(450.0, 25.0));
    // Output: 450 km on 25L: 18.0 kmpl

    println!("\n--- Running Tests ---");
    println!("To run all tests:           cargo test");
    println!("To run specific test:        cargo test test_emi");
    println!("To run ignored tests:        cargo test -- --ignored");
    println!("To see println output:       cargo test -- --show-output");
    println!("To list all tests:           cargo test -- --list");

    println!("\n=== Testing Demo Complete ===");
}

// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. Mark test functions with #[test]. They live in a
//    #[cfg(test)] module that's only compiled during testing.
//
// 2. assert!(condition) — test passes if condition is true.
//    assert_eq!(a, b) — test passes if a == b (shows both on failure).
//    assert_ne!(a, b) — test passes if a != b.
//
// 3. All assert macros accept optional format strings for
//    custom error messages: assert!(cond, "msg {}", value).
//
// 4. #[should_panic] marks tests that SHOULD panic.
//    Use #[should_panic(expected = "msg")] to check the panic message.
//
// 5. #[ignore] skips expensive tests. Run them explicitly with
//    `cargo test -- --ignored`.
//
// 6. Tests can return Result<(), E>, enabling the ? operator
//    for cleaner error-handling test code.
//
// 7. Rust tests CAN access private functions (unlike Java/C#).
//    The test module is a child module with access to parent's privates.
//
// 8. Unit tests go in #[cfg(test)] mod tests {} inside your source.
//    Integration tests go in a separate tests/ directory.
//
// 9. Use `cargo test <pattern>` to run specific tests.
//    Use `-- --show-output` to see println! from passing tests.
//
// 10. Think of testing like Maruti Suzuki's quality line:
//     unit tests = component checks, integration tests = road tests,
//     should_panic = safety system activation tests,
//     ignored = crash tests (expensive, run only when needed).
// ============================================================
