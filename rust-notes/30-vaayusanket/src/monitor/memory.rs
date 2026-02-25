// =============================================================================
// monitor/memory.rs -- Memory Monitoring
// =============================================================================
//
// Memory is like the fuel tank of a rocket. You need to know:
// - Total capacity (total RAM)
// - Current level (used memory)
// - Reserve tank status (swap space)
//
// Running out of memory is like running out of fuel -- things stop working.
// Monitoring memory helps you catch memory leaks and plan capacity.
// =============================================================================

use serde::Serialize;
use sysinfo::System;

/// Memory metrics snapshot.
///
/// All sizes are stored in bytes for precision. The `format_bytes()` function
/// in display.rs converts them to human-readable form (KB, MB, GB).
#[derive(Debug, Clone, Serialize)]
pub struct MemoryInfo {
    /// Total physical RAM in bytes
    pub total_bytes: u64,

    /// Used RAM in bytes
    pub used_bytes: u64,

    /// Available RAM in bytes (may differ from total - used due to caching)
    pub available_bytes: u64,

    /// RAM usage as a percentage (0.0 - 100.0)
    pub usage_percent: f32,

    /// Total swap space in bytes (the "reserve fuel tank")
    pub swap_total_bytes: u64,

    /// Used swap space in bytes
    pub swap_used_bytes: u64,

    /// Swap usage as a percentage
    pub swap_usage_percent: f32,
}

/// Gather current memory information from the system.
///
/// # Arguments
/// * `sys` - A reference to an already-refreshed sysinfo::System
///
/// # Note on "available" vs "free"
/// Available memory includes memory that can be reclaimed from caches and
/// buffers. It's the more useful metric -- just like "usable fuel" accounts
/// for fuel in feeder lines, not just the main tank.
pub fn get_memory_info(sys: &System) -> MemoryInfo {
    let total = sys.total_memory();
    let used = sys.used_memory();
    let available = sys.available_memory();
    let swap_total = sys.total_swap();
    let swap_used = sys.used_swap();

    // Calculate usage percentages, guarding against division by zero
    // (a machine with 0 RAM would be quite the anomaly, but Rust teaches
    // us to handle edge cases!)
    let usage_percent = if total > 0 {
        (used as f32 / total as f32) * 100.0
    } else {
        0.0
    };

    let swap_usage_percent = if swap_total > 0 {
        (swap_used as f32 / swap_total as f32) * 100.0
    } else {
        0.0
    };

    MemoryInfo {
        total_bytes: total,
        used_bytes: used,
        available_bytes: available,
        usage_percent,
        swap_total_bytes: swap_total,
        swap_used_bytes: swap_used,
        swap_usage_percent,
    }
}
