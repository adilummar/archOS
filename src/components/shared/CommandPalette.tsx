"use client";
/**
 * CommandPalette — ⌘K global search.
 * Searches: projects, tasks, files, staff, leads, RFIs.
 * Grouped results, keyboard navigation (↑↓ Enter ESC).
 * Task 11.1.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Search, Folder, CheckSquare, FileText, Users, TrendingUp, MessageSquare, X } from "lucide-react";
import { useProjectStore } from "../../lib/store/project.store";
import { useTaskStore } from "../../lib/store/task.store";
import { useFileStore } from "../../lib/store/file.store";
import { useFirmStore } from "../../lib/store/firm.store";
import { useCrmStore } from "../../lib/store/crm.store";
import { useRfiStore } from "../../lib/store/rfi.store";
import { useAuthStore } from "../../lib/store/auth.store";

interface ResultItem {
  id: string;
  label: string;
  sublabel?: string;
  group: string;
  icon: React.ReactNode;
  href: string;
}

const GROUP_ORDER = ["Projects", "Tasks", "Files", "Staff", "Leads", "RFIs"];

function highlight(text: string, query: string) {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: "var(--color-accent-muted)", color: "var(--color-accent)", borderRadius: 2, padding: "0 1px" }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const params = useParams<{ firmSlug: string }>();
  const firmSlug = params?.firmSlug ?? "demo";

  const { user, firm } = useAuthStore();
  const { projects } = useProjectStore();
  const { tasks } = useTaskStore();
  const { files } = useFileStore();
  const { users, clients, contractors } = useFirmStore();
  const { leads } = useCrmStore();
  const { rfis } = useRfiStore();

  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // ⌘K keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (!open) {
          // Signal parent to open
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  const results: ResultItem[] = [];

  if (query.trim().length >= 1) {
    const q = query.toLowerCase();

    // Projects
    projects
      .filter((p) => p.firmId === firm?.id && p.name.toLowerCase().includes(q))
      .slice(0, 5)
      .forEach((p) => {
        results.push({
          id: `project-${p.id}`,
          label: p.name,
          sublabel: p.clientName,
          group: "Projects",
          icon: <Folder size={14} strokeWidth={1.5} />,
          href: `/${firmSlug}/projects/${p.id}`,
        });
      });

    // Tasks
    tasks
      .filter((t) => t.firmId === firm?.id && t.title.toLowerCase().includes(q))
      .slice(0, 5)
      .forEach((t) => {
        const proj = projects.find((p) => p.id === t.projectId);
        results.push({
          id: `task-${t.id}`,
          label: t.title,
          sublabel: proj?.name,
          group: "Tasks",
          icon: <CheckSquare size={14} strokeWidth={1.5} />,
          href: `/${firmSlug}/projects/${t.projectId}?tab=tasks`,
        });
      });

    // Files
    files
      .filter((f) => f.firmId === firm?.id && f.name.toLowerCase().includes(q))
      .slice(0, 4)
      .forEach((f) => {
        const proj = projects.find((p) => p.id === f.projectId);
        results.push({
          id: `file-${f.id}`,
          label: f.name,
          sublabel: `${f.drawingNumber ?? ""} · ${proj?.name ?? ""}`,
          group: "Files",
          icon: <FileText size={14} strokeWidth={1.5} />,
          href: `/${firmSlug}/projects/${f.projectId}?tab=files`,
        });
      });

    // Staff
    users
      .filter(
        (u) =>
          u.firmId === firm?.id &&
          u.status === "active" &&
          (u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
      )
      .slice(0, 4)
      .forEach((u) => {
        results.push({
          id: `staff-${u.id}`,
          label: u.name,
          sublabel: `${u.designation} · ${u.role}`,
          group: "Staff",
          icon: <Users size={14} strokeWidth={1.5} />,
          href: `/${firmSlug}/settings`,
        });
      });

    // Leads / CRM
    leads
      .filter((l) => l.firmId === firm?.id && (l.name.toLowerCase().includes(q) || l.projectType.toLowerCase().includes(q)))
      .slice(0, 3)
      .forEach((l) => {
        results.push({
          id: `lead-${l.id}`,
          label: l.name,
          sublabel: `${l.projectType} · ${l.stage}`,
          group: "Leads",
          icon: <TrendingUp size={14} strokeWidth={1.5} />,
          href: `/${firmSlug}/crm`,
        });
      });

    // RFIs
    rfis
      .filter((r) => r.firmId === firm?.id && (r.title.toLowerCase().includes(q) || r.rfiNumber.toLowerCase().includes(q)))
      .slice(0, 3)
      .forEach((r) => {
        results.push({
          id: `rfi-${r.id}`,
          label: r.title,
          sublabel: `${r.rfiNumber} · ${r.status}`,
          group: "RFIs",
          icon: <MessageSquare size={14} strokeWidth={1.5} />,
          href: `/${firmSlug}/rfi`,
        });
      });
  }

  // Group results
  const grouped = GROUP_ORDER.flatMap((group) => {
    const items = results.filter((r) => r.group === group);
    if (items.length === 0) return [];
    return [{ type: "group" as const, label: group }, ...items.map((item) => ({ type: "item" as const, ...item }))];
  });

  // Flat items for keyboard navigation
  const flatItems = grouped.filter((g) => g.type === "item") as (ResultItem & { type: "item" })[];

  const navigate = useCallback(
    (href: string) => {
      router.push(href);
      onClose();
    },
    [router, onClose]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, flatItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && flatItems[selectedIndex]) {
      navigate(flatItems[selectedIndex].href);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          zIndex: 1000,
          backdropFilter: "blur(2px)",
        }}
        onClick={onClose}
      />

      {/* Palette */}
      <div
        style={{
          position: "fixed",
          top: "16%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "min(620px, 92vw)",
          background: "var(--color-bg-elevated, var(--color-bg-card))",
          border: "1px solid var(--color-border-strong)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
          zIndex: 1001,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          maxHeight: "60vh",
        }}
      >
        {/* Input row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "14px 16px",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <Search size={16} color="var(--color-text-muted)" strokeWidth={1.5} style={{ flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search projects, tasks, files, staff…"
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              fontSize: "var(--text-base)",
              color: "var(--color-text-primary)",
              fontFamily: "var(--font-body)",
            }}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--color-text-muted)", display: "flex" }}
            >
              <X size={14} strokeWidth={2} />
            </button>
          )}
          <kbd
            style={{
              fontSize: 10,
              fontFamily: "var(--font-mono)",
              padding: "2px 6px",
              borderRadius: 4,
              background: "var(--color-bg-input)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-muted)",
              flexShrink: 0,
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          {query.trim().length === 0 ? (
            <div style={{ padding: "32px 20px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
              Type to search across projects, tasks, files, staff, leads and RFIs
            </div>
          ) : grouped.length === 0 ? (
            <div style={{ padding: "32px 20px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
              No results for &ldquo;<strong style={{ color: "var(--color-text-secondary)" }}>{query}</strong>&rdquo;
            </div>
          ) : (
            <div style={{ paddingBottom: 8 }}>
              {(() => {
                let itemIndex = 0;
                return grouped.map((entry, i) => {
                  if (entry.type === "group") {
                    return (
                      <div
                        key={`group-${i}`}
                        style={{
                          padding: "10px 16px 4px",
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          color: "var(--color-text-muted)",
                        }}
                      >
                        {entry.label}
                      </div>
                    );
                  }
                  const item = entry as ResultItem & { type: "item" };
                  const isSelected = itemIndex === selectedIndex;
                  const currentIndex = itemIndex;
                  itemIndex++;

                  return (
                    <button
                      key={item.id}
                      onClick={() => navigate(item.href)}
                      onMouseEnter={() => setSelectedIndex(currentIndex)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        width: "100%",
                        padding: "9px 16px",
                        background: isSelected ? "var(--color-bg-card-hover)" : "transparent",
                        border: "none",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "background var(--duration-fast)",
                      }}
                    >
                      <span
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "var(--radius-sm)",
                          background: isSelected ? "var(--color-accent-muted)" : "var(--color-bg-input)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: isSelected ? "var(--color-accent)" : "var(--color-text-muted)",
                          flexShrink: 0,
                          transition: "all var(--duration-fast)",
                        }}
                      >
                        {item.icon}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "var(--text-sm)",
                            fontWeight: 500,
                            color: "var(--color-text-primary)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {highlight(item.label, query)}
                        </p>
                        {item.sublabel && (
                          <p
                            style={{
                              margin: 0,
                              fontSize: "var(--text-xs)",
                              color: "var(--color-text-muted)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {item.sublabel}
                          </p>
                        )}
                      </div>
                      {isSelected && (
                        <kbd
                          style={{
                            fontSize: 10,
                            fontFamily: "var(--font-mono)",
                            padding: "2px 6px",
                            borderRadius: 4,
                            background: "var(--color-bg-input)",
                            border: "1px solid var(--color-border)",
                            color: "var(--color-text-muted)",
                            flexShrink: 0,
                          }}
                        >
                          ↵
                        </kbd>
                      )}
                    </button>
                  );
                });
              })()}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            borderTop: "1px solid var(--color-border)",
            padding: "8px 16px",
            display: "flex",
            gap: 16,
            fontSize: 10,
            color: "var(--color-text-muted)",
            fontFamily: "var(--font-mono)",
          }}
        >
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span>ESC close</span>
        </div>
      </div>
    </>
  );
}
