// =============================================================================
// config.rs -- CLI Argument Parsing & Configuration
// =============================================================================
//
// Like ISRO's mission parameters that define orbit altitude, burn duration,
// and telemetry frequency -- VaayuSanket's Config defines how the monitoring
// mission operates.
//
// We parse command-line arguments manually using std::env::args to demonstrate
// how argument parsing works under the hood. Production tools often use the
// `clap` crate, but understanding manual parsing is foundational.
// =============================================================================

/// Configuration for the monitoring session.
///
/// Each field corresponds to a CLI flag. Defaults are provided so the tool
/// works out of the box with sensible settings.
#[derive(Debug, Clone)]
pub struct Config {
    /// How often to sample metrics, in seconds (like telemetry sampling rate)
    pub interval_secs: u64,

    /// How many top processes to display (sorted by CPU usage)
    pub top_n_processes: usize,

    /// Optional path to export JSON snapshots
    pub export_path: Option<String>,

    /// CPU usage percentage that triggers an alert
    pub alert_cpu_threshold: f32,

    /// Memory usage percentage that triggers an alert
    pub alert_memory_threshold: f32,

    /// Disable ANSI color codes (useful for piping output)
    pub no_color: bool,
}

impl Default for Config {
    fn default() -> Self {
        Config {
            interval_secs: 1,
            top_n_processes: 10,
            export_path: None,
            alert_cpu_threshold: 90.0,
            alert_memory_threshold: 85.0,
            no_color: false,
        }
    }
}

impl Config {
    /// Parse configuration from command-line arguments.
    ///
    /// This manually iterates over `std::env::args()` and matches flags.
    /// It demonstrates the iterator pattern and match expressions in Rust.
    ///
    /// # Returns
    /// - `Ok(Some(Config))` if arguments are valid
    /// - `Ok(None)` if `--help` was requested (caller should exit gracefully)
    /// - `Err(...)` if an argument is malformed
    pub fn from_args() -> Result<Option<Config>, Box<dyn std::error::Error>> {
        let mut config = Config::default();
        let args: Vec<String> = std::env::args().collect();

        // Skip the first argument (program name), then process pairs
        let mut i = 1;
        while i < args.len() {
            match args[i].as_str() {
                "--help" | "-h" => {
                    Self::print_help();
                    return Ok(None); // Signal that help was shown
                }

                "--interval" | "-i" => {
                    // The next argument should be the value
                    i += 1;
                    let val = args.get(i).ok_or("--interval requires a value")?;
                    config.interval_secs = val.parse::<u64>()
                        .map_err(|_| format!("Invalid interval value: '{}'", val))?;
                    if config.interval_secs == 0 {
                        return Err("Interval must be at least 1 second".into());
                    }
                }

                "--top" | "-t" => {
                    i += 1;
                    let val = args.get(i).ok_or("--top requires a value")?;
                    config.top_n_processes = val.parse::<usize>()
                        .map_err(|_| format!("Invalid top-n value: '{}'", val))?;
                }

                "--export" | "-e" => {
                    i += 1;
                    let val = args.get(i).ok_or("--export requires a file path")?;
                    config.export_path = Some(val.clone());
                }

                "--cpu-threshold" => {
                    i += 1;
                    let val = args.get(i).ok_or("--cpu-threshold requires a value")?;
                    config.alert_cpu_threshold = val.parse::<f32>()
                        .map_err(|_| format!("Invalid CPU threshold: '{}'", val))?;
                }

                "--mem-threshold" => {
                    i += 1;
                    let val = args.get(i).ok_or("--mem-threshold requires a value")?;
                    config.alert_memory_threshold = val.parse::<f32>()
                        .map_err(|_| format!("Invalid memory threshold: '{}'", val))?;
                }

                "--no-color" => {
                    config.no_color = true;
                    // Note: no `i += 1` here because this flag takes no value
                }

                other => {
                    return Err(format!("Unknown argument: '{}'. Use --help for usage.", other).into());
                }
            }
            i += 1;
        }

        Ok(Some(config))
    }

    /// Print a formatted help message to stdout.
    ///
    /// This is the "mission briefing" -- explaining all available parameters.
    fn print_help() {
        println!(
r#"
VaayuSanket -- Real-Time System Monitor CLI
Like ISRO mission control, but for your machine.

USAGE:
    vaayusanket [OPTIONS]

OPTIONS:
    -h, --help                  Show this help message
    -i, --interval <secs>       Refresh interval in seconds [default: 1]
    -t, --top <n>               Number of top processes to show [default: 10]
    -e, --export <path>         Export snapshot to JSON file
        --cpu-threshold <n>     CPU alert threshold % [default: 90]
        --mem-threshold <n>     Memory alert threshold % [default: 85]
        --no-color              Disable colored output

EXAMPLES:
    vaayusanket                             # Default settings
    vaayusanket -i 2 -e snapshot.json       # 2s interval, export JSON
    vaayusanket --top 15 --cpu-threshold 80 # Top 15 procs, alert at 80% CPU
    vaayusanket --no-color > log.txt        # Pipe to file without colors
"#
        );
    }
}
