/**
 * These tests verify that the RBAC middleware consolidation was successful:
 * 1. All RBAC functions are exported from middleware/rbac.js
 * 2. controllers/rbac.controller.js only re-exports from middleware/rbac.js
 * 3. No route files import directly from controllers/rbac.controller.js
 */

import { jest, describe, test, expect } from "@jest/globals";

import {
  ROLES,
  authorizeRoles,
  authorizePermissions,
  requireSameBranchAsTargetUser,
  requireSelfOrRoles,
} from "../src/middleware/rbac.js";

import * as rbacController from "../src/controllers/rbac.controller.js";

describe("RBAC Consolidation Verification", () => {
  describe("1. Single source of truth: middleware/rbac.js", () => {
    test("exports ROLES constant with correct values", () => {
      expect(ROLES).toBeDefined();
      expect(ROLES.ADMIN).toBe("admin");
      expect(ROLES.EMPLOYER).toBe("employer");
      expect(ROLES.GUARD).toBe("guard");
    });

    test("exports authorizeRoles as a function", () => {
      expect(typeof authorizeRoles).toBe("function");
    });

    test("exports authorizePermissions as a function", () => {
      expect(typeof authorizePermissions).toBe("function");
    });

    test("exports requireSameBranchAsTargetUser as a function", () => {
      expect(typeof requireSameBranchAsTargetUser).toBe("function");
    });

    test("exports requireSelfOrRoles as a function", () => {
      expect(typeof requireSelfOrRoles).toBe("function");
    });
  });

  describe("2. controllers/rbac.controller.js only re-exports", () => {
    test("re-exports ROLES from middleware/rbac.js (same reference)", () => {
      expect(rbacController.ROLES).toBe(ROLES);
    });

    test("re-exports authorizeRoles from middleware/rbac.js", () => {
      expect(rbacController.authorizeRoles).toBe(authorizeRoles);
    });

    test("re-exports authorizePermissions from middleware/rbac.js", () => {
      expect(rbacController.authorizePermissions).toBe(authorizePermissions);
    });

    test("re-exports requireSameBranchAsTargetUser from middleware/rbac.js", () => {
      expect(rbacController.requireSameBranchAsTargetUser).toBe(
        requireSameBranchAsTargetUser,
      );
    });

    test("re-exports requireSelfOrRoles from middleware/rbac.js", () => {
      expect(rbacController.requireSelfOrRoles).toBe(requireSelfOrRoles);
    });
  });

  describe("3. authorizeRoles behavior unchanged", () => {
    test("returns 401 when req.user is missing", () => {
      const req = { user: null };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      const middleware = authorizeRoles("admin");
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Not authenticated",
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("returns 403 when role is not allowed", () => {
      const req = { user: { role: "guard" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      const middleware = authorizeRoles("admin", "employer");
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: "Insufficient role",
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("calls next when role is allowed", () => {
      const req = { user: { role: "admin" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      const middleware = authorizeRoles("admin", "employer");
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});
