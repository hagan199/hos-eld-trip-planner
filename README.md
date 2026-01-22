# HOS ELD Trip Planner

A full-stack application that helps truck drivers plan routes that comply with FMCSA Hours-of-Service (HOS) rules while generating daily ELD logs and summaries.

## Live URLs

- Frontend (Vercel): https://hos-eld-trip-planner-o5e92ycc8-emmanuel-hagans-projects.vercel.app/
- Backend API (Render): https://hos-eld-trip-planner-api.onrender.com/
  - Health check: https://hos-eld-trip-planner-api.onrender.com/healthz

## Features

- HOS-aware trip planning with driving/on-duty/off-duty segmentation
- Enforces 11-hour driving limit, 14-hour duty window, 30-minute break, and 60/70-hour cycle
- Generates compliant daily log visualisations and summaries
- Route visualisation with map overlays and suggested stops

## Tech Stack

- Frontend: React 18 + Vite, Leaflet for mapping
- Backend: Django 5 + Django REST Framework
- Infrastructure: Docker, Render (API), Vercel (frontend)
- Database: PostgreSQL on Render (defaults to SQLite locally)

## Getting Started Locally

1. Copy the backend environment example and adjust values as needed:

   ```bash
   cp backend/.env.example backend/.env
   ```

2. Start the stack with Docker Compose:

   ```bash
   docker-compose up --build
   ```

   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000 (health check at /healthz)

3. To run outside Docker, install dependencies and run each service from the frontend and backend folders (`npm install && npm run dev`, `pip install -r requirements.txt && python manage.py runserver`).

## Deployment Notes

- Frontend is deployed to Vercel with `VITE_API_BASE_URL` set to the Render backend URL.
- Backend is deployed to Render using the Dockerfile in backend/ and automatically runs migrations and collects static files on start.
- CORS is enabled for assessment purposes to allow requests from the Vercel deployment.
