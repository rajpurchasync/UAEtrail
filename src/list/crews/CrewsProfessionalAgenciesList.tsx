import { useMemo } from 'react';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { buildDiscoveryMapListRowCard } from '@/discovery';
import type { DiscoveryCardModel } from '@/discovery/discoveryCardModel';
import { ExploreListRow } from '@/explore/ui/ExploreListRow';
import { CREW_BROWSE_LIST_STACK } from '@/crew-discovery/panel/crewBrowse/crewBrowseListTheme';
import { CrewBrowseListEmpty, CrewBrowseListLoading } from '@/crew-discovery/panel/crewBrowse/CrewBrowseListStates';

type Props = {
  agencyItems: ExploreMapItemDTO[];
  exploreCatalogItems: ExploreMapItemDTO[];
  loading: boolean;
  onOpenAgencyItem: (item: ExploreMapItemDTO) => void;
};

const EMPTY = 'No tour operators on the map right now — try another area or check Places.';

export const CrewsProfessionalAgenciesList = ({
  agencyItems,
  exploreCatalogItems,
  loading,
  onOpenAgencyItem,
}: Props) => {
  const cardById = useMemo(() => {
    const map = new Map<string, DiscoveryCardModel>();
    for (const item of agencyItems) {
      map.set(item.id, buildDiscoveryMapListRowCard(item, exploreCatalogItems));
    }
    return map;
  }, [agencyItems, exploreCatalogItems]);

  if (loading && agencyItems.length === 0) {
    return <CrewBrowseListLoading label="Loading operators…" />;
  }

  if (agencyItems.length === 0) {
    return <CrewBrowseListEmpty>{EMPTY}</CrewBrowseListEmpty>;
  }

  return (
    <div className={CREW_BROWSE_LIST_STACK}>
      {agencyItems.map((item) => (
        <ExploreListRow
          key={item.id}
          card={cardById.get(item.id)!}
          onClick={() => onOpenAgencyItem(item)}
        />
      ))}
    </div>
  );
};