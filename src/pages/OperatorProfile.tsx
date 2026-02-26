import { useParams, Link } from 'react-router-dom';
import { Award, Globe, Mountain, Calendar, ArrowLeft, Star } from 'lucide-react';
import { operators, operatorReviews } from '../data';
import { trips } from '../data/trips';
import { TripCard } from '../components/ui/TripCard';

export const OperatorProfile = () => {
  const { id } = useParams<{ id: string }>();
  const operator = operators.find((op) => op.id === id);

  if (!operator) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Operator Not Found</h1>
          <Link to="/calendar" className="text-emerald-600 hover:text-emerald-700">
            View all trips
          </Link>
        </div>
      </div>
    );
  }

  const operatorTrips = trips.filter((trip) => trip.operatorId === operator.id);
  const reviews = operatorReviews.filter((review) => review.operatorId === operator.id);
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            to="/calendar"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Trips
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-20">
              <div className="text-center mb-6">
                <img
                  src={operator.avatar}
                  alt={operator.name}
                  className="w-32 h-32 rounded-full mx-auto mb-4 border-4 border-emerald-100"
                />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{operator.name}</h1>
                <p className="text-gray-600">{operator.experience}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center text-gray-700 mb-2">
                    <Mountain className="w-5 h-5 mr-2 text-emerald-600" />
                    <span className="font-semibold">Activity Types</span>
                  </div>
                  <div className="flex flex-wrap gap-2 ml-7">
                    {operator.activityTypes.map((type) => (
                      <span
                        key={type}
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          type === 'hiking'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center text-gray-700 mb-2">
                    <Globe className="w-5 h-5 mr-2 text-emerald-600" />
                    <span className="font-semibold">Languages</span>
                  </div>
                  <p className="text-gray-600 ml-7">{operator.languages.join(', ')}</p>
                </div>

                <div>
                  <div className="flex items-center text-gray-700 mb-2">
                    <Award className="w-5 h-5 mr-2 text-emerald-600" />
                    <span className="font-semibold">Certifications</span>
                  </div>
                  <ul className="space-y-1 ml-7">
                    {operator.certifications.map((cert, index) => (
                      <li key={index} className="text-sm text-gray-600">
                        • {cert}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </aside>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">About</h2>
              <p className="text-gray-700 leading-relaxed">{operator.bio}</p>
            </div>

            {reviews.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Reviews</h2>
                  <div className="flex items-center">
                    <Star className="w-5 h-5 text-yellow-400 fill-current mr-1" />
                    <span className="text-lg font-semibold">{averageRating.toFixed(1)}</span>
                    <span className="text-gray-600 ml-2">({reviews.length} reviews)</span>
                  </div>
                </div>

                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-200 last:border-0 pb-6 last:pb-0">
                      <div className="flex items-start gap-4">
                        <img
                          src={review.avatar}
                          alt={review.author}
                          className="w-12 h-12 rounded-full"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="font-semibold text-gray-900">{review.author}</h4>
                              <p className="text-sm text-gray-600">{review.tripName}</p>
                            </div>
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < review.rating
                                      ? 'text-yellow-400 fill-current'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                          <p className="text-sm text-gray-500 mt-2">
                            {new Date(review.date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center mb-6">
                <Calendar className="w-6 h-6 mr-2 text-emerald-600" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Upcoming Trips ({operatorTrips.length})
                </h2>
              </div>

              {operatorTrips.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                  <p className="text-gray-600">No upcoming trips scheduled at the moment.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {operatorTrips.map((trip) => (
                    <TripCard key={trip.id} trip={trip} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
