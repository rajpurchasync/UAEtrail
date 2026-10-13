import {
  exploreActivityPublisherTypeLabel,
  explorePersonRoleLabel,
  memberProfilePath,
  resolveActivityPublisherProfilePath,
} from '@uaetrail/shared-types';
import type { ExploreCardModel } from '../explore/exploreCardModel';
import { exploreCardIsSeeking } from '../explore/exploreCardModel';
import { ORGANIZER_NOUN_TITLE } from '../content/workspaceVocabulary';

export type ListFeedPublisher = {
  name: string;
  typeLabel: string;
  avatarUrl: string | null;
  profilePath: string | null;
};

const resolveListFeedPublisherTypeLabel = (card: ExploreCardModel): string => {
  const kind = card.activity?.publishingProfileKind ?? (card.source === 'activity' ? 'community' : null);
  if (card.source === 'activity' && kind) {
    return exploreActivityPublisherTypeLabel(kind);
  }
  const role = card.featuredPerson?.role;
  if (role) return explorePersonRoleLabel(role, kind);
  if (exploreCardIsSeeking(card)) return 'Looking for crew';
  if (card.source === 'shop' || card.source === 'agency') return 'Shop contact';
  if (card.source === 'activity') return ORGANIZER_NOUN_TITLE;
  if (card.source === 'venue') return 'Place';
  return 'Member';
};

/** Host / requester row for Instagram-style feed header. */
export const resolveListFeedPublisher = (card: ExploreCardModel): ListFeedPublisher => {
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
