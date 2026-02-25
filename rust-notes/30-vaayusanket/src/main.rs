// =============================================================================
// VaayuSanket -- Real-Time System Monitor CLI
// =============================================================================
//
//   "Vaayu" (wind/air/breath) + "Sanket" (signal)
//   = The Signal of the System's Breath
//
// Analogy: ISRO Mission Control Centre
//
// Just as ISRO's Mission Control in Bengaluru monitors every heartbeat of a
// spacecraft -- from engine thrust to solar panel voltage -- VaayuSanket
// watches over your computer's vital signs in real time.
//
// This is the main entry point: it sets up the async runtime (tokio), parses
// configuration, and orchestrates the monitoring loop.
//
// Key Rust concepts in this file:
// - #[tokio::main] attribute macro for async main
// - tokio::select! for concurrent event handling
// - Module declarations (mod keyword)
// - Error propagation with ? operator
// =============================================================================

// Module declarations -- these tell Rust where to find our code.
// Each `mod` corresponds to either a file (e.g., config.rs) or a directory
// with a mod.rs (e.g., monitor/mod.rs).
mod config;
mod monitor;
mod display;
mod alert;
mod export;

use config::Config;
use monitor::collect_snapshot;
use display::display_dashboard;
use alert::{check_alerts, display_alerts};
use export::export_snapshot;

use std::time::Duration;
use sysinfo::System;

/// Print the startup banner -- every good CLI deserves a splash screen!
///
/// This ISRO-themed ASCII art sets the tone for the application.
/// The banner is printed once at startup before the monitoring loop begins.
fn print_banner() {
    println!(r#"
    ___    ____   ____  __  __ _____             _        _
   |__ \  / __ \ / __ \|  \/  / ____|           | |      | |
   | _) || |  | | |  | | \  / | (___   __ _ _ __| | _____| |_
   |__ < | |  | | |  | | |\/| |\___ \ / _` | '__| |/ / _ \ __|
   | __) || |__| | |__| | |  | |____) | (_| | |  |   <  __/ |_
   |____/ \____/ \____/|_|  |_|_____/ \__,_|_|  |_|\_\___|\__|

   ╔═══════════════════════════════════════════════════════════╗
   ║        VaayuSanket -- System Monitor CLI                  ║
   ║    "Signal of the System's Breath"                        ║
   ║                                                           ║
   ║    Like ISRO Mission Control, but for your machine.       ║
   ║    Monitoring telemetry... all systems nominal.            ║
   ╚═══════════════════════════════════════════════════════════╝
"#);
}

// =============================================================================
// Main Entry Point
// =============================================================================

/// The async main function, powered by the Tokio runtime.
///
/// #[tokio::main] is an attribute macro that transforms this async fn main()
/// into a regular fn main() that creates a Tokio runtime and blocks on the
/// async code. It's the launchpad for our async mission.
///
/// The flow:
/// 1. Parse CLI arguments into Config
/// 2. Initialize the sysinfo::System object
/// 3. Enter the monitoring loop (runs until Ctrl+C)
/// 4. Each tick: collect -> alert -> display -> (optionally) export
#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Step 1: Parse CLI configuration
    // Config::from_args() returns Option<Config>:
    // - Some(config) = normal operation
    // - None = --help was shown, exit gracefully
    let config = match Config::from_args()? {
        Some(c) => c,
        None => return Ok(()), // Help was displayed, mission complete
    };

    // Step 2: Show the startup banner
    print_banner();
    println!("  Starting monitoring (interval: {}s, top: {} processes)",
        config.interval_secs, config.top_n_processes);
    if let Some(ref path) = config.export_path {
        println!("  Export path: {}", path);
    }
    println!("  Press Ctrl+C to stop.\n");

    // Brief pause so the user can read the banner before the dashboard takes over
    tokio::time::sleep(Duration::from_secs(2)).await;

    // Step 3: Initialize the sysinfo System object.
    //
    // We create it once and reuse it across ticks. sysinfo recommends this
    // pattern because:
    // - It caches internal state for computing deltas (e.g., CPU usage)
    // - It avoids repeated allocation overhead
    // - CPU usage needs at least two refreshes to produce meaningful values
    let mut sys = System::new_all();

    // Do an initial refresh to prime the CPU usage calculation.
    // The first refresh establishes the baseline; meaningful CPU percentages
    // appear from the second refresh onwards.
    sys.refresh_all();
    tokio::time::sleep(Duration::from_millis(500)).await;

    // Step 4: Create the monitoring interval timer.
    // tokio::time::interval produces a stream of ticks at the specified interval.
    // Unlike sleep-in-a-loop, interval accounts for the time spent processing,
    // keeping the sampling rate consistent.
    let mut interval = tokio::time::interval(
        Duration::from_secs(config.interval_secs)
    );

    // Step 5: The main monitoring loop.
    //
    // tokio::select! waits for EITHER:
    // - The interval to tick (time to collect and display metrics)
    // - A Ctrl+C signal (time to shut down gracefully)
    //
    // This is like a flight controller monitoring both telemetry updates
    // and abort commands simultaneously.
    loop {
        tokio::select! {
            // Branch 1: Interval tick -- time to collect metrics
            _ = interval.tick() => {
                // Collect a full system snapshot
                let snapshot = collect_snapshot(&mut sys, config.top_n_processes);

                // Check for threshold violations
                let alerts = check_alerts(&snapshot, &config);

                // Render the dashboard to the terminal
                display_dashboard(&snapshot, config.no_color);

                // Display any alerts below the dashboard
                display_alerts(&alerts, config.no_color);

                // Optionally export the snapshot to JSON
                if let Some(ref path) = config.export_path {
                    match export_snapshot(&snapshot, Some(path)) {
                        Ok(written_path) => {
                            // Show a subtle indicator that export succeeded
                            if !config.no_color {
                                print!("\x1b[2m"); // Dim text
                            }
                            println!("  [Exported to {}]", written_path);
                            if !config.no_color {
                                print!("\x1b[0m"); // Reset
                            }
                        }
                        Err(e) => {
                            // Don't crash on export failure -- log it and continue.
                            // The monitoring mission is more important than logging.
                            eprintln!("  [Export error: {}]", e);
                        }
                    }
                }
            }

            // Branch 2: Ctrl+C signal -- graceful shutdown
            // tokio::signal::ctrl_c() returns a Future that completes when
            // the user presses Ctrl+C. This is our "abort mission" command.
            _ = tokio::signal::ctrl_c() => {
                println!("\n");
                println!("  ============================================");
                println!("  VaayuSanket shutting down...");
                println!("  Mission complete. All systems nominal.");
                println!("  ============================================");
                break; // Exit the loop, which exits main()
            }
        }
    }

    Ok(())
}
