"use client";

import { Send, Sparkles, Bot, User, Briefcase, FileText, Calendar, Search, ArrowRight } from "lucide-react";
import styles from "./page.module.css";
import { useEffect, useRef, useState } from "react";

const SUGGESTIONS = [
  {
    icon: "calendar",
    color: "purple",
    title: "Leave Balance",
    desc: "Check PTO for any employee",
    prompt: "What is the leave balance for employee ID 101?"
  },
  {
    icon: "search",
    color: "pink",
    title: "HR Policies",
    desc: "Search the employee handbook",
    prompt: "How do I apply for leave?"
  },
  {
    icon: "briefcase",
    color: "blue",
    title: "Job Posting",
    desc: "Create a new requisition",
    prompt: "Create a job posting for a Senior Engineer in the Engineering department with salary range 80k-120k"
  }
];

export default function Chat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim() || isLoading) return;

    const userMessage = {
      id: "msg-" + Date.now(),
      role: "user",
      content: text.trim()
    };

    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: currentMessages.map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      if (!res.ok) throw new Error("Server error");
      const data = await res.json();

      setMessages(prev => [...prev, {
        id: "msg-" + Date.now() + "-ai",
        role: "assistant",
        content: data.text,
        toolsUsed: data.toolsUsed || []
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: "msg-" + Date.now() + "-err",
        role: "assistant",
        content: "Sorry, something went wrong. Please try again."
      }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const getToolIcon = (name) => {
    switch (name) {
      case "searchPolicies": return <Search size={12} />;
      case "getLeaveBalance": return <Calendar size={12} />;
      case "createJobPosting": return <Briefcase size={12} />;
      default: return <Sparkles size={12} />;
    }
  };

  const getToolColor = (name) => {
    switch (name) {
      case "searchPolicies": return "search";
      case "getLeaveBalance": return "balance";
      case "createJobPosting": return "job";
      default: return "search";
    }
  };

  const getToolLabel = (name) => {
    switch (name) {
      case "searchPolicies": return "Searched HR policies";
      case "getLeaveBalance": return "Checked leave database";
      case "createJobPosting": return "Created job requisition";
      default: return "Used tool";
    }
  };

  return (
    <main className={styles.main}>
      {/* ─── HEADER ─── */}
      <header className={styles.header}>
        <div className={styles.headerIcon}>
          <Sparkles size={22} color="white" />
        </div>
        <div className={styles.titleContainer}>
          <h1>Nrolled HR Assistant</h1>
          <p>AI-powered employee support</p>
        </div>
        <div className={styles.statusBadge}>
          <div className={styles.statusDot}></div>
          Online
        </div>
      </header>

      {/* ─── CHAT AREA ─── */}
      <div className={styles.chatContainer}>
        {messages.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <Bot size={36} color="white" />
            </div>
            <h2 className={styles.emptyTitle}>How can I help you?</h2>
            <p className={styles.emptySubtitle}>
              I can search policies, check leave balances, and create job postings for you.
            </p>
            <div className={styles.suggestionsGrid}>
              {SUGGESTIONS.map((s, i) => (
                <div
                  key={i}
                  className={styles.suggestionCard}
                  onClick={() => sendMessage(s.prompt)}
                >
                  <div className={`${styles.suggestionCardIcon} ${styles[s.color]}`}>
                    {s.icon === "calendar" && <Calendar size={16} />}
                    {s.icon === "search" && <Search size={16} />}
                    {s.icon === "briefcase" && <Briefcase size={16} />}
                  </div>
                  <div className={styles.suggestionCardTitle}>{s.title}</div>
                  <div className={styles.suggestionCardDesc}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((m) => (
              <div
                key={m.id}
                className={`${styles.messageWrapper} ${
                  m.role === "user" ? styles.messageUser : styles.messageAssistant
                }`}
              >
                {m.role === "assistant" && (
                  <div className={styles.avatarBot}>
                    <Bot size={16} color="var(--accent-1)" />
                  </div>
                )}

                <div className={styles.message}>
                  {/* Tool badges */}
                  {m.toolsUsed && m.toolsUsed.length > 0 && (
                    <>
                      {m.toolsUsed.map((t, i) => (
                        <div key={i} className={styles.toolCall}>
                          <div className={`${styles.toolCallIcon} ${styles[getToolColor(t.toolName)]}`}>
                            {getToolIcon(t.toolName)}
                          </div>
                          <span className={styles.toolCallCheck}>✓</span>
                          <span className={styles.toolCallLabel}>{getToolLabel(t.toolName)}</span>
                        </div>
                      ))}
                    </>
                  )}
                  {/* Text content */}
                  {(m.content || "").split('\n').map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>

                {m.role === "user" && (
                  <div className={styles.avatarUser}>
                    <User size={14} color="white" />
                  </div>
                )}
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className={styles.loadingWrapper}>
                <div className={styles.avatarBot}>
                  <Bot size={16} color="var(--accent-1)" />
                </div>
                <div className={styles.loadingBubble}>
                  <div className={styles.dot}></div>
                  <div className={styles.dot}></div>
                  <div className={styles.dot}></div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ─── INPUT ─── */}
      <div className={styles.inputContainer}>
        <form onSubmit={onSubmit} className={styles.form}>
          <input
            ref={inputRef}
            className={styles.input}
            value={input}
            placeholder="Ask me anything about HR..."
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          <button type="submit" className={styles.button} disabled={isLoading || !input.trim()}>
            <Send size={18} />
          </button>
        </form>
        <div className={styles.poweredBy}>
          Powered by <span>Nrolled AI</span>
        </div>
      </div>
    </main>
  );
}
