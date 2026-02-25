// ============================================================
// 11 - ERROR HANDLING IN RUST
// ============================================================
// WHY THIS MATTERS:
// Every real application deals with failure: files not found,
// network timeouts, invalid input, out-of-memory. Languages
// handle this with exceptions (Java), error codes (C), or
// pretending errors don't happen (early JavaScript). Rust uses
// the type system: Result<T,E> and Option<T>. The compiler
// FORCES you to handle errors — you can't accidentally ignore
// them. This eliminates an entire class of bugs at compile time.
// ============================================================

// ============================================================
// STORY: The UPI Payment Flow
// ============================================================
// You're paying Rs. 500 at a chai stall via Google Pay (UPI).
// So many things can go wrong:
// - Insufficient balance in your account
// - Bank server is down (timeout)
// - Wrong UPI PIN entered
// - Merchant's VPA (UPI ID) is invalid
// - Network connection lost mid-transaction
//
// Some errors are recoverable (retry with correct PIN), some
// are unrecoverable (your app's state is corrupted — panic!).
//
// Rust models this beautifully:
// - Recoverable errors: Result<T, E> — Ok(success) or Err(error)
// - Unrecoverable errors: panic!() — crash immediately
//
// The ? operator lets errors bubble up elegantly, and custom
// error types let you build rich error hierarchies.
// ============================================================

use std::collections::HashMap;
use std::fmt;
use std::num::ParseIntError;

// ============================================================
// 1. PANIC! — UNRECOVERABLE ERRORS
// ============================================================
// WHY: panic! is for bugs — situations that should NEVER happen
// in correct code. Array out-of-bounds, impossible state, etc.
// It unwinds the stack and crashes the program.

fn demo_panic() {
    println!("=== 1. panic! (Unrecoverable Errors) ===\n");

    // WHY: Sometimes you need to assert invariants.
    let balance = 1000;
    let withdrawal = 500;

    if withdrawal > balance {
        // panic!("Withdrawal exceeds balance!"); // Would crash here
        println!("This would panic if withdrawal > balance");
    } else {
        println!("Withdrawal of Rs. {} approved. Remaining: Rs. {}",
            withdrawal, balance - withdrawal);
    }
    // Output: Withdrawal of Rs. 500 approved. Remaining: Rs. 500

    // WHY: Vec indexing panics on out-of-bounds. Use .get() instead.
    let stations = vec!["Delhi", "Agra", "Jaipur"];
    // stations[5]; // This would panic!

    // WHY: .get() returns Option — safe alternative to indexing.
    match stations.get(5) {
        Some(station) => println!("Station: {}", station),
        None => println!("No station at index 5 (safe with .get())"),
    }
    // Output: No station at index 5 (safe with .get())

    println!("Station 0: {}", stations[0]); // Output: Station 0: Delhi
}

// ============================================================
// 2. RESULT<T, E> — THE CORE OF RUST ERROR HANDLING
// ============================================================
// WHY: Result is an enum: Ok(T) for success, Err(E) for failure.
// Unlike exceptions, you MUST handle the Result. The compiler
// warns if you ignore it.

#[derive(Debug)]
enum UpiError {
    InsufficientBalance { available: f64, required: f64 },
    InvalidPin,
    ServerTimeout,
    InvalidVpa(String),
    NetworkError(String),
}

fn process_upi_payment(
    from: &str,
    to: &str,
    amount: f64,
    pin: &str,
    balance: f64,
) -> Result<String, UpiError> {
    // WHY: Each check returns Err early if something's wrong.
    if pin.len() != 4 || pin.parse::<u32>().is_err() {
        return Err(UpiError::InvalidPin);
    }

    if !to.contains('@') {
        return Err(UpiError::InvalidVpa(String::from(to)));
    }

    if amount > balance {
        return Err(UpiError::InsufficientBalance {
            available: balance,
            required: amount,
        });
    }

    // WHY: Simulate random server issues.
    if amount > 50000.0 {
        return Err(UpiError::ServerTimeout);
    }

    // WHY: Ok wraps the success value.
    Ok(format!("TXN-{}-{}", from.len() * 1000 + to.len(), amount as u64))
}

fn demo_result_basic() {
    println!("\n=== 2. Result<T, E> ===\n");

    // WHY: match on Result to handle both cases.
    let result = process_upi_payment("rahul@okicici", "chai@ybl", 40.0, "1234", 5000.0);
    match result {
        Ok(txn_id) => println!("Payment successful! TXN: {}", txn_id),
        Err(e) => println!("Payment failed: {:?}", e),
    }
    // Output: Payment successful! TXN: TXN-13008-40

    let result = process_upi_payment("rahul@okicici", "invalid_vpa", 100.0, "1234", 5000.0);
    match result {
        Ok(txn_id) => println!("Payment successful! TXN: {}", txn_id),
        Err(UpiError::InvalidVpa(vpa)) => println!("Invalid VPA: {}", vpa),
        Err(e) => println!("Other error: {:?}", e),
    }
    // Output: Invalid VPA: invalid_vpa

    let result = process_upi_payment("rahul@okicici", "shop@ybl", 6000.0, "1234", 2000.0);
    match result {
        Ok(_) => println!("Success"),
        Err(UpiError::InsufficientBalance { available, required }) => {
            println!("Not enough balance! Have: Rs. {:.2}, Need: Rs. {:.2}",
                available, required);
        }
        Err(e) => println!("Error: {:?}", e),
    }
    // Output: Not enough balance! Have: Rs. 2000.00, Need: Rs. 6000.00
}

// ============================================================
// 3. UNWRAP AND EXPECT
// ============================================================
// WHY: unwrap() and expect() extract the Ok/Some value but PANIC
// on Err/None. Use them only when you're CERTAIN of success,
// or in prototypes/tests. In production, prefer match or ?.

fn demo_unwrap_expect() {
    println!("\n=== 3. unwrap() and expect() ===\n");

    // WHY: unwrap() — panics with a generic message on error.
    let good: Result<i32, &str> = Ok(42);
    println!("Unwrapped: {}", good.unwrap());
    // Output: Unwrapped: 42

    // WHY: expect() — panics with YOUR message on error. Preferred over unwrap().
    let parsed: Result<i32, _> = "2024".parse();
    println!("Parsed year: {}", parsed.expect("Failed to parse year"));
    // Output: Parsed year: 2024

    // WHY: unwrap_or provides a default value.
    let bad: Result<i32, &str> = Err("something went wrong");
    println!("With default: {}", bad.unwrap_or(0));
    // Output: With default: 0

    // WHY: unwrap_or_else takes a closure — lazy evaluation.
    let bad2: Result<i32, &str> = Err("error");
    let val = bad2.unwrap_or_else(|e| {
        println!("  Error occurred: {}. Using fallback.", e);
        -1
    });
    // Output:   Error occurred: error. Using fallback.
    println!("Value: {}", val);
    // Output: Value: -1

    // WHY: On Option too.
    let name: Option<&str> = None;
    println!("Name: {}", name.unwrap_or("Anonymous"));
    // Output: Name: Anonymous
}

// ============================================================
// 4. THE ? OPERATOR — ELEGANT ERROR PROPAGATION
// ============================================================
// WHY: The ? operator is Rust's killer feature for errors. It
// unwraps Ok/Some and returns early with Err/None. It replaces
// verbose match blocks with a single character.

#[derive(Debug)]
struct BankAccount {
    holder: String,
    balance: f64,
    upi_id: String,
}

fn validate_amount(amount_str: &str) -> Result<f64, String> {
    // WHY: parse() returns Result. The ? would propagate the error,
    // but we need to convert ParseIntError to String first.
    let amount: f64 = amount_str.parse().map_err(|e: std::num::ParseFloatError| {
        format!("Invalid amount '{}': {}", amount_str, e)
    })?;

    if amount <= 0.0 {
        return Err(format!("Amount must be positive, got {}", amount));
    }
    if amount > 100000.0 {
        return Err(String::from("Amount exceeds per-transaction limit of Rs. 1,00,000"));
    }
    Ok(amount)
}

fn find_account(accounts: &HashMap<String, BankAccount>, upi_id: &str) -> Result<f64, String> {
    // WHY: .ok_or() converts Option to Result — then ? can propagate it.
    let account = accounts
        .get(upi_id)
        .ok_or(format!("UPI ID '{}' not found", upi_id))?;

    Ok(account.balance)
}

fn transfer(
    accounts: &HashMap<String, BankAccount>,
    from_upi: &str,
    to_upi: &str,
    amount_str: &str,
) -> Result<String, String> {
    // WHY: Each ? propagates errors upward. If validate_amount fails,
    // we return immediately with that error. Clean and linear.
    let amount = validate_amount(amount_str)?;
    let from_balance = find_account(accounts, from_upi)?;
    let _to_balance = find_account(accounts, to_upi)?;

    if amount > from_balance {
        return Err(format!(
            "Insufficient balance. Have: Rs. {:.2}, Need: Rs. {:.2}",
            from_balance, amount
        ));
    }

    Ok(format!(
        "Transferred Rs. {:.2} from {} to {}. Remaining: Rs. {:.2}",
        amount, from_upi, to_upi, from_balance - amount
    ))
}

fn demo_question_mark() {
    println!("\n=== 4. The ? Operator ===\n");

    let mut accounts = HashMap::new();
    accounts.insert(String::from("rahul@okicici"), BankAccount {
        holder: String::from("Rahul"),
        balance: 15000.0,
        upi_id: String::from("rahul@okicici"),
    });
    accounts.insert(String::from("shop@ybl"), BankAccount {
        holder: String::from("Chai Shop"),
        balance: 50000.0,
        upi_id: String::from("shop@ybl"),
    });

    // WHY: Successful transfer.
    match transfer(&accounts, "rahul@okicici", "shop@ybl", "500") {
        Ok(msg) => println!("SUCCESS: {}", msg),
        Err(e) => println!("FAILED: {}", e),
    }
    // Output: SUCCESS: Transferred Rs. 500.00 from rahul@okicici to shop@ybl. Remaining: Rs. 14500.00

    // WHY: Invalid amount.
    match transfer(&accounts, "rahul@okicici", "shop@ybl", "abc") {
        Ok(msg) => println!("SUCCESS: {}", msg),
        Err(e) => println!("FAILED: {}", e),
    }
    // Output: FAILED: Invalid amount 'abc': invalid float literal

    // WHY: Account not found.
    match transfer(&accounts, "unknown@bank", "shop@ybl", "100") {
        Ok(msg) => println!("SUCCESS: {}", msg),
        Err(e) => println!("FAILED: {}", e),
    }
    // Output: FAILED: UPI ID 'unknown@bank' not found

    // WHY: Insufficient balance.
    match transfer(&accounts, "rahul@okicici", "shop@ybl", "99999") {
        Ok(msg) => println!("SUCCESS: {}", msg),
        Err(e) => println!("FAILED: {}", e),
    }
    // Output: FAILED: Insufficient balance. Have: Rs. 15000.00, Need: Rs. 99999.00
}

// ============================================================
// 5. CUSTOM ERROR TYPES WITH Display AND From
// ============================================================
// WHY: For libraries and large apps, string errors aren't enough.
// Custom error types let callers match on specific errors.
// Implementing From<T> enables automatic conversion with ?.

#[derive(Debug)]
enum PaymentError {
    ParseError(String),
    AccountNotFound(String),
    InsufficientFunds { available: f64, required: f64 },
    LimitExceeded(f64),
    NetworkFailure(String),
}

// WHY: Display gives user-friendly error messages (used by {}).
impl fmt::Display for PaymentError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            PaymentError::ParseError(msg) => write!(f, "Parse error: {}", msg),
            PaymentError::AccountNotFound(id) => write!(f, "Account not found: {}", id),
            PaymentError::InsufficientFunds { available, required } => {
                write!(f, "Insufficient funds: have Rs. {:.2}, need Rs. {:.2}",
                    available, required)
            }
            PaymentError::LimitExceeded(amount) => {
                write!(f, "Transaction limit exceeded: Rs. {:.2}", amount)
            }
            PaymentError::NetworkFailure(msg) => write!(f, "Network error: {}", msg),
        }
    }
}

// WHY: From<ParseIntError> lets ? automatically convert parse errors
// into our PaymentError type.
impl From<ParseIntError> for PaymentError {
    fn from(e: ParseIntError) -> Self {
        PaymentError::ParseError(e.to_string())
    }
}

fn parse_and_validate_pin(pin: &str) -> Result<u32, PaymentError> {
    // WHY: ? here converts ParseIntError -> PaymentError via From.
    let parsed: u32 = pin.parse()?;
    if parsed < 1000 || parsed > 9999 {
        return Err(PaymentError::ParseError(
            format!("PIN must be 4 digits, got {}", parsed),
        ));
    }
    Ok(parsed)
}

fn secure_transfer(
    from_balance: f64,
    amount: f64,
    pin: &str,
) -> Result<String, PaymentError> {
    let _valid_pin = parse_and_validate_pin(pin)?;

    if amount > 100000.0 {
        return Err(PaymentError::LimitExceeded(amount));
    }

    if amount > from_balance {
        return Err(PaymentError::InsufficientFunds {
            available: from_balance,
            required: amount,
        });
    }

    Ok(format!("Payment of Rs. {:.2} authorized", amount))
}

fn demo_custom_errors() {
    println!("\n=== 5. Custom Error Types ===\n");

    let test_cases = vec![
        (5000.0, 200.0, "1234"),
        (5000.0, 200.0, "abcd"),    // parse error
        (5000.0, 200.0, "12"),      // too short for u32 4-digit check
        (5000.0, 8000.0, "5678"),   // insufficient funds
        (5000.0, 200000.0, "5678"), // limit exceeded
    ];

    for (balance, amount, pin) in test_cases {
        match secure_transfer(balance, amount, pin) {
            Ok(msg) => println!("OK: {}", msg),
            Err(e) => println!("ERR: {}", e),
        }
    }
    // Output: OK: Payment of Rs. 200.00 authorized
    // Output: ERR: Parse error: invalid digit found in string
    // Output: ERR: Parse error: PIN must be 4 digits, got 12
    // Output: ERR: Insufficient funds: have Rs. 5000.00, need Rs. 8000.00
    // Output: ERR: Transaction limit exceeded: Rs. 200000.00
}

// ============================================================
// 6. ERROR CHAINING AND CONTEXT
// ============================================================
// WHY: When errors propagate through layers, you want context:
// "failed to load config" -> "failed to read file" -> "file not found."
// We can build this with custom wrapper errors.

#[derive(Debug)]
struct AppError {
    message: String,
    source: Option<Box<AppError>>,
}

impl AppError {
    fn new(message: &str) -> Self {
        Self {
            message: String::from(message),
            source: None,
        }
    }

    fn with_context(mut self, context: &str) -> Self {
        let inner = AppError {
            message: self.message,
            source: self.source,
        };
        self.message = String::from(context);
        self.source = Some(Box::new(inner));
        self
    }

    fn chain(&self) -> Vec<&str> {
        let mut errors = vec![self.message.as_str()];
        let mut current = &self.source;
        while let Some(src) = current {
            errors.push(src.message.as_str());
            current = &src.source;
        }
        errors
    }
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.message)?;
        if let Some(ref src) = self.source {
            write!(f, "\n  Caused by: {}", src)?;
        }
        Ok(())
    }
}

fn load_user_config() -> Result<String, AppError> {
    // WHY: Simulating an error chain.
    let file_result: Result<String, AppError> = Err(AppError::new("file 'config.toml' not found"));

    let content = file_result
        .map_err(|e| e.with_context("failed to read configuration file"))?;

    Ok(content)
}

fn demo_error_chaining() {
    println!("\n=== 6. Error Chaining ===\n");

    match load_user_config() {
        Ok(config) => println!("Config: {}", config),
        Err(e) => {
            println!("Error: {}", e);
            println!("\nError chain:");
            for (i, msg) in e.chain().iter().enumerate() {
                println!("  {}: {}", i, msg);
            }
        }
    }
    // Output: Error: failed to read configuration file
    // Output:   Caused by: file 'config.toml' not found
    // Output:
    // Output: Error chain:
    // Output:   0: failed to read configuration file
    // Output:   1: file 'config.toml' not found
}

// ============================================================
// 7. CONVERTING BETWEEN ERROR TYPES
// ============================================================
// WHY: Real code calls functions that return different error types.
// map_err() and From let you unify them.

#[derive(Debug)]
enum ConfigError {
    ParseInt(ParseIntError),
    InvalidValue(String),
    MissingField(String),
}

impl fmt::Display for ConfigError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ConfigError::ParseInt(e) => write!(f, "Integer parse error: {}", e),
            ConfigError::InvalidValue(msg) => write!(f, "Invalid value: {}", msg),
            ConfigError::MissingField(field) => write!(f, "Missing field: {}", field),
        }
    }
}

impl From<ParseIntError> for ConfigError {
    fn from(e: ParseIntError) -> Self {
        ConfigError::ParseInt(e)
    }
}

fn parse_server_config(config: &HashMap<String, String>) -> Result<(String, u16), ConfigError> {
    // WHY: .ok_or() converts Option -> Result for the ? operator.
    let host = config
        .get("host")
        .ok_or(ConfigError::MissingField(String::from("host")))?
        .clone();

    let port_str = config
        .get("port")
        .ok_or(ConfigError::MissingField(String::from("port")))?;

    // WHY: parse::<u16>() returns Result<u16, ParseIntError>.
    // The ? converts it to ConfigError via our From implementation.
    let port: u16 = port_str.parse()?;

    if port < 1024 {
        return Err(ConfigError::InvalidValue(
            format!("Port {} is reserved (must be >= 1024)", port),
        ));
    }

    Ok((host, port))
}

fn demo_error_conversion() {
    println!("\n=== 7. Error Type Conversion ===\n");

    // WHY: Test with valid config.
    let mut config = HashMap::new();
    config.insert(String::from("host"), String::from("127.0.0.1"));
    config.insert(String::from("port"), String::from("8080"));

    match parse_server_config(&config) {
        Ok((host, port)) => println!("Server: {}:{}", host, port),
        Err(e) => println!("Config error: {}", e),
    }
    // Output: Server: 127.0.0.1:8080

    // WHY: Missing field.
    let empty_config = HashMap::new();
    match parse_server_config(&empty_config) {
        Ok((host, port)) => println!("Server: {}:{}", host, port),
        Err(e) => println!("Config error: {}", e),
    }
    // Output: Config error: Missing field: host

    // WHY: Invalid port number.
    let mut bad_config = HashMap::new();
    bad_config.insert(String::from("host"), String::from("localhost"));
    bad_config.insert(String::from("port"), String::from("abc"));

    match parse_server_config(&bad_config) {
        Ok((host, port)) => println!("Server: {}:{}", host, port),
        Err(e) => println!("Config error: {}", e),
    }
    // Output: Config error: Integer parse error: invalid digit found in string

    // WHY: Reserved port.
    let mut reserved_config = HashMap::new();
    reserved_config.insert(String::from("host"), String::from("localhost"));
    reserved_config.insert(String::from("port"), String::from("80"));

    match parse_server_config(&reserved_config) {
        Ok((host, port)) => println!("Server: {}:{}", host, port),
        Err(e) => println!("Config error: {}", e),
    }
    // Output: Config error: Invalid value: Port 80 is reserved (must be >= 1024)
}

// ============================================================
// 8. WHEN TO PANIC VS RESULT
// ============================================================
// WHY: Choosing between panic! and Result is a key design decision.
// This section clarifies the guidelines.

fn demo_panic_vs_result() {
    println!("\n=== 8. When to panic! vs Result ===\n");

    // WHY: Use panic! for programming errors / invariant violations.
    // Example: indexing into a known-valid position.
    let weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    let day_index = 2; // We KNOW this is valid.
    println!("Day: {}", weekdays[day_index]); // OK to index directly
    // Output: Day: Wed

    // WHY: Use Result for expected failures (user input, I/O, network).
    fn parse_age(input: &str) -> Result<u8, String> {
        let age: u8 = input.parse().map_err(|_| format!("'{}' is not a valid age", input))?;
        if age > 150 {
            return Err(format!("Age {} is unrealistic", age));
        }
        Ok(age)
    }

    let inputs = vec!["25", "abc", "200", "0"];
    for input in inputs {
        match parse_age(input) {
            Ok(age) => println!("Valid age: {}", age),
            Err(e) => println!("Invalid: {}", e),
        }
    }
    // Output: Valid age: 25
    // Output: Invalid: 'abc' is not a valid age
    // Output: Invalid: Age 200 is unrealistic
    // Output: Valid age: 0

    println!("\n--- Guidelines ---");
    println!("panic!: prototype/tests, impossible states, broken invariants");
    println!("Result: user input, I/O, network, anything that CAN fail normally");
    println!("unwrap: only when you've already validated (or in tests)");
    println!("expect: like unwrap but with a meaningful message");
}

// ============================================================
// 9. OPTION AND RESULT COMBINATORS
// ============================================================
// WHY: Instead of verbose match blocks, combinators let you
// chain operations on Option and Result elegantly.

fn demo_combinators() {
    println!("\n=== 9. Option/Result Combinators ===\n");

    // WHY: map — transform the inner value.
    let price: Option<u32> = Some(1500);
    let with_gst = price.map(|p| (p as f64) * 1.18);
    println!("Price with GST: {:?}", with_gst);
    // Output: Price with GST: Some(1770.0)

    // WHY: and_then (flatMap) — chain operations that return Option/Result.
    let input = "42";
    let result: Option<u32> = input.parse::<u32>().ok().and_then(|n| {
        if n > 0 && n <= 100 { Some(n) } else { None }
    });
    println!("Parsed and validated: {:?}", result);
    // Output: Parsed and validated: Some(42)

    // WHY: or_else — provide fallback on error.
    let primary: Result<i32, &str> = Err("primary failed");
    let fallback = primary.or_else(|_| -> Result<i32, &str> { Ok(99) });
    println!("With fallback: {:?}", fallback);
    // Output: With fallback: Ok(99)

    // WHY: filter on Option.
    let age: Option<u32> = Some(25);
    let adult = age.filter(|&a| a >= 18);
    println!("Adult: {:?}", adult);
    // Output: Adult: Some(25)

    let child_age: Option<u32> = Some(10);
    let adult2 = child_age.filter(|&a| a >= 18);
    println!("Adult: {:?}", adult2);
    // Output: Adult: None

    // WHY: zip combines two Options.
    let name: Option<&str> = Some("Rahul");
    let score: Option<u32> = Some(95);
    let combined = name.zip(score);
    println!("Combined: {:?}", combined);
    // Output: Combined: Some(("Rahul", 95))

    // WHY: Chaining multiple operations fluently.
    let order_total: Option<f64> = Some(2500.0);
    let final_amount = order_total
        .filter(|&t| t > 0.0)           // validate positive
        .map(|t| t * 1.05)               // add 5% GST
        .map(|t| t - 200.0)              // apply Rs. 200 discount
        .filter(|&t| t > 0.0);           // ensure still positive

    println!("Final amount: {:?}", final_amount);
    // Output: Final amount: Some(2425.0)
}

// ============================================================
// 10. PRACTICAL EXAMPLE — MINI PAYMENT PROCESSOR
// ============================================================
// WHY: Putting together everything — custom errors, ?, From,
// Display, combinators — in a realistic scenario.

#[derive(Debug)]
enum TransactionError {
    InvalidAmount(String),
    AccountNotFound(String),
    InsufficientBalance { account: String, available: f64, required: f64 },
    DailyLimitExceeded { limit: f64, attempted: f64 },
}

impl fmt::Display for TransactionError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            TransactionError::InvalidAmount(msg) => write!(f, "Invalid amount: {}", msg),
            TransactionError::AccountNotFound(id) => write!(f, "Account '{}' not found", id),
            TransactionError::InsufficientBalance { account, available, required } => {
                write!(f, "Insufficient balance in '{}': have {:.2}, need {:.2}",
                    account, available, required)
            }
            TransactionError::DailyLimitExceeded { limit, attempted } => {
                write!(f, "Daily limit Rs. {:.2} exceeded (attempted Rs. {:.2})",
                    limit, attempted)
            }
        }
    }
}

struct PaymentProcessor {
    accounts: HashMap<String, f64>,
    daily_limit: f64,
    today_total: f64,
}

impl PaymentProcessor {
    fn new(daily_limit: f64) -> Self {
        Self {
            accounts: HashMap::new(),
            daily_limit,
            today_total: 0.0,
        }
    }

    fn add_account(&mut self, id: &str, balance: f64) {
        self.accounts.insert(String::from(id), balance);
    }

    fn validate_amount(&self, amount: f64) -> Result<f64, TransactionError> {
        if amount <= 0.0 {
            return Err(TransactionError::InvalidAmount(
                format!("must be positive, got {:.2}", amount),
            ));
        }
        if amount + self.today_total > self.daily_limit {
            return Err(TransactionError::DailyLimitExceeded {
                limit: self.daily_limit,
                attempted: amount + self.today_total,
            });
        }
        Ok(amount)
    }

    fn get_balance(&self, id: &str) -> Result<f64, TransactionError> {
        self.accounts
            .get(id)
            .copied()
            .ok_or(TransactionError::AccountNotFound(String::from(id)))
    }

    fn process(&mut self, from: &str, to: &str, amount: f64) -> Result<String, TransactionError> {
        let amount = self.validate_amount(amount)?;
        let from_balance = self.get_balance(from)?;
        let _to_balance = self.get_balance(to)?;

        if amount > from_balance {
            return Err(TransactionError::InsufficientBalance {
                account: String::from(from),
                available: from_balance,
                required: amount,
            });
        }

        // WHY: Update balances.
        *self.accounts.get_mut(from).unwrap() -= amount;
        *self.accounts.get_mut(to).unwrap() += amount;
        self.today_total += amount;

        Ok(format!(
            "Rs. {:.2}: {} -> {} | Today's total: Rs. {:.2}",
            amount, from, to, self.today_total
        ))
    }
}

fn demo_practical_example() {
    println!("\n=== 10. Practical: Payment Processor ===\n");

    let mut processor = PaymentProcessor::new(50000.0);
    processor.add_account("rahul@upi", 25000.0);
    processor.add_account("shop@upi", 100000.0);
    processor.add_account("priya@upi", 8000.0);

    let transactions = vec![
        ("rahul@upi", "shop@upi", 500.0),
        ("priya@upi", "shop@upi", 2000.0),
        ("rahul@upi", "ghost@upi", 100.0),     // account not found
        ("priya@upi", "rahul@upi", 10000.0),   // insufficient funds
        ("rahul@upi", "priya@upi", -50.0),     // negative amount
        ("rahul@upi", "priya@upi", 1000.0),    // success
    ];

    for (from, to, amount) in transactions {
        let label = format!("Rs. {:.2}: {} -> {}", amount, from, to);
        match processor.process(from, to, amount) {
            Ok(msg) => println!("[OK]   {}", msg),
            Err(e) => println!("[FAIL] {} -- {}", label, e),
        }
    }
    // Output: [OK]   Rs. 500.00: rahul@upi -> shop@upi | Today's total: Rs. 500.00
    // Output: [OK]   Rs. 2000.00: priya@upi -> shop@upi | Today's total: Rs. 2500.00
    // Output: [FAIL] Rs. 100.00: rahul@upi -> ghost@upi -- Account 'ghost@upi' not found
    // Output: [FAIL] Rs. 10000.00: priya@upi -> rahul@upi -- Insufficient balance in 'priya@upi': have 6000.00, need 10000.00
    // Output: [FAIL] Rs. -50.00: rahul@upi -> priya@upi -- Invalid amount: must be positive, got -50.00
    // Output: [OK]   Rs. 1000.00: rahul@upi -> priya@upi | Today's total: Rs. 3500.00

    println!("\nFinal balances:");
    let mut accounts: Vec<_> = processor.accounts.iter().collect();
    accounts.sort_by_key(|(k, _)| k.clone());
    for (id, balance) in accounts {
        println!("  {}: Rs. {:.2}", id, balance);
    }
}

// ============================================================
// MAIN
// ============================================================

fn main() {
    demo_panic();
    demo_result_basic();
    demo_unwrap_expect();
    demo_question_mark();
    demo_custom_errors();
    demo_error_chaining();
    demo_error_conversion();
    demo_panic_vs_result();
    demo_combinators();
    demo_practical_example();

    // ============================================================
    // KEY TAKEAWAYS
    // ============================================================
    println!("\n=== KEY TAKEAWAYS ===\n");
    println!("1. Rust has no exceptions. Errors are values: Result<T,E> and Option<T>.");
    println!("2. panic! is for unrecoverable bugs. Result is for expected failures.");
    println!("3. The ? operator propagates errors elegantly (early return on Err/None).");
    println!("4. unwrap()/expect() panic on error — use only when certain or in tests.");
    println!("5. Custom error enums + Display give user-friendly messages.");
    println!("6. Implement From<OtherError> to enable automatic conversion with ?.");
    println!("7. map, and_then, unwrap_or, filter — combinators replace verbose matches.");
    println!("8. ok_or() converts Option to Result for ? propagation.");
    println!("9. Error chaining provides context: 'failed to X' caused by 'failed to Y'.");
    println!("10. The compiler FORCES you to handle errors — no silent failures.");
}
