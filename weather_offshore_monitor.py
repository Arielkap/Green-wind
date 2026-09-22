#!/usr/bin/env python3
"""
Onshore Crane & Wind Turbine Weather Telemetry (0 LLM Tokens)
Tailored for Crane Operators & Heavy Lifting:
- Units: m/s (Meters per second)
- Altitudes: Ground (10m), 120m, 140m (Hub), 160m (Boom tip)
- 5-Day Crane Forecast with operational cut-offs:
    * Sustained 10-min average > 12.0 m/s -> CRANE STOP
    * Gusts > 18.0 m/s -> CRANE STOP
"""

import json
import os
import sys
import urllib.request
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_FILE = os.path.join(BASE_DIR, "weather_offshore.json")

DEFAULT_LAT = 57.15
DEFAULT_LON = -2.10

def fetch_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Ariel-Crane-Wind-Monitor/2.1"})
    with urllib.request.urlopen(req, timeout=12) as response:
        return json.loads(response.read().decode("utf-8"))

def get_wind_telemetry(lat=DEFAULT_LAT, lon=DEFAULT_LON):
    url = (
        f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}"
        "&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,"
        "weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,pressure_msl"
        "&hourly=temperature_2m,precipitation_probability,precipitation,weather_code,"
        "wind_speed_10m,wind_speed_80m,wind_speed_120m,wind_speed_180m,"
        "wind_direction_10m,wind_direction_120m,wind_direction_180m,wind_gusts_10m"
        "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max"
        "&wind_speed_unit=ms&timezone=auto&forecast_days=5"
    )
    return fetch_json(url)

def evaluate_crane_limits(v_avg, v_gust):
    if v_avg > 12.0 or v_gust > 18.0:
        return "DANGER", "🔴 CRANE STOP! PRZEKROCZONY LIMIT DŹWIGU"
    elif v_avg >= 10.5 or v_gust >= 15.5:
        return "WARNING", "🟡 OSTRZEŻENIE: WARUNKI KRAŃCOWE"
    else:
        return "SAFE", "🟢 BEZPIECZNE WARUNKI: PRACA DOZWOLONA"

def run():
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] 🏗️ Pobieram wiatr onshore i prognozę 5-dniową...")
    data = get_wind_telemetry()
    curr = data.get("current", {})
    hourly = data.get("hourly", {})
    daily = data.get("daily", {})

    # Match current hour index
    time_list = hourly.get("time", [])
    now_str = datetime.now().strftime("%Y-%m-%dT%H:00")
    cur_idx = 0
    for idx, t in enumerate(time_list):
        if t >= now_str:
            cur_idx = idx
            break

    # Current Ground (10m)
    v10 = hourly.get("wind_speed_10m", [curr.get("wind_speed_10m", 0)])[cur_idx]
    dir10 = hourly.get("wind_direction_10m", [curr.get("wind_direction_10m", 0)])[cur_idx]
    gusts10 = hourly.get("wind_gusts_10m", [curr.get("wind_gusts_10m", 0)])[cur_idx]

    # Current 120m
    v120 = hourly.get("wind_speed_120m", [v10 * 1.3])[cur_idx]
    dir120 = hourly.get("wind_direction_120m", [dir10])[cur_idx]
    gusts120 = round(gusts10 * (v120 / max(v10, 0.5)), 1)

    # Current 180m
    v180 = hourly.get("wind_speed_180m", [v120 * 1.15])[cur_idx]

    # Current 140m
    v140 = round(v120 + (v180 - v120) * (1 / 3), 1)
    gusts140 = round(gusts10 * (v140 / max(v10, 0.5)), 1)
    dir140 = dir120

    # Current 160m
    v160 = round(v120 + (v180 - v120) * (2 / 3), 1)
    gusts160 = round(gusts10 * (v160 / max(v10, 0.5)), 1)
    dir160 = dir120

    status_code, status_desc = evaluate_crane_limits(v140, gusts140)

    # 5-Day Forecast calculation per day
    weekday_pl = ["Pn", "Wt", "Śr", "Czw", "Pt", "Sob", "Nd"]
    forecast_days = []
    num_days = min(5, len(daily.get("time", [])))

    for d in range(num_days):
        date_str = daily["time"][d]
        dt = datetime.strptime(date_str, "%Y-%m-%d")
        day_name = "Dziś" if d == 0 else ("Jutro" if d == 1 else weekday_pl[dt.weekday()])

        # Hourly slice for this day (24 hours)
        s_h = d * 24
        e_h = min(s_h + 24, len(time_list))

        h_v10 = hourly["wind_speed_10m"][s_h:e_h]
        h_v120 = hourly["wind_speed_120m"][s_h:e_h]
        h_v180 = hourly["wind_speed_180m"][s_h:e_h]
        h_g10 = hourly["wind_gusts_10m"][s_h:e_h]

        max_v10 = max(h_v10) if h_v10 else 0
        max_g10 = max(h_g10) if h_g10 else 0

        # Calculate max at 140m for this day
        h_v140 = [v120_i + (v180_i - v120_i) * (1 / 3) for v120_i, v180_i in zip(h_v120, h_v180)]
        max_v140 = round(max(h_v140), 1) if h_v140 else round(max_v10 * 1.35, 1)

        # Max gusts at 140m
        h_g140 = [g * (v / max(v_b, 0.5)) for g, v, v_b in zip(h_g10, h_v140, h_v10)]
        max_g140 = round(max(h_g140), 1) if h_g140 else round(max_g10 * 1.35, 1)

        day_status, day_desc = evaluate_crane_limits(max_v140, max_g140)

        forecast_days.append({
            "date": date_str,
            "day_name": day_name,
            "formatted_date": dt.strftime("%d.%m"),
            "temp_max": round(daily.get("temperature_2m_max", [15])[d], 1),
            "rain_prob_max": daily.get("precipitation_probability_max", [0])[d],
            "max_avg_10m": round(max_v10, 1),
            "max_gust_10m": round(max_g10, 1),
            "max_avg_140m": max_v140,
            "max_gust_140m": max_g140,
            "status": day_status,
            "desc": day_desc
        })

    payload = {
        "updated_at": datetime.now().isoformat(),
        "unit": "m/s",
        "limits": {
            "max_sustained_10min_ms": 12.0,
            "max_gust_ms": 18.0
        },
        "status_code": status_code,
        "status_desc": status_desc,
        "reference_altitude_m": 140,
        "levels": {
            "10m": {
                "name": "Ziemia (10m)",
                "wind_speed_avg_ms": round(v10, 1),
                "wind_gusts_ms": round(gusts10, 1),
                "direction_deg": dir10
            },
            "120m": {
                "name": "Wysięgnik Niski (120m)",
                "wind_speed_avg_ms": round(v120, 1),
                "wind_gusts_ms": gusts120,
                "direction_deg": dir120
            },
            "140m": {
                "name": "Hub / Główna Wysokość Dźwigu (140m)",
                "wind_speed_avg_ms": v140,
                "wind_gusts_ms": gusts140,
                "direction_deg": dir140
            },
            "160m": {
                "name": "Szczyt Wysięgnika / Hak (160m)",
                "wind_speed_avg_ms": v160,
                "wind_gusts_ms": gusts160,
                "direction_deg": dir160
            }
        },
        "forecast_5d": forecast_days,
        "temperature_c": curr.get("temperature_2m", 15.0),
        "pressure_hpa": curr.get("pressure_msl", 1015.0)
    }

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)

    print(f"✅ Zapisano telemetrię i prognozę 5-dniową: {len(forecast_days)} dni skalkulowane.")

if __name__ == "__main__":
    run()
