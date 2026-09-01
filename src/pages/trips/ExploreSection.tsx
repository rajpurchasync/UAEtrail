import { useEffect, useMemo, useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { fetchApiTrips } from '../../api/public';
import { Trip } from '../../types';
import { TripCard, EmptyTripsBanner } from '../../components/ui';
import { ACTIVITY_TYPE_GROUP_LABELS } from '../../config/activityTypes';
import { FilterIconButton } from '../../components/mobile/FilterIconButton';
import { ListBrowseLayout } from '../../components/layout/ListBrowseLayout';
import { AppSegmented } from '../../components/mobile/AppSegmented';

type TripFilterPill = 'hiking' | 'camping' | 'community_event' | 'free' | 'paid';
const TRIP_FILTER_PILLS: TripFilterPill[] = ['hiking', 'camping', 'community_event', 'free', 'paid'];

export const ExploreSection = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPills, setFilterPills] = useState<Set<TripFilterPill>>(() => new Set(TRIP_FILTER_PILLS));
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
    if (!showFilters) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowFilters(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [showFilters]);

  useEffect(() => {
    setLoading(true);
    setLoadError(null);
    fetchApiTrips(timeFilter)
      .then((items) => setTripSource(items))
      .catch((err) => {
        setTripSource([]);
        setLoadError(err instanceof Error ? err.message : 'Failed to load activities');
      })
      .finally(() => setLoading(false));
  }, [timeFilter]);

  const showOffSeasonBanner =
    !loading && timeFilter === 'upcoming' && tripSource.length === 0;

  const filteredTrips = useMemo(() => {
    return tripSource
      .filter((trip) => {
        const d = new Date(trip.date);
        if (trip.activityType === 'hiking' && !filterPills.has('hiking')) return false;
        if (trip.activityType === 'camping' && !filterPills.has('camping')) return false;
        if (trip.activityType === 'community_event' && !filterPills.has('community_event')) return false;
        const isFree = trip.price === 0;
        if (isFree && !filterPills.has('free')) return false;
        if (!isFree && !filterPills.has('paid')) return false;
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
  }, [filterPills, searchQuery, filters, tripSource, timeFilter]);

  const toggleFilterPill = (pill: TripFilterPill) => {
    setFilterPills((prev) => {
      const next = new Set(prev);
      if (next.has(pill)) {
        next.delete(pill);
      } else {
        next.add(pill);
      }
      return next;
    });
  };

  const filterOptionLabel: Record<TripFilterPill, string> = {
    hiking: ACTIVITY_TYPE_GROUP_LABELS.hiking,
    camping: ACTIVITY_TYPE_GROUP_LABELS.camping,
    community_event: ACTIVITY_TYPE_GROUP_LABELS.community_event,
    free: 'Free',
    paid: 'Paid',
  };

  const toggleRegion = (region: string) =>
    setFilters((p) => ({
      ...p,
      regions: p.regions.includes(region) ? p.regions.filter((r) => r !== region) : [...p.regions, region],
    }));

  const clearFilters = () => {
    setFilters({ regions: [], startDate: '', endDate: '' });
    setSearchQuery('');
    setFilterPills(new Set(TRIP_FILTER_PILLS));
  };

  const activeFilterCount =
    filters.regions.length +
    (filters.startDate ? 1 : 0) +
    (filters.endDate ? 1 : 0) +
    (TRIP_FILTER_PILLS.length - filterPills.size);

  const filterPanel = (
    <>
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-sm font-semibold text-neutral-900">Filters</h2>
        <button
          type="button"
          onClick={clearFilters}
          className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
        >
          Clear all
        </button>
      </div>
      <div className="mb-4">
        <h3 className="text-xs mb-2 uppercase tracking-wide text-neutral-500 font-semibold">
          Activity
        </h3>
        <div className="space-y-1.5">
          {(['hiking', 'camping', 'community_event'] as const).map((pill) => (
            <label key={pill} className="flex items-center min-h-[36px] cursor-pointer">
              <input
                type="checkbox"
                checked={filterPills.has(pill)}
                onChange={() => toggleFilterPill(pill)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="ml-2 text-sm text-neutral-700">{filterOptionLabel[pill]}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="mb-4">
        <h3 className="text-xs mb-2 uppercase tracking-wide text-neutral-500 font-semibold">
          Price
        </h3>
        <div className="space-y-1.5">
          {(['free', 'paid'] as const).map((pill) => (
            <label key={pill} className="flex items-center min-h-[36px] cursor-pointer">
              <input
                type="checkbox"
                checked={filterPills.has(pill)}
                onChange={() => toggleFilterPill(pill)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="ml-2 text-sm text-neutral-700">{filterOptionLabel[pill]}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="mb-4">
        <h3 className="text-xs mb-2 uppercase tracking-wide text-neutral-500 font-semibold">
          Location
        </h3>
        <div className="space-y-1.5">
          {['Dubai', 'RAK', 'Sharjah', 'Fujairah', 'Abu Dhabi'].map((r) => (
            <label key={r} className="flex items-center min-h-[36px] cursor-pointer">
              <input
                type="checkbox"
                checked={filters.regions.includes(r)}
                onChange={() => toggleRegion(r)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="ml-2 text-sm text-neutral-700">{r}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-xs mb-2 uppercase tracking-wide text-neutral-500 font-semibold">
          Date range
        </h3>
        <div className="space-y-2">
          <div>
            <label className="text-xs text-neutral-500 mb-1 block">From</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm bg-white"
            />
          </div>
          <div>
            <label className="text-xs text-neutral-500 mb-1 block">To</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm bg-white"
            />
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <p className="text-sm text-neutral-500 mb-3">
        Scheduled activities you can join — hiking, camping, and community events hosted by verified organizers.
      </p>
      <div className="flex items-center gap-2 mb-4">
        <AppSegmented
          className="shrink-0"
          segments={[
            { key: 'upcoming', label: 'Upcoming' },
            { key: 'past', label: 'Past' },
          ]}
          value={timeFilter}
          onChange={(key) => setTimeFilter(key as 'upcoming' | 'past')}
        />
        <div className="flex-1 relative min-w-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4 pointer-events-none hidden md:block" />
          <input
            type="text"
            placeholder="Search by location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="glass-search md:pl-10"
          />
        </div>
        <div className="relative shrink-0 lg:hidden">
          <FilterIconButton
            active={showFilters}
            badge={activeFilterCount}
            onClick={() => setShowFilters((open) => !open)}
            aria-label="Filters"
            aria-expanded={showFilters}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </FilterIconButton>
          {showFilters && (
            <>
              <button
                type="button"
                className="fixed inset-0 z-40 cursor-default"
                aria-label="Close filters"
                onClick={() => setShowFilters(false)}
              />
              <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[min(18rem,calc(100vw-2rem))] glass rounded-2xl border border-white/80 shadow-xl shadow-black/10 p-4 animate-fade-up">
                {filterPanel}
              </div>
            </>
          )}
        </div>
      </div>

      <ListBrowseLayout
        sidebar={
          <aside className="hidden lg:block lg:w-56 shrink-0">
            <div className="glass rounded-2xl p-5 sticky top-32 border border-white/80">
              {filterPanel}
            </div>
          </aside>
        }
      >
            {loadError && (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
                {loadError}
              </p>
            )}
            <div className="mb-3 text-sm text-gray-600">
              {loading && <span className="mr-2">Loading activities...</span>}
              {filteredTrips.length} {filteredTrips.length === 1 ? 'activity' : 'activities'} found
            </div>
            {showOffSeasonBanner ? (
              <EmptyTripsBanner />
            ) : filteredTrips.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                <p className="text-gray-600 mb-3 text-sm">
                  {timeFilter === 'past'
                    ? 'No past activities matching your filters.'
                    : 'No upcoming activities matching your filters.'}
                </p>
                <button
                  onClick={clearFilters}
                  className="text-emerald-600 hover:text-emerald-700 font-medium text-sm"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="browse-card-grid">
                {filteredTrips.map((trip) => (
                  <TripCard key={trip.id} trip={trip} />
                ))}
              </div>
            )}
      </ListBrowseLayout>
    </>
  );
};
