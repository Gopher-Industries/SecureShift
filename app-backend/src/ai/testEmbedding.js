import { createEmbedding } from "./embeddings/embeddingService.js";

async function test() {
  const embedding = await createEmbedding("Docker Setup");

  console.log("Embedding length:", embedding.length);
  console.log("First 10 values:");
  console.log(embedding.slice(0, 10));
}

test();
