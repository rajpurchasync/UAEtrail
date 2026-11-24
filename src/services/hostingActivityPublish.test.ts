import { describe, expect, it } from 'vitest';
import { buildHostingActivityPublishInput } from './hostingActivityPublish';
import { emptyCreateActivityDraft } from '../explore/ui/hostingFlowEngine';

describe('buildHostingActivityPublishInput', () => {
  it('sends shared cost amount in pricing.price for shared mode', () => {
    const draft = {
      ...emptyCreateActivityDraft(),
      kind: 'hiking' as const,
      title: 'Sunrise hike',
      latitude: 25.1,
      longitude: 55.2,
      meetingLatitude: 25.11,
      meetingLongitude: 55.21,
      priceMode: 'shared' as const,
      priceAmount: 35,
      sharedCostNote: 'Fuel split',
    };

    const input = buildHostingActivityPublishInput({
      draft,
      tenantId: 'tenant-1',
      userId: 'user-1',
      locationId: 'loc-1',
    });

    expect(input.pricing.pricingMode).toBe('shared');
    expect(input.pricing.price).toBe(35);
    expect(input.pricing.paymentTerms).toBe('Fuel split');
  });

  it('forces RSVP participation when joinMode is private', () => {
    const draft = {
      ...emptyCreateActivityDraft(),
      kind: 'camping' as const,
      title: 'Private camp',
      joinMode: 'private' as const,
      participationMode: 'approval' as const,
      latitude: 23.1,
      longitude: 54.2,
      meetingLatitude: 23.11,
      meetingLongitude: 54.21,
    };

    const input = buildHostingActivityPublishInput({
      draft,
      tenantId: 'tenant-1',
      userId: 'user-1',
      locationId: 'loc-1',
    });

    expect(input.joinMode).toBe('private');
    expect(input.participationMode).toBe('rsvp');
  });

  it('does not send activity destinationId on host payload (area lives on place)', () => {
    const draft = {
      ...emptyCreateActivityDraft(),
      kind: 'event' as const,
      title: 'Park run',
      meetingLatitude: 25.1,
      meetingLongitude: 55.2,
    };

    const input = buildHostingActivityPublishInput({
      draft,
      tenantId: 'tenant-1',
      userId: 'user-1',
      locationId: 'loc-1',
    });

    expect('destinationId' in input && input.destinationId).toBeFalsy();
  });

  it('sends endDate only for multi-day host outings', () => {
    const draft = {
      ...emptyCreateActivityDraft(),
      kind: 'camping' as const,
      title: 'Weekend camp',
      date: '2026-11-14',
      endDate: '2026-11-16',
      time: '08:00',
      endTime: '18:00',
      meetingLatitude: 24.1,
      meetingLongitude: 55.2,
    };

    const input = buildHostingActivityPublishInput({
      draft,
      tenantId: 'tenant-1',
      userId: 'user-1',
      locationId: 'loc-1',
    });

    expect(input.endDate).toBe('2026-11-16');
    expect(input.endTime).toBe('18:00');
  });

  it('omits endDate for same-day host outings but keeps endTime', () => {
    const draft = {
      ...emptyCreateActivityDraft(),
      kind: 'hiking' as const,
      title: 'Day hike',
      date: '2026-11-14',
      endDate: '2026-11-14',
      time: '06:00',
      endTime: '14:00',
      meetingLatitude: 25.1,
      meetingLongitude: 55.2,
    };

    const input = buildHostingActivityPublishInput({
      draft,
      tenantId: 'tenant-1',
      userId: 'user-1',
      locationId: 'loc-1',
    });

    expect(input.endDate).toBeUndefined();
    expect(input.endTime).toBe('14:00');
  });
});
