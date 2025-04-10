// ================== Carousel Logic ==================
const track = document.getElementById('carousel');
if (track) {
  const slides = track.children;
  let index = 0;

  function showSlide(i) {
    track.style.transform = `translateX(-${i * 100}vw)`;
  }

  window.nextSlide = function () {
    index = (index + 1) % slides.length;
    showSlide(index);
  };

  window.prevSlide = function () {
    index = (index - 1 + slides.length) % slides.length;
    showSlide(index);
  };

  setInterval(() => nextSlide(), 5000);

  let startX = 0;
  track.addEventListener('touchstart', e => startX = e.touches[0].clientX, { passive: true });
  track.addEventListener('touchend', e => {
    const diff = startX - e.changedTouches[0].clientX;
    if (diff > 50) nextSlide();
    else if (diff < -50) prevSlide();
  }, { passive: true });
}

// ================== Header Nav Active Link  ==================
function updateActiveNavLink() {
  const navLinks = document.querySelectorAll("nav a");
  const currentPath = window.location.pathname.replace(/\/$/, "");
  const currentHash = window.location.hash;

  navLinks.forEach(link => {
    const href = link.getAttribute("href");
    link.classList.remove("active");

    if (href.includes(".html") && currentPath.endsWith(href)) {
      link.classList.add("active");
    }

    if (href === currentHash || href === `index.html${currentHash}`) {
      link.classList.add("active");
    }

    if ((href === "index.html" || href === "#home") && (!currentHash || currentHash === "#home")) {
      link.classList.add("active");
    }
  });
}
updateActiveNavLink();
window.addEventListener("hashchange", updateActiveNavLink);

// ================== Personalized Welcome ==================
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("nameForm");
  const nameInput = document.getElementById("nameInput");
  const nameModal = document.getElementById("nameInputModal");
  const greetingModal = document.getElementById("welcomeModal");

  const weatherDescriptions = {
    0: 'clear sky', 1: 'mainly clear', 2: 'partly cloudy', 3: 'overcast',
    45: 'fog', 48: 'rime fog', 51: 'light drizzle', 53: 'moderate drizzle',
    55: 'dense drizzle', 61: 'light rain', 63: 'moderate rain',
    65: 'heavy rain', 71: 'light snow', 73: 'moderate snow',
    75: 'heavy snow', 80: 'rain showers', 81: 'heavy rain showers',
    82: 'violent showers', 95: 'thunderstorm', 96: 'thunderstorm w/ hail'
  };

  let cachedWeather = "loading...";

  async function fetchWeatherOnce() {
    try {
      const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=42.3314&longitude=-83.0458&current_weather=true');
      const data = await res.json();
      const code = data.current_weather.weathercode;
      cachedWeather = weatherDescriptions[code] || 'unknown';
    } catch {
      cachedWeather = 'unavailable';
    }
  }

  function getCurrentDateTime() {
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour12: true });
    const date = now.toLocaleDateString('en-US', { timeZone: 'America/New_York' });
    return { time, date };
  }

  function getGreeting(hour) {
    if (hour < 12) return "Ohayo Gozaimasu (Good morning)";
    if (hour < 18) return "Konnichiwa (Good afternoon)";
    return "Konbanwa (Good evening)";
  }

  function updateMessage(nameOverride = null) {
    const storedName = nameOverride || localStorage.getItem("name");
    if (!storedName) return;

    const now = new Date();
    const hour = parseInt(now.toLocaleString("en-US", { hour: "numeric", hour12: false }));
    const greeting = getGreeting(hour);
    const { time, date } = getCurrentDateTime();

    const savedNames = JSON.parse(localStorage.getItem("savedNamesDetails")) || [];
    const matched = savedNames.find(entry => entry.name === storedName);

    const greetingText = matched?.newEntry
      ? `${greeting} ${storedName}! Welcome to Natsu's site. It's ${time} EST on ${date}, and currently the weather in Detroit is: ${cachedWeather}.`
      : `${greeting} ${storedName}! Glad to see you back. It's ${time} EST on ${date}, and currently the weather in Detroit is: ${cachedWeather}.`;

    const lastVisitText = matched ? `You last visited on ${matched.lastVisit}.` : "";

    document.getElementById("modalGreetingText").innerText = greetingText;
    document.getElementById("modalLastVisitText").innerText = lastVisitText;

    if (matched?.newEntry) {
      setTimeout(() => {
        greetingModal.classList.remove("hidden");
        matched.newEntry = false;
        localStorage.setItem("savedNamesDetails", JSON.stringify(savedNames));
      }, 1000);
    }
  }

  const storedName = localStorage.getItem("name");
  console.log("Loaded name from localStorage:", storedName);

  const existingDetails = JSON.parse(localStorage.getItem("savedNamesDetails")) || [];

  if (!storedName) {
    console.log("No name found. Showing name input modal.");
    nameModal.classList.remove("hidden");
  } else {
    const matched = existingDetails.find(entry => entry.name === storedName);
    if (!matched) {
      const { time, date } = getCurrentDateTime();
      existingDetails.push({ name: storedName, lastVisit: `${date} at ${time}`, newEntry: true });
      localStorage.setItem("savedNamesDetails", JSON.stringify(existingDetails));
    }
    nameInput.value = storedName;
    fetchWeatherOnce().then(() => updateMessage());
  }

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    const oldName = localStorage.getItem("name");

    if (name) {
      nameModal.classList.add("hidden");

      if (name !== oldName) {
        localStorage.setItem("name", name);

        const { time, date } = getCurrentDateTime();
        let savedNames = JSON.parse(localStorage.getItem("savedNamesDetails")) || [];

        const existingEntry = savedNames.find(entry => entry.name === name);
        if (existingEntry) {
          existingEntry.lastVisit = `${date} at ${time}`;
          existingEntry.newEntry = true;
        } else {
          savedNames.push({ name, lastVisit: `${date} at ${time}`, newEntry: true });
        }

        localStorage.setItem("savedNamesDetails", JSON.stringify(savedNames));
        console.log("Updated name records:", savedNames);

        await fetchWeatherOnce();
        updateMessage(name);
      } else {
        console.log("Name unchanged. Greeting skipped.");
      }
    }
  });

  document.getElementById("closeModal").addEventListener("click", () => {
    greetingModal.classList.add("hidden");
  });
});
