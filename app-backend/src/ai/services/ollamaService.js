import { Ollama } from "ollama";

const OLLAMA_HOST =
  process.env.OLLAMA_HOST || "http://host.docker.internal:11434";

const OLLAMA_MODEL = "llama3.2";

const ollama = new Ollama({
  host: OLLAMA_HOST,
});

export async function askOllama(question, chunks = []) {
  console.log("\n========== ASKING OLLAMA ==========");
  console.log("Host:", OLLAMA_HOST);
  console.log("Model:", OLLAMA_MODEL);
  console.log("Question:", question);
  console.log("Chunks:", chunks.length);

  try {
    let systemPrompt;
    let userPrompt;

    // =========================================================
    // DOCUMENTATION MODE
    // =========================================================

    if (chunks.length > 0) {
      const context = chunks
        .map(
          (chunk, index) => `
SOURCE ${index + 1}
Document: ${chunk.document}
Section: ${chunk.section}
Score: ${chunk.score}

${chunk.text}
`,
        )
        .join("\n\n=============================\n\n");

      systemPrompt = `
You are SecureShift AI, the official AI assistant for the SecureShift workforce management platform.

Your job is to answer the user's question using ONLY the supplied SecureShift documentation.

IMPORTANT RULES:

1. The supplied documentation is the source of truth.

2. NEVER invent information that is not present in the documentation.

3. NEVER create imaginary buttons, pages, URLs, API endpoints, commands, technologies, steps, or features.

4. If the documentation gives a Docker command, reproduce the command exactly as written.

5. If the question asks for Docker commands, ONLY show Docker commands that appear in the supplied documentation.

6. If the documentation only partially answers the question, explain only what the documentation supports.

7. If the documentation does not provide enough information to answer the question, say:
"Based on the available SecureShift documentation, I don't have enough information to give the complete answer."

8. Do not use general knowledge to invent missing SecureShift-specific instructions.

9. Answer in simple English.

10. Use Markdown.

11. Keep the answer concise and directly answer the question.

12. SecureShift is a workforce management platform. Do not interpret it as malware or malicious software.

13. When the user asks "How do I build SecureShift?", interpret this as:
"How do I build and run the SecureShift project locally?"

DOCUMENTATION:
${context}
`;

      userPrompt = `
Question:
${question}

Answer the question using only the documentation above.
`;
    } else {
      // =========================================================
      // GENERAL MODE
      // =========================================================

      systemPrompt = `
You are SecureShift AI.

No relevant SecureShift documentation was found for this question.

Answer briefly as a general software engineering assistant.

Do not claim that information is specific to SecureShift unless it is known from the question.

Use Markdown.
`;

      userPrompt = question;
    }

    console.log("System prompt length:", systemPrompt.length);
    console.log("User prompt length:", userPrompt.length);
    console.log("Sending request to Ollama...");

    const startTime = Date.now();

    const response = await ollama.chat({
      model: OLLAMA_MODEL,

      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],

      stream: false,

      options: {
        temperature: 0.1,
        num_predict: 300,
      },
    });

    const responseTime = Date.now() - startTime;

    console.log("✅ Ollama response received");
    console.log("Response time:", responseTime, "ms");

    const answer = response?.message?.content?.trim();

    if (!answer) {
      throw new Error("Ollama returned an empty response.");
    }

    console.log("Answer length:", answer.length);
    console.log("===================================\n");

    return answer;
  } catch (error) {
    console.error("\n========== OLLAMA ERROR ==========");
    console.error("Message:", error.message);
    console.error("Name:", error.name);

    if (error.cause) {
      console.error("Cause:", error.cause);
    }

    console.error("==================================\n");

    throw new Error(`SecureShift AI error: ${error.message}`);
  }
}