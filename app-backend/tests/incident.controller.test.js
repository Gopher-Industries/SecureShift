import request from "supertest";
import express from "express";
import mongoose from "mongoose";
import {
  createIncident,
  updateIncident,
  getIncident,
  getIncidents,
  deleteIncident,
  uploadAttachment,
  getAttachment,
} from "../controllers/incident.controller.js";

import Incident from "../models/Incident.js";
import Shift from "../models/Shift.js";

// ---------------- MOCKS ----------------
jest.mock("../models/Incident.js");
jest.mock("../models/Shift.js");

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
    _id: new mongoose.Types.ObjectId().toString(),
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
  shiftId: "shift123",
  guardId: "guard123",
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

    const res = await request(app)
      .post("/incident")
      .send({
        shiftId: "shift123",
        severity: "high",
        description: "Test incident",
      });

    expect(res.statusCode).toBe(201);
  });

  // GET SINGLE INCIDENT
  test("should get incident by id", async () => {
    Incident.findById.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValue(mockIncident),
    });

    const res = await request(app).get("/incident/incident123");

    expect(res.statusCode).toBe(200);
  });

  // GET INCIDENTS LIST
  test("should list incidents", async () => {
    Incident.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValue([mockIncident]),
    });

    const res = await request(app).get("/incidents");

    expect(res.statusCode).toBe(200);
  });

  // UPDATE INCIDENT
  test("should update incident", async () => {
    Incident.findById.mockResolvedValue({
      ...mockIncident,
      save: jest.fn(),
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
      save: jest.fn(),
    });

    const res = await request(app).delete("/incident/incident123");

    expect(res.statusCode).toBe(200);
  });
});