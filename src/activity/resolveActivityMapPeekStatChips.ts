import type { DiscoveryCardModel } from '../discovery/discoveryCardModel';
import { discoveryCardIsSeeking } from '../discovery/discoveryCardModel';
import { truncateMapPeekChipLabel } from './resolveActivityMapPeekChipLabels';
import { resolveTripBrowseCardCopy } from '../list/browse/tripBrowseCardCopy';
import { LIST_FEED_CTA_CARPOOL } from '../list/listFeedCtaCopy';

export type ActivityMapPeekStatChipTone = 'neutral' | 'accent' | 'sky';

export type ActivityMapPeekStatChipIcon = 'spots' | 'carpool' | 'route' | 'fact';

export type ActivityMapPeekStatChip = {
  id: string;
  label: string;
  tone: ActivityMapPeekStatChipTone;
  icon: ActivityMapPeekStatChipIcon;
};

const normalize = (value: string) => value.trim().toLowerCase();

/** Kind-specific chips only — rideshare route/seats, seeking, informational carpool hint. */
export const resolveActivityMapPeekStatChips = (card: DiscoveryCardModel): ActivityMapPeekStatChip[] => {
  if (card.source !== 'activity') return [];

  const chips: ActivityMapPeekStatChip[] = [];
  const seen = new Set<string>();

  const push = (
    id: string,
    label: string,
    tone: ActivityMapPeekStatChipTone,
    icon: ActivityMapPeekStatChipIcon
  ) => {
    const key = normalize(label);
    if (!key || seen.has(key) || chips.length >= 4) return;
    seen.add(key);
    chips.push({ id, label: truncateMapPeekChipLabel(label), tone, icon });
  };

  const browse = resolveTripBrowseCardCopy(card);

  if (card.kind === 'rideshare') {
    const routeText = card.routeLabel?.trim();
    const routeDetail = card.sections.details.find((detail) => detail.icon === 'route')?.label?.trim();
    const combined = routeText || routeDetail || null;
    if (combined) {
      const split = combined.split(/\s+to\s+/i);
      if (split.length === 2 && split[0] && split[1]) {
        push('rideshare-from', `From ${split[0]!}`, 'neutral', 'route');
        push('rideshare-to', `To ${split[1]!}`, 'neutral', 'route');
      } else {
        push('route', combined, 'sky', 'route');
      }
    }
    const activity = card.activity;
    const seats = activity?.slotsAvailable ?? activity?.slotsTotal ?? null;
    if (seats != null && seats > 0 && chips.length < 4) {
      push('rideshare-seats', `${seats} seat${seats === 1 ? '' : 's'}`, 'accent', 'spots');
    }
  } else if (discoveryCardIsSeeking(card)) {
    push(
      'seeking',
      browse.factLabels.find((l) => /looking/i.test(l)) ?? 'Looking for crew',
      'sky',
      'fact'
    );
  }

  if (browse.carpool && card.kind !== 'rideshare' && !browse.carpool.exploreItemId) {
    push('carpool', browse.carpool.label || LIST_FEED_CTA_CARPOOL, 'sky', 'carpool');
  }

  return chips;
};