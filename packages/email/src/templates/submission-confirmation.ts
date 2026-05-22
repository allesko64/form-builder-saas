import type { AnswerSummaryItem } from "../types";

import { emailLayout, escapeHtml, renderAnswersTable } from "./utils";

type SubmissionConfirmationEmailProps = {
  formTitle: string;
  submittedAt: string;
  answersSummary: AnswerSummaryItem[];
  viewReportUrl?: string;
};

export function renderSubmissionConfirmationEmail({
  formTitle,
  submittedAt,
  answersSummary,
  viewReportUrl,
}: SubmissionConfirmationEmailProps): string {
  const viewLink = viewReportUrl
    ? `<p style="margin:24px 0 0;">
        <a href="${escapeHtml(viewReportUrl)}" style="color:#991b1b;font-weight:700;text-decoration:underline;">
          View your filed report
        </a>
      </p>`
    : "";

  const body = `
    <p style="color:#374151;font-size:14px;line-height:24px;">
      Your submission to <strong>${escapeHtml(formTitle)}</strong> was received on ${escapeHtml(submittedAt)}.
    </p>
    <h2 style="font-size:16px;color:#111827;margin:24px 0 8px;">Your answers</h2>
    ${renderAnswersTable(answersSummary)}
    ${viewLink}
  `;

  return emailLayout("Thanks for your response", body);
}
