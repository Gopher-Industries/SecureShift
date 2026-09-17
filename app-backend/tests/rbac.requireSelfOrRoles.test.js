/**
 * PR 5: requireSelfOrRoles Middleware Tests
 *
 * Tests cover:
 * - self-access (requesterId matches targetId)
 * - role-based access (user role in allowed roles list)
 * - unauthorized rejection (neither self nor allowed role)
 * - unauthenticated user (401)
 * - custom paramKey support
 */

import { jest, describe, test, expect } from "@jest/globals";
import { requireSelfOrRoles } from "../src/middleware/rbac.js";

describe("requireSelfOrRoles middleware", () => {
  describe("Self access", () => {
    test("allows access when requesterId matches targetId", () => {
      const req = {
        user: { id: "user1" },
        params: { userId: "user1" },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      const middleware = requireSelfOrRoles();
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    test("allows access when _id matches targetId (supports both id and _id)", () => {
      const req = {
        user: { _id: "user1" },
        params: { userId: "user1" },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      const middleware = requireSelfOrRoles();
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test("allows access when requesterId matches targetId with custom paramKey", () => {
      const req = {
        user: { id: "user1" },
        params: { guardId: "user1" },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      const middleware = requireSelfOrRoles({ paramKey: "guardId" });
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe("Role-based access", () => {
    test("allows access when user role is in the allowed roles array", () => {
      const req = {
        user: { id: "user1", role: "admin" },
        params: { userId: "user2" },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      const middleware = requireSelfOrRoles({ roles: ["admin", "employer"] });
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test("allows access when role is in roles array with multiple roles", () => {
      const req = {
        user: { id: "user1", role: "employer" },
        params: { userId: "user2" },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      const middleware = requireSelfOrRoles({ roles: ["admin", "employer"] });
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe("Unauthorized rejection", () => {
    test("returns 403 when not self and role not allowed", () => {
      const req = {
        user: { id: "user1", role: "guard" },
        params: { userId: "user2" },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      const middleware = requireSelfOrRoles({ roles: ["admin", "employer"] });
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: "Insufficient privileges",
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("returns 403 when roles array is empty and user not self", () => {
      const req = {
        user: { id: "user1", role: "admin" },
        params: { userId: "user2" },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      const middleware = requireSelfOrRoles({ roles: [] });
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("Authentication checks", () => {
    test("returns 401 when req.user is missing", () => {
      const req = {
        user: null,
        params: { userId: "user2" },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      const middleware = requireSelfOrRoles();
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Not authenticated",
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("returns 401 when req.user has no id or _id", () => {
      const req = {
        user: { role: "admin" },
        params: { userId: "user2" },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      const middleware = requireSelfOrRoles();
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Not authenticated",
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("Edge cases", () => {
    test("handles string comparison correctly when ObjectId and string are compared", () => {
      const req = {
        user: { id: "64b8f9a1c2d3e4f5a6b7c8d9" },
        params: { userId: "64b8f9a1c2d3e4f5a6b7c8d9" },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      const middleware = requireSelfOrRoles();
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test("does not allow access when ids differ and roles not allowed", () => {
      const req = {
        user: { id: "user1", role: "guard" },
        params: { userId: "user2" },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      const middleware = requireSelfOrRoles({ roles: ["admin"] });
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
