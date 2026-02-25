// ============================================================
// FILE 19: SMART POINTERS — Heap Allocation and Shared Ownership
// ============================================================
// WHY THIS MATTERS:
// Smart pointers are data structures that act like pointers
// but have additional metadata and capabilities. They manage
// memory on the heap, enable shared ownership, provide
// interior mutability, and make recursive data structures
// possible. Understanding them is essential for non-trivial
// Rust programs.
// ============================================================

// ============================================================
// STORY: Netflix India Shared Screen Plan
// ============================================================
// Think of Netflix India's subscription plans:
//
// Box<T>  = MOBILE plan (1 screen) — ONE owner, data on heap.
//           You own the data exclusively. When you're done,
//           it's cleaned up.
//
// Rc<T>   = BASIC plan (family sharing) — MULTIPLE owners of
//           the same data. Mom, Dad, and kids all share the
//           same account. When the LAST family member cancels,
//           the account is deleted. NOT thread-safe (single
//           household only).
//
// Arc<T>  = PREMIUM plan (shared across households) — Like Rc
//           but THREAD-SAFE. Multiple threads (households) can
//           share the same data. Uses atomic operations for
//           the reference count.
//
// RefCell<T> = PARENTAL CONTROLS — Lets you change what's
//              being watched even though the plan is "shared."
//              Interior mutability — mutate data behind an
//              immutable reference, with runtime borrow checking.
// ============================================================

use std::cell::RefCell;
use std::fmt;
use std::ops::Deref;
use std::rc::Rc;
use std::sync::Arc;
use std::borrow::Cow;

// ============================================================
// 1. Box<T> — Heap Allocation with Single Ownership
// ============================================================
// WHY: Box puts data on the heap instead of the stack.
// Use when: data is large, you need a known size at compile
// time (recursive types), or you want to transfer ownership
// without copying.

fn demonstrate_box() {
    println!("--- 1. Box<T> — Single Owner on Heap ---");

    // Basic Box usage
    let subscription = Box::new(String::from("Netflix Mobile Plan"));
    println!("  Plan: {}", subscription);
    // Output: Plan: Netflix Mobile Plan

    // Box owns the data — when it goes out of scope, data is freed
    let price = Box::new(199);
    println!("  Price: Rs.{}", price);
    // Output: Price: Rs.199

    // WHY: You can dereference a Box to get the inner value
    let unboxed: i32 = *price;
    println!("  Unboxed price: Rs.{}", unboxed);
    // Output: Unboxed price: Rs.199

    // Box for large data — avoids stack overflow
    let large_array = Box::new([0u8; 10000]);
    println!("  Large array on heap, first byte: {}", large_array[0]);
    // Output: Large array on heap, first byte: 0

    // Box for trait objects
    let plans: Vec<Box<dyn fmt::Display>> = vec![
        Box::new(String::from("Mobile Plan")),
        Box::new(199),
        Box::new(true),
    ];
    print!("  Plans:");
    for plan in &plans {
        print!(" [{}]", plan);
    }
    println!();
    // Output: Plans: [Mobile Plan] [199] [true]
}

// ============================================================
// 2. RECURSIVE TYPES WITH Box
// ============================================================
// WHY: Recursive types have infinite size. Box gives them a
// known size (pointer size) so the compiler can allocate them.

// A linked list — classic recursive type
#[derive(Debug)]
enum WatchList {
    Show(String, Box<WatchList>), // Each node points to the next
    End,
}

impl WatchList {
    fn new() -> Self {
        WatchList::End
    }

    fn prepend(self, show: &str) -> Self {
        WatchList::Show(String::from(show), Box::new(self))
    }

    fn display(&self) {
        match self {
            WatchList::Show(name, next) => {
                print!("{}", name);
                if !matches!(**next, WatchList::End) {
                    print!(" -> ");
                }
                next.display();
            }
            WatchList::End => println!(),
        }
    }

    fn len(&self) -> usize {
        match self {
            WatchList::Show(_, next) => 1 + next.len(),
            WatchList::End => 0,
        }
    }
}

// Binary tree — another recursive type
#[derive(Debug)]
enum ContentTree {
    Node {
        title: String,
        left: Box<ContentTree>,
        right: Box<ContentTree>,
    },
    Leaf,
}

impl ContentTree {
    fn leaf() -> Self {
        ContentTree::Leaf
    }

    fn node(title: &str, left: ContentTree, right: ContentTree) -> Self {
        ContentTree::Node {
            title: String::from(title),
            left: Box::new(left),
            right: Box::new(right),
        }
    }

    fn count(&self) -> usize {
        match self {
            ContentTree::Node { left, right, .. } => 1 + left.count() + right.count(),
            ContentTree::Leaf => 0,
        }
    }
}

fn demonstrate_recursive_types() {
    println!("\n--- 2. Recursive Types with Box ---");

    // Linked list
    let watchlist = WatchList::new()
        .prepend("Sacred Games")
        .prepend("Mirzapur")
        .prepend("Panchayat");

    print!("  Watchlist: ");
    watchlist.display();
    // Output: Watchlist: Panchayat -> Mirzapur -> Sacred Games

    println!("  Length: {}", watchlist.len());
    // Output: Length: 3

    // Binary tree
    let catalog = ContentTree::node(
        "All Content",
        ContentTree::node(
            "Movies",
            ContentTree::node("Bollywood", ContentTree::leaf(), ContentTree::leaf()),
            ContentTree::node("Hollywood", ContentTree::leaf(), ContentTree::leaf()),
        ),
        ContentTree::node(
            "Series",
            ContentTree::node("Hindi", ContentTree::leaf(), ContentTree::leaf()),
            ContentTree::node("English", ContentTree::leaf(), ContentTree::leaf()),
        ),
    );

    println!("  Content tree nodes: {}", catalog.count());
    // Output: Content tree nodes: 7
}

// ============================================================
// 3. DEREF TRAIT — Smart Pointer Transparency
// ============================================================
// WHY: The Deref trait lets smart pointers behave like regular
// references. When you dereference a Box<String>, Rust
// automatically follows the chain: Box -> String -> str.

// Custom smart pointer to understand Deref
struct MyBox<T>(T);

impl<T> MyBox<T> {
    fn new(x: T) -> MyBox<T> {
        MyBox(x)
    }
}

impl<T> Deref for MyBox<T> {
    type Target = T;

    fn deref(&self) -> &T {
        // WHY: Returns a reference to the inner value.
        // When you write *my_box, Rust calls *(my_box.deref())
        &self.0
    }
}

fn greet_subscriber(name: &str) {
    println!("  Welcome, {}!", name);
}

fn demonstrate_deref() {
    println!("\n--- 3. Deref Trait ---");

    let boxed_name = Box::new(String::from("Rahul"));

    // Deref coercion chain: &Box<String> -> &String -> &str
    greet_subscriber(&boxed_name);
    // Output: Welcome, Rahul!

    // Without deref coercion, you'd need:
    // greet_subscriber(&(*boxed_name)[..]);

    // Custom MyBox
    let my_boxed = MyBox::new(String::from("Priya"));
    greet_subscriber(&my_boxed); // Deref coercion works!
    // Output: Welcome, Priya!

    // Explicit dereference
    let x = MyBox::new(5);
    assert_eq!(5, *x); // *(x.deref())
    println!("  MyBox<5> dereferenced: {}", *x);
    // Output: MyBox<5> dereferenced: 5
}

// ============================================================
// 4. DROP TRAIT — Cleanup When Values Go Out of Scope
// ============================================================
// WHY: Drop is Rust's destructor. It runs automatically when
// a value goes out of scope. Smart pointers use it to free
// heap memory. You can implement it for custom cleanup.

struct Subscription {
    plan: String,
    user: String,
}

impl Subscription {
    fn new(plan: &str, user: &str) -> Self {
        println!("  [Created] {} subscription for {}", plan, user);
        Subscription {
            plan: String::from(plan),
            user: String::from(user),
        }
    }
}

impl Drop for Subscription {
    fn drop(&mut self) {
        // WHY: This runs automatically when the value is dropped
        println!(
            "  [Dropped] {} subscription for {} cancelled",
            self.plan, self.user
        );
    }
}

fn demonstrate_drop() {
    println!("\n--- 4. Drop Trait ---");

    let _sub1 = Subscription::new("Premium", "Amit");
    // Output: [Created] Premium subscription for Amit

    {
        let _sub2 = Subscription::new("Basic", "Priya");
        // Output: [Created] Basic subscription for Priya
        println!("  Inside inner scope");
    } // _sub2 is dropped here
    // Output: [Dropped] Basic subscription for Priya cancelled

    println!("  Back in outer scope");

    // Early drop with std::mem::drop
    let sub3 = Subscription::new("Mobile", "Rahul");
    // Output: [Created] Mobile subscription for Rahul
    println!("  Before early drop");
    drop(sub3); // Explicitly drop early
    // Output: [Dropped] Mobile subscription for Rahul cancelled
    println!("  After early drop");

    // Note: You can't call .drop() directly — use std::mem::drop()
    // sub3.drop(); // ERROR: explicit destructor calls not allowed

    println!("  End of demonstrate_drop");
} // _sub1 is dropped here
// Output: [Dropped] Premium subscription for Amit cancelled

// ============================================================
// 5. Rc<T> — Reference Counted Shared Ownership
// ============================================================
// WHY: Sometimes multiple parts of your program need to own
// the same data. Rc keeps a count of references; when the
// last one is dropped, the data is freed. NOT thread-safe.

fn demonstrate_rc() {
    println!("\n--- 5. Rc<T> — Shared Ownership ---");

    // A Netflix show shared between family members
    let show = Rc::new(String::from("Sacred Games"));
    println!("  Created show, ref count: {}", Rc::strong_count(&show));
    // Output: Created show, ref count: 1

    // Clone increases reference count (NOT a deep copy!)
    let mom_watching = Rc::clone(&show);
    println!("  Mom joined, ref count: {}", Rc::strong_count(&show));
    // Output: Mom joined, ref count: 2

    let dad_watching = Rc::clone(&show);
    println!("  Dad joined, ref count: {}", Rc::strong_count(&show));
    // Output: Dad joined, ref count: 3

    {
        let kid_watching = Rc::clone(&show);
        println!("  Kid joined, ref count: {}", Rc::strong_count(&show));
        // Output: Kid joined, ref count: 4

        // All clones see the same data
        println!("  Kid is watching: {}", kid_watching);
        // Output: Kid is watching: Sacred Games
    } // kid_watching is dropped

    println!("  Kid left, ref count: {}", Rc::strong_count(&show));
    // Output: Kid left, ref count: 3

    // All remaining references point to the same data
    println!("  Mom: {}, Dad: {}", mom_watching, dad_watching);
    // Output: Mom: Sacred Games, Dad: Sacred Games

    // Shared list example — multiple lists sharing a tail
    let shared_tail = Rc::new(vec!["Episode 3", "Episode 4", "Episode 5"]);
    let moms_list = Rc::clone(&shared_tail);
    let dads_list = Rc::clone(&shared_tail);

    println!("  Mom's episodes: {:?}", moms_list);
    println!("  Dad's episodes: {:?}", dads_list);
    println!("  Same data? {}", Rc::ptr_eq(&moms_list, &dads_list));
    // Output: Same data? true
}

// ============================================================
// 6. RefCell<T> — Interior Mutability
// ============================================================
// WHY: Rust's borrow rules normally prevent mutation through
// shared references. RefCell moves borrow checking to RUNTIME,
// letting you mutate data even when you only have a shared
// reference. Panics if you violate borrow rules at runtime.

fn demonstrate_refcell() {
    println!("\n--- 6. RefCell<T> — Interior Mutability ---");

    let watch_history = RefCell::new(vec!["Panchayat S1", "Mirzapur S1"]);

    // Immutable borrow with .borrow()
    println!("  History: {:?}", watch_history.borrow());
    // Output: History: ["Panchayat S1", "Mirzapur S1"]

    // Mutable borrow with .borrow_mut()
    watch_history.borrow_mut().push("Sacred Games S1");
    println!("  After adding: {:?}", watch_history.borrow());
    // Output: After adding: ["Panchayat S1", "Mirzapur S1", "Sacred Games S1"]

    // Multiple immutable borrows are OK
    let borrow1 = watch_history.borrow();
    let borrow2 = watch_history.borrow();
    println!("  Two borrows: {} items, {} items", borrow1.len(), borrow2.len());
    // Output: Two borrows: 3 items, 3 items
    drop(borrow1);
    drop(borrow2); // Must drop immutable borrows before mutable borrow

    // Mutable borrow while immutable borrows exist would PANIC:
    // let borrow = watch_history.borrow();
    // let mut_borrow = watch_history.borrow_mut(); // PANIC at runtime!

    // Interior mutability pattern — method takes &self but modifies internals
    struct WatchTracker {
        shows: RefCell<Vec<String>>,
        view_count: RefCell<u32>,
    }

    impl WatchTracker {
        fn new() -> Self {
            WatchTracker {
                shows: RefCell::new(Vec::new()),
                view_count: RefCell::new(0),
            }
        }

        fn watch(&self, show: &str) {
            // WHY: &self (not &mut self) but we can still mutate!
            self.shows.borrow_mut().push(String::from(show));
            *self.view_count.borrow_mut() += 1;
        }

        fn report(&self) -> String {
            format!(
                "Watched {} shows: {:?}",
                self.view_count.borrow(),
                self.shows.borrow()
            )
        }
    }

    let tracker = WatchTracker::new();
    tracker.watch("Kota Factory");
    tracker.watch("TVF Pitchers");
    tracker.watch("Aspirants");

    println!("  {}", tracker.report());
    // Output: Watched 3 shows: ["Kota Factory", "TVF Pitchers", "Aspirants"]
}

// ============================================================
// 7. Rc<RefCell<T>> — Shared Mutable State
// ============================================================
// WHY: Rc gives shared ownership, RefCell gives interior
// mutability. Together, Rc<RefCell<T>> lets multiple owners
// mutate shared data. This is the most common smart pointer
// combo in single-threaded Rust.

fn demonstrate_rc_refcell() {
    println!("\n--- 7. Rc<RefCell<T>> — Shared + Mutable ---");

    // Shared family watchlist that everyone can modify
    let family_list = Rc::new(RefCell::new(vec![
        String::from("Panchayat"),
    ]));

    // Mom's handle to the list
    let moms_list = Rc::clone(&family_list);
    // Dad's handle to the list
    let dads_list = Rc::clone(&family_list);
    // Kid's handle to the list
    let kids_list = Rc::clone(&family_list);

    // Everyone adds their favorite show
    moms_list.borrow_mut().push(String::from("Delhi Crime"));
    dads_list.borrow_mut().push(String::from("Scam 1992"));
    kids_list.borrow_mut().push(String::from("Kota Factory"));

    println!("  Family watchlist: {:?}", family_list.borrow());
    // Output: Family watchlist: ["Panchayat", "Delhi Crime", "Scam 1992", "Kota Factory"]

    println!("  Ref count: {}", Rc::strong_count(&family_list));
    // Output: Ref count: 4 (original + 3 clones)

    // Observer pattern with Rc<RefCell<T>>
    struct NotificationCenter {
        subscribers: Vec<Rc<RefCell<Vec<String>>>>,
    }

    impl NotificationCenter {
        fn new() -> Self {
            NotificationCenter {
                subscribers: Vec::new(),
            }
        }

        fn subscribe(&mut self, inbox: Rc<RefCell<Vec<String>>>) {
            self.subscribers.push(inbox);
        }

        fn notify(&self, message: &str) {
            for subscriber in &self.subscribers {
                subscriber.borrow_mut().push(String::from(message));
            }
        }
    }

    let user1_inbox = Rc::new(RefCell::new(Vec::<String>::new()));
    let user2_inbox = Rc::new(RefCell::new(Vec::<String>::new()));

    let mut center = NotificationCenter::new();
    center.subscribe(Rc::clone(&user1_inbox));
    center.subscribe(Rc::clone(&user2_inbox));

    center.notify("New season of Mirzapur!");
    center.notify("Price increase from next month");

    println!("  User1 inbox: {:?}", user1_inbox.borrow());
    println!("  User2 inbox: {:?}", user2_inbox.borrow());
    // Output: User1 inbox: ["New season of Mirzapur!", "Price increase from next month"]
    // Output: User2 inbox: ["New season of Mirzapur!", "Price increase from next month"]
}

// ============================================================
// 8. Arc<T> — Thread-Safe Reference Counting
// ============================================================
// WHY: Rc is NOT thread-safe (no atomic operations). Arc uses
// atomic reference counting, making it safe to share across
// threads. The API is identical to Rc.

fn demonstrate_arc() {
    println!("\n--- 8. Arc<T> — Thread-Safe Sharing ---");

    // Arc works the same as Rc but is thread-safe
    let catalog = Arc::new(vec![
        String::from("Sacred Games"),
        String::from("Mirzapur"),
        String::from("Panchayat"),
    ]);

    println!("  Catalog ref count: {}", Arc::strong_count(&catalog));
    // Output: Catalog ref count: 1

    let thread_catalog = Arc::clone(&catalog);
    println!(
        "  After clone, ref count: {}",
        Arc::strong_count(&catalog)
    );
    // Output: After clone, ref count: 2

    // In a real program, you'd send thread_catalog to another thread
    // std::thread::spawn(move || { ... use thread_catalog ... });

    // For now, just demonstrate the API
    println!("  Thread catalog: {:?}", thread_catalog);
    // Output: Thread catalog: ["Sacred Games", "Mirzapur", "Panchayat"]

    println!("  Same data? {}", Arc::ptr_eq(&catalog, &thread_catalog));
    // Output: Same data? true

    drop(thread_catalog);
    println!(
        "  After drop, ref count: {}",
        Arc::strong_count(&catalog)
    );
    // Output: After drop, ref count: 1

    // Arc<Mutex<T>> for shared mutable state across threads
    // (We'll cover Mutex in the concurrency chapter)
    println!("  Arc + Mutex = thread-safe shared mutable state");
    println!("  (Covered in detail in concurrency chapter)");
}

// ============================================================
// 9. Cow<T> — Clone on Write
// ============================================================
// WHY: Cow<T> is an optimization smart pointer. It starts as
// a borrowed reference and only clones (allocates) when you
// need to modify the data. Great for functions that USUALLY
// just read but SOMETIMES need to modify.

fn normalize_title(title: &str) -> Cow<str> {
    // WHY: If the title is already normalized, return a borrow
    // (no allocation). Only allocate if we need to modify.
    if title.contains("  ") || title.starts_with(' ') || title.ends_with(' ') {
        // Need to modify — clone into owned String
        let normalized = title.split_whitespace().collect::<Vec<_>>().join(" ");
        Cow::Owned(normalized)
    } else {
        // Already good — just borrow
        Cow::Borrowed(title)
    }
}

fn add_prefix(title: &str, needs_prefix: bool) -> Cow<str> {
    if needs_prefix {
        Cow::Owned(format!("[NEW] {}", title))
    } else {
        Cow::Borrowed(title)
    }
}

fn demonstrate_cow() {
    println!("\n--- 9. Cow<T> — Clone on Write ---");

    let title1 = "Sacred Games";
    let title2 = "  Mirzapur  Season  2  ";

    let normalized1 = normalize_title(title1);
    let normalized2 = normalize_title(title2);

    println!("  '{}' -> '{}' (borrowed: {})",
        title1,
        normalized1,
        matches!(normalized1, Cow::Borrowed(_))
    );
    // Output: 'Sacred Games' -> 'Sacred Games' (borrowed: true)

    println!("  '{}' -> '{}' (borrowed: {})",
        title2,
        normalized2,
        matches!(normalized2, Cow::Borrowed(_))
    );
    // Output: '  Mirzapur  Season  2  ' -> 'Mirzapur Season 2' (borrowed: false)

    // Cow in collections — efficient when most items don't need modification
    let titles = vec!["Panchayat", "  Kota  Factory ", "Delhi Crime"];
    let normalized: Vec<Cow<str>> = titles.iter().map(|t| normalize_title(t)).collect();
    println!("  Normalized titles:");
    for (orig, norm) in titles.iter().zip(normalized.iter()) {
        let status = if matches!(norm, Cow::Borrowed(_)) {
            "zero-copy"
        } else {
            "allocated"
        };
        println!("    '{}' -> '{}' ({})", orig, norm, status);
    }
    // Output:
    //   'Panchayat' -> 'Panchayat' (zero-copy)
    //   '  Kota  Factory ' -> 'Kota Factory' (allocated)
    //   'Delhi Crime' -> 'Delhi Crime' (zero-copy)

    // add_prefix example
    let prefixed = add_prefix("Mirzapur", true);
    let not_prefixed = add_prefix("Mirzapur", false);
    println!("  Prefixed: {}", prefixed);
    println!("  Not prefixed: {}", not_prefixed);
    // Output: Prefixed: [NEW] Mirzapur
    // Output: Not prefixed: Mirzapur
}

// ============================================================
// 10. COMPARISON TABLE — When to Use What
// ============================================================

fn demonstrate_comparison() {
    println!("\n--- 10. Smart Pointer Comparison ---");

    println!("  +-------------------+------------------+-------------------+");
    println!("  | Pointer           | Ownership        | Thread-Safe?      |");
    println!("  +-------------------+------------------+-------------------+");
    println!("  | Box<T>            | Single owner     | Yes (if T is)     |");
    println!("  | Rc<T>             | Multiple owners  | NO                |");
    println!("  | Arc<T>            | Multiple owners  | YES (atomic)      |");
    println!("  | RefCell<T>        | Single owner     | NO                |");
    println!("  | Rc<RefCell<T>>    | Multi + mutable  | NO                |");
    println!("  | Arc<Mutex<T>>     | Multi + mutable  | YES               |");
    println!("  | Cow<T>            | Borrow or own    | Yes (if T is)     |");
    println!("  +-------------------+------------------+-------------------+");

    println!("\n  When to use what:");
    println!("  - Box<T>: Heap allocation, recursive types, trait objects");
    println!("  - Rc<T>: Multiple owners in single-threaded code");
    println!("  - Arc<T>: Multiple owners across threads");
    println!("  - RefCell<T>: Interior mutability (runtime borrow check)");
    println!("  - Rc<RefCell<T>>: Shared mutable state (single thread)");
    println!("  - Arc<Mutex<T>>: Shared mutable state (multi thread)");
    println!("  - Cow<T>: Optimize for mostly-borrow, sometimes-own");
}

// ============================================================
// 11. PRACTICAL EXAMPLE — Building a Simple Cache
// ============================================================

struct ContentCache {
    entries: RefCell<Vec<(String, String)>>,
    max_size: usize,
    hits: RefCell<u32>,
    misses: RefCell<u32>,
}

impl ContentCache {
    fn new(max_size: usize) -> Self {
        ContentCache {
            entries: RefCell::new(Vec::new()),
            max_size,
            hits: RefCell::new(0),
            misses: RefCell::new(0),
        }
    }

    fn get(&self, key: &str) -> Option<String> {
        let entries = self.entries.borrow();
        for (k, v) in entries.iter() {
            if k == key {
                *self.hits.borrow_mut() += 1;
                return Some(v.clone());
            }
        }
        *self.misses.borrow_mut() += 1;
        None
    }

    fn put(&self, key: &str, value: &str) {
        let mut entries = self.entries.borrow_mut();
        // Remove existing entry with same key
        entries.retain(|(k, _)| k != key);
        // Evict oldest if full
        if entries.len() >= self.max_size {
            entries.remove(0);
        }
        entries.push((String::from(key), String::from(value)));
    }

    fn stats(&self) -> String {
        format!(
            "Cache: {} entries, {} hits, {} misses",
            self.entries.borrow().len(),
            self.hits.borrow(),
            self.misses.borrow()
        )
    }
}

fn demonstrate_practical_cache() {
    println!("\n--- 11. Practical: Content Cache ---");

    let cache = ContentCache::new(3);

    cache.put("sacred-games", "Sacred Games - Crime Thriller");
    cache.put("mirzapur", "Mirzapur - Action Drama");
    cache.put("panchayat", "Panchayat - Comedy Drama");

    // Cache hits
    println!("  {}", cache.get("mirzapur").unwrap_or_default());
    // Output: Mirzapur - Action Drama
    println!("  {}", cache.get("sacred-games").unwrap_or_default());
    // Output: Sacred Games - Crime Thriller

    // Cache miss
    let result = cache.get("delhi-crime");
    println!("  Delhi Crime: {:?}", result);
    // Output: Delhi Crime: None

    // Eviction (max_size is 3)
    cache.put("delhi-crime", "Delhi Crime - True Crime");
    // This evicts the oldest entry (sacred-games was accessed last,
    // but panchayat was the oldest that wasn't bumped)

    println!("  {}", cache.stats());
    // Output: Cache: 3 entries, 2 hits, 1 misses

    // All operations use &self — interior mutability with RefCell!
    println!("  (All operations use &self thanks to RefCell)");
}

// ============================================================
// MAIN — Putting It All Together
// ============================================================
fn main() {
    println!("=== RUST SMART POINTERS: Netflix India Plan ===\n");

    demonstrate_box();
    demonstrate_recursive_types();
    demonstrate_deref();
    demonstrate_drop();
    demonstrate_rc();
    demonstrate_refcell();
    demonstrate_rc_refcell();
    demonstrate_arc();
    demonstrate_cow();
    demonstrate_comparison();
    demonstrate_practical_cache();

    // ============================================================
    // KEY TAKEAWAYS
    // ============================================================
    println!("\n=== KEY TAKEAWAYS ===");
    println!("1. Box<T>: heap allocation, single owner, zero overhead");
    println!("2. Box enables recursive types (linked lists, trees)");
    println!("3. Deref trait makes smart pointers transparent");
    println!("4. Drop trait runs cleanup code automatically");
    println!("5. Rc<T>: multiple owners, reference counted, NOT thread-safe");
    println!("6. RefCell<T>: interior mutability, runtime borrow checking");
    println!("7. Rc<RefCell<T>>: shared + mutable in single-threaded code");
    println!("8. Arc<T>: like Rc but thread-safe (atomic operations)");
    println!("9. Cow<T>: borrow when possible, clone when necessary");
    println!("10. Choose the simplest pointer that meets your needs");
}
