/**
 * Common JavaScript for Wedding Website
 * - Mobile Navigation Toggle
 * - Active Link Highlighting
 * - Scroll Animations
 * - Button Interaction Effects
 */

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initScrollAnimations();
    initButtons();
});

/* --- Navigation --- */
function initNavigation() {
    // 1. Mobile Menu Toggle
    const nav = document.querySelector('nav');
    if (!nav) return;

    // Create Hamburger Button if it doesn't exist
    if (!document.querySelector('.hamburger')) {
        const hamburger = document.createElement('button');
        hamburger.className = 'hamburger';
        hamburger.ariaLabel = 'Menu';
        hamburger.innerHTML = '<span></span><span></span><span></span>';

        // Insert before the list
        const ul = nav.querySelector('ul');
        nav.insertBefore(hamburger, ul);

        hamburger.addEventListener('click', () => {
            nav.classList.toggle('nav-open');
            hamburger.classList.toggle('active');
            document.body.classList.toggle('no-scroll');
        });
    }

    // 2. Active Link Highlighting
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('nav ul li a');

    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        // Handle root path
        if ((href === './index.html' || href === 'index.html' || href === '../index.html' || href === '/') &&
            (currentPath.endsWith('/') || currentPath.endsWith('index.html'))) {
            link.classList.add('active');
        }
        // Handle other pages
        else if (href && currentPath.includes(href.replace('./', '').replace('../', ''))) {
            link.classList.add('active');
        }
    });

    // Close menu when clicking a link (mobile)
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            nav.classList.remove('nav-open');
            const hamburger = document.querySelector('.hamburger');
            if (hamburger) hamburger.classList.remove('active');
            document.body.classList.remove('no-scroll');
        });
    });
}

/* --- Scroll Animations --- */
function initScrollAnimations() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, observerOptions);

    // Target elements
    const elementsToAnimate = document.querySelectorAll('.timeline-item, .counter-item, .polaroid, .hero h1, .hero p, .section-title');
    elementsToAnimate.forEach(el => {
        el.classList.add('reveal');
        observer.observe(el);
    });
}

/* --- Buttons --- */
function initButtons() {
    const buttons = document.querySelectorAll('button, .btn');
    buttons.forEach(btn => {
        btn.addEventListener('mousedown', () => btn.style.transform = 'scale(0.95)');
        btn.addEventListener('mouseup', () => btn.style.transform = 'scale(1)');
        btn.addEventListener('mouseleave', () => btn.style.transform = '');
    });
}
