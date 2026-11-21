import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('availability notification lineage (MIG-DISCO-REG)', () => {
  it('retired seeking-area match module is gone', () => {
    expect(
      existsSync(join(process.cwd(), 'src/services/seeking-area-match-notifications.ts'))
    ).toBe(false);
  });

  it('product hot paths do not import seeking-area notifications', () => {
    const store = read('src/lib/activities-store.ts');
    const commands = read('src/services/me-availability-commands.ts');
    expect(store).not.toMatch(/seeking-area-match-notifications/);
    expect(commands).not.toMatch(/seeking-area-match-notifications/);
    expect(commands).toMatch(/notifyWishlistForMemberAvailability/);
  });

  it('legacy participant intent create does not wire seeking-area fan-out', () => {
    const intents = read('src/lib/participant-intents-store.ts');
    expect(intents).not.toMatch(/seeking-area-match-notifications/);
    expect(intents).not.toMatch(/notifyWishlistForNewSeeking/);
    expect(intents).not.toMatch(/notifyMemberPublishSubscribers/);
    expect(intents).not.toMatch(/publishType: 'seeking'/);
    expect(intents).toMatch(/activity_mode_seeking_retired/);
    expect(intents).toMatch(/mergeMemberAvailabilityFixedSlotsMigration/);
  });
});