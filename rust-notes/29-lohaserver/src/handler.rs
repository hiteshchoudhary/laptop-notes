use crate::request::HttpRequest;
use crate::response::HttpResponse;

/// Serve the home page — the main welcome screen.
pub fn handle_home(_req: &HttpRequest) -> HttpResponse {
    let html = r#"<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>LohaServer — Home</title>
    <style>
        body { font-family: sans-serif; max-width: 600px; margin: 4rem auto; padding: 0 1rem; color: #222; }
        h1 { color: #ff9933; }
        a { color: #138808; }
    </style>
</head>
<body>
    <h1>Welcome to LohaServer</h1>
    <p>A multi-threaded HTTP server forged in Rust — no frameworks, only std.</p>
    <ul>
        <li><a href="/about">/about</a> — About this server</li>
        <li><a href="/echo">/echo</a> — Echo request info</li>
        <li><a href="/json">/json</a> — Sample train schedule JSON</li>
        <li><a href="/health">/health</a> — Health check</li>
        <li><a href="/public/index.html">/public/index.html</a> — Styled static page</li>
    </ul>
</body>
</html>"#;

    HttpResponse::html(html)
}

/// Serve the about page.
pub fn handle_about(_req: &HttpRequest) -> HttpResponse {
    let html = r#"<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>LohaServer — About</title>
    <style>
        body { font-family: sans-serif; max-width: 600px; margin: 4rem auto; padding: 0 1rem; color: #222; }
        h1 { color: #ff9933; }
        code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
    </style>
</head>
<body>
    <h1>About LohaServer</h1>
    <p><strong>Loha</strong> means <em>iron</em> in Hindi — and this server is
    built with the iron-strong guarantees of Rust.</p>
    <h2>How it works</h2>
    <ol>
        <li><code>TcpListener</code> binds to a port and accepts connections.</li>
        <li>Each connection is dispatched to the <code>ThreadPool</code>.</li>
        <li>A worker thread parses the HTTP request, matches a route, and
            calls the appropriate handler.</li>
        <li>The handler returns an <code>HttpResponse</code> which is
            serialized and written back to the stream.</li>
    </ol>
    <p>Think of it like an IRCTC reservation system with multiple booking
    counters serving passengers concurrently.</p>
    <p><a href="/">Back to Home</a></p>
</body>
</html>"#;

    HttpResponse::html(html)
}

/// Echo the request details back as JSON — handy for debugging.
pub fn handle_echo(req: &HttpRequest) -> HttpResponse {
    let headers_json: Vec<String> = req
        .headers
        .iter()
        .map(|(k, v)| format!("    \"{}\": \"{}\"", escape_json(k), escape_json(v)))
        .collect();

    let query_json: Vec<String> = req
        .query_string
        .iter()
        .map(|(k, v)| format!("    \"{}\": \"{}\"", escape_json(k), escape_json(v)))
        .collect();

    let json = format!(
        r#"{{
  "method": "{}",
  "path": "{}",
  "version": "{}",
  "headers": {{
{}
  }},
  "query": {{
{}
  }},
  "body": "{}"
}}"#,
        escape_json(&req.method),
        escape_json(&req.path),
        escape_json(&req.version),
        headers_json.join(",\n"),
        query_json.join(",\n"),
        escape_json(&req.body),
    );

    HttpResponse::json(&json)
}

/// Return sample JSON data — a fictional train schedule.
pub fn handle_json(_req: &HttpRequest) -> HttpResponse {
    let json = r#"{
  "station": "New Delhi (NDLS)",
  "schedule": [
    {
      "train": "12301 Rajdhani Express",
      "destination": "Howrah (HWH)",
      "departure": "16:55",
      "platform": 3,
      "status": "On Time"
    },
    {
      "train": "12951 Mumbai Rajdhani",
      "destination": "Mumbai Central (BCT)",
      "departure": "16:35",
      "platform": 5,
      "status": "Delayed 10 min"
    },
    {
      "train": "12259 Duronto Express",
      "destination": "Sealdah (SDAH)",
      "departure": "20:20",
      "platform": 9,
      "status": "On Time"
    }
  ]
}"#;

    HttpResponse::json(json)
}

/// A simple 404 page.
pub fn handle_not_found(_req: &HttpRequest) -> HttpResponse {
    let html = r#"<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>404 — Not Found</title>
    <style>
        body {
            font-family: sans-serif;
            display: flex; justify-content: center; align-items: center;
            min-height: 100vh; margin: 0;
            background: #f5f5f5; color: #333;
        }
        .box {
            text-align: center; padding: 3rem;
            background: white; border-radius: 12px;
            box-shadow: 0 4px 24px rgba(0,0,0,0.08);
        }
        h1 { font-size: 4rem; color: #ff9933; margin-bottom: 0; }
        p { color: #666; }
        a { color: #138808; }
    </style>
</head>
<body>
    <div class="box">
        <h1>404</h1>
        <p>The page you are looking for does not exist.</p>
        <p><a href="/">Go back home</a></p>
    </div>
</body>
</html>"#;

    HttpResponse::not_found(html)
}

/// Lightweight health check endpoint.
pub fn handle_health(_req: &HttpRequest) -> HttpResponse {
    HttpResponse::json(r#"{"status": "ok"}"#)
}

// -------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------

/// Escape characters for safe JSON embedding.
fn escape_json(s: &str) -> String {
    s.replace('\\', "\\\\")
        .replace('"', "\\\"")
        .replace('\n', "\\n")
        .replace('\r', "\\r")
        .replace('\t', "\\t")
}
