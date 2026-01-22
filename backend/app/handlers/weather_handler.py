"""Simple weather handler using Open-Meteo public API.

This enriches trips with basic current weather for start and dropoff
locations without requiring an API key.
"""

from __future__ import annotations

from typing import Optional, Dict, Any

import requests


class WeatherHandler:
    BASE_URL = "https://api.open-meteo.com/v1/forecast"

    @classmethod
    def get_current_weather(cls, lat: float, lng: float) -> Optional[Dict[str, Any]]:
        """Fetch simple current weather for given coordinates.

        Returns a small, frontend-friendly payload or None on failure.
        """

        if lat is None or lng is None:
            return None

        try:
            resp = requests.get(
                cls.BASE_URL,
                params={
                    "latitude": lat,
                    "longitude": lng,
                    "current_weather": "true",
                },
                timeout=5,
            )
            resp.raise_for_status()
            data = resp.json()
        except Exception:
            return None

        current = data.get("current_weather") or {}
        if not current:
            return None

        return {
            "temperature_c": current.get("temperature"),
            "windspeed_kmh": current.get("windspeed"),
            "winddirection_deg": current.get("winddirection"),
            "weathercode": current.get("weathercode"),
        }
