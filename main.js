/* ============================================================
   PORTFOLIO — MAIN
   ============================================================ */

(function () {
    'use strict';

    /* ----- NAVIGATION BAR ----- */
    var navMenu = document.getElementById('myNavMenu');
    var navToggle = document.getElementById('navToggle');
    /* The toggle is a <button> now and the glyph is a separate <i>
       inside it. The icon class has to be swapped on that child --
       writing it onto the button would wipe .nav-menu-btn and take
       the button's own layout with it. */
    var navToggleIcon = document.getElementById('navToggleIcon');

    function setMenu(open) {
        if (!navMenu) return;
        navMenu.className = open ? 'nav-menu responsive' : 'nav-menu';
        if (navToggle) {
            navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        }
        if (navToggleIcon) {
            navToggleIcon.className = open ? 'uil uil-times' : 'uil uil-bars';
        }
    }

    function toggleMenu() {
        setMenu(!(navMenu && navMenu.className.indexOf('responsive') > -1));
    }

    /* kept global: the markup has historically called this inline */
    window.myMenuFunction = toggleMenu;

    /* No keydown handler: this is a real <button>, so Enter and Space
       already produce a click. Handling them again would mean either a
       double toggle or a preventDefault dance to suppress the native one. */
    if (navToggle) navToggle.addEventListener('click', toggleMenu);

    /* Tapping a link on mobile should close the overlay, otherwise it
       covers the section that was just jumped to. */
    Array.prototype.forEach.call(
        document.querySelectorAll('.nav-menu .nav-link'),
        function (link) { link.addEventListener('click', function () { setMenu(false); }); }
    );

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') setMenu(false);
    });


    /* ----- SHRINK / SHADOW THE NAV WHILE SCROLLING ----- */
    var navHeader = document.getElementById('header');
    var shrunk = null;

    function headerShadow() {
        if (!navHeader) return;
        var past = (window.pageYOffset || document.documentElement.scrollTop) > 50;
        if (past === shrunk) return;          /* only touch the DOM on a change */
        shrunk = past;

        navHeader.style.boxShadow = past ? '0 1px 14px rgba(60, 48, 32, .14)' : 'none';
        navHeader.style.height = past ? '70px' : '90px';
    }
    window.addEventListener('scroll', headerShadow, { passive: true });
    headerShadow();


    /* ----- TYPING EFFECT ----- */
    if (typeof Typed !== 'undefined' && document.querySelector('.typedText')) {
        new Typed('.typedText', {
            strings: [
                'ML systems',
                'vision pipelines',
                'solid backends',
                'things that run'
            ],
            loop: true,
            typeSpeed: 80,
            backSpeed: 45,
            backDelay: 2200
        });
    }


    /* Scroll reveal used to live here, driving the ScrollReveal
       library. It is now reveal.css plus one IntersectionObserver in
       interactive.js — the flourish behaviours all sit in that file,
       and this one stays the page's core mechanics. */


    /* ----- HIGHLIGHT THE SECTION YOU ARE IN -----
       Three things here exist to keep this off the scroll critical
       path, because the obvious version of it is a classic jank
       source: it used to read offsetTop and offsetHeight for every
       section, and query the DOM for every nav link, on every single
       scroll event.

       Reading offsetTop forces the browser to flush pending layout
       before it can answer. Doing that from a scroll handler means a
       synchronous layout per event, and scroll events fire far more
       often than frames -- so the work is not just repeated, it is
       repeated more times than it can ever be painted.

       So: the links are resolved once, the offsets are measured into
       a table that only a resize can invalidate, and the handler is
       throttled to one run per animation frame. What is left on the
       scroll path is an integer comparison per section. */
    var sections = Array.prototype.slice.call(
        document.querySelectorAll('section[id]')
    );

    var marks = [];
    var activeLink = null;
    var activeTicking = false;

    function measureSections() {
        marks = [];
        sections.forEach(function (section) {
            var link = document.querySelector(
                '.nav-menu a[href="#' + section.getAttribute('id') + '"]'
            );
            if (!link) return;
            marks.push({
                link: link,
                top: section.offsetTop - 90,
                bottom: section.offsetTop - 90 + section.offsetHeight
            });
        });
    }

    function scrollActive() {
        activeTicking = false;
        var scrollY = window.pageYOffset || document.documentElement.scrollTop;

        var hit = null;
        for (var i = 0; i < marks.length; i++) {
            if (scrollY > marks[i].top && scrollY <= marks[i].bottom) {
                hit = marks[i].link;
                break;
            }
        }

        /* Only the link that changed is touched. Clearing the class off
           every link and re-adding it is what turns a highlight into a
           style recalculation across the whole nav, every frame. */
        if (hit === activeLink) return;
        if (activeLink) activeLink.classList.remove('active-link');
        if (hit) hit.classList.add('active-link');
        activeLink = hit;
    }

    window.addEventListener('scroll', function () {
        if (activeTicking) return;
        activeTicking = true;
        window.requestAnimationFrame(scrollActive);
    }, { passive: true });

    /* The offsets move when the layout reflows, and the two things
       that reflow this page are a resize and the fonts landing. */
    var measureTimer = null;
    window.addEventListener('resize', function () {
        window.clearTimeout(measureTimer);
        measureTimer = window.setTimeout(function () {
            measureSections();
            scrollActive();
        }, 150);
    }, { passive: true });

    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () {
            measureSections();
            scrollActive();
        });
    }
    window.addEventListener('load', function () {
        measureSections();
        scrollActive();
    });

    measureSections();
    scrollActive();

})();
