"use client";

import { useEffect, useState, useCallback } from "react";
import type { Task } from "../../lib/types";

const _BASE = typeof window !== "undefined" && window.location.protocol === "https:"
  ? ""
  : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:7779");
function apiUrl(path: string) {
  return _BASE ? `${_BASE}/api/${path}` : `/api/proxy/path?p=${encodeURIComponent(path)}`;
}

const DOMAINS = ["general", "cencal", "raw", "deployfish"];

const STATUS_COLORS: Record<string, string> = {
  completed: "#22C55E",
  in_progress: "#FBBF24",
  pending: "#A3A3A3",
  failed: "#EF4444",
};

function timeAgo(ts: string | null): string {
  if (!ts) return "-";
  const normalized = ts.endsWith("Z") || ts.includes("+") ? ts : ts + "Z";
  const diff = Math.floor((Date.now() - new Date(normalized).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function timeStr(ts: string | null): string {
  if (!ts) return "-";
  return new Date(ts.endsWith("Z") ? ts : ts + "Z").toLocaleDateString();
}

function StatusDot({ status }: { status: string }) {
  return (
    <span style={{
      display: "inline-block",
      width: 7,
      height: 7,
      borderRadius: "50%",
      backgroundColor: STATUS_COLORS[status] ?? "#A3A3A3",
      flexShrink: 0,
    }} />
  );
}

function DomainBadge({ domain }: { domain: string }) {
  return (
    <span style={{
      backgroundColor: "rgba(59,130,246,0.15)",
      color: "#3B82F6",
      fontSize: "10px",
      fontWeight: 600,
      padding: "2px 6px",
      borderRadius: "4px",
      textTransform: "uppercase" as const,
      letterSpacing: "0.05em",
    }}>
      {domain || "general"}
    </span>
  );
}

const INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  backgroundColor: "#1E1E1E",
  border: "1px solid #2A2A2A",
  borderRadius: "4px",
  padding: "8px 12px",
  color: "#F5F5F5",
  fontSize: "13px",
  outline: "none",
  boxSizing: "border-box",
};

const LABEL_STYLE: React.CSSProperties = {
  fontSize: "11px",
  color: "#A3A3A3",
  display: "block",
  marginBottom: "6px",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [domain, setDomain] = useState("general");
  const [status, setStatus] = useState("pending");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    try {
      const res = await fetch(apiUrl("tasks"));
      const json = await res.json();
      setTasks(Array.isArray(json) ? json : []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
    const interval = setInterval(loadTasks, 5000);
    return () => clearInterval(interval);
  }, [loadTasks]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(apiUrl("tasks"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          domain,
          status,
          notes: notes.trim() || undefined,
          source: "dashboard",
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setTitle("");
      setNotes("");
      await loadTasks();
    } catch {
      setError("Failed to create task.");
    } finally {
      setSubmitting(false);
    }
  }

  const blockers = tasks.filter(t => t.status === "in_progress" || t.status === "failed");

  return (
    <div>
      {/* BLOCKERS */}
      {blockers.length > 0 && (
        <div style={{
          backgroundColor: "#141414",
          border: "1px solid #2A2A2A",
          borderRadius: "4px",
          padding: "16px",
          marginBottom: "16px",
        }}>
          <div style={{
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.1em",
            color: "#EF4444",
            textTransform: "uppercase" as const,
            marginBottom: "12px",
          }}>
            Blockers ({blockers.length})
          </div>
          {blockers.map(t => (
            <div key={t.id} style={{
              borderLeft: `3px solid ${t.status === "failed" ? "#EF4444" : "#FBBF24"}`,
              paddingLeft: "12px",
              marginBottom: "10px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px", flexWrap: "wrap" as const }}>
                <span style={{ fontSize: "13px", fontWeight: 500, color: "#F5F5F5" }}>{t.title}</span>
                <DomainBadge domain={t.domain} />
                <span style={{
                  backgroundColor: t.status === "failed" ? "rgba(239,68,68,0.15)" : "rgba(251,191,36,0.15)",
                  color: t.status === "failed" ? "#EF4444" : "#FBBF24",
                  fontSize: "10px",
                  fontWeight: 700,
                  padding: "2px 6px",
                  borderRadius: "4px",
                  letterSpacing: "0.05em",
                }}>
                  {t.status.toUpperCase().replace("_", " ")}
                </span>
              </div>
              <div style={{ fontSize: "11px", color: "#A3A3A3" }}>Running {timeAgo(t.created_at)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Create Task Form */}
      <form onSubmit={handleSubmit} style={{
        backgroundColor: "#141414",
        border: "1px solid #2A2A2A",
        borderRadius: "4px",
        padding: "16px",
        marginBottom: "20px",
      }}>
        <div style={{
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: "0.1em",
          color: "#A3A3A3",
          textTransform: "uppercase" as const,
          marginBottom: "14px",
        }}>
          New Task
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" as const, marginBottom: "10px", alignItems: "flex-end" }}>
          <div style={{ flex: 2, minWidth: "200px" }}>
            <label style={LABEL_STYLE}>Title</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Task title..."
              style={INPUT_STYLE}
            />
          </div>
          <div style={{ minWidth: "130px" }}>
            <label style={LABEL_STYLE}>Domain</label>
            <select
              value={domain}
              onChange={e => setDomain(e.target.value)}
              style={{ ...INPUT_STYLE, cursor: "pointer" }}
            >
              {DOMAINS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div style={{ minWidth: "130px" }}>
            <label style={LABEL_STYLE}>Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              style={{ ...INPUT_STYLE, cursor: "pointer" }}
            >
              <option value="pending">pending</option>
              <option value="in_progress">in_progress</option>
            </select>
          </div>
        </div>
        <div style={{ marginBottom: "12px" }}>
          <label style={LABEL_STYLE}>Notes (optional)</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Additional context..."
            rows={2}
            style={{ ...INPUT_STYLE, resize: "vertical" as const, fontFamily: "inherit" }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            type="submit"
            disabled={submitting || !title.trim()}
            style={{
              backgroundColor: "#3B82F6",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              padding: "8px 20px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: submitting || !title.trim() ? "not-allowed" : "pointer",
              opacity: submitting || !title.trim() ? 0.6 : 1,
            }}
          >
            {submitting ? "Adding..." : "Add Task"}
          </button>
          {error && <span style={{ fontSize: "12px", color: "#EF4444" }}>{error}</span>}
        </div>
      </form>

      {/* Task Table */}
      {loading ? (
        <div style={{ color: "#A3A3A3", textAlign: "center", padding: "40px" }}>Loading...</div>
      ) : (
        <div style={{
          backgroundColor: "#141414",
          border: "1px solid #2A2A2A",
          borderRadius: "4px",
          overflow: "hidden",
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse" as const }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #2A2A2A" }}>
                {["", "Title", "Domain", "Notes", "Created", "Age"].map((h, i) => (
                  <th key={i} style={{
                    padding: "10px 14px",
                    textAlign: "left" as const,
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#A3A3A3",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase" as const,
                    whiteSpace: "nowrap" as const,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "32px", textAlign: "center" as const, color: "#A3A3A3", fontSize: "13px" }}>
                    No tasks yet.
                  </td>
                </tr>
              ) : (
                tasks.map((task, i) => (
                  <tr
                    key={task.id}
                    style={{
                      borderBottom: i < tasks.length - 1 ? "1px solid #2A2A2A" : "none",
                      backgroundColor: i % 2 === 1 ? "#111111" : "transparent",
                    }}
                  >
                    <td style={{ padding: "10px 14px", width: "20px" }}>
                      <StatusDot status={task.status} />
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: "13px", color: "#F5F5F5", maxWidth: "280px" }}>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, display: "block" }}>
                        {task.title}
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <DomainBadge domain={task.domain} />
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: "12px", color: "#717171", maxWidth: "200px" }}>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, display: "block" }}>
                        {task.notes || "-"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: "12px", color: "#A3A3A3", whiteSpace: "nowrap" as const }}>
                      {timeStr(task.created_at)}
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: "12px", color: "#A3A3A3", whiteSpace: "nowrap" as const }}>
                      {timeAgo(task.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
