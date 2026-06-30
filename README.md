# Weather App

> Clean weather app with city search, 5-day forecast, geolocation, and recent searches. Uses the **free Open-Meteo API** — no API key required.

![CI](https://github.com/arjundroid12/weather-app/actions/workflows/ci.yml/badge.svg)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

## ✨ Features

- **No API key required** — uses free [Open-Meteo](https://open-meteo.com) APIs (geocoding + forecast)
- **City search with autocomplete** — debounced suggestions as you type
- **5-day forecast** — daily high/low temperatures with weather icons
- **Geolocation** — click 📍 to get weather for your current location
- **Recent searches** — last 8 cities saved to localStorage, click to re-fetch
- **WMO weather codes** — proper icons and labels for all 27 weather codes
- **Dark / light theme** — auto-detects system preference, remembers your choice
- **Responsive** — works on mobile and desktop

## 🚀 Live Demo

| Host | URL |
|------|-----|
| 🥇 Surge.sh | https://arjun-weather.surge.sh |
| 🥈 GitHub Pages | https://arjundroid12.github.io/weather-app/ |

## 🛠️ Tech Stack

- Vanilla HTML/CSS/JS (zero dependencies)
- [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api)
- [Open-Meteo Forecast API](https://open-meteo.com/en/docs)
- `localStorage` for recent searches and theme

## 📦 Run Locally

```bash
git clone https://github.com/arjundroid12/weather-app.git
cd weather-app
python3 -m http.server 8000
# Visit http://localhost:8000
```

## 📁 Project Structure

```
weather-app/
├── .github/workflows/ci.yml
├── assets/
│   ├── app.js          # All app logic, API calls, rendering
│   └── styles.css      # Theme tokens, layout, components
├── index.html
├── LICENSE
├── README.md
└── .gitignore
```

## 📄 License

MIT © Arjun Vashishtha
