import React from "react";

const suggestions = [
  "How do I build SecureShift?",
  "What technologies does SecureShift use?",
  "How do I create a shift?",
  "Show Docker commands",
];

export default function SuggestionCards({
  onSuggestionClick,
}) {
  return (
    <div
      style={{
        padding: "15px",
        display: "flex",
        flexWrap: "wrap",
        gap: "10px",
      }}
    >
      {suggestions.map((item) => (
        <button
          key={item}
          onClick={() => onSuggestionClick(item)}
          style={{
            padding: "10px 15px",
            borderRadius: "20px",
            border: "1px solid #2563eb",
            background: "#fff",
            color: "#2563eb",
            cursor: "pointer",
            fontSize: "13px",
          }}
        >
          {item}
        </button>
      ))}
    </div>
  );
}