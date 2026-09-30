import { describe, expect, it } from 'vitest';
import { buildOrganizeActivityPublishInput } from './organizeActivityPublish';
import { emptyCreateActivityDraft } from '../explore/ui/organizeFlow';

describe('buildOrganizeActivityPublishInput', () => {
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

    const input = buildOrganizeActivityPublishInput({
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

    const input = buildOrganizeActivityPublishInput({
      draft,
      tenantId: 'tenant-1',
      userId: 'user-1',
      locationId: 'loc-1',
    });

    expect(input.joinMode).toBe('private');
    expect(input.participationMode).toBe('rsvp');
  });
});
