import { exploreActivityPublisherTypeLabel } from './activity-publisher-display.js';
import {
  HOST_FALLBACK_DISPLAY_NAME,
  resolveHostPersonDisplayName,
} from './host-display.js';
import type { PublishingProfileKind } from './publishing-profile-kind.js';
import { isRolePlaceholderDisplayName } from './host-display.js';
import { exploreMapItemIsSeeking, type ExploreMapItemActivityModeFields } from './explore-activity-mode.js';
import type { ExploreMapSourceWire } from './wire-lexicon.js';

/** How a featured user relates to an explore map/list item. */
export type ExploreMapPersonRole = 'organizer' | 'host' | 'requester' | 'contact';

/** Wire `organizer` is a read alias — canonical role is `host` (UPL Host / BWL `host_id`). */
export const canonicalExploreMapPersonRole = (
  role: ExploreMapPersonRole
): 'host' | 'requester' | 'contact' => (role === 'organizer' ? 'host' : role);

export interface ExploreMapPersonDTO {
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  role: ExploreMapPersonRole;
}

type ExploreMapSourceLike = ExploreMapSourceWire;

export type ExploreFeaturedPersonInput = ExploreMapItemActivityModeFields & {
  source?: ExploreMapSourceLike;
  featuredPerson?: ExploreMapPersonDTO | null;
  hostName?: string | null;
  hostAvatar?: string | null;
  requesterUserId?: string | null;
  activity?: {
    hostName?: string | null;
    hostUserId?: string | null;
    hostAvatar?: string | null;
    createdByName?: string | null;
    tenantName?: string | null;
    publishingProfileKind?: PublishingProfileKind | null;
  } | null;
};

const PLACEHOLDER_FIRST_NAMES = new Set(['pending', 'user', 'guest', 'account', 'new']);

export const formatExplorePersonDisplayName = (name?: string | null): string => {
  const trimmed = name?.trim();
  if (!trimmed || isRolePlaceholderDisplayName(trimmed)) return 'Community member';
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length > 1) return trimmed;
  if (PLACEHOLDER_FIRST_NAMES.has(parts[0].toLowerCase())) return 'Community member';
  return trimmed;
};

export const explorePersonFirstName = (person?: ExploreMapPersonDTO | null): string => {
  const displayName = formatExplorePersonDisplayName(person?.displayName);
  if (displayName === 'Community member') {
    return person?.role === 'host' || person?.role === 'organizer'
      ? HOST_FALLBACK_DISPLAY_NAME
      : 'Community member';
  }
  return displayName.split(/\s+/)[0];
};

/** Full display name for explore list rows, peek headlines, and section highlights. */
export const explorePersonHeadlineName = (person?: ExploreMapPersonDTO | null): string => {
  const displayName = formatExplorePersonDisplayName(person?.displayName);
  if (displayName === 'Community member') {
    return person?.role === 'host' || person?.role === 'organizer'
      ? HOST_FALLBACK_DISPLAY_NAME
      : 'Community member';
  }
  return displayName;
};

export const explorePersonRoleLabel = (
  role: ExploreMapPersonRole,
  publishingProfileKind?: PublishingProfileKind | null
): string => {
  switch (role) {
    case 'requester':
      return 'Posted this request';
    case 'contact':
      return 'Shop contact';
    case 'organizer':
    case 'host':
    default:
      return exploreActivityPublisherTypeLabel(publishingProfileKind);
  }
};

export const buildExploreFeaturedPerson = (input: {
  userId?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  role: ExploreMapPersonRole;
}): ExploreMapPersonDTO | null => {
  const userId = input.userId?.trim();
  const displayName = input.displayName?.trim();
  if (!userId || !displayName) return null;
  return {
    userId,
    displayName,
    avatarUrl: input.avatarUrl ?? null,
    role: canonicalExploreMapPersonRole(input.role),
  };
};

/** Resolve featured person from canonical field or legacy explore map fields (cached payloads). */
export const resolveExploreFeaturedPerson = (
  item: ExploreFeaturedPersonInput
): ExploreMapPersonDTO | null => {
  if (item.featuredPerson?.userId && item.featuredPerson.displayName?.trim()) {
    return {
      ...item.featuredPerson,
      role: canonicalExploreMapPersonRole(item.featuredPerson.role),
    };
  }

  const source = item.source;
  const activity = item.activity;

  if (exploreMapItemIsSeeking(item) || source === 'demand') {
    const displayName =
      resolveHostPersonDisplayName({
        guideName: activity?.hostName ?? item.hostName,
        createdByName: activity?.createdByName,
        tenantName: activity?.tenantName,
      }) ??
      activity?.createdByName ??
      item.hostName;
    return buildExploreFeaturedPerson({
      userId: item.requesterUserId ?? activity?.hostUserId,
      displayName,
      avatarUrl: item.hostAvatar ?? activity?.hostAvatar,
      role: 'requester',
    });
  }

  if (source === 'shop') {
    return buildExploreFeaturedPerson({
      userId: item.requesterUserId,
      displayName: item.hostName,
      avatarUrl: item.hostAvatar,
      role: 'contact',
    });
  }

  if (source === 'activity') {
    const displayName =
      resolveHostPersonDisplayName({
        guideName: activity?.hostName ?? item.hostName,
        createdByName: activity?.createdByName,
        tenantName: activity?.tenantName,
      }) ??
      activity?.hostName ??
      item.hostName;
    return buildExploreFeaturedPerson({
      userId: activity?.hostUserId,
      displayName,
      avatarUrl: activity?.hostAvatar ?? item.hostAvatar,
      role: 'host',
    });
  }

  return null;
};
