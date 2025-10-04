const apiKey = "a34ad7d8b6a242b95a829869a62d2e10";

const currentWeather = document.getElementById("currentWeather");
const forecastContainer = document.getElementById("forecast");
const searchBtn = document.getElementById("searchBtn");
const cityInput = document.getElementById("cityInput");
const suggestionsContainer = document.getElementById("suggestions");
const themeToggle = document.getElementById("themeToggle");

const canvas = document.getElementById("weatherCanvas");
const ctx = canvas.getContext("2d");
const cloudsContainer = document.getElementById("clouds");
const lightning = document.getElementById("lightning");

// Resize canvas
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// Theme toggle
function initTheme() {
  const saved = localStorage.getItem("theme");
  if (saved === "dark") {
    document.body.classList.add("dark");
    themeToggle.innerHTML = `<i class="fa-solid fa-sun"></i>`;
  }
}
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");
  themeToggle.innerHTML = isDark ? `<i class="fa-solid fa-sun"></i>` : `<i class="fa-solid fa-moon"></i>`;
});

// Clear effects
let animationId;
function clearEffects() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  cancelAnimationFrame(animationId);
  cloudsContainer.innerHTML = "";
  lightning.style.opacity = 0;
}

// Weather animations
function startClear() { clearEffects(); }
function startClouds(opacity = 0.8) {
  clearEffects();
  for (let i = 0; i < 6; i++) {
    const cloud = document.createElement("div");
    cloud.classList.add("cloud");
    cloud.style.width = `${120 + Math.random() * 200}px`;
    cloud.style.height = `${70 + Math.random() * 100}px`;
    cloud.style.top = `${Math.random() * 60 + 10}%`;
    cloud.style.left = `-${200 + Math.random() * 100}px`;
    cloud.style.opacity = opacity;
    cloud.style.animationDuration = `${50 + Math.random() * 20}s`;
    cloudsContainer.appendChild(cloud);
  }
}
function startRain() {
  clearEffects();
  const drops = [];
  for (let i = 0; i < 200; i++) {
    drops.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, len: Math.random() * 20 + 10, speed: Math.random() * 4 + 4 });
  }
  function drawRain() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 1.2;
    for (let d of drops) {
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x, d.y + d.len);
      ctx.stroke();
      d.y += d.speed;
      if (d.y > canvas.height) d.y = -20;
    }
    animationId = requestAnimationFrame(drawRain);
  }
  drawRain();
}
function startSnow() {
  clearEffects();
  const flakes = [];
  for (let i = 0; i < 150; i++) {
    flakes.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, r: Math.random() * 3 + 2, d: Math.random() + 1 });
  }
  function drawSnow() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.beginPath();
    for (let f of flakes) {
      ctx.moveTo(f.x, f.y);
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2, true);
    }
    ctx.fill();
    for (let f of flakes) {
      f.y += Math.pow(f.d, 2) + 1;
      if (f.y > canvas.height) { f.x = Math.random() * canvas.width; f.y = 0; }
    }
    animationId = requestAnimationFrame(drawSnow);
  }
  drawSnow();
}
function startStorm() { startRain(); triggerLightning(); }
function triggerLightning() {
  function flash() { lightning.style.opacity = 0.8; setTimeout(() => lightning.style.opacity = 0, 100); }
  function randomFlashes() { const delay = Math.random() * 5000 + 2000; setTimeout(() => { flash(); randomFlashes(); }, delay); }
  randomFlashes();
}

function setWeatherBackground(condition) {
  document.body.classList.remove("sunny","cloudy","rainy","snowy","stormy","misty");
  condition = condition.toLowerCase();
  if (condition.includes("clear")) { document.body.classList.add("sunny"); startClear(); }
  else if (condition.includes("cloud")) { document.body.classList.add("cloudy"); startClouds(); }
  else if (condition.includes("rain") || condition.includes("drizzle")) { document.body.classList.add("rainy"); startRain(); }
  else if (condition.includes("snow")) { document.body.classList.add("snowy"); startSnow(); }
  else if (condition.includes("thunderstorm")) { document.body.classList.add("stormy"); startStorm(); }
  else if (condition.includes("mist") || condition.includes("fog") || condition.includes("haze")) { document.body.classList.add("misty"); startClouds(0.4); }
}

// Fetch weather by coordinates
async function fetchWeatherByCoords(lat, lon) {
  try {
    const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`);
    if (!res.ok) throw new Error("Weather data not found");
    const data = await res.json();
    displayCurrentWeather(data);
    fetchForecastByCoords(lat, lon);
  } catch(err) {
    currentWeather.innerHTML = `<p>Error: ${err.message}</p>`;
  }
}

async function fetchForecastByCoords(lat, lon) {
  const res = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`);
  const data = await res.json();
  const dailyMap = {};
  data.list.forEach(item => {
    const date = item.dt_txt.split(' ')[0];
    if (!dailyMap[date]) dailyMap[date] = [];
    dailyMap[date].push(item);
  });
  const dailyArray = Object.keys(dailyMap).slice(0,5).map(date => {
    const temps = dailyMap[date].map(d => d.main.temp);
    const maxTemp = Math.round(Math.max(...temps));
    const minTemp = Math.round(Math.min(...temps));
    const icon = dailyMap[date][0].weather[0].icon;
    const condition = dailyMap[date][0].weather[0].main;
    return { date, maxTemp, minTemp, icon, condition };
  });
  forecastContainer.innerHTML = dailyArray.map(day => {
    const displayDate = new Date(day.date).toLocaleDateString("en-US",{weekday:"short", month:"short", day:"numeric"});
    const iconUrl = `https://openweathermap.org/img/wn/${day.icon}@2x.png`;
    return `<div class="forecast-card"><h3>${displayDate}</h3><img src="${iconUrl}" alt="${day.condition}"><p>Max: ${day.maxTemp}°C</p><p>Min: ${day.minTemp}°C</p><p>${day.condition}</p></div>`;
  }).join("");
}

// Display current weather
function displayCurrentWeather(data) {
  const icon = `https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`;
  const condition = data.weather[0].main;
  currentWeather.innerHTML = `<h2>${data.name}, ${data.sys.country}</h2>
    <img src="${icon}" alt="${data.weather[0].description}">
    <h3>${Math.round(data.main.temp)}°C</h3>
    <p>${condition} - ${data.weather[0].description}</p>
    <p>Humidity: ${data.main.humidity}% | Wind: ${data.wind.speed} m/s</p>`;
  setWeatherBackground(condition);
}

// Geolocation
function getLocationWeather() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async pos => {
      fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
    }, () => {
      currentWeather.innerHTML="<p>Location access denied. Please search a city.</p>";
    });
  }
}

// Search button
searchBtn.addEventListener("click", () => {
  const query = cityInput.value.trim();
  if (query) fetchCitySuggestions(query, true);
});

// City suggestions (autocomplete)
async function fetchCitySuggestions(query, fetchFirst=false) {
  if (!query) { suggestionsContainer.style.display = "none"; return; }
  const res = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${apiKey}`);
  const data = await res.json();
  if (data.length === 0) { suggestionsContainer.style.display = "none"; return; }
  
  suggestionsContainer.innerHTML = data.map(city => `
    <div class="suggestion-item" data-name="${city.name}" data-lat="${city.lat}" data-lon="${city.lon}">
      ${city.name}${city.state ? ", "+city.state : ""}, ${city.country}
    </div>
  `).join("");
  suggestionsContainer.style.display = "block";

  document.querySelectorAll(".suggestion-item").forEach(item => {
    item.addEventListener("click", () => {
      const lat = item.getAttribute("data-lat");
      const lon = item.getAttribute("data-lon");
      const name = item.getAttribute("data-name");
      cityInput.value = name;
      suggestionsContainer.style.display = "none";
      fetchWeatherByCoords(lat, lon);
    });
  });

  if(fetchFirst){
    const first = data[0];
    fetchWeatherByCoords(first.lat, first.lon);
  }
}

// Hide suggestions when clicking outside
document.addEventListener("click", e => {
  if(!cityInput.contains(e.target) && !suggestionsContainer.contains(e.target))
    suggestionsContainer.style.display = "none";
});

// Initialize
initTheme();
getLocationWeather();
