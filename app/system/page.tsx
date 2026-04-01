"use client";

import { useEffect, useState, useCallback } from "react";
import type { Correction, AgentLog } from "../../lib/types";

const _BASE = typeof window !== "undefined" && window.location.protocol === "https:"
  ? ""
  : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:7779");
function apiUrl(path: string) {
  return _BASE ? `${_BASE}/api/${path}` : `/api/proxy/path?p=${encodeURIComponent(path)}`;
}
const API_URL = _BASE; // legacy compat

interface Costs {
  today_usd: number;
  week_usd: number;
  month_usd: number;
  today_tokens: number;
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

const LOG_STATUS_COLOR: Record<string, string> = {
  success: "#22C55E",
  error: "#EF4444",
  warning: "#FBBF24",
  info: "#3B82F6",
};

export default function SystemPage() {
  const [costs, setCosts] = useState<Costs | null>(null);
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
      setCosts(dash.costs);
      setCorrections(Array.isArray(corr) ? corr : corr.corrections || []);
      setLogs(Array.isArray(log) ? log : log.logs || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <div style={{ color: "#A3A3A3", textAlign: "center", padding: "60px" }}>Loading...</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#F5F5F5", letterSpacing: "0.02em" }}>
        System
      </h1>

      {/* Cost Breakdown */}
      <section>
        <h2 style={{ fontSize: "12px", fontWeight: 700, color: "#A3A3A3", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "12px" }}>
          Cost Breakdown
        </h2>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "12px",
        }}>
          <CostCard label="Today" value={`$${(costs?.today_usd ?? 0).toFixed(4)}`} />
          <CostCard label="This Week" value={`$${(costs?.week_usd ?? 0).toFixed(4)}`} />
          <CostCard label="This Month" value={`$${(costs?.month_usd ?? 0).toFixed(4)}`} />
          <CostCard label="Tokens Today" value={(costs?.today_tokens ?? 0).toLocaleString()} mono />
        </div>
      </section>

      {/* Corrections History */}
      <section>
        <h2 style={{ fontSize: "12px", fontWeight: 700, color: "#A3A3A3", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "12px" }}>
          Corrections History
        </h2>
        <div style={{
          backgroundColor: "#141414",
          border: "1px solid #2A2A2A",
          borderRadius: "4px",
          maxHeight: "360px",
          overflowY: "auto",
          padding: "8px 0",
        }}>
          {corrections.length === 0 ? (
            <p style={{ padding: "24px", textAlign: "center", color: "#A3A3A3", fontSize: "13px" }}>No corrections yet.</p>
          ) : (
            corrections.map(c => (
              <div key={c.id} style={{
                padding: "12px 16px",
                borderBottom: "1px solid #2A2A2A",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", marginBottom: "4px" }}>
                  <span style={{ fontSize: "13px", color: "#F5F5F5" }}>{c.description}</span>
                  <span style={{ fontSize: "11px", color: "#A3A3A3", whiteSpace: "nowrap", flexShrink: 0 }}>{timeAgo(c.created_at)}</span>
                </div>
                {c.corrected_behavior && (
                  <p style={{ fontSize: "12px", color: "#22C55E", marginBottom: "4px" }}>Correct: {c.corrected_behavior}</p>
                )}
                <span style={{
                  backgroundColor: "rgba(59,130,246,0.15)",
                  color: "#3B82F6",
                  fontSize: "10px",
                  fontWeight: 600,
                  padding: "2px 6px",
                  borderRadius: "4px",
                  textTransform: "uppercase",
                }}>
                  {c.domain}
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Agent Log */}
      <section>
        <h2 style={{ fontSize: "12px", fontWeight: 700, color: "#A3A3A3", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "12px" }}>
          Agent Log
        </h2>
        <div style={{
          backgroundColor: "#141414",
          border: "1px solid #2A2A2A",
          borderRadius: "4px",
          overflow: "hidden",
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
                display: "grid",
                gridTemplateColumns: "140px 80px 80px 1fr 100px",
                gap: "12px",
                alignItems: "center",
                borderBottom: "1px solid #1A1A1A",
              }}>
                <span style={{ color: "#A3A3A3" }}>
                  {new Date(entry.created_at.endsWith("Z") ? entry.created_at : entry.created_at + "Z").toLocaleString()}
                </span>
                <span style={{ color: LOG_STATUS_COLOR[entry.status] ?? "#A3A3A3", fontWeight: 600 }}>
                  {entry.status.toUpperCase()}
                </span>
                <span style={{ color: "#F5F5F5" }}>{entry.event_type}</span>
                <span style={{ color: "#A3A3A3", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {entry.details ?? ""}
                </span>
                <span style={{ color: "#A3A3A3", textAlign: "right" }}>
                  {entry.tokens_used > 0 ? `${entry.tokens_used.toLocaleString()} tok` : ""}
                  {entry.cost_usd > 0 ? ` $${entry.cost_usd.toFixed(4)}` : ""}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function CostCard({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{
      backgroundColor: "#141414",
      border: "1px solid #2A2A2A",
      borderRadius: "4px",
      padding: "20px 16px",
    }}>
      <p style={{ fontSize: "11px", color: "#A3A3A3", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
        {label}
      </p>
      <p style={{
        fontSize: "24px",
        fontWeight: 700,
        color: "#F5F5F5",
        fontFamily: mono ? "'Fira Code', monospace" : "inherit",
        letterSpacing: "-0.02em",
      }}>
        {value}
      </p>
    </div>
  );
}
