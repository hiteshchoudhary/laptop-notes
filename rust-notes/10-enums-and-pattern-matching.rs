// ============================================================
// 10 - ENUMS AND PATTERN MATCHING IN RUST
// ============================================================
// WHY THIS MATTERS:
// Enums in Rust are one of its most powerful features — far beyond
// simple C-style enumerations. Combined with pattern matching,
// they let you model complex states, enforce exhaustive handling
// of all cases, and eliminate entire categories of bugs. Option
// and Result (both enums) replace null and exceptions entirely.
// If structs are Rust's nouns, enums + match are its verbs.
// ============================================================

// ============================================================
// STORY: The Swiggy Order Status Tracker
// ============================================================
// You order biryani on Swiggy. Your order goes through states:
// Placed -> Confirmed -> Preparing -> OutForDelivery -> Delivered.
//
// At each state, different information matters:
// - Placed: just the order ID and time
// - Preparing: the restaurant name and estimated time
// - OutForDelivery: the delivery partner's name and phone
// - Delivered: the final time and rating prompt
//
// Each state carries DIFFERENT data. A C-style enum can't do this.
// But a Rust enum can — each variant can hold its own data.
// Pattern matching (match) forces you to handle EVERY state.
// If Swiggy adds a "Cancelled" state, every match in your code
// must handle it — the compiler enforces this. No missed cases!
// ============================================================

// ============================================================
// 1. BASIC ENUMS (C-STYLE)
// ============================================================
// WHY: The simplest enums — a fixed set of named values.
// Even this basic form is more powerful than you'd think,
// because match forces exhaustive handling.

#[derive(Debug, PartialEq)]
enum TrainClass {
    General,
    Sleeper,
    AcThree,
    AcTwo,
    AcFirst,
}

impl TrainClass {
    fn fare_multiplier(&self) -> f64 {
        match self {
            TrainClass::General => 1.0,
            TrainClass::Sleeper => 2.5,
            TrainClass::AcThree => 4.0,
            TrainClass::AcTwo => 6.0,
            TrainClass::AcFirst => 8.5,
        }
    }
}

fn demo_basic_enum() {
    println!("=== 1. Basic Enums ===\n");

    let my_class = TrainClass::AcThree;
    let base_fare = 200.0;

    println!("Class: {:?}", my_class);
    // Output: Class: AcThree
    println!("Fare: Rs. {:.2}", base_fare * my_class.fare_multiplier());
    // Output: Fare: Rs. 800.00

    // WHY: == works because we derived PartialEq.
    if my_class == TrainClass::AcThree {
        println!("You have AC Three Tier. Blanket provided!");
        // Output: You have AC Three Tier. Blanket provided!
    }
}

// ============================================================
// 2. ENUMS WITH DATA (RUST'S SUPERPOWER)
// ============================================================
// WHY: Each variant can hold different types and amounts of data.
// This is like a tagged union — but safe. The compiler knows
// exactly which variant is active and what data it contains.

#[derive(Debug)]
enum SwiggyOrderStatus {
    Placed {
        order_id: String,
        items: Vec<String>,
    },
    Confirmed {
        restaurant: String,
        estimated_minutes: u32,
    },
    Preparing {
        restaurant: String,
        dish_ready_count: u32,
        total_dishes: u32,
    },
    OutForDelivery {
        partner_name: String,
        partner_phone: String,
        eta_minutes: u32,
    },
    Delivered {
        delivered_at: String,
    },
    Cancelled {
        reason: String,
        refund_amount: f64,
    },
}

fn describe_order(status: &SwiggyOrderStatus) {
    // WHY: match forces you to handle EVERY variant. Remove one arm
    // and the compiler rejects your code. This is exhaustive matching.
    match status {
        SwiggyOrderStatus::Placed { order_id, items } => {
            println!("Order {} placed with {} items: {:?}", order_id, items.len(), items);
        }
        SwiggyOrderStatus::Confirmed { restaurant, estimated_minutes } => {
            println!("Confirmed by {}. Ready in ~{} min.", restaurant, estimated_minutes);
        }
        SwiggyOrderStatus::Preparing { restaurant, dish_ready_count, total_dishes } => {
            println!("{}: {}/{} dishes ready.", restaurant, dish_ready_count, total_dishes);
        }
        SwiggyOrderStatus::OutForDelivery { partner_name, partner_phone, eta_minutes } => {
            println!("{} is on the way! Call: {}. ETA: {} min.",
                partner_name, partner_phone, eta_minutes);
        }
        SwiggyOrderStatus::Delivered { delivered_at } => {
            println!("Delivered at {}. Please rate your experience!", delivered_at);
        }
        SwiggyOrderStatus::Cancelled { reason, refund_amount } => {
            println!("Cancelled: {}. Refund: Rs. {:.2}", reason, refund_amount);
        }
    }
}

fn demo_enum_with_data() {
    println!("\n=== 2. Enums with Data ===\n");

    let statuses = vec![
        SwiggyOrderStatus::Placed {
            order_id: String::from("SW-29381"),
            items: vec![String::from("Biryani"), String::from("Raita")],
        },
        SwiggyOrderStatus::Confirmed {
            restaurant: String::from("Paradise Biryani"),
            estimated_minutes: 25,
        },
        SwiggyOrderStatus::Preparing {
            restaurant: String::from("Paradise Biryani"),
            dish_ready_count: 1,
            total_dishes: 2,
        },
        SwiggyOrderStatus::OutForDelivery {
            partner_name: String::from("Ramesh"),
            partner_phone: String::from("98765-43210"),
            eta_minutes: 8,
        },
        SwiggyOrderStatus::Delivered {
            delivered_at: String::from("7:45 PM"),
        },
    ];

    for status in &statuses {
        describe_order(status);
    }
    // Output: Order SW-29381 placed with 2 items: ["Biryani", "Raita"]
    // Output: Confirmed by Paradise Biryani. Ready in ~25 min.
    // Output: Paradise Biryani: 1/2 dishes ready.
    // Output: Ramesh is on the way! Call: 98765-43210. ETA: 8 min.
    // Output: Delivered at 7:45 PM. Please rate your experience!
}

// ============================================================
// 3. OPTION<T> — RUST'S NULL REPLACEMENT
// ============================================================
// WHY: Rust has no null. Instead, Option<T> is an enum:
//   enum Option<T> { Some(T), None }
// If a value might be absent, the type system FORCES you to
// handle the None case. No more NullPointerExceptions.

fn find_train(code: &str) -> Option<String> {
    match code {
        "12301" => Some(String::from("Rajdhani Express")),
        "12951" => Some(String::from("Mumbai Rajdhani")),
        "12259" => Some(String::from("Duronto Express")),
        _ => None,
    }
}

fn demo_option() {
    println!("\n=== 3. Option<T> ===\n");

    // WHY: Option forces explicit handling of absence.
    let result = find_train("12301");
    match result {
        Some(name) => println!("Found: {}", name),
        None => println!("Train not found"),
    }
    // Output: Found: Rajdhani Express

    let result2 = find_train("99999");
    match result2 {
        Some(name) => println!("Found: {}", name),
        None => println!("Train not found"),
    }
    // Output: Train not found

    // WHY: unwrap_or provides a default when None.
    let name = find_train("12951").unwrap_or(String::from("Unknown"));
    println!("Train: {}", name);
    // Output: Train: Mumbai Rajdhani

    let name2 = find_train("00000").unwrap_or(String::from("Unknown"));
    println!("Train: {}", name2);
    // Output: Train: Unknown

    // WHY: map transforms the inner value if Some, stays None if None.
    let upper = find_train("12259").map(|n| n.to_uppercase());
    println!("Uppercase: {:?}", upper);
    // Output: Uppercase: Some("DURONTO EXPRESS")

    let upper2 = find_train("00000").map(|n| n.to_uppercase());
    println!("Uppercase: {:?}", upper2);
    // Output: Uppercase: None

    // WHY: and_then (flatmap) chains operations that return Option.
    let length = find_train("12301").map(|n| n.len());
    println!("Name length: {:?}", length);
    // Output: Name length: Some(16)

    // WHY: is_some() and is_none() for quick checks.
    println!("12301 exists: {}", find_train("12301").is_some());
    // Output: 12301 exists: true
    println!("99999 exists: {}", find_train("99999").is_some());
    // Output: 99999 exists: false
}

// ============================================================
// 4. MATCH EXHAUSTIVENESS AND PATTERNS
// ============================================================
// WHY: match is not just if-else. It destructures, binds variables,
// supports guards, ranges, and the compiler verifies you handle
// every case. It's one of Rust's most loved features.

#[derive(Debug)]
enum UpiStatus {
    Success(f64),
    Pending,
    Failed(String),
}

fn demo_match_patterns() {
    println!("\n=== 4. Match Exhaustiveness & Patterns ===\n");

    let payments = vec![
        UpiStatus::Success(499.0),
        UpiStatus::Pending,
        UpiStatus::Failed(String::from("Insufficient balance")),
        UpiStatus::Success(1200.0),
        UpiStatus::Success(50.0),
    ];

    for payment in &payments {
        // WHY: Pattern matching with destructuring extracts inner data.
        let msg = match payment {
            UpiStatus::Success(amount) if *amount > 1000.0 => {
                format!("Large payment of Rs. {:.2} successful!", amount)
            }
            UpiStatus::Success(amount) => {
                format!("Payment of Rs. {:.2} successful.", amount)
            }
            UpiStatus::Pending => String::from("Payment pending..."),
            UpiStatus::Failed(reason) => {
                format!("Payment failed: {}", reason)
            }
        };
        println!("{}", msg);
    }
    // Output: Payment of Rs. 499.00 successful.
    // Output: Payment pending...
    // Output: Payment failed: Insufficient balance
    // Output: Large payment of Rs. 1200.00 successful!
    // Output: Payment of Rs. 50.00 successful.

    // WHY: Matching on integers with ranges and wildcards.
    let platform = 5;
    let zone = match platform {
        1..=3 => "Zone A (Main building)",
        4..=7 => "Zone B (Foot overbridge)",
        8..=12 => "Zone C (Extended platform)",
        _ => "Unknown zone",          // WHY: _ is the catch-all wildcard
    };
    println!("\nPlatform {} is in {}", platform, zone);
    // Output: Platform 5 is in Zone B (Foot overbridge)

    // WHY: Matching tuples — very useful for combining conditions.
    let (age, has_concession) = (65, true);
    let ticket_type = match (age, has_concession) {
        (0..=4, _) => "Free (infant)",
        (5..=11, _) => "Child ticket (half fare)",
        (_, true) => "Concession ticket",
        (60..=u32::MAX, false) => "Senior citizen (auto-concession)",
        _ => "Regular ticket",
    };
    println!("Ticket type: {}", ticket_type);
    // Output: Ticket type: Concession ticket
}

// ============================================================
// 5. IF LET — WHEN YOU ONLY CARE ABOUT ONE VARIANT
// ============================================================
// WHY: When you only need to handle one variant and ignore the rest,
// `if let` is cleaner than a full match. It's syntactic sugar.

fn demo_if_let() {
    println!("\n=== 5. if let ===\n");

    let order = SwiggyOrderStatus::OutForDelivery {
        partner_name: String::from("Suresh"),
        partner_phone: String::from("91234-56789"),
        eta_minutes: 5,
    };

    // WHY: if let extracts data from one specific variant.
    if let SwiggyOrderStatus::OutForDelivery { partner_name, eta_minutes, .. } = &order {
        println!("{} arriving in {} minutes!", partner_name, eta_minutes);
        // Output: Suresh arriving in 5 minutes!
    }

    // WHY: With else for fallback handling.
    let maybe_train = find_train("99999");
    if let Some(name) = maybe_train {
        println!("Found train: {}", name);
    } else {
        println!("No train found with that code.");
        // Output: No train found with that code.
    }

    // WHY: if let with additional conditions.
    let balance: Option<f64> = Some(350.0);
    if let Some(amt) = balance {
        if amt >= 500.0 {
            println!("Sufficient balance: Rs. {:.2}", amt);
        } else {
            println!("Low balance: Rs. {:.2}. Recharge!", amt);
            // Output: Low balance: Rs. 350.00. Recharge!
        }
    }
}

// ============================================================
// 6. WHILE LET — LOOP UNTIL PATTERN FAILS
// ============================================================
// WHY: while let continues looping as long as the pattern matches.
// Very useful with iterators and Option values.

fn demo_while_let() {
    println!("\n=== 6. while let ===\n");

    // WHY: Classic use — popping from a stack (Vec) until empty.
    let mut order_queue: Vec<String> = vec![
        String::from("Dosa"),
        String::from("Idli"),
        String::from("Vada"),
        String::from("Chai"),
    ];

    println!("Processing orders:");
    // WHY: pop() returns Option<T>. while let loops until None.
    while let Some(item) = order_queue.pop() {
        println!("  Serving: {}", item);
    }
    // Output: Processing orders:
    // Output:   Serving: Chai
    // Output:   Serving: Vada
    // Output:   Serving: Idli
    // Output:   Serving: Dosa

    println!("All orders served! Queue empty: {}", order_queue.is_empty());
    // Output: All orders served! Queue empty: true

    // WHY: while let with iterators.
    let prices = vec![120, 85, 200, 65, 150];
    let mut iter = prices.iter();
    let mut total = 0;

    println!("\nBilling items:");
    while let Some(&price) = iter.next() {
        total += price;
        println!("  Item: Rs. {} (Running total: Rs. {})", price, total);
    }
    // Output: Billing items:
    // Output:   Item: Rs. 120 (Running total: Rs. 120)
    // Output:   Item: Rs. 85 (Running total: Rs. 205)
    // Output:   Item: Rs. 200 (Running total: Rs. 405)
    // Output:   Item: Rs. 65 (Running total: Rs. 470)
    // Output:   Item: Rs. 150 (Running total: Rs. 620)
    println!("Total bill: Rs. {}", total);
    // Output: Total bill: Rs. 620
}

// ============================================================
// 7. ENUM METHODS WITH IMPL
// ============================================================
// WHY: Just like structs, enums can have impl blocks with methods.
// This keeps behavior close to the data it operates on.

#[derive(Debug)]
enum Meal {
    Veg { name: String, price: f64 },
    NonVeg { name: String, price: f64 },
    Combo { items: Vec<String>, price: f64, discount_percent: f64 },
}

impl Meal {
    // WHY: Associated function as constructor.
    fn new_veg(name: &str, price: f64) -> Self {
        Meal::Veg {
            name: String::from(name),
            price,
        }
    }

    fn new_non_veg(name: &str, price: f64) -> Self {
        Meal::NonVeg {
            name: String::from(name),
            price,
        }
    }

    fn new_combo(items: Vec<&str>, price: f64, discount: f64) -> Self {
        Meal::Combo {
            items: items.into_iter().map(String::from).collect(),
            price,
            discount_percent: discount,
        }
    }

    // WHY: Method works across all variants using pattern matching.
    fn final_price(&self) -> f64 {
        match self {
            Meal::Veg { price, .. } => *price,
            Meal::NonVeg { price, .. } => *price,
            Meal::Combo { price, discount_percent, .. } => {
                price * (1.0 - discount_percent / 100.0)
            }
        }
    }

    fn description(&self) -> String {
        match self {
            Meal::Veg { name, price } => {
                format!("[VEG] {} - Rs. {:.2}", name, price)
            }
            Meal::NonVeg { name, price } => {
                format!("[NON-VEG] {} - Rs. {:.2}", name, price)
            }
            Meal::Combo { items, price, discount_percent } => {
                format!("[COMBO] {:?} - Rs. {:.2} ({}% off)",
                    items, price, discount_percent)
            }
        }
    }

    fn is_vegetarian(&self) -> bool {
        matches!(self, Meal::Veg { .. })
    }
}

fn demo_enum_methods() {
    println!("\n=== 7. Enum Methods ===\n");

    let menu = vec![
        Meal::new_veg("Paneer Butter Masala", 220.0),
        Meal::new_non_veg("Chicken Biryani", 280.0),
        Meal::new_combo(vec!["Dal", "Rice", "Roti", "Sweet"], 350.0, 15.0),
    ];

    for meal in &menu {
        println!("{}", meal.description());
        println!("  Final price: Rs. {:.2}", meal.final_price());
        println!("  Vegetarian: {}", meal.is_vegetarian());
        println!();
    }
    // Output: [VEG] Paneer Butter Masala - Rs. 220.00
    // Output:   Final price: Rs. 220.00
    // Output:   Vegetarian: true
    // Output:
    // Output: [NON-VEG] Chicken Biryani - Rs. 280.00
    // Output:   Final price: Rs. 280.00
    // Output:   Vegetarian: false
    // Output:
    // Output: [COMBO] ["Dal", "Rice", "Roti", "Sweet"] - Rs. 350.00 (15% off)
    // Output:   Final price: Rs. 297.50
    // Output:   Vegetarian: false
}

// ============================================================
// 8. NESTED ENUMS AND COMPLEX STATE MACHINES
// ============================================================
// WHY: Real applications have complex states. Enums can be nested
// inside each other and inside structs to model sophisticated
// state machines with compile-time safety.

#[derive(Debug)]
enum PaymentMethod {
    Upi(String),           // UPI ID
    Card { last_four: String, bank: String },
    Cod,                    // Cash on delivery
    Wallet { name: String, balance: f64 },
}

#[derive(Debug)]
enum OrderState {
    Cart,
    Checkout { payment: PaymentMethod },
    Processing { transaction_id: String },
    Shipped { tracking_id: String, carrier: String },
    Delivered,
    Returned { reason: String },
}

#[derive(Debug)]
struct Order {
    id: String,
    item: String,
    amount: f64,
    state: OrderState,
}

impl Order {
    fn new(id: &str, item: &str, amount: f64) -> Self {
        Self {
            id: String::from(id),
            item: String::from(item),
            amount,
            state: OrderState::Cart,
        }
    }

    // WHY: State transitions as methods. Each method consumes the old
    // state and returns the order with a new state.
    fn checkout(mut self, payment: PaymentMethod) -> Self {
        self.state = OrderState::Checkout { payment };
        println!("[{}] Moved to checkout", self.id);
        self
    }

    fn process(mut self, txn_id: &str) -> Self {
        self.state = OrderState::Processing {
            transaction_id: String::from(txn_id),
        };
        println!("[{}] Payment processed: {}", self.id, txn_id);
        self
    }

    fn ship(mut self, tracking: &str, carrier: &str) -> Self {
        self.state = OrderState::Shipped {
            tracking_id: String::from(tracking),
            carrier: String::from(carrier),
        };
        println!("[{}] Shipped via {} ({})", self.id, carrier, tracking);
        self
    }

    fn deliver(mut self) -> Self {
        self.state = OrderState::Delivered;
        println!("[{}] Delivered!", self.id);
        self
    }

    fn status_message(&self) -> String {
        match &self.state {
            OrderState::Cart => format!("{} is in your cart.", self.item),
            OrderState::Checkout { payment } => {
                let method = match payment {
                    PaymentMethod::Upi(id) => format!("UPI ({})", id),
                    PaymentMethod::Card { last_four, bank } => {
                        format!("{} card ending {}", bank, last_four)
                    }
                    PaymentMethod::Cod => String::from("Cash on Delivery"),
                    PaymentMethod::Wallet { name, .. } => format!("{} Wallet", name),
                };
                format!("Checking out {} via {}", self.item, method)
            }
            OrderState::Processing { transaction_id } => {
                format!("Processing payment {}", transaction_id)
            }
            OrderState::Shipped { tracking_id, carrier } => {
                format!("{} shipped via {} (Track: {})", self.item, carrier, tracking_id)
            }
            OrderState::Delivered => format!("{} delivered! Rate your purchase.", self.item),
            OrderState::Returned { reason } => {
                format!("{} returned: {}", self.item, reason)
            }
        }
    }
}

fn demo_nested_enums() {
    println!("\n=== 8. Nested Enums & State Machine ===\n");

    let order = Order::new("FK-92817", "OnePlus Nord", 27999.0);
    println!("Status: {}", order.status_message());
    // Output: Status: OnePlus Nord is in your cart.

    let order = order.checkout(PaymentMethod::Upi(String::from("rahul@okicici")));
    // Output: [FK-92817] Moved to checkout
    println!("Status: {}", order.status_message());
    // Output: Status: Checking out OnePlus Nord via UPI (rahul@okicici)

    let order = order.process("TXN-88291");
    // Output: [FK-92817] Payment processed: TXN-88291

    let order = order.ship("DL-29381-X", "Delhivery");
    // Output: [FK-92817] Shipped via Delhivery (DL-29381-X)
    println!("Status: {}", order.status_message());
    // Output: Status: OnePlus Nord shipped via Delhivery (Track: DL-29381-X)

    let order = order.deliver();
    // Output: [FK-92817] Delivered!
    println!("Status: {}", order.status_message());
    // Output: Status: OnePlus Nord delivered! Rate your purchase.

    // WHY: order is consumed at each step — you cannot accidentally
    // use it in an old state. The type system prevents it.
    let _ = order;
}

// ============================================================
// 9. THE matches! MACRO
// ============================================================
// WHY: matches! is a concise way to check if a value matches a
// pattern. Returns bool. Great for filter/any/all operations.

fn demo_matches_macro() {
    println!("\n=== 9. matches! Macro ===\n");

    let classes = vec![
        TrainClass::General,
        TrainClass::Sleeper,
        TrainClass::AcThree,
        TrainClass::AcTwo,
        TrainClass::AcFirst,
    ];

    // WHY: matches! returns true/false for pattern matching.
    let ac_classes: Vec<&TrainClass> = classes
        .iter()
        .filter(|c| matches!(c, TrainClass::AcThree | TrainClass::AcTwo | TrainClass::AcFirst))
        .collect();

    println!("AC classes: {:?}", ac_classes);
    // Output: AC classes: [AcThree, AcTwo, AcFirst]

    let status = UpiStatus::Success(500.0);
    let is_success = matches!(status, UpiStatus::Success(_));
    println!("Is success: {}", is_success);
    // Output: Is success: true

    // WHY: matches! with guards.
    let big_success = matches!(UpiStatus::Success(2000.0), UpiStatus::Success(x) if x > 1000.0);
    println!("Big success: {}", big_success);
    // Output: Big success: true
}

// ============================================================
// 10. PRACTICAL EXAMPLE — MINI FOOD ORDER SYSTEM
// ============================================================
// WHY: Putting it all together — enums with data, methods,
// pattern matching, Option, and state transitions.

#[derive(Debug)]
enum FoodItem {
    MainCourse(String, f64),
    Starter(String, f64),
    Beverage(String, f64),
    Dessert(String, f64),
}

impl FoodItem {
    fn price(&self) -> f64 {
        match self {
            FoodItem::MainCourse(_, p)
            | FoodItem::Starter(_, p)
            | FoodItem::Beverage(_, p)
            | FoodItem::Dessert(_, p) => *p,
        }
    }

    fn name(&self) -> &str {
        match self {
            FoodItem::MainCourse(n, _)
            | FoodItem::Starter(n, _)
            | FoodItem::Beverage(n, _)
            | FoodItem::Dessert(n, _) => n,
        }
    }

    fn category(&self) -> &str {
        match self {
            FoodItem::MainCourse(..) => "Main Course",
            FoodItem::Starter(..) => "Starter",
            FoodItem::Beverage(..) => "Beverage",
            FoodItem::Dessert(..) => "Dessert",
        }
    }
}

fn demo_practical_example() {
    println!("\n=== 10. Practical: Food Order System ===\n");

    let order: Vec<FoodItem> = vec![
        FoodItem::Starter(String::from("Paneer Tikka"), 180.0),
        FoodItem::MainCourse(String::from("Dal Makhani"), 220.0),
        FoodItem::MainCourse(String::from("Butter Naan"), 60.0),
        FoodItem::Beverage(String::from("Masala Chai"), 40.0),
        FoodItem::Dessert(String::from("Gulab Jamun"), 90.0),
    ];

    println!("--- Your Order ---");
    let mut total = 0.0;
    for item in &order {
        println!("  [{}] {} - Rs. {:.2}", item.category(), item.name(), item.price());
        total += item.price();
    }
    // Output: --- Your Order ---
    // Output:   [Starter] Paneer Tikka - Rs. 180.00
    // Output:   [Main Course] Dal Makhani - Rs. 220.00
    // Output:   [Main Course] Butter Naan - Rs. 60.00
    // Output:   [Beverage] Masala Chai - Rs. 40.00
    // Output:   [Dessert] Gulab Jamun - Rs. 90.00

    println!("-----------------");
    println!("Subtotal: Rs. {:.2}", total);

    let gst = total * 0.05;
    println!("GST (5%): Rs. {:.2}", gst);
    println!("Total:    Rs. {:.2}", total + gst);
    // Output: -----------------
    // Output: Subtotal: Rs. 590.00
    // Output: GST (5%): Rs. 29.50
    // Output: Total:    Rs. 619.50

    // WHY: Filtering by variant type using matches!
    let beverage_count = order.iter().filter(|i| matches!(i, FoodItem::Beverage(..))).count();
    println!("\nBeverages ordered: {}", beverage_count);
    // Output: Beverages ordered: 1

    // WHY: find returns Option — handle gracefully.
    let dessert = order.iter().find(|i| matches!(i, FoodItem::Dessert(..)));
    if let Some(d) = dessert {
        println!("Dessert found: {} at Rs. {:.2}", d.name(), d.price());
        // Output: Dessert found: Gulab Jamun at Rs. 90.00
    }
}

// ============================================================
// MAIN
// ============================================================

fn main() {
    demo_basic_enum();
    demo_enum_with_data();
    demo_option();
    demo_match_patterns();
    demo_if_let();
    demo_while_let();
    demo_enum_methods();
    demo_nested_enums();
    demo_matches_macro();
    demo_practical_example();

    // ============================================================
    // KEY TAKEAWAYS
    // ============================================================
    println!("\n=== KEY TAKEAWAYS ===\n");
    println!("1. Rust enums can carry data — each variant holds different types.");
    println!("2. match is exhaustive — compiler forces handling of ALL variants.");
    println!("3. Option<T> replaces null: Some(value) or None, always checked.");
    println!("4. if let is shorthand when you only care about one variant.");
    println!("5. while let loops until the pattern stops matching (great with pop/next).");
    println!("6. Enums can have methods via impl blocks, just like structs.");
    println!("7. matches!() macro returns bool for quick pattern checks.");
    println!("8. Nested enums model complex real-world state machines safely.");
    println!("9. Pattern matching supports guards (if x > 10), ranges (1..=5),");
    println!("   wildcards (_), and tuple/struct destructuring.");
    println!("10. Enums + match = the heart of idiomatic Rust code.");
}
