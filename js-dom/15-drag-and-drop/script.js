// ============================================================
// FILE 15: DRAG AND DROP
// Topic: HTML Drag and Drop API, sortable lists, Kanban boards, and accessibility
// WHY: Drag and drop is the foundation of interactive task management tools.
// Indian IT companies use Jira and Trello-style boards daily. Understanding
// the Drag and Drop API lets you build Kanban boards, sortable lists,
// file uploaders from scratch.
// ============================================================

// --- Helper: Log to console AND an on-page output element ---
function log(msg, targetId) {
    console.log(msg);
    const el = document.getElementById(targetId);
    if (el) el.textContent += msg + '\n';
}

log('=== Drag and Drop Tutorial ===', 'log-1');


// ============================================================
// EXAMPLE 1 — HTML Drag and Drop API Overview: The Jira Story
// Story: Indian IT companies like TCS, Infosys, and Wipro manage thousands
// of developers using Jira boards with columns — "To Do", "In Progress",
// "Code Review", "Done". Developers drag task cards between columns as
// work progresses. The HTML Drag and Drop API handles this complex
// interaction of picking up, carrying, and dropping elements.
// ============================================================

// WHY: Native browser feature — no libraries needed. Works through events
// on both the dragged element (source) and the drop zone (target).

// The Event Flow:
// 1. dragstart  — fires on SOURCE (setup data transfer)
// 2. drag       — fires repeatedly on SOURCE while moving
// 3. dragenter  — fires on DROP ZONE when dragged element enters
// 4. dragover   — fires repeatedly while hovering over DROP ZONE
// 5. dragleave  — fires when leaving a DROP ZONE
// 6. drop       — fires on DROP ZONE when user releases
// 7. dragend    — fires on SOURCE after drop (always fires)

log('Event flow: dragstart -> drag -> [dragenter -> dragover -> dragleave] -> drop -> dragend', 'log-1');


// ============================================================
// EXAMPLE 2 — Making Elements Draggable
// Story: Each Jira task card needs to be draggable. Add draggable="true"
// in HTML. The dragstart event configures WHAT is being dragged and
// provides visual feedback (making the source semi-transparent).
// ============================================================

// WHY: draggable attribute enables the behavior; dragstart configures it.

// ARIA announcer for accessibility
const announcer = document.getElementById('drag-announcer');
function announce(msg) {
    if (announcer) announcer.textContent = msg;
    log('[A11y] ' + msg, 'log-10');
}


// ============================================================
// EXAMPLES 3-5, 8 — Kanban Board Implementation
// ============================================================

// WHY: HTML elements do NOT accept drops by default. You must opt in
// by preventing default on dragover. This is the #1 gotcha.

// EXAMPLE 4 — event.dataTransfer Deep Dive
// setData(format, data) — multiple MIME type formats supported
// getData(format) — ONLY readable in 'drop' event (security restriction)
// effectAllowed (dragstart): 'none','copy','move','link','copyMove','all'
// dropEffect (dragover): 'none','copy','move','link' — controls cursor

// EXAMPLE 6 — Helper: Finding the Insertion Point
// For sortable lists and Kanban boards, precise insertion is essential.

function getDragAfterElement(container, mouseY) {
    const cards = [...container.querySelectorAll('.task-card:not(.dragging)')];

    return cards.reduce((closest, card) => {
        const rect = card.getBoundingClientRect();
        const offset = mouseY - (rect.top + rect.height / 2);
        // Find card with smallest NEGATIVE offset (first card below mouse)
        if (offset < 0 && offset > closest.offset) {
            return { offset, element: card };
        }
        return closest;
    }, { offset: Number.NEGATIVE_INFINITY, element: null }).element;
    // Returns null if mouse is below all cards (insert at end)
}

function updateColumnCounts() {
    document.querySelectorAll('.column').forEach(col => {
        const colId = col.dataset.columnId;
        const count = col.querySelectorAll('.task-card').length;
        const countEl = document.getElementById('count-' + colId);
        if (countEl) countEl.textContent = count;
    });
}

// --- DRAGSTART on task cards ---
document.querySelectorAll('.task-card').forEach(card => {
    card.addEventListener('dragstart', (event) => {
        const taskId = card.dataset.taskId;

        // setData(type, value) — store data for the drop zone
        event.dataTransfer.setData('text/plain', taskId);
        event.dataTransfer.setData('application/json', JSON.stringify({
            taskId,
            sourceColumn: card.closest('.column')?.dataset.columnId,
            title: card.querySelector('h4')?.textContent
        }));

        // effectAllowed — what operations are permitted
        event.dataTransfer.effectAllowed = 'move';

        // Visual feedback
        card.classList.add('dragging');
        log(`dragstart: ${taskId} from ${card.closest('.column')?.dataset.columnId}`, 'log-2');
    });

    card.addEventListener('dragend', (event) => {
        event.target.classList.remove('dragging');
        // Remove all drag-over highlights
        document.querySelectorAll('.column--drag-over').forEach(c => c.classList.remove('column--drag-over'));
        document.querySelectorAll('.drop-indicator').forEach(i => i.remove());
        log('dragend. Effect: ' + event.dataTransfer.dropEffect, 'log-2');
    });
});

// --- DROP ZONE events on columns ---
document.querySelectorAll('.column').forEach(column => {
    const taskList = column.querySelector('.task-list');

    // EXAMPLE 3 — dragenter
    column.addEventListener('dragenter', (event) => {
        event.preventDefault();
        column.classList.add('column--drag-over');
        event.dataTransfer.dropEffect = 'move';
    });

    // CRITICAL: Without preventDefault() in dragover, drop won't fire!
    column.addEventListener('dragover', (event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';

        // Show insertion point
        const dragging = document.querySelector('.task-card.dragging');
        if (!dragging || !taskList) return;

        const afterElement = getDragAfterElement(taskList, event.clientY);

        // Remove existing indicators
        taskList.querySelectorAll('.drop-indicator').forEach(i => i.remove());

        // Add drop indicator
        const indicator = document.createElement('div');
        indicator.className = 'drop-indicator';
        if (afterElement) {
            taskList.insertBefore(indicator, afterElement);
        } else {
            taskList.appendChild(indicator);
        }
    });

    // GOTCHA: dragleave fires when entering CHILD elements too.
    column.addEventListener('dragleave', (event) => {
        if (column.contains(event.relatedTarget)) return;
        column.classList.remove('column--drag-over');
        taskList.querySelectorAll('.drop-indicator').forEach(i => i.remove());
    });

    // EXAMPLE 3 — handleDrop
    column.addEventListener('drop', (event) => {
        event.preventDefault();
        column.classList.remove('column--drag-over');
        taskList.querySelectorAll('.drop-indicator').forEach(i => i.remove());

        // getData(type) — retrieve data from dragstart
        const taskId = event.dataTransfer.getData('text/plain');
        let data = {};
        try { data = JSON.parse(event.dataTransfer.getData('application/json')); } catch {}

        const card = document.querySelector(`[data-task-id="${taskId}"]`);
        if (!card || !taskList) return;

        const afterElement = getDragAfterElement(taskList, event.clientY);
        if (afterElement) {
            taskList.insertBefore(card, afterElement);
        } else {
            taskList.appendChild(card);
        }

        const destColumn = column.dataset.columnId;

        // Auto-assign if moving to in-progress
        if (destColumn === 'in-progress') {
            const assignee = card.querySelector('.task-assignee');
            if (assignee && assignee.textContent === 'Unassigned') {
                assignee.textContent = 'Current User';
                log(`Auto-assigned ${taskId} to Current User`, 'log-2');
            }
        }

        // Mark done
        if (destColumn === 'done') {
            log(`${taskId} completed!`, 'log-2');
        }

        updateColumnCounts();
        log(`Dropped: ${taskId} into ${destColumn}`, 'log-2');
        announce(`${data.title || taskId} moved to ${destColumn}`);
    });
});


// ============================================================
// EXAMPLE 7 — Sortable List: Reordering Within a Single Column
// Story: Within a Jira sprint column, the product owner reorders tasks
// by priority. Dragging "Fix critical payment bug" above "Update profile
// UI" changes priority. Source and drop zone are the SAME container.
// ============================================================

// WHY: Most common drag pattern. Moving items within the same parent.

const sortableList = document.getElementById('sortable-list');

function getSortAfterElement(container, mouseY) {
    const items = [...container.querySelectorAll('.sortable-item:not(.dragging)')];
    return items.reduce((closest, item) => {
        const rect = item.getBoundingClientRect();
        const offset = mouseY - (rect.top + rect.height / 2);
        if (offset < 0 && offset > closest.offset) {
            return { offset, element: item };
        }
        return closest;
    }, { offset: Number.NEGATIVE_INFINITY, element: null }).element;
}

function updateSortOrder() {
    const order = [...sortableList.querySelectorAll('.sortable-item')]
        .map(item => item.dataset.itemId);
    document.getElementById('sort-result').textContent = 'Current order: ' + order.join(', ');
    log('New order: ' + order.join(', '), 'log-6');
}

sortableList.addEventListener('dragstart', (event) => {
    const item = event.target.closest('.sortable-item');
    if (!item) return;
    event.dataTransfer.setData('text/plain', item.dataset.itemId);
    event.dataTransfer.effectAllowed = 'move';
    item.classList.add('dragging');
});

sortableList.addEventListener('dragover', (event) => {
    event.preventDefault();
    const dragging = sortableList.querySelector('.dragging');
    if (!dragging) return;

    const afterElement = getSortAfterElement(sortableList, event.clientY);
    if (afterElement) {
        sortableList.insertBefore(dragging, afterElement);
    } else {
        sortableList.appendChild(dragging);
    }
});

sortableList.addEventListener('drop', (event) => {
    event.preventDefault();
    updateSortOrder();
});

sortableList.addEventListener('dragend', (event) => {
    const item = event.target.closest('.sortable-item');
    if (item) item.classList.remove('dragging');
    updateSortOrder();
});

log('Sortable list initialized. Drag items to reorder.', 'log-6');


// ============================================================
// EXAMPLE 9 — Touch Device Fallback: Pointer Events
// Story: Many Indian developers access Jira from phones during commutes
// on Mumbai locals. HTML Drag and Drop API does NOT work on touch devices!
// Pointer events (pointerdown/move/up) simulate drag on mobile.
// ============================================================

// WHY: HTML DnD API is desktop-only. Touch needs pointer/touch events.

// NOTE: Touch drag implementation is omitted for simplicity but the
// pattern is: pointerdown captures element, pointermove updates position
// using style.position='fixed', pointerup drops at elementFromPoint().


// ============================================================
// EXAMPLE 10 — Accessibility: Keyboard-Based Reordering
// Story: Indian government sites must comply with GIGW accessibility
// standards. A Jira-like board must work for keyboard-only users. Space
// picks up/drops a card, arrows move it, Escape cancels. ARIA live
// regions announce changes to screen readers.
// ============================================================

// WHY: Drag is inherently a mouse gesture. Keyboard alternative is
// REQUIRED by WCAG 2.1 — not optional.

let selectedCard = null;
let isMoving = false;
let originalParent = null;
let originalNextSibling = null;

document.addEventListener('keydown', (event) => {
    const card = event.target.closest('.task-card');
    if (!card) return;

    switch (event.key) {
        case ' ':
        case 'Enter':
            event.preventDefault();
            if (!isMoving) {
                // Pick up
                selectedCard = card;
                isMoving = true;
                originalParent = card.parentNode;
                originalNextSibling = card.nextElementSibling;
                card.classList.add('keyboard-dragging');
                card.setAttribute('aria-grabbed', 'true');
                announce(`Picked up: ${card.querySelector('h4')?.textContent}. Use arrows to move, Space to drop, Escape to cancel.`);
            } else {
                // Drop
                isMoving = false;
                card.classList.remove('keyboard-dragging');
                card.setAttribute('aria-grabbed', 'false');
                updateColumnCounts();
                announce(`Dropped: ${card.querySelector('h4')?.textContent} in ${card.closest('.column')?.querySelector('h3')?.textContent}`);
                selectedCard = null;
            }
            break;

        case 'ArrowUp':
            if (isMoving && selectedCard?.previousElementSibling) {
                event.preventDefault();
                const prev = selectedCard.previousElementSibling;
                if (prev && !prev.classList.contains('drop-indicator')) {
                    selectedCard.parentNode.insertBefore(selectedCard, prev);
                    announce('Moved up');
                }
            }
            break;

        case 'ArrowDown':
            if (isMoving && selectedCard?.nextElementSibling) {
                event.preventDefault();
                const next = selectedCard.nextElementSibling;
                if (next) {
                    selectedCard.parentNode.insertBefore(selectedCard, next.nextElementSibling);
                    announce('Moved down');
                }
            }
            break;

        case 'ArrowLeft':
        case 'ArrowRight':
            if (isMoving && selectedCard) {
                event.preventDefault();
                const currentCol = selectedCard.closest('.column');
                const allColumns = [...document.querySelectorAll('.column')];
                const currentIdx = allColumns.indexOf(currentCol);
                const targetIdx = event.key === 'ArrowLeft' ? currentIdx - 1 : currentIdx + 1;

                if (targetIdx >= 0 && targetIdx < allColumns.length) {
                    const targetList = allColumns[targetIdx].querySelector('.task-list');
                    if (targetList) {
                        targetList.appendChild(selectedCard);
                        selectedCard.focus();
                        updateColumnCounts();
                        announce(`Moved to ${allColumns[targetIdx].querySelector('h3')?.textContent}`);
                    }
                }
            }
            break;

        case 'Escape':
            if (isMoving && selectedCard) {
                event.preventDefault();
                // Cancel — return to original position
                if (originalParent) {
                    if (originalNextSibling) {
                        originalParent.insertBefore(selectedCard, originalNextSibling);
                    } else {
                        originalParent.appendChild(selectedCard);
                    }
                }
                isMoving = false;
                selectedCard.classList.remove('keyboard-dragging');
                selectedCard.setAttribute('aria-grabbed', 'false');
                updateColumnCounts();
                announce('Move cancelled');
                selectedCard = null;
            }
            break;
    }
});

log('Keyboard: Space=pick/drop, Arrows=move, Escape=cancel', 'log-10');


// ============================================================
// EXAMPLE 11 — File Drop Zone: Handling Dropped Files
// Story: Indian startups need file upload — Zerodha for KYC docs, Razorpay
// for invoices. A drop zone lets users drag files from desktop directly
// onto the page, faster than the "Browse" button approach.
// ============================================================

// WHY: dataTransfer.files gives access to desktop files dragged into browser.

const fileDropZone = document.getElementById('file-drop-zone');
const fileListEl = document.getElementById('file-list');

function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
}

fileDropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    fileDropZone.classList.add('drag-over');
});

fileDropZone.addEventListener('dragleave', (e) => {
    if (fileDropZone.contains(e.relatedTarget)) return;
    fileDropZone.classList.remove('drag-over');
});

fileDropZone.addEventListener('drop', (event) => {
    event.preventDefault();
    fileDropZone.classList.remove('drag-over');

    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];

    Array.from(event.dataTransfer.files).forEach((file, i) => {
        const entry = document.createElement('div');
        let status = '';
        let statusClass = '';
        let entryClass = '';

        if (file.size > maxSize) {
            status = 'Too large!';
            statusClass = 'error';
            entryClass = 'rejected';
            log(`  ${file.name} (${formatSize(file.size)}) - TOO LARGE`, 'log-11');
        } else if (!allowed.includes(file.type)) {
            status = 'Invalid type!';
            statusClass = 'error';
            entryClass = 'rejected';
            log(`  ${file.name} (${formatSize(file.size)}) - INVALID TYPE: ${file.type}`, 'log-11');
        } else {
            status = 'Accepted';
            statusClass = 'ok';
            entryClass = 'accepted';
            log(`  ${file.name} (${formatSize(file.size)}) - ACCEPTED`, 'log-11');
        }

        entry.className = `file-entry ${entryClass}`;
        entry.innerHTML = `
            <span class="file-name">${file.name}</span>
            <span class="file-size">${formatSize(file.size)}</span>
            <span class="file-status ${statusClass}">${status}</span>
        `;
        fileListEl.appendChild(entry);
    });
});

// Prevent page-level drop (opening file in browser)
document.addEventListener('dragover', (e) => e.preventDefault());
document.addEventListener('drop', (e) => e.preventDefault());

log('File drop zone ready. Accepts: JPEG, PNG, PDF (max 5MB).', 'log-11');
log('Size format test: ' + formatSize(1234567), 'log-11');


// ============================================================
// EXAMPLE 12 — Practical: Complete Kanban Board
// Story: The complete blueprint for a production Kanban board — HTML with
// ARIA attributes, CSS for columns and drag states. Indian IT teams use
// this as a starting point for custom project management tools.
// ============================================================

// WHY: See how all pieces fit together in a complete reference.

log('Kanban board: drag cards between columns, reorder within columns.', 'log-12');
log('Keyboard accessible: Tab to focus, Space to pick up, Arrows to move.', 'log-12');
log('ARIA live region announces all moves to screen readers.', 'log-12');


// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. Drag events: SOURCE (dragstart, drag, dragend) and DROP ZONE
//    (dragenter, dragover, dragleave, drop).
//
// 2. CRITICAL: preventDefault() in dragover is required for drop to work.
//
// 3. dataTransfer.setData() in dragstart, getData() in drop only.
//    Data is unreadable in dragover for security.
//
// 4. effectAllowed (dragstart) controls available operations.
//    dropEffect (dragover) controls cursor and actual operation.
//
// 5. Sortable lists: use getBoundingClientRect() to find insertion point
//    by comparing mouse Y to each card's vertical center.
//
// 6. dragleave fires on child elements — check relatedTarget or contains().
//
// 7. HTML DnD API does NOT work on touch. Use pointer events as fallback.
//
// 8. Accessibility: keyboard alt (Space=pick/drop, Arrows=move, Escape=cancel)
//    with ARIA live regions. REQUIRED by WCAG 2.1.
//
// 9. dataTransfer.files provides desktop file drag support.
//    Always validate type and size before upload.
//
// 10. For production, consider SortableJS or dnd-kit for touch, keyboard,
//     and accessibility. But understanding native API is essential.
