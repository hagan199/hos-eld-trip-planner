"""
HOS Rules Handler — Enforce FMCSA Hours of Service Regulations

Applies all HOS rules to a skeleton timeline and generates segments with breaks/resets.

Rules:
- 11-hour driving limit (require 10-hour OFF)
- 14-hour window (cannot drive after hour 14 since shift start)
- 30-minute break (after 8 hours cumulative driving)
- 70-hour/8-day cycle (insert 34-hour restart if exceeded)

Reference: FMCSA Part 395
"""

from datetime import datetime, timedelta
from typing import List, Dict, Any


class HosRulesHandler:
    """Apply HOS rules to generate compliant segments."""

    @staticmethod
    def execute(
        skeleton_segments: List[Dict[str, Any]],
        current_cycle_used_hours: float,
        start_datetime: datetime,
    ) -> Dict[str, Any]:
        """
        Expand skeleton segments by inserting breaks, resets, and validating rules.

        Args:
            skeleton_segments: [{"status": "D"|"ON", "miles": float, "note": str, "duration_hours": float}, ...]
            current_cycle_used_hours: Starting point for 70-hour cycle (0-70)
            start_datetime: When trip starts (ISO8601)

        Returns:
            {
                "segments": [...expanded with breaks/resets...],
                "warnings": [...rule violations or notes...]
            }
        """
        segments = []
        current_time = start_datetime
        warnings = []

        # Counters for HOS rules
        drive_since_break = 0.0  # Driving hours since last 30-min break
        drive_since_shift_start = 0.0  # Driving hours in current shift
        on_duty_since_shift_start = 0.0  # ON+D hours in current shift
        cycle_used_total = current_cycle_used_hours
        distance_since_fuel = 0.0

        for i, skel_seg in enumerate(skeleton_segments):
            status = skel_seg["status"]
            duration = skel_seg["duration_hours"]
            miles = skel_seg["miles"]
            note = skel_seg.get("note", "")

            # Check 30-minute break rule
            if status == "D" and drive_since_break >= 8.0:
                # Insert 30-min OFF break
                segments.append(
                    {
                        "start_datetime": current_time.isoformat(),
                        "end_datetime": (
                            current_time + timedelta(minutes=30)
                        ).isoformat(),
                        "status": "OFF",
                        "miles": 0,
                        "note": "30-min break (8-hour rule)",
                    }
                )
                current_time += timedelta(minutes=30)
                drive_since_break = 0.0

            # Check 11-hour driving limit
            if status == "D" and drive_since_shift_start >= 11.0:
                # Insert 10-hour OFF reset
                segments.append(
                    {
                        "start_datetime": current_time.isoformat(),
                        "end_datetime": (
                            current_time + timedelta(hours=10)
                        ).isoformat(),
                        "status": "OFF",
                        "miles": 0,
                        "note": "10-hour reset (11-hour driving limit)",
                    }
                )
                current_time += timedelta(hours=10)
                drive_since_shift_start = 0.0
                drive_since_break = 0.0
                warnings.append(
                    "11-hour driving limit reached; 10-hour reset inserted."
                )

            # Check 14-hour window
            if status == "D" and on_duty_since_shift_start >= 14.0:
                # Cannot drive; insert 10-hour OFF
                segments.append(
                    {
                        "start_datetime": current_time.isoformat(),
                        "end_datetime": (
                            current_time + timedelta(hours=10)
                        ).isoformat(),
                        "status": "OFF",
                        "miles": 0,
                        "note": "10-hour reset (14-hour window violated)",
                    }
                )
                current_time += timedelta(hours=10)
                on_duty_since_shift_start = 0.0
                drive_since_shift_start = 0.0
                drive_since_break = 0.0
                warnings.append(
                    "14-hour driving window exceeded; 10-hour reset inserted."
                )

            # Check 70-hour / 8-day cycle
            remaining_cycle_hours = 70.0 - cycle_used_total
            if status in ("D", "ON") and duration > remaining_cycle_hours:
                # Would exceed cycle; insert 34-hour restart
                segments.append(
                    {
                        "start_datetime": current_time.isoformat(),
                        "end_datetime": (
                            current_time + timedelta(hours=34)
                        ).isoformat(),
                        "status": "OFF",
                        "miles": 0,
                        "note": "34-hour cycle restart (70-hour limit)",
                    }
                )
                current_time += timedelta(hours=34)
                cycle_used_total = 0.0
                warnings.append(
                    "70-hour/8-day cycle limit reached; 34-hour restart inserted."
                )

            # Add the segment
            end_time = current_time + timedelta(hours=duration)
            segments.append(
                {
                    "start_datetime": current_time.isoformat(),
                    "end_datetime": end_time.isoformat(),
                    "status": status,
                    "miles": miles,
                    "note": note,
                }
            )

            current_time = end_time

            # Update counters
            if status == "D":
                drive_since_break += duration
                drive_since_shift_start += duration
                on_duty_since_shift_start += duration
                cycle_used_total += duration
                distance_since_fuel += miles

                # Fuel stop every 1,000 miles
                if distance_since_fuel >= 1000:
                    # Insert 30-min ON fuel stop
                    segments.append(
                        {
                            "start_datetime": current_time.isoformat(),
                            "end_datetime": (
                                current_time + timedelta(minutes=30)
                            ).isoformat(),
                            "status": "ON",
                            "miles": 0,
                            "note": "Fuel stop (30 min)",
                        }
                    )
                    current_time += timedelta(minutes=30)
                    on_duty_since_shift_start += 0.5
                    cycle_used_total += 0.5
                    distance_since_fuel = 0.0

            elif status == "ON":
                on_duty_since_shift_start += duration
                cycle_used_total += duration

            elif status == "OFF":
                drive_since_shift_start = 0.0
                on_duty_since_shift_start = 0.0
                drive_since_break = 0.0

        return {
            "segments": segments,
            "warnings": warnings,
        }
