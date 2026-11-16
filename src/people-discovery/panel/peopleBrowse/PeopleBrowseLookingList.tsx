import { useMemo } from 'react';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { buildDiscoveryMapListRowCard } from '@/discovery';
import type { DiscoveryCardModel } from '@/discovery/discoveryCardModel';
import { ExploreListRow } from '@/explore/ui/ExploreListRow';
import { EXPLORE_PEOPLE_BROWSE_EMPTY_DISCOVER_LOOKING, EXPLORE_PEOPLE_BROWSE_LOOKING_LOADING } from '../../../content/explorePeopleBrowseCopy';
import { PeopleBrowseListEmpty, PeopleBrowseListLoading } from './PeopleBrowseListStates';

type Props = {
  availabilityCatalogItems: ExploreMapItemDTO[];
  exploreCatalogItems: ExploreMapItemDTO[];
  loading: boolean;
  onOpenAvailabilityCatalogItem: (item: ExploreMapItemDTO) => void;
  buddyUserIds?: Set<string>;
};

/** Published seeking activities — compact `ExploreListRow`. */
export const PeopleBrowseLookingList = ({
  availabilityCatalogItems,
  exploreCatalogItems,
  loading,
  onOpenAvailabilityCatalogItem,
  buddyUserIds,
}: Props) => {
  const cardById = useMemo(() => {
    const map = new Map<string, DiscoveryCardModel>();
    for (const item of availabilityCatalogItems) {
      map.set(item.id, buildDiscoveryMapListRowCard(item, exploreCatalogItems));
    }
    return map;
  }, [availabilityCatalogItems, exploreCatalogItems]);

  if (loading && availabilityCatalogItems.length === 0) {
    return <PeopleBrowseListLoading label={EXPLORE_PEOPLE_BROWSE_LOOKING_LOADING} />;
  }

  if (availabilityCatalogItems.length === 0) {
    return <PeopleBrowseListEmpty>{EXPLORE_PEOPLE_BROWSE_EMPTY_DISCOVER_LOOKING}</PeopleBrowseListEmpty>;
  }

  return (
    <>
      {availabilityCatalogItems.map((item) => (
        <ExploreListRow
          key={item.id}
          card={cardById.get(item.id)!}
          onClick={() => onOpenAvailabilityCatalogItem(item)}
          buddyUserIds={buddyUserIds}
        />
      ))}
    </>
  );
};
