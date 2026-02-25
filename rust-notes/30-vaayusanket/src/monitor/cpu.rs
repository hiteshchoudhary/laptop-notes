// =============================================================================
// monitor/cpu.rs -- CPU Monitoring
// =============================================================================
//
// The CPU is the rocket engine of your computer. Just as ISRO monitors engine
// thrust, temperature, and burn rate, we monitor CPU usage percentage, core
// count, frequency, and model information.
//
// Key concept: sysinfo needs two refresh cycles to compute meaningful CPU usage
// because usage is calculated as the delta between two measurement points.
// That's why we keep a persistent System object in main.rs.
// =============================================================================

use serde::Serialize;
use sysinfo::System;

/// CPU metrics snapshot.
///
/// Contains both aggregate and per-core information, similar to how ISRO
/// monitors both the overall engine cluster performance and individual
/// engine health.
#[derive(Debug, Clone, Serialize)]
pub struct CpuInfo {
    /// Overall CPU usage as a percentage (0.0 - 100.0)
    pub usage_percent: f32,

    /// Number of logical CPU cores (includes hyper-threaded cores)
    pub core_count: usize,

    /// CPU frequency in MHz (from the first core, as a representative value)
    pub frequency_mhz: u64,

    /// CPU brand string (e.g., "Apple M1 Pro", "Intel Core i7-12700K")
    pub brand: String,

    /// Per-core usage percentages -- lets you see if one core is maxed out
    /// while others are idle (like monitoring individual rocket engines)
    pub per_core_usage: Vec<f32>,
}

/// Gather current CPU information from the system.
///
/// # Arguments
/// * `sys` - A reference to an already-refreshed sysinfo::System
///
/// # How it works
/// The `sysinfo` crate tracks CPU usage by comparing two snapshots internally.
/// After `sys.refresh_cpu_all()` is called (which `refresh_all()` does), the
/// usage values represent the CPU activity since the last refresh.
pub fn get_cpu_info(sys: &System) -> CpuInfo {
    let cpus = sys.cpus();

    // Calculate overall usage as the average across all cores.
    // This is like computing the average thrust across all engines in a cluster.
    let usage_percent = if cpus.is_empty() {
        0.0
    } else {
        let total: f32 = cpus.iter().map(|cpu| cpu.cpu_usage()).sum();
        total / cpus.len() as f32
    };

    // Collect per-core usage for the detailed view
    let per_core_usage: Vec<f32> = cpus.iter().map(|cpu| cpu.cpu_usage()).collect();

    // Get frequency and brand from the first CPU (they're typically uniform)
    let frequency_mhz = cpus.first().map(|c| c.frequency()).unwrap_or(0);
    let brand = cpus
        .first()
        .map(|c| c.brand().to_string())
        .unwrap_or_else(|| "Unknown".to_string());

    CpuInfo {
        usage_percent,
        core_count: cpus.len(),
        frequency_mhz,
        brand,
        per_core_usage,
    }
}
