// ============================================================
//  FILE 3 : Data Types
// ============================================================
//  Topic  : i32, f64, bool, char, tuples, arrays, casting,
//           type aliases, unit type, numeric limits
//
//  WHY THIS MATTERS:
//  Rust is statically typed — every value has a known type at
//  compile time. Unlike JavaScript's "everything is a number,"
//  Rust gives you precise control over size and signedness.
//  Wrong types = compile error, not runtime surprise.
// ============================================================

// ============================================================
// STORY: Sharma Ji's Kirana Store Inventory
//
// Sharma ji runs a kirana (grocery) store in Varanasi.
// He tracks everything precisely:
// - Packet count (u32) — can't have negative packets
// - Weight in kg (f64) — needs decimal precision
// - Is the store open? (bool) — yes or no
// - Store grade rating (char) — 'A', 'B', 'C'
// - Daily sales (array) — fixed 7 days a week
// - Item details (tuple) — (name, price, quantity)
//
// Sharma ji says: "Galat type = galat hisaab!"
// (Wrong type = wrong accounting!)
// ============================================================

fn main() {
    // ──────────────────────────────────────────────────────────
    // SECTION 1 — Integer Types: Counting Packets
    // ──────────────────────────────────────────────────────────
    // WHY: Rust has signed (i) and unsigned (u) integers
    // in sizes: 8, 16, 32, 64, 128 bits, plus isize/usize.
    //
    // | Type | Size    | Range                          |
    // |------|---------|--------------------------------|
    // | i8   | 1 byte  | -128 to 127                    |
    // | i16  | 2 bytes | -32,768 to 32,767              |
    // | i32  | 4 bytes | -2.1B to 2.1B (default)        |
    // | i64  | 8 bytes | -9.2 quintillion to 9.2Q       |
    // | i128 | 16 bytes| huge range                     |
    // | u8   | 1 byte  | 0 to 255                       |
    // | u16  | 2 bytes | 0 to 65,535                    |
    // | u32  | 4 bytes | 0 to 4.2B                      |
    // | u64  | 8 bytes | 0 to 18.4 quintillion          |
    // | u128 | 16 bytes| huge range                     |
    // | isize| arch    | pointer-sized signed           |
    // | usize| arch    | pointer-sized unsigned (index)  |

    let rice_packets: i32 = 150;       // default integer type
    let atta_packets: u32 = 200;       // unsigned — no negatives
    let tiny_count: u8 = 255;          // max for u8
    let big_stock: i64 = 1_000_000;    // underscores for readability

    println!("Rice: {}, Atta: {}", rice_packets, atta_packets);
    // Output: Rice: 150, Atta: 200

    // Numeric literals
    let decimal = 98_222;          // decimal with separator
    let hex = 0xff;                // hexadecimal
    let octal = 0o77;             // octal
    let binary = 0b1111_0000;     // binary
    let byte: u8 = b'A';         // byte (u8 only)

    println!("Hex: {}, Octal: {}, Binary: {}, Byte: {}",
             hex, octal, binary, byte);
    // Output: Hex: 255, Octal: 63, Binary: 240, Byte: 65

    // Integer limits
    println!("i32 range: {} to {}", i32::MIN, i32::MAX);
    // Output: i32 range: -2147483648 to 2147483647

    println!("u8 range: {} to {}", u8::MIN, u8::MAX);
    // Output: u8 range: 0 to 255

    // Overflow handling
    let max_u8: u8 = 255;
    // let overflow: u8 = max_u8 + 1;  // PANIC in debug, wraps in release

    // Safe overflow methods
    println!("Wrapping: {}", max_u8.wrapping_add(1));    // Output: Wrapping: 0
    println!("Saturating: {}", max_u8.saturating_add(1)); // Output: Saturating: 255
    println!("Checked: {:?}", max_u8.checked_add(1));     // Output: Checked: None
    println!("Overflowing: {:?}", max_u8.overflowing_add(1)); // Output: Overflowing: (0, true)

    // ──────────────────────────────────────────────────────────
    // SECTION 2 — Floating Point: Weighing Goods
    // ──────────────────────────────────────────────────────────
    // WHY: f64 (default) gives double precision; f32 is faster
    // but less precise. Use f64 unless you have a reason not to.

    let rice_kg: f64 = 25.75;      // double precision (default)
    let sugar_kg: f32 = 10.5;      // single precision

    println!("Rice: {} kg, Sugar: {} kg", rice_kg, sugar_kg);
    // Output: Rice: 25.75 kg, Sugar: 10.5 kg

    // Arithmetic
    let total_weight = rice_kg + 10.25;
    let price_per_kg = 45.50_f64;
    let total_cost = rice_kg * price_per_kg;

    println!("Total weight: {} kg", total_weight);
    // Output: Total weight: 36 kg
    println!("Rice cost: ₹{:.2}", total_cost);
    // Output: Rice cost: ₹1171.63

    // Float gotchas
    // 0.1 + 0.2 != 0.3 in floating point (IEEE 754)
    println!("0.1 + 0.2 = {}", 0.1_f64 + 0.2);
    // Output: 0.1 + 0.2 = 0.30000000000000004

    // Float methods
    let pi = std::f64::consts::PI;
    println!("PI: {:.4}", pi);               // Output: PI: 3.1416
    println!("Floor: {}", 3.7_f64.floor());  // Output: Floor: 3
    println!("Ceil: {}", 3.2_f64.ceil());    // Output: Ceil: 4
    println!("Round: {}", 3.5_f64.round());  // Output: Round: 4
    println!("Abs: {}", (-5.5_f64).abs());   // Output: Abs: 5.5
    println!("Sqrt: {}", 16.0_f64.sqrt());   // Output: Sqrt: 4
    println!("Pow: {}", 2.0_f64.powi(10));   // Output: Pow: 1024

    // NaN and Infinity
    let nan = f64::NAN;
    let inf = f64::INFINITY;
    println!("NaN == NaN: {}", nan == nan);   // Output: NaN == NaN: false
    println!("Is NaN: {}", nan.is_nan());     // Output: Is NaN: true
    println!("Is infinite: {}", inf.is_infinite()); // Output: Is infinite: true

    // ──────────────────────────────────────────────────────────
    // SECTION 3 — Boolean: Store Open/Closed
    // ──────────────────────────────────────────────────────────
    // WHY: bool is 1 byte, holds true or false. Used in
    // conditions, flags, and logical operations.

    let store_open: bool = true;
    let stock_empty = false;       // type inferred

    println!("Store open: {}, Stock empty: {}", store_open, stock_empty);
    // Output: Store open: true, Stock empty: false

    // Logical operators
    let can_sell = store_open && !stock_empty;
    let should_reorder = stock_empty || rice_packets < 10;
    println!("Can sell: {}, Reorder: {}", can_sell, should_reorder);
    // Output: Can sell: true, Reorder: false

    // bool to integer
    let open_as_num = store_open as i32;
    println!("Open as number: {}", open_as_num);
    // Output: Open as number: 1

    // ──────────────────────────────────────────────────────────
    // SECTION 4 — Character: Store Grading
    // ──────────────────────────────────────────────────────────
    // WHY: char in Rust is 4 bytes — it holds any Unicode
    // scalar value, not just ASCII. This is different from
    // C's 1-byte char!

    let grade: char = 'A';
    let emoji = '🏪';
    let hindi = 'अ';
    let tab = '\t';

    println!("Grade: {}, Emoji: {}, Hindi: {}", grade, emoji, hindi);
    // Output: Grade: A, Emoji: 🏪, Hindi: अ

    // char methods
    println!("Is alphabetic: {}", 'R'.is_alphabetic());  // Output: Is alphabetic: true
    println!("Is digit: {}", '5'.is_ascii_digit());       // Output: Is digit: true
    println!("Uppercase: {}", 'a'.to_uppercase().next().unwrap()); // Output: Uppercase: A
    println!("Is whitespace: {}", ' '.is_whitespace());   // Output: Is whitespace: true

    // char vs string
    // 'A' → char (single Unicode scalar, 4 bytes)
    // "A" → &str (string slice, 1+ bytes + length + pointer)

    // ──────────────────────────────────────────────────────────
    // SECTION 5 — Tuples: Item Details (name, price, qty)
    // ──────────────────────────────────────────────────────────
    // WHY: Tuples group different types into one compound type.
    // Fixed length — once declared, can't grow or shrink.

    let item: (&str, f64, u32) = ("Toor Dal", 120.50, 30);

    // Access by index (0-based)
    println!("Item: {}, Price: ₹{}, Qty: {}",
             item.0, item.1, item.2);
    // Output: Item: Toor Dal, Price: ₹120.5, Qty: 30

    // Destructuring
    let (name, price, qty) = item;
    println!("{} × {} = ₹{:.2}", name, qty, price * qty as f64);
    // Output: Toor Dal × 30 = ₹3615.00

    // Mutable tuple
    let mut stock = ("Rice", 50);
    stock.1 = 45; // sold 5 bags
    println!("{}: {} bags left", stock.0, stock.1);
    // Output: Rice: 45 bags left

    // Unit type () — empty tuple, like void
    let nothing: () = ();
    println!("Unit: {:?}", nothing);
    // Output: Unit: ()

    // Functions with no return value return ()
    // fn do_something() → same as fn do_something() -> ()

    // Nested tuples
    let store_info = ("Sharma Kirana", (26.85, 80.91), true);
    println!("Store: {}, Lat: {}", store_info.0, (store_info.1).0);
    // Output: Store: Sharma Kirana, Lat: 26.85

    // ──────────────────────────────────────────────────────────
    // SECTION 6 — Arrays: Weekly Sales [fixed size]
    // ──────────────────────────────────────────────────────────
    // WHY: Arrays are fixed-size, stack-allocated collections
    // of the SAME type. Use Vec<T> for dynamic sizing.

    // Type: [T; N] where T is type, N is length
    let daily_sales: [i32; 7] = [1200, 1500, 800, 2000, 1800, 2500, 900];

    println!("Monday sales: ₹{}", daily_sales[0]);
    // Output: Monday sales: ₹1200

    println!("Sunday sales: ₹{}", daily_sales[6]);
    // Output: Sunday sales: ₹900

    // Array length
    println!("Days tracked: {}", daily_sales.len());
    // Output: Days tracked: 7

    // Initialize with same value
    let zeros = [0; 5];        // [0, 0, 0, 0, 0]
    let dashes = ['-'; 10];    // ['-', '-', ... x10]
    println!("Zeros: {:?}", zeros);
    // Output: Zeros: [0, 0, 0, 0, 0]

    // Mutable array
    let mut prices = [10, 20, 30, 40, 50];
    prices[2] = 35; // update index 2
    println!("Updated prices: {:?}", prices);
    // Output: Updated prices: [10, 20, 35, 40, 50]

    // Array slicing
    let first_three = &daily_sales[0..3];
    println!("First 3 days: {:?}", first_three);
    // Output: First 3 days: [1200, 1500, 800]

    // Bounds checking (runtime panic if out of bounds)
    // let oob = daily_sales[10];  // PANIC: index out of bounds

    // Safe access with .get()
    match daily_sales.get(10) {
        Some(val) => println!("Day 10: {}", val),
        None => println!("Day 10: doesn't exist!"),
    }
    // Output: Day 10: doesn't exist!

    // Array methods
    println!("Contains 2000? {}", daily_sales.contains(&2000));
    // Output: Contains 2000? true

    let mut sortable = [5, 3, 8, 1, 9];
    sortable.sort();
    println!("Sorted: {:?}", sortable);
    // Output: Sorted: [1, 3, 5, 8, 9]

    // Iterating
    print!("Sales: ");
    for sale in &daily_sales {
        print!("₹{} ", sale);
    }
    println!();
    // Output: Sales: ₹1200 ₹1500 ₹800 ₹2000 ₹1800 ₹2500 ₹900

    // Sum using iterator
    let total: i32 = daily_sales.iter().sum();
    println!("Weekly total: ₹{}", total);
    // Output: Weekly total: ₹10700

    // ──────────────────────────────────────────────────────────
    // SECTION 7 — Type Casting: Converting Between Types
    // ──────────────────────────────────────────────────────────
    // WHY: Rust NEVER implicitly converts types. You must
    // explicitly cast using `as`. This prevents subtle bugs.

    let packets: i32 = 42;
    let packets_f64 = packets as f64;
    println!("Packets as f64: {}", packets_f64);
    // Output: Packets as f64: 42

    let price_float: f64 = 99.99;
    let price_int = price_float as i32; // truncates (not rounds!)
    println!("Price truncated: {}", price_int);
    // Output: Price truncated: 99

    // Careful with narrowing casts
    let big: i32 = 300;
    let small = big as u8; // wraps around: 300 % 256 = 44
    println!("300 as u8: {}", small);
    // Output: 300 as u8: 44

    // char <-> integer
    let letter = 'A';
    let ascii = letter as u32;
    println!("'A' as u32: {}", ascii);
    // Output: 'A' as u32: 65

    let back_to_char = 66u8 as char;
    println!("66 as char: {}", back_to_char);
    // Output: 66 as char: B

    // bool to integer
    println!("true as i32: {}", true as i32);   // Output: true as i32: 1
    println!("false as i32: {}", false as i32);  // Output: false as i32: 0

    // ──────────────────────────────────────────────────────────
    // SECTION 8 — Type Aliases: Shorthand Labels
    // ──────────────────────────────────────────────────────────
    // WHY: Type aliases create readable names for complex types.

    type Rupees = f64;
    type Quantity = u32;

    let dal_price: Rupees = 120.0;
    let dal_qty: Quantity = 5;
    let total_cost: Rupees = dal_price * dal_qty as Rupees;
    println!("Dal total: ₹{}", total_cost);
    // Output: Dal total: ₹600

    // ──────────────────────────────────────────────────────────
    // SECTION 9 — Numeric Operations: Daily Accounting
    // ──────────────────────────────────────────────────────────
    // WHY: Know all arithmetic operators and their behavior.

    let a = 17;
    let b = 5;

    println!("Add: {} + {} = {}", a, b, a + b);       // Output: Add: 17 + 5 = 22
    println!("Sub: {} - {} = {}", a, b, a - b);       // Output: Sub: 17 - 5 = 12
    println!("Mul: {} * {} = {}", a, b, a * b);       // Output: Mul: 17 * 5 = 85
    println!("Div: {} / {} = {}", a, b, a / b);       // Output: Div: 17 / 5 = 3
    println!("Mod: {} % {} = {}", a, b, a % b);       // Output: Mod: 17 % 5 = 2

    // Integer division truncates
    println!("7 / 2 = {} (integer)", 7 / 2);      // Output: 7 / 2 = 3 (integer)
    println!("7.0 / 2.0 = {} (float)", 7.0 / 2.0); // Output: 7.0 / 2.0 = 3.5 (float)

    // Bitwise operators
    println!("AND: 0b1010 & 0b1100 = {:04b}", 0b1010u8 & 0b1100);
    // Output: AND: 0b1010 & 0b1100 = 1000
    println!("OR:  0b1010 | 0b1100 = {:04b}", 0b1010u8 | 0b1100);
    // Output: OR:  0b1010 | 0b1100 = 1110
    println!("XOR: 0b1010 ^ 0b1100 = {:04b}", 0b1010u8 ^ 0b1100);
    // Output: XOR: 0b1010 ^ 0b1100 = 0110
    println!("NOT: !0b1010u8 = {:08b}", !0b0000_1010u8);
    // Output: NOT: !0b1010u8 = 11110101
    println!("SHL: 1 << 3 = {}", 1u32 << 3);
    // Output: SHL: 1 << 3 = 8
    println!("SHR: 16 >> 2 = {}", 16u32 >> 2);
    // Output: SHR: 16 >> 2 = 4

    // ──────────────────────────────────────────────────────────
    // SECTION 10 — Size & Memory: Knowing Your Shelves
    // ──────────────────────────────────────────────────────────
    // WHY: Understanding memory sizes helps with performance
    // and choosing the right type.

    println!("\n--- Type sizes ---");
    println!("bool:  {} byte", std::mem::size_of::<bool>());   // 1
    println!("char:  {} bytes", std::mem::size_of::<char>());  // 4
    println!("i8:    {} byte", std::mem::size_of::<i8>());     // 1
    println!("i32:   {} bytes", std::mem::size_of::<i32>());   // 4
    println!("i64:   {} bytes", std::mem::size_of::<i64>());   // 8
    println!("f32:   {} bytes", std::mem::size_of::<f32>());   // 4
    println!("f64:   {} bytes", std::mem::size_of::<f64>());   // 8
    println!("usize: {} bytes", std::mem::size_of::<usize>()); // 8 on 64-bit
    println!("():    {} bytes", std::mem::size_of::<()>());    // 0
    println!("[i32; 5]: {} bytes", std::mem::size_of::<[i32; 5]>()); // 20
    println!("(i32, f64): {} bytes", std::mem::size_of::<(i32, f64)>()); // 16

    println!("\n--- Sharma ji's inventory is balanced! ---");
}

// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. i32 is the default integer, f64 is the default float
// 2. Unsigned types (u8, u32...) can't hold negatives
// 3. char is 4 bytes — full Unicode, not just ASCII
// 4. Tuples group different types; arrays group same types
// 5. Arrays are fixed-size and stack-allocated: [T; N]
// 6. Rust NEVER converts types implicitly — use `as`
// 7. Narrowing casts (i32 → u8) can silently wrap/truncate
// 8. Use checked_add/saturating_add for safe overflow handling
// 9. .get(index) returns Option<&T> instead of panicking
// 10. Sharma ji's rule: "Galat type = galat hisaab! Pick the
//     right shelf (type) for every item, and your inventory
//     will always balance perfectly."
// ============================================================
