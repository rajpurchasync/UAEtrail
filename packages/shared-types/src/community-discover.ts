import type { ActivityDTO } from './index.js';
import type { GeoRef } from './geo-hierarchy.js';

/** Discoverable club directory — not private `member_groups` teams. */
export const COMMUNITY_DISCOVER_VISIBILITY = ['public', 'private'] as const;
export type CommunityDiscoverVisibility = (typeof COMMUNITY_DISCOVER_VISIBILITY)[number];

export const COMMUNITY_JOIN_POLICIES = ['open', 'request', 'invite'] as const;
export type CommunityJoinPolicy = (typeof COMMUNITY_JOIN_POLICIES)[number];

export type CommunityDiscoverCardDTO = {
  id: string;
  name: string;
  slug: string;
  summary: string | null;
  bannerUrl: string | null;
  visibility: CommunityDiscoverVisibility;
  joinPolicy: CommunityJoinPolicy;
  geoRef: GeoRef;
  memberCount: number;
};

export const COMMUNITY_GROUP_STATUSES = ['active', 'suspended'] as const;
export type CommunityGroupStatus = (typeof COMMUNITY_GROUP_STATUSES)[number];

export const COMMUNITY_MEMBERSHIP_STATUSES = ['member', 'pending'] as const;
export type CommunityMembershipStatus = (typeof COMMUNITY_MEMBERSHIP_STATUSES)[number];

export type CommunityViewerMembershipDTO = {
  status: CommunityMembershipStatus;
};

export type CommunityDiscoverDetailDTO = CommunityDiscoverCardDTO & {
  /** Long-form about copy (public detail). */
  description: string | null;
  /** House rules / expectations (open text). */
  policies: string | null;
  viewerMembership: CommunityViewerMembershipDTO | null;
  /** Signed-in viewer may redeem an outstanding invite (`joinPolicy: invite`). */
  viewerHasInvite: boolean;
  /** Owner or co-admin — can manage profile from consumer surface. */
  viewerIsHost: boolean;
  status: CommunityGroupStatus;
};

export type CommunityHostProfilePatchDTO = {
  summary?: string | null;
  description?: string | null;
  policies?: string | null;
  bannerUrl?: string | null;
};

/** Published outings tagged `discoverCommunityId` on the activity document. */
export type CommunityDiscoverActivitiesDTO = {
  upcoming: ActivityDTO[];
  past: ActivityDTO[];
};

export type MeCommunityDiscoverRelation = 'host' | 'member' | 'pending';

export type MeCommunityDiscoverRowDTO = CommunityDiscoverCardDTO & {
  membershipStatus: CommunityMembershipStatus | null;
  relation: MeCommunityDiscoverRelation;
};

export type MeCommunityDiscoverListDTO = {
  created: MeCommunityDiscoverRowDTO[];
  joined: MeCommunityDiscoverRowDTO[];
};

export type CommunityHostAdminRole = 'owner' | 'admin';

export type CommunityHostAdminRowDTO = {
  userId: string;
  email: string;
  displayName: string | null;
  role: CommunityHostAdminRole;
};

export type CommunityHostMemberRowDTO = {
  userId: string;
  email: string;
  displayName: string | null;
  status: CommunityMembershipStatus;
  joinedAt: string;
};

export type CommunityHostManageDTO = {
  communityId: string;
  slug: string;
  name: string;
  joinPolicy: CommunityJoinPolicy;
  status: CommunityGroupStatus;
  viewerAdminRole: CommunityHostAdminRole | null;
  pending: CommunityHostMemberRowDTO[];
  members: CommunityHostMemberRowDTO[];
  admins: CommunityHostAdminRowDTO[];
  pendingInvites: number;
};

export type MeCreateCommunityDiscoverDTO = {
  name: string;
  slug?: string;
  summary?: string | null;
  bannerUrl?: string | null;
  visibility: CommunityDiscoverVisibility;
  joinPolicy: CommunityJoinPolicy;
  geoRef: GeoRef;
};

export const COMMUNITY_INVITE_STATUSES = ['pending', 'accepted', 'revoked'] as const;
export type CommunityInviteStatus = (typeof COMMUNITY_INVITE_STATUSES)[number];

export type AdminCommunityInviteRowDTO = {
  id: string;
  email: string;
  userId: string | null;
  status: CommunityInviteStatus;
  invitedByUserId: string;
  createdAt: string;
  acceptedAt: string | null;
};

export type AdminCommunityHostContactDTO = {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
};

export type AdminCommunityListItemDTO = CommunityDiscoverCardDTO & {
  status: CommunityGroupStatus;
  adminUserId: string | null;
  admin: AdminCommunityHostContactDTO | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminCommunityMemberRowDTO = {
  userId: string;
  email: string;
  displayName: string | null;
  status: CommunityMembershipStatus;
  joinedAt: string;
};

export type AdminCommunityDetailDTO = {
  community: AdminCommunityListItemDTO;
  host: AdminCommunityHostContactDTO | null;
  members: AdminCommunityMemberRowDTO[];
  invites: AdminCommunityInviteRowDTO[];
  stats: {
    memberCount: number;
    pendingCount: number;
    pendingInvites: number;
  };
};

/** Find crew → Communities list sort: country → city/area → name. */
export const compareCommunityDiscoverByGeo = (
  a: Pick<CommunityDiscoverCardDTO, 'geoRef' | 'name'>,
  b: Pick<CommunityDiscoverCardDTO, 'geoRef' | 'name'>
): number => {
  const countryCmp = a.geoRef.names.country.localeCompare(b.geoRef.names.country);
  if (countryCmp !== 0) return countryCmp;
  const areaA = a.geoRef.names.area || a.geoRef.names.state;
  const areaB = b.geoRef.names.area || b.geoRef.names.state;
  const areaCmp = areaA.localeCompare(areaB);
  if (areaCmp !== 0) return areaCmp;
  return a.name.localeCompare(b.name);
};