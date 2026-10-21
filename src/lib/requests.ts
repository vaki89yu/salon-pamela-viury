import { NextRequest } from "next/server";

const globalLimiter = globalThis as typeof globalThis & { luminaLimits?: Map<string, { count: number; reset: number }> };
const limits = globalLimiter.luminaLimits ?? new Map<string, { count: number; reset: number }>();
globalLimiter.luminaLimits = limits;

export function rateLimited(request: NextRequest, group: string, maximum = 25) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const key = `${group}:${ip}`;
  const now = Date.now();
  if (limits.size > 2000) for (const [k, v] of limits) if (v.reset < now) limits.delete(k);
  const item = limits.get(key);
  if (!item || item.reset < now) { limits.set(key, { count: 1, reset: now + 600_000 }); return false; }
  item.count += 1;
  return item.count > maximum;
}

export function normalizePhone(value: string) { return value.replace(/\D/g, "").slice(-10); }
export function jsonError(message: string, status = 400) { return Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } }); }
