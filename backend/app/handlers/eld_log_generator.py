"""
ELD Log Generator — Generate Daily Log Sheets

Clips segments at midnight boundaries and computes daily totals.
Produces one daily_log entry per calendar day the trip spans.
"""

from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any


class EldLogGenerator:
    """Generate daily log sheets from segments."""

    @staticmethod
    def execute(segments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Clip segments at midnight and compute daily totals.

        Args:
            segments: Full segment list with ISO datetimes

        Returns:
            [
                {
                    "date": "2025-01-22",
                    "segments": [...clipped to this date...],
                    "totals": {"OFF_hours": float, "SB_hours": float, "D_hours": float, "ON_hours": float},
                    "miles": float,
                    "remarks": [...]
                },
                ...
            ]
        """
        if not segments:
            return []

        daily_logs = []

        # Parse first and last times (ensure timezone aware)
        first_start = datetime.fromisoformat(
            segments[0]["start_datetime"].replace("Z", "+00:00")
        )
        last_end = datetime.fromisoformat(
            segments[-1]["end_datetime"].replace("Z", "+00:00")
        )

        # Get date range (use UTC date)
        current_date = first_start.date()
        end_date = last_end.date()

        while current_date <= end_date:
            # Midnight boundaries for this date (in UTC)
            day_start = datetime.combine(
                current_date, datetime.min.time(), tzinfo=timezone.utc
            )
            day_end = datetime.combine(
                current_date + timedelta(days=1),
                datetime.min.time(),
                tzinfo=timezone.utc,
            )

            # Clip segments to this day
            clipped_segments = []
            totals = {
                "OFF_hours": 0.0,
                "SB_hours": 0.0,
                "D_hours": 0.0,
                "ON_hours": 0.0,
            }
            total_miles = 0.0
            remarks = set()

            for seg in segments:
                seg_start = datetime.fromisoformat(
                    seg["start_datetime"].replace("Z", "+00:00")
                )
                seg_end = datetime.fromisoformat(
                    seg["end_datetime"].replace("Z", "+00:00")
                )

                # Check if segment overlaps this day
                if seg_end <= day_start or seg_start >= day_end:
                    continue

                # Clip segment to day boundaries
                clipped_start = max(seg_start, day_start)
                clipped_end = min(seg_end, day_end)

                clipped_duration = (
                    clipped_end - clipped_start
                ).total_seconds() / 3600.0
                clipped_miles = seg["miles"] * (
                    clipped_duration / ((seg_end - seg_start).total_seconds() / 3600.0)
                    if (seg_end - seg_start).total_seconds() > 0
                    else 0
                )

                clipped_segments.append(
                    {
                        "start_datetime": clipped_start.isoformat(),
                        "end_datetime": clipped_end.isoformat(),
                        "status": seg["status"],
                        "miles": clipped_miles,
                        "note": seg["note"],
                    }
                )

                # Accumulate totals
                totals[f"{seg['status']}_hours"] += clipped_duration
                total_miles += clipped_miles

                # Add remarks (location/note info)
                if seg["note"]:
                    remarks.add(seg["note"])

            # Ensure totals sum to 24 hours (within floating-point tolerance)
            total_hours = sum(totals.values())
            if total_hours > 0:
                # Normalize if slightly off (floating-point rounding)
                scale = 24.0 / total_hours if total_hours > 24 else 1.0
                if 23.9 < total_hours < 24.1:
                    scale = 24.0 / total_hours

                for key in totals:
                    totals[key] *= scale if total_hours > 24 else 1.0

            daily_logs.append(
                {
                    "date": current_date.isoformat(),
                    "segments": clipped_segments,
                    "totals": {k: round(v, 2) for k, v in totals.items()},
                    "miles": round(total_miles, 2),
                    "remarks": sorted(list(remarks)),
                }
            )

            current_date += timedelta(days=1)

        return daily_logs
