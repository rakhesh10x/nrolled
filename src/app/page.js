"use client";

import { Send, Sparkles, Bot, User, Briefcase, FileText } from "lucide-react";
import styles from "./page.module.css";
import { useEffect, useRef, useState } from "react";

export default function Chat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: "msg-" + Date.now(),
      role: "user",
      content: input.trim()
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

      const assistantMessage = {
        id: "msg-" + Date.now() + "-ai",
        role: "assistant",
        content: data.text,
        toolsUsed: data.toolsUsed || []
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: "msg-" + Date.now() + "-err",
        role: "assistant",
        content: "Sorry, something went wrong. Please try again."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div style={{ background: "var(--accent)", padding: "12px", borderRadius: "16px" }}>
          <Sparkles size={24} color="white" />
        </div>
        <div className={styles.titleContainer}>
          <h1>Nrolled HR Assistant</h1>
          <p>Ask me about leave, payroll, or job creation.</p>
        </div>
      </header>

      <div className={styles.chatContainer}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", color: "var(--text-secondary)", marginTop: "40px" }}>
            <p>Hi there! I am your AI HR Assistant.</p>
            <p style={{ marginTop: "8px", fontSize: "0.9rem" }}>Try asking: &quot;How do I apply for leave?&quot; or &quot;What is my leave balance for ID 101?&quot;</p>
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={`${styles.messageWrapper} ${
              m.role === "user" ? styles.messageUser : styles.messageAssistant
            }`}
          >
            {m.role === "assistant" && (
              <div style={{ marginRight: "12px", marginTop: "4px" }}>
                <Bot size={24} color="var(--accent)" />
              </div>
            )}
            
            <div className={styles.message}>
              {/* Show tool usage badges */}
              {m.toolsUsed && m.toolsUsed.length > 0 && (
                <div style={{ marginBottom: "12px" }}>
                  {m.toolsUsed.map((t, i) => (
                    <div key={i} className={styles.toolCall}>
                      {t.toolName === "searchPolicies" && <FileText size={14} />}
                      {t.toolName === "getLeaveBalance" && <User size={14} />}
                      {t.toolName === "createJobPosting" && <Briefcase size={14} />}
                      <span>
                        ✓ {t.toolName === "searchPolicies" ? "Searched HR policies" : 
                           t.toolName === "getLeaveBalance" ? "Checked leave balance" : 
                           "Processed job requisition"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {/* Render text content */}
              {(m.content || "").split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>

            {m.role === "user" && (
              <div style={{ marginLeft: "12px", marginTop: "4px" }}>
                <div style={{ background: "var(--accent)", borderRadius: "50%", padding: "4px" }}>
                  <User size={16} color="white" />
                </div>
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className={`${styles.messageWrapper} ${styles.messageAssistant}`}>
            <div style={{ marginRight: "12px", marginTop: "4px" }}>
              <Bot size={24} color="var(--accent)" />
            </div>
            <div className={styles.loadingDots}>
              <div className={styles.dot}></div>
              <div className={styles.dot}></div>
              <div className={styles.dot}></div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className={styles.inputContainer}>
        <form onSubmit={onSubmit} className={styles.form}>
          <input
            className={styles.input}
            value={input}
            placeholder="Type your HR question here..."
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          <button type="submit" className={styles.button} disabled={isLoading}>
            <Send size={20} />
          </button>
        </form>
      </div>
    </main>
  );
}
