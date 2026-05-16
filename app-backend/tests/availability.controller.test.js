import {
  createOrUpdateAvailability,
  getAvailability,
} from '../src/controllers/availability.controller.js';

import Availability from '../src/models/Availability.js';
import mongoose from 'mongoose';

jest.mock('../src/models/Availability.js');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn();
  return res;
};

const mockReq = (overrides = {}) => ({
  user: { id: 'user123', role: 'user' },
  body: {},
  params: {},
  audit: {
    log: jest.fn(),
  },
  ...overrides,
});

describe('Availability Controller', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------
  // CREATE / UPDATE
  // ---------------------------

  test('should return 401 if no user', async () => {
    const req = mockReq({ user: null });
    const res = mockRes();

    await createOrUpdateAvailability(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('should return 400 for invalid time slot format', async () => {
    const req = mockReq({
      body: {
        days: ['Monday'],
        timeSlots: ['invalid-format'],
      },
    });
    const res = mockRes();

    await createOrUpdateAvailability(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('should return 400 when start time is after end time', async () => {
    const req = mockReq({
      body: {
        days: ['Monday'],
        timeSlots: ['18:00-10:00'],
      },
    });
    const res = mockRes();

    await createOrUpdateAvailability(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('should create/update availability successfully', async () => {
    const mockAvailability = {
      _id: 'avail123',
      user: 'user123',
      days: ['Monday'],
      timeSlots: ['09:00-12:00'],
    };

    Availability.findOneAndUpdate.mockResolvedValue({
      ...mockAvailability,
      populate: jest.fn().mockResolvedValue(mockAvailability),
    });

    const req = mockReq({
      body: {
        days: ['Monday'],
        timeSlots: ['09:00-12:00'],
      },
    });

    const res = mockRes();

    await createOrUpdateAvailability(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
  });

  test('admin can update another user availability', async () => {
    const mockAvailability = {
      _id: 'avail123',
    };

    Availability.findOneAndUpdate.mockResolvedValue({
      ...mockAvailability,
      populate: jest.fn().mockResolvedValue(mockAvailability),
    });

    const req = mockReq({
      user: { id: 'admin1', role: 'admin' },
      body: {
        user: 'otherUser123',
        days: ['Tuesday'],
        timeSlots: ['10:00-12:00'],
      },
    });

    const res = mockRes();

    await createOrUpdateAvailability(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  // ---------------------------
  // GET AVAILABILITY
  // ---------------------------

  test('should return 400 for invalid userId', async () => {
    const req = mockReq({
      params: { userId: 'invalid-id' },
    });

    const res = mockRes();

    await getAvailability(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('should return 403 when accessing another user', async () => {
    const req = mockReq({
      user: { id: 'user1', role: 'user' },
      params: { userId: 'user2' },
    });

    const res = mockRes();

    await getAvailability(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('should return 404 if availability not found', async () => {
    Availability.findOne.mockReturnValue({
      populate: jest.fn().mockResolvedValue(null),
    });

    const req = mockReq({
      params: { userId: 'user123' },
    });

    const res = mockRes();

    await getAvailability(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('should return availability successfully', async () => {
    const mockData = {
      _id: 'avail123',
      user: 'user123',
    };

    Availability.findOne.mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockData),
    });

    const req = mockReq({
      params: { userId: 'user123' },
    });

    const res = mockRes();

    await getAvailability(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ availability: mockData })
    );
  });

});