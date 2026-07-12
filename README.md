# SecureShift
---
## Docker Setup Guide

This guide explains how to run the SecureShift project locally using Docker and Docker Compose. The project includes:

- Backend (Node.js + Express)
- Frontend (React - Employer Panel)
- Database (MongoDB)

## Project Structure

```
- docker-compose.yml
- app-backend/
  - Dockerfile
  - .env (Do not push to GitHub)
  - src/
- app-frontend/
  - employer-panel/
    - Dockerfile
    - src/
```

## Prerequisites

Make sure you have the following installed:

- Docker Desktop on Windows 11 with WSL2 integration enabled for your distro.
- Docker Desktop on macOS, including Apple Silicon Macs.
- Docker Engine with the Docker Compose plugin on Linux.

## Configuration

The Compose setup is self-contained for local development. Docker Compose supplies the backend environment through `docker-compose.yml`; it does not read `app-backend/.env.example`.

Use `app-backend/.env.example` only when you run the backend directly outside Docker.

These values are deliberately non-production values:

```env
MONGO_URI=mongodb://secureshift_app:secureshift_app_password@mongodb:27017/secureshift_local?authSource=secureshift_local
PORT=5000
JWT_SECRET=local-dev-jwt-secret-change-me
```

Do not use these credentials outside local Docker onboarding, and do not commit private `.env` files.

Most users do not need to configure anything before starting Docker Compose. If a default host port is already occupied, copy `.env.example` to `.env` and set only the port you need to change. For example, set `BACKEND_HOST_PORT=5001` when port 5000 is occupied. On macOS, AirPlay Receiver can sometimes use port 5000.

## Running the Project

### One-Time Migration for Existing Docker Users

Fresh clones and new users do not need this reset.

If you previously ran the old SecureShift Docker Compose setup, reset your local Docker database once before starting this updated stack. This update changes the local MongoDB database name and credentials, while existing `mongo-data` volumes retain the old users. MongoDB init scripts, including `mongo-init.js`, do not rerun against an existing volume.

Run this once:

```bash
docker compose down -v
docker compose up --build
```

`docker compose down -v` permanently deletes the local Docker MongoDB volume and its local data. After this one-time migration, use `docker compose down` without `-v` for normal shutdown.

To build and start all containers (backend, frontend, and MongoDB), run the following command from the root directory:

```bash
docker compose up --build
```

`--build` rebuilds the backend and employer frontend images when needed.

## Verifying the Setup

Once Docker is running:

- Backend health: http://localhost:5000/api/v1/health
- Swagger Docs: http://localhost:5000/api-docs
- Frontend (Employer Panel): http://localhost:3000
- MongoDB: available at localhost:27017 for local tools such as MongoDB Compass

The backend health and Swagger URLs above assume the default `BACKEND_HOST_PORT=5000`. If you override the backend host port, substitute that value in the URLs. For example, with `BACKEND_HOST_PORT=5001`, use:

- Health: http://localhost:5001/api/v1/health
- Swagger: http://localhost:5001/api-docs

Validation commands:

```bash
docker compose ps
curl http://localhost:5000/api/v1/health
```

On Windows, run the commands from the WSL2 distro where the repository is checked out. If `docker` is not found in WSL, enable integration in Docker Desktop: Settings -> Resources -> WSL integration.

## Stopping the Containers

To stop and remove the running containers while keeping the local database volume:

```bash
docker compose down
```

To stop containers and destroy the local MongoDB database volume:

```bash
docker compose down -v
```

`-v` removes named volumes, including `mongo-data`. Use it only when you want to reset local database contents.

## Notes

- The backend waits for the MongoDB healthcheck before starting.
- The Compose backend uses the Compose MongoDB service name `mongodb`.
- The frontend uses `npm start` inside the container. Make sure your `package.json` has the correct start script.

---
