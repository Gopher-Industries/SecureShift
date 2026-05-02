import { jest } from '@jest/globals';

const mockShiftSave     = jest.fn().mockResolvedValue(true);
const mockShiftFindById = jest.fn();
const mockShiftFind     = jest.fn();

jest.unstable_mockModule('mongoose', () => ({
  default: {
    isValidObjectId: jest.fn((id) => /^[a-f\d]{24}$/i.test(String(id))),
  },
  isValidObjectId: jest.fn((id) => /^[a-f\d]{24}$/i.test(String(id))),
}));

jest.unstable_mockModule('../src/models/Shift.js', () => ({
  default: {
    findById: mockShiftFindById,
    find:     mockShiftFind,
  },
}));

jest.unstable_mockModule('../src/middleware/logger.js', () => ({
  ACTIONS: {
    SHIFT_APPLIED:  'SHIFT_APPLIED',
    SHIFT_APPROVED: 'SHIFT_APPROVED',
  },
}));

jest.unstable_mockModule('../src/utils/timeUtils.js', () => ({
  timeToMinutes: jest.fn((t) => {
    const [h, m] = String(t).split(':').map(Number);
    return h * 60 + m;
  }),
  normalizeEnd: jest.fn((start, end) => {
    const [sh, sm] = String(start).split(':').map(Number);
    const [eh, em] = String(end).split(':').map(Number);
    const startMins = sh * 60 + sm;
    let endMins = eh * 60 + em;
    if (endMins <= startMins) endMins += 24 * 60;
    return endMins;
  }),
}));

const { applyForShiftService, approveShiftService } = await import('../src/services/shiftApplication.service.js');

const VALID_SHIFT_ID = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const VALID_USER_ID  = 'bbbbbbbbbbbbbbbbbbbbbbbb';
const VALID_GUARD_ID = 'cccccccccccccccccccccccc';
const VALID_OWNER_ID = 'dddddddddddddddddddddddd';

const futureDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d;
};

const mockAudit = { log: jest.fn().mockResolvedValue(true) };

const makeShift = (overrides = {}) => ({
  _id:        VALID_SHIFT_ID,
  status:     'open',
  date:       futureDate(),
  startTime:  '09:00',
  endTime:    '17:00',
  createdBy:  VALID_OWNER_ID,
  applicants: [],
  save:       mockShiftSave,
  ...overrides,
});

describe('applyForShiftService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockShiftFind.mockResolvedValue([]);
  });

  describe('validation', () => {
    it('throws 400 for invalid shiftId', async () => {
      await expect(
        applyForShiftService({ shiftId: 'bad-id', userId: VALID_USER_ID, audit: mockAudit })
      ).rejects.toMatchObject({ statusCode: 400, message: 'Invalid id' });
    });

    it('throws 401 when userId is missing', async () => {
      await expect(
        applyForShiftService({ shiftId: VALID_SHIFT_ID, userId: null, audit: mockAudit })
      ).rejects.toMatchObject({ statusCode: 401 });
    });

    it('throws 401 when userId is invalid', async () => {
      await expect(
        applyForShiftService({ shiftId: VALID_SHIFT_ID, userId: 'bad-id', audit: mockAudit })
      ).rejects.toMatchObject({ statusCode: 401 });
    });
  });
});

describe('shift lookup', () => {
  it('throws 404 when shift not found', async () => {
    mockShiftFindById.mockResolvedValue(null);

    await expect(
      applyForShiftService({ shiftId: VALID_SHIFT_ID, userId: VALID_USER_ID, audit: mockAudit })
    ).rejects.toMatchObject({ statusCode: 404, message: 'Shift not found' });
  });
});

describe('business rules', () => {
  it('throws 400 when shift is not open', async () => {
    mockShiftFindById.mockResolvedValue(makeShift({ status: 'assigned' }));

    await expect(
      applyForShiftService({ shiftId: VALID_SHIFT_ID, userId: VALID_USER_ID, audit: mockAudit })
    ).rejects.toMatchObject({ statusCode: 400, message: 'Can only apply to open shifts' });
  });

  it('throws 400 when shift has already started', async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);

    mockShiftFindById.mockResolvedValue(makeShift({ date: pastDate, startTime: '09:00' }));

    await expect(
      applyForShiftService({ shiftId: VALID_SHIFT_ID, userId: VALID_USER_ID, audit: mockAudit })
    ).rejects.toMatchObject({ statusCode: 400, message: /already started or in the past/ });
  });

  it('throws 400 when employer applies to own shift', async () => {
    mockShiftFindById.mockResolvedValue(makeShift({ createdBy: VALID_USER_ID }));

    await expect(
      applyForShiftService({ shiftId: VALID_SHIFT_ID, userId: VALID_USER_ID, audit: mockAudit })
    ).rejects.toMatchObject({ statusCode: 400, message: 'Employer cannot apply to own shift' });
  });

  it('throws 400 when user already applied', async () => {
    mockShiftFindById.mockResolvedValue(makeShift({ applicants: [VALID_USER_ID] }));

    await expect(
      applyForShiftService({ shiftId: VALID_SHIFT_ID, userId: VALID_USER_ID, audit: mockAudit })
    ).rejects.toMatchObject({ statusCode: 400, message: 'Already applied' });
  });

  it('throws 400 when shift overlaps with an existing applied shift', async () => {
    mockShiftFindById.mockResolvedValue(makeShift());
    mockShiftFind.mockResolvedValue([
      makeShift({ _id: 'eeeeeeeeeeeeeeeeeeeeeeee', startTime: '08:00', endTime: '12:00' }),
    ]);

    await expect(
      applyForShiftService({ shiftId: VALID_SHIFT_ID, userId: VALID_USER_ID, audit: mockAudit })
    ).rejects.toMatchObject({ statusCode: 400, message: /overlaps/ });
  });
});

describe('success', () => {
  it('adds applicant, sets status to applied, saves and logs audit', async () => {
    const shift = makeShift();
    mockShiftFindById.mockResolvedValue(shift);
    mockShiftFind.mockResolvedValue([]);

    const result = await applyForShiftService({
      shiftId: VALID_SHIFT_ID,
      userId:  VALID_USER_ID,
      audit:   mockAudit,
    });

    expect(shift.applicants).toContain(VALID_USER_ID);
    expect(shift.status).toBe('applied');
    expect(mockShiftSave).toHaveBeenCalledTimes(1);
    expect(mockAudit.log).toHaveBeenCalledWith(VALID_USER_ID, 'SHIFT_APPLIED', {
      shiftId: shift._id,
    });
    expect(result.message).toBe('Application submitted');
    expect(result.shift).toBe(shift);
  });

  it('sanitizes falsy values from applicants before pushing', async () => {
    const shift = makeShift({ applicants: [null, undefined, ''] });
    mockShiftFindById.mockResolvedValue(shift);
    mockShiftFind.mockResolvedValue([]);

    await applyForShiftService({ shiftId: VALID_SHIFT_ID, userId: VALID_USER_ID, audit: mockAudit });

    expect(shift.applicants).toEqual([VALID_USER_ID]);
  });

  it('does not flag overlap when no other shifts exist on that date', async () => {
    mockShiftFindById.mockResolvedValue(makeShift());
    mockShiftFind.mockResolvedValue([]);

    const result = await applyForShiftService({
      shiftId: VALID_SHIFT_ID,
      userId:  VALID_USER_ID,
      audit:   mockAudit,
    });

    expect(result.message).toBe('Application submitted');
  });
});

describe('approveShiftService', () => {
  const ownerUser = { _id: VALID_OWNER_ID, role: 'employer' };
  const adminUser = { _id: VALID_USER_ID,  role: 'admin' };

  beforeEach(() => jest.clearAllMocks());

  describe('validation', () => {
    it('throws 400 for invalid shiftId', async () => {
      await expect(
        approveShiftService({ shiftId: 'bad', guardId: VALID_GUARD_ID, user: ownerUser, audit: mockAudit })
      ).rejects.toMatchObject({ statusCode: 400, message: 'Invalid id(s)' });
    });

    it('throws 400 for invalid guardId', async () => {
      await expect(
        approveShiftService({ shiftId: VALID_SHIFT_ID, guardId: 'bad', user: ownerUser, audit: mockAudit })
      ).rejects.toMatchObject({ statusCode: 400, message: 'Invalid id(s)' });
    });

    it('throws 401 when user._id is missing', async () => {
      await expect(
        approveShiftService({ shiftId: VALID_SHIFT_ID, guardId: VALID_GUARD_ID, user: {}, audit: mockAudit })
      ).rejects.toMatchObject({ statusCode: 401 });
    });
  });
  
  describe('shift lookup', () => {
  it('throws 404 when shift not found', async () => {
    mockShiftFindById.mockResolvedValue(null);

    await expect(
      approveShiftService({ shiftId: VALID_SHIFT_ID, guardId: VALID_GUARD_ID, user: ownerUser, audit: mockAudit })
    ).rejects.toMatchObject({ statusCode: 404, message: 'Shift not found' });
  });
});

describe('authorization', () => {
  it('throws 403 when user is neither owner nor admin', async () => {
    const otherUser = { _id: VALID_USER_ID, role: 'guard' };
    mockShiftFindById.mockResolvedValue(makeShift({ applicants: [VALID_GUARD_ID] }));

    await expect(
      approveShiftService({ shiftId: VALID_SHIFT_ID, guardId: VALID_GUARD_ID, user: otherUser, audit: mockAudit })
    ).rejects.toMatchObject({ statusCode: 403, message: 'Not allowed' });
  });

  it('allows admin to approve any shift', async () => {
    mockShiftFindById.mockResolvedValue(makeShift({ applicants: [VALID_GUARD_ID] }));

    const result = await approveShiftService({
      shiftId: VALID_SHIFT_ID,
      guardId: VALID_GUARD_ID,
      user:    adminUser,
      audit:   mockAudit,
    });

    expect(result.message).toBe('Guard approved');
  });
});
describe('business rules', () => {
  it('throws 400 when shift is already assigned', async () => {
    mockShiftFindById.mockResolvedValue(makeShift({ status: 'assigned', applicants: [VALID_GUARD_ID] }));

    await expect(
      approveShiftService({ shiftId: VALID_SHIFT_ID, guardId: VALID_GUARD_ID, user: ownerUser, audit: mockAudit })
    ).rejects.toMatchObject({ statusCode: 400, message: 'Already assigned' });
  });

  it('throws 400 when shift is already completed', async () => {
    mockShiftFindById.mockResolvedValue(makeShift({ status: 'completed', applicants: [VALID_GUARD_ID] }));

    await expect(
      approveShiftService({ shiftId: VALID_SHIFT_ID, guardId: VALID_GUARD_ID, user: ownerUser, audit: mockAudit })
    ).rejects.toMatchObject({ statusCode: 400, message: 'Already completed' });
  });

  it('throws 400 when shift has already started', async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);

    mockShiftFindById.mockResolvedValue(
      makeShift({ date: pastDate, startTime: '09:00', applicants: [VALID_GUARD_ID] })
    );

    await expect(
      approveShiftService({ shiftId: VALID_SHIFT_ID, guardId: VALID_GUARD_ID, user: ownerUser, audit: mockAudit })
    ).rejects.toMatchObject({ statusCode: 400, message: /already started or in the past/ });
  });

  it('throws 400 when guard did not apply for the shift', async () => {
    mockShiftFindById.mockResolvedValue(makeShift({ applicants: [] }));

    await expect(
      approveShiftService({ shiftId: VALID_SHIFT_ID, guardId: VALID_GUARD_ID, user: ownerUser, audit: mockAudit })
    ).rejects.toMatchObject({ statusCode: 400, message: 'Guard did not apply for this shift' });
  });
});
describe('success', () => {
  it('assigns guard, sets status to assigned, removes other applicants by default', async () => {
    const otherApplicant = 'ffffffffffffffffffffffff';
    const shift = makeShift({ applicants: [VALID_GUARD_ID, otherApplicant] });
    mockShiftFindById.mockResolvedValue(shift);

    const result = await approveShiftService({
      shiftId: VALID_SHIFT_ID,
      guardId: VALID_GUARD_ID,
      user:    ownerUser,
      audit:   mockAudit,
    });

    expect(shift.assignedGuard).toBe(VALID_GUARD_ID);
    expect(shift.status).toBe('assigned');
    expect(shift.applicants).toEqual([VALID_GUARD_ID]);
    expect(mockShiftSave).toHaveBeenCalledTimes(1);
    expect(result.message).toBe('Guard approved');
  });

  it('keeps other applicants when keepOthers is true', async () => {
    const otherApplicant = 'ffffffffffffffffffffffff';
    const shift = makeShift({ applicants: [VALID_GUARD_ID, otherApplicant] });
    mockShiftFindById.mockResolvedValue(shift);

    await approveShiftService({
      shiftId:    VALID_SHIFT_ID,
      guardId:    VALID_GUARD_ID,
      keepOthers: true,
      user:       ownerUser,
      audit:      mockAudit,
    });

    expect(shift.applicants).toContain(otherApplicant);
    expect(shift.applicants).toContain(VALID_GUARD_ID);
  });

  it('logs audit with correct action and metadata', async () => {
    const shift = makeShift({ applicants: [VALID_GUARD_ID] });
    mockShiftFindById.mockResolvedValue(shift);

    await approveShiftService({
      shiftId:    VALID_SHIFT_ID,
      guardId:    VALID_GUARD_ID,
      keepOthers: false,
      user:       ownerUser,
      audit:      mockAudit,
    });

    expect(mockAudit.log).toHaveBeenCalledWith(ownerUser._id, 'SHIFT_APPROVED', {
      shiftId:         shift._id,
      approvedGuardId: VALID_GUARD_ID,
      keepOthers:      false,
    });
  });
});
});

