# Environment Setup for SecureShift

This document explains the local development environment variables for SecureShift.

## Docker Compose local setup

Follow the [canonical full-stack quickstart](README.md) for first-time setup,
daily restart, all eight services, AI readiness, and destructive-reset warnings.
Compose is self-contained: ordinary local setup needs no private credentials.
The root `.env` is optional and only overrides published host ports.

Default host ports are backend 5000, employer 3000, admin 3001, MongoDB 27017,
and Mailpit SMTP/UI 1025/8025. Use `BACKEND_HOST_PORT=5001` if 5000 is occupied.
Mailpit ports are bound to loopback. Compose supplies the backend configuration;
`app-backend/.env.example` is for a host-run backend only.

Mailpit is the standard local email/OTP workflow: attempt login, open
http://localhost:8025, and use the captured OTP. No external email is sent.

### Backend Running Directly on the Host

Use Node >=22.13.0 (runtime validation: v22.13.1). Stop any Compose backend
with `docker compose stop backend` before using the same port on the host.
Start Mailpit and MongoDB from the repository root:

```bash
docker compose up -d mailpit mongodb
docker compose ps -a
```

For first-time host setup (do not overwrite an existing `.env`):

```bash
cp app-backend/.env.example app-backend/.env
cd app-backend
npm ci
```

Set `PORT=5001` in that file if host port 5000 is occupied. Root Compose port
overrides do not configure a host Node process. Adjust the MongoDB URI and
`SMTP_PORT` if their published ports were overridden. Compose Ollama is not
published to the host: host AI requires a separately reachable Ollama server,
`OLLAMA_HOST`, and both `nomic-embed-text:latest` and `llama3.2:latest` models.
There is no automatic host AI access. See the root README for indexing and the
Compose backend restart/start commands. After successful indexing, start the host
backend with `npm run dev` (stop it first if running) to load regenerated vectors.

The backend template contains local development values; no private credentials
are needed for this local workflow. Its local email defaults use
`SMTP_HOST=localhost`, because a backend process running in WSL, Linux, or macOS reaches Mailpit
through the loopback-bound host port. Start the backend from `app-backend`, attempt login, then open
`http://127.0.0.1:8025`.

`SMTP_HOST=mailpit` works only for the backend container on the Compose network. Do not use
`localhost` for that container: inside it, `localhost` refers to the backend container itself.

For first-time local data, temporarily set:

```env
SEED_ALLOW_LOCAL=true
```

Then run from `app-backend`:

```bash
npm run seed
```

After the seed succeeds, restore `SEED_ALLOW_LOCAL=false`, then start the backend:

```bash
npm run dev
```

`npm run seed:reset` is intentionally delete-only. It removes only the stable
seed records and requires `SEED_RESET_CONFIRM=SecureShiftLocalReset`. It does
not repopulate the database, so it should not be part of normal onboarding.

### Local Audit Logging

Set the following when local audit records should be persisted to
`secureshift_local.auditlogs`:

```env
AUDIT_LOG_ENABLED=true
```

The OTP flow records:

- `OTP_SENT` after Mailpit accepts the OTP email.
- `LOGIN_SUCCESS` with `metadata.step: "OTP_VERIFIED"` after successful OTP
  verification and JWT issuance.
- `OTP_DELIVERY_FAILED` when SMTP delivery fails.

Audit records do not include OTP values, JWTs, SMTP passwords, or email bodies.
Restart the backend after changing `.env` values because environment
configuration is loaded during startup.

In MongoDB Compass, query a user with normal shell syntax:

```javascript
{ user: ObjectId("8a4d53ffcdde6d18139a6e17") }
```

Do not use the Extended JSON `$oid` form in the normal Compass query bar.

### Email Configuration

- `EMAIL_ENABLED=false` disables delivery. Login does not reveal or log an OTP when delivery is
  disabled; it returns the same sanitized unavailable response used for other delivery failures.
- `SMTP_AUTH_REQUIRED=false` is intended for local Mailpit. Leave `SMTP_USER` and `SMTP_PASS` empty;
  the backend omits Nodemailer's `auth` option entirely.
- Production SMTP should set `EMAIL_ENABLED=true`, `SMTP_AUTH_REQUIRED=true`, and provide both
  `SMTP_USER` and `SMTP_PASS`. A partial credential pair is rejected.
- Boolean settings accept only `true` or `false` (case-insensitive). `SMTP_SECURE=true` normally
  corresponds to implicit TLS, commonly on port 465; follow the production provider's guidance.
- `SMTP_FROM_EMAIL` is required whenever email is enabled.

## Employer Panel (React)

For host development only (Compose sets this automatically), the employer panel uses React environment variables. Create a `.env` file in the `app-frontend/employer-panel/` directory:

```bash
# API Configuration
REACT_APP_API_BASE_URL=http://localhost:5000/api/v1

# Development Environment
NODE_ENV=development
```

**Note**: The employer panel now uses a centralized Axios instance with authorization interceptors in `src/lib/http.js`.

## Backend API

The backend API runs on `http://localhost:5000/api/v1` by default.

## Features Implemented

### Centralized Axios Instances

Both applications now have centralized Axios instances that:

1. **Automatically attach JWT tokens** from storage (AsyncStorage for React Native, localStorage for React)
2. **Handle 401 Unauthorized errors** by clearing tokens and triggering logout
3. **Use environment variables** for API base URLs
4. **Include proper timeout handling** (20 seconds)

### Environment Variables

- **Employer Panel**: Uses `REACT_APP_API_BASE_URL`

- **Guard App**: Uses `EXPO_PUBLIC_API_BASE_URL`

### Guard App Environment Variable

The Guard App supports overriding the backend URL using the `EXPO_PUBLIC_API_BASE_URL` environment variable.

Create a `.env` file inside the `guard_app` directory:

```env
EXPO_PUBLIC_API_BASE_URL=http://YOUR_LAN_IP:5000
```

**Notes:**

- On a physical phone, use your computer's LAN IP address.
- On the Android emulator, use `http://10.0.2.2:5000`.
- Do not include `/api/v1` because the app appends it automatically.
- See `guard_app/.env.example` for the template.

## Host application workflow

Use the component README for installation and startup (`npm ci` installs locked
dependencies). Keep existing `.env` values when revisiting setup. Start the host
backend daily with `npm run dev` from `app-backend`; use Mailpit for OTP.
The stable backend check is `npm run test:ci`: the handover snapshot recorded
5 suites and 91/91 passing tests at Node v22.13.1.
