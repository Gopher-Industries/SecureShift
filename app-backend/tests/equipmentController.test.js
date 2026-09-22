import { createEquipment } from "../src/controllers/equipment.controller.js";
import Equipment from "../src/models/Equipment.js";

jest.mock("../src/models/Equipment.js", () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
  },
}));

describe("Equipment Controller Tests", () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      user: {
        id: "user-1",
      },
      body: {},
      audit: {
        log: jest.fn(),
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jest.clearAllMocks();
  });

  const expectInvalidName = async (name) => {
    req.body = { name };

    await createEquipment(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Equipment name is required.",
    });
    expect(Equipment.create).not.toHaveBeenCalled();
  };

  it("should reject a numeric equipment name", async () => {
    await expectInvalidName(123);
  });

  it("should reject a boolean equipment name", async () => {
    await expectInvalidName(true);
  });

  it("should reject an object equipment name", async () => {
    await expectInvalidName({ value: "Radio" });
  });

  it("should reject an array equipment name", async () => {
    await expectInvalidName(["Radio"]);
  });

  it("should reject empty and whitespace-only equipment names", async () => {
    await expectInvalidName("");

    jest.clearAllMocks();

    await expectInvalidName("   ");
  });

  it("should preserve valid equipment creation", async () => {
    const equipment = {
      _id: "equipment-1",
      name: "Safety Radio",
      assignedTo: null,
      status: "ACTIVE",
    };

    req.body = {
      name: "Safety Radio",
    };

    Equipment.create.mockResolvedValue(equipment);

    await createEquipment(req, res);

    expect(Equipment.create).toHaveBeenCalledWith({
      name: "Safety Radio",
      assignedTo: null,
      status: "ACTIVE",
    });
    expect(req.audit.log).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: "Equipment created successfully.",
      equipment,
    });
  });
});
