// src/app/layout.tsx

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Code Review Sentinel",
  description:
    "Hybrid AI code review tool detecting hallucinations, OWASP security vulnerabilities, and logic issues in AI-generated code.",
  keywords: [
    "code review",
    "AI security",
    "OWASP",
    "semgrep",
    "hallucination detection",
    "static analysis",
  ],
  authors: [{ name: "AI Code Review Sentinel" }],
  openGraph: {
    title: "AI Code Review Sentinel",
    description: "Detect AI code hallucinations and security vulnerabilities",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="dark" />
      </head>
      <body className="min-h-screen bg-sentinel-darker antialiased">
        <div className="relative">
          {/* Ambient background effects */}
          <div
            className="fixed inset-0 pointer-events-none"
            aria-hidden="true"
          >
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl" />
          </div>
          {children}
        </div>
      </body>
    </html>
  );
}
