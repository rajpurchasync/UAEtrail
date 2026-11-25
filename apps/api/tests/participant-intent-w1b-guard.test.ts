import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

/** W1b — legacy `participant_intents` is ops-only; no hot-path indexes or HTTP writes. */
describe('participant intent W1b guard', () => {
  it('mongo-indexes does not ensure participant_intents indexes', () => {
    const indexes = read('src/lib/mongo-indexes.ts');
    expect(indexes).not.toMatch(/PARTICIPANT_INTENTS\)\.createIndexes/);
  });

  it('mongo migrations drop empty retired seeking collections', () => {
    const migrations = read('src/lib/mongo-migrations.ts');
    expect(migrations).toMatch(/dropEmptyRetiredSeekingCollections/);
    expect(migrations).toMatch(/PARTICIPANT_INTENT_REQUESTS/);
  });

  it('mongo migrations reference participant_intents collection via COLLECTIONS', () => {
    const migrations = read('src/lib/mongo-migrations.ts');
    expect(migrations).not.toMatch(/db\.collection\('participant_intents'\)/);
    expect(migrations).toMatch(/COLLECTIONS\.PARTICIPANT_INTENTS/);
  });

  it('collections.ts wires retired seeking stores from BWL_COLLECTIONS', () => {
    const collections = read('src/lib/collections.ts');
    expect(collections).toMatch(/BWL_COLLECTIONS\.PARTICIPANT_INTENTS/);
    expect(collections).toMatch(/BWL_COLLECTIONS\.PARTICIPANT_INTENT_REQUESTS/);
  });
});