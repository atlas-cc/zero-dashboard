"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Nav() {
  const path = usePathname();

  return (
    <nav style={{
      backgroundColor: "#0A0A0A",
      borderBottom: "1px solid #2A2A2A",
      padding: "0 24px",
      height: "52px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 50,
    }}>
      <style>{`
        @keyframes livePulse { 0%,100%{opacity:1}50%{opacity:0.3} }
        .live-dot { animation: livePulse 2s ease-in-out infinite; }
      `}</style>
      <span style={{
        fontSize: "16px",
        fontWeight: 700,
        letterSpacing: "0.2em",
        color: "#F5F5F5",
        fontFamily: "monospace",
      }}>
        ZERO
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        {[
          { href: "/", label: "Dashboard" },
          { href: "/tasks", label: "Tasks" },
          { href: "/system", label: "System" },
        ].map(({ href, label }) => {
          const active = path === href;
          return (
            <Link
              key={href}
              href={href}
              style={{
                color: active ? "#F5F5F5" : "#A3A3A3",
                textDecoration: "none",
                fontSize: "13px",
                fontWeight: active ? 600 : 500,
                padding: "6px 12px",
                borderRadius: "4px",
                backgroundColor: active ? "#1E1E1E" : "transparent",
              }}
            >
              {label}
            </Link>
          );
        })}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          marginLeft: "12px",
          padding: "4px 10px",
          backgroundColor: "rgba(34,197,94,0.08)",
          borderRadius: "4px",
          border: "1px solid rgba(34,197,94,0.2)",
        }}>
          <span className="live-dot" style={{
            display: "inline-block",
            width: 7,
            height: 7,
            borderRadius: "50%",
            backgroundColor: "#22C55E",
          }} />
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#22C55E", letterSpacing: "0.08em" }}>LIVE</span>
        </div>
      </div>
    </nav>
  );
}
