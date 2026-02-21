// ============================================================
// FILE 23: CANVAS BASICS — DRAWING GRAPHICS WITH JAVASCRIPT
// Topic: Using the HTML5 Canvas API to draw shapes, text, images, and animations
// WHY: Canvas lets you draw anything — charts, games, image editors, signature
// pads — directly in the browser. Indian fintech apps like Razorpay use it for
// receipt generation and signature capture. Understanding Canvas opens doors to
// data visualization, gaming, and creative coding.
// ============================================================

// ============================================================
// HELPER: log to console AND to an on-page output element
// ============================================================
function log(msg, targetId) {
    console.log(msg);
    const el = document.getElementById(targetId);
    if (el) el.textContent += msg + '\n';
}

// ============================================================
// EXAMPLE 1 — Razorpay Payment Receipts and Charts
// Story: Razorpay powers payments for millions of Indian businesses. Their
// merchant dashboard shows interactive charts for daily transactions. When a
// customer pays, a receipt image is generated on Canvas and downloaded as PNG.
// Delivery agents capture signatures on Canvas for proof of delivery.
// ============================================================

// NOTE: All Canvas code runs in the BROWSER with an HTML <canvas> element.

// ============================================================
// SECTION 1: Setting Up Canvas
// ============================================================

// WHY: Canvas is a blank drawing surface. Get the 2D context — your "paintbrush."

// HTML: <canvas id="myCanvas" width="800" height="600"></canvas>
// JS:   const canvas = document.getElementById('myCanvas');
//       const ctx = canvas.getContext('2d');

// IMPORTANT: Canvas width/height attributes set PIXEL RESOLUTION.
// CSS width/height set DISPLAY SIZE. If they differ, drawing is stretched!

// For Retina displays:
function setupHighDPI(canvas, width, height) {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    return ctx;
}

// ============================================================
// SECTION 2: Coordinate System
// ============================================================

// WHY: (0,0) is TOP-LEFT. y increases DOWNWARD — opposite to math class.
// (canvas.width, canvas.height) = bottom-right

// ============================================================
// SECTION 3: Drawing Rectangles
// ============================================================

// WHY: Rectangles are the ONLY primitive shape Canvas provides directly.
// fillRect(x, y, width, height) — filled rectangle
// strokeRect — outline only
// clearRect — erase a rectangular area (make transparent)

// ============================================================
// SECTION 14: Practical — Bar Chart for Sales Data
// ============================================================

// WHY: Combines rectangles, text, gradients — a real merchant dashboard chart.

const salesData = [
    { label: 'Jan', value: 12 }, { label: 'Feb', value: 19 },
    { label: 'Mar', value: 15 }, { label: 'Apr', value: 25 },
    { label: 'May', value: 22 }, { label: 'Jun', value: 30 },
    { label: 'Jul', value: 28 }, { label: 'Aug', value: 35 },
    { label: 'Sep', value: 32 }, { label: 'Oct', value: 40 },
    { label: 'Nov', value: 45 }, { label: 'Dec', value: 50 },
];

function drawBarChart(ctx, data, title, canvasW, canvasH) {
    var x = 60, y = 40, width = canvasW - 100, height = canvasH - 100;
    var barCount = data.length;
    var barW = (width - 40) / barCount * 0.7;
    var gap = (width - 40) / barCount * 0.3;
    var maxVal = Math.max.apply(null, data.map(function (d) { return d.value; }));

    // Background
    ctx.fillStyle = '#0b1120';
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Title
    ctx.font = 'bold 18px Segoe UI, Arial';
    ctx.fillStyle = '#e2e8f0';
    ctx.textAlign = 'center';
    ctx.fillText(title, canvasW / 2, y - 10);

    // Axes
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + height);
    ctx.lineTo(x + width, y + height);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (var g = 0; g <= 5; g++) {
        var gy = y + height - (g / 5) * (height - 30);
        ctx.beginPath();
        ctx.moveTo(x, gy);
        ctx.lineTo(x + width, gy);
        ctx.stroke();
        ctx.fillStyle = '#64748b';
        ctx.font = '11px Courier New';
        ctx.textAlign = 'right';
        ctx.fillText(Math.round(maxVal * g / 5) + 'L', x - 8, gy + 4);
    }

    // Bars
    data.forEach(function (item, i) {
        var barH = (item.value / maxVal) * (height - 30);
        var barX = x + 20 + i * (barW + gap);
        var barY = y + height - barH;

        // Gradient fill
        var grad = ctx.createLinearGradient(barX, barY, barX, y + height);
        grad.addColorStop(0, '#6366f1');
        grad.addColorStop(1, '#312e81');
        ctx.fillStyle = grad;

        // Rounded top
        var r = 4;
        ctx.beginPath();
        ctx.moveTo(barX + r, barY);
        ctx.lineTo(barX + barW - r, barY);
        ctx.arcTo(barX + barW, barY, barX + barW, barY + r, r);
        ctx.lineTo(barX + barW, y + height);
        ctx.lineTo(barX, y + height);
        ctx.lineTo(barX, barY + r);
        ctx.arcTo(barX, barY, barX + r, barY, r);
        ctx.closePath();
        ctx.fill();

        // Value label
        ctx.font = 'bold 11px Segoe UI';
        ctx.fillStyle = '#a5b4fc';
        ctx.textAlign = 'center';
        ctx.fillText(item.value + 'L', barX + barW / 2, barY - 8);

        // Month label
        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px Segoe UI';
        ctx.fillText(item.label, barX + barW / 2, y + height + 18);
    });
}

// Draw the bar chart immediately
(function () {
    var canvas = document.getElementById('bar-chart');
    var ctx = canvas.getContext('2d');
    drawBarChart(ctx, salesData, 'Razorpay Merchant — Monthly Sales (Lakhs)', canvas.width, canvas.height);
    log('Bar chart drawn: 12 months of sales data with gradient bars', 'chart-log');
    salesData.forEach(function (d) {
        log('  ' + d.label + ': ' + '#'.repeat(d.value) + ' ' + d.value + 'L', 'chart-log');
    });
})();

// ============================================================
// EXAMPLE 2 — CRED Reward Card Design
// Story: CRED generates beautiful reward cards when users pay credit card
// bills — gradient backgrounds, rounded corners, text overlays, and logos.
// The card is exported as an image for social sharing. Paths and arcs
// make the rounded corners possible.
// ============================================================

// ============================================================
// SECTION 4: Paths — Lines, Polygons, Custom Shapes
// ============================================================

// WHY: Everything that is not a rectangle is drawn with paths.
// beginPath → moveTo → lineTo → closePath → fill/stroke

function drawTriangle(ctx) {
    ctx.beginPath();
    ctx.moveTo(100, 250);
    ctx.lineTo(200, 250);
    ctx.lineTo(150, 170);
    ctx.closePath();
    ctx.fillStyle = '#f59e0b';
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.stroke();
}

function drawStar(ctx, cx, cy, outerR, innerR, points) {
    ctx.beginPath();
    for (var i = 0; i < points * 2; i++) {
        var r = i % 2 === 0 ? outerR : innerR;
        var angle = (Math.PI * i) / points - Math.PI / 2;
        var x = cx + r * Math.cos(angle);
        var y = cy + r * Math.sin(angle);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = '#fbbf24';
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.stroke();
}

function drawRoundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
}

// ============================================================
// SECTION 5: Circles and Arcs
// ============================================================

// WHY: No ctx.circle() exists. Use arc(). Also needed for pie charts and gauges.
// arc(x, y, radius, startAngle, endAngle, anticlockwise)
// Angles in RADIANS: 0 = 3 o'clock, Math.PI = 9 o'clock, Math.PI*2 = full
// Degrees to radians: rad = deg * Math.PI / 180

function drawCircles(ctx) {
    // Full circle
    ctx.beginPath();
    ctx.arc(100, 150, 50, 0, Math.PI * 2);
    ctx.fillStyle = '#6366f1';
    ctx.fill();

    // Semicircle
    ctx.beginPath();
    ctx.arc(250, 150, 50, 0, Math.PI);
    ctx.fillStyle = '#ef4444';
    ctx.fill();

    // Pie slice (quarter)
    ctx.beginPath();
    ctx.moveTo(400, 150);
    ctx.arc(400, 150, 50, 0, Math.PI / 2);
    ctx.closePath();
    ctx.fillStyle = '#22c55e';
    ctx.fill();

    // Ring
    ctx.beginPath();
    ctx.arc(550, 150, 50, 0, Math.PI * 2);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 8;
    ctx.stroke();
}

// ============================================================
// DOM: Shapes Canvas
// ============================================================

var shapesCanvas = document.getElementById('shapes-canvas');
var shapesCtx = shapesCanvas.getContext('2d');

function clearShapes() {
    shapesCtx.clearRect(0, 0, shapesCanvas.width, shapesCanvas.height);
}

document.getElementById('btn-draw-rects').addEventListener('click', function () {
    clearShapes();
    // fillRect
    shapesCtx.fillStyle = '#6366f1';
    shapesCtx.fillRect(50, 50, 200, 100);
    // strokeRect
    shapesCtx.strokeStyle = '#ef4444';
    shapesCtx.lineWidth = 3;
    shapesCtx.strokeRect(300, 50, 200, 100);
    // clearRect hole
    shapesCtx.clearRect(100, 75, 60, 50);
    log('Drawn: fillRect, strokeRect, clearRect (hole in blue)', 'shapes-log');
});

document.getElementById('btn-draw-circles').addEventListener('click', function () {
    clearShapes();
    drawCircles(shapesCtx);
    log('Drawn: full circle, semicircle, pie slice, ring', 'shapes-log');
});

document.getElementById('btn-draw-triangle').addEventListener('click', function () {
    clearShapes();
    drawTriangle(shapesCtx);
    log('Drawn: triangle using beginPath + moveTo + lineTo + closePath', 'shapes-log');
});

document.getElementById('btn-draw-star').addEventListener('click', function () {
    clearShapes();
    drawStar(shapesCtx, 400, 150, 80, 35, 5);
    log('Drawn: 5-point star using loop with outer/inner radius', 'shapes-log');
});

document.getElementById('btn-draw-rounded').addEventListener('click', function () {
    clearShapes();
    // CRED-style card
    var grad = shapesCtx.createLinearGradient(100, 50, 700, 250);
    grad.addColorStop(0, '#1a1a2e');
    grad.addColorStop(1, '#16213e');
    drawRoundedRect(shapesCtx, 100, 50, 600, 200, 20);
    shapesCtx.fillStyle = grad;
    shapesCtx.fill();
    shapesCtx.strokeStyle = '#334155';
    shapesCtx.lineWidth = 2;
    shapesCtx.stroke();
    // Card text
    shapesCtx.font = 'bold 24px Segoe UI';
    shapesCtx.fillStyle = '#e2e8f0';
    shapesCtx.textAlign = 'left';
    shapesCtx.fillText('CRED Reward Card', 140, 130);
    shapesCtx.font = '14px Segoe UI';
    shapesCtx.fillStyle = '#94a3b8';
    shapesCtx.fillText('Rs.500 cashback on your next credit card payment', 140, 165);
    log('Drawn: CRED-style rounded card with gradient + text', 'shapes-log');
});

document.getElementById('btn-clear-shapes').addEventListener('click', function () {
    clearShapes();
    log('Canvas cleared', 'shapes-log');
});

// ============================================================
// SECTION 6: Colors, Gradients, and Styles
// ============================================================

// WHY: Gradients create professional-looking backgrounds like CRED reward cards.

// Solid: 'red', '#FF5733', 'rgb(255,87,51)', 'rgba(255,87,51,0.5)'
// Linear gradient: createLinearGradient(x0, y0, x1, y1)
// Radial gradient: createRadialGradient(x0, y0, r0, x1, y1, r1)
// Line styles: lineWidth, lineCap = 'round', setLineDash([10, 5])

(function () {
    var canvas = document.getElementById('gradient-canvas');
    var ctx = canvas.getContext('2d');

    // Linear gradient
    var lg = ctx.createLinearGradient(0, 0, 400, 0);
    lg.addColorStop(0, '#667eea');
    lg.addColorStop(1, '#f093fb');
    ctx.fillStyle = lg;
    ctx.fillRect(0, 0, 400, 250);

    // Radial gradient
    var rg = ctx.createRadialGradient(600, 125, 20, 600, 125, 120);
    rg.addColorStop(0, '#fbbf24');
    rg.addColorStop(0.6, '#f59e0b');
    rg.addColorStop(1, '#0f172a');
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.arc(600, 125, 120, 0, Math.PI * 2);
    ctx.fill();

    // Label
    ctx.font = '14px Segoe UI';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText('Linear Gradient', 200, 130);
    ctx.fillText('Radial Gradient', 600, 130);
})();

// ============================================================
// SECTION 7: Drawing Text
// ============================================================

// WHY: Text for labels, receipts, watermarks. Razorpay draws "Payment
// Successful" and transaction details directly on Canvas.

// fillText(text, x, y) — filled text
// strokeText(text, x, y) — outlined text
// font = '32px Arial'
// textAlign = 'center' | 'start' | 'end' | 'left' | 'right'
// textBaseline = 'middle' | 'top' | 'alphabetic' | 'bottom'
// measureText('Hello').width — measure text width for centering/wrapping

// --- Word wrapping (Canvas has NO native wrap!) ---
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    var words = text.split(' ');
    var line = '';
    for (var i = 0; i < words.length; i++) {
        var test = line + words[i] + ' ';
        if (ctx.measureText(test).width > maxWidth && i > 0) {
            ctx.fillText(line, x, y);
            line = words[i] + ' ';
            y += lineHeight;
        } else {
            line = test;
        }
    }
    ctx.fillText(line, x, y);
}

(function () {
    var canvas = document.getElementById('text-canvas');
    var ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0b1120';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Filled text
    ctx.font = '32px Segoe UI';
    ctx.fillStyle = '#22c55e';
    ctx.textAlign = 'left';
    ctx.fillText('Payment Successful!', 30, 50);

    // Outlined text
    ctx.font = 'bold 48px Georgia';
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2;
    ctx.strokeText('RAZORPAY', 30, 110);

    // Measure + wrap
    ctx.font = '14px Segoe UI';
    ctx.fillStyle = '#94a3b8';
    var w = ctx.measureText('Payment Successful!').width;
    wrapText(ctx, 'Canvas has no native text wrapping. This helper function splits text by words and measures each line to fit within a max width.', 30, 150, 500, 20);

    log('Text drawn: fillText, strokeText, word-wrap helper', 'text-log');
    log('measureText("Payment Successful!").width = ' + w.toFixed(1) + 'px', 'text-log');
})();

// ============================================================
// EXAMPLE 3 — PhonePe Transaction Chart
// Story: PhonePe shows monthly spending as colorful bar charts and pie charts.
// These are drawn on Canvas with smooth animations. The drawImage API adds
// the PhonePe logo as a watermark on exported receipt images.
// ============================================================

// ============================================================
// SECTION 8: Drawing Images
// ============================================================

// WHY: Draw logos, photos, icons. Razorpay draws merchant logos on receipts.

// drawImage(img, dx, dy)                       — Original size
// drawImage(img, dx, dy, dw, dh)               — Resized
// drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh) — Crop + resize
// MUST wait for load — drawing before load gives blank result!

document.getElementById('btn-draw-image').addEventListener('click', function () {
    var canvas = document.getElementById('image-canvas');
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Create a synthetic image on a temp canvas since we cannot load external images
    var tmpCanvas = document.createElement('canvas');
    tmpCanvas.width = 200;
    tmpCanvas.height = 200;
    var tmpCtx = tmpCanvas.getContext('2d');

    // Draw a placeholder "logo"
    var grad = tmpCtx.createLinearGradient(0, 0, 200, 200);
    grad.addColorStop(0, '#6366f1');
    grad.addColorStop(1, '#a855f7');
    tmpCtx.fillStyle = grad;
    tmpCtx.fillRect(0, 0, 200, 200);
    tmpCtx.font = 'bold 24px Arial';
    tmpCtx.fillStyle = '#fff';
    tmpCtx.textAlign = 'center';
    tmpCtx.textBaseline = 'middle';
    tmpCtx.fillText('LOGO', 100, 100);

    // Form 1: original size
    ctx.drawImage(tmpCanvas, 20, 25);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText('Original (200x200)', 120, 240);

    // Form 2: resized
    ctx.drawImage(tmpCanvas, 260, 50, 120, 80);
    ctx.fillText('Resized (120x80)', 320, 240);

    // Form 3: cropped region
    ctx.drawImage(tmpCanvas, 50, 50, 100, 100, 440, 50, 160, 160);
    ctx.fillText('Cropped + Resized', 520, 240);

    log('drawImage: 3 forms demonstrated (original, resized, cropped)', 'image-log');
    log('Note: img.onload is required for external images (async)', 'image-log');
});

// ============================================================
// SECTION 9: Canvas Transformations
// ============================================================

// WHY: Rotate, scale, move the coordinate system instead of calculating manually.

// ALWAYS wrap in save/restore — transformations accumulate!
// ctx.save();
// ctx.translate(x, y);  // move origin
// ctx.rotate(radians);  // rotate around current origin
// ctx.scale(x, y);      // scale future drawings
// ctx.restore();         // undo all transformations

// Common pattern: rotate shape around its center:
// ctx.save();
// ctx.translate(x + w/2, y + h/2);  // Move origin to center
// ctx.rotate(degrees * Math.PI / 180);
// ctx.fillRect(-w/2, -h/2, w, h);   // Draw centered
// ctx.restore();

// ============================================================
// SECTION 10: Pixel Manipulation
// ============================================================

// WHY: Read/modify individual pixels for image filters (grayscale, invert).

// const imageData = ctx.getImageData(x, y, w, h);
// const px = imageData.data;  // Uint8ClampedArray: [R,G,B,A, R,G,B,A, ...]
// Weighted grayscale: gray = 0.299*R + 0.587*G + 0.114*B
// ctx.putImageData(imageData, x, y);

// ============================================================
// SECTION 11: Exporting Canvas as Image
// ============================================================

// WHY: Save receipts and charts as downloadable images.

// toDataURL — returns base64 string
// canvas.toDataURL();                     // PNG (default)
// canvas.toDataURL('image/jpeg', 0.8);   // JPEG 80% quality

// toBlob — better for large images (async, less memory)
// canvas.toBlob((blob) => { ... }, 'image/png');

// ============================================================
// DOM: Signature / Drawing Pad
// ============================================================

// ============================================================
// SECTION 13: Mouse Interaction
// ============================================================

// WHY: Signature capture, drawing apps, click detection on chart elements.

var drawingCanvas = document.getElementById('drawing-canvas');
var drawCtx = drawingCanvas.getContext('2d');
var isDrawing = false;
var lastX = 0, lastY = 0;
var strokes = []; // Array of stroke arrays for undo
var currentStroke = [];

var brushColorInput = document.getElementById('brush-color');
var brushSizeInput = document.getElementById('brush-size');
var brushSizeLabel = document.getElementById('brush-size-label');

brushSizeInput.addEventListener('input', function () {
    brushSizeLabel.textContent = this.value + 'px';
});

function getCanvasPos(e, canvas) {
    var rect = canvas.getBoundingClientRect();
    var scaleX = canvas.width / rect.width;
    var scaleY = canvas.height / rect.height;
    var clientX, clientY;
    if (e.touches) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }
    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
    };
}

function startDraw(e) {
    e.preventDefault();
    isDrawing = true;
    var p = getCanvasPos(e, drawingCanvas);
    lastX = p.x;
    lastY = p.y;
    currentStroke = [];
}

function doDraw(e) {
    if (!isDrawing) return;
    e.preventDefault();
    var p = getCanvasPos(e, drawingCanvas);

    drawCtx.beginPath();
    drawCtx.moveTo(lastX, lastY);
    drawCtx.lineTo(p.x, p.y);
    drawCtx.strokeStyle = brushColorInput.value;
    drawCtx.lineWidth = parseInt(brushSizeInput.value);
    drawCtx.lineCap = 'round';
    drawCtx.lineJoin = 'round';
    drawCtx.stroke();

    currentStroke.push({ x1: lastX, y1: lastY, x2: p.x, y2: p.y, color: brushColorInput.value, size: parseInt(brushSizeInput.value) });
    lastX = p.x;
    lastY = p.y;
}

function endDraw() {
    if (!isDrawing) return;
    isDrawing = false;
    if (currentStroke.length > 0) {
        strokes.push(currentStroke.slice());
    }
    currentStroke = [];
}

// Mouse events
drawingCanvas.addEventListener('mousedown', startDraw);
drawingCanvas.addEventListener('mousemove', doDraw);
drawingCanvas.addEventListener('mouseup', endDraw);
drawingCanvas.addEventListener('mouseout', endDraw);

// Touch support for mobile
drawingCanvas.addEventListener('touchstart', startDraw, { passive: false });
drawingCanvas.addEventListener('touchmove', doDraw, { passive: false });
drawingCanvas.addEventListener('touchend', endDraw);

// Clear
document.getElementById('btn-clear-drawing').addEventListener('click', function () {
    drawCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    strokes = [];
});

// Undo
document.getElementById('btn-undo-drawing').addEventListener('click', function () {
    strokes.pop();
    drawCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    // Replay remaining strokes
    strokes.forEach(function (stroke) {
        stroke.forEach(function (seg) {
            drawCtx.beginPath();
            drawCtx.moveTo(seg.x1, seg.y1);
            drawCtx.lineTo(seg.x2, seg.y2);
            drawCtx.strokeStyle = seg.color;
            drawCtx.lineWidth = seg.size;
            drawCtx.lineCap = 'round';
            drawCtx.lineJoin = 'round';
            drawCtx.stroke();
        });
    });
});

// Export PNG
document.getElementById('btn-export-png').addEventListener('click', function () {
    var link = document.createElement('a');
    link.download = 'canvas-drawing.png';
    link.href = drawingCanvas.toDataURL();
    link.click();
});

// ============================================================
// SECTION 12: Animation with requestAnimationFrame
// ============================================================

// WHY: rAF syncs with display refresh (~60fps) and pauses when tab is hidden.

// Pattern: clear → update → draw → requestAnimationFrame
// Use deltaTime for consistent speed across different refresh rates:
// function loop(timestamp) {
//     const dt = timestamp - lastTime; lastTime = timestamp;
//     x += speed * (dt / 1000);  // pixels per second, not per frame
//     requestAnimationFrame(loop);
// }

var animCanvas = document.getElementById('animation-canvas');
var animCtx = animCanvas.getContext('2d');
var animId = null;
var ballX = 100, ballY = 100, ballDX = 4, ballDY = 3, ballR = 20;
var hue = 0;

function animateBall() {
    // 1. Clear
    animCtx.fillStyle = 'rgba(11, 17, 32, 0.2)'; // trail effect
    animCtx.fillRect(0, 0, animCanvas.width, animCanvas.height);

    // 2. Update
    ballX += ballDX;
    ballY += ballDY;
    if (ballX + ballR > animCanvas.width || ballX - ballR < 0) ballDX = -ballDX;
    if (ballY + ballR > animCanvas.height || ballY - ballR < 0) ballDY = -ballDY;
    hue = (hue + 2) % 360;

    // 3. Draw
    animCtx.beginPath();
    animCtx.arc(ballX, ballY, ballR, 0, Math.PI * 2);
    animCtx.fillStyle = 'hsl(' + hue + ', 80%, 60%)';
    animCtx.fill();
    animCtx.strokeStyle = 'hsl(' + hue + ', 80%, 80%)';
    animCtx.lineWidth = 2;
    animCtx.stroke();

    // 4. Next frame
    animId = requestAnimationFrame(animateBall);
}

document.getElementById('btn-start-animation').addEventListener('click', function () {
    if (animId) return;
    animateBall();
    this.disabled = true;
    document.getElementById('btn-stop-animation').disabled = false;
    log('Animation started (requestAnimationFrame loop)', 'anim-log');
});

document.getElementById('btn-stop-animation').addEventListener('click', function () {
    if (animId) { cancelAnimationFrame(animId); animId = null; }
    this.disabled = true;
    document.getElementById('btn-start-animation').disabled = false;
    log('Animation stopped', 'anim-log');
});

// ============================================================
// SECTION 15: Practical — Signature Pad (class from original)
// ============================================================

// The drawing pad above IS the signature pad implementation.
// SignaturePad features: draw, clear, undo, export — all implemented above.

// --- Hit testing (click on shapes) ---
// function isPointInCircle(px, py, cx, cy, r) {
//     return (px - cx) ** 2 + (py - cy) ** 2 <= r * r;
// }
// function isPointInRect(px, py, rx, ry, rw, rh) {
//     return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
// }
// Canvas also has built-in: ctx.isPointInPath(x, y)

// ============================================================
// KEY TAKEAWAYS
// ============================================================

(function () {
    var t = 'takeaways-log';
    log('=== KEY TAKEAWAYS ===', t);
    log('', t);
    log(' 1. Canvas is pixel-based. Get 2D context with canvas.getContext("2d").', t);
    log(' 2. Coordinates: (0,0) top-left, x right, y DOWN (not up like math).', t);
    log(' 3. Only rectangles have direct methods. Everything else uses paths:', t);
    log('    beginPath -> moveTo -> lineTo -> fill/stroke.', t);
    log(' 4. Circles use arc(x, y, r, start, end). Angles in RADIANS.', t);
    log(' 5. Always save() before transforms, restore() after. They accumulate.', t);
    log(' 6. Images must be loaded first: img.onload = () => ctx.drawImage().', t);
    log(' 7. Pixel manipulation: getImageData returns RGBA array. Every 4 values', t);
    log('    = one pixel. Modify and putImageData back.', t);
    log(' 8. requestAnimationFrame for animation — syncs with display, pauses', t);
    log('    when tab hidden, use deltaTime for consistent speed.', t);
    log(' 9. Mouse: getBoundingClientRect() for correct canvas coordinates.', t);
    log('    Add touch events for mobile signature capture.', t);
    log('10. toDataURL() exports as base64 image. toBlob() for large images.', t);
})();
