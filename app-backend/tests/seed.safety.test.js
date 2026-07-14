import { describe, expect, test } from "@jest/globals";
import {
  assertSeedSafety,
  parseMongoTarget,
} from "../src/scripts/seed/safety.js";

const safeEnv = {
  NODE_ENV: "development",
  SEED_ALLOW_LOCAL: "true",
  MONGO_URI: "mongodb://localhost:27017/secureshift_local",
};

describe("local seed safety guard", () => {
  test.each(["secureshift_local", "secureshift_dev", "secureshift_test"])(
    "accepts the exact approved database name %s",
    (database) => {
      expect(
        assertSeedSafety({
          ...safeEnv,
          MONGO_URI: `mongodb://localhost:27017/${database}`,
        }).target,
      ).toEqual({ hosts: ["localhost"], database });
    },
  );

  test.each([
    [{ ...safeEnv, NODE_ENV: "production" }, "NODE_ENV=production"],
    [{ ...safeEnv, NODE_ENV: "  production  " }, "NODE_ENV=production"],
    [{ ...safeEnv, SEED_ALLOW_LOCAL: "false" }, "SEED_ALLOW_LOCAL=true"],
    [{ ...safeEnv, MONGO_URI: "" }, "explicit MONGO_URI"],
    [
      {
        ...safeEnv,
        MONGO_URI: "mongodb+srv://example.mongodb.net/secureshift_dev",
      },
      "mongodb://",
    ],
    [
      { ...safeEnv, MONGO_URI: "mongodb://db.example.com/secureshift_dev" },
      "host",
    ],
    [
      { ...safeEnv, MONGO_URI: "mongodb://localhost/secureshift" },
      "database must be exactly",
    ],
  ])("rejects an unsafe environment", (env, expectedMessage) => {
    expect(() => assertSeedSafety(env)).toThrow(expectedMessage);
  });

  test.each([
    "secureshift_production",
    "production_test",
    "secureshift_prod",
    "secureshift_live",
    "secureshift_staging",
    "secureshift_local_backup",
    "other_test",
  ])("rejects production-like or non-approved database name %s", (database) => {
    expect(() =>
      assertSeedSafety({
        ...safeEnv,
        MONGO_URI: `mongodb://localhost:27017/${database}`,
      }),
    ).toThrow("database must be exactly");
  });

  test("requires the exact reset confirmation", () => {
    expect(() => assertSeedSafety(safeEnv, { reset: true })).toThrow(
      "SEED_RESET_CONFIRM",
    );
    expect(() =>
      assertSeedSafety(
        { ...safeEnv, SEED_RESET_CONFIRM: "SecureShiftLocalReset" },
        { reset: true },
      ),
    ).not.toThrow();
  });

  test("parses credentials without exposing them in the target description", () => {
    expect(
      parseMongoTarget(
        "mongodb://user:redacted@127.0.0.1:27017/secureshift_test",
      ),
    ).toEqual({
      hosts: ["127.0.0.1"],
      database: "secureshift_test",
    });
  });
});
