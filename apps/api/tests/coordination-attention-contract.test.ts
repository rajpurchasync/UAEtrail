import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { MEMBER_COORDINATION_ATTENTION_KINDS } from '@uaetrail/shared-types';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('GET /me/coordination-attention contract', () => {
  it('registrar exposes /me/coordination-attention', () => {
    const routes = read('src/routes/user/registerMeCoordinationAttentionRoutes.ts');
    expect(routes).toContain("'/me/coordination-attention'");
    expect(routes).toContain('loadMemberCoordinationAttention');
  });

  it('service returns kinds only — no UI label or consumer path strings', () => {
    const service = read('src/services/member-coordination-attention.ts');
    expect(service).not.toMatch(/\blabel\s*:/);
    expect(service).not.toContain('planHostedSchedulePath');
    expect(service).not.toContain('MY_REQUESTS_PATH');
    expect(service).not.toContain('/host/requests');
    expect(service).toContain('countUserUpcomingPendingJoinRequests');
    expect(service).toContain('countPendingIncomingBuddyRequests');
    expect(service).toContain('countPendingActivityJoinInvitesForUser');
    expect(service).not.toContain('listUserActivityRequestsBasic');
    expect(service).not.toContain('listBuddyRequestsForUser');
    for (const kind of MEMBER_COORDINATION_ATTENTION_KINDS) {
      expect(service).toContain(`'${kind}'`);
    }
  });
});
