/** Strip “, United Arab Emirates” before map/list browse matching (search + list surfaces). */
const SEARCH_WHERE_COUNTRY_SUFFIX_RE = /,\s*united arab emirates$/i;

export const exploreSearchWhereBrowseQuery = (query: string): string => {
  const q = query.trim();
  if (!q) return '';
  const stripped = q.replace(SEARCH_WHERE_COUNTRY_SUFFIX_RE, '').trim();
  return stripped || q;
};