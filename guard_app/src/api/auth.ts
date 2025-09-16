import http from '../lib/http';

// Types

/** React Native file-like object (e.g., from Image Picker) */
export type RNFile = {
  uri: string;
  name?: string;
  type?: string;
};

/** Payload for registering a new guard */
export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  /** License file: RNFile (mobile), File (web), or Blob */
  license: RNFile | File | Blob;
};

/** Payload for login */
export type LoginPayload = {
  email: string;
  password: string;
};

/** Payload for OTP verification */
export type VerifyOtpPayload = {
  email: string;
  otp: string;
};

// API Calls

/**
 * Register a new guard with license image (POST /auth/register/guard).
 * - Sends multipart/form-data with name, email, password, and license file.
 * - Role is implicitly set to "guard" by the backend.
 */
export async function registerUser(payload: RegisterPayload) {
  const formData = new FormData();

  formData.append('name', payload.name);
  formData.append('email', payload.email.toLowerCase().trim());
  formData.append('password', payload.password);

  if ('uri' in payload.license) {
    // React Native / Expo style file object
    const file = payload.license as RNFile;
    formData.append('license', {
      uri: file.uri,
      name: file.name ?? 'license.jpg',
      type: file.type ?? 'image/jpeg',
    } as unknown as Blob);
  } else {
    // Browser File or Blob
    formData.append('license', payload.license);
  }

  const { data } = await http.post('/auth/register/guard', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return data;
}

/**
 * Login (POST /auth/login).
 * Backend may return a token immediately along with role and id.
 */
export async function login(payload: LoginPayload) {
  const { data } = await http.post('/auth/login', payload);
  return {
    token: data?.token ?? null, // Extract JWT token if returned
    role: data?.role ?? null, // Extract user role
    id: data?.id ?? null, // Extract user ID
    raw: data, // Include raw response if needed
  };
}

/**
 * Verify OTP (POST /auth/verify-otp).
 * - Backend expects: email and otp
 * - Backend returns a JWT token if successful
 */
export async function verifyOtp(payload: VerifyOtpPayload) {
  const { data } = await http.post('/auth/verify-otp', payload);
  return {
    token: data?.token ?? data?.accessToken ?? null, // Support both token keys
    raw: data,
  };
}

/**
 * Get the logged-in guard's profile (GET /users/me).
 * Requires Authorization: Bearer <token>.
 */
export async function getMe() {
  const { data } = await http.get('/users/me');
  return data;
}
