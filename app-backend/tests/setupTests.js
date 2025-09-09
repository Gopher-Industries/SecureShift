import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

/**
 * Test setup:
 * - Silence console.error to reduce noise when tests intentionally trigger errors.
 * - Start an in-memory MongoDB for any integration-style tests that require mongoose.
 */

let mongoServer;

// Silence console.error during tests (helps keep test output clean for expected error branches)
beforeAll(() => {
  // guard against running outside of Jest
  if (typeof jest !== 'undefined' && console && console.error) {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  }
});

afterAll(() => {
  if (console.error && console.error.mockRestore) {
    console.error.mockRestore();
  }
});

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';
  // Ensure audit logs are disabled during tests unless explicitly enabled
  process.env.AUDIT_LOG_ENABLED = process.env.AUDIT_LOG_ENABLED || 'false';

  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, { dbName: 'test' });
});

afterEach(async () => {
  // Clear DB between tests
  const collections = Object.values(mongoose.connection.collections);
  await Promise.all(collections.map((c) => c.deleteMany({})));
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});
