import { describe, expect, it } from 'vitest';
import type { ActivityViewerAccessDTO, ExploreMapItemDTO } from '@uaetrail/shared-types';
import { applyExploreMapOverlay } from './applyExploreMapOverlay';

const guestAccess = {
  level: 'public',
  exposure: 'redacted',
  gateReason: 'sign_in',
  canViewFullActivity: false,
  canOpenDetailPage: true,
  joinMode: 'open',
  canAccessCrewSurfaces: false,
} as ActivityViewerAccessDTO;

const hostAccess = {
  ...guestAccess,
  level: 'host',
  exposure: 'full',
  gateReason: null,
  canViewFullActivity: true,
  canAccessCrewSurfaces: true,
} as ActivityViewerAccessDTO;

const item = {
  id: 'activity:act-1',
  kind: 'hiking',
  source: 'activity',
  title: 'Hike',
  latitude: 25,
  longitude: 55,
  path: '/activity/act-1',
  viewerAccess: guestAccess,
} as ExploreMapItemDTO;

describe('applyExploreMapOverlay', () => {
  it('replaces viewerAccess for matching item ids', () => {
    const next = applyExploreMapOverlay([item], {
      items: [{ id: 'activity:act-1', viewerAccess: hostAccess }],
    });
    expect(next[0]?.viewerAccess?.level).toBe('host');
    expect(next[0]?.title).toBe('Hike');
  });

  it('returns the public catalog when overlay is empty', () => {
    expect(applyExploreMapOverlay([item], { items: [] })[0]?.viewerAccess?.level).toBe('public');
    expect(applyExploreMapOverlay([item], null)[0]?.viewerAccess?.level).toBe('public');
  });
});
