import { describe, expect, it, vi, beforeEach } from 'vitest';
import { UserRole } from '../src/domain/enums.js';
import type { AuthUserRecord } from '../src/lib/auth-users.js';

vi.mock('../src/lib/auth-users.js', () => ({
  findAuthUserById: vi.fn(),
  findAuthUserByEmail: vi.fn(),
  updateAuthUserCore: vi.fn(),
}));

vi.mock('../src/lib/audit.js', () => ({
  createAuditLog: vi.fn(),
}));

import { findAuthUserByEmail, findAuthUserById, updateAuthUserCore } from '../src/lib/auth-users.js';
import { grantPlatformAdminRole, isPlatformMasterAdmin, revokePlatformAdminRole } from '../src/lib/platform-master-admin.js';

const masterUser = (): AuthUserRecord =>
  ({
    _id: 'master-1',
    email: 'master@example.com',
    role: UserRole.PLATFORM_ADMIN,
    profile: { platformMasterAdmin: true, displayName: null, phone: null, bio: null, avatarUrl: null },
  }) as AuthUserRecord;

const staffUser = (): AuthUserRecord =>
  ({
    _id: 'staff-1',
    email: 'staff@example.com',
    role: UserRole.PLATFORM_ADMIN,
    profile: { displayName: null, phone: null, bio: null, avatarUrl: null },
  }) as AuthUserRecord;

describe('platform master admin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.PLATFORM_MASTER_ADMIN_EMAILS;
  });

  it('detects master via profile flag', () => {
    expect(isPlatformMasterAdmin(masterUser())).toBe(true);
    expect(isPlatformMasterAdmin(staffUser())).toBe(false);
  });

  it('detects master via env allowlist', () => {
    process.env.PLATFORM_MASTER_ADMIN_EMAILS = 'staff@example.com';
    expect(isPlatformMasterAdmin(staffUser())).toBe(true);
  });

  it('grants platform admin when actor is master', async () => {
    vi.mocked(findAuthUserById).mockResolvedValue(masterUser());
    vi.mocked(findAuthUserByEmail).mockResolvedValue({
      ...staffUser(),
      role: UserRole.PARTICIPANT,
      email: 'new@example.com',
      _id: 'target-1',
    } as AuthUserRecord);

    const result = await grantPlatformAdminRole({
      actorUserId: 'master-1',
      targetEmail: 'new@example.com',
    });

    expect(result.userId).toBe('target-1');
    expect(updateAuthUserCore).toHaveBeenCalledWith({
      userId: 'target-1',
      role: UserRole.PLATFORM_ADMIN,
    });
  });

  it('rejects grant when actor is not master', async () => {
    vi.mocked(findAuthUserById).mockResolvedValue(staffUser());

    await expect(
      grantPlatformAdminRole({ actorUserId: 'staff-1', targetEmail: 'x@example.com' })
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('rejects revoking master admin', async () => {
    vi.mocked(findAuthUserById).mockImplementation(async (id) => {
      if (id === 'master-1') return masterUser();
      return { ...masterUser(), _id: 'master-2' };
    });

    await expect(
      revokePlatformAdminRole({ actorUserId: 'master-1', targetUserId: 'master-2' })
    ).rejects.toMatchObject({ code: 'cannot_revoke_master' });
  });
});
