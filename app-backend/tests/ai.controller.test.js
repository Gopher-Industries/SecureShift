import { beforeEach, describe, expect, jest, test } from "@jest/globals";

const askOllama = jest.fn();
const semanticSearch = jest.fn();

jest.unstable_mockModule("../src/ai/services/ollamaService.js", () => ({
  askOllama,
}));

jest.unstable_mockModule("../src/ai/retrieval/vectorSearch.js", () => ({
  semanticSearch,
}));

const { chat } = await import("../src/ai/controllers/aiController.js");

describe("AI chat controller validation", () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    semanticSearch.mockResolvedValue({
      bestScore: 0.2,
      results: [],
    });

    askOllama.mockResolvedValue("Test answer");
  });

  test.each([
    ["number", 123],
    ["boolean", true],
    ["object", { text: "Question" }],
    ["array", ["Question"]],
  ])("returns 400 when question is a %s", async (_type, value) => {
    req.body.question = value;

    await chat(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Question must be a string.",
    });
    expect(semanticSearch).not.toHaveBeenCalled();
    expect(askOllama).not.toHaveBeenCalled();
  });

  test("continues to reject a blank string", async () => {
    req.body.question = "   ";

    await chat(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Question is required.",
    });
    expect(semanticSearch).not.toHaveBeenCalled();
    expect(askOllama).not.toHaveBeenCalled();
  });

  test("trims and processes a valid question", async () => {
    req.body.question = "   How do I clock in?   ";

    await chat(req, res);

    expect(semanticSearch).toHaveBeenCalledWith("How do I clock in?", 3);
    expect(askOllama).toHaveBeenCalledWith("How do I clock in?", []);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        mode: "general",
        answer: "Test answer",
      }),
    );
  });
});
