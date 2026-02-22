import { kv } from "@vercel/kv";
import { RateLimitResult } from "./types";

const DAILY_LIMIT = 3;
const TTL_SECONDS = 86400;

function getTodayKey(ip: string): string {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  return `rate:${ip}:${today}`;
}

export async function checkRateLimit(ip: string): Promise<RateLimitResult> {
  const key = getTodayKey(ip);

  try {
    const current = await kv.get<number>(key);
    const used = current ?? 0;

    if (used >= DAILY_LIMIT) {
      return { allowed: false, remaining: 0, limit: DAILY_LIMIT };
    }

    return { allowed: true, remaining: DAILY_LIMIT - used, limit: DAILY_LIMIT };
  } catch {
    // If KV is unavailable, allow the request
    return { allowed: true, remaining: DAILY_LIMIT, limit: DAILY_LIMIT };
  }
}

export async function incrementRateLimit(ip: string): Promise<number> {
  const key = getTodayKey(ip);

  try {
    const newCount = await kv.incr(key);
    if (newCount === 1) {
      await kv.expire(key, TTL_SECONDS);
    }
    return DAILY_LIMIT - newCount;
  } catch {
    return DAILY_LIMIT - 1;
  }
}
