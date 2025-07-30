import request from 'supertest';
import app from '../src/app.js';
test('GET /api/v1/health', async () => {
  const res = await request(app).get('/api/v1/health');
  expect(res.status).toBe(200);
  expect(res.body).toEqual({ status: 'ok' });
});
