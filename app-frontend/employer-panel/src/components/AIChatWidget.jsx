import React, { useState } from "react";

import ChatHeader from "./ChatHeader";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import SuggestionCards from "./SuggestionCards";
import http from "../lib/http";

const AI_TIMEOUT = 120000; // 120 seconds

export default function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "👋 Hello!\n\nI'm SecureShift AI.\n\nHow can I help you today?",
    },
  ]);

  async function sendMessage(customQuestion) {
    const currentQuestion = (
      customQuestion !== undefined ? customQuestion : question
    ).trim();

    if (!currentQuestion || loading) return;

    // Add user message immediately
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

    // Abort request after 120 seconds
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
          content:
            data.answer || "I couldn't generate an answer.",

          sources: Array.isArray(data.sources)
            ? data.sources
            : [],

          confidence:
            typeof data.confidence === "number"
              ? data.confidence
              : 0,

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
        errorMessage =
          "Your session has expired. Please log in again.";
      } else if (err.response?.status === 403) {
        errorMessage =
          "You do not have permission to use SecureShift AI.";
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
      {/* Floating AI Button */}
      <button
        onClick={() => setOpen(!open)}
        aria-label={
          open ? "Close SecureShift AI" : "Open SecureShift AI"
        }
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
        }}
      >
        {open ? "✕" : "🤖"}
      </button>

      {/* AI Chat Window */}
      {open && (
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