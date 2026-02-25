//! LohaServer — A multi-threaded HTTP server built from scratch with std.
//!
//! "Loha" means *iron* in Hindi. This server is built with the
//! iron-strong safety guarantees of Rust, using nothing beyond the
//! standard library.
//!
//! Analogy: Think of the IRCTC reservation system during Tatkal hours.
//! Multiple booking counters (worker threads) serve passengers
//! (requests) concurrently through a shared token queue (mpsc channel).

mod handler;
mod request;
mod response;
mod router;
mod server;
mod static_files;
mod thread_pool;

use server::Server;

fn main() {
    print_banner();

    let addr = "127.0.0.1:7878";
    let pool_size = 4; // number of worker threads (booking counters)

    println!("[main] Starting LohaServer at http://{}", addr);
    println!("[main] Thread pool size: {}", pool_size);
    println!("[main] Press Ctrl+C to stop the server.\n");

    let server = Server::new(addr, pool_size);

    // Register a Ctrl+C handler so the user sees a clean message.
    // (The actual cleanup happens via ThreadPool's Drop impl.)
    let _ = ctrlc_setup();

    server.run();
}

/// Print a startup banner.
fn print_banner() {
    println!();
    println!("  ╔══════════════════════════════════════╗");
    println!("  ║       LohaServer  v0.1               ║");
    println!("  ║  Multi-Threaded HTTP Server in Rust  ║");
    println!("  ║       std only — no frameworks       ║");
    println!("  ╚══════════════════════════════════════╝");
    println!();
}

/// Best-effort Ctrl+C handler using only std.
///
/// Rust's std doesn't provide a signal-handler API directly, so
/// this is a no-op placeholder. The OS will still terminate the
/// process on Ctrl+C, and ThreadPool::drop will run during stack
/// unwinding in most cases.
fn ctrlc_setup() -> Result<(), ()> {
    // In a real project you might use the `ctrlc` crate.
    // Here we just rely on the default SIGINT behaviour.
    Ok(())
}
