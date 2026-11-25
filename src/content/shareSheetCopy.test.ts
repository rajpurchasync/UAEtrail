import { describe, expect, it } from 'vitest';
import {
  SHARE_SHEET_TITLE_DESTINATION,
  SHARE_SHEET_TITLE_OUTING,
  resolveShareSheetTitle,
  shareSurfaceFromDiscoveryCard,
} from './shareSheetCopy';

describe('shareSheetCopy', () => {
  it('resolves sheet titles by surface', () => {
    expect(resolveShareSheetTitle('destination')).toBe(SHARE_SHEET_TITLE_DESTINATION);
    expect(resolveShareSheetTitle('activity')).toBe(SHARE_SHEET_TITLE_OUTING);
  });

  it('maps destination discovery cards to destination share surface', () => {
    expect(
      shareSurfaceFromDiscoveryCard({ kind: 'destination', source: 'destination', activity: undefined })
    ).toBe('destination');
  });
});