// ============================================================
//  FILE 1 : Hello World & Cargo
// ============================================================
//  Topic  : Hello World, println!, cargo, comments, main fn,
//           rustc, formatting, documentation
//
//  WHY THIS MATTERS:
//  Every Rust journey starts with "Hello, world!" — but
//  understanding cargo, the build system, and println! macro
//  gives you the foundation for every Rust program you'll
//  ever write. Cargo is not just a build tool, it's your
//  project manager, dependency resolver, and test runner.
// ============================================================

// ============================================================
// STORY: Ramesh Bhaiya Opens His Rust Tapri
//
// Ramesh bhaiya ran a chai tapri in Pune for 20 years using
// pen and paper. One day he decided to go digital. First step?
// Set up the counter (cargo new), write the menu board
// (main.rs), and shout "Tapri is open!" (println!).
// Before serving chai, you must set up the stall.
// Before writing Rust, you must understand the toolchain.
// ============================================================

// ============================================================
// HOW TO RUN THIS FILE
// ============================================================
// Option 1 — Using rustc (single file):
//   rustc 01-hello-and-cargo.rs && ./01-hello-and-cargo
//
// Option 2 — Using cargo (project):
//   cargo new my_tapri
//   cd my_tapri
//   # paste code into src/main.rs
//   cargo run
//
// Install Rust: https://rustup.rs
//   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
// ============================================================

// ============================================================
// CARGO COMMANDS CHEATSHEET (commented out — reference only)
// ============================================================
// cargo new project_name    → Create new project
// cargo build               → Compile (debug mode)
// cargo build --release     → Compile (optimized)
// cargo run                 → Build + run
// cargo check               → Fast check without building
// cargo test                → Run tests
// cargo doc --open          → Generate and open docs
// cargo fmt                 → Format code
// cargo clippy              → Lint code
// cargo update              → Update dependencies
// ============================================================

// ============================================================
// CARGO.TOML — The Recipe Card
// ============================================================
// Every cargo project has a Cargo.toml at the root:
//
// [package]
// name = "my_tapri"
// version = "0.1.0"
// edition = "2021"       # Rust edition (2015, 2018, 2021)
//
// [dependencies]
// serde = "1.0"          # external crate from crates.io
//
// Think of it as Ramesh bhaiya's recipe card — it lists
// the tapri name, version, and all ingredients (dependencies).
// ============================================================

fn main() {
    // ──────────────────────────────────────────────────────────
    // SECTION 1 — Hello World: Opening the Tapri
    // ──────────────────────────────────────────────────────────
    // WHY: main() is the entry point of every Rust program.
    // It takes no arguments and returns nothing (by default).
    // println! is a MACRO (note the !), not a function.

    println!("Namaste, Rust duniya!");
    // Output: Namaste, Rust duniya!

    // Ramesh bhaiya shouts from behind the counter —
    // that's println! broadcasting to stdout.

    // ──────────────────────────────────────────────────────────
    // SECTION 2 — println! Formatting: The Menu Board
    // ──────────────────────────────────────────────────────────
    // WHY: println! uses {} for Display formatting and {:?}
    // for Debug formatting. It's a macro because it does
    // compile-time format string checking.

    // Basic placeholder
    let tapri_name = "Ramesh Tapri";
    println!("Welcome to {}!", tapri_name);
    // Output: Welcome to Ramesh Tapri!

    // Multiple placeholders
    let chai_price = 15;
    let samosa_price = 12;
    println!("Chai: ₹{}, Samosa: ₹{}", chai_price, samosa_price);
    // Output: Chai: ₹15, Samosa: ₹12

    // Named arguments
    println!("{item} costs ₹{price}", item = "Bun Maska", price = 20);
    // Output: Bun Maska costs ₹20

    // Positional arguments
    println!("{0} loves {1}. {1} is the best!", "Ramesh", "Rust");
    // Output: Ramesh loves Rust. Rust is the best!

    // Debug format {:?} — shows internal representation
    let menu = ["Chai", "Samosa", "Vada Pav"];
    println!("Menu: {:?}", menu);
    // Output: Menu: ["Chai", "Samosa", "Vada Pav"]

    // Pretty debug {:#?} — multiline formatting
    println!("Menu (pretty):\n{:#?}", menu);
    // Output:
    // Menu (pretty):
    // [
    //     "Chai",
    //     "Samosa",
    //     "Vada Pav",
    // ]

    // ──────────────────────────────────────────────────────────
    // SECTION 3 — Formatting Tricks: Decorating the Board
    // ──────────────────────────────────────────────────────────
    // WHY: Rust gives you fine-grained control over output
    // formatting — padding, alignment, precision, and bases.

    // Padding and alignment
    let item = "Chai";
    println!("|{:<15}| ₹{:>5}|", item, 15);   // left-align, right-align
    // Output: |Chai           | ₹   15|

    println!("|{:^15}| ₹{:>5}|", item, 15);   // center-align
    // Output: |     Chai      | ₹   15|

    println!("|{:->15}| ₹{:0>5}|", item, 15); // fill with - and 0
    // Output: |-----------Chai| ₹00015|

    // Number formatting
    let total_sales = 1234567;
    println!("Binary:  {:b}", 42);        // Output: Binary:  101010
    println!("Octal:   {:o}", 42);        // Output: Octal:   52
    println!("Hex:     {:x}", 255);       // Output: Hex:     ff
    println!("HEX:     {:X}", 255);       // Output: HEX:     FF
    println!("Sci:     {:e}", 1234.5);    // Output: Sci:     1.2345e3

    // Float precision
    let pi = 3.14159265;
    println!("Pi = {:.2}", pi);           // Output: Pi = 3.14
    println!("Pi = {:.4}", pi);           // Output: Pi = 3.1416

    // Using _ in large numbers (readability)
    let crore = 1_00_00_000;
    println!("1 crore = {}", crore);
    // Output: 1 crore = 10000000

    // ──────────────────────────────────────────────────────────
    // SECTION 4 — Comments: Notes on the Recipe Card
    // ──────────────────────────────────────────────────────────
    // WHY: Comments are how you explain your code. Rust has
    // three types: line, block, and doc comments.

    // This is a line comment — most common

    /* This is a block comment.
       Spans multiple lines.
       Less common in Rust. */

    /// This is a doc comment (for functions/structs above).
    /// It supports **Markdown** formatting.
    /// Use `cargo doc --open` to generate HTML docs.
    ///
    /// # Examples
    /// ```
    /// let x = greet("Ramesh");
    /// ```

    //! This is a module-level doc comment.
    //! Goes at the top of lib.rs or mod.rs.
    //! Describes the entire module/crate.

    // ──────────────────────────────────────────────────────────
    // SECTION 5 — print! vs println! vs eprint! vs eprintln!
    // ──────────────────────────────────────────────────────────
    // WHY: Different output macros for different purposes.
    // eprint!/eprintln! write to stderr, not stdout.

    print!("No newline here. ");
    print!("Still same line.\n");
    // Output: No newline here. Still same line.

    println!("This adds a newline automatically.");
    // Output: This adds a newline automatically.

    eprintln!("Error: Chai machine is broken!");
    // Output (stderr): Error: Chai machine is broken!

    // ──────────────────────────────────────────────────────────
    // SECTION 6 — Escape Characters: Special Menu Items
    // ──────────────────────────────────────────────────────────
    // WHY: Special characters need escaping in strings.

    println!("Tab:\tIndented");              // Output: Tab:	Indented
    println!("Newline:\nSecond line");        // Output: Newline:\nSecond line
    println!("Backslash: \\");               // Output: Backslash: \
    println!("Quote: \"Hello\"");            // Output: Quote: "Hello"
    println!("Unicode: \u{0928}\u{092E}\u{0938}\u{094D}\u{0924}\u{0947}");
    // Output: Unicode: नमस्ते

    // Raw strings — no escaping needed
    println!(r"C:\Users\ramesh\tapri");
    // Output: C:\Users\ramesh\tapri

    println!(r#"He said "Ek cutting chai!""#);
    // Output: He said "Ek cutting chai!"

    // ──────────────────────────────────────────────────────────
    // SECTION 7 — The main() Function: The Counter
    // ──────────────────────────────────────────────────────────
    // WHY: main() is special in Rust. It's the entry point.
    // It can return Result for error handling (advanced).

    // main() signature variants:
    // fn main()                          → most common
    // fn main() -> Result<(), Box<dyn std::error::Error>>
    //                                    → when main can fail

    // Rust programs are structured as:
    // 1. Imports (use statements)
    // 2. fn main() { ... }
    // 3. Other functions, structs, enums below main

    // ──────────────────────────────────────────────────────────
    // SECTION 8 — Project Structure: Tapri Layout
    // ──────────────────────────────────────────────────────────
    // WHY: Understanding cargo project layout is essential.
    //
    // my_tapri/
    // ├── Cargo.toml        ← project config (recipe card)
    // ├── Cargo.lock        ← exact dependency versions (auto)
    // ├── src/
    // │   ├── main.rs       ← binary entry point
    // │   └── lib.rs        ← library code (optional)
    // ├── tests/            ← integration tests
    // ├── benches/          ← benchmarks
    // ├── examples/         ← example programs
    // └── target/           ← build artifacts (gitignored)
    //
    // Binary crate = has main.rs (executable)
    // Library crate = has lib.rs (reusable code)
    // A project can have both!

    // ──────────────────────────────────────────────────────────
    // SECTION 9 — Useful Macros: Tapri Tools
    // ──────────────────────────────────────────────────────────
    // WHY: These macros come up constantly in Rust code.

    // dbg! — debug print with file:line info
    let order = "Cutting Chai";
    dbg!(order);
    // Output: [src/main.rs:NNN] order = "Cutting Chai"

    // todo! — marks unfinished code (panics at runtime)
    // todo!("Add vada pav to menu");

    // unimplemented! — similar to todo! (semantic difference)
    // unimplemented!("Coming soon: filter coffee");

    // unreachable! — marks code that should never execute
    // unreachable!("This should never happen");

    // assert! family
    assert!(2 + 2 == 4);
    assert_eq!(2 + 2, 4);
    assert_ne!(2 + 2, 5);
    println!("All assertions passed!");
    // Output: All assertions passed!

    // format! — like println! but returns String instead
    let receipt = format!("Order: {} — ₹{}", "Chai", 15);
    println!("{}", receipt);
    // Output: Order: Chai — ₹15

    // ──────────────────────────────────────────────────────────
    // SECTION 10 — Compile & Run: Opening Time!
    // ──────────────────────────────────────────────────────────
    // WHY: Know the full build pipeline.
    //
    // rustc 01-hello-and-cargo.rs   → compile to binary
    // ./01-hello-and-cargo          → run it
    //
    // cargo run                     → build + run (in project)
    // cargo run --release           → optimized build + run
    //
    // Rust compilation steps:
    // 1. Parsing → AST
    // 2. Type checking + borrow checking
    // 3. MIR (Mid-level IR) optimizations
    // 4. LLVM IR → machine code
    //
    // If it compiles, it (usually) works. Rust's compiler
    // is your strictest but most helpful colleague.

    println!("\n--- Ramesh Tapri is officially open! ---");
    // Output: --- Ramesh Tapri is officially open! ---
}

// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. fn main() is the entry point — every Rust binary needs it
// 2. println! is a MACRO (not a function) — note the !
// 3. {} for Display, {:?} for Debug, {:#?} for pretty Debug
// 4. Cargo is your all-in-one project tool: build, run, test
// 5. Cargo.toml is the recipe card — name, version, deps
// 6. Comments: //, /* */, /// (doc), //! (module doc)
// 7. format! returns String; print!/println! write to stdout
// 8. dbg!, todo!, assert! are essential development macros
// 9. Raw strings r"..." and r#"..."# avoid escaping headaches
// 10. Ramesh bhaiya's rule: "Set up the stall (cargo new)
//     before you serve the chai (cargo run). And always
//     label your menu board clearly (comments + docs)!"
// ============================================================
