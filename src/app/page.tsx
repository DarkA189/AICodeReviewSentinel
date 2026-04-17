// src/app/page.tsx
"use client";
import { useState, useCallback } from "react";
import { Header } from "@/components/Header";
import { CodeEditor } from "@/components/CodeEditor";
import { ReviewDashboard } from "@/components/ReviewDashboard";
import { Button } from "@/components/ui/button";
import type { ReviewResult, SupportedLanguage } from "@/types/review";
import { Shield, Zap, AlertTriangle, Loader2 } from "lucide-react";

const DEMO_CODE: Record<SupportedLanguage, string> = {
  typescript: `// AI-generated auth middleware — spot the issues!
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const SECRET = "super-secret-key-12345";  // hardcoded!

export async function authenticateUser(username: string, password: string) {
  const db = await getDatabase();
  // SQL injection via template literal!
  const user = await db.query(\`SELECT * FROM users WHERE username = '\${username}'\`);

  if (!user) return null;

  // MD5 is broken for passwords!
  const hashedInput = crypto.createHash('md5').update(password).digest('hex');

  // Non-constant-time comparison — timing attack!
  if (hashedInput === user.password_hash) {
    // JWT with no expiration
    const token = jwt.sign({ userId: user.id, role: user.role }, SECRET);
    return token;
  }
  return null;
}

export function verifyAdmin(token: string) {
  try {
    const decoded = jwt.verify(token, SECRET) as any;
    // Missing role check — all users pass!
    return decoded;
  } catch {
    return null;
  }
}

// Invented function that doesn't exist in Node crypto!
export function secureHash(data: string): string {
  return crypto.secureOneWayHash(data, 'argon2id');
}`,
  javascript: `// AI-generated Express API — multiple OWASP violations
const express = require('express');
const mysql = require('mysql');
const app = express();

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'admin123',   // hardcoded credential
  database: 'users'
});

app.get('/user', (req, res) => {
  const { id } = req.query;
  // SQL injection
  db.query(\`SELECT * FROM users WHERE id = \${id}\`, (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

app.post('/search', (req, res) => {
  const { term } = req.body;
  // XSS via innerHTML (client-side pattern in server template)
  const html = \`<div>\${term}</div>\`;
  res.send(html);
});

// Math.random for security token — insecure!
function generateToken() {
  return Math.random().toString(36).substring(2);
}

// eval of user input
app.post('/calc', (req, res) => {
  const result = eval(req.body.expression);
  res.json({ result });
});`,
  python: `# AI-generated Python API — spot what's wrong
import pickle
import subprocess
import hashlib
from flask import Flask, request, jsonify

app = Flask(__name__)
SECRET_KEY = "hardcoded-flask-secret-123"

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data['username']
    password = data['password']

    # SQL injection via f-string
    query = f"SELECT * FROM users WHERE username = '{username}'"
    user = db.execute(query).fetchone()

    if user:
        # MD5 for password — broken!
        hashed = hashlib.md5(password.encode()).hexdigest()
        if hashed == user['password']:
            return jsonify({"token": generate_token(user['id'])})

    return jsonify({"error": "Invalid credentials"}), 401

@app.route('/load-session', methods=['POST'])
def load_session():
    # Arbitrary pickle deserialization — RCE!
    session_data = pickle.loads(request.data)
    return jsonify(session_data)

@app.route('/run', methods=['POST'])
def run_command():
    cmd = request.json.get('command', '')
    # Shell injection
    result = subprocess.run('ls ' + cmd, shell=True, capture_output=True)
    return jsonify({"output": result.stdout.decode()})

# Invented Python stdlib function
def secure_random_bytes(n: int) -> bytes:
    return os.security.get_random_bytes(n)  # doesn't exist!`
};

export default function Home() {
  const [code, setCode] = useState<string>(DEMO_CODE.typescript);
  const [language, setLanguage] = useState<SupportedLanguage>("typescript");
  const [isReviewing, setIsReviewing] = useState(false);
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleReview = useCallback(async () => {
    if (!code.trim()) return;

    setIsReviewing(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error ?? "Review failed");
      } else {
        setResult(data.result);
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setIsReviewing(false);
    }
  }, [code, language]);

  const handleDemoLoad = (lang: SupportedLanguage) => {
    setLanguage(lang);
    setCode(DEMO_CODE[lang]);
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero strip */}
      <div className="relative border-b border-sentinel-border bg-sentinel-panel/50 py-6 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-white">
              Code Review{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sentinel-blue to-sentinel-teal">
                Sentinel
              </span>
            </h1>
            <p className="text-muted-foreground text-sm mt-1 max-w-xl">
              Hybrid Semgrep + LLM analysis detecting OWASP vulnerabilities,
              hallucinated APIs, and logic errors in AI-generated code.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">Load demo:</span>
            {(["typescript", "javascript", "python"] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => handleDemoLoad(lang)}
                className="px-3 py-1.5 rounded text-xs font-mono border border-sentinel-border 
                           hover:border-sentinel-blue hover:text-sentinel-blue transition-all duration-150
                           text-muted-foreground bg-sentinel-panel"
              >
                {lang === "typescript" ? "TS" : lang === "javascript" ? "JS" : "PY"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Threat indicators */}
      <div className="border-b border-sentinel-border bg-black/20 py-2 px-6">
        <div className="max-w-7xl mx-auto flex items-center gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-sentinel-red animate-pulse" />
            <span>OWASP Top 10</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-sentinel-purple animate-pulse" style={{ animationDelay: "0.3s" }} />
            <span>Hallucination Detection</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-sentinel-orange animate-pulse" style={{ animationDelay: "0.6s" }} />
            <span>Logic Analysis</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-sentinel-green animate-pulse" style={{ animationDelay: "0.9s" }} />
            <span>Semgrep Rules</span>
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left: Editor */}
        <div className="flex flex-col gap-4">
          <CodeEditor
            code={code}
            language={language}
            onCodeChange={setCode}
            onLanguageChange={(lang) => {
              setLanguage(lang);
              setResult(null);
            }}
            issues={result?.issues ?? []}
          />

          <div className="flex items-center gap-3">
            <Button
              onClick={handleReview}
              disabled={isReviewing || !code.trim()}
              variant="sentinel"
              className="flex-1 h-12 text-base font-semibold font-display"
            >
              {isReviewing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Analyzing Code...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5 mr-2" />
                  Run Sentinel Analysis
                </>
              )}
            </Button>

            {result && (
              <Button
                onClick={() => { setResult(null); setError(null); }}
                variant="outline"
                className="h-12 border-sentinel-border"
              >
                Clear
              </Button>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm animate-fade-in">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isReviewing && (
            <div className="sentinel-panel rounded-lg p-4 relative overflow-hidden">
              <div className="scan-beam absolute left-0 right-0 top-0" />
              <div className="flex items-center gap-3">
                <Zap className="w-4 h-4 text-sentinel-blue animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-2 bg-muted rounded shimmer" />
                  <div className="h-2 bg-muted rounded shimmer w-4/5" />
                  <div className="h-2 bg-muted rounded shimmer w-2/3" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3 font-mono">
                Running Semgrep patterns + LLM judge analysis...
              </p>
            </div>
          )}
        </div>

        {/* Right: Results */}
        <div className="flex flex-col">
          {result ? (
            <ReviewDashboard result={result} originalCode={code} />
          ) : !isReviewing ? (
            <EmptyState />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] sentinel-panel rounded-xl border border-sentinel-border text-center p-12">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-full bg-sentinel-blue/10 flex items-center justify-center">
          <Shield className="w-10 h-10 text-sentinel-blue/50" />
        </div>
        <div className="absolute inset-0 rounded-full border-2 border-sentinel-blue/20 animate-ping" />
      </div>
      <h3 className="font-display text-lg font-semibold text-white mb-2">
        Sentinel Standing By
      </h3>
      <p className="text-muted-foreground text-sm max-w-xs">
        Paste or upload code on the left, then click{" "}
        <span className="text-sentinel-blue font-medium">Run Sentinel Analysis</span>{" "}
        to detect vulnerabilities, hallucinations, and quality issues.
      </p>
      <div className="mt-6 grid grid-cols-2 gap-3 w-full max-w-xs text-xs text-muted-foreground">
        {[
          { label: "OWASP Top 10", icon: "🛡️" },
          { label: "Hallucinations", icon: "🔮" },
          { label: "Logic Errors", icon: "🐛" },
          { label: "Performance", icon: "⚡" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2 p-2 rounded bg-black/20 border border-sentinel-border">
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
