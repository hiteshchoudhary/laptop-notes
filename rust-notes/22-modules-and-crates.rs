// ============================================================
// 22. MODULES AND CRATES IN RUST
// ============================================================
// WHY THIS MATTERS:
// As your Rust projects grow beyond a single file, you need a way
// to organize code into logical units. Modules and crates are Rust's
// answer to code organization, namespace management, and access
// control. Every production Rust project — from command-line tools
// to web servers — uses modules and crates extensively. Understanding
// this system is essential for writing maintainable, reusable code.
// ============================================================

// ============================================================
// STORY: THE TATA GROUP COMPANY STRUCTURE
// ============================================================
// Imagine the Tata Group, one of India's largest conglomerates.
//
// Tata Sons (the parent holding company) is like your top-level
// MODULE or CRATE. It controls the overall structure.
//
// Under Tata Sons, there are subsidiaries:
//   - TCS (Tata Consultancy Services) — a PUBLIC subsidiary,
//     known worldwide, accessible to investors and clients.
//   - Tata Motors — another PUBLIC subsidiary, making cars
//     and trucks visible on every Indian road.
//   - Tata Strategic Management Group — a PRIVATE subsidiary,
//     doing internal consulting that outsiders don't interact with.
//
// Each subsidiary (module) has its own departments (nested modules):
//   - TCS has "Cloud Services", "AI Division", "Consulting"
//   - Tata Motors has "Passenger Vehicles", "Commercial Vehicles"
//
// Some things are PUBLIC — TCS's quarterly results are announced
// to the entire world. Some are PRIVATE — internal salary structures
// stay within the company. And sometimes a subsidiary RE-EXPORTS
// something — Tata Motors sells Jaguar cars, re-exporting a brand
// it acquired, making it available under its own umbrella.
//
// Rust's module system works the same way. Let's explore it.
// ============================================================

// ============================================================
// 1. THE mod KEYWORD — DEFINING MODULES
// ============================================================
// WHY: Modules group related code together, just like departments
// within a company. Without modules, all code lives in one flat
// namespace, making large projects impossible to manage.

// A module is defined with the `mod` keyword
mod tata_sons {
    // WHY: Everything inside a module is PRIVATE by default.
    // This is Rust's principle of least privilege — nothing
    // is exposed unless you explicitly say so.

    // This function is private — only code inside tata_sons can call it
    fn internal_strategy() -> String {
        String::from("Expand into semiconductors by 2027")
    }

    // This function is PUBLIC — anyone can call it
    pub fn public_announcement() -> String {
        // Private functions can be called from within the same module
        let _strategy = internal_strategy();
        String::from("Tata Group reports strong Q3 results!")
    }

    // WHY: Nested modules let you build hierarchies, just like
    // a company has divisions within divisions.
    pub mod tcs {
        pub fn revenue() -> u64 {
            250_000_000_000 // 2.5 lakh crore
        }

        // Private function inside a public module
        fn employee_salary_data() -> String {
            String::from("Confidential salary information")
        }

        pub fn employee_count() -> u64 {
            600_000
        }

        // Nested module inside TCS
        pub mod cloud_division {
            pub fn services() -> Vec<String> {
                vec![
                    String::from("AWS Migration"),
                    String::from("Azure Consulting"),
                    String::from("GCP Management"),
                ]
            }
        }
    }

    pub mod tata_motors {
        pub fn models() -> Vec<String> {
            vec![
                String::from("Nexon"),
                String::from("Harrier"),
                String::from("Safari"),
                String::from("Punch"),
            ]
        }

        // Private internal function
        fn production_cost(model: &str) -> u32 {
            match model {
                "Nexon" => 600_000,
                "Harrier" => 1_200_000,
                _ => 800_000,
            }
        }

        // Public function that uses private data
        pub fn showroom_price(model: &str) -> u32 {
            let cost = production_cost(model);
            // WHY: Private functions encapsulate implementation details.
            // The outside world sees the price, not the cost structure.
            (cost as f64 * 1.3) as u32 // 30% markup
        }

        pub mod ev_division {
            pub fn upcoming_models() -> Vec<String> {
                vec![
                    String::from("Curvv EV"),
                    String::from("Nexon EV Max"),
                    String::from("Harrier EV"),
                ]
            }
        }
    }
}

// ============================================================
// 2. THE pub KEYWORD — CONTROLLING VISIBILITY
// ============================================================
// WHY: Visibility controls are the foundation of API design.
// By making things private by default, Rust forces you to think
// about what should be part of your public interface.

mod visibility_demo {
    // Private struct — only this module can create it
    struct InternalConfig {
        _db_password: String,
    }

    // Public struct, but note the field visibility
    pub struct PublicReport {
        pub title: String,       // Public field — anyone can read/write
        pub summary: String,     // Public field
        confidential_notes: String,  // PRIVATE field — outsiders can't access
    }

    impl PublicReport {
        // WHY: Constructor pattern. Since `confidential_notes` is private,
        // outsiders cannot create PublicReport using struct literal syntax.
        // They MUST use this constructor.
        pub fn new(title: String, summary: String, notes: String) -> Self {
            PublicReport {
                title,
                summary,
                confidential_notes: notes,
            }
        }

        // Public method to get a sanitized version of notes
        pub fn safe_notes(&self) -> String {
            format!("[REDACTED] {} chars of notes", self.confidential_notes.len())
        }
    }

    // Public enum — all variants of a public enum are automatically public
    // WHY: This is different from structs! Enums represent choices,
    // and hiding a variant would defeat the purpose of pattern matching.
    pub enum Department {
        Engineering,
        Marketing,
        Finance,
        HR,
    }
}

// ============================================================
// 3. THE use KEYWORD — BRINGING ITEMS INTO SCOPE
// ============================================================
// WHY: Without `use`, you'd have to write the full path every time:
//   tata_sons::tcs::cloud_division::services()
// That's like writing the full postal address every time you mention
// your neighbor. `use` creates shortcuts.

// Bring a specific item into scope
use tata_sons::tcs;
use tata_sons::tata_motors::models;

// You can rename imports with `as`
use tata_sons::tata_motors::ev_division::upcoming_models as ev_models;

// Bring multiple items from the same path with curly braces
use tata_sons::tata_motors::{showroom_price, ev_division};

// ============================================================
// 4. SELF, SUPER, AND CRATE PATHS
// ============================================================
// WHY: Sometimes you need to refer to the current module, the
// parent module, or the crate root. These keywords give you
// relative navigation, like "this floor", "upstairs", "reception".

mod indian_railway {
    pub mod booking {
        pub fn book_ticket(train: &str) -> String {
            format!("Ticket booked on {}", train)
        }

        pub fn check_pnr(pnr: u64) -> String {
            // `self` refers to the current module (booking)
            // It's optional here but makes intent clear
            let _ = self::book_ticket("Rajdhani");
            format!("PNR {} status: Confirmed", pnr)
        }
    }

    pub mod cancellation {
        pub fn cancel_ticket(pnr: u64) -> String {
            // `super` refers to the parent module (indian_railway)
            // WHY: super lets you navigate UP the module hierarchy
            // without knowing the absolute path
            let _booking_status = super::booking::check_pnr(pnr);
            format!("Ticket with PNR {} cancelled. Refund initiated.", pnr)
        }
    }

    pub mod admin {
        pub fn system_check() -> String {
            // `crate` refers to the crate root (top-level)
            // WHY: crate gives you an absolute path from the root,
            // useful when you're deeply nested and need to reach
            // something at the top level
            let _motors = crate::tata_sons::tata_motors::models();
            String::from("System check: All modules operational")
        }
    }
}

// ============================================================
// 5. pub(crate) AND RESTRICTED VISIBILITY
// ============================================================
// WHY: Sometimes `pub` is too open (visible to everyone) and
// private is too closed (visible only in the current module).
// Rust offers fine-grained visibility controls.

mod payment_system {
    // pub(crate) — visible anywhere within this crate, but not
    // to external crates that depend on us
    // WHY: Perfect for internal APIs that multiple modules need
    // but shouldn't be part of the public library interface
    pub(crate) fn process_payment(amount: u64) -> String {
        format!("Processing payment of Rs. {}", amount)
    }

    pub mod upi {
        // pub(super) — visible to the parent module (payment_system)
        // WHY: Useful when a child module has helpers that only
        // the parent should use
        pub(super) fn validate_upi_id(id: &str) -> bool {
            id.contains('@')
        }

        pub fn pay(upi_id: &str, amount: u64) -> String {
            if validate_upi_id(upi_id) {
                // Using super to access parent's function
                super::process_payment(amount)
            } else {
                String::from("Invalid UPI ID")
            }
        }
    }

    pub fn test_upi_validation() -> bool {
        // Parent can access pub(super) items from child
        upi::validate_upi_id("user@paytm")
    }
}

// ============================================================
// 6. RE-EXPORTING WITH pub use
// ============================================================
// WHY: Re-exports let you present a clean public API regardless
// of your internal module structure. It's like Tata Motors selling
// Jaguar — the internal ownership structure doesn't matter to
// the customer buying the car.

mod ecommerce_platform {
    // Internal module structure (complex, nested)
    mod internal {
        pub mod database {
            pub fn connect() -> String {
                String::from("Connected to PostgreSQL")
            }
        }

        pub mod cache {
            pub fn get(key: &str) -> Option<String> {
                // Simulated cache lookup
                if key == "popular_item" {
                    Some(String::from("iPhone 15"))
                } else {
                    None
                }
            }
        }
    }

    // WHY: Re-export so users of our module don't need to know
    // about the `internal` module at all. They just call
    // ecommerce_platform::connect() instead of
    // ecommerce_platform::internal::database::connect()
    pub use internal::database::connect;
    pub use internal::cache::get as cache_get;

    // Users see a flat, clean API:
    //   ecommerce_platform::connect()
    //   ecommerce_platform::cache_get()
    // Instead of the messy internal structure.
}

// ============================================================
// 7. CARGO.TOML STRUCTURE
// ============================================================
// WHY: Cargo.toml is the heart of every Rust project. It defines
// your project metadata, dependencies, and build configuration.
// Think of it as the "GST registration" of your Rust project.

// Here's what a typical Cargo.toml looks like (shown as comments):
//
// [package]
// name = "my-tata-app"         # Crate name (used on crates.io)
// version = "0.1.0"            # Semantic versioning
// edition = "2021"             # Rust edition (2015, 2018, 2021)
// authors = ["Dev <dev@tata.com>"]
// description = "A sample Tata Group management app"
// license = "MIT"
//
// [dependencies]
// serde = { version = "1.0", features = ["derive"] }
// tokio = { version = "1", features = ["full"] }
// reqwest = "0.11"
//
// [dev-dependencies]           # Only for tests and examples
// tempfile = "3.0"
//
// [build-dependencies]         # For build scripts (build.rs)
// cc = "1.0"
//
// [[bin]]                      # Binary targets
// name = "server"
// path = "src/bin/server.rs"
//
// [workspace]                  # Workspace for multi-crate projects
// members = ["crate-a", "crate-b"]

// ============================================================
// 8. LIB.RS VS MAIN.RS — LIBRARY VS BINARY
// ============================================================
// WHY: A Rust package can produce a library (reusable code),
// a binary (executable program), or both. Understanding the
// difference is crucial for project structure.

// In comments, because this is about file structure:
//
// src/main.rs  -> Binary crate root. Produces an executable.
//                 Has fn main() as the entry point.
//                 Think of it as the "showroom" — the customer-facing part.
//
// src/lib.rs   -> Library crate root. Produces reusable code.
//                 No fn main(). Other crates can depend on it.
//                 Think of it as the "factory" — produces goods
//                 that many showrooms can sell.
//
// You can have BOTH in one package:
//   src/lib.rs   — contains the library logic
//   src/main.rs  — imports from lib.rs and runs the program
//
// Example project structure:
//   my_project/
//   +-- Cargo.toml
//   +-- src/
//       +-- main.rs        # Binary: uses `use my_project::something;`
//       +-- lib.rs         # Library: defines public API
//       +-- utils.rs       # Module file, declared in lib.rs
//       +-- models/
//           +-- mod.rs     # Module declaration for models/
//           +-- user.rs    # Submodule
//           +-- order.rs   # Submodule

// ============================================================
// 9. THE MODULE FILE SYSTEM
// ============================================================
// WHY: Rust has specific rules for how modules map to files.
// Understanding this prevents the "can't find module" errors
// that frustrate every Rust beginner.

// There are TWO styles for organizing module files:
//
// STYLE 1: mod.rs (older, still works)
//   src/
//   +-- lib.rs           # declares: mod models;
//   +-- models/
//       +-- mod.rs       # declares: pub mod user; pub mod order;
//       +-- user.rs
//       +-- order.rs
//
// STYLE 2: filename.rs (modern, recommended since Rust 2018)
//   src/
//   +-- lib.rs           # declares: mod models;
//   +-- models.rs        # declares: pub mod user; pub mod order;
//   +-- models/
//       +-- user.rs
//       +-- order.rs
//
// WHY TWO STYLES? The old mod.rs style caused confusion when
// you had many tabs open — every file was named "mod.rs".
// The new style uses the module name as the filename.

// ============================================================
// 10. WORKSPACE CONCEPT
// ============================================================
// WHY: Workspaces let you manage multiple related crates in
// one repository. It's like the Tata Group managing TCS and
// Tata Motors under one holding company — shared resources,
// unified build.

// Workspace Cargo.toml (root):
//
// [workspace]
// members = [
//     "tcs-service",
//     "tata-motors-api",
//     "shared-utils",
// ]
//
// Directory structure:
//   tata-workspace/
//   +-- Cargo.toml          # Workspace root
//   +-- tcs-service/
//   |   +-- Cargo.toml      # [dependencies] shared-utils = { path = "../shared-utils" }
//   |   +-- src/
//   |       +-- main.rs
//   +-- tata-motors-api/
//   |   +-- Cargo.toml
//   |   +-- src/
//   |       +-- lib.rs
//   +-- shared-utils/
//       +-- Cargo.toml
//       +-- src/
//           +-- lib.rs
//
// Benefits of workspaces:
// - Shared target/ directory (faster builds, less disk usage)
// - Shared Cargo.lock (consistent dependency versions)
// - Can build all crates with one `cargo build` command
// - Cross-crate dependencies use `path` references

// ============================================================
// 11. CRATES.IO AND EXTERNAL CRATES
// ============================================================
// WHY: crates.io is Rust's package registry — like npm for
// JavaScript or PyPI for Python. It hosts over 130,000 crates
// that you can use in your projects.

// To use an external crate:
// 1. Add it to Cargo.toml:
//    [dependencies]
//    rand = "0.8"
//
// 2. Use it in your code:
//    use rand::Rng;
//
// 3. Cargo downloads, compiles, and links it automatically.
//
// Useful commands:
//   cargo add serde        # Add a dependency (cargo-edit or cargo 1.62+)
//   cargo update           # Update dependencies to latest compatible versions
//   cargo tree             # Show dependency tree
//   cargo doc --open       # Generate and open documentation

// ============================================================
// 12. PRACTICAL EXAMPLE — PUTTING IT ALL TOGETHER
// ============================================================
// WHY: Let's see how all these concepts work together in
// a realistic scenario.

mod online_store {
    // --- Models module ---
    pub mod models {
        #[derive(Debug)]
        pub struct Product {
            pub name: String,
            pub price: f64,
            sku: String, // Private — internal use only
        }

        impl Product {
            pub fn new(name: &str, price: f64, sku: &str) -> Self {
                Product {
                    name: name.to_string(),
                    price,
                    sku: sku.to_string(),
                }
            }

            // Public accessor for the private field
            pub fn sku(&self) -> &str {
                &self.sku
            }
        }

        #[derive(Debug)]
        pub struct Order {
            pub id: u64,
            pub products: Vec<Product>,
            pub customer_name: String,
        }

        impl Order {
            pub fn total(&self) -> f64 {
                self.products.iter().map(|p| p.price).sum()
            }
        }
    }

    // --- Cart module ---
    pub mod cart {
        // Import from sibling module using super
        use super::models::Product;

        pub struct ShoppingCart {
            items: Vec<Product>,
        }

        impl ShoppingCart {
            pub fn new() -> Self {
                ShoppingCart { items: Vec::new() }
            }

            pub fn add(&mut self, product: Product) {
                self.items.push(product);
            }

            pub fn item_count(&self) -> usize {
                self.items.len()
            }

            pub fn total(&self) -> f64 {
                self.items.iter().map(|p| p.price).sum()
            }

            // Consume the cart and return the items
            pub fn checkout(self) -> Vec<Product> {
                self.items
            }
        }
    }

    // --- Payment module (internal) ---
    mod payment {
        pub fn process(amount: f64) -> Result<String, String> {
            if amount > 0.0 {
                Ok(format!("Payment of Rs. {:.2} processed successfully", amount))
            } else {
                Err(String::from("Invalid payment amount"))
            }
        }
    }

    // --- Re-export commonly used items ---
    // WHY: Users of online_store can write:
    //   online_store::Product instead of online_store::models::Product
    pub use models::{Product, Order};
    pub use cart::ShoppingCart;

    // Public facade function that uses the private payment module
    pub fn place_order(cart: ShoppingCart, customer: &str) -> Result<Order, String> {
        let total = cart.total();
        let products = cart.checkout();

        // Use the private payment module
        payment::process(total)?;

        Ok(Order {
            id: 1001, // In real code, generate unique ID
            products,
            customer_name: customer.to_string(),
        })
    }
}

fn main() {
    println!("=== Rust Modules and Crates ===\n");

    // --- Section 1: Basic module access ---
    println!("--- 1. Basic Module Access ---");
    println!("{}", tata_sons::public_announcement());
    // Output: Tata Group reports strong Q3 results!

    // Cannot call: tata_sons::internal_strategy() -- it's private!
    // Uncommenting the line below would cause a compile error:
    // tata_sons::internal_strategy();

    // --- Section 2: Nested module access ---
    println!("\n--- 2. Nested Module Access ---");

    // Using the `use` import we defined earlier
    println!("TCS Revenue: Rs. {}", tcs::revenue());
    // Output: TCS Revenue: Rs. 250000000000

    println!("TCS Employees: {}", tcs::employee_count());
    // Output: TCS Employees: 600000

    // Deeply nested access
    let services = tcs::cloud_division::services();
    println!("TCS Cloud Services: {:?}", services);
    // Output: TCS Cloud Services: ["AWS Migration", "Azure Consulting", "GCP Management"]

    // --- Section 3: Using `use` imports ---
    println!("\n--- 3. Using `use` Imports ---");

    // Using the direct import of `models`
    let car_models = models();
    println!("Tata Motors Models: {:?}", car_models);
    // Output: Tata Motors Models: ["Nexon", "Harrier", "Safari", "Punch"]

    // Using the renamed import
    let evs = ev_models();
    println!("EV Models: {:?}", evs);
    // Output: EV Models: ["Curvv EV", "Nexon EV Max", "Harrier EV"]

    // Using imported function
    let price = showroom_price("Nexon");
    println!("Nexon Showroom Price: Rs. {}", price);
    // Output: Nexon Showroom Price: Rs. 780000

    // --- Section 4: self, super, crate paths ---
    println!("\n--- 4. Path Navigation ---");
    println!("{}", indian_railway::booking::book_ticket("Shatabdi Express"));
    // Output: Ticket booked on Shatabdi Express

    println!("{}", indian_railway::booking::check_pnr(4521367890));
    // Output: PNR 4521367890 status: Confirmed

    println!("{}", indian_railway::cancellation::cancel_ticket(4521367890));
    // Output: Ticket with PNR 4521367890 cancelled. Refund initiated.

    println!("{}", indian_railway::admin::system_check());
    // Output: System check: All modules operational

    // --- Section 5: Restricted visibility ---
    println!("\n--- 5. Restricted Visibility ---");
    // pub(crate) functions are accessible within the crate
    println!("{}", payment_system::process_payment(5000));
    // Output: Processing payment of Rs. 5000

    println!("{}", payment_system::upi::pay("user@paytm", 1500));
    // Output: Processing payment of Rs. 1500

    println!("{}", payment_system::upi::pay("invalid_id", 1500));
    // Output: Invalid UPI ID

    println!("UPI validation test: {}", payment_system::test_upi_validation());
    // Output: UPI validation test: true

    // --- Section 6: Re-exports ---
    println!("\n--- 6. Re-exports ---");
    // Thanks to re-exports, we can call connect() directly
    println!("{}", ecommerce_platform::connect());
    // Output: Connected to PostgreSQL

    let cached = ecommerce_platform::cache_get("popular_item");
    println!("Cached item: {:?}", cached);
    // Output: Cached item: Some("iPhone 15")

    // --- Section 7: Visibility with structs ---
    println!("\n--- 7. Struct Visibility ---");
    let report = visibility_demo::PublicReport::new(
        String::from("Q3 Results"),
        String::from("Revenue up 15%"),
        String::from("CEO considering acquisition of startup XYZ"),
    );
    println!("Report: {} - {}", report.title, report.summary);
    // Output: Report: Q3 Results - Revenue up 15%

    println!("{}", report.safe_notes());
    // Output: [REDACTED] 43 chars of notes

    // Cannot access: report.confidential_notes — it's private!

    // --- Section 8: Full practical example ---
    println!("\n--- 8. Online Store (Full Example) ---");

    // Thanks to re-exports, we use the clean API
    let mut cart = online_store::ShoppingCart::new();

    // Product::new is available thanks to pub use
    cart.add(online_store::Product::new("Laptop", 75000.0, "LAP-001"));
    cart.add(online_store::Product::new("Mouse", 1500.0, "MOU-001"));
    cart.add(online_store::Product::new("Keyboard", 3500.0, "KEY-001"));

    println!("Cart items: {}", cart.item_count());
    // Output: Cart items: 3

    println!("Cart total: Rs. {:.2}", cart.total());
    // Output: Cart total: Rs. 80000.00

    match online_store::place_order(cart, "Rahul Sharma") {
        Ok(order) => {
            println!("Order #{} placed for {}", order.id, order.customer_name);
            println!("Order total: Rs. {:.2}", order.total());
            println!("Products ordered:");
            for product in &order.products {
                println!("  - {} (Rs. {:.2}) [SKU: {}]",
                    product.name, product.price, product.sku());
            }
        }
        Err(e) => println!("Order failed: {}", e),
    }
    // Output: Order #1001 placed for Rahul Sharma
    // Output: Order total: Rs. 80000.00
    // Output: Products ordered:
    // Output:   - Laptop (Rs. 75000.00) [SKU: LAP-001]
    // Output:   - Mouse (Rs. 1500.00) [SKU: MOU-001]
    // Output:   - Keyboard (Rs. 3500.00) [SKU: KEY-001]

    println!("\n=== Module & Crate Summary Complete ===");
}

// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. Modules (mod) organize code into namespaces. Everything
//    inside is PRIVATE by default — use `pub` to expose items.
//
// 2. `use` brings items into scope so you don't write full paths.
//    You can rename with `as` and import multiple items with {}.
//
// 3. Path navigation: `self` (current module), `super` (parent),
//    `crate` (crate root). Like "this floor", "upstairs", "lobby".
//
// 4. Visibility modifiers: `pub` (everyone), `pub(crate)` (this
//    crate only), `pub(super)` (parent module), private (default).
//
// 5. Re-exports (`pub use`) let you present a clean API regardless
//    of internal module structure. Users see a flat, simple API.
//
// 6. Cargo.toml defines your project: name, version, dependencies.
//    crates.io hosts 130,000+ community crates.
//
// 7. lib.rs = library (reusable by others), main.rs = binary
//    (executable). A package can have both.
//
// 8. Module files: Use the modern style (models.rs + models/ folder)
//    over the old style (models/mod.rs) for clarity.
//
// 9. Workspaces manage multiple crates in one repo with shared
//    builds and consistent dependency versions.
//
// 10. Think of modules like the Tata Group: parent company (crate),
//     subsidiaries (modules), public announcements (pub), internal
//     memos (private), and re-branded products (pub use).
// ============================================================
