    // ── Refs ──────────────────────────────────────────────────────
    const turtle         = document.getElementById('turtle');
    const scoreEl        = document.getElementById('score');
    const collectedEl    = document.getElementById('collected');
    const mannaEl        = document.getElementById('manna');
    const mannaWrap      = document.getElementById('manna-wrap');
    const headerEl       = document.querySelector('header');
    const footerEl       = document.querySelector('footer');
    const instructions   = document.getElementById('instructions');
    const helpBtn        = document.getElementById('help-btn');
    const joystickWrap   = document.getElementById('joystick-wrap');
    const joystickBase   = document.getElementById('joystick-base');
    const joystickStick  = document.getElementById('joystick-stick');
    const joySideToggle  = document.getElementById('joy-side-toggle');
    const dpadEl         = document.getElementById('dpad');
    const dpadSideToggle = document.getElementById('dpad-side-toggle');
    const ctrlBtns       = document.querySelectorAll('.ctrl-btn');


    // ── Help toggle ───────────────────────────────────────────────
    helpBtn.addEventListener('click', () => {
        const hidden = instructions.hidden;
        instructions.hidden = !hidden;
        helpBtn.setAttribute('aria-expanded', String(!hidden));
        helpBtn.textContent = hidden ? '✕ Help' : '? Help';
    });
    document.addEventListener('click', e => {
        if (!instructions.hidden && !instructions.contains(e.target) && e.target !== helpBtn) {
            instructions.hidden = true;
            helpBtn.setAttribute('aria-expanded', 'false');
            helpBtn.textContent = '? Help';
        }
    });

    // ── Control mode ──────────────────────────────────────────────
    let controlMode = 'keyboard';

    function setMode(mode) {
        controlMode = mode;
        ctrlBtns.forEach(b => b.classList.toggle('active', b.dataset.mode === mode));

        // Hide everything
        joystickWrap.style.display   = 'none';
        joySideToggle.style.display  = 'none';
        dpadEl.style.display         = 'none';
        dpadSideToggle.style.display = 'none';

        // Reset joy
        joy.active = false; joy.dx = 0; joy.dy = 0;
        joystickStick.style.transform = 'translate(-50%, -50%)';

        if (mode === 'fixed-joy') {
            positionFixedJoy();
            joystickWrap.style.display  = 'block';
            joySideToggle.style.display = 'block';
            updateJoySideTogglePos();
        }
        // float-joy: shown dynamically on touch
        if (mode === 'dpad4') {
            dpadEl.style.display         = 'block';
            dpadSideToggle.style.display = 'block';
            updateDpadSideTogglePos();
        }
    }

    ctrlBtns.forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));

    // ── Fixed joystick side ───────────────────────────────────────
    let joySide = 'right', joyUserPicked = false;

    function positionFixedJoy() {
        joystickWrap.style.bottom = '48px';
        joystickWrap.style.top   = 'auto';
        joystickWrap.style.left  = joySide === 'left'  ? '16px' : 'auto';
        joystickWrap.style.right = joySide === 'right' ? '16px' : 'auto';
    }
    function updateJoySideTogglePos() {
        joySideToggle.style.left  = joySide === 'right' ? '16px' : 'auto';
        joySideToggle.style.right = joySide === 'left'  ? '16px' : 'auto';
    }

    joySideToggle.addEventListener('click', () => {
        joyUserPicked = true;
        joySide = joySide === 'left' ? 'right' : 'left';
        positionFixedJoy();
        updateJoySideTogglePos();
    });

    // ── D-pad side ────────────────────────────────────────────────
    let dpadSide = 'right', dpadUserPicked = false;

    function applyDpadSide(side) {
        dpadSide = side;
        dpadEl.classList.remove('left','right');
        dpadEl.classList.add(side);
    }
    function updateDpadSideTogglePos() {
        dpadSideToggle.style.left  = dpadSide === 'right' ? '16px' : 'auto';
        dpadSideToggle.style.right = dpadSide === 'left'  ? '16px' : 'auto';
    }

    dpadSideToggle.addEventListener('click', () => {
        dpadUserPicked = true;
        applyDpadSide(dpadSide === 'left' ? 'right' : 'left');
        updateDpadSideTogglePos();
    });

    // ── Joystick logic ────────────────────────────────────────────
    const joy = { dx:0, dy:0, active:false, pointerId:null, originX:0, originY:0 };
    const STICK_MAX = 35, BASE_HALF = 60;

    function setStickPos(rawDx, rawDy) {
        const dist = Math.hypot(rawDx, rawDy);
        if (dist < 6) {
            joystickStick.style.transform = 'translate(-50%, -50%)';
            joy.dx = 0; joy.dy = 0; return;
        }
        const c = Math.min(dist, STICK_MAX);
        const nx = rawDx / dist, ny = rawDy / dist;
        joystickStick.style.transform =
            `translate(calc(-50% + ${nx*c}px), calc(-50% + ${ny*c}px))`;
        joy.dx = nx * (c / STICK_MAX);
        joy.dy = ny * (c / STICK_MAX);
    }

    function resetJoy() {
        joy.dx = 0; joy.dy = 0; joy.active = false; joy.pointerId = null;
        joystickStick.style.transform = 'translate(-50%, -50%)';
        if (controlMode === 'float-joy') joystickWrap.style.display = 'none';
    }

    // Fixed joy — events on base
    joystickBase.addEventListener('pointerdown', e => {
        if (controlMode !== 'fixed-joy' || joy.active) return;
        e.preventDefault();
        joy.active = true; joy.pointerId = e.pointerId;
        joystickBase.setPointerCapture(e.pointerId);
        if (!turtleActive) activate();
        const r = joystickBase.getBoundingClientRect();
        setStickPos(e.clientX - (r.left + r.width/2), e.clientY - (r.top + r.height/2));
    });
    joystickBase.addEventListener('pointermove', e => {
        if (controlMode !== 'fixed-joy' || !joy.active || e.pointerId !== joy.pointerId) return;
        e.preventDefault();
        const r = joystickBase.getBoundingClientRect();
        setStickPos(e.clientX - (r.left + r.width/2), e.clientY - (r.top + r.height/2));
    });
    joystickBase.addEventListener('pointerup',     e => { if (e.pointerId === joy.pointerId) resetJoy(); });
    joystickBase.addEventListener('pointercancel', e => { if (e.pointerId === joy.pointerId) resetJoy(); });

    // Float joy — events on document
    // Use both pointer and touch events for maximum mobile compatibility
    function floatJoyStart(clientX, clientY, id) {
        if (controlMode !== 'float-joy') return;
        if (joy.active) return;
        joy.active = true; joy.pointerId = id;
        const bx = clamp(clientX, BASE_HALF, window.innerWidth  - BASE_HALF);
        const by = clamp(clientY, BASE_HALF, window.innerHeight - BASE_HALF);
        joy.originX = bx; joy.originY = by;
        joystickWrap.style.left    = (bx - BASE_HALF) + 'px';
        joystickWrap.style.top     = (by - BASE_HALF) + 'px';
        joystickWrap.style.bottom  = 'auto';
        joystickWrap.style.right   = 'auto';
        joystickWrap.style.display = 'block';
        if (!turtleActive) activate();
        setStickPos(0, 0);
    }

    document.addEventListener('touchstart', e => {
        if (controlMode !== 'float-joy') return;
        if (e.target.closest('header, footer, #turtle, #instructions')) return;
        e.preventDefault();
        const t = e.changedTouches[0];
        floatJoyStart(t.clientX, t.clientY, t.identifier);
    }, { passive: false });

    document.addEventListener('touchmove', e => {
        if (controlMode !== 'float-joy' || !joy.active) return;
        e.preventDefault();
        const t = Array.from(e.changedTouches).find(t => t.identifier === joy.pointerId);
        if (t) setStickPos(t.clientX - joy.originX, t.clientY - joy.originY);
    }, { passive: false });

    document.addEventListener('touchend', e => {
        if (controlMode !== 'float-joy') return;
        const t = Array.from(e.changedTouches).find(t => t.identifier === joy.pointerId);
        if (t) resetJoy();
    });
    document.addEventListener('touchcancel', e => {
        if (controlMode !== 'float-joy') return;
        resetJoy();
    });

    // Pointer events fallback for non-touch (mouse/stylus)
    document.addEventListener('pointerdown', e => {
        if (controlMode !== 'float-joy') return;
        if (e.pointerType === 'touch') return; // handled by touch events above
        if (e.target.closest('header, footer, #turtle, #instructions')) return;
        floatJoyStart(e.clientX, e.clientY, e.pointerId);
    });

    document.addEventListener('pointermove', e => {
        if (controlMode !== 'float-joy' || e.pointerType === 'touch') return;
        if (!joy.active || e.pointerId !== joy.pointerId) return;
        setStickPos(e.clientX - joy.originX, e.clientY - joy.originY);
    });

    document.addEventListener('pointerup',     e => { if (controlMode === 'float-joy' && e.pointerType !== 'touch' && e.pointerId === joy.pointerId) resetJoy(); });
    document.addEventListener('pointercancel', e => { if (controlMode === 'float-joy' && e.pointerType !== 'touch' && e.pointerId === joy.pointerId) resetJoy(); });

    // ── D-pad buttons ─────────────────────────────────────────────
    const dpadVecs = {
        'btn-up':    { vx:  0, vy: -1 },
        'btn-down':  { vx:  0, vy:  1 },
        'btn-left':  { vx: -1, vy:  0 },
        'btn-right': { vx:  1, vy:  0 },
    };
    const dpadPressed = {};

    Object.keys(dpadVecs).forEach(id => {
        const btn = document.getElementById(id);
        if (!btn) return;
        const press = e => {
            e.preventDefault();
            dpadPressed[id] = true;
            btn.classList.add('pressed');
            if (!turtleActive) activate();
        };
        const release = e => {
            e.preventDefault();
            dpadPressed[id] = false;
            btn.classList.remove('pressed');
        };
        btn.addEventListener('touchstart',  press,   { passive: false });
        btn.addEventListener('touchend',    release, { passive: false });
        btn.addEventListener('touchcancel', release, { passive: false });
        btn.addEventListener('mousedown',   press);
        btn.addEventListener('mouseup',     release);
        btn.addEventListener('mouseleave',  release);
    });

    function getDpadVec() {
        let vx = 0, vy = 0;
        for (const [id, v] of Object.entries(dpadVecs)) {
            if (dpadPressed[id]) { vx += v.vx; vy += v.vy; }
        }
        return { vx, vy };
    }

    // ── Game state ────────────────────────────────────────────────
    const COLLECTIBLES = [
        { symbol: '🌿', type: 'food',     manna: 1 },
        { symbol: '🍓', type: 'food',     manna: 2 },
        { symbol: '@',  type: 'food',     manna: 1 },
        { symbol: '💎', type: 'treasure', points: 3 },
        { symbol: '$',  type: 'treasure', points: 2 },
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
    let x = b.w / 2, y = (b.hBottom + b.fTop) / 2, angle = 0;
    const speed = 4, keys = {};
    let turtleActive = false;

    function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
    function updateScore(d) { score += d; scoreEl.textContent = `Score: ${score}`; }
    function updateManna(d) {
        manna = clamp(manna + d, 0, MANNA_MAX);
        mannaEl.style.width = `${(manna / MANNA_MAX) * 100}%`;
        mannaWrap.setAttribute('aria-valuenow', manna);
    }
    function collectItem(item) {
        if (item.type === 'food')     updateManna(item.manna);
        if (item.type === 'treasure') updateScore(item.points);
        collected[item.symbol] = (collected[item.symbol] ?? 0) + 1;
        collectedEl.textContent = 'Collected: ' +
            Object.entries(collected).map(([s,n]) => `${s}x${n}`).join('  ');
    }

    // ── Collectibles ──────────────────────────────────────────────
    const NUM_COLLECTIBLES = 3, slots = [];

    function randomPos() {
        const b = getBounds(), m = 40;
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
            el.style.left = cx + 'px'; el.style.top = cy + 'px';
            slots.push({ el, item, cx, cy });
        }
    }
    function replaceSlot(slot) {
        slot.item = COLLECTIBLES[Math.floor(Math.random() * COLLECTIBLES.length)];
        const { cx, cy } = randomPos();
        slot.cx = cx; slot.cy = cy;
        slot.el.textContent = slot.item.symbol;
        slot.el.style.left = cx + 'px'; slot.el.style.top = cy + 'px';
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
        turtle.setAttribute('aria-label', 'Turtle active. Escape to stop.');
    }
    function deactivate() {
        turtleActive = false;
        turtle.classList.remove('active');
        turtle.setAttribute('role', 'img');
        turtle.setAttribute('aria-label', 'Turtle. Tap to activate.');
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

    // ── Main loop ─────────────────────────────────────────────────
    function update() {
        if (turtleActive) {
            let vx = 0, vy = 0;

            if (controlMode === 'keyboard') {
                if (keys['ArrowRight'] || keys['d'] || keys['D']) vx += 1;
                if (keys['ArrowLeft']  || keys['a'] || keys['A']) vx -= 1;
                if (keys['ArrowDown']  || keys['s'] || keys['S']) vy += 1;
                if (keys['ArrowUp']    || keys['w'] || keys['W']) vy -= 1;
            }
            if (controlMode === 'fixed-joy' || controlMode === 'float-joy') {
                vx = joy.dx; vy = joy.dy;
            }
            if (controlMode === 'dpad4') {
                const d = getDpadVec();
                vx = d.vx; vy = d.vy;
            }

            const len = Math.hypot(vx, vy);
            if (len > 1) { vx /= len; vy /= len; }
            if (len > 0.05) {
                x += vx * speed;
                y += vy * speed;
                angle = Math.atan2(vy, vx) * (180 / Math.PI);
            }

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
        const landscape = b.w > b.h;
        if (!joyUserPicked  && controlMode === 'fixed-joy') { joySide  = landscape ? 'right' : 'left'; positionFixedJoy(); updateJoySideTogglePos(); }
        if (!dpadUserPicked && controlMode === 'dpad4') { applyDpadSide(landscape ? 'right' : 'left'); updateDpadSideTogglePos(); }
    }

    window.addEventListener('resize', onResize);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', onResize);
    screen.orientation?.addEventListener('change', onResize);

    // ── Init ──────────────────────────────────────────────────────
    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;

    // On touch devices: hide the Keys option and default to dpad4
    if (isTouchDevice) {
        document.querySelector('[data-mode="keyboard"]').classList.add('touch-hidden');
        window.addEventListener('touchstart', () => {
            if (controlMode === 'keyboard') setMode('dpad4');
        }, { once: true });
    }

    applyDpadSide('right');
    updateDpadSideTogglePos();
    initCollectibles();
    update();
