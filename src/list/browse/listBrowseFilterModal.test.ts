import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  LIST_BROWSE_DATE_FILTER_OPTIONS,
  LIST_BROWSE_TRIP_TYPE_OPTIONS,
  LIST_BROWSE_PLACE_TYPE_OPTIONS,
} from './listBrowseFilterModal';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('listBrowseFilterModal', () => {
  it('defines list filter modal option sets for trips and places', () => {
    expect(LIST_BROWSE_TRIP_TYPE_OPTIONS.map((o) => o.label)).toEqual([
      'Hiking',
      'Camping',
      'Rideshare',
      'Others',
    ]);
    expect(LIST_BROWSE_PLACE_TYPE_OPTIONS.map((o) => o.label)).toEqual(['Hiking', 'Camping', 'Others']);
    expect(LIST_BROWSE_DATE_FILTER_OPTIONS.map((o) => o.value)).toContain('nextweek');
    const pop = read('src/list/explorer/ListExplorerFilterPop.tsx');
    expect(pop).toMatch(/LIST_BROWSE_DATE_FILTER_OPTIONS/);
    expect(pop).not.toMatch(/By facilities/);
    expect(pop).not.toMatch(/Looking for/);
  });
});