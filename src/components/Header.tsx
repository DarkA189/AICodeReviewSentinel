// src/components/Header.tsx
"use client";
import { Shield, Github, ExternalLink } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-sentinel-border bg-sentinel-darker/90 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Shield className="w-6 h-6 text-sentinel-blue" />
            <div className="absolute inset-0 text-sentinel-blue opacity-30 blur-sm">
              <Shield className="w-6 h-6" />
            </div>
          </div>
          <span className="font-display font-bold text-white tracking-tight">
            AI Code Review{" "}
            <span className="text-sentinel-blue">Sentinel</span>
          </span>
          <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-sentinel-blue/15 text-sentinel-blue border border-sentinel-blue/30">
            v1.0
          </span>
        </div>

        <nav className="flex items-center gap-4">
          <a
            href="https://owasp.org/Top10/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground hover:text-white transition-colors"
          >
            OWASP Ref
            <ExternalLink className="w-3 h-3" />
          </a>
          <a
            href="https://github.com/your-username/ai-code-review-sentinel"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors"
          >
            <Github className="w-4 h-4" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
          <div className="flex items-center gap-1.5 text-xs">
            <div className="w-1.5 h-1.5 rounded-full bg-sentinel-green animate-pulse" />
            <span className="text-muted-foreground">Online</span>
          </div>
        </nav>
      </div>
    </header>
  );
}
