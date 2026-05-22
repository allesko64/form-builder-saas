import { createContext as createTrpcContext } from "@repo/trpc/server";

import { env } from "./env";
import { redis } from "./lib/redis";

export function createContext(opts: Parameters<typeof createTrpcContext>[0]) {
  return createTrpcContext({
    ...opts,
    redis,
    ipHashSalt: env.IP_HASH_SALT ?? "",
  });
}
