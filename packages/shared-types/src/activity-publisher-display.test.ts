import { describe, expect, it } from 'vitest';
import {
  exploreActivityPublisherTypeLabel,
  publishesActivityAsIndividual,
  resolveActivityHostReviewTarget,
  resolveActivityPublisherDisplayName,
  resolveActivityPublisherProfilePath,
} from './activity-publisher-display.js';

describe('activity publisher display', () => {
  it('community posts use person name and member profile', () => {
    expect(publishesActivityAsIndividual('community')).toBe(true);
    expect(
      resolveActivityPublisherDisplayName({
        publishingProfileKind: 'community',
        tenantName: 'Desert Explorer',
        person: {
          guideName: 'Omar Al Hosani',
          tenantName: 'Desert Explorer',
        },
      })
    ).toBe('Omar Al Hosani');
    expect(
      resolveActivityPublisherProfilePath({
        publishingProfileKind: 'community',
        tenantSlug: 'desert-explorer',
        hostUserId: 'u-omar',
      })
    ).toBe('/member/u-omar?source=host');
  });

  it('pro individual posts use person name and member profile', () => {
    expect(publishesActivityAsIndividual('pro_guide')).toBe(true);
    expect(
      resolveActivityPublisherDisplayName({
        publishingProfileKind: 'pro_guide',
        tenantName: 'Omar Guides',
        person: {
          guideName: 'Omar Al Hosani',
          tenantName: 'Omar Guides',
        },
      })
    ).toBe('Omar Al Hosani');
    expect(
      resolveActivityPublisherProfilePath({
        publishingProfileKind: 'pro_guide',
        tenantSlug: 'omar-guides',
        hostUserId: 'u-omar',
      })
    ).toBe('/member/u-omar?source=host');
  });

  it('agency posts use business name and host storefront URL', () => {
    expect(
      resolveActivityPublisherDisplayName({
        publishingProfileKind: 'agency',
        tenantName: 'UAE Adventure Co',
        person: { guideName: 'Maya Hassan', tenantName: 'UAE Adventure Co' },
      })
    ).toBe('UAE Adventure Co');
    expect(
      resolveActivityPublisherProfilePath({
        publishingProfileKind: 'agency',
        tenantSlug: 'uae-adventure-co',
        hostUserId: 'u1',
      })
    ).toBe('/agency/uae-adventure-co');
  });

  it('reviews a buddy as a person and an agency as the operator', () => {
    expect(
      resolveActivityHostReviewTarget({
        publishingProfileKind: 'community',
        hostUserId: 'host-1',
        tenantId: 'tenant-1',
      })
    ).toEqual({ targetType: 'user', targetId: 'host-1' });
    expect(
      resolveActivityHostReviewTarget({
        publishingProfileKind: 'agency',
        hostUserId: 'owner-1',
        tenantId: 'tenant-1',
      })
    ).toEqual({ targetType: 'tenant', targetId: 'tenant-1' });
  });

  it('labels never use organisation wording', () => {
    expect(exploreActivityPublisherTypeLabel('community')).toBe('Host');
    expect(exploreActivityPublisherTypeLabel('agency')).toBe('Tour operator');
    expect(exploreActivityPublisherTypeLabel('pro_guide')).toBe('Professional');
  });
});
