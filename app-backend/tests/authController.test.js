// tests/auth/authController.test.js
import { register, login, verifyOTP } from '../src/controllers/authController.js';

import User from '../src/models/User.js';
import Employer from '../src/models/Employer.js';
import jwt from 'jsonwebtoken';
import { sendOTP } from '../src/utils/sendEmail.js';

jest.mock('../src/models/User.js');
jest.mock('../src/models/Employer.js');
jest.mock('../src/utils/sendEmail.js');
jest.mock('jsonwebtoken');

describe('Auth Controller Tests', () => {

  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      audit: {
        log: jest.fn()
      }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    jest.clearAllMocks();
  });

  // ---------------- REGISTER ----------------
  describe('register', () => {

    it('should register a normal user successfully', async () => {

      req.body = {
        name: 'Krish',
        email: 'krish@test.com',
        password: '123456',
        role: 'admin'
      };

      User.findOne.mockResolvedValue(null);

      const saveMock = jest.fn().mockResolvedValue(true);

      User.mockImplementation(() => ({
        save: saveMock
      }));

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(req.audit.log).toHaveBeenCalled();
    });

    it('should return 400 if email exists', async () => {

      req.body = {
        email: 'exists@test.com',
        role: 'admin'
      };

      User.findOne.mockResolvedValue({ email: 'exists@test.com' });

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

  });

  // ---------------- LOGIN ----------------
  describe('login', () => {

    it('should login and send OTP', async () => {

      const mockUser = {
        _id: '1',
        email: 'test@test.com',
        role: 'user',
        matchPassword: jest.fn().mockResolvedValue(true),
        save: jest.fn()
      };

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      sendOTP.mockResolvedValue(true);

      req.body = {
        email: 'test@test.com',
        password: '123456'
      };

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(sendOTP).toHaveBeenCalled();
    });

    it('should reject invalid password', async () => {

      const mockUser = {
        matchPassword: jest.fn().mockResolvedValue(false)
      };

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      req.body = {
        email: 'test@test.com',
        password: 'wrong'
      };

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

  });

  // ---------------- VERIFY OTP ----------------
  describe('verifyOTP', () => {

    it('should verify OTP and return token', async () => {

      const mockUser = {
        _id: '1',
        email: 'test@test.com',
        otp: '123456',
        otpExpiresAt: new Date(Date.now() + 10000),
        save: jest.fn()
      };

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      jwt.sign.mockReturnValue('fake-token');

      req.body = {
        email: 'test@test.com',
        otp: '123456'
      };

      await verifyOTP(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          token: 'fake-token'
        })
      );
    });

    it('should fail with invalid OTP', async () => {

      const mockUser = {
        otp: '999999',
        otpExpiresAt: new Date(Date.now() + 10000)
      };

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      req.body = {
        email: 'test@test.com',
        otp: '123456'
      };

      await verifyOTP(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

  });

});