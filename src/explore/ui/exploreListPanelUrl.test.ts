import { describe, expect, it } from 'vitest';
import { parseListOpen } from './exploreListPanelUrl';

describe('exploreListPanelUrl', () => {
  it('keeps map catalog list closed — explorer is /list', () => {
    expect(parseListOpen(null, true, null)).toBe(false);
    expect(parseListOpen('1', true, null)).toBe(false);
    expect(parseListOpen('1', false, null)).toBe(false);
    expect(parseListOpen(null, false, '1')).toBe(false);
  });

  it('opens the mobile People sheet only', () => {
    expect(parseListOpen('1', false, null, true)).toBe(true);
    expect(parseListOpen('0', false, null, true)).toBe(false);
    expect(parseListOpen(null, true, null, true)).toBe(false);
  });
});
