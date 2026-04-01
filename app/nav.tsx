"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Nav() {
  const path = usePathname();

  return (
    <nav style={{
      backgroundColor: "#141414",
      borderBottom: "1px solid #2A2A2A",
      padding: "0 24px",
      height: "52px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      position: "sticky",
      top: 0,
      zIndex: 50,
    }}>
      <span style={{
        fontSize: "16px",
        fontWeight: 700,
        letterSpacing: "0.2em",
        color: "#F5F5F5",
        fontFamily: "monospace",
      }}>
        ZERO
      </span>
      <div style={{ display: "flex", gap: "4px" }}>
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
                transition: "all 0.15s",
              }}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
