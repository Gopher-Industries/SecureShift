import http from '../lib/http';

// ---- Types ----
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
  // Accept RN file object, File (web), or Blob
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

// ---- Type guards ----
const isRNFile = (v: unknown): v is RNFile =>
  typeof v === 'object' && v !== null && 'uri' in (v as Record<string, unknown>);

// ---- API calls ----

/**
 * Register a new guard with license image (POST /auth/register/guard)
 * Sends multipart/form-data with name, email, password, and license file
 * Role is implicitly set to "guard" by the backend
 */
export async function registerUser(payload: RegisterPayload) {
  const formData = new FormData();

  formData.append('name', payload.name);
  formData.append('email', payload.email.trim().toLowerCase());
  formData.append('password', payload.password);

  if (isRNFile(payload.license)) {
    // React Native / Expo style file object
    const { uri, name, type } = payload.license;
    // Cast to Blob only to satisfy TS typings; runtime is RN FormData object
    formData.append('license', {
      uri,
      name: name ?? 'license.jpg',
      type: type ?? 'image/jpeg',
    } as unknown as Blob);
  } else {
    // Browser File or generic Blob
    formData.append('license', payload.license);
  }

  // Axios will set the boundary; explicit Content-Type header not required
  const { data } = await http.post('/auth/register/guard', formData);
  return data;
}

/**
 * Login (POST /auth/login)
 * Backend may return a token immediately along with role and id
 */
export async function login(payload: LoginPayload) {
  const { data } = await http.post('/auth/login', payload);
  return {
    token: data?.token ?? null,
    role: data?.role ?? null,
    id: data?.id ?? null,
    raw: data,
  };
}

/**
 * Verify OTP (POST /auth/verify-otp)
 * Backend expects: email and otp
 * Backend returns a JWT token if successful
 */
export async function verifyOtp(payload: VerifyOtpPayload) {
  const { data } = await http.post('/auth/verify-otp', payload);
  return {
    token: data?.token ?? data?.accessToken ?? null,
    raw: data,
  };
}

/**
 * Get the logged-in guard's profile (GET /users/me)
 * Requires Authorization: Bearer <token>
 */
export async function getMe() {
  const { data } = await http.get('/users/me');
  return data;
}
