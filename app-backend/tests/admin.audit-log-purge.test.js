import { beforeEach, describe, expect, jest, test } from "@jest/globals";

const purgeOldLogs = jest.fn();

jest.unstable_mockModule("../src/models/AuditLogs.js", () => ({
  default: {
    purgeOldLogs,
  },
}));

const { purgeAuditLogs } = await import(
  "../src/controllers/admin.controller.js"
);

const createResponse = () => {
  const res = {};

  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);

  return res;
};

describe("audit-log purge-window validation", () => {
  beforeEach(() => {
    purgeOldLogs.mockReset();
    purgeOldLogs.mockResolvedValue({ deletedCount: 2 });
  });

  test("uses the 30-day default only when days is omitted", async () => {
    const res = createResponse();

    await purgeAuditLogs({ query: {} }, res);

    expect(purgeOldLogs).toHaveBeenCalledWith(30);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("accepts a positive safe integer", async () => {
    const res = createResponse();

    await purgeAuditLogs({ query: { days: "7" } }, res);

    expect(purgeOldLogs).toHaveBeenCalledWith(7);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test.each([
    { label: "malformed value", value: "invalid" },
    { label: "fractional value", value: "1.5" },
    { label: "zero", value: "0" },
    { label: "negative value", value: "-1" },
    { label: "overflowing value", value: "9007199254740992" },
  ])("rejects a $label without deleting logs", async ({ value }) => {
    const res = createResponse();

    await purgeAuditLogs({ query: { days: value } }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "days must be a positive safe integer",
    });
    expect(purgeOldLogs).not.toHaveBeenCalled();
  });
});
