import { describe, expect, it } from 'vitest';
import { parseListOpen } from './exploreListPanelUrl';

describe('exploreListPanelUrl', () => {
  it('parseListOpen keeps desktop map list independent of discover browse', () => {
    expect(parseListOpen(null, true, '1')).toBe(true);
    expect(parseListOpen('1', true, '1')).toBe(true);
    expect(parseListOpen('0', true, '1')).toBe(false);
    expect(parseListOpen(null, false, '1')).toBe(false);
    expect(parseListOpen('1', false, null)).toBe(true);
    expect(parseListOpen('0', true, null)).toBe(false);
  });

});
