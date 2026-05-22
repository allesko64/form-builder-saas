import { auth } from "@repo/auth";
import type { Request, Response } from "express";
import type { Redis } from "ioredis";

import { getClientIp, resolveTerminalHash } from "./lib/ip";

type CreateContextOptions = {
  req: Request;
  res: Response;
  redis?: Redis | null;
  ipHashSalt?: string;
};

type AuthSession = Awaited<ReturnType<typeof auth.api.getSession>>;
type AuthUser = NonNullable<AuthSession>["user"];

export type Context = {
  user: AuthUser | null;
  req: Request;
  res: Response;
  redis: Redis | null;
  ip: string | null;
  ipHash: string | null;
  /** Hashed terminal fingerprint (header → IP → UA) for dedup + rate limits. */
  terminalHash: string | null;
  /** @deprecated Use `terminalHash` — kept for callers not yet migrated. */
  rateLimitKey: string | null;
  userAgent: string | null;
};

function toHeaders(headers: Request["headers"]): Headers {
  const result = new Headers();

  for (const [key, value] of Object.entries(headers)) {
    if (value === undefined) continue;

    if (Array.isArray(value)) {
      for (const item of value) result.append(key, item);
      continue;
    }

    result.set(key, value);
  }

  return result;
}

export async function createContext({
  req,
  res,
  redis = null,
  ipHashSalt = "",
}: CreateContextOptions): Promise<Context> {
  const session = await auth.api.getSession({ headers: toHeaders(req.headers) });
  const ip = getClientIp(req);
  const userAgent =
    typeof req.headers["user-agent"] === "string" ? req.headers["user-agent"] : null;

  const terminalHash = resolveTerminalHash(req, ipHashSalt);

  return {
    user: session?.user ?? null,
    req,
    res,
    redis,
    ip,
    ipHash: terminalHash,
    terminalHash,
    rateLimitKey: terminalHash,
    userAgent,
  };
}
