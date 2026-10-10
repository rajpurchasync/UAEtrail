import { describe, expect, it } from 'vitest';
import { exploreMapItemIsSeeking, resolveExploreMapActivityMode } from '@uaetrail/shared-types';
import { buildExploreCardModel } from './exploreCardModel';
import {
  hostedExploreMapItem,
  legacyDemandExploreMapItem,
  seekingExploreMapItem,
} from './exploreMapItemFixtures';

describe('exploreActivityMode (M0)', () => {
  it('resolveExploreMapActivityMode supports canonical and legacy wire', () => {
    expect(resolveExploreMapActivityMode(seekingExploreMapItem())).toBe('seeking');
    expect(resolveExploreMapActivityMode(hostedExploreMapItem())).toBe('hosted');
    expect(resolveExploreMapActivityMode(legacyDemandExploreMapItem())).toBe('seeking');
  });

  it('buildExploreCardModel adds Seeking badge with activity wire source', () => {
    const item = seekingExploreMapItem();
    const card = buildExploreCardModel(item);
    expect(exploreMapItemIsSeeking(item)).toBe(true);
    expect(card.source).toBe('activity');
    expect(card.composeIntent).toBe('demand');
    expect(card.requirementBadges).toContain('Seeking');
  });
});
