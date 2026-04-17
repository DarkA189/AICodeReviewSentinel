// src/components/DiffViewer.tsx
"use client";
import dynamic from "next/dynamic";
import type { CodeIssue } from "@/types/review";

// SSR-safe diff viewer
const ReactDiffViewer = dynamic(
  () => import("react-diff-viewer-continued"),
  { ssr: false, loading: () => <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">Loading diff...</div> }
);

interface DiffViewerProps {
  issues: CodeIssue[];
  originalCode: string;
}

export function DiffViewer({ issues, originalCode }: DiffViewerProps) {
  const fixableIssues = issues.filter(
    (i) => i.fixedSnippet && i.originalSnippet
  );

  if (fixableIssues.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No auto-fixable issues with diff available.
        <br />
        <span className="text-xs">Issues with suggested fixes appear as cards above.</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {fixableIssues.slice(0, 5).map((issue) => (
        <div key={issue.id} className="rounded-lg overflow-hidden border border-sentinel-border">
          <div className="px-3 py-2 bg-black/30 border-b border-sentinel-border flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground">
              L{issue.lineStart}–{issue.lineEnd}
            </span>
            <span className="text-xs font-medium text-white">{issue.title}</span>
          </div>
          <div className="diff-container text-xs overflow-x-auto">
            <ReactDiffViewer
              oldValue={issue.originalSnippet ?? ""}
              newValue={issue.fixedSnippet ?? ""}
              splitView={false}
              useDarkTheme={true}
              hideLineNumbers={false}
              styles={{
                variables: {
                  dark: {
                    diffViewerBackground: "#0d0d14",
                    diffViewerColor: "#e2e8f0",
                    addedBackground: "#0d2818",
                    addedColor: "#4ade80",
                    removedBackground: "#2d0e14",
                    removedColor: "#f87171",
                    wordAddedBackground: "#1a3d28",
                    wordRemovedBackground: "#3d1520",
                    gutterBackground: "#0a0a0f",
                    gutterColor: "#4a4a6a",
                  },
                },
                line: { fontFamily: "'JetBrains Mono', monospace", fontSize: "12px" },
              }}
            />
          </div>
        </div>
      ))}
      {fixableIssues.length > 5 && (
        <p className="text-xs text-muted-foreground text-center">
          Showing 5 of {fixableIssues.length} fixable issues.
        </p>
      )}
    </div>
  );
}
