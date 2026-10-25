import { describe, expect, it } from 'vitest';
import type { ActivityDetailDTO } from '@uaetrail/shared-types';
import { resolveRideshareContributionPresentation } from './resolveRideshareContributionPresentation';

const base = (overrides: Partial<ActivityDetailDTO> = {}): ActivityDetailDTO =>
  ({
    id: 'a1',
    activityType: 'rideshare',
    title: 'Ride',
    date: '2026-03-01',
    time: '05:00',
    price: 0,
    rideshareFree: false,
    ridesharePriceAed: 35,
    pricingMode: 'shared',
    ...overrides,
  }) as ActivityDetailDTO;

describe('resolveRideshareContributionPresentation', () => {
  it('shows paid seat copy when rideshare has a seat price', () => {
    const p = resolveRideshareContributionPresentation(base());
    expect(p.kind).toBe('shared');
    expect(p.headerBadge).toBe('Shared · AED 35/seat');
    expect(p.detailLabel).toContain('Shared · AED 35/seat');
    expect(p.showDirectPaymentNote).toBe(true);
  });

  it('shows free seats when host marks ride free', () => {
    const p = resolveRideshareContributionPresentation(
      base({ rideshareFree: true, ridesharePriceAed: 0 })
    );
    expect(p.kind).toBe('free');
    expect(p.headerBadge).toBe('Free');
    expect(p.showDirectPaymentNote).toBe(false);
  });
});
