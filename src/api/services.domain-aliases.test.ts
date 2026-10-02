import { describe, expect, it } from 'vitest';
import { api } from './services';

/** Canonical `api.*` surface — domain modules only (no `legacyApi` spread). */
describe('api canonical surface', () => {
  it('exposes place and explore entrypoints', () => {
    expect(typeof api.getPublicPlaces).toBe('function');
    expect(typeof api.fetchPlaceRegistry).toBe('function');
    expect(typeof api.getPublicPlaceDetail).toBe('function');
    expect(typeof api.submitOrganisationPlace).toBe('function');
    expect(typeof api.submitPlace).toBe('function');
  });

  it('exposes organisation console and member host status', () => {
    expect(typeof api.getOrganisationProfile).toBe('function');
    expect(typeof api.getOrganisationJoinRequests).toBe('function');
    expect(typeof api.getMemberHostStatus).toBe('function');
    expect(typeof api.listOrganisationActivities).toBe('function');
    expect(typeof api.publishOrganisationActivity).toBe('function');
  });

  it('exposes person profile and admin members', () => {
    expect(typeof api.getPersonPublicProfile).toBe('function');
    expect(typeof api.getAdminMembers).toBe('function');
    expect(typeof api.getAdminOrganisationApplications).toBe('function');
  });

  it('does not expose removed legacy facade names', () => {
    const legacy = api as Record<string, unknown>;
    expect(legacy.getPublicLocations).toBeUndefined();
    expect(legacy.getHostRequests).toBeUndefined();
    expect(legacy.getMyHostStatus).toBeUndefined();
    expect(legacy.getTenantProfile).toBeUndefined();
    expect(legacy.getMerchantProducts).toBeUndefined();
  });
});
