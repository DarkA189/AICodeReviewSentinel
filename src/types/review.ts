// src/types/review.ts

export type SupportedLanguage = "typescript" | "javascript" | "python";

export type Severity = "critical" | "high" | "medium" | "low" | "info";

export type IssueCategory =
  | "security"
  | "correctness"
  | "maintainability"
  | "performance"
  | "hallucination";

export interface CodeIssue {
  id: string;
  category: IssueCategory;
  severity: Severity;
  title: string;
  description: string;
  lineStart: number;
  lineEnd: number;
  column?: number;
  ruleId?: string;
  owaspCategory?: string;
  suggestedFix?: string;
  originalSnippet?: string;
  fixedSnippet?: string;
  confidence: number; // 0-100
  source: "semgrep" | "llm" | "hybrid";
}

export interface CategoryScore {
  category: IssueCategory | "overall";
  score: number; // 0-100 (100 = perfect)
  confidence: number; // 0-100
  summary: string;
}

export interface SemgrepFinding {
  ruleId: string;
  message: string;
  severity: string;
  path: string;
  start: { line: number; col: number };
  end: { line: number; col: number };
  extra?: {
    message?: string;
    metadata?: Record<string, unknown>;
    fix?: string;
  };
}

export interface ReviewRequest {
  code: string;
  language: SupportedLanguage;
  filename?: string;
  context?: string;
}

export interface ReviewResult {
  id: string;
  timestamp: string;
  language: SupportedLanguage;
  filename?: string;
  issues: CodeIssue[];
  scores: CategoryScore[];
  overallScore: number;
  summary: string;
  semgrepAvailable: boolean;
  llmProvider: string;
  processingTimeMs: number;
  linesOfCode: number;
}

export interface ReviewResponse {
  success: boolean;
  result?: ReviewResult;
  error?: string;
}

// LLM response schema
export interface LLMReviewResponse {
  scores: {
    security: { score: number; confidence: number; summary: string };
    correctness: { score: number; confidence: number; summary: string };
    maintainability: { score: number; confidence: number; summary: string };
    performance: { score: number; confidence: number; summary: string };
  };
  issues: Array<{
    category: IssueCategory;
    severity: Severity;
    title: string;
    description: string;
    lineStart: number;
    lineEnd: number;
    originalSnippet?: string;
    suggestedFix?: string;
    fixedSnippet?: string;
    confidence: number;
    owaspCategory?: string;
  }>;
  summary: string;
  hallucinationFlags: string[];
}
