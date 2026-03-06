/**
 * Site Image Loader
 * ─────────────────
 * Reads js/site-images.json and applies every image to its named slot.
 *
 * HOW TO USE:
 *   1. Drop your photo into the /images/ folder.
 *   2. Open js/site-images.json.
 *   3. Set the slot you want to the filename, e.g.  "highlight-3": "our-dance.jpg"
 *   4. Done — the site picks it up automatically.
 *
 * SLOTS:
 *   "hero"         → Homepage full-screen background photo
 *   "timeline-1"   → Timeline: First Meeting
 *   "timeline-2"   → Timeline: First Date
 *   "timeline-3"   → Timeline: Moving In Together
 *   "timeline-4"   → Timeline: The Proposal
 *   "timeline-5"   → Timeline: Wedding Day
 *   "highlight-1"  → Highlights grid: slot 1
 *   "highlight-2"  → Highlights grid: slot 2
 *   "highlight-3"  → Highlights grid: slot 3
 *   "highlight-4"  → Highlights grid: slot 4
 *   "highlight-5"  → Highlights grid: slot 5
 *   "highlight-6"  → Highlights grid: slot 6
 */

(function () {
    // Detect page depth to build correct relative paths
    const isInnerPage = window.location.pathname.includes('/html/');
    const IMAGE_BASE = isInnerPage ? '../images/' : './images/';
    const CONFIG_PATH = isInnerPage ? '../js/site-images.json' : './js/site-images.json';

    /**
     * Apply config to every [data-image-slot] element on the page,
     * and also handle the special hero background.
     */
    function applyImages(config) {
        // ── Hero background ──────────────────────────────────────────────
        if (config['hero']) {
            const hero = document.querySelector('.hero');
            if (hero) {
                const url = IMAGE_BASE + config['hero'];
                // Verify the file exists before overwriting the CSS background
                const probe = new Image();
                probe.onload = () => {
                    hero.style.backgroundImage =
                        'linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.2)), url("' + url + '")';
                };
                probe.onerror = () => {
                    console.warn('[image-loader] Hero image not found: ' + url);
                };
                probe.src = url;
            }
        }

        // ── All [data-image-slot] elements ───────────────────────────────
        document.querySelectorAll('[data-image-slot]').forEach(function (el) {
            const slot = el.getAttribute('data-image-slot');
            const file = config[slot];

            if (!file) return; // slot not defined in JSON — leave existing src

            const url = IMAGE_BASE + file;

            if (el.tagName === 'IMG') {
                // Only swap if the file actually loads so Unsplash fallbacks survive
                const probe = new Image();
                probe.onload = () => { el.src = url; };
                probe.onerror = () => {
                    console.warn('[image-loader] Image not found for slot "' + slot + '": ' + url);
                };
                probe.src = url;
            }
        });
    }

    /**
     * Fetch config and kick off loading.
     * Fails silently so a missing/malformed JSON never breaks the page.
     */
    function init() {
        fetch(CONFIG_PATH)
            .then(function (res) {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.json();
            })
            .then(applyImages)
            .catch(function (err) {
                console.warn('[image-loader] Could not load site-images.json:', err.message);
            });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
