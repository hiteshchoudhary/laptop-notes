// ============================================================
//  FILE 7 : References & Borrowing
// ============================================================
//  Topic  : &T, &mut T, borrowing rules, dangling references,
//           reference lifetimes preview, reborrowing
//
//  WHY THIS MATTERS:
//  Borrowing lets you USE a value without OWNING it. This
//  avoids the awkward "move and return" dance. Rust's borrowing
//  rules prevent data races at compile time — the same rules
//  that make concurrent code safe also make single-threaded
//  code bug-free.
// ============================================================

// ============================================================
// STORY: Lending Your Royal Enfield in Hostel
//
// You have a Royal Enfield in your college hostel.
//
// Immutable borrow (&T): Your roommate borrows it to ride to
// class. He can RIDE it (read) but can't repaint it (modify).
// Multiple roommates can borrow for rides simultaneously.
//
// Mutable borrow (&mut T): The mechanic borrows it to fix
// the engine. ONLY the mechanic can have it — no one else
// can ride or even touch it while he's working.
//
// Rules:
// 1. Many readers OR one writer — never both at same time
// 2. References must always be valid (no dangling)
//
// The hostel warden (compiler) enforces these rules strictly.
// ============================================================

fn main() {
    // ──────────────────────────────────────────────────────────
    // SECTION 1 — Immutable References: Sharing for Reading
    // ──────────────────────────────────────────────────────────
    // WHY: &T lets you read a value without taking ownership.
    // Multiple immutable references can coexist.

    let bullet = String::from("Royal Enfield Classic 350");

    // Creating immutable references
    let rider1 = &bullet;   // borrow 1
    let rider2 = &bullet;   // borrow 2
    let rider3 = &bullet;   // borrow 3

    // All can read simultaneously — no problem!
    println!("Rider 1 sees: {}", rider1);
    println!("Rider 2 sees: {}", rider2);
    println!("Rider 3 sees: {}", rider3);
    // Output: Rider 1 sees: Royal Enfield Classic 350
    // Output: Rider 2 sees: Royal Enfield Classic 350
    // Output: Rider 3 sees: Royal Enfield Classic 350

    // The original is still accessible
    println!("Owner still has: {}", bullet);
    // Output: Owner still has: Royal Enfield Classic 350

    // Passing references to functions — no ownership transfer
    let length = measure_bike(&bullet);
    println!("{} — name length: {}", bullet, length);
    // Output: Royal Enfield Classic 350 — name length: 26
    // bullet is still ours!

    // ──────────────────────────────────────────────────────────
    // SECTION 2 — Mutable References: Exclusive Mechanic Access
    // ──────────────────────────────────────────────────────────
    // WHY: &mut T lets you modify a value. Only ONE mutable
    // reference can exist at a time — prevents data races.

    let mut bike_color = String::from("Black");
    println!("Before paint: {}", bike_color);
    // Output: Before paint: Black

    // Mechanic borrows mutably
    let mechanic = &mut bike_color;
    mechanic.push_str(" with Gold stripes");
    println!("After paint: {}", mechanic);
    // Output: After paint: Black with Gold stripes

    // Can't use bike_color while mechanic has &mut
    // println!("{}", bike_color);  // ERROR while mechanic is active

    // After mechanic's borrow ends (last use), owner can access again
    println!("Owner sees: {}", bike_color);
    // Output: Owner sees: Black with Gold stripes

    // Passing mutable reference to function
    let mut mileage = String::from("ODO: 15000");
    update_mileage(&mut mileage, 500);
    println!("{}", mileage);
    // Output: ODO: 15000 (+500 km serviced)

    // ──────────────────────────────────────────────────────────
    // SECTION 3 — THE RULES: Warden's Strict Policy
    // ──────────────────────────────────────────────────────────
    // WHY: These two rules prevent data races AND undefined
    // behavior at compile time.
    //
    // RULE 1: At any time, you can have EITHER:
    //   - Any number of immutable references (&T)
    //   - OR exactly ONE mutable reference (&mut T)
    //   - BUT NOT BOTH simultaneously
    //
    // RULE 2: References must always be valid (no dangling)

    // --- RULE 1 VIOLATIONS ---

    // Multiple immutable → OK
    let bike = String::from("Bullet");
    let r1 = &bike;
    let r2 = &bike;
    println!("{}, {}", r1, r2);
    // Output: Bullet, Bullet

    // One mutable → OK
    let mut bike = String::from("Bullet");
    let m1 = &mut bike;
    m1.push_str(" 500");
    println!("{}", m1);
    // Output: Bullet 500

    // Immutable AND mutable at same time → ERROR
    // let mut bike = String::from("Bullet");
    // let r1 = &bike;
    // let m1 = &mut bike;  // ERROR: can't borrow as mutable
    // println!("{}", r1);  // because immutable borrow used here

    // Two mutable references → ERROR
    // let mut bike = String::from("Bullet");
    // let m1 = &mut bike;
    // let m2 = &mut bike;  // ERROR: second mutable borrow
    // println!("{}, {}", m1, m2);

    // ──────────────────────────────────────────────────────────
    // SECTION 4 — Non-Lexical Lifetimes (NLL): Smart Warden
    // ──────────────────────────────────────────────────────────
    // WHY: Rust's borrow checker is smart — a reference's
    // "active lifetime" ends at its LAST USE, not at the end
    // of the scope. This makes many patterns possible.

    let mut bike = String::from("RE Classic");

    let r1 = &bike;
    let r2 = &bike;
    println!("Readers: {}, {}", r1, r2);
    // Output: Readers: RE Classic, RE Classic
    // r1 and r2 are no longer used after this point

    // Now we CAN take a mutable reference — NLL says r1, r2 are done
    let m1 = &mut bike;
    m1.push_str(" 350");
    println!("Modified: {}", m1);
    // Output: Modified: RE Classic 350

    // This works because the compiler tracks that r1/r2
    // are not used after the println! above.

    // ──────────────────────────────────────────────────────────
    // SECTION 5 — Dangling References: Ghost Bike
    // ──────────────────────────────────────────────────────────
    // WHY: Rust prevents dangling references at compile time.
    // A reference can NEVER outlive the data it points to.

    // This would dangle:
    // fn dangle() -> &String {
    //     let s = String::from("hello");
    //     &s  // ERROR: s is dropped, reference would dangle!
    // }

    // Instead, return the owned value:
    fn no_dangle() -> String {
        let s = String::from("hello");
        s  // ownership moves out — no dangle!
    }
    let safe = no_dangle();
    println!("Safe: {}", safe);
    // Output: Safe: hello

    // ──────────────────────────────────────────────────────────
    // SECTION 6 — References in Structs (Preview)
    // ──────────────────────────────────────────────────────────
    // WHY: When structs hold references, you need lifetime
    // annotations (covered in detail in File 16).

    // Simple struct with owned data — no lifetime needed
    struct Bike {
        model: String,
        cc: u32,
    }

    let my_bike = Bike {
        model: String::from("Classic 350"),
        cc: 349,
    };
    display_bike(&my_bike);
    // Output: Bike: Classic 350 (349cc)

    // ──────────────────────────────────────────────────────────
    // SECTION 7 — Reference Patterns: Common Idioms
    // ──────────────────────────────────────────────────────────
    // WHY: These patterns solve everyday borrowing challenges.

    // Pattern 1: Read-only access to large data
    let garage = vec![
        String::from("Classic 350"),
        String::from("Meteor 350"),
        String::from("Himalayan 450"),
    ];
    print_garage(&garage);
    println!("Garage still has {} bikes", garage.len());
    // Output: Garage still has 3 bikes

    // Pattern 2: Modify through mutable reference
    let mut scores = vec![85, 90, 78, 92];
    add_bonus(&mut scores, 5);
    println!("With bonus: {:?}", scores);
    // Output: With bonus: [90, 95, 83, 97]

    // Pattern 3: Multiple immutable borrows in one expression
    let name = String::from("Ramesh");
    let first = &name[..3];
    let last = &name[3..];
    println!("Split: '{}' + '{}'", first, last);
    // Output: Split: 'Ram' + 'esh'

    // Pattern 4: Reborrowing — creating shorter reference from existing one
    let mut data = vec![1, 2, 3];
    let data_ref = &mut data;
    // You can reborrow a mutable reference as immutable
    let sum: i32 = data_ref.iter().sum(); // implicit reborrow
    println!("Sum: {}", sum);
    data_ref.push(4); // still works after reborrow ends
    println!("Data: {:?}", data_ref);
    // Output: Sum: 6
    // Output: Data: [1, 2, 3, 4]

    // ──────────────────────────────────────────────────────────
    // SECTION 8 — Dereferencing: Following the Arrow
    // ──────────────────────────────────────────────────────────
    // WHY: * dereferences a reference (follows the pointer
    // to the actual value). Rust usually auto-dereferences
    // for method calls and comparisons.

    let speed = 80;
    let speed_ref = &speed;

    // Explicit dereference
    println!("Speed: {} km/h", *speed_ref);
    // Output: Speed: 80 km/h

    // Auto-deref for comparison
    assert_eq!(speed_ref, &80);  // Rust auto-derefs for ==

    // Auto-deref for method calls
    let name = String::from("Bullet");
    let name_ref = &name;
    println!("Length: {}", name_ref.len());  // auto-deref to String.len()
    // Output: Length: 6

    // Mutable dereference
    let mut rpm = 3000;
    let rpm_ref = &mut rpm;
    *rpm_ref += 500;  // modify through dereference
    println!("RPM: {}", rpm);
    // Output: RPM: 3500

    // ──────────────────────────────────────────────────────────
    // SECTION 9 — Borrowing in Loops and Iterators
    // ──────────────────────────────────────────────────────────
    // WHY: Iterating over collections involves borrowing.
    // Know the three iteration modes.

    let bikes = vec!["Classic", "Meteor", "Himalayan"];

    // &bikes — immutable borrow (most common)
    for bike in &bikes {
        print!("{} ", bike);
    }
    println!();
    // Output: Classic Meteor Himalayan
    // bikes still usable

    // &mut bikes — mutable borrow
    let mut prices = vec![100, 200, 300];
    for price in &mut prices {
        *price += 50; // modify each element
    }
    println!("Updated prices: {:?}", prices);
    // Output: Updated prices: [150, 250, 350]

    // bikes (no &) — consumes the collection (move)
    // for bike in bikes { ... }  // bikes is MOVED, can't use after

    // ──────────────────────────────────────────────────────────
    // SECTION 10 — Borrow Checker Errors: Learning from the Warden
    // ──────────────────────────────────────────────────────────
    // WHY: Understanding common errors helps you fix them fast.

    // ERROR 1: Cannot borrow as mutable more than once
    // FIX: Restructure code so borrows don't overlap
    let mut items = vec![1, 2, 3];
    // let a = &mut items;
    // let b = &mut items;  // ERROR
    // FIX: Use one reference at a time
    {
        let a = &mut items;
        a.push(4);
    } // a's borrow ends
    {
        let b = &mut items;
        b.push(5);
    } // b's borrow ends
    println!("Items: {:?}", items);
    // Output: Items: [1, 2, 3, 4, 5]

    // ERROR 2: Cannot borrow as mutable because also borrowed as immutable
    // FIX: Ensure immutable borrows are done before mutable borrow
    let mut data = vec![1, 2, 3];
    let len = data.len(); // immutable borrow, used immediately
    data.push(4);         // mutable borrow — fine, len already done
    println!("Len was: {}, now: {:?}", len, data);
    // Output: Len was: 3, now: [1, 2, 3, 4]

    // ERROR 3: Returning reference to local variable
    // FIX: Return owned value instead
    // fn bad() -> &String { let s = String::from("hi"); &s }
    // fn good() -> String { let s = String::from("hi"); s }

    println!("\n--- Ride complete! Bike returned safely. ---");
}

// ============================================================
// Function Declarations (outside main)
// ============================================================

/// Borrows the bike name without owning it
fn measure_bike(bike: &String) -> usize {
    bike.len()
    // bike reference goes out of scope, but since it's just
    // a borrow, the original String is unaffected
}

/// Mutably borrows and modifies a string
fn update_mileage(odo: &mut String, km: u32) {
    odo.push_str(&format!(" (+{} km serviced)", km));
}

/// Struct-based borrowing example
struct Bike {
    model: String,
    cc: u32,
}

fn display_bike(bike: &Bike) {
    println!("Bike: {} ({}cc)", bike.model, bike.cc);
}

/// Borrows a Vec without consuming it
fn print_garage(bikes: &Vec<String>) {
    println!("\n--- Garage ---");
    for (i, bike) in bikes.iter().enumerate() {
        println!("  {}. {}", i + 1, bike);
    }
}

/// Mutably borrows a Vec and modifies each element
fn add_bonus(scores: &mut Vec<i32>, bonus: i32) {
    for score in scores.iter_mut() {
        *score += bonus;
    }
}

// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. &T = immutable reference (many allowed simultaneously)
// 2. &mut T = mutable reference (exactly ONE at a time)
// 3. Can't have &T and &mut T active at the same time
// 4. References must never outlive the data they point to
// 5. NLL: borrow ends at last use, not end of scope
// 6. Functions taking &T/&mut T borrow without owning
// 7. * dereferences; Rust auto-derefs for methods and ==
// 8. Iterating: &collection (borrow), &mut (modify), no & (consume)
// 9. Common fix: restructure code so borrows don't overlap
// 10. Hostel warden's rule: "Many friends can look at the
//     bike (read), but only the mechanic can touch it (write).
//     And you NEVER lend out a bike that's been sold (dangling).
//     The warden (borrow checker) sees EVERYTHING."
// ============================================================
