/* ============================================================
   和 — JAPANESE BACKGROUND ENGINE
   ------------------------------------------------------------
   Two jobs, one requestAnimationFrame loop:

   1. PARALLAX — publishes the eased scroll offset as CSS custom
      properties on the background container. Every depth layer
      reads them from CSS, so the whole scene moves from a single
      style write per frame instead of one per element.

   2. 桜 — a sakura petal simulation on a DPR-aware canvas.

   Design constraints this file is written against:
     - smooth: scroll is eased (critically damped lerp), never
       applied raw, so trackpad/inertial scrolling does not jitter;
     - resolution independent: everything is derived from the live
       viewport box, so any aspect ratio works;
     - cheap on phones: petal count scales with viewport area and is
       capped hard on coarse pointers;
     - polite: obeys prefers-reduced-motion, and the loop is fully
       suspended while the tab is hidden.
   ============================================================ */

(function () {
    'use strict';

    var root = document.querySelector('.jp-bg');
    if (!root) return;

    var canvas = document.getElementById('jpPetals');
    var ctx = canvas ? canvas.getContext('2d', { alpha: true }) : null;

    /* ---------- motion preference ---------- */
    var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    var reduced = motionQuery.matches;

    /* ---------- viewport state ---------- */
    var vw = 0, vh = 0, dpr = 1;
    var coarse = window.matchMedia('(pointer: coarse)').matches;

    /* ---------- scroll state ---------- */
    var targetY = window.pageYOffset || 0;
    var easedY = targetY;
    var lastPublished = null;
    var scrollVelocity = 0;

    /* ---------- which particle system is running ----------
       The backdrop swaps its particles with the theme: sakura by
       day, 蛍 hotaru fireflies at night. Only one array is ever
       populated, so the per-frame cost does not change. */
    var nightMode = document.documentElement.getAttribute('data-theme') === 'dark';

    /* ---------- petals ---------- */
    var petals = [];
    var flies = [];
    var PETAL_TINTS = [
        'rgba(238,180,192,',   /* 桜 sakura      */
        'rgba(245,205,213,',   /* pale blossom   */
        'rgba(232,160,178,',   /* deeper blossom */
        'rgba(250,238,236,'    /* near-white     */
    ];

    /* ------------------------------------------------------------
       SIZING
       Reads the container's own box rather than window.innerWidth so
       that mobile browser chrome collapsing (the iOS/Android URL bar)
       does not cause a visible jump.
       ------------------------------------------------------------ */
    function measure() {
        var rect = root.getBoundingClientRect();
        vw = Math.max(1, Math.round(rect.width));
        vh = Math.max(1, Math.round(rect.height));

        if (!ctx) return;

        /* Cap DPR at 2: a 3x buffer on a phone costs a lot of fill rate
           and the petals are soft-edged shapes nobody inspects. */
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(vw * dpr);
        canvas.height = Math.round(vh * dpr);
        canvas.style.width = vw + 'px';
        canvas.style.height = vh + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        buildParticles();
    }

    /* ------------------------------------------------------------
       PETAL POPULATION
       Scaled by viewport area so a 4K monitor is not sparse and a
       360px phone is not swamped.
       ------------------------------------------------------------ */
    function petalCount() {
        if (reduced) return 0;
        var area = vw * vh;
        var n = Math.round(area / 34000);
        var cap = coarse ? 14 : 34;
        return Math.max(6, Math.min(cap, n));
    }

    function makePetal(seedAbove) {
        var scale = Math.min(1.35, Math.max(0.62, vw / 1440 + 0.35));
        var size = (7 + Math.random() * 10) * scale;
        return {
            x: Math.random() * vw,
            y: seedAbove ? -size - Math.random() * vh * 0.6 : Math.random() * vh,
            w: size * 0.86,
            h: size,
            /* depth: nearer petals are bigger, faster and more opaque */
            depth: 0.45 + Math.random() * 0.55,
            fall: 0.22 + Math.random() * 0.55,
            drift: (Math.random() - 0.5) * 0.34,
            angle: Math.random() * Math.PI * 2,
            spin: (Math.random() - 0.5) * 0.012,
            /* flutter simulates the petal turning edge-on to the viewer */
            flutter: Math.random() * Math.PI * 2,
            flutterRate: 0.012 + Math.random() * 0.022,
            swayPhase: Math.random() * Math.PI * 2,
            swayRate: 0.006 + Math.random() * 0.012,
            swayAmp: 0.35 + Math.random() * 1.0,
            tint: PETAL_TINTS[(Math.random() * PETAL_TINTS.length) | 0],
            alpha: 0.34 + Math.random() * 0.42
        };
    }

    function buildPetals() {
        var want = petalCount();
        petals.length = 0;
        for (var i = 0; i < want; i++) petals.push(makePetal(false));
    }

    /* ------------------------------------------------------------
       PETAL GEOMETRY
       A sakura petal is defined by the notch at its tip — without it
       the shape reads as a generic leaf, so it is drawn explicitly.
       Path is built around the origin, pointing up.
       ------------------------------------------------------------ */
    function petalPath(w, h) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-w * 0.58, -h * 0.26, -w * 0.48, -h * 0.85, -w * 0.11, -h);
        ctx.quadraticCurveTo(0, -h * 0.84, w * 0.11, -h);
        ctx.bezierCurveTo(w * 0.48, -h * 0.85, w * 0.58, -h * 0.26, 0, 0);
        ctx.closePath();
    }

    function drawPetals() {
        ctx.clearRect(0, 0, vw, vh);

        for (var i = 0; i < petals.length; i++) {
            var p = petals[i];

            /* cos() on the flutter phase squashes the petal horizontally,
               which is what selling the 3D tumble actually depends on */
            var squash = Math.cos(p.flutter);
            var facing = Math.abs(squash);
            if (facing < 0.04) continue;   /* edge-on: invisible, skip the draw */

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.angle);
            ctx.scale(squash, 1);

            var a = p.alpha * p.depth * (0.4 + facing * 0.6);
            ctx.fillStyle = p.tint + a.toFixed(3) + ')';
            petalPath(p.w * p.depth, p.h * p.depth);
            ctx.fill();

            /* single vein, drawn only on the larger petals */
            if (p.depth > 0.8) {
                ctx.strokeStyle = 'rgba(190,110,130,' + (a * 0.4).toFixed(3) + ')';
                ctx.lineWidth = 0.6;
                ctx.beginPath();
                ctx.moveTo(0, -p.h * p.depth * 0.12);
                ctx.lineTo(0, -p.h * p.depth * 0.8);
                ctx.stroke();
            }

            ctx.restore();
        }
    }

    function stepPetals(dt) {
        /* Scrolling drags the petals: scroll down and they stream upward
           past you. Clamped so a flick-scroll does not fling them offscreen. */
        var drag = Math.max(-14, Math.min(14, scrollVelocity * 0.28));

        for (var i = 0; i < petals.length; i++) {
            var p = petals[i];

            p.swayPhase += p.swayRate * dt;
            p.flutter += p.flutterRate * dt;
            p.angle += p.spin * dt;

            p.y += (p.fall * p.depth * dt) - drag * p.depth;
            p.x += (p.drift + Math.sin(p.swayPhase) * p.swayAmp * 0.35) * p.depth * dt;

            var pad = p.h * 2 + 8;

            /* vertical wrap, both directions (scroll can push either way) */
            if (p.y - pad > vh) {
                p.y = -pad;
                p.x = Math.random() * vw;
            } else if (p.y + pad < -vh * 0.75) {
                p.y = vh + pad;
                p.x = Math.random() * vw;
            }

            /* horizontal wrap */
            if (p.x - pad > vw) p.x = -pad;
            else if (p.x + pad < 0) p.x = vw + pad;
        }
    }

    /* ------------------------------------------------------------
       蛍 — FIREFLIES  (night)
       A firefly is not a petal with a different colour. Petals are
       driven by gravity and read as falling; a firefly has to read
       as *deciding* where to go, so its heading is a slow random
       walk with a weak upward bias, and its brightness pulses on
       its own clock rather than with its motion.
       ------------------------------------------------------------ */
    var FLY_TINTS = [
        [255, 226, 128],   /* 金 warm lantern gold */
        [206, 232, 140],   /* the green a real hotaru actually is */
        [255, 244, 196]
    ];

    function flyCount() {
        if (reduced) return 0;
        var n = Math.round((vw * vh) / 46000);
        var cap = coarse ? 11 : 26;
        return Math.max(5, Math.min(cap, n));
    }

    function makeFly() {
        var tint = FLY_TINTS[(Math.random() * FLY_TINTS.length) | 0];
        return {
            x: Math.random() * vw,
            y: Math.random() * vh,
            depth: 0.4 + Math.random() * 0.6,
            r: 1.1 + Math.random() * 1.7,
            heading: Math.random() * Math.PI * 2,
            /* how fast the heading itself wanders -- this is the whole
               difference between an insect and a floating dot */
            turn: (Math.random() - 0.5) * 0.05,
            speed: 0.16 + Math.random() * 0.34,
            pulse: Math.random() * Math.PI * 2,
            pulseRate: 0.018 + Math.random() * 0.03,
            tint: tint
        };
    }

    function buildFlies() {
        var want = flyCount();
        flies.length = 0;
        for (var i = 0; i < want; i++) flies.push(makeFly());
    }

    function stepFlies(dt) {
        var drag = Math.max(-10, Math.min(10, scrollVelocity * 0.2));

        for (var i = 0; i < flies.length; i++) {
            var f = flies[i];

            f.turn += (Math.random() - 0.5) * 0.012 * dt;
            f.turn = Math.max(-0.06, Math.min(0.06, f.turn));
            f.heading += f.turn * dt;
            f.pulse += f.pulseRate * dt;

            f.x += Math.cos(f.heading) * f.speed * f.depth * dt;
            /* the -0.22 is the upward bias: fireflies climb, slowly */
            f.y += (Math.sin(f.heading) * f.speed - 0.22 * f.speed) * f.depth * dt
                   - drag * f.depth;

            var pad = 24;
            if (f.x - pad > vw) f.x = -pad;
            else if (f.x + pad < 0) f.x = vw + pad;
            if (f.y - pad > vh) { f.y = -pad; f.x = Math.random() * vw; }
            else if (f.y + pad < 0) { f.y = vh + pad; f.x = Math.random() * vw; }
        }
    }

    function drawFlies() {
        ctx.clearRect(0, 0, vw, vh);
        ctx.globalCompositeOperation = 'lighter';

        for (var i = 0; i < flies.length; i++) {
            var f = flies[i];

            /* squared, so the fly spends most of its cycle dim and
               flares briefly -- a sine straight through reads as a
               throbbing bulb instead of a blink */
            var lit = Math.pow((Math.sin(f.pulse) + 1) * 0.5, 2);
            var a = (0.12 + lit * 0.78) * f.depth;
            var r = f.r * f.depth;
            var c = f.tint;

            /* the halo: a real firefly is mostly the light around it */
            var halo = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, r * 7);
            halo.addColorStop(0,   'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (a * 0.5).toFixed(3) + ')');
            halo.addColorStop(0.4, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (a * 0.13).toFixed(3) + ')');
            halo.addColorStop(1,   'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',0)');
            ctx.fillStyle = halo;
            ctx.beginPath();
            ctx.arc(f.x, f.y, r * 7, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = 'rgba(255,252,236,' + Math.min(1, a * 1.1).toFixed(3) + ')';
            ctx.beginPath();
            ctx.arc(f.x, f.y, r, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.globalCompositeOperation = 'source-over';
    }

    /* ------------------------------------------------------------
       PARTICLE DISPATCH
       One entry point, so measure(), the theme switch and the
       motion-preference switch cannot disagree about which system
       is live. The array that is not in use is emptied rather than
       left populated, so nothing is stepped off screen unseen.
       ------------------------------------------------------------ */
    function buildParticles() {
        if (nightMode) {
            petals.length = 0;
            buildFlies();
        } else {
            flies.length = 0;
            buildPetals();
        }
    }

    /* ------------------------------------------------------------
       SCROLL PUBLICATION
       One style write per frame, on the background container, so the
       invalidation is scoped to the backdrop subtree and never
       touches the real page content.
       ------------------------------------------------------------ */
    function publishScroll() {
        var rounded = Math.round(easedY * 100) / 100;
        if (rounded === lastPublished) return;
        lastPublished = rounded;

        root.style.setProperty('--jp-sy', rounded);

        var scrollable = Math.max(
            1,
            document.documentElement.scrollHeight - window.innerHeight
        );
        var progress = Math.min(1, Math.max(0, rounded / scrollable));
        root.style.setProperty('--jp-sp', progress.toFixed(4));
    }

    /* ------------------------------------------------------------
       MAIN LOOP
       ------------------------------------------------------------ */
    var rafId = null;
    var lastTime = 0;

    function frame(now) {
        rafId = window.requestAnimationFrame(frame);

        /* dt normalised to 60fps steps, clamped so a background tab
           returning to focus does not teleport everything */
        var dt = lastTime ? Math.min(3, (now - lastTime) / 16.667) : 1;
        lastTime = now;

        var prevEased = easedY;
        /* Exponential smoothing, framerate-independent. 0.14 per 60fps
           step is fast enough to feel attached to the scrollbar and slow
           enough to absorb inertial-scroll jitter. */
        var k = 1 - Math.pow(1 - 0.14, dt);
        easedY += (targetY - easedY) * k;
        if (Math.abs(targetY - easedY) < 0.05) easedY = targetY;

        scrollVelocity = (easedY - prevEased) / Math.max(dt, 0.0001);

        publishScroll();

        if (ctx) {
            if (nightMode && flies.length) {
                stepFlies(dt);
                drawFlies();
            } else if (!nightMode && petals.length) {
                stepPetals(dt);
                drawPetals();
            }
        }
    }

    function start() {
        if (rafId !== null) return;
        lastTime = 0;
        rafId = window.requestAnimationFrame(frame);
    }

    function stop() {
        if (rafId === null) return;
        window.cancelAnimationFrame(rafId);
        rafId = null;
    }

    /* ------------------------------------------------------------
       EVENTS
       ------------------------------------------------------------ */
    function onScroll() {
        targetY = window.pageYOffset || document.documentElement.scrollTop || 0;
    }

    var resizeTimer = null;
    function onResize() {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(measure, 120);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('orientationchange', onResize, { passive: true });

    /* visualViewport fires on pinch-zoom and mobile keyboard/URL-bar
       changes that `resize` alone misses on iOS Safari */
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', onResize, { passive: true });
    }

    document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
            stop();
        } else if (!reduced) {
            onScroll();
            easedY = targetY;
            start();
        }
    });

    /* React live if the user flips the OS motion setting */
    function onMotionChange() {
        reduced = motionQuery.matches;
        if (reduced) {
            stop();
            petals.length = 0;
            flies.length = 0;
            if (ctx) ctx.clearRect(0, 0, vw, vh);
            root.style.setProperty('--jp-sy', 0);
            root.style.setProperty('--jp-sp', 0);
        } else {
            measure();
            onScroll();
            easedY = targetY;
            start();
        }
    }
    if (typeof motionQuery.addEventListener === 'function') {
        motionQuery.addEventListener('change', onMotionChange);
    } else if (typeof motionQuery.addListener === 'function') {
        motionQuery.addListener(onMotionChange);   /* Safari < 14 */
    }

    /* ------------------------------------------------------------
       THEME
       interactive.js fires this after it has flipped data-theme.
       The canvas is cleared explicitly: the outgoing system's last
       frame is still painted, and if the loop happens to be stopped
       (hidden tab, reduced motion) nothing would ever overwrite it.
       ------------------------------------------------------------ */
    window.addEventListener('themechange', function (e) {
        var next = !!(e.detail && e.detail.theme === 'dark');
        if (next === nightMode) return;
        nightMode = next;

        if (ctx) ctx.clearRect(0, 0, vw, vh);
        buildParticles();
    });

    /* ------------------------------------------------------------
       BOOT
       ------------------------------------------------------------ */
    measure();
    onScroll();
    easedY = targetY;
    publishScroll();

    if (!reduced) start();
})();
