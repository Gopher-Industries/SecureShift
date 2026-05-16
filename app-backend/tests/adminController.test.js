import { adminLogin } from '../src/controllers/adminController.js';
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