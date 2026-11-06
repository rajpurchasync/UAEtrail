import { describe, expect, it } from 'vitest';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { buildExploreMemberPeopleMapChip, collectGoingPeopleFromMapItems } from './exploreMemberPeopleMapChip';

const activityItem = (overrides: Partial<ExploreMapItemDTO> = {}): ExploreMapItemDTO =>
  ({
    id: 'activity:1',
    kind: 'hiking',
    source: 'activity',
    title: 'Friday hike',
    latitude: 25,
    longitude: 55,
    path: '/activity/1',
    participantPreviews: [
      { id: 'u1', name: 'Amina', avatar: 'https://cdn.example/a.jpg' },
      { id: 'u2', name: 'Sam', avatar: null },
    ],
    ...overrides,
  }) as ExploreMapItemDTO;

describe('collectGoingPeopleFromMapItems', () => {
  it('collects participant previews from activities', () => {
    const rows = collectGoingPeopleFromMapItems([activityItem()], { excludeUserId: 'viewer' });
    expect(rows.map((r) => r.id)).toEqual(['u1', 'u2']);
    expect(rows[0]?.avatar).toContain('cdn.example');
  });

  it('excludes the signed-in viewer', () => {
    const rows = collectGoingPeopleFromMapItems([activityItem()], { excludeUserId: 'u1' });
    expect(rows.map((r) => r.id)).toEqual(['u2']);
  });

  it('falls back to featured host when there are no participant previews', () => {
    const rows = collectGoingPeopleFromMapItems(
      [
        activityItem({
          participantPreviews: [],
          featuredPerson: {
            userId: 'host-1',
            displayName: 'Omar',
            avatarUrl: 'https://cdn.example/host.jpg',
            role: 'organizer',
          },
        }),
      ],
      { excludeUserId: 'viewer' }
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.id).toBe('host-1');
  });
});

describe('buildExploreMemberPeopleMapChip', () => {
  it('fills the chip from map going when network preview is empty', () => {
    const chip = buildExploreMemberPeopleMapChip({
      preview: null,
      mapItems: [activityItem()],
      viewerUserId: 'viewer',
    });
    expect(chip.avatars).toHaveLength(2);
    expect(chip.avatars[0]?.name).toBe('Amina');
    expect(chip.crewCount).toBe(2);
  });

  it('merges friends first then map going faces', () => {
    const chip = buildExploreMemberPeopleMapChip({
      preview: {
        avatars: [{ userId: 'f1', displayName: 'Friend', avatarUrl: null }],
        friendUserIds: ['f1'],
        friendCount: 1,
        followedCount: 0,
        allCount: 1,
      },
      mapItems: [activityItem()],
      viewerUserId: 'viewer',
    });
    expect(chip.avatars[0]?.id).toBe('f1');
    expect(chip.avatars.some((a) => a.id === 'u1')).toBe(true);
  });
});
