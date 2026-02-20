// Wedding date: October 17, 2024
const weddingDate = new Date("2024-10-17T00:00:00");

// Store previous values to detect changes
let previousValues = {
    years: -1,
    days: -1,
    hours: -1,
    minutes: -1,
    seconds: -1
};

// Initialize the counter structure (create digit strips)
function initCounter() {
    const ids = ['years', 'days', 'hours', 'minutes', 'seconds'];

    ids.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;

        // Determine number of digits needed (max expected)
        // Years: 2, Days: 3, Hours: 2, Mins: 2, Secs: 2
        let digitCount = 2;
        if (id === 'days') digitCount = 3;

        el.innerHTML = '';
        el.classList.add('counter-wrapper');

        // Create a strip for each digit place
        for (let i = 0; i < digitCount; i++) {
            const digitGroup = document.createElement('div');
            digitGroup.className = 'counter-digit-group';
            // Create stack of 0-9
            for (let num = 0; num <= 9; num++) {
                const span = document.createElement('span');
                span.className = 'counter-digit';
                span.textContent = num;
                digitGroup.appendChild(span);
            }
            el.appendChild(digitGroup);
        }
    });

    updateCounter();
    setInterval(updateCounter, 1000);
}

function updateCounter() {
    const now = new Date();

    // 1. Calculate Years
    let years = now.getFullYear() - weddingDate.getFullYear();
    const anniversaryThisYear = new Date(weddingDate);
    anniversaryThisYear.setFullYear(now.getFullYear());
    if (now < anniversaryThisYear) years--;

    // 2. Calculate Days
    const lastAnniversary = new Date(weddingDate);
    lastAnniversary.setFullYear(weddingDate.getFullYear() + years);
    const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastAnniversaryMidnight = new Date(lastAnniversary.getFullYear(), lastAnniversary.getMonth(), lastAnniversary.getDate());
    const diffTime = nowMidnight - lastAnniversaryMidnight;
    const days = Math.round(diffTime / (1000 * 60 * 60 * 24));

    // 3. Time
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    // Update UI with animations
    updateSegment('years', years, 2);
    updateSegment('days', days, 3);
    updateSegment('hours', hours, 2);
    updateSegment('minutes', minutes, 2);
    updateSegment('seconds', seconds, 2);
}

function updateSegment(id, value, minDigits) {
    const el = document.getElementById(id);
    if (!el) return;

    // Pad value with zeros (e.g. 5 -> "05", 1 -> "001" for days)
    const valStr = value.toString().padStart(minDigits, '0');

    // Get all digit groups (strips)
    const groups = el.querySelectorAll('.counter-digit-group');

    // Update each strip
    valStr.split('').forEach((digitStr, index) => {
        if (groups[index]) {
            const digit = parseInt(digitStr, 10);
            // Height of one digit is ~1.25em defined in CSS
            // We translate up by digit * 1.25em
            groups[index].style.transform = `translateY(-${digit * 1.25}em)`;
        }
    });
}

// Start
document.addEventListener('DOMContentLoaded', initCounter);
