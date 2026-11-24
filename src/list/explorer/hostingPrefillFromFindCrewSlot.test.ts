import { describe, expect, it } from 'vitest';
import type { MemberAvailabilitySlotDTO } from '@uaetrail/shared-types';
import { hostingPrefillFromFindCrewSlot } from './hostingPrefillFromFindCrewSlot';

describe('hostingPrefillFromFindCrewSlot', () => {
  it('maps slot modality, dates, and destination regions into host draft', () => {
    const slot = {
      slotId: 's1',
      scheduleKind: 'fixed',
      startDate: '2026-12-01',
      endDate: '2026-12-01',
      startAt: '2026-12-01T06:30:00.000Z',
      capacity: 'participant',
      modalities: ['hiking'],
      destinationRegions: ['Dubai'],
      partySize: 3,
    } as MemberAvailabilitySlotDTO;

    const prefill = hostingPrefillFromFindCrewSlot(slot);
    expect(prefill.draft.kind).toBe('hiking');
    expect(prefill.draft.date).toBe('2026-12-01');
    expect(prefill.draft.title).toContain('Dubai');
    expect(prefill.draft.capacity).toBe(3);
  });
});