import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { splitIntoChunks } from "../chunking/textChunker.js";
import { createEmbedding } from "../embeddings/embeddingService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const docsFolder = path.join(
  __dirname,
  "../../../knowledge-base/docs"
);

const vectorsFolder = path.join(
  __dirname,
  "../../../knowledge-base/vectors"
);

// Create vectors folder if it doesn't exist
if (!fs.existsSync(vectorsFolder)) {
  fs.mkdirSync(vectorsFolder, { recursive: true });
}

async function buildIndex() {
  const files = fs.readdirSync(docsFolder);

  console.log("Documents found:", files);

  for (const file of files) {
    if (!file.endsWith(".txt")) continue;

    console.log(`\nProcessing ${file}`);

    const text = fs.readFileSync(
      path.join(docsFolder, file),
      "utf8"
    );

    // Split document into sections/chunks
    const chunks = splitIntoChunks(text);

    console.log(`Found ${chunks.length} chunks`);

    // ==========================================
    // DEBUG: Show generated chunks
    // ==========================================
    console.log("\n========== CHUNKS ==========");

    chunks.forEach((chunk, index) => {
      console.log(`\n--- Chunk ${index + 1} ---`);
      console.log("Section:", chunk.section);
      console.log("Text:", chunk.text);
    });

    console.log("\n============================\n");

    const vectors = [];

    for (let i = 0; i < chunks.length; i++) {
      console.log(
        `Embedding ${file} (${i + 1}/${chunks.length})`
      );

      const embedding = await createEmbedding(
        chunks[i].text
      );

      vectors.push({
        id: i,
        document: file,
        section: chunks[i].section,
        text: chunks[i].text,
        embedding,
      });
    }

    const outputFile = path.join(
      vectorsFolder,
      file.replace(".txt", ".json")
    );

    fs.writeFileSync(
      outputFile,
      JSON.stringify(vectors, null, 2)
    );

    console.log(`Saved ${outputFile}`);
  }

  console.log("\n✅ All documents indexed.");
}

buildIndex();