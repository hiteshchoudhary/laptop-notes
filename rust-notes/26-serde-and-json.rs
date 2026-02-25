// ============================================================
// 26. SERDE AND JSON IN RUST
// ============================================================
// WHY THIS MATTERS:
// JSON is the lingua franca of web APIs, configuration files,
// and data exchange. Every modern application talks JSON — from
// REST APIs to mobile apps to microservices. Serde (SERialize/
// DEserialize) is Rust's crown jewel for data conversion. It's
// blazingly fast, zero-copy where possible, and works at compile
// time via derive macros. If you're building anything that talks
// to the outside world, you need serde.
// ============================================================

// ============================================================
// CARGO.TOML — Required dependencies
// ============================================================
// Add these to your Cargo.toml to compile this file:
//
// [package]
// name = "serde-json-demo"
// version = "0.1.0"
// edition = "2021"
//
// [dependencies]
// serde = { version = "1.0", features = ["derive"] }
// serde_json = "1.0"
// ============================================================

// ============================================================
// STORY: AADHAAR eKYC API
// ============================================================
// Imagine you're building the backend for India's Aadhaar eKYC
// (electronic Know Your Customer) system.
//
// When a bank wants to verify a customer's identity, here's
// what happens:
//
// 1. The bank sends a JSON REQUEST with the Aadhaar number:
//    {"aadhaar_number": "1234-5678-9012", "bank_code": "SBI"}
//
// 2. Your Rust server DESERIALIZES this JSON into a Rust struct
//    (AadhaarRequest) so you can work with typed, validated data.
//
// 3. You look up the citizen's data in the database, create a
//    response struct (AadhaarResponse) with name, address, photo.
//
// 4. You SERIALIZE the struct back to JSON and send it:
//    {"name": "Rahul Sharma", "verified": true, "address": {...}}
//
// This serialize/deserialize cycle happens BILLIONS of times daily
// across India's digital infrastructure — UPI payments, DigiLocker,
// CoWIN, IRCTC bookings. Serde makes this fast and safe in Rust.
// ============================================================

// These imports require the serde and serde_json crates
// If compiling with just rustc, this won't work — use cargo.
use serde::{Serialize, Deserialize};
use serde_json::{self, Value, json};
use std::collections::HashMap;

// ============================================================
// 1. BASIC SERIALIZATION — STRUCT TO JSON
// ============================================================
// WHY: Serialization converts Rust data structures into a format
// that can be stored or transmitted (JSON, YAML, TOML, etc.).
// The #[derive(Serialize)] macro generates all the conversion
// code at COMPILE TIME — zero runtime reflection overhead.

#[derive(Debug, Serialize, Deserialize)]
struct Citizen {
    name: String,
    aadhaar_number: String,
    age: u32,
    is_verified: bool,
    address: Address,
}

#[derive(Debug, Serialize, Deserialize)]
struct Address {
    street: String,
    city: String,
    state: String,
    pin_code: String,
}

fn demo_basic_serialization() {
    println!("--- 1. Basic Serialization (Struct -> JSON) ---\n");

    let citizen = Citizen {
        name: String::from("Rahul Sharma"),
        aadhaar_number: String::from("1234-5678-9012"),
        age: 32,
        is_verified: true,
        address: Address {
            street: String::from("42 MG Road"),
            city: String::from("Bangalore"),
            state: String::from("Karnataka"),
            pin_code: String::from("560001"),
        },
    };

    // Serialize to JSON string
    // WHY: serde_json::to_string produces compact JSON (no whitespace)
    let json_compact = serde_json::to_string(&citizen).expect("Serialization failed");
    println!("Compact JSON:\n{}\n", json_compact);
    // Output: {"name":"Rahul Sharma","aadhaar_number":"1234-5678-9012","age":32,"is_verified":true,"address":{"street":"42 MG Road","city":"Bangalore","state":"Karnataka","pin_code":"560001"}}

    // Serialize to pretty JSON (human-readable)
    // WHY: to_string_pretty adds indentation — great for configs and debugging
    let json_pretty = serde_json::to_string_pretty(&citizen).expect("Serialization failed");
    println!("Pretty JSON:\n{}", json_pretty);
    // Output:
    // {
    //   "name": "Rahul Sharma",
    //   "aadhaar_number": "1234-5678-9012",
    //   "age": 32,
    //   "is_verified": true,
    //   "address": {
    //     "street": "42 MG Road",
    //     "city": "Bangalore",
    //     "state": "Karnataka",
    //     "pin_code": "560001"
    //   }
    // }
}

// ============================================================
// 2. BASIC DESERIALIZATION — JSON TO STRUCT
// ============================================================
// WHY: Deserialization converts JSON text back into typed Rust
// structs. Serde validates the structure and types automatically.
// If the JSON doesn't match the struct, you get a clear error.

fn demo_basic_deserialization() {
    println!("\n--- 2. Basic Deserialization (JSON -> Struct) ---\n");

    let json_data = r#"
    {
        "name": "Priya Patel",
        "aadhaar_number": "9876-5432-1098",
        "age": 28,
        "is_verified": false,
        "address": {
            "street": "15 Nehru Nagar",
            "city": "Ahmedabad",
            "state": "Gujarat",
            "pin_code": "380015"
        }
    }
    "#;

    // WHY: from_str returns Result — deserialization can fail if
    // the JSON is malformed or doesn't match the struct.
    let citizen: Citizen = serde_json::from_str(json_data).expect("Deserialization failed");

    println!("Deserialized citizen:");
    println!("  Name: {}", citizen.name);
    println!("  Aadhaar: {}", citizen.aadhaar_number);
    println!("  Age: {}", citizen.age);
    println!("  Verified: {}", citizen.is_verified);
    println!("  City: {}", citizen.address.city);
    // Output: Deserialized citizen:
    // Output:   Name: Priya Patel
    // Output:   Aadhaar: 9876-5432-1098
    // Output:   Age: 28
    // Output:   Verified: false
    // Output:   City: Ahmedabad

    // Error handling — malformed JSON
    let bad_json = r#"{"name": "incomplete"#;
    match serde_json::from_str::<Citizen>(bad_json) {
        Ok(_) => println!("Unexpectedly succeeded!"),
        Err(e) => println!("\nDeserialization error (expected): {}", e),
    }
    // Output: Deserialization error (expected): EOF while parsing...
}

// ============================================================
// 3. SERDE ATTRIBUTES — CUSTOMIZING SERIALIZATION
// ============================================================
// WHY: Real-world APIs rarely match your Rust struct names perfectly.
// Serde attributes let you rename fields, skip fields, set defaults,
// and more — bridging the gap between your Rust code and external APIs.

#[derive(Debug, Serialize, Deserialize)]
struct BankAccount {
    // WHY: #[serde(rename = "...")] changes the JSON key name.
    // The API might use "account_holder" but you prefer "holder_name".
    #[serde(rename = "account_holder")]
    holder_name: String,

    #[serde(rename = "acc_number")]
    account_number: String,

    // WHY: #[serde(default)] uses Default::default() if the field
    // is missing from JSON. For f64, the default is 0.0.
    #[serde(default)]
    balance: f64,

    // WHY: #[serde(skip_serializing)] excludes this field from JSON output.
    // Perfect for sensitive data that shouldn't leave the server.
    #[serde(skip_serializing)]
    internal_risk_score: u32,

    // WHY: #[serde(skip_serializing_if = "Option::is_none")] omits
    // the field if it's None. Keeps JSON clean.
    #[serde(skip_serializing_if = "Option::is_none")]
    nominee: Option<String>,

    // WHY: #[serde(alias = "...")] accepts alternative names during
    // deserialization. Useful for backward compatibility.
    #[serde(alias = "acc_type", alias = "type")]
    account_type: String,
}

fn demo_serde_attributes() {
    println!("\n--- 3. Serde Attributes ---\n");

    // Deserialize with renamed fields
    let json_data = r#"
    {
        "account_holder": "Vikram Singh",
        "acc_number": "SBI-001234567890",
        "balance": 250000.50,
        "internal_risk_score": 15,
        "nominee": "Anita Singh",
        "account_type": "Savings"
    }
    "#;

    let account: BankAccount = serde_json::from_str(json_data).expect("Failed");
    println!("Account: {:?}", account);
    // Output: BankAccount { holder_name: "Vikram Singh", account_number: "SBI-001234567890", balance: 250000.5, internal_risk_score: 15, nominee: Some("Anita Singh"), account_type: "Savings" }

    // Serialize — notice internal_risk_score is SKIPPED
    let serialized = serde_json::to_string_pretty(&account).expect("Failed");
    println!("\nSerialized (risk_score hidden):\n{}", serialized);
    // Output: internal_risk_score is NOT in the JSON output

    // Deserialize with missing optional and default fields
    let minimal_json = r#"
    {
        "account_holder": "Meena Kumari",
        "acc_number": "PNB-009876543210",
        "acc_type": "Current"
    }
    "#;

    let account2: BankAccount = serde_json::from_str(minimal_json).expect("Failed");
    println!("\nMinimal account:");
    println!("  Name: {}", account2.holder_name);
    println!("  Balance: {} (default)", account2.balance);
    println!("  Nominee: {:?} (missing = None)", account2.nominee);
    println!("  Type: {}", account2.account_type);
    // Output: Balance: 0 (default)
    // Output: Nominee: None (missing = None)
}

// ============================================================
// 4. WORKING WITH Vec AND HashMap
// ============================================================
// WHY: JSON arrays map to Vec, JSON objects map to HashMap.
// Serde handles these automatically.

#[derive(Debug, Serialize, Deserialize)]
struct EkycResponse {
    request_id: String,
    status: String,
    citizens: Vec<Citizen>,
    metadata: HashMap<String, String>,
}

fn demo_collections() {
    println!("\n--- 4. Vec and HashMap Serialization ---\n");

    let mut metadata = HashMap::new();
    metadata.insert(String::from("api_version"), String::from("2.1"));
    metadata.insert(String::from("region"), String::from("south"));
    metadata.insert(String::from("processed_by"), String::from("server-blr-03"));

    let response = EkycResponse {
        request_id: String::from("REQ-2026-00451"),
        status: String::from("success"),
        citizens: vec![
            Citizen {
                name: String::from("Arjun Reddy"),
                aadhaar_number: String::from("1111-2222-3333"),
                age: 35,
                is_verified: true,
                address: Address {
                    street: String::from("7 Tank Bund Road"),
                    city: String::from("Hyderabad"),
                    state: String::from("Telangana"),
                    pin_code: String::from("500001"),
                },
            },
            Citizen {
                name: String::from("Lakshmi Iyer"),
                aadhaar_number: String::from("4444-5555-6666"),
                age: 42,
                is_verified: true,
                address: Address {
                    street: String::from("23 Anna Salai"),
                    city: String::from("Chennai"),
                    state: String::from("Tamil Nadu"),
                    pin_code: String::from("600002"),
                },
            },
        ],
        metadata,
    };

    let json = serde_json::to_string_pretty(&response).expect("Failed");
    println!("eKYC Response (Vec + HashMap):\n{}", json);
    // Output: JSON with "citizens" array and "metadata" object

    // Deserialize it back
    let parsed: EkycResponse = serde_json::from_str(&json).expect("Failed");
    println!("\nParsed back: {} citizens found", parsed.citizens.len());
    for citizen in &parsed.citizens {
        println!("  - {} from {}", citizen.name, citizen.address.city);
    }
    // Output: Parsed back: 2 citizens found
    // Output:   - Arjun Reddy from Hyderabad
    // Output:   - Lakshmi Iyer from Chennai
}

// ============================================================
// 5. WORKING WITH serde_json::Value — DYNAMIC JSON
// ============================================================
// WHY: Sometimes you don't know the JSON structure at compile time
// (e.g., third-party APIs that change, or user-provided JSON).
// Value is a dynamic type that can represent any valid JSON.

fn demo_dynamic_json() {
    println!("\n--- 5. Dynamic JSON with Value ---\n");

    // Parse JSON into a dynamic Value
    let data = r#"
    {
        "service": "DigiLocker",
        "user_count": 150000000,
        "active": true,
        "features": ["Aadhaar", "PAN", "Driving License", "Vehicle RC"],
        "stats": {
            "documents_issued": 5600000000,
            "partner_orgs": 2100
        }
    }
    "#;

    // WHY: Value can represent any JSON — useful when the structure varies
    let v: Value = serde_json::from_str(data).expect("Failed");

    // Access values using indexing
    println!("Service: {}", v["service"]);
    // Output: Service: "DigiLocker"

    println!("User count: {}", v["user_count"]);
    // Output: User count: 150000000

    println!("Is active: {}", v["active"]);
    // Output: Is active: true

    // Access array elements
    println!("First feature: {}", v["features"][0]);
    // Output: First feature: "Aadhaar"

    // Access nested objects
    println!("Documents issued: {}", v["stats"]["documents_issued"]);
    // Output: Documents issued: 5600000000

    // WHY: Accessing missing keys returns Value::Null instead of panicking
    println!("Missing field: {}", v["nonexistent"]);
    // Output: Missing field: null

    // Convert Value to specific types
    if let Some(count) = v["user_count"].as_u64() {
        println!("\nUser count as u64: {} ({}  crore)", count, count / 10_000_000);
    }
    // Output: User count as u64: 150000000 (15 crore)

    if let Some(features) = v["features"].as_array() {
        println!("Features ({}):", features.len());
        for f in features {
            println!("  - {}", f.as_str().unwrap_or("unknown"));
        }
    }
    // Output: Features (4):
    // Output:   - Aadhaar
    // Output:   - PAN
    // Output:   - Driving License
    // Output:   - Vehicle RC

    // Create JSON dynamically with the json! macro
    // WHY: json! lets you write JSON inline in Rust code
    let upi_stats = json!({
        "platform": "UPI",
        "monthly_transactions": 12_000_000_000u64,
        "top_apps": ["PhonePe", "GPay", "Paytm", "CRED"],
        "avg_transaction_value": 1450.75,
        "enabled_banks": 350
    });

    println!("\nUPI Stats (built with json! macro):");
    println!("{}", serde_json::to_string_pretty(&upi_stats).unwrap());
    // Output: Pretty-printed JSON of UPI stats
}

// ============================================================
// 6. ENUMS WITH SERDE
// ============================================================
// WHY: Rust enums are powerful, and serde can serialize them
// in multiple ways. This is critical for API design — how your
// enum appears in JSON affects clients consuming your API.

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
enum TransactionStatus {
    Pending,
    Completed,
    Failed,
    Refunded,
}

// WHY: Enums with data can be serialized in different formats
// using serde's tag attributes.
#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "type", content = "details")]
enum PaymentMethod {
    #[serde(rename = "upi")]
    Upi { vpa: String },

    #[serde(rename = "card")]
    Card { last_four: String, network: String },

    #[serde(rename = "netbanking")]
    NetBanking { bank_name: String },

    #[serde(rename = "wallet")]
    Wallet { provider: String, balance: f64 },
}

#[derive(Debug, Serialize, Deserialize)]
struct Transaction {
    id: String,
    amount: f64,
    currency: String,
    status: TransactionStatus,
    payment_method: PaymentMethod,
}

fn demo_enum_serialization() {
    println!("\n--- 6. Enum Serialization ---\n");

    let txn = Transaction {
        id: String::from("TXN-2026-789456"),
        amount: 2499.00,
        currency: String::from("INR"),
        status: TransactionStatus::Completed,
        payment_method: PaymentMethod::Upi {
            vpa: String::from("rahul@okaxis"),
        },
    };

    let json = serde_json::to_string_pretty(&txn).expect("Failed");
    println!("UPI Transaction:\n{}", json);
    // Output: JSON with "status": "completed" and tagged enum for payment_method

    let card_txn = Transaction {
        id: String::from("TXN-2026-789457"),
        amount: 15999.00,
        currency: String::from("INR"),
        status: TransactionStatus::Pending,
        payment_method: PaymentMethod::Card {
            last_four: String::from("4242"),
            network: String::from("Visa"),
        },
    };

    let json2 = serde_json::to_string_pretty(&card_txn).expect("Failed");
    println!("\nCard Transaction:\n{}", json2);
    // Output: JSON with "type": "card", "details": {"last_four": "4242", ...}

    // Deserialize back
    let parsed: Transaction = serde_json::from_str(&json).expect("Failed");
    println!("\nParsed transaction: {} - Rs. {:.2}", parsed.id, parsed.amount);
    // Output: Parsed transaction: TXN-2026-789456 - Rs. 2499.00
}

// ============================================================
// 7. ERROR HANDLING WITH SERDE
// ============================================================
// WHY: Deserialization can fail in many ways — missing fields,
// wrong types, malformed JSON. Proper error handling is essential
// for robust APIs that don't crash on bad input.

fn demo_error_handling() {
    println!("\n--- 7. Error Handling ---\n");

    // Error 1: Missing required field
    let missing_field = r#"{"name": "Test"}"#;
    match serde_json::from_str::<Citizen>(missing_field) {
        Ok(_) => println!("Unexpected success"),
        Err(e) => println!("Missing field error: {}", e),
    }
    // Output: Missing field error: missing field `aadhaar_number` at line 1 column 16

    // Error 2: Wrong type
    let wrong_type = r#"
    {
        "name": "Test",
        "aadhaar_number": "1234",
        "age": "not a number",
        "is_verified": true,
        "address": {"street": "x", "city": "y", "state": "z", "pin_code": "0"}
    }
    "#;
    match serde_json::from_str::<Citizen>(wrong_type) {
        Ok(_) => println!("Unexpected success"),
        Err(e) => println!("Wrong type error: {}", e),
    }
    // Output: Wrong type error: invalid type: string "not a number", expected u32

    // Error 3: Malformed JSON
    let malformed = r#"{"name": "Test", broken}"#;
    match serde_json::from_str::<Value>(malformed) {
        Ok(_) => println!("Unexpected success"),
        Err(e) => println!("Malformed JSON error: {}", e),
    }
    // Output: Malformed JSON error: key must be a string at line 1 column 24

    // WHY: serde_json::Error has useful methods
    let result: Result<Citizen, _> = serde_json::from_str("{}");
    if let Err(e) = result {
        println!("\nError details:");
        println!("  Line: {}", e.line());
        println!("  Column: {}", e.column());
        println!("  Category: {:?}", e.classify());
        // classify() returns: Io, Syntax, Data, or Eof
    }

    // Graceful handling pattern
    println!("\nGraceful handling example:");
    let inputs = vec![
        r#"{"name":"A","aadhaar_number":"1","age":25,"is_verified":true,"address":{"street":"s","city":"c","state":"st","pin_code":"p"}}"#,
        r#"{"broken": true}"#,
        r#"not even json"#,
    ];

    for (i, input) in inputs.iter().enumerate() {
        match serde_json::from_str::<Citizen>(input) {
            Ok(c) => println!("  Input {}: OK - {}", i + 1, c.name),
            Err(e) => println!("  Input {}: FAILED - {}", i + 1, e),
        }
    }
    // Output:   Input 1: OK - A
    // Output:   Input 2: FAILED - missing field `name` ...
    // Output:   Input 3: FAILED - expected value at line 1 column 1
}

// ============================================================
// 8. NESTED STRUCTURES AND COMPLEX TYPES
// ============================================================
// WHY: Real-world JSON is deeply nested. Serde handles arbitrary
// nesting with zero extra effort — just derive on all types.

#[derive(Debug, Serialize, Deserialize)]
struct AadhaarVerificationRequest {
    request_id: String,
    timestamp: String,
    requester: Requester,
    subjects: Vec<VerificationSubject>,
    options: VerificationOptions,
}

#[derive(Debug, Serialize, Deserialize)]
struct Requester {
    org_name: String,
    org_code: String,
    authorized_person: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct VerificationSubject {
    aadhaar_number: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    name_to_verify: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    dob_to_verify: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct VerificationOptions {
    include_photo: bool,
    include_address: bool,
    #[serde(default = "default_language")]
    language: String,
}

fn default_language() -> String {
    String::from("en")
}

fn demo_nested_structures() {
    println!("\n--- 8. Nested Structures ---\n");

    let request = AadhaarVerificationRequest {
        request_id: String::from("VERIFY-2026-001"),
        timestamp: String::from("2026-01-25T10:30:00+05:30"),
        requester: Requester {
            org_name: String::from("State Bank of India"),
            org_code: String::from("SBI"),
            authorized_person: String::from("Branch Manager, Connaught Place"),
        },
        subjects: vec![
            VerificationSubject {
                aadhaar_number: String::from("1234-5678-9012"),
                name_to_verify: Some(String::from("Rahul Sharma")),
                dob_to_verify: Some(String::from("1994-03-15")),
            },
            VerificationSubject {
                aadhaar_number: String::from("9876-5432-1098"),
                name_to_verify: None,
                dob_to_verify: None,
            },
        ],
        options: VerificationOptions {
            include_photo: true,
            include_address: true,
            language: String::from("hi"),
        },
    };

    let json = serde_json::to_string_pretty(&request).expect("Failed");
    println!("Verification Request:\n{}", json);
    // Output: Deeply nested JSON with all structures properly serialized

    // Round-trip: JSON -> Struct -> JSON
    let parsed: AadhaarVerificationRequest = serde_json::from_str(&json).expect("Failed");
    println!("\nRound-trip successful!");
    println!("Request ID: {}", parsed.request_id);
    println!("Requester: {} ({})", parsed.requester.org_name, parsed.requester.org_code);
    println!("Subjects: {}", parsed.subjects.len());
    println!("Language: {}", parsed.options.language);
    // Output: Request ID: VERIFY-2026-001
    // Output: Requester: State Bank of India (SBI)
    // Output: Subjects: 2
    // Output: Language: hi
}

// ============================================================
// MAIN FUNCTION
// ============================================================

fn main() {
    println!("=== Serde and JSON in Rust ===\n");

    demo_basic_serialization();
    demo_basic_deserialization();
    demo_serde_attributes();
    demo_collections();
    demo_dynamic_json();
    demo_enum_serialization();
    demo_error_handling();
    demo_nested_structures();

    println!("\n=== Serde and JSON Complete ===");
}

// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. Serde is Rust's serialization framework. Add serde and
//    serde_json to Cargo.toml, then #[derive(Serialize, Deserialize)]
//    on your structs. That's it for basic usage.
//
// 2. serde_json::to_string() serializes (struct -> JSON).
//    serde_json::from_str() deserializes (JSON -> struct).
//    Both return Result for error handling.
//
// 3. Serde attributes customize the mapping:
//    - #[serde(rename = "...")] changes the JSON key name
//    - #[serde(default)] uses Default if field is missing
//    - #[serde(skip_serializing)] hides sensitive fields
//    - #[serde(skip_serializing_if = "Option::is_none")] omits None
//    - #[serde(alias = "...")] accepts alternative names
//
// 4. serde_json::Value is the dynamic type for unknown JSON.
//    Access with indexing (v["key"]), convert with as_u64(), etc.
//    The json!() macro builds Value objects inline.
//
// 5. Vec<T> serializes as JSON arrays, HashMap<K,V> as objects.
//    Serde handles these automatically if T/K/V are serializable.
//
// 6. Enums serialize differently based on serde attributes:
//    - Default: {"variant": {...data...}}
//    - #[serde(tag = "type")]: {"type": "variant", ...data...}
//    - #[serde(tag = "type", content = "data")]: adjacent tagging
//
// 7. Deserialization errors are descriptive — they tell you the
//    line, column, and what went wrong. Always handle them with
//    Result, never unwrap() in production code.
//
// 8. Serde works at compile time via derive macros. No runtime
//    reflection means ZERO overhead — Rust's serde_json is one
//    of the fastest JSON libraries in any language.
//
// 9. Round-trip (serialize then deserialize) should give you
//    back the same data. Test this for your API types.
//
// 10. Think of serde like the Aadhaar eKYC system: citizen data
//     (structs) gets converted to JSON (serialize) for transmission,
//     then converted back (deserialize) at the receiving end.
//     Attributes are like the form fields — rename, skip, require.
// ============================================================
