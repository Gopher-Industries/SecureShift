# SecureShift – Guard App (Frontend)

This is the mobile frontend for the SecureShift Guard App, developed using React Native with Expo and TypeScript. It allows licensed security guards to log in, manage their profile, view available shifts, and apply for them.

## Prerequisites

- Node.js (v18+ recommended)
- Expo CLI
- Android Studio (for emulator) or physical Android device
- Git

## Getting Started

1. Clone the Company Repository

```bash
git clone https://github.com/Gopher-Industries/SecureShift.git
cd /guard_app
```

2. Install Dependencies

```bash
npm install
```

3. Run the App

Start Expo and run on an Android emulator or physical device:

```bash
npx expo start --android
```

If you're using a physical device, install the Expo Go app from the Play Store and scan the QR code.

Project Setup Notes:

- The project is built using Expo’s managed workflow.

- React Navigation is used for screen transitions.

- Screens and UI components follow modular folder structure under /src.

- Firebase integration is planned for user authentication and shift management.

Branching Strategy:

- Use frontend/guard-app branch for all frontend work.

- Create separate feature branches (e.g., feature/profile-screen) and submit pull requests to frontend/guard-app.

> Pull requests must be reviewed before merging.

4. Contributor Setup Checklist

=> Install Android Studio and configure an emulator, or use Expo Go on your phone.

+> Clone the full SecureShift repository.

+> Navigate to `/guard_app`.

+> Install dependencies:

```bash
npm install
```
