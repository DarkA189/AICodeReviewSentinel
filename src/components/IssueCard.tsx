// src/components/IssueCard.tsx
"use client";
import { useState } from "react";
import { ChevronDown, Copy, Check, ExternalLink, Cpu } from "lucide-react";
import type { CodeIssue } from "@/types/review";

interface IssueCardProps {
  issue: CodeIssue;
  index: number;
}

const SEVERITY_CONFIG = {
  critical: { label: "CRITICAL", className: "severity-critical" },
  high: { label: "HIGH", className: "severity-high" },
  medium: { label: "MEDIUM", className: "severity-medium" },
  low: { label: "LOW", className: "severity-low" },
  info: { label: "INFO", className: "severity-info" },
};

const CATEGORY_ICONS: Record<string, string> = {
  security: "🛡️",
  correctness: "🎯",
  maintainability: "🔧",
  performance: "⚡",
  hallucination: "🔮",
};

export function IssueCard({ issue, index }: IssueCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const sevConfig = SEVERITY_CONFIG[issue.severity] ?? SEVERITY_CONFIG.info;

  const copyFix = async () => {
    const text = issue.fixedSnippet ?? issue.suggestedFix ?? "";
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`rounded-lg border transition-all duration-200 overflow-hidden animate-fade-in ${
        expanded ? "border-sentinel-border" : "border-sentinel-border/50"
      } ${issue.category === "hallucination" ? "border-purple-500/30" : ""}`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 hover:bg-white/3 transition-colors text-left"
      >
        <span className="text-lg shrink-0">{CATEGORY_ICONS[issue.category] ?? "⚠️"}</span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded ${sevConfig.className}`}>
              {sevConfig.label}
            </span>
            {issue.category === "hallucination" && (
              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded badge-hallucination flex items-center gap-1">
                <Cpu className="w-2.5 h-2.5" />
                HALLUCINATION
              </span>
            )}
            <span className="text-xs text-muted-foreground font-mono">
              L{issue.lineStart}{issue.lineEnd !== issue.lineStart ? `–${issue.lineEnd}` : ""}
            </span>
          </div>
          <div className="text-sm font-medium text-white mt-0.5 truncate">
            {issue.title}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground hidden sm:block">
            {issue.confidence}% conf.
          </span>
          <ChevronDown
            className={`w-4 h-4 text-muted-foreground transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-sentinel-border/50 pt-3">
          {/* Description */}
          <p className="text-sm text-muted-foreground leading-relaxed">
            {issue.description}
          </p>

          {/* OWASP reference */}
          {issue.owaspCategory && (
            <div className="flex items-center gap-2 text-xs">
              <a
                href="https://owasp.org/Top10/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sentinel-teal hover:text-white transition-colors"
              >
                📋 {issue.owaspCategory}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* Source label */}
          {issue.ruleId && (
            <div className="text-[10px] font-mono text-muted-foreground/60">
              Rule: {issue.ruleId}
            </div>
          )}

          {/* Original snippet */}
          {issue.originalSnippet && (
            <div>
              <div className="text-xs font-medium text-red-400 mb-1 flex items-center gap-1">
                <span>❌</span> Problematic Code
              </div>
              <pre className="text-xs font-mono bg-red-500/8 border border-red-500/20 rounded p-3 overflow-x-auto text-red-300 whitespace-pre-wrap">
                {issue.originalSnippet}
              </pre>
            </div>
          )}

          {/* Suggested fix */}
          {(issue.fixedSnippet || issue.suggestedFix) && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs font-medium text-green-400 flex items-center gap-1">
                  <span>✅</span>{" "}
                  {issue.fixedSnippet ? "Fixed Code" : "Suggested Fix"}
                </div>
                <button
                  onClick={copyFix}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground 
                             hover:text-white transition-colors px-2 py-0.5 rounded 
                             border border-sentinel-border hover:border-sentinel-blue"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-green-400" />
                      <span className="text-green-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copy patch
                    </>
                  )}
                </button>
              </div>
              <pre className="text-xs font-mono bg-green-500/8 border border-green-500/20 rounded p-3 overflow-x-auto text-green-300 whitespace-pre-wrap">
                {issue.fixedSnippet ?? issue.suggestedFix}
              </pre>
            </div>
          )}

          {/* Confidence bar */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground font-mono w-20">Confidence</span>
            <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sentinel-blue to-sentinel-teal transition-all"
                style={{ width: `${issue.confidence}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground font-mono w-8">{issue.confidence}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
