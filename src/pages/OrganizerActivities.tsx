import { useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { ActivityDTO, ParticipantDTO } from '@uaetrail/shared-types';
import { api } from '../api/services';
import { getActiveTenantId } from '../api/tenant';
import { parseActivityTypeParam } from '../components/activities';
import { useActivityFormSession } from '../context/ActivityFormSessionContext';
import { OrganizerShell } from '../components/organizer/OrganizerShell';
import { TenantSwitcher, ShareButton, SecureAvatar } from '../components/ui';
import { ORGANIZER_ACTIVITIES_NEW_PATH } from '../constants';
import {
  activityTypeBadgeClass,
  formatActivityType,
  resolveActivityOwnerLabel,
} from '../utils/activityIdentity';

type ViewMode = 'list' | 'checkin';

export const OrganizerActivities = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [tenantId, setTenantId] = useState(getActiveTenantId());
  const [events, setEvents] = useState<ActivityDTO[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { openCreate, openEdit, setOnSaved } = useActivityFormSession();
  const [confirmCancel, setConfirmCancel] = useState<ActivityDTO | null>(null);

  // Check-in state
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [checkinActivityId, setCheckinActivityId] = useState<string | null>(null);
  const [checkinActivityTitle, setCheckinActivityTitle] = useState('');
  const [participants, setParticipants] = useState<ParticipantDTO[]>([]);
  const [checkinLoading, setCheckinLoading] = useState(false);

  const loadEvents = async (tid: string) => {
    if (!tid) return;
    try {
      const res = await api.listHostActivities(tid);
      setEvents(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
    }
  };

  useEffect(() => {
    loadEvents(tenantId);
  }, [tenantId]);

  const openCreateActivity = () => {
    openCreate({ tenantId });
  };

  useEffect(() => {
    setOnSaved(() => () => void loadEvents(tenantId));
    return () => setOnSaved(null);
  }, [tenantId, setOnSaved]);

  useEffect(() => {
    if (location.pathname === ORGANIZER_ACTIVITIES_NEW_PATH) {
      openCreate({
        tenantId,
        initialActivityType: parseActivityTypeParam(searchParams.get('type')),
      });
    }
  }, [location.pathname, searchParams, tenantId, openCreate]);

  const openEditActivity = (event: ActivityDTO) => {
    openEdit(event, { tenantId });
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

  // Check-in functions
  const openCheckin = async (event: ActivityDTO) => {
    if (!tenantId) return;
    setCheckinActivityId(event.id);
    setCheckinActivityTitle(event.locationName);
    setCheckinLoading(true);
    setViewMode('checkin');
    try {
      const res = await api.getEventParticipants(tenantId, event.id);
      setParticipants(res.data.participants ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load participants');
      setParticipants([]);
    } finally {
      setCheckinLoading(false);
    }
  };

  const toggleCheckin = async (participant: ParticipantDTO) => {
    if (!tenantId || !checkinActivityId) return;
    try {
      if (participant.checkedInAt) {
        await api.undoCheckin(tenantId, checkinActivityId, participant.id);
      } else {
        await api.checkinParticipant(tenantId, checkinActivityId, participant.id);
      }
      // Refresh participants
      const res = await api.getEventParticipants(tenantId, checkinActivityId);
      setParticipants(res.data.participants ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update check-in');
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700',
      published: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      suspended: 'bg-orange-100 text-orange-800'
    };
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[status] ?? 'bg-gray-100 text-gray-800'}`}>{status}</span>;
  };

  const checkedInCount = participants.filter((p) => p.checkedInAt).length;

  return (
    <OrganizerShell title="Activities">
      <div className="space-y-4">
        <TenantSwitcher onChange={setTenantId} />
        {error && <p className="text-sm text-red-600">{error}</p>}

        {viewMode === 'list' ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Activities</h2>
              <button onClick={openCreateActivity} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium" disabled={!tenantId}>
                + Add Activity
              </button>
            </div>

            {/* Events Table */}
            <div className="bg-white border rounded-lg overflow-x-auto desktop-scrollbar-x">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">Activity</th>
                    <th className="px-4 py-3 text-left">Activity Type</th>
                    <th className="px-4 py-3 text-left">Owner</th>
                    <th className="px-4 py-3 text-left">Venue</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-center">Capacity</th>
                    <th className="px-4 py-3 text-center">Price</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{event.title || '—'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${activityTypeBadgeClass(event.activityType)}`}
                        >
                          {formatActivityType(event.activityType)}
                        </span>
                      </td>
                      <td className="px-4 py-3">{resolveActivityOwnerLabel(event)}</td>
                      <td className="px-4 py-3">{event.locationName}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p>{event.date}</p>
                        <p className="text-xs text-gray-500">{event.time}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span>{event.slotsTotal - event.slotsAvailable}</span>
                        <span className="text-gray-400">/{event.slotsTotal}</span>
                      </td>
                      <td className="px-4 py-3 text-center">{event.price > 0 ? `AED ${event.price}` : 'Free'}</td>
                      <td className="px-4 py-3">{statusBadge(event.status)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {event.status === 'draft' && (
                            <>
                              <button onClick={() => openEditActivity(event)}
                                className="px-2 py-1 rounded bg-blue-100 text-blue-800 hover:bg-blue-200 text-xs">Edit</button>
                              <button onClick={() => publish(event.id)}
                                className="px-2 py-1 rounded bg-emerald-100 text-emerald-800 hover:bg-emerald-200 text-xs">Publish</button>
                            </>
                          )}
                          {event.status === 'published' && (
                            <>
                              <button onClick={() => openEditActivity(event)}
                                className="px-2 py-1 rounded bg-blue-100 text-blue-800 hover:bg-blue-200 text-xs">Edit</button>
                              <button onClick={() => openCheckin(event)}
                                className="px-2 py-1 rounded bg-blue-100 text-blue-800 hover:bg-blue-200 text-xs">Check-in</button>
                              <ShareButton
                                title={event.title || event.locationName}
                                text={`${event.date} · ${event.activityType} trip on UAE Trails`}
                                path={`/trip/${event.id}`}
                      iconOnly
                      light
                    />
                              <button onClick={() => setConfirmCancel(event)}
                                className="px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 text-xs">Cancel</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {events.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No activities yet. Create your first activity!</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          /* Check-in View */
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setViewMode('list')} className="text-sm text-gray-600 hover:text-gray-900">← Back to Events</button>
              <h2 className="text-lg font-semibold text-gray-900">Check-in: {checkinActivityTitle}</h2>
            </div>

            {/* Progress */}
            <div className="bg-white border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-700">Check-in Progress</p>
                <p className="text-sm text-gray-600">{checkedInCount} / {participants.length} checked in</p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-emerald-600 h-2.5 rounded-full transition-all" style={{ width: `${participants.length > 0 ? (checkedInCount / participants.length * 100) : 0}%` }} />
              </div>
            </div>

            {/* Participants */}
            <div className="bg-white border rounded-lg overflow-x-auto desktop-scrollbar-x">
              {checkinLoading ? (
                <p className="px-4 py-8 text-center text-gray-500">Loading participants...</p>
              ) : participants.length === 0 ? (
                <p className="px-4 py-8 text-center text-gray-500">No participants for this event</p>
              ) : (
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left">Participant</th>
                      <th className="px-4 py-3 text-left">Email</th>
                      <th className="px-4 py-3 text-left">Joined</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants.map((p) => (
                      <tr key={p.id} className={`border-t ${p.checkedInAt ? 'bg-green-50' : ''}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <SecureAvatar
                              src={p.avatarUrl}
                              name={p.displayName || p.email || 'Participant'}
                              className="w-8 h-8 text-xs"
                            />
                            <div>
                              <p className="font-medium text-gray-900">{p.displayName}</p>
                              {p.phone && <p className="text-xs text-gray-500">{p.phone}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{p.email}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{new Date(p.joinedAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-center">
                          {p.checkedInAt ? (
                            <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-medium">Checked In</span>
                          ) : (
                            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-medium">Not Yet</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => toggleCheckin(p)}
                            className={`px-3 py-1 rounded text-xs font-medium ${p.checkedInAt ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}>
                            {p.checkedInAt ? 'Undo' : 'Check In'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Cancel Event Confirmation Modal */}
      {confirmCancel && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setConfirmCancel(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Cancel Event?</h3>
            <p className="text-sm text-gray-600 mb-1">
              This will cancel the event and notify all registered participants. This action cannot be undone.
            </p>
            <p className="text-sm font-medium text-gray-900 mb-4">{confirmCancel.title || confirmCancel.locationName}</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmCancel(null)} className="px-4 py-2 border rounded-md text-sm text-gray-700 hover:bg-gray-50">Keep Event</button>
              <button onClick={cancelEvent} className="px-4 py-2 rounded-md text-sm text-white bg-red-600 hover:bg-red-700">Cancel Event</button>
            </div>
          </div>
        </div>
      )}
    </OrganizerShell>
  );
};
