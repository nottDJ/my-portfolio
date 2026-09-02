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


    /* ----- HIGHLIGHT THE SECTION YOU ARE IN ----- */
    var sections = document.querySelectorAll('section[id]');

    function scrollActive() {
        var scrollY = window.pageYOffset || document.documentElement.scrollTop;

        Array.prototype.forEach.call(sections, function (current) {
            var sectionHeight = current.offsetHeight;
            var sectionTop = current.offsetTop - 90;
            var sectionId = current.getAttribute('id');
            var link = document.querySelector('.nav-menu a[href="#' + sectionId + '"]');
            if (!link) return;

            if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                link.classList.add('active-link');
            } else {
                link.classList.remove('active-link');
            }
        });
    }
    window.addEventListener('scroll', scrollActive, { passive: true });
    scrollActive();

})();
