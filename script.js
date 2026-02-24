// ── Refs ─────────────────────────────────────────────────────
const turtle      = document.getElementById('turtle');
const scoreEl     = document.getElementById('score');
const collectedEl = document.getElementById('collected');
const mannaEl     = document.getElementById('manna');
const mannaWrap   = document.getElementById('manna-wrap');
const headerEl    = document.querySelector('header');
const footerEl    = document.querySelector('footer');
const instructions= document.getElementById('instructions');
const helpBtn     = document.getElementById('help-btn');
const dpad        = document.getElementById('dpad');
const dpadToggle  = document.getElementById('dpad-toggle');

// ── Help toggle ───────────────────────────────────────────────
helpBtn.addEventListener('click', () => {
    const hidden = instructions.hidden;
    instructions.hidden = !hidden;
    helpBtn.setAttribute('aria-expanded', hidden ? 'true' : 'false');
    helpBtn.textContent = hidden ? '✕ Help' : '? Help';
});
document.addEventListener('click', e => {
    if (!instructions.hidden && !instructions.contains(e.target) && e.target !== helpBtn) {
        instructions.hidden = true;
        helpBtn.setAttribute('aria-expanded', 'false');
        helpBtn.textContent = '? Help';
    }
});

// ── D-pad side ────────────────────────────────────────────────
let dpadSide = 'right'; // default, updated on show
let userPickedSide = false;

function applyDpadSide(side) {
    dpadSide = side;
    dpad.classList.remove('left', 'right');
    dpad.classList.add(side);
    dpadToggle.setAttribute('aria-label',
        `Switch D-pad to ${side === 'left' ? 'right' : 'left'} side`);
}

function showControls() {
    const landscape = window.innerWidth > window.innerHeight;
    dpad.style.display = 'block';
    dpadToggle.style.display = 'block';
    if (!userPickedSide) {
        applyDpadSide(landscape ? 'right' : 'left');
    }
}

dpadToggle.addEventListener('click', () => {
    userPickedSide = true;
    applyDpadSide(dpadSide === 'left' ? 'right' : 'left');
});

// ── Game state ────────────────────────────────────────────────
const COLLECTIBLES = [
    { symbol: '🌿', type: 'food',     manna: 1 },
    { symbol: '🍓', type: 'food',     manna: 2 },
    { symbol: '@', type: 'food',     manna: 1 },
    { symbol: '💎', type: 'treasure', points: 3 },
    { symbol: '$', type: 'treasure', points: 2 },
];
const MANNA_MAX = 10;
let score = 0, manna = 0, collected = {};

function getBounds() {
    return {
        hBottom: headerEl.getBoundingClientRect().bottom,
        fTop:    footerEl.getBoundingClientRect().top,
        w: window.innerWidth,
        h: window.innerHeight,
    };
}

let b = getBounds();
let x = b.w / 2;
let y = (b.hBottom + b.fTop) / 2;
let angle = 0;
const speed = 4;
const keys = {};
let turtleActive = false;

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function updateScore(delta) {
    score += delta;
    scoreEl.textContent = `Score: ${score}`;
}

function updateManna(delta) {
    manna = clamp(manna + delta, 0, MANNA_MAX);
    mannaEl.style.width = `${(manna / MANNA_MAX) * 100}%`;
    mannaWrap.setAttribute('aria-valuenow', manna);
}

function collectItem(item) {
    if (item.type === 'food')     updateManna(item.manna);
    if (item.type === 'treasure') updateScore(item.points);
    collected[item.symbol] = (collected[item.symbol] ?? 0) + 1;
    collectedEl.textContent = 'Collected: ' +
        Object.entries(collected).map(([s, n]) => `${s}x${n}`).join('  ');
}

// ── Collectibles ──────────────────────────────────────────────
const NUM_COLLECTIBLES = 3;
const slots = [];

function randomPos() {
    const b = getBounds();
    const m = 40;
    return {
        cx: clamp(Math.random() * b.w, m, b.w - m),
        cy: clamp(Math.random() * b.h, b.hBottom + m, b.fTop - m),
    };
}

function initCollectibles() {
    for (let i = 0; i < NUM_COLLECTIBLES; i++) {
        const el = document.createElement('div');
        el.style.cssText = 'position:fixed;font-size:1.8rem;pointer-events:none;z-index:100;transform:translate(-50%,-50%);';
        document.body.appendChild(el);
        const item = COLLECTIBLES[Math.floor(Math.random() * COLLECTIBLES.length)];
        const { cx, cy } = randomPos();
        el.textContent = item.symbol;
        el.style.left = cx + 'px';
        el.style.top  = cy + 'px';
        slots.push({ el, item, cx, cy });
    }
}

function replaceSlot(slot) {
    slot.item = COLLECTIBLES[Math.floor(Math.random() * COLLECTIBLES.length)];
    const { cx, cy } = randomPos();
    slot.cx = cx; slot.cy = cy;
    slot.el.textContent = slot.item.symbol;
    slot.el.style.left = cx + 'px';
    slot.el.style.top  = cy + 'px';
}

function showPopup(text, px, py) {
    const pop = document.createElement('div');
    pop.textContent = text;
    pop.style.cssText = `position:fixed;left:${px}px;top:${py}px;font-size:1.8rem;
        pointer-events:none;z-index:999;animation:floatUp 0.8s ease forwards;`;
    document.body.appendChild(pop);
    setTimeout(() => pop.remove(), 800);
}

function checkCollect() {
    for (const slot of slots) {
        if (Math.hypot(x - slot.cx, y - slot.cy) < 40) {
            collectItem(slot.item);
            showPopup(slot.item.symbol, slot.cx, slot.cy);
            replaceSlot(slot);
            break;
        }
    }
}

// ── Activate / deactivate ─────────────────────────────────────
function activate() {
    turtleActive = true;
    turtle.classList.add('active');
    turtle.setAttribute('role', 'application');
    turtle.setAttribute('aria-label', 'Turtle active. Use arrow keys or D-pad to move. Escape to release.');
}

function deactivate() {
    turtleActive = false;
    turtle.classList.remove('active');
    turtle.setAttribute('role', 'img');
    turtle.setAttribute('aria-label', 'Turtle. Tap or click to activate, then use arrow keys or D-pad to move.');
}

turtle.addEventListener('click', activate);
turtle.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { activate(); e.preventDefault(); }
});
turtle.addEventListener('blur', deactivate);

// ── Keyboard ──────────────────────────────────────────────────
document.addEventListener('keydown', e => {
    if (!turtleActive) return;
    if (e.key === 'Escape') { deactivate(); return; }
    keys[e.key] = true;
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',
            'w','a','s','d','W','A','S','D'].includes(e.key)) {
        turtle.style.outline = 'none';
        e.preventDefault();
    }
});
document.addEventListener('keyup', e => { keys[e.key] = false; });

// ── D-pad buttons ─────────────────────────────────────────────
const dpadMap = {
    'btn-up':    'ArrowUp',
    'btn-down':  'ArrowDown',
    'btn-left':  'ArrowLeft',
    'btn-right': 'ArrowRight',
};

Object.entries(dpadMap).forEach(([id, key]) => {
    const btn = document.getElementById(id);
    const press = e => {
        e.preventDefault();
        keys[key] = true;
        btn.classList.add('pressed');
        if (!turtleActive) activate();
    };
    const release = e => {
        e.preventDefault();
        keys[key] = false;
        btn.classList.remove('pressed');
    };
    btn.addEventListener('touchstart',  press,   { passive: false });
    btn.addEventListener('touchend',    release, { passive: false });
    btn.addEventListener('touchcancel', release, { passive: false });
    btn.addEventListener('mousedown',   press);
    btn.addEventListener('mouseup',     release);
    btn.addEventListener('mouseleave',  release);
});

// ── Show controls on first touch (mobile only) ───────────────
const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
if (isTouchDevice) {
    window.addEventListener('touchstart', () => {
        showControls();
        activate();
    }, { once: true });
}

// ── Main loop ─────────────────────────────────────────────────
function update() {
    if (turtleActive) {
        if (keys['ArrowRight'] || keys['d'] || keys['D']) { x += speed; angle = 0;   }
        if (keys['ArrowLeft']  || keys['a'] || keys['A']) { x -= speed; angle = 180; }
        if (keys['ArrowUp']    || keys['w'] || keys['W']) { y -= speed; angle = -90; }
        if (keys['ArrowDown']  || keys['s'] || keys['S']) { y += speed; angle = 90;  }

        const b = getBounds();
        x = clamp(x, 30, b.w - 30);
        y = clamp(y, b.hBottom + 20, b.fTop - 20);
        checkCollect();
    }
    turtle.style.transform = `translate(calc(${x}px - 50%), calc(${y}px - 50%)) rotate(${angle}deg)`;
    requestAnimationFrame(update);
}

// ── Resize ────────────────────────────────────────────────────
function onResize() {
    const b = getBounds();
    x = clamp(x, 30, b.w - 30);
    y = clamp(y, b.hBottom + 20, b.fTop - 20);
    for (const slot of slots) {
        const m = 40;
        slot.cx = clamp(slot.cx, m, b.w - m);
        slot.cy = clamp(slot.cy, b.hBottom + m, b.fTop - m);
        slot.el.style.left = slot.cx + 'px';
        slot.el.style.top  = slot.cy + 'px';
    }
    // Auto-switch dpad side on orientation change
    if (!userPickedSide) {
        applyDpadSide(b.w > b.h ? 'right' : 'left');
    }
    // Show dpad in landscape on touch devices
    if (isTouchDevice && b.w > b.h) showControls();
}

window.addEventListener('resize', onResize);
if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', onResize);
}
screen.orientation?.addEventListener('change', onResize);

// ── Init ──────────────────────────────────────────────────────
initCollectibles();
// Show dpad immediately if already in landscape on touch device
if (isTouchDevice && window.innerWidth > window.innerHeight) showControls();
update();
