import { describe, expect, it } from 'vitest';
import { countersFor, deltaFor, scopesFor, type GeoCountedPin } from './geo-counters.js';
import type { GeoRef } from './geo-hierarchy.js';

const ref = (chain: string[]): GeoRef => ({
  chain,
  countryId: chain[0]!,
  stateId: chain[1]!,
  areaId: chain[2]!,
  path: 'ae/dubai/hatta',
  names: { country: 'UAE', state: 'Dubai', area: 'Hatta' },
  searchTokens: ['uae', 'dubai', 'hatta'],
});

const toilet = (counted = true): GeoCountedPin => ({
  family: 'place',
  kind: 'facility',
  facilityType: 'toilet',
  geoRef: ref(['c', 's', 'a']),
  attachedTo: [{ id: 'trail-1' }],
  counted,
});

describe('geo counters', () => {
  it('counts a public facility on chain + attachment', () => {
    const pin = toilet();
    expect(countersFor(pin)).toEqual({ 'facilities.total': 1, 'facilities.toilet': 1 });
    expect(scopesFor(pin).sort()).toEqual(['a', 'c', 's', 'trail-1']);
  });

  it('create minus empty is +1', () => {
    const d = deltaFor(null, toilet());
    expect(d.get('a')).toEqual({ 'facilities.total': 1, 'facilities.toilet': 1 });
  });

  it('delete is -1', () => {
    const d = deltaFor(toilet(), null);
    expect(d.get('a')).toEqual({ 'facilities.total': -1, 'facilities.toilet': -1 });
  });

  it('status change to uncounted is -1', () => {
    const d = deltaFor(toilet(true), toilet(false));
    expect(d.get('a')).toEqual({ 'facilities.total': -1, 'facilities.toilet': -1 });
  });

  it('move between areas transfers counts', () => {
    const before = toilet();
    const after: GeoCountedPin = {
      ...before,
      geoRef: ref(['c', 's', 'b']),
    };
    const d = deltaFor(before, after);
    expect(d.get('a')).toEqual({ 'facilities.total': -1, 'facilities.toilet': -1 });
    expect(d.get('b')).toEqual({ 'facilities.total': 1, 'facilities.toilet': 1 });
    expect(d.get('c')).toBeUndefined();
  });

  it('activity expiry (uncounted) subtracts', () => {
    const live: GeoCountedPin = {
      family: 'activity',
      type: 'rideshare',
      geoRef: ref(['c', 's', 'a']),
      placeId: 'place-1',
      counted: true,
    };
    const ended = { ...live, counted: false };
    const d = deltaFor(live, ended);
    expect(d.get('a')).toEqual({ 'activeActivities.total': -1, 'activeActivities.rideshare': -1 });
    expect(d.get('place-1')).toEqual({ 'activeActivities.total': -1, 'activeActivities.rideshare': -1 });
  });
});
