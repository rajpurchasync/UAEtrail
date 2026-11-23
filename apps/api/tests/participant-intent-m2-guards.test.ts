import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('participant intent M2 guards', () => {
  it('explore map does not merge legacy participant_intents pins', () => {
    const exploreMap = read('src/lib/explore-map.ts');
    const exploreMapBase = read('src/lib/discovery-catalog-builder.ts');
    expect(exploreMap).not.toMatch(/listActiveParticipantIntentsForMap\(/);
    expect(exploreMapBase).not.toMatch(/listActiveParticipantIntentsForMap\(/);
  });

  it('legacy demand map-pin flag module is gone (seeking uses activity: rows)', () => {
    expect(existsSync(join(process.cwd(), 'src/lib/explore-map-demand-pins.ts'))).toBe(false);
    const exploreMapBase = read('src/lib/discovery-catalog-builder.ts');
    expect(exploreMapBase).not.toMatch(/EXPLORE_MAP_DEMAND_PINS/);
    expect(exploreMapBase).not.toMatch(/source:\s*'demand'/);
  });

  it('participant-intents-store is ops backfill only', () => {
    const store = read('src/lib/participant-intents-store.ts');
    expect(store).toMatch(/backfillSeekingActivitiesForActiveIntents/);
    expect(store).toMatch(/mergeMemberAvailabilityFixedSlotsMigration/);
    expect(store).not.toMatch(/createParticipantIntent/);
    expect(store).not.toMatch(/findSeekingActivityByParticipantIntentId/);
  });

  it('user router does not mount /me/seeking-posts (MIG-DISCO-REG)', () => {
    const composer = read('src/routes/user/composeUserMemberRoutes.ts');
    expect(composer).not.toMatch(/registerMeSeekingPostRoutes|registerMeParticipantIntentRoutes/);
    expect(composer).toMatch(/registerMeAvailabilityRoutes/);
  });

  it('participant-intent HTTP registrar module removed', () => {
    expect(existsSync(join(process.cwd(), 'src/routes/user/registerMeParticipantIntentRoutes.ts'))).toBe(
      false
    );
  });

  it('retired /me participant-intent command/read services removed (MIG-DISCO-REG residue)', () => {
    expect(existsSync(join(process.cwd(), 'src/services/participant-intent-me-commands.ts'))).toBe(false);
    expect(existsSync(join(process.cwd(), 'src/services/participant-intent-me-read.ts'))).toBe(false);
  });
});