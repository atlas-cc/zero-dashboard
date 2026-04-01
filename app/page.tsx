"use client";

import { useEffect, useState, useCallback } from "react";
import type { Task, Correction } from "../lib/types";

const _BASE = typeof window !== "undefined" && window.location.protocol === "https:"
  ? ""
  : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:7779");
function apiUrl(path: string) {
  return _BASE ? `${_BASE}/api/${path}` : `/api/proxy/path?p=${encodeURIComponent(path)}`;
}

function timeAgo(ts: string | null): string {
  if (!ts) return "never";
  const normalized = ts.endsWith("Z") || ts.includes("+") ? ts : ts + "Z";
  const diff = Math.floor((Date.now() - new Date(normalized).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function isToday(ts: string | null): boolean {
  if (!ts) return false;
  const normalized = ts.endsWith("Z") || ts.includes("+") ? ts : ts + "Z";
  const d = new Date(normalized);
  const now = new Date();
  return (
    d.getUTCFullYear() === now.getUTCFullYear() &&
    d.getUTCMonth() === now.getUTCMonth() &&
    d.getUTCDate() === now.getUTCDate()
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
      flexShrink: 0,
    }}>
      {domain || "general"}
    </span>
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <div style={{
      fontSize: "11px",
      fontWeight: 700,
      letterSpacing: "0.1em",
      color: "#A3A3A3",
      textTransform: "uppercase" as const,
      marginBottom: "12px",
    }}>
      {text}
    </div>
  );
}

const CARD: React.CSSProperties = {
  backgroundColor: "#141414",
  border: "1px solid #2A2A2A",
  borderRadius: "4px",
  padding: "16px",
  marginBottom: "16px",
};

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [dashRes, tasksRes] = await Promise.all([
        fetch(apiUrl("dashboard")),
        fetch(apiUrl("tasks")),
      ]);
      const dash = await dashRes.json();
      const taskList = await tasksRes.json();
      setCorrections(Array.isArray(dash.corrections) ? dash.corrections : []);
      setTasks(Array.isArray(taskList) ? taskList : []);
    } catch {
      // keep stale data
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
        {[120, 80, 140, 100].map((h, i) => (
          <div key={i} style={{
            height: `${h}px`,
            backgroundColor: "#141414",
            borderRadius: "4px",
            marginBottom: "16px",
            animation: "shimmer 1.5s ease-in-out infinite",
          }} />
        ))}
      </div>
    );
  }

  const attentionTasks = tasks.filter(t => t.status === "in_progress" || t.status === "failed");
  const pendingTasks = [...tasks.filter(t => t.status === "pending")]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);
  const doneTodayTasks = tasks.filter(t => t.status === "completed" && isToday(t.completed_at));
  const recentCorrections = corrections.slice(0, 3);

  return (
    <div>
      {/* 1. NEEDS ATTENTION */}
      <div style={CARD}>
        <SectionLabel text="Needs Attention" />
        {attentionTasks.length === 0 ? (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0" }}>
            <span style={{ color: "#22C55E", fontSize: "16px" }}>&#10003;</span>
            <span style={{ fontSize: "14px", color: "#22C55E", fontWeight: 500 }}>All clear</span>
          </div>
        ) : (
          attentionTasks.map(t => (
            <div key={t.id} style={{
              borderLeft: `3px solid ${t.status === "failed" ? "#EF4444" : "#FBBF24"}`,
              paddingLeft: "12px",
              marginBottom: "12px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" as const }}>
                <span style={{ fontSize: "13px", fontWeight: 500, color: "#F5F5F5" }}>{t.title}</span>
                <DomainBadge domain={t.domain} />
              </div>
              <div style={{ fontSize: "11px", color: "#A3A3A3" }}>
                Running {timeAgo(t.created_at)}
                {t.notes && <span style={{ marginLeft: "10px", color: "#717171" }}>{t.notes}</span>}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 2. UP NEXT */}
      <div style={CARD}>
        <SectionLabel text="Up Next" />
        {pendingTasks.length === 0 ? (
          <p style={{ fontSize: "13px", color: "#A3A3A3" }}>Nothing queued. Add a task to get started.</p>
        ) : (
          pendingTasks.map(t => (
            <div key={t.id} style={{
              borderLeft: "3px solid #3B82F6",
              paddingLeft: "12px",
              marginBottom: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "8px",
              flexWrap: "wrap" as const,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: "13px", color: "#F5F5F5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                  {t.title}
                </span>
                <DomainBadge domain={t.domain} />
              </div>
              <span style={{
                backgroundColor: "#2A2A2A",
                color: "#A3A3A3",
                fontSize: "10px",
                fontWeight: 700,
                padding: "2px 6px",
                borderRadius: "4px",
                letterSpacing: "0.08em",
                flexShrink: 0,
              }}>QUEUED</span>
            </div>
          ))
        )}
      </div>

      {/* 3. DONE TODAY */}
      <div style={CARD}>
        <SectionLabel text={`Done Today (${doneTodayTasks.length})`} />
        {doneTodayTasks.length === 0 ? (
          <p style={{ fontSize: "13px", color: "#A3A3A3" }}>No completions yet today.</p>
        ) : (
          doneTodayTasks.map(t => (
            <div key={t.id} style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "8px",
              flexWrap: "wrap" as const,
            }}>
              <span style={{ color: "#22C55E", fontSize: "13px", flexShrink: 0 }}>&#10003;</span>
              <span style={{ fontSize: "13px", color: "#F5F5F5", flex: 1 }}>{t.title}</span>
              <DomainBadge domain={t.domain} />
              <span style={{ fontSize: "11px", color: "#A3A3A3", flexShrink: 0 }}>{timeAgo(t.completed_at)}</span>
            </div>
          ))
        )}
      </div>

      {/* 4. RECENT CORRECTIONS */}
      <div style={CARD}>
        <SectionLabel text="Recent Corrections" />
        {recentCorrections.length === 0 ? (
          <p style={{ fontSize: "13px", color: "#A3A3A3" }}>No corrections logged.</p>
        ) : (
          recentCorrections.map(c => (
            <div
              key={c.id}
              onClick={() => setExpanded(expanded === c.id ? null : c.id)}
              style={{
                borderLeft: "3px solid #EF4444",
                paddingLeft: "12px",
                marginBottom: "14px",
                cursor: "pointer",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" as const }}>
                <span style={{
                  backgroundColor: "rgba(239,68,68,0.15)",
                  color: "#EF4444",
                  fontSize: "10px",
                  fontWeight: 700,
                  padding: "2px 6px",
                  borderRadius: "4px",
                  letterSpacing: "0.05em",
                  flexShrink: 0,
                }}>CORRECTION</span>
                <DomainBadge domain={c.domain} />
                <span style={{ fontSize: "11px", color: "#A3A3A3", marginLeft: "auto" }}>{timeAgo(c.created_at)}</span>
              </div>
              <p style={{ fontSize: "13px", color: "#F5F5F5", marginBottom: expanded === c.id ? "8px" : 0 }}>
                {c.description}
              </p>
              {expanded === c.id && c.corrected_behavior && (
                <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #2A2A2A" }}>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: "#22C55E", letterSpacing: "0.08em", marginBottom: "4px" }}>
                    CORRECT BEHAVIOR
                  </div>
                  <p style={{ fontSize: "12px", color: "#22C55E" }}>{c.corrected_behavior}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
