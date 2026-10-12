import type {
  ActivityDTO,
  AreaDTO,
  LocationDTO,
  PlaceDTO,
  ProductDTO,
  TenantListDTO,
  UserListDTO,
} from '@uaetrail/shared-types';
import { api } from '../api/index';
import type {
  AdminContentReportEntry,
  AdminMetrics,
  AdminSocialGroupDetail,
  AdminSocialGroupListItem,
  AuditLogEntry,
  HostApplication,
  TenantDetail,
} from '../api/types';

export type {
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

export const fetchAdminModerationActivities = async (): Promise<ActivityDTO[]> => {
  const res = await api.getAdminActivities();
  return res.data;
};

export const fetchAdminPlacesCatalog = async (): Promise<LocationDTO[]> => {
  const res = await api.getAdminPlaces();
  return res.data;
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

export const fetchAdminOrganisationApplications = async (): Promise<HostApplication[]> => {
  const res = await api.getAdminOrganisationApplications();
  return res.data;
};

export const fetchAdminTenants = async (): Promise<TenantListDTO[]> => {
  const res = await api.getAdminTenants();
  return res.data;
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

export const setAdminTenantDiscoverFeatured = async (
  id: string,
  featured: boolean
): Promise<{ message: string; discoverFeatured: boolean }> => {
  return api.setAdminTenantDiscoverFeatured(id, featured);
};

export const fetchAdminContentReports = async (
  page?: number,
  pageSize?: number
): Promise<{
  data: AdminContentReportEntry[];
  pagination: { total: number; page: number; pageSize: number; totalPages: number };
}> => {
  return api.getAdminContentReports(page, pageSize);
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

export const fetchAdminAuditLogs = async (filters?: {
  action?: string;
  entityType?: string;
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
  type?: 'family' | 'friends';
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

export const fetchAdminAreas = async (): Promise<AreaDTO[]> => {
  const res = await api.listAdminAreas();
  return res.data;
};

export const createAdminArea = async (payload: Partial<AreaDTO>): Promise<AreaDTO> => {
  const res = await api.createAdminArea(payload);
  return res.data;
};

export const updateAdminArea = async (id: string, payload: Partial<AreaDTO>): Promise<AreaDTO> => {
  const res = await api.updateAdminArea(id, payload);
  return res.data;
};

export const deleteAdminArea = async (id: string): Promise<void> => {
  await api.deleteAdminArea(id);
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

export const fetchAdminProducts = async (filters?: {
  status?: string;
  category?: string;
  featured?: boolean;
  page?: number;
  pageSize?: number;
}): Promise<{
  data: ProductDTO[];
  pagination: { total: number; page: number; pageSize: number; totalPages: number };
}> => {
  return api.getAdminProducts(filters);
};

export const updateAdminProductStatus = async (
  id: string,
  status: 'active' | 'inactive'
): Promise<void> => {
  await api.updateAdminProductStatus(id, status);
};
