import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, SlidersHorizontal, Plus, ChevronRight } from 'lucide-react';
import { EventDTO, LocationDTO } from '@uaetrail/shared-types';
import { useAuth } from '../context/AuthContext';
import { api, EventRequestView } from '../api/services';
import { TripCard } from '../components/ui/TripCard';
import { PageMeta } from '../components/seo/PageMeta';
import { TenantSwitcher, ImageUpload, CreateTripModal } from '../components/ui';
import { getActiveTenantId } from '../api/tenant';
import { ActivityType, Trip } from '../types';
import { fetchApiTrips } from '../api/public';

/* ── helpers ─────────────────────────────────────────────── */

const isUpcoming = (t: EventDTO) => new Date(t.date) >= new Date(new Date().toDateString());

const daysUntil = (dateStr: string) => {
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff < 0) return '';
  return `In ${diff} days`;
};

const isOrganizer = (role?: string) =>
  role === 'tenant_owner' || role === 'tenant_admin' || role === 'tenant_guide';

const emptyForm = {
  locationId: '',
  title: '',
  description: '',
  date: '',
  time: '',
  capacity: 10,
  price: 0,
  meetingPoint: '',
  itinerary: '',
  requirements: '',
  images: [] as string[],
};

/* ── main tabs ───────────────────────────────────────────── */

type PageTab = 'browse' | 'joined' | 'organized';

export const Trips = () => {
  const { user } = useAuth();
  const showOrganized = isOrganizer(user?.role);

  const [activeTab, setActiveTab] = useState<PageTab>('browse');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const tabs: { key: PageTab; label: string }[] = [
    { key: 'browse', label: 'Browse' },
    ...(user ? [{ key: 'joined' as PageTab, label: 'My Trips' }] : []),
    ...(showOrganized ? [{ key: 'organized' as PageTab, label: 'Organized' }] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <PageMeta
        title="Browse & join outdoor trips"
        description="Find upcoming hiking and camping trips led by verified organizers across the GCC."
        path="/trips"
      />
      {/* Tab bar */}
      <div className="bg-white border-b sticky top-0 md:top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 py-3 overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === t.key
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t.label}
              </button>
            ))}
            <div className="ml-auto shrink-0">
              {showOrganized ? (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-full hover:bg-emerald-700 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              ) : user ? (
                <Link
                  to="/become-organizer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-full hover:bg-emerald-700 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add
                </Link>
              ) : (
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-full hover:bg-emerald-700 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content sections */}
      {activeTab === 'browse' && <BrowseSection />}
      {activeTab === 'joined' && user && <JoinedSection />}
      {activeTab === 'organized' && showOrganized && <OrganizedSection />}

      {/* Create Trip Modal (organizers only) */}
      <CreateTripModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={() => setActiveTab('browse')}
      />
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   BROWSE SECTION — public trip browsing (reuses Calendar logic)
   ══════════════════════════════════════════════════════════ */

const BrowseSection = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activityFilter, setActivityFilter] = useState<ActivityType>('hiking');
  const [timeFilter, setTimeFilter] = useState<'upcoming' | 'past'>('upcoming');
  const [showFilters, setShowFilters] = useState(false);
  const [tripSource, setTripSource] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    regions: [] as string[],
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    setLoading(true);
    setLoadError(null);
    fetchApiTrips()
      .then((items) => setTripSource(items))
      .catch((err) => {
        setTripSource([]);
        setLoadError(err instanceof Error ? err.message : 'Failed to load trips');
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredTrips = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return tripSource
      .filter((trip) => {
        const d = new Date(trip.date);
        if (timeFilter === 'upcoming' && d < today) return false;
        if (timeFilter === 'past' && d >= today) return false;
        if (trip.activityType !== activityFilter) return false;
        if (searchQuery && !trip.locationName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        if (filters.regions.length > 0 && !filters.regions.includes(trip.region ?? '')) return false;
        if (filters.startDate && d < new Date(filters.startDate)) return false;
        if (filters.endDate && d > new Date(filters.endDate)) return false;
        return true;
      })
      .sort((a, b) =>
        timeFilter === 'upcoming'
          ? new Date(a.date).getTime() - new Date(b.date).getTime()
          : new Date(b.date).getTime() - new Date(a.date).getTime()
      );
  }, [activityFilter, searchQuery, filters, tripSource, timeFilter]);

  const toggleRegion = (region: string) =>
    setFilters((p) => ({
      ...p,
      regions: p.regions.includes(region) ? p.regions.filter((r) => r !== region) : [...p.regions, region],
    }));

  const clearFilters = () => {
    setFilters({ regions: [], startDate: '', endDate: '' });
    setSearchQuery('');
  };

  return (
    <>
      {/* Search & activity toggle */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors inline-flex items-center justify-center text-sm"
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filters
            </button>
          </div>
          <div className="flex gap-2 mt-3 flex-wrap">
            {(['hiking', 'camping'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setActivityFilter(type)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activityFilter === type
                    ? type === 'hiking'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
            <div className="w-px bg-gray-200 mx-1" />
            {(['upcoming', 'past'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeFilter(tf)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  timeFilter === tf
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tf.charAt(0).toUpperCase() + tf.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar filters */}
          <aside className={`w-full lg:w-56 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-lg shadow-sm p-5 sticky top-32">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-semibold text-gray-900">Filters</h2>
                <button onClick={clearFilters} className="text-xs text-emerald-600 hover:text-emerald-700">
                  Clear all
                </button>
              </div>
              <div className="mb-5">
                <h3 className="font-medium text-gray-900 text-sm mb-2">Location</h3>
                <div className="space-y-2">
                  {['Dubai', 'RAK', 'Sharjah', 'Fujairah', 'Abu Dhabi'].map((r) => (
                    <label key={r} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.regions.includes(r)}
                        onChange={() => toggleRegion(r)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{r}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 text-sm mb-2">Date Range</h3>
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">From</label>
                    <input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">To</label>
                    <input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Trip grid */}
          <div className="flex-1">
            {loadError && (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
                {loadError}
              </p>
            )}
            <div className="mb-3 text-sm text-gray-600">
              {loading && <span className="mr-2">Loading events...</span>}
              {filteredTrips.length} {filteredTrips.length === 1 ? 'trip' : 'trips'} found
            </div>
            {filteredTrips.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                <p className="text-gray-600 mb-3 text-sm">
                  {timeFilter === 'past' ? 'No past trips matching your filters.' : 'No upcoming trips matching your filters.'}
                </p>
                <button onClick={clearFilters} className="text-emerald-600 hover:text-emerald-700 font-medium text-sm">
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
                {filteredTrips.map((trip) => (
                  <TripCard key={trip.id} trip={trip} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

/* ══════════════════════════════════════════════════════════
   JOINED SECTION — user's joined trips (Going / Past)
   ══════════════════════════════════════════════════════════ */

const JoinedSection = () => {
  const [trips, setTrips] = useState<EventDTO[]>([]);
  const [subTab, setSubTab] = useState<'going' | 'past'>('going');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api
      .getMeTrips()
      .then((res) => setTrips(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load trips'))
      .finally(() => setLoading(false));
  }, []);

  const going = trips.filter(isUpcoming);
  const past = trips.filter((t) => !isUpcoming(t));
  const displayed = subTab === 'going' ? going : past;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-white border rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-emerald-600">{going.length}</p>
          <p className="text-xs text-gray-500">Going</p>
        </div>
        <div className="bg-white border rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-gray-700">{past.length}</p>
          <p className="text-xs text-gray-500">Past</p>
        </div>
        <div className="bg-white border rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-gray-700">{trips.length}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
        {(['going', 'past'] as const).map((key) => (
          <button
            key={key}
            onClick={() => setSubTab(key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              subTab === key ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {key === 'going' ? `Going (${going.length})` : `Past (${past.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white border rounded-lg p-8 text-center">
          <div className="inline-block w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mr-2" />
          <span className="text-sm text-gray-500">Loading trips...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayed.map((trip) => (
            <div key={trip.id} className="bg-white border rounded-lg p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{trip.title || trip.locationName}</h3>
                  {trip.title && <p className="text-xs text-gray-500">{trip.locationName}</p>}
                  <p className="text-sm text-gray-600 mt-1">
                    {trip.date} at {trip.time}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      trip.activityType === 'hiking' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                    }`}
                  >
                    {trip.activityType}
                  </span>
                  {isUpcoming(trip) && (
                    <span className="text-xs text-emerald-600 font-medium">{daysUntil(trip.date)}</span>
                  )}
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
                <span>by {trip.organizerName}</span>
                {trip.price > 0 && <span className="font-medium text-gray-700">AED {trip.price}</span>}
                <span>
                  {trip.slotsTotal - trip.slotsAvailable}/{trip.slotsTotal} joined
                </span>
              </div>
              {trip.meetingPoint && <p className="text-xs text-gray-500 mt-2">📍 {trip.meetingPoint}</p>}
              <div className="flex items-center justify-between mt-3 pt-3 border-t">
                {trip.status === 'cancelled' ? (
                  <span className="text-xs font-medium text-red-600">Event Cancelled</span>
                ) : trip.status === 'suspended' ? (
                  <span className="text-xs font-medium text-orange-600">Event Suspended</span>
                ) : isUpcoming(trip) ? (
                  <span className="text-xs font-medium text-emerald-600">✓ Confirmed &middot; Check-in on site</span>
                ) : (
                  <span className="text-xs text-gray-400">Completed</span>
                )}
                <Link to={`/trip/${trip.id}`} className="text-emerald-700 text-sm hover:text-emerald-900">
                  View Details →
                </Link>
              </div>
            </div>
          ))}

          {displayed.length === 0 && (
            <div className="col-span-full bg-white border rounded-lg p-8 text-center">
              <p className="text-sm text-gray-500 mb-2">
                {subTab === 'going' ? 'No upcoming trips' : 'No past trips'}
              </p>
              {subTab === 'going' && (
                <button
                  onClick={() => {
                    /* parent will handle scroll-to-browse */
                  }}
                  className="text-sm text-emerald-600 hover:text-emerald-700"
                >
                  Browse Events →
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   ORGANIZED SECTION — organizer's managed events
   ══════════════════════════════════════════════════════════ */

const OrganizedSection = () => {
  const [tenantId, setTenantId] = useState(getActiveTenantId());
  const [events, setEvents] = useState<EventDTO[]>([]);
  const [locations, setLocations] = useState<LocationDTO[]>([]);
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

  const loadLocations = async () => {
    try {
      const res = await api.getPublicLocations();
      setLocations(res.data);
    } catch {
      /* non-critical */
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
    loadLocations();
    loadRequests(tenantId);
  }, [tenantId]);

  const upcoming = events.filter((e) => isUpcoming(e));
  const past = events.filter((e) => !isUpcoming(e));
  const displayed = subTab === 'upcoming' ? upcoming : past;

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (event: EventDTO) => {
    setEditingId(event.id);
    setForm({
      locationId: event.locationId,
      title: event.title ?? '',
      description: event.description ?? '',
      date: event.date,
      time: event.time,
      capacity: event.slotsTotal,
      price: event.price,
      meetingPoint: event.meetingPoint ?? '',
      itinerary: (event.itinerary ?? []).join('\n'),
      requirements: (event.requirements ?? []).join('\n'),
      images: event.images ?? [],
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
      const payload: Record<string, unknown> = {
        ...form,
        itinerary: form.itinerary ? form.itinerary.split('\n').filter(Boolean) : [],
        requirements: form.requirements ? form.requirements.split('\n').filter(Boolean) : [],
        meetingPoint: form.meetingPoint || undefined,
        images: form.images,
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      <TenantSwitcher onChange={setTenantId} />
      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Header with create button */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(['upcoming', 'past'] as const).map((key) => (
            <button
              key={key}
              onClick={() => setSubTab(key)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                subTab === key ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {key === 'upcoming' ? `Upcoming (${upcoming.length})` : `Past (${past.length})`}
            </button>
          ))}
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium inline-flex items-center gap-1"
          disabled={!tenantId}
        >
          <Plus className="w-4 h-4" />
          Create Event
        </button>
      </div>

      {/* Event cards */}
      <div className="space-y-3">
        {displayed.map((event) => {
          const pending = eventRequests(event.id);
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
                  {isUpcoming(event) && <span className="text-emerald-600 font-medium">{daysUntil(event.date)}</span>}
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
                    </div>
                  )}
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
                + Create your first event
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
              <h2 className="text-lg font-semibold text-gray-900">{editingId ? 'Edit Event' : 'Create New Event'}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-xl">
                &times;
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Location *</label>
                  <select
                    required
                    value={form.locationId}
                    onChange={(e) => setForm({ ...form, locationId: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Select location...</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} ({loc.region} - {loc.activityType})
                      </option>
                    ))}
                  </select>
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
                  <input
                    type="time"
                    required
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>

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
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Price (AED)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder="0 for free"
                  />
                </div>
              </div>

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
