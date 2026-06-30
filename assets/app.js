/* Weather App — Open-Meteo API (no key needed) */
(() => {
  "use strict";
  const $ = (s) => document.querySelector(s);

  const state = { recent: [], weatherCodeMap: null };
  const RECENT_KEY = "weather.recent";
  const THEME_KEY = "weather.theme";

  // WMO weather codes → {label, icon}
  const WMO = {
    0: { label: "Clear sky", icon: "☀️" },
    1: { label: "Mainly clear", icon: "🌤️" },
    2: { label: "Partly cloudy", icon: "⛅" },
    3: { label: "Overcast", icon: "☁️" },
    45: { label: "Fog", icon: "🌫️" },
    48: { label: "Rime fog", icon: "🌫️" },
    51: { label: "Light drizzle", icon: "🌦️" },
    53: { label: "Drizzle", icon: "🌦️" },
    55: { label: "Heavy drizzle", icon: "🌧️" },
    61: { label: "Light rain", icon: "🌦️" },
    63: { label: "Rain", icon: "🌧️" },
    65: { label: "Heavy rain", icon: "🌧️" },
    66: { label: "Freezing rain", icon: "🌧️" },
    67: { label: "Freezing rain", icon: "🌧️" },
    71: { label: "Light snow", icon: "🌨️" },
    73: { label: "Snow", icon: "❄️" },
    75: { label: "Heavy snow", icon: "❄️" },
    77: { label: "Snow grains", icon: "🌨️" },
    80: { label: "Rain showers", icon: "🌦️" },
    81: { label: "Rain showers", icon: "🌧️" },
    82: { label: "Violent showers", icon: "⛈️" },
    85: { label: "Snow showers", icon: "🌨️" },
    86: { label: "Heavy snow showers", icon: "❄️" },
    95: { label: "Thunderstorm", icon: "⛈️" },
    96: { label: "Thunderstorm + hail", icon: "⛈️" },
    99: { label: "Severe thunderstorm", icon: "⛈️" },
  };

  const formatTime = (isoStr) => {
    if (!isoStr) return "—";
    return new Date(isoStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Geocoding: city name → lat/lon
  async function geocode(city) {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=5&language=en&format=json`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Geocoding failed: ${r.status}`);
    const data = await r.json();
    if (!data.results || data.results.length === 0) {
      throw new Error(`No cities found for "${city}"`);
    }
    return data.results;
  }

  // Weather: lat/lon → forecast
  async function getWeather(lat, lon, timezone = "auto") {
    const params = new URLSearchParams({
      latitude: lat,
      longitude: lon,
      timezone,
      current: "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m",
      daily: "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset",
      forecast_days: "5",
    });
    const url = `https://api.open-meteo.com/v1/forecast?${params}`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Weather fetch failed: ${r.status}`);
    return r.json();
  }

  async function searchCity(city) {
    showLoading(true);
    hideError();
    try {
      const results = await geocode(city);
      const place = results[0];
      const weather = await getWeather(place.latitude, place.longitude);
      renderWeather(place, weather);
      addRecent(place);
    } catch (err) {
      showError(err.message);
    } finally {
      showLoading(false);
    }
  }

  function renderWeather(place, weather) {
    const c = weather.current;
    const d = weather.daily;
    const wmo = WMO[c.weather_code] || { label: "Unknown", icon: "🌡️" };

    $("#weather").hidden = false;
    $("#cityName").textContent = `${place.name}${place.country ? ", " + place.country_code : ""}`;
    $("#temp").textContent = Math.round(c.temperature_2m);
    $("#condition").textContent = wmo.label;
    $("#feels").textContent = `Feels like ${Math.round(c.apparent_temperature)}°`;
    $("#icon").textContent = wmo.icon;
    $("#humidity").textContent = `${c.relative_humidity_2m}%`;
    $("#wind").textContent = `${Math.round(c.wind_speed_10m)} km/h`;
    $("#sunrise").textContent = formatTime(d.sunrise[0]);
    $("#sunset").textContent = formatTime(d.sunset[0]);

    // 5-day forecast
    const forecastEl = $("#forecast");
    forecastEl.innerHTML = "";
    for (let i = 0; i < d.time.length; i++) {
      const dayName = i === 0 ? "Today" : new Date(d.time[i]).toLocaleDateString([], { weekday: "short" });
      const wmoDay = WMO[d.weather_code[i]] || { icon: "🌡️" };
      const div = document.createElement("div");
      div.className = "forecast__day";
      div.innerHTML = `
        <div class="day">${dayName}</div>
        <div class="icon">${wmoDay.icon}</div>
        <div class="temps">
          <span class="high">${Math.round(d.temperature_2m_max[i])}°</span>
          <span class="low">${Math.round(d.temperature_2m_min[i])}°</span>
        </div>`;
      forecastEl.appendChild(div);
    }
  }

  // Recent searches
  function loadRecent() {
    try { state.recent = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); }
    catch { state.recent = []; }
    renderRecent();
  }
  function addRecent(place) {
    const entry = { name: place.name, country: place.country_code, lat: place.latitude, lon: place.longitude };
    state.recent = [entry, ...state.recent.filter((r) => r.name !== place.name)].slice(0, 8);
    localStorage.setItem(RECENT_KEY, JSON.stringify(state.recent));
    renderRecent();
  }
  function renderRecent() {
    if (state.recent.length === 0) { $("#recent").hidden = true; return; }
    $("#recent").hidden = false;
    const list = $("#recentList");
    list.innerHTML = "";
    state.recent.forEach((r) => {
      const chip = document.createElement("button");
      chip.className = "recent__chip";
      chip.type = "button";
      chip.textContent = `${r.name}${r.country ? ", " + r.country : ""}`;
      chip.addEventListener("click", () => searchByCoords(r.name, r.lat, r.lon));
      list.appendChild(chip);
    });
  }
  async function searchByCoords(name, lat, lon) {
    showLoading(true); hideError();
    try {
      const weather = await getWeather(lat, lon);
      renderWeather({ name, latitude: lat, longitude: lon, country_code: "" }, weather);
    } catch (err) { showError(err.message); }
    finally { showLoading(false); }
  }

  // Geolocation
  $("#geoBtn").addEventListener("click", () => {
    if (!navigator.geolocation) return showError("Geolocation not supported");
    showLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          // Reverse geocode to get city name
          const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&count=1&language=en&format=json`);
          const data = await r.json();
          const place = data.results && data.results[0]
            ? data.results[0]
            : { name: "My location", latitude: pos.coords.latitude, longitude: pos.coords.longitude, country_code: "" };
          const weather = await getWeather(pos.coords.latitude, pos.coords.longitude);
          renderWeather(place, weather);
          addRecent(place);
        } catch (err) { showError(err.message); }
        finally { showLoading(false); }
      },
      (err) => { showLoading(false); showError("Location access denied"); },
      { timeout: 8000 }
    );
  });

  // Search form
  let suggestionTimer;
  $("#cityInput").addEventListener("input", (e) => {
    clearTimeout(suggestionTimer);
    const q = e.target.value.trim();
    if (q.length < 2) { $("#suggestions").hidden = true; return; }
    suggestionTimer = setTimeout(async () => {
      try {
        const results = await geocode(q);
        const sug = $("#suggestions");
        sug.innerHTML = "";
        results.slice(0, 5).forEach((r) => {
          const div = document.createElement("div");
          div.className = "suggestion";
          div.textContent = `${r.name}${r.admin1 ? ", " + r.admin1 : ""}${r.country ? ", " + r.country : ""}`;
          div.addEventListener("click", () => {
            $("#cityInput").value = r.name;
            sug.hidden = true;
            searchByCoords(r.name, r.latitude, r.longitude);
          });
          sug.appendChild(div);
        });
        sug.hidden = false;
      } catch { /* ignore */ }
    }, 300);
  });

  $("#searchForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const q = $("#cityInput").value.trim();
    if (q) {
      $("#suggestions").hidden = true;
      searchCity(q);
    }
  });

  // UI helpers
  function showLoading(yes) { $("#loading").hidden = !yes; }
  function showError(msg) {
    const el = $("#error");
    el.textContent = "⚠️ " + msg;
    el.hidden = false;
  }
  function hideError() { $("#error").hidden = true; }

  // Theme
  const applyTheme = (t) => {
    document.documentElement.setAttribute("data-theme", t);
    $("#themeToggle").textContent = t === "light" ? "☀️" : "🌙";
  };
  const saved = localStorage.getItem(THEME_KEY);
  applyTheme(saved || (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"));
  $("#themeToggle").addEventListener("click", () => {
    const cur = document.documentElement.getAttribute("data-theme") || "dark";
    const next = cur === "dark" ? "light" : "dark";
    applyTheme(next);
    localStorage.setItem(THEME_KEY, next);
  });

  // Init — load default city
  loadRecent();
  searchCity("Delhi");
})();
