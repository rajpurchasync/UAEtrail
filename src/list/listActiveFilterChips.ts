import { exploreActivityDatePresetLabel } from '../explore/exploreActivityDateFilter';
import type { MapFilterKey } from '../explore/routing';
import { BROWSE_TRIP_TOPIC_FILTERS } from './browseListTripTopics';
import type { BrowseListFilterState } from './browseListFilters';
import type { BrowseMainCategoryKey } from './browseListTaxonomy';
import { LIST_CATEGORY_PAGE_TITLE } from './listCategoryCopy';

export type ListActiveFilterChip = {
  key: string;
  label: string;
  clear: Partial<BrowseListFilterState> & { regions?: string[] };
};

const categoryLabel: Record<BrowseMainCategoryKey, string> = LIST_CATEGORY_PAGE_TITLE;

const tripTopicLabel = (topic: MapFilterKey): string | null => {
  const match = BROWSE_TRIP_TOPIC_FILTERS.find((t) => t.key === topic);
  return match?.label ?? null;
};

export const buildListActiveFilterChips = (
  filters: BrowseListFilterState,
  venueRegions: string[]
): ListActiveFilterChip[] => {
  const chips: ListActiveFilterChip[] = [];

  if (filters.query.trim()) {
    chips.push({
      key: 'q',
      label: `"${filters.query.trim()}"`,
      clear: { query: '' },
    });
  }

  for (const cat of filters.categories) {
    chips.push({
      key: `cat-${cat}`,
      label: categoryLabel[cat],
      clear: { categories: filters.categories.filter((c) => c !== cat) },
    });
  }

  if (filters.tripLookingOnly) {
    chips.push({
      key: 'looking',
      label: 'Looking for',
      clear: { tripLookingOnly: false },
    });
  } else if (filters.tripTopic !== 'all') {
    const label = tripTopicLabel(filters.tripTopic);
    if (label) {
      chips.push({
        key: 'topic',
        label,
        clear: { tripTopic: 'all' },
      });
    }
  }

  if (filters.price !== 'all') {
    chips.push({
      key: 'price',
      label: filters.price === 'free' ? 'Free' : 'Paid',
      clear: { price: 'all' },
    });
  }

  if (filters.activityDatePreset !== 'anyday') {
    chips.push({
      key: 'date',
      label: exploreActivityDatePresetLabel(filters.activityDatePreset),
      clear: { activityDatePreset: 'anyday' },
    });
  }

  if (filters.when !== 'any') {
    chips.push({
      key: 'when',
      label: 'Weekend',
      clear: { when: 'any' },
    });
  }

  for (const region of venueRegions) {
    chips.push({
      key: `region-${region}`,
      label: region,
      clear: { regions: venueRegions.filter((r) => r !== region) },
    });
  }

  return chips;
};
