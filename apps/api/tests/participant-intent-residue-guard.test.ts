import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

/** MIG-DISCO-REG residue — HTTP Find posts retired; ops backfill only. */
describe('participant intent residue (MIG-DISCO-REG)', () => {
  it('retired /me participant-intent HTTP service modules are gone', () => {
    expect(existsSync(join(process.cwd(), 'src/services/participant-intent-me-commands.ts'))).toBe(
      false
    );
    expect(existsSync(join(process.cwd(), 'src/services/participant-intent-me-read.ts'))).toBe(false);
  });

  it('legacy join + readthrough + graduate modules removed', () => {
    expect(existsSync(join(process.cwd(), 'src/lib/participant-intent-requests-store.ts'))).toBe(false);
    expect(existsSync(join(process.cwd(), 'src/services/participant-intent-activity-readthrough.ts'))).toBe(
      false
    );
    expect(existsSync(join(process.cwd(), 'src/services/participant-intent-graduate-ops.ts'))).toBe(false);
    expect(existsSync(join(process.cwd(), 'src/services/participant-intent-carryover.ts'))).toBe(false);
    expect(existsSync(join(process.cwd(), 'src/domain/participant-intent.ts'))).toBe(false);
  });

  it('participant_intents Mongo collection is backfill-only in participant-intents-store', () => {
    const store = read('src/lib/participant-intents-store.ts');
    expect(store).toMatch(/export const backfillSeekingActivitiesForActiveIntents/);
    expect(store).not.toMatch(/export const createParticipantIntent/);
    expect(store).not.toMatch(/export const updateParticipantIntent/);
    expect(store).not.toMatch(/participant-intent-activity-readthrough/);
  });
});