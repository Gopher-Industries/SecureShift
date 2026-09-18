import { jest } from "@jest/globals";
import { ACTIONS } from "../src/middleware/logger.js";

jest.unstable_mockModule("../src/models/Branch.js", () => ({
  default: Object.assign(jest.fn(), {
    findOne: jest.fn(),
    find: jest.fn(),
  }),
}));

jest.unstable_mockModule("../src/models/Shift.js", () => ({
  default: {
    find: jest.fn(),
  },
}));

const { createSite, getAllSites, getSiteUtilisation, updateSite, deleteSite } =
  await import("../src/controllers/branch.controller.js");

const { default: Branch } = await import("../src/models/Branch.js");
const { default: Shift } = await import("../src/models/Shift.js");

const VALID_SITE_ID = "507f1f77bcf86cd799439011";

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn();
  return res;
};

const mockReq = (overrides = {}) => ({
  user: { id: "emp123", role: "employer" },
  body: {},
  params: {},
  audit: {
    log: jest.fn(),
  },
  ...overrides,
});

describe("Branch Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------
  // CREATE SITE
  // -------------------------
  test("should create site successfully", async () => {
    Branch.findOne.mockResolvedValue(null);

    const mockSite = {
      _id: "site123",
      name: "Site A",
      code: "A1",
      location: {},
    };

    const mockSave = jest.fn().mockResolvedValue(true);
    Branch.mockImplementation(() => ({
      ...mockSite,
      save: mockSave,
    }));

    const req = mockReq({
      body: {
        name: "Site A",
        code: "A1",
        location: { city: "Melbourne" },
      },
    });

    const res = mockRes();

    await createSite(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(req.audit.log).toHaveBeenCalled();
  });

  test("should return 400 if site code already exists", async () => {
    Branch.findOne.mockResolvedValue({ _id: "existing" });

    const req = mockReq({
      body: {
        name: "Site A",
        code: "A1",
      },
    });

    const res = mockRes();

    await createSite(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Site code already exists",
    });
  });

  // -------------------------
  // GET ALL SITES
  // -------------------------
  test("should get all sites", async () => {
    Branch.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          { _id: "1", name: "A" },
          { _id: "2", name: "B" },
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
      }),
    );
  });

  // -------------------------
  // SITE UTILISATION
  // -------------------------
  test("should return site utilisation report for employer", async () => {
    const siteId = "507f1f77bcf86cd799439012";

    Branch.find.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          {
            _id: siteId,
            name: "Site A",
            code: "A1",
            isActive: true,
          },
        ]),
      }),
    });

    Shift.find.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          {
            siteId,
            status: "assigned",
            acceptedBy: "507f1f77bcf86cd799439013",
            startTime: "09:00",
            endTime: "17:00",
            breakTime: 30,
          },
          {
            siteId,
            status: "completed",
            acceptedBy: null,
            startTime: "10:00",
            endTime: "14:00",
            breakTime: 0,
          },
        ]),
      }),
    });

    const req = mockReq({
      query: {
        from: "2026-09-01",
        to: "2026-09-30",
      },
    });

    const res = mockRes();

    await getSiteUtilisation(req, res);

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      from: "2026-09-01",
      to: "2026-09-30",
      sites: [
        {
          siteId,
          name: "Site A",
          code: "A1",
          isActive: true,
          shiftCounts: {
            draft: 0,
            open: 0,
            applied: 0,
            assigned: 1,
            completed: 1,
          },
          assignedShiftCount: 1,
          unassignedShiftCount: 1,
          scheduledHours: 11.5,
        },
      ],
      withoutSite: {
        shiftCounts: {
          draft: 0,
          open: 0,
          applied: 0,
          assigned: 0,
          completed: 0,
        },
        assignedShiftCount: 0,
        unassignedShiftCount: 0,
        scheduledHours: 0,
      },
    });
  });

  test("should return 400 when utilisation dates are missing", async () => {
    const req = mockReq({
      query: {
        from: "2026-09-01",
      },
    });

    const res = mockRes();

    await getSiteUtilisation(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Both from and to dates are required",
    });

    expect(Branch.find).not.toHaveBeenCalled();
    expect(Shift.find).not.toHaveBeenCalled();
  });

  test("should return 400 when utilisation date range is invalid", async () => {
    const req = mockReq({
      query: {
        from: "2026-09-30",
        to: "2026-09-01",
      },
    });

    const res = mockRes();

    await getSiteUtilisation(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "From date must be before or equal to to date",
    });

    expect(Branch.find).not.toHaveBeenCalled();
    expect(Shift.find).not.toHaveBeenCalled();
  });

  test("should calculate overnight shift hours and handle shifts without a site", async () => {
    const siteId = "507f1f77bcf86cd799439012";

    Branch.find.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          {
            _id: siteId,
            name: "Night Site",
            code: "N1",
            isActive: true,
          },
        ]),
      }),
    });

    Shift.find.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          {
            siteId,
            status: "assigned",
            acceptedBy: "507f1f77bcf86cd799439013",
            startTime: "22:00",
            endTime: "06:00",
            breakTime: 30,
            spansMidnight: true,
          },
          {
            siteId: null,
            status: "open",
            acceptedBy: null,
            startTime: "09:00",
            endTime: "13:00",
            breakTime: 0,
          },
        ]),
      }),
    });

    const req = mockReq({
      query: {
        from: "2026-09-01",
        to: "2026-09-30",
      },
    });

    const res = mockRes();

    await getSiteUtilisation(req, res);

    expect(res.status).toHaveBeenCalledWith(200);

    const response = res.json.mock.calls[0][0];

    expect(response.sites[0].scheduledHours).toBe(7.5);
    expect(response.sites[0].assignedShiftCount).toBe(1);

    expect(response.withoutSite.shiftCounts.open).toBe(1);
    expect(response.withoutSite.unassignedShiftCount).toBe(1);
    expect(response.withoutSite.scheduledHours).toBe(4);
  });

  // -------------------------
  // UPDATE SITE
  // -------------------------
  test("should update site successfully", async () => {
    const mockSite = {
      _id: VALID_SITE_ID,
      name: "Old Name",
      code: "A1",
      location: {},
      save: jest.fn().mockResolvedValue(true),
    };

    Branch.findOne.mockResolvedValue(mockSite);

    const req = mockReq({
      params: { id: VALID_SITE_ID },
      body: {
        name: "New Name",
      },
    });

    const res = mockRes();

    await updateSite(req, res);

    expect(mockSite.name).toBe("New Name");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(req.audit.log).toHaveBeenCalled();
  });

  test("should return 404 if site not found on update", async () => {
    Branch.findOne.mockResolvedValue(null);

    const req = mockReq({
      params: { id: VALID_SITE_ID },
    });

    const res = mockRes();

    await updateSite(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("should return 400 when site id is malformed on update", async () => {
    const req = mockReq({
      params: { id: "not-an-object-id" },
      body: { name: "X", code: "Y" },
    });
    const res = mockRes();

    await updateSite(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid site ID" });
    expect(Branch.findOne).not.toHaveBeenCalled();
  });

  // -------------------------
  // DELETE SITE
  // -------------------------
  test("should delete site successfully (soft delete)", async () => {
    const mockSite = {
      _id: VALID_SITE_ID,
      isActive: true,
      save: jest.fn().mockResolvedValue(true),
    };

    Branch.findOne.mockResolvedValue(mockSite);

    const req = mockReq({
      params: { id: VALID_SITE_ID },
    });

    const res = mockRes();

    await deleteSite(req, res);

    expect(mockSite.isActive).toBe(false);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(req.audit.log).toHaveBeenCalled();
  });

  test("should return 404 if site not found on delete", async () => {
    Branch.findOne.mockResolvedValue(null);

    const req = mockReq({
      params: { id: VALID_SITE_ID },
    });

    const res = mockRes();

    await deleteSite(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("should return 400 when site id is malformed on delete", async () => {
    const req = mockReq({
      params: { id: "not-an-object-id" },
    });
    const res = mockRes();

    await deleteSite(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid site ID" });
    expect(Branch.findOne).not.toHaveBeenCalled();
  });
});
