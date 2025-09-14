# SecureShift – Guard App (Frontend)

This is the mobile frontend for the SecureShift Guard App, developed using React Native with Expo and TypeScript. It allows licensed security guards to log in, manage their profile, view available shifts, and apply for them.

## Prerequisites

- Node.js (v18+ recommended)
- Expo CLI
- Android Studio (for emulator) or physical Android device
- Git

## Getting Started

1. **Clone the Company Repository**

git clone https://github.com/Gopher-Industries/SecureShift.git
cd SecureShift/app-frontend/guard-app
Install Dependencies

- npm install
- Run the App

Start Expo and run on an Android emulator or physical device:

=> npx expo start --android

If you're using a physical device, install the Expo Go app from the Play Store and scan the QR code.

Project Setup Notes

- The project is built using Expo’s managed workflow.

- React Navigation is used for screen transitions.

- Screens and UI components follow modular folder structure under /src.

- Firebase integration is planned for user authentication and shift management.

Branching Strategy

- Use frontend/guard-app branch for all frontend work.

- Create separate feature branches (e.g., feature/profile-screen) and submit pull requests to frontend/guard-app.

#####Pull requests must be reviewed before merging.###$$$$

Contributor Setup Checklist
=> Install Android Studio and configure an emulator, or use Expo Go on your phone.

+> Clone the full SecureShift repository.

+> Navigate to `app-frontend/guard-app`.

## Install these dependencies for Secure Shift guard app:
# Local storage
npm install @react-native-async-storage/async-storage

# HTTP requests
npm install axios

# Image picker (for profile photo / license uploads)
npx expo install expo-image-picker

# Icons
npm install @expo/vector-icons

# Navigation (material top tabs + tab view)
npx expo install @react-navigation/material-top-tabs react-native-tab-view

# Date utilities
npm install date-fns

**Plus, don’t forget the core navigation packages you already use (stack + bottom tabs):
- npm install @react-navigation/native
- npm install @react-navigation/native-stack
- npm install @react-navigation/bottom-tabs
- npx expo install react-native-screens react-native-safe-area-context react-native-gesture-handler

