import { describe, expect, it } from 'vitest';
import { matchMemberHomeEmirateKey, resolveMemberHomeWeatherCoords } from './memberHomeWeatherAnchor';

describe('memberHomeWeatherAnchor', () => {
  it('matches emirate keys and pill labels', () => {
    expect(matchMemberHomeEmirateKey('Dubai')).toBe('Dubai');
    expect(matchMemberHomeEmirateKey('Ras Al Khaimah')).toBe('RAK');
    expect(matchMemberHomeEmirateKey('Hatta')).toBeNull();
  });

  it('prefers a saved area pin', () => {
    const coords = resolveMemberHomeWeatherCoords(
      { lat: 25.9, lng: 56.1 },
      { label: 'Hatta', query: 'Hatta', lat: 24.82, lng: 56.13, source: 'search' }
    );
    expect(coords).toEqual({ lat: 24.82, lng: 56.13 });
  });

  it('uses geo when area has no pin', () => {
    const coords = resolveMemberHomeWeatherCoords(
      { lat: 25.1, lng: 55.2 },
      null
    );
    expect(coords).toEqual({ lat: 25.1, lng: 55.2 });
  });

  it('falls back to UAE default without geo or pin', () => {
    const coords = resolveMemberHomeWeatherCoords(null, null);
    expect(coords.lat).toBeCloseTo(25.42, 2);
    expect(coords.lng).toBeCloseTo(55.72, 2);
  });
});