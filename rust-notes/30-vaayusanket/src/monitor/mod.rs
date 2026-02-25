// =============================================================================
// monitor/mod.rs -- Monitoring Module Hub
// =============================================================================
//
// This is the "Mission Control Centre" -- it re-exports all subsystem monitors
// and provides a unified SystemSnapshot that aggregates all metrics into one
// coherent picture, just like ISRO's telemetry dashboard combines data from
// every spacecraft subsystem into a single view.
// =============================================================================

// Re-export submodules so callers can use `monitor::cpu::get_cpu_info()` etc.
pub mod cpu;
pub mod memory;
pub mod disk;
pub mod process;

// Import the individual info structs for the unified snapshot
use cpu::CpuInfo;
use memory::MemoryInfo;
use disk::DiskInfo;
use process::ProcessInfo;
use serde::Serialize;

/// A complete snapshot of system state at a point in time.
///
/// Think of this as one "frame" of telemetry data -- everything the mission
/// control dashboard needs to render a complete picture. Each tick of the
/// monitoring loop produces one of these.
#[derive(Debug, Clone, Serialize)]
pub struct SystemSnapshot {
    /// CPU metrics (overall usage, per-core, frequency, brand)
    pub cpu: CpuInfo,

    /// Memory and swap metrics
    pub memory: MemoryInfo,

    /// Info for each mounted disk
    pub disks: Vec<DiskInfo>,

    /// Top N processes sorted by CPU usage
    pub top_processes: Vec<ProcessInfo>,
}

/// Collect a full system snapshot by querying all subsystems.
///
/// This function orchestrates all the individual monitors, much like how
/// the flight director at ISRO polls each subsystem team for status updates
/// before making a go/no-go decision.
///
/// The `sysinfo::System` object is passed in so it can be reused across ticks
/// (sysinfo recommends refreshing an existing System rather than creating new ones).
///
/// # Arguments
/// * `sys` - A mutable reference to a sysinfo::System instance
/// * `top_n` - How many top processes to include in the snapshot
pub fn collect_snapshot(sys: &mut sysinfo::System, top_n: usize) -> SystemSnapshot {
    // Refresh all relevant data in the System object.
    // This is like polling all sensors on the spacecraft at once.
    sys.refresh_all();

    // Gather metrics from each subsystem
    let cpu = cpu::get_cpu_info(sys);
    let memory = memory::get_memory_info(sys);
    let disks = disk::get_disk_info();
    let top_processes = process::get_top_processes(sys, top_n);

    SystemSnapshot {
        cpu,
        memory,
        disks,
        top_processes,
    }
}
