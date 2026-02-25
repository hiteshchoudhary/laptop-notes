// ============================================================
// 27. HTTP BASICS WITH REQWEST IN RUST
// ============================================================
// WHY THIS MATTERS:
// Almost every modern application communicates over HTTP — calling
// REST APIs, fetching data, sending webhooks, integrating with
// third-party services. Reqwest is Rust's most popular HTTP client
// library, built on top of hyper and tokio. It provides both
// blocking and async APIs, handles TLS, cookies, redirects, and
// timeouts out of the box. If you're building anything that talks
// to the internet, reqwest is your go-to tool.
// ============================================================

// ============================================================
// CARGO.TOML — Required dependencies
// ============================================================
// Add these to your Cargo.toml to compile this file:
//
// [package]
// name = "http-basics-demo"
// version = "0.1.0"
// edition = "2021"
//
// [dependencies]
// reqwest = { version = "0.12", features = ["json", "blocking"] }
// tokio = { version = "1", features = ["full"] }
// serde = { version = "1.0", features = ["derive"] }
// serde_json = "1.0"
// ============================================================

// ============================================================
// STORY: PAYTM RECHARGE SYSTEM
// ============================================================
// Imagine you're building the backend for Paytm's mobile recharge
// system. Here's the flow:
//
// 1. A user opens Paytm and enters their phone number and
//    recharge amount. Your server needs to call the TELECOM API
//    to process the recharge.
//
// 2. STEP 1 — GET request: First, you query the telecom API to
//    check the user's current plan and balance.
//    GET https://api.telecom.in/v1/subscriber/9876543210
//    Headers: Authorization: Bearer <token>
//
// 3. STEP 2 — POST request: Then you send the recharge request
//    with a JSON body containing the plan details.
//    POST https://api.telecom.in/v1/recharge
//    Body: {"phone": "9876543210", "plan_id": "RC399", "amount": 399}
//
// 4. STEP 3 — Handle the response: The API returns success or
//    failure with details. You parse the JSON response and update
//    the user's transaction history.
//
// 5. TIMEOUTS: If the telecom API takes too long (network issues,
//    server overload), your request times out and you show the user
//    "Transaction pending, please check later."
//
// 6. ERROR HANDLING: Network failures, 4xx/5xx responses, invalid
//    JSON — your code must handle all of these gracefully.
//
// Reqwest handles all these patterns. Let's explore each one.
// ============================================================

use serde::{Serialize, Deserialize};
use std::collections::HashMap;
use std::time::Duration;

// ============================================================
// 1. BASIC GET REQUEST
// ============================================================
// WHY: GET requests fetch data from a server. This is the most
// common HTTP operation — loading web pages, fetching API data,
// downloading files. It's how Paytm checks a subscriber's details.

// Data structures for our telecom API simulation
#[derive(Debug, Serialize, Deserialize)]
struct Subscriber {
    phone: String,
    name: String,
    operator: String,
    current_plan: String,
    balance: f64,
    is_active: bool,
}

#[derive(Debug, Serialize, Deserialize)]
struct ApiResponse<T> {
    success: bool,
    message: String,
    data: Option<T>,
}

#[derive(Debug, Serialize, Deserialize)]
struct RechargeRequest {
    phone: String,
    plan_id: String,
    amount: f64,
    payment_method: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct RechargeResponse {
    transaction_id: String,
    status: String,
    phone: String,
    amount: f64,
    new_balance: f64,
}

// --- Async GET request example ---
// WHY: The async version is preferred for production code because
// it doesn't block the thread while waiting for the response.
async fn demo_get_request() {
    println!("--- 1. Basic GET Request ---\n");

    // Create a reqwest client
    // WHY: The Client is reusable and manages connection pooling,
    // TLS sessions, and cookies. Create one and reuse it.
    let client = reqwest::Client::new();

    // Simple GET request
    // WHY: We use a public test API (httpbin.org) for demonstration.
    // In production, this would be your telecom API endpoint.
    println!("Sending GET request to httpbin.org/get...");
    match client.get("https://httpbin.org/get").send().await {
        Ok(response) => {
            println!("Status: {}", response.status());
            // Output: Status: 200 OK

            println!("Content-Type: {:?}", response.headers().get("content-type"));
            // Output: Content-Type: Some("application/json")

            // Read the body as text
            match response.text().await {
                Ok(body) => {
                    // Truncate for display
                    let preview = if body.len() > 200 {
                        format!("{}... ({} bytes total)", &body[..200], body.len())
                    } else {
                        body.clone()
                    };
                    println!("Body preview: {}", preview);
                }
                Err(e) => eprintln!("Error reading body: {}", e),
            }
        }
        Err(e) => {
            eprintln!("Request failed: {}", e);
            println!("(This is expected if you're offline)");
        }
    }

    // GET with query parameters
    // WHY: Query params are the standard way to pass parameters
    // in GET requests: /search?q=term&page=1
    println!("\nGET with query parameters:");
    match client
        .get("https://httpbin.org/get")
        .query(&[("phone", "9876543210"), ("operator", "jio")])
        .send()
        .await
    {
        Ok(resp) => println!("Status: {} (query params sent!)", resp.status()),
        Err(e) => eprintln!("Request failed: {}", e),
    }
    // The URL becomes: https://httpbin.org/get?phone=9876543210&operator=jio
}

// ============================================================
// 2. GET REQUEST WITH HEADERS
// ============================================================
// WHY: Almost all real APIs require headers — authentication tokens,
// content types, API keys, custom headers. Like showing your ID
// before accessing the telecom API.

async fn demo_get_with_headers() {
    println!("\n--- 2. GET with Headers ---\n");

    let client = reqwest::Client::new();

    // WHY: header() adds individual headers. For auth, the standard
    // is the "Authorization" header with a "Bearer <token>" value.
    match client
        .get("https://httpbin.org/headers")
        .header("Authorization", "Bearer paytm-api-key-xyz789")
        .header("X-Request-ID", "REQ-2026-001234")
        .header("Accept", "application/json")
        .header("X-Client-Version", "2.1.0")
        .send()
        .await
    {
        Ok(response) => {
            println!("Status: {}", response.status());
            // httpbin.org/headers echoes back the headers we sent
            if let Ok(body) = response.text().await {
                println!("Response (echoed headers):\n{}", body);
            }
        }
        Err(e) => eprintln!("Request failed: {}", e),
    }

    // Using HeaderMap for multiple headers
    // WHY: HeaderMap is useful when you need to build headers
    // dynamically or pass them around.
    println!("\nUsing reqwest::header::HeaderMap:");

    use reqwest::header::{HeaderMap, HeaderValue, AUTHORIZATION, CONTENT_TYPE, USER_AGENT};

    let mut headers = HeaderMap::new();
    headers.insert(AUTHORIZATION, HeaderValue::from_static("Bearer my-token"));
    headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));
    headers.insert(USER_AGENT, HeaderValue::from_static("PaytmRechargeBot/2.1"));

    // Create a client with default headers
    // WHY: Default headers are sent with EVERY request from this client.
    // Perfect for auth tokens that don't change between requests.
    let client_with_defaults = reqwest::Client::builder()
        .default_headers(headers)
        .build()
        .expect("Cannot build client");

    match client_with_defaults
        .get("https://httpbin.org/headers")
        .send()
        .await
    {
        Ok(resp) => println!("Status with default headers: {}", resp.status()),
        Err(e) => eprintln!("Failed: {}", e),
    }
}

// ============================================================
// 3. POST REQUEST WITH JSON BODY
// ============================================================
// WHY: POST requests send data to a server — creating resources,
// submitting forms, processing transactions. This is how Paytm
// sends the recharge request to the telecom API.

async fn demo_post_request() {
    println!("\n--- 3. POST Request with JSON ---\n");

    let client = reqwest::Client::new();

    // Method 1: Using .json() with a serializable struct
    // WHY: .json() automatically serializes the struct and sets
    // Content-Type: application/json. Clean and type-safe.
    let recharge = RechargeRequest {
        phone: String::from("9876543210"),
        plan_id: String::from("RC399"),
        amount: 399.0,
        payment_method: String::from("paytm_wallet"),
    };

    println!("Sending POST with JSON body...");
    match client
        .post("https://httpbin.org/post")
        .json(&recharge)
        .send()
        .await
    {
        Ok(response) => {
            println!("Status: {}", response.status());
            // Output: Status: 200 OK
            if let Ok(body) = response.text().await {
                // httpbin echoes back what we sent
                let preview = if body.len() > 300 {
                    format!("{}...", &body[..300])
                } else {
                    body
                };
                println!("Response preview: {}", preview);
            }
        }
        Err(e) => eprintln!("POST failed: {}", e),
    }

    // Method 2: Using a HashMap (for dynamic JSON)
    // WHY: When you don't have a struct, HashMap works as a quick
    // way to build JSON objects.
    println!("\nPOST with HashMap body:");
    let mut body_map = HashMap::new();
    body_map.insert("action", "check_balance");
    body_map.insert("phone", "9876543210");
    body_map.insert("operator", "jio");

    match client
        .post("https://httpbin.org/post")
        .json(&body_map)
        .send()
        .await
    {
        Ok(resp) => println!("Status: {}", resp.status()),
        Err(e) => eprintln!("Failed: {}", e),
    }

    // Method 3: Raw JSON string body
    // WHY: Sometimes you have pre-built JSON (from a config file,
    // another API, etc.) and just want to forward it.
    println!("\nPOST with raw JSON string:");
    let raw_json = r#"{"event": "recharge_completed", "txn_id": "TXN-001"}"#;

    match client
        .post("https://httpbin.org/post")
        .header("Content-Type", "application/json")
        .body(raw_json.to_string())
        .send()
        .await
    {
        Ok(resp) => println!("Status: {}", resp.status()),
        Err(e) => eprintln!("Failed: {}", e),
    }
}

// ============================================================
// 4. PARSING JSON RESPONSES
// ============================================================
// WHY: Most APIs return JSON. Reqwest can automatically deserialize
// the response body into your Rust structs using serde.

#[derive(Debug, Deserialize)]
struct HttpBinResponse {
    origin: String,
    url: String,
    headers: HashMap<String, String>,
    #[serde(default)]
    args: HashMap<String, String>,
}

async fn demo_json_response() {
    println!("\n--- 4. Parsing JSON Responses ---\n");

    let client = reqwest::Client::new();

    // Method 1: Automatic deserialization with .json()
    // WHY: .json::<T>() deserializes the response body directly
    // into type T. If the JSON doesn't match, you get a clear error.
    println!("Deserializing response into struct...");
    match client
        .get("https://httpbin.org/get")
        .query(&[("phone", "9876543210")])
        .send()
        .await
    {
        Ok(response) => {
            match response.json::<HttpBinResponse>().await {
                Ok(data) => {
                    println!("Origin IP: {}", data.origin);
                    println!("URL called: {}", data.url);
                    println!("Args: {:?}", data.args);
                    // Output: Origin IP: <your IP>
                    // Output: URL called: https://httpbin.org/get?phone=9876543210
                    // Output: Args: {"phone": "9876543210"}
                }
                Err(e) => eprintln!("JSON parse error: {}", e),
            }
        }
        Err(e) => eprintln!("Request failed: {}", e),
    }

    // Method 2: Parse as dynamic serde_json::Value
    // WHY: When you don't know the response structure, Value handles
    // any valid JSON. Useful for exploratory API work.
    println!("\nParsing as dynamic Value...");
    match client.get("https://httpbin.org/get").send().await {
        Ok(response) => {
            match response.json::<serde_json::Value>().await {
                Ok(value) => {
                    println!("Origin: {}", value["origin"]);
                    println!("Host header: {}", value["headers"]["Host"]);
                    // Output: Origin: <your IP>
                    // Output: Host header: "httpbin.org"
                }
                Err(e) => eprintln!("Parse error: {}", e),
            }
        }
        Err(e) => eprintln!("Request failed: {}", e),
    }
}

// ============================================================
// 5. TIMEOUT CONFIGURATION
// ============================================================
// WHY: Network requests can hang indefinitely if a server is slow
// or unreachable. Timeouts prevent your application from freezing.
// In the Paytm scenario, if the telecom API hangs, you can't keep
// the user waiting forever — show "pending" after a timeout.

async fn demo_timeouts() {
    println!("\n--- 5. Timeout Configuration ---\n");

    // Client-level timeout (applies to all requests)
    // WHY: Set a reasonable default timeout for all requests.
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(10))   // Overall request timeout
        .connect_timeout(Duration::from_secs(5)) // Connection timeout
        .build()
        .expect("Cannot build client");

    println!("Client configured with 10s timeout, 5s connect timeout");

    // Test with a normal request
    println!("\nNormal request (should succeed):");
    match client.get("https://httpbin.org/get").send().await {
        Ok(resp) => println!("Status: {} (within timeout)", resp.status()),
        Err(e) => {
            if e.is_timeout() {
                println!("TIMEOUT: Request took too long!");
            } else {
                eprintln!("Error: {}", e);
            }
        }
    }

    // Test with a delayed response
    // WHY: httpbin.org/delay/N waits N seconds before responding.
    // Setting delay > timeout triggers a timeout error.
    println!("\nRequest with 3s server delay (should succeed with 10s timeout):");
    match client.get("https://httpbin.org/delay/3").send().await {
        Ok(resp) => println!("Status: {} (server delayed 3s but we waited)", resp.status()),
        Err(e) => {
            if e.is_timeout() {
                println!("TIMEOUT! Server took too long.");
            } else {
                eprintln!("Error: {}", e);
            }
        }
    }

    // Per-request timeout (overrides client default)
    // WHY: Some requests are expected to be fast (health checks),
    // others slow (file uploads). Per-request timeouts give control.
    println!("\nRequest with strict 2s timeout against 3s delay:");
    let fast_client = reqwest::Client::builder()
        .timeout(Duration::from_secs(2))
        .build()
        .expect("Cannot build");

    match fast_client.get("https://httpbin.org/delay/3").send().await {
        Ok(resp) => println!("Status: {}", resp.status()),
        Err(e) => {
            if e.is_timeout() {
                println!("TIMEOUT (expected): Server needs 3s but we only wait 2s");
                println!("In Paytm: Show user 'Transaction pending, check later'");
            } else {
                eprintln!("Other error: {}", e);
            }
        }
    }
}

// ============================================================
// 6. ERROR HANDLING PATTERNS
// ============================================================
// WHY: HTTP operations can fail in many ways — network errors,
// DNS failures, TLS issues, server errors (500), client errors (404).
// Robust error handling is critical for production applications.

async fn demo_error_handling() {
    println!("\n--- 6. Error Handling Patterns ---\n");

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(10))
        .build()
        .expect("Cannot build");

    // Pattern 1: Check status codes
    // WHY: A successful HTTP request might still return an error status
    // (404, 500, etc.). Always check the status code.
    println!("Pattern 1: Status code checking");
    let urls = vec![
        ("https://httpbin.org/status/200", "Success"),
        ("https://httpbin.org/status/404", "Not Found"),
        ("https://httpbin.org/status/500", "Server Error"),
    ];

    for (url, description) in &urls {
        match client.get(*url).send().await {
            Ok(response) => {
                let status = response.status();
                if status.is_success() {
                    println!("  {} ({}) -> OK", description, status);
                } else if status.is_client_error() {
                    println!("  {} ({}) -> Client Error!", description, status);
                } else if status.is_server_error() {
                    println!("  {} ({}) -> Server Error!", description, status);
                }
            }
            Err(e) => eprintln!("  {} -> Network Error: {}", description, e),
        }
    }
    // Output:   Success (200 OK) -> OK
    // Output:   Not Found (404 Not Found) -> Client Error!
    // Output:   Server Error (500 Internal Server Error) -> Server Error!

    // Pattern 2: error_for_status() converts 4xx/5xx to Err
    // WHY: This is a convenient pattern that turns HTTP error statuses
    // into Rust errors, so you can use ? operator for early return.
    println!("\nPattern 2: error_for_status()");
    match client
        .get("https://httpbin.org/status/404")
        .send()
        .await
        .and_then(|resp| resp.error_for_status())
    {
        Ok(_) => println!("  Success!"),
        Err(e) => {
            println!("  Error: {}", e);
            if let Some(status) = e.status() {
                println!("  HTTP Status: {}", status);
            }
            // Output:  Error: HTTP status client error (404 Not Found)...
        }
    }

    // Pattern 3: Comprehensive error categorization
    // WHY: Different errors need different handling. Network errors
    // might warrant a retry, 401 needs re-authentication, 429 needs
    // rate limit backoff.
    println!("\nPattern 3: Error categorization");
    let test_url = "https://httpbin.org/get";
    match client.get(test_url).send().await {
        Ok(resp) => {
            let status = resp.status();
            match status.as_u16() {
                200..=299 => println!("  2xx Success: {}", status),
                301 | 302 => println!("  3xx Redirect: {}", status),
                400 => println!("  400 Bad Request — check your parameters"),
                401 => println!("  401 Unauthorized — refresh your API token"),
                403 => println!("  403 Forbidden — insufficient permissions"),
                404 => println!("  404 Not Found — check the URL"),
                429 => println!("  429 Too Many Requests — implement backoff"),
                500..=599 => println!("  5xx Server Error — retry later"),
                _ => println!("  Unexpected status: {}", status),
            }
        }
        Err(e) => {
            if e.is_timeout() {
                println!("  Timeout — retry with exponential backoff");
            } else if e.is_connect() {
                println!("  Connection error — check network/DNS");
            } else if e.is_request() {
                println!("  Request building error — check URL/headers");
            } else {
                println!("  Other error: {}", e);
            }
        }
    }
}

// ============================================================
// 7. OTHER HTTP METHODS (PUT, DELETE, PATCH)
// ============================================================
// WHY: REST APIs use different HTTP methods for different operations:
// GET = read, POST = create, PUT = replace, PATCH = update, DELETE = remove.

async fn demo_other_methods() {
    println!("\n--- 7. Other HTTP Methods ---\n");

    let client = reqwest::Client::new();

    // PUT request — replace a resource
    println!("PUT request (replace subscriber plan):");
    let update_data = serde_json::json!({
        "phone": "9876543210",
        "new_plan": "RC599",
        "effective_date": "2026-02-01"
    });

    match client
        .put("https://httpbin.org/put")
        .json(&update_data)
        .send()
        .await
    {
        Ok(resp) => println!("  PUT Status: {}", resp.status()),
        Err(e) => eprintln!("  PUT Error: {}", e),
    }
    // Output:   PUT Status: 200 OK

    // PATCH request — partial update
    println!("\nPATCH request (update just the balance):");
    let patch_data = serde_json::json!({
        "balance": 599.00
    });

    match client
        .patch("https://httpbin.org/patch")
        .json(&patch_data)
        .send()
        .await
    {
        Ok(resp) => println!("  PATCH Status: {}", resp.status()),
        Err(e) => eprintln!("  PATCH Error: {}", e),
    }
    // Output:   PATCH Status: 200 OK

    // DELETE request — remove a resource
    println!("\nDELETE request (cancel subscription):");
    match client
        .delete("https://httpbin.org/delete")
        .header("X-Reason", "user-requested-cancellation")
        .send()
        .await
    {
        Ok(resp) => println!("  DELETE Status: {}", resp.status()),
        Err(e) => eprintln!("  DELETE Error: {}", e),
    }
    // Output:   DELETE Status: 200 OK
}

// ============================================================
// 8. BUILDING A REUSABLE API CLIENT
// ============================================================
// WHY: In real projects, you wrap reqwest in a domain-specific
// client. This encapsulates base URLs, auth, error handling,
// and retries in one place.

struct TelecomApiClient {
    client: reqwest::Client,
    base_url: String,
    api_key: String,
}

impl TelecomApiClient {
    fn new(base_url: &str, api_key: &str) -> Self {
        let client = reqwest::Client::builder()
            .timeout(Duration::from_secs(30))
            .connect_timeout(Duration::from_secs(10))
            .build()
            .expect("Cannot build HTTP client");

        TelecomApiClient {
            client,
            base_url: base_url.to_string(),
            api_key: api_key.to_string(),
        }
    }

    async fn get_subscriber(&self, phone: &str) -> Result<String, String> {
        let url = format!("{}/subscriber/{}", self.base_url, phone);

        self.client
            .get(&url)
            .header("Authorization", format!("Bearer {}", self.api_key))
            .header("Accept", "application/json")
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?
            .error_for_status()
            .map_err(|e| format!("API error: {}", e))?
            .text()
            .await
            .map_err(|e| format!("Body read error: {}", e))
    }

    async fn process_recharge(
        &self,
        phone: &str,
        plan_id: &str,
        amount: f64,
    ) -> Result<String, String> {
        let url = format!("{}/recharge", self.base_url);
        let body = serde_json::json!({
            "phone": phone,
            "plan_id": plan_id,
            "amount": amount,
            "timestamp": "2026-01-25T10:30:00+05:30"
        });

        self.client
            .post(&url)
            .header("Authorization", format!("Bearer {}", self.api_key))
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?
            .error_for_status()
            .map_err(|e| format!("API error: {}", e))?
            .text()
            .await
            .map_err(|e| format!("Body read error: {}", e))
    }
}

async fn demo_api_client() {
    println!("\n--- 8. Reusable API Client ---\n");

    // In production, you'd use a real base URL
    let api = TelecomApiClient::new(
        "https://httpbin.org",  // Using httpbin as a stand-in
        "paytm-secret-key-2026",
    );

    // Simulate getting subscriber info
    // WHY: We point to httpbin /get which just echoes our request
    println!("Getting subscriber info...");
    match api.get_subscriber("9876543210").await {
        Ok(response) => {
            let preview = if response.len() > 150 {
                format!("{}... (truncated)", &response[..150])
            } else {
                response
            };
            println!("Response: {}", preview);
        }
        Err(e) => println!("Error (expected with httpbin): {}", e),
    }

    // Simulate processing a recharge
    println!("\nProcessing recharge...");
    match api.process_recharge("9876543210", "RC399", 399.0).await {
        Ok(response) => {
            let preview = if response.len() > 150 {
                format!("{}... (truncated)", &response[..150])
            } else {
                response
            };
            println!("Recharge response: {}", preview);
        }
        Err(e) => println!("Error (expected with httpbin): {}", e),
    }
}

// ============================================================
// 9. BLOCKING REQUESTS (NON-ASYNC)
// ============================================================
// WHY: Sometimes you need HTTP in a non-async context (scripts,
// CLI tools, simple utilities). Reqwest's blocking API wraps
// the async version in a synchronous interface.

fn demo_blocking_requests() {
    println!("\n--- 9. Blocking (Synchronous) Requests ---\n");

    // WHY: The blocking client uses reqwest::blocking::Client.
    // It creates its own tokio runtime internally.
    // IMPORTANT: Don't use blocking client inside an async runtime!
    // That would deadlock. Use it only in non-async code.

    // NOTE: We can't actually call blocking inside an async main,
    // so this demonstrates the API pattern in comments.

    println!("Blocking API pattern (for non-async code):");
    println!("");
    println!("  // In Cargo.toml: reqwest = {{ features = [\"blocking\"] }}");
    println!("  use reqwest::blocking::Client;");
    println!("");
    println!("  let client = Client::new();");
    println!("  let resp = client.get(\"https://httpbin.org/get\")");
    println!("      .header(\"Authorization\", \"Bearer token\")");
    println!("      .send()?;");
    println!("  let body = resp.text()?;");
    println!("");
    println!("  // Or parse JSON directly:");
    println!("  let data: MyStruct = client.get(url).send()?.json()?;");
    println!("");
    println!("WHY blocking: Simpler for scripts and CLI tools.");
    println!("WHY NOT blocking: Can't handle concurrent requests efficiently.");
}

// ============================================================
// MAIN FUNCTION
// ============================================================

#[tokio::main]
async fn main() {
    println!("=== HTTP Basics with Reqwest ===\n");

    demo_get_request().await;
    demo_get_with_headers().await;
    demo_post_request().await;
    demo_json_response().await;
    demo_timeouts().await;
    demo_error_handling().await;
    demo_other_methods().await;
    demo_api_client().await;
    demo_blocking_requests();

    println!("\n=== HTTP Basics Complete ===");
}

// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. reqwest::Client is the main entry point. Create ONE client
//    and reuse it — it manages connection pools and TLS sessions.
//
// 2. GET requests: client.get(url).send().await returns a Response.
//    Add query params with .query(&[("key", "value")]).
//
// 3. POST requests: client.post(url).json(&data).send().await
//    serializes your struct to JSON and sets Content-Type automatically.
//
// 4. Headers: Use .header("Key", "Value") for individual headers,
//    or build a HeaderMap. Default headers via Client::builder().
//
// 5. JSON parsing: response.json::<T>().await deserializes the
//    response body into type T. Use serde_json::Value for unknown JSON.
//
// 6. Timeouts: Set client-level timeout with Client::builder()
//    .timeout(Duration). Always set timeouts in production!
//
// 7. Error handling: Check response.status(), use error_for_status()
//    to convert 4xx/5xx to Err, categorize errors with is_timeout(),
//    is_connect(), etc.
//
// 8. Other methods: client.put(), .patch(), .delete() for full
//    REST API support. All follow the same builder pattern.
//
// 9. Blocking API: reqwest::blocking::Client for non-async code.
//    Don't mix blocking and async — it causes deadlocks.
//
// 10. Think of reqwest like Paytm's recharge system: you send
//     requests (recharge commands) to telecom APIs, handle responses
//     (success/failure), set timeouts (don't keep users waiting),
//     and handle errors gracefully (retry or show "pending").
// ============================================================
