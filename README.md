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

- Docker
- Docker Compose

## Configuration

Create a `.env` file inside `app-backend/` with the following content:

```env
MONGO_URI=mongodb://<username>:<password>@mongodb:27017/<database>?authSource=admin
PORT=5000
JWT_SECRET=<your-secret-key>
```

Then, update the corresponding MongoDB credentials in your `docker-compose.yml` file:

```yaml
    environment:
      MONGO_INITDB_ROOT_USERNAME: <username>
      MONGO_INITDB_ROOT_PASSWORD: <password>
      MONGO_INITDB_DATABASE: <database>
```

Do not commit the `.env` file to GitHub.

## Running the Project

To build and start all containers (backend, frontend, and MongoDB), run the following command from the root directory:

```bash
docker compose up --build -d
```

--build: Rebuilds the containers if needed.  
-d: Runs the containers in detached mode (in the background).

## Verifying the Setup

Once Docker is running:

- Backend: http://localhost:5000  
- Swagger Docs: http://localhost:5000/api-docs  
- Frontend (Employer Panel): http://localhost:3000  
- MongoDB: Available at localhost:27017 (use tools like MongoDB Compass)

## Stopping the Containers

To stop and remove all running containers:

```bash
docker compose down -v
```

-v: Also removes volumes.

## Notes

- Ensure the PORT in `.env` matches the exposed port in `docker-compose.yml`.
- Use consistent credentials in both `.env` and `docker-compose.yml`.
- The frontend uses `npm start` inside the container. Make sure your `package.json` has the correct start script.

---