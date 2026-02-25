// =============================================================================
// export.rs -- JSON Snapshot Export
// =============================================================================
//
// Just as ISRO records all telemetry data for post-mission analysis, VaayuSanket
// can export system snapshots to JSON files. This is invaluable for:
// - Debugging performance issues after the fact
// - Creating baselines for comparison
// - Feeding data to other analysis tools
// - Historical trend analysis
//
// We use serde and serde_json for serialization -- the Rust ecosystem's standard
// approach. The `Serialize` derive macro on our data structs does the heavy lifting.
// =============================================================================

use crate::monitor::SystemSnapshot;
use serde::Serialize;
use std::fs;
use std::time::SystemTime;

/// A timestamped export record wrapping a SystemSnapshot.
///
/// This adds metadata (timestamp) to the raw snapshot, making the exported
/// JSON self-describing -- you can tell exactly when the data was captured
/// without relying on file modification times.
#[derive(Debug, Serialize)]
pub struct ExportRecord {
    /// Unix timestamp (seconds since epoch) when the snapshot was taken
    pub timestamp_unix: u64,

    /// Human-readable timestamp string
    pub timestamp_readable: String,

    /// The actual system metrics snapshot
    pub snapshot: SystemSnapshot,
}

/// Export a system snapshot to a JSON file.
///
/// # Arguments
/// * `snapshot` - The system metrics to export
/// * `path` - Optional file path. If None, generates a timestamped filename.
///
/// # Returns
/// * `Ok(String)` - The path the file was written to
/// * `Err(...)` - If serialization or file writing fails
///
/// # Example output (snapshot_1706000000.json):
/// ```json
/// {
///   "timestamp_unix": 1706000000,
///   "timestamp_readable": "Unix timestamp 1706000000",
///   "snapshot": {
///     "cpu": { "usage_percent": 45.2, ... },
///     "memory": { "total_bytes": 17179869184, ... },
///     ...
///   }
/// }
/// ```
pub fn export_snapshot(
    snapshot: &SystemSnapshot,
    path: Option<&str>,
) -> Result<String, Box<dyn std::error::Error>> {
    // Get current timestamp for the record
    let timestamp_unix = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);

    // Create a human-readable timestamp (basic, without chrono crate)
    let timestamp_readable = format!("Unix timestamp {}", timestamp_unix);

    // Build the export record by wrapping the snapshot with metadata
    let record = ExportRecord {
        timestamp_unix,
        timestamp_readable,
        snapshot: snapshot.clone(),
    };

    // Serialize to pretty-printed JSON.
    // `to_string_pretty` adds indentation and newlines for readability.
    // For compact output (e.g., log streaming), you'd use `to_string` instead.
    let json = serde_json::to_string_pretty(&record)?;

    // Determine the output file path
    let file_path = match path {
        Some(p) => p.to_string(),
        None => {
            // Generate a timestamped filename like "snapshot_1706000000.json"
            format!("snapshot_{}.json", timestamp_unix)
        }
    };

    // Write the JSON string to the file.
    // `fs::write` creates the file if it doesn't exist, or overwrites if it does.
    // This is atomic-ish on most filesystems (writes to a buffer, then flushes).
    fs::write(&file_path, &json)?;

    Ok(file_path)
}
