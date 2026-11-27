import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('social groups store split (R5 god-file)', () => {
  it('routes crew wall reads/writes through social-groups-wall-store', () => {
    const wall = read('src/lib/social-groups-wall-store.ts');
    expect(wall).toMatch(/listGroupWallMessages/);
    expect(wall).toMatch(/beforeMessageId/);
    const store = read('src/lib/social-groups-store.ts');
    expect(store).toMatch(/social-groups-wall-store/);
    expect(store).not.toMatch(/const presentGroupWallMessages/);
    expect(store.split(/\r?\n/).length).toBeLessThan(1100);
  });

  it('keeps shared Mongo mappers in social-groups-store-internals', () => {
    const internals = read('src/lib/social-groups-store-internals.ts');
    expect(internals).toMatch(/groupsCollection/);
    expect(internals).toMatch(/mapGroup/);
    expect(internals).toMatch(/wallCollection/);
  });
});