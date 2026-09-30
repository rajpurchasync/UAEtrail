import { describe, expect, it } from 'vitest';
import { COMMUNITY_SHOP_TAG, decodeShopContributeTags, encodeShopContributeTags } from '@uaetrail/shared-types';

describe('shopContribute tags', () => {
  it('round-trips community shop metadata in location tags', () => {
    const tags = encodeShopContributeTags({
      searchKeywords: 'hiking, boots',
      deliveryOffered: true,
      deliveryRadiusKm: 50,
      contactEmail: 'shop@example.com',
      contactPhoneE164: '+971501234567',
    });

    expect(tags).toContain(COMMUNITY_SHOP_TAG);
    const decoded = decodeShopContributeTags(tags);
    expect(decoded.isCommunityShop).toBe(true);
    expect(decoded.deliveryOffered).toBe(true);
    expect(decoded.deliveryRadiusKm).toBe(50);
    expect(decoded.contactEmail).toBe('shop@example.com');
    expect(decoded.contactPhoneE164).toBe('+971501234567');
    expect(decoded.keywordTags).toContain('hiking');
    expect(decoded.keywordTags).toContain('boots');
  });
});
