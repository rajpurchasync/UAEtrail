import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, TrendingUp, Clock, Mountain, Baby, Calendar, Lock } from 'lucide-react';
import { trails, trips, reviews } from '../data';
import { TripCard, BookingModal, ShareButton, Breadcrumb } from '../components/ui';
import { getDifficultyColor, capitalize } from '../utils';
import { Trip } from '../types';

export const TrailDetail = () => {
  const { id } = useParams();
  const trail = trails.find((t) => t.id === id);
  const [selectedImage, setSelectedImage] = useState(0);
  const [bookingTrip, setBookingTrip] = useState<Trip | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'route' | 'location'>('overview');
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  if (!trail) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Trail not found</h1>
        <Link to="/discovery" className="text-emerald-600 hover:text-emerald-700 mt-4 inline-block">
          Back to discovery
        </Link>
      </div>
    );
  }

  const trailTrips = trips.filter(
    (t) => t.locationId === trail.id && new Date(t.date) >= new Date()
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const trailReviews = reviews.filter((r) => r.locationId === trail.id);

  const handleTabClick = (tab: 'overview' | 'route' | 'location') => {
    if (tab === 'route' || tab === 'location') {
      setShowPremiumModal(true);
    } else {
      setActiveTab(tab);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <Breadcrumb
              items={[
                { label: 'Hiking', to: '/discovery?activity=hiking' },
                { label: trail.region, to: `/discovery?activity=hiking` },
                { label: trail.name }
              ]}
            />
            <ShareButton title={trail.name} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <div className="mb-4">
                <img
                  src={trail.images[selectedImage]}
                  alt={trail.name}
                  className="w-full h-96 object-cover rounded-lg"
                />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {trail.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`h-20 rounded-lg overflow-hidden ${
                      selectedImage === index ? 'ring-2 ring-emerald-600' : ''
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
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{trail.name}</h1>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-5 h-5 mr-1" />
                    <span>{trail.region}</span>
                  </div>
                </div>
                <span
                  className={`px-4 py-2 rounded-full text-sm font-semibold ${getDifficultyColor(
                    trail.difficulty
                  )}`}
                >
                  {capitalize(trail.difficulty)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center text-gray-600 mb-1">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    <span className="text-sm">Distance</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{trail.distance} km</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center text-gray-600 mb-1">
                    <Clock className="w-5 h-5 mr-2" />
                    <span className="text-sm">Duration</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{trail.duration} hrs</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center text-gray-600 mb-1">
                    <Mountain className="w-5 h-5 mr-2" />
                    <span className="text-sm">Elevation</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{trail.elevation} m</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center text-gray-600 mb-1">
                    <Baby className="w-5 h-5 mr-2" />
                    <span className="text-sm">Family</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {trail.childFriendly ? 'Yes' : 'No'}
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">About this trail</h2>
                <p className="text-gray-600">{trail.description}</p>
              </div>

              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-2">Best Season</h3>
                <div className="flex gap-2">
                  {trail.season.map((s) => (
                    <span
                      key={s}
                      className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium capitalize"
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
                    ? 'border-emerald-600 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => handleTabClick('route')}
                className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm transition-colors flex items-center"
              >
                Route
                <Lock className="w-4 h-4 ml-1" />
              </button>
              <button
                onClick={() => handleTabClick('location')}
                className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm transition-colors flex items-center"
              >
                Location
                <Lock className="w-4 h-4 ml-1" />
              </button>
            </nav>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Upcoming Trips</h2>
              <p className="text-gray-600 mt-1">Join organized hikes at this trail</p>
            </div>
            <Link
              to="/calendar"
              className="text-emerald-600 hover:text-emerald-700 font-medium inline-flex items-center"
            >
              <Calendar className="w-5 h-5 mr-1" />
              View all trips
            </Link>
          </div>

          {trailTrips.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <p className="text-gray-600">No upcoming trips scheduled for this trail yet.</p>
              <Link to="/calendar" className="text-emerald-600 hover:text-emerald-700 mt-2 inline-block">
                Check all upcoming trips
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trailTrips.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  onJoin={() => setBookingTrip(trip)}
                />
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Reviews</h2>
          {trailReviews.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <p className="text-gray-600">No reviews yet for this trail.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {trailReviews.map((review) => (
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
                  <div className="text-sm text-gray-500 mt-2">{review.date}</div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {bookingTrip && (
        <BookingModal trip={bookingTrip} onClose={() => setBookingTrip(null)} />
      )}

      {showPremiumModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-8 relative">
            <button
              onClick={() => setShowPremiumModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center">
              <Lock className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Premium Feature</h3>
              <p className="text-gray-600 mb-6">
                Access detailed route maps, parking locations, and hiking start points with a premium membership.
              </p>
              <Link
                to="/membership"
                className="block w-full bg-emerald-600 text-white text-center py-3 rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                onClick={() => setShowPremiumModal(false)}
              >
                View Membership Plans
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
