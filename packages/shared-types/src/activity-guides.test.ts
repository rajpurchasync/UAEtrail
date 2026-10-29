import { describe, expect, it } from 'vitest';
import {
  acceptedActivityGuides,
  activityGuideConsentRequired,
  activityGuideCountLabel,
  resolveActivityPublisherChip,
} from './activity-guides.js';

describe('activity guides', () => {
  it('requires consent for community and pro guides, not agencies', () => {
    expect(activityGuideConsentRequired('community')).toBe(true);
    expect(activityGuideConsentRequired('pro_guide')).toBe(true);
    expect(activityGuideConsentRequired('agency')).toBe(false);
    expect(activityGuideConsentRequired('shop')).toBe(false);
  });

  it('hides pending guides from the public set', () => {
    expect(
      acceptedActivityGuides([
        { userId: 'a', status: 'accepted' },
        { userId: 'b', status: 'pending' },
      ]).map((row) => row.userId)
    ).toEqual(['a']);
  });

  it('uses company name and logo for agency outings', () => {
    expect(
      resolveActivityPublisherChip({
        publishingProfileKind: 'agency',
        tenantName: 'UAE Adventure Co',
        tenantLogoUrl: 'https://cdn.example/logo.png',
        hostName: 'Fatima Al Mazrouei',
        hostAvatar: 'https://cdn.example/fatima.jpg',
      })
    ).toEqual({
      kind: 'company',
      name: 'UAE Adventure Co',
      avatarUrl: 'https://cdn.example/logo.png',
    });
  });

  it('keeps the person chip for community outings', () => {
    expect(
      resolveActivityPublisherChip({
        publishingProfileKind: 'community',
        tenantName: 'Fatima Al Mazrouei',
        hostName: 'Fatima Al Mazrouei',
        hostAvatar: 'https://cdn.example/fatima.jpg',
      })
    ).toEqual({
      kind: 'person',
      name: 'Fatima Al Mazrouei',
      avatarUrl: 'https://cdn.example/fatima.jpg',
    });
  });

  it('labels peek guide counts without naming people', () => {
    expect(activityGuideCountLabel(1)).toBe('1 guide');
    expect(activityGuideCountLabel(3)).toBe('3 guides');
  });
});
