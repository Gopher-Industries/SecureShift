import request from "supertest";
import express from "express";
import mongoose from "mongoose";
import { beforeEach, describe, expect, jest, test } from "@jest/globals";

import shiftRoutes from "../src/routes/shift.routes.js";
import Shift from "../src/models/Shift.js";

jest.mock("../src/models/Shift.js");
jest.mock("../src/models/Branch.js");

jest.mock("../src/middleware/auth.js", () => ({
  __esModule: true,
  default: (req, res, next) => {
    req.user = {
      _id: req.headers["x-user-id"] || "test-user-id",
      id: req.headers["x-user-id"] || "test-user-id",
      role: req.headers["x-user-role"] || "guard",
    };
    next();
  },
}));

jest.setTimeout(30000);

const authHeaders = (role, id) => ({
  "x-user-id": id,
  "x-user-role": role,
});

const queryChain = (value) => {
  const chain = {
    sort: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    then: (resolve, reject) => Promise.resolve(value).then(resolve, reject),
  };
  return chain;
};

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/v1/shifts", shiftRoutes);
  return app;
};

describe("Shift route ordering", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("GET /myshifts is not treated as /:id=myshifts", async () => {
    const guardId = new mongoose.Types.ObjectId().toString();
    const myShifts = [{ _id: new mongoose.Types.ObjectId(), title: "My shift" }];
    Shift.find.mockReturnValue(queryChain(myShifts));

    const res = await request(createApp())
      .get("/api/v1/shifts/myshifts")
      .set(authHeaders("guard", guardId));

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].title).toBe("My shift");
    expect(res.body.message).not.toBe("Invalid id");
    expect(Shift.findById).not.toHaveBeenCalled();
    expect(Shift.find).toHaveBeenCalled();
  });

  test("GET /history is not treated as /:id=history", async () => {
    const guardId = new mongoose.Types.ObjectId().toString();
    const history = [
      { _id: new mongoose.Types.ObjectId(), title: "Completed shift" },
    ];
    Shift.find.mockReturnValue(queryChain(history));

    const res = await request(createApp())
      .get("/api/v1/shifts/history")
      .set(authHeaders("guard", guardId));

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("items");
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].title).toBe("Completed shift");
    expect(res.body.message).not.toBe("Invalid id");
    expect(Shift.findById).not.toHaveBeenCalled();
    expect(Shift.find).toHaveBeenCalledWith({
      assignedGuard: guardId,
      status: "completed",
    });
  });

  test("GET /:id still reaches the shift-by-id route", async () => {
    const employerId = new mongoose.Types.ObjectId().toString();
    const shiftId = new mongoose.Types.ObjectId().toString();
    const shift = {
      _id: shiftId,
      title: "Draft shift",
      createdBy: { _id: employerId },
    };
    Shift.findById.mockReturnValue(queryChain(shift));

    const res = await request(createApp())
      .get(`/api/v1/shifts/${shiftId}`)
      .set(authHeaders("employer", employerId));

    expect(res.statusCode).toBe(200);
    expect(res.body._id).toBe(shiftId);
    expect(res.body.title).toBe("Draft shift");
    expect(Array.isArray(res.body)).toBe(false);
    expect(Shift.findById).toHaveBeenCalledWith(shiftId);
  });
});
