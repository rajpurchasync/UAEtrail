import { useMemo } from 'react';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { buildDiscoveryMapListRowCard } from '@/discovery';
import type { DiscoveryCardModel } from '@/discovery/discoveryCardModel';
import { BrowseCompactRow } from '../browse/BrowseCompactRow';
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
}: Props) => {
  const cards = useMemo(() => {
    const list: DiscoveryCardModel[] = [];
    for (const item of agencyItems) {
      list.push(buildDiscoveryMapListRowCard(item, exploreCatalogItems));
    }
    return list;
  }, [agencyItems, exploreCatalogItems]);

  if (loading && agencyItems.length === 0) {
    return <CrewBrowseListLoading label="Loading operators…" />;
  }

  if (agencyItems.length === 0) {
    return <CrewBrowseListEmpty>{EMPTY}</CrewBrowseListEmpty>;
  }

  return (
    <ul className={CREW_BROWSE_LIST_STACK}>
      {cards.map((card) => (
        <li key={card.id}>
          <BrowseCompactRow card={card} />
        </li>
      ))}
    </ul>
  );
};