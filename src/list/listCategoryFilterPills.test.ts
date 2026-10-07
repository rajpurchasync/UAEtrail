import { describe, expect, it } from 'vitest';
import { buildListCategoryPrimaryPills } from './listCategoryFilterPills';
import type { BrowseListFilterState } from './browseListFilters';

const baseFilters: BrowseListFilterState = {
  query: '',
  categories: ['trips'],
  tripTopics: [],
  placeTopics: [],
  tripLookingOnly: false,
  price: 'all',
  when: 'any',
  activityDatePreset: 'anyday',
};

describe('buildListCategoryPrimaryPills', () => {
  it('exposes hiking, camping, rideshare, and looking for on trips', () => {
    const labels: string[] = [];
    const pills = buildListCategoryPrimaryPills('trips', baseFilters, (patch) => {
      Object.assign(baseFilters, patch);
    });
    pills.forEach((pill) => labels.push(pill.label));
    expect(labels).toEqual(['Hiking', 'Camping', 'Rideshare', 'Looking for']);
  });

  it('exposes hiking, camping, and others on Places category', () => {
    const filters: BrowseListFilterState = { ...baseFilters, categories: ['venues'], placeTopics: [] };
    const labels = buildListCategoryPrimaryPills('venues', filters, (patch) => {
      Object.assign(filters, patch);
    }).map((pill) => pill.label);
    expect(labels).toEqual(['Hiking', 'Camping', 'Others']);
  });
});
