import type { Metadata } from "next";
import "./globals.css";
import Nav from "./nav";

export const metadata: Metadata = {
  title: "ZERO Dashboard",
  description: "ZERO Agent Operations Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ backgroundColor: "#0A0A0A", color: "#F5F5F5", minHeight: "100vh" }}>
        <Nav />
        <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "76px 16px 40px" }}>
          {children}
        </main>
      </body>
    </html>
  );
}
