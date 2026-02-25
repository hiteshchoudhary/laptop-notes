use crate::handler;
use crate::request::HttpRequest;
use crate::response::HttpResponse;
use crate::static_files;

/// A simple function-pointer type for route handlers.
type HandlerFn = fn(&HttpRequest) -> HttpResponse;

/// One entry in the route table.
struct Route {
    method: String,
    path: String,
    handler: HandlerFn,
}

/// A basic router that matches incoming requests by (method, path) and
/// dispatches to the corresponding handler.
///
/// Analogy: The sign board at the railway station entrance that tells
/// passengers which counter to go to — "New Booking -> Counter 1",
/// "PNR Enquiry -> Counter 4", etc.
pub struct Router {
    routes: Vec<Route>,
}

impl Router {
    /// Create a new router pre-loaded with all application routes.
    pub fn new() -> Self {
        let mut router = Router { routes: Vec::new() };

        router.add("GET", "/", handler::handle_home);
        router.add("GET", "/about", handler::handle_about);
        router.add("GET", "/echo", handler::handle_echo);
        router.add("GET", "/json", handler::handle_json);
        router.add("GET", "/health", handler::handle_health);

        router
    }

    /// Register a route.
    pub fn add(&mut self, method: &str, path: &str, handler: HandlerFn) {
        self.routes.push(Route {
            method: method.to_uppercase(),
            path: path.to_string(),
            handler,
        });
    }

    /// Match a request and return the response.
    ///
    /// Matching priority:
    /// 1. Exact (method, path) match in the route table.
    /// 2. Paths starting with `/public/` are forwarded to static file
    ///    serving.
    /// 3. Everything else gets a 404.
    pub fn dispatch(&self, req: &HttpRequest) -> HttpResponse {
        // 1. Exact match
        for route in &self.routes {
            if route.method == req.method && route.path == req.path {
                return (route.handler)(req);
            }
        }

        // 2. Static files under /public/
        if req.path.starts_with("/public/") {
            return static_files::serve_static_file(req);
        }

        // 3. 404
        handler::handle_not_found(req)
    }
}
