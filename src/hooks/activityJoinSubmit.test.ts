import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('activityJoinSubmit (R8.1)', () => {
  it('join modal delegates mutations to hooks layer', () => {
    const modal = read('src/components/ui/JoinRequestModal.tsx');
    expect(modal).toMatch(/submitActivityJoin/);
    expect(modal).toMatch(/afterActivityJoinClientRefresh/);
    expect(modal).not.toMatch(/\bapi\./);
    expect(read('src/hooks/activityJoinSubmit.ts')).toMatch(/rsvpActivity/);
  });
});
