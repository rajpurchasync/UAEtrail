const SKIP_BADGE_PATTERNS = [
  /^Open:/i,
  /^Private:/i,
  /^Flexible time/i,
  /^General area/i,
  /^Shared cost:/i,
  /^Instructions:/i,
  /^Reachable by/i,
  /^Vehicle:/i,
  /^Difficulty:/i,
  /^Fitness level:/i,
  /^Carpool needed/i,
  /^No carpool needed/i,
  /^Audience:/i,
  /^Custom audience restriction/i,
  /^What to bring:/i,
  /^Recommendation:/i,
  /^Camping surface:/i,
  /^Host organization:/i,
  /^Policy:/i,
];

/** Pull user-facing restriction badges from stored requirement lines. */
export const extractExploreRequirementBadges = (requirements?: string[] | null): string[] => {
  if (!requirements?.length) return [];

  const badges: string[] = [];
  for (const raw of requirements) {
    const trimmed = raw.trim();
    if (!trimmed || SKIP_BADGE_PATTERNS.some((pattern) => pattern.test(trimmed))) continue;

    if (/^Women only$/i.test(trimmed)) {
      badges.push('Women only');
      continue;
    }
    if (/^No pets$/i.test(trimmed)) {
      badges.push('No pets');
      continue;
    }
    if (/^Pets allowed$/i.test(trimmed)) {
      badges.push('Pets allowed');
      continue;
    }
    if (/^No children$/i.test(trimmed)) {
      badges.push('No children');
      continue;
    }

    const ageMatch = trimmed.match(/^Age range:\s*(.+)$/i);
    if (ageMatch) {
      badges.push(`Ages ${ageMatch[1]}`);
    }
  }

  return badges;
};
