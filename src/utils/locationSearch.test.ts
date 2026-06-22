import { describe, expect, it } from 'vitest';
import { matchesLocationSearch, resolveRegionFilter } from './locationSearch';

const jebelJais = {
  name: 'Jebel Jais Summit Trail',
  region: 'RAK',
  description: 'A demanding mountain route in the Hajar Mountains.',
  tags: ['summit', 'mountain']
};

describe('resolveRegionFilter', () => {
  it('maps canonical region codes', () => {
    expect(resolveRegionFilter('RAK')).toBe('RAK');
    expect(resolveRegionFilter('Fujairah')).toBe('Fujairah');
    expect(resolveRegionFilter('Al Ain')).toBe('Al Ain');
  });

  it('maps Ras Al Khaimah aliases to RAK', () => {
    expect(resolveRegionFilter('Ras Al Khaimah')).toBe('RAK');
    expect(resolveRegionFilter('ras al khaimah')).toBe('RAK');
  });
});

describe('matchesLocationSearch', () => {
  it('matches empty query', () => {
    expect(matchesLocationSearch(jebelJais, '')).toBe(true);
  });

  it('matches trail name', () => {
    expect(matchesLocationSearch(jebelJais, 'Jebel Jais')).toBe(true);
  });

  it('matches region code', () => {
    expect(matchesLocationSearch(jebelJais, 'RAK')).toBe(true);
  });

  it('matches Ras Al Khaimah via region alias (Discovery bug)', () => {
    expect(matchesLocationSearch(jebelJais, 'Ras Al Khaimah')).toBe(true);
  });

  it('does not match unrelated regions', () => {
    expect(matchesLocationSearch(jebelJais, 'Fujairah')).toBe(false);
  });
});
