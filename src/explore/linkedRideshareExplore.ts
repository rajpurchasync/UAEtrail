import type { ExploreLinkedRideshareDTO, ExploreMapItemDTO } from '@uaetrail/shared-types';
import type { DiscoveryCardModel } from '../discovery/discoveryCardModel';
import { enrichExploreActivityRequirementBadges } from './exploreRequirementBadges';

/** Rideshares on the map whose `linkedActivityId` points at the parent activity. */
export const listLinkedRideshareExploreRows = (
  parentActivityId: string,
  items: ExploreMapItemDTO[]
): ExploreLinkedRideshareDTO[] =>
  items
    .filter(
      (item) =>
        item.source === 'activity' &&
        item.kind === 'rideshare' &&
        item.activity?.linkedActivityId === parentActivityId &&
        item.activity?.id
    )
    .map((item) => ({
      activityId: item.activity!.id,
      exploreItemId: item.id,
      title: item.title,
      path: item.path,
      subtitle: item.subtitle ?? null,
    }));

export const resolveLinkedRideshareRows = (
  parentItem: ExploreMapItemDTO,
  allItems: ExploreMapItemDTO[]
): ExploreLinkedRideshareDTO[] => {
  if (parentItem.linkedRideshareActivities?.length) {
    return parentItem.linkedRideshareActivities;
  }
  const parentId = parentItem.activity?.id;
  if (!parentId) return [];
  return listLinkedRideshareExploreRows(parentId, allItems);
};

const resolveLinkedParentOnActivity = (
  activity: ExploreMapItemDTO['activity'],
  allItems: ExploreMapItemDTO[]
): ExploreMapItemDTO['activity'] => {
  if (!activity?.linkedActivityId || activity.linkedParentActivity) return activity;
  const parentItem = allItems.find((entry) => entry.activity?.id === activity.linkedActivityId);
  if (!parentItem?.activity) return activity;
  return {
    ...activity,
    linkedParentActivity: {
      id: parentItem.activity.id,
      title: parentItem.title,
      activityType: parentItem.activity.activityType,
    },
  };
};

/** Parent hike / camp / event / outing — may have linked rideshare map rows. */
export const isDiscoveryParentOutingCard = (card: DiscoveryCardModel): boolean =>
  card.source === 'activity' && card.kind !== 'rideshare';

/** Apply linked rideshare rows, parent back-link on rideshare cards, and rideshare peek badges. */
export const finalizeDiscoveryCardLinkedRideshare = (
  card: DiscoveryCardModel,
  mapItem: ExploreMapItemDTO,
  allItems: ExploreMapItemDTO[]
): DiscoveryCardModel => {
  const linkedRideshares = resolveLinkedRideshareRows(mapItem, allItems);
  const activity = resolveLinkedParentOnActivity(card.activity, allItems);
  const hasLinkedRides = linkedRideshares.length > 0;
  const parentOuting = isDiscoveryParentOutingCard(card);
  const rideshareForBadges =
    parentOuting &&
    Boolean(mapItem.rideshareEnabled ?? activity?.rideshareEnabled ?? hasLinkedRides);

  const requirementBadges = enrichExploreActivityRequirementBadges(activity?.requirements, {
    kind: card.kind === 'destination' ? 'event' : card.kind,
    rideshareEnabled: rideshareForBadges,
    venueDifficulty: card.difficulty ?? null,
  });

  return {
    ...card,
    activity,
    linkedRideshares: hasLinkedRides ? linkedRideshares : undefined,
    requirementBadges,
  };
};
