import { describe, expect, it } from 'vitest';
import { destinationRegionsOverlap, sanitizeDestinationRegions } from './availability-slot-destinations.js';

describe('availability-slot-destinations', () => {
  it('dedupes and caps region labels', () => {
    expect(
      sanitizeDestinationRegions(['Dubai', ' dubai ', 'Sharjah', '', 'Fujairah'])
    ).toEqual(['Dubai', 'Sharjah', 'Fujairah']);
  });

  it('overlap filter allows open slots without regions', () => {
    expect(destinationRegionsOverlap(null, 'Dubai')).toBe(true);
    expect(destinationRegionsOverlap(['Sharjah'], 'Dubai')).toBe(false);
    expect(destinationRegionsOverlap(['Dubai', 'Sharjah'], 'dubai')).toBe(true);
  });
});