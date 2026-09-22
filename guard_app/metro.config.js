// wraps Expo's metro config with Sentry's so release builds get proper source maps
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

module.exports = getSentryExpoConfig(__dirname);
