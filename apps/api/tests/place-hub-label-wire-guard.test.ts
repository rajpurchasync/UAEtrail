import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(process.cwd(), '..', '..');
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

describe('place hub label wire guard', () => {
  it('LocationDTO emits placeHubLabel from domain location', () => {
    const mappers = read('apps/api/src/lib/mappers.ts');
    expect(mappers).toMatch(/placeHubLabel: location\.placeHubLabel/);
    expect(mappers).not.toMatch(/\bareaLabel\b/);
  });

  it('shared-types exports place hub label helpers', () => {
    expect(read('packages/shared-types/src/place-hub-label.ts')).toMatch(/readPlaceHubLabel/);
    expect(read('packages/shared-types/src/wire-lexicon.ts')).toMatch(/PLACE_HUB_LABEL/);
  });
});