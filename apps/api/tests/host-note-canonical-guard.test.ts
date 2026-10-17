import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  BWL_JOIN_REQUEST_FIELDS,
  resolveHostNote,
} from '@uaetrail/shared-types';

const ROOT = join(process.cwd(), '..', '..');
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

/** MIG-COH-06 — join-request host decision field is JSON `hostNote`. */
describe('host-note canonical guard (COH-06)', () => {
  it('prefers hostNote over organizerNote and trims empty', () => {
    expect(BWL_JOIN_REQUEST_FIELDS.HOST_NOTE).toBe('hostNote');
    expect(BWL_JOIN_REQUEST_FIELDS.ORGANIZER_NOTE_LEGACY).toBe('organizerNote');
    expect(resolveHostNote({ hostNote: 'a', organizerNote: 'b' })).toBe('a');
    expect(resolveHostNote({ organizerNote: ' legacy ' })).toBe('legacy');
    expect(resolveHostNote({ hostNote: '   ' })).toBeNull();
    expect(resolveHostNote(null)).toBeNull();
  });

  it('Mongo mapper dual-reads via resolveHostNote; new writes set hostNote', () => {
    const store = read('apps/api/src/lib/activity-engagement-store.ts');
    expect(store).toMatch(/hostNote: resolveHostNote\(doc\)/);
    expect(store).toMatch(/hostNote: opts\.hostNote/);
    expect(store).toMatch(/hostNote: input\.hostNote/);
    expect(store).not.toMatch(/organizerNote: opts/);
    expect(store).not.toMatch(/organizerNote: input/);
  });

  it('HTTP decide/revoke schemas accept organizerNote alias', () => {
    const schemas = read('apps/api/src/routes/operator/operator-route-schemas.ts');
    expect(schemas).toMatch(/hostNote:/);
    expect(schemas).toMatch(/organizerNote:/);
    expect(schemas).toMatch(/resolveHostNote/);
    const requests = read('apps/api/src/routes/operator/registerOperatorActivityRequestRoutes.ts');
    expect(requests).toMatch(/hostNote: resolveHostNote\(body\)/);
  });

  it('FE writes hostNote JSON; UPL is comment for the host', () => {
    const org = read('src/api/domains/organisation.ts');
    const activities = read('src/api/domains/activities.ts');
    expect(org).toMatch(/JSON\.stringify\(\{ status, hostNote \}\)/);
    expect(activities).toMatch(/JSON\.stringify\(\{ hostNote \}\)/);
    expect(org).not.toMatch(/organizerNote/);
    expect(activities).not.toMatch(/organizerNote/);
    const copy = read('src/content/joinWithdrawCopy.ts');
    expect(copy).toMatch(/UPL_COMMENT_FOR_HOST/);
    const glossary = read('src/content/upl-glossary.ts');
    expect(glossary).toMatch(/Comment for the host/);
  });
});
