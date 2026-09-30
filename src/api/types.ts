import {
  ActivityDetailDTO,
  OrganisationHostDetailsDTO,
  TenantListDTO,
  TenantPublicDTO,
  TenantType,
} from '@uaetrail/shared-types';

export interface HostApplication {
  id: string;
  applicantId?: string;
  applicantEmail: string;
  applicantName: string;
  requestedName: string;
  requestedType: string;
  requestedSlug?: string;
  requestedTenantId?: string | null;
  status: string;
  reviewerNote?: string;
  reviewedAt?: string | null;
  metadata?: {
    hostProfileType?: 'individual' | 'agency' | 'shop';
    hostDisplayName?: string;
    requestedName?: string;
    dateOfBirth?: string;
    bio?: string;
    phoneCountryCode?: string;
    phone?: string;
    phoneE164?: string;
    nationality?: string;
    residence?: string;
    region?: string;
    languages?: string;
    interests?: string;
    services?: string;
    website?: string;
    latitude?: number;
    longitude?: number;
    experience?: string;
    certificates?: string;
    notableHikes?: string;
    profilePhoto?: string;
  };
  createdAt: string;
}

/** Domain alias — organisation signup/application (wire: host_applications). */
export type OrganisationApplication = HostApplication;

export interface AdminMetrics {
  tenants: number;
  activities: number;
  pendingApplications: number;
  pendingRequests: number;
  totalUsers: number;
  activeUsers: number;
  totalLocations: number;
  totalParticipants: number;
  totalHosts: number;
  activeActivities: number;
  totalGroups: number;
}

export interface TeamMember {
  id: string;
  userId: string;
  email: string;
  displayName: string;
  role: string;
  isActive?: boolean;
}

export interface ActivityRequestView {
  id: string;
  status: string;
  note?: string;
  organizerNote?: string;
  cancelReason?: string | null;
  cancelMessage?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    displayName: string;
  };
  activity: {
    id: string;
    title: string;
    locationName: string;
    date?: string;
    time?: string;
    startAt?: string;
    hostName?: string;
    hostUserId?: string;
    tenantName?: string;
    tenantSlug?: string;
  };
}

export interface UserProfile {
  id?: string;
  email?: string;
  role?: string;
  switchedFromRole?: string | null;
  displayName?: string;
  givenName?: string | null;
  surname?: string | null;
  phone?: string;
  bio?: string;
  avatarUrl?: string;
  profileVisibility?: 'public' | 'group_members' | 'private';
  dateOfBirth?: string | null;
  gender?: 'male' | 'female' | 'prefer_not_to_say' | null;
  city?:
    | 'dubai'
    | 'sharjah'
    | 'al_ain'
    | 'abu_dhabi'
    | 'ras_al_khaimah'
    | 'fujairah'
    | 'ajman'
    | 'umm_al_quwain'
    | null;
  languages?: string | null;
  countryCode?: 'AE' | 'SA' | 'OM' | 'QA' | 'BH' | 'KW' | null;
  signupProfileComplete?: boolean;
}

export type PublicMemberProfileDTO =
  | {
      visibilityState: 'private';
      id: string;
      message: string;
    }
  | {
      visibilityState: 'full';
      id: string;
      displayName: string;
      avatarUrl: string | null;
      bio: string | null;
      age: number | null;
      city: string | null;
      languages: string | null;
      isHost: boolean;
      isGuideStaff?: boolean;
      hostProfileKind: 'shop' | 'agency' | 'guide' | null;
      hostProfilePath: string | null;
      trailPointsEligible: boolean;
      points: number;
      membershipTier: {
        key: string;
        name: string;
        minPoints: number;
        emoji: string;
        tagline: string;
        benefits: string[];
      };
      tierBadges: Array<{
        key: string;
        name: string;
        description: string;
        emoji: string;
        earned: boolean;
        earnedAt: string | null;
      }>;
      badges: Array<{
        key: string;
        name: string;
        description: string;
        emoji: string;
        earned: boolean;
        earnedAt: string | null;
      }>;
      stats: {
        activitiesAttended: number;
        activitiesHosted: number;
      };
    };

/** Domain alias — a Person's public profile at `/member/:id`. */
export type PersonPublicProfileDTO = PublicMemberProfileDTO;

export interface SocialGroupView {
  id: string;
  type: 'family' | 'friends' | 'activity';
  name: string;
  slogan?: string | null;
  bannerUrl?: string | null;
  photoUrl?: string | null;
  adminUserId: string;
  activityId?: string | null;
  status?: 'active' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

export interface SocialGroupMemberView {
  id: string;
  groupId: string;
  userId?: string | null;
  role: 'admin' | 'buddy';
  memberType: 'adult' | 'kid';
  displayName?: string | null;
  invitedEmail?: string | null;
  createdByUserId: string;
  createdAt: string;
  isActive?: boolean;
  user?: {
    id: string;
    email: string;
    displayName?: string | null;
    avatarUrl?: string | null;
  } | null;
}

export interface SocialGroupInviteView {
  id: string;
  groupId: string;
  invitedByUserId: string;
  email: string;
  role: 'admin' | 'buddy';
  token: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  acceptedByUserId?: string | null;
  acceptedAt?: string | null;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface SocialGroupWallReactionView {
  kind: 'like' | 'dislike' | 'happy' | 'heart' | 'laugh' | 'mountain' | 'camping' | 'car';
  count: number;
  reactedByMe: boolean;
}

export interface SocialGroupWallMessageView {
  id: string;
  groupId: string;
  authorUserId: string;
  body: string;
  createdAt: string;
  author?: {
    id: string;
    displayName: string;
    avatarUrl?: string | null;
  };
  reactions?: SocialGroupWallReactionView[];
}

export interface AdminSocialGroupListItem extends SocialGroupView {
  memberCount: number;
  adultMemberCount: number;
  admin: {
    id: string;
    email: string;
    displayName?: string | null;
    avatarUrl?: string | null;
  } | null;
}

export type AdminSocialGroupInviteView = Omit<SocialGroupInviteView, 'token'>;

export interface AdminSocialGroupDetail {
  group: SocialGroupView;
  admin: {
    id: string;
    email: string;
    displayName?: string | null;
    avatarUrl?: string | null;
  } | null;
  members: SocialGroupMemberView[];
  invites: AdminSocialGroupInviteView[];
  stats: {
    memberCount: number;
    adultCount: number;
    kidCount: number;
    pendingInvites: number;
  };
}

export interface AccountDeletionInfo {
  canDelete: boolean;
  blockers: string[];
  requiresPassword: boolean;
}

export type ContentReportTargetType = 'user' | 'message' | 'post' | 'review' | 'reply';
export type ContentReportReason = 'spam' | 'harassment' | 'inappropriate' | 'scam' | 'other';

export type ActivityDetail = ActivityDetailDTO;

export interface TenantMembershipView {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  tenantType: string;
  membershipRole: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actorEmail: string;
  actorName: string | null;
  tenantId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface TenantDetail {
  id: string;
  name: string;
  slug: string;
  type: TenantType;
  status: TenantListDTO['status'];
  owner: { id: string; email: string; displayName: string | null };
  createdAt: string;
  members: Array<{ userId: string; email: string; displayName: string | null; role: string; joinedAt: string }>;
  activities: Array<{ id: string; title: string; locationName: string; startAt: string; status: string; capacity: number; participantCount: number; checkedInCount: number; guideName: string | null }>;
}

/** @deprecated Use OrganisationHostDetailsDTO from @uaetrail/shared-types */
export type HostDetails = OrganisationHostDetailsDTO;

/** Domain alias — public organisation profile fields on guide/agency tenants. */
export type OrganisationDetails = OrganisationHostDetailsDTO;

/** @deprecated Import TenantPublicDTO from @uaetrail/shared-types */
export type TenantProfile = TenantPublicDTO;
