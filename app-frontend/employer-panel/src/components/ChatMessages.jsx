import React, { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";

export default function ChatMessages({
  messages,
  loading,
}) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        padding: 15,
        background: "#f3f4f6",
      }}
    >
      {messages.map((message, index) => (
        <MessageBubble
          key={index}
          role={message.role}
          content={message.content}
        />
      ))}

      {loading && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 15,
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: "#2563eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            🤖
          </div>

          <div
            style={{
              background: "#fff",
              padding: "12px 16px",
              borderRadius: "18px 18px 18px 4px",
              color: "#6b7280",
            }}
          >
            SecureShift AI is thinking...
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}