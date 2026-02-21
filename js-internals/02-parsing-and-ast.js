// ============================================================
// FILE 02: PARSING AND ABSTRACT SYNTAX TREES (AST)
// Topic: How the JS engine transforms source code text into a structured tree
// WHY: Before a single line of your JavaScript runs, the engine must
//   READ and UNDERSTAND the text. This parsing phase is expensive — on
//   mobile devices, parsing 1MB of JS can take 100ms. Understanding
//   parsing helps you optimize load times and write tooling.
// ============================================================

// ============================================================
// EXAMPLE 1 — Swiggy's Page Load Challenge
// Story: When you open Swiggy on your phone to order biryani, the browser
//   must download and parse several megabytes of JavaScript before you can
//   even tap a restaurant. Swiggy's engineering team splits their bundle into
//   smaller chunks because they know the parser must process EVERY byte
//   before execution begins. Faster parsing = faster food ordering.
// ============================================================

// WHY: Parsing is the FIRST thing that happens to your code. Before any
// variable is assigned, before any function runs, the engine must parse
// the entire script (or at least pre-parse it). This takes real time.

console.log("=== EXAMPLE 1: The Parsing Pipeline ===");
console.log("");
console.log("  Your source code goes through TWO parsing phases:");
console.log("  Phase 1: Lexical Analysis (Tokenization)  ->  Tokens");
console.log("  Phase 2: Syntactic Analysis (Parsing)     ->  AST");
console.log("");

// --- The Full Flow ---
//
//  "const x = 5 + 3;"     (Source Code — just text)
//         |
//         v
//  +------------------+
//  | Lexical Analyzer |    <- Also called "Lexer" or "Tokenizer"
//  | (Scanner)        |
//  +--------+---------+
//           |
//           v
//  [const] [x] [=] [5] [+] [3] [;]    (Tokens)
//           |
//           v
//  +------------------+
//  | Syntactic Parser |    <- Also called just "Parser"
//  +--------+---------+
//           |
//           v
//  Abstract Syntax Tree (AST)         (Structured tree)

// ============================================================
// EXAMPLE 2 — Phase 1: Lexical Analysis (Tokenization)
// Story: At Myntra, when the fashion page loads, the tokenizer is the first
//   to touch the code. It reads the raw characters one by one, grouping them
//   into meaningful "tokens" — like how you read letters and group them into
//   words when reading a Hindi newspaper.
// ============================================================

// WHY: Tokenization is the first step. The engine can't understand raw
// characters — it needs to group them into meaningful units (tokens).

console.log("=== EXAMPLE 2: Tokenization ===");

// Given this source code:
// const totalPrice = basePrice + gst;

// The tokenizer produces these tokens:
const tokenExample = [
    { type: "Keyword",     value: "const" },
    { type: "Identifier",  value: "totalPrice" },
    { type: "Punctuator",  value: "=" },
    { type: "Identifier",  value: "basePrice" },
    { type: "Punctuator",  value: "+" },
    { type: "Identifier",  value: "gst" },
    { type: "Punctuator",  value: ";" },
];

console.log("  Source: const totalPrice = basePrice + gst;");
console.log("  Tokens:");
tokenExample.forEach(t => {
    console.log(`    ${t.type.padEnd(12)} : ${t.value}`);
});
console.log("");

// --- Token Categories ---
//
// +----------------+------------------------------------+
// | Category       | Examples                           |
// +----------------+------------------------------------+
// | Keywords       | const, let, var, function, return, |
// |                | if, else, for, while, class, new   |
// +----------------+------------------------------------+
// | Identifiers    | myVar, calculateTotal, userName     |
// +----------------+------------------------------------+
// | Literals       | 42, "hello", true, null, 3.14      |
// +----------------+------------------------------------+
// | Operators      | +, -, *, /, ===, !==, &&, ||, =>   |
// +----------------+------------------------------------+
// | Punctuators    | (, ), {, }, [, ], ;, ,, .           |
// +----------------+------------------------------------+

// ============================================================
// EXAMPLE 3 — Phase 2: Syntactic Analysis (Parsing to AST)
// Story: At Freshworks, the CRM dashboard code contains complex nested
//   function calls and object manipulations. The parser must understand
//   the STRUCTURE — which expressions are nested inside which, which
//   operands belong to which operators, what is the precedence.
//   It builds an AST (Abstract Syntax Tree) to represent this structure.
// ============================================================

// WHY: Tokens are flat — they have no structure. The parser gives them
// structure by building a tree. This tree (AST) is what the rest of
// the engine works with.

console.log("=== EXAMPLE 3: Abstract Syntax Tree (AST) ===");

// Source: const x = 5 + 3;
// AST (simplified JSON representation):
const simpleAST = {
    type: "Program",
    body: [
        {
            type: "VariableDeclaration",
            kind: "const",
            declarations: [
                {
                    type: "VariableDeclarator",
                    id: { type: "Identifier", name: "x" },
                    init: {
                        type: "BinaryExpression",
                        operator: "+",
                        left:  { type: "NumericLiteral", value: 5 },
                        right: { type: "NumericLiteral", value: 3 },
                    },
                },
            ],
        },
    ],
};

console.log("  Source: const x = 5 + 3;");
console.log("  AST (simplified):");
console.log(JSON.stringify(simpleAST, null, 4).split('\n').map(l => '  ' + l).join('\n'));
console.log("");

// --- AST as a tree diagram ---
//
//                    Program
//                       |
//              VariableDeclaration (const)
//                       |
//              VariableDeclarator
//                /            \
//     Identifier: "x"    BinaryExpression (+)
//                            /          \
//                  NumericLiteral: 5   NumericLiteral: 3

// ============================================================
// EXAMPLE 4 — Function AST
// Story: When a Paytm engineer writes a greeting function, the parser
//   builds a tree that captures the function name, its parameters,
//   the body statements, and the return expression — all in a nested
//   tree structure that the engine can walk and execute.
// ============================================================

// WHY: Understanding AST structure for functions helps you understand
// how the engine "sees" your code. It also explains how tools like
// Babel and ESLint transform and analyze code.

console.log("=== EXAMPLE 4: Function AST ===");

// Source: function greet(name) { return "Hello " + name; }
const functionAST = {
    type: "FunctionDeclaration",
    id: { type: "Identifier", name: "greet" },
    params: [
        { type: "Identifier", name: "name" },
    ],
    body: {
        type: "BlockStatement",
        body: [
            {
                type: "ReturnStatement",
                argument: {
                    type: "BinaryExpression",
                    operator: "+",
                    left:  { type: "StringLiteral", value: "Hello " },
                    right: { type: "Identifier", name: "name" },
                },
            },
        ],
    },
};

console.log("  Source: function greet(name) { return 'Hello ' + name; }");
console.log("  AST tree structure:");
console.log("");
console.log("         FunctionDeclaration");
console.log("           /      |       \\");
console.log("    id: greet  params:    body: BlockStatement");
console.log("               [name]         |");
console.log("                        ReturnStatement");
console.log("                              |");
console.log("                    BinaryExpression (+)");
console.log("                      /              \\");
console.log("              StringLiteral      Identifier");
console.log('              "Hello "           "name"');
console.log("");

// ============================================================
// EXAMPLE 5 — Eager Parsing vs Lazy Parsing (Pre-Parsing)
// Story: Hotstar (now JioCinema) has massive JavaScript bundles for its
//   streaming app. V8 does NOT fully parse every function upfront. It uses
//   "lazy parsing" (pre-parsing) — it only checks for syntax errors and
//   skips the full AST generation for functions that haven't been called yet.
//   This saves significant startup time for large applications.
// ============================================================

// WHY: If V8 fully parsed every function before running, large apps would
// have terrible startup times. Lazy parsing is V8's optimization: only
// fully parse a function when it's actually CALLED.

console.log("=== EXAMPLE 5: Eager vs Lazy Parsing ===");

// --- Eager Parsing ---
// The parser fully analyzes the function, builds complete AST
// Used for: functions that are called immediately, top-level code

// --- Lazy Parsing (Pre-Parsing) ---
// The parser only checks for syntax errors, notes the function boundaries
// Does NOT build a full AST, does NOT resolve variable references
// Used for: functions defined but not immediately called

// Example:
function immediatelyUsed() {
    return 42;
    // V8 lazy-parses this initially
    // Fully parses when called below
}

function definedButNotCalledYet() {
    // V8 pre-parses (lazy) this function
    // Only checks for syntax errors
    // Does NOT build full AST
    return "I might never be called";
}

const result = immediatelyUsed();  // NOW V8 fully parses immediatelyUsed
console.log("  immediatelyUsed() result:", result);
// definedButNotCalledYet() is never called — full parse never happens!

console.log("  Lazy parsing saves time: functions not called are not fully parsed");
console.log("");

// --- IIFE Forces Eager Parsing ---
// The old trick: wrapping in parentheses tells V8 to eagerly parse
// Because the parser sees "(" and knows the function will be called immediately

const iifResult = (function() {
    // V8 eagerly parses this because it's an IIFE
    return "eagerly parsed!";
})();
console.log("  IIFE result:", iifResult, "(eagerly parsed)");
console.log("");

// +--------------------------------------------------+
// | Lazy Parsing Decision Flow                       |
// +--------------------------------------------------+
// |                                                  |
// |  Function defined?                               |
// |       |                                          |
// |       v                                          |
// |  Is it called immediately? (IIFE or top-level?)  |
// |       |             |                            |
// |      YES           NO                            |
// |       |             |                            |
// |       v             v                            |
// |  EAGER PARSE    LAZY PARSE (pre-parse)           |
// |  (full AST)     (syntax check only)              |
// |                     |                            |
// |                     v                            |
// |               Called later?                      |
// |                |          |                      |
// |               YES        NO                     |
// |                |          |                      |
// |                v          v                      |
// |           FULL PARSE   NEVER PARSED              |
// |           (on demand)  (memory saved!)           |
// +--------------------------------------------------+

// ============================================================
// EXAMPLE 6 — Syntax Errors Happen at Parse Time
// Story: A new intern at TCS writes a function with a missing closing
//   brace. The error appears BEFORE any code runs — even the console.log
//   at the top of the file doesn't execute. This is because syntax errors
//   are caught during PARSING, before execution begins.
// ============================================================

// WHY: Parse-time errors are fundamentally different from runtime errors.
// A SyntaxError prevents the ENTIRE script from running. This is why
// you see "Unexpected token" errors before any output.

console.log("=== EXAMPLE 6: Syntax Errors at Parse Time ===");

// This would prevent THE ENTIRE FILE from running:
// function broken( { return 1; }    // SyntaxError: missing )

// But this is a RUNTIME error — code before it still runs:
try {
    // ReferenceError happens at runtime, not parse time
    // The parser doesn't know if 'nonExistent' will be defined later
    const val = undefined;
    // val.property;  // This would be a TypeError at runtime
    console.log("  This line runs because there's no syntax error.");
} catch (e) {
    console.log("  Runtime error:", e.message);
}

console.log("  SyntaxError -> parse time (nothing runs)");
console.log("  TypeError/ReferenceError -> runtime (code before runs)");
console.log("");

// The parser catches these at parse time:
// - Missing brackets/parens/braces
// - Invalid token sequences (e.g., "let let = 5;")
// - Duplicate parameter names in strict mode
// - Invalid regular expressions
// - `break` outside of loop
// - `return` outside of function

// ============================================================
// EXAMPLE 7 — Parse Cost and Bundle Size
// Story: Swiggy's performance team measured that their 2MB JavaScript
//   bundle took 200ms to parse on a mid-range Android phone (Redmi Note).
//   After code-splitting into smaller chunks and lazy-loading routes,
//   initial parse time dropped to 50ms. On the Jio Phone, the difference
//   was even more dramatic — 800ms vs 200ms.
// ============================================================

// WHY: Parse time is proportional to code size. Every byte of JavaScript
// must be scanned and parsed before execution. This is why bundle size
// directly impacts performance, especially on mobile devices.

console.log("=== EXAMPLE 7: Parse Cost ===");

// --- Approximate Parse Times ---
//
// +------------------+----------------+----------------+
// | Bundle Size      | Desktop (V8)   | Mobile (V8)    |
// +------------------+----------------+----------------+
// | 100 KB           | ~1 ms          | ~10 ms         |
// +------------------+----------------+----------------+
// | 500 KB           | ~5 ms          | ~50 ms         |
// +------------------+----------------+----------------+
// | 1 MB             | ~10 ms         | ~100 ms        |
// +------------------+----------------+----------------+
// | 5 MB             | ~50 ms         | ~500 ms        |
// +------------------+----------------+----------------+
// | 10 MB            | ~100 ms        | ~1000 ms (1s!) |
// +------------------+----------------+----------------+

console.log("  Rule of thumb: 1MB JS ~ 100ms parse time on mobile");
console.log("  This is BEFORE any code executes!");
console.log("");
console.log("  Optimization strategies:");
console.log("  1. Code splitting (only load what you need)");
console.log("  2. Tree shaking (remove unused exports)");
console.log("  3. Lazy loading routes (parse on demand)");
console.log("  4. Minification (fewer chars to scan)");
console.log("");

// ============================================================
// EXAMPLE 8 — JSON.parse() is Faster Than Object Literals
// Story: At Razorpay, a config file containing 10,000 merchant settings
//   was stored as a JS object literal. When they switched to
//   JSON.parse('{"key": "value", ...}'), parsing became 2x faster.
//   This is because JSON grammar is simpler than JS — the parser has
//   less work to do.
// ============================================================

// WHY: JSON has a much simpler grammar than JavaScript. The JSON parser
// is faster than the JS parser. For large static data, wrapping it in
// JSON.parse() is measurably faster than using a JS object literal.

console.log("=== EXAMPLE 8: JSON.parse() Performance ===");

// Generate a large test object
function generateLargeObject(size) {
    const obj = {};
    for (let i = 0; i < size; i++) {
        obj[`key_${i}`] = `value_${i}`;
    }
    return obj;
}

const largeObj = generateLargeObject(10000);
const jsonString = JSON.stringify(largeObj);

// Method 1: Object literal (JS parser must handle full JS grammar)
const start1 = process.hrtime.bigint();
const fromLiteral = generateLargeObject(10000); // Simulating object literal creation
const end1 = process.hrtime.bigint();

// Method 2: JSON.parse (JSON parser, simpler grammar, faster)
const start2 = process.hrtime.bigint();
const fromJSON = JSON.parse(jsonString);
const end2 = process.hrtime.bigint();

console.log(`  Object creation (10,000 keys): ${Number(end1 - start1) / 1_000_000}ms`);
console.log(`  JSON.parse (10,000 keys):      ${Number(end2 - start2) / 1_000_000}ms`);
console.log("  JSON.parse is typically faster for large static data.");
console.log("");

// WHY JSON parsing is faster:
// - JSON grammar has no functions, no expressions, no variables
// - JSON parser can skip many checks the JS parser must do
// - JSON values are always static — no computation needed
// - V8 has a dedicated fast JSON parser (different from the JS parser)

// ============================================================
// EXAMPLE 9 — AST in the Real World: Babel, ESLint, Prettier
// Story: When Flipkart's build pipeline runs, Babel reads each .jsx file,
//   parses it into an AST, transforms JSX nodes into React.createElement()
//   calls, and generates new source code. ESLint also reads ASTs to find
//   code quality issues. These tools don't execute JS — they ANALYZE and
//   TRANSFORM the AST.
// ============================================================

// WHY: ASTs aren't just for engines. Every modern JS development tool
// works with ASTs. Understanding ASTs helps you understand your toolchain.

console.log("=== EXAMPLE 9: AST in Dev Tools ===");

// --- How Babel Works ---
//
//  Source Code (JSX)
//       |
//       v
//  Parser (Babel parser / @babel/parser)
//       |
//       v
//  AST (Abstract Syntax Tree)
//       |
//       v
//  Transform (plugins traverse and modify the AST)
//  - JSX -> React.createElement()
//  - Arrow functions -> regular functions (for old browsers)
//  - Optional chaining -> ternary checks
//       |
//       v
//  Code Generator (AST -> new source code)
//       |
//       v
//  Output Code (ES5 compatible)

console.log("  Babel:    Parse -> Transform AST -> Generate code");
console.log("  ESLint:   Parse -> Traverse AST -> Report violations");
console.log("  Prettier: Parse -> Reformat AST -> Generate formatted code");
console.log("  TypeScript: Parse -> Type-check AST -> Generate JS");
console.log("");

// You can explore ASTs yourself at https://astexplorer.net/
// Just paste any JS code and see the tree structure!
console.log("  Try it: https://astexplorer.net/");
console.log("  Paste any JS code to see its AST");
console.log("");

// ============================================================
// EXAMPLE 10 — Building a Simple Tokenizer
// Story: A student at IIT Bombay's compiler design course builds a
//   mini tokenizer to understand how V8's lexer works. Even a simplified
//   version reveals the character-by-character scanning that happens
//   for every line of JavaScript you write.
// ============================================================

// WHY: Building a simple tokenizer helps internalize how the engine
// reads your source code character by character.

console.log("=== EXAMPLE 10: Mini Tokenizer ===");

function simpleTokenizer(code) {
    const tokens = [];
    let i = 0;

    while (i < code.length) {
        const char = code[i];

        // Skip whitespace
        if (/\s/.test(char)) {
            i++;
            continue;
        }

        // Numbers
        if (/\d/.test(char)) {
            let num = '';
            while (i < code.length && /[\d.]/.test(code[i])) {
                num += code[i];
                i++;
            }
            tokens.push({ type: 'Number', value: num });
            continue;
        }

        // Identifiers and keywords
        if (/[a-zA-Z_$]/.test(char)) {
            let word = '';
            while (i < code.length && /[a-zA-Z0-9_$]/.test(code[i])) {
                word += code[i];
                i++;
            }
            const keywords = ['const', 'let', 'var', 'function', 'return', 'if', 'else'];
            const type = keywords.includes(word) ? 'Keyword' : 'Identifier';
            tokens.push({ type, value: word });
            continue;
        }

        // Strings
        if (char === '"' || char === "'") {
            const quote = char;
            let str = '';
            i++; // skip opening quote
            while (i < code.length && code[i] !== quote) {
                str += code[i];
                i++;
            }
            i++; // skip closing quote
            tokens.push({ type: 'String', value: str });
            continue;
        }

        // Operators and punctuators
        if ('+-*/=<>!&|;,(){}[]'.includes(char)) {
            tokens.push({ type: 'Punctuator', value: char });
            i++;
            continue;
        }

        // Unknown character
        tokens.push({ type: 'Unknown', value: char });
        i++;
    }

    return tokens;
}

const testCode = "const price = 499 + 100;";
const tokens = simpleTokenizer(testCode);
console.log(`  Input: "${testCode}"`);
console.log("  Tokens:");
tokens.forEach(t => {
    console.log(`    ${t.type.padEnd(12)}: ${t.value}`);
});
console.log("");

// ============================================================
// EXAMPLE 11 — Practical: Measuring Parse Time
// Story: At BigBasket, the engineering team wanted to know how long
//   parsing took for their checkout page JavaScript. They used
//   performance.now() to measure the time difference between defining
//   a large function and having it ready. This helped them identify
//   which modules were most expensive to parse.
// ============================================================

// WHY: You can measure parse time indirectly. While you can't separate
// parse from compile in user-land code, you can observe the total
// script evaluation time which includes parsing.

console.log("=== EXAMPLE 11: Measuring Parse Impact ===");

// Generate a large string of JavaScript code
function generateLargeCode(lines) {
    let code = '';
    for (let i = 0; i < lines; i++) {
        code += `function fn_${i}(a, b) { return a + b + ${i}; }\n`;
    }
    return code;
}

// Small code block
const smallCode = generateLargeCode(100);
const smallStart = process.hrtime.bigint();
new Function(smallCode);  // Forces parse + compile
const smallEnd = process.hrtime.bigint();

// Larger code block
const largeCode = generateLargeCode(5000);
const largeStart = process.hrtime.bigint();
new Function(largeCode);  // Forces parse + compile
const largeEnd = process.hrtime.bigint();

const smallTime = Number(smallEnd - smallStart) / 1_000_000;
const largeTime = Number(largeEnd - largeStart) / 1_000_000;

console.log(`  Parsing 100 functions:  ${smallTime.toFixed(2)}ms`);
console.log(`  Parsing 5000 functions: ${largeTime.toFixed(2)}ms`);
console.log(`  Ratio: ${(largeTime / smallTime).toFixed(1)}x (roughly proportional to size)`);
console.log("");
console.log("  Key insight: Parse time scales with code size.");
console.log("  Smaller bundles = faster parsing = faster startup.");
console.log("");

// ============================================================
// EXAMPLE 12 — AST Node Types Reference
// Story: When the Zoho team built their own code formatter, they needed
//   to understand all the different AST node types that the parser
//   produces. Here is a reference of the most common node types
//   you will encounter when working with JavaScript ASTs.
// ============================================================

// WHY: If you ever work with Babel plugins, ESLint rules, or code
// transformation tools, you need to know the AST node types.

console.log("=== EXAMPLE 12: Common AST Node Types ===");

const nodeTypes = {
    "Program":                "Root node, contains array of statements",
    "VariableDeclaration":    "let/const/var declaration",
    "VariableDeclarator":     "Individual variable in a declaration",
    "FunctionDeclaration":    "function name() { ... }",
    "ArrowFunctionExpression":"() => { ... }",
    "BlockStatement":         "{ ... } block of statements",
    "ReturnStatement":        "return expression;",
    "IfStatement":            "if (...) { } else { }",
    "ForStatement":           "for (init; test; update) { }",
    "BinaryExpression":       "a + b, a === b, a && b",
    "CallExpression":         "func(args)",
    "MemberExpression":       "obj.prop, obj['prop']",
    "AssignmentExpression":   "x = 5, x += 1",
    "Identifier":             "variable/function names",
    "NumericLiteral":         "42, 3.14",
    "StringLiteral":          '"hello", \'world\'',
    "ObjectExpression":       "{ key: value }",
    "ArrayExpression":        "[1, 2, 3]",
};

Object.entries(nodeTypes).forEach(([type, desc]) => {
    console.log(`  ${type.padEnd(28)} : ${desc}`);
});
console.log("");

// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. Parsing has two phases: Tokenization (source -> tokens) and
//    Syntactic Analysis (tokens -> AST). Both happen before execution.
//
// 2. The AST (Abstract Syntax Tree) is a tree representation of your
//    code's structure. Every statement, expression, and declaration
//    becomes a node in this tree.
//
// 3. V8 uses LAZY PARSING: functions are pre-parsed (syntax check only)
//    and fully parsed only when called. This saves startup time.
//
// 4. IIFEs force EAGER PARSING because V8 knows they'll run immediately.
//    This was an old optimization trick (less relevant with modern bundlers).
//
// 5. SyntaxErrors are caught at PARSE TIME — the entire script fails
//    to run. RuntimeErrors (TypeError, ReferenceError) happen during execution.
//
// 6. Parse cost is proportional to code size: ~100ms per 1MB on mobile.
//    This is why code splitting, tree shaking, and lazy loading matter.
//
// 7. JSON.parse() is faster than JS object literals for large static data
//    because the JSON grammar is simpler than JavaScript's.
//
// 8. Tools like Babel, ESLint, Prettier, and TypeScript all work by
//    parsing code into an AST, transforming/analyzing it, and generating output.
// ============================================================

console.log("=== KEY TAKEAWAYS ===");
console.log("1. Two phases: Tokenization (source -> tokens) + Parsing (tokens -> AST)");
console.log("2. AST = tree of nodes representing code structure");
console.log("3. V8 lazy-parses: only fully parses functions when they're called");
console.log("4. SyntaxError = parse time (nothing runs); TypeError = runtime");
console.log("5. Parse cost ~ code size: 1MB JS ~ 100ms on mobile");
console.log("6. JSON.parse() > object literals for large static data");
console.log("7. Babel, ESLint, Prettier all work on the AST");
console.log("8. Explore ASTs at https://astexplorer.net/");
