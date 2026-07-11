# Environment Setup for SecureShift

This document explains the local development environment variables for SecureShift.

## Docker Compose Local Setup

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

The Docker Compose backend uses local-only credentials:

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
