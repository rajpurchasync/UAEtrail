import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Users, Tent, Car, Calendar, Lock } from 'lucide-react';
import { ReviewDTO } from '@uaetrail/shared-types';
import { TripCard, BookingModal, ShareButton, Breadcrumb } from '../components/ui';
import { CampingSpot, Trip } from '../types';
import { fetchApiLocationDetail, mapEventToTrip } from '../api/public';
import { api } from '../api/services';

export const CampDetail = () => {
  const { id } = useParams();
  const [camp, setCamp] = useState<CampingSpot | null>(null);
  const [loading, setLoading] = useState(true);
  const [campTrips, setCampTrips] = useState<Trip[]>([]);
  const [campReviews, setCampReviews] = useState<ReviewDTO[]>([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [bookingTrip, setBookingTrip] = useState<Trip | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'route' | 'location'>('overview');

  useEffect(() => {
    if (!id) return;
    api.trackLocationView(id).catch(() => undefined);
    setLoading(true);
    Promise.all([
      fetchApiLocationDetail(id),
      api.getLocationEvents(id).catch(() => ({ data: [] })),
      api.getReviews('location', id).catch(() => ({ data: [] }))
    ])
      .then(([locResult, eventsRes, reviewsRes]) => {
        setCamp(locResult.camp ?? null);
        setCampTrips(eventsRes.data.map(mapEventToTrip));
        setCampReviews(reviewsRes.data);
      })
      .catch(() => setCamp(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-600" />
      </div>
    );
  }

  if (!camp) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Camping spot not found</h1>
        <Link to="/discovery" className="text-amber-600 hover:text-amber-700 mt-4 inline-block">
          Back to discovery
        </Link>
      </div>
    );
  }

  const handleTabClick = (tab: 'overview' | 'route' | 'location') => {
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <Breadcrumb
              items={[
                { label: 'Camping', to: '/discovery?activity=camping' },
                { label: camp.region, to: `/discovery?activity=camping` },
                { label: camp.name }
              ]}
            />
            <ShareButton title={camp.name} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <div className="mb-4">
                <img
                  src={camp.images[selectedImage]}
                  alt={camp.name}
                  className="w-full h-96 object-cover rounded-lg"
                />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {camp.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`h-20 rounded-lg overflow-hidden ${
                      selectedImage === index ? 'ring-2 ring-amber-600' : ''
                    }`}
                  >
                    <img src={image} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{camp.name}</h1>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-5 h-5 mr-1" />
                    <span>{camp.region}</span>
                  </div>
                </div>
                <span className="px-4 py-2 rounded-full text-sm font-semibold bg-amber-100 text-amber-800">
                  {camp.campingType === 'operator-led' ? 'Guided' : 'Self-Guided'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center text-gray-600 mb-1">
                    <Users className="w-5 h-5 mr-2" />
                    <span className="text-sm">Max Group</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{camp.maxGroupSize}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center text-gray-600 mb-1">
                    <Tent className="w-5 h-5 mr-2" />
                    <span className="text-sm">Type</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900 capitalize">
                    {camp.campingType.replace('-', ' ')}
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center text-gray-600 mb-1">
                    <Car className="w-5 h-5 mr-2" />
                    <span className="text-sm">Access</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900 capitalize">
                    {camp.accessibility.replace('-', ' ')}
                  </div>
                </div>
                {camp.difficulty && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center text-gray-600 mb-1">
                      <span className="text-sm">Difficulty</span>
                    </div>
                    <div className="text-lg font-bold text-gray-900 capitalize">
                      {camp.difficulty}
                    </div>
                  </div>
                )}
              </div>

              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">About this camp</h2>
                <p className="text-gray-600">{camp.description}</p>
              </div>

              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-2">Best Season</h3>
                <div className="flex gap-2">
                  {camp.season.map((s) => (
                    <span
                      key={s}
                      className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium capitalize"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="border-b mt-8">
            <nav className="flex space-x-8">
              <button
                onClick={() => handleTabClick('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'overview'
                    ? 'border-amber-600 text-amber-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => handleTabClick('route')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'route' ? 'border-amber-600 text-amber-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Route
              </button>
              <button
                onClick={() => handleTabClick('location')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'location' ? 'border-amber-600 text-amber-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Location
              </button>
            </nav>
          </div>

          {activeTab === 'route' && (
            <div className="py-6 text-center bg-amber-50 rounded-xl mt-4 px-4">
              <Lock className="w-8 h-8 text-amber-600 mx-auto mb-2" />
              <p className="text-gray-700 text-sm mb-3">Detailed route maps are a premium member benefit.</p>
              <Link to="/membership" className="text-amber-700 font-medium text-sm hover:underline">View membership →</Link>
            </div>
          )}
          {activeTab === 'location' && (
            <div className="py-6 text-center bg-amber-50 rounded-xl mt-4 px-4">
              <Lock className="w-8 h-8 text-amber-600 mx-auto mb-2" />
              <p className="text-gray-700 text-sm mb-3">Parking and access coordinates unlock with membership.</p>
              <Link to="/membership" className="text-amber-700 font-medium text-sm hover:underline">View membership →</Link>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg md:text-xl font-bold text-gray-900">Upcoming Camping Trips</h2>
              <p className="text-gray-600 mt-1">Join organized camping at this location</p>
            </div>
            <Link
              to="/trips"
              className="text-amber-600 hover:text-amber-700 font-medium inline-flex items-center"
            >
              <Calendar className="w-5 h-5 mr-1" />
              View all trips
            </Link>
          </div>

          {campTrips.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <p className="text-gray-600">No upcoming trips scheduled for this location yet.</p>
              <Link to="/trips" className="text-amber-600 hover:text-amber-700 mt-2 inline-block">
                Check all upcoming trips
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campTrips.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-6">Reviews</h2>
          {campReviews.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <p className="text-gray-600">No reviews yet for this camping spot.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {campReviews.map((review) => (
                <div key={review.id} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-semibold text-gray-900">{review.userName}</div>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-5 h-5 ${
                            i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-600">{review.comment}</p>
                  <div className="text-sm text-gray-500 mt-2">{new Date(review.createdAt).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {bookingTrip && (
        <BookingModal trip={bookingTrip} onClose={() => setBookingTrip(null)} />
      )}
    </div>
  );
};
