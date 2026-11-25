import { useQuery } from '@tanstack/react-query';
import { fetchAdminOrganisationApplications } from './adminConsoleApi';
import { fetchAdminSubmissions } from './geoHierarchyClientApi';
import { fetchAdminAmenityReports, fetchAdminVerificationDocuments } from './adminAlertsClientApi';
import { fetchAdminContentReports } from './adminConsoleApi';
import { adminInboxNavBadgesQueryKey } from './clientQueryKeys';

export type AdminInboxBadges = {
  submissions: number;
  applications: number;
  reports: number;
  safety: number;
};

const empty: AdminInboxBadges = {
  submissions: 0,
  applications: 0,
  reports: 0,
  safety: 0,
};

const fetchAdminInboxNavBadges = async (): Promise<AdminInboxBadges> => {
  const [subs, apps, reports, amenity, verification] = await Promise.all([
    fetchAdminSubmissions().catch(() => ({ data: [] as Array<unknown> })),
    fetchAdminOrganisationApplications(1, 50).catch(() => ({
      items: [] as Array<{ status: string }>,
      total: 0,
    })),
    fetchAdminContentReports({ page: 1, pageSize: 1, status: 'open' }).catch(() => ({
      data: [],
      pagination: { total: 0, page: 1, pageSize: 1, totalPages: 0 },
    })),
    fetchAdminAmenityReports().catch(() => [] as Array<unknown>),
    fetchAdminVerificationDocuments().catch(() => [] as Array<{ status: string }>),
  ]);
  const pendingApps = apps.items.filter((a) => a.status === 'pending').length;
  const openVerification = verification.filter((d) => d.status === 'pending' || d.status === 'submitted').length;
  return {
    submissions: Array.isArray(subs.data) ? subs.data.length : 0,
    applications: pendingApps,
    reports: reports.pagination?.total ?? reports.data.length,
    safety: amenity.length + openVerification,
  };
};

/** Lightweight badge counts for admin nav (best-effort; failures → 0). */
export const useAdminInboxBadges = (): AdminInboxBadges => {
  const { data } = useQuery({
    queryKey: adminInboxNavBadgesQueryKey,
    queryFn: fetchAdminInboxNavBadges,
    placeholderData: empty,
    retry: false,
  });
  return data ?? empty;
};