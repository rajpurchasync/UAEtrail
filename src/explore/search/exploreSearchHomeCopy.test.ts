import { describe, expect, it } from 'vitest';
import { EXPLORE_SEARCH_GUEST_WHERE_PLACEHOLDER } from '../guestMapPreviewCopy';
import {
  EXPLORE_SEARCH_WHERE_PLACEHOLDER,
  resolveExploreSearchBookingWherePlaceholder,
} from './exploreSearchHomeCopy';

describe('resolveExploreSearchBookingWherePlaceholder', () => {
  it('uses member where copy when signed in', () => {
    expect(resolveExploreSearchBookingWherePlaceholder(true)).toBe(EXPLORE_SEARCH_WHERE_PLACEHOLDER);
  });

  it('uses guest preview where copy when signed out', () => {
    expect(resolveExploreSearchBookingWherePlaceholder(false)).toBe(EXPLORE_SEARCH_GUEST_WHERE_PLACEHOLDER);
  });
});