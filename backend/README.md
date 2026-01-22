# Backend - Trip Planner API

Django REST Framework backend for FMCSA HOS-compliant trip planning.

## Structure

```
backend/
├── manage.py           # Django CLI
├── project/            # Django project config
│   ├── settings.py     # Django settings
│   ├── urls.py         # Main URL router
│   ├── wsgi.py         # WSGI app
│   └── asgi.py         # ASGI app
└── app/                # Trip planner app
    ├── controllers/    # Business logic orchestration
    ├── handlers/       # Single-responsibility handlers
    ├── views/          # HTTP API endpoints
    └── urls.py         # App URL patterns
```

## Installation

```bash
cd backend
pip install -r ../requirements.txt
```

## Run Server

```bash
cd backend
python manage.py runserver 0.0.0.0:8000
```

## API Endpoints

- **POST /api/trips/plan** - Plan a trip with HOS rules
  - Input: `{ start, pickup, dropoff, current_cycle_used_hours, start_datetime }`
  - Output: `{ route, stops, segments, daily_logs, warnings }`

## Environment

- Python 3.13
- Django 6.0+
- Django REST Framework 3.14+
