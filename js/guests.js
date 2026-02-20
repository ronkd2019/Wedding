// Physics State
const state = {
    scrollY: window.scrollY,
    velocity: 0,
    sag: 60, // Base sag
    currentSag: 60,
    sway: 0,
    rows: [],
    svg: null,
    container: null,
    initialized: false
};

document.addEventListener('DOMContentLoaded', () => {
    state.container = document.querySelector('.polaroid-container');

    // Fetch guest data
    fetch('../js/guests.json')
        .then(response => response.json())
        .then(guests => {
            guests.forEach(guest => {
                const polaroid = createPolaroid(guest);
                state.container.appendChild(polaroid);
            });

            // Initialize ropes after layout
            requestAnimationFrame(() => {
                initRopes();
                startPhysicsLoop();
            });
        })
        .catch(error => console.error('Error loading guests:', error));

    // Handle resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            initRopes();
        }, 100);
    });

    // Ensure ropes are drawn after full page load (images/fonts)
    window.addEventListener('load', () => {
        initRopes();
    });
});

function initRopes() {
    if (!state.container) return;
    const items = Array.from(state.container.querySelectorAll('.polaroid'));
    if (items.length === 0) return;

    // Reset offsets for accurate measurement
    items.forEach(item => item.style.setProperty('--rope-offset', '0px'));

    // Remove existing SVG
    const existingSvg = state.container.querySelector('.rope-svg');
    if (existingSvg) existingSvg.remove();

    // Create SVG
    state.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    state.svg.classList.add('rope-svg');
    state.container.prepend(state.svg);

    // Group items by row
    const rowMap = {};
    items.forEach(item => {
        const y = item.offsetTop;
        const key = Math.round(y / 50) * 50; // Bucket by 50px
        if (!rowMap[key]) rowMap[key] = [];
        rowMap[key].push(item);
    });

    // Build Row Models
    state.rows = Object.keys(rowMap).map(key => {
        const rowItems = rowMap[key];

        // Calculate average Y of items in this row to ensure rope aligns with items
        // consistently, regardless of grid rounding.
        // Row 1: offsetTop ~90px. Previous logic gave ropeY=85px. So target is -5px.
        const avgY = rowItems.reduce((sum, item) => sum + item.offsetTop, 0) / rowItems.length;
        const ropeY = avgY - 5;

        // Create SVG Paths
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', '#C4704A');
        path.setAttribute('stroke-width', '4');
        path.setAttribute('stroke-dasharray', '8 4');
        path.setAttribute('stroke-linecap', 'round');
        state.svg.appendChild(path);

        const pathShadow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        pathShadow.setAttribute('fill', 'none');
        pathShadow.setAttribute('stroke', 'rgba(0,0,0,0.1)');
        pathShadow.setAttribute('stroke-width', '2');
        state.svg.appendChild(pathShadow);

        // Pre-calculate relative X positions (approximated, updated on resize)
        const itemsData = rowItems.map(item => {
            return {
                element: item
            };
        });

        return {
            ropeY,
            items: itemsData,
            path,
            pathShadow
        };
    });

    state.initialized = true;
    updateRender(); // Initial draw
}

function startPhysicsLoop() {
    let lastTime = performance.now();

    function loop(time) {
        if (!state.initialized) {
            requestAnimationFrame(loop);
            return;
        }

        // Calculate Scroll Velocity
        const currentScroll = window.scrollY;
        const deltaY = currentScroll - state.scrollY;

        // Update stored scrollY
        state.scrollY = currentScroll;

        // Apply Forces
        const force = deltaY * 0.5; // Reduced sensitivity

        // Spring Physics for Sag
        // drag force
        state.velocity += force * 0.05;
        // spring return force
        state.velocity += (state.sag - state.currentSag) * 0.08;
        // damping
        state.velocity *= 0.85;

        state.currentSag += state.velocity;

        // Sway Physics based on scroll direction
        // Limit sway angle
        const targetSway = Math.max(-8, Math.min(8, deltaY * 0.3));
        // Interpolate sway
        state.sway += (targetSway - state.sway) * 0.1;

        // Render if there is significant change
        if (Math.abs(state.velocity) > 0.01 || Math.abs(state.sag - state.currentSag) > 0.01 || Math.abs(state.sway) > 0.01 || deltaY !== 0) {
            updateRender();
        }

        lastTime = time;
        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
}

function updateRender() {
    if (!state.container) return;
    const containerWidth = state.container.offsetWidth;
    // Clamp sag to avoid breaking
    const sag = Math.max(20, Math.min(150, state.currentSag));
    const sway = state.sway;

    state.rows.forEach(row => {
        const { ropeY, path, pathShadow, items } = row;

        // Update Paths
        const d = `M 0,${ropeY} Q ${containerWidth / 2},${ropeY + sag * 2} ${containerWidth},${ropeY}`;
        path.setAttribute('d', d);

        const dShadow = `M 0,${ropeY + 2} Q ${containerWidth / 2},${ropeY + 2 + sag * 2} ${containerWidth},${ropeY + 2}`;
        pathShadow.setAttribute('d', dShadow);

        // Update Items
        items.forEach(data => {
            const item = data.element;
            // Get current relative position 
            const itemX = item.offsetLeft + item.offsetWidth / 2;
            const t = itemX / containerWidth;

            // Quadratic Bezier Height at t
            // B(t) = (1-t)^2*P0 + 2(1-t)t*P1 + t^2*P2
            const curveY = Math.pow(1 - t, 2) * ropeY +
                2 * (1 - t) * t * (ropeY + 2 * sag) +
                Math.pow(t, 2) * ropeY;

            const offset = curveY - ropeY;

            item.style.setProperty('--rope-offset', `${offset}px`);

            // Add sway variable with noise
            item.style.setProperty('--sway-rotation', `${sway}deg`);
        });
    });
}

function createPolaroid(guest) {
    const div = document.createElement('div');
    div.className = 'polaroid';
    div.style.setProperty('--rotation', guest.rotation);
    div.style.setProperty('--delay', guest.delay);

    const roleMapping = {
        "Mother of the Bride": "role-mother-bride",
        "Father of the Bride": "role-father-bride",
        "Mother of the Groom": "role-mother-groom",
        "Father of the Groom": "role-father-groom",
        "Maid of Honor": "role-maid-honor",
        "Best Man": "role-best-man",
        "Bridesmaid": "role-bridesmaid",
        "Groomsman": "role-groomsman",
        "Special Guests": "role-special"
    };

    const currentLang = localStorage.getItem('preferred-language') || 'en';
    const translatedRole = (typeof translations !== 'undefined' && translations[currentLang] && translations[currentLang][roleMapping[guest.role]])
        ? translations[currentLang][roleMapping[guest.role]]
        : guest.role;

    div.innerHTML = `
        <div class="clothespin" aria-hidden="true"></div>
        <div class="photo-frame">
            <img
                src="${guest.image}"
                alt="${guest.name} – ${guest.role}"
                class="polaroid-photo"
            />
            <div class="polaroid-developing" aria-hidden="true"></div>
        </div>
        <div class="polaroid-caption">
            <p class="role" data-original-role="${guest.role}">${translatedRole}</p>
            <p class="name">${guest.name}</p>
        </div>
    `;

    // Make card keyboard accessible
    div.setAttribute('tabindex', '0');
    div.setAttribute('role', 'figure');
    div.setAttribute('aria-label', `${guest.name} – ${guest.role}`);

    function develop() {
        div.classList.add('developed');
    }

    // Click to develop
    div.addEventListener('click', develop);

    // Keyboard: Enter or Space to develop
    div.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            develop();
        }
    });

    return div;
}
