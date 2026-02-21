// ============================================================
// FILE 17: INDEXEDDB — BROWSER-SIDE NOSQL DATABASE
// Topic: Storing large structured data client-side with async transactions
// WHY: When localStorage's 5-10MB string-only storage isn't
// enough, IndexedDB provides a full transactional NoSQL database
// in the browser — enabling offline-first apps, large caches,
// and structured data queries without any server dependency.
// ============================================================

// NOTE: All code runs in a BROWSER context. IndexedDB is
// available in browsers and Web Workers, but NOT in Node.js.
// Use DevTools > Application > IndexedDB to inspect data.

// --- Helper: log to both console and a DOM output area ---
function log(msg, targetId) {
    console.log(msg);
    const el = document.getElementById(targetId);
    if (el) el.textContent += msg + '\n';
}

// --- Transaction state visual indicator ---
function setTxState(state) {
    const el = document.getElementById('tx-state');
    if (!el) return;
    el.textContent = state;
    el.className = 'tx-state ' + state;
}

// --- Sync status indicator ---
function setSyncStatus(text, state) {
    const statusEl = document.getElementById('sync-status');
    const dotEl = document.getElementById('sync-dot');
    if (statusEl) statusEl.textContent = text;
    if (dotEl) dotEl.className = 'sync-dot ' + state;
}

// ============================================================
// EXAMPLE 1 — What is IndexedDB? Ola's Offline Ride History
// Story: Ola operates in thousands of Indian cities, including
// rural areas where networks drop frequently. When a driver
// enters a dead zone, the app must still show ride history
// and queued requests. IndexedDB stores megabytes of structured
// data asynchronously with indexed lookups.
// ============================================================

// WHY: IndexedDB is the ONLY browser API for large structured
// data: no size limit, stores objects directly, supports indexes,
// works in Web Workers, and is transaction-based.

// | Feature          | localStorage     | IndexedDB           |
// |------------------|-----------------|---------------------|
// | API              | Synchronous     | Asynchronous        |
// | Data format      | Strings only    | Objects, Blobs, etc |
// | Capacity         | ~5-10 MB        | 50MB+ (varies)      |
// | Indexes          | No              | Yes                 |
// | Transactions     | No              | Yes                 |
// | Web Workers      | No              | Yes                 |

// ============================================================
// EXAMPLE 2 — Opening a Database and Schema Setup
// Story: We create "OlaNotesDB" to store notes with categories.
// The onupgradeneeded event defines the schema — like running
// migrations. It only fires when you create a new DB or bump
// the version number.
// ============================================================

// WHY: IndexedDB uses VERSION-based schema migration. When you
// increase the version, onupgradeneeded fires for schema changes.

const DB_NAME = 'OlaNotesDB';
const DB_VERSION = 1;

// --- Helper: get DB reference (Promise-wrapped) ---
function getDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);

        // --- onupgradeneeded: create schema (first open or version bump) ---
        req.onupgradeneeded = function(event) {
            const db = event.target.result;
            log(`Upgrading from v${event.oldVersion} to v${DB_VERSION}`, 'output-1');

            // Create "notes" object store with autoIncrement primary key
            if (!db.objectStoreNames.contains('notes')) {
                const store = db.createObjectStore('notes', {
                    keyPath: 'id',
                    autoIncrement: true
                });
                store.createIndex('byCategory', 'category', { unique: false });
                store.createIndex('bySyncStatus', 'synced', { unique: false });
                store.createIndex('byCreatedAt', 'createdAt', { unique: false });
                log('Created "notes" object store with indexes', 'output-1');
            }
        };

        req.onsuccess = function() {
            resolve(req.result);
        };

        req.onerror = function() {
            reject(req.error);
        };

        // --- onblocked: another tab has an older version open ---
        req.onblocked = function() {
            log('Upgrade blocked! Close other tabs using this app.', 'output-1');
        };
    });
}

// ============================================================
// EXAMPLE 3 — CRUD Operations: Transactions
// Story: Every IndexedDB operation happens inside a
// TRANSACTION, ensuring atomicity — if any step fails,
// the entire transaction rolls back.
// ============================================================

// WHY: ALL IndexedDB operations require transactions.
// 'readonly' for reads, 'readwrite' for writes.

// --- CREATE: add a note ---
async function addNote(title, body, category) {
    setTxState('active');
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(['notes'], 'readwrite');
        const store = tx.objectStore('notes');
        const request = store.add({
            title,
            body,
            category,
            createdAt: new Date().toISOString(),
            synced: false
        });

        request.onsuccess = () => {
            log(`Note added (ID: ${request.result}): "${title}"`, 'output-2');
            resolve(request.result);
        };
        request.onerror = () => {
            log(`Add failed: ${request.error}`, 'output-2');
            reject(request.error);
        };
        tx.oncomplete = () => {
            setTxState('complete');
            db.close();
            renderNotesList();
            setTimeout(() => setTxState('idle'), 1500);
        };
        tx.onabort = () => {
            setTxState('error');
            db.close();
        };
    });
}

// --- READ: get a single note by key ---
async function getNote(id) {
    setTxState('active');
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(['notes'], 'readonly');
        const request = tx.objectStore('notes').get(id);
        request.onsuccess = () => {
            resolve(request.result);
        };
        request.onerror = () => reject(request.error);
        tx.oncomplete = () => {
            setTxState('complete');
            db.close();
            setTimeout(() => setTxState('idle'), 1500);
        };
    });
}

// --- READ ALL ---
async function getAllNotes() {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(['notes'], 'readonly');
        const request = tx.objectStore('notes').getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        tx.oncomplete = () => db.close();
    });
}

// --- UPDATE: put() upserts (updates if exists, inserts if not) ---
async function updateNote(note) {
    setTxState('active');
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(['notes'], 'readwrite');
        tx.objectStore('notes').put(note);
        tx.oncomplete = () => {
            setTxState('complete');
            log(`Note updated (ID: ${note.id})`, 'output-4');
            db.close();
            renderNotesList();
            setTimeout(() => setTxState('idle'), 1500);
            resolve();
        };
        tx.onabort = () => {
            setTxState('error');
            db.close();
            reject(tx.error);
        };
    });
}

// --- DELETE ---
async function deleteNote(id) {
    setTxState('active');
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(['notes'], 'readwrite');
        tx.objectStore('notes').delete(id);
        tx.oncomplete = () => {
            setTxState('complete');
            log(`Note deleted (ID: ${id})`, 'output-4');
            db.close();
            renderNotesList();
            setTimeout(() => setTxState('idle'), 1500);
            resolve();
        };
        tx.onabort = () => {
            setTxState('error');
            db.close();
            reject(tx.error);
        };
    });
}

// --- DELETE ALL ---
async function clearAllNotes() {
    setTxState('active');
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(['notes'], 'readwrite');
        tx.objectStore('notes').clear();
        tx.oncomplete = () => {
            setTxState('complete');
            log('All notes deleted!', 'output-2');
            db.close();
            renderNotesList();
            setTimeout(() => setTxState('idle'), 1500);
            resolve();
        };
        tx.onabort = () => { setTxState('error'); db.close(); reject(tx.error); };
    });
}

// ============================================================
// EXAMPLE 4 — Indexes: Fast Lookups by Non-Key Fields
// Story: We need notes by category or sync status.
// Indexes make these lookups O(log n) instead of scanning
// every record.
// ============================================================

// WHY: Without indexes, non-key searches scan every record.
// Indexes are like SQL's WHERE clause optimization.

async function queryByIndex(indexName, value) {
    setTxState('active');
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(['notes'], 'readonly');
        const index = tx.objectStore('notes').index(indexName);

        // Convert string "true"/"false" for bySyncStatus
        let queryValue = value;
        if (indexName === 'bySyncStatus') {
            queryValue = value === 'true';
        }

        const request = index.getAll(queryValue);
        request.onsuccess = () => {
            log(`Index "${indexName}" query for "${value}": ${request.result.length} results`, 'output-5');
            request.result.forEach(note => {
                log(`  [${note.id}] ${note.title} (${note.category})`, 'output-5');
            });
            resolve(request.result);
        };
        request.onerror = () => reject(request.error);
        tx.oncomplete = () => {
            setTxState('complete');
            db.close();
            setTimeout(() => setTxState('idle'), 1500);
        };
    });
}

// ============================================================
// EXAMPLE 5 — Cursors: Iterating Large Datasets
// Story: Cursors iterate one record at a time — useful for
// pagination or processing without loading everything into memory.
// ============================================================

// WHY: Cursors are database iterators. Process records one by
// one, apply filters, and stop early if needed.

async function cursorDemo() {
    setTxState('active');
    const db = await getDB();
    const tx = db.transaction(['notes'], 'readonly');
    const request = tx.objectStore('notes').openCursor();
    const notes = [];
    let count = 0;

    log('--- Cursor iteration ---', 'output-5');

    request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
            count++;
            // cursor.key = primary key, cursor.value = record
            notes.push(cursor.value);
            log(`Cursor [${count}]: ID=${cursor.key}, "${cursor.value.title}"`, 'output-5');
            cursor.continue(); // Move to next record
        } else {
            log(`Cursor done. Total records: ${notes.length}`, 'output-5');
        }
    };
    tx.oncomplete = () => {
        setTxState('complete');
        db.close();
        setTimeout(() => setTxState('idle'), 1500);
    };
}

// ============================================================
// EXAMPLE 6 — IDBKeyRange: Range Queries
// Story: IDBKeyRange defines bounds for queries — like SQL's
// BETWEEN, >, < operators.
// ============================================================

// WHY: IDBKeyRange enables SQL-like range queries on indexes.

// Other IDBKeyRange methods:
// IDBKeyRange.only(value)         — exact match
// IDBKeyRange.lowerBound(x)       — field >= x
// IDBKeyRange.lowerBound(x, true) — field > x (exclusive)
// IDBKeyRange.upperBound(x)       — field <= x
// IDBKeyRange.bound(lower, upper, lowerOpen, upperOpen)

// ============================================================
// EXAMPLE 7 — Error Handling and Transaction Abort
// Story: Batch updates. If one fails (e.g., duplicate key),
// handle it gracefully without aborting the entire transaction.
// ============================================================

// WHY: One failed operation can abort the whole transaction
// unless you call event.preventDefault() on the error.

// ============================================================
// EXAMPLE 8 — Promisifying IndexedDB (Wrapper Pattern)
// Story: The callback API is tedious. A Promise wrapper enables
// clean async/await syntax — the pattern used by libraries
// like idb and Dexie.js.
// ============================================================

// WHY: Native IndexedDB is callback-based. Promises make it
// readable and composable with async/await.
// (Our getDB, addNote, getNote, etc. above already use this pattern)

// ============================================================
// EXAMPLE 9 — Schema Migration (Version Upgrades)
// Story: Incremental migrations check oldVersion to apply only
// the changes needed for each version bump.
// ============================================================

// WHY: Each version bump applies only its specific changes.
// Check oldVersion to apply migrations incrementally.
// Example (not run — would require version 2):
//
// function openDBv2() {
//     const req = indexedDB.open('OlaNotesDB', 2);
//     req.onupgradeneeded = function(event) {
//         const db = event.target.result;
//         const oldVersion = event.oldVersion;
//         if (oldVersion < 1) {
//             // v1: initial schema
//             const store = db.createObjectStore('notes', { keyPath: 'id', autoIncrement: true });
//             store.createIndex('byCategory', 'category', { unique: false });
//         }
//         if (oldVersion < 2) {
//             // v2: add tags store
//             if (!db.objectStoreNames.contains('tags')) {
//                 db.createObjectStore('tags', { keyPath: 'name' });
//             }
//         }
//     };
// }

// ============================================================
// EXAMPLE 10 — Practical: Offline-First Notes with Sync
// Story: Notes save to IndexedDB instantly. A sync indicator
// shows "saved locally" or "synced". When online, pending
// notes push to the server.
// ============================================================

// WHY: Save locally first, sync when online — the foundation
// of offline-first architecture.

async function syncNotes() {
    const allNotes = await getAllNotes();
    const unsynced = allNotes.filter(n => !n.synced);

    if (!unsynced.length) {
        log('All notes synced!', 'output-2');
        setSyncStatus('All synced', 'online');
        return;
    }

    log(`Syncing ${unsynced.length} notes...`, 'output-2');
    setSyncStatus(`Syncing ${unsynced.length} notes...`, 'online');

    for (const note of unsynced) {
        // In production: await fetch('/api/notes', { method: 'POST', body: JSON.stringify(note) });
        log(`Synced: "${note.title}"`, 'output-2');
        note.synced = true;
        await updateNote(note);
    }
    setSyncStatus('All synced', 'online');
}

// ============================================================
// UI RENDERING — Notes list with search and filter
// ============================================================

async function renderNotesList() {
    const container = document.getElementById('notes-list');
    if (!container) return;

    const searchTerm = (document.getElementById('search-notes')?.value || '').toLowerCase();
    const filterCat = document.getElementById('filter-category')?.value || 'all';

    let notes = await getAllNotes();

    // Apply search filter
    if (searchTerm) {
        notes = notes.filter(n =>
            n.title.toLowerCase().includes(searchTerm) ||
            n.body.toLowerCase().includes(searchTerm)
        );
    }

    // Apply category filter
    if (filterCat !== 'all') {
        notes = notes.filter(n => n.category === filterCat);
    }

    // Sort newest first
    notes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (!notes.length) {
        container.innerHTML = '<div class="empty-state">No notes found.</div>';
        return;
    }

    container.innerHTML = notes.map(note => `
        <div class="note-card" data-id="${note.id}">
            <div class="note-info">
                <div class="note-title-row">
                    <span class="note-id">#${note.id}</span>
                    <strong>${escapeHtml(note.title)}</strong>
                    <span class="note-category">${note.category}</span>
                    <span class="sync-badge ${note.synced ? 'synced' : 'pending'}">
                        ${note.synced ? 'synced' : 'pending'}
                    </span>
                </div>
                <div class="note-body">${escapeHtml(note.body)}</div>
                <div class="note-meta">${new Date(note.createdAt).toLocaleString()}</div>
            </div>
            <div class="note-actions">
                <button onclick="handleSyncNote(${note.id})">Sync</button>
                <button class="btn-danger" onclick="handleDeleteNote(${note.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================================
// DATABASE INSPECTOR
// ============================================================

async function inspectDatabase() {
    const inspector = document.getElementById('db-inspector');
    if (!inspector) return;

    try {
        const db = await getDB();
        const storeNames = Array.from(db.objectStoreNames);
        log(`DB: ${db.name} v${db.version}`, 'output-6');
        log(`Object stores: ${storeNames.join(', ')}`, 'output-6');

        let html = `<div style="color:#94a3b8;margin-bottom:0.5rem;">
            <strong style="color:var(--primary)">${db.name}</strong> v${db.version}
        </div>`;

        for (const storeName of storeNames) {
            const tx = db.transaction([storeName], 'readonly');
            const store = tx.objectStore(storeName);
            const countReq = store.count();

            await new Promise((resolve) => {
                countReq.onsuccess = () => {
                    const indexNames = Array.from(store.indexNames);
                    html += `<div class="store-info">
                        <div class="store-name">${storeName}</div>
                        <div class="store-detail">
                            Key Path: <span>${store.keyPath}</span> |
                            Auto-increment: <span>${store.autoIncrement}</span> |
                            Records: <span>${countReq.result}</span>
                        </div>
                        <div class="index-list">
                            ${indexNames.map(name => {
                                const idx = store.index(name);
                                return `<div class="index-item">
                                    Index: <span>${name}</span> (keyPath: ${idx.keyPath}, unique: ${idx.unique})
                                </div>`;
                            }).join('')}
                        </div>
                    </div>`;
                    resolve();
                };
            });
        }

        inspector.innerHTML = html;
        db.close();
    } catch (err) {
        inspector.innerHTML = `<div class="empty-state" style="color:var(--danger)">Error: ${err.message}</div>`;
    }
}

// ============================================================
// EVENT HANDLERS
// ============================================================

// Add note
document.getElementById('add-note-btn')?.addEventListener('click', async () => {
    const title = document.getElementById('note-title').value.trim();
    const body = document.getElementById('note-body').value.trim();
    const category = document.getElementById('note-category').value;

    if (!title) { log('Title is required!', 'output-2'); return; }

    await addNote(title, body, category);
    document.getElementById('note-title').value = '';
    document.getElementById('note-body').value = '';
});

// Clear all notes
document.getElementById('clear-notes-btn')?.addEventListener('click', async () => {
    await clearAllNotes();
});

// Search & filter
document.getElementById('search-notes')?.addEventListener('input', () => renderNotesList());
document.getElementById('filter-category')?.addEventListener('change', () => renderNotesList());
document.getElementById('refresh-notes-btn')?.addEventListener('click', () => renderNotesList());

// CRUD buttons
document.getElementById('get-note-btn')?.addEventListener('click', async () => {
    const id = Number(document.getElementById('note-id-input').value);
    if (!id) { log('Enter a note ID!', 'output-4'); return; }
    const note = await getNote(id);
    if (note) {
        log(`Found note #${id}: "${note.title}" [${note.category}]`, 'output-4');
        log(`  Body: ${note.body}`, 'output-4');
        log(`  Created: ${note.createdAt}`, 'output-4');
        log(`  Synced: ${note.synced}`, 'output-4');
    } else {
        log(`Note #${id} not found`, 'output-4');
    }
});

document.getElementById('update-note-btn')?.addEventListener('click', async () => {
    const id = Number(document.getElementById('note-id-input').value);
    if (!id) { log('Enter a note ID!', 'output-4'); return; }
    const note = await getNote(id);
    if (note) {
        note.title = note.title + ' (updated)';
        note.body = note.body + '\n[Updated at ' + new Date().toLocaleTimeString() + ']';
        await updateNote(note);
    } else {
        log(`Note #${id} not found`, 'output-4');
    }
});

document.getElementById('delete-note-btn')?.addEventListener('click', async () => {
    const id = Number(document.getElementById('note-id-input').value);
    if (!id) { log('Enter a note ID!', 'output-4'); return; }
    await deleteNote(id);
});

document.getElementById('get-all-btn')?.addEventListener('click', async () => {
    const notes = await getAllNotes();
    log(`Total notes: ${notes.length}`, 'output-4');
    notes.forEach(n => log(`  [${n.id}] ${n.title} (${n.category}, synced=${n.synced})`, 'output-4'));
});

// Index query
document.getElementById('query-index-btn')?.addEventListener('click', async () => {
    const indexName = document.getElementById('query-index').value;
    const value = document.getElementById('query-value').value;
    await queryByIndex(indexName, value);
});

// Cursor demo
document.getElementById('cursor-demo-btn')?.addEventListener('click', () => cursorDemo());

// Database inspector
document.getElementById('inspect-db-btn')?.addEventListener('click', () => inspectDatabase());

// Delete database
document.getElementById('delete-db-btn')?.addEventListener('click', async () => {
    // indexedDB.deleteDatabase('OlaNotesDB');
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => {
        log('Database deleted!', 'output-6');
        renderNotesList();
    };
    req.onerror = () => log('Failed to delete database', 'output-6');
    req.onblocked = () => log('Delete blocked — close other tabs', 'output-6');
});

// Global handlers for note actions (called from inline onclick)
window.handleDeleteNote = async function(id) {
    await deleteNote(id);
};

window.handleSyncNote = async function(id) {
    const note = await getNote(id);
    if (note) {
        note.synced = true;
        await updateNote(note);
        log(`Note #${id} marked as synced`, 'output-2');
    }
};

// ============================================================
// INITIALIZATION
// ============================================================

(async function init() {
    try {
        const db = await getDB();
        log(`DB opened: ${db.name} v${db.version}`, 'output-1');
        log(`Stores: ${Array.from(db.objectStoreNames).join(', ')}`, 'output-1');
        db.close();

        // Update sync status
        if (navigator.onLine) {
            setSyncStatus('Online — ready to sync', 'online');
        } else {
            setSyncStatus('Offline — saving locally', 'offline');
        }

        // Render notes list
        await renderNotesList();
    } catch (err) {
        log(`Error initializing: ${err.message}`, 'output-1');
        setSyncStatus('Error initializing DB', 'offline');
    }
})();

// Listen for online/offline
window.addEventListener('online', () => {
    setSyncStatus('Back online!', 'online');
    log('Network: back online', 'output-1');
});

window.addEventListener('offline', () => {
    setSyncStatus('Offline — saving locally', 'offline');
    log('Network: gone offline', 'output-1');
});

// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. IndexedDB is an async, transactional NoSQL database —
//    ideal for large structured data and offline apps.
// 2. Schema changes happen ONLY in onupgradeneeded, triggered
//    by bumping the version number.
// 3. All operations require a transaction: 'readonly' for reads,
//    'readwrite' for writes.
// 4. Indexes enable fast lookups on non-key fields.
// 5. IDBKeyRange enables range queries (BETWEEN, >, <).
// 6. Cursors iterate large datasets one record at a time.
// 7. Wrap the callback API in Promises for async/await.
// 8. Handle onblocked when other tabs hold older versions.
// 9. Apply schema migrations incrementally by checking oldVersion.
// 10. IndexedDB is the backbone of offline-first: save locally,
//     sync when online, show sync status to users.
