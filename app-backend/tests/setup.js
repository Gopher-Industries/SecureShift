// tests/setup.js
import dotenv from "dotenv";
import path from "path";

const envPath = path.resolve(process.cwd(), ".env.test");

// find .env.test file and load it into process.env
dotenv.config({
  path: envPath,
  override: true,
});

console.log(`[Test Setup] NODE_ENV=${process.env.NODE_ENV}`);
console.log(`[Test Setup] Loading .env.test from: ${envPath}`);

const MONGO_URI = process.env.MONGO_TEST_URI;

if (!MONGO_URI) {
  console.error("FAIL: [Test] MONGO_URI is not defined in .env.test");
  process.exit(1);
}

if (!MONGO_URI.startsWith("mongodb://")) {
  console.error(`FAIL: [Test] Must use mongodb:// protocol. Got: ${MONGO_URI}`);
  process.exit(1);
}

let url;
try {
  url = new URL(MONGO_URI);
} catch {
  console.error(`FAIL: [Test] Invalid MONGO_URI format: ${MONGO_URI}`);
  process.exit(1);
}

const host = url.hostname;
const dbName = url.pathname.slice(1);

if (!dbName) {
  console.error(`FAIL: [Test] Could not extract database name from URI.`);
  process.exit(1);
}

if (dbName !== "secureshift_test") {
  console.error(
    `FAIL: [Test] Test database MUST be 'secureshift_test'. ` +
      `Current is '${dbName}'. Aborting to protect dev/prod data.`,
  );
  process.exit(1);
}

if (host && !["localhost", "127.0.0.1", "::1"].includes(host)) {
  console.error(`FAIL: [Test] Test DB host must be localhost. Got: ${host}`);
  process.exit(1);
}

console.log(
  `GOOD: [Test] Security check passed. Target: ${dbName} on ${host || "localhost"}`,
);

jest.setTimeout(30000);
