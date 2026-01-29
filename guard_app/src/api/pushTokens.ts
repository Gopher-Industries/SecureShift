import http from '../lib/http';

export type RegisterPushTokenPayload = {
  token: string;
  platform?: string;
  deviceName?: string | null;
};

export type RegisterPushTokenResponse = {
  message: string;
  token: string;
};

export async function registerPushToken(payload: RegisterPushTokenPayload) {
  const { data } = await http.post<RegisterPushTokenResponse>('/users/me/push-token', payload);
  return data;
}
