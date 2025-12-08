**SecureShift**

**Docker Setup Guide**

This guide explains how to run the SecureShift project locally using Docker and Docker Compose. 
The project includes:
Backend (Node.js + Express)
Frontend (React – Employer Panel)
Database (MongoDB)

**Project Structure**
├── docker-compose.yml
├── app-backend/
│ ├── Dockerfile
│ ├── .env (Do NOT push)
│ └── src/
├── app-frontend/
│ └── employer-panel/
│ ├── Dockerfile
│ └── src/


**Prerequisites**
*Install:*
Docker
Docker Compose

**Environment Setup**
*Create a file inside app-backend named .env:*
MONGO_URI=mongodb://<username>:<password>@mongodb:27017/<database>?authSource=admin
PORT=5000
JWT_SECRET=<your-secret-key>

*Update docker-compose.yml:*
MONGO_INITDB_ROOT_USERNAME: <username>
MONGO_INITDB_ROOT_PASSWORD: <password>
MONGO_INITDB_DATABASE: <database>
(Do not commit .env files.)

**Running the Project**
*From the root folder, run:*
docker compose up --build -d
    --build = rebuild containers
      -d = run in background

**Verifying the Setup**
Backend → http://localhost:5000
Swagger Docs → http://localhost:5000/api-docs
Frontend (Employer Panel) → http://localhost:3000
MongoDB → localhost:27017 (Compass supported)

**Stopping Containers**
docker compose down -v
(-v removes volumes)

**Notes**
Keep .env PORT the same as Docker port
Use matching DB credentials everywhere
Frontend container uses npm start

**Contributor Guide**
Fork repo
Clone
Create feature branch
Develop using Docker
Commit + push
Open PR into main

**Development Workflow**
*Branch naming:*
studentID/feature/<name>
studentID/fix/<name>
Commit messages must be clear.
Always open PRs for code review.

**Code Style**
Follow backend (Node/Express) + frontend (React) styles
Format before commit
Run lint if available

**Communication**
Use GitHub Issues for bugs/features
Add PR descriptions with screenshots
Discuss code changes via PR comments

**Authentication (JWT Flow)**
User logs in at /api/v1/auth/login
OTP is emailed
OTP verified at /api/v1/auth/verify-otp
JWT token (1 hour expiry) returned
*Client must send:*
Authorization: Bearer <token>
No refresh tokens used.

**API Endpoints**
Auth (/api/v1/auth)
POST /register
POST /register/guard
POST /login
POST /verify-otp
POST /eoi

**Users (/api/v1/users)**
GET /me
PUT /me
GET /{id}
PUT /{id}
GET /guards

**Shifts (/api/v1/shifts)**
GET /
POST /
PUT /{id}/apply
PUT /{id}/approve
PUT /{id}/complete
GET /myshifts
PATCH /{id}/rate
GET /history

**Availability (/api/v1/availability)**
POST /
GET /{userId}

**Messages (/api/v1/messages)**
POST /
GET /inbox
GET /sent
GET /conversation/{userId}
PATCH /{messageId}/read
GET /stats

**Admin (/api/v1/admin)**
POST /login
GET /users
GET /users/{id}
DELETE /users/{id}
GET /shifts
GET /audit-logs
DELETE /audit-logs/purge
GET /messages
DELETE /messages/{id}
GET /guards/pending
PATCH /guards/{id}/license/verify
PATCH /guards/{id}/license/reject
