import { describe, expect, jest, test } from "@jest/globals";

import { authorizeRoles } from "../src/middleware/rbac.js";

const employerOnly = authorizeRoles("employer");

const makeRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

describe("Workforce analytics RBAC", () => {
  test("rejects unauthenticated requests with 401", () => {
    const req = {};
    const res = makeRes();
    const next = jest.fn();

    employerOnly(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Not authenticated",
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("rejects guard requests with 403", () => {
    const req = {
      user: { id: "guard-1", role: "guard" },
    };
    const res = makeRes();
    const next = jest.fn();

    employerOnly(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: "Insufficient role",
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("allows employer requests", () => {
    const req = {
      user: { id: "employer-1", role: "employer" },
    };
    const res = makeRes();
    const next = jest.fn();

    employerOnly(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
