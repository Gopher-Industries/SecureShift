import request from "supertest";
import express from "express";
import { jest, test } from "@jest/globals";

// ---------------- MOCKS ----------------

jest.unstable_mockModule("../src/models/Incident.js", () => ({
  default: {
    create: jest.fn(),
    findById: jest.fn(),
    find: jest.fn(),
  },
}));

jest.unstable_mockModule("../src/models/Shift.js", () => ({
  default: {
    findById: jest.fn(),
    find: jest.fn(),
  },
}));

const { default: Incident } = await import("../src/models/Incident.js");
const { default: Shift } = await import("../src/models/Shift.js");

const {
  createIncident,
  updateIncident,
  getIncident,
  getIncidents,
  deleteIncident,
} = await import("../src/controllers/incident.controller.js");

// mock audit middleware
const mockAudit = {
  log: jest.fn()
}

// ---------------- APP SETUP ----------------
const app = express();
app.use(express.json());

// fake auth middleware
app.use((req, res, next) => {
  req.user = {
    _id: "guard123",
    role: "guard",
  };

  req.audit = mockAudit;
  next();
});

// routes
app.post("/incident", createIncident);
app.put("/incident/:id", updateIncident);
app.get("/incident/:id", getIncident);
app.get("/incidents", getIncidents);
app.delete("/incident/:id", deleteIncident);

// ---------------- TEST DATA ----------------
const validShiftId = "507f1f77bcf86cd799439011";
const validIncidentId = "507f191e810c19729de860ea";
const nonexistentShiftId = "507f1f77bcf86cd799439012";
const nonexistentIncidentId = "507f191e810c19729de860eb";

const mockShift = {
  _id: validShiftId,
  acceptedBy: "guard123",
  createdBy: "employer123",
};

const mockIncident = {
  _id: validIncidentId,
  shiftId: { _id: validShiftId },
  guardId: { _id: "guard123" },
  isDeleted: false,
  save: jest.fn(),
};

// ---------------- TESTS ----------------

describe("Incident Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // CREATE INCIDENT
  test("should create incident", async () => {
    Shift.findById.mockResolvedValue(mockShift);
    Incident.create.mockResolvedValue(mockIncident);

    const res = await request(app).post("/incident").send({
      shiftId: validShiftId,
      severity: "high",
      description: "Test incident",
    });

    expect(res.statusCode).toBe(201);
  });

  // GET SINGLE INCIDENT
  test("should get incident by id", async () => {
    const mockQuery = {
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          ...mockIncident,
          shiftId: { _id: validShiftId },
          guardId: { _id: "guard123" },
        }),
      }),
    };

    Incident.findById.mockReturnValue(mockQuery);

    const res = await request(app).get(`/incident/${validIncidentId}`);

    expect(res.statusCode).toBe(200);
  });

  // GET INCIDENTS LIST
  test("should list incidents", async () => {
    const mockQuery = {
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue([mockIncident]),
      }),
    };

    Incident.find.mockReturnValue(mockQuery);

    const res = await request(app).get("/incidents");

    expect(res.statusCode).toBe(200);
  });

  // UPDATE INCIDENT
  test("should update incident", async () => {
    Incident.findById.mockResolvedValue({
      ...mockIncident,
      guardId: "guard123",
      save: jest.fn().mockResolvedValue(),
    });

    const res = await request(app)
      .put(`/incident/${validIncidentId}`)
      .send({ description: "Updated desc" });

    expect(res.statusCode).toBe(200);
  });

  // DELETE INCIDENT
  test("should soft delete incident", async () => {
    Incident.findById.mockResolvedValue({
      ...mockIncident,
      save: jest.fn().mockResolvedValue(),
    });

    const res = await request(app).delete(`/incident/${validIncidentId}`);

    expect(res.statusCode).toBe(200);
  });
  // ---------------- ID Validation Tests ----------------
   // CREATE - malformed shift ID
  test("should return 400 when creating incident with malformed shift ID", async () => {
    const res = await request(app).post("/incident").send({
      shiftId: "invalid-id",
      severity: "high",
      description: "Test incident",
    });

    expect(res.statusCode).toBe(400);
    expect(Shift.findById).not.toHaveBeenCalled();
  });
    // Numeric test ID
  test("should return 400 when creating incident with numeric shift ID", async () => {
    const res = await request(app).post("/incident").send({
      shiftId: 12345,
      severity: "high",
      description: "Test incident",
    });

    expect(res.statusCode).toBe(400);
    expect(Shift.findById).not.toHaveBeenCalled();
  });

  // CREATE - valid but nonexistent shift ID
  test("should return 404 when creating incident with nonexistent shift ID", async () => {
    Shift.findById.mockResolvedValue(null);

    const res = await request(app).post("/incident").send({
      shiftId: nonexistentShiftId,
      severity: "high",
      description: "Test incident",
    });

    expect(res.statusCode).toBe(404);
    expect(Shift.findById).toHaveBeenCalledWith(nonexistentShiftId);
  });

  // GET - malformed incident ID
  test("should return 400 when getting incident with malformed ID", async () => {
    const res = await request(app).get("/incident/invalid-id");

    expect(res.statusCode).toBe(400);
    expect(Incident.findById).not.toHaveBeenCalled();
  });

  // GET - valid but nonexistent incident ID
  test("should return 404 when getting nonexistent incident", async () => {
    const mockQuery = {
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      }),
    };

    Incident.findById.mockReturnValue(mockQuery);

    const res = await request(app).get(
      `/incident/${nonexistentIncidentId}`,
    );

    expect(res.statusCode).toBe(404);
    expect(Incident.findById).toHaveBeenCalledWith(nonexistentIncidentId);
  });

  // UPDATE - malformed incident ID
  test("should return 400 when updating incident with malformed ID", async () => {
    const res = await request(app)
      .put("/incident/invalid-id")
      .send({ description: "Updated description" });

    expect(res.statusCode).toBe(400);
    expect(Incident.findById).not.toHaveBeenCalled();
  });

  // UPDATE - valid but nonexistent incident ID
  test("should return 404 when updating nonexistent incident", async () => {
    Incident.findById.mockResolvedValue(null);

    const res = await request(app)
      .put(`/incident/${nonexistentIncidentId}`)
      .send({ description: "Updated description" });

    expect(res.statusCode).toBe(404);
    expect(Incident.findById).toHaveBeenCalledWith(nonexistentIncidentId);
  });

  // DELETE - malformed incident ID
  test("should return 400 when deleting incident with malformed ID", async () => {
    const res = await request(app).delete("/incident/invalid-id");

    expect(res.statusCode).toBe(400);
    expect(Incident.findById).not.toHaveBeenCalled();
  });

  // DELETE - valid but nonexistent incident ID
  test("should return 404 when deleting nonexistent incident", async () => {
    Incident.findById.mockResolvedValue(null);

    const res = await request(app).delete(
      `/incident/${nonexistentIncidentId}`,
    );

    expect(res.statusCode).toBe(404);
    expect(Incident.findById).toHaveBeenCalledWith(nonexistentIncidentId);
  });
});