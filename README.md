# 🛡️ AI Code Review Sentinel

> **The gray area problem:** AI code generators (Copilot, Cursor, ChatGPT) produce code that *looks* correct but contains subtle hallucinations, security vulnerabilities, and logic errors invisible to casual review. Sentinel catches what human reviewers miss in AI-generated code.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/ai-code-review-sentinel)

---

## 🎯 Problem Statement

Large language models confidently generate code with:
- **Invented APIs**: `crypto.secureOneWayHash()`, `os.security.get_random_bytes()` — functions that don't exist
- **OWASP Top 10 violations**: SQL injection via f-strings, MD5 for passwords, hardcoded secrets
- **Timing attacks**: Non-constant-time password comparison
- **Logic errors**: Off-by-one bugs, missing null checks, race conditions

Traditional linters miss these because the code is *syntactically valid*. Sentinel combines Semgrep static analysis with an LLM-as-judge that knows what AI code looks like — and where it fails.

---

## ✨ Features

| Feature | Description |
|--------|-------------|
| 🔍 Monaco Editor | Full IDE-quality editor with syntax highlighting for TS/JS/Python |
| 🛡️ Semgrep Rules | OWASP Top 10, secrets detection, language-specific rules |
| 🤖 LLM-as-Judge | Anthropic/OpenAI judge with structured scoring (0-100) per category |
| 🔮 Hallucination Detection | Flags invented functions, wrong signatures, non-existent packages |
| 📊 Score Dashboard | Security, Correctness, Maintainability, Performance scores with confidence |
| 🔄 Diff View | Side-by-side original vs. suggested fix with one-click copy |
| ⚡ Hybrid Analysis | Semgrep + LLM run in parallel; results merged & deduplicated |
| 📁 File Upload | Drag-and-drop `.ts`, `.tsx`, `.js`, `.jsx`, `.py` files |

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/your-username/ai-code-review-sentinel.git
cd ai-code-review-sentinel
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
ANTHROPIC_API_KEY=sk-ant-your-key-here
LLM_PROVIDER=anthropic
LLM_MODEL=claude-sonnet-4-5
```

### 3. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. (Optional) Enable Semgrep

```bash
pip install semgrep
# Then in .env.local:
ENABLE_SEMGREP=true
```

---

## 🌐 Deploy to Vercel

```bash
npm install -g vercel
vercel login
vercel
```

Or one-click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/ai-code-review-sentinel)

**Required Vercel env vars:**
- `ANTHROPIC_API_KEY` (or `OPENAI_API_KEY`)
- `LLM_PROVIDER`
- `LLM_MODEL`

> Note: Semgrep CLI is unavailable on Vercel serverless. The pattern-based fallback (12 security rules) activates automatically.

---

## 📸 Screenshots

**Main Interface**: Monaco editor on left with language selector, file upload button, and "Run Sentinel Analysis" CTA. Dark terminal aesthetic with blue glow accents.

**Score Dashboard**: Four score rings (Security, Correctness, Maintainability, Performance) with animated fill, confidence percentage, and color-coded overall score (green/yellow/orange/red).

**Issue Cards**: Collapsible cards per finding showing severity badge (CRITICAL/HIGH/MEDIUM), line number, OWASP category link, original vs. fixed code snippets, and one-click "Copy patch" button.

**Hallucination Badge**: Purple "🔮 HALLUCINATION" badge on issues where the AI invented non-existent functions or APIs.

**Diff View**: react-diff-viewer showing red/green line-level diff for auto-fixable issues.

---

## 🏗️ Architecture

```
Browser
  └─ Monaco Editor + React UI
       ↓ POST /api/review
Server (Next.js API Route)
  ├─ Semgrep CLI (parallel) ──→ SemgrepFinding[]
  └─ LLM Judge (parallel)   ──→ LLMReviewResponse
       ↓ Merge + Deduplicate
  ReviewResult (scores + issues + diffs)
       ↓ JSON response
Browser renders dashboard
```

---

## 🔒 Security

- **No code execution**: Semgrep only reads code statically. Never runs it.
- **Size limits**: 50KB max per review request
- **Rate limiting**: 10 req/min per IP (configurable)
- **No persistence**: Code is never stored; processed in-memory only

---

## 📝 Resume Bullets

- Built **AI Code Review Sentinel**, a full-stack hybrid security analysis tool combining Semgrep static analysis and Claude/GPT-4o LLM-as-judge to detect OWASP Top 10 vulnerabilities, hallucinated APIs, and logic errors in AI-generated TypeScript/JavaScript/Python code
- Engineered a parallel analysis pipeline (Semgrep + LLM run concurrently via `Promise.all`) with result deduplication, severity scoring, and confidence-weighted overall code health scores (0-100 per category)
- Implemented hallucination detection system using structured LLM prompting that identifies invented function signatures, non-existent stdlib calls, and incorrect crypto primitive usage in AI-generated code
- Built responsive Monaco Editor-based web UI with Next.js 15 App Router, shadcn/ui, and Tailwind; features real-time issue highlighting, side-by-side diff view, and one-click patch copying

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 18, TypeScript strict |
| UI | shadcn/ui, Tailwind CSS, Radix UI |
| Editor | Monaco Editor (@monaco-editor/react) |
| Static Analysis | Semgrep CLI (+ 12-rule pattern fallback) |
| LLM | Anthropic Claude / OpenAI GPT-4o |
| Diff | react-diff-viewer-continued |
| Validation | Zod |
| Testing | Jest + Testing Library |
| Deploy | Vercel |

---

## ⚙️ Configuration

| Env Var | Default | Description |
|---------|---------|-------------|
| `ANTHROPIC_API_KEY` | — | Anthropic API key |
| `OPENAI_API_KEY` | — | OpenAI API key (alternative) |
| `LLM_PROVIDER` | `anthropic` | `anthropic` or `openai` |
| `LLM_MODEL` | `claude-sonnet-4-5` | Model identifier |
| `ENABLE_SEMGREP` | `false` | Enable Semgrep CLI |
| `SEMGREP_TIMEOUT` | `30` | Semgrep timeout (seconds) |
| `MAX_CODE_SIZE` | `50000` | Max chars per review |
| `RATE_LIMIT_PER_MINUTE` | `10` | Rate limit per IP |

---

## 🧪 Testing

```bash
npm test
```

Basic pattern detection tests included in `src/__tests__/semgrep.test.ts`.

---

## 🤝 Contributing

PRs welcome! Focus areas:
- Additional Semgrep rules for Python/TypeScript
- LLM prompt optimization for hallucination detection
- UI/UX improvements
- Multi-file project analysis

---

## 📄 License

MIT

---

## 🙏 Credits

- [Semgrep](https://semgrep.dev/) for static analysis engine
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) for code editing
- [Anthropic Claude](https://www.anthropic.com/) for LLM-as-judge capability
- [shadcn/ui](https://ui.shadcn.com/) for component library
