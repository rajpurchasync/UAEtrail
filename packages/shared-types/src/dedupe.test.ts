import { describe, expect, it } from 'vitest';
import { cellsFor, geohashEncode, nameKey, scoreDuplicate, trigramRatio } from './dedupe.js';

describe('nameKey', () => {
  it('collapses parking variants and word order', () => {
    expect(nameKey('Wadi Shawka Dam Parking')).toBe(nameKey('wadi shawka dam car park'));
  });

  it('normalises Arabic alef forms', () => {
    expect(nameKey('\u0623Hatta')).toBe(nameKey('\u0627Hatta'));
  });
});

describe('cellsFor', () => {
  it('finds two pins 5 m apart across a cell boundary', () => {
    const a = { latitude: 25.2048, longitude: 55.2708 };
    const b = { latitude: 25.2048, longitude: 55.27085 };
    const cellsA = cellsFor(a, 'facility');
    const cellsB = cellsFor(b, 'facility');
    const overlap = cellsA.filter((c) => cellsB.includes(c));
    expect(overlap.length).toBeGreaterThan(0);
  });

  it('includes g8..g5 prefixes', () => {
    const hash = geohashEncode(25.2, 55.27, 8);
    const cells = cellsFor({ latitude: 25.2, longitude: 55.27 }, 'trail');
    expect(cells).toContain(hash);
    expect(cells).toContain(hash.slice(0, 5));
  });
});

describe('scoreDuplicate', () => {
  it('marks close amenities as near-certain', () => {
    expect(scoreDuplicate({ kind: 'facility', distanceM: 12, nameScore: 0 }).verdict).toBe(
      'near_certain'
    );
  });

  it('uses trigram similarity', () => {
    expect(trigramRatio('hatta dam', 'hatta dam')).toBeGreaterThan(0.9);
  });

  it('marks trail starts under 300 m as near-certain when GPX is missing', () => {
    expect(
      scoreDuplicate({ kind: 'trail', distanceM: 80, nameScore: 0, hasRouteKey: false }).verdict
    ).toBe('near_certain');
  });

  it('treats matching phone as near-certain for facilities at any distance', () => {
    expect(
      scoreDuplicate({
        kind: 'facility',
        distanceM: 4000,
        nameScore: 0,
        samePhoneOrDomain: true,
      }).verdict
    ).toBe('near_certain');
  });
});
