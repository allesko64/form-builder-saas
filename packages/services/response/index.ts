import { and, count, db, eq, isNotNull } from "@repo/database";
import { formsTable, responsesTable, type ResponseAnswers } from "@repo/database/schema";

const TERMINAL_DEDUP_CONSTRAINT = "responses_form_id_ip_hash_unique_idx";

export type CreateResponseResult = "created" | "limit_reached" | "already_submitted";

function isPostgresUniqueViolation(error: unknown, constraint?: string): boolean {
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

export type CreateResponseInput = {
  formId: string;
  submissionId: string;
  answers: ResponseAnswers;
  ipHash: string | null;
  userAgent: string | null;
  completionTimeMs?: number | null;
  respondentEmail?: string | null;
};

class ResponseService {
  public async checkDuplicate(submissionId: string): Promise<boolean> {
    const [existing] = await db
      .select({ id: responsesTable.id })
      .from(responsesTable)
      .where(eq(responsesTable.submissionId, submissionId))
      .limit(1);

    return existing !== undefined;
  }

  public async getCount(formId: string): Promise<number> {
    const [result] = await db
      .select({ total: count() })
      .from(responsesTable)
      .where(eq(responsesTable.formId, formId));

    return Number(result?.total ?? 0);
  }

  public async create(input: CreateResponseInput): Promise<void> {
    await db.insert(responsesTable).values({
      formId: input.formId,
      submissionId: input.submissionId,
      answers: input.answers,
      ipHash: input.ipHash,
      userAgent: input.userAgent,
      completionTimeMs: input.completionTimeMs ?? null,
      respondentEmail: input.respondentEmail ?? null,
    });
  }

  /**
   * Inserts a response with atomic terminal dedup + response limit enforcement.
   * Locks the form row (FOR UPDATE); relies on partial unique index on (form_id, ip_hash).
   */
  public async createWithSubmissionGuards(
    input: CreateResponseInput,
    opts: { responseLimit: number | null; enforceTerminalDedup: boolean },
  ): Promise<CreateResponseResult> {
    const needsTransaction =
      opts.responseLimit !== null || (opts.enforceTerminalDedup && input.ipHash !== null);

    if (!needsTransaction) {
      await this.create(input);
      return "created";
    }

    return db.transaction(async (tx) => {
      const [lockedForm] = await tx
        .select({ responseLimit: formsTable.responseLimit })
        .from(formsTable)
        .where(eq(formsTable.id, input.formId))
        .for("update")
        .limit(1);

      if (opts.enforceTerminalDedup && input.ipHash) {
        const [existing] = await tx
          .select({ submissionId: responsesTable.submissionId })
          .from(responsesTable)
          .where(
            and(
              eq(responsesTable.formId, input.formId),
              eq(responsesTable.ipHash, input.ipHash),
              isNotNull(responsesTable.ipHash),
            ),
          )
          .limit(1);

        if (existing) {
          return "already_submitted" as const;
        }
      }

      const limit = lockedForm?.responseLimit;
      if (limit !== null && limit !== undefined) {
        const [result] = await tx
          .select({ total: count() })
          .from(responsesTable)
          .where(eq(responsesTable.formId, input.formId));

        if (Number(result?.total ?? 0) >= limit) {
          return "limit_reached" as const;
        }
      }

      try {
        await tx.insert(responsesTable).values({
          formId: input.formId,
          submissionId: input.submissionId,
          answers: input.answers,
          ipHash: input.ipHash,
          userAgent: input.userAgent,
          completionTimeMs: input.completionTimeMs ?? null,
          respondentEmail: input.respondentEmail ?? null,
        });
      } catch (error) {
        if (
          opts.enforceTerminalDedup &&
          input.ipHash &&
          isPostgresUniqueViolation(error, TERMINAL_DEDUP_CONSTRAINT)
        ) {
          return "already_submitted" as const;
        }
        throw error;
      }

      return "created" as const;
    });
  }

  /** @deprecated Use `createWithSubmissionGuards`. */
  public async createIfUnderLimit(
    input: CreateResponseInput,
    responseLimit: number | null,
  ): Promise<"created" | "limit_reached"> {
    const result = await this.createWithSubmissionGuards(input, {
      responseLimit,
      enforceTerminalDedup: false,
    });
    if (result === "already_submitted") {
      return "created";
    }
    return result;
  }

  public async getBySubmissionId(submissionId: string) {
    const [row] = await db
      .select()
      .from(responsesTable)
      .where(eq(responsesTable.submissionId, submissionId))
      .limit(1);

    return row ?? null;
  }

  /** One response per form per hashed client IP (terminal dedup). */
  public async getSubmissionIdByFormAndIpHash(
    formId: string,
    ipHash: string,
  ): Promise<string | null> {
    const [row] = await db
      .select({ submissionId: responsesTable.submissionId })
      .from(responsesTable)
      .where(
        and(
          eq(responsesTable.formId, formId),
          eq(responsesTable.ipHash, ipHash),
          isNotNull(responsesTable.ipHash),
        ),
      )
      .limit(1);

    return row?.submissionId ?? null;
  }
}

export default ResponseService;
