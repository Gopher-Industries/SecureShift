import { useState } from "react";

export default function AIAssistant() {

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

 async function askAI() {
  if (!question.trim()) return;

  setLoading(true);

  console.log("Sending question:", question);

  try {
    const response = await fetch(
      "http://localhost:5000/api/v1/ai/chat",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
        }),
      }
    );

    console.log("HTTP Status:", response.status);

    const data = await response.json();

    console.log("Response:", data);

    if (data.success) {
      setAnswer(data.answer);
    } else {
      setAnswer(data.message || "Unknown error");
    }
  } catch (err) {
    console.error("Fetch Error:", err);
    setAnswer("Unable to contact AI.");
  }

  setLoading(false);
}

  return (

    <div style={{ padding: "30px" }}>

      <h1>SecureShift AI Assistant</h1>

      <textarea
        rows={5}
        cols={60}
        placeholder="Ask a question..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />

      <br />
      <br />

      <button
        onClick={askAI}
        disabled={loading}
      >
        {loading ? "Thinking..." : "Ask AI"}
      </button>

      <br />
      <br />

      <h3>Answer</h3>

      <div
        style={{
          border: "1px solid #ddd",
          padding: "15px",
          minHeight: "120px"
        }}
      >
        {answer}
      </div>

    </div>

  );

}