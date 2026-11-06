import { describe, expect, it } from 'vitest';
import {
  AUTH_RESUME_CREW_CHAT_QUERY,
  AUTH_RESUME_INVITE_FRIENDS_QUERY,
  AUTH_RESUME_JOIN_QUERY,
} from '../utils/authReturnContext';
import { resolveActivityPeekGuestAuthReturnPath } from './activityPeekGuestAuthReturn';

const activity = {
  id: 'abc',
  hostUserId: 'host-1',
  groupChatId: 'grp-9',
};

const explore = '/explore?pin=activity%3Aabc';

describe('resolveActivityPeekGuestAuthReturnPath', () => {
  it('join sheet resumes join on activity detail', () => {
    expect(
      resolveActivityPeekGuestAuthReturnPath({
        guestSheetSurface: 'join',
        guestSheetIntent: 'activity',
        pendingPeekAction: 'request_join',
        activity,
        browseReturnPath: explore,
      })
    ).toBe(`/activity/abc?${AUTH_RESUME_JOIN_QUERY}=1`);
  });

  it('message host opens direct chat with host + activity context', () => {
    const path = resolveActivityPeekGuestAuthReturnPath({
      guestSheetSurface: 'browse',
      guestSheetIntent: 'activity',
      pendingPeekAction: 'message_host',
      activity,
      browseReturnPath: explore,
    });
    expect(path).toBe('/chat?to=host-1&activity=abc');
  });

  it('crew chat uses group deep link when group id is known', () => {
    expect(
      resolveActivityPeekGuestAuthReturnPath({
        guestSheetSurface: 'browse',
        guestSheetIntent: 'activity',
        pendingPeekAction: 'open_crew_chat',
        activity,
        browseReturnPath: explore,
      })
    ).toBe('/chat?group=grp-9&chat=1&activity=abc');
  });

  it('crew chat without group id resumes thread on chat route', () => {
    expect(
      resolveActivityPeekGuestAuthReturnPath({
        guestSheetSurface: 'browse',
        guestSheetIntent: 'activity',
        pendingPeekAction: 'open_crew_chat',
        activity: { id: 'abc', hostUserId: 'host-1' },
        browseReturnPath: explore,
      })
    ).toBe(`/chat?activity=abc&${AUTH_RESUME_CREW_CHAT_QUERY}=1`);
  });

  it('invite friends resumes invite sheet on activity detail', () => {
    expect(
      resolveActivityPeekGuestAuthReturnPath({
        guestSheetSurface: 'browse',
        guestSheetIntent: 'activity',
        pendingPeekAction: 'invite_crew',
        activity,
        browseReturnPath: explore,
      })
    ).toBe(`/activity/abc?${AUTH_RESUME_INVITE_FRIENDS_QUERY}=1`);
  });

  it('view details opens activity page', () => {
    expect(
      resolveActivityPeekGuestAuthReturnPath({
        guestSheetSurface: 'browse',
        guestSheetIntent: 'activity',
        pendingPeekAction: 'view_detail',
        activity,
        browseReturnPath: explore,
      })
    ).toBe('/activity/abc');
  });
});
