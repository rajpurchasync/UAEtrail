import {
  ActivityDetailDTO,
  GroupWallPostPolicy,
  OrganisationHostDetailsDTO,
  RideshareRiderReputationDTO,
  SocialGroupChatPreviewDTO,
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
    shopPresence?: 'physical' | 'online';
    searchKeywords?: string;
    deliveryOffered?: boolean;
    deliveryRadiusKm?: number | null;
    contactEmail?: string;
  };
  createdAt: string;
}

/** Domain alias — Pro membership application (HTTP `/me/pro-application`; collection `host_applications`). */
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
  avatarUrl?: string | null;
  role: string;
  isActive?: boolean;
}

export interface ActivityRequestView {
  id: string;
  status: string;
  adults?: number;
  kids?: number;
  partyMembers?: import('@uaetrail/shared-types').ActivityPartyMemberDTO[];
  partyApprovalPending?: boolean;
  note?: string;
  hostNote?: string;
  cancelReason?: string | null;
  cancelMessage?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    displayName: string;
    medicalSafety?: import('@uaetrail/shared-types').MemberMedicalSafetyDTO | null;
    joinProfile?: import('@uaetrail/shared-types').HostJoinProfileSnippetDTO | null;
  };
  activity: {
    id: string;
    title: string;
    locationName: string;
    activityType?: string;
    date?: string;
    time?: string;
    startAt?: string;
    hostName?: string;
    hostUserId?: string;
    tenantName?: string;
    tenantSlug?: string;
  };
  rideshareRiderReputation?: RideshareRiderReputationDTO | null;
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
  fieldPrivacy?: import('@uaetrail/shared-types').ProfileFieldPrivacySettings;
  dateOfBirthShare?: import('@uaetrail/shared-types').ProfileDateOfBirthShare;
  friendsListShare?: import('@uaetrail/shared-types').ProfileFriendsListShare;
  findCrewVisibility?: import('@uaetrail/shared-types').FindCrewVisibility;
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
  bloodGroup?: import('@uaetrail/shared-types').BloodGroup | null;
  medicalConditions?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelation?: string | null;
  medicalSafetyProfileComplete?: boolean;
  memberSince?: string;
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
      city: string | null;
      languages: string | null;
      age: number | null;
      birthYear?: number | null;
      /** `MM-DD` when day+month only is shared. */
      monthDay?: string | null;
      dateOfBirth?: string | null;
      memberSince: string;
      isHost: boolean;
      profileRoleLabel?: import('@uaetrail/shared-types').MemberProfileRoleLabel;
      isGuideStaff?: boolean;
      hostProfileKind: 'shop' | 'agency' | 'guide' | null;
      hostProfilePath: string | null;
      linkedOperatorName?: string | null;
      /** Publishing tenant for community host reviews (`targetType=tenant`). */
      publishingTenantId?: string | null;
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
      } | null;
      vehicles: import('@uaetrail/shared-types').RideshareVehiclePublicDTO[] | null;
      availability?: import('@uaetrail/shared-types').MemberAvailabilityPublicDTO | null;
      yearGoal: {
        activityFilter: 'hiking' | 'camping' | 'all_outings';
        countMode?: 'join' | 'host';
        targetCount: number;
        targetDate: string;
        year: number;
        currentCount: number;
        completed: boolean;
      } | null;
    };

/** Domain alias — a Person's public profile at `/member/:id`. */
export type PersonPublicProfileDTO = PublicMemberProfileDTO;

export type { GroupWallPostPolicy };

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
  wallPostPolicy?: GroupWallPostPolicy;
  createdAt: string;
  updatedAt: string;
  chatPreview?: SocialGroupChatPreviewDTO;
}

export type FamilyKidGender = 'male' | 'female' | 'prefer_not_to_say';

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
  dateOfBirth?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelation?: string | null;
  medicalConditions?: string | null;
  gender?: FamilyKidGender | null;
  photoUrl?: string | null;
  /** Kid rows only — ready to attach to an outing. */
  profileComplete?: boolean;
  user?: {
    id: string;
    email: string;
    displayName?: string | null;
    avatarUrl?: string | null;
  } | null;
}

export type FamilyKidProfilePayload = {
  displayName: string;
  dateOfBirth: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation?: string | null;
  medicalConditions: string;
  gender?: FamilyKidGender | null;
  photoUrl?: string | null;
  role?: 'admin' | 'buddy';
};

export type FamilyKidProfilePatchPayload = Partial<
  Omit<FamilyKidProfilePayload, 'role'>
>;

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
  replyToMessageId?: string | null;
  replyToPreview?: {
    messageId: string;
    authorDisplayName: string;
    bodySnippet: string;
  } | null;
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
export type ContentReportReason = 'spam' | 'harassment' | 'other';

export type ContentReportStatus = 'open' | 'resolved' | 'dismissed';

export interface AdminContentReportEntry {
  id: string;
  targetType: ContentReportTargetType;
  targetId: string;
  reason: ContentReportReason;
  details: string | null;
  status: ContentReportStatus;
  resolutionNote: string | null;
  resolvedAt: string | null;
  createdAt: string;
  reporter: {
    id: string;
    email: string;
    displayName: string | null;
  };
}

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
  businessMode?: string | null;
  discoverFeatured?: boolean;
  hiddenFromPublic?: boolean;
  owner: { id: string; email: string; displayName: string | null };
  createdAt: string;
  members: Array<{
    membershipId: string;
    userId: string;
    email: string;
    displayName: string | null;
    role: string;
    joinedAt: string;
  }>;
  activities: Array<{ id: string; title: string; locationName: string; startAt: string; status: string; capacity: number; participantCount: number; checkedInCount: number; guideName: string | null }>;
}

/** @deprecated Use OrganisationHostDetailsDTO from @uaetrail/shared-types */
export type HostDetails = OrganisationHostDetailsDTO;

/** Domain alias — public organisation profile fields on guide/agency tenants. */
export type OrganisationDetails = OrganisationHostDetailsDTO;

/** @deprecated Import TenantPublicDTO from @uaetrail/shared-types */
export type TenantProfile = TenantPublicDTO;
