import { Ollama } from "ollama";

const ollama = new Ollama({
  host:
    process.env.OLLAMA_HOST ||
    "http://host.docker.internal:11434",
});

export async function askOllama(question, chunks = []) {

  let systemPrompt;
  let userPrompt;

  // Documentation found
  if (chunks.length > 0) {

    const context = chunks
      .map(
        (chunk) => `
Document: ${chunk.document}
Section: ${chunk.section}

${chunk.text}
`
      )
      .join("\n\n=============================\n\n");

    systemPrompt = `
You are SecureShift AI, the official AI assistant for the SecureShift workforce management platform.

Your job is to answer questions accurately using the supplied documentation.

Rules:

1. The documentation below comes from the official SecureShift onboarding guide.

2. If the documentation contains the answer,
   answer from it.

3. If Docker commands exist,
   reproduce them exactly.

4. If a list of technologies exists,
   list every technology mentioned.

5. Explain the answer in simple English.

6. NEVER say the documentation does not contain information if it clearly appears in the supplied context.

7. Never interpret SecureShift as malware, hacking software, or anything malicious.

8. When someone asks
   "How do I build SecureShift?"
   they mean
   "How do I build and run the SecureShift project locally?"

9. If the documentation only partially answers,
   answer using the documentation first,
   then clearly say:

   "Additional explanation (general software engineering knowledge):"

   before adding any extra information.

Always answer in Markdown.
`;

    userPrompt = `
Documentation

${context}

Question

${question}
`;

  } else {

    systemPrompt = `
You are SecureShift AI.

No SecureShift documentation matched this question.

Answer as an experienced software engineering assistant.

Be concise.

Use Markdown.
`;

    userPrompt = question;
  }

  const response = await ollama.chat({
    model: "llama3.2",
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
  });

  return response.message.content;
}