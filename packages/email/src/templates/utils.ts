import type { AnswerSummaryItem } from "../types";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderAnswersTable(answersSummary: AnswerSummaryItem[]): string {
  if (answersSummary.length === 0) {
    return `<p style="color:#374151;font-size:14px;">No answers recorded.</p>`;
  }

  const rows = answersSummary
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-weight:600;color:#111827;">${escapeHtml(item.label)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#374151;">${escapeHtml(item.value) || "—"}</td>
        </tr>`,
    )
    .join("");

  return `<table style="width:100%;border-collapse:collapse;margin-top:12px;">${rows}</table>`;
}

export function emailLayout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:24px;background:#f6f9fc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:8px;padding:24px;">
      <h1 style="margin:0 0 16px;font-size:24px;color:#111827;">${escapeHtml(title)}</h1>
      ${body}
    </div>
  </body>
</html>`;
}
