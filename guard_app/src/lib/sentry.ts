// Sentry is fully gated behind EXPO_PUBLIC_SENTRY_DSN. No DSN (default for
// local dev) means initSentry() and the capture helpers below are no-ops.
import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

const isSentryEnabled = Boolean(DSN);

const RELEASE_VERSION = Constants.expoConfig?.version ?? '0.0.0';
const BUILD_NUMBER = String(
  Constants.expoConfig?.ios?.buildNumber ?? Constants.expoConfig?.android?.versionCode ?? '1',
);

// Strip anything that looks sensitive out of event/breadcrumb payloads.
const SENSITIVE_KEY_PATTERN =
  /token|authorization|auth|password|secret|jwt|otp|cookie|session|ssn|ip_address|latitude|longitude|lat|lng|coords|email|phone|address/i;

const REDACTED = '[Filtered]';

const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const BEARER_TOKEN_PATTERN = /\bBearer\s+[A-Za-z0-9\-._~+/]+=*/gi;
const JWT_PATTERN = /\beyJ[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\b/g;

function scrubString(value: string): string {
  return value
    .replace(BEARER_TOKEN_PATTERN, 'Bearer [Filtered]')
    .replace(JWT_PATTERN, '[Filtered]')
    .replace(EMAIL_PATTERN, '[Filtered]');
}

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
  if (event.request) {
    delete event.request.headers;
    delete event.request.cookies;
    if (event.request.data) {
      event.request.data = scrubDeep(event.request.data);
    }
  }

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

    // don't spam the project with local crashes unless explicitly enabled
    enabled: !__DEV__ || process.env.EXPO_PUBLIC_SENTRY_ENABLE_IN_DEV === 'true',

    sampleRate: Number(process.env.EXPO_PUBLIC_SENTRY_SAMPLE_RATE ?? 1),
    tracesSampleRate: Number(process.env.EXPO_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? 0),

    sendDefaultPii: false,
    attachScreenshot: false,
    attachStacktrace: true,

    beforeBreadcrumb: (breadcrumb) => scrubBreadcrumb(breadcrumb),
    beforeSend: (event) => scrubEvent(event),
  });
}

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

export { Sentry };
