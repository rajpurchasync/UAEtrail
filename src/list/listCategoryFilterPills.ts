import type { MapFilterKey } from '../config/routingCatalog';
import type { BrowseListFilterState, BrowsePriceFilter, BrowseWhenFilter } from './browseListFilters';
import type { BrowseMainCategoryKey } from './browseListTaxonomy';
import {
  BROWSE_TRIP_TOPIC_FILTERS,
  toggleBrowseTripTopicInList,
  type BrowseTripTopicKey,
} from './browseListTripTopics';
import { listVenuePlaceTopicsForUi, toggleListVenuePlaceTopic } from './listVenuePlaceTopics';
export type ListCategoryPill = {
  id: string;
  label: string;
  /** Topic pills — map filter key for emoji chip. */
  filterKey?: MapFilterKey;
  /** Static emoji when not using `filterKey` (e.g. Buddies segments). */
  segmentEmoji?: string;
  active: boolean;
  onToggle: () => void;
};

export type ListCategoryPillGroup = {
  id: string;
  label: string;
  pills: ListCategoryPill[];
};

const togglePrice = (price: BrowsePriceFilter, key: 'free' | 'paid'): BrowsePriceFilter =>
  price === key ? 'all' : key;

const toggleWhen = (when: BrowseWhenFilter, key: 'week' | 'weekend'): BrowseWhenFilter =>
  when === key ? 'any' : key;

export const LIST_VENUE_REGION_PILLS = [
  'Dubai',
  'Abu Dhabi',
  'Sharjah',
  'RAK',
  'Fujairah',
  'Al Ain',
] as const;

const REGION_PILLS = LIST_VENUE_REGION_PILLS;

export const toggleListVenueRegion = (selected: readonly string[], region: string): string[] => {
  const set = new Set(selected);
  if (set.has(region)) set.delete(region);
  else set.add(region);
  return REGION_PILLS.filter((r) => set.has(r));
};

export const listCategorySecondaryFiltersActive = (
  category: BrowseMainCategoryKey,
  filters: BrowseListFilterState,
  venueRegions: string[]
): boolean => {
  if (category === 'activities') {
    return (
      filters.price !== 'all' ||
      filters.when !== 'any' ||
      filters.activityDatePreset !== 'anyday'
    );
  }
  if (category === 'venues') {
    return venueRegions.length > 0 || filters.placeTopics.length > 0;
  }
  if (category === 'people') {
    return false;
  }
  if (category === 'guides' || category === 'agencies') {
    return venueRegions.length > 0;
  }
  return false;
};

/** Activity / place-type pills only — price & time live in the filter sheet. */
export const buildListCategoryPrimaryPills = (
  category: BrowseMainCategoryKey,
  filters: BrowseListFilterState,
  sync: (patch: Partial<BrowseListFilterState> & { regions?: string[] }) => void
): ListCategoryPill[] => {
  if (category === 'activities') {
    const topicPills = BROWSE_TRIP_TOPIC_FILTERS.map(({ key, label }) => ({
      id: `topic-${key}`,
      label,
      filterKey: key,
      active: !filters.tripLookingOnly && filters.tripTopics.includes(key as BrowseTripTopicKey),
      onToggle: () => {
        const nextTopics = toggleBrowseTripTopicInList(filters.tripTopics, key as BrowseTripTopicKey);
        sync({ tripTopics: nextTopics, tripLookingOnly: false, placeTopics: [] });
      },
    }));
    return [
      ...topicPills,
      {
        id: 'topic-looking',
        label: 'Looking for',
        active: filters.tripLookingOnly,
        onToggle: () =>
        sync({
          tripLookingOnly: !filters.tripLookingOnly,
          tripTopics: [],
          placeTopics: [],
        }),
      },
    ];
  }

  if (category === 'people' || category === 'guides' || category === 'agencies') {
    return [];
  }

  if (category === 'venues') {
    return listVenuePlaceTopicsForUi().map(({ key, label, filterKey }) => ({
      id: `place-topic-${key}`,
      label,
      filterKey:
        filterKey === 'facilities'
          ? undefined
          : filterKey === 'shops'
            ? 'shops'
            : (filterKey as MapFilterKey),
      active: filters.placeTopics.includes(key),
      onToggle: () =>
        sync({
          placeTopics: toggleListVenuePlaceTopic(filters.placeTopics, key),
          tripTopics: [],
          tripLookingOnly: false,
        }),
    }));
  }

  return [];
};

/** @deprecated Use primary pills + ListCategoryMoreFiltersSheet */
export const buildListCategoryPillGroups = (
  category: BrowseMainCategoryKey,
  filters: BrowseListFilterState,
  venueRegions: string[],
  sync: (patch: Partial<BrowseListFilterState> & { regions?: string[] }) => void
): ListCategoryPillGroup[] => {
  const groups: ListCategoryPillGroup[] = [];

  if (category === 'activities') {
    groups.push({
      id: 'type',
      label: 'Activity',
      pills: BROWSE_TRIP_TOPIC_FILTERS.map(({ key, label }) => ({
        id: `topic-${key}`,
        label,
        filterKey: key,
        active: filters.tripTopics.includes(key as BrowseTripTopicKey),
        onToggle: () =>
          sync({ tripTopics: toggleBrowseTripTopicInList(filters.tripTopics, key as BrowseTripTopicKey) }),
      })),
    });
  }

  if (category === 'venues') {
    groups.push({
      id: 'type',
      label: 'Place type',
      pills: listVenuePlaceTopicsForUi().map(({ key, label, filterKey }) => ({
        id: `place-topic-${key}`,
        label,
        filterKey: filterKey === 'facilities' ? undefined : (filterKey as MapFilterKey),
        active: filters.placeTopics.includes(key),
        onToggle: () =>
          sync({
            placeTopics: toggleListVenuePlaceTopic(filters.placeTopics, key),
            tripTopics: [],
          }),
      })),
    });
  }

  if (category === 'activities') {
    groups.push({
      id: 'price',
      label: 'Price',
      pills: [
        {
          id: 'price-free',
          label: 'Free',
          active: filters.price === 'free',
          onToggle: () => sync({ price: togglePrice(filters.price, 'free') }),
        },
        {
          id: 'price-paid',
          label: 'Paid',
          active: filters.price === 'paid',
          onToggle: () => sync({ price: togglePrice(filters.price, 'paid') }),
        },
      ],
    });
    groups.push({
      id: 'when',
      label: 'When',
      pills: [
        {
          id: 'when-week',
          label: 'This week',
          active: filters.when === 'week',
          onToggle: () => sync({ when: toggleWhen(filters.when, 'week') }),
        },
        {
          id: 'when-weekend',
          label: 'Weekend',
          active: filters.when === 'weekend',
          onToggle: () => sync({ when: toggleWhen(filters.when, 'weekend') }),
        },
      ],
    });
  }

  if (category === 'venues') {
    groups.push({
      id: 'area',
      label: 'Area',
      pills: REGION_PILLS.map((region) => ({
        id: `region-${region}`,
        label: region === 'RAK' ? 'RAK' : region,
        active: venueRegions.includes(region),
        onToggle: () => {
          const next = venueRegions.includes(region)
            ? venueRegions.filter((r) => r !== region)
            : [...venueRegions, region];
          sync({ regions: next });
        },
      })),
    });
  }

  return groups;
};
