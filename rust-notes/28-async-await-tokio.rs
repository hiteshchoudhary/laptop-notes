// ============================================================
// 28. ASYNC/AWAIT AND TOKIO IN RUST
// ============================================================
// WHY THIS MATTERS:
// Modern applications do a LOT of waiting — waiting for network
// responses, database queries, file reads, user input. Without
// async, your program blocks (freezes) during each wait. With
// async/await, your program can do useful work WHILE waiting,
// handling thousands of concurrent operations on a single thread.
// Tokio is Rust's most popular async runtime, powering production
// systems at Discord, Cloudflare, AWS, and countless startups.
// ============================================================

// ============================================================
// CARGO.TOML — Required dependencies
// ============================================================
// Add these to your Cargo.toml to compile this file:
//
// [package]
// name = "async-tokio-demo"
// version = "0.1.0"
// edition = "2021"
//
// [dependencies]
// tokio = { version = "1", features = ["full"] }
// ============================================================

// ============================================================
// STORY: SWIGGY ORDER ORCHESTRATOR
// ============================================================
// Imagine you're building the backend for Swiggy, India's popular
// food delivery app. It's Friday night dinner rush in Bangalore.
//
// A single order involves MANY concurrent operations:
//
// 1. User places order for Biryani from Meghana Foods
// 2. Your system needs to SIMULTANEOUSLY:
//    a. Validate the user's payment (2 seconds)
//    b. Check restaurant availability (1 second)
//    c. Find a delivery partner nearby (3 seconds)
//    d. Calculate estimated delivery time (0.5 seconds)
//
// WITHOUT ASYNC (synchronous): Each step runs one after another.
//    Total time: 2 + 1 + 3 + 0.5 = 6.5 seconds. Too slow!
//
// WITH ASYNC: All steps run concurrently.
//    Total time: max(2, 1, 3, 0.5) = 3 seconds. Much better!
//
// Now multiply this by 10,000 simultaneous orders across India.
// Async lets ONE server handle all these concurrent operations
// without spawning 10,000 threads (which would exhaust memory).
//
// Tokio is the runtime that makes this magic happen. It schedules
// async tasks, manages timers, handles I/O, and provides channels
// for communication between tasks.
//
// Let's build this system step by step!
// ============================================================

use tokio::time::{sleep, Duration, timeout};
use tokio::sync::{mpsc, Mutex};
use std::sync::Arc;

// ============================================================
// 1. ASYNC FN AND .AWAIT — THE BASICS
// ============================================================
// WHY: `async fn` defines a function that can be paused and resumed.
// `.await` is where the pause happens — the function gives up control
// so other tasks can run. When the awaited operation completes,
// the function resumes exactly where it left off.

// An async function — note the `async` keyword
async fn validate_payment(order_id: &str, amount: f64) -> Result<String, String> {
    println!("[Payment] Validating Rs. {:.0} for order {}...", amount, order_id);

    // WHY: sleep simulates a network call to the payment gateway.
    // In real code, this would be an HTTP request.
    // During this sleep, OTHER tasks can run — that's the magic!
    sleep(Duration::from_millis(500)).await;

    if amount > 0.0 {
        println!("[Payment] Validated! Transaction approved.");
        Ok(format!("TXN-{}-OK", order_id))
    } else {
        Err(String::from("Invalid payment amount"))
    }
}

async fn check_restaurant(restaurant: &str) -> Result<bool, String> {
    println!("[Restaurant] Checking if {} is open...", restaurant);
    sleep(Duration::from_millis(300)).await;
    println!("[Restaurant] {} is open and accepting orders!", restaurant);
    Ok(true)
}

async fn find_delivery_partner(area: &str) -> Result<String, String> {
    println!("[Delivery] Searching for partner in {}...", area);
    sleep(Duration::from_millis(700)).await;
    let partner = format!("Raju (rating: 4.8, {} area)", area);
    println!("[Delivery] Found: {}", partner);
    Ok(partner)
}

async fn estimate_delivery_time(
    restaurant: &str,
    delivery_address: &str,
) -> Result<u32, String> {
    println!(
        "[ETA] Calculating time from {} to {}...",
        restaurant, delivery_address
    );
    sleep(Duration::from_millis(200)).await;
    let minutes = 35;
    println!("[ETA] Estimated delivery: {} minutes", minutes);
    Ok(minutes)
}

// ============================================================
// 2. SEQUENTIAL VS CONCURRENT EXECUTION
// ============================================================
// WHY: This demonstrates the fundamental difference between
// running tasks one-by-one vs all-at-once.

async fn demo_sequential() {
    println!("--- 2a. Sequential Execution ---\n");

    let start = std::time::Instant::now();

    // WHY: Each .await BLOCKS this async function until it completes.
    // The total time is the SUM of all durations.
    let payment = validate_payment("ORD-001", 599.0).await;
    let restaurant = check_restaurant("Meghana Foods").await;
    let partner = find_delivery_partner("Koramangala").await;
    let eta = estimate_delivery_time("Meghana Foods", "HSR Layout").await;

    let elapsed = start.elapsed();
    println!("\nSequential results:");
    println!("  Payment: {:?}", payment);
    println!("  Restaurant: {:?}", restaurant);
    println!("  Partner: {:?}", partner);
    println!("  ETA: {:?}", eta);
    println!("  Total time: {:.1}s (sum of all waits)\n", elapsed.as_secs_f64());
    // Output: Total time: ~1.7s (500 + 300 + 700 + 200 ms)
}

// ============================================================
// 3. tokio::join! — RUN TASKS CONCURRENTLY
// ============================================================
// WHY: join! runs multiple futures concurrently and waits for ALL
// of them to complete. The total time is the MAX of all durations.
// Like Swiggy checking payment, restaurant, and delivery at once.

async fn demo_concurrent_join() {
    println!("--- 3. Concurrent Execution with join! ---\n");

    let start = std::time::Instant::now();

    // WHY: tokio::join! runs all futures concurrently on the SAME task.
    // No new threads are spawned — it's cooperative multitasking.
    let (payment, restaurant, partner, eta) = tokio::join!(
        validate_payment("ORD-002", 799.0),
        check_restaurant("Empire Restaurant"),
        find_delivery_partner("Indiranagar"),
        estimate_delivery_time("Empire Restaurant", "MG Road"),
    );

    let elapsed = start.elapsed();
    println!("\nConcurrent results:");
    println!("  Payment: {:?}", payment);
    println!("  Restaurant: {:?}", restaurant);
    println!("  Partner: {:?}", partner);
    println!("  ETA: {:?}", eta);
    println!("  Total time: {:.1}s (max of all waits — much faster!)\n",
        elapsed.as_secs_f64());
    // Output: Total time: ~0.7s (max of 500, 300, 700, 200 ms)
}

// ============================================================
// 4. tokio::spawn — SPAWNING INDEPENDENT TASKS
// ============================================================
// WHY: spawn creates a new independent task that runs in the
// background. Unlike join!, you don't have to wait for it
// immediately. It's like assigning work to different Swiggy
// departments — they work independently.

async fn process_order(order_id: &str, item: &str, amount: f64) -> String {
    println!("[Order {}] Processing: {} (Rs. {:.0})", order_id, item, amount);
    sleep(Duration::from_millis(400)).await;
    format!("Order {} confirmed: {}", order_id, item)
}

async fn demo_spawn() {
    println!("--- 4. Spawning Independent Tasks ---\n");

    let start = std::time::Instant::now();

    // WHY: tokio::spawn returns a JoinHandle. The task runs independently.
    // You can await the handle later to get the result.
    // IMPORTANT: spawn requires 'static lifetime — the future must own
    // all its data (no borrowed references to local variables).
    let handle1 = tokio::spawn(async {
        process_order("ORD-101", "Chicken Biryani", 350.0).await
    });

    let handle2 = tokio::spawn(async {
        process_order("ORD-102", "Masala Dosa", 150.0).await
    });

    let handle3 = tokio::spawn(async {
        process_order("ORD-103", "Paneer Tikka", 280.0).await
    });

    // Do other work while orders are being processed...
    println!("[Main] Orders dispatched! Doing other work...");
    sleep(Duration::from_millis(100)).await;
    println!("[Main] Other work done. Waiting for orders...\n");

    // Await the results
    // WHY: JoinHandle returns Result<T, JoinError>. JoinError occurs
    // if the task panicked or was cancelled.
    let result1 = handle1.await.expect("Task 1 panicked");
    let result2 = handle2.await.expect("Task 2 panicked");
    let result3 = handle3.await.expect("Task 3 panicked");

    println!("Results:");
    println!("  {}", result1);
    println!("  {}", result2);
    println!("  {}", result3);
    println!("  Total time: {:.1}s\n", start.elapsed().as_secs_f64());
    // Output: Total time: ~0.4s (all three ran concurrently)
}

// ============================================================
// 5. tokio::select! — RACING TASKS
// ============================================================
// WHY: select! runs multiple futures and returns as soon as the
// FIRST one completes. Like Swiggy picking the nearest delivery
// partner — whoever responds first wins.

async fn search_partner_zone_a() -> String {
    sleep(Duration::from_millis(600)).await;
    String::from("Partner A (Zone A, 2km away)")
}

async fn search_partner_zone_b() -> String {
    sleep(Duration::from_millis(300)).await;
    String::from("Partner B (Zone B, 1km away)")
}

async fn search_partner_zone_c() -> String {
    sleep(Duration::from_millis(800)).await;
    String::from("Partner C (Zone C, 3km away)")
}

async fn demo_select() {
    println!("--- 5. Racing Tasks with select! ---\n");

    let start = std::time::Instant::now();

    // WHY: select! cancels the losing futures automatically.
    // Only one branch executes — the first to complete.
    tokio::select! {
        partner = search_partner_zone_a() => {
            println!("Zone A responded first: {}", partner);
        }
        partner = search_partner_zone_b() => {
            println!("Zone B responded first: {}", partner);
        }
        partner = search_partner_zone_c() => {
            println!("Zone C responded first: {}", partner);
        }
    }

    println!("Time: {:.1}s (only waited for fastest)\n",
        start.elapsed().as_secs_f64());
    // Output: Zone B responded first: Partner B (Zone B, 1km away)
    // Output: Time: ~0.3s
}

// ============================================================
// 6. TIMEOUTS WITH tokio::time::timeout
// ============================================================
// WHY: In production, you can't wait forever. If the payment
// gateway takes too long, you need to time out and tell the user.

async fn slow_payment_gateway() -> String {
    sleep(Duration::from_secs(5)).await; // Simulates a slow gateway
    String::from("Payment processed (took 5 seconds)")
}

async fn demo_timeout() {
    println!("--- 6. Timeouts ---\n");

    // WHY: timeout wraps any future and returns Err if it takes too long.
    // The inner future is CANCELLED when the timeout fires.
    println!("Calling slow payment gateway with 2s timeout...");
    match timeout(Duration::from_secs(2), slow_payment_gateway()).await {
        Ok(result) => println!("Success: {}", result),
        Err(_) => {
            println!("TIMEOUT! Payment gateway didn't respond in 2 seconds.");
            println!("Showing user: 'Transaction pending, we'll notify you.'");
        }
    }
    // Output: TIMEOUT! Payment gateway didn't respond in 2 seconds.

    // Successful timeout
    println!("\nCalling fast operation with 2s timeout...");
    match timeout(Duration::from_secs(2), check_restaurant("Paradise Biryani")).await {
        Ok(result) => println!("Success: {:?}", result),
        Err(_) => println!("TIMEOUT!"),
    }
    // Output: Success: Ok(true)

    println!();
}

// ============================================================
// 7. ASYNC CHANNELS WITH tokio::sync::mpsc
// ============================================================
// WHY: Channels let async tasks communicate safely. mpsc = Multi
// Producer, Single Consumer. Like Swiggy's order queue — multiple
// restaurants produce "order ready" notifications, one dispatcher
// consumes them.

#[derive(Debug)]
struct OrderNotification {
    order_id: String,
    restaurant: String,
    status: String,
}

async fn demo_channels() {
    println!("--- 7. Async Channels (mpsc) ---\n");

    // WHY: mpsc::channel(buffer_size) creates a bounded channel.
    // tx = transmitter (sender), rx = receiver.
    // Buffer size controls how many messages can queue before
    // the sender has to wait.
    let (tx, mut rx) = mpsc::channel::<OrderNotification>(32);

    // Spawn multiple restaurant tasks (producers)
    let tx1 = tx.clone();
    tokio::spawn(async move {
        sleep(Duration::from_millis(200)).await;
        tx1.send(OrderNotification {
            order_id: String::from("ORD-201"),
            restaurant: String::from("Meghana Foods"),
            status: String::from("Food Ready"),
        }).await.expect("Channel closed");
    });

    let tx2 = tx.clone();
    tokio::spawn(async move {
        sleep(Duration::from_millis(500)).await;
        tx2.send(OrderNotification {
            order_id: String::from("ORD-202"),
            restaurant: String::from("MTR"),
            status: String::from("Food Ready"),
        }).await.expect("Channel closed");
    });

    let tx3 = tx.clone();
    tokio::spawn(async move {
        sleep(Duration::from_millis(350)).await;
        tx3.send(OrderNotification {
            order_id: String::from("ORD-203"),
            restaurant: String::from("Vidyarthi Bhavan"),
            status: String::from("Preparing"),
        }).await.expect("Channel closed");

        sleep(Duration::from_millis(300)).await;
        tx3.send(OrderNotification {
            order_id: String::from("ORD-203"),
            restaurant: String::from("Vidyarthi Bhavan"),
            status: String::from("Food Ready"),
        }).await.expect("Channel closed");
    });

    // WHY: Drop the original tx. The channel closes when ALL
    // senders are dropped. If we keep this tx, the receiver
    // would wait forever.
    drop(tx);

    // Consumer — the dispatcher
    println!("Dispatcher listening for order notifications...\n");
    let mut notification_count = 0;

    // WHY: rx.recv() returns None when all senders are dropped
    // and the channel is empty. This signals "no more messages".
    while let Some(notification) = rx.recv().await {
        notification_count += 1;
        println!(
            "  [Notification {}] Order {} from {} -> {}",
            notification_count,
            notification.order_id,
            notification.restaurant,
            notification.status
        );
    }
    // Output: [Notification 1] Order ORD-201 from Meghana Foods -> Food Ready
    // Output: [Notification 2] Order ORD-203 from Vidyarthi Bhavan -> Preparing
    // Output: [Notification 3] Order ORD-202 from MTR -> Food Ready
    // Output: [Notification 4] Order ORD-203 from Vidyarthi Bhavan -> Food Ready

    println!("\nTotal notifications received: {}\n", notification_count);
}

// ============================================================
// 8. ASYNC MUTEX — SHARED STATE
// ============================================================
// WHY: When multiple async tasks need to read/write shared data,
// you need synchronization. tokio::sync::Mutex is designed for
// async code — it doesn't block the thread while waiting for the lock.

async fn demo_async_mutex() {
    println!("--- 8. Async Mutex (Shared State) ---\n");

    // WHY: Arc (Atomic Reference Counting) lets multiple tasks
    // share ownership of the Mutex. Without Arc, you can't move
    // the Mutex into multiple spawned tasks.
    let order_count = Arc::new(Mutex::new(0u32));
    let total_revenue = Arc::new(Mutex::new(0.0f64));

    let mut handles = vec![];

    // Simulate 5 concurrent order processors
    let orders = vec![
        ("ORD-301", 350.0),
        ("ORD-302", 450.0),
        ("ORD-303", 200.0),
        ("ORD-304", 600.0),
        ("ORD-305", 175.0),
    ];

    for (order_id, amount) in orders {
        let count = Arc::clone(&order_count);
        let revenue = Arc::clone(&total_revenue);

        let handle = tokio::spawn(async move {
            // Simulate processing time
            sleep(Duration::from_millis(100)).await;

            // WHY: .lock().await acquires the mutex. Unlike std::sync::Mutex,
            // this .await doesn't block the thread — other tasks can run
            // while this task waits for the lock.
            let mut count_guard = count.lock().await;
            *count_guard += 1;
            let current_count = *count_guard;
            drop(count_guard); // WHY: Release lock early so others can access

            let mut revenue_guard = revenue.lock().await;
            *revenue_guard += amount;
            let current_revenue = *revenue_guard;
            drop(revenue_guard);

            println!(
                "  [{}] Processed (order #{}, running total: Rs. {:.0})",
                order_id, current_count, current_revenue
            );
        });

        handles.push(handle);
    }

    // Wait for all tasks to complete
    for handle in handles {
        handle.await.expect("Task panicked");
    }

    let final_count = *order_count.lock().await;
    let final_revenue = *total_revenue.lock().await;
    println!("\nFinal: {} orders, Rs. {:.0} revenue\n", final_count, final_revenue);
    // Output: Final: 5 orders, Rs. 1775 revenue
}

// ============================================================
// 9. PRACTICAL PATTERN: CONCURRENT API CALLS
// ============================================================
// WHY: A common real-world pattern — making multiple API calls
// concurrently and collecting all results. Like Swiggy fetching
// menus from 5 restaurants simultaneously.

async fn fetch_restaurant_menu(name: &str, delay_ms: u64) -> Result<Vec<String>, String> {
    println!("  Fetching menu from {}...", name);
    sleep(Duration::from_millis(delay_ms)).await;
    Ok(vec![
        format!("{} - Special Thali (Rs. 250)", name),
        format!("{} - Biryani (Rs. 350)", name),
        format!("{} - Dosa (Rs. 120)", name),
    ])
}

async fn demo_concurrent_api_calls() {
    println!("--- 9. Concurrent API Calls ---\n");

    let start = std::time::Instant::now();

    let restaurants = vec![
        ("Meghana Foods", 300u64),
        ("Empire Restaurant", 500),
        ("MTR", 200),
        ("Vidyarthi Bhavan", 400),
        ("Brahmin's Coffee Bar", 150),
    ];

    // Spawn all fetches concurrently
    let mut handles = vec![];
    for (name, delay) in restaurants {
        // WHY: We need to own the data moved into the spawn closure.
        let name = name.to_string();
        let handle = tokio::spawn(async move {
            fetch_restaurant_menu(&name, delay).await
        });
        handles.push((name.clone(), handle));
    }

    // Collect results
    println!("\nResults:");
    let mut total_items = 0;
    for (name, handle) in handles {
        match handle.await {
            Ok(Ok(menu)) => {
                println!("  {} ({} items):", name, menu.len());
                for item in &menu {
                    println!("    - {}", item);
                }
                total_items += menu.len();
            }
            Ok(Err(e)) => println!("  {} - API Error: {}", name, e),
            Err(e) => println!("  {} - Task Error: {}", name, e),
        }
    }

    println!("\nTotal menu items: {}", total_items);
    println!("Total time: {:.1}s (concurrent, not sequential)\n",
        start.elapsed().as_secs_f64());
    // Output: Total time: ~0.5s (max of all delays, not sum)
}

// ============================================================
// 10. PRACTICAL PATTERN: TIMEOUT WITH FALLBACK
// ============================================================
// WHY: In production, when a primary service times out, you
// want a fallback. Like Swiggy using cached data when the
// restaurant API is slow.

async fn fetch_live_eta(restaurant: &str) -> u32 {
    // Simulates a slow API
    sleep(Duration::from_millis(800)).await;
    35 // 35 minutes
}

fn get_cached_eta(_restaurant: &str) -> u32 {
    // Instant — cached/estimated value
    40 // 40 minutes (slightly pessimistic estimate)
}

async fn demo_timeout_with_fallback() {
    println!("--- 10. Timeout with Fallback ---\n");

    let restaurant = "Meghana Foods";

    // Try live ETA with 500ms timeout, fall back to cached
    let eta = match timeout(
        Duration::from_millis(500),
        fetch_live_eta(restaurant),
    ).await {
        Ok(live_eta) => {
            println!("Got live ETA: {} minutes", live_eta);
            live_eta
        }
        Err(_) => {
            let cached = get_cached_eta(restaurant);
            println!("Live ETA timed out! Using cached estimate: {} minutes", cached);
            cached
        }
    };

    println!("Showing user: 'Your order will arrive in ~{} minutes'\n", eta);
    // Output: Live ETA timed out! Using cached estimate: 40 minutes
    // Output: Showing user: 'Your order will arrive in ~40 minutes'
}

// ============================================================
// MAIN FUNCTION
// ============================================================

#[tokio::main]
async fn main() {
    println!("=== Async/Await and Tokio in Rust ===\n");

    // 1. Basic async demonstration
    println!("--- 1. Basic Async Functions ---\n");
    let payment = validate_payment("ORD-000", 499.0).await;
    println!("Payment result: {:?}\n", payment);

    // 2. Sequential execution
    demo_sequential().await;

    // 3. Concurrent execution with join!
    demo_concurrent_join().await;

    // 4. Spawning independent tasks
    demo_spawn().await;

    // 5. Racing tasks with select!
    demo_select().await;

    // 6. Timeouts
    demo_timeout().await;

    // 7. Async channels
    demo_channels().await;

    // 8. Async mutex
    demo_async_mutex().await;

    // 9. Concurrent API calls
    demo_concurrent_api_calls().await;

    // 10. Timeout with fallback
    demo_timeout_with_fallback().await;

    println!("=== Async/Await and Tokio Complete ===");
}

// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. `async fn` returns a Future. It does NOTHING until you .await it.
//    Futures are lazy — just creating one doesn't start any work.
//
// 2. `.await` pauses the current task and lets other tasks run.
//    When the awaited operation completes, execution resumes.
//    This is cooperative multitasking — not preemptive.
//
// 3. #[tokio::main] sets up the Tokio runtime. Without a runtime,
//    async code cannot execute. The runtime manages the event loop,
//    task scheduling, timers, and I/O.
//
// 4. tokio::join! runs futures CONCURRENTLY (not in parallel).
//    Total time = max of all futures. Use for independent operations
//    that should all complete.
//
// 5. tokio::spawn creates independent tasks that run in the background.
//    Returns JoinHandle for later awaiting. Requires 'static data.
//
// 6. tokio::select! races futures — returns when the FIRST completes.
//    Other futures are CANCELLED. Use for "first response wins".
//
// 7. tokio::time::timeout wraps any future with a deadline.
//    Returns Err(Elapsed) if the future doesn't complete in time.
//    The inner future is cancelled on timeout.
//
// 8. tokio::sync::mpsc channels enable safe async communication.
//    Multiple producers, single consumer. Channel closes when
//    all senders are dropped.
//
// 9. tokio::sync::Mutex is async-aware. Its .lock().await doesn't
//    block the thread. Always prefer it over std::sync::Mutex in
//    async code. Use Arc for shared ownership across tasks.
//
// 10. Think of async like Swiggy's kitchen orchestrator:
//     - join! = "prepare all dishes simultaneously, serve when all ready"
//     - select! = "find the nearest delivery partner — first to respond wins"
//     - spawn = "assign this order to a separate worker"
//     - channels = "kitchen sends 'food ready' notification to dispatcher"
//     - timeout = "if restaurant doesn't confirm in 30s, show user a warning"
// ============================================================
