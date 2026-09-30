/** Admin / seed tags: `facility:…` and `nearby:…` — shown on place detail, hidden from generic tag chips. */
const FACILITY_PREFIX = 'facility:';
const NEARBY_PREFIX = 'nearby:';

export type PlacePracticalInfo = {
  facilities: string[];
  nearby: string[];
  browseTags: string[];
};

const stripPrefix = (tag: string, prefix: string): string | null => {
  const lower = tag.toLowerCase();
  if (!lower.startsWith(prefix)) return null;
  const value = tag.slice(prefix.length).trim();
  return value.length > 0 ? value : null;
};

export const splitPlacePracticalTags = (tags: string[] | undefined | null): PlacePracticalInfo => {
  const facilities: string[] = [];
  const nearby: string[] = [];
  const browseTags: string[] = [];

  for (const raw of tags ?? []) {
    const tag = raw.trim();
    if (!tag) continue;
    const facility = stripPrefix(tag, FACILITY_PREFIX);
    if (facility) {
      facilities.push(facility);
      continue;
    }
    const near = stripPrefix(tag, NEARBY_PREFIX);
    if (near) {
      nearby.push(near);
      continue;
    }
    browseTags.push(tag);
  }

  return { facilities, nearby, browseTags };
};
