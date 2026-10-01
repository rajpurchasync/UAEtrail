import { describe, expect, it } from 'vitest';
import { wrapCanvasLines } from './badgeShareImage';

describe('wrapCanvasLines', () => {
  it('wraps long text to a max line count', () => {
    const ctx = {
      measureText: (text: string) => ({ width: text.length * 10 }),
    } as CanvasRenderingContext2D;

    const lines = wrapCanvasLines(
      ctx,
      'Find your people get outside and go together on real outings across the UAE',
      120,
      2
    );
    expect(lines.length).toBeLessThanOrEqual(2);
    expect(lines[0]?.length).toBeGreaterThan(0);
  });
});
