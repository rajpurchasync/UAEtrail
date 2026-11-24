import type { ExploreActivityRefDTO } from '@uaetrail/shared-types';

export const friendPresenceFootnote = (
  hosting: ExploreActivityRefDTO | null,
  joining: ExploreActivityRefDTO | null
): { text: string | null; activityId: string | null } => {
  if (joining) {
    return { text: `Going · ${joining.title}`, activityId: joining.activityId };
  }
  if (hosting) {
    return { text: `Hosting · ${hosting.title}`, activityId: hosting.activityId };
  }
  return { text: null, activityId: null };
};

export const formatFriendSince = (iso: string) =>
  `Friends since ${new Date(iso).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}`;

export const formatFollowingSince = (iso: string) =>
  `Following since ${new Date(iso).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}`;