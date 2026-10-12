import { describe, expect, it } from 'vitest';
import { ACTIVITY_DETAIL_TABS } from '../activity/activityDetailTab';
import { AREA_DETAIL_TABS } from '../area/areaDetailTab';
import { ORGANISATION_PUBLIC_TABS } from '../organisation/organisationPublicDetailTab';
import { PLACE_DETAIL_TABS, parsePlaceDetailTabParam } from '../place/placeDetailTab';
import { SHOP_PUBLIC_TABS } from '../shop/shopPublicDetailTab';
import { CONSUMER_DETAIL_TAB_WIRE_CANON } from './consumerDetailTabWireCanon';

const tabIdsEqual = (actual: readonly string[], expected: readonly string[]) =>
  expect([...actual].sort()).toEqual([...expected].sort());

describe('detailSurfaceTabWireGuard (DOMAIN_CANONICALS §3.1)', () => {
  it('tab wire modules match canonical ids per surface', () => {
    tabIdsEqual(ACTIVITY_DETAIL_TABS, CONSUMER_DETAIL_TAB_WIRE_CANON.activity);
    tabIdsEqual(PLACE_DETAIL_TABS, CONSUMER_DETAIL_TAB_WIRE_CANON.place);
    tabIdsEqual(AREA_DETAIL_TABS, CONSUMER_DETAIL_TAB_WIRE_CANON.area);
    tabIdsEqual(SHOP_PUBLIC_TABS, CONSUMER_DETAIL_TAB_WIRE_CANON.shop);
    tabIdsEqual(ORGANISATION_PUBLIC_TABS, CONSUMER_DETAIL_TAB_WIRE_CANON.organisation);
  });

  it('place legacy tab alias location maps to transport wire id', () => {
    expect(parsePlaceDetailTabParam('location')).toBe('transport');
    expect(CONSUMER_DETAIL_TAB_WIRE_CANON.place).toContain('transport');
    expect(CONSUMER_DETAIL_TAB_WIRE_CANON.place).not.toContain('location');
  });
});
