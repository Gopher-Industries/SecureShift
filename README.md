# SecureShift

## Docker Setup Guide

This guide explains how to run the SecureShift project locally using Docker and Docker Compose.  
The project includes:

- Backend (Node.js + Express)
- Frontend (React – Employer Panel)
- Database (MongoDB)

---

## Project Structure

```text
- docker-compose.yml
- app-backend/
  - Dockerfile
  - .env (Do NOT push)
  - src/
- app-frontend/
  - employer-panel/
    - Dockerfile
    - src/
```

---

## Prerequisites

Install the following:

- Docker  
- Docker Compose

---

## Environment Setup

Create a `.env` file inside `app-backend/`:

```env
MONGO_URI=mongodb://<username>:<password>@mongodb:27017/<database>?authSource=admin
PORT=5000
JWT_SECRET=<your-secret-key>
```

Update your `docker-compose.yml`:

```yaml
MONGO_INITDB_ROOT_USERNAME: <username>
MONGO_INITDB_ROOT_PASSWORD: <password>
MONGO_INITDB_DATABASE: <database>
```

**Do not commit `.env` files to GitHub.**

---

## Running the Project

To build and start all containers:

```bash
docker compose up --build -d
```

- `--build` → rebuilds containers  
- `-d` → run in background

---

## Verifying the Setup

- Backend → http://localhost:5000  
- Swagger Docs → http://localhost:5000/api-docs  
- Employer Panel → http://localhost:3000  
- MongoDB → `localhost:27017` (Compass supported)

---

## Stopping the Containers

```bash
docker compose down -v
```

`-v` removes volumes.

---

## Notes

- Ensure `.env` PORT matches the backend container port.  
- Mongo credentials must match in both `.env` and `docker-compose.yml`.  
- Frontend container must have a valid `npm start` script.

---

## Contributor Guide

- Fork the repository  
- Clone your fork  
- Create a feature branch  
- Develop using Docker  
- Commit + push  
- Open a Pull Request into `main`

---

## Development Workflow

Branch naming style:

```text
<studentID>/feature/<description>
<studentID>/fix/<description>
```

Commit messages should be clear and descriptive.

---

## Code Style

- Follow backend (Node.js/Express) and frontend (React) conventions  
- Format code before committing  
- Run lint when available  

---

## Communication

- Use GitHub Issues for bugs/features  
- Add descriptive PR messages  
- Include screenshots when needed  

---

## Authentication (JWT Flow)

- Login → `/api/v1/auth/login`  
- OTP is emailed  
- OTP verification → `/api/v1/auth/verify-otp`  
- User receives a JWT (1-hour expiry)  
- Requests must include:

```http
Authorization: Bearer <token>
```

No refresh tokens are used.

---

## API Endpoints

### Auth (`/api/v1/auth`)
- POST `/register`
- POST `/register/guard`
- POST `/login`
- POST `/verify-otp`
- POST `/eoi`

### Users (`/api/v1/users`)
- GET `/me`
- PUT `/me`
- GET `/{id}`
- PUT `/{id}`
- GET `/guards`

### Shifts (`/api/v1/shifts`)
- GET `/`
- POST `/`
- PUT `/{id}/apply`
- PUT `/{id}/approve`
- PUT `/{id}/complete`
- GET `/myshifts`
- PATCH `/{id}/rate`
- GET `/history`

### Availability (`/api/v1/availability`)
- POST `/`
- GET `/{userId}`

### Messages (`/api/v1/messages`)
- POST `/`
- GET `/inbox`
- GET `/sent`
- GET `/conversation/{userId}`
- PATCH `/{messageId}/read`
- GET `/stats`

### Admin (`/api/v1/admin`)
- POST `/login`
- GET `/users`
- GET `/users/{id}`
- DELETE `/users/{id}`
- GET `/shifts`
- GET `/audit-logs`
- DELETE `/audit-logs/purge`
- GET `/messages`
- DELETE `/messages/{id}`
- GET `/guards/pending`
- PATCH `/guards/{id}/license/verify`
- PATCH `/guards/{id}/license/reject`
