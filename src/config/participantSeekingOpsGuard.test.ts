import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

/** A-SEEK — Phase A: retired seeking storage is one API ops module, not a product store. */
describe('participantSeekingOpsGuard (A-SEEK)', () => {
  it('A-SEEK-01: participant-intents-store deleted', () => {
    expect(existsSync(join(root, 'apps/api/src/lib/participant-intents-store.ts'))).toBe(false);
  });

  it('A-SEEK-02: seeking-storage-ops deleted; purge module is sole ops surface', () => {
    expect(existsSync(join(root, 'apps/api/src/lib/seeking-storage-ops.ts'))).toBe(false);
    const purge = readFileSync(join(root, 'apps/api/src/lib/retired-seeking-storage-purge.ts'), 'utf8');
    expect(purge).toMatch(/backfillSeekingActivitiesForActiveIntents/);
    expect(purge).toMatch(/loadSeekingStorageStatus/);
    expect(purge).toMatch(/purgeRetiredSeekingStorage/);
    expect(purge).not.toMatch(/export const createParticipantIntent/);
  });

  it('A-SEEK-03: BWL_COLLECTIONS excludes retired seeking; COLLECTIONS barrel is clean', () => {
    const lexicon = readFileSync(join(root, 'packages/shared-types/src/wire-lexicon.ts'), 'utf8');
    expect(lexicon).not.toMatch(/PARTICIPANT_INTENTS:/);
    expect(
      readFileSync(join(root, 'packages/shared-types/src/retired-seeking-wire.ts'), 'utf8')
    ).toMatch(/participant_intents/);
    const collections = readFileSync(join(root, 'apps/api/src/lib/collections.ts'), 'utf8');
    expect(collections).not.toMatch(/PARTICIPANT_INTENT/);
    const purge = readFileSync(join(root, 'apps/api/src/lib/retired-seeking-storage-purge.ts'), 'utf8');
    expect(purge).toMatch(/BWL_RETIRED_SEEKING_COLLECTIONS/);
  });
});