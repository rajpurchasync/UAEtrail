import {
  exploreActivityPublisherTypeLabel,
  explorePersonRoleLabel,
  isGeographyMapSource,
  memberProfilePath,
  resolveActivityPublisherProfilePath,
} from '@uaetrail/shared-types';
import type { DiscoveryCardModel } from '../discovery/discoveryCardModel';
import { discoveryCardIsSeeking } from '../discovery/discoveryCardModel';
import { ACTIVITY_HOST_NOUN_TITLE } from '../content/workspaceVocabulary';

export type ListFeedPublisher = {
  name: string;
  typeLabel: string;
  avatarUrl: string | null;
  profilePath: string | null;
};

const resolveListFeedPublisherTypeLabel = (card: DiscoveryCardModel): string => {
  const kind = card.activity?.publishingProfileKind ?? (card.source === 'activity' ? 'community' : null);
  if (card.source === 'activity' && kind) {
    return exploreActivityPublisherTypeLabel(kind);
  }
  const role = card.featuredPerson?.role;
  if (role) return explorePersonRoleLabel(role, kind);
  if (discoveryCardIsSeeking(card)) return 'Looking for crew';
  if (card.source === 'shop' || card.source === 'agency') return 'Shop contact';
  if (card.source === 'activity') return ACTIVITY_HOST_NOUN_TITLE;
  if (card.source === 'facility') return 'Facility';
  if (isGeographyMapSource(card.source)) return 'Place';
  return 'Member';
};

/** Host / requester row for Instagram-style feed header. */
export const resolveListFeedPublisher = (card: DiscoveryCardModel): ListFeedPublisher => {
  const name =
    card.listHost?.trim() ||
    card.featuredPerson?.displayName?.trim() ||
    card.sections.hostName?.trim() ||
    card.sections.highlightName?.trim() ||
    'Member';

  const activity = card.activity;
  const profilePath =
    card.source === 'activity' && activity
      ? resolveActivityPublisherProfilePath({
          publishingProfileKind: activity.publishingProfileKind ?? 'community',
          tenantSlug: activity.tenantSlug,
          hostUserId: activity.hostUserId ?? card.profileUserId,
        })
      : memberProfilePath(card.profileUserId);

  return {
    name,
    typeLabel: resolveListFeedPublisherTypeLabel(card),
    avatarUrl: card.hostAvatar ?? card.featuredPerson?.avatarUrl ?? null,
    profilePath,
  };
};
