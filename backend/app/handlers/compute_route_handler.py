"""
Compute Route Handler — OSRM Integration

Queries the free OSRM API to fetch route geometry and leg information.
No authentication required. Handles distance in km → miles conversion.
"""

import requests
import polyline
from datetime import timedelta


class ComputeRouteHandler:
    """Query OSRM for route legs between waypoints."""

    OSRM_BASE_URL = "https://router.project-osrm.org/route/v1/driving"

    @staticmethod
    def execute(start, pickup, dropoff):
        """
        Fetch route from start → pickup → dropoff via OSRM.

        Args:
            start: {"lat": float, "lng": float, "address": str (optional)}
            pickup: {"lat": float, "lng": float}
            dropoff: {"lat": float, "lng": float}

        Returns:
            {
                "geometry": GeoJSON LineString,
                "total_distance_miles": float,
                "total_duration_hours": float,
                "legs": [
                    {
                        "distance_miles": float,
                        "duration_hours": float,
                        "geometry": GeoJSON LineString
                    },
                    ...
                ]
            }
        """
        # Build waypoints: start → pickup → dropoff
        waypoints = [
            (start["lng"], start["lat"]),  # OSRM uses lng,lat order
            (pickup["lng"], pickup["lat"]),
            (dropoff["lng"], dropoff["lat"]),
        ]

        # Format for OSRM: lng,lat;lng,lat;lng,lat
        coords_str = ";".join(f"{lng},{lat}" for lng, lat in waypoints)
        url = f"{ComputeRouteHandler.OSRM_BASE_URL}/{coords_str}"

        # Request with geometry + steps - note: OSRM doesn't return leg geometry by default, so we use full overview
        params = {"geometries": "polyline", "overview": "full", "steps": "false"}

        try:
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()

            if data["code"] != "Ok":
                raise Exception(f"OSRM error: {data['code']}")

            route = data["routes"][0]

            # Decode geometry
            full_geometry = polyline.decode(route["geometry"])
            coords = [[lng, lat] for lat, lng in full_geometry]

            # Extract legs: start→pickup, pickup→dropoff
            legs = []
            total_distance_m = 0
            total_duration_s = 0

            for leg in route["legs"]:
                distance_m = leg["distance"]
                duration_s = leg["duration"]

                # OSRM doesn't provide leg geometry, so we use the full route geometry for now
                # In production, could split geometry proportionally by leg distance

                legs.append(
                    {
                        "distance_miles": ComputeRouteHandler._meters_to_miles(
                            distance_m
                        ),
                        "duration_hours": duration_s / 3600.0,
                        "geometry": {
                            "type": "LineString",
                            "coordinates": coords,  # Use full route geometry for now
                        },
                    }
                )

                total_distance_m += distance_m
                total_duration_s += duration_s

            return {
                "geometry": {"type": "LineString", "coordinates": coords},
                "total_distance_miles": ComputeRouteHandler._meters_to_miles(
                    total_distance_m
                ),
                "total_duration_hours": total_duration_s / 3600.0,
                "legs": legs,
            }

        except requests.exceptions.RequestException as e:
            raise Exception(f"OSRM request failed: {e}")

    @staticmethod
    def _meters_to_miles(meters):
        """Convert meters to miles."""
        return meters * 0.000621371
