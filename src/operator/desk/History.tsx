import { formatExploreEventDateLabel } from '@uaetrail/shared-types';
import { ConsoleShell } from './ConsoleShell';
import { usePublishingActivityHistory } from '../../hooks/publishingWorkspaceQueries';
import { formatActivityType } from '../../utils/activityIdentity';
import { getActiveTenantId } from '../../api/tenant';
import { LoadingRing } from '../../components/ui/loadingPrimitives';

export const History = () => {
  const tenantId = getActiveTenantId() ?? '';
  const historyQuery = usePublishingActivityHistory(tenantId || null, Boolean(tenantId));
  const events = historyQuery.data ?? [];
  const loading = Boolean(tenantId) && historyQuery.isLoading && !historyQuery.data;
  const error = !tenantId
    ? 'No tenant selected. Please select a tenant first.'
    : historyQuery.error instanceof Error
      ? historyQuery.error.message
      : historyQuery.error
        ? 'Failed to load history'
        : null;

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      published: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      draft: 'bg-gray-100 text-gray-800',
      suspended: 'bg-orange-100 text-orange-800',
    };
    return (
      <span
        className={`px-2 py-0.5 rounded text-xs font-medium ${colors[status] ?? 'bg-gray-100 text-gray-800'}`}
      >
        {status}
      </span>
    );
  };

  return (
    <ConsoleShell title="History">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Past Events</h2>

      {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}

      <div className="overflow-x-auto rounded-lg border bg-white desktop-scrollbar-x">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">Activity</th>
              <th className="px-4 py-3 text-left">Place</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Participants</th>
              <th className="px-4 py-3 text-left">Check-in Rate</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  <div className="flex justify-center" role="status" aria-label="Loading">
                    <LoadingRing size="md" />
                  </div>
                </td>
              </tr>
            ) : events.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No past events
                </td>
              </tr>
            ) : (
              events.map((e) => {
                const rate =
                  e.participantCount > 0
                    ? Math.round((e.checkedInCount / e.participantCount) * 100)
                    : 0;
                return (
                  <tr key={e.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{e.title}</p>
                      <p className="text-xs text-gray-500">{formatActivityType(e.activityType)}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{e.locationName}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatExploreEventDateLabel(e.startAt) ?? ''}
                    </td>
                    <td className="px-4 py-3">{statusBadge(e.status)}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {e.participantCount}/{e.capacity}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 rounded-full bg-gray-200">
                          <div
                            className="h-2 rounded-full bg-emerald-500"
                            style={{ width: `${rate}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">
                          {e.checkedInCount}/{e.participantCount}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </ConsoleShell>
  );
};
