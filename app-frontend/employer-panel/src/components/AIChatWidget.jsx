import React, { useState, useEffect } from "react";

import ChatHeader from "./ChatHeader";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import SuggestionCards from "./SuggestionCards";

export default function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [rendered, setRendered] = useState(false); // controls mount/unmount for exit animation
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [buttonPop, setButtonPop] = useState(false);

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "👋 Hello!\n\nI'm SecureShift AI.\n\nHow can I help you today?",
    },
  ]);

  // Handle mount/unmount so the closing animation can play before removal
  useEffect(() => {
    if (open) {
      setRendered(true);
    } else if (rendered) {
      const timeout = setTimeout(() => setRendered(false), 220); // match CSS duration
      return () => clearTimeout(timeout);
    }
  }, [open]);

  function toggleOpen() {
    setButtonPop(true);
    setTimeout(() => setButtonPop(false), 250);
    setOpen((prev) => !prev);
  }

  async function sendMessage(customQuestion) {
    const currentQuestion = customQuestion || question;

    if (!currentQuestion.trim() || loading) return;

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: currentQuestion,
      },
    ]);

    setQuestion("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/v1/ai/chat",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question: currentQuestion,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("AI request failed");
      }

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            data.answer || "I couldn't generate an answer.",
          sources: data.sources || [],
          confidence: data.confidence || 0,
          mode: data.mode || "general",
        },
      ]);
    } catch (err) {
      console.error("AI Chat Error:", err);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I couldn't connect to SecureShift AI. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Keyframes + small helper classes, scoped via unique names */}
      <style>{`
        @keyframes sswidget-panel-in {
          0% {
            opacity: 0;
            transform: translateY(24px) scale(0.96);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes sswidget-panel-out {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(16px) scale(0.97);
          }
        }
        @keyframes sswidget-pop {
          0% { transform: scale(1); }
          40% { transform: scale(0.85); }
          70% { transform: scale(1.08); }
          100% { transform: scale(1); }
        }
        @keyframes sswidget-pulse {
          0%, 100% { box-shadow: 0 5px 15px rgba(0,0,0,.25), 0 0 0 0 rgba(37,99,235,0.5); }
          50% { box-shadow: 0 5px 15px rgba(0,0,0,.25), 0 0 0 10px rgba(37,99,235,0); }
        }
        .sswidget-fab {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .sswidget-fab:hover {
          transform: scale(1.08);
        }
        .sswidget-fab:active {
          transform: scale(0.94);
        }
      `}</style>

      {/* Floating AI Button */}
      <button
        onClick={toggleOpen}
        aria-label={open ? "Close SecureShift AI" : "Open SecureShift AI"}
        className="sswidget-fab"
        style={{
          position: "fixed",
          bottom: 25,
          right: 25,
          width: 60,
          height: 60,
          borderRadius: "50%",
          border: "none",
          background: "#2563eb",
          color: "white",
          fontSize: "26px",
          cursor: "pointer",
          zIndex: 9999,
          boxShadow: "0 5px 15px rgba(0,0,0,.25)",
          animation: buttonPop
            ? "sswidget-pop 0.25s ease"
            : !open
            ? "sswidget-pulse 2.4s ease-in-out infinite"
            : "none",
        }}
      >
        <span
          style={{
            display: "inline-block",
            transition: "transform 0.25s ease",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          {open ? "✕" : "🤖"}
        </span>
      </button>

      {/* AI Chat Window */}
      {rendered && (
        <div
          style={{
            position: "fixed",
            bottom: 95,
            right: 20,

            width: "min(400px, calc(100vw - 40px))",
            height: "min(650px, calc(100vh - 120px))",

            maxWidth: "400px",
            maxHeight: "650px",
            minHeight: "400px",

            background: "white",
            borderRadius: "15px",

            display: "flex",
            flexDirection: "column",

            overflow: "hidden",

            boxShadow: "0 10px 30px rgba(0,0,0,.25)",

            zIndex: 9999,

            transformOrigin: "bottom right",
            animation: open
              ? "sswidget-panel-in 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards"
              : "sswidget-panel-out 0.2s ease forwards",
          }}
        >
          <ChatHeader onClose={() => setOpen(false)} />

          <SuggestionCards
            onSuggestionClick={sendMessage}
          />

          <ChatMessages
            messages={messages}
            loading={loading}
          />

          <ChatInput
            question={question}
            setQuestion={setQuestion}
            sendMessage={sendMessage}
            loading={loading}
          />
        </div>
      )}
    </>
  );
}