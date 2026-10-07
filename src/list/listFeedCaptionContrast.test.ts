import { describe, expect, it } from 'vitest';
import { resolveListFeedCaptionScrim } from './listFeedCaptionContrast';

describe('resolveListFeedCaptionScrim', () => {
  it('uses strong scrim on bright bottom bands', () => {
    expect(resolveListFeedCaptionScrim(0.72)).toBe('strong');
  });

  it('uses medium scrim on mid tones', () => {
    expect(resolveListFeedCaptionScrim(0.5)).toBe('medium');
  });

  it('uses light scrim when the bottom is already dark', () => {
    expect(resolveListFeedCaptionScrim(0.2)).toBe('light');
  });

  it('defaults safely when luminance is unknown (CORS / sampling failed)', () => {
    expect(resolveListFeedCaptionScrim(null)).toBe('default');
  });
});
