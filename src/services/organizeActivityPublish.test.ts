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
});
