# SecureShift Backend

The backend service for **SecureShift**, a shift management platform connecting employers with security guards. This Node.js API powers the authentication, shift coordination, and messaging system across the Guard App, Employer Panel, and Admin Dashboard.

---

## 🧩 Tech Stack

- **Node.js** + **Express.js**
- **MongoDB Atlas** (via Mongoose)
- **JWT Authentication** with 2FA support
- **RESTful API**
- **Swagger UI** for API documentation
- **Dockerized** for container deployment
- **Cloud Deployment** (GCP / DockerHub / Kubernetes)
- **Notifications** (Guard shift updates & messaging)

---

## 📦 Project Structure

```
/secureshift-backend
├── controllers/        # Route logic
├── models/             # Mongoose schemas
├── routes/             # API endpoints
├── middleware/         # Auth, error handlers
├── utils/              # Helpers (e.g., notifications)
├── config/             # DB and env setup
├── swagger.js          # Swagger UI setup
├── Dockerfile          # Container setup
├── .dockerignore       # Docker exclusions
├── .env                # Environment variables (ignored)
├── server.js           # Entry point
├── app.js              # Express config & middleware
```

---

## 🚀 Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/musahex/secureshift-backend.git
cd secureshift-backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Add environment variables

Create a `.env` file in the root:

```env
# MONGO_URI is REQUIRED. The backend will not start without it.
MONGO_URI=

JWT_SECRET=
SMTP_HOST=
SMTP_PORT=
SMTP_SECURE=
SMTP_USER=
SMTP_PASS=
```

### 4. Start the server

```bash
npm start
```

Visit: [http://localhost:5000/api-docs](http://localhost:5000/api-docs) for Swagger UI.

---

## 🐳 Docker Usage

### Build the image

```bash
docker build -t musahx/secureshift-backend .
```

### Run the container

```bash
docker run -p 5000:5000 --env-file .env musahx/secureshift-backend
```

### Push to Docker Hub

```bash
docker push musahx/secureshift-backend
```

### Run Docker Compose

```bash
docker compose build
docker compose up
```

> Replace `musahx` with your DockerHub username.

---

## 📘 API Documentation

API is documented using **Swagger UI**.
Once the server is running, open:

```
http://localhost:5000/api-docs
```

You can explore, test, and understand the structure of all API endpoints there.

---

## 🔐 Features

- Guard & Employer registration/login
- JWT-based authentication with 2FA
- Shift posting, acceptance, and tracking
- Employer–Guard messaging
- Admin panel access to all records
- Real-time notifications (e.g., shift updates)
- API docs with Swagger UI
- Fully containerized backend with Docker

## Shift Request API

Base path: `/api/v1/shift-requests`

| Method    | Endpoint | Roles                  | Description                                                                                                                            |
| --------- | -------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `POST`  | `/`    | Guard                  | Create a `SWAP` or `LEAVE` request for a shift assigned to the authenticated guard.                                                |
| `GET`   | `/`    | Guard, Employer, Admin | List shift requests scoped to the authenticated user. Supports `status`, `type`, `page`, and `limit` query parameters.         |
| `GET`   | `/:id` | Guard, Employer, Admin | Fetch one shift request when it is in the authenticated user scope.                                                                    |
| `PATCH` | `/:id` | Employer, Admin        | Approve or reject a pending shift request with `{ "status": "APPROVED" }` or `{ "status": "REJECTED", "rejectionReason": "..." }`. |

### Roles and scoping

- Guards can create requests only for shifts they are assigned to through `guardIds` or `acceptedBy`.
- Guards can list and view only their own submitted shift requests.
- Employers can list, view, approve, or reject requests for shifts they created or shifts attached to active branches they own.
- Admins can list, view, approve, or reject shift requests across the system.

### Status transitions

Shift requests start as `PENDING`. The only allowed terminal transitions are:

- `PENDING -> APPROVED`
- `PENDING -> REJECTED`

Terminal requests cannot transition again.

### Approval limitation

Approving or rejecting a shift request currently records the decision on the `ShiftRequest` only. It does not alter shift assignment, guard rosters, availability, notifications, replacement-shift ownership, or target-guard state. Any roster-changing workflow requires separate product sign-off and implementation.

---

## 🧪 Testing

```bash
npm run test
```

Unit and integration tests are managed via Jest (or Mocha/Chai if used).

## Timesheet API

Generated timesheets are exposed under `/api/v1/timesheets`.

| Method   | Path                            | Roles                              | Description                                                                                                                                                 |
| -------- | ------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST` | `/api/v1/timesheets/generate` | `admin`, `employer`, `guard` | Generate or refresh timesheets for a completed-shift date range. Body requires `startDate` and `endDate` in `YYYY-MM-DD` format.                      |
| `GET`  | `/api/v1/timesheets`          | `admin`, `employer`, `guard` | List generated timesheets visible to the current user. Supports optional `startDate`, `endDate`, `guardId`, `page`, and `limit` query parameters. |
| `GET`  | `/api/v1/timesheets/:id`      | `admin`, `employer`, `guard` | Retrieve one generated timesheet in the current user's scope.                                                                                               |

Timesheet generation only uses shifts that are `completed`, assigned through `acceptedBy`,
and have completed attendance with `guardId`, `shiftId`, `checkInTime`, and `checkOutTime`.
Generation is idempotent: each `shiftId` and `guardId` pair has one timesheet, and repeated
generation updates that record rather than creating duplicates.

RBAC visibility follows the current backend ownership rules:

- Admins can generate and view all timesheets.
- Guards can generate and view only their own timesheets.
- Employers can generate and view timesheets for shifts where `Shift.createdBy` is their user ID.

The standard shift creation flow validates `siteId` against an active `Branch.employerId` owned by
the creating employer, then stores that employer in `Shift.createdBy`. A branch-based ownership
case remains possible for imported/admin-created data: if a shift is attached to a branch owned by
an employer but `createdBy` is a different user, the timesheet scope follows `createdBy` and will
not treat the branch owner as the timesheet employer.

Payable hours are attendance-based. `actualHours` is the raw check-in to check-out duration.
`Shift.breakTime` is stored in minutes and is treated as an unpaid break, so timesheets calculate
`payableHours` as `max(actualHours - breakTime / 60, 0)`. Payable hours are not capped at scheduled
hours, preserving legitimate overtime.

## Local development seed data

The seed commands are for local development only. They refuse production, Atlas/SRV, remote hosts,
and every database except the exact names `secureshift_local`, `secureshift_dev`, and
`secureshift_test`. The seed CLI uses only the explicit `MONGO_URI`; it never uses the server
connection fallback.

### Backend outside Docker, MongoDB in Docker

Start MongoDB from the repository root:

```bash
docker compose up -d mongodb
```

When Node runs directly on the host, use `localhost` and the published MongoDB port. In
`app-backend/.env`, configure the authenticated URI and explicitly enable local seeding:

```env
NODE_ENV=development
SEED_ALLOW_LOCAL=true
MONGO_URI=mongodb://secureshift_app:secureshift_app_password@localhost:27017/secureshift_local?authSource=secureshift_local
```

Then run from `app-backend`:

```bash
npm run seed
SEED_RESET_CONFIRM=SecureShiftLocalReset npm run seed:reset
```

### Seed alongside Docker Compose

Containers on the Compose network reach MongoDB by its service hostname, `mongodb`, rather than
`localhost`. The backend service already has this authenticated internal URI:

```env
MONGO_URI=mongodb://secureshift_app:secureshift_app_password@mongodb:27017/secureshift_local?authSource=secureshift_local
```

From the repository root, run one-off backend containers with the required seed opt-in:

```bash
docker compose run --rm -e SEED_ALLOW_LOCAL=true backend npm run seed
docker compose run --rm -e SEED_ALLOW_LOCAL=true -e SEED_RESET_CONFIRM=SecureShiftLocalReset backend npm run seed:reset
```

The seed is idempotent and uses stable ObjectIds. Running it again updates the same local records.
Reset deletes only those stable seed IDs and requires the exact confirmation value shown above.

All test accounts use the local-only password `SecureShift1!`:

| Role     | Scenario            | Email                            |
| -------- | ------------------- | -------------------------------- |
| Admin    | Admin access        | `admin.local@secureshift.test` |
| Employer | Operations employer | `ops.local@secureshift.test`   |
| Employer | Venue employer      | `venue.local@secureshift.test` |
| Guard    | Approved licence    | `mia.guard@secureshift.test`   |
| Guard    | Pending licence     | `noah.guard@secureshift.test`  |
| Guard    | Rejected licence    | `isha.guard@secureshift.test`  |
| Guard    | Expired licence     | `liam.guard@secureshift.test`  |

Employer and guard login still uses the normal OTP flow. This seed does not bypass OTP. Admin login
uses the existing admin authentication endpoint.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 🤝 Contributing

Pull requests are welcome! Please open an issue first to discuss changes. Follow the coding guidelines and write clear commit messages.

---

## 👥 Project Maintainers

- **Musa** – [LinkedIn](https://www.linkedin.com/in/muhammad-musa-0132a2197/) | Project Lead & Backend Developer
