"use client";

import { useChat } from "@ai-sdk/react";
import { Send, Sparkles, Bot, User, Briefcase, FileText } from "lucide-react";
import styles from "./page.module.css";
import { useEffect, useRef, useState } from "react";

export default function Chat() {
  const [input, setInput] = useState("");
  const [debugMsg, setDebugMsg] = useState("");
  const chatState = useChat({
    api: "/api/chat",
    streamProtocol: "ui-message",
    onError: (err) => setDebugMsg(err.message)
  });
  
  const messages = chatState.messages || [];
  const isLoading = chatState.status === "submitted" || chatState.status === "streaming" || chatState.isLoading;
  const error = chatState.error;
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const onSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setDebugMsg("Sending...");
    try {
      if (chatState.append) {
        chatState.append({ role: 'user', content: input });
      } else if (chatState.sendMessage) {
        chatState.sendMessage({ role: 'user', content: input });
      } else if (chatState.handleSubmit) {
        chatState.handleSubmit(e);
      } else {
        throw new Error("Could not find a valid send method in useChat exports: " + Object.keys(chatState).join(", "));
      }
      setInput("");
      setDebugMsg("Sent!");
    } catch(err) {
      setDebugMsg("Client Error: " + err.message);
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
              {(m.content || "").split('\n').map((line, i) => (
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
        
        {(error || debugMsg) && (
          <div style={{ color: 'red', textAlign: 'center', marginTop: '20px' }}>
            <p>Debug Status: {debugMsg}</p>
            {error && <p>Error: {error.message || "Failed to fetch response."}</p>}
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
          <button type="submit" className={styles.button}>
            <Send size={20} />
          </button>
        </form>
      </div>
    </main>
  );
}
