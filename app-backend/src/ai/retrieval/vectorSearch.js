import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { createEmbedding } from "../embeddings/embeddingService.js";
import { cosineSimilarity } from "./similarity.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const vectorsFolder = path.join(
  __dirname,
  "../../../knowledge-base/vectors",
);

// ==========================================
// Load all vectors
// ==========================================

let vectors = [];

if (!fs.existsSync(vectorsFolder)) {
  console.error(
    `ERROR: Vector folder does not exist: ${vectorsFolder}`,
  );
} else {
  const files = fs.readdirSync(vectorsFolder);

  for (const file of files) {
    if (!file.endsWith(".json")) continue;

    try {
      const filePath = path.join(vectorsFolder, file);

      const fileVectors = JSON.parse(
        fs.readFileSync(filePath, "utf8"),
      );

      fileVectors.forEach((chunk) => {
        chunk.document = file;
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

// ==========================================
// Clean text
// ==========================================

function cleanText(text) {
  return String(text || "")
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
    "i",
    "my",
    "we",
    "our",
    "you",
    "your",
  ]);

  // Normalize related words
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
  };

  return cleanText(question)
    .split(" ")
    .filter(
      (word) =>
        word.length > 2 &&
        !stopWords.has(word),
    )
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

  const isDockerQuestion =
    q.includes("docker") ||
    q.includes("container") ||
    q.includes("docker compose");

  if (isDockerQuestion) {
    if (
      section.includes("docker") ||
      section.includes("container")
    ) {
      return 1;
    }

    if (
      text.includes("docker") ||
      text.includes("container")
    ) {
      return 0.8;
    }
  }

  // ==========================================
  // Git / GitHub questions
  // ==========================================

  const isGitQuestion =
    q.includes("git") ||
    q.includes("github") ||
    q.includes("branch") ||
    q.includes("commit") ||
    q.includes("pull request") ||
    q.includes("merge");

  if (isGitQuestion) {
    if (
      section.includes("git") ||
      section.includes("github") ||
      section.includes("pull request")
    ) {
      return 1;
    }

    if (
      text.includes("git") ||
      text.includes("github") ||
      text.includes("pull request")
    ) {
      return 0.8;
    }
  }

  // ==========================================
  // Shift questions
  // ==========================================

  const isShiftQuestion =
    q.includes("shift") ||
    q.includes("schedule") ||
    q.includes("roster") ||
    q.includes("applicant") ||
    q.includes("approve shift") ||
    q.includes("create a shift") ||
    q.includes("create shift");

  if (isShiftQuestion) {
    if (
      section.includes("shift") ||
      section.includes("schedule") ||
      section.includes("roster") ||
      section.includes("applicant")
    ) {
      return 1;
    }

    if (
      text.includes("shift") ||
      text.includes("schedule") ||
      text.includes("roster") ||
      text.includes("applicant")
    ) {
      return 0.8;
    }
  }

  // ==========================================
  // Guard questions
  // ==========================================

  const isGuardQuestion =
    q.includes("guard") ||
    q.includes("employee") ||
    q.includes("worker");

  if (isGuardQuestion) {
    if (
      section.includes("guard") ||
      section.includes("employee")
    ) {
      return 1;
    }

    if (
      text.includes("guard") ||
      text.includes("employee")
    ) {
      return 0.8;
    }
  }

  // ==========================================
  // Notification questions
  // ==========================================

  const isNotificationQuestion =
    q.includes("notification") ||
    q.includes("notify") ||
    q.includes("alert");

  if (isNotificationQuestion) {
    if (section.includes("notification")) {
      return 1;
    }

    if (text.includes("notification")) {
      return 0.8;
    }
  }

  // ==========================================
  // Message questions
  // ==========================================

  const isMessageQuestion =
    q.includes("message") ||
    q.includes("conversation") ||
    q.includes("chat");

  if (isMessageQuestion) {
    if (
      section.includes("message") ||
      section.includes("conversation")
    ) {
      return 1;
    }

    if (
      text.includes("message") ||
      text.includes("conversation")
    ) {
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

    if (
      text.includes(
        "secureshift is a workforce management platform",
      )
    ) {
      return 0.8;
    }
  }

  return 0;
}

// ==========================================
// Semantic search
// ==========================================

export async function semanticSearch(
  question,
  topK = 5,
) {
  if (!question || typeof question !== "string") {
    return {
      results: [],
      bestScore: 0,
    };
  }

  if (vectors.length === 0) {
    console.warn(
      "WARNING: No knowledge-base vectors are loaded.",
    );

    return {
      results: [],
      bestScore: 0,
    };
  }

  // Create embedding for the user's question
  const questionEmbedding =
    await createEmbedding(question);

  // Score every knowledge-base chunk
  const scored = vectors.map((chunk) => {
    const semantic = cosineSimilarity(
      questionEmbedding,
      chunk.embedding,
    );

    const keyword = keywordScore(
      question,
      chunk,
    );

    const sectionMatch = sectionMatchScore(
      question,
      chunk,
    );

    /*
      Final score:

      Semantic similarity = 35%
      Keyword matching    = 25%
      Section matching    = 40%
    */

    const score =
      semantic * 0.35 +
      keyword * 0.25 +
      sectionMatch * 0.4;

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

  const bestScore =
    results[0]?.score || 0;

  // ==========================================
  // Debug output
  // ==========================================

  console.log(
    "\n========== SEMANTIC SEARCH ==========",
  );

  console.log("Question:", question);

  console.log(
    "Total vectors:",
    vectors.length,
  );

  results.forEach((result, index) => {
    console.log(
      `\n--- Result ${index + 1} ---`,
    );

    console.log(
      "Final Score:",
      result.score.toFixed(3),
    );

    console.log(
      "Semantic:",
      result.semanticScore.toFixed(3),
    );

    console.log(
      "Keyword:",
      result.keywordScore.toFixed(3),
    );

    console.log(
      "Section:",
      result.sectionMatchScore.toFixed(3),
    );

    console.log(
      "Document:",
      result.document,
    );

    console.log(
      "Section Name:",
      result.section,
    );

    console.log(
      "Text:",
      String(result.text || "")
        .substring(0, 300)
        .replace(/\n/g, " "),
    );
  });

  console.log(
    "\nBest Score:",
    bestScore.toFixed(3),
  );

  console.log(
    "======================================\n",
  );

  return {
    results,
    bestScore,
  };
}