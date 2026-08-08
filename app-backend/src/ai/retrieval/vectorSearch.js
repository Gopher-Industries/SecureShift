import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { createEmbedding } from "../embeddings/embeddingService.js";
import { cosineSimilarity } from "./similarity.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const vectorsFolder = path.join(__dirname, "../../../knowledge-base/vectors");

// ==========================================
// Load all vectors
// ==========================================

let vectors = [];

const files = fs.readdirSync(vectorsFolder);

for (const file of files) {
  if (!file.endsWith(".json")) continue;

  const fileVectors = JSON.parse(
    fs.readFileSync(path.join(vectorsFolder, file), "utf8"),
  );

  fileVectors.forEach((chunk) => {
    chunk.document = file;
    vectors.push(chunk);
  });
}

console.log(
  `✅ Loaded ${vectors.length} chunks from ${
    files.filter((file) => file.endsWith(".json")).length
  } documents`,
);

// ==========================================
// Clean text
// ==========================================

function cleanText(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ==========================================
// Extract useful keywords
// ==========================================

function getKeywords(question) {
  const stopWords = new Set([
    "what",
    "is",
    "are",
    "the",
    "does",
    "do",
    "how",
    "can",
    "of",
    "a",
    "an",
    "and",
    "to",
    "for",
    "in",
    "on",
    "use",
    "uses",
    "used",
    "with",
    "about",
    "tell",
    "me",
    "please",
    "which",
  ]);

  // Normalize related words
  const aliases = {
    technologies: "technology",
    tech: "technology",
    frameworks: "framework",
    databases: "database",
    frontends: "frontend",
    backends: "backend",
  };

  return cleanText(question)
    .split(" ")
    .filter((word) => word.length > 2 && !stopWords.has(word))
    .map((word) => aliases[word] || word);
}

// ==========================================
// Keyword score
// ==========================================

function keywordScore(question, chunk) {
  const keywords = getKeywords(question);

  if (keywords.length === 0) {
    return 0;
  }

  const section = cleanText(chunk.section || "");
  const text = cleanText(chunk.text || "");

  let score = 0;

  for (const keyword of keywords) {
    // Stronger weight when keyword appears in section
    if (section.includes(keyword)) {
      score += 2;
    }

    // Normal weight when keyword appears in text
    if (text.includes(keyword)) {
      score += 1;
    }
  }

  const maxScore = keywords.length * 3;

  return Math.min(score / maxScore, 1);
}

// ==========================================
// Section / topic matching
// ==========================================

function sectionMatchScore(question, chunk) {
  const q = cleanText(question);
  const section = cleanText(chunk.section || "");
  const text = cleanText(chunk.text || "");

  // ==========================================
  // Technology questions
  // ==========================================

  const isTechnologyQuestion =
    q.includes("technolog") ||
    q.includes("tech stack") ||
    q.includes("framework") ||
    q.includes("database") ||
    q.includes("backend") ||
    q.includes("frontend");

  if (isTechnologyQuestion) {
    if (section.includes("technology stack")) {
      return 1;
    }

    if (text.includes("technology stack")) {
      return 0.8;
    }
  }

  // ==========================================
  // Architecture questions
  // ==========================================

  const isArchitectureQuestion =
    q.includes("architect") ||
    q.includes("system architecture") ||
    q.includes("project architecture");

  if (isArchitectureQuestion) {
    if (section.includes("project architecture")) {
      return 1;
    }

    if (text.includes("project architecture")) {
      return 0.8;
    }
  }

  // ==========================================
  // Docker questions
  // ==========================================

  if (q.includes("docker")) {
    if (section.includes("docker")) {
      return 1;
    }

    if (text.includes("docker")) {
      return 0.8;
    }
  }

  // ==========================================
  // Git questions
  // ==========================================

  if (
    q.includes("git") ||
    q.includes("github") ||
    q.includes("branch") ||
    q.includes("commit") ||
    q.includes("pull request")
  ) {
    if (section.includes("git")) {
      return 1;
    }

    if (text.includes("git")) {
      return 0.8;
    }
  }

  // ==========================================
  // SecureShift overview questions
  // ==========================================

  const isOverviewQuestion =
    q === "secureshift" ||
    q.includes("what is secureshift") ||
    q.includes("what does secureshift do") ||
    q.includes("tell me about secureshift") ||
    q.includes("about secureshift") ||
    q.includes("overview of secureshift");

  if (isOverviewQuestion) {
    if (section.includes("about secureshift")) {
      return 1;
    }

    if (text.includes("secureshift is a workforce management platform")) {
      return 0.8;
    }
  }

  return 0;
}

// ==========================================
// Semantic search
// ==========================================

export async function semanticSearch(question, topK = 5) {
  const questionEmbedding = await createEmbedding(question);

  const scored = vectors.map((chunk) => {
    const semantic = cosineSimilarity(questionEmbedding, chunk.embedding);

    const keyword = keywordScore(question, chunk);

    const sectionMatch = sectionMatchScore(question, chunk);

    /*
      Final score:

      Semantic similarity = 35%
      Keyword matching    = 25%
      Section matching    = 40%
    */

    const score = semantic * 0.35 + keyword * 0.25 + sectionMatch * 0.4;

    return {
      ...chunk,

      semanticScore: semantic,
      keywordScore: keyword,
      sectionMatchScore: sectionMatch,

      score,
    };
  });

  // ==========================================
  // Highest score first
  // ==========================================

  scored.sort((a, b) => b.score - a.score);

  const results = scored.slice(0, topK);

  const bestScore = results[0]?.score || 0;

  // ==========================================
  // Debug output
  // ==========================================

  console.log("\n========== SEMANTIC SEARCH ==========");

  console.log("Question:", question);

  results.forEach((result, index) => {
    console.log(`\n--- Result ${index + 1} ---`);

    console.log("Final Score:", result.score.toFixed(3));

    console.log("Semantic:", result.semanticScore.toFixed(3));

    console.log("Keyword:", result.keywordScore.toFixed(3));

    console.log("Section:", result.sectionMatchScore.toFixed(3));

    console.log("Document:", result.document);

    console.log("Section Name:", result.section);

    console.log("Text:", result.text.substring(0, 300).replace(/\n/g, " "));
  });

  console.log("\n======================================\n");

  return {
    results,
    bestScore,
  };
}
