import { lazy, Suspense, useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, Map, List } from 'lucide-react';
import { TrailCard } from '../components/ui/TrailCard';
import { CampingCard } from '../components/ui/CampingCard';
import type { LocationMapPin } from '../components/ui/LocationsMap';

const LocationsMap = lazy(() =>
  import('../components/ui/LocationsMap').then((m) => ({ default: m.LocationsMap }))
);
import { PageMeta } from '../components/seo/PageMeta';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { FilterChips } from '../components/mobile/FilterChips';
import { FilterIconButton } from '../components/mobile/FilterIconButton';
import { PAGE_BANNERS } from '../config/pageBanners';
import { DifficultyLevel, CampingType, Accessibility, Trail, CampingSpot } from '../types';
import { fetchApiLocations } from '../api/public';
import { DEFAULT_COUNTRY, getRegionsForCountry, getMapBounds } from '../config/regions';
import { matchesLocationSearch, resolveRegionFilter } from '../utils/locationSearch';

type LocationItem = { type: 'trail'; data: Trail } | { type: 'camp'; data: CampingSpot };
type ActivityFilter = 'all' | 'hiking' | 'camping';

export const Discovery = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [trailSource, setTrailSource] = useState<Trail[]>([]);
  const [campSource, setCampSource] = useState<CampingSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  const [filters, setFilters] = useState({
    difficulty: [] as DifficultyLevel[],
    childFriendly: false,
    minDistance: 0,
    maxDistance: 20,
    campingType: [] as CampingType[],
    accessibility: [] as Accessibility[],
    regions: [] as string[]
  });

  useEffect(() => {
    const q = searchParams.get('q');
    const regionParam = searchParams.get('region');
    const activity = searchParams.get('activity');

    if (regionParam) {
      const resolved = resolveRegionFilter(regionParam);
      if (resolved) {
        setFilters((prev) => ({ ...prev, regions: [resolved] }));
        setSearchQuery('');
      } else {
        setFilters((prev) => ({ ...prev, regions: [] }));
        setSearchQuery(regionParam);
      }
    } else if (q) {
      const resolved = resolveRegionFilter(q);
      if (resolved) {
        setFilters((prev) => ({ ...prev, regions: [resolved] }));
        setSearchQuery('');
      } else {
        setFilters((prev) => ({ ...prev, regions: [] }));
        setSearchQuery(q);
      }
    } else {
      setSearchQuery('');
      setFilters((prev) => ({ ...prev, regions: [] }));
    }

    if (activity === 'hiking' || activity === 'camping') {
      setActivityFilter(activity);
    } else {
      setActivityFilter('all');
    }
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    setLoadError(null);
    fetchApiLocations()
      .then((response) => {
        setTrailSource(response.trails);
        setCampSource(response.camps);
      })
      .catch((err) => {
        setTrailSource([]);
        setCampSource([]);
        setLoadError(err instanceof Error ? err.message : 'Failed to load locations');
      })
      .finally(() => setLoading(false));
  }, []);

  const regionOptions = getRegionsForCountry(DEFAULT_COUNTRY);
  const mapBounds = getMapBounds(DEFAULT_COUNTRY);

  const filteredLocations = useMemo(() => {
    const locations: LocationItem[] = [];
    const showTrails = activityFilter === 'all' || activityFilter === 'hiking';
    const showCamps = activityFilter === 'all' || activityFilter === 'camping';

    if (showTrails) {
      const filteredTrails = trailSource.filter((trail) => {
        if (!matchesLocationSearch(trail, searchQuery)) {
          return false;
        }
        if (filters.regions.length > 0 && !filters.regions.includes(trail.region)) {
          return false;
        }
        if (filters.difficulty.length > 0 && !filters.difficulty.includes(trail.difficulty)) {
          return false;
        }
        if (filters.childFriendly && !trail.childFriendly) {
          return false;
        }
        if (trail.distance < filters.minDistance || trail.distance > filters.maxDistance) {
          return false;
        }
        return true;
      });
      locations.push(...filteredTrails.map((trail) => ({ type: 'trail' as const, data: trail })));
    }

    if (showCamps) {
      const filteredCamps = campSource.filter((camp) => {
        if (!matchesLocationSearch(camp, searchQuery)) {
          return false;
        }
        if (filters.regions.length > 0 && !filters.regions.includes(camp.region)) {
          return false;
        }
        if (filters.campingType.length > 0 && !filters.campingType.includes(camp.campingType)) {
          return false;
        }
        if (
          filters.accessibility.length > 0 &&
          !filters.accessibility.includes(camp.accessibility)
        ) {
          return false;
        }
        return true;
      });
      locations.push(...filteredCamps.map((camp) => ({ type: 'camp' as const, data: camp })));
    }

    return locations;
  }, [activityFilter, searchQuery, filters, trailSource, campSource]);

  const mapPins = useMemo((): LocationMapPin[] => {
    return filteredLocations.flatMap((location) => {
      const item = location.data;
      if (item.latitude == null || item.longitude == null) return [];
      return [
        {
          id: item.id,
          name: item.name,
          latitude: item.latitude,
          longitude: item.longitude,
          activityType: location.type === 'trail' ? 'hiking' : 'camping',
          path: location.type === 'trail' ? `/trail/${item.id}` : `/camp/${item.id}`,
        },
      ];
    });
  }, [filteredLocations]);

  const toggleDifficulty = (level: DifficultyLevel) => {
    setFilters((prev) => ({
      ...prev,
      difficulty: prev.difficulty.includes(level)
        ? prev.difficulty.filter((d) => d !== level)
        : [...prev.difficulty, level]
    }));
  };

  const toggleCampingType = (type: CampingType) => {
    setFilters((prev) => ({
      ...prev,
      campingType: prev.campingType.includes(type)
        ? prev.campingType.filter((t) => t !== type)
        : [...prev.campingType, type]
    }));
  };

  const toggleAccessibility = (access: Accessibility) => {
    setFilters((prev) => ({
      ...prev,
      accessibility: prev.accessibility.includes(access)
        ? prev.accessibility.filter((a) => a !== access)
        : [...prev.accessibility, access]
    }));
  };

  const toggleRegion = (region: string) => {
    setFilters((prev) => ({
      ...prev,
      regions: prev.regions.includes(region)
        ? prev.regions.filter((r) => r !== region)
        : [...prev.regions, region]
    }));
  };

  const activeFilterSummary = useMemo(() => {
    const parts: string[] = [];
    if (filters.regions.length > 0) parts.push(filters.regions.join(', '));
    if (activityFilter !== 'all') parts.push(activityFilter);
    if (searchQuery.trim()) parts.push(`"${searchQuery.trim()}"`);
    if (filters.difficulty.length > 0) parts.push(filters.difficulty.join(', '));
    return parts;
  }, [filters.regions, filters.difficulty, activityFilter, searchQuery]);

  const clearFilters = () => {
    setSearchQuery('');
    setActivityFilter('all');
    setFilters({
      difficulty: [],
      childFriendly: false,
      minDistance: 0,
      maxDistance: 20,
      campingType: [],
      accessibility: [],
      regions: []
    });
    navigate('/discovery', { replace: true });
  };

  return (
    <ConsumerShell
      layout="editorial"
      eyebrow="Explore"
      title="Trails & spots"
      banner={{ src: PAGE_BANNERS.discovery, alt: 'Mountain landscape at sunrise' }}
      back={{ fallbackTo: '/', label: 'Home' }}
      toolbar={
        <>
          {loadError && (
            <p className="text-sm text-amber-800 glass rounded-2xl px-3 py-2 mb-3 border-amber-200/50">
              {loadError}
            </p>
          )}
          <div className="flex gap-2 mb-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search trails & camps"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="glass-search"
              />
            </div>
            <FilterIconButton onClick={() => setShowFilters(!showFilters)} aria-label="Filters">
              <SlidersHorizontal className="w-4 h-4" />
            </FilterIconButton>
          </div>
          <div className="flex gap-2 justify-between items-center flex-wrap">
            <FilterChips
              options={[
                { key: 'all', label: 'All' },
                { key: 'hiking', label: 'Hiking' },
                { key: 'camping', label: 'Camping' },
              ]}
              value={activityFilter}
              onChange={(key) => setActivityFilter(key as ActivityFilter)}
            />
            <div className="app-segmented">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`inline-flex items-center justify-center h-7 w-8 rounded-[10px] transition-all active:scale-95 ${
                  viewMode === 'list' ? 'app-segment-active' : 'app-segment'
                }`}
                aria-label="List view"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('map')}
                className={`inline-flex items-center justify-center h-7 w-8 rounded-[10px] transition-all active:scale-95 ${
                  viewMode === 'map' ? 'app-segment-active' : 'app-segment'
                }`}
                aria-label="Map view"
              >
                <Map className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </>
      }
    >
      <PageMeta
        title="Explore trails & camps"
        description="Browse hiking trails and camping spots across the UAE."
        path="/discovery"
      />

      <div className="py-2 md:py-4">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside
            className={`lg:block lg:w-64 shrink-0 ${
              showFilters
                ? 'fixed inset-0 z-50 lg:static lg:inset-auto bg-black/40 lg:bg-transparent'
                : 'hidden lg:block'
            }`}
            onClick={() => showFilters && setShowFilters(false)}
            role="presentation"
          >
            <div
              className={`bg-white p-6 lg:rounded-ios-lg lg:shadow-ios-sm lg:sticky lg:top-32 ${
                showFilters
                  ? 'absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-[20px] pb-nav-safe lg:static lg:max-h-none lg:pb-6 lg:rounded-ios-lg'
                  : ''
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4 lg:mb-4">
                <h2 className="text-lg font-semibold text-neutral-900">Filters</h2>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-sm text-emerald-600 font-medium min-h-[44px] px-2"
                  >
                    Clear all
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowFilters(false)}
                    className="lg:hidden min-h-[44px] min-w-[44px] text-neutral-500"
                    aria-label="Close filters"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3">Location</h3>
                <div className="space-y-2">
                  {regionOptions.map((region) => (
                    <label key={region} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.regions.includes(region)}
                        onChange={() => toggleRegion(region)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{region}</span>
                    </label>
                  ))}
                </div>
              </div>

              {(activityFilter === 'all' || activityFilter === 'hiking') && (
                <>
                  <div className="mb-6">
                    <h3 className="font-medium text-gray-900 mb-3">
                      {activityFilter === 'all' ? 'Trail difficulty' : 'Difficulty'}
                    </h3>
                    <div className="space-y-2">
                      {(['easy', 'moderate', 'hard'] as DifficultyLevel[]).map((level) => (
                        <label key={level} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={filters.difficulty.includes(level)}
                            onChange={() => toggleDifficulty(level)}
                            className="rounded text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className="ml-2 text-sm text-gray-700 capitalize">{level}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="font-medium text-gray-900 mb-3">
                      {activityFilter === 'all' ? 'Trail distance (km)' : 'Distance (km)'}
                    </h3>
                    <div className="space-y-2">
                      <input
                        type="range"
                        min="0"
                        max="20"
                        step="1"
                        value={filters.maxDistance}
                        onChange={(e) =>
                          setFilters({ ...filters, maxDistance: Number(e.target.value) })
                        }
                        className="w-full"
                      />
                      <div className="text-sm text-gray-600">
                        Up to {filters.maxDistance} km
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.childFriendly}
                        onChange={(e) =>
                          setFilters({ ...filters, childFriendly: e.target.checked })
                        }
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Child-friendly only</span>
                    </label>
                  </div>
                </>
              )}

              {(activityFilter === 'all' || activityFilter === 'camping') && (
                <>
                  <div className="mb-6">
                    <h3 className="font-medium text-gray-900 mb-3">
                      {activityFilter === 'all' ? 'Camping type' : 'Camping Type'}
                    </h3>
                    <div className="space-y-2">
                      {(['self-guided', 'operator-led'] as CampingType[]).map((type) => (
                        <label key={type} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={filters.campingType.includes(type)}
                            onChange={() => toggleCampingType(type)}
                            className="rounded text-amber-600 focus:ring-amber-500"
                          />
                          <span className="ml-2 text-sm text-gray-700 capitalize">
                            {type.replace('-', ' ')}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="font-medium text-gray-900 mb-3">Accessibility</h3>
                    <div className="space-y-2">
                      {(['car-accessible', 'remote'] as Accessibility[]).map((access) => (
                        <label key={access} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={filters.accessibility.includes(access)}
                            onChange={() => toggleAccessibility(access)}
                            className="rounded text-amber-600 focus:ring-amber-500"
                          />
                          <span className="ml-2 text-sm text-gray-700 capitalize">
                            {access.replace('-', ' ')}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </aside>

          <div className="flex-1">
            <div className="mb-4 text-sm text-gray-600">
              {loading ? (
                <span>Loading locations…</span>
              ) : (
                <span>{filteredLocations.length} results found</span>
              )}
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-64 rounded-2xl bg-gray-100 animate-pulse" />
                ))}
              </div>
            ) : loadError ? (
              <div className="text-center py-12">
                <p className="text-gray-800 font-medium mb-2">Could not load locations</p>
                <p className="text-sm text-gray-600 mb-4">{loadError}</p>
                <p className="text-xs text-gray-500">
                  Make sure the API is running on port 4000 and try refreshing.
                </p>
              </div>
            ) : filteredLocations.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-800 font-medium mb-2">No results found matching your filters.</p>
                {activeFilterSummary.length > 0 && (
                  <p className="text-sm text-gray-600 mb-4">
                    Active filters: {activeFilterSummary.join(' · ')}
                  </p>
                )}
                {!loadError && trailSource.length + campSource.length === 0 && (
                  <p className="text-sm text-gray-500 mb-4">
                    No locations are loaded yet. Run the API seed if this is a fresh install.
                  </p>
                )}
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Clear filters and show all
                </button>
              </div>
            ) : viewMode === 'map' ? (
              <Suspense
                fallback={
                  <div
                    className="rounded-2xl border border-emerald-100 bg-emerald-50/50 animate-pulse"
                    style={{ minHeight: 420 }}
                  />
                }
              >
                <LocationsMap pins={mapPins} bounds={mapBounds} minHeight={420} />
              </Suspense>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {filteredLocations.map((location, index) =>
                  location.type === 'trail' ? (
                    <TrailCard key={`trail-${location.data.id}-${index}`} trail={location.data} />
                  ) : (
                    <CampingCard key={`camp-${location.data.id}-${index}`} camp={location.data} />
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </ConsumerShell>
  );
};
