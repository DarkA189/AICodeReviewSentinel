// src/lib/semgrep.ts
// Runs Semgrep CLI if available, falls back to pattern-based analysis.
// SAFE: No arbitrary code execution — Semgrep only reads code, never runs it.

import { execFile } from "child_process";
import { writeFile, unlink, mkdtemp } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { promisify } from "util";
import type { SemgrepFinding, SupportedLanguage } from "@/types/review";

const execFileAsync = promisify(execFile);

const LANGUAGE_EXTENSIONS: Record<SupportedLanguage, string> = {
  typescript: ".ts",
  javascript: ".js",
  python: ".py",
};

// Semgrep rulesets for security analysis
const SEMGREP_RULESETS: Record<SupportedLanguage, string[]> = {
  typescript: [
    "p/typescript",
    "p/javascript",
    "p/owasp-top-ten",
    "p/secrets",
  ],
  javascript: [
    "p/javascript",
    "p/owasp-top-ten",
    "p/secrets",
    "p/nodejs",
  ],
  python: [
    "p/python",
    "p/owasp-top-ten",
    "p/secrets",
    "p/bandit",
  ],
};

interface SemgrepOutput {
  results: Array<{
    check_id: string;
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
  }>;
  errors: Array<{ message: string }>;
}

export async function runSemgrep(
  code: string,
  language: SupportedLanguage
): Promise<{ findings: SemgrepFinding[]; available: boolean }> {
  if (process.env.ENABLE_SEMGREP !== "true") {
    return { findings: runPatternAnalysis(code, language), available: false };
  }

  // Check if semgrep is installed
  const semgrepAvailable = await checkSemgrepAvailable();
  if (!semgrepAvailable) {
    console.warn("Semgrep not available, using pattern analysis fallback");
    return { findings: runPatternAnalysis(code, language), available: false };
  }

  const tempDir = await mkdtemp(join(tmpdir(), "sentinel-"));
  const ext = LANGUAGE_EXTENSIONS[language];
  const tempFile = join(tempDir, `code${ext}`);

  try {
    await writeFile(tempFile, code, "utf-8");

    const rulesets = SEMGREP_RULESETS[language];
    const timeout = parseInt(process.env.SEMGREP_TIMEOUT ?? "30", 10) * 1000;

    const { stdout } = await execFileAsync(
      "semgrep",
      [
        "--json",
        "--quiet",
        "--timeout",
        String(Math.floor(timeout / 1000)),
        ...rulesets.flatMap((r) => ["--config", r]),
        tempFile,
      ],
      { timeout, maxBuffer: 10 * 1024 * 1024 }
    );

    const output = JSON.parse(stdout) as SemgrepOutput;

    const findings: SemgrepFinding[] = output.results.map((r) => ({
      ruleId: r.check_id,
      message: r.extra?.message ?? r.message,
      severity: r.severity,
      path: r.path,
      start: r.start,
      end: r.end,
      extra: r.extra,
    }));

    return { findings, available: true };
  } catch (error) {
    console.error("Semgrep execution error:", error);
    return { findings: runPatternAnalysis(code, language), available: false };
  } finally {
    // Cleanup temp files
    try {
      await unlink(tempFile);
    } catch {
      // ignore
    }
  }
}

async function checkSemgrepAvailable(): Promise<boolean> {
  try {
    await execFileAsync("semgrep", ["--version"], { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

// Pattern-based security analysis fallback (no exec required)
interface PatternRule {
  id: string;
  pattern: RegExp;
  message: string;
  severity: string;
  languages: SupportedLanguage[];
}

const PATTERN_RULES: PatternRule[] = [
  // Hardcoded secrets
  {
    id: "hardcoded-password",
    pattern: /(?:password|passwd|pwd|secret|api[_-]?key)\s*[=:]\s*["'][^"']{4,}["']/gi,
    message: "Hardcoded credential detected. Use environment variables.",
    severity: "ERROR",
    languages: ["typescript", "javascript", "python"],
  },
  // SQL injection
  {
    id: "sql-injection",
    pattern: /(?:query|execute|exec)\s*\(\s*[`"'].*\$\{|f["'].*SELECT.*\{/gi,
    message: "Potential SQL injection via string interpolation. Use parameterized queries.",
    severity: "ERROR",
    languages: ["typescript", "javascript", "python"],
  },
  // eval usage
  {
    id: "dangerous-eval",
    pattern: /\beval\s*\(/g,
    message: "Use of eval() is dangerous and can lead to code injection.",
    severity: "ERROR",
    languages: ["typescript", "javascript", "python"],
  },
  // innerHTML XSS
  {
    id: "xss-innerhtml",
    pattern: /\.innerHTML\s*=/g,
    message: "Setting innerHTML can lead to XSS. Use textContent or DOMPurify.",
    severity: "WARNING",
    languages: ["typescript", "javascript"],
  },
  // Weak crypto
  {
    id: "weak-crypto-md5",
    pattern: /\b(?:md5|sha1)\s*\(/gi,
    message: "MD5/SHA1 are cryptographically broken. Use SHA-256 or bcrypt for passwords.",
    severity: "WARNING",
    languages: ["typescript", "javascript", "python"],
  },
  // Math.random for security
  {
    id: "insecure-random",
    pattern: /Math\.random\(\)/g,
    message: "Math.random() is not cryptographically secure. Use crypto.getRandomValues().",
    severity: "WARNING",
    languages: ["typescript", "javascript"],
  },
  // Python pickle
  {
    id: "python-pickle",
    pattern: /import\s+pickle|pickle\.loads?\s*\(/g,
    message: "Pickle deserialization is dangerous with untrusted data.",
    severity: "ERROR",
    languages: ["python"],
  },
  // Python exec
  {
    id: "python-exec",
    pattern: /\bexec\s*\(/g,
    message: "exec() with untrusted input is a code injection risk.",
    severity: "ERROR",
    languages: ["python"],
  },
  // Prototype pollution
  {
    id: "prototype-pollution",
    pattern: /\[["']__proto__["']\]|\.constructor\.prototype/g,
    message: "Potential prototype pollution vulnerability.",
    severity: "ERROR",
    languages: ["typescript", "javascript"],
  },
  // Console.log with sensitive data
  {
    id: "logging-sensitive",
    pattern: /console\.\w+\([^)]*(?:password|token|secret|key)[^)]*\)/gi,
    message: "Sensitive data may be leaked through console logging.",
    severity: "WARNING",
    languages: ["typescript", "javascript"],
  },
  // Process.env in client code
  {
    id: "env-exposure",
    pattern: /process\.env\.[A-Z_]*(?:SECRET|KEY|PASSWORD|TOKEN)[A-Z_]*/g,
    message: "Secret env variable exposed — ensure this is server-side only.",
    severity: "WARNING",
    languages: ["typescript", "javascript"],
  },
  // Python shell injection
  {
    id: "python-shell-injection",
    pattern: /subprocess\.(?:call|run|Popen)\s*\([^,)]*\+/g,
    message: "Potential shell injection via string concatenation in subprocess call.",
    severity: "ERROR",
    languages: ["python"],
  },
];

function runPatternAnalysis(
  code: string,
  language: SupportedLanguage
): SemgrepFinding[] {
  const findings: SemgrepFinding[] = [];
  const lines = code.split("\n");

  const applicableRules = PATTERN_RULES.filter((r) =>
    r.languages.includes(language)
  );

  for (const rule of applicableRules) {
    rule.pattern.lastIndex = 0; // Reset regex state

    let match: RegExpExecArray | null;
    while ((match = rule.pattern.exec(code)) !== null) {
      // Calculate line number from match index
      const beforeMatch = code.slice(0, match.index);
      const lineNumber = beforeMatch.split("\n").length;
      const lineContent = lines[lineNumber - 1] ?? "";
      const col = (beforeMatch.split("\n").pop()?.length ?? 0) + 1;

      findings.push({
        ruleId: `sentinel.patterns.${rule.id}`,
        message: rule.message,
        severity: rule.severity,
        path: "code",
        start: { line: lineNumber, col },
        end: { line: lineNumber, col: col + match[0].length },
        extra: {
          message: rule.message,
          metadata: { matchedText: lineContent.trim() },
        },
      });

      // Prevent infinite loops on zero-width matches
      if (match.index === rule.pattern.lastIndex) {
        rule.pattern.lastIndex++;
      }
    }
  }

  return findings;
}
