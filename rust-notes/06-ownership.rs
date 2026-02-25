// ============================================================
//  FILE 6 : Ownership
// ============================================================
//  Topic  : Ownership rules, move semantics, Copy trait,
//           Clone trait, stack vs heap, drop, String vs &str
//
//  WHY THIS MATTERS:
//  Ownership is Rust's KILLER FEATURE. It eliminates garbage
//  collection AND manual memory management. No GC pauses, no
//  null pointers, no dangling references, no double frees —
//  all guaranteed at compile time. This is the #1 concept
//  that separates Rust from every other language.
// ============================================================

// ============================================================
// STORY: Aadhaar Card — Only One Owner
//
// Your Aadhaar card is like a Rust value — it has exactly
// ONE owner at any time.
//
// Rule 1: Each value has ONE owner (your Aadhaar, one person)
// Rule 2: When the owner goes out of scope, the value is
//          dropped (card destroyed when holder dies)
// Rule 3: You can MOVE ownership (transfer card to spouse)
//          but then YOU no longer have it
//
// You can make a COPY (photocopy for simple docs) or a
// CLONE (certified duplicate for bank accounts).
// But the original? Only ONE person holds it at a time.
//
// The bank teller (compiler) will REFUSE to accept a
// photocopy of a sold property deed — they need the original
// or a proper clone.
// ============================================================

fn main() {
    // ──────────────────────────────────────────────────────────
    // SECTION 1 — Stack vs Heap: Filing Cabinet vs Warehouse
    // ──────────────────────────────────────────────────────────
    // WHY: Understanding WHERE data lives is crucial for
    // understanding ownership, moves, and copies.
    //
    // STACK (Filing cabinet — fixed drawers):
    //   - Fixed-size data: integers, floats, bools, chars
    //   - Arrays with known size
    //   - Tuples of stack types
    //   - FAST: push/pop, LIFO order
    //   - Each function call = new stack frame
    //
    // HEAP (Warehouse — flexible storage):
    //   - Dynamic-size data: String, Vec, HashMap
    //   - Data that can grow/shrink at runtime
    //   - SLOWER: requires allocation, pointer chasing
    //   - Manual tracking needed (Rust uses ownership)

    // Stack data — simple copy
    let aadhaar_number: i64 = 1234_5678_9012;  // lives on stack
    let pin_code: u32 = 411001;                 // lives on stack

    // Heap data — needs ownership tracking
    let aadhaar_name = String::from("Ramesh Kumar Sharma");  // heap!
    // aadhaar_name owns the string data on the heap
    // The variable itself (pointer + length + capacity) is on stack
    // But the actual character data "Ramesh..." is on the heap

    println!("Aadhaar: {}, Name: {}, PIN: {}",
             aadhaar_number, aadhaar_name, pin_code);
    // Output: Aadhaar: 123456789012, Name: Ramesh Kumar Sharma, PIN: 411001

    // ──────────────────────────────────────────────────────────
    // SECTION 2 — Ownership Rule #1: One Owner
    // ──────────────────────────────────────────────────────────
    // WHY: Every value in Rust has exactly ONE variable that
    // owns it. This is enforced at compile time.

    let aadhaar_card = String::from("UID: 1234-5678-9012");
    println!("Original holder: {}", aadhaar_card);
    // Output: Original holder: UID: 1234-5678-9012

    // ──────────────────────────────────────────────────────────
    // SECTION 3 — Move: Transferring the Aadhaar Card
    // ──────────────────────────────────────────────────────────
    // WHY: When you assign a heap value to another variable,
    // ownership MOVES. The original variable is invalidated.
    // This prevents double-free bugs.

    let aadhaar_holder_1 = String::from("Ramesh's Aadhaar");
    let aadhaar_holder_2 = aadhaar_holder_1;  // MOVE happens here!

    // aadhaar_holder_1 is now INVALID — ownership moved
    // println!("{}", aadhaar_holder_1);  // ERROR: value used after move

    println!("New holder: {}", aadhaar_holder_2);
    // Output: New holder: Ramesh's Aadhaar

    // What actually happened in memory:
    // aadhaar_holder_1: [ptr|len|cap] → "Ramesh's Aadhaar" (heap)
    // After move:
    // aadhaar_holder_1: [INVALID — cannot use]
    // aadhaar_holder_2: [ptr|len|cap] → "Ramesh's Aadhaar" (heap)
    // The heap data was NOT copied — only the pointer moved!

    // Move also happens with function calls
    let bank_document = String::from("Property Deed #4521");
    submit_to_bank(bank_document);  // ownership moves into function
    // println!("{}", bank_document);  // ERROR: moved into function

    // And with return values — ownership moves OUT
    let new_document = create_document();
    println!("Received: {}", new_document);
    // Output: Received: Birth Certificate #7890

    // ──────────────────────────────────────────────────────────
    // SECTION 4 — Copy: Photocopying Simple Documents
    // ──────────────────────────────────────────────────────────
    // WHY: Types that implement Copy are duplicated on
    // assignment instead of moved. All stack-only types are
    // Copy: integers, floats, bools, chars, and tuples/arrays
    // of Copy types.

    let pin_code = 411001_u32;
    let pin_backup = pin_code;  // COPY, not move!

    // Both are still valid — simple photocopy
    println!("Original PIN: {}", pin_code);
    // Output: Original PIN: 411001
    println!("Backup PIN: {}", pin_backup);
    // Output: Backup PIN: 411001

    // All these types implement Copy:
    let age: i32 = 35;          // Copy
    let temp: f64 = 98.6;       // Copy
    let is_valid: bool = true;  // Copy
    let grade: char = 'A';      // Copy
    let coords: (f64, f64) = (19.07, 72.87); // Copy (tuple of Copy types)
    let scores: [i32; 3] = [90, 85, 92];     // Copy (array of Copy type)

    let age_copy = age;     // age is still valid!
    let temp_copy = temp;   // temp is still valid!
    println!("Age: {}, Copy: {}", age, age_copy);
    // Output: Age: 35, Copy: 35

    // &str (string slice reference) is ALSO Copy
    let greeting: &str = "Namaste";
    let greeting_copy = greeting;  // Copy! (it's just a pointer + length)
    println!("{} and {}", greeting, greeting_copy);
    // Output: Namaste and Namaste

    // BUT String is NOT Copy — it's heap-allocated
    // let s1 = String::from("Hello");
    // let s2 = s1;  // MOVE, not copy!

    // ──────────────────────────────────────────────────────────
    // SECTION 5 — Clone: Certified Duplicate
    // ──────────────────────────────────────────────────────────
    // WHY: When you need a deep copy of heap data, use .clone().
    // It's explicit and potentially expensive (allocates new heap memory).

    let original_deed = String::from("Land Deed: Plot 42, Pune");
    let certified_copy = original_deed.clone();  // deep copy!

    // Both are valid and independent
    println!("Original: {}", original_deed);
    // Output: Original: Land Deed: Plot 42, Pune
    println!("Certified copy: {}", certified_copy);
    // Output: Certified copy: Land Deed: Plot 42, Pune

    // After clone, modifying one doesn't affect the other
    let mut doc_a = String::from("Draft v1");
    let doc_b = doc_a.clone();
    doc_a.push_str(" — REVISED");
    println!("A: {}", doc_a);  // Output: A: Draft v1 — REVISED
    println!("B: {}", doc_b);  // Output: B: Draft v1

    // Clone for Vec (also heap-allocated)
    let accounts = vec![1001, 1002, 1003];
    let accounts_backup = accounts.clone();
    println!("Accounts: {:?}", accounts);        // still valid!
    println!("Backup: {:?}", accounts_backup);
    // Output: Accounts: [1001, 1002, 1003]
    // Output: Backup: [1001, 1002, 1003]

    // ──────────────────────────────────────────────────────────
    // SECTION 6 — Ownership Rule #2: Drop on Scope Exit
    // ──────────────────────────────────────────────────────────
    // WHY: When a variable goes out of scope, Rust
    // automatically calls `drop()` on it — freeing memory.
    // No garbage collector needed!

    {
        let temporary_id = String::from("Temp ID: 9999");
        println!("Inside scope: {}", temporary_id);
        // Output: Inside scope: Temp ID: 9999
    } // ← temporary_id is DROPPED here — memory freed

    // println!("{}", temporary_id);  // ERROR: not in scope

    // Custom Drop example
    let _tracker = DropTracker { name: String::from("Aadhaar Card") };
    let _tracker2 = DropTracker { name: String::from("PAN Card") };
    println!("Cards created, will be dropped at end of main");
    // Drop order: LIFO (PAN Card dropped first, then Aadhaar Card)

    // ──────────────────────────────────────────────────────────
    // SECTION 7 — Ownership with Functions: Passing Documents
    // ──────────────────────────────────────────────────────────
    // WHY: Passing a value to a function is like assignment —
    // it moves (or copies) the value. You lose access to moved values.

    // Move into function
    let passport = String::from("Passport: J1234567");
    verify_document(passport);  // moves passport into function
    // println!("{}", passport);  // ERROR: passport was moved!

    // Copy into function
    let age = 35;
    verify_age(age);  // age is COPIED into function
    println!("Age still accessible: {}", age);  // WORKS — i32 is Copy
    // Output: Age still accessible: 35

    // Getting ownership back using return
    let visa = String::from("Tourist Visa");
    let visa = process_and_return(visa);  // move in, move back out
    println!("Got visa back: {}", visa);
    // Output: Got visa back: Tourist Visa — APPROVED

    // Multiple returns using tuple
    let doc = String::from("Application Form");
    let (doc, word_count) = count_and_return(doc);
    println!("Doc: {}, Words: {}", doc, word_count);
    // Output: Doc: Application Form, Words: 2

    // ──────────────────────────────────────────────────────────
    // SECTION 8 — String vs &str: Original vs Photocopy
    // ──────────────────────────────────────────────────────────
    // WHY: This distinction is critical for ownership.
    //
    // String = owned, heap-allocated, growable
    // &str   = borrowed reference, read-only view

    // String (owned — you hold the original)
    let mut full_name = String::from("Ramesh");
    full_name.push_str(" Kumar");
    full_name.push_str(" Sharma");
    println!("Full name: {}", full_name);
    // Output: Full name: Ramesh Kumar Sharma

    // &str (borrowed — just looking at it)
    let first_name: &str = "Ramesh";  // string literal → &str
    let last_name: &str = &full_name[7..12]; // slice of String → &str
    println!("First: {}, Last: {}", first_name, last_name);
    // Output: First: Ramesh, Last: Kumar

    // Converting between them
    let owned: String = String::from("hello");
    let borrowed: &str = &owned;          // String → &str (free, just a reference)
    let owned_again: String = borrowed.to_string(); // &str → String (allocates!)
    let also_owned: String = "hello".to_owned();    // &str → String

    println!("Owned: {}, Again: {}", owned, owned_again);
    // Output: Owned: hello, Again: hello

    // ──────────────────────────────────────────────────────────
    // SECTION 9 — Common Ownership Patterns
    // ──────────────────────────────────────────────────────────
    // WHY: These patterns solve everyday ownership challenges.

    // Pattern 1: Clone when you need two copies
    let config = String::from("debug=true");
    let config_backup = config.clone();
    use_config(config);
    println!("Backup: {}", config_backup);
    // Output: Backup: debug=true

    // Pattern 2: Use references instead of moving (see File 07)
    let data = String::from("Important Data");
    let len = calculate_length(&data);  // borrow, don't move!
    println!("{} has {} chars", data, len);
    // Output: Important Data has 14 chars

    // Pattern 3: Return ownership from functions
    let names = create_names();
    println!("Names: {:?}", names);
    // Output: Names: ["Ramesh", "Suresh", "Mukesh"]

    // Pattern 4: Take ownership only when you need it
    let greeting = give_greeting("evening");
    println!("{}", greeting);
    // Output: Shubh Sandhya!

    // ──────────────────────────────────────────────────────────
    // SECTION 10 — Ownership Visualized
    // ──────────────────────────────────────────────────────────
    // WHY: Mental model for ownership transfer.
    //
    //   let s1 = String::from("hello");
    //   STACK          HEAP
    //   s1: [ptr] ──→ ['h','e','l','l','o']
    //       [len: 5]
    //       [cap: 5]
    //
    //   let s2 = s1;  // MOVE
    //   STACK          HEAP
    //   s1: [INVALID]
    //   s2: [ptr] ──→ ['h','e','l','l','o']
    //       [len: 5]
    //       [cap: 5]
    //
    //   let s3 = s2.clone();  // CLONE
    //   STACK          HEAP
    //   s2: [ptr] ──→ ['h','e','l','l','o']
    //   s3: [ptr] ──→ ['h','e','l','l','o']  (new allocation!)

    println!("\n--- Ownership lesson complete! ---");
    println!("Remember: Your Aadhaar = One owner at a time.");
}

// ============================================================
// Function Declarations (outside main)
// ============================================================

/// Takes ownership of the document (it's consumed)
fn submit_to_bank(doc: String) {
    println!("Bank received: {}", doc);
    // doc is dropped at end of function
}
// Output: Bank received: Property Deed #4521

/// Creates and returns a new document (ownership moves to caller)
fn create_document() -> String {
    let doc = String::from("Birth Certificate #7890");
    doc // ownership moves to caller
}

/// Takes ownership and gives it back (plus modifications)
fn process_and_return(mut doc: String) -> String {
    doc.push_str(" — APPROVED");
    doc // return ownership
}

/// Returns document and its word count
fn count_and_return(doc: String) -> (String, usize) {
    let count = doc.split_whitespace().count();
    (doc, count)
}

/// Borrows without taking ownership (preview of File 07)
fn calculate_length(s: &String) -> usize {
    s.len()
    // s goes out of scope but since it doesn't own the String, nothing happens
}

/// Verifies document (consumes it — can't use after)
fn verify_document(doc: String) {
    println!("Verified: {}", doc);
}
// Output: Verified: Passport: J1234567

/// Copies value (i32 is Copy, so original isn't moved)
fn verify_age(age: i32) {
    println!("Age verified: {}", age);
}
// Output: Age verified: 35

/// Consumes a config string
fn use_config(config: String) {
    println!("Using config: {}", config);
}
// Output: Using config: debug=true

/// Creates and returns a Vec of names
fn create_names() -> Vec<String> {
    vec![
        String::from("Ramesh"),
        String::from("Suresh"),
        String::from("Mukesh"),
    ]
}

/// Returns greeting based on time of day
fn give_greeting(time: &str) -> String {
    match time {
        "morning" => String::from("Suprabhat!"),
        "afternoon" => String::from("Namaskar!"),
        "evening" => String::from("Shubh Sandhya!"),
        _ => String::from("Namaste!"),
    }
}

/// Struct with custom Drop to demonstrate drop order
struct DropTracker {
    name: String,
}

impl Drop for DropTracker {
    fn drop(&mut self) {
        println!("Dropping: {}", self.name);
    }
}

// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. Rule 1: Each value has exactly ONE owner
// 2. Rule 2: When owner goes out of scope, value is dropped
// 3. Rule 3: Ownership can be transferred (moved)
// 4. MOVE: heap data assignment invalidates the original
// 5. COPY: stack data (i32, bool, char, f64) is duplicated
// 6. CLONE: explicit deep copy of heap data (.clone())
// 7. Passing to functions = move (heap) or copy (stack)
// 8. Return values transfer ownership back to caller
// 9. String is owned (heap); &str is borrowed (reference)
// 10. Aadhaar card rule: "Only ONE person holds the original
//     at a time. You can photocopy simple docs (Copy), make
//     a certified duplicate (Clone), or hand it over (Move).
//     But two people can NEVER hold the same original."
// ============================================================
