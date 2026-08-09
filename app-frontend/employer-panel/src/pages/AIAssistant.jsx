import { useState } from "react";
import http from "../lib/http";

export default function AIAssistant() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  async function askAI() {
    if (!question.trim() || loading) return;

    setLoading(true);
    setAnswer("");

    try {
      const response = await http.post("/ai/chat", {
        question: question.trim(),
      });

      const data = response.data;

      if (!data.success) {
        throw new Error(
          data.message || "SecureShift AI failed to generate a response."
        );
      }

      setAnswer(data.answer || "I couldn't generate an answer.");
    } catch (err) {
      console.error("AI Error:", err);

      if (err.response?.status === 401) {
        setAnswer("Your session has expired. Please log in again.");
      } else if (err.response?.status === 403) {
        setAnswer("You do not have permission to use SecureShift AI.");
      } else if (err.response?.data?.message) {
        setAnswer(err.response.data.message);
      } else {
        setAnswer("Unable to contact SecureShift AI.");
      }
    } finally {
      setLoading(false);
    }
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
        disabled={loading}
      />

      <br />
      <br />

      <button
        onClick={askAI}
        disabled={loading || !question.trim()}
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
          minHeight: "120px",
          whiteSpace: "pre-wrap",
        }}
      >
        {answer}
      </div>
    </div>
  );
}