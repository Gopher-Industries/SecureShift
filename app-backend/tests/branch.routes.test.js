import request from "supertest";
import express from "express";
import { jest } from "@jest/globals";

jest.unstable_mockModule("../src/models/Branch.js", () => ({
  default: {
    find: jest.fn(),
  },
}));

jest.unstable_mockModule("../src/models/Shift.js", () => ({
  default: {
    find: jest.fn(),
  },
}));

jest.unstable_mockModule("../src/middleware/auth.js", () => ({
  default: (req, res, next) => {
    req.user = {
      id: req.headers["x-user-id"] || "test-user-id",
      role: req.headers["x-user-role"] || "guard",
    };
    next();
  },
}));

const { default: branchRoutes } = await import("../src/routes/branch.routes.js");

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/v1/branch", branchRoutes);
  return app;
};

describe("Branch utilisation routes", () => {
  test("GET /site/utilisation rejects non-employer users", async () => {
    const res = await request(createApp())
      .get("/api/v1/branch/site/utilisation")
      .query({
        from: "2026-09-01",
        to: "2026-09-30",
      })
      .set("x-user-id", "test-guard-id")
      .set("x-user-role", "guard");

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe("Forbidden: Access denied for your role.");
  });
});
