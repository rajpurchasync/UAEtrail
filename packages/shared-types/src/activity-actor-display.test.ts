import { describe, expect, it } from 'vitest';
import {
  exploreActivityPublisherSectionNoun,
  resolveActivityHeadlinePersonName,
  resolveActivityPublisherRowPrimaryName,
} from './activity-actor-display.js';

describe('activity actor display', () => {
  it('headline uses guide name for agency outings, not tenant brand', () => {
    expect(
      resolveActivityHeadlinePersonName({
        publishingProfileKind: 'agency',
        tenantName: 'UAE Adventure Co',
        hostName: 'UAE Adventure Co',
        createdByName: 'Maya Hassan',
      })
    ).toBe('Maya Hassan');
  });

  it('publisher row uses operator brand for agency', () => {
    expect(
      resolveActivityPublisherRowPrimaryName({
        publishingProfileKind: 'agency',
        tenantName: 'UAE Adventure Co',
        hostName: 'Maya Hassan',
        createdByName: 'Maya Hassan',
      })
    ).toBe('UAE Adventure Co');
  });

  it('publisher row uses person for community host', () => {
    expect(
      resolveActivityPublisherRowPrimaryName({
        publishingProfileKind: 'community',
        tenantName: 'Desert Explorer',
        hostName: 'Omar Al Hosani',
      })
    ).toBe('Omar Al Hosani');
  });

  it('section noun is Host vs Operator', () => {
    expect(exploreActivityPublisherSectionNoun('community')).toBe('Host');
    expect(exploreActivityPublisherSectionNoun('pro_guide')).toBe('Host');
    expect(exploreActivityPublisherSectionNoun('agency')).toBe('Operator');
    expect(exploreActivityPublisherSectionNoun('shop')).toBe('Operator');
  });
});
