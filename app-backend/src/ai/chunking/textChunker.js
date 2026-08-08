export function splitIntoChunks(text) {
  const lines = text.split("\n");

  const chunks = [];
  console.log("\n========== CHUNKS ==========");

  chunks.forEach((chunk, index) => {
    console.log(`\n--- Chunk ${index + 1} ---`);
    console.log("Section:", chunk.section);
    console.log("Text:", chunk.text);
  });

  console.log("============================\n");

  let currentSection = "General";

  let buffer = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) continue;

    const isHeading =
      trimmed.startsWith("#") ||
      /^[0-9]+\./.test(trimmed) ||
      trimmed.endsWith(":");

    if (isHeading) {
      // Save previous chunk
      if (buffer.length > 0) {
        chunks.push({
          section: currentSection,
          text: buffer.join("\n"),
        });
      }

      currentSection = trimmed;

      // IMPORTANT:
      // Start the new chunk WITH the heading
      buffer = [trimmed];
    } else {
      buffer.push(trimmed);
    }
  }

  if (buffer.length > 0) {
    chunks.push({
      section: currentSection,
      text: buffer.join("\n"),
    });
  }

  return chunks;
}
