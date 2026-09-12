import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { createEmbedding } from "../embeddings/embeddingService.js";
import { cosineSimilarity } from "./similarity.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const vectorsFolder = path.join(__dirname, "../../../knowledge-base/vectors");

// =========================================================
// LOAD ALL VECTORS
// =========================================================

let vectors = [];

if (!fs.existsSync(vectorsFolder)) {
  console.error(`ERROR: Vector folder does not exist: ${vectorsFolder}`);
} else {
  const files = fs.readdirSync(vectorsFolder);

  for (const file of files) {
    if (!file.endsWith(".json")) {
      continue;
    }

    try {
      const filePath = path.join(vectorsFolder, file);

      const fileVectors = JSON.parse(fs.readFileSync(filePath, "utf8"));

      fileVectors.forEach((chunk) => {
        chunk.document = chunk.document || file;

        vectors.push(chunk);
      });
    } catch (error) {
      console.error(
        `ERROR: Failed to load vector file ${file}:`,
        error.message,
      );
    }
  }

  console.log(
    `Loaded ${vectors.length} chunks from ${
      files.filter((file) => file.endsWith(".json")).length
    } documents`,
  );
}

// =========================================================
// CLEAN TEXT
// =========================================================

function cleanText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// =========================================================
// KEYWORDS
// =========================================================

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
    "i",
    "my",
    "we",
    "our",
    "you",
    "your",
    "this",
    "that",
    "it",
    "be",
    "from",
    "into",
    "using",
  ]);

  const aliases = {
    technologies: "technology",
    technology: "technology",
    tech: "technology",

    frameworks: "framework",
    framework: "framework",

    databases: "database",
    database: "database",

    frontends: "frontend",
    frontend: "frontend",

    backends: "backend",
    backend: "backend",

    shifts: "shift",
    shift: "shift",

    schedules: "schedule",
    scheduling: "schedule",
    scheduled: "schedule",

    rosters: "roster",
    roster: "roster",

    employees: "employee",
    employee: "employee",

    guards: "guard",
    guard: "guard",

    applicants: "applicant",
    applicant: "applicant",

    approvals: "approve",
    approved: "approve",
    approving: "approve",
    approve: "approve",

    branches: "branch",
    branch: "branch",

    notifications: "notification",
    notification: "notification",

    messages: "message",
    message: "message",

    containers: "docker",
    container: "docker",

    building: "build",
    built: "build",
    builds: "build",
    build: "build",

    running: "run",
    runs: "run",
    run: "run",
  };

  return cleanText(question)
    .split(" ")
    .filter((word) => word.length > 2 && !stopWords.has(word))
    .map((word) => aliases[word] || word);
}

// =========================================================
// KEYWORD SCORE
// =========================================================

function keywordScore(question, chunk) {
  const keywords = getKeywords(question);

  if (keywords.length === 0) {
    return 0;
  }

  const section = cleanText(chunk.section || "");

  const text = cleanText(chunk.text || "");

  let score = 0;

  for (const keyword of keywords) {
    // Section match is useful but should not dominate.
    if (section.includes(keyword)) {
      score += 2;
    }

    // Actual text match is more important.
    if (text.includes(keyword)) {
      score += 1;
    }
  }

  const maxScore = keywords.length * 3;

  return Math.min(score / maxScore, 1);
}

// =========================================================
// TECHNICAL MATCH
// =========================================================

function technicalMatchScore(question, chunk) {
  const q = cleanText(question);
  const text = cleanText(chunk.text || "");

  let score = 0;

  // ---------------------------------------------------------
  // Docker / Build / Run
  // ---------------------------------------------------------

  if (q.includes("build") || q.includes("run") || q.includes("docker")) {
    // Strong match only when the ACTUAL chunk text
    // contains Docker/build commands.
    if (
      text.includes("docker compose") ||
      text.includes("dockerfile") ||
      text.includes("docker build") ||
      text.includes("docker run")
    ) {
      score = Math.max(score, 1);
    }
  }

  // ---------------------------------------------------------
  // MongoDB
  // ---------------------------------------------------------

  if (q.includes("mongodb") || q.includes("database")) {
    if (
      text.includes("mongodb") ||
      text.includes("mongodb 27017") ||
      text.includes("localhost 27017") ||
      text.includes("mongoose")
    ) {
      score = Math.max(score, 1);
    }
  }

  // ---------------------------------------------------------
  // Git / GitHub
  // ---------------------------------------------------------

  if (
    q.includes("git") ||
    q.includes("github") ||
    q.includes("branch") ||
    q.includes("commit") ||
    q.includes("pull request")
  ) {
    if (
      text.includes("git") ||
      text.includes("github") ||
      text.includes("pull request")
    ) {
      score = Math.max(score, 0.9);
    }
  }

  // ---------------------------------------------------------
  // Shift creation
  // ---------------------------------------------------------

  if (
    q.includes("create shift") ||
    q.includes("create a shift") ||
    q.includes("make a shift")
  ) {
    if (
      text.includes("create a shift") ||
      text.includes("create shift") ||
      text.includes("shift management")
    ) {
      score = Math.max(score, 1);
    }
  }

  // ---------------------------------------------------------
  // Frontend
  // ---------------------------------------------------------

  if (q.includes("frontend") || q.includes("react")) {
    if (text.includes("frontend") || text.includes("react")) {
      score = Math.max(score, 0.9);
    }
  }

  // ---------------------------------------------------------
  // Backend
  // ---------------------------------------------------------

  if (q.includes("backend") || q.includes("api")) {
    if (
      text.includes("backend") ||
      text.includes("api") ||
      text.includes("express")
    ) {
      score = Math.max(score, 0.9);
    }
  }

  return score;
}

// =========================================================
// SECTION MATCH
// =========================================================

function sectionMatchScore(question, chunk) {
  const q = cleanText(question);

  const section = cleanText(chunk.section || "");

  const text = cleanText(chunk.text || "");

  // ---------------------------------------------------------
  // Technology
  // ---------------------------------------------------------

  if (
    q.includes("technology") ||
    q.includes("tech stack") ||
    q.includes("framework") ||
    q.includes("database")
  ) {
    if (section.includes("technology stack")) {
      return 1;
    }

    if (text.includes("technology stack")) {
      return 0.7;
    }
  }

  // ---------------------------------------------------------
  // Architecture
  // ---------------------------------------------------------

  if (q.includes("architecture") || q.includes("system architecture")) {
    if (section.includes("project architecture")) {
      return 1;
    }

    if (text.includes("project architecture")) {
      return 0.7;
    }
  }

  // ---------------------------------------------------------
  // Docker
  // ---------------------------------------------------------

  if (
    q.includes("docker") ||
    q.includes("container") ||
    q.includes("build secureshift") ||
    q.includes("run secureshift")
  ) {
    if (
      section.includes("docker setup") ||
      section.includes("docker compose") ||
      section.includes("full docker")
    ) {
      return 1;
    }

    if (
      text.includes("docker compose up") ||
      text.includes("docker compose") ||
      text.includes("docker build")
    ) {
      return 0.8;
    }
  }

  // ---------------------------------------------------------
  // Git
  // ---------------------------------------------------------

  if (
    q.includes("git") ||
    q.includes("github") ||
    q.includes("branch") ||
    q.includes("commit") ||
    q.includes("pull request")
  ) {
    if (section.includes("git") || section.includes("pull request")) {
      return 1;
    }

    if (text.includes("git") || text.includes("github")) {
      return 0.7;
    }
  }

  // ---------------------------------------------------------
  // Shift
  // ---------------------------------------------------------

  if (q.includes("shift") || q.includes("schedule") || q.includes("roster")) {
    if (
      section.includes("shift") ||
      section.includes("schedule") ||
      section.includes("roster")
    ) {
      return 1;
    }

    if (text.includes("shift") || text.includes("schedule")) {
      return 0.7;
    }
  }

  // ---------------------------------------------------------
  // Guard
  // ---------------------------------------------------------

  if (q.includes("guard") || q.includes("employee")) {
    if (section.includes("guard") || section.includes("employee")) {
      return 1;
    }

    if (text.includes("guard") || text.includes("employee")) {
      return 0.7;
    }
  }

  // ---------------------------------------------------------
  // Notifications
  // ---------------------------------------------------------

  if (
    q.includes("notification") ||
    q.includes("notify") ||
    q.includes("alert")
  ) {
    if (section.includes("notification")) {
      return 1;
    }

    if (text.includes("notification")) {
      return 0.7;
    }
  }

  // ---------------------------------------------------------
  // Chat / Messages
  // ---------------------------------------------------------

  if (
    q.includes("message") ||
    q.includes("conversation") ||
    q.includes("chat")
  ) {
    if (section.includes("message") || section.includes("conversation")) {
      return 1;
    }

    if (text.includes("message") || text.includes("conversation")) {
      return 0.7;
    }
  }

  return 0;
}

// =========================================================
// DOCUMENT RELEVANCE
// =========================================================

function documentMatchScore(question, chunk) {
  const q = cleanText(question);

  const document = cleanText(chunk.document || "");

  let score = 0;

  // SecureShift questions should prefer
  // SecureShift documentation.
  if (q.includes("secureshift") && document.includes("secureshift")) {
    score = Math.max(score, 0.5);
  }

  return score;
}

// =========================================================
// SPECIAL QUERY INTENT
// =========================================================

function getQueryIntent(question) {
  const q = cleanText(question);

  // Build / run SecureShift
  if (
    q.includes("build secureshift") ||
    q.includes("build and run secureshift") ||
    q.includes("run secureshift") ||
    q.includes("how do i build secureshift")
  ) {
    return "build";
  }

  // Docker questions
  if (
    q.includes("docker") &&
    (q.includes("build") || q.includes("run") || q.includes("start"))
  ) {
    return "build";
  }

  // Shift creation
  if (
    q.includes("create shift") ||
    q.includes("create a shift") ||
    q.includes("make a shift")
  ) {
    return "shift";
  }

  return "general";
}

// =========================================================
// INTENT MATCH
// =========================================================

function intentMatchScore(question, chunk) {
  const intent = getQueryIntent(question);

  if (intent === "build") {
    const text = cleanText(chunk.text || "");

    const section = cleanText(chunk.section || "");

    // Strongest signal:
    // actual Docker build/run command.
    if (text.includes("docker compose up --build")) {
      return 1;
    }

    if (
      text.includes("docker compose up") ||
      text.includes("docker compose build") ||
      text.includes("docker build")
    ) {
      return 0.9;
    }

    // Docker setup section without actual command
    // gets a smaller score.
    if (
      section.includes("docker setup") ||
      section.includes("docker compose") ||
      section.includes("full docker")
    ) {
      return 0.5;
    }

    return 0;
  }

  if (intent === "shift") {
    const text = cleanText(chunk.text || "");

    if (text.includes("create a shift") || text.includes("create shift")) {
      return 1;
    }

    if (text.includes("shift management")) {
      return 0.7;
    }

    return 0;
  }

  return 0;
}

// =========================================================
// SEMANTIC SEARCH
// =========================================================

export async function semanticSearch(question, topK = 3) {
  if (!question || typeof question !== "string") {
    return {
      results: [],
      bestScore: 0,
    };
  }

  if (vectors.length === 0) {
    console.warn("WARNING: No knowledge-base vectors are loaded.");

    return {
      results: [],
      bestScore: 0,
    };
  }

  // ---------------------------------------------------------
  // Create question embedding
  // ---------------------------------------------------------

  const questionEmbedding = await createEmbedding(question);

  // ---------------------------------------------------------
  // Score every chunk
  // ---------------------------------------------------------

  const scored = vectors.map((chunk) => {
    const semantic = cosineSimilarity(questionEmbedding, chunk.embedding);

    const keyword = keywordScore(question, chunk);

    const sectionMatch = sectionMatchScore(question, chunk);

    const technicalMatch = technicalMatchScore(question, chunk);

    const documentMatch = documentMatchScore(question, chunk);

    const intentMatch = intentMatchScore(question, chunk);

    /*
     * Retrieval weighting:
     *
     * Semantic similarity = 45%
     * Keyword matching    = 15%
     * Section matching    = 10%
     * Technical matching  = 10%
     * Document matching   = 5%
     * Intent matching     = 15%
     *
     * Intent matching is particularly useful for
     * specific questions such as:
     *
     * "How do I build SecureShift?"
     *
     * because a chunk containing:
     *
     * docker compose up --build -d
     *
     * should outrank a chunk that merely happens
     * to belong to a Docker-related section.
     */

    const score =
      semantic * 0.45 +
      keyword * 0.15 +
      sectionMatch * 0.1 +
      technicalMatch * 0.1 +
      documentMatch * 0.05 +
      intentMatch * 0.15;

    return {
      ...chunk,

      semanticScore: semantic,
      keywordScore: keyword,
      sectionMatchScore: sectionMatch,
      technicalMatchScore: technicalMatch,
      documentMatchScore: documentMatch,
      intentMatchScore: intentMatch,

      score,
    };
  });

  // ---------------------------------------------------------
  // Sort highest first
  // ---------------------------------------------------------

  scored.sort((a, b) => b.score - a.score);

  // ---------------------------------------------------------
  // Top results
  // ---------------------------------------------------------

  const results = scored.slice(0, topK);

  const bestScore = results[0]?.score || 0;

  // ---------------------------------------------------------
  // Debug
  // ---------------------------------------------------------

  console.log("\n========== SEMANTIC SEARCH ==========");

  console.log("Question:", question);

  console.log("Intent:", getQueryIntent(question));

  console.log("Total vectors:", vectors.length);

  results.forEach((result, index) => {
    console.log(`\n--- Result ${index + 1} ---`);

    console.log("Final Score:", result.score.toFixed(3));

    console.log("Semantic:", result.semanticScore.toFixed(3));

    console.log("Keyword:", result.keywordScore.toFixed(3));

    console.log("Section:", result.sectionMatchScore.toFixed(3));

    console.log("Technical:", result.technicalMatchScore.toFixed(3));

    console.log("Document:", result.documentMatchScore.toFixed(3));

    console.log("Intent:", result.intentMatchScore.toFixed(3));

    console.log("Document:", result.document);

    console.log("Section Name:", result.section);

    console.log(
      "Text:",
      String(result.text || "")
        .substring(0, 500)
        .replace(/\n/g, " "),
    );
  });

  console.log("\nBest Score:", bestScore.toFixed(3));

  console.log("======================================\n");

  return {
    results,
    bestScore,
  };
}
