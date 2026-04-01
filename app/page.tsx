"use client";

import { useEffect, useState, useCallback } from "react";
import type { DashboardData, Task, Correction } from "../lib/types";

const _BASE = typeof window !== "undefined" && window.location.protocol === "https:"
  ? ""
  : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:7779");
function apiUrl(path: string) {
  return _BASE ? `${_BASE}/api/${path}` : `/api/proxy/path?p=${encodeURIComponent(path)}`;
}
const API_URL = _BASE; // legacy compat

function timeAgo(ts: string | null): string {
  if (!ts) return "never";
  const normalized = ts.endsWith("Z") || ts.includes("+") ? ts : ts + "Z";
  const diff = Math.floor((Date.now() - new Date(normalized).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === "completed" ? "#22C55E"
    : status === "in_progress" ? "#FBBF24"
    : status === "failed" ? "#EF4444"
    : "#A3A3A3";
  return (
    <span style={{
      display: "inline-block",
      width: 7,
      height: 7,
      borderRadius: "50%",
      backgroundColor: color,
      flexShrink: 0,
      marginTop: 3,
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
      letterSpacing: "0.05em",
      textTransform: "uppercase" as const,
    }}>
      {domain}
    </span>
  );
}

function TaskCard({ task }: { task: Task }) {
  return (
    <div style={{
      backgroundColor: "#1E1E1E",
      border: "1px solid #2A2A2A",
      borderRadius: "4px",
      padding: "12px",
      marginBottom: "8px",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "6px" }}>
        <StatusDot status={task.status} />
        <span style={{ fontSize: "13px", fontWeight: 500, color: "#F5F5F5", lineHeight: 1.4 }}>
          {task.title}
        </span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <DomainBadge domain={task.domain || "general"} />
        <span style={{ fontSize: "11px", color: "#A3A3A3" }}>
          {timeAgo(task.created_at)}
        </span>
      </div>
    </div>
  );
}

function KanbanColumn({ title, tasks, count, color }: {
  title: string;
  tasks: Task[];
  count: number;
  color: string;
}) {
  return (
    <div style={{
      backgroundColor: "#141414",
      border: "1px solid #2A2A2A",
      borderRadius: "4px",
      padding: "12px",
      minHeight: "180px",
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "12px",
        paddingBottom: "8px",
        borderBottom: "1px solid #2A2A2A",
      }}>
        <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", color, textTransform: "uppercase" as const }}>
          {title}
        </span>
        <span style={{
          backgroundColor: "#2A2A2A",
          color: "#A3A3A3",
          fontSize: "10px",
          fontWeight: 700,
          padding: "2px 6px",
          borderRadius: "4px",
          fontFamily: "monospace",
        }}>
          {count}
        </span>
      </div>
      {tasks.length === 0 ? (
        <p style={{ fontSize: "12px", color: "#A3A3A3", textAlign: "center", padding: "24px 0" }}>Empty</p>
      ) : (
        tasks.map((t: Task) => <TaskCard key={t.id} task={t} />)
      )}
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(apiUrl("dashboard"));
      const json = await res.json();
      setData(json);
    } catch {
      // keep stale data if available
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div>
        <style>{`@keyframes shimmer { 0%,100%{opacity:1}50%{opacity:0.4} }`}</style>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{
            height: i === 3 ? "200px" : "64px",
            backgroundColor: "#141414",
            borderRadius: "4px",
            marginBottom: "16px",
            animation: "shimmer 1.5s ease-in-out infinite",
          }} />
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ textAlign: "center", color: "#A3A3A3", padding: "48px" }}>
        Unable to connect to ZERO backend.
      </div>
    );
  }

  const isOnline = data.agent.status === "online";

  return (
    <div>
      <style>{`
        @keyframes blink { 0%,100%{opacity:1}50%{opacity:0.3} }
        .pulse-dot { animation: blink 2s ease-in-out infinite; }
      `}</style>

      {/* Agent Status Bar */}
      <div style={{
        backgroundColor: "#141414",
        border: "1px solid #2A2A2A",
        borderRadius: "4px",
        padding: "12px 16px",
        marginBottom: "16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap" as const,
        gap: "8px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            <span className="pulse-dot" style={{
              display: "inline-block",
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: isOnline ? "#22C55E" : "#EF4444",
            }} />
            <span style={{
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              color: isOnline ? "#22C55E" : "#EF4444",
            }}>
              {isOnline ? "ONLINE" : "OFFLINE"}
            </span>
          </div>
          <span style={{ color: "#A3A3A3", fontSize: "12px" }}>
            Last active {timeAgo(data.agent.last_active)}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ fontSize: "12px", color: "#A3A3A3" }}>
            Today: <span style={{ color: "#F5F5F5", fontWeight: 600, fontFamily: "monospace" }}>${data.costs.today_usd.toFixed(3)}</span>
          </span>
          <span style={{ fontSize: "12px", color: "#A3A3A3" }}>
            Tokens: <span style={{ color: "#F5F5F5", fontWeight: 600, fontFamily: "monospace" }}>{data.costs.today_tokens.toLocaleString()}</span>
          </span>
        </div>
      </div>

      {/* Sprint Card */}
      <div style={{
        backgroundColor: "#141414",
        border: "1px solid #2A2A2A",
        borderRadius: "4px",
        padding: "16px",
        marginBottom: "16px",
      }}>
        {data.sprint ? (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", color: "#FBBF24", textTransform: "uppercase" as const }}>
                  Active Sprint
                </span>
                <span style={{
                  backgroundColor: "rgba(251,191,36,0.1)",
                  color: "#FBBF24",
                  fontSize: "10px",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  fontWeight: 600,
                }}>
                  #{data.sprint.id}
                </span>
              </div>
              <span style={{ fontSize: "12px", color: "#A3A3A3", fontFamily: "monospace" }}>
                {data.sprint.steps_completed}/{data.sprint.total_steps}
              </span>
            </div>
            <p style={{ fontSize: "14px", fontWeight: 600, color: "#F5F5F5", marginBottom: "10px" }}>
              {data.sprint.mission}
            </p>
            <div style={{
              backgroundColor: "#2A2A2A",
              borderRadius: "4px",
              height: "4px",
              marginBottom: "8px",
              overflow: "hidden",
            }}>
              <div style={{
                backgroundColor: "#3B82F6",
                height: "100%",
                width: `${data.sprint.total_steps > 0 ? (data.sprint.steps_completed / data.sprint.total_steps) * 100 : 0}%`,
                borderRadius: "4px",
                transition: "width 0.3s ease",
              }} />
            </div>
            {data.sprint.current_step && (
              <p style={{ fontSize: "12px", color: "#A3A3A3" }}>{data.sprint.current_step}</p>
            )}
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <span style={{ fontSize: "13px", color: "#A3A3A3" }}>No active sprint</span>
          </div>
        )}
      </div>

      {/* Task Kanban */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "12px",
        marginBottom: "16px",
      }}>
        <KanbanColumn title="Pending" tasks={data.tasks.pending} count={data.tasks.pending.length} color="#A3A3A3" />
        <KanbanColumn title="In Progress" tasks={data.tasks.in_progress} count={data.tasks.in_progress.length} color="#FBBF24" />
        <KanbanColumn title="Done" tasks={data.tasks.completed} count={data.tasks.completed.length} color="#22C55E" />
      </div>

      {/* Corrections Feed */}
      <div style={{
        backgroundColor: "#141414",
        border: "1px solid #2A2A2A",
        borderRadius: "4px",
        padding: "16px",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", color: "#A3A3A3", textTransform: "uppercase" as const }}>
            Recent Corrections
          </span>
          <span style={{ fontSize: "11px", color: "#A3A3A3" }}>{data.corrections.length}</span>
        </div>
        {data.corrections.length === 0 ? (
          <p style={{ fontSize: "13px", color: "#A3A3A3", textAlign: "center", padding: "12px 0" }}>No corrections logged</p>
        ) : (
          data.corrections.map((c: Correction) => (
            <div key={c.id} style={{ borderTop: "1px solid #2A2A2A", padding: "10px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "4px" }}>
                <span style={{ fontSize: "13px", color: "#F5F5F5" }}>{c.description}</span>
                <span style={{ fontSize: "11px", color: "#A3A3A3", whiteSpace: "nowrap" as const, flexShrink: 0 }}>{timeAgo(c.created_at)}</span>
              </div>
              {c.corrected_behavior && (
                <p style={{ fontSize: "12px", color: "#22C55E", marginBottom: "4px" }}>Correct: {c.corrected_behavior}</p>
              )}
              <DomainBadge domain={c.domain || "general"} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
