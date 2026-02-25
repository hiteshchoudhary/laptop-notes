// ============================================================
// 14 - GENERICS IN RUST
// ============================================================
// WHY THIS MATTERS:
// Generics let you write ONE function, struct, or enum that works
// with MANY types. Without generics, you'd write find_max_i32,
// find_max_f64, find_max_string — duplicating logic endlessly.
// Rust generics are "zero cost" — the compiler generates
// specialized code for each type used (monomorphization), so
// generic code is just as fast as hand-written specific code.
// Vec<T>, Option<T>, Result<T,E>, HashMap<K,V> — all generic!
// ============================================================

// ============================================================
// STORY: The Chai Tapri Menu Template
// ============================================================
// At a chai tapri (tea stall) in Pune, the owner has a menu
// template printed on a board:
//
//   "_______ Chai — Rs. ___"
//
// He fills in the blanks for different types:
//   "Masala Chai — Rs. 15"
//   "Ginger Chai — Rs. 20"
//   "Cutting Chai — Rs. 10"
//
// The TEMPLATE is the same. The CONTENT changes. That's generics.
// The template doesn't care what goes in the blank — it just
// needs something that fits. In Rust, type parameters (like T)
// are the blanks. Type bounds (like T: Display) say what "fits."
//
// When the owner PRINTS the menu, he creates concrete versions
// for each chai type. The Rust compiler does the same —
// generating optimized code for each type used. This is
// monomorphization: zero runtime cost for generic abstraction.
// ============================================================

use std::fmt;

// ============================================================
// 1. GENERIC FUNCTIONS
// ============================================================
// WHY: Write a function once, use it with any type. The type
// parameter T is determined at compile time by how you call it.

// WHY: This function works for ANY type that can be compared and printed.
fn find_largest<T: PartialOrd + fmt::Display>(list: &[T]) -> &T {
    let mut largest = &list[0];
    for item in &list[1..] {
        if item > largest {
            largest = item;
        }
    }
    largest
}

// WHY: Multiple type parameters — T and U can be different types.
fn make_pair<T: fmt::Debug, U: fmt::Debug>(first: T, second: U) -> (T, U) {
    println!("  Creating pair: ({:?}, {:?})", first, second);
    (first, second)
}

fn demo_generic_functions() {
    println!("=== 1. Generic Functions ===\n");

    // WHY: Same function works for i32, f64, and &str.
    let numbers = vec![34, 50, 25, 100, 65];
    println!("Largest number: {}", find_largest(&numbers));
    // Output: Largest number: 100

    let decimals = vec![2.5, 7.8, 1.2, 9.3, 4.5];
    println!("Largest decimal: {}", find_largest(&decimals));
    // Output: Largest decimal: 9.3

    let words = vec!["Masala", "Ginger", "Cutting", "Tandoori"];
    println!("Largest word: {}", find_largest(&words));
    // Output: Largest word: Tandoori

    // WHY: make_pair accepts different types for each position.
    let pair1 = make_pair(42, "hello");
    // Output:   Creating pair: (42, "hello")
    let pair2 = make_pair(String::from("Chai"), 15.5);
    // Output:   Creating pair: ("Chai", 15.5)
    println!("Pair 1: {:?}", pair1);    // Output: Pair 1: (42, "hello")
    println!("Pair 2: {:?}", pair2);    // Output: Pair 2: ("Chai", 15.5)
}

// ============================================================
// 2. GENERIC STRUCTS
// ============================================================
// WHY: Structs with type parameters can hold any type of data.
// Think of Point<f64> for coordinates, Point<i32> for pixels.

#[derive(Debug)]
struct MenuItem<T> {
    name: String,
    price: f64,
    extra_info: T,
}

impl<T: fmt::Debug> MenuItem<T> {
    fn new(name: &str, price: f64, extra_info: T) -> Self {
        Self {
            name: String::from(name),
            price,
            extra_info,
        }
    }

    fn display(&self) {
        println!("  {} - Rs. {:.2} (info: {:?})", self.name, self.price, self.extra_info);
    }
}

// WHY: Multiple type parameters in a struct.
#[derive(Debug)]
struct Pair<T, U> {
    first: T,
    second: U,
}

impl<T: fmt::Display, U: fmt::Display> Pair<T, U> {
    fn show(&self) {
        println!("  ({}, {})", self.first, self.second);
    }
}

// WHY: You can implement methods only for SPECIFIC type combinations.
impl Pair<String, f64> {
    fn as_price_tag(&self) -> String {
        format!("{}: Rs. {:.2}", self.first, self.second)
    }
}

fn demo_generic_structs() {
    println!("\n=== 2. Generic Structs ===\n");

    // WHY: Same struct, different extra_info types.
    let chai = MenuItem::new("Masala Chai", 15.0, "Contains ginger and cardamom");
    let samosa = MenuItem::new("Samosa", 12.0, 250_u32); // calories as u32
    let thali = MenuItem::new("Thali", 120.0, vec!["Dal", "Rice", "Roti", "Sabzi"]);

    chai.display();
    // Output:   Masala Chai - Rs. 15.00 (info: "Contains ginger and cardamom")
    samosa.display();
    // Output:   Samosa - Rs. 12.00 (info: 250)
    thali.display();
    // Output:   Thali - Rs. 120.00 (info: ["Dal", "Rice", "Roti", "Sabzi"])

    // WHY: Pair with different type combinations.
    let coords = Pair { first: 19.076, second: 72.877 };
    coords.show();
    // Output:   (19.076, 72.877)

    let labeled = Pair { first: String::from("Chai"), second: 15.0 };
    println!("  Price tag: {}", labeled.as_price_tag());
    // Output:   Price tag: Chai: Rs. 15.00

    // WHY: This would NOT compile — as_price_tag only exists for Pair<String, f64>.
    // let int_pair = Pair { first: 1, second: 2 };
    // int_pair.as_price_tag(); // ERROR
}

// ============================================================
// 3. GENERIC ENUMS
// ============================================================
// WHY: Option<T> and Result<T,E> are generic enums! You can
// create your own to model generic scenarios.

#[derive(Debug)]
enum OrderStatus<T> {
    Pending,
    Processing(String),
    Completed(T),
    Failed(String),
}

impl<T: fmt::Debug> OrderStatus<T> {
    fn describe(&self) -> String {
        match self {
            OrderStatus::Pending => String::from("Order is pending"),
            OrderStatus::Processing(msg) => format!("Processing: {}", msg),
            OrderStatus::Completed(result) => format!("Completed with: {:?}", result),
            OrderStatus::Failed(err) => format!("Failed: {}", err),
        }
    }

    fn is_completed(&self) -> bool {
        matches!(self, OrderStatus::Completed(_))
    }
}

fn demo_generic_enums() {
    println!("\n=== 3. Generic Enums ===\n");

    // WHY: OrderStatus<String> for text results.
    let food_order: OrderStatus<String> = OrderStatus::Completed(String::from("Delivered to table 5"));
    println!("{}", food_order.describe());
    // Output: Completed with: "Delivered to table 5"

    // WHY: OrderStatus<u32> for numeric results (order ID).
    let online_order: OrderStatus<u32> = OrderStatus::Completed(98765);
    println!("{}", online_order.describe());
    // Output: Completed with: 98765

    // WHY: OrderStatus<Vec<String>> for complex results.
    let bulk_order: OrderStatus<Vec<String>> = OrderStatus::Completed(
        vec![String::from("Item A shipped"), String::from("Item B shipped")],
    );
    println!("{}", bulk_order.describe());
    // Output: Completed with: ["Item A shipped", "Item B shipped"]

    let pending: OrderStatus<String> = OrderStatus::Pending;
    let failed: OrderStatus<i32> = OrderStatus::Failed(String::from("Payment declined"));
    println!("{}", pending.describe());   // Output: Order is pending
    println!("{}", failed.describe());    // Output: Failed: Payment declined
    println!("Completed? {}", food_order.is_completed()); // Output: Completed? true
    println!("Completed? {}", pending.is_completed());    // Output: Completed? false
}

// ============================================================
// 4. TYPE CONSTRAINTS (BOUNDS)
// ============================================================
// WHY: Without bounds, T can be ANYTHING — you can't call methods
// on it. Bounds restrict T to types that have specific capabilities.

// WHY: T: PartialOrd means T must support comparison operators.
fn clamp<T: PartialOrd>(value: T, min: T, max: T) -> T {
    if value < min {
        min
    } else if value > max {
        max
    } else {
        value
    }
}

// WHY: Multiple bounds with + syntax.
fn print_if_positive<T: PartialOrd + Default + fmt::Display>(value: T) {
    if value > T::default() {
        println!("  Positive: {}", value);
    } else {
        println!("  Not positive: {}", value);
    }
}

// WHY: Trait bound on return type.
fn create_default_pair<T: Default + fmt::Debug>() -> (T, T) {
    (T::default(), T::default())
}

fn demo_type_constraints() {
    println!("\n=== 4. Type Constraints ===\n");

    // WHY: clamp works with any comparable type.
    println!("Clamp 15 to [0, 10]: {}", clamp(15, 0, 10));
    // Output: Clamp 15 to [0, 10]: 10
    println!("Clamp 3.5 to [1.0, 5.0]: {}", clamp(3.5, 1.0, 5.0));
    // Output: Clamp 3.5 to [1.0, 5.0]: 3.5
    println!("Clamp 'b' to ['a', 'f']: {}", clamp('b', 'a', 'f'));
    // Output: Clamp 'b' to ['a', 'f']: b

    // WHY: print_if_positive uses multiple trait bounds.
    print_if_positive(42);
    // Output:   Positive: 42
    print_if_positive(-5);
    // Output:   Not positive: -5
    print_if_positive(0.0);
    // Output:   Not positive: 0

    // WHY: create_default_pair uses Default trait.
    let int_pair: (i32, i32) = create_default_pair();
    let float_pair: (f64, f64) = create_default_pair();
    let string_pair: (String, String) = create_default_pair();
    println!("\nDefault pairs:");
    println!("  i32: {:?}", int_pair);       // Output:   i32: (0, 0)
    println!("  f64: {:?}", float_pair);     // Output:   f64: (0.0, 0.0)
    println!("  String: {:?}", string_pair); // Output:   String: ("", "")
}

// ============================================================
// 5. WHERE CLAUSE — CLEAN COMPLEX BOUNDS
// ============================================================
// WHY: When you have many type parameters with many bounds,
// inline syntax gets unreadable. The where clause puts bounds
// after the signature, keeping it clean.

// WHY: Without where — gets messy with complex bounds.
// fn complex<T: Clone + fmt::Debug + Default, U: Clone + PartialOrd>(t: T, u: U) -> T

// WHY: With where — much cleaner.
fn summarize<T, U>(items: &[T], transform: U) -> String
where
    T: fmt::Display,
    U: Fn(&T) -> String,
{
    items
        .iter()
        .map(|item| transform(item))
        .collect::<Vec<String>>()
        .join(", ")
}

fn merge_and_sort<T>(mut a: Vec<T>, mut b: Vec<T>) -> Vec<T>
where
    T: Ord + fmt::Debug,
{
    a.append(&mut b);
    a.sort();
    a
}

fn demo_where_clause() {
    println!("\n=== 5. Where Clause ===\n");

    let prices = vec![99.0_f64, 199.0, 499.0, 79.0];
    let result = summarize(&prices, |p| format!("Rs. {:.2}", p));
    println!("Prices: {}", result);
    // Output: Prices: Rs. 99.00, Rs. 199.00, Rs. 499.00, Rs. 79.00

    let names = vec!["Chai", "Samosa", "Pakora"];
    let result = summarize(&names, |n| n.to_uppercase());
    println!("Items: {}", result);
    // Output: Items: CHAI, SAMOSA, PAKORA

    let merged = merge_and_sort(vec![5, 3, 8], vec![1, 9, 4]);
    println!("Merged: {:?}", merged);
    // Output: Merged: [1, 3, 4, 5, 8, 9]
}

// ============================================================
// 6. MONOMORPHIZATION — ZERO-COST ABSTRACTION
// ============================================================
// WHY: Rust generics are compiled away. The compiler generates
// specialized versions for each concrete type used. Generic
// code has ZERO runtime overhead compared to hand-written
// type-specific code. This is unlike Java/C# where generics
// use type erasure and have boxing overhead.

fn add_values<T: std::ops::Add<Output = T>>(a: T, b: T) -> T {
    a + b
}

fn demo_monomorphization() {
    println!("\n=== 6. Monomorphization ===\n");

    // WHY: The compiler generates these behind the scenes:
    //   fn add_values_i32(a: i32, b: i32) -> i32 { a + b }
    //   fn add_values_f64(a: f64, b: f64) -> f64 { a + b }
    //   fn add_values_String(a: String, b: String) -> String { a + b }

    let int_sum = add_values(10, 20);
    println!("i32: {} + {} = {}", 10, 20, int_sum);
    // Output: i32: 10 + 20 = 30

    let float_sum = add_values(3.14, 2.86);
    println!("f64: {} + {} = {}", 3.14, 2.86, float_sum);
    // Output: f64: 3.14 + 2.86 = 6

    println!("\nMonomorphization explanation:");
    println!("  - You write: add_values<T>(a: T, b: T) -> T");
    println!("  - Compiler generates: add_values_i32, add_values_f64, etc.");
    println!("  - Each version is optimized for its specific type.");
    println!("  - Zero runtime cost — no vtable, no boxing, no indirection.");
    println!("  - Trade-off: slightly larger binary (more code generated).");
}

// ============================================================
// 7. IMPL ON GENERIC TYPES
// ============================================================
// WHY: You can add methods to generic types, and you can add
// methods that only apply when T meets certain bounds.

#[derive(Debug)]
struct Inventory<T> {
    items: Vec<T>,
    name: String,
}

// WHY: Methods available for ALL T.
impl<T> Inventory<T> {
    fn new(name: &str) -> Self {
        Self {
            items: Vec::new(),
            name: String::from(name),
        }
    }

    fn add(&mut self, item: T) {
        self.items.push(item);
    }

    fn count(&self) -> usize {
        self.items.len()
    }

    fn is_empty(&self) -> bool {
        self.items.is_empty()
    }
}

// WHY: Methods available ONLY when T: Display.
impl<T: fmt::Display> Inventory<T> {
    fn display_all(&self) {
        println!("  {} ({} items):", self.name, self.count());
        for (i, item) in self.items.iter().enumerate() {
            println!("    {}. {}", i + 1, item);
        }
    }
}

// WHY: Methods available ONLY when T: PartialOrd.
impl<T: PartialOrd + fmt::Display> Inventory<T> {
    fn find_max(&self) -> Option<&T> {
        if self.items.is_empty() {
            return None;
        }
        let mut max = &self.items[0];
        for item in &self.items[1..] {
            if item > max {
                max = item;
            }
        }
        Some(max)
    }
}

// WHY: Methods available ONLY when T: Clone + Ord.
impl<T: Clone + Ord> Inventory<T> {
    fn sorted(&self) -> Vec<T> {
        let mut sorted = self.items.clone();
        sorted.sort();
        sorted
    }
}

fn demo_impl_on_generics() {
    println!("\n=== 7. Impl on Generic Types ===\n");

    let mut chai_menu: Inventory<String> = Inventory::new("Chai Menu");
    chai_menu.add(String::from("Masala Chai"));
    chai_menu.add(String::from("Ginger Chai"));
    chai_menu.add(String::from("Cutting Chai"));
    chai_menu.add(String::from("Tandoori Chai"));

    chai_menu.display_all();
    // Output:   Chai Menu (4 items):
    // Output:     1. Masala Chai
    // Output:     2. Ginger Chai
    // Output:     3. Cutting Chai
    // Output:     4. Tandoori Chai

    if let Some(max) = chai_menu.find_max() {
        println!("  Max (alphabetical): {}", max);
        // Output:   Max (alphabetical): Tandoori Chai
    }

    let sorted = chai_menu.sorted();
    println!("  Sorted: {:?}", sorted);
    // Output:   Sorted: ["Cutting Chai", "Ginger Chai", "Masala Chai", "Tandoori Chai"]

    // WHY: Numeric inventory — same struct, different behavior.
    let mut prices: Inventory<f64> = Inventory::new("Prices");
    prices.add(15.0);
    prices.add(20.0);
    prices.add(10.0);
    prices.add(25.0);

    prices.display_all();
    if let Some(max) = prices.find_max() {
        println!("  Most expensive: Rs. {:.2}", max);
        // Output:   Most expensive: Rs. 25.00
    }
}

// ============================================================
// 8. DEFAULT TYPE PARAMETERS
// ============================================================
// WHY: You can give type parameters default values. Users can
// override them or use the default. Common in libraries.

#[derive(Debug)]
struct Config<T = String> {
    key: String,
    value: T,
}

impl<T: fmt::Debug> Config<T> {
    fn new(key: &str, value: T) -> Self {
        Self {
            key: String::from(key),
            value,
        }
    }

    fn display(&self) {
        println!("  {} = {:?}", self.key, self.value);
    }
}

// WHY: Default type parameter in action.
fn demo_default_type_params() {
    println!("\n=== 8. Default Type Parameters ===\n");

    // WHY: Using the default type (String).
    let name_config: Config = Config::new("app_name", String::from("ChaiApp"));
    name_config.display();
    // Output:   app_name = "ChaiApp"

    // WHY: Overriding with a specific type.
    let port_config: Config<u16> = Config::new("port", 8080);
    port_config.display();
    // Output:   port = 8080

    let debug_config: Config<bool> = Config::new("debug", true);
    debug_config.display();
    // Output:   debug = true

    let list_config: Config<Vec<String>> = Config::new(
        "allowed_origins",
        vec![String::from("localhost"), String::from("example.com")],
    );
    list_config.display();
    // Output:   allowed_origins = ["localhost", "example.com"]
}

// ============================================================
// 9. GENERIC FUNCTIONS WITH MULTIPLE CONSTRAINTS
// ============================================================
// WHY: Real-world generic code often needs multiple constraints.
// Combining Display, Clone, PartialOrd, etc. is common.

fn top_n<T>(items: &[T], n: usize) -> Vec<T>
where
    T: Clone + Ord,
{
    let mut sorted = items.to_vec();
    sorted.sort_by(|a, b| b.cmp(a)); // descending
    sorted.truncate(n);
    sorted
}

fn format_list<T>(items: &[T], separator: &str) -> String
where
    T: fmt::Display,
{
    items
        .iter()
        .map(|item| item.to_string())
        .collect::<Vec<String>>()
        .join(separator)
}

fn deduplicate<T>(items: &[T]) -> Vec<T>
where
    T: Clone + PartialEq,
{
    let mut result: Vec<T> = Vec::new();
    for item in items {
        if !result.iter().any(|existing| existing == item) {
            result.push(item.clone());
        }
    }
    result
}

fn demo_multiple_constraints() {
    println!("\n=== 9. Multiple Constraints ===\n");

    let scores = vec![75, 92, 88, 65, 95, 70, 85];
    let top3 = top_n(&scores, 3);
    println!("Top 3 scores: {:?}", top3);
    // Output: Top 3 scores: [95, 92, 88]

    let cities = vec!["Mumbai", "Delhi", "Chennai"];
    println!("Cities: {}", format_list(&cities, " | "));
    // Output: Cities: Mumbai | Delhi | Chennai

    let numbers = vec![3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5];
    let unique = deduplicate(&numbers);
    println!("Unique: {:?}", unique);
    // Output: Unique: [3, 1, 4, 5, 9, 2, 6]

    let words = vec!["chai", "samosa", "chai", "pakora", "samosa"];
    let unique_words = deduplicate(&words);
    println!("Unique words: {:?}", unique_words);
    // Output: Unique words: ["chai", "samosa", "pakora"]
}

// ============================================================
// 10. PRACTICAL EXAMPLE — GENERIC DATA TABLE
// ============================================================
// WHY: Combining everything — generic struct with multiple impls,
// where clauses, and real-world usage patterns.

#[derive(Debug, Clone)]
struct DataTable<T> {
    name: String,
    columns: Vec<String>,
    rows: Vec<Vec<T>>,
}

impl<T> DataTable<T> {
    fn new(name: &str, columns: Vec<&str>) -> Self {
        Self {
            name: String::from(name),
            columns: columns.into_iter().map(String::from).collect(),
            rows: Vec::new(),
        }
    }

    fn add_row(&mut self, row: Vec<T>) {
        assert_eq!(row.len(), self.columns.len(),
            "Row length must match column count");
        self.rows.push(row);
    }

    fn row_count(&self) -> usize {
        self.rows.len()
    }

    fn column_count(&self) -> usize {
        self.columns.len()
    }
}

impl<T: fmt::Display> DataTable<T> {
    fn print_table(&self) {
        println!("\n  Table: {} ({} rows x {} cols)",
            self.name, self.row_count(), self.column_count());
        println!("  {}", self.columns.join(" | "));
        println!("  {}", "-".repeat(self.columns.len() * 12));
        for row in &self.rows {
            let formatted: Vec<String> = row.iter().map(|v| format!("{}", v)).collect();
            println!("  {}", formatted.join(" | "));
        }
    }
}

impl<T: Clone + PartialOrd> DataTable<T> {
    fn sort_by_column(&mut self, col_index: usize) {
        self.rows.sort_by(|a, b| {
            a[col_index].partial_cmp(&b[col_index]).unwrap_or(std::cmp::Ordering::Equal)
        });
    }
}

impl<T> DataTable<T>
where
    T: fmt::Display + Clone + Default,
{
    fn get_column(&self, col_index: usize) -> Vec<&T> {
        self.rows.iter().map(|row| &row[col_index]).collect()
    }
}

fn demo_practical_data_table() {
    println!("\n=== 10. Practical: Generic Data Table ===\n");

    // WHY: String table for chai tapri inventory.
    let mut menu = DataTable::new("Chai Menu", vec!["Item", "Size", "Price"]);
    menu.add_row(vec![
        String::from("Masala Chai"),
        String::from("Regular"),
        String::from("15"),
    ]);
    menu.add_row(vec![
        String::from("Ginger Chai"),
        String::from("Large"),
        String::from("25"),
    ]);
    menu.add_row(vec![
        String::from("Cutting Chai"),
        String::from("Small"),
        String::from("10"),
    ]);
    menu.print_table();
    // Output:   Table: Chai Menu (3 rows x 3 cols)
    // Output:   Item | Size | Price
    // Output:   ------------------------------------
    // Output:   Masala Chai | Regular | 15
    // Output:   Ginger Chai | Large | 25
    // Output:   Cutting Chai | Small | 10

    // WHY: Sort by price column (alphabetic sort since it's String).
    menu.sort_by_column(2);
    println!("\n  After sorting by price:");
    menu.print_table();

    // WHY: Numeric table.
    let mut scores = DataTable::new("Cricket Scores", vec!["Runs", "Balls", "Fours"]);
    scores.add_row(vec![85, 60, 10]);
    scores.add_row(vec![120, 80, 14]);
    scores.add_row(vec![45, 35, 6]);
    scores.add_row(vec![72, 55, 8]);

    scores.sort_by_column(0); // sort by runs
    scores.print_table();

    // WHY: Extract a column.
    let runs = scores.get_column(0);
    println!("\n  Runs column: {:?}", runs);
    // Output:   Runs column: [45, 72, 85, 120]
}

// ============================================================
// MAIN
// ============================================================

fn main() {
    demo_generic_functions();
    demo_generic_structs();
    demo_generic_enums();
    demo_type_constraints();
    demo_where_clause();
    demo_monomorphization();
    demo_impl_on_generics();
    demo_default_type_params();
    demo_multiple_constraints();
    demo_practical_data_table();

    // ============================================================
    // KEY TAKEAWAYS
    // ============================================================
    println!("\n=== KEY TAKEAWAYS ===\n");
    println!("1. Generics let you write code once for many types: fn foo<T>(x: T).");
    println!("2. Type bounds (T: Display + Clone) restrict what T can be.");
    println!("3. Generic structs/enums: Vec<T>, Option<T>, Result<T,E> — all generic.");
    println!("4. where clause: cleaner syntax for complex bounds.");
    println!("5. Monomorphization: compiler generates type-specific code.");
    println!("   Zero runtime cost — generics are as fast as hand-written code.");
    println!("6. impl<T> Struct<T> adds methods for all T.");
    println!("   impl Struct<ConcreteType> adds methods for specific types only.");
    println!("7. impl<T: Bound> Struct<T> adds methods only when T satisfies bounds.");
    println!("8. Default type parameters: struct Foo<T = String> — optional override.");
    println!("9. Multiple type parameters: struct Pair<T, U> — T and U independent.");
    println!("10. Generics + traits = Rust's answer to OOP polymorphism, but safer.");
}
