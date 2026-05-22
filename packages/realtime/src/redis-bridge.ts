import type Redis from "ioredis";

import { logger } from "@repo/logger";

import { getAnalyticsHub } from "./hub";
import type { AnalyticsServerMessage } from "./types";

const CHANNEL_PREFIX = "analytics:form:";

export function analyticsChannel(formId: string): string {
  return `${CHANNEL_PREFIX}${formId}`;
}

export function initAnalyticsRedisBridge(redis: Redis): void {
  const subscriber = redis.duplicate();

  subscriber.on("error", (err) => {
    logger.error("Analytics Redis subscriber error", err);
  });

  subscriber.psubscribe(`${CHANNEL_PREFIX}*`, (err) => {
    if (err) {
      logger.error("Failed to subscribe to analytics channels", err);
      return;
    }
    logger.info("Analytics realtime Redis bridge active");
  });

  subscriber.on("pmessage", (_pattern, channel, message) => {
    const formId = channel.slice(CHANNEL_PREFIX.length);
    if (!formId) {
      return;
    }

    try {
      const parsed = JSON.parse(message) as AnalyticsServerMessage;
      getAnalyticsHub().broadcast(formId, parsed);
    } catch (err) {
      logger.warn("Invalid analytics Redis message", { err, channel });
    }
  });
}

export async function publishAnalyticsMessage(
  redis: Redis | null,
  formId: string,
  message: AnalyticsServerMessage,
): Promise<void> {
  const hub = getAnalyticsHub();

  if (redis) {
    await redis.publish(analyticsChannel(formId), JSON.stringify(message));
    return;
  }

  hub.broadcast(formId, message);
}
