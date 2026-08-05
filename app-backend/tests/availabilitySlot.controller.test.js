import mongoose from "mongoose";

import {
  createSlot,
  getMySlots,
  deleteSlot,
  clearAllSlots,
} from "../src/controllers/availabilitySlot.controller.js";

import AvailabilitySlot from "../src/models/AvailabilitySlot.js";

// Keep the real named exports (regexes / patterns the service validates with),
// but replace the model's DB methods with mocks so tests never touch Mongo.
jest.mock("../src/models/AvailabilitySlot.js", () => {
  const actual = jest.requireActual("../src/models/AvailabilitySlot.js");
  return {
    __esModule: true,
    ...actual,
    default: {
      create: jest.fn(),
      find: jest.fn(),
      findOneAndDelete: jest.fn(),
      deleteMany: jest.fn(),
    },
  };
});

const GUARD_ID = new mongoose.Types.ObjectId().toString();
const SLOT_ID = new mongoose.Types.ObjectId().toString();

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn();
  return res;
};

const mockReq = (overrides = {}) => ({
  user: { id: GUARD_ID, _id: GUARD_ID, role: "guard" },
  body: {},
  params: {},
  query: {},
  audit: { log: jest.fn() },
  ...overrides,
});

// find(...).sort(...) resolves to the given array
const mockFindReturning = (slots) => {
  AvailabilitySlot.find.mockReturnValue({
    sort: jest.fn().mockResolvedValue(slots),
  });
};

describe("AvailabilitySlot Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------
  // POST /availability/slots
  // ---------------------------------------------------------------
  describe("createSlot", () => {
    test("401 when unauthenticated", async () => {
      const req = mockReq({ user: null });
      const res = mockRes();

      await createSlot(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(AvailabilitySlot.create).not.toHaveBeenCalled();
    });

    test("400 when date is missing", async () => {
      const req = mockReq({ body: { fromTime: "09:00", toTime: "17:00" } });
      const res = mockRes();

      await createSlot(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(AvailabilitySlot.create).not.toHaveBeenCalled();
    });

    test("400 when date format is wrong", async () => {
      const req = mockReq({
        body: { date: "25-12-2025", fromTime: "09:00", toTime: "17:00" },
      });
      const res = mockRes();

      await createSlot(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("400 when date is not a real calendar date", async () => {
      const req = mockReq({
        body: { date: "2025-13-40", fromTime: "09:00", toTime: "17:00" },
      });
      const res = mockRes();

      await createSlot(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("400 when time format is wrong", async () => {
      const req = mockReq({
        body: { date: "2025-12-25", fromTime: "9am", toTime: "17:00" },
      });
      const res = mockRes();

      await createSlot(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("400 when fromTime is not before toTime", async () => {
      const req = mockReq({
        body: { date: "2025-12-25", fromTime: "17:00", toTime: "09:00" },
      });
      const res = mockRes();

      await createSlot(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("400 when recurring.enabled is not a boolean", async () => {
      const req = mockReq({
        body: {
          date: "2025-12-25",
          fromTime: "09:00",
          toTime: "17:00",
          recurring: { enabled: "yes" },
        },
      });
      const res = mockRes();

      await createSlot(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("400 when recurring is enabled with an invalid pattern", async () => {
      const req = mockReq({
        body: {
          date: "2025-12-25",
          fromTime: "09:00",
          toTime: "17:00",
          recurring: { enabled: true, pattern: "monthly" },
        },
      });
      const res = mockRes();

      await createSlot(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("400 when recurring.endDate is before date", async () => {
      const req = mockReq({
        body: {
          date: "2025-12-25",
          fromTime: "09:00",
          toTime: "17:00",
          recurring: {
            enabled: true,
            pattern: "weekly",
            endDate: "2025-12-01",
          },
        },
      });
      const res = mockRes();

      await createSlot(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("201 and returns the created slot under `availability`", async () => {
      const created = {
        _id: SLOT_ID,
        guardId: GUARD_ID,
        date: "2025-12-25",
        fromTime: "09:00",
        toTime: "17:00",
      };
      AvailabilitySlot.create.mockResolvedValue(created);

      const req = mockReq({
        body: { date: "2025-12-25", fromTime: "09:00", toTime: "17:00" },
      });
      const res = mockRes();

      await createSlot(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ availability: created }),
      );
    });

    test("takes guardId from the token, never from the request body", async () => {
      AvailabilitySlot.create.mockResolvedValue({ _id: SLOT_ID });

      const req = mockReq({
        body: {
          guardId: "attacker-supplied-id",
          date: "2025-12-25",
          fromTime: "09:00",
          toTime: "17:00",
        },
      });
      const res = mockRes();

      await createSlot(req, res);

      expect(AvailabilitySlot.create).toHaveBeenCalledWith(
        expect.objectContaining({ guardId: GUARD_ID }),
      );
    });
  });

  // ---------------------------------------------------------------
  // GET /availability/slots/my-slots
  // ---------------------------------------------------------------
  describe("getMySlots", () => {
    test("401 when unauthenticated", async () => {
      const req = mockReq({ user: null });
      const res = mockRes();

      await getMySlots(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    test("200 and returns slots under `availability`", async () => {
      const slots = [{ _id: SLOT_ID, guardId: GUARD_ID }];
      mockFindReturning(slots);

      const req = mockReq();
      const res = mockRes();

      await getMySlots(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ availability: slots });
    });

    test("scopes the query to the authenticated guard", async () => {
      mockFindReturning([]);

      const req = mockReq();
      const res = mockRes();

      await getMySlots(req, res);

      expect(AvailabilitySlot.find).toHaveBeenCalledWith(
        expect.objectContaining({ guardId: GUARD_ID }),
      );
    });

    test("400 when startDate is malformed", async () => {
      const req = mockReq({ query: { startDate: "not-a-date" } });
      const res = mockRes();

      await getMySlots(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(AvailabilitySlot.find).not.toHaveBeenCalled();
    });

    test("400 when startDate is after endDate", async () => {
      const req = mockReq({
        query: { startDate: "2025-12-31", endDate: "2025-12-01" },
      });
      const res = mockRes();

      await getMySlots(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("applies a date range filter when provided", async () => {
      mockFindReturning([]);

      const req = mockReq({
        query: { startDate: "2025-12-01", endDate: "2025-12-31" },
      });
      const res = mockRes();

      await getMySlots(req, res);

      expect(AvailabilitySlot.find).toHaveBeenCalledWith(
        expect.objectContaining({
          guardId: GUARD_ID,
          date: { $gte: "2025-12-01", $lte: "2025-12-31" },
        }),
      );
    });
  });

  // ---------------------------------------------------------------
  // DELETE /availability/slots/:id
  // ---------------------------------------------------------------
  describe("deleteSlot", () => {
    test("401 when unauthenticated", async () => {
      const req = mockReq({ user: null, params: { id: SLOT_ID } });
      const res = mockRes();

      await deleteSlot(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    test("404 when the id is not a valid ObjectId", async () => {
      const req = mockReq({ params: { id: "not-an-id" } });
      const res = mockRes();

      await deleteSlot(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(AvailabilitySlot.findOneAndDelete).not.toHaveBeenCalled();
    });

    test("404 when the slot does not belong to the guard", async () => {
      AvailabilitySlot.findOneAndDelete.mockResolvedValue(null);

      const req = mockReq({ params: { id: SLOT_ID } });
      const res = mockRes();

      await deleteSlot(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      // ownership is enforced in the query itself
      expect(AvailabilitySlot.findOneAndDelete).toHaveBeenCalledWith({
        _id: SLOT_ID,
        guardId: GUARD_ID,
      });
    });

    test("200 when the guard's own slot is deleted", async () => {
      AvailabilitySlot.findOneAndDelete.mockResolvedValue({ _id: SLOT_ID });

      const req = mockReq({ params: { id: SLOT_ID } });
      const res = mockRes();

      await deleteSlot(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  // ---------------------------------------------------------------
  // DELETE /availability/slots/clear-all
  // ---------------------------------------------------------------
  describe("clearAllSlots", () => {
    test("401 when unauthenticated", async () => {
      const req = mockReq({ user: null });
      const res = mockRes();

      await clearAllSlots(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    test("200 and returns the deleted count, scoped to the guard", async () => {
      AvailabilitySlot.deleteMany.mockResolvedValue({ deletedCount: 3 });

      const req = mockReq();
      const res = mockRes();

      await clearAllSlots(req, res);

      expect(AvailabilitySlot.deleteMany).toHaveBeenCalledWith({
        guardId: GUARD_ID,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ deletedCount: 3 }),
      );
    });
  });
});
