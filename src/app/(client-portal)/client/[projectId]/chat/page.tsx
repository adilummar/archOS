"use client";

import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import { useChatStore } from "@/lib/store/chat.store";
import { useProjectStore } from "@/lib/store/project.store";
import { useAuthStore } from "@/lib/store/auth.store";
import { Avatar } from "@/components/shared/Avatar";
import { Send, FileText } from "lucide-react";
import { format } from "date-fns";

export default function ClientChatPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params?.projectId;

  const { messages, send, markRead } = useChatStore();
  const { projects } = useProjectStore();
  const { portalSession } = useAuthStore();

  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const project = projects.find((p) => p.id === projectId);

  if (!project || !portalSession) return null;

  // Filter messages for this project, and sort chronological (oldest first)
  // useChatStore stores messages unshifted (newest first), so we reverse for display
  const projectMessages = messages
    .filter((m) => m.projectId === projectId)
    .reverse();

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [projectMessages]);

  // Mark all as read when viewing
  useEffect(() => {
    projectMessages.forEach((msg) => {
      if (!msg.readBy.includes(portalSession.entityId)) {
        markRead(msg.id, portalSession.entityId);
      }
    });
  }, [projectMessages, portalSession.entityId, markRead]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    send({
      firmId: project.firmId,
      projectId: project.id,
      senderId: portalSession.entityId,
      senderName: portalSession.entityName,
      senderType: "client",
      content: newMessage.trim(),
      mentions: [], // Clients can't mention via complex UI in this demo
    });

    setNewMessage("");
  };

  return (
    <div style={{ height: "calc(100vh - 60px)", display: "flex", flexDirection: "column", maxWidth: 1000, margin: "0 auto" }}>
      
      {/* Header */}
      <div style={{ padding: "24px 24px 16px" }}>
        <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: 700, color: "var(--color-text-primary)", margin: "0 0 8px" }}>
          Project Chat
        </h1>
        <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-text-secondary)" }}>
          Direct communication with your architectural team.
        </p>
      </div>

      {/* Messages Area */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "16px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}>
        {projectMessages.length === 0 ? (
          <div style={{ textAlign: "center", color: "var(--color-text-muted)", marginTop: 48 }}>
            <p style={{ fontSize: "var(--text-base)" }}>No messages yet. Say hello!</p>
          </div>
        ) : (
          projectMessages.map((msg) => {
            const isMe = msg.senderId === portalSession.entityId;

            return (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  gap: 12,
                  alignSelf: isMe ? "flex-end" : "flex-start",
                  maxWidth: "75%",
                  flexDirection: isMe ? "row-reverse" : "row",
                }}
              >
                {!isMe && (
                  <Avatar name={msg.senderName} size="sm" />
                )}
                
                <div style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start", gap: 4 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-secondary)" }}>
                      {isMe ? "You" : msg.senderName}
                    </span>
                    <span style={{ fontSize: 10, color: "var(--color-text-muted)" }}>
                      {format(new Date(msg.createdAt), "h:mm a")}
                    </span>
                  </div>

                  <div style={{
                    background: isMe ? "var(--color-accent)" : "var(--color-bg-card)",
                    color: isMe ? "#fff" : "var(--color-text-primary)",
                    padding: "10px 14px",
                    borderRadius: "var(--radius-md)",
                    border: isMe ? "none" : "1px solid var(--color-border)",
                    borderTopRightRadius: isMe ? 2 : "var(--radius-md)",
                    borderTopLeftRadius: !isMe ? 2 : "var(--radius-md)",
                    fontSize: "var(--text-sm)",
                    lineHeight: 1.5,
                  }}>
                    {msg.content}
                    
                    {msg.mentions && msg.mentions.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                        {msg.mentions.map((mention, i) => (
                          <div key={i} style={{
                            display: "flex", alignItems: "center", gap: 4,
                            background: isMe ? "rgba(0,0,0,0.15)" : "var(--color-bg-canvas)",
                            padding: "4px 8px", borderRadius: "var(--radius-sm)", fontSize: 11, fontWeight: 500
                          }}>
                            {mention.type === 'file' ? <FileText size={12} /> : null}
                            {mention.label}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{ padding: 24, borderTop: "1px solid var(--color-border)", background: "var(--color-bg-canvas)" }}>
        <form onSubmit={handleSend} style={{ display: "flex", gap: 12 }}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            style={{
              flex: 1,
              padding: "12px 16px",
              fontSize: "var(--text-base)",
              borderRadius: "var(--radius-full)",
              border: "1px solid var(--color-border)",
              background: "var(--color-bg-input)",
              color: "var(--color-text-primary)",
              outline: "none",
            }}
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: newMessage.trim() ? "var(--color-accent)" : "var(--color-bg-input)",
              color: newMessage.trim() ? "#fff" : "var(--color-text-muted)",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: newMessage.trim() ? "pointer" : "not-allowed",
              transition: "background var(--duration-fast)",
            }}
          >
            <Send size={18} style={{ marginLeft: 2 }} /> {/* offset slightly for visual balance */}
          </button>
        </form>
      </div>
    </div>
  );
}
