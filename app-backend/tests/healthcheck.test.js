import request from 'supertest';
import express from 'express';
import healthRoutes from '../src/routes/health.routes.js';

describe('GET /api/v1/health', () => {
  let app;

  beforeAll(() => {
    app = express();
    // mount just the health router to avoid importing src/app.js
    app.use('/api/v1/health', healthRoutes);
  });

  it('returns 200 and status ok', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});
