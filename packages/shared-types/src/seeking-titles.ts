export type SeekingTitleKind = 'hiking' | 'camping' | 'event' | 'guide' | 'rideshare' | 'other';

/** Canonical stored title when the seeker did not provide a custom title. */
export const seekingFallbackTitle = (kind: SeekingTitleKind): string => {
  switch (kind) {
    case 'hiking':
      return 'Looking for hiking buddies';
    case 'camping':
      return 'Looking for camping plans';
    case 'event':
      return 'Looking for an event';
    case 'guide':
      return 'Looking for a guide';
    case 'rideshare':
      return 'Rideshare request';
    case 'other':
      return 'Outdoor plan request';
    default:
      return 'Community request';
  }
};

const EMBEDDED_PERSONA_SEEKING_TITLE_PATTERNS: RegExp[] = [
  /^.+ needs a (?:carpool|rideshare)$/i,
  /^.+ wants to go hiking$/i,
  /^.+ wants to go camping$/i,
  /^.+ is looking for an event$/i,
  /^.+ is looking for a guide$/i,
  /^.+ posted a plan$/i,
  /^.+ wants to go$/i,
];

/** Auto-titles that incorrectly embedded the requester name in the title string. */
export const isEmbeddedPersonaSeekingTitle = (title: string): boolean => {
  const trimmed = title.trim();
  if (!trimmed) return false;
  return EMBEDDED_PERSONA_SEEKING_TITLE_PATTERNS.some((pattern) => pattern.test(trimmed));
};

/** One-time migration helper — rewrite embedded persona titles to canonical fallbacks. */
export const normalizeEmbeddedPersonaSeekingTitle = (title: string, kind: SeekingTitleKind): string => {
  const trimmed = title.trim();
  if (!trimmed || isEmbeddedPersonaSeekingTitle(trimmed)) {
    return seekingFallbackTitle(kind);
  }
  return trimmed;
};

const isRetiredAutoActivityPrefixTitle = (title: string, kind: SeekingTitleKind): boolean => {
  const trimmed = title.trim();
  if (!trimmed) return true;
  if (kind === 'hiking' && /^hiking\b/i.test(trimmed)) return true;
  if (kind === 'camping' && /^camping\b/i.test(trimmed)) return true;
  if (kind === 'rideshare' && (/^carpool\b/i.test(trimmed) || /^rideshare\b/i.test(trimmed))) return true;
  return false;
};

/** True when explore list UI should synthesize a title instead of showing the stored string. */
export const isGenericSeekingTitle = (title: string, kind: SeekingTitleKind): boolean => {
  const trimmed = title.trim();
  if (!trimmed) return true;
  if (isEmbeddedPersonaSeekingTitle(trimmed)) return true;
  if (trimmed === seekingFallbackTitle(kind)) return true;
  if (kind === 'rideshare' && /^ride\s*share\s*request$/i.test(trimmed)) return true;
  return isRetiredAutoActivityPrefixTitle(trimmed, kind);
};
