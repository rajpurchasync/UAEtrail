import { isRetiredSeekingActivityModeValue, resolveParticipationMode } from '@uaetrail/shared-types';
import type { DiscoveryCardModel } from '../discovery/discoveryCardModel';

const MAP_PEEK_JOIN_MODE_RSVP = 'Open RSVP';
const MAP_PEEK_JOIN_MODE_APPROVAL = 'Host approval';

/** How joining works — separate from footer CTA wording. */
export const resolveActivityMapPeekJoinModeLabel = (card: DiscoveryCardModel): string | null => {
  if (card.source !== 'activity') return null;
  if (isRetiredSeekingActivityModeValue(card.activityMode)) return null;

  const mode = resolveParticipationMode(
    card.activity?.participationMode,
    card.activity?.requirements
  );
  return mode === 'rsvp' ? MAP_PEEK_JOIN_MODE_RSVP : MAP_PEEK_JOIN_MODE_APPROVAL;
};

export const MAP_PEEK_JOIN_MODE_LABELS = {
  rsvp: MAP_PEEK_JOIN_MODE_RSVP,
  approval: MAP_PEEK_JOIN_MODE_APPROVAL,
} as const;