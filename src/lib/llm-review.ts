// src/lib/llm-review.ts

import type {
  LLMReviewResponse,
  SemgrepFinding,
  SupportedLanguage,
  IssueCategory,
  Severity,
} from "@/types/review";

const SYSTEM_PROMPT = `You are an elite AI Code Review Sentinel — a specialized security and quality auditor designed to catch issues in AI-generated code that is "almost right" but subtly wrong.

Your mission: Perform a rigorous hybrid analysis combining security auditing, correctness verification, and hallucination detection.

## Review Framework

### 1. SECURITY (OWASP Top 10 + Common AI Hallucinations)
- Injection flaws (SQL, NoSQL, Command, LDAP injection)
- Broken authentication & session management
- Sensitive data exposure (hardcoded secrets, insecure storage)
- XML/JSON External Entity (XXE) processing
- Broken access control & privilege escalation
- Security misconfiguration
- Cross-Site Scripting (XSS) & CSRF
- Insecure deserialization
- Using vulnerable/deprecated dependencies
- Insufficient logging & monitoring
- AI hallucinations: non-existent security functions, wrong crypto primitives, invented API methods

### 2. CORRECTNESS
- Logic errors and off-by-one bugs
- Race conditions and concurrency issues
- Null/undefined reference errors
- Type mismatches and implicit coercions
- Edge cases not handled (empty arrays, null inputs, overflow)
- AI hallucinations: invented library methods, wrong function signatures, fabricated stdlib functions

### 3. MAINTAINABILITY
- Code duplication without abstraction
- Magic numbers/strings without constants
- Missing or misleading error handling
- Deeply nested logic (complexity > 10)
- Missing type annotations in typed languages
- Dead code or unused imports

### 4. PERFORMANCE
- N+1 query patterns
- Missing memoization on expensive computations
- Synchronous blocking in async contexts
- Memory leaks (unclosed handles, growing closures)
- Inefficient algorithms (O(n²) where O(n log n) exists)

## HALLUCINATION DETECTION — Critical Priority
Flag when you detect:
- Function/method calls that do NOT exist in the standard library or specified framework
- Incorrect parameter signatures for real functions
- Non-existent npm/pip packages referenced
- Security patterns that are backwards
- Invented language features
- APIs that exist but are used with wrong semantics

## CRITICAL: Output format requirements
1. ALL property names MUST have BOTH opening AND closing quotes: "propertyName":
2. ALL scores and confidence values MUST be numbers (0-100), NOT words
3. Respond with ONLY valid JSON - no extra text before or after
4. No trailing commas

## Output Format (copy this structure exactly):
{
  "scores": {
    "security": { "score": 85, "confidence": 90, "summary": "string" },
    "correctness": { "score": 75, "confidence": 85, "summary": "string" },
    "maintainability": { "score": 65, "confidence": 80, "summary": "string" },
    "performance": { "score": 70, "confidence": 75, "summary": "string" }
  },
  "issues": [
    {
      "category": "security",
      "severity": "critical",
      "title": "Brief title",
      "description": "Detailed explanation",
      "lineStart": 1,
      "lineEnd": 5,
      "originalSnippet": "code",
      "suggestedFix": "explanation",
      "fixedSnippet": "fixed code",
      "confidence": 85,
      "owaspCategory": "A01:2021 – Broken Access Control"
    }
  ],
  "summary": "Executive summary of the code quality",
  "hallucinationFlags": ["list", "of", "hallucinations"]
}

Valid category values: "security", "correctness", "maintainability", "performance", "hallucination"
Valid severity values: "critical", "high", "medium", "low", "info"

REMEMBER: Every property name needs BOTH quotes: "propertyName": not propertyName":`;

function buildUserPrompt(
  code: string,
  language: SupportedLanguage,
  semgrepFindings: SemgrepFinding[],
  filename?: string
): string {
  const semgrepSection =
    semgrepFindings.length > 0
      ? `\n\n## Semgrep Static Analysis Findings (pre-validated, incorporate these)\n${JSON.stringify(semgrepFindings, null, 2)}`
      : "\n\n## Semgrep: Not available or no findings — rely on LLM analysis.";

  return `Review this ${language} code${filename ? ` (${filename})` : ""}:

\`\`\`${language}
${code}
\`\`\`
${semgrepSection}

Provide your complete JSON review now. Be precise with line numbers (1-indexed). Flag ALL issues including subtle AI hallucinations.

CRITICAL: Every property must have BOTH opening and closing quotes: "property": not property":`;
}

export async function runLLMReview(
  code: string,
  language: SupportedLanguage,
  semgrepFindings: SemgrepFinding[],
  filename?: string
): Promise<LLMReviewResponse> {
  const provider = process.env.LLM_PROVIDER ?? "anthropic";
  const userPrompt = buildUserPrompt(code, language, semgrepFindings, filename);

  if (provider === "anthropic") {
    return runAnthropicReview(userPrompt);
  } else if (provider === "openai") {
    return runOpenAIReview(userPrompt);
  } else {
    throw new Error(`Unknown LLM_PROVIDER: ${provider}`);
  }
}

async function runAnthropicReview(
  userPrompt: string
): Promise<LLMReviewResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const model = process.env.LLM_MODEL ?? "claude-sonnet-4-5";

  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey });

  const message = await client.messages.create({
    model,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const textContent = message.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text content in LLM response");
  }

  return parseJSONResponse(textContent.text);
}

async function runOpenAIReview(
  userPrompt: string
): Promise<LLMReviewResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");

  const baseURL = process.env.OPENAI_BASE_URL;
  const model = process.env.LLM_MODEL ?? "gpt-4o";

  const OpenAI = (await import("openai")).default;
  const client = new OpenAI({ 
    apiKey,
    baseURL,
    defaultHeaders: baseURL ? {
      "HTTP-Referer": process.env.APP_URL ?? "http://localhost:3000",
      "X-Title": "AI Code Review Sentinel"
    } : undefined
  });

  const isFreeModel = model.includes("free") || 
                      model.includes("8b") ||
                      model.includes("7b") ||
                      model.includes("3b") ||
                      model.includes("4b") ||
                      model.includes("versatile");
  
  const completionParams: any = {
    model,
    max_tokens: 8000,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.1, // Very low for consistent JSON
  };

  // Only add response_format for models that support it
  if (!isFreeModel && !model.includes("openrouter") && !model.includes("llama")) {
    completionParams.response_format = { type: "json_object" };
  }

  console.log(`[LLM] Using model: ${model}`);

  const completion = await client.chat.completions.create(completionParams);
  const text = completion.choices[0]?.message?.content;
  
  if (!text || text.trim().length === 0) {
    throw new Error("Model returned empty response");
  }

  console.log(`[LLM] ✓ Success with model: ${model}, Response length: ${text.length} chars`);

  return parseJSONResponse(text);
}

// SUPER AGGRESSIVE QUOTE FIXER - Handles all missing quote patterns
function fixAllMissingQuotes(json: string): string {
  // This is the nuclear option - fix EVERY instance of missing opening quotes
  
  // Pattern 1: After whitespace + word + ": → "word":
  // This catches: \s+word": → "word":
  json = json.replace(/(\s+)([a-zA-Z_][a-zA-Z0-9_]*)(":\s*)/g, '$1"$2$3');
  
  // Pattern 2: After comma + spaces + word + ": → "word":
  json = json.replace(/(,\s*)([a-zA-Z_][a-zA-Z0-9_]*)(":\s*)/g, '$1"$2$3');
  
  // Pattern 3: After opening brace + spaces + word + ": → "word":
  json = json.replace(/(\{\s*)([a-zA-Z_][a-zA-Z0-9_]*)(":\s*)/g, '$1"$2$3');
  
  // Pattern 4: At start of line + word + ": → "word":
  json = json.replace(/^(\s*)([a-zA-Z_][a-zA-Z0-9_]*)(":\s*)/gm, '$1"$2$3');
  
  // Pattern 5: After ] + spaces + word + ": → "word":
  json = json.replace(/(\]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(":\s*)/g, '$1"$2$3');
  
  return json;
}

function fixNumberWords(json: string): string {
  const numberWords: Record<string, string> = {
    'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
    'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9',
    'ten': '10', 'twenty': '20', 'thirty': '30', 'forty': '40', 
    'fifty': '50', 'sixty': '60', 'seventy': '70', 'eighty': '80', 
    'ninety': '90', 'hundred': '100'
  };

  for (const [word, num] of Object.entries(numberWords)) {
    const regex = new RegExp(`:\\s*${word}\\b`, 'gi');
    json = json.replace(regex, `: ${num}`);
  }

  return json;
}


// Fix all invalid escape sequences in JSON strings
function fixInvalidEscapes(json: string): string {
  // Step 1: Find all string values (content between quotes)
  // and fix escape sequences within them
  return json.replace(/"([^"]*(?:\\"[^"]*)*)"/g, (match, content) => {
    // Don't touch property names (before colons)
    if (json.indexOf(match + ':') !== -1 && json.indexOf(match + ':') === json.indexOf(match) + match.length) {
      return match; // This is a property name, leave it alone
    }
    
    // Fix the content of string values
    let fixed = content
      // First, protect valid escape sequences
      .replace(/\\"/g, '___QUOTE___')
      .replace(/\\\\/g, '___BACKSLASH___')
      .replace(/\\\//g, '___SLASH___')
      .replace(/\\b/g, '___BACKSPACE___')
      .replace(/\\f/g, '___FORMFEED___')
      .replace(/\\n/g, '___NEWLINE___')
      .replace(/\\r/g, '___RETURN___')
      .replace(/\\t/g, '___TAB___')
      .replace(/\\u([0-9a-fA-F]{4})/g, '___UNICODE_$1___')
      
      // Remove any remaining backslashes (they're invalid)
      .replace(/\\/g, '')
      
      // Restore valid escape sequences
      .replace(/___QUOTE___/g, '\\"')
      .replace(/___BACKSLASH___/g, '\\\\')
      .replace(/___SLASH___/g, '\\/')
      .replace(/___BACKSPACE___/g, '\\b')
      .replace(/___FORMFEED___/g, '\\f')
      .replace(/___NEWLINE___/g, '\\n')
      .replace(/___RETURN___/g, '\\r')
      .replace(/___TAB___/g, '\\t')
      .replace(/___UNICODE_([0-9a-fA-F]{4})___/g, '\\u$1');
    
    return `"${fixed}"`;
  });
}


function parseJSONResponse(text: string): LLMReviewResponse {
  let cleaned = text
    .replace(/^```(?:json)?\n?/m, "")
    .replace(/\n?```$/m, "")
    .trim();

  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }

  // CRITICAL: Fix invalid escapes FIRST
  console.log('[JSON] Fixing invalid escape sequences...');
  cleaned = fixInvalidEscapes(cleaned);

  console.log('[JSON] Fixing missing quotes...');
  cleaned = fixAllMissingQuotes(cleaned);

  cleaned = fixNumberWords(cleaned);
  cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');

  try {
    const parsed = JSON.parse(cleaned) as LLMReviewResponse;
    console.log('[JSON] ✓ Successfully parsed JSON');
    return validateAndNormalize(parsed);
  } catch (error) {
    console.error(`[JSON] ✗ Parse failed`);
    console.error(`[JSON] Error: ${error instanceof Error ? error.message : 'unknown'}`);
    console.error(`[JSON] Position 2172 context:\n${cleaned.slice(2150, 2200)}`);
    
    throw new Error(
      `❌ Failed to parse LLM JSON response.\n\n` +
      `Error: ${error instanceof Error ? error.message : 'Unknown'}\n\n` +
      `Character at issue: "${cleaned.charAt(2172)}"\n` +
      `Context: ${cleaned.slice(2170, 2180)}`
    );
  }
}
const VALID_CATEGORIES: IssueCategory[] = [
  "security",
  "correctness",
  "maintainability",
  "performance",
  "hallucination",
];

const VALID_SEVERITIES: Severity[] = [
  "critical",
  "high",
  "medium",
  "low",
  "info",
];

function normalizeCategory(category: unknown): IssueCategory {
  const cat = String(category).toLowerCase();
  if (VALID_CATEGORIES.includes(cat as IssueCategory)) {
    return cat as IssueCategory;
  }
  return "correctness";
}

function normalizeSeverity(severity: unknown): Severity {
  const sev = String(severity).toLowerCase();
  if (VALID_SEVERITIES.includes(sev as Severity)) {
    return sev as Severity;
  }
  return "medium";
}

function validateAndNormalize(data: unknown): LLMReviewResponse {
  const d = data as Record<string, unknown>;

  const scores = (d.scores as LLMReviewResponse["scores"]) ?? {};
  const categories = ["security", "correctness", "maintainability", "performance"] as const;

  for (const cat of categories) {
    if (!scores[cat]) {
      scores[cat] = { score: 50, confidence: 50, summary: "Analysis unavailable" };
    }
    scores[cat].score = Math.max(0, Math.min(100, scores[cat].score));
    scores[cat].confidence = Math.max(0, Math.min(100, scores[cat].confidence));
  }

  const issues = Array.isArray(d.issues) ? d.issues : [];

  return {
    scores,
    issues: issues.map((issue: Record<string, unknown>, idx: number) => ({
      category: normalizeCategory(issue.category),
      severity: normalizeSeverity(issue.severity),
      title: (issue.title as string) ?? `Issue ${idx + 1}`,
      description: (issue.description as string) ?? "",
      lineStart: Math.max(1, Number(issue.lineStart) || 1),
      lineEnd: Math.max(1, Number(issue.lineEnd) || 1),
      originalSnippet: issue.originalSnippet ? String(issue.originalSnippet) : undefined,
      suggestedFix: issue.suggestedFix ? String(issue.suggestedFix) : undefined,
      fixedSnippet: issue.fixedSnippet ? String(issue.fixedSnippet) : undefined,
      confidence: Math.max(0, Math.min(100, Number(issue.confidence) || 70)),
      owaspCategory: issue.owaspCategory ? String(issue.owaspCategory) : undefined,
    })),
    summary: (d.summary as string) ?? "Review completed.",
    hallucinationFlags: Array.isArray(d.hallucinationFlags)
      ? (d.hallucinationFlags as string[]).map(String)
      : [],
  };
}