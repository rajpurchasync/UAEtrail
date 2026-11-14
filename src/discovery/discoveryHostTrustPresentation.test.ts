import { describe, expect, it } from 'vitest';
import { buildDiscoveryCardViewModelCard } from './discoveryCardViewModel';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { resolveDiscoveryHostTrustLabels } from './discoveryHostTrustPresentation';

const activityItem = (): ExploreMapItemDTO =>
  ({
    id: 'activity:a1',
    kind: 'hiking',
    source: 'activity',
    title: 'Dawn hike',
    latitude: 25,
    longitude: 56,
    path: '/activity/a1',
    activity: {
      id: 'a1',
      title: 'Dawn hike',
      activityType: 'hiking',
      status: 'published',
      hostUserId: 'u1',
      hostName: 'Sam',
      publishingProfileKind: 'pro_guide',
    },
    presentation: {
      kind: 'hiking',
      source: 'activity',
      emoji: '🥾',
      headline: 'Dawn hike',
      listTitle: 'Dawn hike',
      listHost: 'Sam',
      primaryCta: 'Join',
      sections: { details: [] },
    },
  }) as ExploreMapItemDTO;

describe('discoveryHostTrustPresentation', () => {
  it('shows verified host for pro guide publishers', () => {
    const card = buildDiscoveryCardViewModelCard(activityItem());
    expect(resolveDiscoveryHostTrustLabels(card)).toEqual(['Verified host']);
  });

  it('shows verified business for agency publishers', () => {
    const card = buildDiscoveryCardViewModelCard(activityItem());
    card.activity = {
      ...card.activity!,
      publishingProfileKind: 'agency',
      tenantName: 'Trail Co',
    };
    expect(resolveDiscoveryHostTrustLabels(card)).toContain('Verified business');
  });
});