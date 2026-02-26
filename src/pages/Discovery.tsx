import { useState, useMemo, useEffect } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { trails, campingSpots } from '../data';
import { TrailCard } from '../components/ui/TrailCard';
import { CampingCard } from '../components/ui/CampingCard';
import { ActivityType, DifficultyLevel, CampingType, Accessibility } from '../types';
import { featureFlags, fetchApiLocations } from '../api/public';

export const Discovery = () => {
  const [activityType, setActivityType] = useState<ActivityType>('hiking');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [trailSource, setTrailSource] = useState(trails);
  const [campSource, setCampSource] = useState(campingSpots);
  const [loading, setLoading] = useState(false);

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
    if (!featureFlags.useApiDiscovery) return;
    setLoading(true);
    fetchApiLocations()
      .then((response) => {
        setTrailSource(response.trails);
        setCampSource(response.camps);
      })
      .catch(() => {
        setTrailSource(trails);
        setCampSource(campingSpots);
      })
      .finally(() => setLoading(false));
  }, []);

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
      <div className="bg-white border-b sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Discover Trails & Camps</h1>
          <p className="text-gray-600 text-sm mb-4">Explore hiking trails and camping spots across the UAE</p>

          <div className="flex flex-col md:flex-row gap-4">
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
              className="lg:hidden px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors inline-flex items-center justify-center"
            >
              <SlidersHorizontal className="w-5 h-5 mr-2" />
              Filters
            </button>
          </div>

          <div className="flex gap-2 mt-4 justify-center md:justify-start">
            <button
              onClick={() => setActivityType('hiking')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activityType === 'hiking'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Hiking
            </button>
            <button
              onClick={() => setActivityType('camping')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activityType === 'camping'
                  ? 'bg-amber-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Camping
            </button>
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
                  {['Dubai', 'RAK', 'Sharjah', 'Fujairah', 'Abu Dhabi'].map((region) => (
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
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
