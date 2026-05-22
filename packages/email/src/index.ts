import { db, eq } from "@repo/database";
import { formsTable, user } from "@repo/database/schema";
import { logger } from "@repo/logger";

import { getFromAddress, isEmailConfigured, resend } from "./client";
import { formatAnswerValue } from "./format";
import { renderNewResponseEmail } from "./templates/new-response";
import { renderSubmissionConfirmationEmail } from "./templates/submission-confirmation";
import type { AnswerSummaryItem, NotifyCreatorInput, NotifyRespondentInput } from "./types";

export type { AnswerSummaryItem, NotifyCreatorInput, NotifyRespondentInput } from "./types";
export { formatAnswerValue } from "./format";

function formatSubmittedAt(date: Date): string {
  return date.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

class EmailService {
  public async notifyCreator(input: NotifyCreatorInput): Promise<void> {
    if (!isEmailConfigured() || !resend) {
      logger.debug("email.notifyCreator skipped (RESEND_API_KEY or EMAIL_FROM not set)");
      return;
    }

    const creatorEmail = await this.getCreatorEmail(input.formId);
    if (!creatorEmail) {
      logger.warn(`email.notifyCreator: no creator email for form ${input.formId}`);
      return;
    }

    const from = getFromAddress();
    if (!from) return;

    const html = renderNewResponseEmail({
      formTitle: input.formTitle,
      submittedAt: formatSubmittedAt(input.submittedAt),
      answersSummary: input.answersSummary,
    });

    const { error } = await resend.emails.send({
      from,
      to: creatorEmail,
      subject: `New response: ${input.formTitle}`,
      html,
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  public async notifyRespondent(input: NotifyRespondentInput): Promise<void> {
    if (!isEmailConfigured() || !resend) {
      logger.debug("email.notifyRespondent skipped (RESEND_API_KEY or EMAIL_FROM not set)");
      return;
    }

    const from = getFromAddress();
    if (!from) return;

    const html = renderSubmissionConfirmationEmail({
      formTitle: input.formTitle,
      submittedAt: formatSubmittedAt(input.submittedAt),
      answersSummary: input.answersSummary,
      viewReportUrl: input.viewReportUrl,
    });

    const { error } = await resend.emails.send({
      from,
      to: input.email,
      subject: `Submission received: ${input.formTitle}`,
      html,
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  private async getCreatorEmail(formId: string): Promise<string | null> {
    const [row] = await db
      .select({ email: user.email })
      .from(formsTable)
      .innerJoin(user, eq(formsTable.userId, user.id))
      .where(eq(formsTable.id, formId))
      .limit(1);

    return row?.email ?? null;
  }
}

export const emailService = new EmailService();
