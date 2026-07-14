import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
  createShiftRequest,
  getShiftRequests,
  updateShiftRequest,
} from '../src/controllers/shiftrequest.controller.js';
import {
  createShiftRequest as createShiftRequestService,
  listShiftRequestsForUser,
  reviewShiftRequest,
} from '../src/services/shiftrequest.service.js';

jest.mock('../src/services/shiftrequest.service.js');

const response = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

describe('shiftrequest.controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a shift request through the service', async () => {
    const req = {
      user: { _id: 'guard-1', role: 'guard' },
      body: { type: 'LEAVE' },
    };
    const res = response();
    const data = { _id: 'request-1', type: 'LEAVE' };

    createShiftRequestService.mockResolvedValue(data);

    await createShiftRequest(req, res);

    expect(createShiftRequestService).toHaveBeenCalledWith({
      user: req.user,
      payload: req.body,
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data,
    }));
  });

  it('returns scoped shift requests', async () => {
    const req = {
      user: { _id: 'employer-1', role: 'employer' },
      query: { status: 'PENDING' },
    };
    const res = response();
    const result = { page: 1, limit: 20, total: 0, pages: 0, items: [] };

    listShiftRequestsForUser.mockResolvedValue(result);

    await getShiftRequests(req, res);

    expect(listShiftRequestsForUser).toHaveBeenCalledWith({
      user: req.user,
      query: req.query,
    });
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      ...result,
    });
  });

  it('maps service errors to HTTP responses', async () => {
    const req = {
      user: { _id: 'guard-1', role: 'guard' },
      params: { id: 'request-1' },
      body: { status: 'APPROVED' },
    };
    const res = response();
    const error = new Error('Only employers or admins can approve or reject requests');
    error.statusCode = 403;

    reviewShiftRequest.mockRejectedValue(error);

    await updateShiftRequest(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Only employers or admins can approve or reject requests',
    });
  });
});
