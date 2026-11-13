import { describe, expect, it } from 'vitest';
import {
  DEFAULT_FIND_CREW_VISIBILITY,
  mergeFindCrewVisibility,
  viewerMaySeeInFindCrew,
  viewerMaySeeMemberLocation,
} from './find-crew-visibility.js';

describe('mergeFindCrewVisibility', () => {
  it('defaults unset values', () => {
    expect(mergeFindCrewVisibility(null)).toBe(DEFAULT_FIND_CREW_VISIBILITY);
    expect(mergeFindCrewVisibility(undefined)).toBe('friends_of_friends');
  });

  it('keeps valid stored values', () => {
    expect(mergeFindCrewVisibility('none')).toBe('none');
    expect(mergeFindCrewVisibility('friends')).toBe('friends');
  });
});

describe('viewerMaySeeInFindCrew', () => {
  it('always allows self', () => {
    expect(viewerMaySeeInFindCrew({ visibility: 'none', relation: 'self' })).toBe(true);
  });

  it('hides everyone when none', () => {
    expect(viewerMaySeeInFindCrew({ visibility: 'none', relation: 'friend' })).toBe(false);
    expect(viewerMaySeeInFindCrew({ visibility: 'none', relation: 'friend_of_friend' })).toBe(false);
  });

  it('friends-only blocks FoF and strangers', () => {
    expect(viewerMaySeeInFindCrew({ visibility: 'friends', relation: 'friend' })).toBe(true);
    expect(viewerMaySeeInFindCrew({ visibility: 'friends', relation: 'friend_of_friend' })).toBe(
      false
    );
    expect(viewerMaySeeInFindCrew({ visibility: 'friends', relation: 'stranger' })).toBe(false);
  });

  it('friends_of_friends allows FoF but not strangers', () => {
    expect(
      viewerMaySeeInFindCrew({ visibility: 'friends_of_friends', relation: 'friend_of_friend' })
    ).toBe(true);
    expect(viewerMaySeeInFindCrew({ visibility: 'friends_of_friends', relation: 'stranger' })).toBe(
      false
    );
  });
});

describe('viewerMaySeeMemberLocation', () => {
  it('hides when city audience is hidden', () => {
    expect(
      viewerMaySeeMemberLocation({ cityAudience: 'hidden', exposure: 'full', isSelf: false })
    ).toBe(false);
  });

  it('friends city requires full exposure', () => {
    expect(
      viewerMaySeeMemberLocation({ cityAudience: 'friends', exposure: 'public', isSelf: false })
    ).toBe(false);
    expect(
      viewerMaySeeMemberLocation({ cityAudience: 'friends', exposure: 'full', isSelf: false })
    ).toBe(true);
  });

  it('friends_of_friends city allows FoF relation', () => {
    expect(
      viewerMaySeeMemberLocation({
        cityAudience: 'friends_of_friends',
        exposure: 'public',
        isSelf: false,
        relation: 'friend_of_friend',
      })
    ).toBe(true);
    expect(
      viewerMaySeeMemberLocation({
        cityAudience: 'friends_of_friends',
        exposure: 'public',
        isSelf: false,
        relation: 'stranger',
      })
    ).toBe(false);
  });
});
