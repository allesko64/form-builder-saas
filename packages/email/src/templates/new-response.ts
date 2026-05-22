import type { AnswerSummaryItem } from "../types";

import { emailLayout, escapeHtml, renderAnswersTable } from "./utils";

type NewResponseEmailProps = {
  formTitle: string;
  submittedAt: string;
  answersSummary: AnswerSummaryItem[];
};

export function renderNewResponseEmail({
  formTitle,
  submittedAt,
  answersSummary,
}: NewResponseEmailProps): string {
  const body = `
    <p style="color:#374151;font-size:14px;line-height:24px;">
      Someone submitted <strong>${escapeHtml(formTitle)}</strong> on ${escapeHtml(submittedAt)}.
    </p>
    ${renderAnswersTable(answersSummary)}
  `;

  return emailLayout("New form response", body);
}
