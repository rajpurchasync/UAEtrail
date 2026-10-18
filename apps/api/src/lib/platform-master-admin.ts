import { UserRole } from '../domain/enums.js';
import type { AuthUserRecord } from './auth-users-store.js';
import { findAuthUserByEmail, findAuthUserById, updateAuthUserCore } from './auth-users-store.js';
import { ApiError } from './api-error.js';
import { createAuditLog } from './audit.js';

const parseMasterEmailsFromEnv = (): Set<string> => {
  const raw = process.env.PLATFORM_MASTER_ADMIN_EMAILS ?? '';
  return new Set(
    raw
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  );
};

/** Master admins may grant or revoke platform staff (`PLATFORM_ADMIN`). */
export const isPlatformMasterAdmin = (user: Pick<AuthUserRecord, 'email' | 'profile'>): boolean => {
  if (user.profile?.platformMasterAdmin === true) return true;
  const allowlist = parseMasterEmailsFromEnv();
  return allowlist.size > 0 && allowlist.has(user.email.toLowerCase());
};

export const assertPlatformMasterAdmin = async (actorUserId: string): Promise<AuthUserRecord> => {
  const actor = await findAuthUserById(actorUserId);
  if (!actor || actor.role !== UserRole.PLATFORM_ADMIN) {
    throw new ApiError(403, 'forbidden', 'Platform master admin access is required.');
  }
  if (!isPlatformMasterAdmin(actor)) {
    throw new ApiError(403, 'forbidden', 'Only the platform master admin can manage platform staff.');
  }
  return actor;
};

export const grantPlatformAdminRole = async (input: {
  actorUserId: string;
  targetEmail: string;
}): Promise<{ userId: string; email: string }> => {
  await assertPlatformMasterAdmin(input.actorUserId);

  const email = input.targetEmail.trim().toLowerCase();
  const target = await findAuthUserByEmail(email);
  if (!target) {
    throw new ApiError(404, 'user_not_found', 'No account exists for that email. They must sign up first.');
  }
  if (target.role === UserRole.PLATFORM_ADMIN) {
    throw new ApiError(409, 'already_platform_admin', 'This member is already a platform admin.');
  }

  await updateAuthUserCore({ userId: target._id, role: UserRole.PLATFORM_ADMIN });

  await createAuditLog({
    actorId: input.actorUserId,
    action: 'platform_admin.grant',
    entityType: 'user',
    entityId: target._id,
    metadata: { email: target.email },
  });

  return { userId: target._id, email: target.email };
};

export const revokePlatformAdminRole = async (input: {
  actorUserId: string;
  targetUserId: string;
}): Promise<void> => {
  await assertPlatformMasterAdmin(input.actorUserId);

  const target = await findAuthUserById(input.targetUserId);
  if (!target) {
    throw new ApiError(404, 'user_not_found', 'User not found.');
  }
  if (target.role !== UserRole.PLATFORM_ADMIN) {
    throw new ApiError(400, 'not_platform_admin', 'This member is not a platform admin.');
  }
  if (isPlatformMasterAdmin(target)) {
    throw new ApiError(400, 'cannot_revoke_master', 'Cannot remove master admin access.');
  }
  if (target._id === input.actorUserId) {
    throw new ApiError(400, 'cannot_revoke_self', 'You cannot remove your own platform admin access.');
  }

  await updateAuthUserCore({ userId: target._id, role: UserRole.PARTICIPANT });

  await createAuditLog({
    actorId: input.actorUserId,
    action: 'platform_admin.revoke',
    entityType: 'user',
    entityId: target._id,
    metadata: { email: target.email },
  });
};
