import { jest } from "@jest/globals";

jest.unstable_mockModule("../src/models/Branch.js", () => {
  const Branch = jest.fn();

  Branch.findOne = jest.fn();
  Branch.find = jest.fn();

  return { default: Branch };
});

const {
  createSite,
  getAllSites,
  updateSite,
  deleteSite,
} = await import("../src/controllers/branch.controller.js");

const { default: Branch } = await import("../src/models/Branch.js");

jest.unstable_mockModule("../src/models/Branch.js", () => {
  const Branch = jest.fn();

  Branch.findOne = jest.fn();
  Branch.find = jest.fn();

  return { default: Branch };
});

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

    test("should clear an optional address field when an empty string is provided", async () => {
    const mockSite = {
      _id: "site123",
      name: "Site A",
      code: "A1",
      location: {
        line1: "123 Main Street",
        line2: "Level 2",
        city: "Melbourne",
        state: "VIC",
        postcode: "3000",
        country: "Australia",
      },
      save: jest.fn().mockResolvedValue(true),
    };

    Branch.findOne.mockResolvedValue(mockSite);

    const req = mockReq({
      params: { id: "site123" },
      body: {
        location: {
          line1: "",
        },
      },
    });

    const res = mockRes();

    await updateSite(req, res);

    expect(mockSite.location.line1).toBe("");
    expect(mockSite.location.city).toBe("Melbourne");
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("should preserve an optional address field when it is omitted", async () => {
    const mockSite = {
      _id: "site123",
      name: "Site A",
      code: "A1",
      location: {
        line1: "123 Main Street",
        line2: "Level 2",
        city: "Melbourne",
        state: "VIC",
        postcode: "3000",
        country: "Australia",
      },
      save: jest.fn().mockResolvedValue(true),
    };

    Branch.findOne.mockResolvedValue(mockSite);

    const req = mockReq({
      params: { id: "site123" },
      body: {
        location: {
          city: "Geelong",
        },
      },
    });

    const res = mockRes();

    await updateSite(req, res);

    expect(mockSite.location.line1).toBe("123 Main Street");
    expect(mockSite.location.city).toBe("Geelong");
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("should clear multiple optional address fields when empty strings are provided", async () => {
    const mockSite = {
      _id: "site123",
      name: "Site A",
      code: "A1",
      location: {
        line1: "123 Main Street",
        line2: "Level 2",
        city: "Melbourne",
        state: "VIC",
        postcode: "3000",
        country: "Australia",
      },
      save: jest.fn().mockResolvedValue(true),
    };

    Branch.findOne.mockResolvedValue(mockSite);

    const req = mockReq({
      params: { id: "site123" },
      body: {
        location: {
          line1: "",
          line2: "",
          city: "",
          state: "",
          postcode: "",
          country: "",
        },
      },
    });

    const res = mockRes();

    await updateSite(req, res);

    expect(mockSite.location).toEqual({
      line1: "",
      line2: "",
      city: "",
      state: "",
      postcode: "",
      country: "",
    });
    expect(res.status).toHaveBeenCalledWith(200);
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
