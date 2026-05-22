/** Pure dropoff / submission metrics (unit-testable). */
export function computeDropoffMetrics(formStarts: number, submissions: number) {
  const effectiveStarts = Math.max(formStarts, submissions);
  const abandoned = Math.max(0, effectiveStarts - submissions);
  const dropoffRate = effectiveStarts === 0 ? 0 : abandoned / effectiveStarts;
  const submissionRate = effectiveStarts === 0 ? 0 : submissions / effectiveStarts;

  return {
    formStarts: effectiveStarts,
    submissions,
    abandoned,
    dropoffRate,
    submissionRate,
  };
}
