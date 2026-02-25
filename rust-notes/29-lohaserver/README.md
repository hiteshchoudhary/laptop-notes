# LohaServer -- Multi-Threaded HTTP Server from Scratch

A multi-threaded HTTP server built entirely with Rust's standard library.
No frameworks, no external crates -- just `std`.

## Analogy: IRCTC Reservation System

Think of LohaServer like the IRCTC booking system during Tatkal hours:

- **TcpListener** is the main entrance gate at the railway station -- it accepts
  every incoming passenger (connection).
- **ThreadPool** is the row of booking counters. Instead of one clerk handling
  everyone sequentially, multiple clerks (worker threads) serve passengers
  concurrently.
- **Router** is the sign board that directs passengers to the right counter --
  PNR enquiry, new booking, cancellation, etc.
- **Request / Response** are the booking form you fill in and the printed
  ticket you receive back.
- **mpsc channel** is the token queue -- passengers pick a token and wait for
  the next available counter.

If there were only one counter (single-threaded), the queue would stretch to
the parking lot. Multiple counters (thread pool) keep things moving.

## Architecture Overview

```
Client Request
      |
      v
 TcpListener (server.rs)       -- accepts TCP connections
      |
      v
 ThreadPool (thread_pool.rs)   -- dispatches work to N workers
      |
      v
 HttpRequest (request.rs)      -- parses raw bytes into structured request
      |
      v
 Router (router.rs)            -- matches method + path to handler
      |
      v
 Handler (handler.rs)          -- business logic, builds response
      |
      v
 HttpResponse (response.rs)    -- serializes response back to bytes
      |
      v
 TcpStream::write              -- sends response to client
```

## How to Build and Run

```bash
# Build
cargo build

# Run (starts on 127.0.0.1:7878)
cargo run

# Then open your browser
# http://localhost:7878
```

## Available Routes

| Method | Path        | Description                        |
|--------|-------------|------------------------------------|
| GET    | /           | Welcome home page                  |
| GET    | /about      | About this server                  |
| GET    | /echo       | Echoes back your request as JSON   |
| GET    | /json       | Sample JSON data (train schedule)  |
| GET    | /health     | Health check endpoint              |
| GET    | /public/*   | Static file serving from /public   |

Any unmatched route returns a styled 404 page.

## Key Concepts Covered

- **TCP networking** with `std::net::TcpListener` and `TcpStream`
- **Multi-threading** with `std::thread::spawn`
- **Channel-based work distribution** with `std::sync::mpsc`
- **Shared state** with `Arc<Mutex<T>>`
- **HTTP protocol parsing** (request line, headers, body)
- **HTTP response construction** (status line, headers, body)
- **Router pattern matching** (method + path dispatch)
- **Static file serving** with MIME type detection
- **Path traversal prevention** (security)
- **Graceful shutdown** with `Drop` trait
- **Builder pattern** for response construction
