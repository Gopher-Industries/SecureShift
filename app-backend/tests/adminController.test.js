import { adminLogin, getAuditLogs } from '../src/controllers/admin.controller.js';
import User from '../src/models/User.js';
import jwt from 'jsonwebtoken';

jest.mock('../src/models/User.js');
jest.mock('jsonwebtoken');

describe('Admin Controller - adminLogin', () => {

  let req, res;

  beforeEach(() => {
    req = {
      body: {
        email: 'admin@test.com',
        password: '123456'
      },
      audit: {
        log: jest.fn()
      }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  it('should login admin successfully', async () => {

    const mockUser = {
      _id: '1',
      name: 'Admin',
      role: 'admin',
      matchPassword: jest.fn().mockResolvedValue(true),
      save: jest.fn()
    };

    User.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser)
    });

    jwt.sign.mockReturnValue('fake-token');

    await adminLogin(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        token: 'fake-token',
        role: 'admin'
      })
    );
  });

  it('should return 403 if not admin', async () => {

    User.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(null)
    });

    await adminLogin(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

});


import AuditLog from '../src/models/AuditLogs.js';

jest.mock('../src/models/AuditLogs.js');

describe('Admin Controller - getAuditLogs', () => {
  let req, res;

  beforeEach(() => {
    req = { query: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  const mockAuditLogFind = (logs) => {
    AuditLog.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValue(logs),
    });
  };

  it('should return filtered logs for a valid role', async () => {
    req.query = { role: 'admin' };

    User.find.mockReturnValue({
      select: jest.fn().mockResolvedValue([{ _id: 'user1' }]),
    });

    mockAuditLogFind([
      { _id: 'log1', action: 'LOGIN_SUCCESS', user: { role: 'admin' } },
    ]);

    await getAuditLogs(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        logs: expect.arrayContaining([
          expect.objectContaining({ action: 'LOGIN_SUCCESS' }),
        ]),
      })
    );
  });

  it('should return 400 for an invalid role', async () => {
    req.query = { role: 'superuser' };

    await getAuditLogs(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('Invalid role'),
      })
    );
  });

  it('should return an empty array when no users match the role', async () => {
    req.query = { role: 'guard' };

    User.find.mockReturnValue({
      select: jest.fn().mockResolvedValue([]), // koi guard user nahi mila
    });

    mockAuditLogFind([]);

    await getAuditLogs(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ logs: [] });
  });

  it('should intersect role and userId filters when both are given', async () => {
    req.query = { role: 'admin', userId: 'user1' };

    User.find.mockReturnValue({
      select: jest.fn().mockResolvedValue([{ _id: 'user1' }]),
    });

    mockAuditLogFind([
      { _id: 'log1', action: 'LOGIN_SUCCESS', user: { role: 'admin' } },
    ]);

    await getAuditLogs(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should return an empty array when userId does not belong to the given role', async () => {
    req.query = { role: 'guard', userId: 'user1' }; // user1 admin hai, guard nahi

    User.find.mockReturnValue({
      select: jest.fn().mockResolvedValue([{ _id: 'someOtherUser' }]),
    });

    await getAuditLogs(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ logs: [] });
  });
});