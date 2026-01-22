# Architecture — Trip Planner

## Goal

Keep the backend **Django** codebase clean as APIs grow, while keeping the frontend (**React**) simple to ship and easy to extend.

This structure is meant for:

- fast iteration
- clear ownership across modules
- scaling to 5–10 engineers without turning into a mess
- a "service-ish" layout that feels closer to Laravel projects than tutorial Django

---

## Backend (Django) — Recommended Structure ✅

```text
app/
├── controllers/
│   ├── __init__.py
│   ├── trip_controller.py      # Trip planning + simulation orchestration
│   ├── order_controller.py     # (future) Order workflows
│   └── ...
├── handlers/
│   ├── __init__.py
│   ├── compute_route_handler.py       # (future) OSRM/ORS integration
│   ├── generate_eld_logs_handler.py   # (future) Daily log generation
│   └── ...
├── db_ops/
│   ├── __init__.py
│   ├── trips.py                # Trip queries (future)
│   └── ...
├── decorators/
│   ├── __init__.py
│   ├── auth_required.py
│   ├── permission_check.py
│   └── ...
├── event_schema/
│   ├── __init__.py
│   ├── trip_planned.py         # Event payload definitions
│   └── ...
├── response_schemas/
│   ├── __init__.py
│   ├── trip_response.py
│   └── ...
├── management/
│   ├── commands/
│   │   ├── seed_trips.py       # (future) Test data
│   │   └── ...
│   └── __init__.py
├── migrations/
│   ├── 0001_initial.py
│   └── ...
├── tests/
│   ├── test_trip_controller.py
│   ├── test_trip_views.py
│   └── ...
│
├── models.py                   # Django ORM models
├── views/
│   ├── __init__.py
│   ├── trip_views.py           # HTTP endpoints for trip planning
│   ├── auth_views.py           # (future) Auth endpoints
│   └── ...
├── authentication.py           # Custom auth logic (JWT, tokens, etc.)
├── signals.py                  # Django signals (future)
├── apps.py                     # App config
├── __init__.py
└── admin.py                    # Django admin (if needed)
```

---

## What Each Folder Is For

### `views/` (HTTP Layer Only)

This replaces a giant `views.py`.

**Rules:**

- Only request/response handling here.
- Parse inputs, call the right handler/controller, return serialized output.
- No heavy business logic.

**Examples:**

- `trip_views.py`: endpoints for trip planning, daily logs, trip tracking
- `auth_views.py`: login, refresh, permissions checks, etc.

**Pattern:**

```python
# views/trip_views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from ..controllers.trip_controller import plan_trip

class TripPlanView(APIView):
    def post(self, request):
        payload = request.data
        result = plan_trip(payload)
        return Response(result, status=200)
```

---

### `controllers/` (Business Workflows)

Controllers coordinate use-cases.

**Think:** "What should happen when user does X?"

**Good for:**

- Multi-step operations
- Orchestration (call a few handlers/db ops, apply rules, build result)
- Trip simulation coordination

**Bad for:**

- Direct database query code (push that down to `db_ops/`)
- Simple CRUD (use views or handlers directly)

**Example:**

```python
# controllers/trip_controller.py
def plan_trip(data: dict) -> dict:
    """Orchestrate trip planning: fetch route, apply HOS rules, generate logs."""
    route = compute_route(data["start"], data["pickup"], data["dropoff"])
    segments = apply_hos_rules(route, data["current_cycle_used_hours"])
    daily_logs = clip_segments_by_date(segments)
    return {
        "route": route,
        "segments": segments,
        "daily_logs": daily_logs,
        "warnings": [],
    }
```

---

### `handlers/` (Single-Purpose Services)

Handlers do one job well.

**Examples:**

- `ComputeRouteHandler`: Call OSRM/ORS, return geometry + legs
- `ApplyHosRulesHandler`: Insert breaks/resets, validate cycle
- `GenerateEldLogsHandler`: Clip segments at midnight, compute daily totals
- `FuelStopCalculator`: Compute fuel stop locations

**Why?**

- Handlers should be easy to test and reuse across controllers, management commands, signals, and async tasks.
- Encourages composition over monolithic functions.

**Pattern:**

```python
# handlers/compute_route_handler.py
class ComputeRouteHandler:
    def __init__(self, provider="osrm"):
        self.provider = provider

    def execute(self, start, pickup, dropoff):
        # Call OSRM/ORS, return geometry + legs
        pass
```

---

### `db_ops/` (Query/Repository Layer)

This is where query-heavy logic lives.

**Examples:**

- `trips.py`: `get_trips_for_user()`, `lock_trip_for_update()`, `bulk_create_segments()`
- `users.py`: `get_user_by_phone()`, `get_active_drivers()`
- `analytics.py`: complex aggregations, reporting queries

**Why?**

- Makes performance work easier because all "hot queries" are in one place.
- Centralized query optimization = fewer N+1 problems.
- Easier to add database indexing hints.

**Pattern:**

```python
# db_ops/trips.py
def get_trip_with_segments(trip_id):
    """Fetch trip with all segments (optimized query)."""
    return Trip.objects.filter(id=trip_id).prefetch_related("segments").first()

def bulk_create_segments(trip, segments_data):
    """Bulk insert segments for a trip."""
    segments = [Segment(**s, trip=trip) for s in segments_data]
    return Segment.objects.bulk_create(segments)
```

---

### `decorators/`

Request-level helpers:

- Auth/role guards
- Rate-limit wrappers
- Consistent error handling wrappers
- Input validation

**Examples:**

```python
# decorators/auth_required.py
def auth_required(view_func):
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response({"error": "Unauthorized"}, status=401)
        return view_func(request, *args, **kwargs)
    return wrapper

# decorators/permission_required.py
def permission_check(permission):
    def decorator(view_func):
        def wrapper(request, *args, **kwargs):
            if not request.user.has_perm(permission):
                return Response({"error": "Forbidden"}, status=403)
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator
```

---

### `event_schema/`

Definitions for internal events/messages (especially useful if you later move to async tasks or microservices).

**Examples:**

```python
# event_schema/trip_planned.py
class TripPlannedEvent:
    trip_id: str
    segments: list
    warnings: list
    timestamp: str

# event_schema/eld_log_generated.py
class EldLogGeneratedEvent:
    trip_id: str
    date: str
    daily_log: dict
```

**Why?**

- Decouples event producers from consumers.
- Makes it easy to add listeners (email, webhook, analytics) later.
- Prepares for async tasks (Celery, etc.).

---

### `response_schemas/`

This is where you standardize API responses.

**Options:**

- DRF serializers
- Pydantic schemas (if you prefer)
- Plain dataclasses that serializers consume

**Goal:** Consistent response shapes across endpoints.

**Example:**

```python
# response_schemas/trip_response.py
from rest_framework import serializers

class SegmentSerializer(serializers.Serializer):
    start_datetime = serializers.DateTimeField()
    end_datetime = serializers.DateTimeField()
    status = serializers.CharField()
    miles = serializers.FloatField()
    note = serializers.CharField()

class DailyLogSerializer(serializers.Serializer):
    date = serializers.DateField()
    segments = SegmentSerializer(many=True)
    totals = serializers.DictField()
    miles = serializers.FloatField()
    remarks = serializers.ListField()

class TripPlanResponseSerializer(serializers.Serializer):
    route = serializers.DictField()
    stops = serializers.ListField()
    segments = SegmentSerializer(many=True)
    daily_logs = DailyLogSerializer(many=True)
    warnings = serializers.ListField()
```

---

### `management/`

Custom Django management commands.

**Structure:**

```text
management/
├── commands/
│   ├── seed_trips.py
│   ├── sync_permissions.py
│   └── ...
└── __init__.py
```

**Usage:**

```bash
python manage.py seed_trips
python manage.py sync_permissions
```

---

### `authentication.py`

Custom authentication logic (JWT, token auth, API key auth, etc.).

**Keep it isolated** so it doesn't leak into views/controllers.

**Example:**

```python
# authentication.py
from rest_framework.authentication import TokenAuthentication
from rest_framework.exceptions import AuthenticationFailed

class JWTAuthentication(TokenAuthentication):
    """Custom JWT auth for Trip Planner API."""
    pass
```

---

### `models.py`

Django ORM models for the app.

Keep it focused. Don't add business logic here—move it to controllers/handlers.

---

### `signals.py`

Django signals for event-driven side effects.

**Examples:**

```python
# signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Trip

@receiver(post_save, sender=Trip)
def on_trip_created(sender, instance, created, **kwargs):
    if created:
        # Emit event, send notification, etc.
        pass
```

---

## Frontend (React + Vite) — Recommended Structure ✅

```text
frontend/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── TripForm.jsx       # Form to input start/pickup/dropoff
│   │   ├── RouteMap.jsx       # Map view (MapLibre stub)
│   │   ├── DailyLogRenderer.jsx # SVG renderer for daily logs
│   │   └── ...
│   ├── pages/
│   │   ├── TripPlanPage.jsx   # Main page
│   │   ├── TripsListPage.jsx  # (future) List past trips
│   │   └── ...
│   ├── api.js                  # API client (fetch wrapper)
│   ├── App.jsx                 # Root component
│   ├── main.jsx                # Entry point
│   └── index.css               # Global styles
├── index.html
├── vite.config.js
├── package.json
└── README.md
```

---

## What Each Part Is For (Frontend)

### `components/`

Reusable UI building blocks.

- `TripForm.jsx`: Input form for start/pickup/dropoff (address or coords)
- `RouteMap.jsx`: Displays route geometry on a map (MapLibre)
- `DailyLogRenderer.jsx`: SVG/HTML grid showing 24-hour daily log + totals
- `TripSummary.jsx`: Shows trip overview (total miles, duration, warnings)
- `SegmentTimeline.jsx`: Timeline view of all segments

---

### `pages/`

Full page layouts (compose components).

- `TripPlanPage.jsx`: Main page — form, map, logs, summary
- `TripsListPage.jsx`: (future) List of past trip plans

---

### `api.js`

HTTP client — wrapper around `fetch` or axios.

**Example:**

```javascript
// src/api.js
export async function planTrip(payload) {
  const res = await fetch("/api/trips/plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Request failed");
  return res.json();
}
```

---

## URL Routing (Django)

Your project's root `urls.py` should include the `app.urls`:

```python
# project/urls.py (or wherever your root URLconf is)
from django.urls import path, include

urlpatterns = [
    path('', include('app.urls')),  # Includes /api/trips/plan
]
```

Then in `app/urls.py`:

```python
from django.urls import path
from .views import TripPlanView

urlpatterns = [
    path('api/trips/plan', TripPlanView.as_view(), name='trip-plan'),
]
```

---

## Development Setup

### Backend

```bash
# From project root or wherever manage.py is
python -m venv .venv
source .venv/Scripts/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

### Frontend

```bash
# From frontend/
npm install
npm run dev
```

Vite will run on `http://localhost:5173` and proxy requests to `/api/*` → `http://localhost:8000/api/*` (configure in `vite.config.js`).

---

## Next Steps (Implementation Priority)

1. **Wire Django URLs** — Add `include('app.urls')` to project's root `urls.py`.
2. **Build the Trip Controller** — Implement `plan_trip()` with actual routing + HOS simulation.
3. **Add Handlers** — Break out OSRM, HOS rules, ELD log generation into handlers.
4. **Build Frontend Components** — TripForm, RouteMap, DailyLogRenderer.
5. **Tests** — Unit tests for controllers + handlers, integration tests for endpoints.
6. **Deploy** — Docker, CI/CD, production settings.

---

## Key Principles

- **Separation of Concerns:** Views = HTTP only. Controllers = workflow. Handlers = single purpose. DB ops = queries.
- **Reusability:** Handlers can be called from views, management commands, signals, async tasks.
- **Testability:** Each layer can be tested independently.
- **Scalability:** This pattern works for 1–5 engineers _and_ scales to 10+ without major restructuring.
- **Team Ownership:** Clear folders = clear ownership (one engineer owns `handlers/`, another owns `db_ops/`, etc.).

---

## References

- Django REST Framework: https://www.django-rest-framework.org/
- Vite: https://vitejs.dev/
- React: https://react.dev/
- FMCSA HOS Rules: `task.md`
