// ============================================================
// 24. CLI BASICS IN RUST
// ============================================================
// WHY THIS MATTERS:
// Command-line tools are one of Rust's sweet spots. Rust produces
// fast, small, self-contained binaries with no runtime dependency.
// Many beloved developer tools are written in Rust: ripgrep, fd,
// bat, exa, tokei, and more. Understanding how to build CLI tools
// in Rust opens the door to writing powerful utilities that feel
// instant compared to Python or Node.js scripts.
// ============================================================

// ============================================================
// STORY: THE RAILWAY ENQUIRY COUNTER
// ============================================================
// Picture yourself at New Delhi Railway Station's enquiry counter.
//
// A traveller walks up and asks: "What time does the Rajdhani
// Express to Mumbai leave?"
//
// The CLERK (your Rust program) processes the request:
// 1. READS the question (reads COMMAND LINE ARGS or STDIN)
// 2. LOOKS UP the answer (processes the data)
// 3. RESPONDS clearly (writes to STDOUT)
// 4. If the question makes no sense, says "Invalid query"
//    (writes to STDERR and exits with error code)
//
// Some travellers have simple questions (one-shot CLI commands).
// Others have a conversation — asking multiple questions one after
// another (REPL pattern — Read-Eval-Print Loop).
//
// The counter also has a BOARD showing train status (environment
// variables) that the clerk can reference.
//
// Let's build each of these patterns in Rust!
// ============================================================

use std::collections::HashMap;
use std::io::{self, BufRead, Write};

// ============================================================
// 1. READING COMMAND LINE ARGUMENTS
// ============================================================
// WHY: Command line args are the primary way users interact
// with CLI tools. `./myapp --verbose input.txt` passes
// ["./myapp", "--verbose", "input.txt"] as arguments.

fn demo_basic_args() {
    println!("--- 1. Command Line Arguments ---\n");

    // std::env::args() returns an iterator of String
    // The first argument is always the program name
    let args: Vec<String> = std::env::args().collect();

    println!("Program name: {}", args[0]);
    println!("Total arguments: {}", args.len());

    // WHY: args() gives owned Strings. There's also args_os()
    // which gives OsString for handling non-UTF-8 filenames.

    if args.len() > 1 {
        println!("Arguments provided:");
        for (i, arg) in args.iter().enumerate().skip(1) {
            println!("  [{}]: {}", i, arg);
        }
    } else {
        println!("No additional arguments provided.");
        println!("Try running with: cargo run -- hello world");
    }
}

// ============================================================
// 2. PARSING ARGUMENTS MANUALLY
// ============================================================
// WHY: For simple tools, manual parsing is fine. For complex CLIs,
// you'd use the `clap` crate, but understanding manual parsing
// helps you appreciate what clap does for you.

fn demo_manual_parsing() {
    println!("\n--- 2. Manual Argument Parsing ---\n");

    let args: Vec<String> = std::env::args().collect();

    // Simulating what a train enquiry CLI might look like:
    // railway_enquiry --train "Rajdhani" --from "Delhi" --to "Mumbai"

    let mut train = String::from("Unknown");
    let mut from = String::from("Unknown");
    let mut to = String::from("Unknown");
    let mut verbose = false;

    // WHY: Manual parsing iterates through args and matches flags.
    // This is the low-level approach. For real projects, use `clap`.
    let mut i = 1; // Skip program name
    while i < args.len() {
        match args[i].as_str() {
            "--train" | "-t" => {
                if i + 1 < args.len() {
                    train = args[i + 1].clone();
                    i += 2;
                } else {
                    eprintln!("Error: --train requires a value");
                    i += 1;
                }
            }
            "--from" | "-f" => {
                if i + 1 < args.len() {
                    from = args[i + 1].clone();
                    i += 2;
                } else {
                    eprintln!("Error: --from requires a value");
                    i += 1;
                }
            }
            "--to" => {
                if i + 1 < args.len() {
                    to = args[i + 1].clone();
                    i += 2;
                } else {
                    eprintln!("Error: --to requires a value");
                    i += 1;
                }
            }
            "--verbose" | "-v" => {
                verbose = true;
                i += 1;
            }
            "--help" | "-h" => {
                println!("Railway Enquiry System");
                println!("Usage: railway_enquiry [OPTIONS]");
                println!("");
                println!("Options:");
                println!("  -t, --train <NAME>   Train name");
                println!("  -f, --from <CITY>    Departure city");
                println!("      --to <CITY>      Destination city");
                println!("  -v, --verbose        Show detailed info");
                println!("  -h, --help           Show this help");
                return;
            }
            other => {
                eprintln!("Warning: Unknown argument '{}'", other);
                i += 1;
            }
        }
    }

    println!("Query: {} from {} to {}", train, from, to);
    if verbose {
        println!("Verbose mode: ON");
        println!("Looking up schedule in database...");
    }

    // Simulate a lookup
    if train != "Unknown" {
        println!("Train '{}' departs at 16:55 from {} to {}", train, from, to);
    }
}

// ============================================================
// 3. READING FROM STDIN (Standard Input)
// ============================================================
// WHY: STDIN lets your program read user input interactively
// or accept piped data (e.g., cat file.txt | my_program).
// This is essential for interactive CLI tools.

fn demo_stdin_reading() {
    println!("\n--- 3. Reading from STDIN ---\n");

    // METHOD 1: Simple single-line read
    println!("Enter your name (railway passenger name):");

    let mut name = String::new();
    // WHY: read_line returns io::Result<usize> — the number of bytes read.
    // It appends to the string INCLUDING the newline character.
    match io::stdin().read_line(&mut name) {
        Ok(bytes) => {
            let name = name.trim(); // Remove trailing newline
            println!("Hello, {}! ({} bytes read)", name, bytes);
        }
        Err(e) => {
            eprintln!("Error reading input: {}", e);
        }
    }

    // METHOD 2: Reading multiple lines with BufRead
    // WHY: BufRead provides the lines() iterator which is perfect
    // for reading line-by-line. It handles the newline stripping for you.
    println!("\nEnter train stations (one per line, empty line to stop):");

    let stdin = io::stdin();
    let mut stations: Vec<String> = Vec::new();

    // lock() gives us a BufRead handle — more efficient than
    // calling read_line() repeatedly
    for line in stdin.lock().lines() {
        match line {
            Ok(station) => {
                if station.is_empty() {
                    break;
                }
                stations.push(station);
            }
            Err(e) => {
                eprintln!("Error: {}", e);
                break;
            }
        }
    }

    println!("\nStations entered ({}):", stations.len());
    for (i, station) in stations.iter().enumerate() {
        println!("  {}. {}", i + 1, station);
    }
}

// ============================================================
// 4. WRITING TO STDOUT AND STDERR
// ============================================================
// WHY: STDOUT is for normal output, STDERR is for errors and
// diagnostics. Keeping them separate lets users redirect output:
//   ./myapp > output.txt 2> errors.txt

fn demo_stdout_stderr() {
    println!("\n--- 4. STDOUT and STDERR ---\n");

    // Normal output goes to STDOUT
    println!("This is normal output (STDOUT)");
    // Output: This is normal output (STDOUT)

    // Error output goes to STDERR
    eprintln!("This is error output (STDERR)");
    // Output: This is error output (STDERR)

    // WHY: When performance matters, use write! with a locked handle
    // to avoid locking/unlocking stdout for each print.
    let stdout = io::stdout();
    let mut handle = stdout.lock();

    // WHY: Locking stdout once is MUCH faster than calling println!
    // in a loop. println! locks and unlocks for every call.
    writeln!(handle, "Fast output line 1 (locked handle)").unwrap();
    writeln!(handle, "Fast output line 2 (locked handle)").unwrap();
    writeln!(handle, "Fast output line 3 (locked handle)").unwrap();
    // Output: Fast output line 1 (locked handle)
    // Output: Fast output line 2 (locked handle)
    // Output: Fast output line 3 (locked handle)

    // Flushing ensures all buffered output is actually written
    handle.flush().unwrap();

    // WHY: write! and writeln! return Result, so you can handle
    // write failures (e.g., broken pipe when piped to `head`).
    // println! panics on write failure, which is usually fine.

    // Formatted output
    let train = "Rajdhani Express";
    let platform = 3;
    let time = "16:55";

    // Using format strings
    println!("\n{:=<40}", "");
    println!("  TRAIN DEPARTURE BOARD");
    println!("{:=<40}", "");
    println!("  {:20} Platform {}", train, platform);
    println!("  Departure: {:>20}", time);
    println!("{:=<40}", "");
    // Output:
    // ========================================
    //   TRAIN DEPARTURE BOARD
    // ========================================
    //   Rajdhani Express     Platform 3
    //   Departure:                16:55
    // ========================================
}

// ============================================================
// 5. BUILDING A SIMPLE REPL (Read-Eval-Print Loop)
// ============================================================
// WHY: REPLs are interactive programs that continuously read input,
// process it, and print results. Databases (psql, mongo shell),
// language interpreters (python, node), and many tools use this pattern.

fn demo_repl() {
    println!("\n--- 5. Railway Enquiry REPL ---\n");

    // Build a train schedule database
    let mut schedule: HashMap<String, (String, String, String)> = HashMap::new();
    schedule.insert(
        "rajdhani".to_string(),
        ("New Delhi".to_string(), "Mumbai Central".to_string(), "16:55".to_string()),
    );
    schedule.insert(
        "shatabdi".to_string(),
        ("New Delhi".to_string(), "Bhopal".to_string(), "06:15".to_string()),
    );
    schedule.insert(
        "duronto".to_string(),
        ("Howrah".to_string(), "Mumbai CST".to_string(), "20:20".to_string()),
    );
    schedule.insert(
        "vande bharat".to_string(),
        ("New Delhi".to_string(), "Varanasi".to_string(), "06:00".to_string()),
    );
    schedule.insert(
        "garib rath".to_string(),
        ("Delhi".to_string(), "Lucknow".to_string(), "22:40".to_string()),
    );

    println!("Welcome to Railway Enquiry System!");
    println!("Commands: search <train>, list, help, quit\n");

    let stdin = io::stdin();
    let stdout = io::stdout();
    let mut stdout_handle = stdout.lock();

    // WHY: The REPL loop pattern: prompt -> read -> parse -> execute -> repeat
    loop {
        // Print prompt without newline
        write!(stdout_handle, "enquiry> ").unwrap();
        stdout_handle.flush().unwrap(); // Ensure prompt is displayed

        let mut input = String::new();
        match stdin.lock().read_line(&mut input) {
            Ok(0) => {
                // WHY: 0 bytes read means EOF (Ctrl+D on Unix, Ctrl+Z on Windows)
                println!("\nGoodbye! (EOF received)");
                break;
            }
            Ok(_) => {
                let input = input.trim().to_lowercase();

                // WHY: Parse commands and dispatch. This is the "Eval" part.
                let parts: Vec<&str> = input.splitn(2, ' ').collect();

                match parts[0] {
                    "quit" | "exit" | "q" => {
                        println!("Thank you for using Railway Enquiry. Goodbye!");
                        break;
                    }
                    "help" | "h" => {
                        println!("Available commands:");
                        println!("  search <train>  - Search train schedule");
                        println!("  list            - List all trains");
                        println!("  help            - Show this help");
                        println!("  quit            - Exit the system");
                    }
                    "list" | "ls" => {
                        println!("{:<20} {:<15} {:<15} {}", "Train", "From", "To", "Time");
                        println!("{}", "-".repeat(60));
                        for (name, (from, to, time)) in &schedule {
                            println!("{:<20} {:<15} {:<15} {}", name, from, to, time);
                        }
                    }
                    "search" | "s" => {
                        if parts.len() < 2 {
                            println!("Usage: search <train name>");
                            continue;
                        }
                        let query = parts[1];
                        let mut found = false;
                        for (name, (from, to, time)) in &schedule {
                            if name.contains(query) {
                                println!("Found: {} | {} -> {} | Departure: {}", name, from, to, time);
                                found = true;
                            }
                        }
                        if !found {
                            println!("No trains matching '{}' found.", query);
                        }
                    }
                    "" => {
                        // Empty input, just show prompt again
                        continue;
                    }
                    unknown => {
                        // WHY: Helpful error messages improve user experience
                        eprintln!("Unknown command: '{}'. Type 'help' for available commands.", unknown);
                    }
                }
            }
            Err(e) => {
                eprintln!("Error reading input: {}", e);
                break;
            }
        }
    }
}

// ============================================================
// 6. PROCESS EXIT CODES
// ============================================================
// WHY: Exit codes communicate success/failure to the shell.
// 0 = success, non-zero = error. Scripts and CI/CD systems
// rely on exit codes to determine if a command succeeded.

fn demo_exit_codes() {
    println!("\n--- 6. Process Exit Codes ---\n");

    // std::process::exit(code) terminates the program immediately
    // with the given exit code. Use it for fatal errors.

    // WHY: Unlike return from main, process::exit() bypasses all
    // destructors (Drop). Use it sparingly — usually returning from
    // main with a Result is preferred.

    let args: Vec<String> = std::env::args().collect();

    // Simulate checking for a required config
    let config_present = args.len() > 1; // Simplified check

    if !config_present {
        // In a real CLI, you might exit here:
        // eprintln!("Error: No config file specified");
        // std::process::exit(1);  // Exit code 1 = general error
        println!("(Simulated) No config file — would exit with code 1");
    }

    // Common exit codes:
    println!("Common exit codes:");
    println!("  0 — Success");
    println!("  1 — General error");
    println!("  2 — Misuse of shell command / invalid arguments");
    println!("  126 — Command found but not executable");
    println!("  127 — Command not found");
    println!("  130 — Script terminated by Ctrl+C (128 + 2)");

    // WHY: The idiomatic Rust way is to return Result from main:
    //
    // fn main() -> Result<(), Box<dyn std::error::Error>> {
    //     let config = load_config()?;  // Returns error if failed
    //     run_app(config)?;
    //     Ok(())  // Exit code 0
    // }
    //
    // If main returns Err, Rust prints the error and exits with code 1.
}

// ============================================================
// 7. ENVIRONMENT VARIABLES
// ============================================================
// WHY: Environment variables configure applications without
// changing code. Database URLs, API keys, feature flags —
// all commonly set via environment variables. It's like the
// railway station's notice board that the clerk can reference.

fn demo_env_vars() {
    println!("\n--- 7. Environment Variables ---\n");

    // Reading a single environment variable
    // WHY: env::var returns Result<String, VarError> because
    // the variable might not exist or might contain invalid Unicode
    match std::env::var("HOME") {
        Ok(home) => println!("HOME directory: {}", home),
        Err(e) => println!("HOME not set: {}", e),
    }
    // Output: HOME directory: /Users/username (on macOS)

    match std::env::var("PATH") {
        Ok(path) => {
            let count = path.split(':').count();
            println!("PATH has {} entries", count);
        }
        Err(_) => println!("PATH not set (unusual!)"),
    }

    // Check a custom variable
    let db_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| String::from("postgresql://localhost/railway_db"));
    println!("Database URL: {}", db_url);
    // Output: Database URL: postgresql://localhost/railway_db (default)

    // WHY: unwrap_or_else is perfect for providing defaults
    let log_level = std::env::var("LOG_LEVEL")
        .unwrap_or_else(|_| String::from("info"));
    println!("Log level: {}", log_level);
    // Output: Log level: info (default)

    // Iterating all environment variables
    println!("\nFirst 5 environment variables:");
    for (i, (key, value)) in std::env::vars().enumerate() {
        if i >= 5 {
            println!("  ... and more");
            break;
        }
        // Truncate long values for display
        let display_value = if value.len() > 50 {
            format!("{}...", &value[..50])
        } else {
            value
        };
        println!("  {} = {}", key, display_value);
    }

    // Setting an environment variable (for the current process only)
    std::env::set_var("RAILWAY_ZONE", "Northern");
    println!(
        "\nRAILWAY_ZONE (just set): {}",
        std::env::var("RAILWAY_ZONE").unwrap()
    );
    // Output: RAILWAY_ZONE (just set): Northern

    // Removing an environment variable
    std::env::remove_var("RAILWAY_ZONE");
    println!(
        "RAILWAY_ZONE (after remove): {}",
        std::env::var("RAILWAY_ZONE").unwrap_or_else(|_| String::from("(not set)"))
    );
    // Output: RAILWAY_ZONE (after remove): (not set)
}

// ============================================================
// 8. PUTTING IT ALL TOGETHER — A MINI CLI TOOL
// ============================================================
// WHY: Let's build a small but complete CLI tool that combines
// all the concepts: args, stdin, stdout, stderr, and exit codes.

fn mini_tool() {
    println!("\n--- 8. Mini CLI Tool: Unit Converter ---\n");

    // A simple distance converter for Indian railways
    // Usage: converter <km_value> [--to miles|meters]

    let args: Vec<String> = std::env::args().collect();

    // For demo purposes, we'll simulate args if none provided
    let (value_str, target_unit) = if args.len() >= 2 {
        let unit = if args.len() >= 4 && args[2] == "--to" {
            args[3].clone()
        } else {
            String::from("miles")
        };
        (args[1].clone(), unit)
    } else {
        // Demo mode with hardcoded values
        (String::from("1384"), String::from("miles"))
    };

    // Parse the numeric value
    let km: f64 = match value_str.parse() {
        Ok(v) => v,
        Err(e) => {
            eprintln!("Error: '{}' is not a valid number: {}", value_str, e);
            // In a real tool: std::process::exit(2);
            println!("(Would exit with code 2)");
            return;
        }
    };

    // Convert based on target unit
    let (result, unit_label) = match target_unit.as_str() {
        "miles" | "mi" => (km * 0.621371, "miles"),
        "meters" | "m" => (km * 1000.0, "meters"),
        "feet" | "ft" => (km * 3280.84, "feet"),
        "yards" | "yd" => (km * 1093.61, "yards"),
        unknown => {
            eprintln!("Error: Unknown unit '{}'", unknown);
            eprintln!("Supported units: miles, meters, feet, yards");
            return;
        }
    };

    // Output the result
    println!("Delhi to Mumbai distance: {:.1} km = {:.1} {}", km, result, unit_label);
    // Output: Delhi to Mumbai distance: 1384.0 km = 859.9 miles

    // Table of conversions
    println!("\nConversion table for {:.1} km:", km);
    println!("  {:<10} {:.1}", "Miles:", km * 0.621371);
    println!("  {:<10} {:.0}", "Meters:", km * 1000.0);
    println!("  {:<10} {:.0}", "Feet:", km * 3280.84);
    println!("  {:<10} {:.0}", "Yards:", km * 1093.61);
    // Output:
    // Conversion table for 1384.0 km:
    //   Miles:     859.8
    //   Meters:    1384000
    //   Feet:      4540523
    //   Yards:     1513556
}

// ============================================================
// MAIN FUNCTION — ORCHESTRATING ALL DEMOS
// ============================================================

fn main() {
    println!("=== Rust CLI Basics ===\n");

    // Run the non-interactive demos
    demo_basic_args();
    demo_manual_parsing();
    demo_stdout_stderr();
    demo_exit_codes();
    demo_env_vars();
    mini_tool();

    // Interactive demos — uncomment ONE at a time to try:
    // WHY: These require user input, so they're commented out
    // to allow the non-interactive demos to run first.

    // Uncomment to try reading from stdin:
    // demo_stdin_reading();

    // Uncomment to try the REPL:
    // demo_repl();

    println!("\n=== CLI Basics Complete ===");
    println!("\nTo try interactive demos, uncomment demo_stdin_reading()");
    println!("or demo_repl() in main() and recompile.");
}

// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. std::env::args() gives you command line arguments as an
//    iterator of Strings. The first is always the program name.
//
// 2. For complex CLIs, use the `clap` crate. For simple tools,
//    manual parsing with match works fine.
//
// 3. Reading input: io::stdin().read_line() for single lines,
//    stdin.lock().lines() for multiple lines with BufRead.
//
// 4. Writing output: println! (stdout), eprintln! (stderr).
//    For performance, lock stdout and use writeln!.
//
// 5. REPL pattern: loop { prompt -> read -> parse -> execute }.
//    Handle EOF (0 bytes), empty input, and unknown commands.
//
// 6. process::exit(code) terminates immediately (skips Drop!).
//    Prefer returning Result from main() instead.
//
// 7. std::env::var("KEY") reads environment variables.
//    Use unwrap_or_else for defaults. env::vars() iterates all.
//
// 8. Separate STDOUT (data) from STDERR (errors/diagnostics).
//    Users can redirect them independently:
//    ./app > output.txt 2> errors.txt
//
// 9. Exit codes: 0 = success, non-zero = error. CI/CD and
//    shell scripts depend on correct exit codes.
//
// 10. Think of CLI like a railway enquiry counter: the user
//     asks (args/stdin), you process, and respond (stdout/stderr).
//     The station board (env vars) provides configuration.
// ============================================================
