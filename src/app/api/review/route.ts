// src/app/api/review/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { orchestrateReview } from "@/lib/review-orchestrator";

const ReviewRequestSchema = z.object({
  code: z.string().min(1, "Code cannot be empty").max(50000),
  language: z.enum(["typescript", "javascript", "python"]),
  filename: z.string().optional(),
  context: z.string().optional(),
});

// Simple in-memory rate limiter (use Redis/Upstash for production)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const limit = parseInt(process.env.RATE_LIMIT_PER_MINUTE ?? "10", 10);
  const now = Date.now();
  const window = 60 * 1000;

  const existing = rateLimitMap.get(ip);
  if (!existing || now > existing.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + window });
    return true;
  }
  if (existing.count >= limit) return false;
  existing.count++;
  return true;
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0] ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { success: false, error: "Rate limit exceeded. Please wait a minute." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON in request body" },
      { status: 400 }
    );
  }

  const parsed = ReviewRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: parsed.error.errors.map((e) => e.message).join(", "),
      },
      { status: 400 }
    );
  }

  if (process.env.ENABLE_REQUEST_LOGGING === "true") {
    console.log(`[Review] ${ip} | lang=${parsed.data.language} | lines=${parsed.data.code.split("\n").length}`);
  }

  try {
    const result = await orchestrateReview(parsed.data);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Review API Error]", message);

    // Don't expose internal errors
    const isUserError =
      message.includes("empty") ||
      message.includes("exceeds") ||
      message.includes("API key");

    return NextResponse.json(
      {
        success: false,
        error: isUserError ? message : "Review failed. Check server logs.",
      },
      { status: isUserError ? 400 : 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    service: "AI Code Review Sentinel",
    version: "1.0.0",
    status: "operational",
    llmProvider: process.env.LLM_PROVIDER ?? "anthropic",
    semgrepEnabled: process.env.ENABLE_SEMGREP === "true",
    supportedLanguages: ["typescript", "javascript", "python"],
  });
}
