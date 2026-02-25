use std::collections::HashMap;
use std::io::{BufRead, BufReader, Read};
use std::net::TcpStream;

/// Represents a parsed HTTP request.
///
/// Analogy: This is the booking form a passenger fills out at the IRCTC
/// counter — it captures *what* they want (method), *where* they want
/// to go (path), and any extra details (headers, body).
#[derive(Debug)]
pub struct HttpRequest {
    pub method: String,
    pub path: String,
    pub version: String,
    pub headers: HashMap<String, String>,
    pub body: String,
    pub query_string: HashMap<String, String>,
}

impl HttpRequest {
    /// Parse an HTTP request from a raw TCP stream.
    ///
    /// Reads the request line, headers, and optional body based on
    /// Content-Length.
    pub fn from_stream(stream: &mut TcpStream) -> Result<Self, String> {
        let mut reader = BufReader::new(stream.try_clone().map_err(|e| e.to_string())?);

        // --- 1. Read the request line (e.g. "GET /about HTTP/1.1") ---
        let mut request_line = String::new();
        reader
            .read_line(&mut request_line)
            .map_err(|e| format!("Failed to read request line: {}", e))?;

        let request_line = request_line.trim().to_string();
        if request_line.is_empty() {
            return Err("Empty request line".to_string());
        }

        let parts: Vec<&str> = request_line.splitn(3, ' ').collect();
        if parts.len() < 3 {
            return Err(format!("Malformed request line: {}", request_line));
        }

        let method = parts[0].to_uppercase();
        let full_path = parts[1].to_string();
        let version = parts[2].to_string();

        // --- 2. Split path and query string ---
        let (path, query_string) = Self::parse_path_and_query(&full_path);

        // --- 3. Parse headers ---
        let mut headers = HashMap::new();
        loop {
            let mut line = String::new();
            reader
                .read_line(&mut line)
                .map_err(|e| format!("Failed to read header: {}", e))?;
            let line = line.trim().to_string();
            if line.is_empty() {
                break; // blank line = end of headers
            }
            if let Some((key, value)) = line.split_once(':') {
                headers.insert(
                    key.trim().to_lowercase(),
                    value.trim().to_string(),
                );
            }
        }

        // --- 4. Read body if Content-Length is present ---
        let body = if let Some(len_str) = headers.get("content-length") {
            let len: usize = len_str.parse().unwrap_or(0);
            if len > 0 {
                let mut buf = vec![0u8; len];
                reader
                    .read_exact(&mut buf)
                    .map_err(|e| format!("Failed to read body: {}", e))?;
                String::from_utf8_lossy(&buf).to_string()
            } else {
                String::new()
            }
        } else {
            String::new()
        };

        Ok(HttpRequest {
            method,
            path,
            version,
            headers,
            body,
            query_string,
        })
    }

    /// Splits "/echo?name=rust&version=1" into the path and a query map.
    fn parse_path_and_query(full_path: &str) -> (String, HashMap<String, String>) {
        let mut query_map = HashMap::new();

        if let Some((path, qs)) = full_path.split_once('?') {
            for pair in qs.split('&') {
                if let Some((k, v)) = pair.split_once('=') {
                    query_map.insert(
                        Self::url_decode(k),
                        Self::url_decode(v),
                    );
                } else if !pair.is_empty() {
                    query_map.insert(Self::url_decode(pair), String::new());
                }
            }
            (path.to_string(), query_map)
        } else {
            (full_path.to_string(), query_map)
        }
    }

    /// Minimal percent-decoding (%20 -> space, %2F -> /, etc.)
    fn url_decode(input: &str) -> String {
        let mut result = String::with_capacity(input.len());
        let mut chars = input.chars();

        while let Some(c) = chars.next() {
            if c == '%' {
                let hex: String = chars.by_ref().take(2).collect();
                if let Ok(byte) = u8::from_str_radix(&hex, 16) {
                    result.push(byte as char);
                } else {
                    result.push('%');
                    result.push_str(&hex);
                }
            } else if c == '+' {
                result.push(' ');
            } else {
                result.push(c);
            }
        }

        result
    }
}
