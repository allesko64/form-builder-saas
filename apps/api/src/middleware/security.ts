import type { Express, NextFunction, Request, Response } from "express";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import helmet from "helmet";
import hpp from "hpp";

import { logger } from "@repo/logger";

import { env } from "../env";
import { redis } from "../lib/redis";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const BLOCKED_BODY_KEYS = new Set(["__proto__", "constructor", "prototype"]);

/** Paths that skip origin checks (health, docs, Better Auth). */
const CSRF_EXEMPT_PREFIXES = ["/health", "/openapi.json", "/api/auth"];

/** Paths excluded from the global IP rate limit (session polling, OAuth, etc.). */
const RATE_LIMIT_EXEMPT_PREFIXES = ["/health", "/api/auth"];

function getRateLimitClientKey(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    const client = forwarded.split(",")[0]?.trim();
    if (client) return client;
  }
  return req.ip ?? req.socket.remoteAddress ?? "unknown";
}

/**
 * Skip global rate limit for health/auth and tRPC reads (GET).
 * Mutations stay capped; form submissions also use enforceSubmissionRateLimit.
 */
function isRateLimitExempt(req: Request): boolean {
  if (
    RATE_LIMIT_EXEMPT_PREFIXES.some(
      (prefix) => req.path === prefix || req.path.startsWith(`${prefix}/`),
    )
  ) {
    return true;
  }

  if (req.method === "GET" && (req.path === "/trpc" || req.path.startsWith("/trpc/"))) {
    return true;
  }

  return false;
}

function normalizeOrigin(value: string): string | null {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

const allowedOrigins = new Set(
  [env.WEB_APP_URL, env.BASE_URL].map((url) => normalizeOrigin(url)).filter(Boolean) as string[],
);

function getRequestOrigin(req: Request): string | null {
  const origin = req.headers.origin;
  if (typeof origin === "string" && origin.length > 0) {
    return normalizeOrigin(origin);
  }

  const referer = req.headers.referer;
  if (typeof referer === "string" && referer.length > 0) {
    return normalizeOrigin(referer);
  }

  return null;
}

/**
 * CSRF mitigation for cookie-based sessions: mutating requests must come from
 * an allowed browser origin (web app or API base URL for local Scalar).
 */
export function csrfOriginGuard(req: Request, res: Response, next: NextFunction): void {
  if (!MUTATING_METHODS.has(req.method)) {
    next();
    return;
  }

  if (CSRF_EXEMPT_PREFIXES.some((prefix) => req.path === prefix || req.path.startsWith(prefix))) {
    next();
    return;
  }

  const origin = getRequestOrigin(req);
  if (!origin || !allowedOrigins.has(origin)) {
    res.status(403).json({
      error: "Forbidden",
      message: "Cross-origin request blocked",
    });
    return;
  }

  next();
}

function sanitizeValue(value: unknown): unknown {
  if (typeof value === "string") {
    return value.replace(/\0/g, "");
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(record)) {
      if (BLOCKED_BODY_KEYS.has(key)) {
        continue;
      }
      out[key] = sanitizeValue(nested);
    }
    return out;
  }

  return value;
}

/** Strip null bytes and prototype-pollution keys from parsed JSON bodies. */
export function sanitizeRequestBody(req: Request, _res: Response, next: NextFunction): void {
  if (req.body !== undefined && req.body !== null && typeof req.body === "object") {
    req.body = sanitizeValue(req.body);
  }
  next();
}

function createGlobalRateLimiter() {
  const windowMs = env.RATE_LIMIT_WINDOW_MS;
  const max = env.RATE_LIMIT_MAX;

  const options: Parameters<typeof rateLimit>[0] = {
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too Many Requests", message: "Rate limit exceeded. Try again later." },
    keyGenerator: getRateLimitClientKey,
    skip: isRateLimitExempt,
  };

  if (redis) {
    return rateLimit({
      ...options,
      store: new RedisStore({
        sendCommand: (...args: string[]) => redis.call(...args),
        prefix: "rl:global:",
      }),
    });
  }

  logger.warn("Global rate limiting uses in-memory store (set VALKEY_URL for distributed limits)");
  return rateLimit(options);
}

export function applySecurityMiddleware(app: Express): void {
  app.set("trust proxy", 1);

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  app.use(
    cors({
      origin: env.WEB_APP_URL,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "trpc-batch-mode",
        "x-terminal-id",
      ],
    }),
  );

  app.use(hpp());
  app.use(createGlobalRateLimiter());
  app.use(csrfOriginGuard);
}

export function jsonBodyParser() {
  return express.json({
    limit: env.JSON_BODY_LIMIT,
    strict: true,
  });
}
