// ============================================================
// FILE 14: ANIMATION AND requestAnimationFrame
// Topic: JavaScript animations, requestAnimationFrame, Web Animations API, and performance
// WHY: Premium apps like CRED differentiate through buttery-smooth animations —
// reward reveals, card flips, score counters. Knowing when to use CSS vs
// JavaScript animations, and how requestAnimationFrame works, is what
// separates a janky app from a delightful one.
// ============================================================

// --- Helper: Log to console AND an on-page output element ---
function log(msg, targetId) {
    console.log(msg);
    const el = document.getElementById(targetId);
    if (el) el.textContent += msg + '\n';
}

log('=== Animation & requestAnimationFrame Tutorial ===', 'log-1');


// ============================================================
// EXAMPLE 1 — CSS Transitions vs CSS Animations vs JavaScript Animations
// Story: CRED's rewards page has three animation types: hover effects on
// buttons (CSS transitions), looping shimmer on loading placeholders (CSS
// animations), and a complex reward reveal where coins fly to a counter
// (JavaScript animation). Each approach has its sweet spot.
// ============================================================

// WHY: Wrong approach = unnecessary complexity or poor performance.

// CSS Transitions — simple state changes (hover, focus, toggle class)
// CSS Animations — repeating/multi-step, no JS logic needed
// JavaScript (rAF) — dynamic, data-driven, complex sequences

// When to use what:
// ----------------------------------------------------------------
// Use Case                        | Best Approach
// ----------------------------------------------------------------
// Hover/focus effects             | CSS Transitions
// Loading spinners, shimmers      | CSS @keyframes
// Toggle visibility               | CSS Transitions + class toggle
// Scroll-linked animations        | JavaScript (rAF)
// Data-driven (counter to X)      | JavaScript (rAF)
// Complex sequences with logic    | JavaScript (rAF or WAAPI)
// Interruptible animations        | Web Animations API
// ----------------------------------------------------------------

const jsAnimBox = document.getElementById('js-anim-box');
document.getElementById('trigger-js-anim').addEventListener('click', () => {
    jsAnimBox.animate([
        { transform: 'scale(1) rotate(0deg)', background: '#6366f1' },
        { transform: 'scale(1.5) rotate(180deg)', background: '#a78bfa' },
        { transform: 'scale(1) rotate(360deg)', background: '#6366f1' }
    ], { duration: 600, easing: 'ease-in-out' });
    log('JS animation triggered via WAAPI', 'log-1');
});


// ============================================================
// EXAMPLE 2 — requestAnimationFrame: The Foundation
// Story: CRED's reward reveal shows coins raining down with physics-based
// trajectories. CSS can't handle per-coin calculations. rAF syncs frame
// updates to the display refresh rate for smooth 60fps animation.
// ============================================================

// WHY: rAF tells the browser "call this before the next repaint."
// Called ~60 times/second (matching 60Hz displays). Ensures animation
// code runs at optimal time for smooth rendering.

// --- cancelAnimationFrame: Stop an animation ---

const ball = document.getElementById('bouncing-ball');
const ballArea = document.getElementById('ball-area');
let ballAnimId = null;
let ballRunning = false;
let ballFrameCount = 0;

// Ball physics
let ballX = 10, ballY = 10;
let ballVX = 3, ballVY = 2;
const ballSize = 30;

function animateBall(timestamp) {
    if (!ballRunning) return;
    ballFrameCount++;

    const areaW = ballArea.clientWidth;
    const areaH = ballArea.clientHeight;

    ballX += ballVX;
    ballY += ballVY;

    // Bounce off walls
    if (ballX <= 0 || ballX + ballSize >= areaW) { ballVX *= -1; ballX = Math.max(0, Math.min(ballX, areaW - ballSize)); }
    if (ballY <= 0 || ballY + ballSize >= areaH) { ballVY *= -1; ballY = Math.max(0, Math.min(ballY, areaH - ballSize)); }

    ball.style.transform = `translate(${ballX}px, ${ballY}px)`;
    document.getElementById('ball-frame-count').textContent = `Frame: ${ballFrameCount}`;

    ballAnimId = requestAnimationFrame(animateBall);
}

document.getElementById('ball-start').addEventListener('click', () => {
    if (!ballRunning) {
        ballRunning = true;
        ballAnimId = requestAnimationFrame(animateBall);
        log('Ball animation started', 'log-2');
    }
});

document.getElementById('ball-stop').addEventListener('click', () => {
    ballRunning = false;
    cancelAnimationFrame(ballAnimId);
    ballAnimId = null;
    log(`Ball stopped at frame ${ballFrameCount}`, 'log-2');
});


// ============================================================
// EXAMPLE 3 — rAF vs setTimeout/setInterval: Why rAF Wins
// ============================================================

// WHY: setTimeout/setInterval have fundamental animation problems.
// Problem 1: Timer drift — intervals aren't guaranteed, causing jank
// Problem 2: Wrong refresh rate — 16ms assumes 60Hz; 120Hz gets half frames
// Problem 3: Background waste — keeps running when tab is hidden

log('rAF auto-adapts to refresh rate, pauses in background tabs, batches repaints.', 'log-3');


// ============================================================
// EXAMPLE 4 — Animation Loop Pattern with Delta Time
// Story: CRED's score counter animates from 0 to 847. On a 60Hz phone
// it updates 120 times; on a 120Hz iPad, 240 times. Delta time ensures
// both reach 847 at the same 2-second mark — consistent speed.
// ============================================================

// WHY: Fixed per-frame increments run at different SPEEDS on different
// frame rates. Delta time makes animations TIME-BASED, not FRAME-BASED.

// --- Easing Functions (Example 5) ---
// WHY: Easing functions are the secret to natural-feeling animations.

function easeLinear(t) { return t; }

// Ease In (starts slow, ends fast — like dropping a ball)
function easeInQuad(t) { return t * t; }
function easeInCubic(t) { return t * t * t; }

// Ease Out (starts fast, ends slow — like throwing a ball up)
function easeOutQuad(t) { return t * (2 - t); }
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

// Ease In-Out (slow start and end, fast middle — most natural)
function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Elastic (bounces past target, then settles)
function easeOutElastic(t) {
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3)) + 1;
}

// Bounce (bounces at the end)
function easeOutBounce(t) {
    if (t < 1/2.75) return 7.5625 * t * t;
    if (t < 2/2.75) { t -= 1.5/2.75; return 7.5625 * t * t + 0.75; }
    if (t < 2.5/2.75) { t -= 2.25/2.75; return 7.5625 * t * t + 0.9375; }
    t -= 2.625/2.75; return 7.5625 * t * t + 0.984375;
}

// Indian numbering format (12,34,567)
function formatIndian(value, decimals = 0, prefix = '', suffix = '') {
    const fixed = value.toFixed(decimals);
    const [intPart, decPart] = fixed.split('.');
    let formatted = intPart;
    if (intPart.length > 3) {
        const last3 = intPart.slice(-3);
        const rest = intPart.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
        formatted = rest + ',' + last3;
    }
    return prefix + formatted + (decPart ? '.' + decPart : '') + suffix;
}

function animateCounter(options = {}) {
    const { from = 0, to = 100, duration = 2000, easing = easeOutCubic, onUpdate = null } = options;
    let startTime = null;

    return new Promise((resolve) => {
        function animate(timestamp) {
            if (startTime === null) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const value = from + (to - from) * easing(progress);
            if (onUpdate) onUpdate(value, progress);
            if (progress < 1) requestAnimationFrame(animate);
            else resolve(to);
        }
        requestAnimationFrame(animate);
    });
}

document.getElementById('start-counters').addEventListener('click', () => {
    log('Starting counter animations...', 'log-4');

    animateCounter({
        from: 0, to: 847, duration: 2000, easing: easeOutCubic,
        onUpdate: (val) => { document.getElementById('counter-score').textContent = Math.round(val); }
    }).then(() => log('Score counter done: 847', 'log-4'));

    animateCounter({
        from: 0, to: 12450, duration: 2500, easing: easeOutCubic,
        onUpdate: (val) => { document.getElementById('counter-cashback').textContent = formatIndian(val, 0, 'Rs.'); }
    }).then(() => log('Cashback counter done: Rs.12,450', 'log-4'));

    animateCounter({
        from: 0, to: 23, duration: 1500, easing: easeOutCubic,
        onUpdate: (val) => { document.getElementById('counter-bills').textContent = Math.round(val); }
    }).then(() => log('Bills counter done: 23', 'log-4'));
});

// Comparison at t=0.5 (halfway through animation):
log('Easing at t=0.5:', 'log-5');
log('  Linear: ' + easeLinear(0.5).toFixed(3), 'log-5');
log('  EaseIn: ' + easeInQuad(0.5).toFixed(3), 'log-5');
log('  EaseOut: ' + easeOutQuad(0.5).toFixed(3), 'log-5');
log('  EaseInOut: ' + easeInOutCubic(0.5).toFixed(3), 'log-5');
log('  Elastic: ' + easeOutElastic(0.5).toFixed(3), 'log-5');


// ============================================================
// EXAMPLE 5 — Easing Visualizer
// ============================================================

const easingMap = {
    'ease-linear': easeLinear,
    'ease-in': easeInQuad,
    'ease-out': easeOutQuad,
    'ease-in-out': easeInOutCubic,
    'ease-elastic': easeOutElastic,
    'ease-bounce': easeOutBounce
};

document.getElementById('run-easing').addEventListener('click', () => {
    const duration = 1500;
    let startTime = null;

    function animate(timestamp) {
        if (startTime === null) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const linearProgress = Math.min(elapsed / duration, 1);

        Object.entries(easingMap).forEach(([id, fn]) => {
            const runner = document.getElementById(id);
            if (runner) {
                const easedProgress = fn(linearProgress);
                const maxX = runner.parentElement.clientWidth - 20 - 150; // label width + padding
                runner.style.transform = `translateX(${easedProgress * maxX}px)`;
            }
        });

        if (linearProgress < 1) requestAnimationFrame(animate);
        else log('All easing demos complete.', 'log-5');
    }

    // Reset
    Object.keys(easingMap).forEach(id => {
        const runner = document.getElementById(id);
        if (runner) runner.style.transform = 'translateX(0)';
    });

    requestAnimationFrame(animate);
    log('Running easing comparison...', 'log-5');
});


// ============================================================
// EXAMPLE 6 — Animating the RIGHT Properties (Avoid Reflow!)
// Story: CRED's early card animation used top/left — choppy on mid-range
// Android phones because top/left triggers LAYOUT REFLOW. Switching to
// transform: translate() made it silky smooth — GPU-accelerated, no reflow.
// ============================================================

// WHY: Not all CSS properties animate equally.

// AVOID (trigger REFLOW — very expensive):
// width, height, margin, padding, top, right, bottom, left, border-width

// OK (trigger REPAINT only — moderate):
// color, background-color, box-shadow, outline

// BEST (GPU COMPOSITING — fast, skip reflow & repaint):
// transform (translate, rotate, scale), opacity, filter (blur, brightness)

// Hint the browser to prepare a GPU layer:
// .card-to-animate { will-change: transform, opacity; }
// CAUTION: Don't overuse will-change — each GPU layer consumes memory.

document.getElementById('compare-props').addEventListener('click', () => {
    const badBox = document.getElementById('bad-box');
    const goodBox = document.getElementById('good-box');
    const duration = 1000;
    let startTime = null;

    // Reset
    badBox.style.left = '10px';
    goodBox.style.transform = 'translateY(-50%) translateX(0)';

    function animate(timestamp) {
        if (startTime === null) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const eased = easeInOutCubic(progress);
        const maxX = 200;

        // BAD: top/left (triggers reflow every frame!)
        badBox.style.left = (10 + eased * maxX) + 'px';

        // GOOD: transform (GPU composited!)
        goodBox.style.transform = `translateY(-50%) translateX(${eased * maxX}px)`;

        if (progress < 1) requestAnimationFrame(animate);
        else log('Comparison done. transform is smoother on real devices!', 'log-6');
    }

    requestAnimationFrame(animate);
    log('BAD: animating left (reflow). GOOD: animating transform (GPU).', 'log-6');
});


// ============================================================
// EXAMPLE 7 — Web Animations API: element.animate()
// Story: CRED's reward reveal has multiple steps: card slides in, flips,
// coins animate to counter, score ticks up. WAAPI chains these with
// promises, supports pause/resume/reverse, and runs with CSS-level
// performance. More powerful than CSS, cleaner than raw rAF.
// ============================================================

// WHY: WAAPI combines CSS animation performance with JS flexibility.
// Returns Animation object with rich controls and promises.

const rewardCard = document.getElementById('reward-card');
let cardFlipped = false;

document.getElementById('flip-card').addEventListener('click', () => {
    if (cardFlipped) return;

    // Keyframes (array form):
    const animation = rewardCard.animate([
        { transform: 'rotateY(0deg)' },
        { transform: 'rotateY(180deg)' }
    ], {
        duration: 800,
        easing: 'ease-in-out',
        fill: 'forwards'    // Keep final state
    });

    animation.finished.then(() => {
        cardFlipped = true;
        log('Card flipped! Reward revealed.', 'log-7');
    });

    log('Flipping card via WAAPI...', 'log-7');
});

document.getElementById('reset-card').addEventListener('click', () => {
    rewardCard.animate([
        { transform: 'rotateY(180deg)' },
        { transform: 'rotateY(0deg)' }
    ], { duration: 500, easing: 'ease-in-out', fill: 'forwards' });
    cardFlipped = false;
    log('Card reset.', 'log-7');
});


// ============================================================
// EXAMPLE 8 — Animation Controls: Pause, Resume, Reverse, Finish
// Story: CRED's coin rain pauses when user presses home, resumes on return.
// Tapping the reward card reverses the animation — coins fly back up.
// WAAPI provides all controls natively.
// ============================================================

// WHY: Full programmatic control over running animations.

const controlBox = document.getElementById('control-box');
const stateEl = document.getElementById('ctrl-state');

let controlAnim = controlBox.animate([
    { transform: 'translateY(-50%) translateX(0px)' },
    { transform: 'translateY(-50%) translateX(calc(100vw - 100px))' }
], {
    duration: 3000,
    iterations: Infinity,
    direction: 'alternate',
    easing: 'ease-in-out'
});

controlAnim.pause(); // Start paused

function updateState() {
    stateEl.textContent = controlAnim.playState;
}

// animation.pause();           // Freeze at current position
// animation.play();            // Resume
// animation.reverse();         // Play backwards from current position
// animation.finish();          // Jump to end state
// animation.cancel();          // Remove animation, reset to original
// animation.currentTime = 1000; // Jump to 1-second mark
// animation.playbackRate = 2;   // 2x speed

document.getElementById('ctrl-play').addEventListener('click', () => {
    controlAnim.play();
    updateState();
    log('play() — ' + controlAnim.playState, 'log-8');
});

document.getElementById('ctrl-pause').addEventListener('click', () => {
    controlAnim.pause();
    updateState();
    log('pause() — ' + controlAnim.playState, 'log-8');
});

document.getElementById('ctrl-reverse').addEventListener('click', () => {
    controlAnim.reverse();
    updateState();
    log('reverse() — playbackRate: ' + controlAnim.playbackRate, 'log-8');
});

document.getElementById('ctrl-finish').addEventListener('click', () => {
    controlAnim.finish();
    updateState();
    log('finish() — jumped to end', 'log-8');
});

document.getElementById('ctrl-cancel').addEventListener('click', () => {
    controlAnim.cancel();
    updateState();
    log('cancel() — reset to original', 'log-8');
});

const speedRange = document.getElementById('speed-range');
const speedValue = document.getElementById('speed-value');
speedRange.addEventListener('input', () => {
    const rate = parseFloat(speedRange.value);
    controlAnim.playbackRate = rate;
    speedValue.textContent = rate + 'x';
    log(`playbackRate = ${rate}`, 'log-8');
});


// ============================================================
// EXAMPLE 9 — getAnimations(): Managing Multiple Animations
// Story: CRED's rewards page has dozens of animated elements. When the
// user navigates away, ALL animations pause to save battery.
// getAnimations() returns every running animation for bulk control.
// ============================================================

// WHY: Manage many animations without tracking each individually.

// document.getAnimations()          // All animations on the page
// element.getAnimations()           // Animations on specific element

const multiBoxes = document.querySelectorAll('.multi-box');
let multiAnims = [];

document.getElementById('start-multi').addEventListener('click', () => {
    multiAnims = [];
    multiBoxes.forEach((box, i) => {
        const anim = box.animate([
            { transform: 'translateY(0) scale(1)', opacity: 1 },
            { transform: 'translateY(-30px) scale(1.2)', opacity: 0.6 },
            { transform: 'translateY(0) scale(1)', opacity: 1 }
        ], {
            duration: 1000 + i * 200,
            iterations: Infinity,
            easing: 'ease-in-out',
            delay: i * 100
        });
        multiAnims.push(anim);
    });
    log(`Started ${multiAnims.length} animations.`, 'log-9');
});

document.getElementById('pause-multi').addEventListener('click', () => {
    // Using getAnimations() for bulk control
    const allAnims = document.getElementById('multi-anim-area').getAnimations();
    allAnims.forEach(a => a.pause());
    log(`Paused ${allAnims.length} animations.`, 'log-9');
});

document.getElementById('resume-multi').addEventListener('click', () => {
    const allAnims = document.getElementById('multi-anim-area').getAnimations();
    allAnims.forEach(a => a.play());
    log(`Resumed ${allAnims.length} animations.`, 'log-9');
});

document.getElementById('speed-multi').addEventListener('click', () => {
    const allAnims = document.getElementById('multi-anim-area').getAnimations();
    allAnims.forEach(a => { a.playbackRate = a.playbackRate === 2 ? 1 : 2; });
    log('Toggled 2x speed on all animations.', 'log-9');
});

// Respect prefers-reduced-motion:
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    log('prefers-reduced-motion detected — animations should be reduced.', 'log-9');
}


// ============================================================
// EXAMPLE 10 — Smooth Scroll with Custom Easing via rAF
// Story: CRED's "Learn More" button scrolls to features section. The
// browser's built-in smooth scroll uses a fixed curve. CRED wanted a
// custom ease-in-out with slight overshoot matching their brand feel.
// ============================================================

// WHY: Custom scroll easing requires manual rAF implementation.

function smoothScrollTo(targetY, duration = 800, easingFn = easeInOutCubic) {
    const startY = window.scrollY;
    const distance = targetY - startY;
    let startTime = null;

    function animate(timestamp) {
        if (startTime === null) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        window.scrollTo(0, startY + distance * easingFn(progress));
        if (progress < 1) requestAnimationFrame(animate);
        else log('Smooth scroll complete', 'log-10');
    }
    requestAnimationFrame(animate);
}

document.getElementById('smooth-to-top').addEventListener('click', () => {
    smoothScrollTo(0, 1000);
    log('Custom smooth scroll to top...', 'log-10');
});

document.getElementById('smooth-to-bottom').addEventListener('click', () => {
    const takeaways = document.getElementById('takeaways');
    if (takeaways) {
        smoothScrollTo(takeaways.offsetTop - 20, 1000);
        log('Custom smooth scroll to takeaways...', 'log-10');
    }
});


// ============================================================
// EXAMPLE 11 — Number Counter Animation
// (Implemented above with animateCounter function)
// ============================================================

log('Format test: ' + formatIndian(1234567, 0, 'Rs.'), 'log-4');
log('Format test: ' + formatIndian(847), 'log-4');


// ============================================================
// EXAMPLE 12 — Practical: Progress Bar Animates on Scroll Into View
// Story: CRED's "How it Works" has bars: "87% bills on time", "92%
// cashback claimed". When the section scrolls into view, bars animate
// from 0% to target. Combines IntersectionObserver + rAF.
// ============================================================

// WHY: Combines scroll detection and animation — real-world pattern.

function animateBar(barElement, valueElement, targetPercent, duration = 1500) {
    let startTime = null;
    function animate(timestamp) {
        if (startTime === null) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const width = targetPercent * easeOutCubic(progress);
        barElement.style.width = width + '%';
        valueElement.textContent = Math.round(width) + '%';
        if (progress < 1) requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
}

const progressObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const bar = entry.target;
            const target = parseFloat(bar.dataset.target || 0);
            const delay = parseFloat(bar.dataset.delay || 0);
            const valEl = document.getElementById(bar.id.replace('bar-', 'val-'));
            setTimeout(() => {
                animateBar(bar, valEl, target);
                log(`Animating progress bar to ${target}%`, 'log-12');
            }, delay);
            progressObserver.unobserve(bar);
        });
    },
    { threshold: 0.3 }
);

document.querySelectorAll('.progress-bar').forEach(bar => progressObserver.observe(bar));


// ============================================================
// EXAMPLE 13 — Chaining Animations with Promises
// Story: CRED's reward sequence: (1) card slides up, (2) card flips,
// (3) confetti explodes, (4) coins fly to counter, (5) counter ticks up.
// Each step completes before the next. WAAPI's .finished promise chains it.
// ============================================================

// WHY: Promise chaining with WAAPI is cleaner than nested callbacks.

document.getElementById('run-sequence').addEventListener('click', async () => {
    const card = document.getElementById('seq-card');
    const confettiArea = document.getElementById('seq-confetti');
    const counter = document.getElementById('seq-counter');

    log('Starting reward reveal...', 'log-13');

    // Step 1: Card slides up
    const slideUp = card.animate([
        { transform: 'translateY(100px)', opacity: 0 },
        { transform: 'translateY(0)', opacity: 1 }
    ], { duration: 600, easing: 'ease-out', fill: 'forwards' });
    await slideUp.finished;
    log('1. Card slid up', 'log-13');

    // Step 2: Card flips
    const flip = card.animate([
        { transform: 'rotateY(0deg)' },
        { transform: 'rotateY(360deg)' }
    ], { duration: 800, easing: 'ease-in-out', fill: 'forwards' });
    await flip.finished;
    log('2. Card flipped', 'log-13');

    // Step 3: Confetti (CSS class trigger + wait)
    const colors = ['#6366f1', '#a78bfa', '#22c55e', '#f59e0b', '#ef4444'];
    for (let i = 0; i < 20; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.background = colors[i % colors.length];
        piece.style.left = (40 + Math.random() * 20) + '%';
        piece.style.top = '50%';
        confettiArea.appendChild(piece);
        piece.animate([
            { transform: 'translate(0, 0) rotate(0deg)', opacity: 1 },
            { transform: `translate(${(Math.random() - 0.5) * 200}px, ${-100 - Math.random() * 100}px) rotate(${Math.random() * 720}deg)`, opacity: 0 }
        ], { duration: 800, easing: 'ease-out', fill: 'forwards', delay: i * 30 });
    }
    await new Promise(r => setTimeout(r, 1000));
    confettiArea.innerHTML = '';
    log('3. Confetti exploded', 'log-13');

    // Step 4: Card pulses (simulating coins)
    const pulse = card.animate([
        { transform: 'scale(1)', boxShadow: '0 0 0px rgba(99,102,241,0)' },
        { transform: 'scale(1.1)', boxShadow: '0 0 30px rgba(99,102,241,0.5)' },
        { transform: 'scale(1)', boxShadow: '0 0 0px rgba(99,102,241,0)' }
    ], { duration: 500, fill: 'forwards' });
    await pulse.finished;
    log('4. Coins collected', 'log-13');

    // Step 5: Counter ticks up
    await animateCounter({
        from: 800, to: 847, duration: 1000, easing: easeOutCubic,
        onUpdate: (val) => { counter.textContent = 'Score: ' + Math.round(val); }
    });
    log('5. Score updated to 847', 'log-13');

    log('Reward reveal complete!', 'log-13');
});


// ============================================================
// KEY TAKEAWAYS
// ============================================================
// 1. CSS transitions for simple states, CSS @keyframes for repeating
//    animations, JavaScript (rAF/WAAPI) for dynamic/complex sequences.
//
// 2. requestAnimationFrame syncs to display refresh rate (60/120Hz),
//    pauses in background tabs. ALWAYS use instead of setTimeout for animation.
//
// 3. Delta time (elapsed / duration) gives TIME-BASED animation that runs
//    at consistent speed across different frame rates.
//
// 4. Easing functions transform linear progress into natural-feeling curves.
//    easeInOutCubic is most natural for UI. Elastic/bounce add personality.
//
// 5. Only animate transform and opacity — GPU-composited, skip reflow.
//    NEVER animate width, height, top, left in loops.
//
// 6. element.animate() (WAAPI) returns Animation with pause(), play(),
//    reverse(), finish(), cancel(), and .finished promise.
//
// 7. getAnimations() queries all running animations for bulk control.
//
// 8. Chain with await animation.finished. Parallelize with Promise.all().
//
// 9. Respect prefers-reduced-motion — skip or reduce animations.
//
// 10. will-change: transform hints GPU layer prep. Use sparingly.
