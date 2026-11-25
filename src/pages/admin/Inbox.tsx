import { useState } from 'react';
import { useSafeAsyncEffect } from '../../hooks/useSafeAsyncEffect';
import { Link } from 'react-router-dom';
import type { AreaDTO, LocationDTO } from '@uaetrail/shared-types';
import type { AdminMetrics, HostApplication } from '../../api/types';
import {
  fetchAdminDestinations,
  fetchAdminMetrics,
  fetchAdminOrganisationApplications,
  fetchAdminPlacesCatalog,
} from '../../hooks/adminConsoleApi';
import { fetchAdminSubmissions } from '../../hooks/geoHierarchyClientApi';
import { fetchAdminAmenityReports, fetchAdminVerificationDocuments } from '../../hooks/adminAlertsClientApi';
import { fetchAdminContentReports } from '../../hooks/adminConsoleApi';
import { DashboardLayout } from '../../components/layout';
import { ADMIN_LINKS } from '../../constants';
import {
  ADMIN_ALERTS_PATH,
  ADMIN_DESTINATIONS_PATH,
  ADMIN_HOSTS_PATH,
  ADMIN_INBOX_SUBMISSIONS_PATH,
  ADMIN_REPORTS_PATH,
  ADMIN_USERS_PATH,
} from '../../config/adminSurfacePaths';
import { ADMIN_PLACES_PATH } from '../../config/surfacePaths';
import { AdminQueueCard } from '../../components/admin/AdminQueueCard';
import { Briefcase, Flag, MapPin, MapPinned, ShieldAlert } from 'lucide-react';
import { formatAdminDate } from '../../utils/formatAdminDate';

type SubmissionRow = {
  id: string;
  kind: string;
  name: string;
  insisted?: { reason: string };
  createdAt?: string;
};

const PENDING_PREVIEW = 5;

/** Admin home — real intervention queues only (no draft-outing false positives). */
export const Inbox = () => {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [recentApps, setRecentApps] = useState<HostApplication[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [pendingPlaces, setPendingPlaces] = useState<LocationDTO[]>([]);
  const [pendingAreas, setPendingAreas] = useState<AreaDTO[]>([]);
  const [reportCount, setReportCount] = useState(0);
  const [safetyCount, setSafetyCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async (isActive: () => boolean = () => true) => {
    setLoading(true);
    setError(null);
    try {
      const [metricsRes, apps, places, areas, subs, reports, amenity, verification] = await Promise.all([
        fetchAdminMetrics(),
        fetchAdminOrganisationApplications(1, 20),
        fetchAdminPlacesCatalog(1, 50).catch(() => ({ items: [] as LocationDTO[] })),
        fetchAdminDestinations().catch(() => [] as AreaDTO[]),
        fetchAdminSubmissions().catch(() => ({ data: [] as SubmissionRow[] })),
        fetchAdminContentReports({ page: 1, pageSize: 1, status: 'open' }).catch(() => ({
          data: [],
          pagination: { total: 0, page: 1, pageSize: 1, totalPages: 0 },
        })),
        fetchAdminAmenityReports().catch(() => []),
        fetchAdminVerificationDocuments().catch(() => [] as Array<{ status: string }>),
      ]);
      if (!isActive()) return;
      setMetrics(metricsRes);
      setRecentApps(apps.items.filter((a) => a.status === 'pending').slice(0, PENDING_PREVIEW));
      setPendingPlaces(places.items.filter((p) => p.status === 'draft').slice(0, PENDING_PREVIEW));
      setPendingAreas(areas.filter((a) => a.status === 'draft').slice(0, PENDING_PREVIEW));
      setSubmissions((subs.data ?? []).slice(0, PENDING_PREVIEW));
      setReportCount(reports.pagination?.total ?? 0);
      setSafetyCount(
        amenity.length +
          verification.filter((d) => d.status === 'pending' || d.status === 'submitted').length
      );
    } catch (err) {
      if (!isActive()) return;
      setError(err instanceof Error ? err.message : 'Failed to load inbox');
    } finally {
      if (isActive()) setLoading(false);
    }
  };

  useSafeAsyncEffect((isActive) => loadData(isActive), []);

  const metricCards = [
    {
      label: 'Operator applications',
      value: metrics?.pendingApplications ?? recentApps.length,
      to: ADMIN_HOSTS_PATH,
      tone: 'bg-amber-50 text-amber-900',
    },
    {
      label: 'Map submissions',
      value: submissions.length,
      to: ADMIN_INBOX_SUBMISSIONS_PATH,
      tone: 'bg-teal-50 text-teal-900',
    },
    {
      label: 'Open reports',
      value: reportCount,
      to: ADMIN_REPORTS_PATH,
      tone: 'bg-rose-50 text-rose-900',
    },
    {
      label: 'Safety queue',
      value: safetyCount,
      to: ADMIN_ALERTS_PATH,
      tone: 'bg-orange-50 text-orange-900',
    },
  ];

  if (loading) {
    return (
      <DashboardLayout title="Inbox" links={ADMIN_LINKS}>
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-neutral-100" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="h-64 animate-pulse rounded-2xl bg-neutral-100" />
          <div className="h-64 animate-pulse rounded-2xl bg-neutral-100" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Inbox" links={ADMIN_LINKS}>
      {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Needs your attention</h2>
          <p className="text-sm text-neutral-500">Queues that block members or affect map trust.</p>
        </div>
        <button
          type="button"
          onClick={() => void loadData()}
          className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-50"
        >
          Refresh
        </button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {metricCards.map((card) => (
          <Link
            key={card.label}
            to={card.to}
            className={`rounded-2xl p-4 transition-opacity hover:opacity-95 ${card.tone}`}
          >
            <p className="text-xs font-medium opacity-80">{card.label}</p>
            <p className="mt-2 text-3xl font-bold tabular-nums">{card.value}</p>
          </Link>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-2 text-xs text-neutral-500">
        <Link to={ADMIN_USERS_PATH} className="rounded-full border border-neutral-200 bg-white px-3 py-1 hover:border-emerald-200">
          Members · {metrics?.totalUsers ?? '—'}
        </Link>
        <Link to={ADMIN_PLACES_PATH} className="rounded-full border border-neutral-200 bg-white px-3 py-1 hover:border-emerald-200">
          Places · {metrics?.totalLocations ?? '—'}
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <AdminQueueCard
          title="Operator applications"
          viewAllTo={ADMIN_HOSTS_PATH}
          icon={<Briefcase className="h-4 w-4" aria-hidden />}
          iconClassName="bg-amber-100 text-amber-800"
          empty="No pending operator applications"
          count={recentApps.length}
        >
          {recentApps.map((a) => (
            <Link
              key={a.id}
              to={ADMIN_HOSTS_PATH}
              className="flex items-center justify-between px-4 py-3 hover:bg-neutral-50"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-neutral-900">
                  {a.metadata?.hostDisplayName || a.applicantName}
                </p>
                <p className="text-xs text-neutral-500">
                  {a.requestedName} ({a.requestedType})
                </p>
              </div>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                Pending
              </span>
            </Link>
          ))}
        </AdminQueueCard>

        <AdminQueueCard
          title="Map submissions"
          viewAllTo={ADMIN_INBOX_SUBMISSIONS_PATH}
          icon={<MapPin className="h-4 w-4" aria-hidden />}
          iconClassName="bg-teal-100 text-teal-800"
          empty="No map suggestions waiting"
          count={submissions.length}
        >
          {submissions.map((row) => (
            <Link
              key={row.id}
              to={`${ADMIN_INBOX_SUBMISSIONS_PATH}?id=${encodeURIComponent(row.id)}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-neutral-50"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-neutral-900">{row.name || 'Untitled'}</p>
                <p className="text-xs text-neutral-500">
                  {row.kind}
                  {row.insisted?.reason ? ` · ${row.insisted.reason}` : ''}
                </p>
              </div>
              {row.createdAt ? (
                <span className="text-xs text-neutral-400">{formatAdminDate(row.createdAt)}</span>
              ) : null}
            </Link>
          ))}
        </AdminQueueCard>

        <AdminQueueCard
          title="Draft places"
          viewAllTo={ADMIN_PLACES_PATH}
          icon={<MapPin className="h-4 w-4" aria-hidden />}
          iconClassName="bg-sky-100 text-sky-800"
          empty="No draft places"
        >
          {pendingPlaces.map((place) => (
            <Link
              key={place.id}
              to={ADMIN_PLACES_PATH}
              className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-50"
            >
              {place.images?.[0] ? (
                <img src={place.images[0]} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
              ) : (
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sm">
                  Place
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-neutral-900">{place.name}</p>
                <p className="text-xs text-neutral-500">{place.region}</p>
              </div>
            </Link>
          ))}
        </AdminQueueCard>

        <AdminQueueCard
          title="Draft areas"
          viewAllTo={ADMIN_DESTINATIONS_PATH}
          icon={<MapPinned className="h-4 w-4" aria-hidden />}
          iconClassName="bg-indigo-100 text-indigo-800"
          empty="No draft areas"
        >
          {pendingAreas.map((area) => (
            <Link
              key={area.id}
              to={ADMIN_DESTINATIONS_PATH}
              className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-50"
            >
              {area.imageUrl ? (
                <img src={area.imageUrl} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
              ) : (
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-sm">
                  Area
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-neutral-900">{area.name}</p>
                <p className="text-xs text-neutral-500">{area.region}</p>
              </div>
            </Link>
          ))}
        </AdminQueueCard>

        <AdminQueueCard
          title="Reports & safety"
          viewAllTo={ADMIN_REPORTS_PATH}
          icon={<Flag className="h-4 w-4" aria-hidden />}
          iconClassName="bg-rose-100 text-rose-800"
          empty="Nothing in safety queues"
        >
          {reportCount > 0 ? (
            <Link to={ADMIN_REPORTS_PATH} className="flex items-center justify-between px-4 py-3 hover:bg-neutral-50">
              <span className="text-sm font-medium text-neutral-900">Open content reports</span>
              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-800">
                {reportCount}
              </span>
            </Link>
          ) : null}
          {safetyCount > 0 ? (
            <Link to={ADMIN_ALERTS_PATH} className="flex items-center justify-between px-4 py-3 hover:bg-neutral-50">
              <span className="flex items-center gap-2 text-sm font-medium text-neutral-900">
                <ShieldAlert className="h-4 w-4" aria-hidden />
                Amenity & verification
              </span>
              <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-800">
                {safetyCount}
              </span>
            </Link>
          ) : null}
        </AdminQueueCard>
      </div>
    </DashboardLayout>
  );
};
