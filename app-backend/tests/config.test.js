// tests/config.test.js
/**
 * TODO: Verify environment configuration without establishing a database connection
 * Check whether NODE_ENV equals test
 * Check whether MONGO_URI has been defined
 * Check whether the target database name is secureshift_test
 * Check whether the host is localhost or 127.0.0.1
 * If all checks pass, confirm the safety validation logic works as expected
 */

describe("Test Environment Configuration", () => {
  it("should have NODE_ENV set to test", () => {
    expect(process.env.NODE_ENV).toBe("test");
  });

  it("should have MONGO_URI defined", () => {
    expect(process.env.MONGO_URI).toBeDefined();
    expect(process.env.MONGO_URI).toContain("mongodb://");
  });

  it("should target secureshift_test database", () => {
    const uri = process.env.MONGO_URI;
    expect(uri).toContain("secureshift_test");
  });

  it("should use localhost or 127.0.0.1", () => {
    const uri = process.env.MONGO_URI;
    expect(uri).toMatch(/localhost|127\.0\.0\.1|::1/);
  });
});
