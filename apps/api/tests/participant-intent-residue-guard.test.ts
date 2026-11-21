import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

/**
 * MIG-DISCO-REG residue — HTTP Find posts retired; ops scripts keep legacy stores.
 * Full removal waits on SEEKING_STORAGE_RUNBOOK strict gate (30d).
 */
describe('participant intent residue (MIG-DISCO-REG)', () => {
  it('retired /me participant-intent HTTP service modules are gone', () => {
    expect(existsSync(join(process.cwd(), 'src/services/participant-intent-me-commands.ts'))).toBe(
      false
    );
    expect(existsSync(join(process.cwd(), 'src/services/participant-intent-me-read.ts'))).toBe(false);
  });

  it('join requests resolve published activity ids via activity read-through only', () => {
    const joinStore = read('src/lib/participant-intent-requests-store.ts');
    expect(joinStore).toMatch(/participant-intent-activity-readthrough/);
    expect(joinStore).not.toMatch(/participant-intents-store/);
    expect(joinStore).toMatch(/resolveIntentPublishedActivityId/);
  });

  it('retired seeking wishlist fan-out module removed', () => {
    expect(existsSync(join(process.cwd(), 'src/services/wishlist-archived-seeking-ops.ts'))).toBe(
      false
    );
  });

  it('graduate ops module is isolated from product store', () => {
    expect(existsSync(join(process.cwd(), 'src/services/participant-intent-graduate-ops.ts'))).toBe(
      true
    );
    const store = read('src/lib/participant-intents-store.ts');
    expect(store).toMatch(/participant-intent-graduate-ops/);
  });

  it('participant_intents Mongo collection is backfill-only in participant-intents-store', () => {
    const store = read('src/lib/participant-intents-store.ts');
    const backfillIdx = store.indexOf('export const backfillSeekingActivitiesForActiveIntents');
    expect(backfillIdx).toBeGreaterThan(-1);
    const beforeBackfill = store.slice(0, backfillIdx);
    expect(beforeBackfill).not.toMatch(/collection\(\)/);
    expect(store.slice(backfillIdx)).toMatch(/collection\(\)/);
  });
});