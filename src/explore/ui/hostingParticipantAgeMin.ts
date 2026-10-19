/** Min age field — avoid `Number(x) || 0` so users can clear and re-type (e.g. 18). */
export const formatParticipantMinAgeFieldValue = (ageMin: number): string =>
  ageMin > 0 ? String(ageMin) : '';

export const parseParticipantMinAgeFieldValue = (raw: string): number => {
  const trimmed = raw.trim();
  if (trimmed === '') return 0;
  const parsed = Number.parseInt(trimmed, 10);
  if (Number.isNaN(parsed)) return 0;
  return Math.min(99, Math.max(0, parsed));
};
