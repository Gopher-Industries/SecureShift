import request from 'supertest';
import app from "../src/app.js"; // your Express app
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import Shift from '../src/models/Shift.js';
import ShiftRequest from '../src/models/ShiftRequest.js';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "@jest/globals";

describe('ShiftRequest API', () => {
  let guardToken, employerToken;
  let guard1, guard2, employer;
  let shift;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI);

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

    shift = await Shift.create({
      title: 'Morning Shift',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      startTime: '09:00',
      endTime: '17:00',
      location: 'Site A',
      createdBy: employer._id,
      guardIds: [guard1._id],
      acceptedBy: guard1._id,
      status: 'assigned'
    });

    // fake tokens (replace with real auth helper if you have JWT)
    employerToken = `Bearer employer-token-${employer._id}`;
    guardToken = `Bearer guard-token-${guard1._id}`;
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
        .set('Authorization', guardToken)
        .send({
          type: 'SWAP',
          targetGuardId: guard2._id,
          originalShiftId: shift._id,
          reason: 'Need to swap due to personal emergency'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.type).toBe('SWAP');
    });

    it('should block duplicate pending request', async () => {
      const res = await request(app)
        .post('/api/v1/shifts/request')
        .set('Authorization', guardToken)
        .send({
          type: 'SWAP',
          targetGuardId: guard2._id,
          originalShiftId: shift._id,
          reason: 'Another swap request'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('already have a pending request');
    });

    it('should block non-guard from creating request', async () => {
      const res = await request(app)
        .post('/api/v1/shifts/request')
        .set('Authorization', employerToken)
        .send({
          type: 'SWAP',
          targetGuardId: guard2._id,
          originalShiftId: shift._id,
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
        originalShiftId: shift._id,
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
        .set('Authorization', guard2Token)
        .send({ targetResponse: 'ACCEPTED' });

      expect(res.status).toBe(200);
      expect(res.body.data.targetResponse).toBe('ACCEPTED');
    });

    it('should allow employer to approve after target acceptance', async () => {
      await ShiftRequest.findByIdAndUpdate(swapRequestId, {
        targetResponse: 'ACCEPTED'
      });

      const res = await request(app)
        .patch(`/api/v1/shifts/request/${swapRequestId}`)
        .set('Authorization', employerToken)
        .send({ status: 'APPROVED' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('APPROVED');
    });
  });

  describe('GET /api/v1/shifts/requests', () => {
    it('should return employer-owned shifts only', async () => {
      const res = await request(app)
        .get('/api/v1/shifts/requests')
        .set('Authorization', employerToken);

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
        originalShiftId: shift._id,
        leaveStartDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        leaveEndDate: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000),
        reason: 'Vacation',
        status: 'PENDING'
      });

      const res = await request(app)
        .delete(`/api/v1/shifts/request/${request._id}`)
        .set('Authorization', guardToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should block cancellation of approved request', async () => {
      const request = await ShiftRequest.create({
        type: 'LEAVE',
        requestingGuardId: guard1._id,
        originalShiftId: shift._id,
        leaveStartDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        leaveEndDate: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000),
        reason: 'Sick leave',
        status: 'APPROVED',
        approvedBy: employer._id,
        approvedAt: new Date()
      });

      const res = await request(app)
        .delete(`/api/v1/shifts/request/${request._id}`)
        .set('Authorization', guardToken);

      expect(res.status).toBe(400);
    });
  });
});