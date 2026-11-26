import type { DiscoveryCardModel } from '../discovery/discoveryCardModel';
import { resolveTripBrowseCardCopy } from '../discovery/discoveryPortListPeek';
import { LIST_FEED_CTA_CARPOOL } from '../discovery/discoveryPortListFeedCta';
import { resolveActivityMapPeekStrips } from './activityPeekEngagement';
import type { JoinRequestUiState } from '../utils/joinRequestUi';

export type ActivityMapPeekSituationalModule =
  | {
      id: string;
      kind: 'carpool';
      label: string;
      exploreItemId: string;
    }
  | {
      id: string;
      kind: 'linked_parent';
      label: string;
      exploreItemId: string | null;
    };

/** Tappable rows below stat grid — carpool pin / linked parent rideshare. */
export const resolveActivityMapPeekSituationalModules = (
  card: DiscoveryCardModel,
  joinUiState?: JoinRequestUiState
): ActivityMapPeekSituationalModule[] => {
  if (card.source !== 'activity') return [];

  const strips = resolveActivityMapPeekStrips(card, joinUiState);
  if (!strips.showLogisticsStrip) return [];

  const modules: ActivityMapPeekSituationalModule[] = [];
  const browse = resolveTripBrowseCardCopy(card);

  if (browse.carpool?.exploreItemId) {
    modules.push({
      id: 'carpool',
      kind: 'carpool',
      label: browse.carpool.label || LIST_FEED_CTA_CARPOOL,
      exploreItemId: browse.carpool.exploreItemId,
    });
  }

  if (card.kind === 'rideshare' && card.activity?.linkedParentActivity) {
    const parent = card.activity.linkedParentActivity;
    modules.push({
      id: 'linked-parent',
      kind: 'linked_parent',
      label: parent.title?.trim() || 'View parent outing',
      exploreItemId: parent.id,
    });
  } else if (!browse.carpool && (card.linkedRideshares?.length ?? 0) > 0) {
    const linked = card.linkedRideshares?.[0];
    if (linked?.exploreItemId) {
      modules.push({
        id: `rideshare-${linked.exploreItemId}`,
        kind: 'carpool',
        label: linked.title?.trim() || LIST_FEED_CTA_CARPOOL,
        exploreItemId: linked.exploreItemId,
      });
    }
  }

  return modules;
};