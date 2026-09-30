import { describe, expect, it } from 'vitest';
import { isWithinUaeBbox, isWithinUaeFocusArea } from '../src/lib/uae-bbox.js';

describe('uae-bbox', () => {
  it('includes Dubai and excludes far eastern Oman', () => {
    expect(isWithinUaeBbox(25.2048, 55.2708)).toBe(true);
    expect(isWithinUaeFocusArea(25.2048, 55.2708)).toBe(true);
    expect(isWithinUaeFocusArea(26.2, 56.5)).toBe(false);
  });

  it('keeps Fujairah coast and Jebel Jais inside UAE focus', () => {
    expect(isWithinUaeFocusArea(25.12, 56.34)).toBe(true);
    expect(isWithinUaeFocusArea(25.923, 56.115)).toBe(true);
  });

  it('excludes Musandam and interior Oman Hajar spill', () => {
    expect(isWithinUaeFocusArea(26.08, 56.3)).toBe(false);
    expect(isWithinUaeFocusArea(25.5, 56.4)).toBe(false);
  });
});
