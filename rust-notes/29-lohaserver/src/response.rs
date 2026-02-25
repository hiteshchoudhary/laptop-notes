use std::collections::HashMap;

/// Represents an HTTP response that will be sent back to the client.
///
/// Analogy: This is the printed ticket the IRCTC counter hands back
/// to the passenger — status (confirmed / waitlisted), details, and
/// the ticket itself (body).
#[derive(Debug)]
pub struct HttpResponse {
    pub status_code: u16,
    pub status_text: String,
    pub headers: HashMap<String, String>,
    pub body: Vec<u8>,
}

impl HttpResponse {
    // ----------------------------------------------------------------
    // Builder-style constructors
    // ----------------------------------------------------------------

    /// Create a new response with just a status code.
    pub fn new(status_code: u16, status_text: &str) -> Self {
        HttpResponse {
            status_code,
            status_text: status_text.to_string(),
            headers: HashMap::new(),
            body: Vec::new(),
        }
    }

    /// 200 OK with an HTML body.
    pub fn html(body: &str) -> Self {
        let mut resp = Self::new(200, "OK");
        resp.set_header("Content-Type", "text/html; charset=utf-8");
        resp.body = body.as_bytes().to_vec();
        resp
    }

    /// 200 OK with a JSON body.
    pub fn json(body: &str) -> Self {
        let mut resp = Self::new(200, "OK");
        resp.set_header("Content-Type", "application/json; charset=utf-8");
        resp.body = body.as_bytes().to_vec();
        resp
    }

    /// 200 OK with plain text.
    pub fn ok(body: &str) -> Self {
        let mut resp = Self::new(200, "OK");
        resp.set_header("Content-Type", "text/plain; charset=utf-8");
        resp.body = body.as_bytes().to_vec();
        resp
    }

    /// 404 Not Found with an HTML body.
    pub fn not_found(body: &str) -> Self {
        let mut resp = Self::new(404, "Not Found");
        resp.set_header("Content-Type", "text/html; charset=utf-8");
        resp.body = body.as_bytes().to_vec();
        resp
    }

    /// 200 OK with raw bytes and a given content type (for static files).
    pub fn bytes(content_type: &str, data: Vec<u8>) -> Self {
        let mut resp = Self::new(200, "OK");
        resp.set_header("Content-Type", content_type);
        resp.body = data;
        resp
    }

    // ----------------------------------------------------------------
    // Header helpers
    // ----------------------------------------------------------------

    /// Set a response header.
    pub fn set_header(&mut self, key: &str, value: &str) {
        self.headers.insert(key.to_string(), value.to_string());
    }

    // ----------------------------------------------------------------
    // Serialization
    // ----------------------------------------------------------------

    /// Serialize the response into bytes ready to write to the TCP stream.
    ///
    /// Auto-sets Content-Length and a default Server header.
    pub fn to_bytes(&mut self) -> Vec<u8> {
        // Auto-set Content-Length
        self.headers.insert(
            "Content-Length".to_string(),
            self.body.len().to_string(),
        );

        // Server header
        if !self.headers.contains_key("Server") {
            self.headers
                .insert("Server".to_string(), "LohaServer/0.1".to_string());
        }

        // Connection header
        if !self.headers.contains_key("Connection") {
            self.headers
                .insert("Connection".to_string(), "close".to_string());
        }

        // Build the response line + headers
        let mut head = format!("HTTP/1.1 {} {}\r\n", self.status_code, self.status_text);

        for (key, value) in &self.headers {
            head.push_str(&format!("{}: {}\r\n", key, value));
        }
        head.push_str("\r\n");

        // Concatenate head + body
        let mut output = head.into_bytes();
        output.extend_from_slice(&self.body);
        output
    }
}
