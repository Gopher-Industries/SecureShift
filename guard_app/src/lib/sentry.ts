// Crash/error reporting (Sentry) — see docs/crash-reporting.md
//
// Entirely gated behind EXPO_PUBLIC_SENTRY_DSN. With no DSN set (the default
// for local dev), initSentry() is a no-op and every capture* helper below is
// a no-op too, so the app behaves exactly as it did before this was added.
import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

export const isSentryEnabled = Boolean(DSN);

const RELEASE_VERSION = Constants.expoConfig?.version ?? '0.0.0';
const BUILD_NUMBER = String(
  Constants.expoConfig?.ios?.buildNumber ?? Constants.expoConfig?.android?.versionCode ?? '1',
);

// Keys whose values are always stripped, wherever they show up in event
// payloads (extra data, breadcrumb data, request bodies, contexts, ...).
const SENSITIVE_KEY_PATTERN =
  /token|authorization|auth|password|secret|jwt|otp|cookie|session|ssn|ip_address|latitude|longitude|lat|lng|coords|email|phone|address/i;

const REDACTED = '[Filtered]';

// Catches PII that can leak inside otherwise-innocent strings, e.g. a thrown
// Error whose message happens to interpolate a user's email or a bearer token.
const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const BEARER_TOKEN_PATTERN = /\bBearer\s+[A-Za-z0-9\-._~+/]+=*/gi;
const JWT_PATTERN = /\beyJ[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\b/g;

function scrubString(value: string): string {
  return value
    .replace(BEARER_TOKEN_PATTERN, 'Bearer [Filtered]')
    .replace(JWT_PATTERN, '[Filtered]')
    .replace(EMAIL_PATTERN, '[Filtered]');
}

// Deep-scrubs an arbitrary event payload fragment: redacts values behind
// sensitive-looking keys outright, and regex-scrubs the rest for PII that
// can hide inside free-text strings (error messages, breadcrumb data, ...).
function scrubDeep(value: unknown, depth = 0): unknown {
  if (depth > 6 || value == null) return value;

  if (typeof value === 'string') return scrubString(value);

  if (Array.isArray(value)) return value.map((item) => scrubDeep(item, depth + 1));

  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      out[key] = SENSITIVE_KEY_PATTERN.test(key) ? REDACTED : scrubDeep(val, depth + 1);
    }
    return out;
  }

  return value;
}

function scrubEvent(event: Sentry.ErrorEvent): Sentry.ErrorEvent {
  // Never let request headers/cookies (Authorization, session cookies) or
  // raw request bodies reach Sentry, even if a future integration adds them.
  if (event.request) {
    delete event.request.headers;
    delete event.request.cookies;
    if (event.request.data) {
      event.request.data = scrubDeep(event.request.data);
    }
  }

  // We intentionally never call Sentry.setUser() with guard PII (see
  // docs/crash-reporting.md), but scrub defensively in case that changes.
  if (event.user) {
    delete event.user.email;
    delete event.user.ip_address;
    delete event.user.username;
  }

  if (event.extra) {
    event.extra = scrubDeep(event.extra) as typeof event.extra;
  }

  if (event.contexts) {
    event.contexts = scrubDeep(event.contexts) as typeof event.contexts;
  }

  if (event.exception?.values) {
    for (const exception of event.exception.values) {
      if (exception.value) exception.value = scrubString(exception.value);
    }
  }

  return event;
}

function scrubBreadcrumb(breadcrumb: Sentry.Breadcrumb): Sentry.Breadcrumb {
  if (breadcrumb.message) breadcrumb.message = scrubString(breadcrumb.message);
  if (breadcrumb.data) breadcrumb.data = scrubDeep(breadcrumb.data) as typeof breadcrumb.data;
  return breadcrumb;
}

export function initSentry(): void {
  if (!DSN) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log('[sentry] EXPO_PUBLIC_SENTRY_DSN not set — crash reporting disabled');
    }
    return;
  }

  Sentry.init({
    dsn: DSN,
    environment:
      process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT ?? (__DEV__ ? 'development' : 'production'),
    release: `secureshift-guardapp@${RELEASE_VERSION}`,
    dist: BUILD_NUMBER,

    // Off by default on developer machines so `expo start` doesn't spam the
    // project with local crashes; set EXPO_PUBLIC_SENTRY_ENABLE_IN_DEV=true
    // to test the pipeline from a dev build.
    enabled: !__DEV__ || process.env.EXPO_PUBLIC_SENTRY_ENABLE_IN_DEV === 'true',

    // Sample rates: control noise/cost. Every crash/error is captured by
    // default (guard fleets are small); performance tracing is off by
    // default since this ticket is about error visibility, not perf.
    sampleRate: Number(process.env.EXPO_PUBLIC_SENTRY_SAMPLE_RATE ?? 1),
    tracesSampleRate: Number(process.env.EXPO_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? 0),

    // Privacy: never auto-attach device user/IP or screenshots.
    sendDefaultPii: false,
    attachScreenshot: false,
    attachStacktrace: true,

    beforeBreadcrumb: (breadcrumb) => scrubBreadcrumb(breadcrumb),
    beforeSend: (event) => scrubEvent(event),
  });
}

/** Captures an error thrown inside the root ErrorBoundary. */
export function captureReactError(error: Error, componentStack?: string): void {
  if (!isSentryEnabled) return;
  Sentry.withScope((scope) => {
    scope.setTag('boundary', 'root-error-boundary');
    if (componentStack) {
      scope.setContext('react', { componentStack: scrubString(componentStack) });
    }
    Sentry.captureException(error);
  });
}

/** Manually sends a synthetic error, for verifying the pipeline end-to-end. */
export function captureTestError(message = 'SecureShift Guard App — test crash'): void {
  Sentry.captureException(new Error(message));
}

export { Sentry };
