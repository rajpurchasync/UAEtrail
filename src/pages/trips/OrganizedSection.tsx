import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Plus } from 'lucide-react';
import { ActivityDTO, withdrawReasonLabel } from '@uaetrail/shared-types';
import { api, ActivityRequestView } from '../../api/services';
import { getActiveTenantId } from '../../api/tenant';
import { TenantSwitcher, ShareButton } from '../../components/ui';
import { useActivityFormSession } from '../../context/ActivityFormSessionContext';
import { activityTypeBadgeClass, formatActivityType, resolveActivityOwnerLabel } from '../../utils/activityIdentity';
import { AppSegmented } from '../../components/mobile/AppSegmented';
import { daysUntil, isUpcomingTrip } from '../../utils/tripDates';
import { tripPricingBadge } from '../../utils/tripPricing';

export const OrganizedSection = ({ refreshKey = 0 }: { refreshKey?: number }) => {
  const [tenantId, setTenantId] = useState(getActiveTenantId());
  const [events, setEvents] = useState<ActivityDTO[]>([]);
  const [requests, setRequests] = useState<ActivityRequestView[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [subTab, setSubTab] = useState<'upcoming' | 'past'>('upcoming');
  const [expandedRequests, setExpandedRequests] = useState<string | null>(null);
  const { openCreate, openEdit, setOnSaved } = useActivityFormSession();
  const [confirmCancel, setConfirmCancel] = useState<ActivityDTO | null>(null);

  const loadEvents = async (tid: string) => {
    if (!tid) return;
    try {
      const res = await api.listHostActivities(tid);
      setEvents(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
    }
  };

  const loadRequests = async (tid: string) => {
    if (!tid) return;
    try {
      const res = await api.getOrganizerRequests(tid);
      setRequests(res.data);
    } catch {
      /* non-critical */
    }
  };

  useEffect(() => {
    loadEvents(tenantId);
    loadRequests(tenantId);
  }, [tenantId, refreshKey]);

  const upcoming = events.filter((e) => isUpcomingTrip(e));
  const past = events.filter((e) => !isUpcomingTrip(e));
  const displayed = subTab === 'upcoming' ? upcoming : past;

  const openCreateActivity = () => {
    openCreate({ tenantId });
  };

  const openEditActivity = (event: ActivityDTO) => {
    openEdit(event, { tenantId });
  };

  useEffect(() => {
    setOnSaved(() => () => void reload());
    return () => setOnSaved(null);
  }, [tenantId, setOnSaved]);

  const reload = async () => {
    await loadEvents(tenantId);
    await loadRequests(tenantId);
  };

  const publish = async (activityId: string) => {
    if (!tenantId) return;
    try {
      await api.publishHostActivity(tenantId, activityId);
      await loadEvents(tenantId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish event');
    }
  };

  const cancelEvent = async () => {
    if (!tenantId || !confirmCancel) return;
    try {
      await api.cancelOrganizerEvent(tenantId, confirmCancel.id);
      setConfirmCancel(null);
      await loadEvents(tenantId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel event');
      setConfirmCancel(null);
    }
  };

  const approveRequest = async (requestId: string) => {
    if (!tenantId) return;
    try {
      await api.decideOrganizerRequest(tenantId, requestId, 'approved');
      await loadRequests(tenantId);
      await loadEvents(tenantId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve request');
    }
  };

  const rejectRequest = async (requestId: string) => {
    if (!tenantId) return;
    try {
      await api.decideOrganizerRequest(tenantId, requestId, 'rejected');
      await loadRequests(tenantId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject request');
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700',
      published: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      suspended: 'bg-orange-100 text-orange-800',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[status] ?? 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const eventRequests = (activityId: string) => requests.filter((r) => r.activity.id === activityId && r.status === 'pending');
  const cancelledEventRequests = (activityId: string) =>
    requests.filter((r) => r.activity.id === activityId && r.status === 'cancelled' && r.cancelReason);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      <TenantSwitcher onChange={setTenantId} />
      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Header with create button */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={openCreateActivity}
          className="app-cta-sm shrink-0"
          disabled={!tenantId}
        >
          <Plus className="w-3.5 h-3.5" />
          Add Activity
        </button>
        <AppSegmented
          segments={[
            { key: 'upcoming', label: `Upcoming (${upcoming.length})` },
            { key: 'past', label: `Past (${past.length})` },
          ]}
          value={subTab}
          onChange={setSubTab}
        />
      </div>

      {/* Event cards */}
      <div className="space-y-3">
        {displayed.map((event) => {
          const pending = eventRequests(event.id);
          const cancelled = cancelledEventRequests(event.id);
          const expanded = expandedRequests === event.id;
          const pricingBadge = tripPricingBadge(event);
          return (
            <div key={event.id} className="bg-white border rounded-lg overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{event.title || '—'}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Venue: {event.locationName}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {event.date} at {event.time}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Owner: {resolveActivityOwnerLabel(event)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {statusBadge(event.status)}
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${activityTypeBadgeClass(event.activityType)}`}
                    >
                      {formatActivityType(event.activityType)}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                  <span>
                    {event.slotsTotal - event.slotsAvailable}/{event.slotsTotal} slots filled
                  </span>
                  <span className={`px-2 py-0.5 rounded-full font-medium ${pricingBadge.bg} ${pricingBadge.text}`}>
                    {pricingBadge.label}
                  </span>
                  {isUpcomingTrip(event) && <span className="text-emerald-600 font-medium">{daysUntil(event.date)}</span>}
                </div>

                {/* Actions */}
                <div className="mt-3 pt-3 border-t flex flex-wrap items-center gap-2">
                  {event.status === 'draft' && (
                    <>
                      <button
                        onClick={() => openEditActivity(event)}
                        className="px-3 py-1.5 rounded bg-blue-100 text-blue-800 hover:bg-blue-200 text-xs font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => publish(event.id)}
                        className="px-3 py-1.5 rounded bg-emerald-100 text-emerald-800 hover:bg-emerald-200 text-xs font-medium"
                      >
                        Publish
                      </button>
                    </>
                  )}
                  {event.status === 'published' && (
                    <>
                      <button
                        onClick={() => openEditActivity(event)}
                        className="px-3 py-1.5 rounded bg-blue-100 text-blue-800 hover:bg-blue-200 text-xs font-medium"
                      >
                        Edit
                      </button>
                      <ShareButton
                        title={event.title || event.locationName}
                        text={`${event.date} · Share this ${event.activityType} trip`}
                        path={`/trip/${event.id}`}
                        iconOnly
                        light
                      />
                      <button
                        onClick={() => setConfirmCancel(event)}
                        className="px-3 py-1.5 rounded bg-red-100 text-red-700 hover:bg-red-200 text-xs font-medium"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  <Link
                    to={`/trip/${event.id}`}
                    className="ml-auto text-emerald-700 text-xs hover:text-emerald-900 inline-flex items-center gap-0.5"
                  >
                    View <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {/* Pending join requests toggle */}
              {pending.length > 0 && (
                <div className="border-t">
                  <button
                    onClick={() => setExpandedRequests(expanded ? null : event.id)}
                    className="w-full px-4 py-2 bg-amber-50 text-amber-800 text-xs font-medium flex items-center justify-between hover:bg-amber-100 transition-colors"
                  >
                    <span>{pending.length} pending join request{pending.length > 1 ? 's' : ''}</span>
                    <ChevronRight className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`} />
                  </button>
                  {expanded && (
                    <div className="px-4 py-3 bg-gray-50 space-y-2">
                      {pending.map((r) => (
                        <div key={r.id} className="flex items-center justify-between bg-white border rounded-lg px-3 py-2">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{r.user?.displayName || r.user?.email}</p>
                            {r.note && <p className="text-xs text-gray-500 mt-0.5">{r.note}</p>}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => approveRequest(r.id)}
                              className="px-3 py-1 rounded bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => rejectRequest(r.id)}
                              className="px-3 py-1 rounded bg-gray-200 text-gray-700 text-xs font-medium hover:bg-gray-300"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                      {cancelled.length > 0 && (
                        <div className="pt-2 border-t border-gray-200">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                            Recent cancellations
                          </p>
                          <div className="space-y-2">
                            {cancelled.map((r) => (
                              <div key={r.id} className="bg-white border border-red-100 rounded-lg px-3 py-2">
                                <p className="text-sm font-medium text-gray-900">
                                  {r.user?.displayName || r.user?.email}
                                </p>
                                <p className="text-xs text-red-700 mt-0.5">
                                  {withdrawReasonLabel(r.cancelReason!)}
                                </p>
                                {r.cancelMessage && (
                                  <p className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">{r.cancelMessage}</p>
                                )}
                                {r.cancelledAt && (
                                  <p className="text-[11px] text-gray-400 mt-1">
                                    {new Date(r.cancelledAt).toLocaleString()}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              {pending.length === 0 && cancelled.length > 0 && (
                <div className="border-t px-4 py-3 bg-red-50/60">
                  <p className="text-xs font-semibold uppercase tracking-wide text-red-700 mb-2">
                    Recent cancellations
                  </p>
                  <div className="space-y-2">
                    {cancelled.map((r) => (
                      <div key={r.id} className="bg-white border border-red-100 rounded-lg px-3 py-2">
                        <p className="text-sm font-medium text-gray-900">
                          {r.user?.displayName || r.user?.email}
                        </p>
                        <p className="text-xs text-red-700 mt-0.5">{withdrawReasonLabel(r.cancelReason!)}</p>
                        {r.cancelMessage && (
                          <p className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">{r.cancelMessage}</p>
                        )}
                        {r.cancelledAt && (
                          <p className="text-[11px] text-gray-400 mt-1">
                            {new Date(r.cancelledAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {displayed.length === 0 && (
          <div className="bg-white border rounded-lg p-8 text-center">
            <p className="text-sm text-gray-500 mb-2">
              {subTab === 'upcoming' ? 'No upcoming organized events' : 'No past organized events'}
            </p>
            {subTab === 'upcoming' && tenantId && (
              <button onClick={openCreateActivity} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                + Add your first event
              </button>
            )}
          </div>
        )}
      </div>

      {/* Cancel confirmation */}
      {confirmCancel && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setConfirmCancel(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Cancel Event?</h3>
            <p className="text-sm text-gray-600 mb-1">
              This will cancel the event and notify all registered participants. This action cannot be undone.
            </p>
            <p className="text-sm font-medium text-gray-900 mb-4">
              {confirmCancel.title || confirmCancel.locationName}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmCancel(null)}
                className="px-4 py-2 border rounded-md text-sm text-gray-700 hover:bg-gray-50"
              >
                Keep Event
              </button>
              <button
                onClick={cancelEvent}
                className="px-4 py-2 rounded-md text-sm text-white bg-red-600 hover:bg-red-700"
              >
                Cancel Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

