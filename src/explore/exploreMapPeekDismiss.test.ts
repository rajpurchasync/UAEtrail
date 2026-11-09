import { describe, expect, it } from 'vitest';
import { exploreBrowseDismissPeekFingerprint } from './exploreMapPeekDismiss';

describe('exploreBrowseDismissPeekFingerprint', () => {
  it('ignores pin-only changes', () => {
    const a = new URLSearchParams('filter=events&pin=abc');
    const b = new URLSearchParams('filter=events&pin=xyz');
    expect(exploreBrowseDismissPeekFingerprint(a)).toBe(exploreBrowseDismissPeekFingerprint(b));
  });

  it('changes when browse filter changes', () => {
    const a = new URLSearchParams('filter=events&panel=activities');
    const b = new URLSearchParams('filter=places&panel=activities');
    expect(exploreBrowseDismissPeekFingerprint(a)).not.toBe(exploreBrowseDismissPeekFingerprint(b));
  });
});
