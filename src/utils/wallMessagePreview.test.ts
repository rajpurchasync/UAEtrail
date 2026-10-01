import { describe, expect, it } from 'vitest';
import { formatWallInboxPreview } from './wallMessagePreview';

describe('formatWallInboxPreview', () => {
  it('uses reply text when body is a structured reply', () => {
    const body = '↩[id:m1] Alex: “Meet at 5”\n\nOn my way';
    expect(formatWallInboxPreview(body)).toBe('On my way');
  });

  it('truncates long plain messages', () => {
    const body = 'a'.repeat(200);
    const preview = formatWallInboxPreview(body);
    expect(preview.length).toBeLessThanOrEqual(160);
    expect(preview.endsWith('…')).toBe(true);
  });
});
