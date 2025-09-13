# Environment Setup for SecureShift2

This document explains how to set up environment variables for the SecureShift2 project.

```bash
# API Configuration
EXPO_PUBLIC_API_BASE_URL=http://localhost:5000/api/v1

# Development Environment
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



