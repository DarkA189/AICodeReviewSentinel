// src/lib/review-orchestrator.ts

import { randomUUID } from "crypto";
import { runSemgrep } from "./semgrep";
import { runLLMReview } from "./llm-review";
import type {
  ReviewRequest,
  ReviewResult,
  CodeIssue,
  CategoryScore,
  SemgrepFinding,
  Severity,
  IssueCategory,
} from "@/types/review";

const MAX_CODE_SIZE = parseInt(process.env.MAX_CODE_SIZE ?? "50000", 10);

const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

export async function orchestrateReview(
  request: ReviewRequest
): Promise<ReviewResult> {
  const startTime = Date.now();

  // Validate input
  if (!request.code?.trim()) {
    throw new Error("Code cannot be empty");
  }
  if (request.code.length > MAX_CODE_SIZE) {
    throw new Error(
      `Code exceeds maximum size of ${MAX_CODE_SIZE} characters (got ${request.code.length})`
    );
  }

  const linesOfCode = request.code.split("\n").filter((l) => l.trim()).length;

  // Run Semgrep and LLM in parallel for speed
  const [semgrepResult, llmResult] = await Promise.all([
    runSemgrep(request.code, request.language).catch((err) => {
      console.error("Semgrep error:", err);
      return { findings: [], available: false };
    }),
    runLLMReview(
      request.code,
      request.language,
      [], // We'll pass semgrep findings in the next call if needed
      request.filename
    ),
  ]);

  // If semgrep found things LLM didn't mention, run a quick follow-up
  // For MVP: merge results directly
  const llmIssues: CodeIssue[] = llmResult.issues.map((issue, idx) => ({
    id: `llm-${idx}-${randomUUID().slice(0, 8)}`,
    category: issue.category as IssueCategory,
    severity: issue.severity as Severity,
    title: issue.title,
    description: issue.description,
    lineStart: issue.lineStart,
    lineEnd: issue.lineEnd,
    originalSnippet: issue.originalSnippet,
    suggestedFix: issue.suggestedFix,
    fixedSnippet: issue.fixedSnippet,
    confidence: issue.confidence,
    owaspCategory: issue.owaspCategory,
    source: "llm",
    ruleId: undefined,
  }));

  // Convert semgrep findings to CodeIssues (deduplicate with LLM findings)
  const semgrepIssues: CodeIssue[] = semgrepResult.findings
    .filter((finding) => !isDuplicateOfLLMIssue(finding, llmIssues))
    .map((finding, idx) => ({
      id: `semgrep-${idx}-${randomUUID().slice(0, 8)}`,
      category: categorizeFromSemgrepRule(finding.ruleId),
      severity: normalizeSemgrepSeverity(finding.severity),
      title: formatSemgrepTitle(finding.ruleId),
      description: finding.message,
      lineStart: finding.start.line,
      lineEnd: finding.end.line,
      confidence: 85, // Semgrep rules are high-confidence
      source: "semgrep",
      ruleId: finding.ruleId,
      owaspCategory: extractOwaspCategory(finding.ruleId),
    }));

  // Merge and deduplicate all issues
  const allIssues: CodeIssue[] = [...llmIssues, ...semgrepIssues].sort(
    (a, b) => {
      const sevDiff = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
      if (sevDiff !== 0) return sevDiff;
      return a.lineStart - b.lineStart;
    }
  );

  // Build category scores
  const scores: CategoryScore[] = [
    {
      category: "security",
      score: llmResult.scores.security.score,
      confidence: llmResult.scores.security.confidence,
      summary: llmResult.scores.security.summary,
    },
    {
      category: "correctness",
      score: llmResult.scores.correctness.score,
      confidence: llmResult.scores.correctness.confidence,
      summary: llmResult.scores.correctness.summary,
    },
    {
      category: "maintainability",
      score: llmResult.scores.maintainability.score,
      confidence: llmResult.scores.maintainability.confidence,
      summary: llmResult.scores.maintainability.summary,
    },
    {
      category: "performance",
      score: llmResult.scores.performance.score,
      confidence: llmResult.scores.performance.confidence,
      summary: llmResult.scores.performance.summary,
    },
  ];

  // Penalize score for semgrep security findings
  const semgrepSecurityPenalty = semgrepIssues
    .filter((i) => i.category === "security")
    .reduce((acc, i) => {
      const penalties: Record<Severity, number> = {
        critical: 20,
        high: 10,
        medium: 5,
        low: 2,
        info: 0,
      };
      return acc + (penalties[i.severity] ?? 0);
    }, 0);

  if (semgrepSecurityPenalty > 0) {
    const secScore = scores.find((s) => s.category === "security");
    if (secScore) {
      secScore.score = Math.max(0, secScore.score - semgrepSecurityPenalty);
      secScore.summary = `${secScore.summary} (Penalized ${semgrepSecurityPenalty}pts for ${semgrepIssues.filter((i) => i.category === "security").length} Semgrep security findings)`;
    }
  }

  const overallScore = Math.round(
    scores.reduce((acc, s) => acc + s.score, 0) / scores.length
  );

  const provider = process.env.LLM_PROVIDER ?? "anthropic";
  const model = process.env.LLM_MODEL ?? "claude-sonnet-4-5";

  return {
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    language: request.language,
    filename: request.filename,
    issues: allIssues,
    scores,
    overallScore,
    summary: llmResult.summary,
    semgrepAvailable: semgrepResult.available,
    llmProvider: `${provider}/${model}`,
    processingTimeMs: Date.now() - startTime,
    linesOfCode,
  };
}

// --- Helper functions ---

function isDuplicateOfLLMIssue(
  finding: SemgrepFinding,
  llmIssues: CodeIssue[]
): boolean {
  return llmIssues.some(
    (issue) =>
      Math.abs(issue.lineStart - finding.start.line) <= 2 &&
      issue.category === categorizeFromSemgrepRule(finding.ruleId)
  );
}

function categorizeFromSemgrepRule(ruleId: string): IssueCategory {
  const lower = ruleId.toLowerCase();
  if (
    lower.includes("security") ||
    lower.includes("owasp") ||
    lower.includes("injection") ||
    lower.includes("xss") ||
    lower.includes("secret") ||
    lower.includes("password") ||
    lower.includes("crypto") ||
    lower.includes("auth")
  )
    return "security";
  if (lower.includes("perf") || lower.includes("performance"))
    return "performance";
  if (
    lower.includes("style") ||
    lower.includes("maintainability") ||
    lower.includes("quality")
  )
    return "maintainability";
  return "security"; // Default for pattern rules
}

function normalizeSemgrepSeverity(severity: string): Severity {
  const map: Record<string, Severity> = {
    ERROR: "high",
    WARNING: "medium",
    INFO: "low",
    CRITICAL: "critical",
    HIGH: "high",
    MEDIUM: "medium",
    LOW: "low",
  };
  return map[severity.toUpperCase()] ?? "medium";
}

function formatSemgrepTitle(ruleId: string): string {
  // Convert "sentinel.patterns.sql-injection" → "SQL Injection Detected"
  const parts = ruleId.split(".");
  const last = parts[parts.length - 1] ?? ruleId;
  return last
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function extractOwaspCategory(ruleId: string): string | undefined {
  const owaspMap: Record<string, string> = {
    "sql-injection": "A03:2021 – Injection",
    "xss": "A03:2021 – Injection",
    "xss-innerhtml": "A03:2021 – Injection",
    "hardcoded-password": "A07:2021 – Identification and Authentication Failures",
    "insecure-random": "A02:2021 – Cryptographic Failures",
    "weak-crypto-md5": "A02:2021 – Cryptographic Failures",
    "prototype-pollution": "A08:2021 – Software and Data Integrity Failures",
    "dangerous-eval": "A03:2021 – Injection",
    "python-pickle": "A08:2021 – Software and Data Integrity Failures",
    "python-exec": "A03:2021 – Injection",
    "python-shell-injection": "A03:2021 – Injection",
    "logging-sensitive": "A09:2021 – Security Logging and Monitoring Failures",
    "env-exposure": "A02:2021 – Cryptographic Failures",
  };

  const ruleKey = ruleId.split(".").pop() ?? "";
  return owaspMap[ruleKey];
}
