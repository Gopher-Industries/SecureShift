import mongoose from 'mongoose';
import Timesheet from '../src/models/Timesheet.js';
import { getTimesheetById, listTimesheets } from '../src/controllers/timesheet.controller.js';

jest.mock('../src/models/Timesheet.js', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    findOne: jest.fn(),
    countDocuments: jest.fn(),
  },
}));

const createResponse = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

const createListQuery = (items = []) => {
  const query = {
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(items),
  };

  return query;
};

const createOneQuery = (item = null) => {
  const query = {
    populate: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(item),
  };

  return query;
};

describe('Timesheet Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists timesheets scoped to an employer', async () => {
    const employerId = new mongoose.Types.ObjectId();
    const listQuery = createListQuery([{ _id: 'timesheet1' }]);

    Timesheet.find.mockReturnValue(listQuery);
    Timesheet.countDocuments.mockResolvedValue(1);

    const req = {
      user: { _id: employerId, role: 'employer' },
      query: { page: '1', limit: '10' },
    };
    const res = createResponse();

    await listTimesheets(req, res);

    expect(Timesheet.find).toHaveBeenCalledWith({ employerId });
    expect(Timesheet.countDocuments).toHaveBeenCalledWith({ employerId });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        limit: 10,
        total: 1,
        items: [{ _id: 'timesheet1' }],
      })
    );
  });

  it('prevents guards from filtering to another guard', async () => {
    const guardId = new mongoose.Types.ObjectId();
    const otherGuardId = new mongoose.Types.ObjectId();
    const req = {
      user: { _id: guardId, role: 'guard' },
      query: { guardId: String(otherGuardId) },
    };
    const res = createResponse();

    await listTimesheets(req, res);

    expect(Timesheet.find).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Guards can only access their own timesheets',
    });
  });

  it('gets one timesheet using role scope', async () => {
    const guardId = new mongoose.Types.ObjectId();
    const timesheetId = new mongoose.Types.ObjectId();
    const oneQuery = createOneQuery({ _id: timesheetId, guardId });

    Timesheet.findOne.mockReturnValue(oneQuery);

    const req = {
      user: { _id: guardId, role: 'guard' },
      params: { id: String(timesheetId) },
    };
    const res = createResponse();

    await getTimesheetById(req, res);

    expect(Timesheet.findOne).toHaveBeenCalledWith({
      _id: String(timesheetId),
      guardId,
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ _id: timesheetId, guardId });
  });
});
