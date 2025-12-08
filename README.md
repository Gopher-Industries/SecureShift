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

## Environment Setup

Create a `.env` file inside `app-backend/` with the following content:

```env
MONGO_URI=mongodb://<username>:<password>@mongodb:27017/<database>?authSource=admin
PORT=5000
JWT_SECRET=<your-secret-key>
```

Then, update the corresponding MongoDB credentials in your docker-compose.yml file:

```
yaml
Copy code
    environment:
      MONGO_INITDB_ROOT_USERNAME: <username>
      MONGO_INITDB_ROOT_PASSWORD: <password>
      MONGO_INITDB_DATABASE: <database>
```
Do not commit the .env file to GitHub.

## Running the Project

To build and start all containers (backend, frontend, and MongoDB), run the following command from the root directory:

bash
Copy code
docker compose up --build -d

--build: Rebuilds the containers if needed

-d: Runs the containers in detached mode (in the background)

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
-v: Also removes volumes
```

-v: Also removes volumes.

## Notes

- Ensure the PORT in .env matches the exposed port in docker-compose.yml.
- Use consistent credentials in both .env and docker-compose.yml.
- The frontend uses npm start inside the container. Make sure your package.json has the correct start script.

## Contributor Guide

- Fork the repository
- Clone your fork locally
- Create a new branch for your feature or bugfix
- Run the project using Docker (see above)

## Development Workflow

- Use feature branches (<studentID>/feature/<description>) or fix branches (<studentID>/fix/<description>)
- Commit messages should be clear and descriptive

- Open a Pull Request into main when work is ready

## Code Style
- Follow existing formatting in backend (Node.js/Express) and frontend (React)
- Write concise, meaningful commit messages
- Run linting and tests before committing, if available

## Communication
- Use GitHub Issues for tracking bugs and feature requests
- Use Pull Requests for code reviews and discussions
- Add descriptions into GitHub when merge request is submitted (Include images where possible)


## Authentication (JWT FLOW)

- Users log in with email + password at `/api/v1/auth/login.`
- A one-time password (OTP) is emailed to the user.
- OTP is verified at `/api/v1/auth/verify-otp`. 
- success, a JWT token (1 hour expiry) is returned.
- Token must be sent in request headers:
  `Authorization: Bearer <token>`
- Only short-lived access tokens are used (no refresh tokens).


## API Endpoint Summary
## Auth (/api/v1/auth)
POST /register – Register Employer/Admin
POST /register/guard – Register Guard (license upload)
POST /login – Login with email/password
POST /verify-otp – Verify OTP, receive JWT token
POST /eoi – Submit Expression of Interest

## Users (/api/v1/users)
GET /me – Get logged-in user profile
PUT /me – Update logged-in user profile
GET /{id} – Admin: get user by ID
PUT /{id} – Admin: update user by ID
GET /guards – Admin/Employer: list all guards

## Shifts (/api/v1/shifts)
GET / – List shifts (role-specific)
POST / – Create shift (Employer)
PUT /{id}/apply – Apply for a shift (Guard)
PUT /{id}/approve – Approve guard (Employer/Admin)
PUT /{id}/complete – Mark shift complete
GET /myshifts – Get logged-in user’s shifts
PATCH /{id}/rate – Submit rating (Employer/Guard)
GET /history – Get past completed shifts

## Availability (/api/v1/availability)
POST / – Create or update availability
GET /{userId} – Get availability for a user

## Messages (/api/v1/messages)
POST / – Send a message
GET /inbox – Get inbox messages
GET /sent – Get sent messages
GET /conversation/{userId} – Get conversation with a user
PATCH /{messageId}/read – Mark message as read
GET /stats – Get message statistics

## Admin (/api/v1/admin)
POST /login – Admin login
GET /users – Get all active users
GET /users/{id} – Get user by ID
DELETE /users/{id} – Soft-delete user
GET /shifts – Get all shifts
GET /audit-logs – Get audit logs
DELETE /audit-logs/purge – Purge old logs
GET /messages – Get all messages
DELETE /messages/{id} – Delete message
GET /guards/pending – List guards with pending license
PATCH /guards/{id}/license/verify – Verify guard license
PATCH /guards/{id}/license/reject – Reject guard license
---
