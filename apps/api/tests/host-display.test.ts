import { describe, expect, it } from 'vitest';
import {
  hostPersonFirstName,
  isRolePlaceholderDisplayName,
  resolveActivityHostDisplayName,
  resolveHostPersonDisplayName,
} from '@uaetrail/shared-types';

describe('resolveHostPersonDisplayName', () => {
  it('prefers guide, then creator, then tenant owner', () => {
    expect(
      resolveHostPersonDisplayName({
        guideName: 'Fatima Al Mazrouei',
        createdByName: 'Khalid Rahman',
        tenantOwnerName: 'Khalid Rahman',
        tenantName: 'UAE Adventure Co',
      })
    ).toBe('Fatima Al Mazrouei');
  });

  it('skips role placeholders and org names', () => {
    expect(
      resolveHostPersonDisplayName({
        guideName: 'Agency Guide',
        createdByName: 'Individual Host',
        tenantOwnerName: 'Omar Al Hosani',
        tenantName: 'Desert Explorer',
      })
    ).toBe('Omar Al Hosani');
  });

  it('rejects tenant org label even when it appears as hostName', () => {
    expect(
      resolveHostPersonDisplayName({
        guideName: 'Desert Explorer',
        tenantName: 'Desert Explorer',
      })
    ).toBeNull();
  });

  it('keeps member name when buddy tenant matches creator display name', () => {
    expect(
      resolveHostPersonDisplayName({
        guideName: 'Fatima Al Mazrouei',
        createdByName: 'Fatima Al Mazrouei',
        tenantName: 'Fatima Al Mazrouei',
      })
    ).toBe('Fatima Al Mazrouei');
  });

  it('returns first name for UI labels', () => {
    expect(
      hostPersonFirstName({
        guideName: 'Omar Al Hosani',
        tenantName: 'Desert Explorer',
      })
    ).toBe('Omar');
  });
});

describe('resolveActivityHostDisplayName', () => {
  it('trusts API hostName and skips placeholders', () => {
    expect(resolveActivityHostDisplayName({ hostName: 'Omar Al Hosani' })).toBe('Omar Al Hosani');
    expect(resolveActivityHostDisplayName({ hostName: 'Individual Host' })).toBe('Host');
  });

  it('reads legacy organizerName from stale client payloads only', () => {
    expect(resolveActivityHostDisplayName({ organizerName: 'Fatima Al Mazrouei' })).toBe('Fatima Al Mazrouei');
  });
});

describe('isRolePlaceholderDisplayName', () => {
  it('flags demo role labels', () => {
    expect(isRolePlaceholderDisplayName('Individual Host')).toBe(true);
    expect(isRolePlaceholderDisplayName('Host')).toBe(true);
    expect(isRolePlaceholderDisplayName('Omar Al Hosani')).toBe(false);
  });
});
