// ============================================================
// FILE 18: ITERATORS — Lazy, Composable Data Pipelines
// ============================================================
// WHY THIS MATTERS:
// Iterators are Rust's way of processing sequences of data
// lazily and efficiently. They replace manual for-loops with
// composable, readable chains of transformations. The compiler
// optimizes iterator chains to be as fast as hand-written
// loops — true zero-cost abstraction.
// ============================================================

// ============================================================
// STORY: Dabbawala Sorting Line Pipeline
// ============================================================
// Picture Mumbai's legendary dabbawalas — those men who
// deliver 200,000+ lunchboxes daily with near-perfect accuracy.
// Each dabba (lunchbox) passes through a PIPELINE of stations:
//
// Station 1 (COLLECT): Pick up dabbas from homes
// Station 2 (SORT/MAP): Mark each dabba with a color code
// Station 3 (FILTER): Remove dabbas for closed offices
// Station 4 (GROUP): Group by destination area
// Station 5 (DELIVER): Hand off to final delivery boys
//
// Each station is LAZY — it only processes the next dabba when
// the next station asks for it. No dabba is touched until it's
// needed. That's exactly how Rust iterators work!
// ============================================================

use std::collections::HashMap;
use std::fmt;

// ============================================================
// 1. ITERATOR TRAIT — The Foundation
// ============================================================
// WHY: The Iterator trait has one required method: next().
// Everything else is built on top of this single method.

fn demonstrate_iterator_basics() {
    println!("--- 1. Iterator Trait Basics ---");

    // Creating iterators from collections
    let stations = vec!["Churchgate", "Marine Lines", "Charni Road", "Grant Road"];

    // .iter() creates an iterator of &T references
    let mut station_iter = stations.iter();

    // next() returns Option<&T> — Some(item) or None when done
    println!("  First: {:?}", station_iter.next());
    // Output: First: Some("Churchgate")

    println!("  Second: {:?}", station_iter.next());
    // Output: Second: Some("Marine Lines")

    println!("  Third: {:?}", station_iter.next());
    // Output: Third: Some("Charni Road")

    println!("  Fourth: {:?}", station_iter.next());
    // Output: Fourth: Some("Grant Road")

    println!("  Fifth: {:?}", station_iter.next());
    // Output: Fifth: None

    // for loop uses iterators under the hood
    // WHY: `for item in &collection` is sugar for `.iter()`
    print!("  Stations:");
    for station in &stations {
        print!(" [{}]", station);
    }
    println!();
    // Output: Stations: [Churchgate] [Marine Lines] [Charni Road] [Grant Road]

    // Three ways to iterate:
    let dabbas = vec![101, 102, 103];

    // .iter()      -> &T (borrows)
    let _borrowed: Vec<&i32> = dabbas.iter().collect();

    // .iter_mut()  -> &mut T (mutable borrows)
    let mut dabbas_mut = vec![101, 102, 103];
    for dabba in dabbas_mut.iter_mut() {
        *dabba += 1000; // Mark as sorted
    }
    println!("  After marking: {:?}", dabbas_mut);
    // Output: After marking: [1101, 1102, 1103]

    // .into_iter() -> T (consumes, takes ownership)
    let dabbas_owned = vec![201, 202, 203];
    let collected: Vec<i32> = dabbas_owned.into_iter().collect();
    println!("  Consumed: {:?}", collected);
    // Output: Consumed: [201, 202, 203]
    // dabbas_owned is no longer available — it was consumed
}

// ============================================================
// 2. CONSUMING ADAPTORS — Methods That Use Up the Iterator
// ============================================================
// WHY: These methods call next() until the iterator is exhausted.
// They "consume" the iterator — you can't use it afterward.

fn demonstrate_consuming_adaptors() {
    println!("\n--- 2. Consuming Adaptors ---");

    let delivery_times = vec![25, 30, 15, 45, 20, 35];

    // sum — adds all elements
    let total: i32 = delivery_times.iter().sum();
    println!("  Total delivery time: {} min", total);
    // Output: Total delivery time: 170 min

    // count — number of elements
    let count = delivery_times.iter().count();
    println!("  Number of deliveries: {}", count);
    // Output: Number of deliveries: 6

    // min / max
    let fastest = delivery_times.iter().min().unwrap();
    let slowest = delivery_times.iter().max().unwrap();
    println!("  Fastest: {} min, Slowest: {} min", fastest, slowest);
    // Output: Fastest: 15 min, Slowest: 45 min

    // collect — gather into a collection
    let doubled: Vec<i32> = delivery_times.iter().map(|t| t * 2).collect();
    println!("  Doubled times: {:?}", doubled);
    // Output: Doubled times: [50, 60, 30, 90, 40, 70]

    // collect into HashMap
    let zones = vec!["Andheri", "Bandra", "Colaba"];
    let codes = vec![1, 2, 3];
    let zone_map: HashMap<&str, i32> = zones.iter().copied().zip(codes.iter().copied()).collect();
    println!("  Zone map: {:?}", zone_map);
    // Output: Zone map: {"Andheri": 1, "Bandra": 2, "Colaba": 3} (order may vary)

    // any — does any element satisfy the condition?
    let has_slow = delivery_times.iter().any(|&t| t > 40);
    println!("  Any slow delivery (>40min)? {}", has_slow);
    // Output: Any slow delivery (>40min)? true

    // all — do all elements satisfy the condition?
    let all_under_hour = delivery_times.iter().all(|&t| t < 60);
    println!("  All under 1 hour? {}", all_under_hour);
    // Output: All under 1 hour? true

    // find — first element matching condition
    let first_slow = delivery_times.iter().find(|&&t| t > 30);
    println!("  First slow delivery: {:?}", first_slow);
    // Output: First slow delivery: Some(45)

    // position — index of first matching element
    let pos = delivery_times.iter().position(|&t| t == 45);
    println!("  Position of 45min delivery: {:?}", pos);
    // Output: Position of 45min delivery: Some(3)

    // last — the final element
    let last = delivery_times.iter().last();
    println!("  Last delivery time: {:?}", last);
    // Output: Last delivery time: Some(35)

    // product
    let small_nums = vec![2, 3, 4];
    let product: i32 = small_nums.iter().product();
    println!("  Product of [2,3,4]: {}", product);
    // Output: Product of [2,3,4]: 24
}

// ============================================================
// 3. LAZY EVALUATION — Nothing Happens Until You Consume
// ============================================================
// WHY: Iterator adaptors (map, filter, etc.) are LAZY.
// They don't do any work until a consuming adaptor pulls
// values through the chain. This avoids unnecessary computation.

fn demonstrate_lazy_evaluation() {
    println!("\n--- 3. Lazy Evaluation ---");

    let dabbas = vec![1, 2, 3, 4, 5];

    // This does NOTHING yet — just sets up a pipeline
    let _lazy_pipeline = dabbas
        .iter()
        .map(|d| {
            println!("    mapping dabba {}", d); // Won't print!
            d * 10
        })
        .filter(|d| {
            println!("    filtering dabba {}", d); // Won't print!
            *d > 20
        });

    println!("  Pipeline created (nothing executed yet)");
    // Output: Pipeline created (nothing executed yet)

    // NOW it executes — collect() pulls values through
    println!("  Collecting:");
    let result: Vec<i32> = dabbas
        .iter()
        .map(|d| {
            println!("    mapping dabba {}", d);
            d * 10
        })
        .filter(|d| {
            println!("    filtering dabba {}", d);
            *d > 20
        })
        .collect();

    // Output shows interleaved map+filter (processes one item at a time):
    //   mapping dabba 1
    //   filtering dabba 10
    //   mapping dabba 2
    //   filtering dabba 20
    //   mapping dabba 3
    //   filtering dabba 30
    //   mapping dabba 4
    //   filtering dabba 40
    //   mapping dabba 5
    //   filtering dabba 50

    println!("  Result: {:?}", result);
    // Output: Result: [30, 40, 50]

    // WHY this matters: If you only need the first match,
    // lazy evaluation stops early!
    println!("\n  Early stopping with find:");
    let first_big = dabbas
        .iter()
        .map(|d| {
            println!("    mapping {}", d);
            d * 10
        })
        .find(|d| *d > 30);

    println!("  Found: {:?}", first_big);
    // Output:
    //   mapping 1
    //   mapping 2
    //   mapping 3
    //   mapping 4       <-- stops here! Never processes 5
    //   Found: Some(40)
}

// ============================================================
// 4. ITERATOR ADAPTORS — Transform the Pipeline
// ============================================================
// WHY: Adaptors create new iterators that modify the sequence.
// They're lazy and chainable.

fn demonstrate_iterator_adaptors() {
    println!("\n--- 4. Iterator Adaptors ---");

    let dabbas = vec![
        ("D001", "Andheri", 2),
        ("D002", "Bandra", 5),
        ("D003", "Colaba", 1),
        ("D004", "Andheri", 3),
        ("D005", "Dadar", 4),
        ("D006", "Bandra", 6),
    ];

    // map — transform each element
    let ids: Vec<&str> = dabbas.iter().map(|(id, _, _)| *id).collect();
    println!("  IDs: {:?}", ids);
    // Output: IDs: ["D001", "D002", "D003", "D004", "D005", "D006"]

    // filter — keep elements matching condition
    let andheri_dabbas: Vec<_> = dabbas
        .iter()
        .filter(|(_, zone, _)| *zone == "Andheri")
        .collect();
    println!("  Andheri dabbas: {:?}", andheri_dabbas);
    // Output: Andheri dabbas: [("D001", "Andheri", 2), ("D004", "Andheri", 3)]

    // filter_map — filter and transform in one step
    // WHY: Combines filter + map. Keeps only Some values.
    let heavy_weights: Vec<String> = dabbas
        .iter()
        .filter_map(|(id, _, weight)| {
            if *weight > 3 {
                Some(format!("{} ({}kg)", id, weight))
            } else {
                None
            }
        })
        .collect();
    println!("  Heavy dabbas: {:?}", heavy_weights);
    // Output: Heavy dabbas: ["D002 (5kg)", "D005 (4kg)", "D006 (6kg)"]

    // enumerate — add index to each element
    println!("  Numbered list:");
    for (i, (id, zone, _)) in dabbas.iter().enumerate() {
        println!("    {}. {} -> {}", i + 1, id, zone);
    }
    // Output:
    //   1. D001 -> Andheri
    //   2. D002 -> Bandra
    //   3. D003 -> Colaba
    //   4. D004 -> Andheri
    //   5. D005 -> Dadar
    //   6. D006 -> Bandra

    // zip — combine two iterators element-wise
    let names = vec!["Raj", "Priya", "Amit"];
    let scores = vec![95, 88, 72];
    let paired: Vec<_> = names.iter().zip(scores.iter()).collect();
    println!("  Zipped: {:?}", paired);
    // Output: Zipped: [("Raj", 95), ("Priya", 88), ("Amit", 72)]

    // chain — concatenate two iterators
    let morning = vec!["D001", "D002"];
    let evening = vec!["D003", "D004"];
    let all: Vec<_> = morning.iter().chain(evening.iter()).collect();
    println!("  Chained: {:?}", all);
    // Output: Chained: ["D001", "D002", "D003", "D004"]

    // take — first N elements
    let first_three: Vec<_> = dabbas.iter().take(3).collect();
    println!("  First 3: {:?}", first_three);
    // Output: First 3: [("D001", "Andheri", 2), ("D002", "Bandra", 5), ("D003", "Colaba", 1)]

    // skip — skip first N elements
    let after_three: Vec<_> = dabbas.iter().skip(3).collect();
    println!("  After 3: {:?}", after_three);
    // Output: After 3: [("D004", "Andheri", 3), ("D005", "Dadar", 4), ("D006", "Bandra", 6)]

    // take_while / skip_while
    let numbers = vec![1, 2, 3, 6, 5, 4];
    let ascending: Vec<_> = numbers
        .windows(2)
        .take_while(|w| w[0] < w[1])
        .map(|w| w[0])
        .collect();
    println!("  Ascending prefix: {:?}", ascending);
    // Output: Ascending prefix: [1, 2]

    // flat_map — map + flatten
    // WHY: When map produces iterators, flat_map flattens them
    let zones = vec!["Andheri-East", "Bandra-West"];
    let words: Vec<&str> = zones.iter().flat_map(|z| z.split('-')).collect();
    println!("  Flat mapped: {:?}", words);
    // Output: Flat mapped: ["Andheri", "East", "Bandra", "West"]

    // flatten — flatten nested iterators
    let nested = vec![vec![1, 2], vec![3, 4], vec![5]];
    let flat: Vec<_> = nested.iter().flatten().collect();
    println!("  Flattened: {:?}", flat);
    // Output: Flattened: [1, 2, 3, 4, 5]

    // peekable — look ahead without consuming
    let mut peekable = vec![10, 20, 30].into_iter().peekable();
    println!("  Peek: {:?}", peekable.peek());
    // Output: Peek: Some(10)
    println!("  Next: {:?}", peekable.next());
    // Output: Next: Some(10)
    println!("  Peek again: {:?}", peekable.peek());
    // Output: Peek again: Some(20)
}

// ============================================================
// 5. fold AND reduce — Accumulating Results
// ============================================================
// WHY: fold is the most general consuming adaptor. It takes
// an initial value and a closure, processing each element
// into an accumulator. Many other methods are special cases
// of fold.

fn demonstrate_fold_reduce() {
    println!("\n--- 5. fold and reduce ---");

    let weights = vec![2, 5, 1, 3, 4, 6];

    // fold with initial value
    let total = weights.iter().fold(0, |acc, &w| acc + w);
    println!("  Total weight (fold): {} kg", total);
    // Output: Total weight (fold): 21 kg

    // fold to build a string
    let report = weights.iter().enumerate().fold(
        String::from("Weights:"),
        |acc, (i, &w)| format!("{} D{}={}kg", acc, i + 1, w),
    );
    println!("  {}", report);
    // Output: Weights: D1=2kg D2=5kg D3=1kg D4=3kg D5=4kg D6=6kg

    // fold to find min and max simultaneously
    let (min, max) = weights
        .iter()
        .fold((i32::MAX, i32::MIN), |(min, max), &w| {
            (min.min(w), max.max(w))
        });
    println!("  Min: {}, Max: {}", min, max);
    // Output: Min: 1, Max: 6

    // fold to compute average
    let (sum, count) = weights
        .iter()
        .fold((0, 0), |(sum, count), &w| (sum + w, count + 1));
    let average = sum as f64 / count as f64;
    println!("  Average weight: {:.1} kg", average);
    // Output: Average weight: 3.5 kg

    // reduce — like fold but uses first element as initial value
    // WHY: No need for an explicit initial value
    let max_val = weights.iter().copied().reduce(|a, b| a.max(b));
    println!("  Max (reduce): {:?}", max_val);
    // Output: Max (reduce): Some(6)

    // fold to group by category
    let dabbas = vec![("Andheri", 2), ("Bandra", 5), ("Andheri", 3), ("Bandra", 1)];
    let grouped = dabbas.iter().fold(
        HashMap::new(),
        |mut map: HashMap<&str, Vec<i32>>, &(zone, weight)| {
            map.entry(zone).or_default().push(weight);
            map
        },
    );
    println!("  Grouped: {:?}", grouped);
    // Output: Grouped: {"Andheri": [2, 3], "Bandra": [5, 1]} (order may vary)
}

// ============================================================
// 6. IMPLEMENTING ITERATOR FOR CUSTOM TYPE
// ============================================================
// WHY: You can make any type iterable by implementing the
// Iterator trait. This lets your type work with for loops
// and all iterator methods.

// A route is a sequence of stations
#[derive(Debug)]
struct DabbaRoute {
    stations: Vec<String>,
    current: usize,
}

impl DabbaRoute {
    fn new(stations: Vec<&str>) -> Self {
        DabbaRoute {
            stations: stations.into_iter().map(String::from).collect(),
            current: 0,
        }
    }
}

// Implement Iterator trait
impl Iterator for DabbaRoute {
    type Item = String; // WHY: Associated type — what next() returns

    fn next(&mut self) -> Option<Self::Item> {
        if self.current < self.stations.len() {
            let station = self.stations[self.current].clone();
            self.current += 1;
            Some(station)
        } else {
            None
        }
    }

    // Optional: Override size_hint for better collect() performance
    fn size_hint(&self) -> (usize, Option<usize>) {
        let remaining = self.stations.len() - self.current;
        (remaining, Some(remaining))
    }
}

// More complex example: Fibonacci sequence (infinite iterator)
struct Fibonacci {
    a: u64,
    b: u64,
}

impl Fibonacci {
    fn new() -> Self {
        Fibonacci { a: 0, b: 1 }
    }
}

impl Iterator for Fibonacci {
    type Item = u64;

    fn next(&mut self) -> Option<Self::Item> {
        let result = self.a;
        let new_b = self.a + self.b;
        self.a = self.b;
        self.b = new_b;
        Some(result) // Never returns None — infinite iterator!
    }
}

// Counter with step
struct StepCounter {
    start: i32,
    end: i32,
    step: i32,
    current: i32,
}

impl StepCounter {
    fn new(start: i32, end: i32, step: i32) -> Self {
        StepCounter {
            start,
            end,
            step,
            current: start,
        }
    }
}

impl Iterator for StepCounter {
    type Item = i32;

    fn next(&mut self) -> Option<Self::Item> {
        if self.current < self.end {
            let val = self.current;
            self.current += self.step;
            Some(val)
        } else {
            None
        }
    }
}

fn demonstrate_custom_iterator() {
    println!("\n--- 6. Custom Iterator ---");

    // DabbaRoute iterator
    let route = DabbaRoute::new(vec![
        "Churchgate",
        "Marine Lines",
        "Charni Road",
        "Grant Road",
        "Mumbai Central",
    ]);

    // Use in for loop
    print!("  Route:");
    for station in route {
        print!(" -> {}", station);
    }
    println!();
    // Output: Route: -> Churchgate -> Marine Lines -> Charni Road -> Grant Road -> Mumbai Central

    // Use iterator methods on custom type
    let route2 = DabbaRoute::new(vec!["Andheri", "Bandra", "Dadar", "CST"]);
    let long_names: Vec<String> = route2.filter(|s| s.len() > 5).collect();
    println!("  Long station names: {:?}", long_names);
    // Output: Long station names: ["Andheri", "Bandra"]

    // Fibonacci — infinite iterator with take()
    let fibs: Vec<u64> = Fibonacci::new().take(10).collect();
    println!("  First 10 Fibonacci: {:?}", fibs);
    // Output: First 10 Fibonacci: [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]

    // Fibonacci with skip + take
    let fibs_5_to_10: Vec<u64> = Fibonacci::new().skip(5).take(5).collect();
    println!("  Fibonacci 5-9: {:?}", fibs_5_to_10);
    // Output: Fibonacci 5-9: [5, 8, 13, 21, 34]

    // Sum of first 20 Fibonacci numbers
    let fib_sum: u64 = Fibonacci::new().take(20).sum();
    println!("  Sum of first 20 Fibonacci: {}", fib_sum);
    // Output: Sum of first 20 Fibonacci: 17710

    // StepCounter
    let evens: Vec<i32> = StepCounter::new(0, 20, 2).collect();
    println!("  Even numbers 0..20: {:?}", evens);
    // Output: Even numbers 0..20: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18]

    let by_fives: Vec<i32> = StepCounter::new(100, 130, 5).collect();
    println!("  By fives 100..130: {:?}", by_fives);
    // Output: By fives 100..130: [100, 105, 110, 115, 120, 125]
}

// ============================================================
// 7. IMPLEMENTING IntoIterator FOR CUSTOM TYPES
// ============================================================
// WHY: IntoIterator lets your type be used directly in for loops.
// for x in my_collection works if my_collection implements IntoIterator.

struct DabbaCollection {
    dabbas: Vec<(String, String)>, // (id, destination)
}

impl DabbaCollection {
    fn new() -> Self {
        DabbaCollection { dabbas: Vec::new() }
    }

    fn add(&mut self, id: &str, dest: &str) {
        self.dabbas.push((String::from(id), String::from(dest)));
    }
}

// Display for DabbaCollection
impl fmt::Display for DabbaCollection {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "DabbaCollection({} items)", self.dabbas.len())
    }
}

// Implement IntoIterator to consume the collection
impl IntoIterator for DabbaCollection {
    type Item = (String, String);
    type IntoIter = std::vec::IntoIter<(String, String)>;

    fn into_iter(self) -> Self::IntoIter {
        self.dabbas.into_iter()
    }
}

// Implement IntoIterator for &DabbaCollection (borrowing)
impl<'a> IntoIterator for &'a DabbaCollection {
    type Item = &'a (String, String);
    type IntoIter = std::slice::Iter<'a, (String, String)>;

    fn into_iter(self) -> Self::IntoIter {
        self.dabbas.iter()
    }
}

fn demonstrate_into_iterator() {
    println!("\n--- 7. IntoIterator ---");

    let mut collection = DabbaCollection::new();
    collection.add("D001", "Andheri");
    collection.add("D002", "Bandra");
    collection.add("D003", "Colaba");

    // Borrow iteration (using &DabbaCollection)
    println!("  Borrowed iteration:");
    for (id, dest) in &collection {
        println!("    {} -> {}", id, dest);
    }
    // Output:
    //   D001 -> Andheri
    //   D002 -> Bandra
    //   D003 -> Colaba

    // Collection is still available after borrowing
    println!("  Collection: {}", collection);
    // Output: Collection: DabbaCollection(3 items)

    // Consuming iteration (using DabbaCollection)
    println!("  Consuming iteration:");
    for (id, dest) in collection {
        println!("    {} -> {} (consumed)", id, dest);
    }
    // Output:
    //   D001 -> Andheri (consumed)
    //   D002 -> Bandra (consumed)
    //   D003 -> Colaba (consumed)

    // collection is no longer available — it was consumed
}

// ============================================================
// 8. PRACTICAL PIPELINE EXAMPLES
// ============================================================

#[derive(Debug, Clone)]
struct Dabba {
    id: String,
    zone: String,
    weight_kg: f64,
    is_fragile: bool,
    delivery_time_min: u32,
}

impl Dabba {
    fn new(id: &str, zone: &str, weight: f64, fragile: bool, time: u32) -> Self {
        Dabba {
            id: String::from(id),
            zone: String::from(zone),
            weight_kg: weight,
            is_fragile: fragile,
            delivery_time_min: time,
        }
    }
}

impl fmt::Display for Dabba {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(
            f,
            "{}({}, {:.1}kg{})",
            self.id,
            self.zone,
            self.weight_kg,
            if self.is_fragile { ", FRAGILE" } else { "" }
        )
    }
}

fn demonstrate_practical_pipelines() {
    println!("\n--- 8. Practical Pipelines ---");

    let dabbas = vec![
        Dabba::new("D001", "Andheri", 2.5, false, 25),
        Dabba::new("D002", "Bandra", 5.0, true, 30),
        Dabba::new("D003", "Colaba", 1.0, false, 45),
        Dabba::new("D004", "Andheri", 3.5, true, 20),
        Dabba::new("D005", "Dadar", 4.0, false, 35),
        Dabba::new("D006", "Bandra", 6.0, false, 15),
        Dabba::new("D007", "Andheri", 2.0, false, 40),
        Dabba::new("D008", "Colaba", 3.0, true, 50),
    ];

    // Pipeline 1: Find heavy fragile dabbas needing special handling
    println!("  Heavy fragile dabbas:");
    let special: Vec<_> = dabbas
        .iter()
        .filter(|d| d.is_fragile && d.weight_kg > 2.0)
        .collect();
    for d in &special {
        println!("    {}", d);
    }
    // Output:
    //   D002(Bandra, 5.0kg, FRAGILE)
    //   D004(Andheri, 3.5kg, FRAGILE)
    //   D008(Colaba, 3.0kg, FRAGILE)

    // Pipeline 2: Total weight per zone
    let zone_weights: HashMap<&str, f64> = dabbas.iter().fold(
        HashMap::new(),
        |mut map, d| {
            *map.entry(d.zone.as_str()).or_insert(0.0) += d.weight_kg;
            map
        },
    );
    println!("  Weight per zone:");
    let mut sorted_zones: Vec<_> = zone_weights.iter().collect();
    sorted_zones.sort_by_key(|(zone, _)| *zone);
    for (zone, weight) in &sorted_zones {
        println!("    {}: {:.1} kg", zone, weight);
    }
    // Output:
    //   Andheri: 8.0 kg
    //   Bandra: 11.0 kg
    //   Colaba: 4.0 kg
    //   Dadar: 4.0 kg

    // Pipeline 3: Average delivery time for Andheri zone
    let (sum, count) = dabbas
        .iter()
        .filter(|d| d.zone == "Andheri")
        .fold((0u32, 0u32), |(s, c), d| (s + d.delivery_time_min, c + 1));
    let avg = sum as f64 / count as f64;
    println!("  Avg Andheri delivery: {:.0} min", avg);
    // Output: Avg Andheri delivery: 28 min

    // Pipeline 4: Sorted summary report
    let mut sorted_dabbas = dabbas.clone();
    sorted_dabbas.sort_by(|a, b| {
        a.delivery_time_min
            .partial_cmp(&b.delivery_time_min)
            .unwrap()
    });

    println!("  Fastest deliveries (top 3):");
    sorted_dabbas
        .iter()
        .take(3)
        .enumerate()
        .for_each(|(i, d)| {
            println!("    {}. {} - {} min", i + 1, d, d.delivery_time_min);
        });
    // Output:
    //   1. D006(Bandra, 6.0kg) - 15 min
    //   2. D004(Andheri, 3.5kg, FRAGILE) - 20 min
    //   3. D001(Andheri, 2.5kg) - 25 min

    // Pipeline 5: Partition into fragile/non-fragile
    let (fragile, normal): (Vec<_>, Vec<_>) =
        dabbas.iter().partition(|d| d.is_fragile);
    println!(
        "  Fragile: {}, Normal: {}",
        fragile.len(),
        normal.len()
    );
    // Output: Fragile: 3, Normal: 5

    // Pipeline 6: Complex chain — find the heaviest non-fragile dabba's zone
    let heaviest_normal_zone = dabbas
        .iter()
        .filter(|d| !d.is_fragile)
        .max_by(|a, b| a.weight_kg.partial_cmp(&b.weight_kg).unwrap())
        .map(|d| &d.zone);
    println!("  Heaviest normal dabba zone: {:?}", heaviest_normal_zone);
    // Output: Heaviest normal dabba zone: Some("Bandra")

    // Pipeline 7: Unique zones using fold
    let zones: Vec<String> = dabbas
        .iter()
        .map(|d| d.zone.clone())
        .fold(Vec::new(), |mut acc, zone| {
            if !acc.contains(&zone) {
                acc.push(zone);
            }
            acc
        });
    println!("  Unique zones: {:?}", zones);
    // Output: Unique zones: ["Andheri", "Bandra", "Colaba", "Dadar"]
}

// ============================================================
// 9. RANGE ITERATORS AND USEFUL STANDARD ITERATORS
// ============================================================

fn demonstrate_standard_iterators() {
    println!("\n--- 9. Standard Iterators ---");

    // Range iterators
    let range_sum: i32 = (1..=100).sum();
    println!("  Sum 1..=100: {}", range_sum);
    // Output: Sum 1..=100: 5050

    // std::iter::repeat
    let zeros: Vec<i32> = std::iter::repeat(0).take(5).collect();
    println!("  Repeat(0, 5): {:?}", zeros);
    // Output: Repeat(0, 5): [0, 0, 0, 0, 0]

    // std::iter::once — single element iterator
    let with_header: Vec<&str> = std::iter::once("HEADER")
        .chain(vec!["row1", "row2", "row3"].into_iter())
        .collect();
    println!("  Once + chain: {:?}", with_header);
    // Output: Once + chain: ["HEADER", "row1", "row2", "row3"]

    // std::iter::from_fn — create from closure
    let mut counter = 0;
    let first_five: Vec<i32> = std::iter::from_fn(|| {
        counter += 1;
        if counter <= 5 {
            Some(counter * counter)
        } else {
            None
        }
    })
    .collect();
    println!("  from_fn squares: {:?}", first_five);
    // Output: from_fn squares: [1, 4, 9, 16, 25]

    // std::iter::successors
    let powers_of_2: Vec<u64> = std::iter::successors(Some(1u64), |&prev| {
        prev.checked_mul(2)
    })
    .take(10)
    .collect();
    println!("  Powers of 2: {:?}", powers_of_2);
    // Output: Powers of 2: [1, 2, 4, 8, 16, 32, 64, 128, 256, 512]

    // Chaining multiple ranges
    let combined: Vec<i32> = (1..=3).chain(10..=12).chain(100..=102).collect();
    println!("  Combined ranges: {:?}", combined);
    // Output: Combined ranges: [1, 2, 3, 10, 11, 12, 100, 101, 102]

    // Zip with index (alternative to enumerate)
    let items = vec!["chai", "samosa", "jalebi"];
    let indexed: Vec<_> = (1..).zip(items.iter()).collect();
    println!("  Indexed: {:?}", indexed);
    // Output: Indexed: [(1, "chai"), (2, "samosa"), (3, "jalebi")]
}

// ============================================================
// MAIN — Putting It All Together
// ============================================================
fn main() {
    println!("=== RUST ITERATORS: Dabbawala Pipeline ===\n");

    demonstrate_iterator_basics();
    demonstrate_consuming_adaptors();
    demonstrate_lazy_evaluation();
    demonstrate_iterator_adaptors();
    demonstrate_fold_reduce();
    demonstrate_custom_iterator();
    demonstrate_into_iterator();
    demonstrate_practical_pipelines();
    demonstrate_standard_iterators();

    // ============================================================
    // KEY TAKEAWAYS
    // ============================================================
    println!("\n=== KEY TAKEAWAYS ===");
    println!("1. Iterator trait needs only next() -> Option<Item>");
    println!("2. .iter() borrows, .iter_mut() mutably borrows, .into_iter() consumes");
    println!("3. Adaptors (map, filter) are LAZY — no work until consumed");
    println!("4. Consuming adaptors (collect, sum, count, fold) drive the pipeline");
    println!("5. fold is the most general accumulator — many methods are special cases");
    println!("6. Implement Iterator for custom types to get 70+ methods free");
    println!("7. IntoIterator enables for-loop support for custom types");
    println!("8. Chain adaptors for readable, efficient data pipelines");
    println!("9. Infinite iterators + take() = elegant bounded sequences");
    println!("10. Iterator chains compile to the same code as hand-written loops");
}
