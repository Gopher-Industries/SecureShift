import { Ollama } from "ollama";

const OLLAMA_HOST =
  process.env.OLLAMA_HOST ||
  "http://host.docker.internal:11434";

const OLLAMA_MODEL =
  "llama3.2";

const ollama =
  new Ollama({
    host: OLLAMA_HOST,
  });

// =========================================================
// ASK OLLAMA
// =========================================================

export async function askOllama(
  question,
  chunks = [],
) {
  console.log(
    "\n========== ASKING OLLAMA ==========",
  );

  console.log(
    "Host:",
    OLLAMA_HOST,
  );

  console.log(
    "Model:",
    OLLAMA_MODEL,
  );

  console.log(
    "Question:",
    question,
  );

  console.log(
    "Chunks:",
    chunks.length,
  );

  try {
    let systemPrompt;
    let userPrompt;

    // =======================================================
    // DOCUMENTATION MODE
    // =======================================================

    if (chunks.length > 0) {
      const context =
        chunks
          .map(
            (chunk, index) => `
SOURCE ${index + 1}

Document:
${chunk.document}

Section:
${chunk.section}

Documentation:
${chunk.text}
`,
          )
          .join(
            "\n\n-----------------------------\n\n",
          );

      systemPrompt = `
You are SecureShift AI, the official AI assistant for the SecureShift workforce management platform.

Your task is to answer the user's question using the supplied SecureShift documentation.

IMPORTANT RULES:

1. The supplied documentation is the source of truth.

2. Answer the user's question directly.

3. Do NOT dump or reproduce the documentation.

4. Summarise the relevant information in simple English.

5. Use only information supported by the supplied documentation.

6. NEVER invent SecureShift-specific:
   - buttons
   - pages
   - URLs
   - API endpoints
   - commands
   - features
   - procedures
   - credentials

7. If the documentation contains a command, reproduce it accurately.

8. If the user asks for steps, provide numbered steps.

9. If multiple sources contain relevant information, combine them.

10. Ignore documentation that is unrelated to the question.

11. Do not mention SOURCE numbers unless the user asks about sources.

12. Do not copy large sections of the documentation.

13. Keep the response concise.

14. If the documentation genuinely does not contain enough information, say:

"Based on the available SecureShift documentation, I don't have enough information to give the complete answer."

15. Do not use general knowledge to invent missing SecureShift-specific information.

16. When the user asks "How do I build SecureShift?", interpret this as:

"How do I build and run the SecureShift project locally?"

17. For "How do I build SecureShift?", prioritise Docker setup, project root, docker compose commands, and verification steps from the documentation.

18. SecureShift is a legitimate workforce management software project.

DOCUMENTATION:

${context}
`;

      userPrompt = `
User question:

${question}

Give a direct and concise answer based only on the relevant SecureShift documentation.
`;
    }

    // =======================================================
    // GENERAL MODE
    // =======================================================

    else {
      systemPrompt = `
You are SecureShift AI.

No relevant SecureShift documentation was found for this question.

Answer briefly as a general software engineering assistant.

Do not claim that information is SecureShift-specific unless it is provided by the user.

Use simple English and Markdown.
`;

      userPrompt =
        question;
    }

    console.log(
      "System prompt length:",
      systemPrompt.length,
    );

    console.log(
      "User prompt length:",
      userPrompt.length,
    );

    console.log(
      "Sending request to Ollama...",
    );

    const startTime =
      Date.now();

    // =======================================================
    // CALL OLLAMA
    // =======================================================

    const response =
      await ollama.chat({
        model:
          OLLAMA_MODEL,

        messages: [
          {
            role: "system",
            content:
              systemPrompt,
          },

          {
            role: "user",
            content:
              userPrompt,
          },
        ],

        stream: false,

        options: {
          temperature: 0,

          // Slightly more room for procedural answers
          num_predict: 400,
        },
      });

    const responseTime =
      Date.now() -
      startTime;

    console.log(
      "✅ Ollama response received",
    );

    console.log(
      "Response time:",
      responseTime,
      "ms",
    );

    const answer =
      response?.message?.content?.trim();

    if (!answer) {
      throw new Error(
        "Ollama returned an empty response.",
      );
    }

    console.log(
      "Answer length:",
      answer.length,
    );

    console.log(
      "===================================\n",
    );

    return answer;
  } catch (error) {
    console.error(
      "\n========== OLLAMA ERROR ==========",
    );

    console.error(
      "Message:",
      error.message,
    );

    console.error(
      "Name:",
      error.name,
    );

    if (error.cause) {
      console.error(
        "Cause:",
        error.cause,
      );
    }

    console.error(
      "==================================\n",
    );

    throw new Error(
      `SecureShift AI error: ${error.message}`,
    );
  }
}