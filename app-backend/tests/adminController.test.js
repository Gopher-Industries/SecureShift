import { jest } from '@jest/globals';

jest.unstable_mockModule('../src/models/User.js', () => ({
  default: {
    findOne: jest.fn(),
    find: jest.fn(),
    discriminator: jest.fn(() => ({})),
  },
}));

jest.unstable_mockModule('../src/models/AuditLogs.js', () => ({
  default: {
    find: jest.fn(),
    countDocuments: jest.fn(),
  },
}));

jest.unstable_mockModule('jsonwebtoken', () => ({
  default: {
    sign: jest.fn(),
  },
}));

const { adminLogin, getAuditLogs } = await import(
  '../src/controllers/admin.controller.js'
);
const { default: User } = await import('../src/models/User.js');
const { default: AuditLog } = await import('../src/models/AuditLogs.js');
const { default: jwt } = await import('jsonwebtoken');

describe('Admin Controller - adminLogin', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {
        email: 'admin@test.com',
        password: '123456',
      },
      audit: {
        log: jest.fn(),
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it('should login admin successfully', async () => {
    const mockUser = {
      _id: '1',
      name: 'Admin',
      role: 'admin',
      matchPassword: jest.fn().mockResolvedValue(true),
      save: jest.fn(),
    };

    User.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser),
    });

    jwt.sign.mockReturnValue('fake-token');

    await adminLogin(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        token: 'fake-token',
        role: 'admin',
      })
    );
  });

  it('should return 403 if not admin', async () => {
    User.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    await adminLogin(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });
});

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

  it('should return filtered logs with pagination for a valid role', async () => {
    req.query = { role: 'admin' };

    User.find.mockReturnValue({
      select: jest.fn().mockResolvedValue([{ _id: 'user1' }]),
    });
    mockAuditLogFind([
      { _id: 'log1', action: 'LOGIN_SUCCESS', user: { role: 'admin' } },
    ]);
    AuditLog.countDocuments.mockResolvedValue(1);

    await getAuditLogs(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        logs: expect.arrayContaining([
          expect.objectContaining({ action: 'LOGIN_SUCCESS' }),
        ]),
        pagination: expect.objectContaining({ total: 1 }),
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

  it('should return empty logs with pagination metadata when no users match the role', async () => {
    req.query = { role: 'guard' };

    User.find.mockReturnValue({
      select: jest.fn().mockResolvedValue([]),
    });

    await getAuditLogs(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      logs: [],
      pagination: { page: 1, limit: 50, total: 0, hasNext: false },
    });
  });

  it('should intersect role and userId filters when both are given', async () => {
    req.query = { role: 'admin', userId: 'user1' };

    User.find.mockReturnValue({
      select: jest.fn().mockResolvedValue([{ _id: 'user1' }]),
    });
    mockAuditLogFind([{ _id: 'log1', action: 'LOGIN_SUCCESS' }]);
    AuditLog.countDocuments.mockResolvedValue(1);

    await getAuditLogs(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should combine role and action filters', async () => {
    req.query = { role: 'admin', action: 'LOGIN_SUCCESS' };

    User.find.mockReturnValue({
      select: jest.fn().mockResolvedValue([{ _id: 'user1' }]),
    });
    mockAuditLogFind([{ _id: 'log1', action: 'LOGIN_SUCCESS' }]);
    AuditLog.countDocuments.mockResolvedValue(1);

    await getAuditLogs(req, res);

    expect(AuditLog.find).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'LOGIN_SUCCESS' })
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should exclude soft-deleted users when filtering by role', async () => {
    req.query = { role: 'admin' };

    User.find.mockReturnValue({
      select: jest.fn().mockResolvedValue([]),
    });

    await getAuditLogs(req, res);

    expect(User.find).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'admin', isDeleted: { $ne: true } })
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ logs: [] })
    );
  });

  it('should return empty when userId does not belong to the given role', async () => {
    req.query = { role: 'guard', userId: 'user1' };

    User.find.mockReturnValue({
      select: jest.fn().mockResolvedValue([{ _id: 'someOtherUser' }]),
    });

    await getAuditLogs(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ logs: [] })
    );
  });
});