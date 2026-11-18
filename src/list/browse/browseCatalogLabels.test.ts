import { describe, expect, it } from 'vitest';
import type { GeoRef } from '@uaetrail/shared-types';
import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';
import {
  browseCatalogEntityName,
  browseCatalogHeaderLocationLine,
  browseCatalogHubLabel,
  browseCatalogHubLabelFromExploreItem,
} from './browseCatalogLabels';

const uaqGeoRef = (): GeoRef =>
  ({
    chain: ['ae', 'ae-uq', 'ae-uq-coast', 'ae-uq-coast-corniche'],
    countryId: 'ae',
    stateId: 'ae-uq',
    areaId: 'ae-uq-coast',
    venueId: 'ae-uq-coast-corniche',
    path: 'uae/umm-al-quwain/uaq-coast/uaq-corniche',
    names: {
      country: 'UAE',
      state: 'Umm Al Quwain',
      area: 'UAQ coast',
      venue: 'UAQ corniche',
    },
    searchTokens: [],
  }) as GeoRef;

const baseCard = (overrides: Partial<DiscoveryCardModel>): DiscoveryCardModel =>
  ({
    listTitle: 'Umm Al Quwain Beach Camp',
    headline: 'Umm Al Quwain Beach Camp',
    source: 'venue',
    kind: 'camping',
    venueRegion: 'Umm Al Quwain',
    ...overrides,
  }) as DiscoveryCardModel;

describe('browseCatalogLabels browse catalog geography', () => {
  it('never uses catalog leaf title as hub', () => {
    const card = baseCard({
      areaName: 'Umm Al Quwain Beach Camp',
      subtitle: 'Umm Al Quwain Beach Camp',
      areaLabel: 'UAQ corniche',
    });
    expect(browseCatalogEntityName(card)).toBe('Umm Al Quwain Beach Camp');
    expect(browseCatalogHubLabel(card)).toBe('UAQ corniche');
    expect(browseCatalogHeaderLocationLine(card)).toBe('Umm Al Quwain · UAQ corniche');
  });

  it('prefers geo L4 venue over catalog fields', () => {
    const card = baseCard({
      geoRef: uaqGeoRef(),
      areaLabel: 'Wrong bucket',
    });
    expect(browseCatalogHubLabel(card)).toBe('UAQ corniche');
    expect(browseCatalogHeaderLocationLine(card)).toBe('Umm Al Quwain · UAQ corniche');
  });

  it('skips activity locationName subtitle for hosted trip pins', () => {
    expect(
      browseCatalogHubLabelFromExploreItem({
        id: 'activity:1',
        kind: 'camping',
        source: 'activity',
        title: 'Weekend camp',
        subtitle: 'Umm Al Quwain Beach Camp',
        latitude: 1,
        longitude: 1,
        path: '/activity/1',
        areaLabel: 'UAQ corniche',
        geoRef: uaqGeoRef(),
      } as Parameters<typeof browseCatalogHubLabelFromExploreItem>[0])
    ).toBe('UAQ corniche');
  });
});