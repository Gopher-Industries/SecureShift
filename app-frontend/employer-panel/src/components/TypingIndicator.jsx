import React from "react";
import "./typing.css";

export default function TypingIndicator() {
  return (
    <div
      style={{
        display: "flex",
        gap: 6,
        padding: 12,
      }}
    >
      <span className="dot"></span>
      <span className="dot"></span>
      <span className="dot"></span>
    </div>
  );
}