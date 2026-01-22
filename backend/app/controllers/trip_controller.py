"""
Trip Controller — Orchestrate trip planning workflow

Coordinates:
1. ComputeRouteHandler — Fetch route from OSRM
2. HosRulesHandler — Apply HOS rules (breaks, resets, cycle)
3. EldLogGenerator — Generate daily logs

This controller is the single source of truth for trip planning logic.
"""

from datetime import datetime, timedelta, timezone
from ..handlers import (
    ComputeRouteHandler,
    HosRulesHandler,
    EldLogGenerator,
    WeatherHandler,
)


def plan_trip(data: dict) -> dict:
    """
    Orchestrate full trip planning: route → HOS simulation → daily logs.

    Args:
        data: {
            "start": {"lat": float, "lng": float, "address": str (optional)},
            "pickup": {"lat": float, "lng": float},
            "dropoff": {"lat": float, "lng": float},
            "start_datetime": "ISO8601 (optional, default 08:00 local)",
            "current_cycle_used_hours": float,
            "routing_provider": "osrm" (optional)
        }

    Returns:
        {
            "route": {...},
            "stops": [...],
            "segments": [...],
            "daily_logs": [...],
            "warnings": [...]
        }
    """
    warnings = []

    # Parse inputs
    start = data.get("start", {})
    pickup = data.get("pickup", {})
    dropoff = data.get("dropoff", {})
    start_datetime_str = data.get("start_datetime", None)
    current_cycle_used_hours = data.get("current_cycle_used_hours", 0)

    # Default start time to 08:00 if not provided
    if start_datetime_str:
        start_datetime = datetime.fromisoformat(
            start_datetime_str.replace("Z", "+00:00")
        )
        if start_datetime.tzinfo is None:
            start_datetime = start_datetime.replace(tzinfo=timezone.utc)
    else:
        start_datetime = datetime.now(timezone.utc).replace(
            hour=8, minute=0, second=0, microsecond=0
        )

    # Step 1: Fetch route from OSRM
    try:
        route_data = ComputeRouteHandler.execute(start, pickup, dropoff)
    except Exception as e:
        warnings.append(f"Routing failed: {str(e)}")
        return {
            "route": None,
            "stops": [],
            "segments": [],
            "daily_logs": [],
            "warnings": warnings,
        }

    # Optional: Enrich with simple current weather for start & dropoff
    start_weather = WeatherHandler.get_current_weather(
        start.get("lat"), start.get("lng")
    )
    dropoff_weather = WeatherHandler.get_current_weather(
        dropoff.get("lat"), dropoff.get("lng")
    )

    # Step 2: Build skeleton timeline
    # start → pickup (drive), pickup (1h ON), pickup → dropoff (drive), dropoff (1h ON)
    skeleton_segments = []

    if len(route_data["legs"]) >= 1:
        leg1 = route_data["legs"][0]
        skeleton_segments.append(
            {
                "status": "D",
                "duration_hours": leg1["duration_hours"],
                "miles": leg1["distance_miles"],
                "note": "Start → Pickup",
            }
        )

    skeleton_segments.append(
        {
            "status": "ON",
            "duration_hours": 1.0,
            "miles": 0,
            "note": "Pickup (1 hour)",
        }
    )

    if len(route_data["legs"]) >= 2:
        leg2 = route_data["legs"][1]
        skeleton_segments.append(
            {
                "status": "D",
                "duration_hours": leg2["duration_hours"],
                "miles": leg2["distance_miles"],
                "note": "Pickup → Dropoff",
            }
        )

    skeleton_segments.append(
        {
            "status": "ON",
            "duration_hours": 1.0,
            "miles": 0,
            "note": "Dropoff (1 hour)",
        }
    )

    # Step 3: Apply HOS rules
    hos_result = HosRulesHandler.execute(
        skeleton_segments, current_cycle_used_hours, start_datetime
    )
    segments = hos_result["segments"]
    warnings.extend(hos_result["warnings"])

    # Step 4: Generate daily logs
    daily_logs = EldLogGenerator.execute(segments)

    # Step 5: Generate stops (fuel, rest, restart points)
    stops = _generate_stops(segments, route_data)

    return {
        "route": route_data,
        "stops": stops,
        "segments": segments,
        "daily_logs": daily_logs,
        "weather": {
            "start": start_weather,
            "dropoff": dropoff_weather,
        },
        "warnings": warnings,
    }


def _generate_stops(segments: list, route_data: dict) -> list:
    """Extract stops from segments (fuel, rest, restart) and place them along the route.

    For this assessment we approximate spatial placement by distributing stops
    along the overall route geometry. This keeps the implementation simple
    while still yielding meaningful map markers.
    """

    stops: list[dict] = []

    # Get full route coordinates (GeoJSON LineString: [lng, lat])
    coords = []
    try:
        coords = route_data.get("geometry", {}).get("coordinates") or []
    except Exception:
        coords = []

    # First collect all stop-like segments so we can spread them along the route
    stop_segments: list[tuple[str, dict]] = []
    for seg in segments:
        note = str(seg.get("note", "")).lower()
        if "fuel" in note:
            stop_segments.append(("fuel", seg))
        elif "rest" in note or "reset" in note:
            stop_segments.append(("rest", seg))

    total_stops = len(stop_segments)

    for index, (stop_type, seg) in enumerate(stop_segments):
        # Default fallback if we cannot derive a coordinate
        lat = 0.0
        lng = 0.0

        if coords:
            # Distribute stops roughly evenly along the coordinate list.
            # Example: with one stop we place it near the middle; with N
            # stops we place them at fractions (1/(N+1)), (2/(N+1)), ...
            frac = float(index + 1) / float(total_stops + 1)
            coord_index = max(0, min(int(len(coords) * frac), len(coords) - 1))
            lng, lat = coords[coord_index]

        label_prefix = "Fuel Stop" if stop_type == "fuel" else "Rest"

        stops.append(
            {
                "type": stop_type,
                "lat": lat,
                "lng": lng,
                "label": f"{label_prefix} {index}",
                "estimated_arrival": seg["start_datetime"],
                "estimated_departure": seg["end_datetime"],
            }
        )

    return stops
