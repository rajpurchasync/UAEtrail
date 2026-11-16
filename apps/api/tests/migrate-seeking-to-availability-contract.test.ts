import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('migrate-seeking-to-availability (MIG-DISCO-REG ops)', () => {
  it('migrates published seeking activities into member_availability fixed slots', () => {
    const script = read('scripts/migrate-seeking-to-availability.ts');
    expect(script).toMatch(/activityMode: 'seeking'/);
    expect(script).toMatch(/ActivityStatus\.PUBLISHED/);
    expect(script).toMatch(/upsertMemberAvailability/);
    expect(script).toMatch(/scheduleExploreMapCacheInvalidation/);
    expect(script).toMatch(/scheduleKind: 'fixed'/);
    expect(script).toMatch(/--cancel-seeking/);
    expect(script).toMatch(/--dry-run/);
  });
});