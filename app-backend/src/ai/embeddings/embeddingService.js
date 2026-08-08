import { Ollama } from "ollama";

const host =
  process.env.OLLAMA_HOST ||
  (process.env.NODE_ENV === "development"
    ? "http://localhost:11434"
    : "http://host.docker.internal:11434");

const ollama = new Ollama({
  host,
});

export async function createEmbedding(text) {
  const response = await ollama.embed({
    model: "nomic-embed-text:latest",
    input: text,
  });

  return response.embeddings[0];
}
