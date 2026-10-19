import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  BWL_JOIN_REQUEST_FIELDS,
  resolveHostNote,
} from '@uaetrail/shared-types';

const ROOT = join(process.cwd(), '..', '..');
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

/** MIG-COH-06 — join-request host decision field is JSON `hostNote` only. */
describe('host-note canonical guard (COH-06)', () => {
  it('reads hostNote and trims empty', () => {
    expect(BWL_JOIN_REQUEST_FIELDS.HOST_NOTE).toBe('hostNote');
    expect(BWL_JOIN_REQUEST_FIELDS).not.toHaveProperty('ORGANIZER_NOTE_LEGACY');
    expect(resolveHostNote({ hostNote: 'a' })).toBe('a');
    expect(resolveHostNote({ hostNote: ' legacy ' })).toBe('legacy');
    expect(resolveHostNote({ hostNote: '   ' })).toBeNull();
    expect(resolveHostNote(null)).toBeNull();
  });

  it('Mongo mapper reads hostNote; new writes set hostNote', () => {
    const store = read('apps/api/src/lib/activity-engagement-store.ts');
    expect(store).toMatch(/hostNote: resolveHostNote\(doc\)/);
    expect(store).toMatch(/hostNote: opts\.hostNote/);
    expect(store).toMatch(/hostNote: input\.hostNote/);
    expect(store).not.toMatch(/organizerNote/);
  });

  it('HTTP decide/revoke schemas accept hostNote only', () => {
    const schemas = read('apps/api/src/routes/publishing/publishing-route-schemas.ts');
    expect(schemas).toMatch(/hostNote:/);
    expect(schemas).not.toMatch(/organizerNote/);
    expect(schemas).toMatch(/resolveHostNote/);
    const requests = read('apps/api/src/routes/publishing/registerPublishingActivityRequestRoutes.ts');
    expect(requests).toMatch(/hostNote: resolveHostNote\(body\)/);
    expect(requests).not.toMatch(/organizerNote/);
  });

  it('FE writes hostNote JSON; UPL is comment for the host', () => {
    const workspace = read('src/api/domains/publishingWorkspace.ts');
    expect(workspace).toMatch(/JSON\.stringify\(\{ status, hostNote \}\)/);
    expect(workspace).toMatch(/JSON\.stringify\(\{ hostNote \}\)/);
    expect(workspace).not.toMatch(/organizerNote/);
    const copy = read('src/content/joinWithdrawCopy.ts');
    expect(copy).toMatch(/UPL_COMMENT_FOR_HOST/);
    const glossary = read('src/content/upl-glossary.ts');
    expect(glossary).toMatch(/Comment for the host/);
  });
});
