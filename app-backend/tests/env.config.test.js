// tests for env.js - we test collectErrors() directly so we don't have to
// worry about process.exit() being called during the tests

import { collectErrors } from "../src/config/env.js";

// a valid dev config we can spread and override in each test
const VALID_DEV = {
  NODE_ENV: "development",
  PORT: "5000",
  MONGO_URI: "mongodb://localhost:27017/secureshift_local",
  JWT_SECRET: "atleasteightchars",
  LICENCE_ENC_KEY: "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=", // 32-byte default key
  EMAIL_ENABLED: "false",
  VERIFICATION_ENABLED: "false",
};

// production needs a longer JWT secret and a non-default encryption key
const VALID_PROD = {
  NODE_ENV: "production",
  PORT: "5000",
  MONGO_URI: "mongodb+srv://user:pass@cluster.mongodb.net/secureshift",
  JWT_SECRET: "a-very-long-production-secret-that-is-at-least-32-chars",
  LICENCE_ENC_KEY: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=", // 32 null bytes, different from the dev default
  EMAIL_ENABLED: "false",
  VERIFICATION_ENABLED: "false",
};

describe("valid configurations - should pass with no errors", () => {
  it("basic dev config works", () => {
    expect(collectErrors(VALID_DEV)).toEqual([]);
  });

  it("basic production config works", () => {
    expect(collectErrors(VALID_PROD)).toEqual([]);
  });

  it("mongodb+srv:// URI is accepted", () => {
    const env = { ...VALID_DEV, MONGO_URI: "mongodb+srv://user:pass@cluster.mongodb.net/db" };
    expect(collectErrors(env)).toEqual([]);
  });

  it("PORT can be left out and it will just use the default", () => {
    const { PORT: _port, ...env } = VALID_DEV;
    expect(collectErrors(env)).toEqual([]);
  });

  it("email config works when all SMTP fields are filled in", () => {
    const env = {
      ...VALID_DEV,
      EMAIL_ENABLED: "true",
      SMTP_HOST: "localhost",
      SMTP_PORT: "1025", // mailpit port for local testing
      SMTP_SECURE: "false",
      SMTP_AUTH_REQUIRED: "true",
      SMTP_USER: "test@example.com",
      SMTP_PASS: "secret",
      SMTP_FROM_EMAIL: "noreply@example.com",
    };
    expect(collectErrors(env)).toEqual([]);
  });

  it("NSW verification config works when all fields are filled in", () => {
    const env = {
      ...VALID_DEV,
      VERIFICATION_ENABLED: "true",
      NSW_TOKEN_URL: "https://api.example.nsw.gov.au/oauth/token",
      NSW_VERIFY_URL: "https://api.example.nsw.gov.au/v1/verify",
      NSW_API_KEY: "key123",
      NSW_API_SECRET: "secret456",
    };
    expect(collectErrors(env)).toEqual([]);
  });

  it("SMTP credentials are not required when email is disabled", () => {
    const env = {
      ...VALID_DEV,
      EMAIL_ENABLED: "false",
      SMTP_HOST: undefined,
      SMTP_USER: undefined,
      SMTP_PASS: undefined,
      SMTP_FROM_EMAIL: undefined,
    };
    expect(collectErrors(env)).toEqual([]);
  });

  it("NSW credentials are not required when verification is disabled", () => {
    const env = {
      ...VALID_DEV,
      VERIFICATION_ENABLED: "false",
      NSW_TOKEN_URL: undefined,
      NSW_VERIFY_URL: undefined,
      NSW_API_KEY: undefined,
      NSW_API_SECRET: undefined,
    };
    expect(collectErrors(env)).toEqual([]);
  });
});

describe("MONGO_URI validation", () => {
  it("errors when MONGO_URI is missing", () => {
    const { MONGO_URI: _m, ...env } = VALID_DEV;
    expect(collectErrors(env).some((e) => e.includes("MONGO_URI"))).toBe(true);
  });

  it("errors when MONGO_URI uses the wrong scheme (e.g. postgres)", () => {
    const env = { ...VALID_DEV, MONGO_URI: "postgres://localhost/db" };
    expect(collectErrors(env).some((e) => e.includes("MONGO_URI"))).toBe(true);
  });

  it("no error for a valid MONGO_URI", () => {
    expect(collectErrors(VALID_DEV).some((e) => e.includes("MONGO_URI"))).toBe(false);
  });
});

describe("JWT_SECRET validation", () => {
  it("errors when JWT_SECRET is missing", () => {
    const { JWT_SECRET: _j, ...env } = VALID_DEV;
    expect(collectErrors(env).some((e) => e.includes("JWT_SECRET"))).toBe(true);
  });

  it("errors when JWT_SECRET is too short in dev (under 8 chars)", () => {
    const env = { ...VALID_DEV, JWT_SECRET: "short" };
    expect(collectErrors(env).some((e) => e.includes("JWT_SECRET"))).toBe(true);
  });

  it("errors when JWT_SECRET is too short in production (under 32 chars)", () => {
    const env = { ...VALID_PROD, JWT_SECRET: "tooshort" };
    expect(collectErrors(env).some((e) => e.includes("JWT_SECRET"))).toBe(true);
  });

  it("errors when the default dev JWT_SECRET is used in production", () => {
    const env = { ...VALID_PROD, JWT_SECRET: "local-dev-jwt-secret-change-me" };
    expect(collectErrors(env).some((e) => e.includes("JWT_SECRET"))).toBe(true);
  });

  it("never prints the actual JWT_SECRET value in error messages", () => {
    const secretValue = "mysupersecretjwt12345678901234567";
    const env = { ...VALID_PROD, JWT_SECRET: secretValue };
    collectErrors(env).forEach((e) => expect(e).not.toContain(secretValue));
  });
});

describe("PORT validation", () => {
  it("errors for a non-numeric PORT like 'abc'", () => {
    const env = { ...VALID_DEV, PORT: "abc" };
    expect(collectErrors(env).some((e) => e.includes("PORT"))).toBe(true);
  });

  it("errors for PORT=0 (0 is not a valid port)", () => {
    const env = { ...VALID_DEV, PORT: "0" };
    expect(collectErrors(env).some((e) => e.includes("PORT"))).toBe(true);
  });

  it("errors for PORT=65536 (above the max)", () => {
    const env = { ...VALID_DEV, PORT: "65536" };
    expect(collectErrors(env).some((e) => e.includes("PORT"))).toBe(true);
  });

  it("accepts PORT=65535 (the highest valid port)", () => {
    const env = { ...VALID_DEV, PORT: "65535" };
    expect(collectErrors(env).some((e) => e.includes("PORT"))).toBe(false);
  });
});

describe("LICENCE_ENC_KEY validation", () => {
  it("errors when LICENCE_ENC_KEY is missing", () => {
    const { LICENCE_ENC_KEY: _k, ...env } = VALID_DEV;
    expect(collectErrors(env).some((e) => e.includes("LICENCE_ENC_KEY"))).toBe(true);
  });

  it("errors when key decodes to fewer than 32 bytes", () => {
    const shortKey = Buffer.from("tooshort").toString("base64"); // only 8 bytes
    const env = { ...VALID_DEV, LICENCE_ENC_KEY: shortKey };
    expect(collectErrors(env).some((e) => e.includes("LICENCE_ENC_KEY"))).toBe(true);
  });

  it("errors when key decodes to more than 32 bytes", () => {
    const longKey = Buffer.from("a".repeat(33)).toString("base64");
    const env = { ...VALID_DEV, LICENCE_ENC_KEY: longKey };
    expect(collectErrors(env).some((e) => e.includes("LICENCE_ENC_KEY"))).toBe(true);
  });

  it("errors when the default dev key is used in production", () => {
    const env = { ...VALID_PROD, LICENCE_ENC_KEY: "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=" };
    expect(collectErrors(env).some((e) => e.includes("LICENCE_ENC_KEY"))).toBe(true);
  });

  it("never prints the actual LICENCE_ENC_KEY value in error messages", () => {
    const shortKey = Buffer.from("a".repeat(16)).toString("base64"); // 16 bytes, too short
    const env = { ...VALID_DEV, LICENCE_ENC_KEY: shortKey };
    collectErrors(env).forEach((e) => expect(e).not.toContain(shortKey));
  });
});

describe("NODE_ENV validation", () => {
  it("accepts all the known valid values", () => {
    ["development", "test", "staging", "production"].forEach((nodeEnv) => {
      const env = nodeEnv === "production" ? VALID_PROD : { ...VALID_DEV, NODE_ENV: nodeEnv };
      expect(collectErrors(env).some((e) => e.includes("NODE_ENV"))).toBe(false);
    });
  });

  it("errors for a typo or unknown value like 'banana'", () => {
    const env = { ...VALID_DEV, NODE_ENV: "banana" };
    expect(collectErrors(env).some((e) => e.includes("NODE_ENV"))).toBe(true);
  });
});

describe("SMTP validation (only runs when EMAIL_ENABLED=true)", () => {
  // base with authentication enabled so SMTP_USER/SMTP_PASS are required
  const BASE_WITH_EMAIL = {
    ...VALID_DEV,
    EMAIL_ENABLED: "true",
    SMTP_HOST: "localhost",
    SMTP_PORT: "1025", // mailpit default port for local dev
    SMTP_SECURE: "false",
    SMTP_AUTH_REQUIRED: "true",
    SMTP_USER: "user@example.com",
    SMTP_PASS: "pass",
    SMTP_FROM_EMAIL: "from@example.com",
  };

  it("errors when SMTP_HOST is missing", () => {
    const { SMTP_HOST: _h, ...env } = BASE_WITH_EMAIL;
    expect(collectErrors(env).some((e) => e.includes("SMTP_HOST"))).toBe(true);
  });

  it("errors when SMTP_USER is missing and SMTP_AUTH_REQUIRED=true", () => {
    const { SMTP_USER: _u, ...env } = BASE_WITH_EMAIL;
    expect(collectErrors(env).some((e) => e.includes("SMTP_USER"))).toBe(true);
  });

  it("errors when SMTP_PASS is missing and SMTP_AUTH_REQUIRED=true", () => {
    const { SMTP_PASS: _p, ...env } = BASE_WITH_EMAIL;
    expect(collectErrors(env).some((e) => e.includes("SMTP_PASS"))).toBe(true);
  });

  it("errors when SMTP_FROM_EMAIL is missing", () => {
    const { SMTP_FROM_EMAIL: _f, ...env } = BASE_WITH_EMAIL;
    expect(collectErrors(env).some((e) => e.includes("SMTP_FROM_EMAIL"))).toBe(true);
  });

  it("errors for an out of range SMTP_PORT", () => {
    const env = { ...BASE_WITH_EMAIL, SMTP_PORT: "99999" };
    expect(collectErrors(env).some((e) => e.includes("SMTP_PORT"))).toBe(true);
  });

  it("errors when SMTP_SECURE is set to 'yes' instead of 'true' or 'false'", () => {
    const env = { ...BASE_WITH_EMAIL, SMTP_SECURE: "yes" };
    expect(collectErrors(env).some((e) => e.includes("SMTP_SECURE"))).toBe(true);
  });

  it("errors when SMTP_AUTH_REQUIRED is not 'true' or 'false'", () => {
    const env = { ...BASE_WITH_EMAIL, SMTP_AUTH_REQUIRED: "yes" };
    expect(collectErrors(env).some((e) => e.includes("SMTP_AUTH_REQUIRED"))).toBe(true);
  });

  it("never prints the actual SMTP_PASS value in error messages", () => {
    const secretPass = "mysecretsmtppassword";
    const { SMTP_HOST: _h, ...env } = { ...BASE_WITH_EMAIL, SMTP_PASS: secretPass };
    collectErrors(env).forEach((e) => expect(e).not.toContain(secretPass));
  });

  it("mailpit config with SMTP_AUTH_REQUIRED=false passes with blank credentials", () => {
    const env = {
      ...VALID_DEV,
      EMAIL_ENABLED: "true",
      SMTP_HOST: "localhost",
      SMTP_PORT: "1025",
      SMTP_SECURE: "false",
      SMTP_AUTH_REQUIRED: "false",
      SMTP_USER: "",
      SMTP_PASS: "",
      SMTP_FROM_EMAIL: "local@example.test",
    };
    expect(collectErrors(env)).toEqual([]);
  });

  it("mailpit config with auth enabled and credentials present passes", () => {
    expect(collectErrors(BASE_WITH_EMAIL)).toEqual([]);
  });
});

describe("NSW verification validation (only runs when VERIFICATION_ENABLED=true)", () => {
  const BASE_WITH_VERIFY = {
    ...VALID_DEV,
    VERIFICATION_ENABLED: "true",
    NSW_TOKEN_URL: "https://api.example.nsw.gov.au/oauth/token",
    NSW_VERIFY_URL: "https://api.example.nsw.gov.au/v1/verify",
    NSW_API_KEY: "key",
    NSW_API_SECRET: "secret",
  };

  it("errors when NSW_TOKEN_URL is missing", () => {
    const { NSW_TOKEN_URL: _t, ...env } = BASE_WITH_VERIFY;
    expect(collectErrors(env).some((e) => e.includes("NSW_TOKEN_URL"))).toBe(true);
  });

  it("errors when NSW_VERIFY_URL is missing", () => {
    const { NSW_VERIFY_URL: _v, ...env } = BASE_WITH_VERIFY;
    expect(collectErrors(env).some((e) => e.includes("NSW_VERIFY_URL"))).toBe(true);
  });

  it("errors when NSW_API_KEY is missing", () => {
    const { NSW_API_KEY: _k, ...env } = BASE_WITH_VERIFY;
    expect(collectErrors(env).some((e) => e.includes("NSW_API_KEY"))).toBe(true);
  });

  it("errors when NSW_API_SECRET is missing", () => {
    const { NSW_API_SECRET: _s, ...env } = BASE_WITH_VERIFY;
    expect(collectErrors(env).some((e) => e.includes("NSW_API_SECRET"))).toBe(true);
  });

  it("errors when NSW_TOKEN_URL is not actually a URL", () => {
    const env = { ...BASE_WITH_VERIFY, NSW_TOKEN_URL: "not-a-url" };
    expect(collectErrors(env).some((e) => e.includes("NSW_TOKEN_URL"))).toBe(true);
  });

  it("errors when NSW_VERIFY_URL uses ftp:// instead of http/https", () => {
    const env = { ...BASE_WITH_VERIFY, NSW_VERIFY_URL: "ftp://example.com/verify" };
    expect(collectErrors(env).some((e) => e.includes("NSW_VERIFY_URL"))).toBe(true);
  });

  it("never prints the actual NSW_API_SECRET value in error messages", () => {
    const secretVal = "nsw-super-secret-key";
    const { NSW_TOKEN_URL: _t, ...env } = { ...BASE_WITH_VERIFY, NSW_API_SECRET: secretVal };
    collectErrors(env).forEach((e) => expect(e).not.toContain(secretVal));
  });
});

describe("all errors at once", () => {
  it("returns all problems in one go instead of stopping at the first one", () => {
    // leave out several required fields and make sure all of them show up
    const env = {
      NODE_ENV: "development",
      EMAIL_ENABLED: "false",
      VERIFICATION_ENABLED: "false",
    };
    const errors = collectErrors(env);
    expect(errors.some((e) => e.includes("MONGO_URI"))).toBe(true);
    expect(errors.some((e) => e.includes("JWT_SECRET"))).toBe(true);
    expect(errors.some((e) => e.includes("LICENCE_ENC_KEY"))).toBe(true);
    expect(errors.length).toBeGreaterThanOrEqual(3);
  });
});
