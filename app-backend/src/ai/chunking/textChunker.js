/**
 * Split documentation into small semantic chunks.
 *
 * Each chunk keeps its section heading and contains a limited
 * amount of text so that vector search can retrieve focused
 * pieces of information.
 */

const MAX_WORDS = 250;

/**
 * Determine whether a line is a real documentation heading.
 */
function isHeading(line) {
  const trimmed = line.trim();

  if (!trimmed) {
    return false;
  }

  // Markdown headings
  // Example:
  // # Introduction
  // ## Docker Setup
  if (/^#{1,6}\s+/.test(trimmed)) {
    return true;
  }

  // Numbered headings
  // Example:
  // 1. Introduction
  // 2. Project Overview
  // 4.1 Docker Compose
  // 5.2 Install dependencies
  if (/^\d+(\.\d+)*\s+[A-Za-z]/.test(trimmed)) {
    return true;
  }

  return false;
}

/**
 * Count words in a string.
 */
function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Split documentation into semantic chunks.
 */
export function splitIntoChunks(text) {
  if (!text || typeof text !== "string") {
    return [];
  }

  const lines = text.split(/\r?\n/);

  const chunks = [];

  let currentSection = "General";
  let buffer = [];
  let wordCount = 0;

  /**
   * Save the current buffer as a chunk.
   */
  function saveChunk() {
    if (buffer.length === 0) {
      return;
    }

    const chunkText = buffer.join("\n").trim();

    if (!chunkText) {
      return;
    }

    chunks.push({
      section: currentSection,
      text: chunkText,
    });

    buffer = [];
    wordCount = 0;
  }

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();

    // Ignore empty lines
    if (!trimmed) {
      continue;
    }

    // ---------------------------------------------------------
    // NEW SECTION
    // ---------------------------------------------------------

    if (isHeading(trimmed)) {
      // Save previous section first
      saveChunk();

      // Set new section
      currentSection = trimmed;

      // Keep heading inside the chunk
      buffer.push(trimmed);

      wordCount = countWords(trimmed);

      continue;
    }

    // ---------------------------------------------------------
    // NORMAL CONTENT
    // ---------------------------------------------------------

    const lineWordCount = countWords(trimmed);

    // If adding this line makes the chunk too large,
    // save the current chunk first.
    if (wordCount > 0 && wordCount + lineWordCount > MAX_WORDS) {
      saveChunk();

      // Repeat section heading in the new chunk
      buffer.push(currentSection);

      wordCount = countWords(currentSection);
    }

    buffer.push(trimmed);

    wordCount += lineWordCount;
  }

  // Save final chunk
  saveChunk();

  return chunks;
}
