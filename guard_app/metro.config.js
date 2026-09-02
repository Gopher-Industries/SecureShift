// Wraps Expo's default Metro config with Sentry's, so release bundles get
// debug IDs that let uploaded source maps match production stack traces.
// No-op for source-map upload itself — that only happens during
// `expo export`/EAS builds when SENTRY_ORG/SENTRY_PROJECT/SENTRY_AUTH_TOKEN
// are set (see docs/crash-reporting.md).
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

module.exports = getSentryExpoConfig(__dirname);
