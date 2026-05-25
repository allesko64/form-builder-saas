import {
  and,
  asc,
  avg,
  count,
  db,
  desc,
  eq,
  gte,
  isNull,
  lte,
  sql,
  type SQL,
} from "@repo/database";
import {
  formFieldsTable,
  formFunnelSessionsTable,
  formsTable,
  responsesTable,
  type ResponseAnswers,
  type SelectFormField,
} from "@repo/database/schema";

import { computeDropoffMetrics } from "./metrics";
import type { ListResponsesInput } from "./model";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function formatDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function encodeCursor(createdAt: Date, id: string): string {
  return `${createdAt.toISOString()}|${id}`;
}

function decodeCursor(cursor: string): { createdAt: Date; id: string } | null {
  const separator = cursor.indexOf("|");
  if (separator === -1) return null;

  const createdAt = new Date(cursor.slice(0, separator));
  const id = cursor.slice(separator + 1);

  if (Number.isNaN(createdAt.getTime()) || !id) {
    return null;
  }

  return { createdAt, id };
}

class AnalyticsService {
  public async overview(userId: string, formId: string) {
    if (!(await this.isFormOwned(userId, formId))) {
      return null;
    }

    const [stats] = await db
      .select({
        totalResponses: count(),
        avgCompletionMs: avg(responsesTable.completionTimeMs),
        withCompletionTime: count(responsesTable.completionTimeMs),
      })
      .from(responsesTable)
      .where(eq(responsesTable.formId, formId));

    const total = Number(stats?.totalResponses ?? 0);
    const withTime = Number(stats?.withCompletionTime ?? 0);
    const timedResponseRate = total === 0 ? 0 : withTime / total;

    const dropoff = await this.computeDropoff(formId, total);

    return {
      totalResponses: total,
      avgCompletionMs:
        stats?.avgCompletionMs !== null && stats?.avgCompletionMs !== undefined
          ? Math.round(Number(stats.avgCompletionMs))
          : null,
      timedResponseRate,
      completionRate: timedResponseRate,
      formStarts: dropoff.formStarts,
      submissionRate: dropoff.submissionRate,
      dropoffRate: dropoff.dropoffRate,
    };
  }

  public async dropoff(userId: string, formId: string) {
    if (!(await this.isFormOwned(userId, formId))) {
      return null;
    }

    const [stats] = await db
      .select({ totalResponses: count() })
      .from(responsesTable)
      .where(eq(responsesTable.formId, formId));

    return this.computeDropoff(formId, Number(stats?.totalResponses ?? 0));
  }

  public async funnel(userId: string, formId: string) {
    if (!(await this.isFormOwned(userId, formId))) {
      return null;
    }

    const fields = await db
      .select({
        id: formFieldsTable.id,
        label: formFieldsTable.label,
        sortOrder: formFieldsTable.sortOrder,
      })
      .from(formFieldsTable)
      .where(eq(formFieldsTable.formId, formId))
      .orderBy(asc(formFieldsTable.sortOrder));

    const sessions = await db
      .select({ maxStepReached: formFunnelSessionsTable.maxStepReached })
      .from(formFunnelSessionsTable)
      .where(eq(formFunnelSessionsTable.formId, formId));

    const [stats] = await db
      .select({ totalResponses: count() })
      .from(responsesTable)
      .where(eq(responsesTable.formId, formId));

    const formStarts = sessions.length;
    const submissions = Number(stats?.totalResponses ?? 0);
    const fieldCount = fields.length;

    const reachedAtStep: number[] = [];
    for (let step = 0; step <= fieldCount; step++) {
      reachedAtStep[step] = sessions.filter((s) => s.maxStepReached >= step).length;
    }

    const steps: {
      stepIndex: number;
      fieldId: string | null;
      label: string;
      reached: number;
      retentionRate: number;
      stepDropoffRate: number | null;
    }[] = [];

    let previousReached = formStarts;

    steps.push({
      stepIndex: 0,
      fieldId: null,
      label: "Form opened",
      reached: formStarts,
      retentionRate: formStarts === 0 ? 0 : 1,
      stepDropoffRate: null,
    });

    for (let i = 0; i < fieldCount; i++) {
      const field = fields[i];
      if (!field) continue;

      const reached = reachedAtStep[i] ?? 0;
      const retentionRate = formStarts === 0 ? 0 : reached / formStarts;
      const stepDropoffRate =
        previousReached === 0 ? null : (previousReached - reached) / previousReached;

      steps.push({
        stepIndex: i + 1,
        fieldId: field.id,
        label: field.label,
        reached,
        retentionRate,
        stepDropoffRate,
      });

      previousReached = reached;
    }

    const submitReached = submissions;
    steps.push({
      stepIndex: fieldCount + 1,
      fieldId: null,
      label: "Submitted",
      reached: submitReached,
      retentionRate: formStarts === 0 ? 0 : submitReached / formStarts,
      stepDropoffRate:
        previousReached === 0 ? null : (previousReached - submitReached) / previousReached,
    });

    return { formStarts, submissions, steps };
  }

  private async computeDropoff(formId: string, submissions: number) {
    const [startStats] = await db
      .select({ formStarts: count() })
      .from(formFunnelSessionsTable)
      .where(eq(formFunnelSessionsTable.formId, formId));

    const formStarts = Number(startStats?.formStarts ?? 0);
    return computeDropoffMetrics(formStarts, submissions);
  }

  public async byDay(userId: string, formId: string) {
    if (!(await this.isFormOwned(userId, formId))) {
      return null;
    }

    const thirtyDaysAgo = new Date(Date.now() - THIRTY_DAYS_MS);

    const dayExpr = sql<string>`to_char(${responsesTable.createdAt} AT TIME ZONE 'UTC', 'YYYY-MM-DD')`;

    const rows = await db
      .select({
        day: dayExpr.as("day"),
        count: count(),
      })
      .from(responsesTable)
      .where(and(eq(responsesTable.formId, formId), gte(responsesTable.createdAt, thirtyDaysAgo)))
      .groupBy(dayExpr)
      .orderBy(dayExpr);

    const countByDay = new Map(rows.map((row) => [row.day, Number(row.count)]));

    const result: { day: string; count: number }[] = [];
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    for (let i = 29; i >= 0; i--) {
      const day = new Date(today);
      day.setUTCDate(today.getUTCDate() - i);
      const key = formatDay(day);
      result.push({ day: key, count: countByDay.get(key) ?? 0 });
    }

    return result;
  }

  public async byField(userId: string, formId: string) {
    if (!(await this.isFormOwned(userId, formId))) {
      return null;
    }

    const fields = await db
      .select()
      .from(formFieldsTable)
      .where(eq(formFieldsTable.formId, formId))
      .orderBy(asc(formFieldsTable.sortOrder));

    const responses = await db
      .select({
        id: responsesTable.id,
        answers: responsesTable.answers,
        createdAt: responsesTable.createdAt,
      })
      .from(responsesTable)
      .where(eq(responsesTable.formId, formId))
      .orderBy(desc(responsesTable.createdAt), desc(responsesTable.id));

    return fields.map((field) => ({
      fieldId: field.id,
      label: field.label,
      type: field.type,
      stats: this.computeFieldStats(field, responses),
    }));
  }

  public async responses(userId: string, input: ListResponsesInput) {
    if (!(await this.isFormOwned(userId, input.formId))) {
      return null;
    }

    const conditions: SQL[] = [eq(responsesTable.formId, input.formId)];

    if (input.fromDate) {
      conditions.push(gte(responsesTable.createdAt, input.fromDate));
    }
    if (input.toDate) {
      conditions.push(lte(responsesTable.createdAt, input.toDate));
    }
    if (input.email) {
      conditions.push(
        sql`lower(${responsesTable.respondentEmail}) like ${`%${input.email.toLowerCase()}%`}`,
      );
    }

    if (input.cursor) {
      const decoded = decodeCursor(input.cursor);
      if (decoded) {
        conditions.push(
          sql`(${responsesTable.createdAt} < ${decoded.createdAt} OR (${responsesTable.createdAt} = ${decoded.createdAt} AND ${responsesTable.id} < ${decoded.id}))`,
        );
      }
    }

    const rows = await db
      .select({
        id: responsesTable.id,
        submissionId: responsesTable.submissionId,
        respondentEmail: responsesTable.respondentEmail,
        answers: responsesTable.answers,
        completionTimeMs: responsesTable.completionTimeMs,
        createdAt: responsesTable.createdAt,
      })
      .from(responsesTable)
      .where(and(...conditions))
      .orderBy(desc(responsesTable.createdAt), desc(responsesTable.id))
      .limit(input.limit + 1);

    const hasMore = rows.length > input.limit;
    const items = hasMore ? rows.slice(0, input.limit) : rows;

    const last = items[items.length - 1];
    const nextCursor = hasMore && last ? encodeCursor(last.createdAt, last.id) : null;

    return {
      items: items.map((item) => ({
        ...item,
        answers: item.answers as Record<string, unknown>,
      })),
      nextCursor,
    };
  }

  public async exportCsv(userId: string, formId: string) {
    if (!(await this.isFormOwned(userId, formId))) {
      return null;
    }

    const [form] = await db
      .select({ title: formsTable.title, slug: formsTable.slug })
      .from(formsTable)
      .where(eq(formsTable.id, formId))
      .limit(1);

    const fields = await db
      .select()
      .from(formFieldsTable)
      .where(eq(formFieldsTable.formId, formId))
      .orderBy(asc(formFieldsTable.sortOrder));

    const responses = await db
      .select({
        answers: responsesTable.answers,
        respondentEmail: responsesTable.respondentEmail,
        completionTimeMs: responsesTable.completionTimeMs,
        createdAt: responsesTable.createdAt,
      })
      .from(responsesTable)
      .where(eq(responsesTable.formId, formId))
      .orderBy(desc(responsesTable.createdAt), desc(responsesTable.id));

    const headers = [
      "Submitted At",
      "Respondent Email",
      "Completion Time (ms)",
      ...fields.map((field) => field.label),
    ];

    const rows = responses.map((response) => [
      response.createdAt.toISOString(),
      response.respondentEmail ?? "",
      response.completionTimeMs?.toString() ?? "",
      ...fields.map((field) => this.formatAnswerForCsv(response.answers[field.id])),
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => this.escapeCsvCell(cell)).join(","))
      .join("\n");

    const slug = form?.slug ?? "form";
    return {
      csv,
      filename: `${slug}-responses.csv`,
    };
  }

  private formatAnswerForCsv(value: unknown): string {
    if (value === null || value === undefined) {
      return "";
    }
    if (Array.isArray(value)) {
      return value.map(String).join("; ");
    }
    if (typeof value === "boolean") {
      return value ? "true" : "false";
    }
    return String(value);
  }

  private escapeCsvCell(value: string): string {
    if (/[",\n\r]/.test(value)) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  private computeFieldStats(
    field: SelectFormField,
    responses: { answers: ResponseAnswers; createdAt: Date }[],
  ) {
    switch (field.type) {
      case "short_text":
      case "long_text":
      case "email":
      case "date": {
        const { samples, total } = this.collectFieldValues(field.id, responses);
        return { recentSamples: samples, responseCount: total };
      }
      case "single_select": {
        const values = this.collectRawValues(field.id, responses);
        const optionCounts: Record<string, number> = {};
        for (const value of values) {
          const key = String(value);
          optionCounts[key] = (optionCounts[key] ?? 0) + 1;
        }
        return { optionCounts };
      }
      case "multi_select": {
        const values = this.collectRawValues(field.id, responses);
        const optionCounts: Record<string, number> = {};
        for (const value of values) {
          if (Array.isArray(value)) {
            for (const option of value) {
              const key = String(option);
              optionCounts[key] = (optionCounts[key] ?? 0) + 1;
            }
          }
        }
        return { optionCounts };
      }
      case "number": {
        const values = this.collectRawValues(field.id, responses);
        const numbers = values.map((v) => Number(v)).filter((n) => !Number.isNaN(n));
        if (numbers.length === 0) {
          return { min: undefined, max: undefined, average: undefined };
        }
        const sum = numbers.reduce((a, b) => a + b, 0);
        return {
          min: Math.min(...numbers),
          max: Math.max(...numbers),
          average: sum / numbers.length,
        };
      }
      case "rating": {
        const values = this.collectRawValues(field.id, responses);
        const numbers = values.map((v) => Number(v)).filter((n) => !Number.isNaN(n));
        if (numbers.length === 0) {
          return { min: undefined, max: undefined, average: undefined };
        }

        const optionCounts: Record<string, number> = {};
        for (const rating of [...numbers].sort((a, b) => a - b)) {
          const key = String(rating);
          optionCounts[key] = (optionCounts[key] ?? 0) + 1;
        }

        const sum = numbers.reduce((a, b) => a + b, 0);
        return {
          optionCounts,
          min: Math.min(...numbers),
          max: Math.max(...numbers),
          average: sum / numbers.length,
        };
      }
      case "checkbox": {
        const values = this.collectRawValues(field.id, responses);
        const optionCounts: Record<string, number> = { true: 0, false: 0 };
        for (const value of values) {
          const key = value === true ? "true" : "false";
          optionCounts[key] = (optionCounts[key] ?? 0) + 1;
        }
        return { optionCounts };
      }
      default:
        return {};
    }
  }

  /** All non-empty values in response order (newest-first). */
  private collectRawValues(
    fieldId: string,
    responses: { answers: ResponseAnswers; createdAt: Date }[],
  ): unknown[] {
    const out: unknown[] = [];
    for (const row of responses) {
      const raw = row.answers[fieldId];
      if (raw === undefined || raw === null || String(raw).trim() === "") {
        continue;
      }
      out.push(raw);
    }
    return out;
  }

  /**
   * Walk responses newest-first (caller must order desc createdAt, desc id).
   * Count every non-empty answer; collect up to 10 newest for display.
   */
  private collectFieldValues(
    fieldId: string,
    responses: { answers: ResponseAnswers; createdAt: Date }[],
  ) {
    const samples: { text: string; submittedAt: string }[] = [];
    let total = 0;

    for (const row of responses) {
      const raw = row.answers[fieldId];
      if (raw === undefined || raw === null || String(raw).trim() === "") {
        continue;
      }
      total++;
      if (samples.length < 10) {
        samples.push({
          text: String(raw),
          submittedAt: row.createdAt.toISOString(),
        });
      }
    }

    return { samples, total };
  }

  private async isFormOwned(userId: string, formId: string): Promise<boolean> {
    const [form] = await db
      .select({ id: formsTable.id })
      .from(formsTable)
      .where(
        and(eq(formsTable.id, formId), eq(formsTable.userId, userId), isNull(formsTable.deletedAt)),
      )
      .limit(1);

    return form !== undefined;
  }
}

export default AnalyticsService;
