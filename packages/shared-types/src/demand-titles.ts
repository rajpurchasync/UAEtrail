export type DemandTitleKind = 'hiking' | 'camping' | 'event' | 'guide' | 'carpool' | 'other';

/** Canonical stored title when the user did not provide a custom plan name. */
export const demandFallbackTitle = (kind: DemandTitleKind): string => {
  switch (kind) {
    case 'hiking':
      return 'Looking for hiking buddies';
    case 'camping':
      return 'Looking for camping plans';
    case 'event':
      return 'Looking for an event';
    case 'guide':
      return 'Looking for a guide';
    case 'carpool':
      return 'Ride share request';
    case 'other':
      return 'Outdoor plan request';
    default:
      return 'Community request';
  }
};

const LEGACY_EMBEDDED_DEMAND_TITLE_PATTERNS: RegExp[] = [
  /^.+ needs a carpool$/i,
  /^.+ wants to go hiking$/i,
  /^.+ wants to go camping$/i,
  /^.+ is looking for an event$/i,
  /^.+ is looking for a guide$/i,
  /^.+ posted a plan$/i,
  /^.+ wants to go$/i,
];

/** Legacy auto-titles that incorrectly embedded the requester name in the title string. */
export const isLegacyEmbeddedDemandTitle = (title: string): boolean => {
  const trimmed = title.trim();
  if (!trimmed) return false;
  return LEGACY_EMBEDDED_DEMAND_TITLE_PATTERNS.some((pattern) => pattern.test(trimmed));
};

/** One-time migration helper — rewrite legacy embedded titles to canonical fallbacks. */
export const normalizeLegacyDemandTitle = (title: string, kind: DemandTitleKind): string => {
  const trimmed = title.trim();
  if (!trimmed || isLegacyEmbeddedDemandTitle(trimmed)) {
    return demandFallbackTitle(kind);
  }
  return trimmed;
};

const isLegacyAutoActivityPrefixTitle = (title: string, kind: DemandTitleKind): boolean => {
  const trimmed = title.trim();
  if (!trimmed) return true;
  if (kind === 'hiking' && /^hiking\b/i.test(trimmed)) return true;
  if (kind === 'camping' && /^camping\b/i.test(trimmed)) return true;
  if (kind === 'carpool' && /^carpool\b/i.test(trimmed)) return true;
  return false;
};

/** True when explore list UI should synthesize a title instead of showing the stored string. */
export const isGenericDemandPlanTitle = (title: string, kind: DemandTitleKind): boolean => {
  const trimmed = title.trim();
  if (!trimmed) return true;
  if (isLegacyEmbeddedDemandTitle(trimmed)) return true;
  if (trimmed === demandFallbackTitle(kind)) return true;
  return isLegacyAutoActivityPrefixTitle(trimmed, kind);
};
