import { describe, expect, it } from 'vitest';
import {
  buildExploreFeaturedPerson,
  explorePersonFirstName,
  explorePersonHeadlineName,
  explorePersonRoleLabel,
  resolveExploreFeaturedPerson,
} from '@uaetrail/shared-types';

describe('explore featured person', () => {
  it('builds canonical person records', () => {
    expect(
      buildExploreFeaturedPerson({
        userId: 'u1',
        displayName: 'Omar Al Hosani',
        avatarUrl: 'https://example.com/a.jpg',
        role: 'host',
      })
    ).toEqual({
      userId: 'u1',
      displayName: 'Omar Al Hosani',
      avatarUrl: 'https://example.com/a.jpg',
      role: 'host',
    });
  });

  it('resolves activity host from activity.hostName when featuredPerson absent', () => {
    expect(
      resolveExploreFeaturedPerson({
        source: 'activity',
        activity: {
          hostUserId: 'u2',
          hostName: 'Sarah Host',
          hostAvatar: null,
        },
      })
    ).toMatchObject({
      userId: 'u2',
      displayName: 'Sarah',
      role: 'host',
    });
  });

  it('prefers featuredPerson over activity host fields', () => {
    expect(
      resolveExploreFeaturedPerson({
        source: 'activity',
        featuredPerson: {
          userId: 'u3',
          displayName: 'Maya Hassan',
          role: 'requester',
        },
        activity: { hostUserId: 'legacy', hostName: 'Legacy Name' },
      })?.displayName
    ).toBe('Maya Hassan');
  });

  it('derives first name and role labels from person', () => {
    expect(
      explorePersonFirstName({
        userId: 'u1',
        displayName: 'Alex Rider',
        role: 'requester',
      })
    ).toBe('Alex');
    expect(
      explorePersonHeadlineName({
        userId: 'u1',
        displayName: 'Alex Rider',
        role: 'requester',
      })
    ).toBe('Alex Rider');
    expect(explorePersonRoleLabel('requester')).toBe('Posted this request');
    expect(explorePersonRoleLabel('host')).toBe('Host');
    expect(explorePersonRoleLabel('organizer')).toBe('Host');
    expect(explorePersonRoleLabel('contact')).toBe('Shop contact');
  });
});