/* ==========================================================================
   WindPro Hub - Telemetria Wiatrowa & Pogoda (10m, 120m, 140m, 160m AGL)
   Dedykowana dla Techników Turbin Wiatrowych i Operatorów Dźwigów
   ========================================================================== */

// Default Coordinate Fallback: Gdańsk / Farma Bałtyk
const DEFAULT_LAT = 54.352;
const DEFAULT_LON = 18.646;
const DEFAULT_NAME = "Gdańsk";

// Application State
let currentLat = DEFAULT_LAT;
let currentLon = DEFAULT_LON;
let currentCityName = DEFAULT_NAME;
let currentUnit = 'ms'; // 'ms' (m/s) or 'kmh' (km/h)
let selectedAltitudeLevel = 140; // 140, 160, 120, 10
let latestWeatherData = null;

// DOM Elements
const locationNameEl = document.getElementById('location-name');
const locationCoordsEl = document.getElementById('location-coords');
const currentDateEl = document.getElementById('current-date');

// Top Controls
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const gpsButton = document.getElementById('gps-button');
const unitToggle = document.getElementById('unit-toggle');
const unitBtns = document.querySelectorAll('.unit-btn');

// Safety Banner
const safetyBanner = document.getElementById('safety-banner');
const safetyStatusTitle = document.getElementById('safety-status-title');
const safetyStatusDesc = document.getElementById('safety-status-desc');

// Hero Card
const currentTempEl = document.getElementById('current-temp');
const weatherDescEl = document.getElementById('weather-desc');
const feelsLikeTempEl = document.getElementById('feels-like-temp');
const todayTempMaxEl = document.getElementById('today-temp-max');
const todayTempMinEl = document.getElementById('today-temp-min');
const weatherIconContainer = document.getElementById('weather-icon-container');

// Altitude Ladder Elements
const wind160SpeedEl = document.getElementById('wind-160-speed');
const arrow160El = document.getElementById('arrow-160');
const dir160El = document.getElementById('dir-160');
const gust160El = document.getElementById('gust-160');
const bar160El = document.getElementById('bar-160');

const wind140SpeedEl = document.getElementById('wind-140-speed');
const arrow140El = document.getElementById('arrow-140');
const dir140El = document.getElementById('dir-140');
const gust140El = document.getElementById('gust-140');
const bar140El = document.getElementById('bar-140');

const wind120SpeedEl = document.getElementById('wind-120-speed');
const arrow120El = document.getElementById('arrow-120');
const dir120El = document.getElementById('dir-120');
const gust120El = document.getElementById('gust-120');
const bar120El = document.getElementById('bar-120');

const wind10SpeedEl = document.getElementById('wind-10-speed');
const arrow10El = document.getElementById('arrow-10');
const dir10El = document.getElementById('dir-10');
const gust10El = document.getElementById('gust-10');
const bar10El = document.getElementById('bar-10');

const windShearValEl = document.getElementById('wind-shear-val');
const beaufortHubValEl = document.getElementById('beaufort-hub-val');

// Hourly & Daily
const hourlyTabs = document.getElementById('hourly-level-tabs');
const hourlyScroll = document.getElementById('hourly-scroll');
const dailyForecastList = document.getElementById('daily-forecast-list');

// Atmospheric Metrics
const metricRainSum = document.getElementById('metric-rain-sum');
const metricRainProb = document.getElementById('metric-rain-prob');
const metricPressure = document.getElementById('metric-pressure');
const metricAirDensity = document.getElementById('metric-air-density');
const metricUv = document.getElementById('metric-uv');
const metricUvDesc = document.getElementById('metric-uv-desc');
const metricHumidity = document.getElementById('metric-humidity');
const metricFogRisk = document.getElementById('metric-fog-risk');

// Weather WMO Dictionary
const weatherWMO = {
    0: { desc: "Bezchmurnie", class: "sunny", icon: "sunny" },
    1: { desc: "Przeważnie bezchmurnie", class: "sunny", icon: "sunny-cloudy" },
    2: { desc: "Umiarkowane zachmurzenie", class: "cloudy", icon: "cloudy" },
    3: { desc: "Całkowite zachmurzenie", class: "cloudy", icon: "overcast" },
    45: { desc: "Mgła", class: "cloudy", icon: "fog" },
    48: { desc: "Mgła osadzająca szron", class: "cloudy", icon: "fog" },
    51: { desc: "Lekka mżawka", class: "rainy", icon: "drizzle" },
    53: { desc: "Umiarkowana mżawka", class: "rainy", icon: "drizzle" },
    55: { desc: "Gęsta mżawka", class: "rainy", icon: "drizzle" },
    56: { desc: "Marznąca mżawka", class: "rainy", icon: "drizzle" },
    57: { desc: "Gęsta marznąca mżawka", class: "rainy", icon: "drizzle" },
    61: { desc: "Słaby deszcz", class: "rainy", icon: "rain-light" },
    63: { desc: "Umiarkowany deszcz", class: "rainy", icon: "rain" },
    65: { desc: "Ulewny deszcz", class: "rainy", icon: "rain-heavy" },
    66: { desc: "Słaby marznący deszcz", class: "rainy", icon: "rain" },
    67: { desc: "Silny marznący deszcz", class: "rainy", icon: "rain-heavy" },
    71: { desc: "Słabe opady śniegu", class: "cloudy", icon: "snow" },
    73: { desc: "Umiarkowane opady śniegu", class: "cloudy", icon: "snow" },
    75: { desc: "Silne opady śniegu", class: "cloudy", icon: "snow-heavy" },
    77: { desc: "Ziarna lodowe", class: "cloudy", icon: "snow" },
    80: { desc: "Słaby przelotny deszcz", class: "rainy", icon: "rain-light" },
    81: { desc: "Umiarkowany przelotny deszcz", class: "rainy", icon: "rain" },
    82: { desc: "Gwałtowny deszcz", class: "rainy", icon: "rain-heavy" },
    85: { desc: "Przelotny śnieg", class: "cloudy", icon: "snow" },
    86: { desc: "Silny przelotny śnieg", class: "cloudy", icon: "snow-heavy" },
    95: { desc: "Burza", class: "stormy", icon: "thunderstorm" },
    96: { desc: "Burza z gradem", class: "stormy", icon: "thunderstorm" },
    99: { desc: "Silna burza z gradem", class: "stormy", icon: "thunderstorm" }
};

// Weather SVGs
function getWeatherSVG(iconName, size = 64) {
    const svgs = {
        "sunny": `<svg viewBox="0 0 64 64" width="${size}" height="${size}" class="weather-svg">
            <defs>
                <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color="#FFF4D0" stop-opacity="1"/>
                    <stop offset="100%" stop-color="#FDB813" stop-opacity="0.2"/>
                </radialGradient>
            </defs>
            <circle cx="32" cy="32" r="22" fill="url(#sunGlow)"/>
            <circle cx="32" cy="32" r="14" fill="#FDB813"/>
        </svg>`,
        "sunny-cloudy": `<svg viewBox="0 0 64 64" width="${size}" height="${size}" class="weather-svg">
            <circle cx="24" cy="24" r="10" fill="#FDB813"/>
            <path d="M44 40a10 10 0 0 0-19.16-4.08A12 12 0 1 0 20 54h24a10 10 0 0 0 0-20z" fill="#9ca3af" opacity="0.8"/>
            <path d="M44 38a10 10 0 0 0-19.16-4.08A12 12 0 1 0 20 52h24a10 10 0 0 0 0-20z" fill="#f3f4f6"/>
        </svg>`,
        "cloudy": `<svg viewBox="0 0 64 64" width="${size}" height="${size}" class="weather-svg">
            <path d="M44 38a10 10 0 0 0-19.16-4.08A12 12 0 1 0 20 52h24a10 10 0 0 0 0-20z" fill="#94a3b8" opacity="0.6"/>
            <path d="M38 34a10 10 0 0 0-19.16-4.08A12 12 0 1 0 14 48h24a10 10 0 0 0 0-20z" fill="#cbd5e1"/>
        </svg>`,
        "overcast": `<svg viewBox="0 0 64 64" width="${size}" height="${size}" class="weather-svg">
            <path d="M44 34a10 10 0 0 0-19.16-4.08A12 12 0 1 0 20 48h24a10 10 0 0 0 0-20z" fill="#475569" opacity="0.7"/>
            <path d="M34 38a10 10 0 0 0-19.16-4.08A12 12 0 1 0 10 52h24a10 10 0 0 0 0-20z" fill="#64748b"/>
        </svg>`,
        "fog": `<svg viewBox="0 0 64 64" width="${size}" height="${size}" class="weather-svg">
            <path d="M44 34a10 10 0 0 0-19.16-4.08A12 12 0 1 0 20 48h24a10 10 0 0 0 0-20z" fill="#64748b" opacity="0.4"/>
            <line x1="12" y1="42" x2="52" y2="42" stroke="#e2e8f0" stroke-width="3" stroke-linecap="round"/>
            <line x1="8" y1="48" x2="48" y2="48" stroke="#cbd5e1" stroke-width="3" stroke-linecap="round"/>
            <line x1="16" y1="54" x2="56" y2="54" stroke="#94a3b8" stroke-width="3" stroke-linecap="round"/>
        </svg>`,
        "drizzle": `<svg viewBox="0 0 64 64" width="${size}" height="${size}" class="weather-svg">
            <path d="M38 30a10 10 0 0 0-19.16-4.08A12 12 0 1 0 14 44h24a10 10 0 0 0 0-20z" fill="#cbd5e1"/>
            <line x1="20" y1="48" x2="18" y2="54" stroke="#60a5fa" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="28" y1="48" x2="26" y2="54" stroke="#60a5fa" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="36" y1="48" x2="34" y2="54" stroke="#60a5fa" stroke-width="2.5" stroke-linecap="round"/>
        </svg>`,
        "rain-light": `<svg viewBox="0 0 64 64" width="${size}" height="${size}" class="weather-svg">
            <path d="M38 28a10 10 0 0 0-19.16-4.08A12 12 0 1 0 14 42h24a10 10 0 0 0 0-20z" fill="#94a3b8"/>
            <line x1="20" y1="46" x2="16" y2="56" stroke="#3b82f6" stroke-width="3" stroke-linecap="round"/>
            <line x1="32" y1="46" x2="28" y2="56" stroke="#3b82f6" stroke-width="3" stroke-linecap="round"/>
        </svg>`,
        "rain": `<svg viewBox="0 0 64 64" width="${size}" height="${size}" class="weather-svg">
            <path d="M44 26a10 10 0 0 0-19.16-4.08A12 12 0 1 0 20 40h24a10 10 0 0 0 0-20z" fill="#475569" opacity="0.7"/>
            <path d="M36 30a10 10 0 0 0-19.16-4.08A12 12 0 1 0 12 44h24a10 10 0 0 0 0-20z" fill="#64748b"/>
            <line x1="18" y1="48" x2="14" y2="58" stroke="#3b82f6" stroke-width="3" stroke-linecap="round"/>
            <line x1="26" y1="48" x2="22" y2="58" stroke="#3b82f6" stroke-width="3" stroke-linecap="round"/>
            <line x1="34" y1="48" x2="30" y2="58" stroke="#3b82f6" stroke-width="3" stroke-linecap="round"/>
        </svg>`,
        "rain-heavy": `<svg viewBox="0 0 64 64" width="${size}" height="${size}" class="weather-svg">
            <path d="M44 24a10 10 0 0 0-19.16-4.08A12 12 0 1 0 20 38h24a10 10 0 0 0 0-20z" fill="#1e293b"/>
            <path d="M34 28a10 10 0 0 0-19.16-4.08A12 12 0 1 0 10 42h24a10 10 0 0 0 0-20z" fill="#334155"/>
            <line x1="16" y1="46" x2="11" y2="58" stroke="#2563eb" stroke-width="3.5" stroke-dasharray="4 2" stroke-linecap="round"/>
            <line x1="24" y1="46" x2="19" y2="58" stroke="#2563eb" stroke-width="3.5" stroke-dasharray="4 2" stroke-linecap="round"/>
            <line x1="32" y1="46" x2="27" y2="58" stroke="#2563eb" stroke-width="3.5" stroke-dasharray="4 2" stroke-linecap="round"/>
        </svg>`,
        "snow": `<svg viewBox="0 0 64 64" width="${size}" height="${size}" class="weather-svg">
            <path d="M38 30a10 10 0 0 0-19.16-4.08A12 12 0 1 0 14 44h24a10 10 0 0 0 0-20z" fill="#e2e8f0"/>
            <circle cx="18" cy="50" r="2.5" fill="#fff"/>
            <circle cx="26" cy="52" r="2" fill="#fff"/>
            <circle cx="34" cy="49" r="2.5" fill="#fff"/>
        </svg>`,
        "snow-heavy": `<svg viewBox="0 0 64 64" width="${size}" height="${size}" class="weather-svg">
            <path d="M38 26a10 10 0 0 0-19.16-4.08A12 12 0 1 0 14 40h24a10 10 0 0 0 0-20z" fill="#cbd5e1"/>
            <circle cx="14" cy="46" r="3" fill="#fff"/>
            <circle cx="22" cy="50" r="2" fill="#fff"/>
            <circle cx="25" cy="44" r="3" fill="#fff"/>
            <circle cx="32" cy="48" r="3" fill="#fff"/>
            <circle cx="36" cy="44" r="2" fill="#fff"/>
        </svg>`,
        "thunderstorm": `<svg viewBox="0 0 64 64" width="${size}" height="${size}" class="weather-svg">
            <path d="M44 26a10 10 0 0 0-19.16-4.08A12 12 0 1 0 20 40h24a10 10 0 0 0 0-20z" fill="#1e293b"/>
            <path d="M36 30a10 10 0 0 0-19.16-4.08A12 12 0 1 0 12 44h24a10 10 0 0 0 0-20z" fill="#334155"/>
            <polygon points="26,42 18,52 24,52 20,62 32,48 24,48" fill="#FDB813"/>
            <line x1="14" y1="46" x2="12" y2="52" stroke="#2563eb" stroke-width="2"/>
            <line x1="34" y1="46" x2="32" y2="52" stroke="#2563eb" stroke-width="2"/>
        </svg>`
    };
    return svgs[iconName] || svgs["sunny"];
}

// Unit Conversion Helpers
function formatSpeed(kmh) {
    if (kmh == null || isNaN(kmh)) return "--";
    if (currentUnit === 'ms') {
        return (kmh / 3.6).toFixed(1);
    }
    return kmh.toFixed(1);
}

function getUnitLabel() {
    return currentUnit === 'ms' ? 'm/s' : 'km/h';
}

function convertSpeedValue(kmh) {
    return currentUnit === 'ms' ? (kmh / 3.6) : kmh;
}

// Angle Interpolation on circular 0-360 scale
function interpolateAngle(a, b, fraction) {
    const diff = ((b - a + 180) % 360) - 180;
    return (a + diff * fraction + 360) % 360;
}

// Translate Wind Degrees to Polish Cardinal Directions
function getWindCardinal(degrees) {
    const directions = [
        { label: "N (Północny)", min: 337.5, max: 360 },
        { label: "N (Północny)", min: 0, max: 22.5 },
        { label: "NE (Północno-Wschodni)", min: 22.5, max: 67.5 },
        { label: "E (Wschodni)", min: 67.5, max: 112.5 },
        { label: "SE (Południowo-Wschodni)", min: 112.5, max: 157.5 },
        { label: "S (Południowy)", min: 157.5, max: 202.5 },
        { label: "SW (Południowo-Zachodni)", min: 202.5, max: 247.5 },
        { label: "W (Zachodni)", min: 247.5, max: 292.5 },
        { label: "NW (Północno-Zachodni)", min: 292.5, max: 337.5 }
    ];
    
    const deg = Math.round(degrees) % 360;
    const match = directions.find(d => {
        if (d.min > d.max) {
            return deg >= d.min || deg < d.max;
        }
        return deg >= d.min && deg < d.max;
    });
    return match ? `${match.label} • ${deg}°` : `${deg}°`;
}

// Calculate Beaufort scale (from km/h)
function getBeaufort(speedKmH) {
    if (speedKmH < 1) return { bft: 0, name: "0 Bft (Cisza)" };
    if (speedKmH <= 5) return { bft: 1, name: "1 Bft (Powiew)" };
    if (speedKmH <= 11) return { bft: 2, name: "2 Bft (Słaby)" };
    if (speedKmH <= 19) return { bft: 3, name: "3 Bft (Łagodny)" };
    if (speedKmH <= 28) return { bft: 4, name: "4 Bft (Umiarkowany)" };
    if (speedKmH <= 38) return { bft: 5, name: "5 Bft (Dość silny)" };
    if (speedKmH <= 49) return { bft: 6, name: "6 Bft (Silny wiatr)" };
    if (speedKmH <= 61) return { bft: 7, name: "7 Bft (Bardzo silny)" };
    if (speedKmH <= 74) return { bft: 8, name: "8 Bft (Sztormowy)" };
    if (speedKmH <= 88) return { bft: 9, name: "9 Bft (Sztorm)" };
    if (speedKmH <= 102) return { bft: 10, name: "10 Bft (Silny sztorm)" };
    if (speedKmH <= 117) return { bft: 11, name: "11 Bft (Gwałtowny)" };
    return { bft: 12, name: "12 Bft (Huragan)" };
}

// LocalStorage Cache
function saveCachedLocation(lat, lon, name) {
    try {
        localStorage.setItem('windpro_loc', JSON.stringify({ lat, lon, name }));
    } catch (e) {}
}

function getCachedLocation() {
    try {
        const item = localStorage.getItem('windpro_loc');
        return item ? JSON.parse(item) : null;
    } catch (e) {
        return null;
    }
}

// Fast silent IP Geolocation fallback
async function fetchIPLocation() {
    try {
        const res = await fetch("https://get.geojs.io/v1/ip/geo.json");
        if (!res.ok) throw new Error("GeoJS error");
        const data = await res.json();
        if (data.latitude && data.longitude) {
            const cityName = data.city ? `${data.city} (IP)` : "Moja Lokalizacja (IP)";
            return {
                lat: parseFloat(data.latitude),
                lon: parseFloat(data.longitude),
                name: cityName
            };
        }
    } catch (e) {}
    return null;
}

// Reverse Geocode
async function getCityNameFromCoords(lat, lon) {
    try {
        const geoUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=pl`;
        const geoRes = await fetch(geoUrl);
        if (geoRes.ok) {
            const geoData = await geoRes.json();
            const locality = geoData.city || geoData.locality || geoData.principalSubdivision;
            if (locality) return `${locality} (GPS)`;
        }
    } catch (err) {}
    return "Moja Lokalizacja (GPS)";
}

// Fetch Full High-Precision Weather & Altitude Wind Telemetry
async function fetchWeather(lat, lon, cityName, save = true) {
    currentLat = lat;
    currentLon = lon;
    currentCityName = cityName;
    
    locationNameEl.textContent = cityName;
    locationCoordsEl.textContent = `Koordynaty: ${lat.toFixed(3)}°N, ${lon.toFixed(3)}°E`;
    
    if (save) saveCachedLocation(lat, lon, cityName);
    
    const frame = document.getElementById('app-frame');
    if (frame) frame.classList.add('is-fetching');
    
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,pressure_msl&hourly=temperature_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m,wind_speed_80m,wind_speed_120m,wind_speed_180m,wind_direction_10m,wind_direction_80m,wind_direction_120m,wind_direction_180m,wind_gusts_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,uv_index_max&timezone=auto&forecast_days=7`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error("Błąd sieci Open-Meteo");
        const data = await response.json();
        
        latestWeatherData = data;
        renderAll(data);
    } catch (error) {
        console.error(error);
        locationNameEl.textContent = "Błąd pobierania danych";
        weatherDescEl.textContent = "Sprawdź połączenie z siecią";
    } finally {
        if (frame) frame.classList.remove('is-fetching');
    }
}

// Find Current Hour Index in Open-Meteo hourly array
function findCurrentHourIndex(times) {
    if (!times || !times.length) return 0;
    const now = new Date();
    let startIndex = 0;
    for (let i = 0; i < times.length; i++) {
        const itemDate = new Date(times[i]);
        if (itemDate.getTime() + 1800000 >= now.getTime()) {
            startIndex = i;
            break;
        }
    }
    return startIndex;
}

// Main Render Dispatcher
function renderAll(data) {
    updateFormattedDate();
    
    const current = data.current;
    const hourly = data.hourly;
    const daily = data.daily;
    const curIdx = findCurrentHourIndex(hourly.time);
    
    // Extract wind at multiple levels at current time
    const v10 = hourly.wind_speed_10m[curIdx];
    const dir10 = hourly.wind_direction_10m[curIdx];
    const gusts10 = hourly.wind_gusts_10m[curIdx];
    
    const v120 = hourly.wind_speed_120m[curIdx];
    const dir120 = hourly.wind_direction_120m[curIdx];
    
    const v180 = hourly.wind_speed_180m[curIdx];
    const dir180 = hourly.wind_direction_180m[curIdx];
    
    // Interpolate 140m (1/3 between 120m and 180m) & 160m (2/3 between 120m and 180m)
    const v140 = v120 + (v180 - v120) * (1 / 3);
    const dir140 = interpolateAngle(dir120, dir180, 1 / 3);
    const gusts140 = gusts10 * (v140 / Math.max(v10, 1));
    
    const v160 = v120 + (v180 - v120) * (2 / 3);
    const dir160 = interpolateAngle(dir120, dir180, 2 / 3);
    const gusts160 = gusts10 * (v160 / Math.max(v10, 1));
    
    // 1. Render Hero Weather
    renderHero(current, daily);
    
    // 2. Render Crane & Turbine Safety Analysis (Limits: 12 m/s avg / 18 m/s gust)
    renderCraneSafety(v140, gusts140, v160);
    
    // 3. Render Altitude Ladder (10m, 120m, 140m, 160m)
    renderAltitudeLadder({
        v10, dir10, gusts10,
        v120, dir120, gusts120: gusts10 * (v120 / Math.max(v10, 1)),
        v140, dir140, gusts140,
        v160, dir160, gusts160
    });
    
    // 4. Render Hourly Timeline (24h)
    renderHourlyTimeline(hourly);
    
    // 5. Render 7-Day Pro Forecast
    renderDailyForecast(daily, hourly);
    
    // 6. Render Atmospheric Metrics
    renderAtmosphericMetrics(current, daily);
}

// 1. Render Hero Weather
function renderHero(current, daily) {
    const temp = Math.round(current.temperature_2m);
    const feelsLike = Math.round(current.apparent_temperature);
    const tempMax = Math.round(daily.temperature_2m_max[0]);
    const tempMin = Math.round(daily.temperature_2m_min[0]);
    const wmoCode = current.weather_code;
    
    currentTempEl.textContent = temp;
    feelsLikeTempEl.textContent = `${feelsLike}°`;
    todayTempMaxEl.textContent = `${tempMax}°`;
    todayTempMinEl.textContent = `${tempMin}°`;
    
    const weatherInfo = weatherWMO[wmoCode] || { desc: "Umiarkowanie", class: "cloudy", icon: "cloudy" };
    weatherDescEl.textContent = weatherInfo.desc;
    
    // Set dynamic background
    const frame = document.getElementById('app-frame');
    frame.className = `app-frame weather-${weatherInfo.class}`;
    if (current.wind_speed_10m > 28) frame.classList.add('weather-windy');
    
    weatherIconContainer.innerHTML = getWeatherSVG(weatherInfo.icon, 88);
}

// 2. Crane Lift & Work Safety Logic (12 m/s avg 10 min, 18 m/s gusts on Hub/Crane)
function renderCraneSafety(v140_kmh, gusts140_kmh, v160_kmh) {
    const v140_ms = v140_kmh / 3.6;
    const gusts140_ms = gusts140_kmh / 3.6;
    
    safetyBanner.className = 'safety-banner glass-card';
    
    // Strict User Operational Limits: 12.0 m/s 10-minute average & 18.0 m/s gusts on Hub/Crane height (140m)
    if (v140_ms > 12.0 || gusts140_ms > 18.0) {
        safetyBanner.classList.add('danger');
        safetyStatusTitle.textContent = "🔴 CRANE STOP • PRZEKROCZONY LIMIT!";
        safetyStatusDesc.textContent = `Średnia 10-minutowa na wysokości huba/dźwigu (140m): ${formatSpeed(v140_kmh)} ${getUnitLabel()} (Limit: 12.0 m/s) | Porywy: ${formatSpeed(gusts140_kmh)} ${getUnitLabel()} (Limit: 18.0 m/s). Natychmiast wstrzymaj operacje podnoszenia!`;
    } else if (v140_ms >= 10.5 || gusts140_ms >= 15.5) {
        safetyBanner.classList.add('warning');
        safetyStatusTitle.textContent = "🟡 OSTRZEŻENIE • WARUNKI KRAŃCOWE";
        safetyStatusDesc.textContent = `Średnia 10-minutowa na hubie/dźwigu (${formatSpeed(v140_kmh)} ${getUnitLabel()}) lub porywy (${formatSpeed(gusts140_kmh)} ${getUnitLabel()}) zbliżają się do limitu (12 m/s avg 10-min / 18 m/s poryw). Wymagana wzmożona ostrożność.`;
    } else {
        safetyBanner.classList.add('safe');
        safetyStatusTitle.textContent = "🟢 WARUNKI W NORMIE • LIFTING DOZWOLONY";
        safetyStatusDesc.textContent = `Średnia 10-minutowa na wysokości huba/dźwigu (140m): ${formatSpeed(v140_kmh)} ${getUnitLabel()} (Limit: 12.0 m/s) | Porywy: ${formatSpeed(gusts140_kmh)} ${getUnitLabel()} (Limit: 18.0 m/s). Warunki w dopuszczalnym zakresie.`;
    }
}

// 3. Render Altitude Ladder
function renderAltitudeLadder(levels) {
    // Unit labels in DOM
    document.querySelectorAll('.alt-unit').forEach(el => el.textContent = getUnitLabel());
    
    // Max reference for bar fill (e.g. 30 m/s or 100 km/h)
    const maxRefKmh = 100;
    
    // 160m
    wind160SpeedEl.textContent = formatSpeed(levels.v160);
    dir160El.textContent = `${Math.round(levels.dir160)}°`;
    arrow160El.style.transform = `rotate(${levels.dir160}deg)`;
    gust160El.textContent = `Poryw: ${formatSpeed(levels.gusts160)}`;
    bar160El.style.width = `${Math.min(100, (levels.v160 / maxRefKmh) * 100)}%`;
    
    // 140m (Hub)
    wind140SpeedEl.textContent = formatSpeed(levels.v140);
    dir140El.textContent = `${Math.round(levels.dir140)}°`;
    arrow140El.style.transform = `rotate(${levels.dir140}deg)`;
    gust140El.textContent = `Poryw: ${formatSpeed(levels.gusts140)}`;
    bar140El.style.width = `${Math.min(100, (levels.v140 / maxRefKmh) * 100)}%`;
    
    // 120m
    wind120SpeedEl.textContent = formatSpeed(levels.v120);
    dir120El.textContent = `${Math.round(levels.dir120)}°`;
    arrow120El.style.transform = `rotate(${levels.dir120}deg)`;
    gust120El.textContent = `Poryw: ${formatSpeed(levels.gusts120)}`;
    bar120El.style.width = `${Math.min(100, (levels.v120 / maxRefKmh) * 100)}%`;
    
    // 10m Ground
    wind10SpeedEl.textContent = formatSpeed(levels.v10);
    dir10El.textContent = `${Math.round(levels.dir10)}°`;
    arrow10El.style.transform = `rotate(${levels.dir10}deg)`;
    gust10El.textContent = `Poryw: ${formatSpeed(levels.gusts10)}`;
    bar10El.style.width = `${Math.min(100, (levels.v10 / maxRefKmh) * 100)}%`;
    
    // Wind Shear / Gradient (Delta v between ground and 140m hub)
    const deltaKmh = levels.v140 - levels.v10;
    const deltaVal = currentUnit === 'ms' ? (deltaKmh / 3.6).toFixed(1) : deltaKmh.toFixed(1);
    windShearValEl.textContent = `+${deltaVal} ${getUnitLabel()} (Uskok pionowy)`;
    
    // Beaufort on 140m hub
    const bft = getBeaufort(levels.v140);
    beaufortHubValEl.textContent = bft.name;

    // Highlight row matching current selectedAltitudeLevel
    document.querySelectorAll('.altitude-row').forEach(row => {
        if (parseInt(row.dataset.level, 10) === selectedAltitudeLevel) {
            row.classList.add('active-selection');
        } else {
            row.classList.remove('active-selection');
        }
    });
}

// 4. Hourly 24H Timeline (with dynamic altitude level)
function renderHourlyTimeline(hourly) {
    hourlyScroll.innerHTML = "";
    const startIndex = findCurrentHourIndex(hourly.time);
    const count = Math.min(24, hourly.time.length - startIndex);
    
    for (let k = 0; k < count; k++) {
        const i = startIndex + k;
        const rawTime = new Date(hourly.time[i]);
        const isCurrentHour = k === 0;
        const timeStr = isCurrentHour ? "Teraz" : `${String(rawTime.getHours()).padStart(2, '0')}:00`;
        
        const wmo = hourly.weather_code[i];
        const wmoInfo = weatherWMO[wmo] || { icon: "cloudy" };
        const rainProb = hourly.precipitation_probability[i] || 0;
        
        // Speed & Direction at selected altitude level
        let sp = 0;
        let dir = 0;
        const v10 = hourly.wind_speed_10m[i];
        const v120 = hourly.wind_speed_120m[i];
        const v180 = hourly.wind_speed_180m[i];
        
        if (selectedAltitudeLevel === 160) {
            sp = v120 + (v180 - v120) * (2 / 3);
            dir = interpolateAngle(hourly.wind_direction_120m[i], hourly.wind_direction_180m[i], 2 / 3);
        } else if (selectedAltitudeLevel === 140) {
            sp = v120 + (v180 - v120) * (1 / 3);
            dir = interpolateAngle(hourly.wind_direction_120m[i], hourly.wind_direction_180m[i], 1 / 3);
        } else if (selectedAltitudeLevel === 120) {
            sp = v120;
            dir = hourly.wind_direction_120m[i];
        } else {
            sp = v10;
            dir = hourly.wind_direction_10m[i];
        }
        
        const node = document.createElement('div');
        node.className = `hour-node ${isCurrentHour ? 'is-now' : ''}`;
        
        node.innerHTML = `
            <span class="hour-time">${timeStr}</span>
            <div class="hour-icon">${getWeatherSVG(wmoInfo.icon, 24)}</div>
            <span class="hour-speed">${formatSpeed(sp)}</span>
            <div class="hour-wind-dir">
                <span class="hour-wind-arrow" style="transform: rotate(${dir}deg)">↑</span>
                <span>${Math.round(dir)}°</span>
            </div>
            <div class="hour-precip-bar" title="Szansa opadów: ${rainProb}%">
                <div class="hour-precip-fill" style="width: ${rainProb}%"></div>
            </div>
        `;
        hourlyScroll.appendChild(node);
    }
}

// Helper: Calculate daily wind statistics from 24h slice at selected altitude
function getDailyWindStatsForLevel(hourly, dayIndex, level) {
    if (!hourly || !hourly.time) return { maxSpeed: 0, minSpeed: 0, maxGust: 0 };
    const startHour = dayIndex * 24;
    const endHour = Math.min(startHour + 24, hourly.time.length);
    let maxSpeed = 0;
    let minSpeed = Infinity;
    let maxGust = 0;
    
    for (let h = startHour; h < endHour; h++) {
        const v10 = hourly.wind_speed_10m ? (hourly.wind_speed_10m[h] || 0) : 0;
        const v120 = hourly.wind_speed_120m ? (hourly.wind_speed_120m[h] || 0) : 0;
        const v180 = hourly.wind_speed_180m ? (hourly.wind_speed_180m[h] || 0) : 0;
        const g10 = hourly.wind_gusts_10m ? (hourly.wind_gusts_10m[h] || 0) : 0;
        
        let sp = 0;
        if (level === 160) {
            sp = v120 + (v180 - v120) * (2 / 3);
        } else if (level === 140) {
            sp = v120 + (v180 - v120) * (1 / 3);
        } else if (level === 120) {
            sp = v120;
        } else {
            sp = v10;
        }
        
        const gust = g10 * (sp / Math.max(v10, 1));
        if (sp > maxSpeed) maxSpeed = sp;
        if (sp < minSpeed) minSpeed = sp;
        if (gust > maxGust) maxGust = gust;
    }
    
    if (minSpeed === Infinity) minSpeed = 0;
    return { maxSpeed, minSpeed, maxGust };
}

// 5. Render 7-Day Pro Forecast (Dynamically reacts to chosen altitude level)
function renderDailyForecast(daily, hourly) {
    dailyForecastList.innerHTML = "";
    const weekdayNames = ["Nd", "Pn", "Wt", "Śr", "Cz", "Pt", "Sb"];
    
    // Update header badge with currently active altitude level
    const dailyBadge = document.getElementById('daily-level-badge');
    if (dailyBadge) {
        let levelDesc = "Główny Hub / Hak dźwigu";
        if (selectedAltitudeLevel === 160) levelDesc = "Szczyt wysięgnika dźwigu";
        else if (selectedAltitudeLevel === 140) levelDesc = "Główny Hub / Hak dźwigu";
        else if (selectedAltitudeLevel === 120) levelDesc = "Niższy Hub / Dźwig";
        else if (selectedAltitudeLevel === 10) levelDesc = "Baza dźwigu / Grunt";
        dailyBadge.textContent = `Wysokość: ${selectedAltitudeLevel}m (${levelDesc})`;
    }
    
    for (let i = 0; i < 7; i++) {
        const rawDate = new Date(daily.time[i]);
        let dayLabel = weekdayNames[rawDate.getDay()];
        if (i === 0) dayLabel = "Dziś";
        if (i === 1) dayLabel = "Jutro";
        
        const tempMax = Math.round(daily.temperature_2m_max[i]);
        const tempMin = Math.round(daily.temperature_2m_min[i]);
        const rainProb = daily.precipitation_probability_max[i] || 0;
        const wmoCode = daily.weather_code[i];
        const weatherInfo = weatherWMO[wmoCode] || { icon: "cloudy" };
        
        // Exact wind stats for selected level on day i
        const stats = getDailyWindStatsForLevel(hourly, i, selectedAltitudeLevel);
        
        let tagPrefix = "Hub";
        if (selectedAltitudeLevel === 160) tagPrefix = "Dźwig";
        else if (selectedAltitudeLevel === 10) tagPrefix = "Baza";
        
        const row = document.createElement('div');
        row.className = 'daily-row';
        
        row.innerHTML = `
            <span class="daily-day-name">${dayLabel}</span>
            <div class="daily-icon-box" title="Opady: ${rainProb}%">
                ${getWeatherSVG(weatherInfo.icon, 26)}
            </div>
            <div class="daily-wind-telemetry">
                <span class="daily-wind-hub" title="Maks. wiatr na wysokości ${selectedAltitudeLevel}m">${tagPrefix} ${selectedAltitudeLevel}m: ${formatSpeed(stats.maxSpeed)} ${getUnitLabel()}</span>
                <span class="daily-wind-ground" title="Maks. poryw na wysokości ${selectedAltitudeLevel}m">Poryw: ${formatSpeed(stats.maxGust)}</span>
            </div>
            <div class="daily-temp-bar-container">
                <span class="daily-temp-min">${tempMin}°</span>
                <span class="daily-temp-max">${tempMax}°</span>
            </div>
        `;
        dailyForecastList.appendChild(row);
    }
}

// 7. Atmospheric 2x2 Metrics
function renderAtmosphericMetrics(current, daily) {
    // Opady
    metricRainSum.textContent = (current.precipitation || 0).toFixed(1);
    metricRainProb.textContent = `Szansa opadów: ${daily.precipitation_probability_max[0]}%`;
    
    // Ciśnienie & Gęstość powietrza: rho = p / (R_spec * T)
    const p_hpa = current.pressure_msl || 1013.25;
    const temp_k = (current.temperature_2m || 15) + 273.15;
    const airDensity = (p_hpa * 100) / (287.058 * temp_k);
    
    metricPressure.textContent = Math.round(p_hpa);
    metricAirDensity.textContent = `Gęstość pow.: ~${airDensity.toFixed(3)} kg/m³`;
    
    // UV
    const uv = daily.uv_index_max[0] || 0;
    metricUv.textContent = uv.toFixed(1);
    let uvText = "Niskie";
    if (uv >= 3 && uv < 6) uvText = "Umiarkowane (Krem)";
    else if (uv >= 6 && uv < 8) uvText = "Wysokie (Okulary)";
    else if (uv >= 8) uvText = "Bardzo wysokie!";
    metricUvDesc.textContent = uvText;
    
    // Wilgotność & Oblodzenie łopat
    const humidity = current.relative_humidity_2m || 0;
    const temp = current.temperature_2m || 0;
    metricHumidity.textContent = humidity;
    
    let icingText = "Oblodzenie: Brak ryzyka";
    if (temp <= 2 && humidity >= 85) {
        icingText = "⚠️ Ryzyko oblodzenia łopat!";
    } else if (humidity >= 90) {
        icingText = "Wysoka mgła w strefie rotora";
    }
    metricFogRisk.textContent = icingText;
}

// Date formatter in Polish
function updateFormattedDate() {
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    const today = new Date();
    currentDateEl.textContent = today.toLocaleDateString('pl-PL', options);
}

// Handle City Search
async function handleSearch() {
    const query = searchInput.value.trim();
    if (!query) return;
    
    locationNameEl.textContent = "Szukam...";
    try {
        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=pl&format=json`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Błąd geokodowania");
        const data = await res.json();
        
        if (!data.results || data.results.length === 0) {
            locationNameEl.textContent = "Nie znaleziono lokalizacji";
            return;
        }
        
        const city = data.results[0];
        const dispName = city.country ? `${city.name}, ${city.country}` : city.name;
        
        fetchWeather(city.latitude, city.longitude, dispName, true);
        searchInput.value = "";
    } catch (err) {
        console.error(err);
        locationNameEl.textContent = "Błąd wyszukiwania";
    }
}

// GPS Request
function requestGPS(isSilent = false) {
    if (!isSilent) locationNameEl.textContent = "Pobieranie GPS...";
    
    if (!navigator.geolocation) {
        if (!isSilent) locationNameEl.textContent = "GPS nieobsługiwany";
        fallbackLocation();
        return;
    }
    
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            const cityName = await getCityNameFromCoords(lat, lon);
            fetchWeather(lat, lon, cityName, true);
        },
        async (error) => {
            console.warn("GPS błąd:", error.message);
            if (!isSilent) fallbackLocation();
        },
        { enableHighAccuracy: true, timeout: 7000, maximumAge: 60000 }
    );
}

// Fallback Location Cascade
async function fallbackLocation() {
    const cached = getCachedLocation();
    if (cached) {
        fetchWeather(cached.lat, cached.lon, cached.name, false);
        return;
    }
    
    fetchWeather(DEFAULT_LAT, DEFAULT_LON, DEFAULT_NAME, false);
}

// Unit Toggle Handler (m/s <-> km/h)
function setupUnitToggle() {
    unitBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            unitBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentUnit = btn.dataset.unit;
            if (latestWeatherData) {
                renderAll(latestWeatherData);
            }
        });
    });
}

// Set Altitude Level across whole application (Hourly + 7-Day + Ladder Highlight)
function setAltitudeLevel(level) {
    selectedAltitudeLevel = parseInt(level, 10);
    
    // 1. Update Hourly Tab active states
    if (hourlyTabs) {
        hourlyTabs.querySelectorAll('.level-tab').forEach(t => {
            if (parseInt(t.dataset.level, 10) === selectedAltitudeLevel) {
                t.classList.add('active');
            } else {
                t.classList.remove('active');
            }
        });
    }
    
    // 2. Update Altitude Ladder row active highlights
    document.querySelectorAll('.altitude-row').forEach(row => {
        if (parseInt(row.dataset.level, 10) === selectedAltitudeLevel) {
            row.classList.add('active-selection');
        } else {
            row.classList.remove('active-selection');
        }
    });
    
    // 3. Re-render both forecasts with selected altitude level
    if (latestWeatherData) {
        renderHourlyTimeline(latestWeatherData.hourly);
        renderDailyForecast(latestWeatherData.daily, latestWeatherData.hourly);
    }
}

// Altitude Selectors Handler (Tabs + Ladder Rows)
function setupAltitudeSelectors() {
    // 1. Hourly level tabs
    if (hourlyTabs) {
        hourlyTabs.querySelectorAll('.level-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                setAltitudeLevel(tab.dataset.level);
            });
        });
    }

    // 2. Clickable altitude ladder rows
    document.querySelectorAll('.altitude-row').forEach(row => {
        row.addEventListener('click', () => {
            if (row.dataset.level) {
                setAltitudeLevel(row.dataset.level);
            }
        });
    });
}

// App Initialization
async function initApp() {
    setupUnitToggle();
    setupAltitudeSelectors();
    
    // Event Listeners
    searchButton.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    gpsButton.addEventListener('click', () => requestGPS(false));
    
    // 1. Instant Cache Load
    const cached = getCachedLocation();
    if (cached) {
        fetchWeather(cached.lat, cached.lon, cached.name, false);
    } else {
        // 2. Silent IP Load
        fetchIPLocation().then(ipLoc => {
            if (ipLoc) {
                fetchWeather(ipLoc.lat, ipLoc.lon, ipLoc.name, true);
            } else {
                fetchWeather(DEFAULT_LAT, DEFAULT_LON, DEFAULT_NAME, false);
            }
        });
    }
    
    // 3. Request High-Precision GPS in background
    requestGPS(true);
    
    // 4. Auto-refresh live telemetry every 15 minutes
    setInterval(() => {
        if (currentLat && currentLon && currentCityName) {
            fetchWeather(currentLat, currentLon, currentCityName, false);
        }
    }, 15 * 60 * 1000);
}

// Launch
initApp();
