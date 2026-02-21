// ============================================================
// FILE 13: MUTATION OBSERVER
// Topic: Watching the DOM for changes — added nodes, attribute modifications, and text updates
// WHY: Modern web apps are highly dynamic. Third-party scripts inject payment
// widgets, chat plugins add message bubbles, and SPAs constantly modify the DOM.
// MutationObserver lets you react to these changes without polling. Paytm uses
// it to detect and style third-party payment buttons injected into merchant pages.
// ============================================================

// --- Helper: Log to console AND an on-page output element ---
function log(msg, targetId) {
    console.log(msg);
    const el = document.getElementById(targetId);
    if (el) el.textContent += msg + '\n';
}

log('=== MutationObserver Tutorial ===', 'log-1');


// ============================================================
// EXAMPLE 1 — What Is MutationObserver? The Paytm Story
// Story: Paytm provides a payment gateway SDK that merchants embed on
// checkout pages. The SDK injects payment buttons, QR codes, and UPI links.
// Merchants' CSS can break the widget appearance. Paytm uses MutationObserver
// to detect when injected elements get modified and auto-corrects styling.
// ============================================================

// WHY: MutationObserver replaced deprecated Mutation Events (DOMNodeInserted)
// which were synchronous and terrible for performance. MutationObserver is
// asynchronous — batches changes and delivers after current script finishes.

// --- DEPRECATED (never use) ---
// document.addEventListener('DOMNodeInserted', handler); // Synchronous, slow!

// --- MODERN: MutationObserver ---
// 1. Create observer with callback
// 2. Configure WHAT to watch
// 3. Tell it WHERE to watch
// 4. Callback receives batched MutationRecord objects

log('MutationObserver: async, batched, efficient. Replaces deprecated Mutation Events.', 'log-1');


// ============================================================
// EXAMPLE 2 — Creating a MutationObserver: Basics
// Story: Paytm's chat support widget injects a floating icon on merchant
// pages. The observer detects when the icon is added to apply the merchant's
// custom theme colors, matching the widget to the site's design.
// ============================================================

// WHY: Creating MutationObserver requires understanding the constructor,
// callback signature, observe() method, and config object.

const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendButton = document.getElementById('send-message');

// --- Live Mutation Log (Example 4) ---
const mutationLogEl = document.getElementById('mutation-log');
let mutationLogCount = 0;

function addMutationLogEntry(type, detail) {
    mutationLogCount++;
    const entry = document.createElement('div');
    entry.className = 'mutation-entry ' + type;
    entry.textContent = `#${mutationLogCount} [${type}] ${detail}`;
    mutationLogEl.appendChild(entry);
    mutationLogEl.scrollTop = mutationLogEl.scrollHeight;
}

// Main chat observer
const chatObserver = new MutationObserver((mutationsList, observerRef) => {
    // mutationsList: array of MutationRecord objects (batched)
    // observerRef: reference to the observer instance
    log(`Received ${mutationsList.length} mutations`, 'log-2');
    for (const mutation of mutationsList) {
        log(`  Type: ${mutation.type}`, 'log-2');

        // EXAMPLE 4 — MutationRecord: Understanding What Changed
        // Each MutationRecord describes ONE change.
        switch (mutation.type) {
            case 'childList':
                // mutation.addedNodes / removedNodes — NodeLists of changed nodes
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        addMutationLogEntry('childList', `Added: <${node.tagName.toLowerCase()}> .${node.className}`);
                        log(`  Added: ${node.tagName} .${node.className}`, 'log-4');
                    }
                });
                mutation.removedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        addMutationLogEntry('childList', `Removed: <${node.tagName.toLowerCase()}>`);
                        log(`  Removed: ${node.tagName}`, 'log-4');
                    }
                });
                break;
            case 'attributes':
                // mutation.attributeName, mutation.oldValue (if attributeOldValue: true)
                addMutationLogEntry('attributes', `"${mutation.attributeName}" changed on ${mutation.target.tagName || 'node'}`);
                break;
            case 'characterData':
                addMutationLogEntry('characterData', `Text changed: "${mutation.target.textContent?.slice(0, 40)}..."`);
                break;
        }
        // mutation.target: parent (childList), element (attributes), text node (characterData)
    }
});

// observer.observe(targetElement, config)
chatObserver.observe(chatMessages, {
    childList: true,       // Watch added/removed child nodes
    attributes: true,      // Watch attribute changes
    characterData: true,   // Watch text content changes
    subtree: true          // Watch ALL descendants
});

// Chat send functionality
function addMessage(text, type = 'outgoing') {
    const msg = document.createElement('div');
    msg.className = `message ${type}`;
    msg.innerHTML = `<span class="msg-sender">${type === 'outgoing' ? 'You' : 'Support Bot'}</span><p>${text}</p>`;
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

sendButton.addEventListener('click', () => {
    const text = chatInput.value.trim();
    if (!text) return;
    addMessage(text, 'outgoing');
    chatInput.value = '';
    // Auto-reply
    setTimeout(() => {
        addMessage('Thanks for your message! A support agent will respond shortly.', 'incoming');
    }, 800);
});

chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendButton.click();
});


// ============================================================
// EXAMPLE 3 — Config Options Deep Dive
// Story: Paytm's gateway injects a payment form, loading spinner, error
// messages, and success notifications. The team watches for different
// changes: new elements (childList), CSS classes (attributes), error
// text updates (characterData). Each needs a specific config option.
// ============================================================

// WHY: The config object determines WHAT changes get reported. At least
// one of childList, attributes, or characterData must be true.

// --- childList: Added/removed child nodes ---
// Fires on: appendChild, removeChild, innerHTML changes

// --- attributes: Attribute changes ---
// Fires on: setAttribute, removeAttribute, className changes

// --- attributeFilter: Only specific attributes (more efficient) ---
// observer.observe(target, { attributes: true, attributeFilter: ['class', 'style'] });

// --- attributeOldValue: Capture previous value ---
// observer.observe(target, { attributes: true, attributeOldValue: true });
// Access via mutation.oldValue

// --- characterData: Text content of TEXT NODES ---
// Fires when text node content changes.

// --- subtree: Watch ALL descendants, not just direct children ---
// CAUTION: Watching subtree on document.body is expensive on complex pages!

const attrTarget = document.getElementById('attr-target');
const attrStatusDisplay = document.getElementById('attr-status-display');

const attrObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        if (mutation.type === 'attributes') {
            const name = mutation.attributeName;
            const oldVal = mutation.oldValue;
            const newVal = mutation.target.getAttribute(name);
            log(`Attribute "${name}": "${oldVal}" -> "${newVal}"`, 'log-3');
            addMutationLogEntry('attributes', `"${name}": "${oldVal}" -> "${newVal}"`);

            if (name === 'data-status') {
                attrStatusDisplay.textContent = `Status: ${newVal}`;
            }
        }
    }
});

attrObserver.observe(attrTarget, {
    attributes: true,
    attributeFilter: ['data-status', 'data-priority', 'class'],
    attributeOldValue: true
});

document.getElementById('attr-processing').addEventListener('click', () => {
    attrTarget.setAttribute('data-status', 'processing');
});
document.getElementById('attr-success').addEventListener('click', () => {
    attrTarget.setAttribute('data-status', 'success');
});
document.getElementById('attr-failed').addEventListener('click', () => {
    attrTarget.setAttribute('data-status', 'failed');
});
document.getElementById('attr-priority').addEventListener('click', () => {
    const current = attrTarget.getAttribute('data-priority');
    attrTarget.setAttribute('data-priority', current === 'normal' ? 'high' : 'normal');
});
document.getElementById('attr-add-class').addEventListener('click', () => {
    attrTarget.classList.toggle('highlighted');
});


// ============================================================
// EXAMPLE 5 — disconnect() and takeRecords()
// Story: Paytm's SDK observes the checkout page during payment processing.
// Once payment completes (success/failure), no need to keep observing.
// Before disconnecting, takeRecords() processes pending mutations.
// ============================================================

// WHY: disconnect() stops ALL observations. takeRecords() delivers any
// pending mutations before disconnect for clean teardown.

// No per-element unobserve (unlike IntersectionObserver).

let chatObserverConnected = true;

document.getElementById('observer-disconnect').addEventListener('click', () => {
    if (chatObserverConnected) {
        // takeRecords() — returns pending undelivered MutationRecords
        const pending = chatObserver.takeRecords();
        log(`Processing ${pending.length} pending mutations before disconnect`, 'log-5');
        // disconnect() — stop ALL observations (reusable via observe() again)
        chatObserver.disconnect();
        chatObserverConnected = false;
        log('Chat observer DISCONNECTED.', 'log-5');
    }
});

document.getElementById('observer-reconnect').addEventListener('click', () => {
    if (!chatObserverConnected) {
        chatObserver.observe(chatMessages, {
            childList: true, attributes: true, characterData: true, subtree: true
        });
        chatObserverConnected = true;
        log('Chat observer RECONNECTED.', 'log-5');
    }
});

document.getElementById('take-records').addEventListener('click', () => {
    const records = chatObserver.takeRecords();
    log(`takeRecords() returned ${records.length} pending mutations.`, 'log-5');
});

document.getElementById('clear-mutation-log').addEventListener('click', () => {
    mutationLogEl.innerHTML = '';
    mutationLogCount = 0;
});


// ============================================================
// EXAMPLE 6 — Use Case: Detecting Dynamically Added Elements
// Story: A merchant uses Paytm alongside Google Analytics, a chat widget,
// and an offer banner service. These scripts inject DOM elements at
// unpredictable times. Paytm detects when their payment button appears
// and when competitor buttons appear for conversion tracking.
// ============================================================

// WHY: Third-party scripts load asynchronously and inject elements anytime.
// MutationObserver is the only reliable detection without polling.

const dynamicContainer = document.getElementById('dynamic-container');

function watchForDynamicElements(selectors, callback) {
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type !== 'childList') continue;

            mutation.addedNodes.forEach(node => {
                if (node.nodeType !== Node.ELEMENT_NODE) return;

                // Check if added node matches any selector
                selectors.forEach(selector => {
                    if (node.matches(selector)) {
                        callback(node, selector);
                    }
                    // Also check nested children
                    node.querySelectorAll?.(selector).forEach(match => {
                        callback(match, selector);
                    });
                });
            });
        }
    });

    observer.observe(dynamicContainer, { childList: true, subtree: true });
    log('Watching for: ' + selectors.join(', '), 'log-6');
    return observer;
}

const dynamicWatcher = watchForDynamicElements(
    ['.paytm-widget', '.chat-widget', '.ad-banner'],
    (element, selector) => {
        log(`Detected "${selector}": ${element.textContent?.trim().slice(0, 40)}`, 'log-6');
        dynamicContainer.classList.add('active');
        setTimeout(() => dynamicContainer.classList.remove('active'), 1000);
    }
);

document.getElementById('inject-widget').addEventListener('click', () => {
    const widget = document.createElement('div');
    widget.className = 'injected-widget paytm-widget';
    widget.innerHTML = '<span class="widget-icon">&#128179;</span> <span>Paytm Payment Button</span>';
    dynamicContainer.appendChild(widget);
});

document.getElementById('inject-chat').addEventListener('click', () => {
    const widget = document.createElement('div');
    widget.className = 'injected-widget chat-widget';
    widget.innerHTML = '<span class="widget-icon">&#128172;</span> <span>Live Chat Support</span>';
    dynamicContainer.appendChild(widget);
});

document.getElementById('inject-ad').addEventListener('click', () => {
    const widget = document.createElement('div');
    widget.className = 'injected-widget ad-banner';
    widget.innerHTML = '<span class="widget-icon">&#128226;</span> <span>Special Offer Banner</span>';
    dynamicContainer.appendChild(widget);
});


// ============================================================
// EXAMPLE 7 — Use Case: Auto-Format Card Number Input
// Story: Paytm's payment form auto-formats card numbers with spaces:
// "4111111111111111" becomes "4111 1111 1111 1111". MutationObserver
// watches for external scripts (autofill) modifying the value attribute,
// ensuring formatting applies regardless of how the value changes.
// ============================================================

// WHY: Input 'input' events don't fire on programmatic value changes.
// MutationObserver catches attribute changes from any source.

// NOTE: MutationObserver does NOT observe input.value property changes
// via JS (e.g., input.value = 'new'). It DOES observe setAttribute('value', 'new').
// For input values, combine input events + MutationObserver.

const cardInput = document.getElementById('card-number');

function formatCardNumber(raw) {
    const digits = raw.replace(/\D/g, '').slice(0, 16);
    return (digits.match(/.{1,4}/g) || []).join(' ');
}

cardInput.addEventListener('input', () => {
    const cursorPos = cardInput.selectionStart;
    const raw = cardInput.value;
    const formatted = formatCardNumber(raw);
    if (raw !== formatted) {
        cardInput.value = formatted;
        // Adjust cursor position for added spaces
        const diff = formatted.length - raw.length;
        cardInput.setSelectionRange(cursorPos + diff, cursorPos + diff);
        log(`Formatted: "${raw}" -> "${formatted}"`, 'log-7');
    }
});

log('Card formatter: ' + formatCardNumber('4111111111111111'), 'log-7');
log('Card formatter: ' + formatCardNumber('411111'), 'log-7');


// ============================================================
// EXAMPLE 8 — Use Case: Undo System Using Mutation Records
// Story: Paytm's internal admin dashboard has a visual page builder for
// promotional banners. An undo system records all DOM mutations and
// reverses them — removing what was added, restoring what was removed,
// reverting attribute changes.
// ============================================================

// WHY: MutationRecords contain enough info to reverse changes. Powerful
// pattern for undo systems without virtual DOM.

const undoPlayground = document.getElementById('undo-playground');
const undoStack = [];
let isUndoing = false;
let undoItemCounter = 0;

const undoObserver = new MutationObserver((mutations) => {
    if (isUndoing) return; // Guard against infinite loops
    undoStack.push(mutations.map(m => ({
        type: m.type,
        target: m.target,
        addedNodes: Array.from(m.addedNodes),
        removedNodes: Array.from(m.removedNodes),
        attributeName: m.attributeName,
        oldValue: m.oldValue,
        nextSibling: m.nextSibling
    })));
    document.getElementById('undo-stack-count').textContent = `Stack: ${undoStack.length}`;
    log(`Recorded changes. Stack: ${undoStack.length}`, 'log-8');
});

undoObserver.observe(undoPlayground, {
    childList: true,
    attributes: true,
    characterData: true,
    subtree: true,
    attributeOldValue: true,
    characterDataOldValue: true
});

const colors = ['blue', 'green', 'purple', 'red', 'orange'];

document.getElementById('add-undo-item').addEventListener('click', () => {
    undoItemCounter++;
    const item = document.createElement('div');
    item.className = 'undo-item';
    const color = colors[undoItemCounter % colors.length];
    item.setAttribute('data-color', color);
    item.textContent = `Item ${String.fromCharCode(64 + undoItemCounter + 3)}`;
    undoPlayground.appendChild(item);
});

document.getElementById('remove-undo-item').addEventListener('click', () => {
    const lastItem = undoPlayground.querySelector('.undo-item:last-child');
    if (lastItem) undoPlayground.removeChild(lastItem);
});

document.getElementById('change-undo-attr').addEventListener('click', () => {
    const items = undoPlayground.querySelectorAll('.undo-item');
    if (items.length > 0) {
        const randomItem = items[Math.floor(Math.random() * items.length)];
        const newColor = colors[Math.floor(Math.random() * colors.length)];
        randomItem.setAttribute('data-color', newColor);
    }
});

document.getElementById('undo-btn').addEventListener('click', () => {
    if (!undoStack.length) {
        log('Nothing to undo', 'log-8');
        return;
    }
    isUndoing = true;
    const group = undoStack.pop();
    for (let i = group.length - 1; i >= 0; i--) {
        const r = group[i];
        if (r.type === 'childList') {
            r.addedNodes.forEach(n => n.parentNode?.removeChild(n));
            r.removedNodes.forEach(n => r.target.insertBefore(n, r.nextSibling));
        } else if (r.type === 'attributes') {
            r.oldValue === null
                ? r.target.removeAttribute(r.attributeName)
                : r.target.setAttribute(r.attributeName, r.oldValue);
        } else if (r.type === 'characterData') {
            r.target.textContent = r.oldValue;
        }
    }
    isUndoing = false;
    document.getElementById('undo-stack-count').textContent = `Stack: ${undoStack.length}`;
    log(`Undo done. Stack: ${undoStack.length}`, 'log-8');
});


// ============================================================
// EXAMPLE 9 — Performance and Comparison with Alternatives
// Story: Paytm initially observed document.body with subtree: true. Hundreds
// of mutations/sec caused lag. They scoped narrowly, batched with rAF, and
// dropped the older polling approach they had used before MutationObserver.
// ============================================================

// WHY: MutationObserver is performant but not free. Know the rules and alternatives.

// Performance Rules:
// 1. Narrow target — don't observe document.body + subtree unless necessary
// 2. Use attributeFilter — avoids processing every attribute change
// 3. Batch DOM writes with requestAnimationFrame inside callback
// 4. Guard against infinite loops (callback modifying DOM triggers more mutations)

// Alternatives comparison:
// Polling (setInterval) — wastes CPU, misses changes. Hack.
// Mutation Events (DOMNodeInserted) — synchronous, slow. DEPRECATED.
// MutationObserver — async, batched, efficient. STANDARD.

log('Performance rules: narrow target, attributeFilter, batch with rAF, guard loops.', 'log-9');


// ============================================================
// EXAMPLE 11 — Practical: Live Character Counter for contenteditable
// Story: Paytm's internal tool has a rich text editor using contenteditable
// divs. The character counter must update on typing, pasting, and voice
// input. Since contenteditable doesn't fire 'input' events consistently,
// MutationObserver watches content changes directly.
// ============================================================

// WHY: contenteditable + input events are unreliable across browsers.
// MutationObserver on characterData + childList catches ALL changes.

const richEditor = document.getElementById('rich-editor');
const charCountEl = document.getElementById('char-count');
const charMaxEl = document.getElementById('char-max');
const counterFill = document.getElementById('counter-fill');
const MAX_CHARS = 500;

function updateCharCounter() {
    const text = richEditor.textContent || '';
    const count = text.length;
    const remaining = MAX_CHARS - count;
    const pct = Math.min(100, (count / MAX_CHARS) * 100);

    charCountEl.textContent = count;
    counterFill.style.width = pct + '%';

    counterFill.classList.remove('warning', 'danger');
    if (remaining < 0) {
        counterFill.classList.add('danger');
        log(`OVER LIMIT! ${count}/${MAX_CHARS}`, 'log-11');
    } else if (remaining < 50) {
        counterFill.classList.add('warning');
    }
}

const editorObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        if (mutation.type === 'characterData' || mutation.type === 'childList') {
            updateCharCounter();
            break; // One update per batch is enough
        }
    }
});

editorObserver.observe(richEditor, {
    characterData: true,  // Text typing
    childList: true,      // New lines, pasted content
    subtree: true         // All text nodes inside
});

// Also handle input event as fallback
richEditor.addEventListener('input', updateCharCounter);
updateCharCounter(); // Initial count


// ============================================================
// EXAMPLE 12 — Practical: Security Monitor for Script Injections
// Story: Paytm's security team monitors merchant checkout pages for
// unauthorized script injections (Magecart attacks). MutationObserver
// detects when new <script> or <iframe> elements from unknown domains
// appear. Suspicious elements are blocked and alerts sent to dashboard.
// ============================================================

// WHY: Supply chain attacks via injected scripts are a real threat.
// MutationObserver provides real-time DOM modification detection.

const allowedDomains = ['paytm.com', 'paytm.in', 'google.com'];
const securityAlerts = document.getElementById('security-alerts');

function isAllowed(src) {
    if (!src) return true;
    try {
        const u = new URL(src);
        return allowedDomains.some(d => u.hostname.endsWith(d));
    } catch {
        return false;
    }
}

function addSecurityAlert(type, src, isThreat) {
    const noAlerts = securityAlerts.querySelector('.no-alerts');
    if (noAlerts) noAlerts.remove();

    const alert = document.createElement('div');
    alert.className = `security-alert ${isThreat ? 'threat' : 'safe'}`;
    alert.innerHTML = `<span>${isThreat ? '&#9888;' : '&#10003;'}</span> <span>${type}: ${src}</span>`;
    securityAlerts.appendChild(alert);
}

// We simulate script injection by adding elements to a hidden container
const securityTarget = document.createElement('div');
securityTarget.id = 'security-sandbox';
securityTarget.style.display = 'none';
document.body.appendChild(securityTarget);

const securityObserver = new MutationObserver((mutations) => {
    for (const m of mutations) {
        if (m.type !== 'childList') continue;
        m.addedNodes.forEach(node => {
            if (node.nodeType !== Node.ELEMENT_NODE) return;
            ['SCRIPT', 'IFRAME'].forEach(tag => {
                const els = node.tagName === tag ? [node] : [];
                node.querySelectorAll?.(tag.toLowerCase()).forEach(e => els.push(e));
                els.forEach(el => {
                    const src = el.getAttribute('data-mock-src') || el.getAttribute('src') || '';
                    if (src && !isAllowed(src)) {
                        log(`SECURITY: Unauthorized ${tag}: ${src}`, 'log-12');
                        addSecurityAlert(tag, src, true);
                    } else if (src) {
                        log(`SECURITY: Allowed ${tag}: ${src}`, 'log-12');
                        addSecurityAlert(tag, src, false);
                    }
                });
            });
        });
    }
});

securityObserver.observe(securityTarget, { childList: true, subtree: true });

log('Security monitor active. Allowed: ' + allowedDomains.join(', '), 'log-12');
log('paytm.com? ' + isAllowed('https://checkout.paytm.com/sdk.js'), 'log-12');
log('evil.com? ' + isAllowed('https://evil.com/skimmer.js'), 'log-12');

document.getElementById('inject-safe-script').addEventListener('click', () => {
    const el = document.createElement('div');
    el.setAttribute('data-mock-src', 'https://checkout.paytm.com/sdk.js');
    el.dataset.mockTag = 'SCRIPT';
    // Simulate by using a div with a matching tag name check workaround
    const script = document.createElement('script');
    script.setAttribute('data-mock-src', 'https://checkout.paytm.com/sdk.js');
    securityTarget.appendChild(script);
});

document.getElementById('inject-evil-script').addEventListener('click', () => {
    const script = document.createElement('script');
    script.setAttribute('data-mock-src', 'https://evil.com/skimmer.js');
    securityTarget.appendChild(script);
});


// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. MutationObserver watches DOM changes asynchronously in batches.
//    Replaced deprecated synchronous Mutation Events.
//
// 2. Constructor: new MutationObserver(callback). Start: observer.observe(target, config).
//    At least one of childList, attributes, or characterData must be true.
//
// 3. Config: childList (nodes), attributes, characterData (text), subtree (descendants),
//    attributeFilter (specific attrs), attributeOldValue, characterDataOldValue.
//
// 4. MutationRecord: type, target, addedNodes, removedNodes, attributeName, oldValue.
//
// 5. Lifecycle: disconnect() stops ALL observations. takeRecords() returns pending records.
//    No per-element unobserve (unlike IntersectionObserver).
//
// 6. Performance: Narrow target, use attributeFilter, batch with rAF, guard against loops.
//
// 7. Use cases: detect dynamic elements, auto-format inputs, undo systems,
//    character counters, security monitoring.
//
// 8. Does NOT observe input.value changes via JS. Watches DOM structure and attributes.
//
// 9. Avoid document.body + subtree unless necessary — processes everything.
//
// 10. MutationObserver is the only recommended approach. Never use polling or Mutation Events.
