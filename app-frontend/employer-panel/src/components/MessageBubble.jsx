import React from "react";
import ReactMarkdown from "react-markdown";

export default function MessageBubble({ role, content }) {
  const isUser = role === "user";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: 18,
        alignItems: "flex-end",
        gap: 10,
      }}
    >
      {!isUser && (
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            background: "#2563eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: 20,
            flexShrink: 0,
          }}
        >
          🤖
        </div>
      )}

      <div
        style={{
          maxWidth: "75%",
          padding: "14px 18px",
          borderRadius: isUser
            ? "18px 18px 4px 18px"
            : "18px 18px 18px 4px",
          background: isUser ? "#2563eb" : "#ffffff",
          color: isUser ? "#ffffff" : "#111827",
          boxShadow: "0 2px 8px rgba(0,0,0,.08)",
          lineHeight: 1.6,
          fontSize: "14px",
          overflowWrap: "anywhere",
        }}
      >
        {isUser ? (
          content
        ) : (
          <ReactMarkdown
            components={{
              p: ({ children }) => (
                <p style={{ margin: "0 0 10px 0" }}>{children}</p>
              ),
              ul: ({ children }) => (
                <ul style={{ paddingLeft: 20, marginTop: 5 }}>
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol style={{ paddingLeft: 20, marginTop: 5 }}>
                  {children}
                </ol>
              ),
              li: ({ children }) => (
                <li style={{ marginBottom: 4 }}>{children}</li>
              ),
              h3: ({ children }) => (
                <h3 style={{ margin: "10px 0 6px" }}>{children}</h3>
              ),
              code: ({ children }) => (
                <code
                  style={{
                    background: "#f3f4f6",
                    padding: "2px 5px",
                    borderRadius: 4,
                  }}
                >
                  {children}
                </code>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        )}
      </div>

      {isUser && (
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            background: "#10b981",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: 18,
            flexShrink: 0,
          }}
        >
          👤
        </div>
      )}
    </div>
  );
}