"use client";

import { useEffect, useState, useCallback } from "react";
import type { Correction, AgentLog } from "../../lib/types";

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

function isToday(ts: string): boolean {
  const normalized = ts.endsWith("Z") || ts.includes("+") ? ts : ts + "Z";
  const d = new Date(normalized);
  const now = new Date();
  return (
    d.getUTCFullYear() === now.getUTCFullYear() &&
    d.getUTCMonth() === now.getUTCMonth() &&
    d.getUTCDate() === now.getUTCDate()
  );
}

function isThisWeek(ts: string): boolean {
  const normalized = ts.endsWith("Z") || ts.includes("+") ? ts : ts + "Z";
  const diff = Date.now() - new Date(normalized).getTime();
  return diff < 7 * 24 * 60 * 60 * 1000;
}

const EVENT_CHIP_COLORS: Record<string, { bg: string; fg: string }> = {
  deploy:                 { bg: "rgba(59,130,246,0.15)",   fg: "#3B82F6" },
  hotfix:                 { bg: "rgba(249,115,22,0.15)",   fg: "#F97316" },
  sprint_run:             { bg: "rgba(168,85,247,0.15)",   fg: "#A855F7" },
  api_call:               { bg: "rgba(163,163,163,0.15)",  fg: "#A3A3A3" },
  dashboard_auto_improve: { bg: "rgba(34,197,94,0.15)",    fg: "#22C55E" },
  config_change:          { bg: "rgba(251,191,36,0.15)",   fg: "#FBBF24" },
};

function EventChip({ type }: { type: string }) {
  const colors = EVENT_CHIP_COLORS[type] ?? { bg: "rgba(163,163,163,0.12)", fg: "#A3A3A3" };
  return (
    <span style={{
      backgroundColor: colors.bg,
      color: colors.fg,
      fontSize: "10px",
      fontWeight: 700,
      padding: "2px 7px",
      borderRadius: "4px",
      letterSpacing: "0.05em",
      textTransform: "uppercase" as const,
      flexShrink: 0,
    }}>
      {type.replace(/_/g, " ")}
    </span>
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
      flexShrink: 0,
    }}>
      {domain || "general"}
    </span>
  );
}

const LOG_STATUS_COLOR: Record<string, string> = {
  success: "#22C55E",
  error: "#EF4444",
  warning: "#FBBF24",
  info: "#3B82F6",
};

export default function SystemPage() {
  const [agent, setAgent] = useState<{ status: string; last_active: string | null } | null>(null);
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [dashRes, corrRes, logRes] = await Promise.all([
        fetch(apiUrl("dashboard")),
        fetch(apiUrl("corrections")),
        fetch(apiUrl("log?limit=100")),
      ]);
      const dash = await dashRes.json();
      const corr = await corrRes.json();
      const log = await logRes.json();
      setAgent(dash.agent ?? null);
      setCorrections(Array.isArray(corr) ? corr : (corr.corrections ?? []));
      setLogs(Array.isArray(log) ? log : (log.logs ?? []));
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [load]);

  if (loading) {
    return (
      <div>
        <style>{`@keyframes shimmer { 0%,100%{opacity:1}50%{opacity:0.4} }`}</style>
        {[80, 240, 300].map((h, i) => (
          <div key={i} style={{
            height: `${h}px`,
            backgroundColor: "#141414",
            borderRadius: "4px",
            marginBottom: "20px",
            animation: "shimmer 1.5s ease-in-out infinite",
          }} />
        ))}
      </div>
    );
  }

  const isOnline = agent?.status === "online";
  const sessionsToday = logs.filter(l => isToday(l.created_at)).length;
  const correctionsThisWeek = corrections.filter(c => isThisWeek(c.created_at)).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <style>{`
        @keyframes onlinePulse { 0%,100%{opacity:1}50%{opacity:0.3} }
        .online-dot { animation: onlinePulse 2s ease-in-out infinite; }
      `}</style>

      {/* Agent Health */}
      <section>
        <div style={{
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: "0.1em",
          color: "#A3A3A3",
          textTransform: "uppercase" as const,
          marginBottom: "12px",
        }}>
          Agent Health
        </div>
        <div style={{
          backgroundColor: "#141414",
          border: "1px solid #2A2A2A",
          borderRadius: "4px",
          padding: "16px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "20px",
        }}>
          <div>
            <div style={{ fontSize: "11px", color: "#A3A3A3", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: "8px" }}>
              ZERO Status
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
              <span className="online-dot" style={{
                display: "inline-block",
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: isOnline ? "#22C55E" : "#EF4444",
              }} />
              <span style={{
                fontSize: "14px",
                fontWeight: 700,
                color: isOnline ? "#22C55E" : "#EF4444",
                letterSpacing: "0.05em",
              }}>
                {isOnline ? "ONLINE" : "OFFLINE"}
              </span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: "11px", color: "#A3A3A3", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: "8px" }}>
              Last Active
            </div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#F5F5F5" }}>
              {timeAgo(agent?.last_active ?? null)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "11px", color: "#A3A3A3", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: "8px" }}>
              Sessions Today
            </div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#F5F5F5", fontFamily: "monospace" }}>
              {sessionsToday}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "11px", color: "#A3A3A3", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: "8px" }}>
              Corrections This Week
            </div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#F5F5F5", fontFamily: "monospace" }}>
              {correctionsThisWeek}
            </div>
          </div>
        </div>
      </section>

      {/* Corrections History */}
      <section>
        <div style={{
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: "0.1em",
          color: "#A3A3A3",
          textTransform: "uppercase" as const,
          marginBottom: "12px",
        }}>
          Corrections History
        </div>
        <div style={{
          backgroundColor: "#141414",
          border: "1px solid #2A2A2A",
          borderRadius: "4px",
          maxHeight: "420px",
          overflowY: "auto",
        }}>
          {corrections.length === 0 ? (
            <p style={{ padding: "24px", textAlign: "center", color: "#A3A3A3", fontSize: "13px" }}>No corrections yet.</p>
          ) : (
            corrections.map(c => (
              <div key={c.id} style={{
                padding: "14px 16px",
                borderBottom: "1px solid #1A1A1A",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", flexWrap: "wrap" as const }}>
                  <span style={{
                    backgroundColor: "rgba(239,68,68,0.15)",
                    color: "#EF4444",
                    fontSize: "10px",
                    fontWeight: 700,
                    padding: "2px 7px",
                    borderRadius: "4px",
                    letterSpacing: "0.05em",
                    flexShrink: 0,
                  }}>CORRECTION</span>
                  <DomainBadge domain={c.domain} />
                  <span style={{ fontSize: "11px", color: "#A3A3A3", marginLeft: "auto" }}>{timeAgo(c.created_at)}</span>
                </div>
                <p style={{ fontSize: "13px", color: "#F5F5F5", marginBottom: c.corrected_behavior ? "8px" : 0 }}>
                  {c.description}
                </p>
                {c.corrected_behavior && (
                  <div style={{ borderTop: "1px solid #2A2A2A", paddingTop: "8px", marginTop: "4px" }}>
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
      </section>

      {/* Activity Log */}
      <section>
        <div style={{
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: "0.1em",
          color: "#A3A3A3",
          textTransform: "uppercase" as const,
          marginBottom: "12px",
        }}>
          Activity Log
        </div>
        <div style={{
          backgroundColor: "#141414",
          border: "1px solid #2A2A2A",
          borderRadius: "4px",
          maxHeight: "500px",
          overflowY: "auto",
        }}>
          {logs.length === 0 ? (
            <p style={{ padding: "24px", textAlign: "center", color: "#A3A3A3", fontSize: "13px" }}>No log entries.</p>
          ) : (
            logs.map((entry, i) => (
              <div key={entry.id} style={{
                padding: "8px 14px",
                backgroundColor: i % 2 === 0 ? "#141414" : "#111111",
                fontFamily: "'Fira Code', 'Fira Mono', monospace",
                fontSize: "12px",
                display: "flex",
                gap: "12px",
                alignItems: "center",
                borderBottom: "1px solid #1A1A1A",
                flexWrap: "wrap" as const,
              }}>
                <span style={{ color: "#A3A3A3", whiteSpace: "nowrap" as const, flexShrink: 0 }}>
                  {new Date(entry.created_at.endsWith("Z") ? entry.created_at : entry.created_at + "Z").toLocaleString()}
                </span>
                <span style={{ color: LOG_STATUS_COLOR[entry.status] ?? "#A3A3A3", fontWeight: 600, flexShrink: 0 }}>
                  {entry.status.toUpperCase()}
                </span>
                <EventChip type={entry.event_type} />
                <span style={{ color: "#A3A3A3", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, flex: 1 }}>
                  {entry.details ?? ""}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
