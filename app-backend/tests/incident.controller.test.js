import request from "supertest";
import express from "express";
import {
  createIncident,
  updateIncident,
  getIncident,
  getIncidents,
  deleteIncident,
  uploadAttachment,
  getAttachment,
} from "../src/controllers/incident.controller.js";

import Incident from "../src/models/Incident.js";
import Shift from "../src/models/Shift.js";

// ---------------- MOCKS ----------------
jest.mock("../src/models/Incident.js");
jest.mock("../src/models/Shift.js");

// mock audit middleware
const mockAudit = {
  log: jest.fn(),
};

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
const mockShift = {
  _id: "shift123",
  acceptedBy: "guard123",
  createdBy: "employer123",
};

const mockIncident = {
  _id: "incident123",
  shiftId: { _id: "shift123" },
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
      shiftId: "shift123",
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
          shiftId: { _id: "shift123" },
          guardId: { _id: "guard123" },
        }),
      }),
    };
    Incident.findById.mockReturnValue(mockQuery);

    const res = await request(app).get("/incident/incident123");

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
      .put("/incident/incident123")
      .send({ description: "Updated desc" });

    expect(res.statusCode).toBe(200);
  });

  // DELETE INCIDENT
  test("should soft delete incident", async () => {
    Incident.findById.mockResolvedValue({
      ...mockIncident,
      save: jest.fn().mockResolvedValue(),
    });

    const res = await request(app).delete("/incident/incident123");

    expect(res.statusCode).toBe(200);
  });
});
