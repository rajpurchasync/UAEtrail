import { describe, expect, it } from 'vitest';
import type { ActivityDetailDTO } from '@uaetrail/shared-types';
import {
  resolveActivityDetailHostProfileSurface,
  resolveActivityDetailPlaceAccess,
} from './activityDetailViewModelPlaceAccess';

const baseActivity = (overrides: Partial<ActivityDetailDTO> = {}): ActivityDetailDTO =>
  ({
    id: 'a1',
    activityType: 'hiking',
    title: 'Hike',
    locationName: 'Trailhead',
    date: '2026-01-01',
    status: 'published',
    meetingLat: 25.1,
    meetingLng: 55.2,
    ...overrides,
  }) as ActivityDetailDTO;

describe('activityDetailViewModelPlaceAccess', () => {
  it('prefers parking link for maps when present', () => {
    const access = resolveActivityDetailPlaceAccess(
      baseActivity({ location: { parkingLink: 'https://maps.example/park' } as ActivityDetailDTO['location'] }),
      false
    );
    expect(access.openInGoogleMapsUrl).toBe('https://maps.example/park');
    expect(access.hasAccessCoordinates).toBe(true);
  });

  it('hides registry place path in preview mode', () => {
    const access = resolveActivityDetailPlaceAccess(baseActivity(), true);
    expect(access.registryPlacePath).toBeNull();
  });

  it('blocks host profile href when entitlements gate profile', () => {
    const surface = resolveActivityDetailHostProfileSurface(baseActivity({ tenantSlug: 'acme' }), false, {
      canViewHostProfileBeforeJoin: false,
    } as import('@uaetrail/shared-types').ActivityViewerEntitlementsDTO);
    expect(surface.canOpenHostProfile).toBe(false);
    expect(surface.hostPath).toBeNull();
  });
});