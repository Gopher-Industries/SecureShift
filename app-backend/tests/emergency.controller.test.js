import request from "supertest";
import express from "express";
import mockJwt from "jsonwebtoken";
import mongoose from "mongoose";
import { beforeEach, describe, expect, jest, test } from "@jest/globals";

jest.unstable_mockModule("../src/models/Emergency.js", () => ({
  default: {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    countDocuments: jest.fn(),
  },
}));

jest.unstable_mockModule("../src/models/Shift.js", () => ({
  default: {
    find: jest.fn(),
  },
}));

// Mock the auth middleware to avoid database connection
jest.unstable_mockModule("../src/middleware/auth.js", () => ({
  default: (req, res, next) => {
    let userId = "test-user-id";
    let role = "guard";

    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];

      try {
        const payload = token.split(".")[1];
        const decoded = JSON.parse(
          Buffer.from(payload, "base64url").toString("utf8"),
        );

        userId = decoded.id || decoded._id || "test-user-id";
        role = decoded.role || "guard";
      } catch (e) {
        // ignore invalid token
      }
    }

    req.user = {
      _id: userId,
      id: userId,
      role,
    };

    next();
  },
}));

const { default: emergencyRoutes } = await import(
  "../src/routes/emergency.routes.js"
);
const { default: sosRoutes } = await import(
  "../src/routes/sos.routes.js"
);
const { default: Emergency } = await import(
  "../src/models/Emergency.js"
);
const { default: Shift } = await import(
  "../src/models/Shift.js"
);

jest.setTimeout(30000);

process.env.JWT_SECRET = "test-secret";

const makeToken = (role, id = new mongoose.Types.ObjectId().toString()) =>
  mockJwt.sign({ id, role }, process.env.JWT_SECRET);

const chainSort = (value) => ({
  sort: jest.fn().mockResolvedValue(value),
});

const chainSelectLean = (value) => ({
  select: jest.fn().mockReturnValue({
    lean: jest.fn().mockResolvedValue(value),
  }),
});

const chainEmergencyList = (value) => ({
  populate: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockResolvedValue(value),
});

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/v1/emergency", emergencyRoutes);
  app.use("/api/v1/sos", sosRoutes);
  return app;
};

const auth = (role, id) => ({ Authorization: `Bearer ${makeToken(role, id)}` });

const buildSOS = (overrides = {}) => ({
  _id: new mongoose.Types.ObjectId(),
  guardId: new mongoose.Types.ObjectId(),
  shiftId: null,
  latitude: -34.9285,
  longitude: 138.6007,
  message: "",
  note: "",
  status: "ACTIVE",
  statusHistory: [
    { status: "ACTIVE", message: "SOS triggered", at: new Date() },
  ],
  locationUpdates: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  cancelledAt: null,
  resolvedAt: null,
  save: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

describe("Emergency SOS routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("guard creates SOS through Guard App alias", async () => {
    const guardId = new mongoose.Types.ObjectId().toString();
    const createdSOS = buildSOS({ guardId, note: "Gate alarm" });

    Emergency.findOne
      .mockReturnValueOnce(chainSort(null))
      .mockReturnValueOnce(chainSort(null));
    Emergency.create.mockResolvedValue(createdSOS);

    const res = await request(createApp())
      .post("/api/v1/sos/trigger")
      .set(auth("guard", guardId))
      .send({
        latitude: -34.9285,
        longitude: 138.6007,
        note: "Gate alarm",
      });

    expect(res.statusCode).toBe(201);
    expect(Emergency.create).toHaveBeenCalledTimes(1);
    expect(res.body.data).toBeDefined();
    expect(res.body.sos).toEqual(
      expect.objectContaining({
        _id: String(createdSOS._id),
        guardId,
        status: "pending",
        note: "Gate alarm",
        location: expect.objectContaining({
          latitude: -34.9285,
          longitude: 138.6007,
        }),
      }),
    );
  });

  test("legacy emergency create endpoint is preserved and writes once", async () => {
    const guardId = new mongoose.Types.ObjectId().toString();
    const createdSOS = buildSOS({ guardId });

    Emergency.findOne
      .mockReturnValueOnce(chainSort(null))
      .mockReturnValueOnce(chainSort(null));
    Emergency.create.mockResolvedValue(createdSOS);

    const res = await request(createApp())
      .post("/api/v1/emergency/sos")
      .set(auth("guard", guardId))
      .send({ latitude: -34.9285, longitude: 138.6007 });

    expect(res.statusCode).toBe(201);
    expect(Emergency.create).toHaveBeenCalledTimes(1);
    expect(res.body.sos._id).toBe(String(createdSOS._id));
  });

  test("guard retrieves own active SOS and /active is not swallowed by /:id", async () => {
    const guardId = new mongoose.Types.ObjectId().toString();
    const activeSOS = buildSOS({ guardId });

    Emergency.findOne.mockReturnValue(chainSort(activeSOS));

    const res = await request(createApp())
      .get("/api/v1/sos/active")
      .set(auth("guard", guardId));

    expect(res.statusCode).toBe(200);
    expect(Emergency.findOne).toHaveBeenCalledWith({
      status: { $in: ["ACTIVE", "ESCALATED"] },
      guardId,
    });
    expect(res.body.sos._id).toBe(String(activeSOS._id));
  });

  test("unrelated guard is denied SOS lookup by scoped query", async () => {
    const guardId = new mongoose.Types.ObjectId().toString();
    const sosId = new mongoose.Types.ObjectId().toString();

    Emergency.findOne.mockResolvedValue(null);

    const res = await request(createApp())
      .get(`/api/v1/sos/${sosId}`)
      .set(auth("guard", guardId));

    expect(res.statusCode).toBe(404);
    expect(Emergency.findOne).toHaveBeenCalledWith({ _id: sosId, guardId });
  });

  test("employer sees SOS for owned shift", async () => {
    const employerId = new mongoose.Types.ObjectId().toString();
    const shiftId = new mongoose.Types.ObjectId();
    const visibleSOS = buildSOS({ shiftId });

    Shift.find.mockReturnValue(chainSelectLean([{ _id: shiftId }]));
    Emergency.find.mockReturnValue(chainEmergencyList([visibleSOS]));
    Emergency.countDocuments.mockResolvedValue(1);

    const res = await request(createApp())
      .get("/api/v1/emergency/sos")
      .set(auth("employer", employerId));

    expect(res.statusCode).toBe(200);
    expect(Shift.find).toHaveBeenCalledWith({ createdBy: employerId });
    expect(Emergency.find).toHaveBeenCalledWith({
      shiftId: { $in: [shiftId] },
    });
    expect(res.body.count).toBe(1);
  });

  test("unrelated employer is denied SOS lookup", async () => {
    const employerId = new mongoose.Types.ObjectId().toString();
    const sosId = new mongoose.Types.ObjectId().toString();

    Shift.find.mockReturnValue(chainSelectLean([]));
    Emergency.findOne.mockResolvedValue(null);

    const res = await request(createApp())
      .get(`/api/v1/sos/${sosId}`)
      .set(auth("employer", employerId));

    expect(res.statusCode).toBe(404);
    expect(Emergency.findOne).toHaveBeenCalledWith({
      _id: sosId,
      shiftId: { $in: [] },
    });
  });

  test("admin can list SOS records without ownership scope", async () => {
    const sos = buildSOS();

    Emergency.find.mockReturnValue(chainEmergencyList([sos]));
    Emergency.countDocuments.mockResolvedValue(1);

    const res = await request(createApp())
      .get("/api/v1/emergency/sos")
      .set(auth("admin"));

    expect(res.statusCode).toBe(200);
    expect(Emergency.find).toHaveBeenCalledWith({});
    expect(Shift.find).not.toHaveBeenCalled();
  });

  test("SOS history returns default pagination metadata", async () => {
    const sos = buildSOS();

    Emergency.find.mockReturnValue(chainEmergencyList([sos]));
    Emergency.countDocuments.mockResolvedValue(25);

    const res = await request(createApp())
      .get("/api/v1/emergency/sos")
      .set(auth("admin"));

    expect(res.statusCode).toBe(200);
    expect(res.body.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 25,
      hasNext: true,
    });
  });

  test("SOS history applies requested pagination and caps limit at 100", async () => {
    const sos = buildSOS();

    Emergency.find.mockReturnValue(chainEmergencyList([sos]));
    Emergency.countDocuments.mockResolvedValue(250);

    const res = await request(createApp())
      .get("/api/v1/emergency/sos?page=2&limit=150")
      .set(auth("admin"));

    expect(res.statusCode).toBe(200);
    expect(res.body.pagination).toEqual({
      page: 2,
      limit: 100,
      total: 250,
      hasNext: true,
    });
  });

  test("SOS history filters by status", async () => {
    const sos = buildSOS({ status: "RESOLVED" });

    Emergency.find.mockReturnValue(chainEmergencyList([sos]));
    Emergency.countDocuments.mockResolvedValue(1);

    const res = await request(createApp())
      .get("/api/v1/emergency/sos?status=RESOLVED")
      .set(auth("admin"));

    expect(res.statusCode).toBe(200);
    expect(Emergency.find).toHaveBeenCalledWith({
      status: "RESOLVED",
    });
    expect(Emergency.countDocuments).toHaveBeenCalledWith({
      status: "RESOLVED",
    });
    expect(res.body.count).toBe(1);
  });

  test("SOS history rejects an invalid status", async () => {
    const res = await request(createApp())
      .get("/api/v1/emergency/sos?status=INVALID")
      .set(auth("admin"));

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Invalid status");
    expect(Emergency.find).not.toHaveBeenCalled();
  });

  test("SOS history filters by createdAt date range", async () => {
    const sos = buildSOS();

    Emergency.find.mockReturnValue(chainEmergencyList([sos]));
    Emergency.countDocuments.mockResolvedValue(1);

    const res = await request(createApp())
      .get(
        "/api/v1/emergency/sos?from=2026-01-01&to=2026-01-31",
      )
      .set(auth("admin"));

    expect(res.statusCode).toBe(200);

    const query = Emergency.find.mock.calls[0][0];

    expect(query.createdAt.$gte).toEqual(
      new Date("2026-01-01"),
    );
    expect(query.createdAt.$lte).toEqual(
      new Date("2026-01-31T23:59:59.999"),
    );
  });

  test("SOS history rejects an invalid from date", async () => {
    const res = await request(createApp())
      .get("/api/v1/emergency/sos?from=not-a-date")
      .set(auth("admin"));

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("from must be a valid date");
    expect(Emergency.find).not.toHaveBeenCalled();
  });

  test("SOS history rejects a date range where from is after to", async () => {
    const res = await request(createApp())
      .get(
        "/api/v1/emergency/sos?from=2026-02-01&to=2026-01-01",
      )
      .set(auth("admin"));

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("from must be before or equal to to");
    expect(Emergency.find).not.toHaveBeenCalled();
  });

  test("SOS history applies skip and limit to the database query", async () => {
    const sos = buildSOS();

    Emergency.find.mockReturnValue(chainEmergencyList([sos]));
    Emergency.countDocuments.mockResolvedValue(45);

    const res = await request(createApp())
      .get("/api/v1/emergency/sos?page=3&limit=10")
      .set(auth("admin"));

    expect(res.statusCode).toBe(200);

    const chain = Emergency.find.mock.results[0].value;

    expect(chain.skip).toHaveBeenCalledWith(20);
    expect(chain.limit).toHaveBeenCalledWith(10);
  });

  test("SOS history uses deterministic newest-first ordering", async () => {
    const sos = buildSOS();

    Emergency.find.mockReturnValue(chainEmergencyList([sos]));
    Emergency.countDocuments.mockResolvedValue(1);

    const res = await request(createApp())
      .get("/api/v1/emergency/sos")
      .set(auth("admin"));

    expect(res.statusCode).toBe(200);

    const chain = Emergency.find.mock.results[0].value;

    expect(chain.sort).toHaveBeenCalledWith({
      createdAt: -1,
      _id: -1,
    });
  });

  test("SOS history combines status and pagination filters with employer scope", async () => {
    const employerId = new mongoose.Types.ObjectId().toString();
    const shiftId = new mongoose.Types.ObjectId();
    const sos = buildSOS({ shiftId, status: "RESOLVED" });

    Shift.find.mockReturnValue(chainSelectLean([{ _id: shiftId }]));
    Emergency.find.mockReturnValue(chainEmergencyList([sos]));
    Emergency.countDocuments.mockResolvedValue(1);

    const res = await request(createApp())
      .get(
        "/api/v1/emergency/sos?page=2&limit=10&status=RESOLVED",
      )
      .set(auth("employer", employerId));

    expect(res.statusCode).toBe(200);

    expect(Emergency.find).toHaveBeenCalledWith({
      status: "RESOLVED",
      shiftId: { $in: [shiftId] },
    });

    expect(Emergency.countDocuments).toHaveBeenCalledWith({
      status: "RESOLVED",
      shiftId: { $in: [shiftId] },
    });
  });

  test("guard updates valid location through emergency alias", async () => {
    const guardId = new mongoose.Types.ObjectId().toString();
    const sosId = new mongoose.Types.ObjectId().toString();
    const sos = buildSOS({ _id: sosId, guardId });

    Emergency.findOne.mockResolvedValue(sos);

    const res = await request(createApp())
      .post(`/api/v1/emergency/sos/${sosId}/location`)
      .set(auth("guard", guardId))
      .send({ latitude: -35, longitude: 138.5 });

    expect(res.statusCode).toBe(200);
    expect(Emergency.findOne).toHaveBeenCalledWith({ _id: sosId, guardId });
    expect(sos.latitude).toBe(-35);
    expect(sos.longitude).toBe(138.5);
    expect(sos.locationUpdates).toHaveLength(1);
    expect(sos.save).toHaveBeenCalled();
  });

  test("invalid coordinates return 400", async () => {
    const guardId = new mongoose.Types.ObjectId().toString();
    const sosId = new mongoose.Types.ObjectId().toString();

    const res = await request(createApp())
      .post(`/api/v1/sos/${sosId}/location`)
      .set(auth("guard", guardId))
      .send({ latitude: -91, longitude: 138.5 });

    expect(res.statusCode).toBe(400);
    expect(Emergency.findOne).not.toHaveBeenCalled();
  });

  test("missing and null coordinates are rejected before SOS creation", async () => {
    for (const body of [
      { longitude: 138.5 },
      { latitude: null, longitude: 138.5 },
    ]) {
      const res = await request(createApp())
        .post("/api/v1/sos/trigger")
        .set(auth("guard"))
        .send(body);
      expect(res.statusCode).toBe(400);
    }
    expect(Emergency.findOne).not.toHaveBeenCalled();
    expect(Emergency.create).not.toHaveBeenCalled();
  });

  test("blank coordinate strings are rejected on location update", async () => {
    const sosId = new mongoose.Types.ObjectId().toString();
    for (const latitude of ["", "   "]) {
      const res = await request(createApp())
        .post(`/api/v1/sos/${sosId}/location`)
        .set(auth("guard"))
        .send({ latitude, longitude: 138.5 });
      expect(res.statusCode).toBe(400);
    }
    expect(Emergency.findOne).not.toHaveBeenCalled();
  });

  test("non-numeric coordinate types are rejected", async () => {
    for (const longitude of [false, [], {}, "not-a-number"]) {
      const res = await request(createApp())
        .post("/api/v1/sos/trigger")
        .set(auth("guard"))
        .send({ latitude: 0, longitude });
      expect(res.statusCode).toBe(400);
    }
    expect(Emergency.create).not.toHaveBeenCalled();
  });

  test("numeric zero and numeric strings are preserved", async () => {
    Emergency.findOne
      .mockReturnValueOnce(chainSort(null))
      .mockReturnValueOnce(chainSort(null));
    Emergency.create.mockImplementation(async (values) => buildSOS(values));

    const res = await request(createApp())
      .post("/api/v1/sos/trigger")
      .set(auth("guard"))
      .send({ latitude: 0, longitude: "138.5" });

    expect(res.statusCode).toBe(201);
    expect(Emergency.create).toHaveBeenCalledWith(
      expect.objectContaining({ latitude: 0, longitude: 138.5 }),
    );
  });

  test("guard adds valid note", async () => {
    const guardId = new mongoose.Types.ObjectId().toString();
    const sosId = new mongoose.Types.ObjectId().toString();
    const sos = buildSOS({ _id: sosId, guardId });

    Emergency.findOne.mockResolvedValue(sos);

    const res = await request(createApp())
      .post(`/api/v1/sos/${sosId}/note`)
      .set(auth("guard", guardId))
      .send({ note: "Moved to the east entrance" });

    expect(res.statusCode).toBe(200);
    expect(sos.note).toBe("Moved to the east entrance");
    expect(sos.save).toHaveBeenCalled();
  });

  test("invalid note length returns 400", async () => {
    const guardId = new mongoose.Types.ObjectId().toString();
    const sosId = new mongoose.Types.ObjectId().toString();

    const res = await request(createApp())
      .post(`/api/v1/sos/${sosId}/note`)
      .set(auth("guard", guardId))
      .send({ note: "x".repeat(2001) });

    expect(res.statusCode).toBe(400);
    expect(Emergency.findOne).not.toHaveBeenCalled();
  });

  test("guard cancels active SOS", async () => {
    const guardId = new mongoose.Types.ObjectId().toString();
    const sosId = new mongoose.Types.ObjectId().toString();
    const sos = buildSOS({ _id: sosId, guardId });

    Emergency.findOne.mockResolvedValue(sos);

    const res = await request(createApp())
      .post(`/api/v1/sos/${sosId}/cancel`)
      .set(auth("guard", guardId))
      .send({});

    expect(res.statusCode).toBe(200);
    expect(sos.status).toBe("CANCELLED");
    expect(sos.cancelledAt).toBeInstanceOf(Date);
    expect(sos.save).toHaveBeenCalled();
    expect(res.body.sos.status).toBe("cancelled");
  });

  test("invalid terminal transition returns controlled error", async () => {
    const adminId = new mongoose.Types.ObjectId().toString();
    const sosId = new mongoose.Types.ObjectId().toString();
    const sos = buildSOS({
      _id: sosId,
      status: "RESOLVED",
      resolvedAt: new Date(),
    });

    Emergency.findOne.mockResolvedValue(sos);

    const res = await request(createApp())
      .put(`/api/v1/emergency/sos/${sosId}`)
      .set(auth("admin", adminId))
      .send({ status: "ACTIVE" });

    expect(res.statusCode).toBe(409);
    expect(sos.save).not.toHaveBeenCalled();
  });

  test("malformed ObjectId returns 404 instead of 500", async () => {
    const guardId = new mongoose.Types.ObjectId().toString();

    const res = await request(createApp())
      .get("/api/v1/sos/not-an-object-id")
      .set(auth("guard", guardId));

    expect(res.statusCode).toBe(404);
    expect(Emergency.findOne).not.toHaveBeenCalled();
  });

  test("duplicate active SOS returns 409 and does not write", async () => {
    const guardId = new mongoose.Types.ObjectId().toString();
    const activeSOS = buildSOS({ guardId });

    Emergency.findOne.mockReturnValueOnce(chainSort(activeSOS));

    const res = await request(createApp())
      .post("/api/v1/sos/trigger")
      .set(auth("guard", guardId))
      .send({ latitude: -34.9285, longitude: 138.6007 });

    expect(res.statusCode).toBe(409);
    expect(Emergency.create).not.toHaveBeenCalled();
    expect(res.body.sos._id).toBe(String(activeSOS._id));
  });

  test("recent terminal SOS cooldown returns 429 and does not write", async () => {
    const guardId = new mongoose.Types.ObjectId().toString();
    const recentSOS = buildSOS({
      guardId,
      status: "CANCELLED",
      createdAt: new Date(),
    });

    Emergency.findOne
      .mockReturnValueOnce(chainSort(null))
      .mockReturnValueOnce(chainSort(recentSOS));

    const res = await request(createApp())
      .post("/api/v1/sos/trigger")
      .set(auth("guard", guardId))
      .send({ latitude: -34.9285, longitude: 138.6007 });

    expect(res.statusCode).toBe(429);
    expect(Emergency.create).not.toHaveBeenCalled();
  });

  test("alias status lookup returns Guard App response shape", async () => {
    const guardId = new mongoose.Types.ObjectId().toString();
    const sosId = new mongoose.Types.ObjectId().toString();
    const sos = buildSOS({ _id: sosId, guardId });

    Emergency.findOne.mockResolvedValue(sos);

    const res = await request(createApp())
      .get(`/api/v1/sos/${sosId}`)
      .set(auth("guard", guardId));

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        data: expect.any(Object),
        sos: expect.objectContaining({
          _id: sosId,
          status: "pending",
          emergencyContact: { name: "Emergency Services", phone: "000" },
        }),
      }),
    );
  });

  test("RBAC blocks guard from admin status endpoint", async () => {
    const guardId = new mongoose.Types.ObjectId().toString();
    const sosId = new mongoose.Types.ObjectId().toString();

    const res = await request(createApp())
      .put(`/api/v1/emergency/sos/${sosId}`)
      .set(auth("guard", guardId))
      .send({ status: "RESOLVED" });

    expect(res.statusCode).toBe(403);
    expect(Emergency.findOne).not.toHaveBeenCalled();
  });
});
