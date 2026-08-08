import { semanticSearch } from "../retrieval/vectorSearch.js";

/**
 * Search the SecureShift knowledge base.
 *
 * Uses the vector-based semantic search system.
 *
 * The search combines:
 * - Semantic similarity
 * - Keyword matching
 * - Technology/section matching
 *
 * @param {string} question - User's question
 * @param {number} topK - Number of results to return
 * @returns {Promise<Object>} Search results and confidence score
 */
export async function searchKnowledge(question, topK = 5) {
  if (!question || typeof question !== "string") {
    return {
      results: [],
      bestScore: 0,
    };
  }

  const searchResult = await semanticSearch(question, topK);

  return {
    results: searchResult.results,
    bestScore: searchResult.bestScore,
  };
}
