"use client";

import { useChat } from "@ai-sdk/react";
import { Send, Sparkles, Bot, User, Briefcase, FileText } from "lucide-react";
import styles from "./page.module.css";
import { useEffect, useRef } from "react";

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
  });
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
            <p style={{ marginTop: "8px", fontSize: "0.9rem" }}>Try asking: "How do I apply for leave?" or "What is my leave balance for ID 101?"</p>
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
              {m.content.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
              
              {m.toolInvocations?.map(toolInvocation => (
                <div key={toolInvocation.toolCallId} className={styles.toolCall}>
                  {toolInvocation.toolName === "searchPolicies" && <FileText size={14} />}
                  {toolInvocation.toolName === "getLeaveBalance" && <User size={14} />}
                  {toolInvocation.toolName === "createJobPosting" && <Briefcase size={14} />}
                  <span>
                    {toolInvocation.state === "result" ? "✓" : "..."} 
                    {" "}{toolInvocation.toolName === "searchPolicies" ? "Searching HR policies..." : 
                          toolInvocation.toolName === "getLeaveBalance" ? "Checking database..." : 
                          "Processing job requisition..."}
                  </span>
                </div>
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
        
        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
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
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            className={styles.input}
            value={input}
            placeholder="Type your HR question here..."
            onChange={handleInputChange}
            disabled={isLoading}
          />
          <button type="submit" className={styles.button} disabled={isLoading || !input?.trim()}>
            <Send size={20} />
          </button>
        </form>
      </div>
    </main>
  );
}
