import { describe, expect, it } from 'vitest';
import {
  seekingFallbackTitle,
  isGenericSeekingTitle,
  isEmbeddedPersonaSeekingTitle,
  normalizeEmbeddedPersonaSeekingTitle,
} from '@uaetrail/shared-types';

describe('seeking titles', () => {
  it('detects legacy embedded requester titles', () => {
    expect(isEmbeddedPersonaSeekingTitle('Sarah wants to go hiking')).toBe(true);
    expect(isEmbeddedPersonaSeekingTitle('Alex needs a carpool')).toBe(true);
    expect(isEmbeddedPersonaSeekingTitle('Morning hike at Hatta')).toBe(false);
  });

  it('normalizes legacy titles to canonical fallbacks', () => {
    expect(normalizeEmbeddedPersonaSeekingTitle('Sarah wants to go hiking', 'hiking')).toBe(
      seekingFallbackTitle('hiking')
    );
    expect(normalizeEmbeddedPersonaSeekingTitle('Sunrise yoga', 'event')).toBe('Sunrise yoga');
  });

  it('treats fallback and leftover titles as generic seeking titles', () => {
    expect(isGenericSeekingTitle('Rideshare request', 'rideshare')).toBe(true);
    expect(isGenericSeekingTitle('Sarah wants to go hiking', 'hiking')).toBe(true);
    expect(isGenericSeekingTitle('Sunrise yoga at Kite Beach', 'event')).toBe(false);
  });
});
