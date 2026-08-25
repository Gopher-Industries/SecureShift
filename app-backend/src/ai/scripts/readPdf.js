import fs from "fs";
import { PDFParse } from "pdf-parse";
import path from "path";
import { fileURLToPath } from "url";
import { splitIntoChunks } from "../chunking/textChunker.js";

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// PDFs to process
const pdfFiles = [
  "Onboarding.pdf",
  "Backend_Onboarding_v1.1.pdf",
];

async function readPDF(fileName) {
  try {
    const pdfPath = path.join(
      __dirname,
      "../../../knowledge-base/guide",
      fileName,
    );

    console.log("📄 Reading:", pdfPath);

    const dataBuffer = fs.readFileSync(pdfPath);

    const parser = new PDFParse({ data: dataBuffer });
    const result = await parser.getText();
    const text = result.text;


console.log(`\n========== ${fileName} ==========\n`);
console.log(text);
console.log("\n==============================\n");

// Split PDF text into chunks
const chunks = splitIntoChunks(text);

console.log(`📦 ${fileName}: ${chunks.length} chunks created`);

chunks.forEach((chunk, index) => {
  console.log(`\n--- Chunk ${index + 1} ---`);
  console.log("Section:", chunk.section);
  console.log("Text:", chunk.text);
});

return chunks;

    return text;
  } catch (error) {
    console.error(`❌ Error reading ${fileName}:`);
    console.error(error);
    return "";
  }
}

async function readAllPDFs() {
  for (const fileName of pdfFiles) {
    await readPDF(fileName);
  }
}

readAllPDFs();