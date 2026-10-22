import { describe, expect, it } from 'vitest';
import { AUTH_RESUME_JOIN_QUERY } from '../utils/authReturnContext';
import { resolveExploreGuestAuthReturnPath } from './exploreGuestAuthReturn';

describe('resolveExploreGuestAuthReturnPath', () => {
  const explore = '/explore?pin=activity%3Aabc';
  const activity = { id: 'abc', hostUserId: 'host-1' };

  it('join gate from activity peek resumes join on detail', () => {
    expect(
      resolveExploreGuestAuthReturnPath({
        guestSheetSurface: 'join',
        guestSheetIntent: 'activity',
        pendingPeekAction: 'request_join',
        activity,
        browseReturnPath: explore,
      })
    ).toBe(`/activity/abc?${AUTH_RESUME_JOIN_QUERY}=1`);
  });

  it('browse gate without activity falls back to map URL', () => {
    expect(
      resolveExploreGuestAuthReturnPath({
        guestSheetSurface: 'browse',
        guestSheetIntent: 'activity',
        pendingPeekAction: 'view_detail',
        browseReturnPath: explore,
      })
    ).toBe(explore);
  });
});
