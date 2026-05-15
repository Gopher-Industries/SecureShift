import {
  createSite,
  getAllSites,
  updateSite,
  deleteSite,
} from '../src/controllers/branch.controller.js';

import Branch from '../src/models/Branch.js';
import { ACTIONS } from '../src/middleware/logger.js';

jest.mock('../src/models/Branch.js');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn();
  return res;
};

const mockReq = (overrides = {}) => ({
  user: { id: 'emp123', role: 'employer' },
  body: {},
  params: {},
  audit: {
    log: jest.fn(),
  },
  ...overrides,
});

describe('Branch Controller', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------
  // CREATE SITE
  // -------------------------
  test('should create site successfully', async () => {
    Branch.findOne.mockResolvedValue(null);
    Branch.prototype.save = jest.fn().mockResolvedValue(true);

    const mockSite = {
      _id: 'site123',
      name: 'Site A',
      code: 'A1',
      location: {},
    };

    Branch.mockImplementation(() => mockSite);

    const req = mockReq({
      body: {
        name: 'Site A',
        code: 'A1',
        location: { city: 'Melbourne' },
      },
    });

    const res = mockRes();

    await createSite(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(req.audit.log).toHaveBeenCalled();
  });

  test('should return 400 if site code already exists', async () => {
    Branch.findOne.mockResolvedValue({ _id: 'existing' });

    const req = mockReq({
      body: {
        name: 'Site A',
        code: 'A1',
      },
    });

    const res = mockRes();

    await createSite(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Site code already exists',
    });
  });

  // -------------------------
  // GET ALL SITES
  // -------------------------
  test('should get all sites', async () => {
    Branch.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          { _id: '1', name: 'A' },
          { _id: '2', name: 'B' },
        ]),
      }),
    });

    const req = mockReq();
    const res = mockRes();

    await getAllSites(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        count: 2,
      })
    );
  });

  // -------------------------
  // UPDATE SITE
  // -------------------------
  test('should update site successfully', async () => {
    const mockSite = {
      _id: 'site123',
      name: 'Old Name',
      code: 'A1',
      location: {},
      save: jest.fn().mockResolvedValue(true),
    };

    Branch.findOne.mockResolvedValue(mockSite);

    const req = mockReq({
      params: { id: 'site123' },
      body: {
        name: 'New Name',
      },
    });

    const res = mockRes();

    await updateSite(req, res);

    expect(mockSite.name).toBe('New Name');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(req.audit.log).toHaveBeenCalled();
  });

  test('should return 404 if site not found on update', async () => {
    Branch.findOne.mockResolvedValue(null);

    const req = mockReq({
      params: { id: 'site123' },
    });

    const res = mockRes();

    await updateSite(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  // -------------------------
  // DELETE SITE
  // -------------------------
  test('should delete site successfully (soft delete)', async () => {
    const mockSite = {
      _id: 'site123',
      isActive: true,
      save: jest.fn().mockResolvedValue(true),
    };

    Branch.findOne.mockResolvedValue(mockSite);

    const req = mockReq({
      params: { id: 'site123' },
    });

    const res = mockRes();

    await deleteSite(req, res);

    expect(mockSite.isActive).toBe(false);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(req.audit.log).toHaveBeenCalled();
  });

  test('should return 404 if site not found on delete', async () => {
    Branch.findOne.mockResolvedValue(null);

    const req = mockReq({
      params: { id: 'site123' },
    });

    const res = mockRes();

    await deleteSite(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

});