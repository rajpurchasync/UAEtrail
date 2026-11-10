import { describe, expect, it } from 'vitest';
import { serializeIsoDateList } from './serializeIsoDateList';

describe('serializeIsoDateList', () => {
  it('matches content not array identity', () => {
    const a = ['2026-11-10', '2026-11-11'];
    const b = ['2026-11-10', '2026-11-11'];
    expect(serializeIsoDateList(a)).toBe(serializeIsoDateList(b));
    expect(serializeIsoDateList(a)).toBe('2026-11-10,2026-11-11');
  });
});
