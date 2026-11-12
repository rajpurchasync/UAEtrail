import { useState } from 'react';
import { useSafeAsyncEffect } from './useSafeAsyncEffect';
import { fetchAdminOrganisationApplications } from './adminConsoleApi';
import { fetchAdminSubmissions } from './geoHierarchyClientApi';
import { fetchAdminAmenityReports, fetchAdminVerificationDocuments } from './adminAlertsClientApi';
import { fetchAdminContentReports } from './adminConsoleApi';

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

/** Lightweight badge counts for admin nav (best-effort; failures → 0). */
export const useAdminInboxBadges = (): AdminInboxBadges => {
  const [badges, setBadges] = useState<AdminInboxBadges>(empty);

  useSafeAsyncEffect(async (isActive) => {
    try {
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
      if (!isActive()) return;
      const pendingApps = apps.items.filter((a) => a.status === 'pending').length;
      const openVerification = verification.filter((d) => d.status === 'pending' || d.status === 'submitted').length;
      setBadges({
        submissions: Array.isArray(subs.data) ? subs.data.length : 0,
        applications: pendingApps,
        reports: reports.pagination?.total ?? reports.data.length,
        safety: amenity.length + openVerification,
      });
    } catch {
      if (isActive()) setBadges(empty);
    }
  }, []);

  return badges;
};
