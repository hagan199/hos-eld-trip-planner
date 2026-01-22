# Trip Planner - Full Stack ELD & HOS System

A Django + React application for planning commercial truck trips while enforcing FMCSA Hours of Service (HOS) rules and generating ELD logs.

## 📚 Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - Instructions to run the project locally.
- **[README_DEPLOY.md](README_DEPLOY.md)** - Deployment instructions (Vercel/Railway).
- **[TESTING_GUIDE.md](TESTING_GUIDE.md)** - Verification steps and test scenarios.
- **[API_CONTRACT.md](API_CONTRACT.md)** - API specification for the backend.
- **[architecture.md](architecture.md)** - System design and component overview.

## 🏗 Project Structure

- `backend/` - Django Rest Framework application.
- `frontend/` - React + Vite application.
- `ASSESSMENT.md` - Original assessment requirements and rubric.

## ✨ Features

- **Route Planning**: Calculates optimal truck routes using OSRM.
- **HOS Compliance**: Enforces 11/14/70 rules and 30-minute breaks.
- **ELD Logs**: Generates compliant daily log grids.
- **Visualization**: Interactive map with route segments and stops.
