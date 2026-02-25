// ============================================================
// FILE 15: TRAITS — Shared Behavior in Rust
// ============================================================
// WHY THIS MATTERS:
// Traits are Rust's way of defining shared behavior — like
// interfaces in Java or protocols in Swift, but more powerful.
// They enable polymorphism, operator overloading, and are the
// foundation of Rust's generics system. Every real Rust program
// uses traits extensively.
// ============================================================

// ============================================================
// STORY: Zomato Restaurant Rating System
// ============================================================
// Imagine you're building Zomato's backend. Every restaurant
// in India — whether it's a South Indian thali place, a North
// Indian dhaba, or a Mughlai biryani house — must implement
// the "Rateable" trait. They all have different cuisines, but
// every single one must provide a rating, a description, and
// the ability to be displayed on the app. That's what traits
// do — they define a contract that every type must follow.
//
// A trait says "if you want to be listed on Zomato, you MUST
// have these abilities." The restaurant decides HOW to
// implement them, but the WHAT is fixed by the trait.
// ============================================================

// WHY: std::fmt::Display lets us customize how a type prints
// with {} placeholder. We need it for our Display impl.
use std::fmt;

// WHY: std::ops::Add lets us overload the + operator for
// custom types. This is how Rust does operator overloading.
use std::ops::Add;

// ============================================================
// 1. DEFINING A TRAIT — The Contract
// ============================================================
// WHY: A trait defines behavior that types must implement.
// Think of it as a menu of methods every restaurant must have.

trait Rateable {
    // Required method — every implementor MUST define this
    fn rating(&self) -> f64;

    // Required method — must define
    fn cuisine_type(&self) -> &str;

    // Default method — implementors CAN override, but don't have to
    // WHY: Default methods reduce boilerplate. If 90% of
    // restaurants use the same star display logic, why repeat it?
    fn star_display(&self) -> String {
        let stars = self.rating();
        if stars >= 4.5 {
            format!("{:.1} - Outstanding!", stars)
        } else if stars >= 4.0 {
            format!("{:.1} - Very Good", stars)
        } else if stars >= 3.0 {
            format!("{:.1} - Good", stars)
        } else {
            format!("{:.1} - Average", stars)
        }
    }

    // Default method using other trait methods
    // WHY: Default methods can call required methods. This is
    // powerful — the trait defines logic that depends on what
    // the implementor provides.
    fn summary(&self) -> String {
        format!(
            "{} cuisine | Rating: {}",
            self.cuisine_type(),
            self.star_display()
        )
    }
}

// ============================================================
// 2. IMPLEMENTING A TRAIT FOR TYPES
// ============================================================
// WHY: impl TraitName for TypeName is how you fulfill the contract.
// Each restaurant type provides its own implementation.

struct SouthIndianRestaurant {
    name: String,
    dosa_varieties: u32,
    avg_rating: f64,
}

struct NorthIndianDhaba {
    name: String,
    is_highway: bool,
    avg_rating: f64,
}

struct BiryaniHouse {
    name: String,
    city: String,
    avg_rating: f64,
}

// Implement Rateable for SouthIndianRestaurant
impl Rateable for SouthIndianRestaurant {
    fn rating(&self) -> f64 {
        self.avg_rating
    }

    fn cuisine_type(&self) -> &str {
        "South Indian"
    }

    // Override default method with custom behavior
    fn star_display(&self) -> String {
        format!(
            "{:.1} ({} dosa varieties!)",
            self.avg_rating, self.dosa_varieties
        )
    }
}

// Implement Rateable for NorthIndianDhaba
impl Rateable for NorthIndianDhaba {
    fn rating(&self) -> f64 {
        // Highway dhabas get a bonus point in our system
        if self.is_highway {
            self.avg_rating + 0.2
        } else {
            self.avg_rating
        }
    }

    fn cuisine_type(&self) -> &str {
        "North Indian"
    }
    // Uses default star_display and summary — no override needed
}

// Implement Rateable for BiryaniHouse
impl Rateable for BiryaniHouse {
    fn rating(&self) -> f64 {
        self.avg_rating
    }

    fn cuisine_type(&self) -> &str {
        "Mughlai / Biryani"
    }
}

// ============================================================
// 3. TRAIT BOUNDS — Restricting Generic Functions
// ============================================================
// WHY: Trait bounds say "this function works with ANY type,
// as long as it implements this trait." It's like saying
// "any restaurant can enter our Top Picks list, as long as
// it's Rateable."

// Using trait bound syntax
fn print_rating<T: Rateable>(item: &T) {
    println!("  Rating: {}", item.star_display());
}

// WHY: The `where` clause is cleaner when you have many bounds
fn print_full_info<T>(item: &T)
where
    T: Rateable + fmt::Display,
{
    println!("  {}", item);
    println!("  {}", item.summary());
}

// Using impl Trait in parameter position (syntactic sugar)
// WHY: `impl Trait` is shorter and often more readable
fn is_top_rated(item: &impl Rateable) -> bool {
    item.rating() >= 4.5
}

// Multiple trait bounds with +
// WHY: Sometimes a function needs a type that satisfies
// multiple contracts simultaneously
fn display_if_good<T: Rateable + fmt::Display>(item: &T) {
    if item.rating() >= 3.5 {
        println!("  Recommended: {} ({})", item, item.star_display());
    }
}

// ============================================================
// 4. IMPLEMENTING Display TRAIT (Standard Library Trait)
// ============================================================
// WHY: Display is Rust's standard way to format types for
// user-facing output. It's what {} uses in println!.

impl fmt::Display for SouthIndianRestaurant {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{} (South Indian, {} dosas)", self.name, self.dosa_varieties)
    }
}

impl fmt::Display for NorthIndianDhaba {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let location = if self.is_highway { "Highway" } else { "City" };
        write!(f, "{} ({} Dhaba)", self.name, location)
    }
}

impl fmt::Display for BiryaniHouse {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{} (Biryani, {})", self.name, self.city)
    }
}

// ============================================================
// 5. TRAIT OBJECTS — Dynamic Dispatch with dyn
// ============================================================
// WHY: Sometimes you don't know the concrete type at compile
// time. A Vec of restaurants might contain different types.
// `dyn Trait` gives you dynamic dispatch (like virtual methods
// in C++). It's slightly slower but very flexible.

fn print_all_ratings(restaurants: &[&dyn Rateable]) {
    println!("\n--- All Restaurant Ratings ---");
    for (i, restaurant) in restaurants.iter().enumerate() {
        println!(
            "  {}. {} | {}",
            i + 1,
            restaurant.cuisine_type(),
            restaurant.star_display()
        );
    }
}

// Returning trait objects
// WHY: When a function might return different concrete types
// that share a trait, use Box<dyn Trait>
fn create_restaurant(kind: &str) -> Box<dyn Rateable> {
    match kind {
        "south" => Box::new(SouthIndianRestaurant {
            name: String::from("Saravana Bhavan"),
            dosa_varieties: 40,
            avg_rating: 4.6,
        }),
        "north" => Box::new(NorthIndianDhaba {
            name: String::from("Pehalwan Dhaba"),
            is_highway: true,
            avg_rating: 4.2,
        }),
        _ => Box::new(BiryaniHouse {
            name: String::from("Paradise"),
            city: String::from("Hyderabad"),
            avg_rating: 4.8,
        }),
    }
}

// ============================================================
// 6. DERIVE MACROS — Auto-Implementing Common Traits
// ============================================================
// WHY: Many traits have "obvious" implementations. Rust can
// auto-generate them with #[derive(...)]. This saves massive
// amounts of boilerplate code.

#[derive(Debug, Clone, PartialEq)]
struct MenuItem {
    name: String,
    price: f64,
    is_veg: bool,
}

// Debug   -> enables {:?} formatting
// Clone   -> enables .clone() to make deep copies
// PartialEq -> enables == and != comparisons

// ============================================================
// 7. OPERATOR OVERLOADING — Implementing std::ops Traits
// ============================================================
// WHY: In Rust, operators like +, -, *, == are all trait methods.
// You can overload them for your custom types.

#[derive(Debug, Clone, Copy)]
struct Rupees {
    paise: i64, // Store in paise for precision
}

impl Rupees {
    fn new(rupees: i64, paise: i64) -> Self {
        Rupees {
            paise: rupees * 100 + paise,
        }
    }

    fn display(&self) -> String {
        let rupees = self.paise / 100;
        let remaining_paise = (self.paise % 100).abs();
        format!("Rs.{}.{:02}", rupees, remaining_paise)
    }
}

// Overload + operator
impl Add for Rupees {
    type Output = Rupees; // WHY: Associated type — the result of adding two Rupees is Rupees

    fn add(self, other: Rupees) -> Rupees {
        Rupees {
            paise: self.paise + other.paise,
        }
    }
}

// Implement Display for Rupees
impl fmt::Display for Rupees {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.display())
    }
}

// Implement PartialEq manually
impl PartialEq for Rupees {
    fn eq(&self, other: &Self) -> bool {
        self.paise == other.paise
    }
}

// ============================================================
// 8. SUPERTRAITS — Trait Inheritance
// ============================================================
// WHY: Sometimes a trait requires another trait to be implemented
// first. A supertrait says "before you can be X, you must be Y."
// Like saying: "Before a restaurant can be ZomatoGold, it must
// first be Rateable."

// Rateable is a supertrait of PremiumListed
trait PremiumListed: Rateable + fmt::Display {
    fn membership_tier(&self) -> &str;

    fn premium_badge(&self) -> String {
        format!(
            "[PREMIUM {}] {} | {}",
            self.membership_tier(),
            self, // Uses Display
            self.summary() // Uses Rateable
        )
    }
}

// To implement PremiumListed, the type must ALSO implement
// Rateable and Display (which our restaurants already do)
impl PremiumListed for BiryaniHouse {
    fn membership_tier(&self) -> &str {
        if self.avg_rating >= 4.5 {
            "GOLD"
        } else {
            "SILVER"
        }
    }
}

// ============================================================
// 9. ORPHAN RULE AND NEWTYPE PATTERN
// ============================================================
// WHY: Rust's orphan rule says you can only implement a trait
// for a type if EITHER the trait OR the type is defined in your
// crate. This prevents conflicts. The newtype pattern is the
// workaround.

// We can't impl Display for Vec<String> directly (both are
// from std library). But we can wrap Vec in a new type:

struct RestaurantList(Vec<String>);

impl fmt::Display for RestaurantList {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        writeln!(f, "Zomato Restaurants:")?;
        for (i, name) in self.0.iter().enumerate() {
            writeln!(f, "  {}. {}", i + 1, name)?;
        }
        Ok(())
    }
}

// ============================================================
// 10. TRAIT WITH ASSOCIATED TYPES
// ============================================================
// WHY: Associated types are like generics but fixed per impl.
// The Iterator trait uses this: each iterator has ONE fixed
// Item type, not a generic parameter.

trait FoodDelivery {
    type Item; // Associated type

    fn next_order(&mut self) -> Option<Self::Item>;

    fn deliver_all(&mut self) {
        while let Some(_order) = self.next_order() {
            println!("  Delivering order...");
        }
    }
}

struct OrderQueue {
    orders: Vec<String>,
    index: usize,
}

impl FoodDelivery for OrderQueue {
    type Item = String; // Fixed: OrderQueue always delivers Strings

    fn next_order(&mut self) -> Option<Self::Item> {
        if self.index < self.orders.len() {
            let order = self.orders[self.index].clone();
            self.index += 1;
            Some(order)
        } else {
            None
        }
    }
}

// ============================================================
// 11. BLANKET IMPLEMENTATIONS
// ============================================================
// WHY: You can implement a trait for ALL types that satisfy
// a bound. The standard library does this extensively.
// For example, ToString is auto-implemented for anything
// that implements Display.

trait Describable {
    fn describe(&self) -> String;
}

// Blanket impl: anything that is Rateable gets Describable for free
impl<T: Rateable> Describable for T {
    fn describe(&self) -> String {
        format!(
            "A {} restaurant rated {}",
            self.cuisine_type(),
            self.star_display()
        )
    }
}

// ============================================================
// 12. PRACTICAL PATTERN — Strategy Pattern with Traits
// ============================================================
// WHY: Traits enable clean design patterns. The strategy
// pattern lets you swap algorithms at runtime.

trait SortStrategy {
    fn sort_name(&self) -> &str;
    fn should_come_first(&self, a: &dyn Rateable, b: &dyn Rateable) -> bool;
}

struct SortByRating;
struct SortByCuisine;

impl SortStrategy for SortByRating {
    fn sort_name(&self) -> &str {
        "Rating (High to Low)"
    }

    fn should_come_first(&self, a: &dyn Rateable, b: &dyn Rateable) -> bool {
        a.rating() > b.rating()
    }
}

impl SortStrategy for SortByCuisine {
    fn sort_name(&self) -> &str {
        "Cuisine (Alphabetical)"
    }

    fn should_come_first(&self, a: &dyn Rateable, b: &dyn Rateable) -> bool {
        a.cuisine_type() < b.cuisine_type()
    }
}

fn demonstrate_sorting(strategy: &dyn SortStrategy, a: &dyn Rateable, b: &dyn Rateable) {
    let first_is_a = strategy.should_come_first(a, b);
    println!(
        "  Sorting by {}: first={}, second={}",
        strategy.sort_name(),
        if first_is_a {
            a.cuisine_type()
        } else {
            b.cuisine_type()
        },
        if first_is_a {
            b.cuisine_type()
        } else {
            a.cuisine_type()
        },
    );
}

// ============================================================
// MAIN — Putting It All Together
// ============================================================
fn main() {
    println!("=== RUST TRAITS: Zomato Rating System ===\n");

    // --- Section 1 & 2: Basic Trait Implementation ---
    println!("--- 1. Trait Implementation ---");

    let saravana = SouthIndianRestaurant {
        name: String::from("Saravana Bhavan"),
        dosa_varieties: 42,
        avg_rating: 4.7,
    };

    let pehalwan = NorthIndianDhaba {
        name: String::from("Pehalwan Dhaba"),
        is_highway: true,
        avg_rating: 4.1,
    };

    let paradise = BiryaniHouse {
        name: String::from("Paradise Biryani"),
        city: String::from("Hyderabad"),
        avg_rating: 4.8,
    };

    // Calling trait methods
    println!("  {}: {}", saravana.name, saravana.summary());
    // Output: Saravana Bhavan: South Indian cuisine | Rating: 4.7 (42 dosa varieties!)

    println!("  {}: {}", pehalwan.name, pehalwan.summary());
    // Output: Pehalwan Dhaba: North Indian cuisine | Rating: 4.3 - Very Good

    println!("  {}: {}", paradise.name, paradise.summary());
    // Output: Paradise Biryani: Mughlai / Biryani cuisine | Rating: 4.8 - Outstanding!

    // --- Section 3: Trait Bounds ---
    println!("\n--- 2. Trait Bounds ---");

    print!("  Saravana: ");
    print_rating(&saravana);
    // Output: Rating: 4.7 (42 dosa varieties!)

    print!("  Paradise: ");
    print_rating(&paradise);
    // Output: Rating: 4.8 - Outstanding!

    println!("  Is Saravana top-rated? {}", is_top_rated(&saravana));
    // Output: Is Saravana top-rated? true

    println!("  Is Pehalwan top-rated? {}", is_top_rated(&pehalwan));
    // Output: Is Pehalwan top-rated? false

    // Using print_full_info (requires Rateable + Display)
    println!("\n--- 3. Multiple Trait Bounds ---");
    print_full_info(&paradise);
    // Output: Paradise Biryani (Biryani, Hyderabad)
    //         Mughlai / Biryani cuisine | Rating: 4.8 - Outstanding!

    display_if_good(&saravana);
    // Output: Recommended: Saravana Bhavan (South Indian, 42 dosas) (4.7 (42 dosa varieties!))

    // --- Section 5: Trait Objects ---
    println!("\n--- 4. Trait Objects (dyn) ---");

    let restaurants: Vec<&dyn Rateable> = vec![&saravana, &pehalwan, &paradise];
    print_all_ratings(&restaurants);
    // Output:
    //   1. South Indian | 4.7 (42 dosa varieties!)
    //   2. North Indian | 4.3 - Very Good
    //   3. Mughlai / Biryani | 4.8 - Outstanding!

    // Creating via factory function
    let mystery = create_restaurant("biryani");
    println!("  Factory created: {}", mystery.summary());
    // Output: Factory created: Mughlai / Biryani cuisine | Rating: 4.8 - Outstanding!

    // --- Section 6: Derive Macros ---
    println!("\n--- 5. Derive Macros ---");

    let butter_chicken = MenuItem {
        name: String::from("Butter Chicken"),
        price: 350.0,
        is_veg: false,
    };

    let paneer_tikka = MenuItem {
        name: String::from("Paneer Tikka"),
        price: 280.0,
        is_veg: true,
    };

    let butter_chicken_copy = butter_chicken.clone(); // Clone trait

    println!("  Debug: {:?}", butter_chicken); // Debug trait
    // Output: Debug: MenuItem { name: "Butter Chicken", price: 350.0, is_veg: false }

    println!(
        "  Are they equal? {}",
        butter_chicken == butter_chicken_copy // PartialEq
    );
    // Output: Are they equal? true

    println!(
        "  Different items? {}",
        butter_chicken == paneer_tikka
    );
    // Output: Different items? false

    // --- Section 7: Operator Overloading ---
    println!("\n--- 6. Operator Overloading ---");

    let dosa_price = Rupees::new(120, 50);
    let coffee_price = Rupees::new(45, 0);
    let total = dosa_price + coffee_price; // Uses Add trait

    println!("  Dosa: {}", dosa_price);
    // Output: Dosa: Rs.120.50

    println!("  Coffee: {}", coffee_price);
    // Output: Coffee: Rs.45.00

    println!("  Total: {}", total);
    // Output: Total: Rs.165.50

    let same_price = Rupees::new(120, 50);
    println!("  Prices equal? {}", dosa_price == same_price);
    // Output: Prices equal? true

    // --- Section 8: Supertraits ---
    println!("\n--- 7. Supertraits ---");

    println!("  {}", paradise.premium_badge());
    // Output: [PREMIUM GOLD] Paradise Biryani (Biryani, Hyderabad) | Mughlai / Biryani cuisine | Rating: 4.8 - Outstanding!

    // --- Section 9: Newtype Pattern ---
    println!("\n--- 8. Newtype Pattern (Orphan Rule) ---");

    let list = RestaurantList(vec![
        String::from("Saravana Bhavan"),
        String::from("Pehalwan Dhaba"),
        String::from("Paradise Biryani"),
    ]);
    println!("{}", list);
    // Output:
    //   Zomato Restaurants:
    //   1. Saravana Bhavan
    //   2. Pehalwan Dhaba
    //   3. Paradise Biryani

    // --- Section 10: Associated Types ---
    println!("--- 9. Associated Types ---");

    let mut queue = OrderQueue {
        orders: vec![
            String::from("Masala Dosa"),
            String::from("Biryani"),
            String::from("Butter Naan"),
        ],
        index: 0,
    };

    while let Some(order) = queue.next_order() {
        println!("  Delivering: {}", order);
    }
    // Output:
    //   Delivering: Masala Dosa
    //   Delivering: Biryani
    //   Delivering: Butter Naan

    // --- Section 11: Blanket Implementation ---
    println!("\n--- 10. Blanket Implementations ---");

    // describe() is available on all Rateable types automatically
    println!("  {}", saravana.describe());
    // Output: A South Indian restaurant rated 4.7 (42 dosa varieties!)

    println!("  {}", paradise.describe());
    // Output: A Mughlai / Biryani restaurant rated 4.8 - Outstanding!

    // --- Section 12: Strategy Pattern ---
    println!("\n--- 11. Strategy Pattern ---");

    let by_rating = SortByRating;
    let by_cuisine = SortByCuisine;

    demonstrate_sorting(&by_rating, &saravana, &pehalwan);
    // Output: Sorting by Rating (High to Low): first=South Indian, second=North Indian

    demonstrate_sorting(&by_cuisine, &saravana, &pehalwan);
    // Output: Sorting by Cuisine (Alphabetical): first=North Indian, second=South Indian

    // ============================================================
    // KEY TAKEAWAYS
    // ============================================================
    println!("\n=== KEY TAKEAWAYS ===");
    println!("1. Traits define shared behavior (like interfaces)");
    println!("2. impl Trait for Type fulfills the contract");
    println!("3. Default methods reduce boilerplate");
    println!("4. Trait bounds restrict generics: fn foo<T: Trait>(x: T)");
    println!("5. dyn Trait enables dynamic dispatch (runtime polymorphism)");
    println!("6. #[derive(Debug, Clone, PartialEq)] auto-implements common traits");
    println!("7. Operator overloading = implementing std::ops traits");
    println!("8. Supertraits: trait Child: Parent requires Parent first");
    println!("9. Orphan rule: implement trait/type only if you own one of them");
    println!("10. Associated types fix the generic per implementation");
    println!("11. Blanket impls: impl<T: X> Y for T gives Y to all X implementors");
    println!("12. Traits enable clean design patterns (Strategy, Observer, etc.)");
}
