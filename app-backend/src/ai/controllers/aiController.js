import { askOllama } from "../services/ollamaService.js";
import { semanticSearch } from "../retrieval/vectorSearch.js";

export async function chat(req, res) {
  console.log("\n======================================");
  console.log("AI QUESTION:", req.body?.question);
  console.log("======================================\n");

  try {
    const question = req.body?.question?.trim();

    if (!question) {
      return res.status(400).json({
        success: false,
        message: "Question is required.",
      });
    }

    // =========================================================
    // SEARCH KNOWLEDGE BASE
    // =========================================================

    const searchResult = await semanticSearch(question);

    let chunks = [];
    let mode = "general";
    let confidence = 0;

    if (searchResult.bestScore >= 0.6) {
      chunks = searchResult.results;
      mode = "documentation";
      confidence = Number(searchResult.bestScore.toFixed(3));
    }

    // =========================================================
    // DEBUG RETRIEVED CHUNKS
    // =========================================================

    console.log("\n========== RETRIEVED CHUNKS ==========");

    if (chunks.length === 0) {
      console.log("No documentation retrieved.");
    } else {
      chunks.forEach((chunk, index) => {
        console.log(`\nChunk ${index + 1}`);
        console.log("Document :", chunk.document);
        console.log("Section  :", chunk.section);
        console.log("Score    :", chunk.score.toFixed(3));
        console.log(
          "Text     :",
          chunk.text.substring(0, 300).replace(/\n/g, " "),
        );
      });
    }

    console.log("======================================\n");

    // =========================================================
    // CALL OLLAMA
    // =========================================================

    console.log("Calling Ollama...");

    const answer = await askOllama(question, chunks);

    console.log("✅ Answer generated successfully.");

    // =========================================================
    // RESPONSE
    // =========================================================

    return res.status(200).json({
      success: true,
      mode,
      answer,

      sources:
        mode === "documentation"
          ? chunks.map((chunk) => ({
              id: chunk.id,
              document: chunk.document,
              section: chunk.section,
              score: Number(chunk.score.toFixed(3)),
            }))
          : [],

      confidence,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("\n========== AI CHAT ERROR ==========");
    console.error("Message:", err.message);
    console.error(err.stack);
    console.error("===================================\n");

    return res.status(500).json({
      success: false,
      message: "SecureShift AI failed to generate a response.",
      error: err.message,
    });
  }
}