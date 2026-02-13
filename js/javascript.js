// Wedding date: October 17, 2024
const weddingDate = new Date("2024-10-17T00:00:00");

// Function to calculate time difference
function updateCounter() {
  const now = new Date();
  const diff = now - weddingDate;

  // Calculate years, days, and seconds
  const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  const totalDays = Math.floor(diff / (1000 * 60 * 60 * 24));
  const totalSeconds = Math.floor(diff / 1000);

  // Get elements
  const yearsEl = document.getElementById("years");
  const daysEl = document.getElementById("days");
  const secondsEl = document.getElementById("seconds");

  // Update values with animation
  updateValue(yearsEl, years);
  updateValue(daysEl, totalDays);
  updateValue(secondsEl, totalSeconds);
}

// Function to update value with pulse animation
function updateValue(element, newValue) {
  if (element && element.textContent !== newValue.toString()) {
    element.textContent = newValue;
    element.classList.add("pulse");
    setTimeout(() => {
      element.classList.remove("pulse");
    }, 500);
  }
}

// Update counter immediately and then every second
updateCounter();
setInterval(updateCounter, 1000);
