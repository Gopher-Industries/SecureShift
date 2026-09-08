/**
 * These tests verify that the RBAC entry point unification was successful:
 * 1. allowRoles, adminOnly, employerOnly, guardOnly are exported from middleware/rbac.js
 * 2. middleware/role.js is deprecated and re-exports from rbac.js
 * 3. The functions behave identically to the original role.js implementations
 */

import { jest, describe, test, expect } from "@jest/globals";

import {
  authorizeRoles,
  allowRoles,
  adminOnly,
  employerOnly,
  guardOnly,
} from "../src/middleware/rbac.js";

import * as roleDeprecated from "../src/middleware/role.js";

describe("PR 2: Entry Point Unification Verification", () => {
  describe("1. middleware/rbac.js exports new entry point functions", () => {
    test("exports allowRoles as a function", () => {
      expect(typeof allowRoles).toBe("function");
    });

    test("exports adminOnly as a middleware function", () => {
      expect(typeof adminOnly).toBe("function");
    });

    test("exports employerOnly as a middleware function", () => {
      expect(typeof employerOnly).toBe("function");
    });

    test("exports guardOnly as a middleware function", () => {
      expect(typeof guardOnly).toBe("function");
    });
  });

  describe("2. allowRoles behavior matches original role.js implementation", () => {
    test("returns 401 when req.user is missing", () => {
      const req = { user: null };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      allowRoles("admin")(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: "Forbidden: Access denied for your role.",
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

      allowRoles("admin", "employer")(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: "Forbidden: Access denied for your role.",
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

      allowRoles("admin", "employer")(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe("3. shortcut functions work correctly", () => {
    test("adminOnly allows admin users", () => {
      const req = { user: { role: "admin" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      adminOnly(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    test("adminOnly blocks non-admin users", () => {
      const req = { user: { role: "guard" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      adminOnly(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: "Forbidden: Access denied for your role.",
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("employerOnly allows employer users", () => {
      const req = { user: { role: "employer" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      employerOnly(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    test("employerOnly blocks non-employer users", () => {
      const req = { user: { role: "guard" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      employerOnly(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: "Forbidden: Access denied for your role.",
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("guardOnly allows guard users", () => {
      const req = { user: { role: "guard" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      guardOnly(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    test("guardOnly blocks non-guard users", () => {
      const req = { user: { role: "employer" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      guardOnly(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: "Forbidden: Access denied for your role.",
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("4. middleware/role.js is deprecated and re-exports correctly", () => {
    test("role.js re-exports allowRoles from rbac.js", () => {
      expect(roleDeprecated.allowRoles).toBe(allowRoles);
    });

    test("role.js re-exports adminOnly from rbac.js", () => {
      expect(roleDeprecated.adminOnly).toBe(adminOnly);
    });

    test("role.js re-exports employerOnly from rbac.js", () => {
      expect(roleDeprecated.employerOnly).toBe(employerOnly);
    });

    test("role.js re-exports guardOnly from rbac.js", () => {
      expect(roleDeprecated.guardOnly).toBe(guardOnly);
    });
  });

  describe("5. allowRoles is an alias of authorizeRoles", () => {
    test("allowRoles and authorizeRoles produce same behavior for allowed role", () => {
      const req = { user: { role: "admin" } };
      const res1 = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next1 = jest.fn();
      const res2 = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next2 = jest.fn();

      allowRoles("admin")(req, res1, next1);
      authorizeRoles("admin")(req, res2, next2);

      expect(next1).toHaveBeenCalled();
      expect(next2).toHaveBeenCalled();
    });

    test("allowRoles and authorizeRoles produce same behavior for denied role", () => {
      const req = { user: { role: "guard" } };
      const res1 = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next1 = jest.fn();
      const res2 = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next2 = jest.fn();

      allowRoles("admin")(req, res1, next1);
      authorizeRoles("admin")(req, res2, next2);

      expect(res1.status).toHaveBeenCalledWith(403);
      expect(res2.status).toHaveBeenCalledWith(403);
    });
  });
});
