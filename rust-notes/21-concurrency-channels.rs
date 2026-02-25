// ============================================================
// FILE 21: CONCURRENCY WITH CHANNELS — Message Passing
// ============================================================
// WHY THIS MATTERS:
// Channels are Rust's primary tool for message passing between
// threads. Instead of sharing memory (Arc<Mutex<T>>), threads
// communicate by SENDING messages. This follows the Go proverb:
// "Don't communicate by sharing memory; share memory by
// communicating." Channels make concurrent code easier to
// reason about and less error-prone.
// ============================================================

// ============================================================
// STORY: Dabbawala Relay Network
// ============================================================
// Mumbai's dabbawala system is the perfect analogy for channels.
// Here's how it maps:
//
// SENDER (tx) = The housewife who prepares the dabba and hands
//   it to the dabbawala at the collection point.
//
// CHANNEL = The entire railway network + sorting system. The
//   dabba travels through the channel from source to destination.
//
// RECEIVER (rx) = The office worker who picks up the dabba
//   at their building. They WAIT (block) until it arrives.
//
// MPSC = Multiple housewives (Multiple Producers) can send
//   dabbas through the same network, but there's only one
//   collection point at each office (Single Consumer).
//
// When all senders stop sending (drop), the receiver knows
// there are no more dabbas coming — the channel closes.
// ============================================================

use std::sync::mpsc;
use std::thread;
use std::time::Duration;
use std::sync::{Arc, Mutex};

// ============================================================
// 1. BASIC CHANNEL — Send and Receive
// ============================================================
// WHY: mpsc::channel() creates an unbounded channel with a
// Sender (tx) and Receiver (rx). tx.send() is non-blocking,
// rx.recv() blocks until a message arrives.

fn demonstrate_basic_channel() {
    println!("--- 1. Basic Channel ---");

    // Create a channel
    // WHY: mpsc = Multi-Producer, Single-Consumer
    let (tx, rx) = mpsc::channel();

    // Spawn a thread that sends a message
    thread::spawn(move || {
        let dabba = String::from("Rajma Chawal from Andheri");
        println!("  [Sender] Sending: {}", dabba);
        tx.send(dabba).unwrap();
        // WHY: send() takes ownership — dabba is moved into the channel
        // println!("{}", dabba); // ERROR: value used after move
    });

    // Receive the message (blocks until something arrives)
    let received = rx.recv().unwrap();
    println!("  [Receiver] Got: {}", received);
    // Output:
    //   [Sender] Sending: Rajma Chawal from Andheri
    //   [Receiver] Got: Rajma Chawal from Andheri

    // recv() returns Result<T, RecvError>
    // - Ok(msg) when a message is received
    // - Err when all senders are dropped (channel closed)
}

// ============================================================
// 2. SENDING MULTIPLE MESSAGES
// ============================================================
// WHY: A sender can send many messages. The receiver can
// iterate over them, collecting each as it arrives.

fn demonstrate_multiple_messages() {
    println!("\n--- 2. Multiple Messages ---");

    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        let dabbas = vec![
            String::from("Poha from Dadar"),
            String::from("Upma from Matunga"),
            String::from("Idli from Sion"),
            String::from("Dosa from Kurla"),
        ];

        for dabba in dabbas {
            println!("  [Sender] Dispatching: {}", dabba);
            tx.send(dabba).unwrap();
            thread::sleep(Duration::from_millis(30));
        }
        println!("  [Sender] All dabbas sent!");
        // tx is dropped here — channel closes
    });

    // Iterate over received messages
    // WHY: rx acts as an iterator. It yields messages until
    // the channel closes (all senders dropped).
    println!("  [Receiver] Waiting for dabbas...");
    for dabba in rx {
        println!("  [Receiver] Delivered: {}", dabba);
    }
    println!("  [Receiver] No more dabbas — channel closed");
    // Output:
    //   [Sender] Dispatching: Poha from Dadar
    //   [Receiver] Delivered: Poha from Dadar
    //   [Sender] Dispatching: Upma from Matunga
    //   [Receiver] Delivered: Upma from Matunga
    //   [Sender] Dispatching: Idli from Sion
    //   [Receiver] Delivered: Idli from Sion
    //   [Sender] Dispatching: Dosa from Kurla
    //   [Receiver] Delivered: Dosa from Kurla
    //   [Sender] All dabbas sent!
    //   [Receiver] No more dabbas — channel closed
}

// ============================================================
// 3. MULTIPLE PRODUCERS (MPSC)
// ============================================================
// WHY: mpsc stands for Multiple Producer, Single Consumer.
// Clone the sender to give each producer its own handle.
// Like multiple households sending dabbas to the same office.

fn demonstrate_multiple_producers() {
    println!("\n--- 3. Multiple Producers (MPSC) ---");

    let (tx, rx) = mpsc::channel();

    // Andheri collection point
    let tx_andheri = tx.clone();
    thread::spawn(move || {
        let dabbas = vec!["Thali-A1", "Thali-A2", "Thali-A3"];
        for dabba in dabbas {
            tx_andheri
                .send(format!("[Andheri] {}", dabba))
                .unwrap();
            thread::sleep(Duration::from_millis(20));
        }
    });

    // Bandra collection point
    let tx_bandra = tx.clone();
    thread::spawn(move || {
        let dabbas = vec!["Lunch-B1", "Lunch-B2"];
        for dabba in dabbas {
            tx_bandra
                .send(format!("[Bandra] {}", dabba))
                .unwrap();
            thread::sleep(Duration::from_millis(30));
        }
    });

    // Dadar collection point
    let tx_dadar = tx; // Move the original (no clone needed for last one)
    thread::spawn(move || {
        let dabbas = vec!["Tiffin-D1", "Tiffin-D2", "Tiffin-D3", "Tiffin-D4"];
        for dabba in dabbas {
            tx_dadar
                .send(format!("[Dadar] {}", dabba))
                .unwrap();
            thread::sleep(Duration::from_millis(15));
        }
    });

    // Single receiver gets all messages
    // WHY: Channel closes when ALL senders are dropped
    let mut count = 0;
    for dabba in rx {
        count += 1;
        println!("  Office received #{}: {}", count, dabba);
    }

    println!("  Total dabbas received: {}", count);
    // Output (order depends on timing):
    //   Office received #1: [Dadar] Tiffin-D1
    //   Office received #2: [Andheri] Thali-A1
    //   Office received #3: [Bandra] Lunch-B1
    //   ... etc
    //   Total dabbas received: 9
}

// ============================================================
// 4. SYNC CHANNEL — Bounded Buffer
// ============================================================
// WHY: mpsc::sync_channel(n) creates a channel with a buffer
// of size n. send() BLOCKS when the buffer is full, creating
// backpressure. This prevents fast producers from overwhelming
// slow consumers.

fn demonstrate_sync_channel() {
    println!("\n--- 4. Sync Channel (Bounded) ---");

    // Buffer size of 2 — can hold 2 messages before blocking
    let (tx, rx) = mpsc::sync_channel(2);

    thread::spawn(move || {
        for i in 1..=5 {
            println!("  [Producer] Sending dabba {}...", i);
            tx.send(format!("Dabba-{}", i)).unwrap();
            println!("  [Producer] Dabba {} sent!", i);
            // WHY: After sending 2, the next send() will BLOCK
            // until the consumer reads one
        }
    });

    // Slow consumer
    thread::sleep(Duration::from_millis(100)); // Let producer fill buffer
    for dabba in rx {
        println!("  [Consumer] Processing: {}", dabba);
        thread::sleep(Duration::from_millis(50)); // Slow processing
    }
    // Output shows producer blocks after filling the buffer:
    //   [Producer] Sending dabba 1...
    //   [Producer] Dabba 1 sent!
    //   [Producer] Sending dabba 2...
    //   [Producer] Dabba 2 sent!
    //   [Producer] Sending dabba 3...
    //   (blocks here until consumer reads)
    //   [Consumer] Processing: Dabba-1
    //   [Producer] Dabba 3 sent!
    //   ... etc

    // Zero-capacity sync channel — rendezvous channel
    println!("\n  Zero-capacity (rendezvous) channel:");
    let (tx, rx) = mpsc::sync_channel(0);

    thread::spawn(move || {
        for i in 1..=3 {
            println!("  [Sender] Waiting to hand off dabba {}...", i);
            tx.send(i).unwrap();
            // WHY: send() blocks until receiver calls recv()
            // Direct handoff — no buffer at all
            println!("  [Sender] Dabba {} handed off!", i);
        }
    });

    for _ in 0..3 {
        thread::sleep(Duration::from_millis(50));
        let msg = rx.recv().unwrap();
        println!("  [Receiver] Got dabba {}", msg);
    }
}

// ============================================================
// 5. NON-BLOCKING OPERATIONS
// ============================================================
// WHY: Sometimes you don't want to block waiting for a message.
// try_recv() returns immediately with Ok or Err.

fn demonstrate_non_blocking() {
    println!("\n--- 5. Non-Blocking Operations ---");

    let (tx, rx) = mpsc::channel();

    // Send a few messages
    tx.send("First dabba").unwrap();
    tx.send("Second dabba").unwrap();

    // try_recv — non-blocking
    match rx.try_recv() {
        Ok(msg) => println!("  Got: {}", msg),
        Err(mpsc::TryRecvError::Empty) => println!("  No message yet"),
        Err(mpsc::TryRecvError::Disconnected) => println!("  Channel closed"),
    }
    // Output: Got: First dabba

    match rx.try_recv() {
        Ok(msg) => println!("  Got: {}", msg),
        Err(_) => println!("  No message"),
    }
    // Output: Got: Second dabba

    match rx.try_recv() {
        Ok(msg) => println!("  Got: {}", msg),
        Err(mpsc::TryRecvError::Empty) => println!("  Channel empty"),
        Err(mpsc::TryRecvError::Disconnected) => println!("  Channel closed"),
    }
    // Output: Channel empty

    // recv_timeout — block for a limited time
    drop(tx); // Close the channel first

    let (tx2, rx2) = mpsc::channel::<String>();

    // Send after a delay
    thread::spawn(move || {
        thread::sleep(Duration::from_millis(100));
        let _ = tx2.send(String::from("Delayed dabba"));
    });

    // Try to receive with timeout
    match rx2.recv_timeout(Duration::from_millis(50)) {
        Ok(msg) => println!("  Got: {}", msg),
        Err(mpsc::RecvTimeoutError::Timeout) => println!("  Timed out after 50ms"),
        Err(mpsc::RecvTimeoutError::Disconnected) => println!("  Channel closed"),
    }
    // Output: Timed out after 50ms

    // Wait longer
    match rx2.recv_timeout(Duration::from_millis(200)) {
        Ok(msg) => println!("  Got: {}", msg),
        Err(_) => println!("  Still nothing"),
    }
    // Output: Got: Delayed dabba
}

// ============================================================
// 6. SENDING CUSTOM TYPES
// ============================================================
// WHY: Channels can send any type that implements Send.
// Most types in Rust are Send. This lets you pass complex
// data between threads safely.

#[derive(Debug)]
struct Dabba {
    id: u32,
    from: String,
    to: String,
    contents: String,
    weight_grams: u32,
}

impl Dabba {
    fn new(id: u32, from: &str, to: &str, contents: &str, weight: u32) -> Self {
        Dabba {
            id,
            from: String::from(from),
            to: String::from(to),
            contents: String::from(contents),
            weight_grams: weight,
        }
    }
}

impl std::fmt::Display for Dabba {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "Dabba#{} [{}->{}] {} ({}g)",
            self.id, self.from, self.to, self.contents, self.weight_grams
        )
    }
}

fn demonstrate_custom_types() {
    println!("\n--- 6. Sending Custom Types ---");

    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        let dabbas = vec![
            Dabba::new(1, "Andheri", "Nariman Point", "Dal Rice", 500),
            Dabba::new(2, "Borivali", "BKC", "Chole Chawal", 600),
            Dabba::new(3, "Thane", "Fort", "Sabzi Roti", 450),
        ];

        for dabba in dabbas {
            println!("  [Collect] Picked up: {}", dabba);
            tx.send(dabba).unwrap();
        }
    });

    let mut total_weight = 0;
    for dabba in rx {
        total_weight += dabba.weight_grams;
        println!("  [Deliver] {}", dabba);
    }
    println!("  Total weight carried: {}g", total_weight);
    // Output:
    //   [Collect] Picked up: Dabba#1 [Andheri->Nariman Point] Dal Rice (500g)
    //   [Collect] Picked up: Dabba#2 [Borivali->BKC] Chole Chawal (600g)
    //   [Collect] Picked up: Dabba#3 [Thane->Fort] Sabzi Roti (450g)
    //   [Deliver] Dabba#1 [Andheri->Nariman Point] Dal Rice (500g)
    //   [Deliver] Dabba#2 [Borivali->BKC] Chole Chawal (600g)
    //   [Deliver] Dabba#3 [Thane->Fort] Sabzi Roti (450g)
    //   Total weight carried: 1550g
}

// ============================================================
// 7. TASK PIPELINE — Multi-Stage Processing
// ============================================================
// WHY: Channels can be chained to create processing pipelines.
// Each stage runs in its own thread, connected by channels.
// Like the dabbawala relay: collect -> sort -> transport -> deliver.

fn demonstrate_pipeline() {
    println!("\n--- 7. Task Pipeline ---");

    // Stage 1: Collect (source) -> Stage 2: Sort -> Stage 3: Deliver

    // Channel between Stage 1 and Stage 2
    let (collect_tx, sort_rx) = mpsc::channel();
    // Channel between Stage 2 and Stage 3
    let (sort_tx, deliver_rx) = mpsc::channel();

    // Stage 1: Collection — generate dabbas
    thread::spawn(move || {
        let sources = vec![
            ("Andheri", "Rajma"),
            ("Bandra", "Biryani"),
            ("Colaba", "Pasta"),
            ("Dadar", "Thali"),
            ("Elphinstone", "Sandwich"),
        ];

        for (i, (area, food)) in sources.iter().enumerate() {
            let dabba = format!("D{:03}|{}|{}", i + 1, area, food);
            println!("  [Stage 1: Collect] {}", dabba);
            collect_tx.send(dabba).unwrap();
            thread::sleep(Duration::from_millis(10));
        }
    });

    // Stage 2: Sorting — add routing code
    thread::spawn(move || {
        for dabba in sort_rx {
            let sorted = format!("{} -> SORTED", dabba);
            println!("  [Stage 2: Sort  ] {}", sorted);
            sort_tx.send(sorted).unwrap();
        }
    });

    // Stage 3: Delivery — final processing
    let mut delivered = 0;
    for dabba in deliver_rx {
        delivered += 1;
        println!("  [Stage 3: Deliver] {} -> DONE", dabba);
    }

    println!("  Pipeline complete! {} dabbas delivered", delivered);
    // Output:
    //   [Stage 1: Collect] D001|Andheri|Rajma
    //   [Stage 2: Sort  ] D001|Andheri|Rajma -> SORTED
    //   [Stage 3: Deliver] D001|Andheri|Rajma -> SORTED -> DONE
    //   ... (5 dabbas total)
    //   Pipeline complete! 5 dabbas delivered
}

// ============================================================
// 8. FAN-OUT PATTERN — One Producer, Multiple Workers
// ============================================================
// WHY: Distribute work from a single source to multiple
// worker threads. Each worker gets different tasks.
// Useful for parallelizing CPU-intensive work.

fn demonstrate_fan_out() {
    println!("\n--- 8. Fan-Out Pattern ---");

    let num_workers = 3;

    // One channel per worker
    let mut worker_txs: Vec<mpsc::Sender<String>> = Vec::new();
    let mut handles = Vec::new();

    // Result collection channel
    let (result_tx, result_rx) = mpsc::channel();

    // Create workers
    for worker_id in 0..num_workers {
        let (tx, rx) = mpsc::channel::<String>();
        worker_txs.push(tx);

        let result_tx = result_tx.clone();
        let handle = thread::spawn(move || {
            for task in rx {
                let result = format!(
                    "Worker-{} processed '{}'",
                    worker_id + 1,
                    task.to_uppercase()
                );
                thread::sleep(Duration::from_millis(20));
                result_tx.send(result).unwrap();
            }
        });
        handles.push(handle);
    }

    // Distribute tasks round-robin
    let tasks = vec![
        "wash rice", "chop onions", "heat oil", "fry spices",
        "boil water", "add salt", "stir pot", "serve food", "clean up",
    ];

    for (i, task) in tasks.iter().enumerate() {
        let worker_idx = i % num_workers;
        worker_txs[worker_idx]
            .send(String::from(*task))
            .unwrap();
    }

    // Drop all senders to close worker channels
    drop(worker_txs);
    drop(result_tx); // Drop the original result sender too

    // Collect results
    let mut results: Vec<String> = result_rx.into_iter().collect();
    results.sort(); // Sort for consistent display

    // Wait for workers to finish
    for handle in handles {
        handle.join().unwrap();
    }

    println!("  Results ({} total):", results.len());
    for result in &results {
        println!("    {}", result);
    }
}

// ============================================================
// 9. FAN-IN PATTERN — Multiple Producers, One Consumer
// ============================================================
// WHY: This is the natural MPSC pattern. Multiple sources
// feed into a single processing point.

fn demonstrate_fan_in() {
    println!("\n--- 9. Fan-In Pattern ---");

    let (tx, rx) = mpsc::channel();

    // Multiple producer threads — different collection points
    let zones = vec![
        ("Andheri", vec!["Thali", "Dosa", "Biryani"]),
        ("Bandra", vec!["Pasta", "Salad"]),
        ("Dadar", vec!["Vada Pav", "Misal", "Poha", "Sabudana"]),
    ];

    let mut handles = vec![];

    for (zone, items) in zones {
        let tx = tx.clone();
        let handle = thread::spawn(move || {
            for item in items {
                let msg = format!("[{}] {}", zone, item);
                tx.send(msg).unwrap();
                thread::sleep(Duration::from_millis(15));
            }
        });
        handles.push(handle);
    }

    // Drop the original sender
    drop(tx);

    // Single consumer receives from all producers
    let mut count = 0;
    for msg in rx {
        count += 1;
        println!("  Central hub #{}: {}", count, msg);
    }
    println!("  Total items received: {}", count);

    for handle in handles {
        handle.join().unwrap();
    }
    // Output (order varies):
    //   Central hub #1: [Andheri] Thali
    //   Central hub #2: [Bandra] Pasta
    //   Central hub #3: [Dadar] Vada Pav
    //   ... etc
    //   Total items received: 9
}

// ============================================================
// 10. REQUEST-RESPONSE PATTERN
// ============================================================
// WHY: Sometimes a thread needs to send a request and get
// a response back. Use a oneshot channel (a channel used once)
// embedded in the request.

fn demonstrate_request_response() {
    println!("\n--- 10. Request-Response Pattern ---");

    // Define request types with embedded response channels
    enum Request {
        GetPrice {
            item: String,
            respond_to: mpsc::Sender<Option<f64>>,
        },
        AddItem {
            item: String,
            price: f64,
            respond_to: mpsc::Sender<bool>,
        },
    }

    let (tx, rx) = mpsc::channel::<Request>();

    // Server thread — manages a price database
    let server = thread::spawn(move || {
        let mut prices: std::collections::HashMap<String, f64> =
            std::collections::HashMap::new();

        // Pre-populate
        prices.insert(String::from("Dosa"), 80.0);
        prices.insert(String::from("Idli"), 40.0);
        prices.insert(String::from("Biryani"), 200.0);

        for request in rx {
            match request {
                Request::GetPrice { item, respond_to } => {
                    let price = prices.get(&item).copied();
                    let _ = respond_to.send(price);
                }
                Request::AddItem {
                    item,
                    price,
                    respond_to,
                } => {
                    prices.insert(item, price);
                    let _ = respond_to.send(true);
                }
            }
        }
    });

    // Client 1: Query prices
    let (resp_tx, resp_rx) = mpsc::channel();
    tx.send(Request::GetPrice {
        item: String::from("Dosa"),
        respond_to: resp_tx,
    })
    .unwrap();

    let price = resp_rx.recv().unwrap();
    println!("  Dosa price: {:?}", price);
    // Output: Dosa price: Some(80.0)

    // Client 2: Add new item
    let (resp_tx, resp_rx) = mpsc::channel();
    tx.send(Request::AddItem {
        item: String::from("Paneer Tikka"),
        price: 180.0,
        respond_to: resp_tx,
    })
    .unwrap();

    let success = resp_rx.recv().unwrap();
    println!("  Added Paneer Tikka: {}", success);
    // Output: Added Paneer Tikka: true

    // Client 3: Query the newly added item
    let (resp_tx, resp_rx) = mpsc::channel();
    tx.send(Request::GetPrice {
        item: String::from("Paneer Tikka"),
        respond_to: resp_tx,
    })
    .unwrap();

    let price = resp_rx.recv().unwrap();
    println!("  Paneer Tikka price: {:?}", price);
    // Output: Paneer Tikka price: Some(180.0)

    // Query non-existent item
    let (resp_tx, resp_rx) = mpsc::channel();
    tx.send(Request::GetPrice {
        item: String::from("Pizza"),
        respond_to: resp_tx,
    })
    .unwrap();

    let price = resp_rx.recv().unwrap();
    println!("  Pizza price: {:?}", price);
    // Output: Pizza price: None

    drop(tx); // Close the request channel
    server.join().unwrap();
}

// ============================================================
// 11. SELECT-LIKE PATTERN — Monitoring Multiple Channels
// ============================================================
// WHY: Rust's std doesn't have a select! macro, but you can
// achieve similar behavior with try_recv() in a loop, or
// by merging channels.

fn demonstrate_select_pattern() {
    println!("\n--- 11. Select-Like Pattern ---");

    // Merge multiple channels into one
    let (merged_tx, merged_rx) = mpsc::channel::<String>();

    // Source 1: Priority orders
    let tx1 = merged_tx.clone();
    thread::spawn(move || {
        for i in 1..=3 {
            thread::sleep(Duration::from_millis(40));
            tx1.send(format!("[PRIORITY] Order P{}", i)).unwrap();
        }
    });

    // Source 2: Regular orders
    let tx2 = merged_tx.clone();
    thread::spawn(move || {
        for i in 1..=5 {
            thread::sleep(Duration::from_millis(25));
            tx2.send(format!("[REGULAR] Order R{}", i)).unwrap();
        }
    });

    // Source 3: Express orders
    let tx3 = merged_tx;
    thread::spawn(move || {
        for i in 1..=2 {
            thread::sleep(Duration::from_millis(60));
            tx3.send(format!("[EXPRESS] Order E{}", i)).unwrap();
        }
    });

    // Single receiver handles all
    let mut count = 0;
    for msg in merged_rx {
        count += 1;
        println!("  Kitchen #{}: {}", count, msg);
    }
    println!("  Total orders processed: {}", count);
    // Output (timing-dependent):
    //   Kitchen #1: [REGULAR] Order R1
    //   Kitchen #2: [PRIORITY] Order P1
    //   Kitchen #3: [REGULAR] Order R2
    //   ... etc
    //   Total orders processed: 10

    // Alternative: try_recv polling (for non-blocking multi-channel)
    println!("\n  try_recv polling example:");

    let (urgent_tx, urgent_rx) = mpsc::channel();
    let (normal_tx, normal_rx) = mpsc::channel();

    urgent_tx.send("URGENT: Fire in kitchen!").unwrap();
    normal_tx.send("Normal: Table 3 order ready").unwrap();
    normal_tx.send("Normal: Table 7 order ready").unwrap();

    drop(urgent_tx);
    drop(normal_tx);

    // Poll both channels, prioritizing urgent
    loop {
        // Check urgent first
        match urgent_rx.try_recv() {
            Ok(msg) => {
                println!("    [!] {}", msg);
                continue;
            }
            Err(mpsc::TryRecvError::Empty) => {}
            Err(mpsc::TryRecvError::Disconnected) => {}
        }

        // Then check normal
        match normal_rx.try_recv() {
            Ok(msg) => {
                println!("    [ ] {}", msg);
                continue;
            }
            Err(mpsc::TryRecvError::Empty) => {}
            Err(mpsc::TryRecvError::Disconnected) => break,
        }
    }
    // Output:
    //   [!] URGENT: Fire in kitchen!
    //   [ ] Normal: Table 3 order ready
    //   [ ] Normal: Table 7 order ready
}

// ============================================================
// 12. PRACTICAL EXAMPLE — Concurrent Log Aggregator
// ============================================================

fn demonstrate_log_aggregator() {
    println!("\n--- 12. Practical: Log Aggregator ---");

    #[derive(Debug)]
    enum LogLevel {
        Info,
        Warning,
        Error,
    }

    struct LogEntry {
        source: String,
        level: LogLevel,
        message: String,
    }

    impl std::fmt::Display for LogEntry {
        fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
            let level_str = match self.level {
                LogLevel::Info => "INFO",
                LogLevel::Warning => "WARN",
                LogLevel::Error => "ERROR",
            };
            write!(f, "[{}] {}: {}", level_str, self.source, self.message)
        }
    }

    let (tx, rx) = mpsc::channel::<LogEntry>();

    // Stats collector
    let stats = Arc::new(Mutex::new((0u32, 0u32, 0u32))); // info, warn, error

    // Web server logger
    let tx1 = tx.clone();
    thread::spawn(move || {
        let logs = vec![
            (LogLevel::Info, "Request received: GET /menu"),
            (LogLevel::Info, "Response sent: 200 OK"),
            (LogLevel::Warning, "Slow query: 2.5s"),
        ];
        for (level, msg) in logs {
            tx1.send(LogEntry {
                source: String::from("WebServer"),
                level,
                message: String::from(msg),
            })
            .unwrap();
        }
    });

    // Database logger
    let tx2 = tx.clone();
    thread::spawn(move || {
        let logs = vec![
            (LogLevel::Info, "Connection pool: 5/10 active"),
            (LogLevel::Error, "Query failed: table not found"),
        ];
        for (level, msg) in logs {
            tx2.send(LogEntry {
                source: String::from("Database"),
                level,
                message: String::from(msg),
            })
            .unwrap();
        }
    });

    // Payment logger
    let tx3 = tx;
    thread::spawn(move || {
        let logs = vec![
            (LogLevel::Info, "Payment initiated: Rs.500"),
            (LogLevel::Error, "Gateway timeout"),
            (LogLevel::Warning, "Retry attempt 2/3"),
        ];
        for (level, msg) in logs {
            tx3.send(LogEntry {
                source: String::from("Payment"),
                level,
                message: String::from(msg),
            })
            .unwrap();
        }
    });

    // Aggregator — receives and processes all logs
    let stats_clone = Arc::clone(&stats);
    for entry in rx {
        println!("  {}", entry);
        let mut s = stats_clone.lock().unwrap();
        match entry.level {
            LogLevel::Info => s.0 += 1,
            LogLevel::Warning => s.1 += 1,
            LogLevel::Error => s.2 += 1,
        }
    }

    let final_stats = stats.lock().unwrap();
    println!(
        "\n  Log Summary: {} info, {} warnings, {} errors",
        final_stats.0, final_stats.1, final_stats.2
    );
    // Output (order varies):
    //   [INFO] WebServer: Request received: GET /menu
    //   [INFO] Database: Connection pool: 5/10 active
    //   [INFO] Payment: Payment initiated: Rs.500
    //   [INFO] WebServer: Response sent: 200 OK
    //   [WARN] WebServer: Slow query: 2.5s
    //   [ERROR] Database: Query failed: table not found
    //   [ERROR] Payment: Gateway timeout
    //   [WARN] Payment: Retry attempt 2/3
    //
    //   Log Summary: 4 info, 2 warnings, 2 errors
}

// ============================================================
// MAIN — Putting It All Together
// ============================================================
fn main() {
    println!("=== RUST CHANNELS: Dabbawala Relay Network ===\n");

    demonstrate_basic_channel();
    demonstrate_multiple_messages();
    demonstrate_multiple_producers();
    demonstrate_sync_channel();
    demonstrate_non_blocking();
    demonstrate_custom_types();
    demonstrate_pipeline();
    demonstrate_fan_out();
    demonstrate_fan_in();
    demonstrate_request_response();
    demonstrate_select_pattern();
    demonstrate_log_aggregator();

    // ============================================================
    // KEY TAKEAWAYS
    // ============================================================
    println!("\n=== KEY TAKEAWAYS ===");
    println!("1. mpsc::channel() creates unbounded sender/receiver pair");
    println!("2. send() transfers ownership — data moves into channel");
    println!("3. recv() blocks, try_recv() returns immediately");
    println!("4. tx.clone() creates multiple producers (MPSC pattern)");
    println!("5. Channel closes when ALL senders are dropped");
    println!("6. sync_channel(n) creates bounded channel with backpressure");
    println!("7. sync_channel(0) = rendezvous (direct handoff)");
    println!("8. Receiver implements Iterator — use in for loops");
    println!("9. Embed response channels in requests for request-response");
    println!("10. Channels > shared memory for most concurrent patterns");
}
