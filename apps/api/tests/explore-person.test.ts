import { describe, expect, it } from 'vitest';
import {
  buildExploreFeaturedPerson,
  explorePersonFirstName,
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

  it('resolves demand legacy hostName into requester role', () => {
    expect(
      resolveExploreFeaturedPerson({
        source: 'demand',
        requesterUserId: 'u2',
        hostName: 'Sarah Host',
        hostAvatar: null,
      })
    ).toMatchObject({
      userId: 'u2',
      displayName: 'Sarah Host',
      role: 'requester',
    });
  });

  it('prefers featuredPerson over legacy fields', () => {
    expect(
      resolveExploreFeaturedPerson({
        source: 'demand',
        featuredPerson: {
          userId: 'u3',
          displayName: 'Maya Hassan',
          role: 'requester',
        },
        hostName: 'Legacy Name',
        requesterUserId: 'legacy',
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
    expect(explorePersonRoleLabel('requester')).toBe('Posted this request');
    expect(explorePersonRoleLabel('host')).toBe('Host');
    expect(explorePersonRoleLabel('contact')).toBe('Shop contact');
  });
});
