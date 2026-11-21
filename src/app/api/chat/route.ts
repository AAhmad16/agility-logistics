import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DISPATCH_PHONE } from "@/lib/format";
import { buildKnowledge } from "@/lib/knowledge";
import type { Loc, Rate } from "@/lib/types";

export const dynamic = "force-dynamic";

// Provider: "anthropic" (default) or "openai" for any OpenAI-compatible API (DeepSeek, Qwen, GLM, Kimi, Ollama, OpenRouter...).
const OPENAI_STYLE = process.env.CHAT_PROVIDER === "openai";
const MODEL = process.env.CHAT_MODEL || (OPENAI_STYLE ? "" : "claude-haiku-5-5");
const BASE = OPENAI_STYLE ? (process.env.CHAT_API_URL || "").replace(/\/$/, "") : process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com";

// Simple abuse limits. In-memory, so they apply per server instance; also set a spend limit in the Anthropic console.
const perIp = new Map<string, { n: number; reset: number }>();
let daily = { n: 0, reset: Date.now() + 86_400_000 };
const IP_LIMIT = 20; // messages per 10 minutes
const DAILY_LIMIT = Number(process.env.CHAT_DAILY_LIMIT || 400);

function allowed(ip: string) {
  const now = Date.now();
  if (now > daily.reset) daily = { n: 0, reset: now + 86_400_000 };
  if (daily.n >= DAILY_LIMIT) return false;
  const e = perIp.get(ip);
  if (!e || now > e.reset) perIp.set(ip, { n: 1, reset: now + 600_000 });
  else if (e.n >= IP_LIMIT) return false;
  else e.n++;
  daily.n++;
  return true;
}

export async function POST(req: Request) {
  const key = OPENAI_STYLE ? process.env.CHAT_API_KEY : process.env.ANTHROPIC_API_KEY;
  // No key set: tell the page to use its built-in answers.
  if (!key || !MODEL || !BASE) return NextResponse.json({ fallback: true });

  let body: { messages?: { role?: string; content?: string }[] };
  try { body = await req.json(); } catch { return NextResponse.json({ fallback: true }); }
  const history = (body.messages ?? [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-8)
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content!.slice(0, 500) }));
  // The API needs the conversation to start with and end on a user message.
  while (history.length && history[0].role !== "user") history.shift();
  if (!history.length || history[history.length - 1].role !== "user") return NextResponse.json({ fallback: true });

  const ip = (req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
  if (!allowed(ip)) return NextResponse.json({ fallback: true, limited: true });

  const supabase = await createClient();
  const [{ data: rates }, { data: hubs }] = await Promise.all([
    supabase.from("service_rates").select("*").order("base_cents"),
    supabase.from("locations").select("*").eq("is_hub", true).order("name"),
  ]);
  const system = buildKnowledge((rates ?? []) as Rate[], (hubs ?? []) as Loc[], DISPATCH_PHONE);

  try {
    const res = OPENAI_STYLE
      ? await fetch(`${BASE}/chat/completions`, {
          method: "POST",
          headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
          body: JSON.stringify({ model: MODEL, max_tokens: 350, messages: [{ role: "system", content: system }, ...history] }),
          signal: AbortSignal.timeout(20_000),
        })
      : await fetch(`${BASE}/v1/messages`, {
          method: "POST",
          headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
          body: JSON.stringify({ model: MODEL, max_tokens: 350, system, messages: history }),
          signal: AbortSignal.timeout(15_000),
        });
    if (!res.ok) return NextResponse.json({ fallback: true });
    const data = (await res.json()) as {
      content?: { type: string; text?: string }[];
      choices?: { message?: { content?: string } }[];
    };
    const reply = OPENAI_STYLE
      ? (data.choices?.[0]?.message?.content ?? "").trim()
      : (data.content ?? []).filter((c) => c.type === "text").map((c) => c.text).join("").trim();
    if (!reply) return NextResponse.json({ fallback: true });
    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({ fallback: true });
  }
}
