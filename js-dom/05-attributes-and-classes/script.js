// ============================================================
// FILE 05: ATTRIBUTES AND CLASSES
// Topic: Managing HTML attributes, CSS classes, inline styles, and data attributes
// WHY: Every interactive UI depends on changing attributes and classes.
// Razorpay's payment button goes from "Pay Now" (enabled, blue) to
// "Processing..." (disabled, grey) by toggling classes, setting the
// disabled attribute, and updating data attributes for tracking.
// ============================================================

// --- Helper: log to both console and on-page output panel ---
function log(msg, targetId) {
  console.log(msg);
  const el = document.getElementById(targetId);
  if (el) el.textContent += msg + '\n';
}

// ============================================================
// EXAMPLE 1 — Razorpay Payment Button States
// Story: Razorpay's checkout has a payment button with states: idle
// (blue, clickable), processing (grey, disabled, spinner), success
// (green, checkmark), error (red, retry). Each state change involves
// toggling CSS classes, modifying attributes (disabled, aria-label),
// updating data attributes (data-payment-id), and changing styles.
// ============================================================

function setPaymentState(button, state) {
  // Remove all state classes
  button.classList.remove('btn-primary', 'btn-processing', 'btn-success', 'btn-error');

  switch (state) {
    case 'idle':
      button.classList.add('btn-primary');
      button.disabled = false;
      button.textContent = 'Pay $499';
      button.setAttribute('aria-label', 'Pay 499 dollars');
      break;
    case 'processing':
      button.classList.add('btn-processing');
      button.disabled = true;
      button.textContent = 'Processing...';
      button.setAttribute('aria-label', 'Payment processing');
      break;
    case 'success':
      button.classList.add('btn-success');
      button.disabled = true;
      button.textContent = 'Payment Successful!';
      button.setAttribute('aria-label', 'Payment successful');
      button.dataset.paymentId = 'pay_' + Math.random().toString(36).slice(2, 10);
      break;
    case 'error':
      button.classList.add('btn-error');
      button.disabled = false;
      button.textContent = 'Retry Payment';
      button.setAttribute('aria-label', 'Retry payment');
      break;
  }

  return state;
}

['idle', 'processing', 'success', 'error'].forEach(state => {
  document.getElementById(`btn-state-${state}`).addEventListener('click', () => {
    const out = 'output-1';
    document.getElementById(out).textContent = '';
    const btn = document.getElementById('pay-btn');

    setPaymentState(btn, state);

    log(`--- Payment State: ${state.toUpperCase()} ---`, out);
    log(`classList: "${btn.className}"`, out);
    log(`disabled: ${btn.disabled}`, out);
    log(`textContent: "${btn.textContent}"`, out);
    log(`aria-label: "${btn.getAttribute('aria-label')}"`, out);
    if (btn.dataset.paymentId) {
      log(`data-payment-id: "${btn.dataset.paymentId}"`, out);
    }
  });
});

// ============================================================
// EXAMPLE 2 — getAttribute, setAttribute, removeAttribute, hasAttribute
// Story: Razorpay reads the payment amount from data-amount, sets an
// aria-label for screen readers, checks if disabled is present, and
// removes autocomplete from CVV. These four methods are the low-level
// API for all HTML attributes.
// ============================================================

// WHY: These methods work with HTML attributes — the initial values.
// Universal way to read/write ANY attribute, including custom ones.

document.getElementById('btn-attr-demo').addEventListener('click', () => {
  const out = 'output-2';
  document.getElementById(out).textContent = '';
  const btn = document.getElementById('pay-btn');
  const cvv = document.getElementById('cvv');

  log('--- getAttribute/setAttribute/removeAttribute/hasAttribute ---', out);
  log('', out);

  // getAttribute
  log('getAttribute:', out);
  log(`  btn.getAttribute('data-amount'):   "${btn.getAttribute('data-amount')}" (always a string!)`, out);
  log(`  btn.getAttribute('class'):         "${btn.getAttribute('class')}"`, out);
  log(`  btn.getAttribute('nonexistent'):   ${btn.getAttribute('nonexistent')}`, out);
  log('', out);

  // setAttribute
  btn.setAttribute('aria-label', 'Pay 499 rupees');
  log('setAttribute:', out);
  log(`  btn.setAttribute('aria-label', 'Pay 499 rupees')`, out);
  log(`  Now: "${btn.getAttribute('aria-label')}"`, out);
  log('', out);

  // hasAttribute
  log('hasAttribute:', out);
  log(`  btn.hasAttribute('data-amount'):   ${btn.hasAttribute('data-amount')}`, out);
  log(`  btn.hasAttribute('disabled'):      ${btn.hasAttribute('disabled')}`, out);
  log(`  cvv.hasAttribute('autocomplete'):  ${cvv.hasAttribute('autocomplete')}`, out);
  log('', out);

  // removeAttribute
  log('removeAttribute:', out);
  log('  cvv.removeAttribute("autocomplete") — removed', out);
  cvv.removeAttribute('autocomplete');
  log(`  cvv.hasAttribute('autocomplete'):  ${cvv.hasAttribute('autocomplete')}`, out);
  log('', out);

  // List all attributes
  log('All attributes on pay button:', out);
  for (const attr of btn.attributes) {
    log(`  ${attr.name} = "${attr.value}"`, out);
  }
});

// ============================================================
// EXAMPLE 3 — HTML Attributes vs DOM Properties
// Story: A Razorpay dev sets input value attribute to "4111" (test card).
// User types "5500". Now getAttribute('value') returns "4111" (initial
// HTML attribute) but input.value returns "5500" (live DOM property).
// This confusion between attributes and properties causes real bugs.
// ============================================================

// WHY: Attributes = initial HTML values. Properties = live JS state.
// They are synced for some (id, class) but NOT for others (value, checked).

document.getElementById('btn-attr-vs-prop').addEventListener('click', () => {
  const out = 'output-3';
  document.getElementById(out).textContent = '';

  const input = document.getElementById('attr-demo-input');
  const checkbox = document.getElementById('attr-demo-check');

  log('--- Attributes vs Properties ---', out);
  log('', out);
  log('Text Input:', out);
  log(`  getAttribute("value"): "${input.getAttribute('value')}" (initial HTML attribute)`, out);
  log(`  input.value property:  "${input.value}" (live DOM property)`, out);
  log(`  Same? ${input.getAttribute('value') === input.value}`, out);
  log('', out);

  log('Checkbox:', out);
  log(`  getAttribute("checked"): ${input.getAttribute('checked')} (initial attribute)`, out);
  log(`  checkbox.checked:        ${checkbox.checked} (live state)`, out);
  log('', out);

  // --- Sync Table ---
  log('--- Sync Table ---', out);
  log('HTML Attribute  | DOM Property  | Synced?', out);
  log('----------------|---------------|--------', out);
  log('id              | id            | YES (both ways)', out);
  log('class           | className     | YES (both ways)', out);
  log('href            | href          | YES (prop returns full URL)', out);
  log('value           | value         | NO (attr=initial, prop=live)', out);
  log('checked         | checked       | NO (attr=initial, prop=live)', out);
  log('disabled        | disabled      | YES (presence <-> boolean)', out);
  log('data-*          | dataset.*     | YES (both ways)', out);
  log('', out);
  log('RULE: Properties for live state, attributes for metadata', out);
});

// ============================================================
// EXAMPLE 4 — dataset: Custom data-* Attributes
// Story: Razorpay stores payment metadata in data-* attributes:
// data-amount, data-order-id, data-currency, data-merchant-name.
// The dataset API provides clean camelCase access without
// getAttribute/setAttribute.
// ============================================================

// WHY: data-* attributes are the standard for custom DOM metadata.
// dataset is the clean, modern access API.

document.getElementById('btn-read-data').addEventListener('click', () => {
  const out = 'output-4';
  document.getElementById(out).textContent = '';
  const target = document.getElementById('dataset-target');

  log('--- Reading dataset ---', out);

  // --- Naming Convention ---
  // data-order-id      -> dataset.orderId
  // data-merchant-name -> dataset.merchantName
  // data-amount        -> dataset.amount
  // Rule: hyphens become camelCase

  for (const [key, value] of Object.entries(target.dataset)) {
    const attr = 'data-' + key.replace(/([A-Z])/g, '-$1').toLowerCase();
    log(`  ${attr} -> dataset.${key} = "${value}"`, out);
  }
  log('', out);
  log('Values are always STRINGS — parse numbers!', out);
  log(`typeof dataset.amount: "${typeof target.dataset.amount}"`, out);
  log(`parseInt: ${parseInt(target.dataset.amount)}`, out);
});

document.getElementById('btn-write-data').addEventListener('click', () => {
  const out = 'output-4';
  document.getElementById(out).textContent = '';
  const target = document.getElementById('dataset-target');

  // Writing creates data-* attribute
  target.dataset.paymentId = 'pay_xyz789';
  target.dataset.status = 'processing';

  log('--- Writing dataset ---', out);
  log('target.dataset.paymentId = "pay_xyz789"', out);
  log('target.dataset.status = "processing"', out);
  log('', out);
  log('Creates data-payment-id and data-status attributes.', out);
  log('', out);
  log('Current dataset:', out);
  for (const [key, value] of Object.entries(target.dataset)) {
    log(`  dataset.${key} = "${value}"`, out);
  }
});

document.getElementById('btn-delete-data').addEventListener('click', () => {
  const out = 'output-4';
  document.getElementById(out).textContent = '';
  const target = document.getElementById('dataset-target');

  if (target.dataset.status) {
    delete target.dataset.status;
    log('--- Deleting dataset.status ---', out);
    log('delete target.dataset.status — removes data-status attribute', out);
  } else {
    log('dataset.status does not exist (already deleted or never set)', out);
  }

  log('', out);
  log('Current dataset:', out);
  for (const [key, value] of Object.entries(target.dataset)) {
    log(`  dataset.${key} = "${value}"`, out);
  }
});

// ============================================================
// EXAMPLE 5 — classList: add, remove, toggle, contains, replace
// Story: Razorpay's button changes appearance per state. Idle:
// "btn btn-primary". Processing: "btn btn-processing". Success:
// "btn btn-success". classList provides clean methods without
// string manipulation.
// ============================================================

// WHY: classList is the modern, safe way to manipulate CSS classes.

function updateClassDisplay() {
  const el = document.getElementById('classList-demo');
  document.getElementById('class-display-text').textContent = el.className;
}

document.getElementById('btn-cl-add').addEventListener('click', () => {
  const out = 'output-5';
  document.getElementById(out).textContent = '';
  const el = document.getElementById('classList-demo');

  el.classList.add('spin', 'glow');
  updateClassDisplay();

  log('--- classList.add("spin", "glow") ---', out);
  log(`Classes: "${el.className}"`, out);
  log('Can add multiple classes at once.', out);
});

document.getElementById('btn-cl-remove').addEventListener('click', () => {
  const out = 'output-5';
  document.getElementById(out).textContent = '';
  const el = document.getElementById('classList-demo');

  el.classList.remove('spin', 'glow');
  updateClassDisplay();

  log('--- classList.remove("spin", "glow") ---', out);
  log(`Classes: "${el.className}"`, out);
  log('Can remove multiple classes at once.', out);
});

document.getElementById('btn-cl-toggle').addEventListener('click', () => {
  const out = 'output-5';
  document.getElementById(out).textContent = '';
  const el = document.getElementById('classList-demo');

  const result = el.classList.toggle('active');
  updateClassDisplay();

  log('--- classList.toggle("active") ---', out);
  log(`Returned: ${result} (true=added, false=removed)`, out);
  log(`Classes: "${el.className}"`, out);
  log('', out);
  log('toggle(cls):        add if absent, remove if present', out);
  log('toggle(cls, true):  force add', out);
  log('toggle(cls, false): force remove', out);
});

document.getElementById('btn-cl-replace').addEventListener('click', () => {
  const out = 'output-5';
  document.getElementById(out).textContent = '';
  const el = document.getElementById('classList-demo');

  const result = el.classList.replace('btn-primary', 'btn-success');
  updateClassDisplay();

  log('--- classList.replace("btn-primary", "btn-success") ---', out);
  log(`Returned: ${result} (true if old class existed)`, out);
  log(`Classes: "${el.className}"`, out);
});

document.getElementById('btn-cl-contains').addEventListener('click', () => {
  const out = 'output-5';
  document.getElementById(out).textContent = '';
  const el = document.getElementById('classList-demo');

  log('--- classList.contains() ---', out);
  log(`contains("btn"):         ${el.classList.contains('btn')}`, out);
  log(`contains("btn-primary"): ${el.classList.contains('btn-primary')}`, out);
  log(`contains("btn-success"): ${el.classList.contains('btn-success')}`, out);
  log(`contains("active"):      ${el.classList.contains('active')}`, out);
  log(`contains("nonexistent"): ${el.classList.contains('nonexistent')}`, out);
});

document.getElementById('btn-cl-reset').addEventListener('click', () => {
  const el = document.getElementById('classList-demo');
  el.className = 'classList-target btn btn-primary btn-large';
  updateClassDisplay();
  document.getElementById('output-5').textContent = 'Reset to: btn btn-primary btn-large';
});

// ============================================================
// EXAMPLE 6 — className (string) vs classList (DOMTokenList)
// Story: An older Razorpay codebase used className. A dev did
// btn.className = 'btn-success', which REPLACED all classes instead
// of adding one. Migration to classList eliminated this bug category.
// ============================================================

// WHY: className is a raw string — easy to misuse. classList is
// structured with purpose-built methods. Always prefer classList.

document.getElementById('btn-classname-demo').addEventListener('click', () => {
  const out = 'output-6';
  document.getElementById(out).textContent = '';

  const el = document.getElementById('classList-demo');

  log('--- className vs classList ---', out);
  log('', out);
  log(`className (string): "${el.className}"`, out);
  log('', out);
  log('DANGER with className:', out);
  log('  btn.className = "btn-success"  // REPLACES ALL classes!', out);
  log('  btn.className += " animated"   // Must add leading space manually', out);
  log('', out);
  log('classList (DOMTokenList):', out);
  log('  btn.classList.add("animated")   // no space issues', out);
  log('  btn.classList.remove("animated")// no split/filter/join', out);
  log('', out);
  log('ALWAYS prefer classList for modifications', out);
});

// ============================================================
// EXAMPLE 7 — style Property: Inline Styles
// Story: Razorpay animates the payment button from full width to a
// circle during processing. element.style sets inline CSS from JS.
// ============================================================

// WHY: Direct way to set dynamic inline styles from JavaScript.

document.getElementById('btn-style-set').addEventListener('click', () => {
  const out = 'output-7';
  document.getElementById(out).textContent = '';
  const target = document.getElementById('style-target');

  // --- Setting ---
  target.style.backgroundColor = '#6366f1';
  target.style.color = 'white';
  target.style.borderRadius = '50px';
  target.style.fontSize = '1.5rem';
  target.style.transition = 'all 0.3s ease';
  target.style.padding = '2rem 3rem';

  // --- Naming Convention ---
  // background-color  -> backgroundColor
  // font-size         -> fontSize
  // border-radius     -> borderRadius
  // z-index           -> zIndex

  log('--- style Property: Setting ---', out);
  log('target.style.backgroundColor = "#6366f1"', out);
  log('target.style.borderRadius = "50px"', out);
  log('target.style.fontSize = "1.5rem"', out);
  log('', out);
  log('CSS kebab -> JS camelCase:', out);
  log('  background-color  -> backgroundColor', out);
  log('  font-size         -> fontSize', out);
  log('  border-radius     -> borderRadius', out);
  log('  z-index           -> zIndex', out);
});

document.getElementById('btn-style-read').addEventListener('click', () => {
  const out = 'output-7';
  document.getElementById(out).textContent = '';
  const target = document.getElementById('style-target');

  // IMPORTANT: .style only reads INLINE styles, not CSS stylesheet styles!
  log('--- style Property: Reading ---', out);
  log(`target.style.backgroundColor: "${target.style.backgroundColor}"`, out);
  log(`target.style.borderRadius:    "${target.style.borderRadius}"`, out);
  log(`target.style.fontSize:        "${target.style.fontSize}"`, out);
  log(`target.style.color:           "${target.style.color}"`, out);
  log('', out);
  log('IMPORTANT: .style reads ONLY inline styles (not stylesheets)', out);
  log('For rendered values, use getComputedStyle()', out);
});

document.getElementById('btn-style-clear').addEventListener('click', () => {
  const out = 'output-7';
  document.getElementById(out).textContent = '';
  const target = document.getElementById('style-target');

  // --- Removing ---
  target.style.cssText = ''; // clears ALL inline styles

  log('--- style Property: Clearing ---', out);
  log('target.style.cssText = "" — clears ALL inline styles', out);
  log('', out);
  log('Other ways to remove:', out);
  log('  style.width = ""               — remove one property', out);
  log('  style.removeProperty("width")  — also works (uses CSS name)', out);
  log('  style.cssText = "..."          — replaces ALL inline styles', out);
});

// ============================================================
// EXAMPLE 8 — getComputedStyle(): Actual Rendered Styles
// Story: Razorpay's animation needs the ACTUAL rendered width — not
// the CSS class value, not inline, but the final computed pixels after
// all CSS rules, inheritance, and defaults are applied.
// ============================================================

// WHY: element.style reads inline only. getComputedStyle reads the
// ACTUAL rendered result. Essential for animations and calculations.

document.getElementById('btn-computed').addEventListener('click', () => {
  const out = 'output-8';
  document.getElementById(out).textContent = '';

  const btn = document.getElementById('pay-btn');
  const computed = getComputedStyle(btn);

  log('--- getComputedStyle(payButton) ---', out);
  log(`width:           ${computed.width}`, out);
  log(`height:          ${computed.height}`, out);
  log(`backgroundColor: ${computed.backgroundColor}`, out);
  log(`fontSize:        ${computed.fontSize}`, out);
  log(`fontFamily:      ${computed.fontFamily}`, out);
  log(`borderRadius:    ${computed.borderRadius}`, out);
  log(`padding:         ${computed.padding}`, out);
  log(`cursor:          ${computed.cursor}`, out);
  log(`display:         ${computed.display}`, out);
  log('', out);
  log('--- IMPORTANT ---', out);
  log('1. Returns RESOLVED values (px, not %, not em, not rem)', out);
  log('2. READ-ONLY — cannot set values', out);
  log('3. Colors returned as rgb()/rgba()', out);
  log('4. Triggers reflow — avoid in loops', out);
  log('5. Use longhand: marginTop, not margin', out);
});

// ============================================================
// EXAMPLE 9 — Boolean & State Properties: hidden, disabled, checked, value
// Story: Razorpay's form: submit disabled until valid, CVV hidden until
// card type detected, "Save Card" checked by default, input values
// change as users type. All managed via DOM properties.
// ============================================================

// WHY: Boolean attributes have special behavior: PRESENCE = true,
// ABSENCE = false. The attribute's VALUE does not matter.

document.getElementById('btn-toggle-disabled').addEventListener('click', () => {
  const out = 'output-9';
  document.getElementById(out).textContent = '';
  const btn = document.getElementById('bool-btn');

  btn.disabled = !btn.disabled;
  btn.textContent = btn.disabled ? 'Submit (disabled)' : 'Submit (enabled)';

  log('--- Toggle disabled ---', out);
  log(`btn.disabled: ${btn.disabled}`, out);
  log(`hasAttribute("disabled"): ${btn.hasAttribute('disabled')}`, out);
});

document.getElementById('btn-toggle-hidden').addEventListener('click', () => {
  const out = 'output-9';
  document.getElementById(out).textContent = '';
  const msg = document.getElementById('bool-hidden-msg');

  msg.hidden = !msg.hidden;

  log('--- Toggle hidden ---', out);
  log(`msg.hidden: ${msg.hidden}`, out);
  log(`Visible: ${!msg.hidden}`, out);
});

document.getElementById('btn-toggle-checked').addEventListener('click', () => {
  const out = 'output-9';
  document.getElementById(out).textContent = '';
  const check = document.getElementById('bool-check');

  check.checked = !check.checked;

  log('--- Toggle checked ---', out);
  log(`checkbox.checked (live):         ${check.checked}`, out);
  log(`getAttribute("checked") (HTML):  ${check.getAttribute('checked')}`, out);
  log('Note: getAttribute stays the same — it is the INITIAL value!', out);
});

document.getElementById('btn-toggle-required').addEventListener('click', () => {
  const out = 'output-9';
  document.getElementById(out).textContent = '';
  const input = document.getElementById('bool-input');

  input.required = !input.required;

  log('--- Toggle required ---', out);
  log(`input.required: ${input.required}`, out);
  log(`hasAttribute("required"): ${input.hasAttribute('required')}`, out);
});

document.getElementById('btn-read-state').addEventListener('click', () => {
  const out = 'output-9';
  document.getElementById(out).textContent = '';

  const input = document.getElementById('bool-input');
  const check = document.getElementById('bool-check');
  const readonly = document.getElementById('bool-readonly');
  const btn = document.getElementById('bool-btn');
  const hidden = document.getElementById('bool-hidden-msg');

  log('--- All Boolean States ---', out);
  log(`input.value:     "${input.value}" (live)`, out);
  log(`input.required:  ${input.required}`, out);
  log(`checkbox.checked: ${check.checked}`, out);
  log(`readonly.readOnly: ${readonly.readOnly}`, out);
  log(`button.disabled:  ${btn.disabled}`, out);
  log(`message.hidden:   ${hidden.hidden}`, out);
  log('', out);

  // --- Boolean Attribute Rule ---
  log('--- Boolean Attribute Rule ---', out);
  log('<button disabled>         -> disabled = true', out);
  log('<button disabled="false"> -> disabled = true (!)', out);
  log('<button disabled="">      -> disabled = true (!)', out);
  log('Only REMOVING the attribute = false.', out);
  log('JS: button.disabled = false correctly removes it.', out);
});

// ============================================================
// EXAMPLE 10 — Practical: Theme Switcher
// Story: Razorpay's checkout supports dark/light mode. Theme stored as
// data-theme on <html>. Toggling uses classList to swap classes and
// dataset to track state. Preference saved to localStorage.
// ============================================================

// WHY: Theme switching perfectly demonstrates classList + dataset.

document.getElementById('theme-toggle').addEventListener('click', () => {
  const out = 'output-10';
  document.getElementById(out).textContent = '';

  const html = document.documentElement;
  const currentTheme = html.dataset.theme || 'dark';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

  html.dataset.theme = newTheme;

  const btn = document.getElementById('theme-toggle');
  btn.textContent = newTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
  btn.setAttribute('aria-label', `Switch to ${newTheme === 'dark' ? 'light' : 'dark'} mode`);

  // Save preference
  try {
    localStorage.setItem('theme-preference', newTheme);
  } catch (e) {
    // localStorage might be blocked
  }

  log(`--- Theme Switched to ${newTheme.toUpperCase()} ---`, out);
  log(`html.dataset.theme: "${html.dataset.theme}"`, out);
  log(`button text: "${btn.textContent}"`, out);
  log(`aria-label: "${btn.getAttribute('aria-label')}"`, out);
  log('', out);
  log('Theme is stored as data-theme on <html>', out);
  log('CSS uses html[data-theme="light"] selector to override variables', out);
});

// Restore saved theme
(function() {
  try {
    const saved = localStorage.getItem('theme-preference');
    if (saved) {
      document.documentElement.dataset.theme = saved;
      const btn = document.getElementById('theme-toggle');
      btn.textContent = saved === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
    }
  } catch (e) { /* ignore */ }
})();

// ============================================================
// EXAMPLE 11 — Practical: Form Validation with Attributes
// Story: Razorpay validates card number, expiry, CVV in real time.
// Fields get 'valid'/'invalid' classes, button enables/disables,
// error messages use hidden attribute.
// ============================================================

// WHY: Most common real-world use of attribute/class manipulation.

function validateForm() {
  const cardInput = document.getElementById('val-card');
  const expiryInput = document.getElementById('val-expiry');
  const cvvInput = document.getElementById('val-cvv');
  const submitBtn = document.getElementById('val-submit');
  const out = 'output-11';

  const cardValid = /^\d{16}$/.test(cardInput.value);
  const expiryValid = /^\d{2}\/\d{2}$/.test(expiryInput.value);
  const cvvValid = /^\d{3}$/.test(cvvInput.value);

  // Toggle valid/invalid classes
  cardInput.classList.toggle('valid', cardValid);
  cardInput.classList.toggle('invalid', !cardValid && cardInput.value.length > 0);
  document.getElementById('val-card-icon').textContent = cardInput.value.length === 0 ? '' : cardValid ? '✓' : '✗';
  document.getElementById('val-card-icon').style.color = cardValid ? 'var(--success)' : 'var(--danger)';

  expiryInput.classList.toggle('valid', expiryValid);
  expiryInput.classList.toggle('invalid', !expiryValid && expiryInput.value.length > 0);
  document.getElementById('val-expiry-icon').textContent = expiryInput.value.length === 0 ? '' : expiryValid ? '✓' : '✗';
  document.getElementById('val-expiry-icon').style.color = expiryValid ? 'var(--success)' : 'var(--danger)';

  cvvInput.classList.toggle('valid', cvvValid);
  cvvInput.classList.toggle('invalid', !cvvValid && cvvInput.value.length > 0);
  document.getElementById('val-cvv-icon').textContent = cvvInput.value.length === 0 ? '' : cvvValid ? '✓' : '✗';
  document.getElementById('val-cvv-icon').style.color = cvvValid ? 'var(--success)' : 'var(--danger)';

  // Enable/disable submit
  const allValid = cardValid && expiryValid && cvvValid;
  submitBtn.disabled = !allValid;
  submitBtn.dataset.formValid = allValid;

  // Log current state
  document.getElementById(out).textContent = '';
  log('--- Real-time Validation ---', out);
  log(`Card "${cardInput.value}": ${cardValid ? 'VALID' : 'INVALID'}`, out);
  log(`Expiry "${expiryInput.value}": ${expiryValid ? 'VALID' : 'INVALID'}`, out);
  log(`CVV "${cvvInput.value}": ${cvvValid ? 'VALID' : 'INVALID'}`, out);
  log(`Submit disabled: ${submitBtn.disabled}`, out);
  log(`data-form-valid: ${submitBtn.dataset.formValid}`, out);
}

// Attach validation listeners
['val-card', 'val-expiry', 'val-cvv'].forEach(id => {
  document.getElementById(id).addEventListener('input', validateForm);
});

document.getElementById('val-submit').addEventListener('click', () => {
  const out = 'output-11';
  log('', out);
  log('--- Payment submitted! ---', out);
  log('In a real app, this would send data to the payment gateway.', out);
});

// ============================================================
// EXAMPLE 12 — Attribute Cheat Sheet
// (Displayed as HTML in the section above)
// ============================================================

// ATTRIBUTES:
// getAttribute('x'), setAttribute('x','v'), hasAttribute('x'), removeAttribute('x')
// element.attributes -> NamedNodeMap

// DATA-*:
// dataset.camelCase (read), dataset.camelCase = 'v' (write), delete dataset.x

// CLASSES:
// classList.add(), .remove(), .toggle(), .contains(), .replace()
// className -> full class string (avoid for modifications)

// STYLES:
// style.propName = 'v' (set), style.propName = '' (remove)
// style.cssText (replace all), getComputedStyle(el) (read rendered)

// BOOLEAN PROPERTIES:
// hidden, disabled, checked, required, readOnly, value

// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. getAttribute/setAttribute work with HTML attributes (initial).
//    DOM properties (element.prop) reflect live state.
// 2. dataset provides clean access to data-*. Hyphens become camelCase.
//    Values are always strings — parse numbers when needed.
// 3. classList is the modern way to manipulate CSS classes. Use add,
//    remove, toggle, contains, replace. Avoid className for edits.
// 4. toggle(cls, force) is the cleanest conditional class pattern.
// 5. element.style reads/writes INLINE styles only.
//    getComputedStyle() reads actual rendered styles.
// 6. Boolean attributes: presence = true, absence = false.
//    <input disabled="false"> IS disabled. Remove attribute to disable.
// 7. Use classList for state appearance. Use style for dynamic values.
// 8. Sanitize data before setting attributes. dataset values are
//    strings, never executed — safe from XSS when read via API.
// 9. getComputedStyle triggers reflow — cache and avoid in loops.
// ============================================================

console.log('=== FILE 05 COMPLETE: Attributes and Classes ===');
