import type Redis from "ioredis";

import { publishAnalyticsMessage } from "./redis-bridge";
import { buildAnalyticsSnapshot, getFormOwnerId } from "./snapshot";
import { getAnalyticsHub } from "./hub";

function todayUtcKey(): string {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return today.toISOString().slice(0, 10);
}

/** Called after a new public response is stored — pushes live analytics deltas. */
export async function notifyAnalyticsResponse(
  formId: string,
  redis: Redis | null = null,
): Promise<void> {
  const ownerUserId = await getFormOwnerId(formId);
  if (!ownerUserId) {
    return;
  }

  const snapshot = await buildAnalyticsSnapshot(formId, ownerUserId);
  if (!snapshot) {
    return;
  }

  const hub = getAnalyticsHub();
  const activeViewers = hub.getActiveViewers(formId);
  const day = todayUtcKey();

  const message = {
    type: "analytics_delta" as const,
    formId,
    overview: snapshot.overview,
    byDayDelta: { day, countDelta: 1 },
    activeViewers,
    serverTime: new Date().toISOString(),
  };

  await publishAnalyticsMessage(redis, formId, message);
}
