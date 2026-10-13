import { describe, expect, it } from 'vitest';
import type { OwnedHostProfileDTO } from '@uaetrail/shared-types';
import { listOrganizePublishProfiles, organizePublishAsLabel } from './organizePublishTenants';

describe('organizePublishTenants', () => {
  it('includes verified business shops in organize publish options', () => {
    const profiles: OwnedHostProfileDTO[] = [
      { type: 'guide', tenantId: 'g1', name: 'Raj', slug: 'raj', publishingProfileKind: 'community' },
      { type: 'shop', tenantId: 's1', name: 'Trail Shop', slug: 'trail-shop', publishingProfileKind: 'shop' },
      { type: 'agency', tenantId: 'a1', name: 'Desert Tours', slug: 'desert', publishingProfileKind: 'agency' },
    ];
    expect(listOrganizePublishProfiles(profiles).map((p) => p.tenantId)).toEqual(['g1', 's1', 'a1']);
  });

  it('labels community publish as member name', () => {
    const profile: OwnedHostProfileDTO = {
      type: 'guide',
      tenantId: 'g1',
      name: 'Raj Host Tenant',
      slug: 'raj',
      publishingProfileKind: 'community',
    };
    expect(organizePublishAsLabel(profile, 'Raj')).toBe('As Raj');
    expect(organizePublishAsLabel(profile, null)).toBe('As yourself');
  });
});
