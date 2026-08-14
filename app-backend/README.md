# SecureShift Backend

The backend service for **SecureShift**, a shift management platform connecting employers with security guards. This Node.js API powers the authentication, shift coordination, and messaging system across the Guard App, Employer Panel, and Admin Dashboard.

---

## 🧩 Tech Stack

- **Node.js** + **Express.js**
- **MongoDB** via Mongoose (local Docker MongoDB for development; external MongoDB where configured)
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

### 1. Open the backend directory

Clone the SecureShift monorepo using the team repository, then run:

```bash
cd SecureShift/app-backend
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
LICENCE_ENC_KEY=
AUDIT_LOG_ENABLED=true
EMAIL_ENABLED=true
SMTP_HOST=
SMTP_PORT=
SMTP_SECURE=
SMTP_AUTH_REQUIRED=true
SMTP_USER=
SMTP_PASS=
SMTP_FROM_EMAIL=
```

For production SMTP, keep `SMTP_AUTH_REQUIRED=true` and configure `SMTP_USER` and `SMTP_PASS`
together. The backend rejects missing or partial authenticated credentials.

### Local OTP email with Mailpit

The repository Docker Compose stack includes Mailpit, a local SMTP inbox that does not deliver
messages externally.

- Full Compose stack: the backend is preconfigured with `SMTP_HOST=mailpit`,
  `SMTP_PORT=1025`, and `SMTP_AUTH_REQUIRED=false`.
- Backend running directly on WSL, Linux, or macOS: copy `.env.example` to `.env`; it uses
  `SMTP_HOST=localhost`. Start the dependencies with
  `docker compose up -d mailpit mongodb` from the repository root.
- Open `http://127.0.0.1:8025`, attempt login, and read the OTP from the captured message.

Local Mailpit configuration deliberately leaves `SMTP_USER` and `SMTP_PASS` empty. When
`SMTP_AUTH_REQUIRED=false`, the Nodemailer transport has no `auth` property. When
`EMAIL_ENABLED=false`, the backend does not attempt SMTP delivery and never returns or logs the OTP
as a fallback.

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

| Method  | Endpoint | Roles                  | Description                                                                                                                        |
| ------- | -------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `POST`  | `/`      | Guard                  | Create a `SWAP` or `LEAVE` request for a shift assigned to the authenticated guard.                                                |
| `GET`   | `/`      | Guard, Employer, Admin | List shift requests scoped to the authenticated user. Supports `status`, `type`, `page`, and `limit` query parameters.             |
| `GET`   | `/:id`   | Guard, Employer, Admin | Fetch one shift request when it is in the authenticated user scope.                                                                |
| `PATCH` | `/:id`   | Employer, Admin        | Approve or reject a pending shift request with `{ "status": "APPROVED" }` or `{ "status": "REJECTED", "rejectionReason": "..." }`. |

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

## SOS / Emergency API

The backend exposes two authenticated SOS endpoint families:

- Legacy emergency family: `/api/v1/emergency/sos`
- Guard App family: `/api/v1/sos`

Both families use the same controller/service logic. Calling one alias does not call the other alias
or create duplicate writes.

| Method | Path                                 | Roles                        | Description                                                      |
| ------ | ------------------------------------ | ---------------------------- | ---------------------------------------------------------------- |
| `POST` | `/api/v1/emergency/sos`              | `guard`                      | Create an SOS using the legacy emergency route.                  |
| `POST` | `/api/v1/sos/trigger`                | `guard`                      | Create an SOS using the Guard App route contract.                |
| `GET`  | `/api/v1/emergency/sos`              | `admin`, `employer`          | List SOS records visible to the authenticated admin or employer. |
| `GET`  | `/api/v1/emergency/sos/active`       | `guard`, `employer`, `admin` | Get the latest active SOS in the authenticated user's scope.     |
| `GET`  | `/api/v1/sos/active`                 | `guard`, `employer`, `admin` | Guard App alias for active SOS lookup.                           |
| `GET`  | `/api/v1/emergency/sos/:id`          | `guard`, `employer`, `admin` | Get one SOS in the authenticated user's scope.                   |
| `GET`  | `/api/v1/sos/:id`                    | `guard`, `employer`, `admin` | Guard App alias for one SOS status.                              |
| `POST` | `/api/v1/emergency/sos/:id/location` | `guard`                      | Update location for an active SOS owned by the guard.            |
| `POST` | `/api/v1/sos/:id/location`           | `guard`                      | Guard App alias for location update.                             |
| `POST` | `/api/v1/emergency/sos/:id/note`     | `guard`                      | Add or replace guard-provided SOS context.                       |
| `POST` | `/api/v1/sos/:id/note`               | `guard`                      | Guard App alias for note update.                                 |
| `POST` | `/api/v1/emergency/sos/:id/cancel`   | `guard`                      | Cancel an active SOS owned by the guard.                         |
| `POST` | `/api/v1/sos/:id/cancel`             | `guard`                      | Guard App alias for cancellation.                                |
| `PUT`  | `/api/v1/emergency/sos/:id`          | `admin`, `employer`          | Transition SOS status in the authenticated user's scope.         |

SOS responses include both the existing backend `data` field and the Guard App `sos` field. The
Guard App shape includes `_id`, `guardId`, optional `shiftId`, `triggeredAt`, lower-case status,
`location`, `history`, `note`, `emergencyContact`, `cancelledAt`, and `resolvedAt`.

### SOS roles and visibility

- Guards can create SOS records and can read, update location, add notes, or cancel only their own
  SOS records.
- Employers can read or transition only SOS records tied to shifts where `Shift.createdBy` is their
  user ID.
- Admins can read or transition SOS records across the system.
- SOS records without `shiftId` are intentionally not visible to employers. The Guard App must send
  `shiftId` during SOS creation when employer visibility is required.

### SOS status transitions

SOS records use controlled backend statuses:

- `ACTIVE -> ESCALATED`
- `ACTIVE -> RESOLVED`
- `ACTIVE -> CANCELLED`
- `ESCALATED -> RESOLVED`
- `ESCALATED -> CANCELLED`

`RESOLVED` and `CANCELLED` are terminal. Terminal records cannot be reactivated, cancelled again,
resolved again, or updated with new notes/location.

The backend allows only one active SOS per guard at a time. `ACTIVE` and `ESCALATED` both count as
active. After any SOS creation, the guard has a 60-second creation cooldown even if the prior SOS has
already reached a terminal status.

### SOS limitations

- The Guard App currently has `USE_MOCK_SOS = true` in `guard_app/src/api/sos.ts`; until that flag
  changes, the mobile UI continues to use its local mock flow instead of these backend endpoints.
- The SOS backend does not place automatic phone calls.
- The SOS backend does not contact emergency services or any external dispatch provider.
- Firebase/APNs and broader notification infrastructure are intentionally out of scope for the SOS
  backend completion.

---

## 🧪 Testing

```bash
npm run test
```

Unit and integration tests are managed via Jest (or Mocha/Chai if used).

## Timesheet API

Generated timesheets are exposed under `/api/v1/timesheets`.

| Method | Path                          | Roles                        | Description                                                                                                                                       |
| ------ | ----------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST` | `/api/v1/timesheets/generate` | `admin`, `employer`, `guard` | Generate or refresh timesheets for a completed-shift date range. Body requires `startDate` and `endDate` in `YYYY-MM-DD` format.                  |
| `GET`  | `/api/v1/timesheets`          | `admin`, `employer`, `guard` | List generated timesheets visible to the current user. Supports optional `startDate`, `endDate`, `guardId`, `page`, and `limit` query parameters. |
| `GET`  | `/api/v1/timesheets/:id`      | `admin`, `employer`, `guard` | Retrieve one generated timesheet in the current user's scope.                                                                                     |

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

| Role     | Scenario            | Email                          |
| -------- | ------------------- | ------------------------------ |
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
### Local audit logging

SecureShift can persist application audit events to the local
`secureshift_local.auditlogs` collection.

For local development, set:

```env
AUDIT_LOG_ENABLED=true
```

Restart the backend after changing this value because environment configuration
is loaded during application startup.

To inspect recent OTP audit records:

```bash
docker exec secureshift-db mongosh \
  "mongodb://secureshift_app:secureshift_app_password@localhost:27017/secureshift_local?authSource=secureshift_local" \
  --quiet \
  --eval '
    db.auditlogs.find({
      action: {
        $in: ["OTP_SENT", "LOGIN_SUCCESS", "OTP_DELIVERY_FAILED"]
      }
    }).sort({ timestamp: -1 }).limit(10).forEach(printjson);
  '
```

In MongoDB Compass, filter by user with:

```javascript
{ user: ObjectId("8a4d53ffcdde6d18139a6e17") }
```

The normal Compass query bar does not accept the Extended JSON `$oid` form.


---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 🤝 Contributing

Pull requests are welcome! Please open an issue first to discuss changes. Follow the coding guidelines and write clear commit messages.

---

## 👥 Project Maintainers

- **Musa** – [LinkedIn](https://www.linkedin.com/in/muhammad-musa-0132a2197/) | Project Lead & Backend Developer
