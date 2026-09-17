import React, { useState, useEffect, useRef } from "react";

import ChatHeader from "./ChatHeader";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import SuggestionCards from "./SuggestionCards";
import http from "../lib/http";

const AI_TIMEOUT = 120000; // 120 seconds

// Inject keyframes once
const AnimationStyles = () => (
  <style>{`
    @keyframes ss-fab-pulse {
      0%   { box-shadow: 0 5px 15px rgba(0,0,0,.25), 0 0 0 0 rgba(37,99,235,.45); }
      70%  { box-shadow: 0 5px 15px rgba(0,0,0,.25), 0 0 0 14px rgba(37,99,235,0); }
      100% { box-shadow: 0 5px 15px rgba(0,0,0,.25), 0 0 0 0 rgba(37,99,235,0); }
    }
    @keyframes ss-window-in {
      0%   { opacity: 0; transform: translateY(24px) scale(0.92); }
      60%  { opacity: 1; transform: translateY(-4px) scale(1.01); }
      100% { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes ss-window-out {
      0%   { opacity: 1; transform: translateY(0) scale(1); }
      100% { opacity: 0; transform: translateY(16px) scale(0.94); }
    }
    @keyframes ss-icon-pop {
      0%   { transform: rotate(-90deg) scale(0.5); opacity: 0; }
      100% { transform: rotate(0deg) scale(1); opacity: 1; }
    }
    .ss-fab {
      transition: transform 0.2s ease, background 0.2s ease;
      animation: ss-fab-pulse 2.4s ease-out infinite;
    }
    .ss-fab:hover {
      transform: scale(1.08);
    }
    .ss-fab:active {
      transform: scale(0.94);
    }
    .ss-fab-icon {
      display: inline-block;
      animation: ss-icon-pop 0.25s ease;
    }
    .ss-window-open {
      animation: ss-window-in 0.32s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      transform-origin: bottom right;
    }
    .ss-window-closing {
      animation: ss-window-out 0.18s ease forwards;
      transform-origin: bottom right;
    }
  `}</style>
);

export default function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [rendered, setRendered] = useState(false); // stays true during exit animation
  const [closing, setClosing] = useState(false);
  const closeTimeoutRef = useRef(null);

  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "👋 Hello!\n\nI'm SecureShift AI.\n\nHow can I help you today?",
    },
  ]);

  useEffect(() => {
    if (open) {
      clearTimeout(closeTimeoutRef.current);
      setClosing(false);
      setRendered(true);
    } else if (rendered) {
      setClosing(true);
      closeTimeoutRef.current = setTimeout(() => {
        setRendered(false);
        setClosing(false);
      }, 180); // matches ss-window-out duration
    }
    return () => clearTimeout(closeTimeoutRef.current);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  async function sendMessage(customQuestion) {
    const rawQuestion =
      customQuestion !== undefined ? customQuestion : question;

    const currentQuestion =
      typeof rawQuestion === "string" ? rawQuestion.trim() : "";

    if (!currentQuestion || loading) return;

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: currentQuestion,
      },
    ]);

    setQuestion("");
    setLoading(true);

    const controller = new AbortController();

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, AI_TIMEOUT);

    try {
      console.log("Sending AI question:", currentQuestion);

      const response = await http.post(
        "/ai/chat",
        {
          question: currentQuestion,
        },
        {
          signal: controller.signal,
          timeout: AI_TIMEOUT,
        }
      );

      clearTimeout(timeoutId);

      console.log("AI response status:", response.status);

      const data = response.data;

      console.log("AI response:", data);

      if (!data.success) {
        throw new Error(
          data?.message || "SecureShift AI failed to generate a response."
        );
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer || "I couldn't generate an answer.",
          sources: Array.isArray(data.sources) ? data.sources : [],
          confidence:
            typeof data.confidence === "number" ? data.confidence : 0,
          mode: data.mode || "general",
        },
      ]);
    } catch (err) {
      clearTimeout(timeoutId);

      console.error("AI Chat Error:", err);

      let errorMessage =
        "Sorry, I couldn't connect to SecureShift AI. Please try again.";

      if (err.name === "AbortError") {
        errorMessage =
          "SecureShift AI is taking longer than expected. Please try again.";
      } else if (err.code === "ECONNABORTED") {
        errorMessage =
          "SecureShift AI is taking longer than expected. Please try again.";
      } else if (err.response?.status === 401) {
        errorMessage = "Your session has expired. Please log in again.";
      } else if (err.response?.status === 403) {
        errorMessage = "You do not have permission to use SecureShift AI.";
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        console.error("AI Error Message:", err.message);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: errorMessage,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <AnimationStyles />

      {/* Floating AI Button */}
      <button
        className="ss-fab"
        onClick={() => setOpen(!open)}
        aria-label={open ? "Close SecureShift AI" : "Open SecureShift AI"}
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
        }}
      >
        <span key={open ? "close" : "open"} className="ss-fab-icon">
          {open ? "✕" : "🤖"}
        </span>
      </button>

      {/* AI Chat Window */}
      {rendered && (
        <div
          className={closing ? "ss-window-closing" : "ss-window-open"}
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
          }}
        >
          <ChatHeader onClose={() => setOpen(false)} />

          <SuggestionCards onSuggestionClick={sendMessage} />

          <ChatMessages messages={messages} loading={loading} />

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