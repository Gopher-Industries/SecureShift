import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { splitIntoChunks } from "../chunking/textChunker.js";
import { createEmbedding } from "../embeddings/embeddingService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const docsFolder = path.join(
  __dirname,
  "../../../knowledge-base/docs",
);

const vectorsFolder = path.join(
  __dirname,
  "../../../knowledge-base/vectors",
);

// =========================================================
// CREATE VECTOR DIRECTORY
// =========================================================

if (!fs.existsSync(vectorsFolder)) {
  fs.mkdirSync(vectorsFolder, {
    recursive: true,
  });
}

// =========================================================
// GET TXT DOCUMENTS
// =========================================================

function getTextFiles() {
  if (!fs.existsSync(docsFolder)) {
    console.error(
      `Knowledge-base folder does not exist: ${docsFolder}`,
    );

    return [];
  }

  return fs
    .readdirSync(docsFolder)
    .filter((file) =>
      file.toLowerCase().endsWith(".txt"),
    );
}

// =========================================================
// PROCESS DOCUMENT
// =========================================================

async function processDocument(fileName) {
  const filePath = path.join(
    docsFolder,
    fileName,
  );

  console.log(
    `\n========================================`,
  );

  console.log(
    `Processing: ${fileName}`,
  );

  console.log(
    `========================================`,
  );

  const text = fs.readFileSync(
    filePath,
    "utf8",
  );

  if (!text.trim()) {
    console.warn(
      `⚠️ Empty document: ${fileName}`,
    );

    return;
  }

  console.log(
    `Text length: ${text.length}`,
  );

  // ---------------------------------------------------------
  // CHUNK DOCUMENT
  // ---------------------------------------------------------

  const chunks =
    splitIntoChunks(text);

  console.log(
    `📦 Found ${chunks.length} chunks`,
  );

  // ---------------------------------------------------------
  // DEBUG CHUNKS
  // ---------------------------------------------------------

  chunks.forEach(
    (chunk, index) => {
      console.log(
        `\n--- Chunk ${index + 1} ---`,
      );

      console.log(
        "Section:",
        chunk.section,
      );

      console.log(
        "Text:",
        chunk.text.substring(
          0,
          500,
        ),
      );
    },
  );

  // ---------------------------------------------------------
  // CREATE EMBEDDINGS
  // ---------------------------------------------------------

  const vectors = [];

  for (
    let i = 0;
    i < chunks.length;
    i++
  ) {
    const chunk =
      chunks[i];

    console.log(
      `Embedding ${fileName} (${i + 1}/${chunks.length})`,
    );

    const embedding =
      await createEmbedding(
        chunk.text,
      );

    vectors.push({
      id: `${fileName}-${i}`,
      document: fileName,
      section: chunk.section,
      text: chunk.text,
      embedding,
    });
  }

  // ---------------------------------------------------------
  // SAVE VECTOR FILE
  // ---------------------------------------------------------

  const outputFile =
    path.join(
      vectorsFolder,
      fileName.replace(
        /\.txt$/i,
        ".json",
      ),
    );

  fs.writeFileSync(
    outputFile,
    JSON.stringify(
      vectors,
      null,
      2,
    ),
  );

  console.log(
    `✅ Saved ${outputFile}`,
  );
}

// =========================================================
// BUILD INDEX
// =========================================================

async function buildIndex() {
  console.log(
    "\n========================================",
  );

  console.log(
    "🚀 SecureShift RAG Index Builder",
  );

  console.log(
    "========================================\n",
  );

  const files =
    getTextFiles();

  console.log(
    `Documents found: ${files.length}`,
  );

  files.forEach(
    (file) => {
      console.log(
        ` - ${file}`,
      );
    },
  );

  if (files.length === 0) {
    console.warn(
      "⚠️ No TXT documentation files found.",
    );

    return;
  }

  // ---------------------------------------------------------
  // Process documents
  // ---------------------------------------------------------

  for (const file of files) {
    await processDocument(file);
  }

  console.log(
    "\n========================================",
  );

  console.log(
    "✅ All documents indexed successfully.",
  );

  console.log(
    "========================================\n",
  );
}

// =========================================================
// START
// =========================================================

buildIndex().catch(
  (error) => {
    console.error(
      "\n========================================",
    );

    console.error(
      "❌ INDEXING FAILED",
    );

    console.error(
      "Message:",
      error.message,
    );

    console.error(
      error.stack,
    );

    console.error(
      "========================================\n",
    );

    process.exit(1);
  },
);