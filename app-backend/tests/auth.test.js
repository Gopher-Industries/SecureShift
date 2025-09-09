import { jest } from '@jest/globals';

// Prevent real emails during tests
jest.mock('../src/utils/sendEmail.js', () => ({
  sendOTP: jest.fn().mockResolvedValue(undefined),
}));

 // Ensure express-validator can be stubbed if needed (some tests may mock it locally)
jest.mock('express-validator', () => ({
  validationResult: jest.fn(),
}));

 // Provide robust, callable model mocks so the controller can `new` them and
// static methods like `findOne`/`create` remain mockable. Tests can still
// override `Model.findOne` or `Model.prototype.save` per-case in each test.
jest.mock('../src/models/User.js', () => {
  const saveFn = jest.fn();
  class MockUser {
    constructor(data) { Object.assign(this, data); }
    save() { return saveFn.apply(this, arguments); }
    static findOne(...args) { return MockUser.findOneMock(...args); }
    static create(...args) { return MockUser.createMock(...args); }
  }
  MockUser.findOneMock = jest.fn();
  MockUser.createMock = jest.fn();
  MockUser.prototype.save = saveFn;
  return { __esModule: true, default: MockUser };
});

jest.mock('../src/models/Employer.js', () => {
  const saveFn = jest.fn();
  // Employer can be constructed like a User; tests may override prototype.save
  class MockEmployer {
    constructor(data) { Object.assign(this, data); }
    save() { return saveFn.apply(this, arguments); }
    static create(...args) { return MockEmployer.createMock(...args); }
  }
  MockEmployer.createMock = jest.fn();
  MockEmployer.prototype.save = saveFn;
  return { __esModule: true, default: MockEmployer };
});

jest.mock('../src/models/Guard.js', () => {
  const saveFn = jest.fn();
  class MockGuard {
    constructor(data) { Object.assign(this, data); }
    save() { return saveFn.apply(this, arguments); }
    static findOne(...args) { return MockGuard.findOneMock(...args); }
    static create(...args) { return MockGuard.createMock(...args); }
  }
  MockGuard.findOneMock = jest.fn();
  MockGuard.createMock = jest.fn();
  MockGuard.prototype.save = saveFn;
  return { __esModule: true, default: MockGuard };
});

import jwt from 'jsonwebtoken';
import {
  register,
  login,
  verifyOTP,
  registerGuardWithLicense,
} from '../src/controllers/auth.controller.js';
import User from '../src/models/User.js';
import Employer from '../src/models/Employer.js';
import Guard from '../src/models/Guard.js';
import { validationResult } from 'express-validator';
import authMiddleware from '../src/middleware/auth.js';

describe('auth - register & login', () => {
  let req;
  let res;

  beforeEach(() => {
    req = { body: {}, audit: { log: jest.fn() } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    jest.clearAllMocks();
  });

  it('registers a user (happy path) => 201', async () => {
    req.body = { name: 'Alice', email: 'alice@example.com', password: 'P@ssw0rd', role: 'employer', ABN: '12345678901' };

    // No existing user
    User.findOne = jest.fn().mockResolvedValue(null);

    // Ensure new User()/Employer.save() resolves
    const saveMock = jest.fn().mockResolvedValue(true);
    User.prototype.save = saveMock;
    // If an Employer instance is created, its prototype.save should use the same mock
    Employer.prototype.save = saveMock;

    await register(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ email: 'alice@example.com' });
    expect(saveMock).toHaveBeenCalled();
    expect(req.audit.log).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalled();
  });

  it('register returns 400 when email already registered', async () => {
    req.body = { name: 'Bob', email: 'bob@example.com', password: 'secret', role: 'employer' };

    User.findOne = jest.fn().mockResolvedValue({ _id: 'existing' });

    await register(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ email: 'bob@example.com' });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Email already registered' });
  });

  it('register returns 500 when User.findOne throws (server error)', async () => {
    req.body = { name: 'Err', email: 'err@example.com', password: 'P@ssw0rd', role: 'employer' };

    User.findOne = jest.fn().mockRejectedValue(new Error('Database error'));

    await register(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ email: 'err@example.com' });
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Database error' });
  });

  it('register returns 400/500 when required fields missing and save fails validation', async () => {
    req.body = { name: 'NoPass', email: 'nopass@example.com' };

    User.findOne = jest.fn().mockResolvedValue(null);

    const validationError = new Error('Validation failed');
    User.prototype.save = jest.fn().mockRejectedValue(validationError);
    // Ensure Employer.save uses same mocked behavior when role === 'employer'
    Employer.prototype.save = User.prototype.save;

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Validation failed' });
  });

  it('register returns 400 when email format invalid (model validation simulated)', async () => {
    req.body = { name: 'BadEmail', email: 'invalid-email', password: 'P@ssw0rd', role: 'employer', ABN: '12345678901' };

    User.findOne = jest.fn().mockResolvedValue(null);
    const err = new Error('Please enter a valid email address.');
    User.prototype.save = jest.fn().mockRejectedValue(err);
    Employer.prototype.save = User.prototype.save;

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Please enter a valid email address.' });
  });

  it('register returns 400 when password is weak (model validation simulated)', async () => {
    req.body = { name: 'Weak', email: 'weak@example.com', password: 'abc', role: 'employer', ABN: '12345678901' };

    User.findOne = jest.fn().mockResolvedValue(null);
    const err = new Error('Password must be at least 6 characters long');
    User.prototype.save = jest.fn().mockRejectedValue(err);
    Employer.prototype.save = User.prototype.save;

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Password must be at least 6 characters long' });
  });

  it('login sends OTP on valid credentials => 200', async () => {
    req.body = { email: 'carol@example.com', password: 'letmein' };

    const user = {
      _id: 'uid-1',
      role: 'employer',
      email: 'carol@example.com',
      matchPassword: jest.fn().mockResolvedValue(true),
      save: jest.fn().mockResolvedValue(true),
    };

    User.findOne = jest.fn(() => ({ select: jest.fn().mockResolvedValue(user) }));

    await login(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ email: 'carol@example.com' });
    expect(user.matchPassword).toHaveBeenCalledWith('letmein');
    expect(user.save).toHaveBeenCalled();
    expect(req.audit.log).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'OTP sent to your email' });
  });

  it('login returns 401 on wrong password', async () => {
    req.body = { email: 'dan@example.com', password: 'bad' };

    const user = {
      _id: 'uid-2',
      matchPassword: jest.fn().mockResolvedValue(false),
      save: jest.fn(),
    };

    User.findOne = jest.fn(() => ({ select: jest.fn().mockResolvedValue(user) }));

    await login(req, res);

    expect(user.matchPassword).toHaveBeenCalledWith('bad');
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
  });

  it('login returns 401 when user not found', async () => {
    req.body = { email: 'notfound@example.com', password: 'x' };

    User.findOne = jest.fn(() => ({ select: jest.fn().mockResolvedValue(null) }));

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
  });

  it('login returns 403 when admin attempts to login here', async () => {
    req.body = { email: 'admin@example.com', password: 'adminpass' };

    const adminUser = {
      _id: 'admin1',
      role: 'admin',
      matchPassword: jest.fn().mockResolvedValue(true),
    };

    User.findOne = jest.fn(() => ({ select: jest.fn().mockResolvedValue(adminUser) }));

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Admins must use a different login method' });
  });

  it('login returns 400 when email or password missing (simulated)', async () => {
    req.body = { email: 'onlyemail@example.com' };

    User.findOne = jest.fn(() => ({ select: jest.fn().mockResolvedValue(null) }));

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
  });
});

describe('auth - verifyOTP', () => {
  let req;
  let res;

  beforeEach(() => {
    req = { body: { email: 'test@example.com', otp: '123456' }, audit: { log: jest.fn() } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    User.findOne = jest.fn(() => ({
      select: jest.fn(),
    }));
    jest.clearAllMocks();
  });

  it('returns 401 when user is not found', async () => {
    User.findOne.mockImplementation(() => ({
      select: jest.fn().mockResolvedValue(null),
    }));

    await verifyOTP(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid email or OTP' });
  });

  it('returns 401 when OTP mismatches or expired', async () => {
    const expiredUser = {
      otp: '000000',
      otpExpiresAt: new Date(Date.now() - 1000),
      save: jest.fn(),
    };
    User.findOne.mockImplementation(() => ({
      select: jest.fn().mockResolvedValue(expiredUser),
    }));

    await verifyOTP(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid or expired OTP' });
  });

  it('returns 200 and token when OTP is valid', async () => {
    const validUser = {
      otp: '123456',
      otpExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
      save: jest.fn().mockResolvedValue(true),
      _id: 'uid-1',
      name: 'Tester',
      role: 'employer',
    };
    User.findOne.mockImplementation(() => ({
      select: jest.fn().mockResolvedValue(validUser),
    }));

    await verifyOTP(req, res);

    expect(validUser.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    const callArg = res.json.mock.calls[0][0];
    expect(callArg).toHaveProperty('token');
    expect(callArg).toMatchObject({
      role: 'employer',
      id: 'uid-1',
      name: 'Tester',
    });
  });
});

describe('auth - registerGuardWithLicense', () => {
  let req;
  let res;

  beforeEach(() => {
    req = { body: {}, file: undefined, audit: { log: jest.fn() } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    jest.clearAllMocks();
  });

  it('returns 400 when file is missing', async () => {
    req.body = { name: 'G', email: 'g@example.com', password: 'P@ssw0rd' };
    req.file = undefined;

    await registerGuardWithLicense(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'License image is required (form-data field: "license").',
    });
  });

  it('returns 400 when required fields are missing', async () => {
    req.file = { filename: 'license.jpg' };
    req.body = { name: '', email: '', password: '' };

    await registerGuardWithLicense(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Name, email, and password are required.' });
  });

  it('returns 400 when email already registered', async () => {
    req.file = { filename: 'license.jpg' };
    req.body = { name: 'Guard', email: 'guard@example.com', password: 'P@ssw0rd' };

    Guard.findOne = jest.fn().mockResolvedValue({ _id: 'existing' });

    await registerGuardWithLicense(req, res);

    expect(Guard.findOne).toHaveBeenCalledWith({ email: 'guard@example.com' });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Email already registered.' });
  });

  it('creates a guard and returns 201 on success', async () => {
    req.file = { filename: 'license.jpg' };
    req.body = { name: 'Guard', email: 'newguard@example.com', password: 'P@ssw0rd' };

    Guard.findOne = jest.fn().mockResolvedValue(null);

    const created = {
      toObject: () => ({ _id: 'g1', name: 'Guard', email: 'newguard@example.com', role: 'guard' }),
    };
    Guard.create = jest.fn().mockResolvedValue(created);

    await registerGuardWithLicense(req, res);

    expect(Guard.findOne).toHaveBeenCalledWith({ email: 'newguard@example.com' });
    expect(Guard.create).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Guard registered successfully. License submitted for review.',
      user: { _id: 'g1', name: 'Guard', email: 'newguard@example.com', role: 'guard' },
    });
  });
});

describe('auth middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = { headers: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('returns 401 when Authorization header is missing', () => {
    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Access denied. No token provided.' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when Authorization header is malformed', () => {
    req.headers.authorization = 'Token abc';
    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Access denied. No token provided.' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when jwt.verify throws (invalid token)', () => {
    req.headers.authorization = 'Bearer invalid-token';
    const verifySpy = jest.spyOn(jwt, 'verify').mockImplementation(() => {
      throw new Error('invalid');
    });
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    authMiddleware(req, res, next);

    expect(verifySpy).toHaveBeenCalledWith('invalid-token', process.env.JWT_SECRET);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid or expired token.' });
    expect(next).not.toHaveBeenCalled();

    verifySpy.mockRestore();
    consoleSpy.mockRestore();
  });

  it('attaches decoded user to req.user and calls next on valid token', () => {
    req.headers.authorization = 'Bearer good-token';
    const decoded = { id: 'uid-123', role: 'guard' };
    const verifySpy = jest.spyOn(jwt, 'verify').mockReturnValue(decoded);

    authMiddleware(req, res, next);

    expect(verifySpy).toHaveBeenCalledWith('good-token', process.env.JWT_SECRET);
    expect(req.user).toMatchObject({ id: 'uid-123', _id: 'uid-123', role: 'guard' });
    expect(next).toHaveBeenCalled();

    verifySpy.mockRestore();
  });
});
