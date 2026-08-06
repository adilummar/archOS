"use client";
/**
 * ChatTab — project detail (4.17)
 * Bubble chat: firm staff right / client left. Message input + send.
 * @mention placeholder (typing @ shows no results — UX placeholder).
 */

import { useState, useEffect, useRef } from "react";
import { format, parseISO } from "date-fns";
import { MessageCircle, Send } from "lucide-react";
import { useChatStore } from "../../lib/store/chat.store";
import { useAuthStore } from "../../lib/store/auth.store";
import { Avatar } from "../shared/Avatar";
import type { Project } from "../../lib/store/types";

export function ChatTab({ project }: { project: Project }) {
  const { messages, send, markRead } = useChatStore();
  const { user, firm } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(t);
  }, []);

  const projectMessages = messages
    .filter((m) => m.projectId === project.id)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  // Mark unread as read
  useEffect(() => {
    if (!user) return;
    projectMessages.forEach((m) => {
      if (!m.readBy.includes(user.id)) markRead(m.id, user.id);
    });
  }, [projectMessages.length, user?.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [projectMessages.length]);

  const handleSend = () => {
    const content = input.trim();
    if (!content || !user || !firm) return;
    send({
      firmId: firm.id,
      projectId: project.id,
      senderId: user.id,
      senderName: user.name,
      senderType: "staff",
      content,
      mentions: [],
    });
    setInput("");
  };

  if (loading) {
    return (
      <div
        style={{
          height: 400,
          background: "var(--color-bg-card)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--color-border)",
        }}
      />
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: 520,
        background: "var(--color-bg-card)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
      }}
    >
      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {projectMessages.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              gap: 12,
              color: "var(--color-text-muted)",
            }}
          >
            <MessageCircle size={40} strokeWidth={1} opacity={0.4} />
            <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
              No messages yet. Start the conversation.
            </p>
          </div>
        ) : (
          projectMessages.map((msg) => {
            const isMe = msg.senderId === user?.id;
            const isClient = msg.senderType === "client";
            const showRight = isMe && !isClient;

            return (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  flexDirection: showRight ? "row-reverse" : "row",
                  alignItems: "flex-end",
                  gap: 8,
                }}
              >
                <Avatar name={msg.senderName} size="sm" />
                <div
                  style={{
                    maxWidth: "72%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: showRight ? "flex-end" : "flex-start",
                    gap: 3,
                  }}
                >
                  {!isMe && (
                    <span
                      style={{
                        fontSize: "var(--text-xs)",
                        color: "var(--color-text-muted)",
                        marginBottom: 2,
                      }}
                    >
                      {msg.senderName}
                      {isClient && (
                        <span
                          style={{
                            marginLeft: 4,
                            background: "var(--color-accent-muted)",
                            color: "var(--color-accent)",
                            padding: "1px 6px",
                            borderRadius: 8,
                            fontSize: 10,
                          }}
                        >
                          Client
                        </span>
                      )}
                    </span>
                  )}
                  <div
                    style={{
                      background: showRight
                        ? "var(--color-accent)"
                        : "var(--color-bg-input)",
                      color: showRight ? "#fff" : "var(--color-text-primary)",
                      borderRadius: showRight
                        ? "var(--radius-md) var(--radius-md) var(--radius-sm) var(--radius-md)"
                        : "var(--radius-md) var(--radius-md) var(--radius-md) var(--radius-sm)",
                      padding: "9px 14px",
                      fontSize: "var(--text-sm)",
                      lineHeight: 1.5,
                    }}
                  >
                    {msg.content}
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      color: "var(--color-text-muted)",
                    }}
                  >
                    {format(parseISO(msg.createdAt), "d MMM, h:mm a")}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        style={{
          borderTop: "1px solid var(--color-border)",
          padding: "12px 16px",
          display: "flex",
          gap: 10,
          alignItems: "center",
          background: "var(--color-bg-canvas)",
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Type a message… (Enter to send)"
          style={{
            flex: 1,
            background: "var(--color-bg-input)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            color: "var(--color-text-primary)",
            fontSize: "var(--text-sm)",
            padding: "9px 14px",
            outline: "none",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          style={{
            background: "var(--color-accent)",
            border: "none",
            borderRadius: "var(--radius-md)",
            color: "#fff",
            width: 38,
            height: 38,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: input.trim() ? "pointer" : "not-allowed",
            opacity: input.trim() ? 1 : 0.4,
            flexShrink: 0,
          }}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
