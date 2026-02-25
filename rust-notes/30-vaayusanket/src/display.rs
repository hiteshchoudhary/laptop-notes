// =============================================================================
// display.rs -- Terminal Dashboard Rendering
// =============================================================================
//
// This is the "big screen" at ISRO Mission Control -- the visual display that
// transforms raw telemetry numbers into something humans can quickly interpret.
// We use ANSI escape codes for colors and Unicode block characters for bar
// charts, creating a rich terminal UI without any external TUI framework.
//
// ANSI escape codes are special character sequences that terminals interpret
// as formatting commands. They start with ESC (0x1B) followed by '[' and then
// parameters. For example, "\x1b[31m" means "set text color to red".
// =============================================================================

use crate::monitor::SystemSnapshot;

// =============================================================================
// ANSI Color Constants
// =============================================================================
// These are like the color palette for our mission control dashboard.

pub const RED: &str = "\x1b[31m";
pub const GREEN: &str = "\x1b[32m";
pub const YELLOW: &str = "\x1b[33m";
pub const BLUE: &str = "\x1b[34m";
pub const MAGENTA: &str = "\x1b[35m";
pub const CYAN: &str = "\x1b[36m";
pub const WHITE: &str = "\x1b[37m";
pub const RESET: &str = "\x1b[0m";
pub const BOLD: &str = "\x1b[1m";
pub const DIM: &str = "\x1b[2m";

// =============================================================================
// Unicode Block Characters for Bar Charts
// =============================================================================
// These create visual bar charts in the terminal, like gauge displays.
// Each character represents a different "fill level" of a bar segment.

const BAR_FULL: &str = "\u{2588}";     // Full block
const BAR_EMPTY: &str = "\u{2591}";    // Light shade (empty section)

// =============================================================================
// Screen Control
// =============================================================================

/// Clear the terminal screen and move cursor to top-left.
///
/// Uses ANSI escape codes:
/// - \x1b[2J  = clear entire screen
/// - \x1b[H   = move cursor to position (1,1)
pub fn clear_screen() {
    print!("\x1b[2J\x1b[H");
}

// =============================================================================
// Main Dashboard Display
// =============================================================================

/// Render the complete system dashboard to the terminal.
///
/// This is the main display function -- called once per monitoring tick.
/// It assembles all the visual components into a cohesive dashboard layout.
///
/// # Arguments
/// * `snapshot` - The current system metrics snapshot
/// * `no_color` - If true, strip all ANSI color codes
pub fn display_dashboard(snapshot: &SystemSnapshot, no_color: bool) {
    // Choose color functions based on the no_color flag.
    // When no_color is true, all "color" strings become empty.
    let c = |code: &str| -> &str {
        if no_color { "" } else { code }
    };

    clear_screen();

    // Header with timestamp
    let timestamp = chrono_lite_now();
    println!(
        "{}{}========================================================{}",
        c(BOLD), c(CYAN), c(RESET)
    );
    println!(
        "{}{}  VaayuSanket -- System Monitor  {}{}{}",
        c(BOLD), c(WHITE), c(DIM), timestamp, c(RESET)
    );
    println!(
        "{}{}========================================================{}",
        c(BOLD), c(CYAN), c(RESET)
    );
    println!();

    // ---- CPU Section ----
    display_cpu(snapshot, &c);

    // ---- Memory Section ----
    display_memory(snapshot, &c);

    // ---- Disk Section ----
    display_disks(snapshot, &c);

    // ---- Top Processes Section ----
    display_processes(snapshot, &c);
}

// =============================================================================
// Section Renderers
// =============================================================================

/// Display CPU information with per-core bar charts.
fn display_cpu(snapshot: &SystemSnapshot, c: &impl Fn(&str) -> &str) {
    let cpu = &snapshot.cpu;

    println!(
        "{}{}>> CPU  ({}){}",
        c(BOLD), c(YELLOW), cpu.brand, c(RESET)
    );
    println!(
        "   Cores: {}  |  Frequency: {} MHz",
        cpu.core_count, cpu.frequency_mhz
    );

    // Overall CPU usage bar
    let color = usage_color(cpu.usage_percent, c);
    println!(
        "   Overall: {} {} {:.1}%{}",
        color,
        make_bar(cpu.usage_percent, 30),
        cpu.usage_percent,
        c(RESET)
    );

    // Per-core usage (compact layout -- 4 cores per row)
    if cpu.per_core_usage.len() > 1 {
        println!("   Per-core:");
        for (i, &usage) in cpu.per_core_usage.iter().enumerate() {
            let core_color = usage_color(usage, c);
            // Print core with a short bar
            print!(
                "   {:>3}: {}{} {:.0}%{} ",
                i, core_color, make_bar(usage, 10), usage, c(RESET)
            );
            // Newline every 4 cores for readability
            if (i + 1) % 4 == 0 {
                println!();
            }
        }
        // Ensure we end with a newline if the last row wasn't complete
        if cpu.per_core_usage.len() % 4 != 0 {
            println!();
        }
    }
    println!();
}

/// Display memory and swap usage.
fn display_memory(snapshot: &SystemSnapshot, c: &impl Fn(&str) -> &str) {
    let mem = &snapshot.memory;

    println!("{}{}>> MEMORY{}", c(BOLD), c(MAGENTA), c(RESET));

    let color = usage_color(mem.usage_percent, c);
    println!(
        "   RAM:  {} {} {:.1}%{}  ({} / {})",
        color,
        make_bar(mem.usage_percent, 30),
        mem.usage_percent,
        c(RESET),
        format_bytes(mem.used_bytes),
        format_bytes(mem.total_bytes)
    );
    println!(
        "   Available: {}",
        format_bytes(mem.available_bytes)
    );

    // Swap info (only show if swap exists)
    if mem.swap_total_bytes > 0 {
        let swap_color = usage_color(mem.swap_usage_percent, c);
        println!(
            "   Swap: {} {} {:.1}%{}  ({} / {})",
            swap_color,
            make_bar(mem.swap_usage_percent, 30),
            mem.swap_usage_percent,
            c(RESET),
            format_bytes(mem.swap_used_bytes),
            format_bytes(mem.swap_total_bytes)
        );
    }
    println!();
}

/// Display disk usage table.
fn display_disks(snapshot: &SystemSnapshot, c: &impl Fn(&str) -> &str) {
    println!("{}{}>> DISKS{}", c(BOLD), c(BLUE), c(RESET));

    // Table header
    println!(
        "   {}{:<20} {:<10} {:<10} {:<10} {:<6} {}{}",
        c(DIM), "Mount", "Total", "Available", "Used%", "FS", "", c(RESET)
    );
    println!("   {}", "-".repeat(66));

    for disk in &snapshot.disks {
        let color = usage_color(disk.usage_percent, c);
        let used = disk.total_bytes.saturating_sub(disk.available_bytes);
        println!(
            "   {:<20} {:<10} {:<10} {}{:<10}{} {:<6}",
            truncate_str(&disk.mount_point, 19),
            format_bytes(disk.total_bytes),
            format_bytes(disk.available_bytes),
            color,
            format!("{:.1}%", disk.usage_percent),
            c(RESET),
            truncate_str(&disk.filesystem, 5),
        );
        // If disk is nearly full, this is the used bytes for extra context
        if disk.usage_percent > 85.0 {
            println!(
                "   {}  ^ Used: {} -- consider freeing space!{}",
                c(RED),
                format_bytes(used),
                c(RESET)
            );
        }
    }
    println!();
}

/// Display top processes table.
fn display_processes(snapshot: &SystemSnapshot, c: &impl Fn(&str) -> &str) {
    println!("{}{}>> TOP PROCESSES{}", c(BOLD), c(GREEN), c(RESET));

    // Table header
    println!(
        "   {}{:>7} {:<25} {:>8} {:>12}{}",
        c(DIM), "PID", "Name", "CPU%", "Memory", c(RESET)
    );
    println!("   {}", "-".repeat(56));

    for proc in &snapshot.top_processes {
        let color = if proc.cpu_usage > 50.0 {
            c(RED)
        } else if proc.cpu_usage > 20.0 {
            c(YELLOW)
        } else {
            c(GREEN)
        };

        println!(
            "   {:>7} {:<25} {}{:>7.1}%{} {:>12}",
            proc.pid,
            truncate_str(&proc.name, 24),
            color,
            proc.cpu_usage,
            c(RESET),
            format_bytes(proc.memory_bytes),
        );
    }
    println!();
}

// =============================================================================
// Helper Functions
// =============================================================================

/// Create a bar chart string of the given width, filled proportionally.
///
/// # Example
/// `make_bar(75.0, 20)` produces something like:
/// `[===============     ]`  (15 filled, 5 empty out of 20)
fn make_bar(percent: f32, width: usize) -> String {
    let filled = ((percent / 100.0) * width as f32).round() as usize;
    let filled = filled.min(width); // Clamp to width
    let empty = width - filled;

    format!(
        "[{}{}]",
        BAR_FULL.repeat(filled),
        BAR_EMPTY.repeat(empty)
    )
}

/// Choose a color based on usage percentage:
/// - Green: 0-60% (nominal)
/// - Yellow: 60-85% (caution)
/// - Red: 85-100% (critical)
///
/// Like the traffic light indicators on ISRO's mission dashboards.
fn usage_color<'a>(percent: f32, c: &impl Fn(&str) -> &'a str) -> &'a str {
    if percent >= 85.0 {
        c(RED)
    } else if percent >= 60.0 {
        c(YELLOW)
    } else {
        c(GREEN)
    }
}

/// Format a byte count into a human-readable string.
///
/// Converts raw bytes to the most appropriate unit:
/// - Bytes (B) for < 1 KB
/// - Kilobytes (KB) for < 1 MB
/// - Megabytes (MB) for < 1 GB
/// - Gigabytes (GB) for < 1 TB
/// - Terabytes (TB) for larger values
///
/// # Examples
/// ```
/// assert_eq!(format_bytes(1024), "1.0 KB");
/// assert_eq!(format_bytes(1_073_741_824), "1.0 GB");
/// ```
pub fn format_bytes(bytes: u64) -> String {
    const KB: u64 = 1024;
    const MB: u64 = KB * 1024;
    const GB: u64 = MB * 1024;
    const TB: u64 = GB * 1024;

    if bytes >= TB {
        format!("{:.1} TB", bytes as f64 / TB as f64)
    } else if bytes >= GB {
        format!("{:.1} GB", bytes as f64 / GB as f64)
    } else if bytes >= MB {
        format!("{:.1} MB", bytes as f64 / MB as f64)
    } else if bytes >= KB {
        format!("{:.1} KB", bytes as f64 / KB as f64)
    } else {
        format!("{} B", bytes)
    }
}

/// Truncate a string to a maximum length, adding ".." if truncated.
fn truncate_str(s: &str, max_len: usize) -> String {
    if s.len() <= max_len {
        s.to_string()
    } else {
        format!("{}..", &s[..max_len - 2])
    }
}

/// Simple timestamp without pulling in the `chrono` crate.
///
/// Uses std::time::SystemTime to get the current time as a Unix timestamp.
/// For a production tool you'd use chrono, but this keeps our dependencies minimal.
fn chrono_lite_now() -> String {
    use std::time::SystemTime;
    match SystemTime::now().duration_since(SystemTime::UNIX_EPOCH) {
        Ok(d) => {
            let secs = d.as_secs();
            // Convert to a rough human-readable time (UTC)
            let hours = (secs % 86400) / 3600;
            let minutes = (secs % 3600) / 60;
            let seconds = secs % 60;
            format!("{:02}:{:02}:{:02} UTC", hours, minutes, seconds)
        }
        Err(_) => "??:??:?? UTC".to_string(),
    }
}
