import { getDashboardStats } from '../src/controllers/dashboard.controller.js';
import Shift from '../src/models/Shift.js';

jest.mock('../src/models/Shift.js');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn();
  return res;
};

const mockReq = (overrides = {}) => ({
  user: { _id: 'employer123' },
  ...overrides,
});

describe('Dashboard Controller', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ----------------------------
  // SUCCESS CASE
  // ----------------------------
  test('should return dashboard stats successfully', async () => {
    // Mock countDocuments
    Shift.countDocuments
      .mockResolvedValueOnce(10) // total
      .mockResolvedValueOnce(3)  // assigned
      .mockResolvedValueOnce(5)  // completed
      .mockResolvedValueOnce(2); // cancelled

    // Mock recent shifts chain
    Shift.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue([
        { title: 'Shift A', status: 'completed' },
        { title: 'Shift B', status: 'assigned' },
      ]),
    });

    // Mock aggregation
    Shift.aggregate.mockResolvedValue([
      {
        averageRating: 4.5,
        totalRated: 8,
      },
    ]);

    const req = mockReq();
    const res = mockRes();

    await getDashboardStats(req, res);

    // Assertions
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        stats: {
          total: 10,
          assigned: 3,
          completed: 5,
          cancelled: 2,
        },
        recentShifts: expect.any(Array),
        reviews: {
          averageRating: 4.5,
          totalRated: 8,
        },
      })
    );
  });

  // ----------------------------
  // EDGE CASE: no reviews
  // ----------------------------
  test('should return default review object if no ratings exist', async () => {
    Shift.countDocuments
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);

    Shift.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue([]),
    });

    Shift.aggregate.mockResolvedValue([]);

    const req = mockReq();
    const res = mockRes();

    await getDashboardStats(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        reviews: {
          averageRating: 0,
          totalRated: 0,
        },
      })
    );
  });

  // ----------------------------
  // ERROR CASE
  // ----------------------------
  test('should return 500 on error', async () => {
    Shift.countDocuments.mockRejectedValue(new Error('DB failure'));

    const req = mockReq();
    const res = mockRes();

    await getDashboardStats(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Dashboard error',
      })
    );
  });

});