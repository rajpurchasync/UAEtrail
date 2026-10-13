import { describe, expect, it } from 'vitest';
import { computeActivityDetailExposure } from './activity-viewer-access.js';

describe('computeActivityDetailExposure', () => {
  it('redacts pending join requests but keeps detail page open', () => {
    const access = computeActivityDetailExposure({
      joinMode: 'private',
      level: 'join_request',
      viewerUserId: 'u1',
    });
    expect(access.exposure).toBe('redacted');
    expect(access.canViewFullActivity).toBe(false);
    expect(access.canOpenDetailPage).toBe(true);
    expect(access.canAccessCrewSurfaces).toBe(false);
    expect(access.gateReason).toBeNull();
  });

  it('grants crew surfaces to confirmed participants', () => {
    const access = computeActivityDetailExposure({
      joinMode: 'open',
      level: 'participant',
      viewerUserId: 'u1',
    });
    expect(access.exposure).toBe('full');
    expect(access.canAccessCrewSurfaces).toBe(true);
  });
});
