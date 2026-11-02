import { describe, expect, it } from 'vitest';
import { parseListOpen } from './exploreListPanelUrl';

describe('exploreListPanelUrl', () => {
  it('opens the desktop catalog drawer from list=1', () => {
    expect(parseListOpen(null, true, null)).toBe(false);
    expect(parseListOpen('1', true, null)).toBe(true);
    expect(parseListOpen('1', false, null)).toBe(false);
    expect(parseListOpen(null, false, '1')).toBe(false);
  });

  it('opens the mobile People sheet only', () => {
    expect(parseListOpen('1', false, null, true)).toBe(true);
    expect(parseListOpen('0', false, null, true)).toBe(false);
    expect(parseListOpen('1', true, null, true)).toBe(false);
  });
});
