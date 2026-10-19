import { describe, expect, it } from 'vitest';
import { api } from './services';

/** Canonical `api.*` surface — domain modules only (no `legacyApi` spread). */
describe('api canonical surface', () => {
  it('exposes place and explore entrypoints', () => {
    expect(typeof api.getPublicPlaces).toBe('function');
    expect(typeof api.fetchPlaceCatalog).toBe('function');
    expect(typeof api.getPublicPlaceDetail).toBe('function');
    expect(typeof api.submitOrganisationPlace).toBe('function');
    expect(typeof api.submitPlace).toBe('function');
  });

  it('exposes tenant activity console and member status', () => {
    expect(typeof api.getOrganisationProfile).toBe('function');
    expect(typeof api.getPublishingActivityJoinRequests).toBe('function');
    expect(typeof api.decideActivityJoinRequest).toBe('function');
    expect(typeof api.getMemberStatus).toBe('function');
    expect(typeof api.listActivities).toBe('function');
    expect(typeof api.publishActivity).toBe('function');
    expect(typeof api.cancelActivity).toBe('function');
    expect(typeof api.createActivity).toBe('function');
    expect(typeof api.updateActivity).toBe('function');
    expect(typeof api.duplicateActivity).toBe('function');
  });

  it('exposes person profile and admin members', () => {
    expect(typeof api.getPersonPublicProfile).toBe('function');
    expect(typeof api.getAdminMembers).toBe('function');
    expect(typeof api.getAdminOrganisationApplications).toBe('function');
    expect(typeof api.grantPlatformAdmin).toBe('function');
    expect(typeof api.revokePlatformAdmin).toBe('function');
  });

  it('exposes seeking post BWL entrypoints', () => {
    expect(typeof api.listMySeekingPosts).toBe('function');
    expect(typeof api.createSeekingPost).toBe('function');
    expect((api as Record<string, unknown>).listMyParticipantIntents).toBeUndefined();
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
    expect(legacy.getMemberHostStatus).toBeUndefined();
    expect(legacy.getMemberOperatorStatus).toBeUndefined();
    expect(legacy.listHostActivities).toBeUndefined();
    expect(legacy.createHostActivity).toBeUndefined();
    expect(legacy.getHostActivityJoinRequests).toBeUndefined();
    expect(legacy.decideHostActivityJoinRequest).toBeUndefined();
  });
});

