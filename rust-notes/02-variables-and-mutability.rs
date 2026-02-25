// ============================================================
//  FILE 2 : Variables & Mutability
// ============================================================
//  Topic  : let, mut, shadowing, const, static, type inference,
//           naming conventions, unused variables
//
//  WHY THIS MATTERS:
//  Rust variables are immutable by default — this is a
//  deliberate design choice that prevents accidental mutation
//  bugs. Understanding let vs mut vs const vs static is the
//  foundation for writing safe, predictable Rust code.
// ============================================================

// ============================================================
// STORY: Amma's Recipe Book — Carved vs Changeable
//
// Amma has two kinds of recipes in her kitchen:
// - Carved in stone (const): Turmeric in dal = always 1 tsp.
//   This NEVER changes. Period.
// - Written in pencil (let mut): Sugar in payasam = depends
//   on who's coming. Adjust as needed.
// - Written in pen (let): Once decided, you don't erase it.
//   But you CAN write a fresh copy (shadowing).
//
// Amma's rule: "Don't change things unless you HAVE to."
// Rust agrees — immutable by default, mutable by choice.
// ============================================================

// Constants must be declared outside or inside fn — always uppercase
const AMMA_TURMERIC_TSP: f64 = 1.0;       // Carved in stone
const MAX_GUESTS: u32 = 50;                // Fire safety limit
const PI: f64 = 3.14159265358979;

// Static variables — live for the entire program lifetime
// Unlike const, static has a fixed memory address
static KITCHEN_NAME: &str = "Amma's Kitchen";
static mut DISHES_SERVED: u32 = 0; // mutable static — unsafe to access!

fn main() {
    // ──────────────────────────────────────────────────────────
    // SECTION 1 — Immutable Variables: Written in Pen
    // ──────────────────────────────────────────────────────────
    // WHY: Immutability by default prevents accidental changes.
    // The compiler catches mutation attempts at compile time.

    let dal_servings = 4;
    println!("Dal servings: {}", dal_servings);
    // Output: Dal servings: 4

    // dal_servings = 6;  // ERROR: cannot assign twice to immutable variable
    // Amma wrote it in pen — can't erase it!

    let guest_name = "Sharma ji";
    println!("Guest: {}", guest_name);
    // Output: Guest: Sharma ji

    // ──────────────────────────────────────────────────────────
    // SECTION 2 — Mutable Variables: Written in Pencil
    // ──────────────────────────────────────────────────────────
    // WHY: When you genuinely need to change a value, use mut.
    // It signals intent: "I know this will change."

    let mut sugar_tsp = 2.0;
    println!("Sugar for Amma: {} tsp", sugar_tsp);
    // Output: Sugar for Amma: 2 tsp

    sugar_tsp = 3.5; // Sharma ji likes it sweeter
    println!("Sugar for Sharma ji: {} tsp", sugar_tsp);
    // Output: Sugar for Sharma ji: 3.5 tsp

    sugar_tsp += 0.5; // compound assignment works too
    println!("Extra sweet: {} tsp", sugar_tsp);
    // Output: Extra sweet: 4 tsp

    // Mutable string
    let mut shopping_list = String::from("Rice");
    shopping_list.push_str(", Dal");
    shopping_list.push_str(", Ghee");
    println!("Shopping: {}", shopping_list);
    // Output: Shopping: Rice, Dal, Ghee

    // ──────────────────────────────────────────────────────────
    // SECTION 3 — Shadowing: Writing a Fresh Copy
    // ──────────────────────────────────────────────────────────
    // WHY: Shadowing lets you reuse a name with a new value
    // (and even a new TYPE). It's not mutation — it's a
    // completely new variable that "shadows" the old one.

    let guests = 5;
    println!("Expected guests: {}", guests);
    // Output: Expected guests: 5

    let guests = guests + 3; // shadow with new value
    println!("Updated guests: {}", guests);
    // Output: Updated guests: 8

    let guests = "eight"; // shadow with new TYPE — this is fine!
    println!("Guests (word): {}", guests);
    // Output: Guests (word): eight

    // This would NOT work with mut:
    // let mut count = 5;
    // count = "five";  // ERROR: mismatched types

    // Shadowing in inner scope
    let spice_level = "medium";
    {
        let spice_level = "extra hot"; // shadows only in this block
        println!("Inside block: {}", spice_level);
        // Output: Inside block: extra hot
    }
    println!("Outside block: {}", spice_level);
    // Output: Outside block: medium

    // Practical use: parsing string to number
    let price = "150";
    let price: i32 = price.parse().expect("Not a number!");
    println!("Price (parsed): ₹{}", price);
    // Output: Price (parsed): ₹150

    // ──────────────────────────────────────────────────────────
    // SECTION 4 — Constants: Carved in Stone
    // ──────────────────────────────────────────────────────────
    // WHY: Constants are compile-time values. They're inlined
    // everywhere they're used — no memory allocation.
    // MUST have type annotation. MUST be a constant expression.

    println!("Turmeric: {} tsp (always)", AMMA_TURMERIC_TSP);
    // Output: Turmeric: 1 tsp (always)

    println!("Max guests: {}", MAX_GUESTS);
    // Output: Max guests: 50

    // const in local scope — also valid
    const SALT_PINCH: u32 = 2;
    println!("Salt: {} pinches", SALT_PINCH);
    // Output: Salt: 2 pinches

    // const vs let:
    // - const: MUST have type, evaluated at compile time
    // - let: type can be inferred, evaluated at runtime
    // - const: SCREAMING_SNAKE_CASE by convention
    // - let: snake_case by convention

    // ──────────────────────────────────────────────────────────
    // SECTION 5 — Static Variables: The Permanent Fixture
    // ──────────────────────────────────────────────────────────
    // WHY: static lives for the entire program. Unlike const,
    // it has a fixed memory address (can take references).
    // Mutable statics are unsafe — Rust can't guarantee
    // thread safety for them.

    println!("Kitchen: {}", KITCHEN_NAME);
    // Output: Kitchen: Amma's Kitchen

    // Accessing mutable static requires unsafe block
    unsafe {
        DISHES_SERVED += 1;
        println!("Dishes served: {}", DISHES_SERVED);
        // Output: Dishes served: 1
    }
    // In practice, prefer AtomicU32 or Mutex over mutable static

    // const vs static:
    // const → inlined, no fixed address, duplicated at use sites
    // static → single memory location, has address, 'static lifetime

    // ──────────────────────────────────────────────────────────
    // SECTION 6 — Type Inference: Amma Knows Best
    // ──────────────────────────────────────────────────────────
    // WHY: Rust infers types from context — you don't always
    // need to write them. But you CAN annotate for clarity.

    let servings = 4;          // inferred as i32 (default integer)
    let temperature = 98.6;    // inferred as f64 (default float)
    let is_ready = true;       // inferred as bool
    let initial = 'A';         // inferred as char

    // Explicit type annotation
    let servings_explicit: u32 = 4;
    let temperature_f: f32 = 98.6;

    // Type annotation required when ambiguous
    let parsed: i64 = "42".parse().expect("parse failed");
    println!("Parsed: {}", parsed);
    // Output: Parsed: 42

    // Turbofish syntax ::<Type> — alternative to annotation
    let parsed_turbo = "100".parse::<u32>().expect("parse failed");
    println!("Turbofish: {}", parsed_turbo);
    // Output: Turbofish: 100

    // ──────────────────────────────────────────────────────────
    // SECTION 7 — Naming Conventions: Kitchen Labels
    // ──────────────────────────────────────────────────────────
    // WHY: Rust has strict naming conventions enforced by
    // compiler warnings. Follow them for idiomatic code.

    // snake_case     → variables, functions, modules, file names
    let guest_count = 10;

    // SCREAMING_SNAKE_CASE → constants, statics
    // const MAX_TEMP: f64 = 100.0;

    // CamelCase      → types, traits, enums, structs
    // struct GuestList { ... }

    // _prefix        → unused variables (suppresses warnings)
    let _unused_spice = "cardamom";
    // No warning! The _ tells Rust "I know this is unused"

    // Single _ discards the value entirely
    let _ = complex_calculation();

    println!("Guest count: {}", guest_count);
    // Output: Guest count: 10

    // ──────────────────────────────────────────────────────────
    // SECTION 8 — Destructuring: Unpacking the Dabba
    // ──────────────────────────────────────────────────────────
    // WHY: Destructuring lets you break apart tuples, arrays,
    // and structs into individual variables in one step.

    // Tuple destructuring
    let recipe = ("Sambar", 30, true); // (name, minutes, is_veg)
    let (dish, time, veg) = recipe;
    println!("{}: {} min, veg={}", dish, time, veg);
    // Output: Sambar: 30 min, veg=true

    // Ignore parts with _
    let (name, _, _) = recipe;
    println!("Just the name: {}", name);
    // Output: Just the name: Sambar

    // Array destructuring
    let meals = ["Breakfast", "Lunch", "Dinner"];
    let [morning, afternoon, evening] = meals;
    println!("Evening meal: {}", evening);
    // Output: Evening meal: Dinner

    // ──────────────────────────────────────────────────────────
    // SECTION 9 — Multiple Assignment & Swap
    // ──────────────────────────────────────────────────────────
    // WHY: Practical patterns you'll use daily.

    // Multiple let bindings
    let (x, y, z) = (1, 2, 3);
    println!("x={}, y={}, z={}", x, y, z);
    // Output: x=1, y=2, z=3

    // Swap values using tuple destructuring
    let mut a = "Idli";
    let mut b = "Dosa";
    println!("Before swap: a={}, b={}", a, b);
    // Output: Before swap: a=Idli, b=Dosa

    // Rust's swap using std::mem::swap
    std::mem::swap(&mut a, &mut b);
    println!("After swap: a={}, b={}", a, b);
    // Output: After swap: a=Dosa, b=Idli

    // ──────────────────────────────────────────────────────────
    // SECTION 10 — Scope & Blocks: Kitchen Zones
    // ──────────────────────────────────────────────────────────
    // WHY: Variables live only within their scope (block).
    // When the block ends, the variable is dropped.

    {
        let kitchen_temp = 42;
        println!("Inside kitchen: {}°C", kitchen_temp);
        // Output: Inside kitchen: 42°C
    }
    // println!("{}", kitchen_temp);  // ERROR: not found in this scope

    // Block expressions — blocks return their last expression
    let dinner_status = {
        let guests = 8;
        let dishes = 5;
        if guests > dishes { "Need more food!" } else { "We're good" }
        // No semicolon on last line → it's the return value
    };
    println!("Status: {}", dinner_status);
    // Output: Status: Need more food!

    // ──────────────────────────────────────────────────────────
    // SECTION 11 — Common Patterns & Gotchas
    // ──────────────────────────────────────────────────────────
    // WHY: Know the pitfalls before they bite you.

    // GOTCHA 1: Uninitialized variables
    let total: i32;
    // println!("{}", total);  // ERROR: used before initialization
    total = 42; // Must initialize before use
    println!("Total: {}", total);
    // Output: Total: 42

    // GOTCHA 2: Type changes need shadowing, not mut
    let input = "123";
    // input = 123;  // ERROR: mismatched types (if input is mut)
    let input: i32 = input.parse().unwrap(); // Shadow instead
    println!("Input: {}", input);
    // Output: Input: 123

    // GOTCHA 3: Unused variables generate warnings
    // let x = 5;   // WARNING: unused variable
    let _x = 5;     // OK: prefixed with _

    // PATTERN: Builder-style accumulation
    let mut order = String::new();
    order.push_str("1x Chai");
    order.push_str(", 2x Samosa");
    order.push_str(", 1x Jalebi");
    println!("Order: {}", order);
    // Output: Order: 1x Chai, 2x Samosa, 1x Jalebi

    println!("\n--- Amma's kitchen is ready to serve! ---");
}

// Helper function for Section 7
fn complex_calculation() -> i32 {
    42
}

// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. Variables are IMMUTABLE by default — use mut to opt in
// 2. Shadowing creates a NEW variable (can change type)
// 3. mut changes the VALUE but not the TYPE
// 4. const = compile-time, inlined, SCREAMING_SNAKE_CASE
// 5. static = fixed address, 'static lifetime, mutable = unsafe
// 6. Rust infers types but you can annotate explicitly
// 7. _prefix suppresses unused variable warnings
// 8. Block expressions return their last expression (no ;)
// 9. Variables are dropped when they go out of scope
// 10. Amma's kitchen rule: "Write in pen (let) by default.
//     Use pencil (mut) only when you MUST change it.
//     Carve in stone (const) what should NEVER change."
// ============================================================
