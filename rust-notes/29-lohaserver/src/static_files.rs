use std::fs;
use std::path::{Path, PathBuf};

use crate::request::HttpRequest;
use crate::response::HttpResponse;

/// Serve a static file from the `public/` directory.
///
/// The request path is expected to start with `/public/`, e.g.
/// `/public/index.html`.  We strip that prefix and resolve the
/// remainder relative to the `public/` folder next to the binary's
/// working directory.
///
/// Security: any path containing `..` is rejected to prevent directory
/// traversal attacks.
pub fn serve_static_file(req: &HttpRequest) -> HttpResponse {
    // Strip the leading "/public/" to get the relative file path.
    let rel_path = req.path.strip_prefix("/public/").unwrap_or("");

    if rel_path.is_empty() {
        return not_found_response();
    }

    // --- Security: reject path traversal ---
    if rel_path.contains("..") {
        eprintln!(
            "[StaticFiles] Blocked path traversal attempt: {}",
            req.path
        );
        return HttpResponse::not_found("Forbidden");
    }

    // Build an absolute path rooted at ./public/
    let base = PathBuf::from("public");
    let file_path = base.join(rel_path);

    // Double-check that the resolved path is still under public/
    if let Ok(canonical) = fs::canonicalize(&file_path) {
        if let Ok(canonical_base) = fs::canonicalize(&base) {
            if !canonical.starts_with(&canonical_base) {
                eprintln!(
                    "[StaticFiles] Resolved path escaped public/: {:?}",
                    canonical
                );
                return not_found_response();
            }
        }
    }

    // Try to read the file
    match fs::read(&file_path) {
        Ok(contents) => {
            let mime = guess_mime(&file_path);
            println!(
                "[StaticFiles] Serving {} ({}, {} bytes)",
                file_path.display(),
                mime,
                contents.len()
            );
            HttpResponse::bytes(mime, contents)
        }
        Err(_) => {
            eprintln!("[StaticFiles] File not found: {}", file_path.display());
            not_found_response()
        }
    }
}

/// Guess a MIME type from the file extension.
fn guess_mime(path: &Path) -> &'static str {
    match path
        .extension()
        .and_then(|ext| ext.to_str())
        .unwrap_or("")
    {
        "html" | "htm" => "text/html; charset=utf-8",
        "css" => "text/css; charset=utf-8",
        "js" => "application/javascript; charset=utf-8",
        "json" => "application/json; charset=utf-8",
        "png" => "image/png",
        "jpg" | "jpeg" => "image/jpeg",
        "gif" => "image/gif",
        "svg" => "image/svg+xml",
        "ico" => "image/x-icon",
        "txt" => "text/plain; charset=utf-8",
        "woff" => "font/woff",
        "woff2" => "font/woff2",
        _ => "application/octet-stream",
    }
}

fn not_found_response() -> HttpResponse {
    HttpResponse::not_found(
        "<h1>404</h1><p>Static file not found.</p>",
    )
}
