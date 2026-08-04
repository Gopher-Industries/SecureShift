import {
  afterEach,
  beforeEach,
  describe,
  expect,
  jest,
  test,
} from "@jest/globals";

describe("audit middleware environment configuration", () => {
  const originalAuditLogEnabled = process.env.AUDIT_LOG_ENABLED;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    jest.resetModules();
    process.env.AUDIT_LOG_ENABLED = "true";
    process.env.NODE_ENV = "test";
  });

  afterEach(() => {
    if (originalAuditLogEnabled === undefined) {
      delete process.env.AUDIT_LOG_ENABLED;
    } else {
      process.env.AUDIT_LOG_ENABLED = originalAuditLogEnabled;
    }

    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }

    jest.restoreAllMocks();
  });

  test("persists an audit record when AUDIT_LOG_ENABLED=true before import", async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const AuditLog = jest.fn(() => ({ save }));

    jest.doMock("../src/models/AuditLogs.js", () => ({
      __esModule: true,
      default: AuditLog,
    }));

    const { auditMiddleware } = await import("../src/middleware/logger.js");
    const req = {};
    const next = jest.fn();

    auditMiddleware(req, {}, next);
    await req.audit.log("user-id", "OTP_SENT", { source: "test" });

    expect(next).toHaveBeenCalledTimes(1);
    expect(AuditLog).toHaveBeenCalledWith({
      user: "user-id",
      action: "OTP_SENT",
      metadata: { source: "test" },
    });
    expect(save).toHaveBeenCalledTimes(1);
  });
});
