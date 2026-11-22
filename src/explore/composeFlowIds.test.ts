import { describe, expect, it } from 'vitest';
import {
  isCanonicalComposeFlowId,
  priorCatalogComposeFlowId,
  normalizeComposeFlowId,
} from './composeFlowIds';

describe('composeFlowIds', () => {
  it('accepts canonical activity/intent/place ids only', () => {
    expect(isCanonicalComposeFlowId('activity.hiking')).toBe(true);
    expect(isCanonicalComposeFlowId('intent.fixed.rideshare')).toBe(true);
    expect(isCanonicalComposeFlowId('place.facility')).toBe(true);
    expect(isCanonicalComposeFlowId('host.hiking')).toBe(false);
  });

  it('normalizes legacy CPC-9c catalog ids inbound', () => {
    expect(normalizeComposeFlowId('host.camping')).toBe('activity.camping');
    expect(normalizeComposeFlowId('seek.fixed.event')).toBe('intent.fixed.event');
    expect(normalizeComposeFlowId('add.place.shop')).toBe('place.shop');
    expect(normalizeComposeFlowId('add.facility')).toBe('place.facility');
    expect(normalizeComposeFlowId('activity.hiking')).toBe('activity.hiking');
    expect(normalizeComposeFlowId('organize.hiking')).toBeNull();
  });

  it('maps canonical ids back to legacy session keys', () => {
    expect(priorCatalogComposeFlowId('activity.rideshare')).toBe('host.rideshare');
    expect(priorCatalogComposeFlowId('place.hiking')).toBe('add.place.hiking');
  });
});