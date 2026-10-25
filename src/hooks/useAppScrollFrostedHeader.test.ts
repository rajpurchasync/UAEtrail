import { describe, expect, it } from 'vitest';
import { readAppScrollFrosted } from './useAppScrollFrostedHeader';

describe('readAppScrollFrosted', () => {
  it('is false at scroll top', () => {
    const el = { scrollTop: 0 } as HTMLElement;
    expect(readAppScrollFrosted([el])).toBe(false);
  });

  it('is true when any pane is scrolled', () => {
    const top = { scrollTop: 0 } as HTMLElement;
    const scrolled = { scrollTop: 24 } as HTMLElement;
    expect(readAppScrollFrosted([top, scrolled])).toBe(true);
  });
});
