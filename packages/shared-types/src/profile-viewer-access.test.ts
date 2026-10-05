import { describe, expect, it } from 'vitest';
import { computeProfileDetailExposure } from './profile-viewer-access.js';

describe('computeProfileDetailExposure', () => {
  it('requires sign-in for guests', () => {
    const result = computeProfileDetailExposure({
      profileVisibility: 'public',
      level: 'public',
      viewerUserId: null,
    });
    expect(result.exposure).toBe('none');
    expect(result.gateReason).toBe('sign_in');
    expect(result.canOpenMemberProfile).toBe(false);
  });

  it('gives public card to signed-in strangers when visibility is public', () => {
    const result = computeProfileDetailExposure({
      profileVisibility: 'public',
      level: 'public',
      viewerUserId: 'viewer-1',
    });
    expect(result.exposure).toBe('public');
    expect(result.canViewFullProfile).toBe(false);
    expect(result.canOpenMemberProfile).toBe(true);
  });

  it('does not elevate co-participants to full when visibility is public', () => {
    const result = computeProfileDetailExposure({
      profileVisibility: 'public',
      level: 'activity_participant',
      viewerUserId: 'viewer-1',
    });
    expect(result.exposure).toBe('public');
    expect(result.canViewFullProfile).toBe(false);
  });

  it('gives full detail to co-participants on private profiles', () => {
    const result = computeProfileDetailExposure({
      profileVisibility: 'private',
      level: 'activity_participant',
      viewerUserId: 'viewer-1',
    });
    expect(result.exposure).toBe('full');
    expect(result.canViewFullProfile).toBe(true);
  });

  it('gives full detail to self', () => {
    const result = computeProfileDetailExposure({
      profileVisibility: 'private',
      level: 'self',
      viewerUserId: 'u1',
    });
    expect(result.exposure).toBe('full');
  });
});
