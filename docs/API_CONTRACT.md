# API Contract - Trip Planner Backend

## Endpoint: POST /api/trips/plan

**Description**: Plan a trip with FMCSA HOS compliance, route optimization, and multi-day ELD logs.

### Request

```json
{
  "start": {
    "lat": 40.7128,
    "lng": -74.006,
    "address": "New York, NY" // Optional
  },
  "pickup": {
    "lat": 40.7489,
    "lng": -73.968
  },
  "dropoff": {
    "lat": 34.0522,
    "lng": -118.2437
  },
  "current_cycle_used_hours": 0, // Current 70-hour cycle usage (0-70)
  "start_datetime": "2025-01-15T06:00:00Z" // Optional ISO8601; defaults to 08:00 UTC
}
```

### Response (200 OK)

```json
{
  "route": {
    "geometry": {
      "coordinates": [[lng, lat], [lng, lat], ...],
      "type": "LineString"
    },
    "legs": [
      {
        "distance_miles": 95.3,
        "duration_hours": 1.5,
        "steps": [...]
      }
    ],
    "total_distance_miles": 2795.4,
    "total_duration_hours": 42.5
  },

  "stops": [
    {
      "type": "fuel",
      "distance_miles": 1000,
      "duration_hours": 0.5,
      "reason": "Fuel stop (every 1000 miles)"
    },
    {
      "type": "rest",
      "distance_miles": 1500,
      "duration_hours": 10,
      "reason": "Required 10-hour off-duty after 11-hour driving"
    }
  ],

  "segments": [
    {
      "status": "D",  // D=Driving, ON=On-duty, SB=Sleeper berth, OFF=Off-duty
      "duration_hours": 8.5,
      "miles": 637.5,
      "note": "Start → Pickup (driving)",
      "start_time": "2025-01-15T06:00:00Z"
    },
    {
      "status": "ON",
      "duration_hours": 1.0,
      "miles": 0,
      "note": "At pickup location",
      "start_time": "2025-01-15T14:30:00Z"
    },
    {
      "status": "D",
      "duration_hours": 10.5,
      "miles": 788.75,
      "note": "Pickup → Fuel stop",
      "start_time": "2025-01-15T15:30:00Z"
    },
    {
      "status": "ON",
      "duration_hours": 0.5,
      "miles": 0,
      "note": "Fuel stop",
      "start_time": "2025-01-16T02:00:00Z"
    },
    {
      "status": "D",
      "duration_hours": 11.0,
      "miles": 825.0,
      "note": "Fuel stop → Break (11-hour limit)",
      "start_time": "2025-01-16T02:30:00Z"
    },
    {
      "status": "OFF",
      "duration_hours": 10.0,
      "miles": 0,
      "note": "Required 10-hour off-duty reset",
      "start_time": "2025-01-16T13:30:00Z"
    }
  ],

  "daily_logs": [
    {
      "date": "2025-01-15",
      "segments": [
        {
          "status": "D",
          "duration_hours": 8.5,
          "miles": 637.5,
          "note": "Start → Pickup"
        },
        {
          "status": "ON",
          "duration_hours": 1.0,
          "miles": 0,
          "note": "At pickup"
        },
        {
          "status": "D",
          "duration_hours": 10.5,
          "miles": 788.75,
          "note": "Pickup → Fuel"
        },
        {
          "status": "ON",
          "duration_hours": 4.0,
          "miles": 0,
          "note": "End of day (partial)"
        }
      ],
      "totals": {
        "OFF": 0.0,
        "SB": 0.0,
        "D": 19.0,
        "ON": 5.0
      },
      "total_miles": 1426.25,
      "remarks": "Day 1: Driving + on-duty (total 24h)"
    },
    {
      "date": "2025-01-16",
      "segments": [
        {
          "status": "ON",
          "duration_hours": 0.5,
          "miles": 0,
          "note": "Fuel stop (continuing)"
        },
        {
          "status": "D",
          "duration_hours": 11.0,
          "miles": 825.0,
          "note": "Fuel → Break"
        },
        {
          "status": "OFF",
          "duration_hours": 10.0,
          "miles": 0,
          "note": "10-hour reset"
        },
        {
          "status": "D",
          "duration_hours": 2.5,
          "miles": 187.5,
          "note": "Resume driving"
        }
      ],
      "totals": {
        "OFF": 10.0,
        "SB": 0.0,
        "D": 13.5,
        "ON": 0.5
      },
      "total_miles": 1012.5,
      "remarks": "Day 2: Reset + resume (total 24h)"
    }
  ],

  "warnings": [
    "11-hour driving limit exceeded; 10-hour reset required at mile 1625"
  ]
}
```

### Status Codes

| Code | Meaning                                              |
| ---- | ---------------------------------------------------- |
| 200  | Success - Trip planned with all legs and logs        |
| 400  | Bad Request - Missing/invalid coordinates            |
| 500  | Server Error - OSRM routing failed or internal error |

### Error Response

```json
{
  "route": null,
  "stops": [],
  "segments": [],
  "daily_logs": [],
  "warnings": ["Routing failed: Unable to reach OSRM service"]
}
```

---

## Implementation Details

### HOS Rules Enforced (All 5)

1. **11-Hour Driving Limit**: After 11 cumulative hours driving, insert 10-hour OFF
2. **14-Hour Window**: Cannot drive after 14 hours elapsed since shift start; must reset with 10-hour OFF
3. **30-Minute Break**: After 8 cumulative hours driving, must take 30-minute break (or more)
4. **70-Hour / 8-Day Cycle**: Cannot exceed 70 hours in any 8-day period; insert 34-hour restart if exceeded
5. **Fuel Stops**: Every 1,000 miles, insert 30-minute ON-duty fuel stop

### Segment Status Values

| Status | Meaning                   | Example                             |
| ------ | ------------------------- | ----------------------------------- |
| `D`    | **Driving**               | Moving truck from point A to B      |
| `ON`   | **On-Duty (Not Driving)** | Fueling, paperwork, waiting at dock |
| `SB`   | **Sleeper Berth**         | Overnight rest in sleeper cab       |
| `OFF`  | **Off-Duty**              | Rest at motel, time away from truck |

### Timeline Generation Algorithm

1. **Route Computation**: Call OSRM for start→pickup→dropoff
2. **Skeleton Building**: Create D and ON segments for each leg
3. **HOS Simulation**: Apply rules sequentially:
   - Check 30-min break rule → insert if needed
   - Check 11-hour limit → insert 10-hour OFF if violated
   - Check 14-hour window → insert 10-hour OFF if violated
   - Check 70-hour cycle → insert 34-hour SB if violated
   - Add fuel stops → every 1,000 miles
4. **Daily Clipping**: Segment each timeline at midnight boundaries
5. **Normalization**: Ensure daily totals sum to exactly 24 hours

### Daily Log Guarantee

All `daily_logs` entries guarantee:

```python
daily_log["totals"]["OFF"] + \
daily_log["totals"]["SB"] + \
daily_log["totals"]["D"] + \
daily_log["totals"]["ON"] == 24.0
```

---

## Example Usage

### Python (requests)

```python
import requests

payload = {
    "start": {"lat": 40.7128, "lng": -74.0060},
    "pickup": {"lat": 40.7489, "lng": -73.9680},
    "dropoff": {"lat": 34.0522, "lng": -118.2437},
    "current_cycle_used_hours": 0
}

response = requests.post(
    "http://localhost:8000/api/trips/plan",
    json=payload
)
trip = response.json()
print(f"Total distance: {trip['route']['total_distance_miles']} miles")
print(f"Total duration: {trip['route']['total_duration_hours']} hours")
print(f"Daily logs: {len(trip['daily_logs'])} days")
```

### JavaScript (fetch)

```javascript
const payload = {
  start: { lat: 40.7128, lng: -74.006 },
  pickup: { lat: 40.7489, lng: -73.968 },
  dropoff: { lat: 34.0522, lng: -118.2437 },
  current_cycle_used_hours: 0,
};

const response = await fetch("http://localhost:8000/api/trips/plan", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});

const trip = await response.json();
console.log(`Route: ${trip.route.total_distance_miles} miles`);
console.log(`Days: ${trip.daily_logs.length}`);
```

---

## Notes

- **OSRM**: Free routing service (openroute.org); no API key required
- **Timezones**: All times handled as UTC; client should adjust for local TZ
- **Floating-Point**: Daily totals normalized to 24.0 (within rounding error)
- **Performance**: Typical response time 1-3 seconds (depends on OSRM)

---

**Last Updated**: January 22, 2026
