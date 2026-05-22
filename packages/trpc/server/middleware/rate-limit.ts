import { TRPCError } from "@trpc/server";
import type { Redis } from "ioredis";

const SUBMISSION_LIMIT = 5;
const WINDOW_SECONDS = 3600;

type MemoryWindow = { count: number; expiresAt: number };

/** Per-process fallback when Valkey is unset or Redis errors at runtime. */
const memoryWindows = new Map<string, MemoryWindow>();

function pruneExpiredMemoryWindows(now: number): void {
  if (memoryWindows.size < 5_000) return;
  for (const [key, entry] of memoryWindows) {
    if (entry.expiresAt <= now) memoryWindows.delete(key);
  }
}

function incrMemoryCounter(key: string): number {
  const now = Date.now();
  pruneExpiredMemoryWindows(now);

  const entry = memoryWindows.get(key);
  if (!entry || entry.expiresAt <= now) {
    memoryWindows.set(key, {
      count: 1,
      expiresAt: now + WINDOW_SECONDS * 1000,
    });
    return 1;
  }

  entry.count += 1;
  return entry.count;
}

async function incrRedisCounter(redis: Redis, key: string): Promise<number> {
  const current = await redis.incr(key);
  if (current === 1) {
    await redis.expire(key, WINDOW_SECONDS);
  }
  return current;
}

async function incrSubmissionCounter(redis: Redis | null, key: string): Promise<number> {
  if (redis) {
    try {
      return await incrRedisCounter(redis, key);
    } catch {
      // Redis down mid-request — fall back so submissions stay rate-limited.
    }
  }
  return incrMemoryCounter(key);
}

/**
 * Per-IP (or fallback client id) + form submission cap.
 * Always enforced: uses Valkey when available, otherwise in-memory per API process.
 */
export async function enforceSubmissionRateLimit(
  redis: Redis | null,
  clientKey: string | null,
  formId: string,
): Promise<void> {
  if (!clientKey) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Unable to process submission. Try again later.",
    });
  }

  const key = `ratelimit:${clientKey}:${formId}`;
  const current = await incrSubmissionCounter(redis, key);

  if (current > SUBMISSION_LIMIT) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Too many submissions. Try again later.",
    });
  }
}
