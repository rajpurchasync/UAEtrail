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

  it('exposes host activity console and member host status', () => {
    expect(typeof api.getOrganisationProfile).toBe('function');
    expect(typeof api.getHostActivityJoinRequests).toBe('function');
    expect(typeof api.decideHostActivityJoinRequest).toBe('function');
    expect(typeof api.getMemberHostStatus).toBe('function');
    expect(typeof api.listHostActivities).toBe('function');
    expect(typeof api.publishHostActivity).toBe('function');
    expect(typeof api.cancelHostActivity).toBe('function');
    expect(typeof api.createHostActivity).toBe('function');
  });

  it('exposes person profile and admin members', () => {
    expect(typeof api.getPersonPublicProfile).toBe('function');
    expect(typeof api.getAdminMembers).toBe('function');
    expect(typeof api.getAdminOrganisationApplications).toBe('function');
    expect(typeof api.grantPlatformAdmin).toBe('function');
    expect(typeof api.revokePlatformAdmin).toBe('function');
  });

  it('does not expose removed legacy facade names', () => {
    const legacy = api as Record<string, unknown>;
    expect(legacy.getPublicLocations).toBeUndefined();
    expect(legacy.getHostRequests).toBeUndefined();
    expect(legacy.listOrganisationActivities).toBeUndefined();
    expect(legacy.createOrganisationActivity).toBeUndefined();
    expect(legacy.getOrganisationJoinRequests).toBeUndefined();
    expect(legacy.getMyHostStatus).toBeUndefined();
    expect(legacy.getTenantProfile).toBeUndefined();
    expect(legacy.getMerchantProducts).toBeUndefined();
  });
});
