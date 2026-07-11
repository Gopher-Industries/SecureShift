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

The Compose setup is self-contained for local development. It uses local-only MongoDB credentials defined in `docker-compose.yml` and mirrored in `app-backend/.env.example`.

These values are deliberately non-production values:

```env
MONGO_URI=mongodb://secureshift_app:secureshift_app_password@mongodb:27017/secureshift_local?authSource=secureshift_local
PORT=5000
JWT_SECRET=local-dev-jwt-secret-change-me
```

Do not use these credentials outside local Docker onboarding, and do not commit private `.env` files.

Most users do not need to configure anything before starting Docker Compose. If a default host port is already occupied, copy `.env.example` to `.env` and set only the port you need to change. For example, set `BACKEND_HOST_PORT=5001` when port 5000 is occupied. On macOS, AirPlay Receiver can sometimes use port 5000.

## Running the Project

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
