export type SubmissionReceipt = {
  submissionId: string;
  submittedAt: string;
};

const storageKey = (slug: string) => `dossier-submissions:${slug}`;

export function saveSubmissionReceipt(slug: string, submissionId: string): void {
  if (typeof window === "undefined") return;

  const receipt: SubmissionReceipt = {
    submissionId,
    submittedAt: new Date().toISOString(),
  };

  try {
    const existing = getSubmissionReceipts(slug);
    const withoutDup = existing.filter((r) => r.submissionId !== submissionId);
    const next = [receipt, ...withoutDup].slice(0, 50);
    localStorage.setItem(storageKey(slug), JSON.stringify(next));
  } catch {
    // localStorage unavailable or quota exceeded
  }
}

export function getSubmissionReceipts(slug: string): SubmissionReceipt[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(storageKey(slug));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SubmissionReceipt[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (r) => typeof r.submissionId === "string" && typeof r.submittedAt === "string",
    );
  } catch {
    return [];
  }
}
