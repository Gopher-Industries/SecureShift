# Environment Setup for SecureShift

This document explains the local development environment variables for SecureShift.

## Docker Compose Local Setup

### One-Time Migration for Existing Docker Users

If you previously ran the old SecureShift Docker Compose setup, reset your local Docker database once before starting this updated stack. This PR changes the local MongoDB database name and credentials, and existing `mongo-data` volumes retain the old users. MongoDB init scripts, including `mongo-init.js`, do not rerun against an existing volume.

Run this once:

```bash
docker compose down -v
docker compose up --build
```

`docker compose down -v` permanently deletes the local Docker MongoDB volume and its local data. Fresh clones and new users do not need this reset. After this one-time migration, normal shutdown should use `docker compose down` without `-v`.

For the backend, employer frontend, and MongoDB, the canonical local Docker startup path is:

```bash
docker compose up --build
```

Prerequisites:

- Windows 11: Docker Desktop with WSL2 integration enabled for the distro that contains this repository.
- macOS: Docker Desktop. Apple Silicon is supported through Docker Desktop's multi-architecture image handling.
- Linux: Docker Engine with the Docker Compose plugin, where practical.

Validation commands:

```bash
docker compose ps
curl http://localhost:5000/api/v1/health
```

The health URL above assumes the default `BACKEND_HOST_PORT=5000`. If you override the backend host port, substitute that value in the health and Swagger URLs. For example, with `BACKEND_HOST_PORT=5001`:

```text
Health: http://localhost:5001/api/v1/health
Swagger: http://localhost:5001/api-docs
```

Use `docker compose down` to stop containers while keeping the local MongoDB data. Use `docker compose down -v` only when you intentionally want to delete the local database volume.

Most users do not need to configure anything before starting Docker Compose. If a default host port is already occupied, copy `.env.example` to `.env` and set only the port you need to change. For example, set `BACKEND_HOST_PORT=5001` when port 5000 is occupied. On macOS, AirPlay Receiver can sometimes use port 5000.

The Docker Compose backend uses local-only credentials supplied by `docker-compose.yml`. Docker Compose does not read `app-backend/.env.example`; use that template only when running the backend directly outside Docker.

```bash
MONGO_URI=mongodb://secureshift_app:secureshift_app_password@mongodb:27017/secureshift_local?authSource=secureshift_local
PORT=5000
NODE_ENV=development
```


## Employer Panel (React)

The employer panel uses React environment variables. Create a `.env` file in the `app-frontend/employer-panel/` directory:

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

### Updated Files


**Employer Panel:**
- `src/lib/http.js` - New centralized Axios instance
- `src/pages/Login.js` - Updated to use centralized instance
- `src/pages/2FA.js` - Updated to use centralized instance
- `src/pages/createShift.js` - Updated to use centralized instance
- `src/pages/ExpressionOfInterest.js` - Updated to use centralized instance
- `package.json` - Added axios dependency
- `.env.example` - Created for reference

## Usage

1. Copy the respective `.env.example` files to `.env` in each application directory
2. Update the API base URL if your backend runs on a different port
3. Install dependencies: `npm install` in each application directory
4. Start the applications as usual

The centralized Axios instances will automatically handle authentication and error management.
