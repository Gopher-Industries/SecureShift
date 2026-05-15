import {
  authorizeRoles,
  authorizePermissions,
  requireSameBranchAsTargetUser,
  requireSelfOrRoles,
  ROLES
} from "../src/middleware/rbac.js";

import Role from "../src/models/Role.js";
import User from "../src/models/User.js";

jest.mock("../src/models/Role.js");
jest.mock("../src/models/User.js");

describe("RBAC Middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: { id: "u1", role: ROLES.EMPLOYER }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    next = jest.fn();

    jest.clearAllMocks();
  });

  // ---------------- authorizeRoles ----------------
  describe("authorizeRoles", () => {
    it("should allow valid role", () => {
      const middleware = authorizeRoles(ROLES.EMPLOYER, ROLES.ADMIN);

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("should block invalid role", () => {
      const middleware = authorizeRoles(ROLES.ADMIN);

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: "Insufficient role"
      });
    });

    it("should return 401 if no user", () => {
      req.user = null;

      const middleware = authorizeRoles(ROLES.ADMIN);

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  // ---------------- authorizePermissions ----------------
  describe("authorizePermissions", () => {
    it("should allow wildcard permission", async () => {
      Role.findOne.mockResolvedValue(null);

      req.user.role = ROLES.SUPER_ADMIN;

      const middleware = authorizePermissions(["shift:write"]);

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("should allow correct permissions (DB fallback)", async () => {
      Role.findOne.mockResolvedValue({
        permissions: ["shift:read", "shift:write"]
      });

      const middleware = authorizePermissions(["shift:read"]);

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("should deny missing permissions", async () => {
      Role.findOne.mockResolvedValue({
        permissions: ["shift:read"]
      });

      const middleware = authorizePermissions(["shift:write"]);

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: "Insufficient permissions"
      });
    });

    it("should handle requireAny option", async () => {
      Role.findOne.mockResolvedValue({
        permissions: ["shift:read"]
      });

      const middleware = authorizePermissions(
        ["shift:write", "shift:read"],
        { any: true }
      );

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  // ---------------- requireSameBranchAsTargetUser ----------------
  describe("requireSameBranchAsTargetUser", () => {
    it("should allow admin bypass", async () => {
      req.user.role = ROLES.ADMIN;

      const middleware = requireSameBranchAsTargetUser({ paramKey: "userId" });

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("should block non-branch admin", async () => {
      req.user.role = ROLES.EMPLOYER;

      const middleware = requireSameBranchAsTargetUser();

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("should allow same branch", async () => {
      req.user.role = ROLES.BRANCH_ADMIN;
      req.user.id = "u1";

      User.findById
        .mockReturnValueOnce({ select: () => ({ lean: () => ({ branch: "b1" }) }) })
        .mockReturnValueOnce({ select: () => ({ lean: () => ({ branch: "b1" }) }) });

      req.params = { userId: "u2" };

      const middleware = requireSameBranchAsTargetUser();

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("should block cross branch", async () => {
      req.user.role = ROLES.BRANCH_ADMIN;

      User.findById
        .mockReturnValueOnce({ select: () => ({ lean: () => ({ branch: "b1" }) }) })
        .mockReturnValueOnce({ select: () => ({ lean: () => ({ branch: "b2" }) }) });

      req.params = { userId: "u2" };

      const middleware = requireSameBranchAsTargetUser();

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  // ---------------- requireSelfOrRoles ----------------
  describe("requireSelfOrRoles", () => {
    it("should allow self access", () => {
      req.user.id = "u1";
      req.params = { userId: "u1" };

      const middleware = requireSelfOrRoles();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("should allow role-based access", () => {
      req.user.id = "u1";
      req.user.role = ROLES.ADMIN;
      req.params = { userId: "u2" };

      const middleware = requireSelfOrRoles({
        roles: [ROLES.ADMIN]
      });

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("should block unauthorized access", () => {
      req.user.id = "u1";
      req.user.role = ROLES.EMPLOYER;
      req.params = { userId: "u2" };

      const middleware = requireSelfOrRoles({
        roles: [ROLES.ADMIN]
      });

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});