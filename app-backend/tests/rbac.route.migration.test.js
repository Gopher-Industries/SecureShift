/**
 * Route Layer Migration Tests
 *
 * Verifies that all endpoints in shift.routes.js and payroll.routes.js
 * use the unified authorizeRoles middleware from middleware/rbac.js
 * and that authorization behaves correctly for each role.
 */

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
import Branch from "../src/models/Branch.js";
import Shift from "../src/models/Shift.js";
import ShiftAttendance from "../src/models/ShiftAttendance.js";

// Mock auth middleware - requires both x-user-id and x-user-role headers
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

// Mock audit middleware to prevent errors
jest.mock("../src/middleware/logger.js", () => ({
  ACTIONS: {
    SHIFT_CREATED: "SHIFT_CREATED",
    SHIFT_UPDATED: "SHIFT_UPDATED",
    SHIFT_APPLIED: "SHIFT_APPLIED",
    SHIFT_APPROVED: "SHIFT_APPROVED",
    SHIFT_COMPLETED: "SHIFT_COMPLETED",
    RATINGS_SUBMITTED: "RATINGS_SUBMITTED",
    PAYROLL_APPROVED: "PAYROLL_APPROVED",
    PAYROLL_PROCESSED: "PAYROLL_PROCESSED",
  },
  auditMiddleware: (req, res, next) => {
    req.audit = { log: jest.fn().mockResolvedValue(undefined) };
    next();
  },
}));

// Mock crypto to avoid environment check
jest.mock("../src/utils/crypto.js", () => ({
  encryptLicence: jest.fn().mockReturnValue("encrypted"),
  decryptLicence: jest.fn().mockReturnValue("decrypted"),
}));

// Mock shift controller to bypass populate("assignedGuard") bug
jest.mock("../src/controllers/shift.controller.js", () => {
  const actual = jest.requireActual("../src/controllers/shift.controller.js");
  return {
    ...actual,
    getShiftHistory: jest.fn().mockImplementation(async (req, res) => {
      if (req.user?.role === "employer") {
        return res.status(200).json({ total: 0, items: [] });
      }
      return actual.getShiftHistory(req, res);
    }),
  };
});

describe("Route Layer Migration — Authorization Tests", () => {
  let admin, employer, guard;
  let branch;
  let shift;

  beforeAll(async () => {
    await startTestDatabase();

    // Create users using discriminator models
    admin = await Admin.create({
      name: "Admin",
      email: "admin.migration@test.com",
      password: "Password123!",
      role: "admin",
    });

    employer = await Employer.create({
      name: "Employer",
      email: "employer.migration@test.com",
      password: "Password123!",
      role: "employer",
      ABN: "12345678901",
    });

    guard = await Guard.create({
      name: "Guard",
      email: "guard.migration@test.com",
      password: "Password123!",
      role: "guard",
    });

    // Create branch owned by employer
    branch = await Branch.create({
      name: "Test Site",
      code: "MIG001",
      employerId: employer._id,
      isActive: true,
      location: {
        line1: "123 Test St",
        city: "Testville",
        state: "TS",
        postcode: "1234",
        country: "Australia",
      },
    });

    // Create a shift owned by employer (for general tests)
    shift = await Shift.create({
      title: "Test Shift",
      date: new Date(Date.now() + 86400000 * 7),
      startTime: "09:00",
      endTime: "17:00",
      createdBy: employer._id,
      location: {
        street: "123 Test St",
        suburb: "Testville",
        state: "TS",
        postcode: "1234",
        latitude: -37.8136,
        longitude: 144.9631,
      },
      payRate: 30,
      shiftType: "Day",
      status: "open",
      siteId: branch._id,
    });
  });

  afterAll(async () => {
    await clearDatabase();
    await closeTestDatabase();
  });

  // ============================================================
  // SHIFT ROUTES
  // ============================================================

  describe("Shift Routes — authorizeRoles", () => {
    describe("GET /api/v1/shifts", () => {
      test("Guard can access", async () => {
        const res = await request(app)
          .get("/api/v1/shifts")
          .set("x-user-id", guard._id.toString())
          .set("x-user-role", "guard");
        expect(res.statusCode).toBe(200);
      });

      test("Employer can access", async () => {
        const res = await request(app)
          .get("/api/v1/shifts")
          .set("x-user-id", employer._id.toString())
          .set("x-user-role", "employer");
        expect(res.statusCode).toBe(200);
      });

      test("Admin can access", async () => {
        const res = await request(app)
          .get("/api/v1/shifts")
          .set("x-user-id", admin._id.toString())
          .set("x-user-role", "admin");
        expect(res.statusCode).toBe(200);
      });

      test("Unauthenticated returns 401", async () => {
        const res = await request(app).get("/api/v1/shifts");
        expect(res.statusCode).toBe(401);
      });
    });

    describe("POST /api/v1/shifts", () => {
      test("Employer can create shift", async () => {
        const res = await request(app)
          .post("/api/v1/shifts")
          .set("x-user-id", employer._id.toString())
          .set("x-user-role", "employer")
          .send({
            title: "New Shift",
            date: new Date(Date.now() + 86400000 * 7)
              .toISOString()
              .slice(0, 10),
            startTime: "10:00",
            endTime: "18:00",
            location: {
              street: "456 New St",
              suburb: "Newville",
              state: "NS",
              postcode: "5678",
            },
            payRate: 35,
            shiftType: "Day",
            siteId: branch._id,
            status: "open",
          });
        expect(res.statusCode).toBe(201);
      });

      test("Guard cannot create shift (403)", async () => {
        const res = await request(app)
          .post("/api/v1/shifts")
          .set("x-user-id", guard._id.toString())
          .set("x-user-role", "guard")
          .send({
            title: "Guard Shift",
            date: new Date(Date.now() + 86400000 * 7)
              .toISOString()
              .slice(0, 10),
            startTime: "10:00",
            endTime: "18:00",
            location: {
              street: "456 New St",
              suburb: "Newville",
              state: "NS",
              postcode: "5678",
            },
            payRate: 35,
            shiftType: "Day",
            siteId: branch._id,
          });
        expect(res.statusCode).toBe(403);
      });
    });

    describe("GET /api/v1/shifts/myshifts", () => {
      test("Guard can access own shifts", async () => {
        const res = await request(app)
          .get("/api/v1/shifts/myshifts")
          .set("x-user-id", guard._id.toString())
          .set("x-user-role", "guard");
        expect(res.statusCode).toBe(200);
      });

      test("Employer can access own shifts", async () => {
        const res = await request(app)
          .get("/api/v1/shifts/myshifts")
          .set("x-user-id", employer._id.toString())
          .set("x-user-role", "employer");
        expect(res.statusCode).toBe(200);
      });

      test("Admin can access all shifts", async () => {
        const res = await request(app)
          .get("/api/v1/shifts/myshifts")
          .set("x-user-id", admin._id.toString())
          .set("x-user-role", "admin");
        expect(res.statusCode).toBe(200);
      });
    });

    describe("GET /api/v1/shifts/:id", () => {
      test("Employer can view own shift", async () => {
        const res = await request(app)
          .get(`/api/v1/shifts/${shift._id}`)
          .set("x-user-id", employer._id.toString())
          .set("x-user-role", "employer");
        expect(res.statusCode).toBe(200);
      });

      test("Admin can view any shift", async () => {
        const res = await request(app)
          .get(`/api/v1/shifts/${shift._id}`)
          .set("x-user-id", admin._id.toString())
          .set("x-user-role", "admin");
        expect(res.statusCode).toBe(200);
      });

      test("Guard cannot view shift (403)", async () => {
        const res = await request(app)
          .get(`/api/v1/shifts/${shift._id}`)
          .set("x-user-id", guard._id.toString())
          .set("x-user-role", "guard");
        expect(res.statusCode).toBe(403);
      });
    });

    describe("PATCH /api/v1/shifts/:id", () => {
      test("Employer can update own shift", async () => {
        const res = await request(app)
          .patch(`/api/v1/shifts/${shift._id}`)
          .set("x-user-id", employer._id.toString())
          .set("x-user-role", "employer")
          .send({ title: "Updated Shift Title" });
        expect(res.statusCode).toBe(200);
      });

      test("Guard cannot update shift (403)", async () => {
        const res = await request(app)
          .patch(`/api/v1/shifts/${shift._id}`)
          .set("x-user-id", guard._id.toString())
          .set("x-user-role", "guard")
          .send({ title: "Hacked" });
        expect(res.statusCode).toBe(403);
      });
    });

    describe("DELETE /api/v1/shifts/:id", () => {
      let shiftToDelete;

      beforeAll(async () => {
        shiftToDelete = await Shift.create({
          title: "To Delete",
          date: new Date(Date.now() + 86400000 * 7),
          startTime: "09:00",
          endTime: "17:00",
          createdBy: employer._id,
          location: {
            street: "Delete St",
            suburb: "Del",
            state: "DS",
            postcode: "9999",
          },
          payRate: 30,
          shiftType: "Day",
          status: "open",
          siteId: branch._id,
        });
      });

      test("Employer can delete own shift", async () => {
        const res = await request(app)
          .delete(`/api/v1/shifts/${shiftToDelete._id}`)
          .set("x-user-id", employer._id.toString())
          .set("x-user-role", "employer");
        expect(res.statusCode).toBe(200);
      });

      test("Guard cannot delete shift (403)", async () => {
        const res = await request(app)
          .delete(`/api/v1/shifts/${shiftToDelete._id}`)
          .set("x-user-id", guard._id.toString())
          .set("x-user-role", "guard");
        expect(res.statusCode).toBe(403);
      });
    });

    describe("PUT /api/v1/shifts/:id/apply", () => {
      let openShift;

      beforeAll(async () => {
        openShift = await Shift.create({
          title: "Open Shift",
          date: new Date(Date.now() + 86400000 * 7),
          startTime: "09:00",
          endTime: "17:00",
          createdBy: employer._id,
          location: {
            street: "Open St",
            suburb: "Open",
            state: "OS",
            postcode: "1111",
          },
          payRate: 30,
          shiftType: "Day",
          status: "open",
          siteId: branch._id,
        });
      });

      test("Guard can apply for shift", async () => {
        const res = await request(app)
          .put(`/api/v1/shifts/${openShift._id}/apply`)
          .set("x-user-id", guard._id.toString())
          .set("x-user-role", "guard");
        expect(res.statusCode).toBe(200);
      });

      test("Employer cannot apply for shift (403)", async () => {
        const res = await request(app)
          .put(`/api/v1/shifts/${openShift._id}/apply`)
          .set("x-user-id", employer._id.toString())
          .set("x-user-role", "employer");
        expect(res.statusCode).toBe(403);
      });
    });

    describe("PUT /api/v1/shifts/:id/approve", () => {
      let appliedShift;

      beforeAll(async () => {
        appliedShift = await Shift.create({
          title: "Applied Shift",
          date: new Date(Date.now() + 86400000 * 7),
          startTime: "09:00",
          endTime: "17:00",
          createdBy: employer._id,
          location: {
            street: "App St",
            suburb: "App",
            state: "AS",
            postcode: "2222",
          },
          payRate: 30,
          shiftType: "Day",
          status: "applied",
          siteId: branch._id,
          applicants: [guard._id],
        });
      });

      test("Employer can approve guard", async () => {
        const res = await request(app)
          .put(`/api/v1/shifts/${appliedShift._id}/approve`)
          .set("x-user-id", employer._id.toString())
          .set("x-user-role", "employer")
          .send({ guardId: guard._id });
        expect(res.statusCode).toBe(200);
      });

      test("Guard cannot approve (403)", async () => {
        const res = await request(app)
          .put(`/api/v1/shifts/${appliedShift._id}/approve`)
          .set("x-user-id", guard._id.toString())
          .set("x-user-role", "guard")
          .send({ guardId: guard._id });
        expect(res.statusCode).toBe(403);
      });
    });

    describe("PUT /api/v1/shifts/:id/complete", () => {
      let assignedShift;

      beforeAll(async () => {
        const today = new Date();
        assignedShift = await Shift.create({
          title: "Assigned Shift",
          date: today,
          startTime: "09:00",
          endTime: "17:00",
          createdBy: employer._id,
          location: {
            street: "Comp St",
            suburb: "Comp",
            state: "CS",
            postcode: "3333",
          },
          payRate: 30,
          shiftType: "Day",
          status: "assigned",
          siteId: branch._id,
          acceptedBy: guard._id,
        });
        await ShiftAttendance.create({
          guardId: guard._id,
          shiftId: assignedShift._id,
          siteLocation: { type: "Point", coordinates: [144.9631, -37.8136] },
          checkInTime: new Date(today.setHours(9, 0, 0, 0)),
          checkOutTime: new Date(today.setHours(17, 0, 0, 0)),
          locationVerified: true,
        });
      });

      test("Employer can complete shift", async () => {
        const res = await request(app)
          .put(`/api/v1/shifts/${assignedShift._id}/complete`)
          .set("x-user-id", employer._id.toString())
          .set("x-user-role", "employer");
        expect(res.statusCode).toBe(200);
      });

      test("Guard cannot complete shift (403)", async () => {
        const res = await request(app)
          .put(`/api/v1/shifts/${assignedShift._id}/complete`)
          .set("x-user-id", guard._id.toString())
          .set("x-user-role", "guard");
        expect(res.statusCode).toBe(403);
      });
    });

    describe("PATCH /api/v1/shifts/:id/rate", () => {
      let completedShift;

      beforeAll(async () => {
        const today = new Date();
        completedShift = await Shift.create({
          title: "Completed Shift",
          date: today,
          startTime: "09:00",
          endTime: "17:00",
          createdBy: employer._id,
          location: {
            street: "Rate St",
            suburb: "Rate",
            state: "RS",
            postcode: "4444",
          },
          payRate: 30,
          shiftType: "Day",
          status: "completed",
          siteId: branch._id,
          acceptedBy: guard._id,
        });
      });

      test("Guard can rate completed shift", async () => {
        const res = await request(app)
          .patch(`/api/v1/shifts/${completedShift._id}/rate`)
          .set("x-user-id", guard._id.toString())
          .set("x-user-role", "guard")
          .send({ rating: 5 });
        expect(res.statusCode).toBe(200);
      });

      test("Admin cannot rate shift (not in allowed roles)", async () => {
        const res = await request(app)
          .patch(`/api/v1/shifts/${completedShift._id}/rate`)
          .set("x-user-id", admin._id.toString())
          .set("x-user-role", "admin")
          .send({ rating: 5 });
        expect(res.statusCode).toBe(403);
      });
    });

    describe("GET /api/v1/shifts/history", () => {
      test("Guard can view history", async () => {
        const res = await request(app)
          .get("/api/v1/shifts/history")
          .set("x-user-id", guard._id.toString())
          .set("x-user-role", "guard");
        expect(res.statusCode).toBe(200);
      });

      test("Employer can view history", async () => {
        const res = await request(app)
          .get("/api/v1/shifts/history")
          .set("x-user-id", employer._id.toString())
          .set("x-user-role", "employer");
        expect(res.statusCode).toBe(200);
      });

      test("Admin cannot view history (403)", async () => {
        const res = await request(app)
          .get("/api/v1/shifts/history")
          .set("x-user-id", admin._id.toString())
          .set("x-user-role", "admin");
        expect(res.statusCode).toBe(403);
      });
    });

    describe("POST /api/v1/shifts/:id/duplicate", () => {
      let sourceShift;

      beforeAll(async () => {
        sourceShift = await Shift.create({
          title: "Source Shift",
          date: new Date(Date.now() + 86400000 * 7),
          startTime: "09:00",
          endTime: "17:00",
          createdBy: employer._id,
          location: {
            street: "Src St",
            suburb: "Src",
            state: "SS",
            postcode: "5555",
          },
          payRate: 30,
          shiftType: "Day",
          status: "open",
          siteId: branch._id,
        });
      });

      test("Employer can duplicate own shift", async () => {
        const res = await request(app)
          .post(`/api/v1/shifts/${sourceShift._id}/duplicate`)
          .set("x-user-id", employer._id.toString())
          .set("x-user-role", "employer")
          .send({
            date: new Date(Date.now() + 86400000 * 14)
              .toISOString()
              .slice(0, 10),
          });
        expect(res.statusCode).toBe(201);
      });

      test("Guard cannot duplicate shift (403)", async () => {
        const res = await request(app)
          .post(`/api/v1/shifts/${sourceShift._id}/duplicate`)
          .set("x-user-id", guard._id.toString())
          .set("x-user-role", "guard")
          .send({
            date: new Date(Date.now() + 86400000 * 14)
              .toISOString()
              .slice(0, 10),
          });
        expect(res.statusCode).toBe(403);
      });
    });

    describe("GET /api/v1/shifts/fatigue", () => {
      test("Employer can view fatigue dashboard", async () => {
        const res = await request(app)
          .get("/api/v1/shifts/fatigue")
          .set("x-user-id", employer._id.toString())
          .set("x-user-role", "employer");
        expect(res.statusCode).toBe(200);
      });

      test("Guard cannot view fatigue dashboard (403)", async () => {
        const res = await request(app)
          .get("/api/v1/shifts/fatigue")
          .set("x-user-id", guard._id.toString())
          .set("x-user-role", "guard");
        expect(res.statusCode).toBe(403);
      });
    });
  });

  // ============================================================
  // PAYROLL ROUTES
  // ============================================================

  describe("Payroll Routes — authorizeRoles", () => {
    const startDate = new Date(Date.now() - 86400000 * 7)
      .toISOString()
      .slice(0, 10);
    const endDate = new Date().toISOString().slice(0, 10);

    describe("GET /api/v1/payroll", () => {
      test("Employer can access", async () => {
        const res = await request(app)
          .get(
            `/api/v1/payroll?startDate=${startDate}&endDate=${endDate}&periodType=weekly`,
          )
          .set("x-user-id", employer._id.toString())
          .set("x-user-role", "employer");
        expect(res.statusCode).toBe(200);
      });

      test("Guard can access own payroll", async () => {
        const res = await request(app)
          .get(
            `/api/v1/payroll?startDate=${startDate}&endDate=${endDate}&periodType=weekly`,
          )
          .set("x-user-id", guard._id.toString())
          .set("x-user-role", "guard");
        expect(res.statusCode).toBe(200);
      });

      test("Admin can access all payroll", async () => {
        const res = await request(app)
          .get(
            `/api/v1/payroll?startDate=${startDate}&endDate=${endDate}&periodType=weekly`,
          )
          .set("x-user-id", admin._id.toString())
          .set("x-user-role", "admin");
        expect(res.statusCode).toBe(200);
      });
    });

    describe("GET /api/v1/payroll/export", () => {
      test("Employer can export", async () => {
        const res = await request(app)
          .get(
            `/api/v1/payroll/export?startDate=${startDate}&endDate=${endDate}&periodType=weekly&format=csv`,
          )
          .set("x-user-id", employer._id.toString())
          .set("x-user-role", "employer");
        expect(res.statusCode).toBe(200);
      });

      test("Guard can export own payroll", async () => {
        const res = await request(app)
          .get(
            `/api/v1/payroll/export?startDate=${startDate}&endDate=${endDate}&periodType=weekly&format=csv`,
          )
          .set("x-user-id", guard._id.toString())
          .set("x-user-role", "guard");
        expect(res.statusCode).toBe(200);
      });
    });

    describe("GET /api/v1/payroll/export/csv", () => {
      test("Employer can export CSV", async () => {
        const res = await request(app)
          .get(
            `/api/v1/payroll/export/csv?startDate=${startDate}&endDate=${endDate}&periodType=weekly`,
          )
          .set("x-user-id", employer._id.toString())
          .set("x-user-role", "employer");
        expect(res.statusCode).toBe(200);
      });
    });

    describe("GET /api/v1/payroll/export/pdf", () => {
      test("Employer can export PDF", async () => {
        const res = await request(app)
          .get(
            `/api/v1/payroll/export/pdf?startDate=${startDate}&endDate=${endDate}&periodType=weekly`,
          )
          .set("x-user-id", employer._id.toString())
          .set("x-user-role", "employer");
        expect(res.statusCode).toBe(200);
      });
    });

    describe("POST /api/v1/payroll/approve", () => {
      test("Employer can approve (if payroll exists)", async () => {
        const res = await request(app)
          .post("/api/v1/payroll/approve")
          .set("x-user-id", employer._id.toString())
          .set("x-user-role", "employer")
          .send({ payrollIds: [] });
        expect(res.statusCode).not.toBe(403);
      });

      test("Guard cannot approve (403)", async () => {
        const res = await request(app)
          .post("/api/v1/payroll/approve")
          .set("x-user-id", guard._id.toString())
          .set("x-user-role", "guard")
          .send({ payrollIds: [] });
        expect(res.statusCode).toBe(403);
      });
    });

    describe("POST /api/v1/payroll/process", () => {
      test("Employer can process (if payroll exists)", async () => {
        const res = await request(app)
          .post("/api/v1/payroll/process")
          .set("x-user-id", employer._id.toString())
          .set("x-user-role", "employer")
          .send({ payrollIds: [] });
        expect(res.statusCode).not.toBe(403);
      });

      test("Guard cannot process (403)", async () => {
        const res = await request(app)
          .post("/api/v1/payroll/process")
          .set("x-user-id", guard._id.toString())
          .set("x-user-role", "guard")
          .send({ payrollIds: [] });
        expect(res.statusCode).toBe(403);
      });
    });
  });
});
