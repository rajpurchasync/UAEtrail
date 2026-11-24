import { describe, expect, it } from 'vitest';
import type { CommunityDiscoverCardDTO } from '@uaetrail/shared-types';
import { buildDiscoveryCardModelFromCommunityDiscover } from './buildCommunityDiscoverCardModel';

const row = (): CommunityDiscoverCardDTO => ({
  id: 'c1',
  name: 'Dubai Weekend Hikers',
  slug: 'dubai-weekend-hikers',
  summary: 'Friday hikes',
  bannerUrl: '/uploads/club.jpg',
  visibility: 'public',
  joinPolicy: 'open',
  memberCount: 24,
  geoRef: {
    chain: [],
    countryId: 'ae',
    stateId: 'dubai',
    destinationId: 'dubai',
    path: 'United Arab Emirates/Dubai',
    names: { country: 'United Arab Emirates', state: 'Dubai', area: 'Dubai' },
    searchTokens: ['dubai'],
  },
});

describe('buildDiscoveryCardModelFromCommunityDiscover', () => {
  it('maps club directory rows to discovery list cards', () => {
    const card = buildDiscoveryCardModelFromCommunityDiscover(row());
    expect(card.id).toBe('community:c1');
    expect(card.path).toBe('/clubs/dubai-weekend-hikers');
    expect(card.coverImage).toBe('/uploads/club.jpg');
    expect(card.listTitle).toBe('Dubai Weekend Hikers');
    expect(card.venueHint).toContain('Dubai');
    expect(card.spotsLabel).toBe('24 members');
  });
});