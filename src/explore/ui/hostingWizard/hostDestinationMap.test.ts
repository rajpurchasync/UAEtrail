import { describe, expect, it } from 'vitest';
import { COMPOSE_MAP_INTENTS } from '../../create/interactions';
import { MAP_CONFIG } from '../../../config/platform';
import { emptyCreateActivityDraft } from '../hostingFlowEngine';
import {
  applyHostDestinationMapLocation,
  hostDestinationMapCenter,
  isHostDestinationCatalogMap,
  isHostDestinationCustomMap,
} from './hostDestinationMap';

describe('hostDestinationMap (S14-W5)', () => {
  it('treats catalog and custom as distinct destination map modes', () => {
    expect(isHostDestinationCatalogMap(COMPOSE_MAP_INTENTS.hostDestinationCatalog)).toBe(true);
    expect(isHostDestinationCustomMap(COMPOSE_MAP_INTENTS.hostCustomSpot)).toBe(true);
    expect(isHostDestinationCatalogMap(COMPOSE_MAP_INTENTS.hostGoingFrom)).toBe(false);
  });

  it('listed and new-spot maps write destination pin coords, not going-from', () => {
    expect(
      applyHostDestinationMapLocation(COMPOSE_MAP_INTENTS.hostDestinationCatalog, 25.1, 55.2)
    ).toEqual({
      trailLatitude: 25.1,
      trailLongitude: 55.2,
    });
    expect(applyHostDestinationMapLocation(COMPOSE_MAP_INTENTS.hostCustomSpot, 25.1, 55.2)).toEqual({
      trailLatitude: 25.1,
      trailLongitude: 55.2,
    });
    expect(applyHostDestinationMapLocation(COMPOSE_MAP_INTENTS.hostGoingFrom, 25.1, 55.2)).toBeNull();
  });

  it('catalog map centers on the listed leaf, not going-from', () => {
    const draft = emptyCreateActivityDraft();
    draft.latitude = 24;
    draft.longitude = 54;
    const center = hostDestinationMapCenter(COMPOSE_MAP_INTENTS.hostDestinationCatalog, draft, {
      latitude: 25.6,
      longitude: 56.2,
    });
    expect(center).toEqual({ lat: 25.6, lng: 56.2 });
    expect(center.lat).not.toBe(draft.latitude);
    expect(hostDestinationMapCenter(COMPOSE_MAP_INTENTS.hostGoingFrom, draft).lat).toBe(
      MAP_CONFIG.exploreDefaultCenter.lat
    );
  });
});
