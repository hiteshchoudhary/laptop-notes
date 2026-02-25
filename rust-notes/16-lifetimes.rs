// ============================================================
// FILE 16: LIFETIMES — How Rust Tracks Reference Validity
// ============================================================
// WHY THIS MATTERS:
// Lifetimes are Rust's way of ensuring every reference is
// valid for as long as it's used. They prevent dangling
// references (pointing to freed memory) at compile time,
// with ZERO runtime cost. Lifetimes are what make Rust's
// "no garbage collector" promise actually safe.
// ============================================================

// ============================================================
// STORY: Tatkal Ticket Validity Period
// ============================================================
// Think of Indian Railways' Tatkal booking system. When you
// book a Tatkal ticket from Mumbai to Delhi, that ticket
// (reference) is valid ONLY for the specific train journey
// (the data's lifetime). You can't use yesterday's ticket
// for today's train — the ticket's validity period has expired.
//
// Similarly, in Rust, a reference (&T) is valid only as long
// as the data it points to exists. The lifetime annotation 'a
// is like the validity period stamped on your ticket — it tells
// the compiler "this reference is valid for THIS long."
//
// If you try to use a reference after its data has been dropped,
// the compiler catches it — just like the TTE catching you
// with an expired ticket!
// ============================================================

use std::fmt;

// ============================================================
// 1. WHY LIFETIMES EXIST — The Dangling Reference Problem
// ============================================================
// WHY: Without lifetimes, you could accidentally use a reference
// to data that no longer exists. This is a common bug in C/C++.

fn demonstrate_dangling_problem() {
    println!("--- 1. Why Lifetimes Exist ---");

    // This works fine — the reference lives within the data's scope
    let result;
    {
        let ticket_number = String::from("TKT-2024-MUM-DEL");
        result = ticket_number.len(); // We copy the length (not a reference)
    } // ticket_number is dropped here

    println!("  Ticket number length: {}", result);
    // Output: Ticket number length: 17

    // This would NOT compile (uncomment to see the error):
    // let reference;
    // {
    //     let data = String::from("temporary");
    //     reference = &data; // ERROR: `data` does not live long enough
    // }
    // println!("{}", reference); // data is already dropped!

    // WHY: The compiler sees that `reference` would outlive `data`.
    // The lifetime of the reference exceeds the lifetime of the data.
    // Rust prevents this at compile time — no segfaults!

    println!("  (Dangling reference example is commented out — won't compile!)");
}

// ============================================================
// 2. LIFETIME ANNOTATIONS 'a — Naming the Validity Period
// ============================================================
// WHY: Lifetime annotations don't CHANGE how long data lives.
// They just DESCRIBE the relationship between lifetimes to
// the compiler. Like saying "these two tickets are for the
// same train journey."

// This function returns a reference. But whose lifetime does
// it follow — x's or y's? We must tell the compiler!
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    // WHY: 'a means "the returned reference will be valid for
    // the SHORTER of x's and y's lifetimes." This is safe
    // because the result can't outlive either input.
    if x.len() >= y.len() {
        x
    } else {
        y
    }
}

fn demonstrate_lifetime_annotations() {
    println!("\n--- 2. Lifetime Annotations ---");

    let mumbai_express = String::from("Mumbai Rajdhani Express");
    let result;

    {
        let delhi_shatabdi = String::from("Delhi Shatabdi");
        result = longest(&mumbai_express, &delhi_shatabdi);
        // Both references are valid here, so result is valid
        println!("  Longest train name: {}", result);
        // Output: Longest train name: Mumbai Rajdhani Express
    }
    // delhi_shatabdi is dropped here

    // If we tried to use `result` here and it pointed to delhi_shatabdi,
    // it would be a dangling reference. But since mumbai_express is longer,
    // result actually points to mumbai_express which is still valid.

    // However, this would NOT compile if we moved result usage outside:
    // The compiler doesn't know at compile time which branch will be taken,
    // so it conservatively uses the shorter lifetime.

    // This works because both strings live long enough:
    let train_a = "Duronto Express";
    let train_b = "Garib Rath";
    let longer = longest(train_a, train_b);
    println!("  Longer name: {}", longer);
    // Output: Longer name: Duronto Express
}

// ============================================================
// 3. FUNCTION LIFETIMES — Different Patterns
// ============================================================
// WHY: Not all parameters need the same lifetime annotation.
// Only references that relate to the return value need them.

// Only x's lifetime matters — we never return y
fn first_train<'a>(x: &'a str, _y: &str) -> &'a str {
    // WHY: _y doesn't need a lifetime annotation because
    // the return value doesn't depend on it
    x
}

// Multiple outputs tied to the same lifetime
fn train_info<'a>(name: &'a str, _class: &str) -> (&'a str, usize) {
    // WHY: The returned &str borrows from `name`, so it
    // needs 'a. The usize is owned, no lifetime needed.
    (name, name.len())
}

fn demonstrate_function_lifetimes() {
    println!("\n--- 3. Function Lifetimes ---");

    let express = "Chennai Express";
    let local = String::from("Mumbai Local");

    let first = first_train(express, &local);
    println!("  First train: {}", first);
    // Output: First train: Chennai Express

    let (name, len) = train_info("Rajdhani Express", "1AC");
    println!("  Train: {} (length: {})", name, len);
    // Output: Train: Rajdhani Express (length: 16)
}

// ============================================================
// 4. STRUCT LIFETIMES — Structs That Hold References
// ============================================================
// WHY: If a struct holds a reference, you MUST declare the
// lifetime. This ensures the struct can't outlive the data
// it references. Like a Tatkal ticket can't outlive the train
// schedule it refers to.

#[derive(Debug)]
struct TatkalTicket<'a> {
    passenger_name: &'a str,    // borrows the name
    train_name: &'a str,        // borrows the train name
    pnr: String,                // owns the PNR (no lifetime needed)
}

impl<'a> TatkalTicket<'a> {
    // WHY: Methods on structs with lifetimes also need the lifetime
    fn summary(&self) -> String {
        format!(
            "PNR: {} | {} on {}",
            self.pnr, self.passenger_name, self.train_name
        )
    }

    // Returning a reference tied to the struct's lifetime
    fn get_passenger(&self) -> &'a str {
        self.passenger_name
    }
}

// Display impl for the ticket
impl<'a> fmt::Display for TatkalTicket<'a> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(
            f,
            "[{}] {} -> {}",
            self.pnr, self.passenger_name, self.train_name
        )
    }
}

fn demonstrate_struct_lifetimes() {
    println!("\n--- 4. Struct Lifetimes ---");

    let passenger = String::from("Rahul Sharma");
    let train = String::from("Rajdhani Express");

    let ticket = TatkalTicket {
        passenger_name: &passenger,
        train_name: &train,
        pnr: String::from("PNR-8472615"),
    };

    println!("  Ticket: {}", ticket);
    // Output: Ticket: [PNR-8472615] Rahul Sharma -> Rajdhani Express

    println!("  Summary: {}", ticket.summary());
    // Output: Summary: PNR: PNR-8472615 | Rahul Sharma on Rajdhani Express

    println!("  Passenger: {}", ticket.get_passenger());
    // Output: Passenger: Rahul Sharma

    // The ticket cannot outlive `passenger` or `train`
    // because it borrows from both
}

// ============================================================
// 5. LIFETIME ELISION RULES — When Rust Infers Lifetimes
// ============================================================
// WHY: Rust has 3 rules to infer lifetimes automatically.
// When these rules cover the case, you don't need to write 'a.
// This is why simple functions work without annotations.

// Rule 1: Each reference parameter gets its own lifetime
// fn foo(x: &str) becomes fn foo<'a>(x: &'a str)

// Rule 2: If there's exactly one input lifetime, it's applied to all outputs
// fn foo(x: &str) -> &str becomes fn foo<'a>(x: &'a str) -> &'a str

// Rule 3: If there's a &self or &mut self, self's lifetime is applied to outputs
// fn foo(&self, x: &str) -> &str uses self's lifetime for the return

fn demonstrate_elision_rules() {
    println!("\n--- 5. Lifetime Elision Rules ---");

    // Rule 1 + 2: One input reference -> output gets same lifetime
    fn first_word(s: &str) -> &str {
        // WHY: No 'a needed! Rule 1 gives s its own lifetime,
        // Rule 2 assigns that lifetime to the return value.
        let bytes = s.as_bytes();
        for (i, &byte) in bytes.iter().enumerate() {
            if byte == b' ' {
                return &s[..i];
            }
        }
        s
    }

    let station = String::from("New Delhi Railway Station");
    let first = first_word(&station);
    println!("  First word of '{}': {}", station, first);
    // Output: First word of 'New Delhi Railway Station': New

    // Rule 3: Methods with &self
    struct TrainSchedule {
        name: String,
        departure: String,
    }

    impl TrainSchedule {
        // Rule 3 applies: return lifetime = self's lifetime
        fn get_name(&self) -> &str {
            // WHY: No explicit lifetime needed! &self provides it.
            &self.name
        }

        fn info(&self) -> String {
            // WHY: Returns owned String, so no lifetime annotation needed
            format!("{} departs at {}", self.name, self.departure)
        }
    }

    let schedule = TrainSchedule {
        name: String::from("Shatabdi Express"),
        departure: String::from("06:00 AM"),
    };

    println!("  Train: {}", schedule.get_name());
    // Output: Train: Shatabdi Express
    println!("  Info: {}", schedule.info());
    // Output: Info: Shatabdi Express departs at 06:00 AM

    // When elision DOESN'T work (need explicit annotations):
    // - Two input references, ambiguous which lifetime the output uses
    // - That's when you write fn foo<'a>(x: &'a str, y: &'a str) -> &'a str
    println!("  (Elision covers most common patterns automatically)");
}

// ============================================================
// 6. STATIC LIFETIME — Lives Forever
// ============================================================
// WHY: 'static means the reference is valid for the entire
// program duration. String literals are always 'static because
// they're baked into the binary.

fn demonstrate_static_lifetime() {
    println!("\n--- 6. 'static Lifetime ---");

    // All string literals have 'static lifetime
    let station: &'static str = "Chhatrapati Shivaji Maharaj Terminus";
    // WHY: This string is embedded in the program binary.
    // It exists from start to finish of the program.

    println!("  Static station: {}", station);
    // Output: Static station: Chhatrapati Shivaji Maharaj Terminus

    // 'static in trait bounds
    fn print_static(s: &'static str) {
        println!("  Static string: {}", s);
    }

    print_static("Mumbai Central"); // string literal = 'static
    // Output: Static string: Mumbai Central

    // This would NOT work:
    // let dynamic = String::from("Dynamic");
    // print_static(&dynamic); // ERROR: not 'static

    // WHY: 'static doesn't mean "the reference lives forever in general."
    // It specifically means the DATA it points to lives for the
    // entire program. String::from creates heap data that gets
    // dropped, so it's NOT 'static.

    // Leaked values are 'static (but avoid this in production!)
    let leaked: &'static str = Box::leak(String::from("I live forever now").into_boxed_str());
    println!("  Leaked static: {}", leaked);
    // Output: Leaked static: I live forever now
    // WHY: Box::leak intentionally leaks memory, making it 'static.
    // The data will never be freed. Useful for global configs.

    // 'static as a trait bound (different meaning!)
    // T: 'static means T owns all its data (no non-static references)
    fn is_owned_type<T: 'static>(_val: T) {
        println!("  This type owns all its data (or has 'static refs)");
    }

    is_owned_type(String::from("owned"));
    // Output: This type owns all its data (or has 'static refs)

    is_owned_type(42i32); // integers are 'static
    // Output: This type owns all its data (or has 'static refs)
}

// ============================================================
// 7. MULTIPLE LIFETIME PARAMETERS
// ============================================================
// WHY: Sometimes different references have different lifetimes.
// You need multiple lifetime parameters to express this.

// 'a and 'b are independent lifetimes
fn pick_announcement<'a, 'b>(
    regular: &'a str,
    emergency: &'b str,
    is_emergency: bool,
) -> &'a str
where
    'b: 'a, // WHY: 'b outlives 'a — emergency lives at least as long as regular
{
    if is_emergency {
        // Safe because 'b: 'a means we can use emergency where 'a is expected
        emergency
    } else {
        regular
    }
}

// Struct with multiple lifetimes
#[derive(Debug)]
struct JourneyComparison<'a, 'b> {
    train_a: &'a str,
    train_b: &'b str,
}

impl<'a, 'b> JourneyComparison<'a, 'b> {
    fn compare(&self) -> String {
        format!(
            "Comparing '{}' ({} chars) vs '{}' ({} chars)",
            self.train_a,
            self.train_a.len(),
            self.train_b,
            self.train_b.len()
        )
    }
}

fn demonstrate_multiple_lifetimes() {
    println!("\n--- 7. Multiple Lifetime Parameters ---");

    let regular = String::from("Train delayed by 30 minutes");
    let emergency = String::from("EMERGENCY: Track maintenance ahead");

    let announcement = pick_announcement(&regular, &emergency, true);
    println!("  Announcement: {}", announcement);
    // Output: Announcement: EMERGENCY: Track maintenance ahead

    let normal_announcement = pick_announcement(&regular, &emergency, false);
    println!("  Normal: {}", normal_announcement);
    // Output: Normal: Train delayed by 30 minutes

    // Different lifetimes for struct fields
    let express_name = String::from("Rajdhani Express");
    let comparison;

    {
        let local_name = String::from("Mumbai Local");
        comparison = JourneyComparison {
            train_a: &express_name,
            train_b: &local_name,
        };
        println!("  {}", comparison.compare());
        // Output: Comparing 'Rajdhani Express' (16 chars) vs 'Mumbai Local' (12 chars)
    }
    // local_name is dropped here, so comparison can't be used after this
}

// ============================================================
// 8. LIFETIME BOUNDS ON GENERICS
// ============================================================
// WHY: When combining generics with lifetimes, you sometimes
// need to specify that a type parameter lives at least as long
// as a certain lifetime.

fn longest_with_announcement<'a, T>(
    x: &'a str,
    y: &'a str,
    announcement: T,
) -> &'a str
where
    T: fmt::Display, // T must implement Display
{
    println!("  Announcement: {}", announcement);
    if x.len() >= y.len() {
        x
    } else {
        y
    }
}

// A struct with both lifetime and generic type parameters
struct TicketHolder<'a, T>
where
    T: fmt::Display,
{
    name: &'a str,
    ticket_type: T,
}

impl<'a, T> TicketHolder<'a, T>
where
    T: fmt::Display,
{
    fn display_ticket(&self) -> String {
        format!("Passenger: {} | Ticket: {}", self.name, self.ticket_type)
    }
}

fn demonstrate_lifetime_bounds() {
    println!("\n--- 8. Lifetime Bounds on Generics ---");

    let train1 = "Vande Bharat Express";
    let train2 = "Tejas Express";

    let result = longest_with_announcement(
        train1,
        train2,
        "Comparing two premium trains!",
    );
    println!("  Longest: {}", result);
    // Output: Announcement: Comparing two premium trains!
    //         Longest: Vande Bharat Express

    let passenger_name = String::from("Priya Patel");
    let holder = TicketHolder {
        name: &passenger_name,
        ticket_type: "1AC Tatkal",
    };
    println!("  {}", holder.display_ticket());
    // Output: Passenger: Priya Patel | Ticket: 1AC Tatkal

    // With a numeric ticket type
    let holder2 = TicketHolder {
        name: &passenger_name,
        ticket_type: 42u32,
    };
    println!("  {}", holder2.display_ticket());
    // Output: Passenger: Priya Patel | Ticket: 42
}

// ============================================================
// 9. PRACTICAL PATTERNS — Real-World Lifetime Usage
// ============================================================

// Pattern 1: String parser that returns slices of the input
struct StationParser<'a> {
    input: &'a str,
    position: usize,
}

impl<'a> StationParser<'a> {
    fn new(input: &'a str) -> Self {
        StationParser { input, position: 0 }
    }

    fn next_station(&mut self) -> Option<&'a str> {
        // WHY: Returns a slice of the original input — same lifetime
        if self.position >= self.input.len() {
            return None;
        }

        let remaining = &self.input[self.position..];
        match remaining.find(',') {
            Some(comma_pos) => {
                let station = &self.input[self.position..self.position + comma_pos];
                self.position += comma_pos + 1;
                // Skip whitespace
                while self.position < self.input.len()
                    && self.input.as_bytes()[self.position] == b' '
                {
                    self.position += 1;
                }
                Some(station.trim())
            }
            None => {
                let station = &self.input[self.position..];
                self.position = self.input.len();
                Some(station.trim())
            }
        }
    }
}

// Pattern 2: Caching with lifetimes
struct RouteCache<'a> {
    routes: Vec<&'a str>,
}

impl<'a> RouteCache<'a> {
    fn new() -> Self {
        RouteCache { routes: Vec::new() }
    }

    fn add_route(&mut self, route: &'a str) {
        if !self.routes.contains(&route) {
            self.routes.push(route);
        }
    }

    fn get_routes(&self) -> &[&'a str] {
        &self.routes
    }
}

fn demonstrate_practical_patterns() {
    println!("\n--- 9. Practical Patterns ---");

    // Pattern 1: Parser
    let route_string = String::from("Mumbai, Pune, Lonavala, Karjat, Panvel");
    let mut parser = StationParser::new(&route_string);

    print!("  Stations:");
    while let Some(station) = parser.next_station() {
        print!(" [{}]", station);
    }
    println!();
    // Output: Stations: [Mumbai] [Pune] [Lonavala] [Karjat] [Panvel]

    // Pattern 2: Cache
    let route_a = String::from("Mumbai -> Delhi");
    let route_b = String::from("Chennai -> Bangalore");
    let route_c = String::from("Kolkata -> Patna");

    let mut cache = RouteCache::new();
    cache.add_route(&route_a);
    cache.add_route(&route_b);
    cache.add_route(&route_c);
    cache.add_route(&route_a); // Duplicate — won't be added

    println!("  Cached routes: {:?}", cache.get_routes());
    // Output: Cached routes: ["Mumbai -> Delhi", "Chennai -> Bangalore", "Kolkata -> Patna"]
}

// ============================================================
// 10. COMMON LIFETIME MISTAKES AND FIXES
// ============================================================

fn demonstrate_common_mistakes() {
    println!("\n--- 10. Common Mistakes & Fixes ---");

    // Mistake 1: Returning a reference to a local variable
    // fn bad() -> &str {
    //     let s = String::from("hello");
    //     &s // ERROR: s is dropped at end of function
    // }
    // Fix: Return an owned String instead
    fn good() -> String {
        let s = String::from("hello");
        s // Move ownership out
    }
    println!("  Fix 1 (return owned): {}", good());
    // Output: Fix 1 (return owned): hello

    // Mistake 2: Struct outliving its references
    // Fix: Ensure the data lives longer than the struct
    let long_lived = String::from("I live long");
    {
        let ticket = TatkalTicket {
            passenger_name: &long_lived, // long_lived outlives this block
            train_name: "Express",       // string literal = 'static
            pnr: String::from("PNR-123"),
        };
        println!("  Fix 2 (scope): {}", ticket);
        // Output: Fix 2 (scope): [PNR-123] I live long -> Express
    }

    // Mistake 3: Thinking lifetimes extend data's life
    // They DON'T. Lifetimes are purely descriptive.
    println!("  Lifetimes describe relationships; they don't extend data's life.");
}

// ============================================================
// MAIN — Putting It All Together
// ============================================================
fn main() {
    println!("=== RUST LIFETIMES: Tatkal Ticket Validity ===\n");

    demonstrate_dangling_problem();
    demonstrate_lifetime_annotations();
    demonstrate_function_lifetimes();
    demonstrate_struct_lifetimes();
    demonstrate_elision_rules();
    demonstrate_static_lifetime();
    demonstrate_multiple_lifetimes();
    demonstrate_lifetime_bounds();
    demonstrate_practical_patterns();
    demonstrate_common_mistakes();

    // ============================================================
    // KEY TAKEAWAYS
    // ============================================================
    println!("\n=== KEY TAKEAWAYS ===");
    println!("1. Lifetimes prevent dangling references at compile time");
    println!("2. 'a annotations DESCRIBE relationships, don't change them");
    println!("3. The compiler picks the SHORTER lifetime when 'a is shared");
    println!("4. Structs with references need lifetime annotations");
    println!("5. Elision rules cover most cases (you rarely write 'a)");
    println!("6. 'static means data lives for the entire program");
    println!("7. String literals are always 'static");
    println!("8. Multiple lifetime params for independent reference lifetimes");
    println!("9. T: 'a means T's references must outlive 'a");
    println!("10. When in doubt, return owned types instead of references");
}
