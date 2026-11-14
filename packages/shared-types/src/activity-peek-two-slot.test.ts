import { describe, expect, it } from 'vitest';
import { computeActivityMapPeekActions } from './activity-map-peek-actions.js';
import { pickActivityPeekTwoSlotActions } from './activity-peek-two-slot.js';

describe('pickActivityPeekTwoSlotActions', () => {
  it('host empty → share + manage', () => {
    const wire = computeActivityMapPeekActions({ level: 'host', activityPublished: true });
    const slot = pickActivityPeekTwoSlotActions(wire);
    expect(slot.primary?.id).toBe('share_activity');
    expect(slot.secondary?.id).toBe('manage_activity');
  });

  it('host with joiners → crew chat + share (not manage in peek slot)', () => {
    const wire = computeActivityMapPeekActions({
      level: 'host',
      activityPublished: true,
      confirmedParticipantCount: 2,
    });
    const slot = pickActivityPeekTwoSlotActions(wire);
    expect(slot.primary?.id).toBe('open_crew_chat');
    expect(slot.secondary?.id).toBe('share_activity');
  });

  it('participant → chat + invite', () => {
    const wire = computeActivityMapPeekActions({ level: 'participant', activityPublished: true });
    const slot = pickActivityPeekTwoSlotActions(wire);
    expect(slot.primary?.id).toBe('open_crew_chat');
    expect(slot.secondary?.id).toBe('invite_crew');
  });
});