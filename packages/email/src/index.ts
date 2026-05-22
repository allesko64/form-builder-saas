import { logger } from "@repo/logger";

import { getFromAddress, isEmailConfigured, resend } from "./client";
import { formatAnswerValue } from "./format";
import { renderSubmissionConfirmationEmail } from "./templates/submission-confirmation";
import type { AnswerSummaryItem, NotifyRespondentInput } from "./types";

export type { AnswerSummaryItem, NotifyRespondentInput } from "./types";
export { formatAnswerValue } from "./format";

function formatSubmittedAt(date: Date): string {
  return date.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

class EmailService {
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
}

export const emailService = new EmailService();
