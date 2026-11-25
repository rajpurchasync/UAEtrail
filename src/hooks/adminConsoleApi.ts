import type {
  ActivityDTO,
  DestinationDTO,
  FacilityDTO,
  LocationDTO,
  PlaceDTO,
  TenantListDTO,
  UserListDTO,
} from '@uaetrail/shared-types';
import {
  adminPlaceFormToFacilityPayload,
  facilityDtoToAdminPlaceRow,
  facilityKindFromAdminPlaceForm,
} from '../place/adminFacilityPlaceAdapter';
import { api } from '../api/index';
import type {
  AdminCommunityListItem,
  AdminContentReportEntry,
  AdminMetrics,
  AdminSocialGroupDetail,
  AdminSocialGroupListItem,
  AuditLogEntry,
  HostApplication,
  TenantDetail,
} from '../api/types';

export type {
  AdminCommunityListItem,
  AdminContentReportEntry,
  AdminMetrics,
  AdminSocialGroupDetail,
  AdminSocialGroupListItem,
  AuditLogEntry,
  HostApplication,
  TenantDetail,
};

export type AdminActivityEngagement = {
  participants: Array<{
    id: string;
    userId: string;
    checkedInAt: string | null;
    createdAt: string;
    displayName: string | null;
    email: string;
  }>;
  joinRequests: Array<{
    id: string;
    userId: string;
    status: string;
    note: string | null;
    createdAt: string;
    displayName: string | null;
    email: string;
  }>;
};

export const fetchAdminMetrics = async (): Promise<AdminMetrics> => {
  const res = await api.getAdminMetrics();
  return res.data;
};

export const fetchAdminModerationActivities = async (
  page = 1,
  pageSize?: number
): Promise<{ items: ActivityDTO[]; total: number }> => {
  const res = await api.getAdminActivities(page, pageSize);
  return { items: res.data, total: res.meta?.total ?? res.data.length };
};

export const fetchAdminPlacesCatalog = async (
  page = 1,
  pageSize?: number
): Promise<{ items: LocationDTO[]; total: number }> => {
  const res = await api.getAdminPlaces(page, pageSize);
  return { items: res.data, total: res.meta?.total ?? res.data.length };
};

export const fetchAdminFacilitiesCatalog = async (
  page = 1,
  pageSize?: number
): Promise<{ items: PlaceDTO[]; total: number }> => {
  const res = await api.getAdminFacilities(page, pageSize);
  return {
    items: res.data.map(facilityDtoToAdminPlaceRow),
    total: res.meta?.total ?? res.data.length,
  };
};

export const fetchAdminActivityEngagement = async (
  activityId: string
): Promise<AdminActivityEngagement> => {
  const res = await api.getAdminActivityEngagement(activityId);
  return res.data;
};

export const moderateAdminActivity = async (
  activityId: string,
  action: 'suspend' | 'unsuspend',
  comment?: string
): Promise<void> => {
  await api.moderateActivity(activityId, action, comment);
};

export const toggleAdminActivityFeatured = async (
  activityId: string
): Promise<{ message: string; featured: boolean }> => {
  return api.toggleActivityFeatured(activityId);
};

/** Link (id) or delink (`null`) a rideshare offer ↔ its parent outing. */
export const setAdminRideshareParent = async (
  rideshareActivityId: string,
  parentActivityId: string | null
): Promise<{ message: string; data: ActivityDTO | null }> =>
  api.adminSetRideshareParent(rideshareActivityId, parentActivityId);

/** Link (id) or delink (`null`) the rideshare shown on a parent outing. */
export const setAdminLinkedRideshare = async (
  parentActivityId: string,
  rideshareActivityId: string | null
): Promise<{ message: string; data: ActivityDTO | null }> =>
  api.adminSetLinkedRideshare(parentActivityId, rideshareActivityId);

/** Link (id) or delink (`null`) a rideshare offer ↔ its destination catalog place. */
export const setAdminRideshareDestinationPlace = async (
  rideshareActivityId: string,
  placeId: string | null
): Promise<{ message: string; data: ActivityDTO | null }> =>
  api.adminSetRideshareDestinationPlace(rideshareActivityId, placeId);

export const fetchAdminOrganisationApplications = async (
  page = 1,
  pageSize?: number
): Promise<{ items: HostApplication[]; total: number }> => {
  const res = await api.getAdminOrganisationApplications(page, pageSize);
  return { items: res.data, total: res.meta?.total ?? res.data.length };
};

export const fetchAdminTenants = async (
  page = 1,
  pageSize?: number
): Promise<{ items: TenantListDTO[]; total: number }> => {
  const res = await api.getAdminTenants(page, pageSize);
  return { items: res.data, total: res.meta?.total ?? res.data.length };
};

export const reviewAdminOrganisationApplication = async (
  id: string,
  status: 'approved' | 'rejected',
  reviewerNote?: string
): Promise<void> => {
  await api.reviewAdminApplication(id, status, reviewerNote);
};

export const updateAdminTenantStatus = async (
  id: string,
  status: 'active' | 'suspended',
  comment?: string
): Promise<void> => {
  await api.updateAdminTenantStatus(id, status, comment);
};

export const setAdminTenantHiddenFromPublic = async (
  id: string,
  hidden: boolean
): Promise<{ message: string; hiddenFromPublic: boolean }> => {
  return api.setAdminTenantHidden(id, hidden);
};

export const setAdminTenantDiscoverFeatured = async (
  id: string,
  featured: boolean
): Promise<{ message: string; discoverFeatured: boolean }> => {
  return api.setAdminTenantDiscoverFeatured(id, featured);
};

export const fetchAdminContentReports = async (filters?: {
  page?: number;
  pageSize?: number;
  reason?: string;
  targetType?: string;
  status?: string;
  reporter?: string;
  from?: string;
  to?: string;
}): Promise<{
  data: AdminContentReportEntry[];
  pagination: { total: number; page: number; pageSize: number; totalPages: number };
}> => {
  return api.getAdminContentReports(filters);
};

export const resolveAdminContentReport = async (
  id: string,
  status: 'resolved' | 'dismissed',
  note?: string
): Promise<AdminContentReportEntry> => {
  const res = await api.patchAdminContentReport(id, { status, note });
  return res.data;
};

export type AdminNotificationRow = {
  id: string;
  title: string;
  body: string;
  targetRole: string | null;
  recipientCount: number;
  createdAt: string;
};

export const fetchAdminNotificationBroadcasts = async (): Promise<AdminNotificationRow[]> => {
  const res = await api.getAdminNotifications();
  return res.data;
};

export const sendAdminNotificationBroadcast = async (payload: {
  title: string;
  body: string;
  targetRole?: string;
}): Promise<{ count: number }> => {
  const res = await api.sendAdminNotification(payload);
  return res.data;
};

export const addAdminTenantTeamMember = async (
  tenantId: string,
  payload: { email: string; displayName?: string; role: 'tenant_admin' | 'tenant_guide' }
) => {
  const res = await api.addAdminTenantTeamMember(tenantId, payload);
  return res.data;
};

export const patchAdminTenantTeamMember = async (
  tenantId: string,
  membershipId: string,
  payload: { role: 'tenant_admin' | 'tenant_guide' }
) => {
  const res = await api.patchAdminTenantTeamMember(tenantId, membershipId, payload);
  return res.data;
};

export const removeAdminTenantTeamMember = async (tenantId: string, membershipId: string) => {
  await api.removeAdminTenantTeamMember(tenantId, membershipId);
};

export const fetchAdminAuditLogs = async (filters?: {
  action?: string;
  entityType?: string;
  actor?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}): Promise<{
  data: AuditLogEntry[];
  pagination?: { total: number; page: number; pageSize: number; totalPages: number };
}> => {
  return api.getAdminAuditLogs(filters);
};

export const fetchAdminMembers = async (filters?: {
  role?: string;
  userType?: string;
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ data: UserListDTO[]; total: number; page: number; pageSize: number }> => {
  return api.getAdminMembers(filters);
};

export const updateAdminMemberStatus = async (
  id: string,
  status: 'active' | 'suspended',
  comment?: string
): Promise<void> => {
  await api.updateAdminMemberStatus(id, status, comment);
};

export const grantPlatformAdminByEmail = async (
  email: string
): Promise<{ userId: string; email: string; message: string }> => {
  const res = await api.grantPlatformAdmin(email);
  return { ...res.data, message: res.message };
};

export const revokePlatformAdminByUserId = async (userId: string): Promise<void> => {
  await api.revokePlatformAdmin(userId);
};

export const fetchAdminMemberDetail = async (
  id: string
): Promise<Record<string, unknown>> => {
  const res = await api.getAdminMemberDetail(id);
  return res.data;
};

export const fetchAdminSocialGroups = async (filters?: {
  search?: string;
  type?: 'family' | 'friends' | 'colleagues';
  status?: 'active' | 'suspended';
  page?: number;
  pageSize?: number;
}): Promise<{
  data: AdminSocialGroupListItem[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}> => {
  return api.getAdminGroups(filters);
};

export const updateAdminSocialGroupStatus = async (
  id: string,
  status: 'active' | 'suspended',
  comment?: string
): Promise<void> => {
  await api.updateAdminGroupStatus(id, status, comment);
};

export const fetchAdminCommunities = async (): Promise<AdminCommunityListItem[]> => {
  const res = await api.getAdminCommunities();
  return res.data;
};

export const updateAdminCommunityStatus = async (
  id: string,
  status: 'active' | 'suspended',
  comment?: string
): Promise<AdminCommunityListItem> => {
  const res = await api.updateAdminCommunityStatus(id, status, comment);
  return res.data;
};

export const createAdminCommunityInvite = async (
  communityId: string,
  body: { email?: string; userId?: string }
): Promise<void> => {
  await api.createAdminCommunityInvite(communityId, body);
};

export const approveAdminCommunityMemberRequest = async (
  communityId: string,
  userId: string
): Promise<void> => {
  await api.approveAdminCommunityMember(communityId, userId);
};

export const fetchAdminDestinations = async (): Promise<DestinationDTO[]> => {
  const res = await api.listAdminDestinations();
  return res.data;
};

export const createAdminDestination = async (
  payload: Omit<DestinationDTO, 'id' | 'bounds' | 'createdAt' | 'updatedAt'> & {
    bounds?: DestinationDTO['bounds'];
  }
): Promise<DestinationDTO> => {
  const res = await api.createAdminDestination(payload);
  return res.data;
};

export const updateAdminDestination = async (
  id: string,
  payload: Partial<DestinationDTO>
): Promise<DestinationDTO> => {
  const res = await api.updateAdminDestination(id, payload);
  return res.data;
};

export const deleteAdminDestination = async (id: string): Promise<void> => {
  await api.deleteAdminDestination(id);
};

export const createAdminPlace = async (payload: Partial<PlaceDTO>): Promise<PlaceDTO> => {
  const res = await api.createAdminPlace(payload);
  return res.data;
};

export const updateAdminPlace = async (
  id: string,
  payload: Partial<PlaceDTO>
): Promise<PlaceDTO> => {
  const res = await api.updateAdminPlace(id, payload);
  return res.data;
};

export const deleteAdminPlace = async (id: string): Promise<void> => {
  await api.deleteAdminPlace(id);
};

export const createAdminFacility = async (payload: Partial<PlaceDTO>): Promise<PlaceDTO> => {
  const facilityKind = facilityKindFromAdminPlaceForm(payload);
  if (!facilityKind) {
    throw new Error('Choose a facility type before saving.');
  }
  const res = await api.createAdminFacility(adminPlaceFormToFacilityPayload(payload, facilityKind));
  return facilityDtoToAdminPlaceRow(res.data);
};

export const updateAdminFacility = async (
  id: string,
  payload: Partial<PlaceDTO>
): Promise<PlaceDTO> => {
  const facilityKind = facilityKindFromAdminPlaceForm(payload);
  const body: Partial<FacilityDTO> & { facilityKind?: FacilityDTO['facilityKind'] } = facilityKind
    ? adminPlaceFormToFacilityPayload(payload, facilityKind)
    : {
        ...(payload.name !== undefined ? { name: payload.name.trim() } : {}),
        ...(payload.region !== undefined ? { region: payload.region.trim() } : {}),
        ...(payload.areaLabel !== undefined ? { areaLabel: payload.areaLabel } : {}),
        ...(payload.destinationId != null ? { destinationId: payload.destinationId.trim() } : {}),
        ...(payload.description !== undefined ? { description: payload.description.trim() } : {}),
        ...(payload.latitude !== undefined ? { latitude: payload.latitude } : {}),
        ...(payload.longitude !== undefined ? { longitude: payload.longitude } : {}),
        ...(payload.images !== undefined ? { images: payload.images } : {}),
        ...(payload.status !== undefined ? { status: payload.status } : {}),
        ...(payload.countryCode !== undefined ? { countryCode: payload.countryCode } : {}),
      };
  if (facilityKind) {
    body.facilityKind = facilityKind as FacilityDTO['facilityKind'];
  }
  const res = await api.updateAdminFacility(id, body);
  return facilityDtoToAdminPlaceRow(res.data);
};

export const deleteAdminFacility = async (id: string): Promise<void> => {
  await api.deleteAdminFacility(id);
};

/** Staff account on `/admin/account` — same `/me/profile` wire as consumer settings. */
export {
  fetchMeProfile as fetchAdminStaffProfile,
  updateMeProfile as updateAdminStaffProfile,
} from './memberProfileApi';
