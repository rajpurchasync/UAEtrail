import { describe, expect, it } from 'vitest';
import type { OwnedHostProfileDTO } from '@uaetrail/shared-types';
import {
  hostingHubPathForMode,
  isHostModeSession,
  resolveHostingHubPath,
  resolveHostingModeAvailability,
  resolveHostingSurfaceMode,
  switchToHostLabel,
} from './hostingHubRouting';

const community: OwnedHostProfileDTO = {
  type: 'guide',
  tenantId: 't-community',
  name: 'Me',
  slug: 'me',
  publishingProfileKind: 'community',
};

const agency: OwnedHostProfileDTO = {
  type: 'agency',
  tenantId: 't-agency',
  name: 'Desert Co',
  slug: 'desert-co',
  publishingProfileKind: 'agency',
};

describe('hosting hub routing', () => {
  it('detects community-only vs workspace-only vs both', () => {
    expect(resolveHostingModeAvailability([community])).toMatchObject({
      hasCommunity: true,
      hasWorkspace: false,
      both: false,
    });
    expect(resolveHostingModeAvailability([agency])).toMatchObject({
      hasCommunity: false,
      hasWorkspace: true,
      both: false,
      workspaceBrand: 'agency',
    });
    expect(resolveHostingModeAvailability([community, agency])).toMatchObject({
      both: true,
      communityTenantId: 't-community',
      workspaceTenantId: 't-agency',
    });
  });

  it('defaults dual hosts to workspace unless preferred community', () => {
    expect(resolveHostingSurfaceMode({ ownedProfiles: [community, agency] })).toBe('workspace');
    expect(
      resolveHostingSurfaceMode({
        ownedProfiles: [community, agency],
        preferredMode: 'community',
      })
    ).toBe('community');
  });

  it('resolves hub paths for each mode', () => {
    expect(hostingHubPathForMode('community')).toBe('/hosting');
    expect(hostingHubPathForMode('workspace')).toBe('/publishing/overview');
    expect(resolveHostingHubPath({ ownedProfiles: [agency] })).toBe('/publishing/overview');
    expect(resolveHostingHubPath({ ownedProfiles: [community] })).toBe('/hosting');
  });

  it('labels host restore as Switch to Host', () => {
    expect(switchToHostLabel('tenant_owner')).toBe('Switch to Host');
    expect(switchToHostLabel('platform_admin')).toBe('Switch to admin');
  });

  it('treats console roles as host mode and visitor participant as not', () => {
    expect(isHostModeSession('tenant_owner')).toBe(true);
    expect(isHostModeSession('tenant_guide')).toBe(true);
    expect(isHostModeSession('participant')).toBe(false);
  });
});
