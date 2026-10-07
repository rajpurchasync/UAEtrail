import type { MapFilterKey } from '../config/routingCatalog';
import type { BrowseListFilterState, BrowsePriceFilter, BrowseWhenFilter } from './browseListFilters';
import type { BrowseMainCategoryKey } from './browseListTaxonomy';
import { BROWSE_TRIP_TOPIC_FILTERS, toggleBrowseTripTopic, type BrowseTripTopicKey } from './browseListTripTopics';

export type ListCategoryPill = {
  id: string;
  label: string;
  /** Topic pills — map filter key for emoji chip. */
  filterKey?: MapFilterKey;
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

const REGION_PILLS = ['Dubai', 'Abu Dhabi', 'Sharjah', 'RAK', 'Fujairah', 'Al Ain'] as const;

export const listCategorySecondaryFiltersActive = (
  category: BrowseMainCategoryKey,
  filters: BrowseListFilterState,
  venueRegions: string[]
): boolean => {
  if (category === 'trips') {
    return filters.price !== 'all' || filters.when !== 'any';
  }
  if (category === 'shops') {
    return filters.price !== 'all' || venueRegions.length > 0;
  }
  if (category === 'venues') {
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
  if (category === 'shops' || category === 'trips') return [];

  const topics =
    category === 'venues'
      ? BROWSE_TRIP_TOPIC_FILTERS.filter((t) => t.key !== 'rideshare')
      : BROWSE_TRIP_TOPIC_FILTERS;

  return topics.map(({ key, label }) => ({
    id: `topic-${key}`,
    label,
    filterKey: key,
    active: filters.tripTopic === key,
    onToggle: () => sync({ tripTopic: toggleBrowseTripTopic(filters.tripTopic, key as BrowseTripTopicKey) }),
  }));
};

/** @deprecated Use primary pills + ListCategoryMoreFiltersSheet */
export const buildListCategoryPillGroups = (
  category: BrowseMainCategoryKey,
  filters: BrowseListFilterState,
  venueRegions: string[],
  sync: (patch: Partial<BrowseListFilterState> & { regions?: string[] }) => void
): ListCategoryPillGroup[] => {
  const groups: ListCategoryPillGroup[] = [];

  if (category === 'trips' || category === 'venues') {
    const topics =
      category === 'venues'
        ? BROWSE_TRIP_TOPIC_FILTERS.filter((t) => t.key !== 'rideshare')
        : BROWSE_TRIP_TOPIC_FILTERS;
    groups.push({
      id: 'type',
      label: category === 'trips' ? 'Activity' : 'Place type',
      pills: topics.map(({ key, label }) => ({
        id: `topic-${key}`,
        label,
        filterKey: key,
        active: filters.tripTopic === key,
        onToggle: () =>
          sync({ tripTopic: toggleBrowseTripTopic(filters.tripTopic, key as BrowseTripTopicKey) }),
      })),
    });
  }

  if (category === 'trips') {
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

  if (category === 'shops') {
    groups.push({
      id: 'sort',
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
  }

  if (category === 'venues' || category === 'shops') {
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
