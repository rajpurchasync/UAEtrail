import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('activityJoinClientApi (R8.1)', () => {
  it('join modal delegates mutations to hooks layer', () => {
    const modal = read('src/components/ui/JoinRequestModal.tsx');
    expect(modal).toMatch(/activityJoinClientApi/);
    expect(modal).toMatch(/submitActivityJoin/);
    expect(modal).toMatch(/afterActivityJoinClientRefresh/);
    expect(modal).not.toMatch(/\bapi\./);
    expect(read('src/hooks/activityJoinClientApi.ts')).toMatch(/rsvpActivity/);
  });

  it('withdraw flow refreshes client caches via hooks layer (R8.3)', () => {
    const flow = read('src/hooks/useActivityJoinFlow.ts');
    expect(flow).toMatch(/afterActivityWithdrawClientRefresh/);
    expect(flow).not.toMatch(/\bapi\./);
  });

  it('host join decision surfaces refresh client caches (R8.3)', () => {
    for (const file of [
      'src/pages/operator/JoinRequests.tsx',
      'src/components/activity/ActivityManageSheet.tsx',
      'src/components/activity/detail/ActivityDetailHostBuddiesHub.tsx',
    ]) {
      const source = read(file);
      expect(source).toMatch(/afterHostJoinDecisionClientRefresh/);
      expect(source).not.toMatch(/\bapi\./);
    }
  });
});
