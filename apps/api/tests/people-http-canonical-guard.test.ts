import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  BWL_PEOPLE_SEGMENT,
  isBuddyPeopleSegment,
  normalizePeopleSegment,
} from '@uaetrail/shared-types';

const ROOT = join(process.cwd(), '..', '..');
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

/** MIG-COH-05 — no orphan `/people` registrar; network segment BWL is `buddies`. */
describe('people HTTP canonical guard (COH-05)', () => {
  it('does not ship registerSocialPeopleRoutes or leftover social router', () => {
    expect(
      existsSync(join(ROOT, 'apps/api/src/routes/social/registerSocialPeopleRoutes.ts'))
    ).toBe(false);
    expect(existsSync(join(ROOT, 'apps/api/src/routes/social.ts'))).toBe(false);
    expect(existsSync(join(ROOT, 'apps/api/src/routes/social/index.ts'))).toBe(false);
  });

  it('member-discovery network accepts buddies (friends is alias)', () => {
    const registrar = read('apps/api/src/routes/user/registerMemberDiscoveryRoutes.ts');
    expect(registrar).toMatch(/z\.enum\(\['all', 'buddies', 'followed', 'friends'\]\)/);
    expect(registrar).toMatch(/normalizePeopleSegment/);
    expect(normalizePeopleSegment('friends')).toBe(BWL_PEOPLE_SEGMENT.BUDDIES_TARGET);
    expect(normalizePeopleSegment('buddies')).toBe(BWL_PEOPLE_SEGMENT.BUDDIES_TARGET);
    expect(isBuddyPeopleSegment('friends')).toBe(true);
    expect(isBuddyPeopleSegment('followed')).toBe(false);
  });

  it('FE network client stays on /me/member-discovery (not /people)', () => {
    const account = read('src/api/domains/account.ts');
    expect(account).toMatch(/\/me\/member-discovery\/network/);
    expect(account).not.toMatch(/['"`]\/people['"`]/);
    expect(account).not.toMatch(/['"`]\/people\?/);
  });
});
