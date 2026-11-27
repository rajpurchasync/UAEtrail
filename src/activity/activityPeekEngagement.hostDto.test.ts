import { describe, expect, it } from 'vitest';
import type { ActivityDTO } from '@uaetrail/shared-types';
import { pickActivityPeekTwoSlotActions } from '@uaetrail/shared-types';
import { resolveActivityMapPeekActionsForHostDto } from './activityPeekEngagement';
import { resolveListFeedFooterFromMapPeekWire } from '../discovery/discoveryPortListPeek';

const baseActivity = (overrides: Partial<ActivityDTO> = {}): ActivityDTO =>
  ({
    id: 'a1',
    tenantId: 't1',
    tenantSlug: 'host',
    locationId: 'l1',
    locationName: 'Trail',
    activityType: 'hiking',
    title: 'Hike',
    description: '',
    date: '2026-11-20',
    time: '09:00',
    price: 0,
    slotsTotal: 10,
    slotsAvailable: 10,
    status: 'published',
    ...overrides,
  }) as ActivityDTO;

describe('resolveActivityMapPeekActionsForHostDto', () => {
  it('published empty → share + manage wire and footer', () => {
    const wire = resolveActivityMapPeekActionsForHostDto(baseActivity());
    const slot = pickActivityPeekTwoSlotActions(wire);
    expect(slot.primary?.id).toBe('share_activity');
    expect(slot.secondary?.id).toBe('manage_activity');
    const footer = resolveListFeedFooterFromMapPeekWire(wire);
    expect(footer.primary).toMatchObject({ actionId: 'share_activity' });
    expect(footer.secondary).toMatchObject({ actionId: 'manage_activity' });
  });

  it('published with joiners → chat + share footer (manage not in slot 2)', () => {
    const wire = resolveActivityMapPeekActionsForHostDto(
      baseActivity({
        slotsAvailable: 8,
        participantPreviews: [{ id: 'p1', name: 'Alex' }],
      })
    );
    const footer = resolveListFeedFooterFromMapPeekWire(wire);
    expect(footer.primary).toMatchObject({ actionId: 'open_crew_chat' });
    expect(footer.secondary).toMatchObject({ actionId: 'share_activity' });
  });

  it('draft → manage only', () => {
    const wire = resolveActivityMapPeekActionsForHostDto(baseActivity({ status: 'draft' }));
    expect(wire.map((a) => a.id)).toEqual(['manage_activity']);
  });
});