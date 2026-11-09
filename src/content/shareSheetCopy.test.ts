import { describe, expect, it } from 'vitest';
import {
  SHARE_SHEET_TITLE_AREA,
  SHARE_SHEET_TITLE_OUTING,
  resolveShareSheetTitle,
  shareSurfaceFromDiscoveryCard,
} from './shareSheetCopy';

describe('shareSheetCopy', () => {
  it('resolves sheet titles by surface', () => {
    expect(resolveShareSheetTitle('area')).toBe(SHARE_SHEET_TITLE_AREA);
    expect(resolveShareSheetTitle('activity')).toBe(SHARE_SHEET_TITLE_OUTING);
  });

  it('maps area discovery cards to area share surface', () => {
    expect(
      shareSurfaceFromDiscoveryCard({ kind: 'area', source: 'area_catalog', activity: undefined })
    ).toBe('area');
  });
});
