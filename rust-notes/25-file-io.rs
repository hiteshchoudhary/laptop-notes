// ============================================================
// 25. FILE I/O IN RUST
// ============================================================
// WHY THIS MATTERS:
// Nearly every real-world program deals with files — reading
// configuration, writing logs, processing data, saving state.
// Rust's file I/O is safe, efficient, and explicit about errors.
// Unlike many languages where file operations silently fail or
// throw unexpected exceptions, Rust forces you to handle every
// possible failure, resulting in more robust programs.
// ============================================================

// ============================================================
// STORY: INDIA POST SORTING ROOM
// ============================================================
// Imagine the Central Mail Sorting Room at a major India Post
// hub in Delhi.
//
// Every day, thousands of letters (FILES) arrive:
//
// 1. RECEIVING (Reading files): Letters arrive in mail bags.
//    The clerk OPENS a bag (File::open), takes out letters one
//    by one (BufReader, line by line), or dumps the entire bag
//    on the table at once (read_to_string).
//
// 2. SORTING (Path and PathBuf): Each letter has an address
//    (file path). The address has parts: state/district/pin/name,
//    just like paths have components: /home/user/docs/file.txt.
//    The clerk navigates the address hierarchy to find the right bin.
//
// 3. STAMPING (Writing files): The clerk stamps each letter
//    with a date and tracking number (writes data). Some letters
//    get a fresh stamp (overwrite), others get an additional stamp
//    (append).
//
// 4. DISPATCHING (File operations): Letters are copied (fs::copy),
//    moved to different bins (fs::rename), or occasionally
//    discarded (fs::remove_file). New bins are created for new
//    routes (fs::create_dir).
//
// 5. CHECKING (Metadata): Before dispatching, the clerk checks:
//    Does this bin exist? How heavy is this parcel? When was it
//    received? (file existence, size, timestamps)
//
// Let's build each of these operations in Rust!
// ============================================================

use std::fs::{self, File, OpenOptions};
use std::io::{self, BufRead, BufReader, BufWriter, Read, Write};
use std::path::{Path, PathBuf};

// ============================================================
// 1. READING FILES — THE SIMPLE WAY
// ============================================================
// WHY: read_to_string is the easiest way to read a file.
// It loads the entire file into memory as a String.
// Perfect for small files (config, JSON, etc.).

fn demo_read_to_string() {
    println!("--- 1. Reading Files (Simple) ---\n");

    // Create a sample file first
    let content = "Sender: Rahul Sharma, Delhi\n\
                   Receiver: Priya Patel, Mumbai\n\
                   Subject: Wedding Invitation\n\
                   Date: 15-Jan-2026\n\
                   This is to invite you to our wedding ceremony.";

    let file_path = "/tmp/rust_demo_letter.txt";
    fs::write(file_path, content).expect("Failed to create sample file");
    println!("Created sample file: {}", file_path);

    // METHOD 1: fs::read_to_string — simplest approach
    // WHY: One function call, returns Result<String, io::Error>
    match fs::read_to_string(file_path) {
        Ok(text) => {
            println!("File contents ({} bytes):", text.len());
            println!("{}", text);
        }
        Err(e) => eprintln!("Error reading file: {}", e),
    }
    // Output: File contents (149 bytes):
    // Output: Sender: Rahul Sharma, Delhi
    // Output: Receiver: Priya Patel, Mumbai
    // Output: ...

    // METHOD 2: File::open + read_to_string (more control)
    // WHY: Opening the file separately lets you do other operations
    // before reading, or read in chunks.
    let mut file = File::open(file_path).expect("Cannot open file");
    let mut contents = String::new();
    file.read_to_string(&mut contents).expect("Cannot read file");
    println!("\nRead {} bytes via File::open", contents.len());
    // Output: Read 149 bytes via File::open

    // METHOD 3: Read as bytes
    // WHY: Some files aren't valid UTF-8 (images, binary data).
    // fs::read returns Vec<u8> instead of String.
    let bytes = fs::read(file_path).expect("Cannot read bytes");
    println!("File has {} bytes", bytes.len());
    // Output: File has 149 bytes
}

// ============================================================
// 2. READING FILES — LINE BY LINE WITH BufReader
// ============================================================
// WHY: For large files, loading everything into memory is wasteful.
// BufReader reads in chunks (buffered I/O) and the lines() iterator
// processes one line at a time. This is how you handle GB-sized files.

fn demo_buffered_reading() {
    println!("\n--- 2. Buffered Reading (Line by Line) ---\n");

    // Create a larger sample file — list of post offices
    let post_offices = vec![
        "110001,New Delhi GPO,Delhi,Central",
        "400001,Mumbai GPO,Maharashtra,Western",
        "700001,Kolkata GPO,West Bengal,Eastern",
        "600001,Chennai GPO,Tamil Nadu,Southern",
        "560001,Bangalore GPO,Karnataka,Southern",
        "500001,Hyderabad GPO,Telangana,Southern",
        "380001,Ahmedabad GPO,Gujarat,Western",
        "302001,Jaipur GPO,Rajasthan,Northern",
        "226001,Lucknow GPO,Uttar Pradesh,Northern",
        "411001,Pune GPO,Maharashtra,Western",
    ];

    let file_path = "/tmp/rust_demo_post_offices.csv";
    let header = "PIN,Office,State,Region\n";
    let data = post_offices.join("\n");
    fs::write(file_path, format!("{}{}", header, data)).expect("Cannot write");

    // Open file and wrap in BufReader
    // WHY: BufReader adds a buffer (default 8KB) so the OS doesn't
    // make a system call for every single byte read.
    let file = File::open(file_path).expect("Cannot open file");
    let reader = BufReader::new(file);

    println!("Reading post offices (line by line):");
    let mut line_count = 0;
    let mut southern_count = 0;

    // WHY: lines() returns an iterator of Result<String, io::Error>.
    // Each line has the newline character stripped automatically.
    for (i, line_result) in reader.lines().enumerate() {
        match line_result {
            Ok(line) => {
                line_count += 1;
                if i == 0 {
                    println!("Header: {}", line);
                    continue; // Skip header
                }

                // Parse CSV (simplified — use csv crate for real CSV)
                let fields: Vec<&str> = line.split(',').collect();
                if fields.len() == 4 {
                    println!(
                        "  PIN: {}, Office: {}, State: {}, Region: {}",
                        fields[0], fields[1], fields[2], fields[3]
                    );
                    if fields[3] == "Southern" {
                        southern_count += 1;
                    }
                }
            }
            Err(e) => eprintln!("Error reading line {}: {}", i, e),
        }
    }

    println!("\nTotal lines: {}", line_count);
    println!("Southern region offices: {}", southern_count);
    // Output: Total lines: 11
    // Output: Southern region offices: 3

    // BufReader with custom buffer size
    // WHY: For very large files or specific performance needs,
    // you can set the buffer size.
    let file2 = File::open(file_path).expect("Cannot open");
    let _reader_64k = BufReader::with_capacity(64 * 1024, file2); // 64KB buffer
}

// ============================================================
// 3. WRITING FILES
// ============================================================
// WHY: Writing files is how programs save data — logs, configs,
// processed results, exports. Rust gives you multiple ways to
// write, from simple one-liners to buffered streaming writes.

fn demo_writing_files() {
    println!("\n--- 3. Writing Files ---\n");

    // METHOD 1: fs::write — simplest, writes entire content at once
    // WHY: Perfect for small files. Creates or overwrites the file.
    let delivery_report = "Delivery Report #2026-0125\n\
                           Date: 25-Jan-2026\n\
                           Items Delivered: 1,247\n\
                           Items Pending: 83\n\
                           Success Rate: 93.8%\n";

    let report_path = "/tmp/rust_demo_delivery_report.txt";
    fs::write(report_path, delivery_report).expect("Cannot write report");
    println!("Written report to: {}", report_path);

    // Verify
    let content = fs::read_to_string(report_path).unwrap();
    println!("Report content:\n{}", content);
    // Output: Delivery Report #2026-0125
    // Output: Date: 25-Jan-2026
    // Output: ...

    // METHOD 2: File::create + write!
    // WHY: More control — you can write incrementally.
    let log_path = "/tmp/rust_demo_sorting_log.txt";
    let mut file = File::create(log_path).expect("Cannot create file");

    // WHY: write! and writeln! work on any type implementing Write.
    // They return Result, so use ? or expect().
    writeln!(file, "=== Mail Sorting Log ===").expect("write failed");
    writeln!(file, "Shift: Morning (06:00 - 14:00)").expect("write failed");
    writeln!(file, "").expect("write failed");

    let items = vec![
        ("PKG-001", "Delhi", "Mumbai", "Parcel"),
        ("LTR-042", "Chennai", "Bangalore", "Letter"),
        ("REG-007", "Kolkata", "Patna", "Registered"),
    ];

    for (id, from, to, item_type) in &items {
        writeln!(file, "[{}] {} -> {} ({})", id, from, to, item_type)
            .expect("write failed");
    }
    writeln!(file, "\nTotal items sorted: {}", items.len()).expect("write failed");

    println!("Written sorting log to: {}", log_path);

    // METHOD 3: BufWriter — for writing many small pieces efficiently
    // WHY: Like BufReader, BufWriter buffers writes. Without it,
    // each writeln! makes a system call. With it, data accumulates
    // in a buffer and flushes in larger chunks.
    let stats_path = "/tmp/rust_demo_stats.csv";
    let file = File::create(stats_path).expect("Cannot create");
    let mut writer = BufWriter::new(file);

    writeln!(writer, "Month,Letters,Parcels,Revenue").expect("write failed");
    let monthly_data = vec![
        ("January", 15000, 3200, 450000),
        ("February", 12000, 2800, 380000),
        ("March", 18000, 4100, 520000),
        ("April", 14000, 3000, 410000),
    ];

    for (month, letters, parcels, revenue) in &monthly_data {
        writeln!(writer, "{},{},{},{}", month, letters, parcels, revenue)
            .expect("write failed");
    }

    // WHY: BufWriter flushes automatically when dropped, but
    // explicit flush ensures data is written even if an error
    // occurs later that prevents normal Drop.
    writer.flush().expect("flush failed");
    println!("Written stats CSV to: {}", stats_path);
    // Output: Written stats CSV to: /tmp/rust_demo_stats.csv
}

// ============================================================
// 4. APPENDING TO FILES
// ============================================================
// WHY: Often you want to ADD data to an existing file (logs,
// audit trails) without erasing what's already there.

fn demo_appending() {
    println!("\n--- 4. Appending to Files ---\n");

    let log_path = "/tmp/rust_demo_audit.log";

    // Create the initial file
    fs::write(log_path, "=== Audit Log Started ===\n").expect("Cannot create");

    // WHY: OpenOptions gives fine-grained control over how a file
    // is opened. It's the most flexible way to open files.
    let mut file = OpenOptions::new()
        .append(true)     // Open for appending (don't overwrite)
        .open(log_path)   // Open existing file
        .expect("Cannot open for appending");

    // Write multiple log entries
    let entries = vec![
        "09:15 - Mail bag received from Delhi Hub (42 items)",
        "09:22 - Sorting started by Operator #7",
        "09:45 - 3 items flagged for address verification",
        "10:00 - Sorted batch dispatched to local delivery",
    ];

    for entry in &entries {
        writeln!(file, "{}", entry).expect("Cannot append");
    }

    // Read and display the full file
    let content = fs::read_to_string(log_path).unwrap();
    println!("Audit log contents:");
    println!("{}", content);
    // Output: === Audit Log Started ===
    // Output: 09:15 - Mail bag received from Delhi Hub (42 items)
    // Output: 09:22 - Sorting started by Operator #7
    // Output: ...

    // WHY: OpenOptions can also create + append
    let mut file2 = OpenOptions::new()
        .create(true)     // Create if doesn't exist
        .append(true)     // Append if it does exist
        .open(log_path)
        .expect("Cannot open");

    writeln!(file2, "10:30 - Second shift started").expect("Cannot write");
    println!("Appended one more entry.");
}

// ============================================================
// 5. PATH AND PATHBUF — FILE ADDRESSES
// ============================================================
// WHY: Path and PathBuf are to file paths what &str and String
// are to text. Path is a borrowed reference, PathBuf is owned.
// They handle OS-specific path separators correctly (/ vs \).

fn demo_paths() {
    println!("\n--- 5. Paths and PathBuf ---\n");

    // PathBuf — owned, mutable path (like String)
    let mut mail_route = PathBuf::from("/india_post");
    mail_route.push("delhi");
    mail_route.push("central_hub");
    mail_route.push("sorting_room");
    println!("Mail route: {}", mail_route.display());
    // Output: Mail route: /india_post/delhi/central_hub/sorting_room

    // Path — borrowed reference (like &str)
    // WHY: Use Path for function parameters when you don't need ownership
    let route_ref: &Path = mail_route.as_path();
    println!("As Path reference: {}", route_ref.display());

    // Path components
    println!("\nPath components:");
    for component in mail_route.components() {
        println!("  {:?}", component);
    }
    // Output:   RootDir
    // Output:   Normal("india_post")
    // Output:   Normal("delhi")
    // Output:   Normal("central_hub")
    // Output:   Normal("sorting_room")

    // Useful Path methods
    let file_path = Path::new("/home/postmaster/reports/daily_report.pdf");

    println!("\nPath analysis:");
    println!("  Full path:  {}", file_path.display());
    println!("  File name:  {:?}", file_path.file_name());
    // Output: File name: Some("daily_report.pdf")

    println!("  Extension:  {:?}", file_path.extension());
    // Output: Extension: Some("pdf")

    println!("  Stem:       {:?}", file_path.file_stem());
    // Output: Stem: Some("daily_report")

    println!("  Parent:     {:?}", file_path.parent());
    // Output: Parent: Some("/home/postmaster/reports")

    println!("  Is absolute: {}", file_path.is_absolute());
    // Output: Is absolute: true

    // WHY: PathBuf can be modified; Path cannot
    let mut report_path = PathBuf::from("/reports");
    report_path.push("2026");
    report_path.push("january");
    report_path.set_extension("csv");
    println!("\nBuilt path: {}", report_path.display());
    // Output: Built path: /reports/2026/january.csv

    // Joining paths (like Python's os.path.join)
    let base = Path::new("/india_post");
    let full = base.join("delhi").join("inbox").join("letter.txt");
    println!("Joined path: {}", full.display());
    // Output: Joined path: /india_post/delhi/inbox/letter.txt
}

// ============================================================
// 6. CHECKING FILE EXISTENCE AND METADATA
// ============================================================
// WHY: Before reading, writing, or deleting a file, you often
// need to check if it exists and what kind of file it is.

fn demo_file_checks() {
    println!("\n--- 6. File Existence and Metadata ---\n");

    let existing_file = "/tmp/rust_demo_letter.txt";
    let nonexistent = "/tmp/does_not_exist_xyz.txt";

    // Check existence
    println!("'{}' exists: {}", existing_file, Path::new(existing_file).exists());
    println!("'{}' exists: {}", nonexistent, Path::new(nonexistent).exists());
    // Output: '/tmp/rust_demo_letter.txt' exists: true
    // Output: '/tmp/does_not_exist_xyz.txt' exists: false

    // Check if it's a file or directory
    let path = Path::new(existing_file);
    println!("\nIs file: {}", path.is_file());
    println!("Is directory: {}", path.is_dir());
    // Output: Is file: true
    // Output: Is directory: false

    // File metadata
    // WHY: Metadata gives you size, timestamps, and permissions
    // without reading the file content.
    match fs::metadata(existing_file) {
        Ok(meta) => {
            println!("\nFile metadata:");
            println!("  Size: {} bytes", meta.len());
            println!("  Is file: {}", meta.is_file());
            println!("  Is dir: {}", meta.is_dir());
            println!("  Is readonly: {}", meta.permissions().readonly());

            // Timestamps (may not be available on all platforms)
            if let Ok(modified) = meta.modified() {
                println!("  Modified: {:?}", modified);
            }
            if let Ok(created) = meta.created() {
                println!("  Created: {:?}", created);
            }
        }
        Err(e) => eprintln!("Cannot get metadata: {}", e),
    }
}

// ============================================================
// 7. CREATING DIRECTORIES
// ============================================================
// WHY: Organizing files into directories is essential for any
// project. Like India Post creating new sorting bins for new routes.

fn demo_create_directories() {
    println!("\n--- 7. Creating Directories ---\n");

    // Create a single directory
    let dir_path = "/tmp/rust_demo_mailroom";
    match fs::create_dir(dir_path) {
        Ok(()) => println!("Created: {}", dir_path),
        Err(e) if e.kind() == io::ErrorKind::AlreadyExists => {
            println!("Already exists: {}", dir_path);
        }
        Err(e) => eprintln!("Error creating dir: {}", e),
    }

    // Create nested directories (like mkdir -p)
    // WHY: create_dir_all creates all missing parent directories.
    // Without it, you'd need to create each level manually.
    let nested_path = "/tmp/rust_demo_mailroom/delhi/central/zone_a";
    fs::create_dir_all(nested_path).expect("Cannot create nested dirs");
    println!("Created nested: {}", nested_path);

    // Create files in the new directory structure
    let file_in_dir = format!("{}/tracking.txt", nested_path);
    fs::write(&file_in_dir, "PKG-001: In Transit\nPKG-002: Delivered\n")
        .expect("Cannot write");
    println!("Created file: {}", file_in_dir);
    // Output: Created file: /tmp/rust_demo_mailroom/delhi/central/zone_a/tracking.txt
}

// ============================================================
// 8. COPYING, RENAMING, AND DELETING FILES
// ============================================================
// WHY: These are the basic file management operations.
// Like India Post moving letters between bins, making copies
// for records, and discarding processed items.

fn demo_file_operations() {
    println!("\n--- 8. Copy, Rename, Delete ---\n");

    let original = "/tmp/rust_demo_original.txt";
    let copy_path = "/tmp/rust_demo_copy.txt";
    let renamed_path = "/tmp/rust_demo_renamed.txt";

    // Create original file
    fs::write(original, "Original letter content: Important notice from GPO")
        .expect("Cannot write");
    println!("Created original: {}", original);

    // COPY a file
    // WHY: fs::copy preserves file content and returns the number
    // of bytes copied. It overwrites the destination if it exists.
    match fs::copy(original, copy_path) {
        Ok(bytes) => println!("Copied {} bytes to: {}", bytes, copy_path),
        Err(e) => eprintln!("Copy failed: {}", e),
    }
    // Output: Copied 49 bytes to: /tmp/rust_demo_copy.txt

    // RENAME (move) a file
    // WHY: fs::rename works like the `mv` command. It can move files
    // across directories (on the same filesystem).
    match fs::rename(copy_path, renamed_path) {
        Ok(()) => println!("Renamed to: {}", renamed_path),
        Err(e) => eprintln!("Rename failed: {}", e),
    }
    // Output: Renamed to: /tmp/rust_demo_renamed.txt

    // Verify the rename worked
    println!("Original exists: {}", Path::new(original).exists());
    println!("Copy exists: {}", Path::new(copy_path).exists());       // false — it was renamed
    println!("Renamed exists: {}", Path::new(renamed_path).exists());
    // Output: Original exists: true
    // Output: Copy exists: false
    // Output: Renamed exists: true

    // DELETE a file
    // WHY: fs::remove_file permanently deletes a file. There's no
    // "recycle bin" — be careful!
    match fs::remove_file(renamed_path) {
        Ok(()) => println!("Deleted: {}", renamed_path),
        Err(e) => eprintln!("Delete failed: {}", e),
    }
    // Output: Deleted: /tmp/rust_demo_renamed.txt

    // DELETE a directory
    // fs::remove_dir — removes empty directory only
    // fs::remove_dir_all — removes directory and ALL contents (like rm -rf)
    // WHY: remove_dir_all is dangerous — it's recursive and permanent!
    // Always double-check the path before calling it.

    // Clean up demo directory
    let demo_dir = "/tmp/rust_demo_mailroom";
    if Path::new(demo_dir).exists() {
        fs::remove_dir_all(demo_dir).expect("Cannot remove dir");
        println!("Removed directory tree: {}", demo_dir);
    }
    // Output: Removed directory tree: /tmp/rust_demo_mailroom
}

// ============================================================
// 9. ITERATING DIRECTORY ENTRIES
// ============================================================
// WHY: Listing files in a directory is essential for batch
// processing. Like a postmaster checking every item in a bin.

fn demo_directory_iteration() {
    println!("\n--- 9. Directory Iteration ---\n");

    // Create a demo directory with files
    let demo_dir = "/tmp/rust_demo_sorting_room";
    fs::create_dir_all(demo_dir).expect("Cannot create dir");

    // Create some sample files
    let files = vec![
        ("letter_001.txt", "Letter from Delhi"),
        ("parcel_002.txt", "Parcel for Mumbai"),
        ("registered_003.txt", "Registered mail for Chennai"),
        ("letter_004.txt", "Letter from Jaipur"),
        ("speed_post_005.txt", "Speed post for Bangalore"),
    ];

    for (name, content) in &files {
        let path = format!("{}/{}", demo_dir, name);
        fs::write(&path, content).expect("Cannot write");
    }

    // Create a subdirectory
    fs::create_dir_all(format!("{}/outbox", demo_dir)).expect("Cannot create");

    // Iterate directory entries
    // WHY: fs::read_dir returns an iterator of Result<DirEntry>.
    // Each DirEntry gives you the file name, path, and type.
    println!("Contents of {}:", demo_dir);
    match fs::read_dir(demo_dir) {
        Ok(entries) => {
            let mut file_count = 0;
            let mut dir_count = 0;

            for entry_result in entries {
                match entry_result {
                    Ok(entry) => {
                        let path = entry.path();
                        let file_type = entry.file_type().expect("Cannot get type");
                        let name = entry.file_name();

                        if file_type.is_file() {
                            let meta = entry.metadata().expect("Cannot get metadata");
                            println!("  [FILE] {:?} ({} bytes)", name, meta.len());
                            file_count += 1;
                        } else if file_type.is_dir() {
                            println!("  [DIR]  {:?}/", name);
                            dir_count += 1;
                        } else {
                            println!("  [OTHER] {}", path.display());
                        }
                    }
                    Err(e) => eprintln!("  Error reading entry: {}", e),
                }
            }

            println!("\nSummary: {} files, {} directories", file_count, dir_count);
            // Output: Summary: 5 files, 1 directories
        }
        Err(e) => eprintln!("Cannot read directory: {}", e),
    }

    // Filter files by extension
    println!("\nOnly .txt files:");
    if let Ok(entries) = fs::read_dir(demo_dir) {
        for entry in entries.flatten() {
            // WHY: flatten() skips Err entries — convenient but hides errors
            let path = entry.path();
            if path.extension().map_or(false, |ext| ext == "txt") {
                println!("  {}", path.file_name().unwrap().to_string_lossy());
            }
        }
    }

    // Clean up
    fs::remove_dir_all(demo_dir).expect("Cannot clean up");
    println!("\nCleaned up demo directory.");
}

// ============================================================
// 10. PRACTICAL EXAMPLE — LOG FILE PROCESSOR
// ============================================================
// WHY: Let's combine everything into a realistic example that
// reads log files, processes them, and writes a summary report.

fn demo_practical_example() {
    println!("\n--- 10. Practical Example: Log Processor ---\n");

    // Setup: Create sample log files
    let log_dir = "/tmp/rust_demo_post_logs";
    fs::create_dir_all(log_dir).expect("Cannot create log dir");

    let log1 = format!("{}/delivery_north.log", log_dir);
    let log2 = format!("{}/delivery_south.log", log_dir);

    fs::write(&log1, "\
DELIVERED PKG-101 Delhi 2026-01-25
FAILED PKG-102 Lucknow 2026-01-25
DELIVERED PKG-103 Jaipur 2026-01-25
DELIVERED PKG-104 Chandigarh 2026-01-25
FAILED PKG-105 Agra 2026-01-25
DELIVERED PKG-106 Delhi 2026-01-25
").expect("Cannot write log1");

    fs::write(&log2, "\
DELIVERED PKG-201 Chennai 2026-01-25
DELIVERED PKG-202 Bangalore 2026-01-25
FAILED PKG-203 Hyderabad 2026-01-25
DELIVERED PKG-204 Kochi 2026-01-25
DELIVERED PKG-205 Mysore 2026-01-25
").expect("Cannot write log2");

    // Process all log files in the directory
    let mut total_delivered = 0u32;
    let mut total_failed = 0u32;
    let mut failed_items: Vec<String> = Vec::new();

    if let Ok(entries) = fs::read_dir(log_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.extension().map_or(false, |ext| ext == "log") {
                println!("Processing: {}", path.file_name().unwrap().to_string_lossy());

                let file = File::open(&path).expect("Cannot open log");
                let reader = BufReader::new(file);

                for line in reader.lines().flatten() {
                    let parts: Vec<&str> = line.split_whitespace().collect();
                    if parts.len() >= 3 {
                        match parts[0] {
                            "DELIVERED" => total_delivered += 1,
                            "FAILED" => {
                                total_failed += 1;
                                failed_items.push(format!(
                                    "{} ({})",
                                    parts[1], parts[2]
                                ));
                            }
                            _ => {}
                        }
                    }
                }
            }
        }
    }

    // Write the summary report
    let report_path = format!("{}/summary_report.txt", log_dir);
    let report_file = File::create(&report_path).expect("Cannot create report");
    let mut writer = BufWriter::new(report_file);

    writeln!(writer, "================================").unwrap();
    writeln!(writer, "  INDIA POST DELIVERY SUMMARY").unwrap();
    writeln!(writer, "  Date: 25-Jan-2026").unwrap();
    writeln!(writer, "================================").unwrap();
    writeln!(writer, "").unwrap();
    writeln!(writer, "Total Delivered: {}", total_delivered).unwrap();
    writeln!(writer, "Total Failed:    {}", total_failed).unwrap();
    let total = total_delivered + total_failed;
    let rate = if total > 0 {
        (total_delivered as f64 / total as f64) * 100.0
    } else {
        0.0
    };
    writeln!(writer, "Success Rate:    {:.1}%", rate).unwrap();
    writeln!(writer, "").unwrap();

    if !failed_items.is_empty() {
        writeln!(writer, "Failed Deliveries:").unwrap();
        for item in &failed_items {
            writeln!(writer, "  - {}", item).unwrap();
        }
    }

    writer.flush().unwrap();

    // Display the report
    let report = fs::read_to_string(&report_path).unwrap();
    println!("\nGenerated Report:\n{}", report);
    // Output:
    // ================================
    //   INDIA POST DELIVERY SUMMARY
    //   Date: 25-Jan-2026
    // ================================
    //
    // Total Delivered: 8
    // Total Failed:    3
    // Success Rate:    72.7%
    //
    // Failed Deliveries:
    //   - PKG-102 (Lucknow)
    //   - PKG-105 (Agra)
    //   - PKG-203 (Hyderabad)

    // Clean up
    fs::remove_dir_all(log_dir).expect("Cannot clean up");
    println!("Cleaned up log directory.");
}

// ============================================================
// MAIN FUNCTION
// ============================================================

fn main() {
    println!("=== Rust File I/O ===\n");

    demo_read_to_string();
    demo_buffered_reading();
    demo_writing_files();
    demo_appending();
    demo_paths();
    demo_file_checks();
    demo_create_directories();
    demo_file_operations();
    demo_directory_iteration();
    demo_practical_example();

    // Final cleanup
    let cleanup_files = vec![
        "/tmp/rust_demo_letter.txt",
        "/tmp/rust_demo_post_offices.csv",
        "/tmp/rust_demo_delivery_report.txt",
        "/tmp/rust_demo_sorting_log.txt",
        "/tmp/rust_demo_stats.csv",
        "/tmp/rust_demo_audit.log",
        "/tmp/rust_demo_original.txt",
    ];

    for path in cleanup_files {
        let _ = fs::remove_file(path); // Ignore errors for cleanup
    }
    println!("\n=== File I/O Complete ===");
}

// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. fs::read_to_string() is the simplest way to read a file.
//    Use BufReader for large files to avoid loading everything
//    into memory at once.
//
// 2. fs::write() is the simplest way to write. Use BufWriter
//    for many small writes (like writing logs line by line).
//
// 3. OpenOptions gives fine-grained control: append, create,
//    read, write, truncate. Use it when fs::write isn't enough.
//
// 4. Path (borrowed) and PathBuf (owned) handle file paths.
//    Use .join(), .push(), .extension(), .file_name() for
//    cross-platform path manipulation.
//
// 5. Always check file existence with Path::exists() before
//    operations that assume a file is there.
//
// 6. fs::create_dir_all() creates nested directories (like mkdir -p).
//    fs::remove_dir_all() removes a directory tree (like rm -rf).
//
// 7. fs::copy() copies files, fs::rename() moves/renames them,
//    fs::remove_file() deletes them. All return Result.
//
// 8. fs::read_dir() iterates directory entries. Use .flatten()
//    for convenience, or match on each Result for error handling.
//
// 9. All file operations return Result — Rust forces you to
//    handle I/O errors explicitly. No silent failures.
//
// 10. Think of file I/O like India Post: letters arrive (read),
//     get sorted (Path), stamped (write), and dispatched (copy/
//     move/delete). The sorting room (directory) organizes everything.
// ============================================================
