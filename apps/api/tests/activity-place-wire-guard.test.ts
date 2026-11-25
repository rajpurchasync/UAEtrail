import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(process.cwd(), '..', '..');
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

describe('activity place wire guard', () => {
  it('emits placeId alias on ActivityDTO and accepts placeId on host create', () => {
    expect(read('packages/shared-types/src/activity-place-wire.ts')).toMatch(/resolveActivityPlaceLinkId/);
    expect(read('packages/shared-types/src/index.ts')).toMatch(/placeId: string/);
    expect(read('apps/api/src/lib/mappers.ts')).toMatch(/withActivityPlaceIdAlias/);
    expect(read('apps/api/src/lib/mappers.ts')).not.toMatch(/event\.destinationId/);
    expect(read('apps/api/src/lib/publishing-tenant-activity-schemas.ts')).toMatch(/placeId: z\.string/);
    expect(read('src/place/geographyVocabulary.ts')).toMatch(/ActivityPlaceLinkField/);
  });
});