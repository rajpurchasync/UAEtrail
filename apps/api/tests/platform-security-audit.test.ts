import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('product capability gate (C1)', () => {
  it('documents MemberStatusDTO helpers for publish gates', () => {
    const gate = readFileSync(
      join(process.cwd(), 'src/lib/product-capability-gate.ts'),
      'utf8'
    );
    expect(gate).toMatch(/canPublishFromMemberStatus/);
    expect(gate).toMatch(/MemberStatusDTO/);
  });
});

describe('platform security audit (C1 / S10g)', () => {
  it('records impersonation and tenant-scope actions', () => {
    const audit = readFileSync(
      join(process.cwd(), 'src/lib/platform-security-audit.ts'),
      'utf8'
    );
    expect(audit).toMatch(/member\.impersonation_start/);
    expect(audit).toMatch(/platform_admin\.tenant_scope/);
    const tenant = readFileSync(join(process.cwd(), 'src/middleware/tenant.ts'), 'utf8');
    expect(tenant).toMatch(/auditPlatformAdminTenantScope/);
    const profile = readFileSync(
      join(process.cwd(), 'src/services/me-profile-commands.ts'),
      'utf8'
    );
    expect(profile).toMatch(/auditMemberRoleSwitch/);
  });
});
