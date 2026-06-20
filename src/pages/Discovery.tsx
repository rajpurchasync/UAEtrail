import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, SlidersHorizontal, Map, List } from 'lucide-react';
import { TrailCard } from '../components/ui/TrailCard';
import { CampingCard } from '../components/ui/CampingCard';
import { PageMeta } from '../components/seo/PageMeta';
import { ActivityType, DifficultyLevel, CampingType, Accessibility, Trail, CampingSpot } from '../types';
import { fetchApiLocations } from '../api/public';
import { SUPPORTED_COUNTRIES, DEFAULT_COUNTRY, getRegionsForCountry, getMapBounds, CountryCode } from '../config/regions';

export const Discovery = () => {
  const [activityType, setActivityType] = useState<ActivityType>('hiking');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [trailSource, setTrailSource] = useState<Trail[]>([]);
  const [campSource, setCampSource] = useState<CampingSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [countryCode, setCountryCode] = useState<CountryCode>(DEFAULT_COUNTRY);

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
    setLoading(true);
    setLoadError(null);
    fetchApiLocations(countryCode)
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
  }, [countryCode]);

  const regionOptions = getRegionsForCountry(countryCode);
  const mapBounds = getMapBounds(countryCode);

  const filteredLocations = useMemo(() => {
    let locations: Array<{ type: 'trail' | 'camp'; data: any }> = [];

    if (activityType === 'hiking') {
      const filteredTrails = trailSource.filter((trail) => {
        if (searchQuery && !trail.name.toLowerCase().includes(searchQuery.toLowerCase())) {
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
      locations = [
        ...locations,
        ...filteredTrails.map((trail) => ({ type: 'trail' as const, data: trail }))
      ];
    }

    if (activityType === 'camping') {
      const filteredCamps = campSource.filter((camp) => {
        if (searchQuery && !camp.name.toLowerCase().includes(searchQuery.toLowerCase())) {
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
      locations = [
        ...locations,
        ...filteredCamps.map((camp) => ({ type: 'camp' as const, data: camp }))
      ];
    }

    return locations;
  }, [activityType, searchQuery, filters, trailSource, campSource]);

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

  const clearFilters = () => {
    setFilters({
      difficulty: [],
      childFriendly: false,
      minDistance: 0,
      maxDistance: 20,
      campingType: [],
      accessibility: [],
      regions: []
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageMeta
        title="Explore trails & camps"
        description="Browse hiking trails and camping spots across UAE, Saudi Arabia, Oman, and the wider GCC."
        path="/discovery"
      />
      <div className="bg-white border-b sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Discover Trails & Camps</h1>
          <p className="text-gray-600 text-sm mb-4">Explore hiking trails and camping spots across the GCC</p>
          {loadError && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
              {loadError}
            </p>
          )}

          <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-none">
            {SUPPORTED_COUNTRIES.map((c) => (
              <button
                key={c.code}
                onClick={() => { setCountryCode(c.code); setFilters((f) => ({ ...f, regions: [] })); }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                  countryCode === c.code ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors inline-flex items-center justify-center shrink-0"
            >
              <SlidersHorizontal className="w-5 h-5" />
              <span className="hidden sm:inline ml-2">Filters</span>
            </button>
          </div>

          <div className="flex gap-2 mt-4 justify-center md:justify-start items-center flex-wrap">
            <button
              onClick={() => setActivityType('hiking')}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                activityType === 'hiking'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Hiking
            </button>
            <button
              onClick={() => setActivityType('camping')}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                activityType === 'camping'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Camping
            </button>
            <div className="ml-auto flex gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-white shadow-sm text-emerald-700' : 'text-gray-500'}`}
                aria-label="List view"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`p-2 rounded-md ${viewMode === 'map' ? 'bg-white shadow-sm text-emerald-700' : 'text-gray-500'}`}
                aria-label="Map view"
              >
                <Map className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside
            className={`w-full lg:w-64 ${showFilters ? 'block' : 'hidden lg:block'}`}
          >
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-32">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                <button
                  onClick={clearFilters}
                  className="text-sm text-emerald-600 hover:text-emerald-700"
                >
                  Clear all
                </button>
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

              {activityType === 'hiking' && (
                <>
                  <div className="mb-6">
                    <h3 className="font-medium text-gray-900 mb-3">Difficulty</h3>
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
                    <h3 className="font-medium text-gray-900 mb-3">Distance (km)</h3>
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

              {activityType === 'camping' && (
                <>
                  <div className="mb-6">
                    <h3 className="font-medium text-gray-900 mb-3">Camping Type</h3>
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
              {loading && <span className="mr-2">Loading API locations...</span>}
              {filteredLocations.length} results found
            </div>

            {filteredLocations.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">No results found matching your filters.</p>
                <button
                  onClick={clearFilters}
                  className="text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Clear filters
                </button>
              </div>
            ) : viewMode === 'map' ? (
              <div className="relative bg-emerald-50 rounded-2xl border border-emerald-100 overflow-hidden min-h-[420px]">
                <iframe
                  title="UAE locations map"
                  className="w-full h-[420px] border-0 opacity-90"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${mapBounds.west}%2C${mapBounds.south}%2C${mapBounds.east}%2C${mapBounds.north}&layer=mapnik`}
                />
                <div className="absolute inset-0 pointer-events-none">
                  {filteredLocations.map((location) => {
                    const item = location.data;
                    const lat = item.latitude;
                    const lng = item.longitude;
                    if (lat == null || lng == null) return null;
                    const left = ((lng - mapBounds.west) / (mapBounds.east - mapBounds.west)) * 100;
                    const top = ((mapBounds.north - lat) / (mapBounds.north - mapBounds.south)) * 100;
                    const path = location.type === 'trail' ? `/trail/${item.id}` : `/camp/${item.id}`;
                    return (
                      <Link
                        key={item.id}
                        to={path}
                        className="pointer-events-auto absolute -translate-x-1/2 -translate-y-full"
                        style={{ left: `${left}%`, top: `${top}%` }}
                        title={item.name}
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold shadow-lg ring-2 ring-white">
                          {item.name.charAt(0)}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
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
    </div>
  );
};
