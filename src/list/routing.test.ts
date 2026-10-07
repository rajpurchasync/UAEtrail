import { describe, expect, it } from 'vitest';
import { exploreMapPathFromListSearch, listDiscoveryPath } from './routing';

describe('list discovery routing', () => {
  it('listDiscoveryPath maps Trips to activity + demand topics', () => {
    expect(
      listDiscoveryPath({
        query: 'hatta',
        categories: ['trips', 'venues'],
        tripTopic: 'hiking',
        price: 'free',
        activityDatePreset: 'week',
      })
    ).toBe('/list?q=hatta&topics=trips%2Clooking%2Cspots&filter=hiking&price=free&date=week');
  });

  it('exploreMapPathFromListSearch drops list-only price and keeps plan topics', () => {
    expect(exploreMapPathFromListSearch('q=dxb&topics=trips&price=paid&when=weekend')).toBe(
      '/explore?q=dxb&topics=trips%2Clooking'
    );
  });

  it('exploreMapPathFromListSearch keeps shared browse params including filter', () => {
    expect(exploreMapPathFromListSearch('q=jais&topics=spots&filter=camping&date=week&regions=Dubai')).toBe(
      '/explore?q=jais&topics=spots&filter=camping&date=week&regions=Dubai'
    );
  });
});
