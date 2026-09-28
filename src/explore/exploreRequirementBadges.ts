type ActivityBadgeKind = 'hiking' | 'camping' | 'event' | 'shop' | 'agency' | 'carpool';

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
  /^Host(?: organization)?:/i,
  /^Policy:/i,
  /^Trail:/i,
  /^Camp:/i,
  /^Going from:/i,
  /^Host approval required/i,
  /^Open RSVP/i,
];

const dedupeBadges = (badges: string[]): string[] => [...new Set(badges)];

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
      badges.push('Pets welcome');
      continue;
    }
    if (/^No children$/i.test(trimmed)) {
      badges.push('No children');
      continue;
    }

    const ageMatch = trimmed.match(/^Age range:\s*(.+)$/i);
    if (ageMatch) {
      badges.push(`Ages ${ageMatch[1]}`);
      continue;
    }

    const minAgeMatch = trimmed.match(/^Minimum age:\s*(\d+)/i);
    if (minAgeMatch) {
      badges.push(`Ages ${minAgeMatch[1]}+`);
    }
  }

  return dedupeBadges(badges);
};

/** Map requirement lines to short peek/list chips (vehicle, difficulty, carpool). */
export const enrichExploreActivityRequirementBadges = (
  requirements: string[] | null | undefined,
  options: { kind: ActivityBadgeKind; carPoolEnabled?: boolean }
): string[] => {
  const items = requirements ?? [];
  const badges = extractExploreRequirementBadges(items);

  if (items.some((line) => /Reachable by 4x4 only/i.test(line)) && !badges.includes('4x4 required')) {
    badges.push('4x4 required');
  }

  for (const line of items) {
    if (/^Difficulty: Easy/i.test(line) && !badges.includes('Easy')) badges.push('Easy');
    if (/^Difficulty: Medium/i.test(line) && !badges.includes('Medium')) badges.push('Medium');
    if (/^Difficulty: Hard/i.test(line) && !badges.includes('Hard')) badges.push('Hard');
  }

  const hasNoChildren = items.some((line) => /^No children$/i.test(line.trim()));
  const hasNoPets = items.some((line) => /^No pets$/i.test(line.trim()));

  if (
    (options.kind === 'event' || options.kind === 'carpool') &&
    !hasNoChildren &&
    !badges.includes('Children welcome')
  ) {
    badges.push('Children welcome');
  }

  if (
    (options.kind === 'hiking' ||
      options.kind === 'camping' ||
      options.kind === 'event' ||
      options.kind === 'carpool') &&
    !hasNoPets &&
    !badges.includes('Pets welcome') &&
    !badges.includes('No pets')
  ) {
    badges.push('Pets welcome');
  }

  if (options.carPoolEnabled && options.kind !== 'carpool' && !badges.includes('Carpool available')) {
    badges.push('Carpool available');
  }

  return dedupeBadges(badges);
};
