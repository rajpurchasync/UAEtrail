import type {
  BuddyActivityPresenceRowDTO,
  ExploreActivityRefDTO,
  ExploreMapItemDTO,
} from '@uaetrail/shared-types';
import type { ExploreActivityDatePreset } from './exploreActivityDateFilter';
import { matchesActivityDateFilter } from './exploreActivityDateFilter';

const activityHostUserId = (item: ExploreMapItemDTO): string | null => {
  if (item.source !== 'activity' || !item.activity) return null;
  return item.featuredPerson?.userId ?? item.activity.hostUserId ?? item.activity.hostId ?? null;
};

/** Outings the viewer hosts or is going on — eligible to send Join me invites from. */
export const buildViewerInvitableActivityRefs = (
  items: ExploreMapItemDTO[],
  viewerUserId: string,
  activityDatePreset: ExploreActivityDatePreset
): ExploreActivityRefDTO[] => {
  const seen = new Set<string>();
  const refs: ExploreActivityRefDTO[] = [];

  for (const item of items) {
    if (item.source !== 'activity' || !item.activity) continue;
    if (!matchesActivityDateFilter(item, activityDatePreset)) continue;
    if (item.viewerAccess?.exposure === 'none') continue;

    const activityId = item.activity.id;
    if (seen.has(activityId)) continue;

    const hostId = activityHostUserId(item);
    const isHost = hostId === viewerUserId;
    const isGoing = (item.participantPreviews ?? []).some((preview) => preview.id === viewerUserId);
    if (!isHost && !isGoing) continue;

    seen.add(activityId);
    refs.push({
      exploreItemId: item.id,
      activityId,
      title: item.activity.title ?? item.title ?? 'Outing',
    });
  }

  return refs;
};

export const invitableActivitiesForBuddy = (
  invitable: ExploreActivityRefDTO[],
  row: BuddyActivityPresenceRowDTO
): ExploreActivityRefDTO[] => {
  const alreadyOn = new Set<string>();
  if (row.hosting) alreadyOn.add(row.hosting.activityId);
  if (row.joining) alreadyOn.add(row.joining.activityId);
  return invitable.filter((ref) => !alreadyOn.has(ref.activityId));
};

/** Host-owned outings first, then other trips the viewer is going on. */
export const sortJoinInviteTargetsForViewer = (
  targets: ExploreActivityRefDTO[],
  mapItems: ExploreMapItemDTO[],
  viewerUserId: string
): ExploreActivityRefDTO[] => {
  const hostScore = (ref: ExploreActivityRefDTO) => {
    const item = mapItems.find((entry) => entry.activity?.id === ref.activityId);
    return activityHostUserId(item ?? ({} as ExploreMapItemDTO)) === viewerUserId ? 0 : 1;
  };
  return [...targets].sort((a, b) => hostScore(a) - hostScore(b));
};

export const listJoinInviteActivitiesForBuddy = (
  invitable: ExploreActivityRefDTO[],
  row: BuddyActivityPresenceRowDTO,
  mapItems: ExploreMapItemDTO[],
  viewerUserId: string
): ExploreActivityRefDTO[] =>
  sortJoinInviteTargetsForViewer(invitableActivitiesForBuddy(invitable, row), mapItems, viewerUserId);

/** Prefer an outing the viewer hosts; otherwise first eligible trip. */
export const pickJoinInviteActivityForBuddy = (
  invitable: ExploreActivityRefDTO[],
  row: BuddyActivityPresenceRowDTO,
  mapItems: ExploreMapItemDTO[],
  viewerUserId: string
): ExploreActivityRefDTO | null => {
  const targets = listJoinInviteActivitiesForBuddy(invitable, row, mapItems, viewerUserId);
  return targets[0] ?? null;
};
