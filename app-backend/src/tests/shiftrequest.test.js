// tests/shiftrequest.test.js
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../app.js';
import User from '../models/User.js';
import Shift from '../models/Shift.js';
import ShiftRequest from '../models/ShiftRequest.js';

describe('ShiftRequest API', () => {
  let guardToken, employerToken, adminToken;
  let guard1, guard2, employer, admin;
  let shift1, shift2;

  beforeAll(async () => {
    guard1 = await User.create({
      name: 'Test Guard 1',
      email: 'guard1@test.com',
      password: 'password123',
      role: 'guard'
    });

    guard2 = await User.create({
      name: 'Test Guard 2',
      email: 'guard2@test.com',
      password: 'password123',
      role: 'guard'
    });

    employer = await User.create({
      name: 'Test Employer',
      email: 'employer@test.com',
      password: 'password123',
      role: 'employer'
    });

    admin = await User.create({
      name: 'Test Admin',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin'
    });

    // 创建测试班次
    shift1 = await Shift.create({
      title: 'Morning Shift',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天后
      startTime: '09:00',
      endTime: '17:00',
      location: 'Site A',
      createdBy: employer._id,
      guardIds: [guard1._id],
      acceptedBy: guard1._id,
      status: 'assigned'
    });

    shift2 = await Shift.create({
      title: 'Evening Shift',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      startTime: '17:00',
      endTime: '01:00',
      location: 'Site B',
      createdBy: employer._id,
      guardIds: [guard2._id],
      acceptedBy: guard2._id,
      status: 'assigned'
    });

    const guardLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'guard1@test.com', password: 'password123' });
    guardToken = guardLogin.body.token;

    const employerLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'employer@test.com', password: 'password123' });
    employerToken = employerLogin.body.token;

    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@test.com', password: 'password123' });
    adminToken = adminLogin.body.token;
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Shift.deleteMany({});
    await ShiftRequest.deleteMany({});
    await mongoose.connection.close();
  });

  describe('POST /api/v1/shifts/request', () => {
    it('should allow guard to create SWAP request', async () => {
      const res = await request(app)
        .post('/api/v1/shifts/request')
        .set('Authorization', `Bearer ${guardToken}`)
        .send({
          type: 'SWAP',
          targetGuardId: guard2._id,
          originalShiftId: shift1._id,
          reason: 'Need to swap due to personal emergency'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.type).toBe('SWAP');
    });

    it('should block duplicate pending request', async () => {
      const res = await request(app)
        .post('/api/v1/shifts/request')
        .set('Authorization', `Bearer ${guardToken}`)
        .send({
          type: 'SWAP',
          targetGuardId: guard2._id,
          originalShiftId: shift1._id,
          reason: 'Another swap request'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('already have a pending request');
    });

    it('should block non-guard from creating request', async () => {
      const res = await request(app)
        .post('/api/v1/shifts/request')
        .set('Authorization', `Bearer ${employerToken}`)
        .send({
          type: 'SWAP',
          targetGuardId: guard2._id,
          originalShiftId: shift1._id,
          reason: 'Employer trying to swap'
        });

      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/v1/shifts/request/:id', () => {
    let swapRequestId;

    beforeEach(async () => {
      const req = await ShiftRequest.create({
        type: 'SWAP',
        requestingGuardId: guard1._id,
        targetGuardId: guard2._id,
        originalShiftId: shift1._id,
        reason: 'Test swap request',
        status: 'PENDING'
      });
      swapRequestId = req._id;
    });

    it('should allow target guard to accept SWAP', async () => {
      const guard2Login = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'guard2@test.com', password: 'password123' });
      const guard2Token = guard2Login.body.token;

      const res = await request(app)
        .patch(`/api/v1/shifts/request/${swapRequestId}`)
        .set('Authorization', `Bearer ${guard2Token}`)
        .send({ targetResponse: 'ACCEPTED' });

      expect(res.status).toBe(200);
      expect(res.body.data.targetResponse).toBe('ACCEPTED');
    });

    it('should allow employer to approve after target acceptance', async () => {
      // First, target guard accepts
      await ShiftRequest.findByIdAndUpdate(swapRequestId, {
        targetResponse: 'ACCEPTED'
      });

      const res = await request(app)
        .patch(`/api/v1/shifts/request/${swapRequestId}`)
        .set('Authorization', `Bearer ${employerToken}`)
        .send({ status: 'APPROVED' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('APPROVED');
    });
  });

  describe('GET /api/v1/shifts/requests', () => {
    it('should return employer-owned shifts only', async () => {
      const res = await request(app)
        .get('/api/v1/shifts/requests')
        .set('Authorization', `Bearer ${employerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.every(req =>
        req.originalShiftId && req.originalShiftId.createdBy === employer._id.toString()
      )).toBe(true);
    });
  });

  describe('DELETE /api/v1/shifts/request/:id', () => {
    it('should allow guard to cancel pending request', async () => {
      const request = await ShiftRequest.create({
        type: 'LEAVE',
        requestingGuardId: guard1._id,
        originalShiftId: shift1._id,
        leaveStartDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        leaveEndDate: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000),
        reason: 'Vacation',
        status: 'PENDING'
      });

      const res = await request(app)
        .delete(`/api/v1/shifts/request/${request._id}`)
        .set('Authorization', `Bearer ${guardToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should block cancellation of approved request', async () => {
      const request = await ShiftRequest.create({
        type: 'LEAVE',
        requestingGuardId: guard1._id,
        originalShiftId: shift1._id,
        leaveStartDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        leaveEndDate: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000),
        reason: 'Sick leave',
        status: 'APPROVED',
        approvedBy: employer._id,
        approvedAt: new Date()
      });

      const res = await request(app)
        .delete(`/api/v1/shifts/request/${request._id}`)
        .set('Authorization', `Bearer ${guardToken}`);

      expect(res.status).toBe(400);
    });
  });
});