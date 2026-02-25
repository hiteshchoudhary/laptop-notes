// ============================================================
// 13 - COLLECTIONS: HashMap AND String
// ============================================================
// WHY THIS MATTERS:
// HashMap is Rust's key-value store — O(1) average lookup, insert,
// and delete. Strings are Rust's most nuanced type: String (owned,
// heap) vs &str (borrowed, slice). Together, these two collections
// appear in virtually every Rust program. Mastering the entry API
// and understanding String vs &str will save you hours of fighting
// the borrow checker.
// ============================================================

// ============================================================
// STORY: The Flipkart Warehouse Inventory
// ============================================================
// Imagine the Flipkart warehouse in Bengaluru. Every product has
// a unique SKU (Stock Keeping Unit) mapped to its stock count:
//   "SKU-IPHONE15" -> 342 units
//   "SKU-ONEPLUS12" -> 128 units
//
// When a new shipment arrives, you INSERT or UPDATE the count.
// When someone orders, you DECREMENT the count.
// When a product is discontinued, you REMOVE it.
// You need to CHECK if a product exists before promising delivery.
// During sales, you ITERATE over all products to find low stock.
//
// This is a HashMap: keys (SKU codes) map to values (stock counts).
// The entry API handles "insert if absent, update if present" in
// one elegant call — no need to check-then-insert manually.
// ============================================================

use std::collections::BTreeMap;
use std::collections::HashMap;

// ============================================================
// 1. CREATING HashMaps
// ============================================================
// WHY: Multiple ways to create — from scratch, from tuples,
// or from iterators. Choose based on your data source.

fn demo_creating_hashmaps() {
    println!("=== 1. Creating HashMaps ===\n");

    // WHY: HashMap::new() creates empty. Type inferred from first insert.
    let mut inventory: HashMap<String, u32> = HashMap::new();
    inventory.insert(String::from("SKU-IPHONE15"), 342);
    inventory.insert(String::from("SKU-ONEPLUS12"), 128);
    println!("From new: {:?}", inventory);
    // Output: From new: {"SKU-ONEPLUS12": 128, "SKU-IPHONE15": 342}
    // (order may vary — HashMap is unordered)

    // WHY: From an array of tuples using collect().
    let prices: HashMap<&str, f64> = HashMap::from([
        ("Laptop", 59999.0),
        ("Phone", 29999.0),
        ("Tablet", 19999.0),
    ]);
    println!("From array: {:?}", prices);

    // WHY: From two parallel iterators using zip().
    let products = vec!["Mouse", "Keyboard", "Monitor"];
    let stocks = vec![500, 320, 85];
    let stock_map: HashMap<&str, i32> = products
        .into_iter()
        .zip(stocks.into_iter())
        .collect();
    println!("From zip: {:?}", stock_map);

    // WHY: with_capacity pre-allocates like Vec.
    let mut big_map: HashMap<String, String> = HashMap::with_capacity(1000);
    big_map.insert(String::from("key1"), String::from("val1"));
    println!("With capacity: len={}, capacity >= 1000", big_map.len());
    // Output: With capacity: len=1, capacity >= 1000
}

// ============================================================
// 2. INSERT, GET, REMOVE
// ============================================================
// WHY: The basic CRUD operations. insert() returns the old value
// if the key already existed. get() returns Option<&V>.

fn demo_basic_operations() {
    println!("\n=== 2. Insert, Get, Remove ===\n");

    let mut warehouse: HashMap<String, u32> = HashMap::new();

    // WHY: insert returns None if key was new, Some(old_value) if it existed.
    let old = warehouse.insert(String::from("SKU-TV55"), 50);
    println!("First insert: old value = {:?}", old);
    // Output: First insert: old value = None

    let old = warehouse.insert(String::from("SKU-TV55"), 75);
    println!("Update insert: old value = {:?}", old);
    // Output: Update insert: old value = Some(50)

    warehouse.insert(String::from("SKU-FRIDGE"), 30);
    warehouse.insert(String::from("SKU-AC"), 45);
    warehouse.insert(String::from("SKU-WASHER"), 60);

    // WHY: get() returns Option<&V>. Key can be &str even if stored as String.
    match warehouse.get("SKU-TV55") {
        Some(&count) => println!("TV55 stock: {}", count),
        None => println!("TV55 not found"),
    }
    // Output: TV55 stock: 75

    // WHY: contains_key checks existence without borrowing the value.
    println!("Has fridge: {}", warehouse.contains_key("SKU-FRIDGE"));
    // Output: Has fridge: true
    println!("Has laptop: {}", warehouse.contains_key("SKU-LAPTOP"));
    // Output: Has laptop: false

    // WHY: remove returns Option<V> — you get ownership of the removed value.
    let removed = warehouse.remove("SKU-AC");
    println!("Removed AC: {:?}", removed);
    // Output: Removed AC: Some(45)
    println!("After removal: {:?}", warehouse);

    // WHY: len() and is_empty().
    println!("Items: {}, Empty: {}", warehouse.len(), warehouse.is_empty());
    // Output: Items: 3, Empty: false
}

// ============================================================
// 3. THE ENTRY API — RUST'S KILLER FEATURE FOR HASHMAPS
// ============================================================
// WHY: The entry API handles "get or insert" atomically without
// double lookups. entry() returns an Entry enum that lets you
// insert-if-absent (or_insert), modify-if-present (and_modify),
// or do both in one call.

fn demo_entry_api() {
    println!("\n=== 3. Entry API ===\n");

    let mut stock: HashMap<String, u32> = HashMap::new();

    // WHY: or_insert — insert default value if key is absent.
    stock.entry(String::from("Widget")).or_insert(100);
    stock.entry(String::from("Widget")).or_insert(200); // Won't overwrite!
    println!("Widget (or_insert): {}", stock["Widget"]);
    // Output: Widget (or_insert): 100

    // WHY: or_insert returns a mutable reference — useful for incrementing.
    let words = vec!["chai", "samosa", "chai", "jalebi", "chai", "samosa"];
    let mut word_count: HashMap<&str, u32> = HashMap::new();

    for word in &words {
        let count = word_count.entry(word).or_insert(0);
        *count += 1;
    }
    println!("\nWord counts: {:?}", word_count);
    // Output: Word counts: {"chai": 3, "samosa": 2, "jalebi": 1}

    // WHY: or_insert_with — lazy computation of default value.
    let mut cache: HashMap<String, Vec<String>> = HashMap::new();
    cache.entry(String::from("recent"))
        .or_insert_with(|| {
            println!("  (Computing default value...)");
            Vec::with_capacity(10)
        })
        .push(String::from("Item 1"));
    // Output:   (Computing default value...)

    // WHY: Second access — closure is NOT called (key exists).
    cache.entry(String::from("recent"))
        .or_insert_with(|| {
            println!("  (This won't print)");
            Vec::new()
        })
        .push(String::from("Item 2"));

    println!("Cache: {:?}", cache);
    // Output: Cache: {"recent": ["Item 1", "Item 2"]}

    // WHY: and_modify — modify if key exists, with chaining.
    let mut scores: HashMap<String, u32> = HashMap::new();
    let players = vec!["Virat", "Rohit", "Virat", "Dhoni", "Virat", "Rohit"];

    for player in players {
        scores.entry(String::from(player))
            .and_modify(|s| *s += 1)
            .or_insert(1);
    }
    println!("\nAppearances: {:?}", scores);
    // Output: Appearances: {"Virat": 3, "Rohit": 2, "Dhoni": 1}
}

// ============================================================
// 4. ITERATING OVER HashMaps
// ============================================================
// WHY: You'll often need to process all entries. HashMap provides
// iter(), keys(), values(), and mutable variants.

fn demo_iteration() {
    println!("\n=== 4. Iterating HashMaps ===\n");

    let mut inventory: HashMap<&str, u32> = HashMap::from([
        ("Laptop", 45),
        ("Phone", 230),
        ("Tablet", 67),
        ("Earbuds", 500),
        ("Charger", 890),
    ]);

    // WHY: iter() gives (&key, &value) pairs.
    println!("Full inventory:");
    // Sort for deterministic output.
    let mut items: Vec<(&&str, &u32)> = inventory.iter().collect();
    items.sort_by_key(|(k, _)| **k);
    for (product, stock) in &items {
        println!("  {}: {} units", product, stock);
    }

    // WHY: keys() and values() iterate over just one component.
    let mut products: Vec<&&str> = inventory.keys().collect();
    products.sort();
    println!("\nProducts: {:?}", products);

    let total_stock: u32 = inventory.values().sum();
    println!("Total units: {}", total_stock);
    // Output: Total units: 1732

    // WHY: iter_mut() for modifying values in-place.
    println!("\nApplying 10% restock:");
    for (product, stock) in inventory.iter_mut() {
        let addition = (*stock as f64 * 0.1) as u32;
        *stock += addition;
        println!("  {}: +{} = {}", product, addition, stock);
    }

    // WHY: retain — filter HashMap in-place (like Vec::retain).
    inventory.retain(|_, &mut stock| stock > 100);
    let mut kept: Vec<(&str, u32)> = inventory.iter().map(|(&k, &v)| (k, v)).collect();
    kept.sort_by_key(|(k, _)| *k);
    println!("\nAfter retain (stock > 100): {:?}", kept);
}

// ============================================================
// 5. BTreeMap — ORDERED MAP
// ============================================================
// WHY: HashMap is unordered. BTreeMap keeps keys sorted. Use
// BTreeMap when you need ordered iteration, range queries, or
// deterministic output. Trade-off: O(log n) vs O(1).

fn demo_btreemap() {
    println!("\n=== 5. BTreeMap (Ordered) ===\n");

    let mut marks: BTreeMap<String, Vec<u32>> = BTreeMap::new();
    marks.insert(String::from("Rahul"), vec![85, 92, 78]);
    marks.insert(String::from("Anita"), vec![95, 88, 91]);
    marks.insert(String::from("Priya"), vec![70, 82, 88]);
    marks.insert(String::from("Dev"), vec![60, 75, 80]);

    // WHY: BTreeMap iterates in sorted key order — always.
    println!("Student marks (sorted by name):");
    for (name, scores) in &marks {
        let avg: f64 = scores.iter().sum::<u32>() as f64 / scores.len() as f64;
        println!("  {}: {:?} (avg: {:.1})", name, scores, avg);
    }
    // Output: Student marks (sorted by name):
    // Output:   Anita: [95, 88, 91] (avg: 91.3)
    // Output:   Dev: [60, 75, 80] (avg: 71.7)
    // Output:   Priya: [70, 82, 88] (avg: 80.0)
    // Output:   Rahul: [85, 92, 78] (avg: 85.0)

    // WHY: Range queries are efficient on BTreeMap.
    let d_to_q: Vec<(&String, &Vec<u32>)> = marks.range(String::from("D")..String::from("Q")).collect();
    println!("\nNames D-P: {:?}", d_to_q.iter().map(|(k, _)| k.as_str()).collect::<Vec<_>>());
    // Output: Names D-P: ["Dev", "Priya"] (note: Q is excluded, but no name starts with Q before Rahul)

    // WHY: first/last key-value pairs.
    println!("First: {:?}", marks.iter().next().map(|(k, _)| k.as_str()));
    // Output: First: Some("Anita")
    println!("Last: {:?}", marks.iter().next_back().map(|(k, _)| k.as_str()));
    // Output: Last: Some("Rahul")
}

// ============================================================
// 6. STRING VS &str
// ============================================================
// WHY: This is the #1 confusion for Rust beginners.
// - String: owned, heap-allocated, growable, UTF-8 text
// - &str: borrowed string slice, usually a view into a String or literal
// Rule of thumb: own data -> String, borrow data -> &str.

fn demo_string_vs_str() {
    println!("\n=== 6. String vs &str ===\n");

    // WHY: String literals are &str — embedded in the binary.
    let greeting: &str = "Namaste";  // &str — static lifetime
    println!("&str literal: {}", greeting);
    // Output: &str literal: Namaste

    // WHY: String::from creates an owned String from &str.
    let owned: String = String::from("Namaste");
    println!("Owned String: {}", owned);
    // Output: Owned String: Namaste

    // WHY: .to_string() also converts &str to String.
    let also_owned: String = "Dhanyavaad".to_string();
    println!("to_string: {}", also_owned);
    // Output: to_string: Dhanyavaad

    // WHY: &String automatically coerces to &str (deref coercion).
    fn greet(name: &str) {
        println!("  Hello, {}!", name);
    }

    let name_str: &str = "Priya";
    let name_string: String = String::from("Rahul");

    greet(name_str);        // &str directly
    greet(&name_string);    // &String coerces to &str
    // Output:   Hello, Priya!
    // Output:   Hello, Rahul!

    // WHY: String to &str is cheap (&). &str to String allocates (String::from).
    let s: String = String::from("Hello");
    let slice: &str = &s;           // Free — just a borrow
    let owned_again: String = slice.to_string(); // Allocates new memory
    println!("Roundtrip: {} -> {} -> {}", s, slice, owned_again);
    // Output: Roundtrip: Hello -> Hello -> Hello

    // WHY: Key difference — String is mutable, &str is not.
    let mut mutable = String::from("Jai ");
    mutable.push_str("Hind!");
    println!("Mutated: {}", mutable);
    // Output: Mutated: Jai Hind!
}

// ============================================================
// 7. STRING METHODS
// ============================================================
// WHY: Rust's String has rich methods for building and manipulating
// text. Knowing these saves you from reinventing wheels.

fn demo_string_methods() {
    println!("\n=== 7. String Methods ===\n");

    // WHY: push_str appends a &str, push appends a char.
    let mut msg = String::from("Jai");
    msg.push_str(" Hind");
    msg.push('!');
    println!("push_str/push: {}", msg);
    // Output: push_str/push: Jai Hind!

    // WHY: format! creates a new String — like println! but returns String.
    let city = "Mumbai";
    let pin = 400001;
    let address = format!("{}, PIN: {}", city, pin);
    println!("format!: {}", address);
    // Output: format!: Mumbai, PIN: 400001

    // WHY: + operator concatenates but takes ownership of the left side.
    let hello = String::from("Hello");
    let world = String::from(" World");
    let combined = hello + &world;   // hello is MOVED, world is borrowed
    // println!("{}", hello);        // ERROR: hello was moved
    println!("+ operator: {}", combined);
    // Output: + operator: Hello World

    // WHY: contains, starts_with, ends_with for searching.
    let sentence = String::from("Rust is blazing fast and memory safe");
    println!("\ncontains 'fast': {}", sentence.contains("fast"));
    // Output: contains 'fast': true
    println!("starts_with 'Rust': {}", sentence.starts_with("Rust"));
    // Output: starts_with 'Rust': true
    println!("ends_with 'safe': {}", sentence.ends_with("safe"));
    // Output: ends_with 'safe': true

    // WHY: replace and replacen for substitution.
    let text = String::from("chai chai chai");
    println!("replace: {}", text.replace("chai", "coffee"));
    // Output: replace: coffee coffee coffee
    println!("replacen(2): {}", text.replacen("chai", "coffee", 2));
    // Output: replacen(2): coffee coffee chai

    // WHY: split and collect for parsing.
    let csv = "Mumbai,Delhi,Chennai,Kolkata,Bengaluru";
    let cities: Vec<&str> = csv.split(',').collect();
    println!("\nsplit: {:?}", cities);
    // Output: split: ["Mumbai", "Delhi", "Chennai", "Kolkata", "Bengaluru"]

    // WHY: trim removes whitespace (also trim_start, trim_end).
    let padded = "   Hello India   ";
    println!("trim: '{}'", padded.trim());
    // Output: trim: 'Hello India'

    // WHY: to_uppercase, to_lowercase.
    println!("upper: {}", "namaste".to_uppercase());
    // Output: upper: NAMASTE
    println!("lower: {}", "JAI HIND".to_lowercase());
    // Output: lower: jai hind

    // WHY: len() is bytes, not characters! For char count use .chars().count().
    let hindi = String::from("नमस्ते");
    println!("\n'{}': {} bytes, {} chars", hindi, hindi.len(), hindi.chars().count());
    // Output: 'नमस्ते': 18 bytes, 6 chars

    // WHY: Iterating over characters vs bytes.
    print!("Chars: ");
    for c in hindi.chars() {
        print!("{} ", c);
    }
    println!();
    // Output: Chars: न म स ् त े
}

// ============================================================
// 8. STRING CAPACITY AND PERFORMANCE
// ============================================================
// WHY: String is backed by a Vec<u8>. Understanding capacity
// helps avoid unnecessary reallocations in hot paths.

fn demo_string_capacity() {
    println!("\n=== 8. String Capacity ===\n");

    let mut s = String::new();
    println!("Empty: len={}, capacity={}", s.len(), s.capacity());
    // Output: Empty: len=0, capacity=0

    s.push_str("Hello");
    println!("After 'Hello': len={}, capacity={}", s.len(), s.capacity());

    // WHY: with_capacity pre-allocates to avoid reallocation.
    let mut efficient = String::with_capacity(100);
    efficient.push_str("Pre-allocated string");
    println!("With capacity: len={}, capacity={}", efficient.len(), efficient.capacity());
    // Output: With capacity: len=20, capacity=100

    // WHY: Efficient string building — avoid repeated allocations.
    let parts = vec!["Mumbai", "Delhi", "Chennai", "Kolkata"];
    let mut result = String::with_capacity(parts.iter().map(|s| s.len() + 2).sum());
    for (i, part) in parts.iter().enumerate() {
        if i > 0 {
            result.push_str(", ");
        }
        result.push_str(part);
    }
    println!("Built: {}", result);
    // Output: Built: Mumbai, Delhi, Chennai, Kolkata

    // WHY: join() is even simpler for this pattern.
    let joined = parts.join(", ");
    println!("Joined: {}", joined);
    // Output: Joined: Mumbai, Delhi, Chennai, Kolkata
}

// ============================================================
// 9. PRACTICAL: FLIPKART INVENTORY SYSTEM
// ============================================================
// WHY: Combining HashMap entry API, iteration, String manipulation
// in a realistic scenario.

#[derive(Debug)]
struct Product {
    name: String,
    price: f64,
    stock: u32,
    category: String,
}

impl Product {
    fn new(name: &str, price: f64, stock: u32, category: &str) -> Self {
        Self {
            name: String::from(name),
            price,
            stock,
            category: String::from(category),
        }
    }
}

fn demo_practical_inventory() {
    println!("\n=== 9. Practical: Inventory System ===\n");

    let mut inventory: HashMap<String, Product> = HashMap::new();

    // WHY: Adding products.
    let products = vec![
        ("SKU-001", Product::new("iPhone 15", 79999.0, 150, "Phones")),
        ("SKU-002", Product::new("OnePlus 12", 42999.0, 280, "Phones")),
        ("SKU-003", Product::new("MacBook Air", 99999.0, 45, "Laptops")),
        ("SKU-004", Product::new("iPad Air", 59999.0, 90, "Tablets")),
        ("SKU-005", Product::new("AirPods Pro", 24999.0, 500, "Audio")),
        ("SKU-006", Product::new("Galaxy S24", 69999.0, 200, "Phones")),
    ];

    for (sku, product) in products {
        inventory.insert(String::from(sku), product);
    }
    println!("Inventory loaded: {} products", inventory.len());
    // Output: Inventory loaded: 6 products

    // WHY: Search by category using iteration + filter.
    let category = "Phones";
    let mut phones: Vec<(&String, &Product)> = inventory
        .iter()
        .filter(|(_, p)| p.category == category)
        .collect();
    phones.sort_by(|(_, a), (_, b)| a.price.partial_cmp(&b.price).unwrap());

    println!("\n{} category:", category);
    for (sku, product) in &phones {
        println!("  [{}] {} - Rs. {:.2} ({} in stock)",
            sku, product.name, product.price, product.stock);
    }

    // WHY: Process an order using entry API.
    println!("\nProcessing order for SKU-001:");
    if let Some(product) = inventory.get_mut("SKU-001") {
        if product.stock > 0 {
            product.stock -= 1;
            println!("  Sold 1x {}. Remaining: {}", product.name, product.stock);
        } else {
            println!("  {} is out of stock!", product.name);
        }
    }
    // Output: Sold 1x iPhone 15. Remaining: 149

    // WHY: Category-wise stock summary using a secondary HashMap.
    let mut category_summary: HashMap<&str, (u32, f64)> = HashMap::new();
    for product in inventory.values() {
        let entry = category_summary
            .entry(product.category.as_str())
            .or_insert((0, 0.0));
        entry.0 += product.stock;
        entry.1 += product.price * product.stock as f64;
    }

    println!("\nCategory Summary:");
    let mut summary: Vec<_> = category_summary.iter().collect();
    summary.sort_by_key(|(k, _)| *k);
    for (category, (units, value)) in summary {
        println!("  {}: {} units, total value Rs. {:.2}", category, units, value);
    }

    // WHY: Low stock alert.
    let low_stock_threshold = 100;
    println!("\nLow stock alert (< {} units):", low_stock_threshold);
    let mut alerts: Vec<_> = inventory
        .iter()
        .filter(|(_, p)| p.stock < low_stock_threshold)
        .collect();
    alerts.sort_by_key(|(k, _)| k.clone());
    for (sku, product) in alerts {
        println!("  [{}] {} - only {} left!", sku, product.name, product.stock);
    }
}

// ============================================================
// 10. COMBINING STRINGS AND HASHMAPS
// ============================================================
// WHY: A common pattern — parsing text into HashMaps and
// formatting HashMap data back into strings.

fn demo_string_hashmap_combo() {
    println!("\n=== 10. Strings + HashMaps Combined ===\n");

    // WHY: Parse a config-style string into a HashMap.
    let config_text = "host=127.0.0.1;port=8080;db=myapp;timeout=30;debug=true";
    let config: HashMap<&str, &str> = config_text
        .split(';')
        .filter_map(|pair| {
            let mut parts = pair.splitn(2, '=');
            match (parts.next(), parts.next()) {
                (Some(k), Some(v)) => Some((k, v)),
                _ => None,
            }
        })
        .collect();

    println!("Parsed config:");
    let mut sorted_config: Vec<_> = config.iter().collect();
    sorted_config.sort_by_key(|(k, _)| **k);
    for (key, value) in &sorted_config {
        println!("  {} = {}", key, value);
    }
    // Output: Parsed config:
    // Output:   db = myapp
    // Output:   debug = true
    // Output:   host = 127.0.0.1
    // Output:   port = 8080
    // Output:   timeout = 30

    // WHY: Format HashMap back to string.
    let formatted: String = sorted_config
        .iter()
        .map(|(k, v)| format!("{}={}", k, v))
        .collect::<Vec<String>>()
        .join("&");
    println!("\nAs query string: {}", formatted);
    // Output: As query string: db=myapp&debug=true&host=127.0.0.1&port=8080&timeout=30

    // WHY: Word frequency counter — classic HashMap + String pattern.
    let text = "to be or not to be that is the question to be is to exist";
    let mut freq: HashMap<&str, u32> = HashMap::new();
    for word in text.split_whitespace() {
        *freq.entry(word).or_insert(0) += 1;
    }

    let mut sorted_freq: Vec<_> = freq.iter().collect();
    sorted_freq.sort_by(|a, b| b.1.cmp(a.1));

    println!("\nWord frequency (top 5):");
    for (word, count) in sorted_freq.iter().take(5) {
        let bar = "#".repeat(**count as usize);
        println!("  {:>10}: {} ({})", word, bar, count);
    }
}

// ============================================================
// MAIN
// ============================================================

fn main() {
    demo_creating_hashmaps();
    demo_basic_operations();
    demo_entry_api();
    demo_iteration();
    demo_btreemap();
    demo_string_vs_str();
    demo_string_methods();
    demo_string_capacity();
    demo_practical_inventory();
    demo_string_hashmap_combo();

    // ============================================================
    // KEY TAKEAWAYS
    // ============================================================
    println!("\n=== KEY TAKEAWAYS ===\n");
    println!("1. HashMap<K,V> provides O(1) average insert/get/remove.");
    println!("2. entry() API: or_insert, or_insert_with, and_modify —");
    println!("   handle insert-or-update without double lookups.");
    println!("3. BTreeMap keeps keys sorted. Use for ordered iteration/ranges.");
    println!("4. String is owned (heap, growable). &str is borrowed (slice).");
    println!("5. &String auto-coerces to &str. Accept &str in function params.");
    println!("6. format!() creates Strings. join() concatenates slices.");
    println!("7. String::len() is bytes, not characters. Use .chars().count().");
    println!("8. split/trim/replace/contains — rich text processing built-in.");
    println!("9. HashMap + String: parse text into maps, format maps to text.");
    println!("10. with_capacity() on both HashMap and String avoids reallocation.");
}
