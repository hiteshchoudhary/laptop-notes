// =============================================================================
// monitor/disk.rs -- Disk Space Monitoring
// =============================================================================
//
// Disks are like the payload bays and storage compartments on a spacecraft.
// Each disk partition has a total capacity and a current usage level. Running
// out of disk space can cause applications to crash, databases to corrupt,
// and logs to stop recording -- catastrophic in any mission.
//
// We use sysinfo::Disks (note: separate from sysinfo::System) to enumerate
// all mounted disks and report their status.
// =============================================================================

use serde::Serialize;
use sysinfo::Disks;

/// Information about a single disk/partition.
///
/// Each mounted filesystem gets its own DiskInfo entry, similar to how a
/// spacecraft might have separate storage bays, each monitored independently.
#[derive(Debug, Clone, Serialize)]
pub struct DiskInfo {
    /// Disk name (e.g., "sda1", "disk0s2", "Macintosh HD")
    pub name: String,

    /// Mount point path (e.g., "/", "/home", "/Volumes/Data")
    pub mount_point: String,

    /// Total disk capacity in bytes
    pub total_bytes: u64,

    /// Available (free) space in bytes
    pub available_bytes: u64,

    /// Disk usage as a percentage (0.0 - 100.0)
    pub usage_percent: f32,

    /// Filesystem type (e.g., "ext4", "apfs", "ntfs")
    pub filesystem: String,
}

/// Gather information about all mounted disks.
///
/// # Returns
/// A Vec of DiskInfo, one entry per mounted filesystem.
///
/// # How it works
/// `sysinfo::Disks::new_with_refreshed_list()` queries the OS for all currently
/// mounted filesystems. We iterate over them, computing usage percentage from
/// total and available space.
pub fn get_disk_info() -> Vec<DiskInfo> {
    // Create a fresh Disks instance with up-to-date information.
    // Unlike System, Disks is lightweight and can be recreated each tick.
    let disks = Disks::new_with_refreshed_list();

    disks
        .iter()
        .map(|d| {
            let total = d.total_space();
            let available = d.available_space();

            // Used space = total - available
            // Usage percent = used / total * 100
            let usage_percent = if total > 0 {
                ((total - available) as f32 / total as f32) * 100.0
            } else {
                0.0
            };

            // The filesystem type is returned as an OsStr; convert to a
            // lossy UTF-8 string (replacing invalid characters with the
            // Unicode replacement character)
            let filesystem = d
                .file_system()
                .to_string_lossy()
                .to_string();

            DiskInfo {
                name: d.name().to_string_lossy().to_string(),
                mount_point: d.mount_point().to_string_lossy().to_string(),
                total_bytes: total,
                available_bytes: available,
                usage_percent,
                filesystem,
            }
        })
        .collect()
}
