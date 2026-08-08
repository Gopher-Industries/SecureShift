import fs from "fs";
import pdf from "pdf-parse";
import path from "path";
import { fileURLToPath } from "url";

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the PDF
const pdfPath = path.join(
  __dirname,
  "../../../knowledge-base/guides/Onboarding.pdf"
);

async function readPDF() {
  try {
    console.log("📄 Reading:", pdfPath);

    const dataBuffer = fs.readFileSync(pdfPath);

    const data = await pdf(dataBuffer);

    console.log("\n========== PDF TEXT ==========\n");
    console.log(data.text);
    console.log("\n==============================\n");

  } catch (error) {
    console.error("❌ Error reading PDF:");
    console.error(error);
  }
}

readPDF();