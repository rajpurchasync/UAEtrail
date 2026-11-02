import { listActiveTenantMembershipsByUser } from '../lib/activities-store.js';
import { listAuthUsers } from '../lib/auth-users-store.js';
import { loadMemberInbox, type MemberInboxScope } from './member-inbox.js';

export const listMyTenantMemberships = async (userId: string) => {
  const memberships = await listActiveTenantMembershipsByUser(userId);
  return memberships.map((membership) => ({
    tenantId: membership.tenantId,
    tenantName: membership.tenant.name,
    tenantSlug: membership.tenant.slug,
    tenantType: membership.tenant.type.toLowerCase(),
    membershipRole: membership.role.toLowerCase(),
  }));
};

export const loadMyInbox = (userId: string, scope?: MemberInboxScope) => loadMemberInbox(userId, scope);

export const searchUsersForNewConversation = async (input: { viewerUserId: string; query: string }) => {
  const users = (await listAuthUsers({ status: 'ACTIVE', search: input.query, take: 20 }))
    .filter((u) => u._id !== input.viewerUserId)
    .slice(0, 10);

  return users.map((u) => ({
    id: u._id,
    displayName: u.profile.displayName ?? null,
    avatarUrl: u.profile.avatarUrl ?? null,
  }));
};
