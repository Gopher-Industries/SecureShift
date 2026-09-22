import React from "react";

export default function FloatingButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: "fixed",
        bottom: "25px",
        right: "25px",
        width: "65px",
        height: "65px",
        borderRadius: "50%",
        border: "none",
        background: "#2563eb",
        color: "#fff",
        fontSize: "30px",
        cursor: "pointer",
        boxShadow: "0 5px 15px rgba(0,0,0,.3)",
        zIndex: 9999,
      }}
    >
      🤖
    </button>
  );
}