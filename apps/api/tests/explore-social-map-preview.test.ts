import { describe, expect, it } from 'vitest';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { collectExploreSocialMapPreviewPeople } from '../src/lib/explore-social-map-preview.js';

const activityItem = (overrides: Partial<ExploreMapItemDTO> = {}): ExploreMapItemDTO =>
  ({
    id: 'activity:1',
    kind: 'hiking',
    source: 'activity',
    title: 'Hike',
    latitude: 25,
    longitude: 55,
    path: '/activity/1',
    participantPreviews: [{ id: 'u1', name: 'Amina', avatar: null }],
    ...overrides,
  }) as ExploreMapItemDTO;

describe('collectExploreSocialMapPreviewPeople', () => {
  it('collects joiners and skips the viewer', () => {
    const rows = collectExploreSocialMapPreviewPeople([activityItem()], 'viewer');
    expect(rows.map((r) => r.userId)).toEqual(['u1']);
  });

  it('includes featured host when there are no joiner previews', () => {
    const rows = collectExploreSocialMapPreviewPeople(
      [
        activityItem({
          participantPreviews: [],
          featuredPerson: {
            userId: 'host-1',
            displayName: 'Host',
            avatarUrl: 'https://cdn.example/h.jpg',
            role: 'host',
          },
        }),
      ],
      'viewer'
    );
    expect(rows[0]?.userId).toBe('host-1');
  });
});
