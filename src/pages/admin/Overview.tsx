import { Children, useState, type ReactNode } from 'react';
import { useSafeAsyncEffect } from '../../hooks/useSafeAsyncEffect';
import { Link } from 'react-router-dom';
import type { ActivityDTO, AreaDTO, LocationDTO } from '@uaetrail/shared-types';
import type { AdminMetrics, HostApplication } from '../../api/types';
import {
  fetchAdminAreas,
  fetchAdminMetrics,
  fetchAdminModerationActivities,
  fetchAdminOrganisationApplications,
  fetchAdminPlacesCatalog,
} from '../../hooks/adminConsoleApi';
import { DashboardLayout } from '../../components/layout';
import {
  ADMIN_ACTIVITIES_PATH,
  ADMIN_AREAS_PATH,
  ADMIN_HOSTS_PATH,
  ADMIN_LINKS,
  ADMIN_PLACES_PATH,
  ADMIN_USERS_PATH,
} from '../../config/routingCatalog';
import { CalendarDays, FileWarning, MapPin, MapPinned } from 'lucide-react';
import { formatAdminDate } from '../../utils/formatAdminDate';

const PENDING_PREVIEW = 5;

export const Overview = () => {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [recentApps, setRecentApps] = useState<HostApplication[]>([]);
  const [pendingActivities, setPendingActivities] = useState<ActivityDTO[]>([]);
  const [pendingPlaces, setPendingPlaces] = useState<LocationDTO[]>([]);
  const [pendingAreas, setPendingAreas] = useState<AreaDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async (isActive: () => boolean = () => true) => {
    setLoading(true);
    setError(null);
    try {
      const [metrics, apps, activities, places, areas] = await Promise.all([
        fetchAdminMetrics(),
        fetchAdminOrganisationApplications(1, 20),
        fetchAdminModerationActivities(1, 50).catch(() => ({ items: [] as ActivityDTO[] })),
        fetchAdminPlacesCatalog(1, 50).catch(() => ({ items: [] as LocationDTO[] })),
        fetchAdminAreas().catch(() => [] as AreaDTO[]),
      ]);
      if (!isActive()) return;
      setMetrics(metrics);
      setRecentApps(apps.items.filter((a) => a.status === 'pending').slice(0, PENDING_PREVIEW));
      setPendingActivities(activities.items.filter((a) => a.status === 'draft').slice(0, PENDING_PREVIEW));
      setPendingPlaces(places.items.filter((p) => p.status === 'draft').slice(0, PENDING_PREVIEW));
      setPendingAreas(areas.filter((a) => a.status === 'draft').slice(0, PENDING_PREVIEW));
    } catch (err) {
      if (!isActive()) return;
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
    } finally {
      if (isActive()) setLoading(false);
    }
  };

  useSafeAsyncEffect((isActive) => loadData(isActive), []);

  const metricCards = [
    { label: 'Pending host applications', value: metrics?.pendingApplications ?? '-', color: 'bg-amber-50 text-amber-800', icon: '📝', link: ADMIN_HOSTS_PATH },
    { label: 'Total places', value: metrics?.totalLocations ?? '-', color: 'bg-teal-50 text-teal-700', icon: '📍' },
    { label: 'Manage users', value: metrics?.totalUsers ?? '-', color: 'bg-blue-50 text-blue-700', icon: '👥', link: ADMIN_USERS_PATH },
    { label: 'Active activities', value: metrics?.activeActivities ?? '-', color: 'bg-emerald-50 text-emerald-700', icon: '🥾' }
  ];

  if (loading) {
    return (
      <DashboardLayout title="Admin Dashboard" links={ADMIN_LINKS}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg p-4 bg-gray-100 animate-pulse h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-100 animate-pulse rounded-lg h-64" />
          <div className="bg-gray-100 animate-pulse rounded-lg h-64" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Admin Dashboard" links={ADMIN_LINKS}>
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Platform Overview</h2>
        <button onClick={() => void loadData()} className="text-sm px-3 py-1.5 border rounded-lg hover:bg-gray-50 text-gray-600 flex items-center gap-1.5">
          ↻ Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {metricCards.map((card) => {
          const content = (
            <div className={`rounded-xl p-5 ${card.color} ${card.link ? 'hover:opacity-95 transition-opacity' : ''}`}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium opacity-80">{card.label}</p>
                <span className="text-xl">{card.icon}</span>
              </div>
              <p className="text-3xl font-bold mt-2">{card.value}</p>
            </div>
          );
          return card.link ? (
            <Link key={card.label} to={card.link}>
              {content}
            </Link>
          ) : (
            <div key={card.label}>{content}</div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PendingQueueCard
          title="Pending applications"
          viewAllTo={ADMIN_HOSTS_PATH}
          icon={<FileWarning className="h-4 w-4" aria-hidden />}
          iconClass="bg-amber-100 text-amber-800"
          empty="No pending applications"
        >
          {recentApps.map((a) => (
            <Link key={a.id} to={ADMIN_HOSTS_PATH} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
              <div>
                <p className="text-sm font-medium text-gray-900">{a.metadata?.hostDisplayName || a.applicantName}</p>
                <p className="text-xs text-gray-500">{a.requestedName} ({a.requestedType})</p>
              </div>
              <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-xs font-medium">Pending</span>
            </Link>
          ))}
        </PendingQueueCard>

        <PendingQueueCard
          title="Pending activities"
          viewAllTo={ADMIN_ACTIVITIES_PATH}
          icon={<CalendarDays className="h-4 w-4" aria-hidden />}
          iconClass="bg-emerald-100 text-emerald-800"
          empty="No activities waiting for approval"
        >
          {pendingActivities.map((activity) => (
            <Link key={activity.id} to={ADMIN_ACTIVITIES_PATH} className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50">
              {activity.images?.[0] ? (
                <img src={activity.images[0]} alt="" className="h-10 w-10 rounded-lg object-cover shrink-0" />
              ) : (
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-lg shrink-0">🥾</span>
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{activity.title || activity.locationName}</p>
                <p className="text-xs text-gray-500">{activity.locationName} · {formatAdminDate(activity.date)}</p>
              </div>
            </Link>
          ))}
        </PendingQueueCard>

        <PendingQueueCard
          title="Pending places"
          viewAllTo={ADMIN_PLACES_PATH}
          icon={<MapPin className="h-4 w-4" aria-hidden />}
          iconClass="bg-teal-100 text-teal-800"
          empty="No places waiting for approval"
        >
          {pendingPlaces.map((place) => (
            <Link key={place.id} to={ADMIN_PLACES_PATH} className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50">
              {place.images?.[0] ? (
                <img src={place.images[0]} alt="" className="h-10 w-10 rounded-lg object-cover shrink-0" />
              ) : (
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-lg shrink-0">📍</span>
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{place.name}</p>
                <p className="text-xs text-gray-500">{place.region}</p>
              </div>
            </Link>
          ))}
        </PendingQueueCard>

        <PendingQueueCard
          title="Pending areas"
          viewAllTo={ADMIN_AREAS_PATH}
          icon={<MapPinned className="h-4 w-4" aria-hidden />}
          iconClass="bg-sky-100 text-sky-800"
          empty="No areas waiting for approval"
        >
          {pendingAreas.map((area) => (
            <Link key={area.id} to={ADMIN_AREAS_PATH} className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50">
              {area.imageUrl ? (
                <img src={area.imageUrl} alt="" className="h-10 w-10 rounded-lg object-cover shrink-0" />
              ) : (
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-lg shrink-0">🗺️</span>
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{area.name}</p>
                <p className="text-xs text-gray-500">{area.region}</p>
              </div>
            </Link>
          ))}
        </PendingQueueCard>
      </div>
    </DashboardLayout>
  );
};

const PendingQueueCard = ({
  title,
  viewAllTo,
  icon,
  iconClass,
  empty,
  children,
}: {
  title: string;
  viewAllTo: string;
  icon: ReactNode;
  iconClass: string;
  empty: string;
  children: ReactNode;
}) => {
  const hasItems = Children.count(children) > 0;
  return (
    <div className="bg-white border rounded-lg">
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${iconClass}`}>
            {icon}
          </span>
          {title}
        </h3>
        <Link to={viewAllTo} className="text-xs text-emerald-600 hover:text-emerald-700">View All</Link>
      </div>
      <div className="divide-y">
        {hasItems ? children : <p className="px-4 py-6 text-sm text-gray-500 text-center">{empty}</p>}
      </div>
    </div>
  );
};
