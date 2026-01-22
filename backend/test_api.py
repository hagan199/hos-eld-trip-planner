#!/usr/bin/env python
"""Quick test script to verify backend API is working"""
import time
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

# Add parent for Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "project.settings")

import django

django.setup()

from app.controllers.trip_controller import plan_trip

# Test the controller directly
try:
    result = plan_trip(
        {
            "start": {"lat": 40.7128, "lng": -74.0060},
            "pickup": {"lat": 40.7489, "lng": -73.9680},
            "dropoff": {"lat": 34.0522, "lng": -118.2437},
            "current_cycle_used_hours": 0,
        }
    )

    print("✅ BACKEND API TEST PASSED")
    print(f"  - Route: {result['route']['total_distance_miles']:.1f} miles")
    print(f"  - Duration: {result['route']['total_duration_hours']:.1f} hours")
    print(f"  - Days: {len(result['daily_logs'])} days")
    print(f"  - Warnings: {len(result['warnings'])} warnings")
    sys.exit(0)
except Exception as e:
    print(f"❌ BACKEND API TEST FAILED: {e}")
    import traceback

    traceback.print_exc()
    sys.exit(1)
