import { beforeEach, describe, expect, jest, test } from "@jest/globals";

jest.unstable_mockModule("../src/middleware/auth.js", () => ({
  default: (req, _res, next) => {
    req.user = {
      id: "681b6d9e7f3d8f4b9c999999",
      _id: "681b6d9e7f3d8f4b9c999999",
      role: "employer",
    };
    next();
  },
}));

jest.unstable_mockModule("../src/controllers/equipment.controller.js", () => ({
  createEquipment: jest.fn(),
  assignEquipment: jest.fn(),
  reportEquipment: jest.fn(),
  getEquipmentByGuard: jest.fn((req, res) =>
    res.status(200).json({ shouldNotReach: true }),
  ),
}));

const request = (await import("supertest")).default;
const express = (await import("express")).default;
const equipmentRoutes = (await import("../src/routes/equipment.routes.js"))
  .default;
const equipmentController = await import(
  "../src/controllers/equipment.controller.js"
);

const GUARD_ID = "681b6d9e7f3d8f4b9c123456";

const createApp = () => {
  const app = express();
  app.use("/api/v1/equipment", equipmentRoutes);
  return app;
};

describe("GET /api/v1/equipment/guard/:guardId role denial", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("authenticated Employer receives 403 and does not reach the controller", async () => {
    const res = await request(createApp()).get(
      `/api/v1/equipment/guard/${GUARD_ID}`,
    );

    expect(res.status).toBe(403);
    expect(res.body).toEqual({
      message: "Forbidden: Access denied for your role.",
    });
    expect(equipmentController.getEquipmentByGuard).not.toHaveBeenCalled();
  });
});
