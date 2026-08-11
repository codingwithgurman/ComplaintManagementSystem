"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/AuthProvider";
import AppShell from "@/components/AppShell";

const SUGGESTIONS = [
  "How do I file a new complaint?",
  "My hostel Wi-Fi has been down for 2 days — what category should I use?",
  "How do I check the status of my complaint?",
  "Who handles library-related issues?",
];

export default function ChatbotPage() {
  const { profile } = useAuth();
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm the CampusDesk AI Help Desk. Ask me how to file a complaint, which category fits your issue, or anything about using this site." },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  async function send(text) {
    const content = text.trim();
    if (!content || sending) return;

    const nextMessages = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages.map(({ role, content }) => ({ role, content })) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setMessages((m) => [...m, { role: "assistant", content: `Sorry — ${err.message}` }]);
    } finally {
      setSending(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    send(input);
  }

  return (
    <AppShell title="AI Help Desk" requiredRole={profile?.role === "admin" ? "admin" : "student"} showNotif={profile?.role !== "admin"}>
      <div className="chat-shell">
        <div className="chat-messages" ref={scrollRef}>
          {messages.map((m, i) => (
            <div className={`chat-bubble-row ${m.role === "user" ? "user" : "bot"}`} key={i}>
              <div className={`chat-avatar ${m.role === "user" ? "user" : "bot"}`}>
                {m.role === "user" ? (profile?.name?.charAt(0).toUpperCase() || "U") : "AI"}
              </div>
              <div className="chat-bubble">{m.content}</div>
            </div>
          ))}
          {sending && (
            <div className="chat-bubble-row bot">
              <div className="chat-avatar bot">AI</div>
              <div className="chat-bubble">
                <div className="chat-typing"><span></span><span></span><span></span></div>
              </div>
            </div>
          )}
        </div>

        {messages.length <= 1 && (
          <div className="chat-suggestions">
            {SUGGESTIONS.map((s) => (
              <button key={s} className="chat-suggestion" onClick={() => send(s)}>{s}</button>
            ))}
          </div>
        )}

        <form className="chat-input-bar" onSubmit={handleSubmit}>
          <textarea
            rows={1}
            placeholder="Ask about filing a complaint, categories, or how CampusDesk works…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
            }}
          />
          <button type="submit" className="btn btn-primary" disabled={sending || !input.trim()}>Send</button>
        </form>
      </div>
    </AppShell>
  );
}
