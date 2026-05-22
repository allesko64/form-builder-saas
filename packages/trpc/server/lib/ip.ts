import { createHash } from "node:crypto";

import type { Request } from "express";

/** Browser-persisted device id (hashed server-side; never stored raw). */
export const TERMINAL_ID_HEADER = "x-terminal-id";

export function getClientIp(req: Request): string | null {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0]?.trim() ?? null;
  }
  if (Array.isArray(forwarded) && typeof forwarded[0] === "string") {
    return forwarded[0].split(",")[0]?.trim() ?? null;
  }
  return req.ip ?? null;
}

export function hashIp(ip: string, salt = ""): string {
  return createHash("sha256").update(`${salt}${ip}`).digest("hex");
}

export function getTerminalIdFromRequest(req: Request): string | null {
  const raw = req.headers[TERMINAL_ID_HEADER];
  if (typeof raw === "string" && raw.length > 0 && raw.length <= 64) {
    return raw;
  }
  if (Array.isArray(raw) && typeof raw[0] === "string" && raw[0].length > 0) {
    return raw[0].slice(0, 64);
  }
  return null;
}

/**
 * Stable per-terminal fingerprint for one-submission-per-form enforcement.
 * Priority: `x-terminal-id` header → client IP → User-Agent hash.
 */
export function resolveTerminalHash(req: Request, salt = ""): string | null {
  const terminalId = getTerminalIdFromRequest(req);
  if (terminalId) {
    return hashIp(`terminal:${terminalId}`, salt || "submission");
  }

  const ip = getClientIp(req);
  if (ip) {
    return hashIp(ip, salt);
  }

  const userAgent = req.headers["user-agent"];
  if (typeof userAgent === "string" && userAgent.length > 0) {
    return hashIp(`ua:${userAgent}`, salt || "submission");
  }

  return null;
}

export function isPostgresUniqueViolation(error: unknown, constraint?: string): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const pg = error as { code?: string; constraint?: string };
  if (pg.code !== "23505") {
    return false;
  }

  if (constraint && pg.constraint !== constraint) {
    return false;
  }

  return true;
}
