/**
 * Permission Inheritance Tests
 *
 * Tests that getEffectivePermissions correctly merges permissions
 * from parent roles via inheritsFrom.
 */

// using unstable_mockModule before import to ensure Role is mocked before rbac.js imports it
import { jest, describe, test, expect, beforeEach } from "@jest/globals";

// Mock Role model BEFORE importing rbac.js
jest.mock("../src/models/Role.js", () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
  },
}));

import { authorizePermissions } from "../src/middleware/rbac.js";
import Role from "../src/models/Role.js";

// mockRole is a helper to create a mock Role document with lean() method
const mockRole = (role) => ({
  lean: jest.fn().mockResolvedValue(role),
});

describe("Permission inheritance", () => {
  beforeEach(() => {
    // clean up mocks before each test to avoid interference
    Role.findOne.mockReset();
  });

  test("child inherits permissions from parent", async () => {
    Role.findOne
      .mockReturnValueOnce(
        mockRole({
          name: "child_role",
          permissions: [],
          inheritsFrom: "parent_role",
        }),
      )
      .mockReturnValueOnce(
        mockRole({
          name: "parent_role",
          permissions: ["shift:read"],
          inheritsFrom: null,
        }),
      );

    const req = { user: { role: "child_role" } };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const next = jest.fn();

    const middleware = authorizePermissions(["shift:read"]);

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test("child does not inherit permissions not granted by parent", async () => {
    // reset the mock to ensure no interference from previous tests
    Role.findOne.mockReset();

    Role.findOne
      .mockReturnValueOnce(
        mockRole({
          name: "child_role",
          permissions: [],
          inheritsFrom: "parent_role",
        }),
      )
      .mockReturnValueOnce(
        mockRole({
          name: "parent_role",
          permissions: ["shift:read"],
          inheritsFrom: null,
        }),
      );

    const req = { user: { role: "child_role" } };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const next = jest.fn();

    const middleware = authorizePermissions(["shift:write"]);

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);

    expect(res.json).toHaveBeenCalledWith({
      message: "Insufficient permissions",
    });

    expect(next).not.toHaveBeenCalled();
  });

  test("child combines own permissions with parent permissions", async () => {
    Role.findOne.mockReset();

    Role.findOne
      .mockReturnValueOnce(
        mockRole({
          name: "child_role",
          permissions: ["user:read"],
          inheritsFrom: "parent_role",
        }),
      )
      .mockReturnValueOnce(
        mockRole({
          name: "parent_role",
          permissions: ["shift:read"],
          inheritsFrom: null,
        }),
      );

    const req = { user: { role: "child_role" } };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const next = jest.fn();

    const middleware = authorizePermissions(["user:read", "shift:read"]);

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test("deep inheritance (grandchild inherits from child and grandparent)", async () => {
    Role.findOne.mockReset();

    Role.findOne
      .mockReturnValueOnce(
        mockRole({
          name: "grandchild",
          permissions: [],
          inheritsFrom: "child",
        }),
      )
      .mockReturnValueOnce(
        mockRole({
          name: "child",
          permissions: ["user:read"],
          inheritsFrom: "grandparent",
        }),
      )
      .mockReturnValueOnce(
        mockRole({
          name: "grandparent",
          permissions: ["system:read"],
          inheritsFrom: null,
        }),
      );

    const req = { user: { role: "grandchild" } };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const next = jest.fn();

    const middleware = authorizePermissions(["user:read", "system:read"]);

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test("handles cyclic inheritance gracefully", async () => {
    Role.findOne.mockReset();

    Role.findOne
      .mockReturnValueOnce(
        mockRole({
          name: "roleA",
          permissions: ["perm1"],
          inheritsFrom: "roleB",
        }),
      )
      .mockReturnValueOnce(
        mockRole({
          name: "roleB",
          permissions: ["perm2"],
          inheritsFrom: "roleA",
        }),
      );

    const req = { user: { role: "roleA" } };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const next = jest.fn();

    const middleware = authorizePermissions(["perm1"]);

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();

    // test that it does not allow access to perm2, which is only in roleB
    Role.findOne.mockReset();

    Role.findOne
      .mockReturnValueOnce(
        mockRole({
          name: "roleA",
          permissions: ["perm1"],
          inheritsFrom: "roleB",
        }),
      )
      .mockReturnValueOnce(
        mockRole({
          name: "roleB",
          permissions: ["perm2"],
          inheritsFrom: "roleA",
        }),
      );

    const req2 = { user: { role: "roleA" } };

    const res2 = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const next2 = jest.fn();

    const middleware2 = authorizePermissions(["perm2"]);

    await middleware2(req2, res2, next2);

    expect(next2).toHaveBeenCalled();
    expect(res2.status).not.toHaveBeenCalled();
  });

  test("prevents infinite recursion", async () => {
    Role.findOne.mockReset();

    Role.findOne
      .mockReturnValueOnce(
        mockRole({
          name: "roleA",
          permissions: [],
          inheritsFrom: "roleB",
        }),
      )
      .mockReturnValueOnce(
        mockRole({
          name: "roleB",
          permissions: [],
          inheritsFrom: "roleA",
        }),
      );

    const req = { user: { role: "roleA" } };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const next = jest.fn();

    const middleware = authorizePermissions(["some:permission"]);

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);

    expect(res.json).toHaveBeenCalledWith({
      message: "Insufficient permissions",
    });

    expect(next).not.toHaveBeenCalled();
  });

  test("super_admin wildcard bypasses permission checks", async () => {
    const req = { user: { role: "super_admin" } };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const next = jest.fn();

    const middleware = authorizePermissions(["any:permission"]);

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(Role.findOne).not.toHaveBeenCalled();
  });

  test("role with wildcard permission in DB bypasses checks", async () => {
    Role.findOne.mockReset();

    Role.findOne.mockReturnValue(
      mockRole({
        name: "custom",
        permissions: ["*"],
        inheritsFrom: null,
      }),
    );

    const req = { user: { role: "custom" } };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const next = jest.fn();

    const middleware = authorizePermissions(["anything"]);

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  test("fallback to DEFAULT_ROLE_PERMISSIONS when role not in DB", async () => {
    Role.findOne.mockReset();

    Role.findOne.mockReturnValue(mockRole(null));

    const req = { user: { role: "guard" } };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const next = jest.fn();

    const middleware = authorizePermissions(["shift:read"]);

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();

    expect(Role.findOne).toHaveBeenCalledWith({
      name: "guard",
    });
  });

  test("returns 403 when default permissions do not include required permission", async () => {
    Role.findOne.mockReset();

    Role.findOne.mockReturnValue(mockRole(null));

    const req = { user: { role: "guard" } };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const next = jest.fn();

    const middleware = authorizePermissions(["payment:write"]);

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);

    expect(res.json).toHaveBeenCalledWith({
      message: "Insufficient permissions",
    });

    expect(next).not.toHaveBeenCalled();
  });
});
