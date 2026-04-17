// src/components/ReviewDashboard.tsx
"use client";
import { useState } from "react";
import type { ReviewResult, Severity, IssueCategory } from "@/types/review";
import { ScoreRing } from "./ScoreRing";
import { IssueCard } from "./IssueCard";
import { DiffViewer } from "./DiffViewer";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Shield, AlertTriangle, Zap, Wrench, Target,
  Clock, Code2, Cpu, Filter
} from "lucide-react";

interface ReviewDashboardProps {
  result: ReviewResult;
  originalCode: string;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  security: <Shield className="w-3.5 h-3.5" />,
  correctness: <Target className="w-3.5 h-3.5" />,
  maintainability: <Wrench className="w-3.5 h-3.5" />,
  performance: <Zap className="w-3.5 h-3.5" />,
  hallucination: <Cpu className="w-3.5 h-3.5" />,
};

const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 0, high: 1, medium: 2, low: 3, info: 4
};

export function ReviewDashboard({ result, originalCode }: ReviewDashboardProps) {
  const [filterSeverity, setFilterSeverity] = useState<Severity | "all">("all");
  const [filterCategory, setFilterCategory] = useState<IssueCategory | "all">("all");

  const filteredIssues = result.issues.filter((issue) => {
    if (filterSeverity !== "all" && issue.severity !== filterSeverity) return false;
    if (filterCategory !== "all" && issue.category !== filterCategory) return false;
    return true;
  });

  const criticalCount = result.issues.filter((i) => i.severity === "critical").length;
  const highCount = result.issues.filter((i) => i.severity === "high").length;
  const hallucinationCount = result.issues.filter((i) => i.category === "hallucination").length;

  const overallColor =
    result.overallScore >= 80 ? "text-green-400"
    : result.overallScore >= 60 ? "text-yellow-400"
    : result.overallScore >= 40 ? "text-orange-400"
    : "text-red-400";

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Score overview */}
      <div className="sentinel-panel rounded-xl border border-sentinel-border p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="font-display font-semibold text-white text-base">
              Analysis Complete
            </h2>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {result.processingTimeMs}ms
              </span>
              <span className="flex items-center gap-1">
                <Code2 className="w-3 h-3" />
                {result.linesOfCode} LOC
              </span>
              <span className="font-mono text-[10px]">{result.llmProvider}</span>
            </div>
          </div>

          {/* Overall score */}
          <div className="text-right">
            <div className={`font-display text-4xl font-bold tabular-nums ${overallColor}`}>
              {result.overallScore}
            </div>
            <div className="text-xs text-muted-foreground">/100 overall</div>
          </div>
        </div>

        {/* Category scores */}
        <div className="grid grid-cols-4 gap-4 px-2 py-3">
          {result.scores.map((score) => (
            <ScoreRing
              key={score.category}
              score={score.score}
              size={72}
              label={score.category}
              sublabel={`${score.confidence}% conf`}
            />
          ))}
        </div>

        {/* Semgrep badge */}
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
            result.semgrepAvailable
              ? "border-green-500/30 text-green-400 bg-green-500/10"
              : "border-yellow-500/30 text-yellow-400 bg-yellow-500/10"
          }`}>
            {result.semgrepAvailable ? "✓ Semgrep Active" : "⚡ Pattern Analysis (Semgrep unavailable)"}
          </span>
          {criticalCount > 0 && (
            <span className="severity-critical text-[10px] font-mono px-2 py-0.5 rounded">
              {criticalCount} CRITICAL
            </span>
          )}
          {highCount > 0 && (
            <span className="severity-high text-[10px] font-mono px-2 py-0.5 rounded">
              {highCount} HIGH
            </span>
          )}
          {hallucinationCount > 0 && (
            <span className="badge-hallucination text-[10px] font-mono px-2 py-0.5 rounded flex items-center gap-1">
              <Cpu className="w-2.5 h-2.5" />
              {hallucinationCount} Hallucination{hallucinationCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Summary */}
        <p className="mt-3 text-xs text-muted-foreground leading-relaxed border-t border-sentinel-border pt-3">
          {result.summary}
        </p>
      </div>

      {/* Issues tabs */}
      <div className="sentinel-panel rounded-xl border border-sentinel-border p-4">
        <Tabs defaultValue="issues">
          <div className="flex items-center justify-between mb-3">
            <TabsList className="bg-black/30 border border-sentinel-border">
              <TabsTrigger value="issues" className="text-xs data-[state=active]:bg-sentinel-panel">
                Issues ({result.issues.length})
              </TabsTrigger>
              <TabsTrigger value="diff" className="text-xs data-[state=active]:bg-sentinel-panel">
                Diff View
              </TabsTrigger>
            </TabsList>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <Filter className="w-3 h-3 text-muted-foreground" />
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value as Severity | "all")}
                className="text-[10px] font-mono bg-transparent border border-sentinel-border rounded px-1.5 py-0.5 text-muted-foreground"
              >
                <option value="all">All severity</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value as IssueCategory | "all")}
                className="text-[10px] font-mono bg-transparent border border-sentinel-border rounded px-1.5 py-0.5 text-muted-foreground"
              >
                <option value="all">All categories</option>
                <option value="security">Security</option>
                <option value="correctness">Correctness</option>
                <option value="maintainability">Maintainability</option>
                <option value="performance">Performance</option>
                <option value="hallucination">Hallucination</option>
              </select>
            </div>
          </div>

          <TabsContent value="issues">
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {filteredIssues.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  {result.issues.length === 0
                    ? "🎉 No issues found! Clean code."
                    : "No issues match the current filters."}
                </div>
              ) : (
                filteredIssues.map((issue, idx) => (
                  <IssueCard key={issue.id} issue={issue} index={idx} />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="diff">
            <div className="max-h-[520px] overflow-y-auto pr-1">
              <DiffViewer issues={result.issues} originalCode={originalCode} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
