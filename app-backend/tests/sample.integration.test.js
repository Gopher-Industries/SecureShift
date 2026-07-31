// tests/sample.integration.test.js
/**
 * TODO: Verify the test environment supports complete CRUD operations to confirm integration tests run properly
 * Create a single document
 * Read the newly created document
 * Update document content
 * Delete the document
 * If all steps pass, confirm the test database allows write operations and beforeAll/afterAll cleanup logic works correctly
 */
import mongoose from "mongoose";

const TestSchema = new mongoose.Schema({
  name: String,
  createdAt: { type: Date, default: Date.now },
});

const TestModel = mongoose.model("TestTemp", TestSchema);

describe("Sample Integration Test (CRUD)", () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_TEST_URI);
    }
  });

  afterAll(async () => {
    await TestModel.deleteMany({});
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  it("should create a document", async () => {
    const doc = await TestModel.create({ name: "test-doc" });
    expect(doc._id).toBeDefined();
    expect(doc.name).toBe("test-doc");
  });

  it("should read the created document", async () => {
    await TestModel.create({ name: "read-test" });
    const docs = await TestModel.find({ name: "read-test" });
    expect(docs.length).toBe(1);
    expect(docs[0].name).toBe("read-test");
  });

  it("should update a document", async () => {
    const doc = await TestModel.create({ name: "update-test" });
    doc.name = "updated";
    await doc.save();

    const found = await TestModel.findById(doc._id);
    expect(found.name).toBe("updated");
  });

  it("should delete a document", async () => {
    const doc = await TestModel.create({ name: "delete-test" });
    await TestModel.deleteOne({ _id: doc._id });

    const found = await TestModel.findById(doc._id);
    expect(found).toBeNull();
  });
});
