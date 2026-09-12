import React from "react";

export default function ChatHeader({ onClose }) {
  return (
    <div
      style={{
        background: "#2563eb",
        color: "white",
        padding: "16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div>
        <div style={{ fontWeight: "bold", fontSize: "18px" }}>
          🤖 SecureShift AI
        </div>

        <div
          style={{
            fontSize: "12px",
            opacity: 0.8,
            marginTop: 2,
          }}
        >
          Online
        </div>
      </div>

      <button
        onClick={onClose}
        style={{
          background: "transparent",
          border: "none",
          color: "white",
          cursor: "pointer",
          fontSize: "20px",
        }}
      >
        ✕
      </button>
    </div>
  );
}