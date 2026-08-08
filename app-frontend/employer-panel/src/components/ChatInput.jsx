import React from "react";

export default function ChatInput({
  question,
  setQuestion,
  sendMessage,
  loading,
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: "10px",
        padding: "15px",
        borderTop: "1px solid #ddd",
        background: "#ffffff",
      }}
    >
      <input
        type="text"
        value={question}
        disabled={loading}
        onChange={(e) => setQuestion(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
          }
        }}
        placeholder={
          loading
            ? "SecureShift AI is thinking..."
            : "Ask SecureShift AI..."
        }
        style={{
          flex: 1,
          minWidth: 0,
          padding: "12px",
          borderRadius: "10px",
          border: "1px solid #ccc",
          outline: "none",
          fontSize: "14px",
        }}
      />

      <button
        onClick={sendMessage}
        disabled={loading || !question.trim()}
        style={{
          background:
            loading || !question.trim()
              ? "#9ca3af"
              : "#2563eb",
          color: "#fff",
          border: "none",
          padding: "0 20px",
          borderRadius: "10px",
          cursor:
            loading || !question.trim()
              ? "not-allowed"
              : "pointer",
        }}
      >
        {loading ? "..." : "Send"}
      </button>
    </div>
  );
}