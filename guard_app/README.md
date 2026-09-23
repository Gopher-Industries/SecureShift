# SecureShift Guard App

React Native, Expo, and TypeScript mobile client in the SecureShift monorepo at
`guard_app/`. Use the [root quickstart](../README.md) to start the backend and local
services first. The mobile app runs separately from Compose.

## First-time host setup

Guard App mobile tooling requires Node >=20.19.4. Node 22.13+ is compatible and
a convenient shared local version for backend development; the backend requires
Node >=22.13.0. Use npm and Expo Go on a phone, or an Android Studio emulator /
Xcode iOS simulator (macOS). From the repository root:

```bash
cd guard_app
npm ci
npm start
```

The installed Expo CLI starts Metro. Select Expo Go (`s` if using development
build mode), then scan the QR code. Alternatively use `npm run android`,
`npm run ios`, or `npm run web` as separate commands.

## Backend connection and login

The backend defaults to port 5000. For a physical device, put your computer's
reachable LAN address in `guard_app/.env`, for example:

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.10:5000
```

Replace the example IP with your computer's address. For an Android emulator,
use `http://10.0.2.2:5000`. Use port 5001 if the backend is configured that way.
Do not append `/api/v1`; the client adds it. Restart Expo after environment changes.
A phone needs network access to the backend; shared Wi-Fi alone does not guarantee
reachability through host/WSL firewalls or forwarding.

Use local seed accounts from the [backend README](../app-backend/README.md#local-development-seed-data)
or register and follow the guard approval flow. Read login OTP messages in
Mailpit at http://localhost:8025 on your computer. No private SMTP credentials
are needed for this local workflow.

## Daily development

Start the backend using the root quickstart, then run `npm start` in `guard_app`.
Use `npm run lint`, `npm run typecheck`, and `npm run test:ci` as appropriate for
mobile changes. Create a feature branch and confirm the team's current PR target.

Historical note: earlier handover notes used `app-frontend/guard-app` and described
planned Firebase authentication. Use the current `guard_app/` path and backend
authentication flow above.
