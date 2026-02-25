# VaayuSanket -- Real-Time System Monitor CLI

> **Vaayu** (wind/air/breath) + **Sanket** (signal) = Signal of the System's Breath

## The ISRO Mission Control Analogy

Think of your computer as a rocket on a mission. Just as ISRO's Mission Control Centre
in Bengaluru monitors telemetry from a spacecraft -- tracking fuel levels, engine
temperature, trajectory, and hundreds of other parameters in real time -- VaayuSanket
monitors your system's vital signs:

| ISRO Mission Control         | VaayuSanket                     |
|-----------------------------|---------------------------------|
| Engine temperature          | CPU usage per core              |
| Fuel remaining              | Memory (RAM) usage              |
| Payload bay status          | Disk space                      |
| Subsystem processes         | Top N running processes         |
| Anomaly alerts              | Threshold-based alerts          |
| Telemetry data downlink     | JSON export snapshots           |

When ISRO launches a PSLV or GSLV, every parameter is sampled at regular intervals
and displayed on dashboards. If anything crosses a safe threshold, alerts fire
immediately. VaayuSanket does the same for your machine.

## Features

- **Real-time CPU monitoring** -- overall and per-core usage with bar charts
- **Memory tracking** -- RAM and swap usage with color-coded thresholds
- **Disk space overview** -- all mounted disks with usage percentages
- **Top N processes** -- sorted by CPU usage, like a mini `htop`
- **Threshold alerts** -- warnings when CPU, memory, or disk exceed limits
- **JSON export** -- save a snapshot for later analysis or logging
- **Colored terminal output** -- ANSI colors for quick visual scanning
- **Configurable via CLI args** -- interval, thresholds, export path, and more

## Building and Running

```bash
# Basic run (1-second refresh, default settings)
cargo run

# Custom interval (2 seconds) with JSON export
cargo run -- --interval 2 --export snapshot.json

# Show top 15 processes, alert at 80% CPU
cargo run -- --top 15 --cpu-threshold 80

# Disable colored output (for piping to files)
cargo run -- --no-color

# Show help
cargo run -- --help
```

## CLI Flags

| Flag                  | Default | Description                              |
|-----------------------|---------|------------------------------------------|
| `--interval <secs>`  | 1       | Refresh interval in seconds              |
| `--top <n>`          | 10      | Number of top processes to display       |
| `--export <path>`    | None    | Export snapshot to JSON file             |
| `--cpu-threshold <n>`| 90      | CPU alert threshold percentage           |
| `--mem-threshold <n>`| 85      | Memory alert threshold percentage        |
| `--no-color`         | false   | Disable ANSI color codes                 |
| `--help`             | --      | Show help message                        |

## Architecture Overview

```
                    +-------------------+
                    |   main.rs         |
                    |  (tokio runtime)  |
                    +--------+----------+
                             |
                    tokio::select! loop
                    (interval tick + Ctrl+C)
                             |
              +--------------+--------------+
              |              |              |
        collect_snapshot  check_alerts  display_dashboard
        (monitor/*)      (alert.rs)    (display.rs)
              |                             |
              +-----------------------------+
                             |
                      export_snapshot (optional)
                       (export.rs)
```

- **Async monitoring loop**: Uses `tokio::time::interval` for precise timing
- **Snapshot model**: Each tick produces a `SystemSnapshot` containing all metrics
- **Alert pipeline**: Snapshot flows through alert checks before display
- **Export on demand**: Optionally serializes snapshot to JSON via serde

## Key Rust Concepts Demonstrated

1. **Async/Await with Tokio** -- `#[tokio::main]`, `tokio::select!`, interval timers
2. **Module system** -- nested modules (`monitor/mod.rs`, re-exports)
3. **Structs and Enums** -- data modeling with `CpuInfo`, `AlertLevel`, etc.
4. **Derive macros** -- `Debug`, `Clone`, `Serialize`, `Deserialize`
5. **Error handling** -- `Result<T, Box<dyn std::error::Error>>` pattern
6. **Iterators and closures** -- sorting processes, filtering alerts
7. **String formatting** -- `format!`, ANSI escape codes, Unicode blocks
8. **CLI argument parsing** -- manual `std::env::args` parsing
9. **File I/O** -- writing JSON exports with `std::fs`
10. **External crates** -- `sysinfo` for OS-level metrics, `serde` for serialization
