// ============================================================
// 12 - COLLECTIONS: Vec<T>
// ============================================================
// WHY THIS MATTERS:
// Vec<T> is the most used collection in Rust — a growable,
// heap-allocated array. Whether you're storing user records,
// processing CSV rows, buffering network packets, or building
// a game entity list, Vec is your go-to. Understanding its
// API (push, pop, sort, retain, drain, iter) and its memory
// model (capacity vs length) makes you effective in Rust.
// ============================================================

// ============================================================
// STORY: The Jio Cinema Watchlist
// ============================================================
// You open Jio Cinema and start building your watchlist:
// - You ADD movies you want to watch (push)
// - You REMOVE the last one you changed your mind about (pop)
// - You REORDER them by rating or release date (sort)
// - You FILTER out movies you've already seen (retain)
// - You MOVE some movies to a "watched" list (drain)
// - You check HOW MANY movies are in your list (len)
// - You REMOVE duplicates when you accidentally add twice (dedup)
//
// A Vec in Rust is exactly this watchlist — dynamic, ordered,
// and packed with methods to manipulate your data efficiently.
// ============================================================

// ============================================================
// 1. CREATING VECTORS
// ============================================================
// WHY: There are multiple ways to create a Vec. Each serves
// different needs — empty, pre-filled, from iterators, etc.

fn demo_creating_vecs() {
    println!("=== 1. Creating Vectors ===\n");

    // WHY: Vec::new() creates an empty vector. Type inferred from usage.
    let mut watchlist: Vec<String> = Vec::new();
    watchlist.push(String::from("RRR"));
    println!("From new: {:?}", watchlist);
    // Output: From new: ["RRR"]

    // WHY: vec! macro — the most common way. Like array literals but growable.
    let movies = vec!["Bahubali", "KGF", "Pushpa", "Jawan", "Pathaan"];
    println!("From macro: {:?}", movies);
    // Output: From macro: ["Bahubali", "KGF", "Pushpa", "Jawan", "Pathaan"]

    // WHY: vec![value; count] creates a vector with repeated values.
    let ratings = vec![0u8; 5]; // 5 zeros
    println!("Repeated: {:?}", ratings);
    // Output: Repeated: [0, 0, 0, 0, 0]

    // WHY: Vec::with_capacity pre-allocates memory. Avoids reallocation
    // when you know the approximate size upfront.
    let mut upcoming = Vec::with_capacity(10);
    upcoming.push("Pushpa 2");
    upcoming.push("KGF 3");
    println!("With capacity: {:?} (len={}, cap={})",
        upcoming, upcoming.len(), upcoming.capacity());
    // Output: With capacity: ["Pushpa 2", "KGF 3"] (len=2, cap=10)

    // WHY: From an iterator using collect().
    let numbers: Vec<i32> = (1..=5).collect();
    println!("From range: {:?}", numbers);
    // Output: From range: [1, 2, 3, 4, 5]

    // WHY: From a slice.
    let source = [10, 20, 30, 40];
    let from_slice = source.to_vec();
    println!("From slice: {:?}", from_slice);
    // Output: From slice: [10, 20, 30, 40]
}

// ============================================================
// 2. PUSH, POP, INSERT, REMOVE
// ============================================================
// WHY: These are the fundamental mutation operations. push/pop
// are O(1), insert/remove at arbitrary positions are O(n).

fn demo_push_pop() {
    println!("\n=== 2. Push, Pop, Insert, Remove ===\n");

    let mut watchlist = vec![
        String::from("RRR"),
        String::from("KGF"),
        String::from("Bahubali"),
    ];
    println!("Initial: {:?}", watchlist);
    // Output: Initial: ["RRR", "KGF", "Bahubali"]

    // WHY: push adds to the end — O(1) amortized.
    watchlist.push(String::from("Jawan"));
    watchlist.push(String::from("Pushpa"));
    println!("After push: {:?}", watchlist);
    // Output: After push: ["RRR", "KGF", "Bahubali", "Jawan", "Pushpa"]

    // WHY: pop removes from the end — returns Option<T>.
    let removed = watchlist.pop();
    println!("Popped: {:?}", removed);
    // Output: Popped: Some("Pushpa")
    println!("After pop: {:?}", watchlist);
    // Output: After pop: ["RRR", "KGF", "Bahubali", "Jawan"]

    // WHY: insert at specific index — shifts elements right. O(n).
    watchlist.insert(1, String::from("Dangal"));
    println!("After insert at 1: {:?}", watchlist);
    // Output: After insert at 1: ["RRR", "Dangal", "KGF", "Bahubali", "Jawan"]

    // WHY: remove at index — shifts elements left. O(n).
    let removed = watchlist.remove(2);
    println!("Removed index 2: {}", removed);
    // Output: Removed index 2: KGF
    println!("After remove: {:?}", watchlist);
    // Output: After remove: ["RRR", "Dangal", "Bahubali", "Jawan"]

    // WHY: swap_remove is O(1) but doesn't preserve order —
    // swaps the element with the last one, then pops.
    let removed = watchlist.swap_remove(0);
    println!("swap_remove(0): {} -> {:?}", removed, watchlist);
    // Output: swap_remove(0): RRR -> ["Jawan", "Dangal", "Bahubali"]
}

// ============================================================
// 3. INDEXING AND GET
// ============================================================
// WHY: Direct indexing ([i]) panics on out-of-bounds. get(i) returns
// Option — safe but requires handling None. Choose wisely.

fn demo_indexing() {
    println!("\n=== 3. Indexing and get() ===\n");

    let movies = vec!["Lagaan", "3 Idiots", "PK", "Dangal", "Chhichhore"];

    // WHY: Direct index — fast but panics if out of bounds.
    println!("First: {}", movies[0]);       // Output: First: Lagaan
    println!("Third: {}", movies[2]);       // Output: Third: PK

    // WHY: get() returns Option — safe alternative.
    match movies.get(10) {
        Some(movie) => println!("Found: {}", movie),
        None => println!("Index 10: Not found (safe!)"),
    }
    // Output: Index 10: Not found (safe!)

    // WHY: first() and last() return Option.
    println!("First: {:?}", movies.first());   // Output: First: Some("Lagaan")
    println!("Last: {:?}", movies.last());     // Output: Last: Some("Chhichhore")

    // WHY: Slicing — borrow a portion of the vector.
    let top_three = &movies[0..3];
    println!("Top 3: {:?}", top_three);
    // Output: Top 3: ["Lagaan", "3 Idiots", "PK"]

    // WHY: contains() checks membership.
    println!("Has PK: {}", movies.contains(&"PK"));
    // Output: Has PK: true
    println!("Has Gadar: {}", movies.contains(&"Gadar"));
    // Output: Has Gadar: false

    // WHY: position() finds the index of an element.
    let pos = movies.iter().position(|&m| m == "Dangal");
    println!("Dangal at index: {:?}", pos);
    // Output: Dangal at index: Some(3)
}

// ============================================================
// 4. ITERATION
// ============================================================
// WHY: Iterating over vectors is THE most common operation.
// Rust provides iter() (borrow), iter_mut() (mutable borrow),
// and into_iter() (take ownership).

fn demo_iteration() {
    println!("\n=== 4. Iteration ===\n");

    let movies = vec!["RRR", "KGF", "Bahubali", "Pushpa", "Jawan"];

    // WHY: iter() borrows each element — vector still usable after.
    println!("Watchlist:");
    for (i, movie) in movies.iter().enumerate() {
        println!("  {}. {}", i + 1, movie);
    }
    // Output: Watchlist:
    // Output:   1. RRR
    // Output:   2. KGF
    // Output:   3. Bahubali
    // Output:   4. Pushpa
    // Output:   5. Jawan

    // WHY: iter_mut() allows modifying elements in-place.
    let mut ratings = vec![7.5, 8.0, 9.0, 7.0, 8.5];
    for rating in ratings.iter_mut() {
        *rating += 0.5; // Bonus points for everyone!
    }
    println!("\nBoosted ratings: {:?}", ratings);
    // Output: Boosted ratings: [8.0, 8.5, 9.5, 7.5, 9.0]

    // WHY: for loop on &vec is syntactic sugar for iter().
    let genres = vec!["Action", "Drama", "Thriller"];
    for genre in &genres {
        print!("{} ", genre);
    }
    println!();
    // Output: Action Drama Thriller

    // WHY: Functional-style iteration with map/filter/collect.
    let prices = vec![199, 299, 499, 149, 599];
    let discounted: Vec<f64> = prices
        .iter()
        .filter(|&&p| p >= 200)
        .map(|&p| p as f64 * 0.8)
        .collect();
    println!("\nDiscounted prices (>= 200): {:?}", discounted);
    // Output: Discounted prices (>= 200): [239.2, 399.2, 479.2]
}

// ============================================================
// 5. SORT AND SORT_BY
// ============================================================
// WHY: Sorting is fundamental. sort() works for Ord types.
// sort_by() takes a custom comparator. sort_by_key() extracts
// a sort key from each element.

fn demo_sorting() {
    println!("\n=== 5. Sorting ===\n");

    // WHY: sort() — ascending order for types implementing Ord.
    let mut ratings = vec![7.5_f64, 9.2, 6.8, 8.5, 7.0, 9.5];
    // f64 doesn't implement Ord (because of NaN), so we use sort_by.
    ratings.sort_by(|a, b| a.partial_cmp(b).unwrap());
    println!("Sorted ratings: {:?}", ratings);
    // Output: Sorted ratings: [6.8, 7.0, 7.5, 8.5, 9.2, 9.5]

    // WHY: Reverse sort.
    ratings.sort_by(|a, b| b.partial_cmp(a).unwrap());
    println!("Top ratings first: {:?}", ratings);
    // Output: Top ratings first: [9.5, 9.2, 8.5, 7.5, 7.0, 6.8]

    // WHY: sort_by_key extracts a key for comparison.
    let mut movies = vec![
        ("RRR", 2022),
        ("Bahubali", 2015),
        ("KGF", 2018),
        ("Pushpa", 2021),
        ("Jawan", 2023),
    ];

    movies.sort_by_key(|&(_, year)| year);
    println!("\nBy year:");
    for (name, year) in &movies {
        println!("  {} ({})", name, year);
    }
    // Output: By year:
    // Output:   Bahubali (2015)
    // Output:   KGF (2018)
    // Output:   Pushpa (2021)
    // Output:   RRR (2022)
    // Output:   Jawan (2023)

    // WHY: Sort strings alphabetically.
    let mut names = vec!["Pushpa", "Arjun", "Bahubali", "KGF", "Dangal"];
    names.sort();
    println!("\nAlphabetical: {:?}", names);
    // Output: Alphabetical: ["Arjun", "Bahubali", "Dangal", "KGF", "Pushpa"]

    // WHY: Sort by string length.
    names.sort_by_key(|name| name.len());
    println!("By length: {:?}", names);
    // Output: By length: ["KGF", "Arjun", "Pushpa", "Dangal", "Bahubali"]
}

// ============================================================
// 6. RETAIN — FILTER IN-PLACE
// ============================================================
// WHY: retain keeps only elements matching a predicate, removing
// the rest IN-PLACE. More efficient than filter().collect() when
// you want to modify the original vector.

fn demo_retain() {
    println!("\n=== 6. Retain ===\n");

    let mut watchlist = vec![
        ("RRR", true),
        ("KGF", false),
        ("Bahubali", true),
        ("Pushpa", false),
        ("Jawan", true),
        ("Pathaan", false),
    ];
    println!("Full list: {:?}", watchlist);

    // WHY: retain keeps elements where the closure returns true.
    // Remove already-watched movies (second element is true = watched).
    watchlist.retain(|(_, watched)| !watched);
    println!("Unwatched only: {:?}", watchlist);
    // Output: Unwatched only: [("KGF", false), ("Pushpa", false), ("Pathaan", false)]

    // WHY: retain with numbers — keep only high ratings.
    let mut scores = vec![3, 7, 2, 9, 5, 8, 1, 6, 10, 4];
    println!("\nAll scores: {:?}", scores);
    scores.retain(|&s| s >= 7);
    println!("High scores (>= 7): {:?}", scores);
    // Output: High scores (>= 7): [7, 9, 8, 10]
}

// ============================================================
// 7. DRAIN — REMOVE A RANGE
// ============================================================
// WHY: drain removes a range of elements and returns them as an
// iterator. The original vector shrinks. Useful for splitting
// or moving elements between collections.

fn demo_drain() {
    println!("\n=== 7. Drain ===\n");

    let mut queue = vec![
        String::from("Ticket #1"),
        String::from("Ticket #2"),
        String::from("Ticket #3"),
        String::from("Ticket #4"),
        String::from("Ticket #5"),
    ];
    println!("Queue: {:?}", queue);

    // WHY: drain(0..3) removes first 3 elements, returns them.
    let processed: Vec<String> = queue.drain(0..3).collect();
    println!("Processed: {:?}", processed);
    // Output: Processed: ["Ticket #1", "Ticket #2", "Ticket #3"]
    println!("Remaining: {:?}", queue);
    // Output: Remaining: ["Ticket #4", "Ticket #5"]

    // WHY: drain(..) removes ALL elements (like clear but gives ownership).
    let mut old_list = vec![1, 2, 3, 4, 5];
    let mut new_list = Vec::new();
    new_list.extend(old_list.drain(..));
    println!("\nMoved all: new={:?}, old={:?}", new_list, old_list);
    // Output: Moved all: new=[1, 2, 3, 4, 5], old=[]
}

// ============================================================
// 8. DEDUP — REMOVE CONSECUTIVE DUPLICATES
// ============================================================
// WHY: dedup removes consecutive duplicate elements. For removing
// ALL duplicates, sort first then dedup. dedup_by_key lets you
// customize what "duplicate" means.

fn demo_dedup() {
    println!("\n=== 8. Dedup ===\n");

    // WHY: dedup only removes CONSECUTIVE duplicates.
    let mut items = vec![1, 1, 2, 3, 3, 3, 2, 1, 1];
    println!("Before dedup: {:?}", items);
    items.dedup();
    println!("After dedup: {:?}", items);
    // Output: Before dedup: [1, 1, 2, 3, 3, 3, 2, 1, 1]
    // Output: After dedup: [1, 2, 3, 2, 1]

    // WHY: To remove ALL duplicates, sort first.
    let mut all_items = vec![3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5];
    all_items.sort();
    all_items.dedup();
    println!("\nSort + dedup: {:?}", all_items);
    // Output: Sort + dedup: [1, 2, 3, 4, 5, 6, 9]

    // WHY: dedup_by_key — custom dedup logic.
    let mut movies = vec![
        (String::from("RRR"), 2022),
        (String::from("RRR"), 2022),
        (String::from("KGF"), 2018),
        (String::from("KGF"), 2018),
        (String::from("Pushpa"), 2021),
    ];
    movies.dedup_by_key(|m| m.0.clone());
    println!("Deduped movies: {:?}", movies);
    // Output: Deduped movies: [("RRR", 2022), ("KGF", 2018), ("Pushpa", 2021)]
}

// ============================================================
// 9. CAPACITY AND MEMORY
// ============================================================
// WHY: Vec grows dynamically by reallocating. Understanding
// capacity helps you write efficient code — pre-allocate when
// possible, and shrink when done.

fn demo_capacity() {
    println!("\n=== 9. Capacity and Memory ===\n");

    let mut v: Vec<i32> = Vec::new();
    println!("Empty: len={}, capacity={}", v.len(), v.capacity());
    // Output: Empty: len=0, capacity=0

    // WHY: First push allocates (typically 4 or more elements).
    v.push(1);
    println!("After 1 push: len={}, capacity={}", v.len(), v.capacity());

    // WHY: Watch capacity grow as we push more elements.
    for i in 2..=20 {
        v.push(i);
    }
    println!("After 20 pushes: len={}, capacity={}", v.len(), v.capacity());

    // WHY: shrink_to_fit reduces capacity to match length.
    v.shrink_to_fit();
    println!("After shrink: len={}, capacity={}", v.len(), v.capacity());
    // Output: After shrink: len=20, capacity=20

    // WHY: reserve ensures at least N additional slots without reallocation.
    v.reserve(100);
    println!("After reserve(100): len={}, capacity={}", v.len(), v.capacity());

    // WHY: truncate reduces length, dropping excess elements.
    v.truncate(5);
    println!("After truncate(5): len={}, capacity={}", v.len(), v.capacity());
    println!("Content: {:?}", v);
    // Output: Content: [1, 2, 3, 4, 5]

    // WHY: clear removes all elements but keeps allocated memory.
    let cap_before = v.capacity();
    v.clear();
    println!("After clear: len={}, capacity={} (was {})",
        v.len(), v.capacity(), cap_before);
}

// ============================================================
// 10. EXTEND, APPEND, SPLIT_OFF, CONCAT
// ============================================================
// WHY: Combining and splitting vectors is common when processing
// batched data, merging results, or partitioning work.

fn demo_extend_and_split() {
    println!("\n=== 10. Extend, Append, Split_off ===\n");

    // WHY: extend adds elements from an iterator.
    let mut hindi = vec!["Jawan", "Pathaan"];
    let south = vec!["RRR", "KGF", "Pushpa"];
    hindi.extend(south.iter());
    println!("Extended: {:?}", hindi);
    // Output: Extended: ["Jawan", "Pathaan", "RRR", "KGF", "Pushpa"]

    // WHY: append moves ALL elements from another vec (emptying it).
    let mut all_movies: Vec<String> = vec![String::from("Lagaan")];
    let mut new_movies = vec![String::from("Dunki"), String::from("Animal")];
    all_movies.append(&mut new_movies);
    println!("After append: {:?}", all_movies);
    // Output: After append: ["Lagaan", "Dunki", "Animal"]
    println!("Source after append: {:?}", new_movies);
    // Output: Source after append: []

    // WHY: split_off splits a vector at an index.
    let mut playlist = vec![1, 2, 3, 4, 5, 6, 7, 8];
    let second_half = playlist.split_off(4);
    println!("\nFirst half: {:?}", playlist);
    // Output: First half: [1, 2, 3, 4]
    println!("Second half: {:?}", second_half);
    // Output: Second half: [5, 6, 7, 8]

    // WHY: concat and join on slices of slices.
    let parts: Vec<&[i32]> = vec![&[1, 2], &[3, 4], &[5, 6]];
    let flat: Vec<i32> = parts.into_iter().flat_map(|s| s.iter().copied()).collect();
    println!("Flattened: {:?}", flat);
    // Output: Flattened: [1, 2, 3, 4, 5, 6]
}

// ============================================================
// 11. PRACTICAL EXAMPLE — MOVIE WATCHLIST MANAGER
// ============================================================
// WHY: Combining all Vec operations in a realistic scenario.

#[derive(Debug, Clone)]
struct Movie {
    title: String,
    year: u16,
    rating: f64,
    watched: bool,
}

impl Movie {
    fn new(title: &str, year: u16, rating: f64) -> Self {
        Self {
            title: String::from(title),
            year,
            rating,
            watched: false,
        }
    }
}

struct Watchlist {
    movies: Vec<Movie>,
}

impl Watchlist {
    fn new() -> Self {
        Self { movies: Vec::new() }
    }

    fn add(&mut self, movie: Movie) {
        if !self.movies.iter().any(|m| m.title == movie.title) {
            println!("  Added: {}", movie.title);
            self.movies.push(movie);
        } else {
            println!("  Already in list: {}", movie.title);
        }
    }

    fn mark_watched(&mut self, title: &str) {
        if let Some(movie) = self.movies.iter_mut().find(|m| m.title == title) {
            movie.watched = true;
            println!("  Marked '{}' as watched", title);
        }
    }

    fn remove_watched(&mut self) -> Vec<Movie> {
        let watched: Vec<Movie> = self.movies.iter().filter(|m| m.watched).cloned().collect();
        self.movies.retain(|m| !m.watched);
        watched
    }

    fn top_rated(&self, n: usize) -> Vec<&Movie> {
        let mut sorted: Vec<&Movie> = self.movies.iter().collect();
        sorted.sort_by(|a, b| b.rating.partial_cmp(&a.rating).unwrap());
        sorted.truncate(n);
        sorted
    }

    fn display(&self) {
        println!("\n  --- Watchlist ({} movies) ---", self.movies.len());
        for (i, movie) in self.movies.iter().enumerate() {
            let status = if movie.watched { "done" } else { "pending" };
            println!("  {}. {} ({}) - {:.1}/10 [{}]",
                i + 1, movie.title, movie.year, movie.rating, status);
        }
    }
}

fn demo_practical_watchlist() {
    println!("\n=== 11. Practical: Movie Watchlist ===\n");

    let mut list = Watchlist::new();

    // Adding movies.
    println!("Adding movies:");
    list.add(Movie::new("RRR", 2022, 8.0));
    list.add(Movie::new("KGF Chapter 2", 2022, 7.4));
    list.add(Movie::new("Bahubali 2", 2017, 8.2));
    list.add(Movie::new("Tumbbad", 2018, 8.3));
    list.add(Movie::new("Jawan", 2023, 6.9));
    list.add(Movie::new("Pushpa", 2021, 7.6));
    list.add(Movie::new("RRR", 2022, 8.0)); // Duplicate
    // Output: Added: RRR
    // Output: Added: KGF Chapter 2
    // Output: Added: Bahubali 2
    // Output: Added: Tumbbad
    // Output: Added: Jawan
    // Output: Added: Pushpa
    // Output: Already in list: RRR

    list.display();

    // Mark some as watched.
    println!("\nWatching movies:");
    list.mark_watched("RRR");
    list.mark_watched("Bahubali 2");

    // Move watched to history.
    let history = list.remove_watched();
    println!("\nMoved to history: {:?}",
        history.iter().map(|m| &m.title).collect::<Vec<_>>());
    // Output: Moved to history: ["RRR", "Bahubali 2"]

    list.display();

    // Top rated.
    println!("\n  Top 3 rated:");
    for movie in list.top_rated(3) {
        println!("    {} - {:.1}/10", movie.title, movie.rating);
    }
    // Output:   Top 3 rated:
    // Output:     Tumbbad - 8.3/10
    // Output:     Pushpa - 7.6/10
    // Output:     KGF Chapter 2 - 7.4/10
}

// ============================================================
// MAIN
// ============================================================

fn main() {
    demo_creating_vecs();
    demo_push_pop();
    demo_indexing();
    demo_iteration();
    demo_sorting();
    demo_retain();
    demo_drain();
    demo_dedup();
    demo_capacity();
    demo_extend_and_split();
    demo_practical_watchlist();

    // ============================================================
    // KEY TAKEAWAYS
    // ============================================================
    println!("\n=== KEY TAKEAWAYS ===\n");
    println!("1. Vec<T> is a growable, heap-allocated array — Rust's most used collection.");
    println!("2. vec! macro is the easiest way to create: vec![1, 2, 3].");
    println!("3. push/pop are O(1). insert/remove at index are O(n).");
    println!("4. get() returns Option (safe). Direct indexing panics on out-of-bounds.");
    println!("5. iter() borrows, iter_mut() borrows mutably, into_iter() takes ownership.");
    println!("6. sort_by and sort_by_key for custom ordering (f64 needs partial_cmp).");
    println!("7. retain filters in-place. drain removes and returns a range.");
    println!("8. dedup removes consecutive duplicates. Sort first for full dedup.");
    println!("9. capacity vs len: capacity is allocated space, len is used elements.");
    println!("10. extend, append, split_off for combining and splitting vectors.");
}
