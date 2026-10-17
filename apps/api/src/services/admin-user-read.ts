import { TenantType, UserRole, UserStatus } from '../domain/enums.js';
import { ApiError } from '../lib/api-error.js';
import {
  listActivitiesForAdminByIds,
  listActivitiesForAdminRequests,
  listOwnerTenantTypes,
  listTenantMembershipsForUser,
  listTenantOwnerIdsByTenantType,
  listUserHostedActivitiesBasic,
  listUserOwnedTenantsBasic,
} from '../lib/admin-store.js';
import {
  listUserActivityParticipantsBasic,
  listUserActivityRequestsBasic,
} from '../lib/activity-engagement-store.js';
import { countAuthUsers, findAuthUserById, listAuthUsers } from '../lib/auth-users.js';
import { listUserGroupsWithMembership } from '../lib/social-groups-store.js';
import { resolveAdminUserListFilters, resolveAdminUserType } from '../lib/user-type.js';

export const listAdminUsersPage = async (input: {
  role?: string;
  userType?: string;
  status?: string;
  search?: string;
  page: number;
  pageSize: number;
}) => {
  const listFilters = input.userType ? resolveAdminUserListFilters(input.userType) : {};
  const authRoleFilter = input.role ? (input.role.toUpperCase() as UserRole) : listFilters.role;
  const authStatusFilter = input.status ? (input.status.toUpperCase() as UserStatus) : undefined;

  let ownerIdsFilter: string[] | undefined;
  if (listFilters.tenantOwnerType) {
    ownerIdsFilter = await listTenantOwnerIdsByTenantType(listFilters.tenantOwnerType);
  }

  const listInput = {
    role: authRoleFilter as UserRole | UserRole[] | undefined,
    status: authStatusFilter as 'ACTIVE' | 'SUSPENDED' | undefined,
    search: input.search,
    userIds: ownerIdsFilter,
    skip: (input.page - 1) * input.pageSize,
    take: input.pageSize,
  };

  const [users, total] = await Promise.all([
    listAuthUsers(listInput),
    countAuthUsers({
      role: listInput.role,
      status: listInput.status,
      search: listInput.search,
      userIds: listInput.userIds,
    }),
  ]);

  const ownedTenantMap = new Map<string, { type: TenantType }[]>();
  const tenantOwnerIds = users.filter((u) => u.role === 'TENANT_OWNER').map((u) => u._id);
  if (tenantOwnerIds.length > 0) {
    const owners = await listOwnerTenantTypes(tenantOwnerIds);
    owners.forEach((tenant) => {
      const existing = ownedTenantMap.get(tenant.ownerId) ?? [];
      existing.push({ type: tenant.type });
      ownedTenantMap.set(tenant.ownerId, existing);
    });
  }

  return {
    total,
    page: input.page,
    pageSize: input.pageSize,
    items: users.map((u) => ({
      id: u._id,
      email: u.email,
      role: u.role.toLowerCase(),
      userType: resolveAdminUserType({ role: u.role, ownedTenants: ownedTenantMap.get(u._id) }),
      status: u.status.toLowerCase(),
      authProvider: u.authProvider.toLowerCase(),
      displayName: u.profile.displayName ?? null,
      avatarUrl: u.profile.avatarUrl ?? null,
      createdAt: u.createdAt,
      lastActiveAt: u.lastActiveAt,
    })),
  };
};

export const loadAdminUserDetail = async (userId: string) => {
  const user = await findAuthUserById(userId);
  if (!user) {
    throw new ApiError(404, 'user_not_found', 'User not found.');
  }

  const [ownedTenants, memberships, requests, participants, groups, hostedActivities] = await Promise.all([
    listUserOwnedTenantsBasic(userId),
    listTenantMembershipsForUser(userId),
    listUserActivityRequestsBasic(userId, 20),
    listUserActivityParticipantsBasic(userId, 20),
    listUserGroupsWithMembership(userId),
    listUserHostedActivitiesBasic(userId, 20),
  ]);

  const requestEventIds = [...new Set(requests.map((request) => request.activityId))];
  const participantEventIds = [...new Set(participants.map((participant) => participant.activityId))];

  const [requestEvents, participantEvents] = await Promise.all([
    requestEventIds.length > 0 ? listActivitiesForAdminRequests(requestEventIds) : Promise.resolve([]),
    participantEventIds.length > 0 ? listActivitiesForAdminByIds(participantEventIds) : Promise.resolve([]),
  ]);
  const requestEventMap = new Map(requestEvents.map((event) => [event.id, event]));
  const participantEventMap = new Map(participantEvents.map((event) => [event.id, event]));

  return {
    id: user._id,
    email: user.email,
    role: user.role.toLowerCase(),
    userType: resolveAdminUserType({
      ...user,
      ownedTenants,
    }),
    status: user.status.toLowerCase(),
    authProvider: user.authProvider.toLowerCase(),
    googleLinked: Boolean(user.googleId),
    createdAt: user.createdAt,
    lastActiveAt: user.lastActiveAt,
    emailVerifiedAt: user.emailVerifiedAt,
    profile: user.profile
      ? {
          displayName: user.profile.displayName,
          phone: user.profile.phone,
          bio: user.profile.bio,
          avatarUrl: user.profile.avatarUrl,
        }
      : null,
    memberships: memberships.map((m) => ({
      tenantId: m.tenantId,
      tenantName: m.tenant.name,
      tenantSlug: m.tenant.slug,
      role: m.role.toLowerCase(),
      joinedAt: m.createdAt,
    })),
    ownedTenants: ownedTenants.map((tenant) => ({
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      type: tenant.type.toLowerCase(),
      status: tenant.status.toLowerCase(),
    })),
    groups: groups.map((group) => ({
      id: group.id,
      name: group.name,
      type: group.type,
      role: group.role,
      status: group.status,
      isCreator: group.role === 'admin',
      joinedAt: group.joinedAt,
    })),
    hostedActivities,
    requests: requests.reduce<
      Array<{
        id: string;
        activityId: string;
        activityTitle: string | null;
        locationName: string;
        status: string;
        createdAt: Date;
      }>
    >((acc, r) => {
      const event = requestEventMap.get(r.activityId);
      if (!event) return acc;
      acc.push({
        id: r.id,
        activityId: r.activityId,
        activityTitle: event.title,
        locationName: event.location.name,
        status: r.status.toLowerCase(),
        createdAt: r.createdAt,
      });
      return acc;
    }, []),
    joinedActivities: participants.reduce<
      Array<{
        activityId: string;
        activityTitle: string | null;
        locationName: string;
        tenantName: string;
        date: string;
        checkedInAt: Date | null;
      }>
    >((acc, p) => {
      const event = participantEventMap.get(p.activityId);
      if (!event) return acc;
      acc.push({
        activityId: p.activityId,
        activityTitle: event.title,
        locationName: event.location.name,
        tenantName: event.tenant.name,
        date: event.startAt.toISOString().slice(0, 10),
        checkedInAt: p.checkedInAt,
      });
      return acc;
    }, []),
  };
};
