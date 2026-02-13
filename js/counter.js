// Wedding date: October 17, 2024
const weddingDate = new Date("2024-10-17T00:00:00");

// Function to calculate time difference using calendar logic
function updateCounter() {
    const now = new Date();

    // 1. Calculate Years
    let years = now.getFullYear() - weddingDate.getFullYear();

    // Check if we've reached the anniversary this year
    // Create a date for this year's potential anniversary
    const anniversaryThisYear = new Date(weddingDate);
    anniversaryThisYear.setFullYear(now.getFullYear());

    // If now is before the anniversary, we haven't completed this year yet
    if (now < anniversaryThisYear) {
        years--;
    }

    // 2. Calculate Days
    // Get the date of the last completed anniversary
    const lastAnniversary = new Date(weddingDate);
    lastAnniversary.setFullYear(weddingDate.getFullYear() + years);

    // Calculate days difference between last anniversary and today (ignoring time)
    // We reset both to midnight to count full calendar days passed
    const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastAnniversaryMidnight = new Date(lastAnniversary.getFullYear(), lastAnniversary.getMonth(), lastAnniversary.getDate());

    // Time difference in milliseconds
    const diffTime = nowMidnight - lastAnniversaryMidnight;
    // Convert to days, rounding to handle potential DST adjustments (23h or 25h days)
    const days = Math.round(diffTime / (1000 * 60 * 60 * 24));

    // 3. Calculate Hours, Minutes, Seconds
    // Since the wedding was at 00:00:00, the time passed today is simply the current time
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    // Get elements
    const yearsEl = document.getElementById("years");
    const daysEl = document.getElementById("days");
    const hoursEl = document.getElementById("hours");
    const minutesEl = document.getElementById("minutes");
    const secondsEl = document.getElementById("seconds");

    // Update values
    updateValue(yearsEl, years);
    updateValue(daysEl, days);
    updateValue(hoursEl, hours);
    updateValue(minutesEl, minutes);
    updateValue(secondsEl, seconds);
}

// Function to update value with pulse animation
function updateValue(element, newValue) {
    // Format with leading zero if less than 10
    const formattedValue = newValue < 10 ? `0${newValue}` : newValue;

    if (element && element.textContent !== formattedValue.toString()) {
        element.textContent = formattedValue;

        // Trigger pulse animation (scale only, no color change)
        element.classList.remove("pulse");
        void element.offsetWidth; // Trigger reflow
        element.classList.add("pulse");
    }
}

// Update counter immediately and then every second
updateCounter();
setInterval(updateCounter, 1000);
