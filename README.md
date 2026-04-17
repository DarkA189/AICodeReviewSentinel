# 🛡️ AI Code Review Sentinel

A Next.js-powered code analysis tool that combines static analysis with LLM-based security review to detect vulnerabilities, hallucinations, and quality issues in AI-generated code.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/DarkA189/AICodeReviewSentinel)

## ✨ Features

- 🔍 **Hybrid Analysis**: Combines Semgrep static analysis with LLM intelligence
- 🔐 **Security-First**: Detects OWASP Top 10 vulnerabilities
- 🤖 **Hallucination Detection**: Identifies AI-invented APIs and incorrect function signatures
- ⚡ **Multi-Language**: Supports TypeScript, JavaScript, Python
- 🎨 **Modern UI**: Monaco Editor with syntax highlighting and real-time issue markers
- 📊 **Visual Reports**: Animated score rings, severity badges, and side-by-side diffs

## 🚀 Live Demo

**[Try it now →](https://ai-code-review-sentinel.vercel.app)**

## 🏗️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI**: Tailwind CSS, shadcn/ui, Radix UI
- **Editor**: Monaco Editor (VS Code core)
- **LLM**: Groq (Llama 3.3 70B) - Fast & Free
- **Analysis**: Semgrep (optional)

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/DarkA189/AICodeReviewSentinel.git
cd AICodeReviewSentinel

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## ⚙️ Configuration

### Environment Variables

```env
# Groq API (Recommended - Free tier: 14,400 req/day)
OPENAI_API_KEY=gsk_your-groq-api-key
OPENAI_BASE_URL=https://api.groq.com/openai/v1
LLM_MODEL=llama-3.3-70b-versatile
LLM_PROVIDER=openai

# Or use Claude (Anthropic)
# ANTHROPIC_API_KEY=sk-ant-your-key
# LLM_PROVIDER=anthropic
# LLM_MODEL=claude-sonnet-4-5

# Optional: Enable Semgrep
ENABLE_SEMGREP=false

# Rate limiting
RATE_LIMIT_PER_MINUTE=5
MAX_CODE_SIZE=50000
```

### Get API Keys

- **Groq (Free)**: https://console.groq.com
- **Anthropic**: https://console.anthropic.com
- **OpenAI**: https://platform.openai.com

## 📖 Usage

1. **Paste or upload code** (TypeScript, JavaScript, or Python)
2. **Click "Run Security Review"**
3. **View results:**
   - Security, Correctness, Maintainability, Performance scores
   - Detailed issues with line numbers
   - Suggested fixes with code snippets
   - OWASP category mappings
   - Hallucination flags

## 🎯 What It Detects

### Security
- SQL/NoSQL/Command injection
- XSS & CSRF vulnerabilities
- Hardcoded secrets & credentials
- Insecure crypto usage
- Broken access control

### Correctness
- Logic errors & race conditions
- Null/undefined references
- Type mismatches
- Edge case handling

### AI Hallucinations
- Non-existent library functions
- Incorrect API signatures
- Invented security patterns
- Fabricated language features

## 📊 Cost Estimate

- **Groq (Free tier)**: 14,400 requests/day = ~450K/month FREE
- **Groq (Paid)**: ~$0.003 per 100-line review
- **Claude**: ~$0.015 per 100-line review
- **GPT-4o**: ~$0.010 per 100-line review

## 🚢 Deployment

### Deploy to Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/DarkA189/AICodeReviewSentinel)

1. Click the button above
2. Connect your GitHub account
3. Add environment variables
4. Deploy!

### Manual Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Powered by [Groq](https://groq.com/) LLM inference
- Static analysis via [Semgrep](https://semgrep.dev/)

## 📧 Contact

- GitHub: [@DarkA189](https://github.com/DarkA189)
- Project: [AICodeReviewSentinel](https://github.com/DarkA189/AICodeReviewSentinel)

---

⭐ **Star this repo if you found it useful!**
