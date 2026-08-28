import { jest } from "@jest/globals";

jest.unstable_mockModule("../src/models/Equipment.js", () => ({
  default: {
    find: jest.fn(),
  },
}));

const { getEquipmentByGuard } = await import(
  "../src/controllers/equipment.controller.js"
);
const { default: Equipment } = await import("../src/models/Equipment.js");

const GUARD_ID = "681b6d9e7f3d8f4b9c123456";
const OTHER_GUARD_ID = "681b6d9e7f3d8f4b9c654321";

const mockEquipment = [
  {
    _id: "681b8d6d7f3d8f4b9c987111",
    name: "Security Radio",
    assignedTo: GUARD_ID,
    status: "ACTIVE",
  },
];

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn();
  return res;
};

describe("GET /api/v1/equipment/guard/:guardId authorisation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Equipment.find.mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockEquipment),
    });
  });

  test("authenticated Guard requesting their own guardId receives 200 and their equipment", async () => {
    const req = {
      user: { id: GUARD_ID, _id: GUARD_ID, role: "guard" },
      params: { guardId: GUARD_ID },
    };
    const res = mockRes();

    await getEquipmentByGuard(req, res);

    expect(Equipment.find).toHaveBeenCalledWith({ assignedTo: GUARD_ID });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      count: mockEquipment.length,
      equipment: mockEquipment,
    });
  });

  test("authenticated Guard requesting another Guard's guardId receives 403 and does not query equipment", async () => {
    const req = {
      user: { id: GUARD_ID, _id: GUARD_ID, role: "guard" },
      params: { guardId: OTHER_GUARD_ID },
    };
    const res = mockRes();

    await getEquipmentByGuard(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: "Forbidden: cannot access another guard's equipment.",
    });
    expect(Equipment.find).not.toHaveBeenCalled();
  });

  test("authenticated Admin requesting a Guard's guardId receives 200", async () => {
    const req = {
      user: {
        id: "681b6d9e7f3d8f4b9c111111",
        _id: "681b6d9e7f3d8f4b9c111111",
        role: "admin",
      },
      params: { guardId: GUARD_ID },
    };
    const res = mockRes();

    await getEquipmentByGuard(req, res);

    expect(Equipment.find).toHaveBeenCalledWith({ assignedTo: GUARD_ID });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      count: mockEquipment.length,
      equipment: mockEquipment,
    });
  });
});
