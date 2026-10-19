import { describe, expect, it } from 'vitest';
import {
  seekingFallbackTitle,
  isGenericSeekingTitle,
  isLegacyEmbeddedSeekingTitle,
  normalizeLegacySeekingTitle,
} from '@uaetrail/shared-types';

describe('seeking titles', () => {
  it('detects legacy embedded requester titles', () => {
    expect(isLegacyEmbeddedSeekingTitle('Sarah wants to go hiking')).toBe(true);
    expect(isLegacyEmbeddedSeekingTitle('Alex needs a carpool')).toBe(true);
    expect(isLegacyEmbeddedSeekingTitle('Morning hike at Hatta')).toBe(false);
  });

  it('normalizes legacy titles to canonical fallbacks', () => {
    expect(normalizeLegacySeekingTitle('Sarah wants to go hiking', 'hiking')).toBe(
      seekingFallbackTitle('hiking')
    );
    expect(normalizeLegacySeekingTitle('Sunrise yoga', 'event')).toBe('Sunrise yoga');
  });

  it('treats fallback and leftover titles as generic seeking titles', () => {
    expect(isGenericSeekingTitle('Rideshare request', 'rideshare')).toBe(true);
    expect(isGenericSeekingTitle('Sarah wants to go hiking', 'hiking')).toBe(true);
    expect(isGenericSeekingTitle('Sunrise yoga at Kite Beach', 'event')).toBe(false);
  });
});
