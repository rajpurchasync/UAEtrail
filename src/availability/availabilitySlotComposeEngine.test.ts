import { describe, expect, it } from 'vitest';
import {
  buildOpenAvailabilityUpsert,
  mergeOpenSlotsWithExisting,
  openEditorStateFromMemberAvailability,
  prefillFixedIntentCompose,
  prefillOpenIntentCompose,
} from './availabilitySlotComposeEngine';

describe('availabilitySlotComposeEngine (MIG-SG-B2)', () => {
  it('prefills intent:open participant by default', () => {
    expect(prefillOpenIntentCompose()).toEqual({
      scheduleKind: 'open',
      capacity: 'participant',
      modalities: ['hiking'],
    });
  });

  it('prefills intent:open guide capacity from param', () => {
    expect(prefillOpenIntentCompose({ capacityParam: 'guide' }).capacity).toBe('guide');
  });

  it('prefills intent:fixed without guide modality', () => {
    const prefill = prefillFixedIntentCompose('hiking');
    expect(prefill).toEqual({
      scheduleKind: 'fixed',
      capacity: 'participant',
      modalities: ['hiking'],
    });
  });

  it('hydrates open editor from slot capacity (not kinds)', () => {
    const state = openEditorStateFromMemberAvailability({
      userId: 'u1',
      kinds: ['hiking'],
      visibility: 'public',
      slots: [
        {
          scheduleKind: 'open',
          startDate: '2030-01-01',
          endDate: '2030-01-01',
          timeBand: 'any',
          capacity: 'guide',
          modalities: ['camping', 'hiking'],
        },
      ],
      updatedAt: '',
    });
    expect(state.capacity).toBe('guide');
    expect(state.modalities).toEqual(['camping', 'hiking']);
  });

  it('attaches guide engagement terms on guide open slots (MIG-SG-C1)', () => {
    const upsert = buildOpenAvailabilityUpsert(
      {
        selectedDays: new Set(['2030-01-01']),
        capacity: 'guide',
        modalities: ['hiking'],
        visibility: 'public',
        note: '',
        locationMode: 'open',
        region: '',
        areaId: '',
        guideEngagementTerms: {
          pricingKind: 'upon_request',
          tourShape: 'private',
        },
      },
      null
    );
    expect(upsert.slots[0]?.capacity).toBe('guide');
    expect(upsert.slots[0]?.engagementTerms).toMatchObject({
      pricingKind: 'upon_request',
      tourShape: 'private',
    });
  });

  it('merges open writes with existing fixed slots', () => {
    const upsert = buildOpenAvailabilityUpsert(
      {
        selectedDays: new Set(['2030-01-01']),
        capacity: 'participant',
        modalities: ['hiking'],
        visibility: 'public',
        note: '',
        locationMode: 'open',
        region: '',
        areaId: '',
      },
      {
        userId: 'u1',
        kinds: ['hiking'],
        visibility: 'public',
        slots: [
          {
            scheduleKind: 'fixed',
            startDate: '2030-02-01',
            endDate: '2030-02-01',
            title: 'Pin',
          },
        ],
        updatedAt: '',
      }
    );
    expect(upsert.slots).toHaveLength(2);
    expect(mergeOpenSlotsWithExisting(null, upsert.slots.filter((s) => s.scheduleKind !== 'fixed')))
      .toHaveLength(1);
  });
});