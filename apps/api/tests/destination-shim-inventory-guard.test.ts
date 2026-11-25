import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(process.cwd(), '..', '..');
const exists = (rel: string) => existsSync(join(ROOT, rel));
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

/** MIG-DESTINATION-GEO Phase F — retired resolution module deleted. */
describe('destination shim inventory guard (Phase F)', () => {
  it('area-resolution.ts removed; destination-resolution.ts is canonical', () => {
    expect(exists('apps/api/src/lib/area-resolution.ts')).toBe(false);
    expect(exists('apps/api/tests/area-resolution.test.ts')).toBe(false);
    expect(read('apps/api/src/lib/destination-resolution.ts')).toMatch(
      /resolveDestinationIdForActivityPublish/
    );
    expect(read('apps/api/tests/destination-resolution.test.ts')).toMatch(
      /resolveDestinationIdFromPoint/
    );
  });

  it('API src does not import area-resolution or areas-store', () => {
    expect(read('apps/api/src/lib/activities-store.ts')).not.toMatch(/area-resolution/);
    expect(read('apps/api/src/lib/discovery-catalog-builder.ts')).not.toMatch(/area-resolution/);
    expect(exists('apps/api/src/lib/areas-store.ts')).toBe(false);
    expect(exists('apps/api/src/services/place-submit-area.ts')).toBe(false);
    expect(exists('apps/api/src/services/admin-area-commands.ts')).toBe(false);
  });
});