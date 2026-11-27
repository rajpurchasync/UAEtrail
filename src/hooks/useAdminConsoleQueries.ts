import { useQuery } from '@tanstack/react-query';
import type { NotificationDTO } from '@uaetrail/shared-types';
import type {
  ActivityDTO,
  CatalogEditRankingDTO,
  AdminSubmissionDTO,
  DestinationDTO,
  LocationDTO,
  PlaceDTO,
  SubmissionCandidate,
  TenantListDTO,
  UserListDTO,
} from '@uaetrail/shared-types';
import type {
  AdminContentReportEntry,
  AdminCommunityListItem,
  AdminMetrics,
  AuditLogEntry,
  HostApplication,
  OrganisationApplication,
  TenantDetail,
} from '../api/types';
import type { AdminSocialGroupListItem } from '../api/types';
import type { AdminCatalogSegment } from '../place/adminCatalogSegment';
import {
  fetchAdminActivityDetail,
  fetchAdminGroupDetail,
  fetchAdminTenantDetail,
  type AdminSocialGroupDetail,
} from './adminDrilldownApi';
import {
  fetchAdminAuditLogs,
  fetchAdminCommunities,
  fetchAdminContentReports,
  fetchAdminDestinations,
  fetchAdminFacilitiesCatalog,
  fetchAdminMemberDetail,
  fetchAdminMembers,
  fetchAdminMetrics,
  fetchAdminModerationActivities,
  fetchAdminNotificationBroadcasts,
  fetchAdminOrganisationApplications,
  fetchAdminPlacesCatalog,
  fetchAdminSocialGroups,
  fetchAdminStaffProfile,
  fetchAdminTenants,
} from './adminConsoleApi';
import { fetchPublicPlaceDetail } from './placeDetailClientApi';
import {
  fetchAdminAmenityReports,
  fetchAdminVerificationDocuments,
} from './adminAlertsClientApi';
import { fetchAdminSubmissions } from './geoHierarchyClientApi';
import { fetchMeNotificationsPage } from './notificationInboxApi';
import {
  adminAuditLogsQueryKey,
  type AdminAuditLogsQueryKeyInput,
  adminCommunitiesListQueryKey,
  adminContentReportsQueryKey,
  type AdminContentReportsQueryKeyInput,
  adminActivityPreviewVenueQueryKey,
  adminCatalogSubmitterPreviewQueryKey,
  adminDestinationsCatalogQueryKey,
  adminInboxDashboardQueryKey,
  adminMembersQueryKey,
  type AdminMembersQueryKeyInput,
  adminModerationActivitiesCatalogQueryKey,
  adminNotificationBroadcastsQueryKey,
  adminNotificationsConsoleQueryKey,
  adminOrganisationsCatalogQueryKey,
  adminPlacesCatalogAllQueryKey,
  adminSocialGroupsCatalogQueryKey,
  adminStaffProfileQueryKey,
  adminSubmissionsQueueQueryKey,
  adminGroupDetailQueryKey,
  adminModerationActivityDetailQueryKey,
  adminTenantDetailQueryKey,
} from './clientQueryKeys';

const ADMIN_INBOX_PREVIEW = 5;

export type AdminBroadcastHistoryRow = {
  id: string;
  title: string;
  body: string;
  targetRole: string;
  sentAt: string;
  recipientCount: number;
};

export const useAdminNotificationBroadcasts = () =>
  useQuery({
    queryKey: adminNotificationBroadcastsQueryKey,
    queryFn: async (): Promise<AdminBroadcastHistoryRow[]> => {
      const rows = await fetchAdminNotificationBroadcasts();
      return rows.map((row) => ({
        id: row.id,
        title: row.title,
        body: row.body,
        targetRole: row.targetRole ?? 'all',
        sentAt: row.createdAt,
        recipientCount: row.recipientCount,
      }));
    },
  });

export type AdminNotificationsConsolePayload = {
  notifications: NotificationDTO[];
  total: number;
  unreadCount: number;
};

export const useAdminNotificationsConsole = (page: number, pageSize: number) =>
  useQuery({
    queryKey: adminNotificationsConsoleQueryKey(page, pageSize),
    queryFn: async (): Promise<AdminNotificationsConsolePayload> => {
      const result = await fetchMeNotificationsPage(page, pageSize);
      return {
        notifications: result.data,
        total: result.total,
        unreadCount:
          result.unreadCount ?? result.data.filter((item) => !item.isRead).length,
      };
    },
  });

export const useAdminStaffProfile = (enabled: boolean) =>
  useQuery({
    queryKey: adminStaffProfileQueryKey,
    enabled,
    queryFn: () => fetchAdminStaffProfile(),
  });

export type AdminAuditLogsPayload = {
  data: AuditLogEntry[];
  total: number;
};

export const useAdminAuditLogs = (input: AdminAuditLogsQueryKeyInput) =>
  useQuery({
    queryKey: adminAuditLogsQueryKey(input),
    queryFn: async (): Promise<AdminAuditLogsPayload> => {
      const res = await fetchAdminAuditLogs({
        page: input.page,
        pageSize: input.pageSize,
        action: input.action || undefined,
        entityType: input.entityType || undefined,
        actor: input.actor || undefined,
        from: input.from || undefined,
        to: input.to || undefined,
      });
      return {
        data: res.data,
        total: res.pagination?.total ?? 0,
      };
    },
  });

export const useAdminCommunitiesList = () =>
  useQuery({
    queryKey: adminCommunitiesListQueryKey,
    queryFn: async (): Promise<AdminCommunityListItem[]> => fetchAdminCommunities(),
  });

export const useAdminSocialGroupsCatalog = () =>
  useQuery({
    queryKey: adminSocialGroupsCatalogQueryKey,
    queryFn: async (): Promise<AdminSocialGroupListItem[]> => {
      const all: AdminSocialGroupListItem[] = [];
      let nextPage = 1;
      let catalogTotal = Number.POSITIVE_INFINITY;
      while (all.length < catalogTotal && nextPage <= 50) {
        const res = await fetchAdminSocialGroups({ page: nextPage, pageSize: 100 });
        all.push(...res.data);
        catalogTotal = res.meta.total;
        if (res.data.length === 0) break;
        nextPage += 1;
      }
      return all;
    },
  });

export type AdminContentReportsPayload = {
  data: AdminContentReportEntry[];
  total: number;
};

export const useAdminContentReports = (input: AdminContentReportsQueryKeyInput) =>
  useQuery({
    queryKey: adminContentReportsQueryKey(input),
    queryFn: async (): Promise<AdminContentReportsPayload> => {
      const res = await fetchAdminContentReports({
        page: input.page,
        pageSize: input.pageSize,
        reason: input.reason || undefined,
        targetType: input.targetType || undefined,
        status: input.status || undefined,
        reporter: input.reporter || undefined,
        from: input.from || undefined,
        to: input.to || undefined,
      });
      return {
        data: res.data,
        total: res.pagination?.total ?? 0,
      };
    },
  });

export type AdminInboxSubmissionPreview = {
  id: string;
  kind: string;
  name: string;
  insisted?: { reason: string };
  createdAt?: string;
};

export type AdminInboxDashboardPayload = {
  metrics: AdminMetrics | null;
  recentApps: HostApplication[];
  submissions: AdminInboxSubmissionPreview[];
  pendingPlaces: LocationDTO[];
  pendingAreas: DestinationDTO[];
  reportCount: number;
  safetyCount: number;
};

export const useAdminInboxDashboard = () =>
  useQuery({
    queryKey: adminInboxDashboardQueryKey,
    queryFn: async (): Promise<AdminInboxDashboardPayload> => {
      const [metricsRes, apps, places, areas, subs, reports, amenity, verification] =
        await Promise.all([
          fetchAdminMetrics(),
          fetchAdminOrganisationApplications(1, 20),
          fetchAdminPlacesCatalog(1, 50).catch(() => ({ items: [] as LocationDTO[] })),
          fetchAdminDestinations().catch(() => [] as DestinationDTO[]),
          fetchAdminSubmissions().catch(() => ({ data: [] as AdminInboxSubmissionPreview[] })),
          fetchAdminContentReports({ page: 1, pageSize: 1, status: 'open' }).catch(() => ({
            data: [],
            pagination: { total: 0, page: 1, pageSize: 1, totalPages: 0 },
          })),
          fetchAdminAmenityReports().catch(() => []),
          fetchAdminVerificationDocuments().catch(() => [] as Array<{ status: string }>),
        ]);

      return {
        metrics: metricsRes,
        recentApps: apps.items.filter((a) => a.status === 'pending').slice(0, ADMIN_INBOX_PREVIEW),
        pendingPlaces: places.items.filter((p) => p.status === 'draft').slice(0, ADMIN_INBOX_PREVIEW),
        pendingAreas: areas.filter((a) => a.status === 'draft').slice(0, ADMIN_INBOX_PREVIEW),
        submissions: (subs.data ?? []).slice(0, ADMIN_INBOX_PREVIEW),
        reportCount: reports.pagination?.total ?? 0,
        safetyCount:
          amenity.length +
          verification.filter((d) => d.status === 'pending' || d.status === 'submitted').length,
      };
    },
  });

export type AdminSubmissionsQueueSource = 'suggestion' | 'draft_place' | 'draft_area';

export type AdminSubmissionsQueueRow = {
  id: string;
  source: AdminSubmissionsQueueSource;
  kind: string;
  name: string;
  status: string;
  description?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  images?: string[];
  proposedDestinationName?: string | null;
  facilityType?: string | null;
  candidates?: SubmissionCandidate[];
  insisted?: { reason: string };
  submittedBy?: string;
  seconded?: number;
  region?: string;
  createdAt?: string;
};

export const useAdminSubmissionsQueue = () =>
  useQuery({
    queryKey: adminSubmissionsQueueQueryKey,
    queryFn: async (): Promise<AdminSubmissionsQueueRow[]> => {
      const [subs, places, areas] = await Promise.all([
        fetchAdminSubmissions().catch(() => ({ data: [] as AdminSubmissionDTO[] })),
        fetchAdminPlacesCatalog(1, 100).catch(() => ({ items: [] as LocationDTO[], total: 0 })),
        fetchAdminDestinations().catch(() => [] as DestinationDTO[]),
      ]);

      const suggestionRows: AdminSubmissionsQueueRow[] = subs.data.map((row) => ({
        id: row.id,
        source: 'suggestion',
        kind: row.kind,
        name: row.name || 'Untitled',
        status: row.status,
        description: row.description,
        latitude: row.latitude,
        longitude: row.longitude,
        images: row.images,
        proposedDestinationName: row.proposedDestinationName,
        facilityType: row.facilityType ?? null,
        candidates: row.candidates,
        insisted: row.insisted,
        submittedBy: row.submittedBy,
        seconded: row.seconded,
        createdAt: row.createdAt,
      }));

      const placeItems: LocationDTO[] = [...places.items];
      let placePage = 2;
      let placeTotal = places.total;
      while (placeItems.length < placeTotal && placePage <= 10) {
        const next = await fetchAdminPlacesCatalog(placePage, 100).catch(() => null);
        if (!next || next.items.length === 0) break;
        placeItems.push(...next.items);
        placeTotal = next.total;
        placePage += 1;
      }

      const draftPlaces: AdminSubmissionsQueueRow[] = placeItems
        .filter((p) => p.status === 'draft')
        .map((p) => ({
          id: p.id,
          source: 'draft_place',
          kind: p.activityType ?? 'place',
          name: p.name || 'Untitled place',
          status: 'draft',
          description: p.description || null,
          latitude: p.latitude ?? null,
          longitude: p.longitude ?? null,
          images: p.images ?? [],
          region: p.region || undefined,
          submittedBy: p.registeredByUserId ?? p.submittedById ?? undefined,
        }));

      const draftAreas: AdminSubmissionsQueueRow[] = areas
        .filter((a) => a.status === 'draft')
        .map((a) => ({
          id: a.id,
          source: 'draft_area',
          kind: 'area',
          name: a.name || 'Untitled area',
          status: 'draft',
          description: a.summary ?? null,
          latitude: a.center?.latitude ?? null,
          longitude: a.center?.longitude ?? null,
          images: a.imageUrl ? [a.imageUrl] : [],
          region: a.region || undefined,
          createdAt: a.createdAt,
        }));

      return [...suggestionRows, ...draftPlaces, ...draftAreas];
    },
  });

export const useAdminDestinationsCatalog = () =>
  useQuery({
    queryKey: adminDestinationsCatalogQueryKey,
    queryFn: async (): Promise<DestinationDTO[]> => fetchAdminDestinations(),
  });

export type AdminMembersListPayload = {
  data: UserListDTO[];
  total: number;
};

export const useAdminMembersList = (input: AdminMembersQueryKeyInput) =>
  useQuery({
    queryKey: adminMembersQueryKey(input),
    queryFn: async (): Promise<AdminMembersListPayload> => {
      const res = await fetchAdminMembers({
        role: input.role || undefined,
        userType: input.userType || undefined,
        status: input.status || undefined,
        search: input.search || undefined,
        page: input.page,
        pageSize: input.pageSize,
      });
      return { data: res.data, total: res.total ?? 0 };
    },
  });

export type AdminOrganisationsCatalogPayload = {
  applications: OrganisationApplication[];
  tenants: TenantListDTO[];
};

export const useAdminOrganisationsCatalog = () =>
  useQuery({
    queryKey: adminOrganisationsCatalogQueryKey,
    queryFn: async (): Promise<AdminOrganisationsCatalogPayload> => {
      const applications: OrganisationApplication[] = [];
      const tenants: TenantListDTO[] = [];
      let appsNext = 1;
      let appsCatalogTotal = Number.POSITIVE_INFINITY;
      while (applications.length < appsCatalogTotal && appsNext <= 50) {
        const apps = await fetchAdminOrganisationApplications(appsNext, 100);
        applications.push(...apps.items);
        appsCatalogTotal = apps.total;
        if (apps.items.length === 0) break;
        appsNext += 1;
      }
      let tenantsNext = 1;
      let tenantsCatalogTotal = Number.POSITIVE_INFINITY;
      while (tenants.length < tenantsCatalogTotal && tenantsNext <= 50) {
        const tenantList = await fetchAdminTenants(tenantsNext, 100);
        tenants.push(...tenantList.items);
        tenantsCatalogTotal = tenantList.total;
        if (tenantList.items.length === 0) break;
        tenantsNext += 1;
      }
      return { applications, tenants };
    },
  });

export const useAdminModerationActivitiesCatalog = () =>
  useQuery({
    queryKey: adminModerationActivitiesCatalogQueryKey,
    queryFn: async (): Promise<ActivityDTO[]> => {
      const all: ActivityDTO[] = [];
      let nextPage = 1;
      let catalogTotal = Number.POSITIVE_INFINITY;
      while (all.length < catalogTotal && nextPage <= 50) {
        const list = await fetchAdminModerationActivities(nextPage, 100);
        all.push(...list.items);
        catalogTotal = list.total;
        if (list.items.length === 0) break;
        nextPage += 1;
      }
      return all;
    },
  });

export const useAdminPlacesCatalogAll = (segment: AdminCatalogSegment) =>
  useQuery({
    queryKey: adminPlacesCatalogAllQueryKey(segment),
    queryFn: async (): Promise<PlaceDTO[]> => {
      const all: PlaceDTO[] = [];
      let nextPage = 1;
      let catalogTotal = Number.POSITIVE_INFINITY;
      while (all.length < catalogTotal && nextPage <= 50) {
        const catalog =
          segment === 'facility'
            ? await fetchAdminFacilitiesCatalog(nextPage, 100)
            : await fetchAdminPlacesCatalog(nextPage, 100);
        all.push(...(catalog.items as PlaceDTO[]));
        catalogTotal = catalog.total;
        if (catalog.items.length === 0) break;
        nextPage += 1;
      }
      return all;
    },
  });

export const useAdminTenantDetail = (tenantId: string | null | undefined) =>
  useQuery({
    queryKey: tenantId ? adminTenantDetailQueryKey(tenantId) : ['admin', 'tenant-detail', ''],
    queryFn: async (): Promise<TenantDetail> => fetchAdminTenantDetail(tenantId!),
    enabled: Boolean(tenantId),
  });

export const useAdminGroupDetail = (groupId: string | null | undefined) =>
  useQuery({
    queryKey: groupId ? adminGroupDetailQueryKey(groupId) : ['admin', 'group-detail', ''],
    queryFn: async (): Promise<AdminSocialGroupDetail> => fetchAdminGroupDetail(groupId!),
    enabled: Boolean(groupId),
  });

export const useAdminModerationActivityDetail = (activityId: string | null | undefined) =>
  useQuery({
    queryKey: activityId
      ? adminModerationActivityDetailQueryKey(activityId)
      : ['admin', 'moderation-activity-detail', ''],
    queryFn: async (): Promise<ActivityDTO> => fetchAdminActivityDetail(activityId!),
    enabled: Boolean(activityId),
  });

export type AdminCatalogSubmitterPreview = {
  id: string;
  displayName: string | null;
  ranking: CatalogEditRankingDTO | null;
};

export const useAdminCatalogSubmitterPreview = (submitterId: string | null | undefined) =>
  useQuery({
    queryKey: submitterId
      ? adminCatalogSubmitterPreviewQueryKey(submitterId)
      : ['admin', 'catalog-submitter-preview', ''],
    queryFn: async (): Promise<AdminCatalogSubmitterPreview> => {
      const detail = await fetchAdminMemberDetail(submitterId!);
      const profile = detail.profile as { displayName?: string | null } | null | undefined;
      const ranking = detail.catalogEditRanking as CatalogEditRankingDTO | null | undefined;
      return {
        id: submitterId!,
        displayName: profile?.displayName?.trim() || null,
        ranking: ranking ?? null,
      };
    },
    enabled: Boolean(submitterId),
  });

export const useAdminActivityPreviewVenue = (locationId: string | null | undefined) =>
  useQuery({
    queryKey: locationId
      ? adminActivityPreviewVenueQueryKey(locationId)
      : ['admin', 'activity-preview-venue', ''],
    queryFn: async (): Promise<LocationDTO> => fetchPublicPlaceDetail(locationId!),
    enabled: Boolean(locationId),
  });