import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Plus } from 'lucide-react';
import { EventDTO, withdrawReasonLabel } from '@uaetrail/shared-types';
import { api, EventRequestView } from '../../api/services';
import { getActiveTenantId } from '../../api/tenant';
import { TenantSwitcher, ImageUpload, MapPinFields, parseCoord, LocationSelect, ShareButton, HostSelect, TripPricePackagesEditor, ActivityTypeSelect, TimePicker } from '../../components/ui';
import { derivePriceAed, tripHasPaidPricing } from '../../utils/tripPricing';
import { AppSegmented } from '../../components/mobile/AppSegmented';
import { daysUntil, isUpcomingTrip } from '../../utils/tripDates';
import type { ActivityType } from '../../config/activityTypes';
import { emptyForm } from './shared';

export const OrganizedSection = ({ refreshKey = 0 }: { refreshKey?: number }) => {
  const [tenantId, setTenantId] = useState(getActiveTenantId());
  const [events, setEvents] = useState<EventDTO[]>([]);
  const [requests, setRequests] = useState<EventRequestView[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [subTab, setSubTab] = useState<'upcoming' | 'past'>('upcoming');
  const [expandedRequests, setExpandedRequests] = useState<string | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState<EventDTO | null>(null);

  const loadEvents = async (tid: string) => {
    if (!tid) return;
    try {
      const res = await api.getOrganizerEvents(tid);
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

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (event: EventDTO) => {
    const pricePackages =
      event.pricePackages && event.pricePackages.length > 0
        ? event.pricePackages
        : event.price > 0
          ? [{ label: 'Standard', amount: event.price, currency: 'AED' as const }]
          : [];
    setEditingId(event.id);
    setForm({
      activityType: (event.activityType as ActivityType) ?? 'hiking',
      locationId: event.locationId,
      title: event.title ?? '',
      description: event.description ?? '',
      date: event.date,
      time: event.time,
      endDate: event.endDate ?? '',
      endTime: event.endTime ?? '',
      capacity: event.slotsTotal,
      pricing: tripHasPaidPricing({ price: event.price, pricePackages }) ? 'paid' : 'free',
      price: event.price,
      pricePackages,
      meetingPoint: event.meetingPoint ?? '',
      meetingLat: event.meetingLat != null ? String(event.meetingLat) : '',
      meetingLng: event.meetingLng != null ? String(event.meetingLng) : '',
      paymentTerms: event.paymentTerms ?? '',
      itinerary: (event.itinerary ?? []).join('\n'),
      requirements: (event.requirements ?? []).join('\n'),
      images: event.images ?? [],
      hostUserId: event.guideId ?? event.hostUserId ?? '',
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) {
      setError('Select organization first');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const pricePackages =
        form.pricing === 'paid'
          ? form.pricePackages.filter((p) => p.label.trim()).map((p) => ({ ...p, label: p.label.trim() }))
          : [];
      const price = form.pricing === 'free' ? 0 : derivePriceAed(pricePackages, form.price);

      if (form.pricing === 'paid' && pricePackages.length === 0) {
        setError('Add at least one package option for paid trips.');
        setSaving(false);
        return;
      }
      if (form.pricing === 'paid' && tripHasPaidPricing({ price, pricePackages }) && !form.paymentTerms.trim()) {
        setError('Payment terms are required when any package has a price.');
        setSaving(false);
        return;
      }

      const payload: Record<string, unknown> = {
        locationId: form.locationId,
        title: form.title,
        description: form.description,
        date: form.date,
        time: form.time,
        endDate: form.endDate || undefined,
        endTime: form.endTime || undefined,
        capacity: form.capacity,
        price,
        pricePackages: pricePackages.length > 0 ? pricePackages : [],
        meetingPoint: form.meetingPoint || undefined,
        meetingLat: parseCoord(form.meetingLat),
        meetingLng: parseCoord(form.meetingLng),
        paymentTerms:
          tripHasPaidPricing({ price, pricePackages }) && form.paymentTerms ? form.paymentTerms : undefined,
        itinerary: form.itinerary ? form.itinerary.split('\n').filter(Boolean) : [],
        requirements: form.requirements ? form.requirements.split('\n').filter(Boolean) : [],
        images: form.images,
        guideId: form.hostUserId || undefined,
      };
      if (editingId) {
        await api.updateOrganizerEvent(tenantId, editingId, payload);
      } else {
        await api.createOrganizerEvent(tenantId, payload);
      }
      closeModal();
      setForm(emptyForm);
      setEditingId(null);
      await loadEvents(tenantId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  const publish = async (eventId: string) => {
    if (!tenantId) return;
    try {
      await api.publishOrganizerEvent(tenantId, eventId);
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

  const eventRequests = (eventId: string) => requests.filter((r) => r.event.id === eventId && r.status === 'pending');
  const cancelledEventRequests = (eventId: string) =>
    requests.filter((r) => r.event.id === eventId && r.status === 'cancelled' && r.cancelReason);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      <TenantSwitcher onChange={setTenantId} />
      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Header with create button */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={openCreate}
          className="app-cta-sm shrink-0"
          disabled={!tenantId}
        >
          <Plus className="w-3.5 h-3.5" />
          Add Event
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
          return (
            <div key={event.id} className="bg-white border rounded-lg overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{event.title || event.locationName}</h3>
                    {event.title && <p className="text-xs text-gray-500">{event.locationName}</p>}
                    <p className="text-sm text-gray-600 mt-1">
                      {event.date} at {event.time}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {statusBadge(event.status)}
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        event.activityType === 'hiking' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                      }`}
                    >
                      {event.activityType}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                  <span>
                    {event.slotsTotal - event.slotsAvailable}/{event.slotsTotal} slots filled
                  </span>
                  <span>{event.price > 0 ? `AED ${event.price}` : 'Free'}</span>
                  {isUpcomingTrip(event) && <span className="text-emerald-600 font-medium">{daysUntil(event.date)}</span>}
                </div>

                {/* Actions */}
                <div className="mt-3 pt-3 border-t flex flex-wrap items-center gap-2">
                  {event.status === 'draft' && (
                    <>
                      <button
                        onClick={() => openEdit(event)}
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
                        onClick={() => openEdit(event)}
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
              <button onClick={openCreate} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                + Add your first event
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">{editingId ? 'Edit Event' : 'Add Event'}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-xl">
                &times;
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <ActivityTypeSelect
                value={form.activityType}
                onChange={(activityType) =>
                  setForm((prev) => ({
                    ...prev,
                    activityType,
                    locationId: prev.activityType === activityType ? prev.locationId : '',
                  }))
                }
              />

              <HostSelect
                tenantId={tenantId}
                value={form.hostUserId}
                onChange={(hostUserId) => setForm({ ...form, hostUserId })}
                required
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Location *</label>
                  <LocationSelect
                    value={form.locationId}
                    onChange={(locationId) => setForm({ ...form, locationId })}
                    tenantId={tenantId}
                    activityType={form.activityType}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Title *</label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder="e.g. Weekend Jebel Jais Hike"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Date *</label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Time *</label>
                  <TimePicker
                    required
                    value={form.time}
                    onChange={(time) => setForm({ ...form, time })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">End date</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">End time</label>
                  <TimePicker
                    value={form.endTime}
                    onChange={(endTime) => setForm({ ...form, endTime })}
                  />
                </div>
              </div>

              {editingId && events.find((e) => e.id === editingId)?.status === 'published' && (
                <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                  Changing the start date or time will notify all confirmed participants.
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Capacity *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Pricing</label>
                  <div className="flex gap-2">
                    {(['free', 'paid'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() =>
                          setForm({
                            ...form,
                            pricing: type,
                            price: type === 'free' ? 0 : form.price,
                            pricePackages: type === 'free' ? [] : form.pricePackages,
                          })
                        }
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium ${
                          form.pricing === type ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {type === 'free' ? 'Free' : 'Paid options'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {form.pricing === 'paid' && (
                <div className="space-y-3">
                  <TripPricePackagesEditor
                    packages={form.pricePackages}
                    onChange={(pricePackages) => setForm({ ...form, pricePackages })}
                  />
                </div>
              )}

              {form.pricing === 'paid' && tripHasPaidPricing({ price: form.price, pricePackages: form.pricePackages }) && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Payment terms *</label>
                  <textarea
                    required
                    value={form.paymentTerms}
                    onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    rows={2}
                    placeholder="Refund policy, payment method…"
                  />
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Description *</label>
                <textarea
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  rows={3}
                  placeholder="Describe the event, what to expect..."
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Meeting Point</label>
                <input
                  type="text"
                  value={form.meetingPoint}
                  onChange={(e) => setForm({ ...form, meetingPoint: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="e.g. RAK Gateway parking lot"
                />
                <div className="mt-2">
                  <MapPinFields
                    lat={form.meetingLat}
                    lng={form.meetingLng}
                    onLatChange={(meetingLat) => setForm({ ...form, meetingLat })}
                    onLngChange={(meetingLng) => setForm({ ...form, meetingLng })}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Itinerary (one step per line)</label>
                <textarea
                  value={form.itinerary}
                  onChange={(e) => setForm({ ...form, itinerary: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  rows={3}
                  placeholder="6:00 AM - Meet at parking&#10;6:30 AM - Start hike&#10;10:00 AM - Summit"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Requirements (one per line)</label>
                <textarea
                  value={form.requirements}
                  onChange={(e) => setForm({ ...form, requirements: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  rows={3}
                  placeholder="Hiking boots required&#10;Bring 2L water minimum"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Event Images</label>
                <ImageUpload
                  images={form.images}
                  onChange={(urls) => setForm((prev) => ({ ...prev, images: urls }))}
                  max={6}
                  keyPrefix="events"
                  tenantId={tenantId}
                  kind="event-image"
                  preset="event"
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-60"
                >
                  {saving ? 'Saving...' : editingId ? 'Update Event' : 'Save as Draft'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

