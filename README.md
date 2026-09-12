# SecureShift
---
## Docker Setup Guide

This guide explains how to run the SecureShift project locally using Docker and Docker Compose. The project includes:

- Backend (Node.js + Express)
- Frontend (React - Employer Panel)
- Frontend (React - Admin Panel) — runs on port 3001
- Database (MongoDB)
- Local email capture (Mailpit)

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
  - admin-panel/
    - Dockerfile
    - .env.example
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

Most users do not need to configure anything before starting Docker Compose. If a default host port is already occupied, copy `.env.example` to `.env` and set only the port you need to change. For example, set `BACKEND_HOST_PORT=5001` when port 5000 is occupied, or `ADMIN_FRONTEND_HOST_PORT=3002` if port 3001 is occupied. On macOS, AirPlay Receiver can sometimes use port 5000.

## Recommended Backend Development Workflow

For backend development, run MongoDB and Mailpit through Docker while running
the Node.js backend directly with Nodemon.

From the repository root:

```bash
docker compose up -d mongodb mailpit
docker compose ps
```

Copy the backend environment template if you do not already have a private
`app-backend/.env`:

```bash
cp app-backend/.env.example app-backend/.env
```

For first-time local seed data, temporarily set this value in
`app-backend/.env`:

```env
SEED_ALLOW_LOCAL=true
```

Then run:

```bash
cd app-backend
npm install
npm run seed
npm run dev
```

After seeding completes, restore:

```env
SEED_ALLOW_LOCAL=false
```

Open:

- Swagger: http://localhost:5000/api-docs
- Mailpit: http://localhost:8025
- MongoDB Compass: connect to `localhost:27017`

`npm run seed` creates or updates the deterministic local seed records.
`npm run seed:reset` is delete-only and should not be used for normal
onboarding.

The host-run backend uses these local service addresses:

```env
AUDIT_LOG_ENABLED=true
EMAIL_ENABLED=true
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_AUTH_REQUIRED=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM_EMAIL=local@example.test
```

The Compose backend receives equivalent values from `docker-compose.yml`, but
uses `SMTP_HOST=mailpit` because containers communicate by service name.

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

To build and start all containers (backend, employer frontend, admin frontend, MongoDB, and Mailpit), run the following command from the root directory:

```bash
docker compose up --build
```

`--build` rebuilds the backend, employer frontend, and admin frontend images when needed.

### Admin Panel

The Admin Panel (`frontend-admin`) now starts automatically with `docker compose up`, on its own port (3001 by default) so it never clashes with the Employer Panel.

Log in at `http://localhost:3001/login` with an **admin** account (backend `POST /api/v1/admin/login`); non-admin users are rejected.

If port 3001 is taken, set `ADMIN_FRONTEND_HOST_PORT` in `.env`. To run the Admin Panel outside Docker, see `app-frontend/admin-panel/README.md`.

## AI Knowledge Assistant


The Employer Panel includes an AI Knowledge Assistant using a local
Retrieval-Augmented Generation (RAG) setup.


### Knowledge Base


The AI knowledge base is based on:


```text
app-backend/knowledge-base/docs/onboarding.txt

The generated vector index is stored at:

app-backend/knowledge-base/vectors/onboarding.json

The onboarding guide PDF is stored at:

app-backend/knowledge-base/guide/Onboarding.pdf

The AI implementation is located under:

app-backend/src/ai/

It includes:

Text chunking
Embedding generation
Vector indexing
Vector search and similarity retrieval
Knowledge-base services
Ollama integration
AI controller and routes
Embedding Generation

The vector index is generated using:

app-backend/src/ai/indexing/buildIndex.js

The embedding process uses Ollama with the nomic-embed-text embedding
model.

The process is:

onboarding.txt
      ↓
buildIndex.js
      ↓
Ollama
      ↓
nomic-embed-text
      ↓
vectors/onboarding.json

The current embeddings use 768 dimensions.

Whenever onboarding.txt is changed, the vector index should be
regenerated so that the embeddings remain synchronised with the
knowledge-base content.

Regenerating the Vector Index

Before regenerating the vector index, make sure the Ollama service is
running and the nomic-embed-text model is available.

The indexing implementation is located at:

app-backend/src/ai/indexing/buildIndex.js

Run the indexing process using the command configured for buildIndex.js
in app-backend/package.json.

The generated vector index is:

app-backend/knowledge-base/vectors/onboarding.json

After regeneration, verify that the vector index corresponds to the
current contents of onboarding.txt.

When onboarding.txt is modified, regenerate the vector index before
committing the knowledge-base changes.

Ollama Dependency

The AI Knowledge Assistant requires an Ollama service reachable by the
backend on port 11434.

The required embedding model is:

nomic-embed-text

When running through Docker Compose, the backend should communicate with
the Ollama service using its Docker Compose service name rather than
assuming that localhost refers to the Ollama container.

The AI dependency is:

Backend
   ↓
Ollama :11434
   ↓
nomic-embed-text
AI Docker Services

The AI setup includes the backend, Ollama, AI indexer, and Ollama model
services.

Check the running services with:

docker compose ps

View backend logs:

docker compose logs -f backend

View Ollama logs:

docker compose logs -f ollama

View AI indexer logs:

docker compose logs -f ai-indexer

If the service names differ, use the service names displayed by:

docker compose ps
Updating the AI Knowledge Base

When updating the onboarding knowledge:

Modify:
app-backend/knowledge-base/docs/onboarding.txt
Regenerate the vector index using:
app-backend/src/ai/indexing/buildIndex.js
Verify the generated file:
app-backend/knowledge-base/vectors/onboarding.json
Ensure the generated vectors correspond to the updated
onboarding.txt.
Commit the source document and regenerated vector index together.

This keeps the vector index synchronised with the knowledge-base
content and prevents the stored embeddings from becoming outdated.

## Verifying the Setup

Once Docker is running:

- Backend health: http://localhost:5000/api/v1/health
- Swagger Docs: http://localhost:5000/api-docs
- Frontend (Employer Panel): http://localhost:3000
- Frontend (Admin Panel): http://localhost:3001
- MongoDB: available at localhost:27017 for local tools such as MongoDB Compass
- Mailpit inbox: http://localhost:8025
- Mailpit SMTP: localhost:1025

The backend health and Swagger URLs above assume the default `BACKEND_HOST_PORT=5000`. If you override the backend host port, substitute that value in the URLs. For example, with `BACKEND_HOST_PORT=5001`, use:

- Health: http://localhost:5001/api/v1/health
- Swagger: http://localhost:5001/api-docs

Validation commands:

```bash
docker compose ps
curl http://localhost:5000/api/v1/health
curl http://localhost:3001
```

`docker compose ps` should list `secureshift-frontend-admin` alongside the other services.

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

- The backend waits for the MongoDB and Mailpit healthchecks before starting.
- The Compose backend uses the Compose MongoDB service name `mongodb`.
- Both frontends use `npm start` inside the container. Make sure your `package.json` has the correct start script.
- The `frontend-admin` service maps its container's port 3001 to the host port set by `ADMIN_FRONTEND_HOST_PORT` (default `3001`), keeping it separate from `frontend-employer` on port 3000.

---