import { useEffect, useState, useMemo } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { trips } from '../data';
import { TripCard } from '../components/ui/TripCard';
import { ActivityType, Trip } from '../types';
import { featureFlags, fetchApiTrips } from '../api/public';

export const Calendar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activityFilter, setActivityFilter] = useState<ActivityType>('hiking');
  const [showFilters, setShowFilters] = useState(false);
  const [tripSource, setTripSource] = useState<Trip[]>(trips);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    regions: [] as string[],
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    if (!featureFlags.useApiCalendar) return;
    setLoading(true);
    fetchApiTrips()
      .then((items) => setTripSource(items))
      .catch(() => setTripSource(trips))
      .finally(() => setLoading(false));
  }, []);

  const upcomingTrips = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return tripSource
      .filter((trip) => {
        const tripDate = new Date(trip.date);
        if (tripDate < today) return false;

        if (trip.activityType !== activityFilter) return false;

        if (searchQuery && !trip.locationName.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }

        if (filters.regions.length > 0 && !filters.regions.includes(trip.region ?? '')) {
          return false;
        }

        if (filters.startDate) {
          const startDate = new Date(filters.startDate);
          if (tripDate < startDate) return false;
        }

        if (filters.endDate) {
          const endDate = new Date(filters.endDate);
          if (tripDate > endDate) return false;
        }

        return true;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [activityFilter, searchQuery, filters, tripSource]);

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
      regions: [],
      startDate: '',
      endDate: ''
    });
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Upcoming Trips</h1>
          <p className="text-gray-600 text-sm mb-4">Join organized hiking and camping trips with experienced guides</p>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by location..."
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

          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setActivityFilter('hiking')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activityFilter === 'hiking'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Hiking
            </button>
            <button
              onClick={() => setActivityFilter('camping')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activityFilter === 'camping'
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

              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3">Date Range</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">From</label>
                    <input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">To</label>
                    <input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <div className="flex-1">
          <div className="mb-4 text-sm text-gray-600">
            {loading && <span className="mr-2">Loading API events...</span>}
            {upcomingTrips.length} {upcomingTrips.length === 1 ? 'trip' : 'trips'} found
          </div>

            {upcomingTrips.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                <p className="text-gray-600 mb-4">No upcoming trips found matching your filters.</p>
                <button
                  onClick={clearFilters}
                  className="text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingTrips.map((trip) => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
