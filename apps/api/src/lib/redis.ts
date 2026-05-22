import Redis from "ioredis";

import { env } from "../env";
import { logger } from "@repo/logger";

export const redis = env.VALKEY_URL
  ? new Redis(env.VALKEY_URL, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    })
  : null;

if (redis) {
  redis.on("error", (err) => {
    logger.error("Redis connection error", err);
  });

  redis.connect().catch((err) => {
    logger.error("Failed to connect to Redis", err);
  });
} else {
  logger.warn(
    "VALKEY_URL not set — submission rate limits use in-memory store (per API process only)",
  );
}
