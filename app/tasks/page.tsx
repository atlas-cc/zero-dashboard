"use client";

import { useEffect, useState, useCallback } from "react";
import type { Task } from "../../lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7779";

const DOMAINS = ["general", "cencal", "raw", "deployfish"];

const STATUS_COLORS: Record<string, string> = {
  completed: "#22C55E",
  in_progress: "#FBBF24",
  pending: "#A3A3A3",
  failed: "#EF4444",
};

function timeStr(ts: string | null): string {
  if (!ts) return "-";
  return new Date(ts.endsWith("Z") ? ts : ts + "Z").toLocaleString();
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

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [domain, setDomain] = useState("general");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/tasks`);
      const json = await res.json();
      setTasks(json);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), domain, status: "pending", source: "dashboard" }),
      });
      if (!res.ok) throw new Error("Failed");
      setTitle("");
      await loadTasks();
    } catch {
      setError("Failed to create task.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#F5F5F5", marginBottom: "20px", letterSpacing: "0.02em" }}>
        Tasks
      </h1>

      {/* Create Task Form */}
      <form onSubmit={handleSubmit} style={{
        backgroundColor: "#141414",
        border: "1px solid #2A2A2A",
        borderRadius: "4px",
        padding: "16px",
        marginBottom: "20px",
        display: "flex",
        gap: "8px",
        flexWrap: "wrap" as const,
        alignItems: "flex-end",
      }}>
        <div style={{ flex: 1, minWidth: "200px" }}>
          <label style={{ fontSize: "11px", color: "#A3A3A3", display: "block", marginBottom: "6px", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>
            Title
          </label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Task title..."
            style={{
              width: "100%",
              backgroundColor: "#1E1E1E",
              border: "1px solid #2A2A2A",
              borderRadius: "4px",
              padding: "8px 12px",
              color: "#F5F5F5",
              fontSize: "13px",
              outline: "none",
              boxSizing: "border-box" as const,
            }}
          />
        </div>
        <div style={{ minWidth: "140px" }}>
          <label style={{ fontSize: "11px", color: "#A3A3A3", display: "block", marginBottom: "6px", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>
            Domain
          </label>
          <select
            value={domain}
            onChange={e => setDomain(e.target.value)}
            style={{
              width: "100%",
              backgroundColor: "#1E1E1E",
              border: "1px solid #2A2A2A",
              borderRadius: "4px",
              padding: "8px 12px",
              color: "#F5F5F5",
              fontSize: "13px",
              outline: "none",
              cursor: "pointer",
              boxSizing: "border-box" as const,
            }}
          >
            {DOMAINS.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
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
            height: "36px",
          }}
        >
          {submitting ? "Adding..." : "Add Task"}
        </button>
        {error && <span style={{ fontSize: "12px", color: "#EF4444" }}>{error}</span>}
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
                {["Status", "Title", "Domain", "Source", "Created", "Completed"].map(h => (
                  <th key={h} style={{
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
                      backgroundColor: i % 2 === 1 ? "#0D0D0D" : "transparent",
                    }}
                  >
                    <td style={{ padding: "10px 14px" }}>
                      <StatusDot status={task.status} />
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: "13px", color: "#F5F5F5" }}>{task.title}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{
                        backgroundColor: "rgba(59,130,246,0.15)",
                        color: "#3B82F6",
                        fontSize: "10px",
                        fontWeight: 600,
                        padding: "2px 6px",
                        borderRadius: "4px",
                        textTransform: "uppercase" as const,
                      }}>
                        {task.domain || "general"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: "12px", color: "#A3A3A3" }}>{task.source}</td>
                    <td style={{ padding: "10px 14px", fontSize: "12px", color: "#A3A3A3", whiteSpace: "nowrap" as const }}>{timeStr(task.created_at)}</td>
                    <td style={{ padding: "10px 14px", fontSize: "12px", color: "#A3A3A3", whiteSpace: "nowrap" as const }}>{timeStr(task.completed_at)}</td>
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
