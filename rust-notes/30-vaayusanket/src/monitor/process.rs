// =============================================================================
// monitor/process.rs -- Process Monitoring (Top N)
// =============================================================================
//
// Every spacecraft has dozens of subsystems running simultaneously -- attitude
// control, power management, communications, thermal regulation. Similarly,
// your OS runs hundreds of processes. This module identifies the "busiest"
// ones, sorted by CPU usage, giving you a bird's-eye view of what's consuming
// your system's resources.
//
// This is essentially a simplified version of `top` or `htop`.
// =============================================================================

use serde::Serialize;
use sysinfo::System;

/// Information about a single running process.
///
/// Like a subsystem status report: which subsystem (name), its ID (pid),
/// how much engine power it's using (cpu_usage), and how much fuel/storage
/// it's consuming (memory_bytes).
#[derive(Debug, Clone, Serialize)]
pub struct ProcessInfo {
    /// Process ID (unique identifier assigned by the OS)
    pub pid: u32,

    /// Process name (e.g., "firefox", "code", "rust-analyzer")
    pub name: String,

    /// CPU usage as a percentage (can exceed 100% on multi-core systems
    /// if the process uses multiple cores)
    pub cpu_usage: f32,

    /// Memory consumed by this process in bytes
    pub memory_bytes: u64,
}

/// Get the top N processes sorted by CPU usage (descending).
///
/// # Arguments
/// * `sys` - A reference to an already-refreshed sysinfo::System
/// * `n` - How many top processes to return
///
/// # How it works
/// 1. Iterate over all processes from sysinfo
/// 2. Map each to our ProcessInfo struct
/// 3. Sort by CPU usage in descending order (highest first)
/// 4. Take the top N
///
/// # Note on sorting
/// We use `partial_cmp` because f32 doesn't implement `Ord` (due to NaN).
/// The `unwrap_or` fallback handles the edge case where a value is NaN.
/// This is a common Rust gotcha with floating-point sorting!
pub fn get_top_processes(sys: &System, n: usize) -> Vec<ProcessInfo> {
    // Collect all processes into a Vec so we can sort them.
    // sysinfo returns processes as a HashMap<Pid, Process>.
    let mut processes: Vec<ProcessInfo> = sys
        .processes()
        .iter()
        .map(|(pid, process)| ProcessInfo {
            pid: pid.as_u32(),
            name: process.name().to_string_lossy().to_string(),
            cpu_usage: process.cpu_usage(),
            memory_bytes: process.memory(),
        })
        .collect();

    // Sort by CPU usage, highest first.
    // This is like ranking spacecraft subsystems by power consumption.
    processes.sort_by(|a, b| {
        b.cpu_usage
            .partial_cmp(&a.cpu_usage)
            .unwrap_or(std::cmp::Ordering::Equal)
    });

    // Take only the top N processes.
    // `truncate` modifies the Vec in place -- efficient, no extra allocation.
    processes.truncate(n);

    processes
}
