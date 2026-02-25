// ============================================================
// FILE 20: CONCURRENCY WITH THREADS — Fearless Parallelism
// ============================================================
// WHY THIS MATTERS:
// Concurrency is one of Rust's superpowers. The ownership
// system prevents data races at compile time — something no
// other mainstream language does. You get fearless concurrency:
// if your code compiles, it's free from data races. This
// chapter covers threads, mutexes, and shared state.
// ============================================================

// ============================================================
// STORY: Amma's Dhaba Kitchen Crew
// ============================================================
// Picture a busy dhaba (roadside restaurant) near a National
// Highway in Tamil Nadu. Amma runs the kitchen with a crew of
// cooks. Each cook (thread) works on their own dish
// independently. But there's a shared spice rack (shared state)
// that everyone needs access to.
//
// If two cooks grab the same spice jar at the same time,
// chaos! So there's a lock (Mutex) on the spice rack — only
// one cook can access it at a time. They take the lock, grab
// their spice, put it back, and release the lock.
//
// The kitchen counter where orders pile up is like a channel
// (covered in next chapter) — waiters put orders on one end,
// cooks pick them from the other.
//
// Rust's ownership system is like Amma herself — she ensures
// no two cooks fight over the same ingredient at compile time!
// ============================================================

use std::sync::{Arc, Mutex, Barrier};
use std::thread;
use std::time::Duration;

// ============================================================
// 1. SPAWNING THREADS — Creating Independent Workers
// ============================================================
// WHY: thread::spawn creates a new OS thread that runs a
// closure concurrently with the main thread. The main thread
// doesn't wait for spawned threads by default.

fn demonstrate_spawning() {
    println!("--- 1. Spawning Threads ---");

    // Basic thread spawn
    let handle = thread::spawn(|| {
        for i in 1..=3 {
            println!("  [Cook 1] Preparing dish {}...", i);
            thread::sleep(Duration::from_millis(10));
        }
    });

    // Main thread continues immediately
    for i in 1..=3 {
        println!("  [Amma] Checking order {}...", i);
        thread::sleep(Duration::from_millis(10));
    }

    // Wait for the spawned thread to finish
    handle.join().unwrap();
    // Output (interleaved — order may vary):
    //   [Amma] Checking order 1...
    //   [Cook 1] Preparing dish 1...
    //   [Amma] Checking order 2...
    //   [Cook 1] Preparing dish 2...
    //   [Amma] Checking order 3...
    //   [Cook 1] Preparing dish 3...

    println!("  All done!");
}

// ============================================================
// 2. JoinHandle — Waiting for Threads to Complete
// ============================================================
// WHY: JoinHandle lets you wait for a thread to finish and
// get its return value. join() blocks the current thread.

fn demonstrate_join_handle() {
    println!("\n--- 2. JoinHandle ---");

    // Thread that returns a value
    let handle = thread::spawn(|| {
        let mut total = 0;
        for i in 1..=100 {
            total += i;
        }
        total // Return value from thread
    });

    // join() returns Result<T, Box<dyn Any>>
    let result = handle.join().unwrap();
    println!("  Sum 1..=100 from thread: {}", result);
    // Output: Sum 1..=100 from thread: 5050

    // Multiple threads with handles
    let mut handles = vec![];

    for cook_id in 1..=4 {
        let handle = thread::spawn(move || {
            // WHY: `move` takes ownership of cook_id
            let dish = format!("Dish from Cook {}", cook_id);
            thread::sleep(Duration::from_millis(10));
            dish
        });
        handles.push(handle);
    }

    // Collect results from all threads
    let dishes: Vec<String> = handles
        .into_iter()
        .map(|h| h.join().unwrap())
        .collect();

    println!("  All dishes: {:?}", dishes);
    // Output: All dishes: ["Dish from Cook 1", "Dish from Cook 2", "Dish from Cook 3", "Dish from Cook 4"]
}

// ============================================================
// 3. MOVE CLOSURES — Transferring Data to Threads
// ============================================================
// WHY: Threads might outlive the scope that created them.
// The `move` keyword transfers ownership of captured variables
// into the thread, ensuring the data lives long enough.

fn demonstrate_move_closures() {
    println!("\n--- 3. Move Closures for Threads ---");

    // Without move — WON'T compile because thread might outlive `recipe`
    // let recipe = String::from("Sambar");
    // thread::spawn(|| {
    //     println!("{}", recipe); // ERROR: closure may outlive current function
    // });

    // With move — ownership transferred to thread
    let recipe = String::from("Sambar");
    let handle = thread::spawn(move || {
        // `recipe` is now owned by this thread
        println!("  Cook is making: {}", recipe);
        recipe.len() // Can return it
    });

    // recipe is no longer available here — it moved into the thread
    // println!("{}", recipe); // ERROR: value used after move

    let len = handle.join().unwrap();
    println!("  Recipe name length: {}", len);
    // Output: Cook is making: Sambar
    //         Recipe name length: 6

    // Moving multiple values
    let spices = vec!["Turmeric", "Cumin", "Coriander"];
    let dish_name = String::from("Rasam");

    let handle = thread::spawn(move || {
        // Both spices and dish_name are moved here
        println!("  Making {} with {:?}", dish_name, spices);
    });

    handle.join().unwrap();
    // Output: Making Rasam with ["Turmeric", "Cumin", "Coriander"]

    // WHY: For Copy types, move copies the value (original still works)
    let quantity = 42_u32;
    let handle = thread::spawn(move || {
        println!("  Quantity in thread: {}", quantity);
    });
    handle.join().unwrap();
    println!("  Quantity still here: {}", quantity); // u32 is Copy
    // Output: Quantity in thread: 42
    //         Quantity still here: 42
}

// ============================================================
// 4. SHARED STATE WITH Arc<Mutex<T>>
// ============================================================
// WHY: When multiple threads need to read AND write shared
// data, you need:
// - Arc: thread-safe reference counting (shared ownership)
// - Mutex: mutual exclusion lock (only one thread at a time)
// Together: Arc<Mutex<T>> is "the shared spice rack with a lock"

fn demonstrate_arc_mutex() {
    println!("\n--- 4. Arc<Mutex<T>> — Shared Mutable State ---");

    // Shared order counter — multiple cooks update it
    let order_count = Arc::new(Mutex::new(0_u32));
    let mut handles = vec![];

    for cook_id in 1..=5 {
        let counter = Arc::clone(&order_count);
        // WHY: Arc::clone increments the atomic reference count.
        // Each thread gets its own Arc pointing to the same Mutex.

        let handle = thread::spawn(move || {
            for _ in 0..10 {
                // Lock the mutex — blocks if another thread holds it
                let mut count = counter.lock().unwrap();
                // WHY: .lock() returns a MutexGuard that auto-unlocks
                // when dropped (goes out of scope)
                *count += 1;
                // Guard is dropped here — lock is released
            }
            println!("  Cook {} finished 10 orders", cook_id);
        });

        handles.push(handle);
    }

    // Wait for all threads
    for handle in handles {
        handle.join().unwrap();
    }

    // Check the final count
    let final_count = order_count.lock().unwrap();
    println!("  Total orders: {} (expected: 50)", *final_count);
    // Output: Total orders: 50 (expected: 50)

    // WHY this works: Mutex ensures only one thread modifies the
    // counter at a time. No data race possible!
}

// ============================================================
// 5. SHARED COMPLEX STATE
// ============================================================
// WHY: Real programs share more than just numbers. Here's
// how to share complex data structures across threads.

fn demonstrate_shared_complex_state() {
    println!("\n--- 5. Complex Shared State ---");

    // Shared menu that cooks add to
    #[derive(Debug, Clone)]
    struct MenuItem {
        name: String,
        price: f64,
        cook_id: u32,
    }

    let menu = Arc::new(Mutex::new(Vec::<MenuItem>::new()));
    let mut handles = vec![];

    let dishes = vec![
        (1, "Masala Dosa", 80.0),
        (2, "Idli Sambar", 60.0),
        (3, "Chole Bhature", 100.0),
        (1, "Rava Dosa", 90.0),
        (3, "Aloo Paratha", 70.0),
        (2, "Medu Vada", 50.0),
    ];

    for (cook_id, name, price) in dishes {
        let menu_clone = Arc::clone(&menu);

        let handle = thread::spawn(move || {
            let item = MenuItem {
                name: String::from(name),
                price,
                cook_id,
            };

            // Lock, add item, auto-unlock
            let mut menu_guard = menu_clone.lock().unwrap();
            menu_guard.push(item);
            // Lock released here when menu_guard is dropped
        });

        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    // Read the shared menu
    let final_menu = menu.lock().unwrap();
    println!("  Menu ({} items):", final_menu.len());
    for item in final_menu.iter() {
        println!(
            "    {} - Rs.{:.0} (Cook {})",
            item.name, item.price, item.cook_id
        );
    }
    // Output (order may vary due to thread scheduling):
    //   Menu (6 items):
    //   Masala Dosa - Rs.80 (Cook 1)
    //   Idli Sambar - Rs.60 (Cook 2)
    //   ... etc
}

// ============================================================
// 6. SCOPED THREADS — Borrowing from Parent Scope
// ============================================================
// WHY: Regular threads need 'static or moved data. Scoped
// threads can BORROW from the parent scope because the scope
// guarantees all threads finish before the borrowed data is
// dropped. Added in Rust 1.63.

fn demonstrate_scoped_threads() {
    println!("\n--- 6. Scoped Threads ---");

    let ingredients = vec![
        String::from("Rice"),
        String::from("Dal"),
        String::from("Vegetables"),
        String::from("Spices"),
    ];

    let total_weight = Mutex::new(0u32);

    // thread::scope ensures all threads finish before the scope ends
    thread::scope(|s| {
        // WHY: These threads can BORROW `ingredients` and `total_weight`
        // because thread::scope guarantees they finish before this
        // scope ends.

        for (i, ingredient) in ingredients.iter().enumerate() {
            // No `move` needed! We can borrow directly.
            s.spawn(|| {
                let weight = (i + 1) as u32 * 100;
                println!("  Cook processing: {} ({}g)", ingredient, weight);
                *total_weight.lock().unwrap() += weight;
            });
        }
        // All threads are joined automatically at the end of this scope
    });

    // ingredients and total_weight are still available!
    println!("  Ingredients: {:?}", ingredients);
    println!("  Total weight: {}g", total_weight.lock().unwrap());
    // Output:
    //   Cook processing: Rice (100g)
    //   Cook processing: Dal (200g)
    //   Cook processing: Vegetables (300g)
    //   Cook processing: Spices (400g)
    //   Ingredients: ["Rice", "Dal", "Vegetables", "Spices"]
    //   Total weight: 1000g

    // Scoped threads with return values
    let numbers = vec![1, 2, 3, 4, 5, 6, 7, 8];

    let results: Vec<i32> = thread::scope(|s| {
        let mut handles = vec![];

        for chunk in numbers.chunks(2) {
            let handle = s.spawn(|| {
                // Borrow chunk directly — no move needed
                chunk.iter().sum::<i32>()
            });
            handles.push(handle);
        }

        handles
            .into_iter()
            .map(|h| h.join().unwrap())
            .collect()
    });

    println!("  Chunk sums: {:?}", results);
    println!("  Total: {}", results.iter().sum::<i32>());
    // Output: Chunk sums: [3, 7, 11, 15]
    //         Total: 36
}

// ============================================================
// 7. THREAD SLEEP AND TIMING
// ============================================================

fn demonstrate_thread_sleep() {
    println!("\n--- 7. Thread Sleep and Timing ---");

    let start = std::time::Instant::now();

    let mut handles = vec![];

    for cook_id in 1..=3 {
        let handle = thread::spawn(move || {
            let cook_time = Duration::from_millis(cook_id * 50);
            thread::sleep(cook_time);
            format!("Cook {} done in {}ms", cook_id, cook_time.as_millis())
        });
        handles.push(handle);
    }

    for handle in handles {
        let result = handle.join().unwrap();
        println!("  {}", result);
    }

    let elapsed = start.elapsed();
    println!("  Total time: {}ms (parallel!)", elapsed.as_millis());
    // Output:
    //   Cook 1 done in 50ms
    //   Cook 2 done in 100ms
    //   Cook 3 done in 150ms
    //   Total time: ~150ms (parallel!)
    // WHY: All cooks work simultaneously, so total time is max, not sum
}

// ============================================================
// 8. PANIC IN THREADS
// ============================================================
// WHY: A panic in a spawned thread doesn't crash the main
// thread. The JoinHandle captures the panic and returns it
// as an Err from join().

fn demonstrate_thread_panic() {
    println!("\n--- 8. Panic in Threads ---");

    // Thread that panics
    let handle = thread::spawn(|| {
        // This will panic
        let numbers: Vec<i32> = vec![1, 2, 3];
        // Simulate a recoverable panic scenario
        if numbers.len() < 10 {
            return Err("Not enough ingredients!");
        }
        Ok(numbers.iter().sum::<i32>())
    });

    match handle.join() {
        Ok(Ok(sum)) => println!("  Success: sum = {}", sum),
        Ok(Err(msg)) => println!("  Thread returned error: {}", msg),
        Err(_) => println!("  Thread panicked!"),
    }
    // Output: Thread returned error: Not enough ingredients!

    // Catching actual panics
    let handle = thread::spawn(|| {
        panic!("Cook dropped the biryani!");
    });

    match handle.join() {
        Ok(_) => println!("  Thread completed normally"),
        Err(e) => {
            // Try to extract panic message
            if let Some(msg) = e.downcast_ref::<&str>() {
                println!("  Thread panicked: {}", msg);
            } else if let Some(msg) = e.downcast_ref::<String>() {
                println!("  Thread panicked: {}", msg);
            } else {
                println!("  Thread panicked with unknown error");
            }
        }
    }
    // Output: Thread panicked: Cook dropped the biryani!

    println!("  Main thread is still alive!");
    // Output: Main thread is still alive!
}

// ============================================================
// 9. BARRIER — Synchronizing Multiple Threads
// ============================================================
// WHY: A barrier makes threads wait until all of them reach
// the same point. Like all cooks waiting until everyone's
// prep is done before they start cooking together.

fn demonstrate_barrier() {
    println!("\n--- 9. Barrier --- ");

    let num_cooks = 4;
    let barrier = Arc::new(Barrier::new(num_cooks));
    let mut handles = vec![];

    for cook_id in 1..=num_cooks {
        let b = Arc::clone(&barrier);

        let handle = thread::spawn(move || {
            // Phase 1: Prep (different times)
            let prep_time = cook_id as u64 * 20;
            thread::sleep(Duration::from_millis(prep_time));
            println!("  Cook {} finished prep", cook_id);

            // Wait for all cooks to finish prep
            b.wait();

            // Phase 2: All start cooking together
            println!("  Cook {} starts cooking!", cook_id);
        });

        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }
    // Output (prep order varies, but cooking starts together):
    //   Cook 1 finished prep
    //   Cook 2 finished prep
    //   Cook 3 finished prep
    //   Cook 4 finished prep
    //   Cook 1 starts cooking!
    //   Cook 2 starts cooking!
    //   Cook 3 starts cooking!
    //   Cook 4 starts cooking!
}

// ============================================================
// 10. THREAD BUILDER — Custom Thread Configuration
// ============================================================

fn demonstrate_thread_builder() {
    println!("\n--- 10. Thread Builder ---");

    // Custom thread name and stack size
    let builder = thread::Builder::new()
        .name(String::from("head-chef"))
        .stack_size(4 * 1024 * 1024); // 4MB stack

    let handle = builder
        .spawn(|| {
            let name = thread::current().name().unwrap_or("unknown").to_string();
            println!("  Running in thread: '{}'", name);
            format!("Order from {}", name)
        })
        .unwrap();

    let result = handle.join().unwrap();
    println!("  Result: {}", result);
    // Output: Running in thread: 'head-chef'
    //         Result: Order from head-chef

    // Get current thread info
    let main_thread = thread::current();
    println!("  Main thread: {:?}", main_thread.name());
    // Output: Main thread: Some("main")

    // Available parallelism (number of CPU cores)
    let cores = thread::available_parallelism()
        .map(|n| n.get())
        .unwrap_or(1);
    println!("  Available CPU cores: {}", cores);
}

// ============================================================
// 11. PRACTICAL PATTERN — Parallel Map
// ============================================================
// WHY: A common pattern is to process a collection in parallel.
// Each thread handles a portion, and results are collected.

fn parallel_map<T, R, F>(data: Vec<T>, f: F) -> Vec<R>
where
    T: Send + 'static,
    R: Send + 'static,
    F: Fn(T) -> R + Send + Sync + 'static,
{
    let f = Arc::new(f);
    let handles: Vec<_> = data
        .into_iter()
        .map(|item| {
            let f = Arc::clone(&f);
            thread::spawn(move || f(item))
        })
        .collect();

    handles
        .into_iter()
        .map(|h| h.join().unwrap())
        .collect()
}

fn demonstrate_parallel_map() {
    println!("\n--- 11. Practical: Parallel Map ---");

    // Process orders in parallel
    let orders = vec![
        String::from("Masala Dosa"),
        String::from("Idli"),
        String::from("Vada"),
        String::from("Uttapam"),
    ];

    let prepared = parallel_map(orders, |order| {
        thread::sleep(Duration::from_millis(10)); // Simulate cooking
        format!("{} (ready!)", order)
    });

    println!("  Prepared orders:");
    for order in &prepared {
        println!("    {}", order);
    }
    // Output:
    //   Masala Dosa (ready!)
    //   Idli (ready!)
    //   Vada (ready!)
    //   Uttapam (ready!)

    // Parallel computation
    let numbers: Vec<u64> = (1..=8).collect();
    let squares = parallel_map(numbers, |n| {
        println!("  Computing {}^2 in {:?}", n, thread::current().id());
        n * n
    });
    println!("  Squares: {:?}", squares);
    // Output: Squares: [1, 4, 9, 16, 25, 36, 49, 64]
}

// ============================================================
// 12. PRACTICAL PATTERN — Thread Pool Simulation
// ============================================================

fn demonstrate_thread_pool_pattern() {
    println!("\n--- 12. Thread Pool Pattern ---");

    // Simulate a simple fixed-size thread pool using scoped threads
    let tasks: Vec<String> = (1..=8)
        .map(|i| format!("Order-{}", i))
        .collect();

    let num_workers = 4;
    let results = Arc::new(Mutex::new(Vec::new()));

    // Divide tasks into chunks for each worker
    let chunks: Vec<Vec<String>> = tasks
        .chunks((tasks.len() + num_workers - 1) / num_workers)
        .map(|chunk| chunk.to_vec())
        .collect();

    let mut handles = vec![];

    for (worker_id, chunk) in chunks.into_iter().enumerate() {
        let results = Arc::clone(&results);

        let handle = thread::spawn(move || {
            for task in chunk {
                let result = format!("{} -> done by Worker-{}", task, worker_id + 1);
                thread::sleep(Duration::from_millis(10));
                results.lock().unwrap().push(result);
            }
        });

        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    let final_results = results.lock().unwrap();
    println!("  Completed {} tasks:", final_results.len());
    for result in final_results.iter() {
        println!("    {}", result);
    }
    // Output (order may vary):
    //   Completed 8 tasks:
    //   Order-1 -> done by Worker-1
    //   Order-2 -> done by Worker-1
    //   ... etc
}

// ============================================================
// MAIN — Putting It All Together
// ============================================================
fn main() {
    println!("=== RUST CONCURRENCY: Amma's Dhaba Kitchen ===\n");

    demonstrate_spawning();
    demonstrate_join_handle();
    demonstrate_move_closures();
    demonstrate_arc_mutex();
    demonstrate_shared_complex_state();
    demonstrate_scoped_threads();
    demonstrate_thread_sleep();
    demonstrate_thread_panic();
    demonstrate_barrier();
    demonstrate_thread_builder();
    demonstrate_parallel_map();
    demonstrate_thread_pool_pattern();

    // ============================================================
    // KEY TAKEAWAYS
    // ============================================================
    println!("\n=== KEY TAKEAWAYS ===");
    println!("1. thread::spawn creates OS threads with closures");
    println!("2. JoinHandle.join() waits for thread and gets its return value");
    println!("3. `move` closures transfer ownership to threads");
    println!("4. Arc<Mutex<T>> = thread-safe shared mutable state");
    println!("5. Mutex::lock() returns a guard that auto-unlocks on drop");
    println!("6. thread::scope lets threads borrow from parent scope");
    println!("7. Thread panics don't crash main — caught by join()");
    println!("8. Barrier synchronizes threads at a common point");
    println!("9. Thread::Builder configures name and stack size");
    println!("10. Rust prevents data races at COMPILE TIME — fearless concurrency!");
}
