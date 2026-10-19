import { describe, expect, it } from 'vitest';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { buildDiscoveryCardViewModelCard } from './discoveryCardViewModel';

const seekingWithActivity = (
  partial: Partial<ExploreMapItemDTO> = {}
): ExploreMapItemDTO =>
  ({
    id: 'activity:act-1',
    kind: 'hiking',
    source: 'activity',
    activityMode: 'seeking',
    title: 'Find crew',
    latitude: 25,
    longitude: 55,
    path: '/activity/act-1',
    participantIntentId: 'int-legacy',
    activity: {
      id: 'act-1',
      title: 'Find crew',
      activityType: 'hiking',
      joinMode: 'open',
    },
    ...partial,
    ...(partial.activity
      ? { activity: { id: 'act-1', title: 'Find crew', activityType: 'hiking', joinMode: 'open', ...partial.activity } }
      : {}),
  }) as ExploreMapItemDTO;

describe('discoveryCardModel seeking (R4.3)', () => {
  it('omits participantIntentId on card when published seeking activity exists', () => {
    const card = buildDiscoveryCardViewModelCard(seekingWithActivity());
    expect(card.activityId).toBe('act-1');
    expect(card.participantIntentId).toBeNull();
    expect(card.sharePath).toMatch(/pin=activity(%3A|:)act-1/);
  });

  it('peek headline uses requester first name, not Organizer fallback', () => {
    const card = buildDiscoveryCardViewModelCard(
      seekingWithActivity({
        hostName: 'Organizer',
        featuredPerson: {
          userId: 'u1',
          displayName: 'Organizer',
          role: 'requester',
        },
        activity: {
          id: 'act-1',
          title: 'Find crew',
          activityType: 'hiking',
          joinMode: 'open',
          createdByName: 'Fatima Al Mazrouei',
          tenantName: 'Fatima Al Mazrouei',
          hostName: 'Organizer',
        },
      })
    );
    expect(card.sections.highlightName).toBe('Fatima');
    expect(card.headline).toContain('Fatima');
    expect(card.headline).not.toMatch(/^Organizer is looking for/i);
  });
});
