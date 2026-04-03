import http from '../lib/http';

export async function registerPushToken(payload: {
  token: string;
  platform: string;
  deviceId?: string;
}) {
  const { data } = await http.post('/users/push-token', payload);
  return data;
}
