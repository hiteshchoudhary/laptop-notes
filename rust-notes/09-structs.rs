// ============================================================
// 09 - STRUCTS IN RUST
// ============================================================
// WHY THIS MATTERS:
// Structs are Rust's primary way to create custom data types.
// Every real-world application — web servers, games, databases —
// models its domain using structs. Without structs, you'd be
// passing dozens of loose variables around. Structs let you
// bundle related data AND behavior together, forming the
// backbone of Rust's type system alongside enums.
// ============================================================

// ============================================================
// STORY: The IRCTC Reservation Form
// ============================================================
// Imagine you're booking a train ticket on IRCTC. The reservation
// form has fields: passenger name, age, train number, class
// (Sleeper, AC-3, AC-2), PNR number, and boarding station.
//
// Each field has a specific type — name is text, age is a number,
// class is a choice from a fixed set. You can't submit the form
// with missing fields (Rust enforces this at compile time!).
//
// Once you have a booking, you can perform actions on it: check
// status, cancel, upgrade class. These are like methods on a
// struct — they operate on the data bundled inside.
//
// A struct in Rust is exactly this reservation form: a named
// collection of typed fields, with methods that operate on them.
// ============================================================

// WHY: derive(Debug) lets us print structs with {:?} for debugging.
// Without it, println! doesn't know how to display custom types.
#[derive(Debug)]
struct Passenger {
    name: String,
    age: u8,
    train_number: u32,
    class: String,
    pnr: String,
    boarding_station: String,
}

// ============================================================
// 1. BASIC STRUCT DEFINITION AND INSTANTIATION
// ============================================================
// WHY: Structs group related data into a single type. This makes
// your code self-documenting — instead of passing 6 separate
// variables, you pass one Passenger.

fn demo_basic_struct() {
    println!("=== 1. Basic Struct Definition ===\n");

    // WHY: Every field must be initialized. Rust has no null —
    // partial initialization is a compile error.
    let passenger = Passenger {
        name: String::from("Rajesh Kumar"),
        age: 35,
        train_number: 12301,
        class: String::from("AC-3"),
        pnr: String::from("PNR4829371"),
        boarding_station: String::from("New Delhi"),
    };

    // WHY: Field access uses dot notation, just like most languages.
    println!("Passenger: {}", passenger.name);          // Output: Passenger: Rajesh Kumar
    println!("Train: {}", passenger.train_number);      // Output: Train: 12301
    println!("Class: {}", passenger.class);             // Output: Class: AC-3
    println!("PNR: {}", passenger.pnr);                 // Output: PNR: PNR4829371

    // WHY: Debug trait (from derive) lets us print the entire struct.
    println!("\nFull booking: {:?}", passenger);
    // Output: Full booking: Passenger { name: "Rajesh Kumar", age: 35, train_number: 12301, class: "AC-3", pnr: "PNR4829371", boarding_station: "New Delhi" }

    // WHY: {:#?} gives pretty-printed debug output — great for complex structs.
    println!("\nPretty print:\n{:#?}", passenger);
    // Output: (multi-line formatted version of above)
}

// ============================================================
// 2. MUTABLE STRUCTS AND FIELD SHORTHAND
// ============================================================
// WHY: If you need to modify fields after creation, the entire
// struct binding must be mut. Rust doesn't allow per-field
// mutability — it's all or nothing.

fn demo_mutable_and_shorthand() {
    println!("\n=== 2. Mutable Structs & Field Shorthand ===\n");

    let name = String::from("Priya Sharma");
    let age = 28;

    // WHY: Field init shorthand — when variable name matches field
    // name, you can write just `name` instead of `name: name`.
    let mut booking = Passenger {
        name,       // shorthand for name: name
        age,        // shorthand for age: age
        train_number: 12951,
        class: String::from("Sleeper"),
        pnr: String::from("PNR5567823"),
        boarding_station: String::from("Mumbai Central"),
    };

    println!("Before upgrade: {} in {}", booking.name, booking.class);
    // Output: Before upgrade: Priya Sharma in Sleeper

    // WHY: Mutation requires the binding to be `mut`.
    booking.class = String::from("AC-2");
    println!("After upgrade: {} in {}", booking.name, booking.class);
    // Output: After upgrade: Priya Sharma in AC-2
}

// ============================================================
// 3. STRUCT UPDATE SYNTAX (..)
// ============================================================
// WHY: When creating a new struct that shares most fields with an
// existing one, update syntax avoids repeating every field.
// Think of it as "copy these fields from the old one."

#[derive(Debug)]
struct TrainRoute {
    train_number: u32,
    name: String,
    origin: String,
    destination: String,
    distance_km: u32,
    is_superfast: bool,
}

fn demo_update_syntax() {
    println!("\n=== 3. Struct Update Syntax ===\n");

    let rajdhani = TrainRoute {
        train_number: 12301,
        name: String::from("Rajdhani Express"),
        origin: String::from("New Delhi"),
        destination: String::from("Howrah"),
        distance_km: 1447,
        is_superfast: true,
    };

    // WHY: `..rajdhani` means "take remaining fields from rajdhani."
    // Note: this MOVES String fields — rajdhani.name is no longer usable.
    let return_rajdhani = TrainRoute {
        train_number: 12302,
        origin: String::from("Howrah"),
        destination: String::from("New Delhi"),
        ..rajdhani
    };

    println!("Return train: {:?}", return_rajdhani);
    // Output: TrainRoute { train_number: 12302, name: "Rajdhani Express", origin: "Howrah", destination: "New Delhi", distance_km: 1447, is_superfast: true }

    // WHY: rajdhani.distance_km and rajdhani.is_superfast still work
    // because u32 and bool implement Copy. But rajdhani.name was moved.
    println!("Original distance: {}", rajdhani.distance_km); // Output: Original distance: 1447
    println!("Original superfast: {}", rajdhani.is_superfast); // Output: Original superfast: true
}

// ============================================================
// 4. IMPL BLOCKS — METHODS AND ASSOCIATED FUNCTIONS
// ============================================================
// WHY: impl blocks attach behavior to structs. Methods take &self
// (read-only) or &mut self (modify). Associated functions don't
// take self — they're like constructors (Self::new).

#[derive(Debug)]
struct IrctcBooking {
    passenger_name: String,
    pnr: String,
    fare: f64,
    is_confirmed: bool,
    class: String,
}

// WHY: All methods and associated functions for a type go in impl blocks.
// You can have multiple impl blocks for the same type.
impl IrctcBooking {
    // WHY: Associated function (no self) — acts as a constructor.
    // Convention: `new` creates with required fields.
    fn new(name: &str, pnr: &str, fare: f64, class: &str) -> Self {
        Self {
            passenger_name: String::from(name),
            pnr: String::from(pnr),
            fare,
            is_confirmed: false,
            class: String::from(class),
        }
    }

    // WHY: &self borrows immutably — reads data without modifying.
    fn display_ticket(&self) {
        println!("--- IRCTC E-Ticket ---");
        println!("Passenger: {}", self.passenger_name);
        println!("PNR: {}", self.pnr);
        println!("Class: {}", self.class);
        println!("Fare: Rs. {:.2}", self.fare);
        println!("Status: {}", if self.is_confirmed { "Confirmed" } else { "Waiting" });
        println!("----------------------");
    }

    // WHY: &mut self borrows mutably — allows modifying fields.
    fn confirm(&mut self) {
        self.is_confirmed = true;
        println!("{}'s booking confirmed!", self.passenger_name);
    }

    // WHY: Methods can return values computed from fields.
    fn service_tax(&self) -> f64 {
        self.fare * 0.05
    }

    fn total_fare(&self) -> f64 {
        self.fare + self.service_tax()
    }

    // WHY: Methods can take self by value, consuming the struct.
    // Useful for transformations where the original shouldn't be reused.
    fn cancel(self) -> String {
        let refund = self.fare * 0.75;
        format!(
            "Booking {} cancelled. Refund of Rs. {:.2} initiated for {}.",
            self.pnr, refund, self.passenger_name
        )
    }
}

fn demo_methods() {
    println!("\n=== 4. Methods and Associated Functions ===\n");

    // WHY: Associated function called with :: (not dot).
    let mut booking = IrctcBooking::new("Anita Desai", "PNR9988776", 1850.0, "AC-3");

    booking.display_ticket();
    // Output: --- IRCTC E-Ticket ---
    // Output: Passenger: Anita Desai
    // Output: PNR: PNR9988776
    // Output: Class: AC-3
    // Output: Fare: Rs. 1850.00
    // Output: Status: Waiting

    println!("Service tax: Rs. {:.2}", booking.service_tax());
    // Output: Service tax: Rs. 92.50
    println!("Total fare: Rs. {:.2}", booking.total_fare());
    // Output: Total fare: Rs. 1942.50

    booking.confirm();
    // Output: Anita Desai's booking confirmed!

    booking.display_ticket();

    // WHY: cancel() takes self by value — booking is consumed after this.
    let msg = booking.cancel();
    println!("{}", msg);
    // Output: Booking PNR9988776 cancelled. Refund of Rs. 1387.50 initiated for Anita Desai.

    // booking.display_ticket(); // ERROR: booking has been moved/consumed
}

// ============================================================
// 5. MULTIPLE IMPL BLOCKS
// ============================================================
// WHY: Rust allows splitting methods across multiple impl blocks.
// This is useful for organizing code and required for trait impls.

#[derive(Debug)]
struct Platform {
    number: u8,
    is_occupied: bool,
    train_name: Option<String>,
}

impl Platform {
    fn new(number: u8) -> Self {
        Self {
            number,
            is_occupied: false,
            train_name: None,
        }
    }
}

// WHY: Second impl block — perfectly valid. Keeps related methods grouped.
impl Platform {
    fn assign_train(&mut self, train: &str) {
        self.is_occupied = true;
        self.train_name = Some(String::from(train));
        println!("Platform {} assigned to {}", self.number, train);
    }

    fn release(&mut self) {
        let train = self.train_name.take(); // take() extracts Option value
        self.is_occupied = false;
        if let Some(name) = train {
            println!("Platform {} released from {}", self.number, name);
        }
    }
}

fn demo_multiple_impl() {
    println!("\n=== 5. Multiple Impl Blocks ===\n");

    let mut p1 = Platform::new(1);
    p1.assign_train("Rajdhani Express");
    // Output: Platform 1 assigned to Rajdhani Express

    println!("Platform {:?}", p1);
    // Output: Platform { number: 1, is_occupied: true, train_name: Some("Rajdhani Express") }

    p1.release();
    // Output: Platform 1 released from Rajdhani Express

    println!("After release: {:?}", p1);
    // Output: After release: Platform { number: 1, is_occupied: false, train_name: None }
}

// ============================================================
// 6. DISPLAY TRAIT — CUSTOM FORMATTING
// ============================================================
// WHY: Debug ({:?}) is auto-generated and ugly. Display ({})
// lets you define user-friendly output. It's what println!("{}")
// uses — and it's required for user-facing output.

use std::fmt;

struct CoachInfo {
    coach_type: String,
    number: u8,
    total_seats: u16,
    available_seats: u16,
}

// WHY: Implementing Display requires defining fmt() — you control
// exactly how the struct appears when printed with {}.
impl fmt::Display for CoachInfo {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(
            f,
            "[Coach {}-{}] Seats: {}/{} available",
            self.coach_type, self.number, self.available_seats, self.total_seats
        )
    }
}

// WHY: You can also implement Debug manually if derive isn't enough.
impl fmt::Debug for CoachInfo {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(
            f,
            "CoachInfo {{ type: {}, num: {}, avail: {}/{} }}",
            self.coach_type, self.number, self.available_seats, self.total_seats
        )
    }
}

fn demo_display_trait() {
    println!("\n=== 6. Display Trait ===\n");

    let coach = CoachInfo {
        coach_type: String::from("S"),
        number: 4,
        total_seats: 72,
        available_seats: 23,
    };

    // WHY: {} uses Display, {:?} uses Debug.
    println!("Display: {}", coach);
    // Output: Display: [Coach S-4] Seats: 23/72 available
    println!("Debug: {:?}", coach);
    // Output: Debug: CoachInfo { type: S, num: 4, avail: 23/72 }
}

// ============================================================
// 7. TUPLE STRUCTS
// ============================================================
// WHY: Tuple structs have unnamed fields — useful for simple
// wrappers. They create distinct types from the same underlying
// data. A PNR(String) and a TrainName(String) are different types
// even though both wrap String.

#[derive(Debug)]
struct PnrNumber(String);

#[derive(Debug)]
struct TrainName(String);

#[derive(Debug)]
struct Kilometers(f64);

#[derive(Debug)]
struct RupeesPerKm(f64);

impl Kilometers {
    fn fare(&self, rate: &RupeesPerKm) -> f64 {
        self.0 * rate.0
    }
}

fn demo_tuple_structs() {
    println!("\n=== 7. Tuple Structs ===\n");

    let pnr = PnrNumber(String::from("PNR1234567"));
    let train = TrainName(String::from("Shatabdi Express"));

    // WHY: Access fields by index: .0, .1, etc.
    println!("PNR: {}", pnr.0);        // Output: PNR: PNR1234567
    println!("Train: {}", train.0);     // Output: Train: Shatabdi Express

    let distance = Kilometers(350.0);
    let rate = RupeesPerKm(1.25);

    // WHY: Type safety — you can't accidentally pass Kilometers where
    // RupeesPerKm is expected, even though both wrap f64.
    println!("Fare for {} km at {} Rs/km = Rs. {:.2}",
        distance.0, rate.0, distance.fare(&rate));
    // Output: Fare for 350 km at 1.25 Rs/km = Rs. 437.50
}

// ============================================================
// 8. UNIT STRUCTS
// ============================================================
// WHY: Unit structs have no fields. They're used as markers or
// for implementing traits without needing data. Think of them
// as zero-cost type-level tags.

#[derive(Debug)]
struct GeneralClass;

#[derive(Debug)]
struct SleeperClass;

#[derive(Debug)]
struct AcFirstClass;

// WHY: Different unit struct types let us use the type system
// to enforce rules at compile time.
trait ClassInfo {
    fn name(&self) -> &str;
    fn fare_multiplier(&self) -> f64;
}

impl ClassInfo for GeneralClass {
    fn name(&self) -> &str { "General" }
    fn fare_multiplier(&self) -> f64 { 1.0 }
}

impl ClassInfo for SleeperClass {
    fn name(&self) -> &str { "Sleeper" }
    fn fare_multiplier(&self) -> f64 { 2.5 }
}

impl ClassInfo for AcFirstClass {
    fn name(&self) -> &str { "AC First" }
    fn fare_multiplier(&self) -> f64 { 8.0 }
}

fn calculate_fare(base: f64, class: &dyn ClassInfo) -> f64 {
    base * class.fare_multiplier()
}

fn demo_unit_structs() {
    println!("\n=== 8. Unit Structs ===\n");

    let base_fare = 250.0;

    // WHY: Unit structs are instantiated without {} or ().
    let general = GeneralClass;
    let sleeper = SleeperClass;
    let ac_first = AcFirstClass;

    println!("{}: Rs. {:.2}", general.name(), calculate_fare(base_fare, &general));
    // Output: General: Rs. 250.00
    println!("{}: Rs. {:.2}", sleeper.name(), calculate_fare(base_fare, &sleeper));
    // Output: Sleeper: Rs. 625.00
    println!("{}: Rs. {:.2}", ac_first.name(), calculate_fare(base_fare, &ac_first));
    // Output: AC First: Rs. 2000.00
}

// ============================================================
// 9. BUILDER PATTERN
// ============================================================
// WHY: When structs have many fields (some optional), constructors
// become unwieldy. The builder pattern lets you set fields
// step-by-step with a fluent API. Very common in Rust libraries.

#[derive(Debug)]
struct Ticket {
    passenger_name: String,
    train_number: u32,
    from: String,
    to: String,
    class: String,
    meal_preference: Option<String>,
    lower_berth: bool,
    insurance: bool,
}

// WHY: Builder is a separate struct that accumulates options
// before producing the final Ticket.
struct TicketBuilder {
    passenger_name: String,
    train_number: u32,
    from: String,
    to: String,
    class: String,
    meal_preference: Option<String>,
    lower_berth: bool,
    insurance: bool,
}

impl TicketBuilder {
    // WHY: new() takes only required fields. Optional fields get defaults.
    fn new(name: &str, train: u32, from: &str, to: &str) -> Self {
        Self {
            passenger_name: String::from(name),
            train_number: train,
            from: String::from(from),
            to: String::from(to),
            class: String::from("Sleeper"),
            meal_preference: None,
            lower_berth: false,
            insurance: false,
        }
    }

    // WHY: Each setter returns self — enables method chaining.
    fn class(mut self, class: &str) -> Self {
        self.class = String::from(class);
        self
    }

    fn meal(mut self, meal: &str) -> Self {
        self.meal_preference = Some(String::from(meal));
        self
    }

    fn lower_berth(mut self) -> Self {
        self.lower_berth = true;
        self
    }

    fn with_insurance(mut self) -> Self {
        self.insurance = true;
        self
    }

    // WHY: build() consumes the builder and produces the final struct.
    fn build(self) -> Ticket {
        Ticket {
            passenger_name: self.passenger_name,
            train_number: self.train_number,
            from: self.from,
            to: self.to,
            class: self.class,
            meal_preference: self.meal_preference,
            lower_berth: self.lower_berth,
            insurance: self.insurance,
        }
    }
}

fn demo_builder_pattern() {
    println!("\n=== 9. Builder Pattern ===\n");

    // WHY: Fluent API reads like natural language.
    let ticket = TicketBuilder::new("Vikram Mehta", 12952, "Mumbai", "Delhi")
        .class("AC-2")
        .meal("Veg")
        .lower_berth()
        .with_insurance()
        .build();

    println!("{:#?}", ticket);
    // Output: Ticket {
    // Output:     passenger_name: "Vikram Mehta",
    // Output:     train_number: 12952,
    // Output:     from: "Mumbai",
    // Output:     to: "Delhi",
    // Output:     class: "AC-2",
    // Output:     meal_preference: Some("Veg"),
    // Output:     lower_berth: true,
    // Output:     insurance: true,
    // Output: }

    // WHY: Minimal booking — only required fields, defaults for the rest.
    let basic = TicketBuilder::new("Sita Ram", 14055, "Delhi", "Jaipur")
        .build();

    println!("\nBasic ticket: {:#?}", basic);
    // Output: Ticket {
    // Output:     passenger_name: "Sita Ram",
    // Output:     train_number: 14055,
    // Output:     from: "Delhi",
    // Output:     to: "Jaipur",
    // Output:     class: "Sleeper",
    // Output:     meal_preference: None,
    // Output:     lower_berth: false,
    // Output:     insurance: false,
    // Output: }
}

// ============================================================
// 10. STRUCTS WITH METHODS RETURNING REFERENCES
// ============================================================
// WHY: Methods can return references to struct fields. The borrow
// checker ensures the reference doesn't outlive the struct.

#[derive(Debug)]
struct Station {
    code: String,
    full_name: String,
    zone: String,
    platforms: u8,
}

impl Station {
    fn new(code: &str, full_name: &str, zone: &str, platforms: u8) -> Self {
        Self {
            code: String::from(code),
            full_name: String::from(full_name),
            zone: String::from(zone),
            platforms,
        }
    }

    // WHY: Returning &str borrows from the struct — no allocation needed.
    fn short_info(&self) -> String {
        format!("{} ({}) - {} zone, {} platforms",
            self.full_name, self.code, self.zone, self.platforms)
    }

    fn is_major_station(&self) -> bool {
        self.platforms >= 10
    }

    fn code(&self) -> &str {
        &self.code
    }

    fn name(&self) -> &str {
        &self.full_name
    }
}

fn demo_returning_references() {
    println!("\n=== 10. Methods Returning References ===\n");

    let ndls = Station::new("NDLS", "New Delhi", "Northern", 16);
    let station_info = ndls.short_info();
    println!("{}", station_info);
    // Output: New Delhi (NDLS) - Northern zone, 16 platforms

    println!("Major station? {}", ndls.is_major_station());
    // Output: Major station? true

    // WHY: code() returns &str borrowing from ndls — valid as long as ndls lives.
    let code = ndls.code();
    let name = ndls.name();
    println!("Code: {}, Name: {}", code, name);
    // Output: Code: NDLS, Name: New Delhi
}

// ============================================================
// MAIN
// ============================================================

fn main() {
    demo_basic_struct();
    demo_mutable_and_shorthand();
    demo_update_syntax();
    demo_methods();
    demo_multiple_impl();
    demo_display_trait();
    demo_tuple_structs();
    demo_unit_structs();
    demo_builder_pattern();
    demo_returning_references();

    // ============================================================
    // KEY TAKEAWAYS
    // ============================================================
    println!("\n=== KEY TAKEAWAYS ===\n");
    println!("1. Structs bundle related data into named types.");
    println!("2. All fields must be initialized — no partial construction.");
    println!("3. `impl` blocks attach methods (&self, &mut self) and");
    println!("   associated functions (Self::new) to structs.");
    println!("4. Struct update syntax (..) copies remaining fields from");
    println!("   another instance (moves non-Copy types).");
    println!("5. #[derive(Debug)] gives {:?} printing. Implement Display");
    println!("   for user-facing {{}} formatting.");
    println!("6. Tuple structs wrap existing types for type safety.");
    println!("7. Unit structs (no fields) serve as type-level markers.");
    println!("8. Builder pattern provides fluent APIs for complex structs.");
    println!("9. Methods consuming self (not &self) transfer ownership —");
    println!("   the struct can't be used afterward.");
    println!("10. Rust has no inheritance. Composition + traits = power.");
}
