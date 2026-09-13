/**
 * Equipment Module Migration Tests
 *
 * Verifies that equipment.routes.js uses authorizeRoles from rbac.js
 * and that authorization behavior remains unchanged.
 */

jest.mock("../src/utils/crypto.js", () => ({
  encryptLicence: jest.fn().mockReturnValue("encrypted"),
  decryptLicence: jest.fn().mockReturnValue("decrypted"),
}));

jest.mock("../src/config/audit.js", () => ({
  __esModule: true,
  default: true,
}));

import {
  jest,
  describe,
  test,
  expect,
  beforeAll,
  afterAll,
} from "@jest/globals";
import request from "supertest";
import app from "../src/app.js";
import {
  startTestDatabase,
  clearDatabase,
  closeTestDatabase,
} from "./db-helper.js";
import Admin from "../src/models/Admin.js";
import Employer from "../src/models/Employer.js";
import Guard from "../src/models/Guard.js";
import Equipment from "../src/models/Equipment.js";

// Mock auth middleware - requires x-user-id and x-user-role headers
jest.mock("../src/middleware/auth.js", () => ({
  __esModule: true,
  default: (req, res, next) => {
    const userId = req.headers["x-user-id"];
    const role = req.headers["x-user-role"];
    if (!userId || !role) {
      return res
        .status(401)
        .json({ message: "Access denied. No token provided." });
    }
    req.user = {
      _id: userId,
      id: userId,
      role,
    };
    next();
  },
}));

// Mock audit middleware
jest.mock("../src/middleware/logger.js", () => ({
  ACTIONS: {
    EQUIPMENT_CREATED: "EQUIPMENT_CREATED",
    EQUIPMENT_ASSIGNED: "EQUIPMENT_ASSIGNED",
    EQUIPMENT_REPORTED: "EQUIPMENT_REPORTED",
  },
  auditMiddleware: (req, res, next) => {
    req.audit = { log: jest.fn().mockResolvedValue(undefined) };
    next();
  },
}));

describe("Equipment Module — authorizeRoles Migration", () => {
  let admin, employer, guard, otherGuard;
  let equipment;

  beforeAll(async () => {
    await startTestDatabase();

    admin = await Admin.create({
      name: "Admin",
      email: "admin.equip@test.com",
      password: "Password123!",
      role: "admin",
    });

    employer = await Employer.create({
      name: "Employer",
      email: "employer.equip@test.com",
      password: "Password123!",
      role: "employer",
      ABN: "12345678901",
    });

    guard = await Guard.create({
      name: "Guard",
      email: "guard.equip@test.com",
      password: "Password123!",
      role: "guard",
    });

    otherGuard = await Guard.create({
      name: "OtherGuard",
      email: "otherguard.equip@test.com",
      password: "Password123!",
      role: "guard",
    });

    // Create an equipment item for testing
    equipment = await Equipment.create({
      name: "Test Radio",
      assignedTo: guard._id,
      status: "ACTIVE",
    });
  });

  afterAll(async () => {
    await clearDatabase();
    await closeTestDatabase();
  });

  describe("POST /api/v1/equipment", () => {
    test("Guard can create equipment", async () => {
      const res = await request(app)
        .post("/api/v1/equipment")
        .set("x-user-id", guard._id.toString())
        .set("x-user-role", "guard")
        .send({ name: "New Radio" });
      expect(res.statusCode).toBe(201);
    });

    test("Admin can create equipment", async () => {
      const res = await request(app)
        .post("/api/v1/equipment")
        .set("x-user-id", admin._id.toString())
        .set("x-user-role", "admin")
        .send({ name: "Admin Radio" });
      expect(res.statusCode).toBe(201);
    });

    test("Employer cannot create equipment (403)", async () => {
      const res = await request(app)
        .post("/api/v1/equipment")
        .set("x-user-id", employer._id.toString())
        .set("x-user-role", "employer")
        .send({ name: "Employer Radio" });
      expect(res.statusCode).toBe(403);
    });
  });

  describe("PATCH /api/v1/equipment/:id/assign", () => {
    test("Guard can assign equipment", async () => {
      const res = await request(app)
        .patch(`/api/v1/equipment/${equipment._id}/assign`)
        .set("x-user-id", guard._id.toString())
        .set("x-user-role", "guard")
        .send({ assignedTo: otherGuard._id });
      expect(res.statusCode).toBe(200);
    });

    test("Admin can assign equipment", async () => {
      const res = await request(app)
        .patch(`/api/v1/equipment/${equipment._id}/assign`)
        .set("x-user-id", admin._id.toString())
        .set("x-user-role", "admin")
        .send({ assignedTo: guard._id });
      expect(res.statusCode).toBe(200);
    });

    test("Employer cannot assign equipment (403)", async () => {
      const res = await request(app)
        .patch(`/api/v1/equipment/${equipment._id}/assign`)
        .set("x-user-id", employer._id.toString())
        .set("x-user-role", "employer")
        .send({ assignedTo: guard._id });
      expect(res.statusCode).toBe(403);
    });
  });

  describe("PATCH /api/v1/equipment/:id/report", () => {
    test("Guard can report equipment status", async () => {
      const res = await request(app)
        .patch(`/api/v1/equipment/${equipment._id}/report`)
        .set("x-user-id", guard._id.toString())
        .set("x-user-role", "guard")
        .send({ status: "DAMAGED" });
      expect(res.statusCode).toBe(200);
    });

    test("Admin can report equipment status", async () => {
      const res = await request(app)
        .patch(`/api/v1/equipment/${equipment._id}/report`)
        .set("x-user-id", admin._id.toString())
        .set("x-user-role", "admin")
        .send({ status: "LOST" });
      expect(res.statusCode).toBe(200);
    });

    test("Employer cannot report equipment (403)", async () => {
      const res = await request(app)
        .patch(`/api/v1/equipment/${equipment._id}/report`)
        .set("x-user-id", employer._id.toString())
        .set("x-user-role", "employer")
        .send({ status: "ACTIVE" });
      expect(res.statusCode).toBe(403);
    });
  });

  describe("GET /api/v1/equipment/guard/:guardId", () => {
    test("Guard can view own equipment", async () => {
      const res = await request(app)
        .get(`/api/v1/equipment/guard/${guard._id}`)
        .set("x-user-id", guard._id.toString())
        .set("x-user-role", "guard");
      expect(res.statusCode).toBe(200);
    });

    test("Guard cannot view other guard's equipment (403)", async () => {
      const res = await request(app)
        .get(`/api/v1/equipment/guard/${otherGuard._id}`)
        .set("x-user-id", guard._id.toString())
        .set("x-user-role", "guard");
      expect(res.statusCode).toBe(403);
    });

    test("Admin can view any guard's equipment", async () => {
      const res = await request(app)
        .get(`/api/v1/equipment/guard/${otherGuard._id}`)
        .set("x-user-id", admin._id.toString())
        .set("x-user-role", "admin");
      expect(res.statusCode).toBe(200);
    });

    test("Employer cannot view guard's equipment (403)", async () => {
      const res = await request(app)
        .get(`/api/v1/equipment/guard/${guard._id}`)
        .set("x-user-id", employer._id.toString())
        .set("x-user-role", "employer");
      expect(res.statusCode).toBe(403);
    });
  });
});
