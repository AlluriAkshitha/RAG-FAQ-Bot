import React, { useState, useRef, useEffect } from "react";
import "./App.css";

type Message = {
  role: "user" | "bot";
  content: string;
};

function App() {
  const [url, setUrl] = useState("");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [loadingAnswer, setLoadingAnswer] = useState(false);
  const [status, setStatus] = useState<null | { type: "ok" | "err"; text: string }>(null);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const backendBase = "http://localhost:8000";

  // auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loadingAnswer]);

  const handleLoad = async () => {
    if (!url.trim()) return;
    setLoadingUrl(true);
    setStatus(null);
    try {
      const res = await fetch(`${backendBase}/ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) throw new Error("Failed to ingest");
      const data = await res.json();
      const msgText =
        typeof data.msg === "string" && data.msg.length > 0
          ? data.msg
          : `Loaded content from:\n${url}`;
      setMessages([
        {
          role: "bot",
          content: msgText,
        },
      ]);
      setStatus({
        type: "ok",
        text: `Content loaded from "${url.replace(/https?:\/\//, "")}"`,
      });
    } catch (err: any) {
      setMessages([
        {
          role: "bot",
          content: "Error loading URL. Please check the link and try again.",
        },
      ]);
      setStatus({
        type: "err",
        text:
          err?.message ??
          "Could not fetch the URL. Check the link and try again.",
      });
    } finally {
      setLoadingUrl(false);
    }
  };

  const handleAsk = async () => {
    if (!question.trim()) return;
    const userMsg: Message = { role: "user", content: question };
    setMessages((prev) => [...prev, userMsg]);
    setQuestion("");
    setLoadingAnswer(true);
    try {
      const res = await fetch(`${backendBase}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userMsg.content }),
      });
      if (!res.ok) throw new Error("Failed to get answer");
      const data = await res.json();
      const botMsg: Message = {
        role: "bot",
        content:
          typeof data.answer === "string" && data.answer.length > 0
            ? data.answer
            : "I could not generate an answer from the loaded content.",
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          content:
            "Sorry, something went wrong while answering. Please try again.",
        },
      ]);
    } finally {
      setLoadingAnswer(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleAsk();
    }
  };

  const samples = [
    "Summarize the main idea of this page.",
    "Explain the example code in simple terms.",
    "What are the key steps described here?",
  ];

  return (
    <div className="app-root">
      <div className="app-shell">
        <header className="app-header">
          <div className="header-badge">
            <span className="badge-dot" />
            RAG-Powered
          </div>
          <div>
            <h1>RAG FAQ Tutor</h1>
            <p>
              Paste a tutorial or article URL, load it once, then quiz yourself
              with focused questions grounded in that page.
            </p>
          </div>
        </header>

        <section className="url-section">
          <label className="field-label">Source URL</label>
          <div className="url-row">
            <input
              type="text"
              className="url-input"
              placeholder="https://docs.example.com/getting-started"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLoad()}
            />
            <button
              className="primary-btn"
              onClick={handleLoad}
              disabled={loadingUrl || !url.trim()}
            >
              {loadingUrl ? "Loading…" : "Load"}
            </button>
          </div>
          <p className="hint">
            The bot will answer only from the loaded page’s content.
          </p>
        </section>

        {status && (
          <div
            className={`status-banner ${
              status.type === "ok" ? "status-ok" : "status-err"
            }`}
          >
            <span className="status-icon">
              {status.type === "ok" ? "✓" : "!"}
            </span>
            <span>{status.text}</span>
          </div>
        )}

        <section className="chat-section">
          <label className="field-label">Conversation</label>
          <div className="chat-window">
            {messages.length === 0 && !loadingAnswer && (
              <div className="chat-placeholder">
                <h3>No questions yet</h3>
                <p>
                  Load a URL above, then ask a question below. Try one of these:
                </p>
                <div className="sample-chips">
                  {samples.map((s) => (
                    <button
                      key={s}
                      className="chip"
                      onClick={() => setQuestion(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, idx) => (
              <div
                key={idx}
                className={
                  m.role === "user"
                    ? "message-row message-user"
                    : "message-row message-bot"
                }
              >
                <div className="avatar">
                  {m.role === "user" ? "You" : "Bot"}
                </div>
                <div className="bubble">
                  {m.content.split("\n").map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </div>
            ))}

            {loadingAnswer && (
              <div className="message-row message-bot">
                <div className="avatar">Bot</div>
                <div className="bubble bubble-typing">
                  <span className="thinking-dot" />
                  <span className="thinking-dot" />
                  <span className="thinking-dot" />
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          <div className="input-panel">
            <label className="field-label">Your question</label>
            <div className="input-row">
              <textarea
                rows={2}
                placeholder="Ask something about the loaded page… (Ctrl+Enter to send)"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                className="primary-btn"
                onClick={handleAsk}
                disabled={loadingAnswer || !question.trim()}
              >
                {loadingAnswer ? "Asking…" : "Ask"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;
