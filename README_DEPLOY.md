# Deployment Instructions

## Docker (Local Development)

This project includes a Docker composition to run both the Frontend and Backend locally.

### Prerequisites

- Docker Desktop installed and running.

### Steps

1. Open a terminal in the root of the project.
2. Run data build and start:
   ```bash
   docker-compose up --build
   ```
3. Access the application:
   - Frontend: [http://localhost:5173](http://localhost:5173)
   - Backend API: [http://localhost:8000/api/docs/](http://localhost:8000/api/docs/) (Swagger UI)

### Troubleshooting

- If you see database errors, you might need to run migrations (though SQLite is included, it might need init in a fresh container):
  ```bash
  docker-compose exec backend python manage.py migrate
  ```

---

## Vercel Deployment

This project is configured for Vercel Monorepo deployment (Frontend + Serverless Backend).

### Steps

1. Install Vercel CLI or link your repository to Vercel dashboard.
2. If using Vercel CLI:
   ```bash
   vercel
   ```
3. If using Vercel Dashboard:
   - Import the repository.
   - Select **Vite** as the Framework Preset.
   - **Root Directory**: Leave empty (project root).
   - **Build Settings**: Vercel should auto-detect, but if asked:
     - Frontend Build Command: `npm run build` (inside frontend)
     - Output Directory: `frontend/dist`
   - **Environment Variables**:
     - `VITE_API_BASE`: `https://your-project-name.vercel.app` (Your production URL, or leave empty if you update api.js to support relative paths)
     - `DJANGO_SECRET_KEY`: (Set a random string)
     - `DEBUG`: `False`
     - `ALLOWED_HOSTS`: `.vercel.app` (or `*`)

**Note on Vercel Backend:**
The `vercel.json` configures the backend (`backend/project/wsgi.py`) to handle requests to `/api/*`. The database is SQLite, which is **read-only/ephemeral** on Vercel. For a real production app, configure `DATABASE_URL` to point to an external Postgres database (e.g., Supabase, Neon).
