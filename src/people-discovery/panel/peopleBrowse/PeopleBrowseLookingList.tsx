import { useMemo } from 'react';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { buildDiscoveryMapListRowCard } from '@/discovery';
import type { DiscoveryCardModel } from '@/discovery/discoveryCardModel';
import { discoverySelectionShowsOfferRideshare } from '@/discovery/discoveryOfferRideshareDispatch';
import { ExploreListRow } from '@/explore/ui/ExploreListRow';
import { HOSTING_OFFER_RIDESHARE_LABEL } from '@/explore/createFlowCopy';
import { EXPLORE_PEOPLE_BROWSE_EMPTY_DISCOVER_LOOKING, EXPLORE_PEOPLE_BROWSE_LOOKING_LOADING } from '../../../content/explorePeopleBrowseCopy';
import { PEOPLE_BROWSE_LIST_STACK } from './peopleBrowseListTheme';
import { PeopleBrowseListEmpty, PeopleBrowseListLoading } from './PeopleBrowseListStates';

type Props = {
  availabilityCatalogItems: ExploreMapItemDTO[];
  exploreCatalogItems: ExploreMapItemDTO[];
  loading: boolean;
  onOpenAvailabilityCatalogItem: (item: ExploreMapItemDTO) => void;
  onOfferRideshareForAvailabilityItem?: (item: ExploreMapItemDTO) => void;
  buddyUserIds?: Set<string>;
};

/** Published seeking activities — compact `ExploreListRow`. */
export const PeopleBrowseLookingList = ({
  availabilityCatalogItems,
  exploreCatalogItems,
  loading,
  onOpenAvailabilityCatalogItem,
  onOfferRideshareForAvailabilityItem,
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
    <div className={PEOPLE_BROWSE_LIST_STACK}>
      {availabilityCatalogItems.map((item) => {
        const showOffer =
          onOfferRideshareForAvailabilityItem != null && discoverySelectionShowsOfferRideshare(item);
        return (
          <div key={item.id} className="flex flex-col gap-1.5">
            <ExploreListRow
              card={cardById.get(item.id)!}
              onClick={() => onOpenAvailabilityCatalogItem(item)}
              buddyUserIds={buddyUserIds}
            />
            {showOffer ? (
              <button
                type="button"
                onClick={() => onOfferRideshareForAvailabilityItem(item)}
                className="w-full rounded-xl border border-emerald-200/80 bg-emerald-50 py-2 text-center text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100"
              >
                {HOSTING_OFFER_RIDESHARE_LABEL}
              </button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};
