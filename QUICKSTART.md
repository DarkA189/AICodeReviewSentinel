# ⚡ QUICKSTART — Copy & Run

## 🏁 Get Started in 3 Minutes

### 1️⃣ Install

```bash
cd ai-code-review-sentinel
npm install
```

### 2️⃣ Configure

```bash
cp .env.example .env.local
nano .env.local  # Add your ANTHROPIC_API_KEY
```

### 3️⃣ Run

```bash
npm run dev
```

Open **http://localhost:3000**

---

## 🌐 Deploy to Vercel

```bash
vercel
```

Set env vars in dashboard:
- `ANTHROPIC_API_KEY`
- `LLM_PROVIDER=anthropic`
- `LLM_MODEL=claude-sonnet-4-5`

---

## 📂 Project Structure

```
src/
├── app/
│   ├── page.tsx              # Main UI
│   └── api/review/route.ts   # Backend API
├── components/
│   ├── CodeEditor.tsx        # Monaco editor
│   ├── ReviewDashboard.tsx   # Results panel
│   └── ui/                   # shadcn components
└── lib/
    ├── semgrep.ts            # Static analysis
    ├── llm-review.ts         # LLM judge
    └── review-orchestrator.ts # Pipeline
```

---

## 🧪 Test

```bash
npm test
```

---

## 📝 Key Files to Customize

| File | Purpose |
|------|---------|
| `src/lib/llm-review.ts` | LLM system prompt & scoring logic |
| `src/lib/semgrep.ts` | Add custom pattern rules |
| `src/app/globals.css` | Design system & colors |
| `tailwind.config.ts` | Theme tokens |

---

## 🔑 Environment Variables

```env
# Required
ANTHROPIC_API_KEY=sk-ant-...
LLM_PROVIDER=anthropic
LLM_MODEL=claude-sonnet-4-5

# Optional
ENABLE_SEMGREP=false
MAX_CODE_SIZE=50000
RATE_LIMIT_PER_MINUTE=10
```

---

## 🎯 Demo Code Snippets

The app includes 3 demo files (TypeScript, JavaScript, Python) with intentional vulnerabilities:
- SQL injection
- Hardcoded secrets
- Weak crypto (MD5)
- Hallucinated functions (`crypto.secureOneWayHash()`)
- eval() usage
- Shell injection

Click "Load demo: TS / JS / PY" to test!

---

## 🚀 Production Checklist

- [ ] API keys in Vercel env vars
- [ ] Set `ENABLE_REQUEST_LOGGING=false`
- [ ] Configure rate limiting (Redis recommended)
- [ ] Add monitoring (Sentry, LogRocket)
- [ ] Test with real AI-generated code
- [ ] Update README with your GitHub link

---

**Need help?** Check `README.md` or `DEPLOYMENT_GUIDE.md` for full docs.
