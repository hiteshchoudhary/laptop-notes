// ============================================================
// FILE 09: FORM HANDLING
// Topic: Working with HTML forms — reading values, validation, FormData, and submission
// WHY: Forms are the primary way users send data to your application.
// From login screens to job applications, every web app depends on
// robust form handling. Getting it wrong means lost data and frustrated users.
// ============================================================

// --- Helper: log to both console and an on-page output panel ---
function log(msg, targetId) {
  console.log(msg);
  const el = document.getElementById(targetId);
  if (el) el.textContent += msg + '\n';
}


// ============================================================
// EXAMPLE 1 — The Naukri.com Job Application Form
// Story: Naukri.com processes millions of job applications daily.
// Their form has 15+ fields: name, email, phone, resume upload,
// skills dropdown, salary expectations. Real-time validation
// prevents incomplete submissions. Auto-save drafts ensure no
// data is lost if the browser crashes.
// ============================================================

// WHY: A job application form covers every form scenario: text,
// selects, checkboxes, radios, textareas, file uploads, and multi-step.


// ============================================================
// EXAMPLE 2 — Accessing Forms and Form Elements
// ============================================================

// --- Accessing Forms ---
// document.forms                     // HTMLCollection of all forms
// document.forms[0]                  // First form on the page
// document.forms["job-application"]  // By name or id attribute
// document.querySelector("#job-application") // Most common

// --- Accessing Form Elements ---
// form.elements                   // HTMLFormControlsCollection (all controls)
// form.elements["fullName"]       // By name attribute
// form.elements.fullName          // Shorthand (same as above)
// form.elements[0]                // By index

// --- The elements collection is LIVE ---
// Adding elements to the form auto-updates the collection.


// ============================================================
// EXAMPLE 3 — Input Events: input, change, focus, blur
// Story: Naukri.com shows real-time character counts (input event),
// validates email on tab-away (change/blur), and highlights the
// active field with a blue border (focus event).
// ============================================================

// WHY: Different events fire at different moments. Using the wrong
// one leads to validation that triggers too early or too late.

// --- Event Firing Order for a Text Input ---
// focus → input(s) → change → blur

function setupInputEventDemo() {
  const input = document.getElementById("event-demo-input");
  const timeline = document.getElementById("event-timeline");
  if (!input || !timeline) return;

  function addTag(type) {
    const tag = document.createElement("span");
    tag.className = `event-tag ${type}`;
    tag.textContent = type;
    timeline.appendChild(tag);
    log(`Event: ${type} (value="${input.value}")`, "output-2");
  }

  // --- 'focus' Event — element receives focus (does NOT bubble) ---
  input.addEventListener("focus", () => addTag("focus"));

  // --- 'input' Event — fires on EVERY keystroke, paste, input change ---
  input.addEventListener("input", () => addTag("input"));

  // --- 'change' Event — fires when value changes AND element loses focus ---
  input.addEventListener("change", () => addTag("change"));

  // --- 'blur' Event — element loses focus (does NOT bubble) ---
  input.addEventListener("blur", () => addTag("blur"));

  // Clear on double-click
  timeline.addEventListener("dblclick", () => {
    timeline.innerHTML = "";
    document.getElementById("output-2").textContent = "";
  });
}


// ============================================================
// EXAMPLE 4 — The submit Event and preventDefault
// Story: Naukri.com's old form reloaded the page on submit, losing
// the user's scroll position. Modern implementation intercepts
// submit and uses fetch() for AJAX submission.
// ============================================================

// WHY: Default form submit navigates or reloads. In modern apps,
// you intercept with preventDefault() and handle with JavaScript.

// NOTE: submit fires on button click or Enter key in form fields.
// form.submit() does NOT fire the event.
// form.requestSubmit() DOES fire the event (use this for programmatic submit).


// ============================================================
// EXAMPLE 5 — Reading Form Values
// Story: Naukri.com reads values from every control type: text,
// checkboxes, radios, selects, textareas, and files.
// ============================================================

// WHY: Each form control type exposes its value differently.
// Text: input.value. Checkbox: cb.checked. Select: select.value.
// Radio: radioNodeList.value. File: input.files[0].


// ============================================================
// EXAMPLE 6 — The FormData API
// Story: Naukri.com switched from manual field collection to
// FormData. It auto-captures ALL fields, handles files, and
// works directly with fetch(). Reduced code from 50 to 10 lines.
// ============================================================

// WHY: FormData is the modern way to collect and send form data.
// .get(), .getAll(), .has(), .entries(), .set(), .append(), .delete()
// Pass directly to fetch() body — browser handles Content-Type.

function displayFormData(form) {
  const display = document.getElementById("formdata-display");
  if (!display) return;
  display.textContent = "";

  const fd = new FormData(form);
  for (const [key, value] of fd.entries()) {
    const displayVal = value instanceof File ? `[File] ${value.name} (${value.size} bytes)` : value;
    display.textContent += `${key}: ${displayVal}\n`;
  }

  // Also show getAll for skills (multiple checkboxes)
  const skills = fd.getAll("skills");
  if (skills.length > 0) {
    display.textContent += `\ngetAll("skills"): [${skills.join(", ")}]\n`;
  }
}


// ============================================================
// EXAMPLE 7 — Real-Time Validation
// Story: Naukri.com validates as the user types. Phone must start
// with 6-9, be 10 digits. Submit stays disabled until all pass.
// ============================================================

// WHY: Real-time validation gives instant feedback, reducing
// form abandonment. Users fix errors while typing.

function setupRegistrationForm() {
  const form = document.getElementById("job-application");
  if (!form) return;

  const validators = {
    fullName:    { test: v => v.trim().length >= 2, msg: "Min 2 characters." },
    email:       { test: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), msg: "Invalid email format." },
    phone:       { test: v => /^[6-9]\d{9}$/.test(v), msg: "10 digits, must start with 6-9." },
    experience:  { test: v => v !== "", msg: "Select experience level." },
    coverLetter: { test: v => v.trim().length >= 50, msg: "Min 50 characters required." }
  };

  function validateField(field, rule) {
    const valid = rule.test(field.value);
    const errEl = document.getElementById(`err-${field.name}`);
    field.classList.toggle("valid", valid);
    field.classList.toggle("invalid", !valid && field.value.length > 0);
    if (errEl) errEl.textContent = (valid || field.value.length === 0) ? "" : rule.msg;
    return valid;
  }

  function updateSubmitButton() {
    const btn = document.getElementById("submit-btn");
    const allValid = Object.keys(validators).every(name => {
      const f = form.elements[name];
      return f && validators[name].test(f.value);
    });
    btn.disabled = !allValid;
  }

  // --- Validate on every input ---
  form.addEventListener("input", function (event) {
    const field = event.target;
    const rule = validators[field.name];
    if (rule) validateField(field, rule);
    updateSubmitButton();
    displayFormData(form);

    // Character counter for cover letter
    if (field.name === "coverLetter") {
      const counter = document.getElementById("char-count");
      if (counter) counter.textContent = field.value.length;
    }
  });

  // --- Also validate on blur ---
  form.addEventListener("focusout", function (event) {
    const rule = validators[event.target.name];
    if (rule) validateField(event.target, rule);
  });

  // --- File input handling ---
  const resumeInput = document.getElementById("resume");
  if (resumeInput) {
    resumeInput.addEventListener("change", function () {
      const fileInfo = document.getElementById("file-info");
      if (this.files.length === 0) {
        fileInfo.textContent = "";
        return;
      }
      const file = this.files[0];
      const maxSize = 5 * 1024 * 1024;
      const allowed = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ];

      if (file.size > maxSize) {
        fileInfo.textContent = `File too large: ${(file.size / 1024 / 1024).toFixed(1)} MB (max 5MB)`;
        fileInfo.style.color = "#ef4444";
        this.value = "";
        return;
      }

      fileInfo.textContent = `${file.name} — ${(file.size / 1024).toFixed(1)} KB — ${file.type}`;
      fileInfo.style.color = "#22c55e";
      displayFormData(form);
      log(`File selected: ${file.name} (${file.size} bytes, ${file.type})`, "output-1");
    });
  }

  // --- Submit handler ---
  form.addEventListener("submit", function (event) {
    event.preventDefault(); // CRITICAL: stop page reload

    const fd = new FormData(this);
    log("--- Form Submitted ---", "output-1");
    for (const [k, v] of fd.entries()) {
      log(`  ${k}: ${v instanceof File ? v.name : v}`, "output-1");
    }
    log("(preventDefault stopped page reload. Would use fetch() in production.)", "output-1");
  });

  // --- Debounced Auto-Save ---
  // Debounce Implementation: waits until the user pauses before triggering
  function debounce(fn, delay) {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  const autoSaveStatus = document.getElementById("auto-save-status");
  const saveDraft = debounce(function () {
    const fd = new FormData(form);
    const draft = {};
    for (const [k, v] of fd.entries()) {
      if (v instanceof File) continue;
      if (draft[k]) {
        draft[k] = Array.isArray(draft[k]) ? [...draft[k], v] : [draft[k], v];
      } else {
        draft[k] = v;
      }
    }
    localStorage.setItem("naukri-draft", JSON.stringify(draft));
    autoSaveStatus.textContent = `Auto-save: saved at ${new Date().toLocaleTimeString()}`;
    autoSaveStatus.className = "auto-save-indicator saved";
  }, 1000);

  form.addEventListener("input", function () {
    autoSaveStatus.textContent = "Auto-save: saving...";
    autoSaveStatus.className = "auto-save-indicator saving";
    saveDraft();
  });

  // --- Restore Draft on Load ---
  function restoreDraft() {
    const saved = localStorage.getItem("naukri-draft");
    if (!saved) return;
    try {
      const draft = JSON.parse(saved);
      Object.entries(draft).forEach(([key, val]) => {
        const field = form.elements[key];
        if (!field) return;

        if (field.type === "checkbox") {
          // Handle checkbox arrays
          const values = Array.isArray(val) ? val : [val];
          const checkboxes = form.querySelectorAll(`input[name="${key}"]`);
          checkboxes.forEach(cb => {
            cb.checked = values.includes(cb.value);
          });
        } else if (field.type === "radio") {
          const radios = form.querySelectorAll(`input[name="${key}"]`);
          radios.forEach(r => { r.checked = r.value === val; });
        } else if (field.value !== undefined) {
          field.value = val;
        }
      });
      autoSaveStatus.textContent = "Auto-save: draft restored";
      autoSaveStatus.className = "auto-save-indicator saved";
      updateSubmitButton();
      displayFormData(form);
      log("Draft restored from localStorage.", "output-1");
    } catch (e) {
      console.error("Draft restore failed:", e);
    }
  }

  restoreDraft();

  // --- Clear Draft ---
  document.getElementById("reset-btn").addEventListener("click", function () {
    localStorage.removeItem("naukri-draft");
    form.reset();
    form.querySelectorAll(".valid, .invalid").forEach(el => {
      el.classList.remove("valid", "invalid");
    });
    form.querySelectorAll(".error-message").forEach(el => { el.textContent = ""; });
    document.getElementById("formdata-display").textContent = "";
    document.getElementById("char-count").textContent = "0";
    document.getElementById("file-info").textContent = "";
    autoSaveStatus.textContent = "Auto-save: draft cleared";
    autoSaveStatus.className = "auto-save-indicator";
    updateSubmitButton();
    log("Draft cleared.", "output-1");
  });

  updateSubmitButton();
}


// ============================================================
// EXAMPLE 8 — Custom Validity: setCustomValidity, reportValidity
// Story: Naukri.com uses the browser's constraint validation API
// to show native validation popups with custom messages.
// ============================================================

// WHY: The Constraint Validation API gives native browser UI
// (tooltip popups) without building custom UI from scratch.

// --- Programmatic Validity Checks ---
// form.checkValidity()   — returns boolean, fires 'invalid' events
// form.reportValidity()  — same + shows native browser tooltip

function setupCustomValidity() {
  const form = document.getElementById("validity-form");
  const phone = document.getElementById("custom-phone");
  const state = document.getElementById("validity-state");
  if (!form || !phone) return;

  phone.addEventListener("input", function () {
    this.setCustomValidity(""); // reset first

    if (this.value === "") {
      this.setCustomValidity("Phone required for OTP verification.");
    } else if (!/^[6-9]/.test(this.value)) {
      this.setCustomValidity("Must start with 6, 7, 8, or 9.");
    } else if (this.value.length !== 10) {
      this.setCustomValidity("Must be exactly 10 digits.");
    } else {
      this.setCustomValidity(""); // Valid — clear message
    }

    // Display validity state
    state.textContent = `valid: ${this.checkValidity()} | message: "${this.validationMessage}"`;
    state.style.color = this.checkValidity() ? "#22c55e" : "#ef4444";
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity(); // Shows tooltip on first invalid field
      log("Validation failed: " + phone.validationMessage, "output-3");
      return;
    }
    log("All fields valid. Phone: " + phone.value, "output-3");
  });

  // --- The 'invalid' event (fires on each invalid field) ---
  phone.addEventListener("invalid", function (event) {
    log("'invalid' event fired: " + this.validationMessage, "output-3");
  });
}


// ============================================================
// EXAMPLE 9 — CSS Pseudo-Classes for Form Validation
// ============================================================

// :valid, :invalid       — based on validation rules
// :required, :optional   — based on required attribute
// :placeholder-shown     — field is empty (showing placeholder)

// --- The :placeholder-shown trick ---
// Problem: input:invalid styles apply IMMEDIATELY, before user types.
// Solution: combine with :not(:placeholder-shown)
//
// /* Only show red border AFTER user has started typing */
// input:invalid:not(:placeholder-shown) { border-color: #f44336; }


// ============================================================
// EXAMPLE 10 — Debounced Auto-Save (Save Draft While Typing)
// Story: Naukri.com auto-saves applications as the user types.
// Debouncing waits 1 second after last keystroke before saving,
// preventing a flood of requests to the server.
// ============================================================

// WHY: Auto-save prevents data loss but must be throttled.
// Debouncing waits until the user pauses before triggering.
// (Implemented in setupRegistrationForm above)


// ============================================================
// EXAMPLE 11 — File Inputs and Preview Before Upload
// Story: Naukri.com lets users preview their profile photo before
// uploading. FileReader reads file content client-side.
// ============================================================

// WHY: File inputs expose File objects. FileReader enables client-
// side preview and validation without server round-trips.

// --- Accessing File Data ---
// input.files — FileList. file.name, file.size, file.type.
// FileReader.readAsDataURL() — for image previews.
// (Implemented in setupRegistrationForm above)


// ============================================================
// EXAMPLE 12 — Practical: Multi-Step Registration Form
// Story: Naukri.com's registration is 3 steps: Personal, Professional,
// Documents. Each step validates before allowing navigation.
// ============================================================

// WHY: Multi-step forms reduce cognitive load. Validation per step
// prevents reaching the end with errors in earlier steps.

function createMultiStepForm() {
  const form = document.getElementById("registration-form");
  if (!form) return;

  const steps = form.querySelectorAll(".step");
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");
  const submitBtn = document.getElementById("final-submit-btn");
  const progressFill = document.getElementById("progress-fill");
  const stepLabels = document.querySelectorAll(".step-label");
  let current = 1;
  const total = steps.length;

  function showStep(n) {
    steps.forEach(s => {
      s.style.display = parseInt(s.dataset.step) === n ? "block" : "none";
    });
    prevBtn.style.display = n === 1 ? "none" : "inline-block";
    nextBtn.style.display = n === total ? "none" : "inline-block";
    submitBtn.style.display = n === total ? "inline-block" : "none";

    // Update progress bar
    progressFill.style.width = `${(n / total) * 100}%`;

    // Update step labels
    stepLabels.forEach(label => {
      const step = parseInt(label.dataset.step);
      label.classList.remove("active", "completed");
      if (step === n) label.classList.add("active");
      if (step < n) label.classList.add("completed");
    });
  }

  function validateCurrent() {
    const stepEl = form.querySelector(`.step[data-step="${current}"]`);
    const fields = stepEl.querySelectorAll("input[required], select[required], textarea[required]");
    let valid = true;
    fields.forEach(f => {
      if (!f.checkValidity()) {
        f.reportValidity();
        valid = false;
      }
    });
    return valid;
  }

  nextBtn.addEventListener("click", () => {
    if (!validateCurrent()) {
      log(`Step ${current}: Validation failed. Fix errors before proceeding.`, "output-4");
      return;
    }
    log(`Step ${current}: Validated successfully.`, "output-4");
    if (current < total) { current++; showStep(current); }
  });

  prevBtn.addEventListener("click", () => {
    if (current > 1) { current--; showStep(current); }
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (!validateCurrent()) {
      log("Final step validation failed.", "output-4");
      return;
    }

    log("--- Registration Submitted ---", "output-4");
    const fd = new FormData(form);
    for (const [k, v] of fd.entries()) {
      log(`  ${k}: ${v instanceof File ? v.name : v}`, "output-4");
    }
    log("Registration complete! (FormData ready for fetch())", "output-4");
  });

  showStep(1);
}


// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. Access forms: document.forms. Access elements: form.elements['name'].
//
// 2. Input events: focus → input(s) → change → blur.
//    Use 'input' for real-time, 'change' for on-leave validation.
//
// 3. Always preventDefault() in submit handlers. Use fetch() for AJAX.
//
// 4. Reading values: .value for text, .checked for checkboxes,
//    .files for file inputs.
//
// 5. FormData: new FormData(form), .get(), .getAll(), .entries().
//    Pass directly to fetch() body.
//
// 6. Real-time validation: validate on 'input', show errors,
//    disable submit button until all pass.
//
// 7. setCustomValidity() for native browser validation messages.
//
// 8. CSS :valid/:invalid/:placeholder-shown for zero-JS visual feedback.
//
// 9. Debounce auto-save: wait until user stops typing before saving.
//
// 10. FileReader for client-side preview. Multi-step forms validate per step.
// ============================================================


// --- Initialize all demos on DOM ready ---
document.addEventListener("DOMContentLoaded", function () {
  setupInputEventDemo();
  setupRegistrationForm();
  setupCustomValidity();
  createMultiStepForm();

  console.log("=== FILE 09 COMPLETE: Form Handling ===");
  console.log("Next: 10-keyboard-mouse-touch");
});
