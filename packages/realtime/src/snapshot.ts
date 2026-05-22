import { and, db, eq, isNull } from "@repo/database";
import { formsTable } from "@repo/database/schema";
import AnalyticsService from "@repo/services/analytics";

import type { AnalyticsByDayItem, AnalyticsOverviewPayload } from "./types";

const analyticsService = new AnalyticsService();

export async function getFormOwnerId(formId: string): Promise<string | null> {
  const [form] = await db
    .select({ userId: formsTable.userId })
    .from(formsTable)
    .where(and(eq(formsTable.id, formId), isNull(formsTable.deletedAt)))
    .limit(1);

  return form?.userId ?? null;
}

export async function buildAnalyticsSnapshot(
  formId: string,
  ownerUserId: string,
): Promise<{ overview: AnalyticsOverviewPayload; byDay: AnalyticsByDayItem[] } | null> {
  const overview = await analyticsService.overview(ownerUserId, formId);
  const byDay = await analyticsService.byDay(ownerUserId, formId);

  if (!overview || !byDay) {
    return null;
  }

  return { overview, byDay };
}
