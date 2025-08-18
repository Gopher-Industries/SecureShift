// Authentication API tests for register, login, and OTP verification endpoints.

import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import User from '../src/models/User.js';

// Mock sendOTP utility to avoid sending real emails during tests
jest.mock('../src/utils/sendEmail.js', () => ({
  sendOTP: jest.fn().mockResolvedValue(undefined),
}));

// Ensure JWT secret is set for token verification in tests
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

describe('Auth API - register, login, verifyOTP', () => {
  // Reset mocks after each test to avoid test interference
  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user (201)', async () => {
      // Mock User.findOne to simulate no existing user
      jest.spyOn(User, 'findOne').mockResolvedValue(null);
      // Mock User.save to simulate successful save
      jest.spyOn(User.prototype, 'save').mockResolvedValue({});

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ name: 'T', email: 't@example.com', password: 'pass', role: 'guard' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('message', 'User registered successfully');
    });

    it('should return 400 when email already exists', async () => {
      // Mock User.findOne to simulate existing user
      jest.spyOn(User, 'findOne').mockResolvedValue({ _id: 'exists' });

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ name: 'T', email: 'exists@example.com', password: 'pass', role: 'guard' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Email already registered');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should send OTP on successful login (200)', async () => {
      // Mock user object with matchPassword and save methods
      const mockUser = {
        _id: 'u1',
        email: 'test@example.com',
        role: 'guard',
        matchPassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true),
      };

      // Mock User.findOne().select() to return mockUser
      jest.spyOn(User, 'findOne').mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'OTP sent to your email');
      expect(mockUser.save).toHaveBeenCalled();

      // Check that sendOTP was called with correct arguments
      const { sendOTP } = require('../src/utils/sendEmail.js');
      expect(sendOTP).toHaveBeenCalledWith(mockUser.email, expect.any(String));
    });

    it('should return 401 for invalid credentials (no user)', async () => {
      // Mock User.findOne().select() to return null
      jest.spyOn(User, 'findOne').mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nope@example.com', password: 'bad' });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('message', 'Invalid credentials');
    });

    it('should return 403 for admin login attempt', async () => {
      // Mock admin user object
      const adminUser = {
        _id: 'admin1',
        email: 'admin@example.com',
        role: 'admin',
        matchPassword: jest.fn().mockResolvedValue(true),
      };
      // Mock User.findOne().select() to return adminUser
      jest.spyOn(User, 'findOne').mockReturnValue({
        select: jest.fn().mockResolvedValue(adminUser),
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin@example.com', password: 'password123' });

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty('message', 'Admins must use a different login method');
    });
  });

  describe('POST /api/v1/auth/verify-otp', () => {
    it('returns JWT token on correct OTP', async () => {
      // Create a user with a valid OTP and future expiry
      const future = new Date(Date.now() + 1000 * 60);
      const user = {
        _id: 'u1',
        name: 'Name',
        role: 'guard',
        otp: '123456',
        otpExpiresAt: future,
        save: jest.fn().mockResolvedValue(true),
      };

      // Mock User.findOne().select() to return user
      jest.spyOn(User, 'findOne').mockReturnValue({
        select: jest.fn().mockResolvedValue(user),
      });

      const res = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ email: 'test@example.com', otp: '123456' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('role', user.role);
      // Verify the returned JWT token
      const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
      expect(decoded).toMatchObject({ id: user._id, role: user.role });
    });

    it('returns 401 for invalid otp or expired', async () => {
      // Mock User.findOne().select() to return null (invalid OTP)
      jest.spyOn(User, 'findOne').mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      const res = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ email: 'x@example.com', otp: '000000' });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('message');
    });
  });
});