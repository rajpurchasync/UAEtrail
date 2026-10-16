/** Curated area label from `area:…` tags on registry places. */
export const resolvePlaceAreaLabelFromTags = (tags: string[] | undefined | null): string | null => {
  for (const raw of tags ?? []) {
    const tag = raw.trim();
    if (tag.toLowerCase().startsWith('area:')) {
      const name = tag.slice('area:'.length).trim();
      if (name) return name;
    }
  }
  return null;
};
