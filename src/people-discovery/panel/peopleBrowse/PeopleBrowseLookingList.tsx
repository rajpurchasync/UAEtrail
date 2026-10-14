import { useMemo } from 'react';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { buildDiscoveryMapListRowCard } from '@/discovery';
import type { ExploreCardModel } from '@/explore/exploreCardModel';
import { ExploreListRow } from '@/explore/ui/ExploreListRow';
import { ExploreListSkeleton } from '@/explore/ui/ExploreListSkeleton';
import { EXPLORE_PEOPLE_BROWSE_EMPTY_DISCOVER_LOOKING } from '../../../content/explorePeopleBrowseCopy';
import { PeopleBrowseListEmpty } from './PeopleBrowseListStates';

type Props = {
  seekingActivities: ExploreMapItemDTO[];
  exploreCatalogItems: ExploreMapItemDTO[];
  loading: boolean;
  onOpenSeekingActivity: (item: ExploreMapItemDTO) => void;
  buddyUserIds?: Set<string>;
};

/** Published seeking activities — same `ExploreListRow` as the Activities list. */
export const PeopleBrowseLookingList = ({
  seekingActivities,
  exploreCatalogItems,
  loading,
  onOpenSeekingActivity,
  buddyUserIds,
}: Props) => {
  const cardById = useMemo(() => {
    const map = new Map<string, ExploreCardModel>();
    for (const item of seekingActivities) {
      map.set(item.id, buildDiscoveryMapListRowCard(item, exploreCatalogItems));
    }
    return map;
  }, [seekingActivities, exploreCatalogItems]);

  if (loading && seekingActivities.length === 0) {
    return <ExploreListSkeleton rows={6} />;
  }

  if (seekingActivities.length === 0) {
    return <PeopleBrowseListEmpty>{EXPLORE_PEOPLE_BROWSE_EMPTY_DISCOVER_LOOKING}</PeopleBrowseListEmpty>;
  }

  return (
    <>
      {seekingActivities.map((item) => (
        <ExploreListRow
          key={item.id}
          card={cardById.get(item.id)!}
          onClick={() => onOpenSeekingActivity(item)}
          buddyUserIds={buddyUserIds}
        />
      ))}
    </>
  );
};
