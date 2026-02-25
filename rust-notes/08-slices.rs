// ============================================================
//  FILE 8 : Slices
// ============================================================
//  Topic  : &str, &[T], string slices, array slices, range
//           syntax, slice patterns, UTF-8 handling
//
//  WHY THIS MATTERS:
//  Slices let you reference a contiguous portion of a
//  collection without owning it. They're the bridge between
//  owned data and borrowed views — efficient, safe, and
//  zero-cost. &str is the most common slice you'll use.
// ============================================================

// ============================================================
// STORY: Newspaper Cuttings from Morning Paper
//
// Dadi reads the morning newspaper (the full String/Vec).
// She doesn't tear out pages — she marks interesting
// sections with a pencil (creates slices).
//
// A cutting (slice) is just a VIEW into the original paper:
// - It points to where the section starts
// - It knows how long the section is
// - It doesn't own the paper — Dadi still has it
// - If someone throws away the paper, the cutting is invalid
//
// String slice (&str) = marking a paragraph in the paper
// Array slice (&[T]) = marking a row of classifieds
// ============================================================

fn main() {
    // ──────────────────────────────────────────────────────────
    // SECTION 1 — String Slices (&str): Marking Paragraphs
    // ──────────────────────────────────────────────────────────
    // WHY: &str is a reference to a portion of a String (or
    // string literal). It's a pointer + length, no allocation.

    let newspaper = String::from("Breaking: Monsoon arrives in Mumbai today!");

    // Create slices using range syntax
    let headline = &newspaper[0..8];     // "Breaking"
    let location = &newspaper[29..35];   // "Mumbai"
    let full = &newspaper[..];           // entire string

    println!("Headline: {}", headline);
    // Output: Headline: Breaking
    println!("Location: {}", location);
    // Output: Location: Mumbai
    println!("Full: {}", full);
    // Output: Full: Breaking: Monsoon arrives in Mumbai today!

    // Range syntax variants
    let s = String::from("Namaste Bharat");
    let first = &s[..7];       // from start: "Namaste"
    let last = &s[8..];        // to end: "Bharat"
    let mid = &s[4..10];       // middle: "ste Bh"
    let all = &s[..];          // everything: "Namaste Bharat"

    println!("{} | {} | {} | {}", first, last, mid, all);
    // Output: Namaste | Bharat | ste Bh | Namaste Bharat

    // String literals ARE &str already
    let greeting: &str = "Namaste";  // this is a slice into binary data
    println!("Literal slice: {}", greeting);
    // Output: Literal slice: Namaste

    // ──────────────────────────────────────────────────────────
    // SECTION 2 — Array/Vec Slices (&[T]): Classifieds Row
    // ──────────────────────────────────────────────────────────
    // WHY: &[T] is a reference to a contiguous sequence of T.
    // Works with arrays, Vecs, and other contiguous collections.

    let classifieds = [
        "Jobs", "Property", "Matrimonial",
        "Education", "Services", "Vehicles",
    ];

    // Slice of array
    let first_three = &classifieds[..3];
    let last_two = &classifieds[4..];
    let middle = &classifieds[2..4];

    println!("First 3: {:?}", first_three);
    // Output: First 3: ["Jobs", "Property", "Matrimonial"]
    println!("Last 2: {:?}", last_two);
    // Output: Last 2: ["Services", "Vehicles"]
    println!("Middle: {:?}", middle);
    // Output: Middle: ["Matrimonial", "Education"]

    // Vec slice
    let prices: Vec<i32> = vec![150, 200, 350, 120, 450];
    let expensive = &prices[2..4];
    println!("Mid-range: {:?}", expensive);
    // Output: Mid-range: [350, 120]

    // Slice length and emptiness
    println!("Slice length: {}", first_three.len());
    // Output: Slice length: 3
    println!("Is empty: {}", first_three.is_empty());
    // Output: Is empty: false

    // ──────────────────────────────────────────────────────────
    // SECTION 3 — Slice Methods: Dadi's Toolkit
    // ──────────────────────────────────────────────────────────
    // WHY: Slices come with powerful built-in methods for
    // searching, sorting, splitting, and more.

    let numbers = [5, 3, 8, 1, 9, 2, 7, 4, 6];

    // Searching
    println!("Contains 8? {}", numbers.contains(&8));
    // Output: Contains 8? true
    println!("Starts with [5,3]? {}", numbers.starts_with(&[5, 3]));
    // Output: Starts with [5,3]? true
    println!("Ends with [4,6]? {}", numbers.ends_with(&[4, 6]));
    // Output: Ends with [4,6]? true

    // First and last
    println!("First: {:?}", numbers.first());
    // Output: First: Some(5)
    println!("Last: {:?}", numbers.last());
    // Output: Last: Some(6)

    // Sorting (needs mutable slice)
    let mut sortable = [5, 3, 8, 1, 9];
    sortable.sort();
    println!("Sorted: {:?}", sortable);
    // Output: Sorted: [1, 3, 5, 8, 9]

    sortable.sort_by(|a, b| b.cmp(a)); // descending
    println!("Descending: {:?}", sortable);
    // Output: Descending: [9, 8, 5, 3, 1]

    // Reverse
    let mut data = [1, 2, 3, 4, 5];
    data.reverse();
    println!("Reversed: {:?}", data);
    // Output: Reversed: [5, 4, 3, 2, 1]

    // Windows and chunks
    let sales = [100, 200, 150, 300, 250, 400];
    println!("\nWindows of 3:");
    for window in sales.windows(3) {
        let avg: i32 = window.iter().sum::<i32>() / 3;
        println!("  {:?} → avg: {}", window, avg);
    }
    // Output:
    // Windows of 3:
    //   [100, 200, 150] → avg: 150
    //   [200, 150, 300] → avg: 216
    //   [150, 300, 250] → avg: 233
    //   [300, 250, 400] → avg: 316

    println!("\nChunks of 2:");
    for chunk in sales.chunks(2) {
        println!("  {:?}", chunk);
    }
    // Output:
    // Chunks of 2:
    //   [100, 200]
    //   [150, 300]
    //   [250, 400]

    // Split
    let data = [1, 0, 2, 0, 3];
    let parts: Vec<&[i32]> = data.split(|&x| x == 0).collect();
    println!("Split on 0: {:?}", parts);
    // Output: Split on 0: [[1], [2], [3]]

    // ──────────────────────────────────────────────────────────
    // SECTION 4 — String Slice Methods: Text Processing
    // ──────────────────────────────────────────────────────────
    // WHY: &str has methods for everyday text operations.

    let article = "  Mumbai rains: Heavy showers expected today!  ";

    // Trimming
    println!("Trimmed: '{}'", article.trim());
    // Output: Trimmed: 'Mumbai rains: Heavy showers expected today!'

    // Splitting
    let headline = "Monsoon-hits-Kerala-coast";
    let words: Vec<&str> = headline.split('-').collect();
    println!("Words: {:?}", words);
    // Output: Words: ["Monsoon", "hits", "Kerala", "coast"]

    // Split whitespace
    let text = "chai   samosa   jalebi";
    let items: Vec<&str> = text.split_whitespace().collect();
    println!("Items: {:?}", items);
    // Output: Items: ["chai", "samosa", "jalebi"]

    // Searching
    let news = "India wins cricket match against Australia";
    println!("Contains 'cricket': {}", news.contains("cricket"));
    // Output: Contains 'cricket': true
    println!("Starts with 'India': {}", news.starts_with("India"));
    // Output: Starts with 'India': true
    println!("Find 'wins': {:?}", news.find("wins"));
    // Output: Find 'wins': Some(6)

    // Case conversion
    println!("Upper: {}", "namaste".to_uppercase());
    // Output: Upper: NAMASTE
    println!("Lower: {}", "BHARAT".to_lowercase());
    // Output: Lower: bharat

    // Replace
    let censored = "Bad word here".replace("Bad", "***");
    println!("{}", censored);
    // Output: *** word here

    // Repeat
    println!("{}", "Na ".repeat(4));
    // Output: Na Na Na Na

    // ──────────────────────────────────────────────────────────
    // SECTION 5 — UTF-8 and Byte Slicing: Hindi Headlines
    // ──────────────────────────────────────────────────────────
    // WHY: Rust strings are UTF-8. Multi-byte characters
    // mean byte index ≠ character index. Slicing at wrong
    // byte boundaries PANICS.

    let hindi = "नमस्ते भारत";
    println!("Hindi: {}", hindi);
    // Output: Hindi: नमस्ते भारत

    println!("Byte length: {}", hindi.len());      // bytes, not chars
    println!("Char count: {}", hindi.chars().count()); // actual characters

    // Safe character iteration
    for (i, ch) in hindi.chars().enumerate() {
        print!("{}:'{}' ", i, ch);
    }
    println!();

    // DANGER: byte slicing on UTF-8
    // let bad = &hindi[0..2];  // PANIC! 2 bytes is mid-character

    // Safe: use char_indices
    let chars: Vec<(usize, char)> = hindi.char_indices().collect();
    println!("Char indices: {:?}", &chars[..3]);

    // Safe way to get first N characters
    let first_three: String = hindi.chars().take(3).collect();
    println!("First 3 chars: {}", first_three);
    // Output: First 3 chars: नमस

    // ──────────────────────────────────────────────────────────
    // SECTION 6 — Functions with Slices: Preferred Pattern
    // ──────────────────────────────────────────────────────────
    // WHY: Accept &str instead of &String, and &[T] instead of
    // &Vec<T>. Slices are more general — they work with both
    // owned and borrowed data.

    // BAD: accepts only &String
    // fn print_name(name: &String) { ... }

    // GOOD: accepts &str (works with String AND &str)
    fn print_name(name: &str) {
        println!("Name: {}", name);
    }

    let owned = String::from("Ramesh");
    let literal = "Sharma";

    print_name(&owned);    // &String → &str (auto deref)
    print_name(literal);   // &str directly
    // Output: Name: Ramesh
    // Output: Name: Sharma

    // Same for arrays/Vecs
    fn sum_slice(numbers: &[i32]) -> i32 {
        numbers.iter().sum()
    }

    let array = [1, 2, 3, 4, 5];
    let vector = vec![10, 20, 30];

    println!("Array sum: {}", sum_slice(&array));   // &[i32; 5] → &[i32]
    println!("Vec sum: {}", sum_slice(&vector));     // &Vec<i32> → &[i32]
    println!("Slice sum: {}", sum_slice(&array[1..4])); // &[i32] directly
    // Output: Array sum: 15
    // Output: Vec sum: 60
    // Output: Slice sum: 9

    // ──────────────────────────────────────────────────────────
    // SECTION 7 — Mutable Slices: Editing the Paper
    // ──────────────────────────────────────────────────────────
    // WHY: &mut [T] lets you modify elements in place.

    let mut scores = [78, 92, 65, 88, 71];
    println!("Before: {:?}", scores);
    // Output: Before: [78, 92, 65, 88, 71]

    // Modify through mutable slice
    let first_half = &mut scores[..3];
    for score in first_half.iter_mut() {
        *score += 5; // grace marks!
    }
    println!("After grace: {:?}", scores);
    // Output: After grace: [83, 97, 70, 88, 71]

    // Swap elements
    scores.swap(0, 4);
    println!("After swap: {:?}", scores);
    // Output: After swap: [71, 97, 70, 88, 83]

    // Fill
    let mut blanks = [0; 5];
    blanks[1..4].fill(42);
    println!("Filled: {:?}", blanks);
    // Output: Filled: [0, 42, 42, 42, 0]

    // ──────────────────────────────────────────────────────────
    // SECTION 8 — Slice Patterns: Pattern Matching on Slices
    // ──────────────────────────────────────────────────────────
    // WHY: Rust lets you destructure slices in match arms.

    let sections = ["Sports", "Politics", "Business", "Tech"];

    match sections {
        [] => println!("Empty paper!"),
        [only] => println!("Just: {}", only),
        [first, second] => println!("Two: {} and {}", first, second),
        [first, .., last] => println!("From {} to {}", first, last),
    }
    // Output: From Sports to Tech

    // With rest binding
    let pages = [1, 2, 3, 4, 5];
    match pages {
        [first, rest @ ..] => {
            println!("Page 1: {}, remaining: {:?}", first, rest);
        }
        _ => {}
    }
    // Output: Page 1: 1, remaining: [2, 3, 4, 5]

    // ──────────────────────────────────────────────────────────
    // SECTION 9 — String Building vs Slicing
    // ──────────────────────────────────────────────────────────
    // WHY: Know when to slice vs when to create new strings.

    // Efficient: return a slice (no allocation)
    fn first_word(s: &str) -> &str {
        match s.find(' ') {
            Some(i) => &s[..i],
            None => s,
        }
    }

    let article = "Monsoon arrives early this year";
    let word = first_word(article);
    println!("First word: {}", word);
    // Output: First word: Monsoon

    // Building: when you need a new owned string
    let words: Vec<&str> = article.split_whitespace().collect();
    let reversed: String = words.iter().rev()
        .cloned()
        .collect::<Vec<&str>>()
        .join(" ");
    println!("Reversed: {}", reversed);
    // Output: Reversed: year this early arrives Monsoon

    // ──────────────────────────────────────────────────────────
    // SECTION 10 — Practical Examples: Newspaper Parser
    // ──────────────────────────────────────────────────────────

    // Parse a classified ad
    let ad = "SALE|2BHK|Mumbai|₹85L";
    let fields: Vec<&str> = ad.split('|').collect();
    println!("\n--- Classified ---");
    println!("Type: {}", fields.get(0).unwrap_or(&"Unknown"));
    println!("Property: {}", fields.get(1).unwrap_or(&"N/A"));
    println!("Location: {}", fields.get(2).unwrap_or(&"N/A"));
    println!("Price: {}", fields.get(3).unwrap_or(&"N/A"));
    // Output:
    // --- Classified ---
    // Type: SALE
    // Property: 2BHK
    // Location: Mumbai
    // Price: ₹85L

    // CSV-style parsing
    let csv = "Name,Age,City\nRamesh,35,Pune\nSuresh,28,Mumbai";
    println!("\n--- Parsed CSV ---");
    for (i, line) in csv.lines().enumerate() {
        let cols: Vec<&str> = line.split(',').collect();
        if i == 0 {
            println!("Headers: {:?}", cols);
        } else {
            println!("Row {}: {:?}", i, cols);
        }
    }
    // Output:
    // --- Parsed CSV ---
    // Headers: ["Name", "Age", "City"]
    // Row 1: ["Ramesh", "35", "Pune"]
    // Row 2: ["Suresh", "28", "Mumbai"]

    println!("\n--- Dadi has finished reading the newspaper! ---");
}

// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. &str is a slice (pointer + length) into string data
// 2. &[T] is a slice into an array or Vec
// 3. Slices don't own data — they borrow a contiguous view
// 4. Range syntax: [..3], [2..], [1..4], [..] (full)
// 5. Prefer &str over &String and &[T] over &Vec<T> in params
// 6. String literals are &str (slices into binary)
// 7. UTF-8: byte index ≠ char index — use .chars() safely
// 8. Mutable slices (&mut [T]) allow in-place modification
// 9. Slice patterns in match destructure [first, .., last]
// 10. Dadi's rule: "Mark the section (slice), don't tear the
//     page (clone). A pencil mark (reference) is cheaper
//     than a photocopy (allocation). And always mark at
//     letter boundaries, not in the middle of a word (UTF-8)!"
// ============================================================
