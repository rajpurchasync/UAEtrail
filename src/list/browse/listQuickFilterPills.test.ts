import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  LIST_QUICK_TRIP_TOPIC_PILLS,
  LIST_QUICK_VENUE_TOPIC_PILLS,
} from './listQuickFilterPills';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('listQuickFilterPills', () => {
  it('trips list uses Anyday + four outing kinds in the quick row', () => {
    expect(LIST_QUICK_TRIP_TOPIC_PILLS.map((p) => p.label)).toEqual([
      'Hiking',
      'Camping',
      'Rideshare',
      'Others',
    ]);
    const row = read('src/explore/ui/ExploreOptionalFilterRow.tsx');
    expect(row).toMatch(/surface === 'list'/);
    expect(row).toMatch(/LIST_QUICK_TRIP_TOPIC_PILLS/);
    expect(read('src/list/explorer/ListExplorerQuickFilters.tsx')).toMatch(/surface={surface}/);
    expect(read('src/list/explorer/ListExplorerHeader.tsx')).toMatch(/surface="list"/);
  });

  it('venues list uses State + hiking, camping, others pills', () => {
    expect(LIST_QUICK_VENUE_TOPIC_PILLS.map((p) => p.label)).toEqual(['Hiking', 'Camping', 'Others']);
    expect(read('src/explore/ui/ExploreOptionalFilterRow.tsx')).toMatch(/LIST_QUICK_VENUE_TOPIC_PILLS/);
    expect(read('src/list/browse/listQuickFilterPills.ts')).toMatch(/LIST_QUICK_FILTER_REGION_LABEL = 'State'/);
  });
});