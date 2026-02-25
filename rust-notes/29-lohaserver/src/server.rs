use std::io::Write;
use std::net::{TcpListener, TcpStream};

use crate::request::HttpRequest;
use crate::router::Router;
use crate::thread_pool::ThreadPool;

/// The main server struct that ties together the listener, thread pool,
/// and router.
///
/// Analogy: The railway station building itself — it has an entrance
/// gate (TcpListener), booking counters (ThreadPool), and a sign board
/// (Router).
pub struct Server {
    listener: TcpListener,
    pool: ThreadPool,
}

impl Server {
    /// Bind to the given address and create the thread pool.
    pub fn new(addr: &str, pool_size: usize) -> Self {
        let listener =
            TcpListener::bind(addr).unwrap_or_else(|e| {
                eprintln!("Failed to bind to {}: {}", addr, e);
                std::process::exit(1);
            });

        let pool = ThreadPool::new(pool_size);

        Server { listener, pool }
    }

    /// Start accepting connections in an infinite loop.
    ///
    /// Each incoming connection is dispatched to the thread pool where
    /// a worker will parse the request, route it, and write back the
    /// response.
    pub fn run(&self) {
        println!(
            "[Server] Listening on {}",
            self.listener.local_addr().unwrap()
        );

        for stream in self.listener.incoming() {
            match stream {
                Ok(stream) => {
                    self.pool.execute(move || {
                        Self::handle_connection(stream);
                    });
                }
                Err(e) => {
                    eprintln!("[Server] Failed to accept connection: {}", e);
                }
            }
        }
    }

    /// Handle a single HTTP connection: parse request -> route -> write
    /// response.
    fn handle_connection(mut stream: TcpStream) {
        // Set a read timeout so we don't block forever on slow clients.
        let _ = stream.set_read_timeout(Some(std::time::Duration::from_secs(5)));

        let peer = stream
            .peer_addr()
            .map(|a| a.to_string())
            .unwrap_or_else(|_| "unknown".to_string());

        // Parse the request
        let request = match HttpRequest::from_stream(&mut stream) {
            Ok(req) => req,
            Err(e) => {
                eprintln!("[Server] Bad request from {}: {}", peer, e);
                let _ = stream.write_all(b"HTTP/1.1 400 Bad Request\r\n\r\n");
                return;
            }
        };

        println!(
            "[Server] {} {} {} from {}",
            request.method, request.path, request.version, peer
        );

        // Route the request
        let router = Router::new();
        let mut response = router.dispatch(&request);

        // Write the response
        let bytes = response.to_bytes();
        if let Err(e) = stream.write_all(&bytes) {
            eprintln!("[Server] Failed to write response to {}: {}", peer, e);
        }
        let _ = stream.flush();
    }
}
