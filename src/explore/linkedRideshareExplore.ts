import type { ExploreLinkedRideshareDTO, ExploreMapItemDTO } from '@uaetrail/shared-types';

/** Rideshares on the map whose `linkedActivityId` points at the parent activity. */
export const listLinkedRideshareExploreRows = (
  parentActivityId: string,
  items: ExploreMapItemDTO[]
): ExploreLinkedRideshareDTO[] =>
  items
    .filter(
      (item) =>
        item.source === 'activity' &&
        item.kind === 'carpool' &&
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
