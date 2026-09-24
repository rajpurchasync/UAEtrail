/** Case-insensitive match against activity title, location, or other list fields. */
export const matchesActivitySearch = (
  query: string,
  ...parts: (string | null | undefined)[]
): boolean => {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return parts.some((part) => part?.toLowerCase().includes(normalized));
};
