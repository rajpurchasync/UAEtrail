/** Public profile — account join line under the hero. */
export const formatMemberJoinedLabel = (memberSinceIso: string): string | null => {
  const date = new Date(memberSinceIso);
  if (Number.isNaN(date.getTime())) return null;
  const formatted = date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  return `Joined ${formatted}`;
};
