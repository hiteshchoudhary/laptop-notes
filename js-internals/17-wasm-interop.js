// ============================================================
// FILE 17: WEBASSEMBLY INTEROP WITH JAVASCRIPT
// Topic: How WebAssembly works alongside JavaScript in V8
// WHY: Razorpay verifies cryptographic signatures on every payment.
// JS crypto is 3-5x slower than native. Wasm runs compiled C/Rust
// code at near-native speed in the same sandbox as JS. Understanding
// the JS-Wasm boundary reveals when and how to use Wasm effectively.
// ============================================================

// ============================================================
// EXAMPLE 1 — Razorpay's Signature Verification
// Story: Every Razorpay payment requires HMAC-SHA256 verification.
// Pure JS is slow for crypto. By compiling to Wasm, Razorpay gets
// near-native speed — no native addons, no platform binaries.
// ============================================================

// WHY: Wasm is a binary instruction format designed as a
// compilation target for C/C++/Rust/Go. It runs in the same
// sandbox as JavaScript.

console.log("=".repeat(60));
console.log("WHAT IS WEBASSEMBLY?");
console.log("=".repeat(60));

//   ┌───────────────────────────────────────────┐
//   │          JavaScript Engine (V8)            │
//   │  ┌─────────────────┐ ┌──────────────────┐ │
//   │  │  JavaScript      │ │  WebAssembly     │ │
//   │  │  Dynamic types   │ │  Static types    │ │
//   │  │  JIT compiled    │ │  AOT compiled    │ │
//   │  │  DOM/Web APIs    │ │  Linear memory   │ │
//   │  └────────┬─────────┘ └─────────┬────────┘ │
//   │           └─── interop ─────────┘           │
//   │  Same sandbox, same security model          │
//   └─────────────────────────────────────────────┘

console.log("Wasm: binary format, compiled from C/C++/Rust/Go");
console.log("Runs at near-native speed, same sandbox as JS");
console.log("Complement to JS — not a replacement");

// ============================================================
// EXAMPLE 2 — Wasm vs JavaScript: When to Use Which
// Story: Razorpay evaluated rewriting their SDK in Wasm. Only
// compute-intensive crypto parts benefit. UI/API stays in JS.
// ============================================================

console.log("\n" + "=".repeat(60));
console.log("WASM vs JAVASCRIPT");
console.log("=".repeat(60));

console.log(`
  JS strengths: DOM, networking, async I/O, huge ecosystem
  Wasm strengths: predictable perf, crypto, compression, image
    processing, games, ML inference, porting C/Rust libraries

  KEY: After JIT warmup, V8 can match Wasm speed.
  But Wasm has NO warmup — fast from the first call.
`);

// ============================================================
// EXAMPLE 3 — Wasm Module from Raw Bytes
// Story: Razorpay's team hand-wrote a minimal Wasm binary to
// understand the format before using Emscripten.
// ============================================================

// WHY: A Wasm module is just bytes — binary encoding of functions,
// types, memory, and exports.

console.log("\n" + "=".repeat(60));
console.log("WASM MODULE FROM RAW BYTES");
console.log("=".repeat(60));

// WAT (text format):
// (module
//   (func $add (param $a i32) (param $b i32) (result i32)
//     local.get $a  local.get $b  i32.add)
//   (export "add" (func $add)))

const wasmBytes = new Uint8Array([
    0x00, 0x61, 0x73, 0x6d,  // Magic: \0asm
    0x01, 0x00, 0x00, 0x00,  // Version: 1
    // Type section: func(i32, i32) -> i32
    0x01, 0x07, 0x01, 0x60, 0x02, 0x7f, 0x7f, 0x01, 0x7f,
    // Function section: func 0 uses type 0
    0x03, 0x02, 0x01, 0x00,
    // Export section: "add" → func 0
    0x07, 0x07, 0x01, 0x03, 0x61, 0x64, 0x64, 0x00, 0x00,
    // Code section: local.get 0, local.get 1, i32.add
    0x0a, 0x09, 0x01, 0x07, 0x00, 0x20, 0x00, 0x20, 0x01, 0x6a, 0x0b
]);

//   Wasm Binary Format:
//   ┌────────────┬──────────┬──────────────────────┐
//   │ Magic \0asm│ Version 1│ Sections: Type, Func, │
//   │ (4 bytes)  │ (4 bytes)│ Export, Code, ...     │
//   └────────────┴──────────┴──────────────────────┘

async function loadWasm() {
    const module = await WebAssembly.compile(wasmBytes);
    console.log("Exports:", WebAssembly.Module.exports(module));
    const instance = await WebAssembly.instantiate(module);
    console.log("add(40, 2) =", instance.exports.add(40, 2));    // 42
    console.log("add(100, 200) =", instance.exports.add(100, 200)); // 300
    return instance;
}

loadWasm().catch(err => console.error("Wasm error:", err));

// ============================================================
// EXAMPLE 4 — Wasm Loading Pipeline
// Story: Razorpay's build compiles Rust to .wasm. The JS SDK
// loads modules following the compile → instantiate pipeline.
// ============================================================

console.log("\n" + "=".repeat(60));
console.log("WASM LOADING PIPELINE");
console.log("=".repeat(60));

//   .wasm bytes
//       │
//       ▼
//   WebAssembly.compile(bytes) → Module (compiled, reusable)
//       │
//       ▼
//   WebAssembly.instantiate(module, imports) → Instance (ready!)
//       │
//       ▼
//   instance.exports.functionName()

// Method 1: Separate compile + instantiate
// const module = await WebAssembly.compile(bytes);
// const instance = await WebAssembly.instantiate(module);

// Method 2: Combined
// const { module, instance } = await WebAssembly.instantiate(bytes);

// Method 3: Streaming (browser, most efficient)
// const result = await WebAssembly.instantiateStreaming(fetch('crypto.wasm'));

console.log("Method 1: compile() then instantiate(module)");
console.log("Method 2: instantiate(bytes) — combined");
console.log("Method 3: instantiateStreaming(fetch()) — browser, fastest");

// ============================================================
// EXAMPLE 5 — Imports: JS Functions Callable from Wasm
// Story: Razorpay's Wasm crypto module calls JS for logging
// and error reporting via the imports object.
// ============================================================

// WHY: Wasm can't access the outside world directly. Functions
// must be passed via the imports object — the security boundary.

console.log("\n" + "=".repeat(60));
console.log("IMPORTS: JS → WASM");
console.log("=".repeat(60));

// WAT: (module (import "env" "log" (func (param i32)))
//        (func $main (i32.const 42) (call $log))
//        (export "main" (func $main)))

const wasmWithImport = new Uint8Array([
    0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
    // Type section: 2 types — (i32)->void and ()->void
    0x01, 0x08, 0x02, 0x60, 0x01, 0x7f, 0x00, 0x60, 0x00, 0x00,
    // Import section: "env"."log" as func type 0
    0x02, 0x0b, 0x01, 0x03, 0x65, 0x6e, 0x76, 0x03, 0x6c, 0x6f, 0x67, 0x00, 0x00,
    // Function section: 1 func using type 1
    0x03, 0x02, 0x01, 0x01,
    // Export section: "main" → func index 1
    0x07, 0x08, 0x01, 0x04, 0x6d, 0x61, 0x69, 0x6e, 0x00, 0x01,
    // Code section: i32.const 42, call 0, end
    0x0a, 0x08, 0x01, 0x06, 0x00, 0x41, 0x2a, 0x10, 0x00, 0x0b
]);

async function demoImports() {
    const imports = {
        env: { log: (value) => console.log("  [JS from Wasm] Value:", value) }
    };
    const { instance } = await WebAssembly.instantiate(wasmWithImport, imports);
    instance.exports.main();  // [JS from Wasm] Value: 42
}

demoImports().catch(err => console.error("Import error:", err));

// ============================================================
// EXAMPLE 6 — WebAssembly.Memory: Linear Memory
// Story: Razorpay's Wasm crypto processes payment data through
// shared linear memory — a flat byte array accessible by both
// JS and Wasm.
// ============================================================

// WHY: Wasm has NO access to JS objects. Communication happens
// through a flat byte array (linear memory).

console.log("\n" + "=".repeat(60));
console.log("WebAssembly.Memory");
console.log("=".repeat(60));

const wasmMemory = new WebAssembly.Memory({ initial: 1, maximum: 10 });
console.log("Memory:", wasmMemory.buffer.byteLength, "bytes (1 page = 64KB)");

// Read/write from JS side
const memView = new Uint8Array(wasmMemory.buffer);
memView[0] = 72; memView[1] = 101; memView[2] = 108; memView[3] = 108; memView[4] = 111;
console.log("Wrote 'Hello':", String.fromCharCode(...memView.slice(0, 5)));

//   Memory (flat byte array):
//   ┌─────┬─────┬─────┬─────┬─────┬─────┐
//   │  H  │  e  │  l  │  l  │  o  │ ... │
//   │ [0] │ [1] │ [2] │ [3] │ [4] │     │
//   └─────┴─────┴─────┴─────┴─────┴─────┘
//   SAME bytes, accessible from both JS and Wasm.

// Growing memory
const oldPages = wasmMemory.grow(2);
console.log("Grew from", oldPages, "to", oldPages + 2, "pages");
// IMPORTANT: After grow(), re-create typed array views!
const newView = new Uint8Array(wasmMemory.buffer);
console.log("Data preserved:", String.fromCharCode(...newView.slice(0, 5)));

// ============================================================
// EXAMPLE 7 — Passing Strings Between JS and Wasm
// Story: Razorpay passes merchant names to Wasm for processing.
// Wasm has NO string type — must encode/decode through memory.
// ============================================================

// WHY: Wasm only understands numbers. Strings must be serialized
// as bytes in shared memory.

console.log("\n" + "=".repeat(60));
console.log("PASSING STRINGS JS ↔ WASM");
console.log("=".repeat(60));

function writeString(memory, offset, str) {
    const bytes = new TextEncoder().encode(str);
    new Uint8Array(memory.buffer).set(bytes, offset);
    return bytes.length;
}

function readString(memory, offset, length) {
    return new TextDecoder().decode(new Uint8Array(memory.buffer, offset, length));
}

const strMem = new WebAssembly.Memory({ initial: 1 });

const len1 = writeString(strMem, 0, "Razorpay Payments");
console.log("Wrote:", readString(strMem, 0, len1));

const len2 = writeString(strMem, 100, "भारतीय भुगतान");
console.log("Hindi:", readString(strMem, 100, len2));

//   Protocol:
//   JS: encode string → write to memory → pass offset+length to Wasm
//   Wasm: read bytes → process → write result → return offset+length
//   JS: read bytes → decode to string

// ============================================================
// EXAMPLE 8 — WebAssembly.Table
// Story: Razorpay's plugin system uses Tables for indirect
// function calls — function pointers in Wasm.
// ============================================================

console.log("\n" + "=".repeat(60));
console.log("WebAssembly.Table");
console.log("=".repeat(60));

const table = new WebAssembly.Table({ element: "anyfunc", initial: 10 });
console.log("Table slots:", table.length);

//   Table: array of function references
//   ┌───────┬───────┬───────┐
//   │ [0]   │ [1]   │ [2]   │ ...
//   │ funcA │ funcB │ null  │
//   └───────┴───────┴───────┘
//   call_indirect(index) → calls table[index]
//   C function pointers → table indices in Wasm

console.log("Tables enable: function pointers, vtables, dynamic dispatch");

// ============================================================
// EXAMPLE 9 — Performance Characteristics
// Story: Razorpay benchmarked Wasm vs JS. Wasm was 2x faster on
// first call; after JIT warmup, gap narrowed to 1.3x.
// ============================================================

console.log("\n" + "=".repeat(60));
console.log("PERFORMANCE CHARACTERISTICS");
console.log("=".repeat(60));

//   Speed
//   ▲
//   │  ████████████████████  Wasm (constant, fast from start)
//   │            ┌──────────  JS after TurboFan (near Wasm)
//   │           /
//   │      ┌───┘              JS warming up
//   │     /
//   │ ┌──┘                    JS interpreted
//   └──────────────────────► Time
//      Cold    Warmup    Optimized

function fibJS(n) {
    let a = 0, b = 1;
    for (let i = 2; i <= n; i++) { const t = a + b; a = b; b = t; }
    return b;
}

// Warmup JIT
for (let i = 0; i < 10000; i++) fibJS(30);
console.time("JS fib (post-warmup) x10000");
for (let i = 0; i < 10000; i++) fibJS(40);
console.timeEnd("JS fib (post-warmup) x10000");

console.log("JS can match Wasm AFTER JIT warmup");
console.log("Wasm advantage: instant speed, no warmup needed");
console.log("JS↔Wasm call overhead: ~10-50ns per call");

// ============================================================
// EXAMPLE 10 — Compilation Tools
// Story: Razorpay chose Rust + wasm-pack. Other teams use
// Emscripten (C/C++) and TinyGo (Go).
// ============================================================

console.log("\n" + "=".repeat(60));
console.log("WASM COMPILATION TOOLS");
console.log("=".repeat(60));

console.log(`
  Emscripten (C/C++ → Wasm): most mature, large codebases (FFmpeg, SQLite)
  wasm-pack (Rust → Wasm): smallest output, best tooling, wasm-bindgen
  TinyGo (Go → Wasm): subset of Go, smaller than standard compiler
  AssemblyScript (TS-like → Wasm): familiar syntax for JS devs
`);

// ============================================================
// EXAMPLE 11 — Wasm in Node.js
// Story: Razorpay uses Wasm on Node.js servers. Same binary
// runs in browsers AND Node.js — true portability.
// ============================================================

console.log("=".repeat(60));
console.log("WASM IN NODE.JS");
console.log("=".repeat(60));

const fs = require("fs");

async function nodeDemo() {
    const { instance } = await WebAssembly.instantiate(wasmBytes);
    console.log("Node.js: add(7, 8) =", instance.exports.add(7, 8));
    console.log("Use cases: crypto, image processing, compression, SQLite");
}
nodeDemo().catch(console.error);

// ============================================================
// EXAMPLE 12 — WASI and the Future
// Story: Razorpay explores WASI for edge workers — running Wasm
// outside browsers with sandboxed OS access.
// ============================================================

console.log("\n" + "=".repeat(60));
console.log("WASM FUTURE: WASI");
console.log("=".repeat(60));

console.log(`
  WASI (WebAssembly System Interface):
  - Standardized OS access (files, networking) for Wasm
  - Sandboxed: capabilities must be explicitly granted
  - "If WASM+WASI existed in 2008, we wouldn't need Docker"
    — Solomon Hykes (Docker co-founder)

  Edge Computing: Cloudflare Workers, Fastly, Vercel use Wasm
  GC Proposal: enables Kotlin, Dart, Java → Wasm
  Component Model: language-independent module interop
`);

// ============================================================
// EXAMPLE 13 — Common Wasm Interop Patterns Summary
// Story: Razorpay's team documented the patterns they use most
// frequently when integrating Wasm modules into their JS codebase.
// ============================================================

console.log("\n" + "=".repeat(60));
console.log("COMMON INTEROP PATTERNS");
console.log("=".repeat(60));

console.log("1. Numeric functions: pass numbers directly (fast, no encoding)");
console.log("2. String processing: encode → memory → call → read → decode");
console.log("3. Batch processing: write array to memory, pass offset+length");
console.log("4. Callbacks: pass JS function via imports, Wasm calls it");
console.log("5. Shared state: use WebAssembly.Memory as shared buffer");

// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. Wasm is a binary format that runs in the same sandbox as JS.
//    Compiled from C/C++/Rust/Go, NOT hand-written.
//
// 2. Complement JS: Wasm for compute (crypto, compression, image),
//    JS for everything else (DOM, networking, APIs).
//
// 3. Pipeline: bytes → compile() → Module → instantiate() →
//    Instance → instance.exports.fn().
//
// 4. Imports: JS functions passed to Wasm. Exports: Wasm functions
//    called from JS. This is the interop bridge.
//
// 5. WebAssembly.Memory: flat byte array shared by JS and Wasm.
//    Strings must be manually encoded/decoded.
//
// 6. Wasm advantage: predictable performance, no JIT warmup.
//    After V8 JIT warms up, JS can match Wasm speed.
//
// 7. Tools: Emscripten, wasm-pack, TinyGo, AssemblyScript.
//    Same .wasm binary runs in browser AND Node.js.
// ============================================================

console.log("\n" + "=".repeat(60));
console.log("FILE 17 COMPLETE — WebAssembly Interop");
console.log("=".repeat(60));
