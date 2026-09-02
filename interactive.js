/* ============================================================
   INTERACTIVE — 仕掛け
   ------------------------------------------------------------
   The parts of the page a visitor operates. One IIFE, no
   libraries, no build step, same as the rest of the site.

   Contents
     1. theme        日／月 day-night, persisted
     2. rail         scroll progress
     3. filter       project selection
     3b. onscreen    pauses off-screen project card animation
     4. tilt         pointer-tracked card rotation
     5. ripple       click rings
     6. toTop        return-to-top
     8. counters     the About figures counting up
     9. portrait     tilt + highlight on the hero portrait, pointer-tracked
    10. reveal       content rising into place as it is scrolled to

   Everything here is defensive about its own markup: if an
   element is missing the block simply does not install, so the
   file cannot break a page that has moved on without it.
   ============================================================ */

(function () {
    'use strict';

    var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    var reduced = motionQuery.matches;
    var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    var docEl = document.documentElement;

    /* small helpers */
    function $(sel, ctx) { return (ctx || document).querySelector(sel); }
    function $$(sel, ctx) {
        return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
    }
    function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }


    /* ========================================================
       1. 日／月 — THEME
       The applied theme is already on <html> by the time this
       runs: a tiny inline script in <head> sets it before first
       paint so the day palette never flashes. This block owns
       everything after that -- the control, persistence, and
       telling the rest of the page a switch happened.
       ======================================================== */
    var THEME_KEY = 'dj-theme';
    var themeBtn = $('#themeToggle');

    /* Only the setter lives here. Reading the saved theme is the inline
       resolver's job in <head> -- it has to happen before first paint,
       which is well before this file runs. */
    function storeTheme(value) {
        try { window.localStorage.setItem(THEME_KEY, value); } catch (e) {}
    }

    function currentTheme() {
        return docEl.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    }

    function syncThemeButton() {
        if (!themeBtn) return;
        var dark = currentTheme() === 'dark';
        var label = dark ? 'Switch to light mode' : 'Switch to dark mode';
        themeBtn.setAttribute('aria-pressed', dark ? 'true' : 'false');
        themeBtn.setAttribute('aria-label', label);
        /* the markup ships a tooltip too; leaving it stale would have it
           contradict the label the moment the theme flips */
        themeBtn.setAttribute('title', label);
    }

    function applyTheme(next, animate) {
        if (animate && !reduced) {
            docEl.classList.add('theme-animating');
            window.clearTimeout(applyTheme._t);
            /* The crossfade class must come off again: left on, every
               hover on the page would inherit a 650ms colour transition. */
            applyTheme._t = window.setTimeout(function () {
                docEl.classList.remove('theme-animating');
            }, 780);
        }

        if (next === 'dark') docEl.setAttribute('data-theme', 'dark');
        else docEl.setAttribute('data-theme', 'light');

        var meta = $('meta[name="theme-color"]');
        if (meta) meta.setAttribute('content', next === 'dark' ? '#0b0d12' : '#f6f1e6');

        syncThemeButton();

        /* japanese-bg.js listens for this and swaps sakura for fireflies */
        window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: next } }));
    }

    function toggleTheme() {
        var next = currentTheme() === 'dark' ? 'light' : 'dark';
        storeTheme(next);
        applyTheme(next, true);

        if (themeBtn && !reduced) {
            themeBtn.classList.remove('is-flipping');
            /* forced reflow, so the animation restarts on a rapid re-click
               instead of being ignored as already-running */
            void themeBtn.offsetWidth;
            themeBtn.classList.add('is-flipping');
        }
    }

    if (themeBtn) {
        syncThemeButton();
        themeBtn.addEventListener('click', toggleTheme);
    }

    /* No prefers-color-scheme listener here, deliberately.
       The inline resolver in <head> does not consult the OS -- this is a
       light-mode site and dark is opt-in. A listener that flipped an
       unchosen visitor to dark mid-session would contradict the very
       thing that resolver decided one paint earlier. */

    /* Keyboard shortcut, guarded so it never fires while the
       visitor is typing in the contact form. */
    document.addEventListener('keydown', function (e) {
        if (e.key !== 't' && e.key !== 'T') return;
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        var el = document.activeElement;
        if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
        toggleTheme();
    });


    /* ========================================================
       2. 巻物 — READING RAIL
       ======================================================== */
    var rail = $('#readingRail');
    if (rail) {
        var railFill = rail.firstElementChild;
        var railTicking = false;

        function drawRail() {
            railTicking = false;
            var scrollable = docEl.scrollHeight - window.innerHeight;
            var progress = scrollable > 0
                ? clamp((window.pageYOffset || docEl.scrollTop) / scrollable, 0, 1)
                : 0;
            if (railFill) railFill.style.setProperty('--read', progress.toFixed(4));
        }

        window.addEventListener('scroll', function () {
            if (railTicking) return;
            railTicking = true;
            window.requestAnimationFrame(drawRail);
        }, { passive: true });
        window.addEventListener('resize', drawRail, { passive: true });
        drawRail();
    }


    /* ========================================================
       3. 撰 — PROJECT FILTER
       Cards fade out before they leave the flow, so the grid
       never reflows underneath something still on screen.
       ======================================================== */
    var chips = $$('.filter-chip');
    var cards = $$('.project-box');
    var countEl = $('#filterCount');
    var LEAVE_MS = 340;

    /* Matches the wording the markup ships with, so the line does not
       change shape the first time a chip is clicked. */
    function countLabel(n, filter) {
        if (n === 0) return 'No projects in this category';
        if (filter === 'all') return 'Showing all ' + n + ' projects';
        return 'Showing ' + n + (n === 1 ? ' project' : ' projects');
    }

    function matches(card, filter) {
        if (filter === 'all') return true;
        return (' ' + (card.getAttribute('data-tags') || '') + ' ')
            .indexOf(' ' + filter + ' ') > -1;
    }

    function applyFilter(filter) {
        var shown = 0;

        cards.forEach(function (card) {
            var keep = matches(card, filter);
            var wasOut = card.classList.contains('is-out');

            if (keep) shown++;

            if (keep && wasOut) {
                card.classList.remove('is-out', 'is-leaving');
                card.classList.remove('is-entering');
                void card.offsetWidth;                 /* restart the entry */
                card.classList.add('is-entering');
            } else if (keep) {
                card.classList.remove('is-leaving');
            } else if (!wasOut) {
                card.classList.remove('is-entering');
                card.classList.add('is-leaving');
                /* Each card owns its own timer, keyed on the element, so a
                   fast second click cannot leave a stale timeout hiding a
                   card the new filter wants shown. */
                window.clearTimeout(card._leaveTimer);
                card._leaveTimer = window.setTimeout(function () {
                    if (card.classList.contains('is-leaving')) card.classList.add('is-out');
                }, reduced ? 0 : LEAVE_MS);
            }
        });

        if (countEl) countEl.textContent = countLabel(shown, filter);
    }

    if (chips.length && cards.length) {
        chips.forEach(function (chip) {
            chip.addEventListener('click', function () {
                chips.forEach(function (c) {
                    var on = c === chip;
                    c.classList.toggle('is-active', on);
                    /* aria-pressed, not aria-selected: these are toggle
                       buttons, and aria-selected is only meaningful inside
                       a listbox/tablist/grid, which this is not. */
                    c.setAttribute('aria-pressed', on ? 'true' : 'false');
                });
                applyFilter(chip.getAttribute('data-filter') || 'all');
            });
        });

        if (countEl) countEl.textContent = countLabel(cards.length, 'all');
    }


    /* ========================================================
       3b. OFF-SCREEN ANIMATION PAUSE
       Nine cards' worth of continuous SVG animation is real paint
       work, and most of it is off-screen at any given moment. Only
       cards near the viewport keep animating (project-art.css pauses
       everything inside a card without .is-onscreen); a generous
       rootMargin starts a card animating a little before it is
       actually visible, so nothing pops mid-motion on arrival.
       ======================================================== */
    if (cards.length && 'IntersectionObserver' in window) {
        var cardIO = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                entry.target.classList.toggle('is-onscreen', entry.isIntersecting);
            });
        }, { rootMargin: '200px 0px' });
        cards.forEach(function (card) { cardIO.observe(card); });
    } else {
        cards.forEach(function (card) { card.classList.add('is-onscreen'); });
    }


    /* ========================================================
       4. TILT
       Fine pointers only. The rotation is deliberately small --
       past about 7 degrees the card stops reading as a print
       catching light and starts reading as a 3D object.
       ======================================================== */
    if (finePointer && !reduced) {
        cards.forEach(function (card) {
            var art = $('.project-art', card);
            var frame = null;
            var px = 0, py = 0;

            function paint() {
                frame = null;
                var rect = card.getBoundingClientRect();
                if (!rect.width || !rect.height) return;

                var nx = (px - rect.left) / rect.width;    /* 0 -> 1 */
                var ny = (py - rect.top) / rect.height;

                card.style.setProperty('--ty', ((nx - 0.5) *  7).toFixed(2) + 'deg');
                card.style.setProperty('--tx', ((0.5 - ny) *  5).toFixed(2) + 'deg');
                if (art) {
                    art.style.setProperty('--mx', (nx * 100).toFixed(1) + '%');
                    art.style.setProperty('--my', (ny * 100).toFixed(1) + '%');
                }
            }

            card.addEventListener('pointermove', function (e) {
                if (e.pointerType !== 'mouse') return;
                px = e.clientX;
                py = e.clientY;
                card.classList.add('is-tilting');
                if (frame === null) frame = window.requestAnimationFrame(paint);
            });

            card.addEventListener('pointerleave', function () {
                if (frame !== null) {
                    window.cancelAnimationFrame(frame);
                    frame = null;
                }
                card.classList.remove('is-tilting');
                card.style.removeProperty('--tx');
                card.style.removeProperty('--ty');
            });
        });
    }


    /* ========================================================
       5. 水紋 — CLICK RIPPLE
       Two rings per click, offset, so the ink reads as spreading
       rather than as a single expanding circle.
       ======================================================== */
    var rippleLayer = $('#rippleLayer');
    if (rippleLayer && !reduced) {
        document.addEventListener('pointerdown', function (e) {
            if (e.pointerType === 'mouse' && e.button !== 0) return;

            /* Not over form fields: a ring blooming out of a text
               caret looks like an error state, not an effect. */
            var t = e.target;
            if (t && t.closest && t.closest('input, textarea, select')) return;

            for (var i = 0; i < 2; i++) {
                var ring = document.createElement('span');
                ring.className = i ? 'ripple ripple--b' : 'ripple';
                ring.style.left = e.clientX + 'px';
                ring.style.top = e.clientY + 'px';
                rippleLayer.appendChild(ring);

                /* animationend rather than a timer: if the tab is
                   backgrounded mid-animation the node still gets
                   collected when it finally finishes. */
                ring.addEventListener('animationend', function () {
                    if (this.parentNode) this.parentNode.removeChild(this);
                });
            }
        }, { passive: true });
    }


    /* ========================================================
       6. 上 — RETURN TO TOP
       ======================================================== */
    var toTop = $('#toTop');
    if (toTop) {
        var topShown = null;

        function syncToTop() {
            var past = (window.pageYOffset || docEl.scrollTop) > window.innerHeight * 0.9;
            if (past === topShown) return;
            topShown = past;
            toTop.classList.toggle('is-shown', past);
        }

        window.addEventListener('scroll', syncToTop, { passive: true });
        toTop.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
        });
        syncToTop();
    }


    /* ========================================================
       8. 数取り — STAT COUNTERS
       ======================================================== */
    var counters = $$('[data-count]');

    if (counters.length) {
        var runCounter = function (el) {
            var target = parseFloat(el.getAttribute('data-count'));
            if (isNaN(target)) return;

            var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
            var suffix = el.getAttribute('data-suffix') || '';
            var duration = 1100;
            var started = null;

            if (reduced) {
                el.textContent = target.toFixed(decimals) + suffix;
                return;
            }

            function tick(now) {
                if (started === null) started = now;
                var t = clamp((now - started) / duration, 0, 1);
                /* ease-out cubic: fast enough to feel responsive, and it
                   lands on the number instead of creeping onto it */
                var eased = 1 - Math.pow(1 - t, 3);
                el.textContent = (target * eased).toFixed(decimals) + suffix;
                if (t < 1) window.requestAnimationFrame(tick);
            }
            window.requestAnimationFrame(tick);
        };

        if ('IntersectionObserver' in window) {
            var io = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) runCounter(entry.target);
                });
            }, { threshold: 0.6 });
            counters.forEach(function (el) { io.observe(el); });
        } else {
            counters.forEach(runCounter);
        }
    }


    /* ========================================================
       9. 傾き — PORTRAIT TILT + HIGHLIGHT
       The breathing zoom and the light sheen in portrait.css run on
       pure CSS and need nothing from here. This block adds the one
       piece a stylesheet cannot: the disc tipping toward a fine
       pointer, with a highlight that tracks it -- the same
       construction as the project-card tilt above, aimed at the
       hero portrait instead of a project plate.
       ======================================================== */
    var portrait = $('#portrait');
    var portraitFigure = $('#portraitFigure');

    if (portrait && portraitFigure && finePointer && !reduced) {
        var wrap = portrait.parentNode;
        var pFrame = null, px = 0, py = 0;

        function paintPortrait() {
            pFrame = null;
            var rect = portrait.getBoundingClientRect();
            if (!rect.width || !rect.height) return;

            var nx = (px - rect.left) / rect.width;   /* 0 -> 1 */
            var ny = (py - rect.top) / rect.height;

            /* capped well under the project-card tilt -- a face reads as
               "wrong" at an angle that a flat illustration does not */
            portrait.style.setProperty('--ptx', ((0.5 - ny) * 5).toFixed(2) + 'deg');
            portrait.style.setProperty('--pty', ((nx - 0.5) * 5).toFixed(2) + 'deg');
            portraitFigure.style.setProperty('--pmx', (nx * 100).toFixed(1) + '%');
            portraitFigure.style.setProperty('--pmy', (ny * 100).toFixed(1) + '%');
        }

        wrap.addEventListener('pointermove', function (e) {
            if (e.pointerType !== 'mouse') return;
            px = e.clientX;
            py = e.clientY;
            portrait.classList.add('is-tilting');
            if (pFrame === null) pFrame = window.requestAnimationFrame(paintPortrait);
        });

        wrap.addEventListener('pointerleave', function () {
            if (pFrame !== null) {
                window.cancelAnimationFrame(pFrame);
                pFrame = null;
            }
            portrait.classList.remove('is-tilting');
            portrait.style.removeProperty('--ptx');
            portrait.style.removeProperty('--pty');
            portraitFigure.style.removeProperty('--pmx');
            portraitFigure.style.removeProperty('--pmy');
        });
    }


    /* ========================================================
       10. SCROLL REVEAL
       All of the animation is in reveal.css. This only decides
       WHEN, and the answer is once: an element that has been
       revealed is unobserved and never hidden again. The old
       library re-hid on the way back up, and a fast scroll could
       outrun that, which is how content ended up appearing with
       no transition at all.

       Elements already on screen at load are handled by the same
       path — IntersectionObserver reports them as intersecting on
       its first run, so the hero reveals immediately without
       needing a separate case.
       ======================================================== */
    var REVEAL_SELECTOR = [
        '.featured-text-card', '.featured-title', '.featured-role',
        '.featured-name', '.featured-sub', '.featured-text-info',
        '.featured-text-btn', '.social_icons', '.featured-image',
        '.top-header', '.about-info', '.skills-box', '.timeline-item',
        '.awards-list li', '.contact-info', '.form-control',
        '.projects-footnote', '.project-container'
    ].join(',');

    var revealTargets = $$(REVEAL_SELECTOR);

    if (revealTargets.length) {
        if (reduced || !('IntersectionObserver' in window)) {
            /* Nothing to observe, but the class still goes on. Under
               reduced motion reveal.css is inert either way; on an old
               engine this is what keeps the content from being stranded
               invisible. */
            revealTargets.forEach(function (el) { el.classList.add('is-revealed'); });
        } else {
            var revealIO = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (!entry.isIntersecting) return;
                    entry.target.classList.add('is-revealed');
                    revealIO.unobserve(entry.target);
                });
            }, {
                /* threshold 0 -- a single pixel crossing is enough.
                   A fractional threshold looks tidier but is a trap
                   here: .project-container is the whole nine-card
                   grid, and once it stacks to one column it is taller
                   than the viewport. The largest ratio such an element
                   can EVER report is viewportHeight / elementHeight,
                   so a 0.1 threshold means the grid reveals late on a
                   tall phone and, past roughly ten viewport-heights of
                   cards, never fires at all and the section stays
                   blank. Zero has no height ceiling.

                   The bottom edge is pulled up instead, so things
                   start moving just before they reach the very bottom
                   of the screen rather than exactly at it. */
                threshold: 0,
                rootMargin: '0px 0px -8% 0px'
            });

            revealTargets.forEach(function (el) { revealIO.observe(el); });
        }

        /* Tells the failsafe in <head> that the reveal is live, so it
           does not strip the hidden state out from under us. */
        docEl.setAttribute('data-reveal-armed', '');
    }


    /* ========================================================
       Live update if the visitor flips the OS motion setting
       ======================================================== */
    function onMotionChange() { reduced = motionQuery.matches; }
    if (typeof motionQuery.addEventListener === 'function') {
        motionQuery.addEventListener('change', onMotionChange);
    } else if (typeof motionQuery.addListener === 'function') {
        motionQuery.addListener(onMotionChange);
    }

})();
