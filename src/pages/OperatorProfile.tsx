import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Globe, Mountain, Calendar, ArrowLeft, Users, Loader2, MessageSquare, ShieldCheck, Star } from 'lucide-react';
import { ReviewDTO } from '@uaetrail/shared-types';
import { api, TenantProfile } from '../api/services';
import { mapEventToTrip } from '../api/public';
import { TripCard } from '../components/ui/TripCard';
import { useAuth } from '../context/AuthContext';

export const OperatorProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState<TenantProfile | null>(null);
  const [trips, setTrips] = useState<ReturnType<typeof mapEventToTrip>[]>([]);
  const [reviews, setReviews] = useState<ReviewDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.getTenantProfile(id)
      .then(async (tenantRes) => {
        setTenant(tenantRes.data);
        setTrips(tenantRes.data.events.map(mapEventToTrip));
        const reviewsRes = await api.getReviews('tenant', tenantRes.data.id).catch(() => ({ data: [] }));
        setReviews(reviewsRes.data);
      })
      .catch(() => setError('Organizer not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Organizer Not Found</h1>
          <Link to="/trips" className="text-emerald-600 hover:text-emerald-700">
            View all trips
          </Link>
        </div>
      </div>
    );
  }

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  return (
    <div className="min-h-screen bg-gray-50 pb-nav-safe md:pb-0">
      <div className="bg-gradient-to-br from-emerald-800 to-teal-900 text-white">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <Link to="/trips" className="inline-flex items-center gap-1 text-emerald-200 hover:text-white text-sm mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to trips
          </Link>
          <div className="flex flex-col sm:flex-row items-start gap-5">
            {tenant.ownerAvatar ? (
              <img src={tenant.ownerAvatar} alt={tenant.ownerName} className="w-24 h-24 rounded-2xl object-cover ring-4 ring-white/20" />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-emerald-600 flex items-center justify-center text-3xl font-bold ring-4 ring-white/20">
                {tenant.ownerName.charAt(0)}
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold">{tenant.name}</h1>
                <ShieldCheck className="w-5 h-5 text-emerald-300" title="Verified organizer" />
              </div>
              <p className="text-emerald-100 mt-1">{tenant.ownerName}</p>
              {tenant.ownerBio && <p className="text-emerald-50/90 mt-3 max-w-2xl">{tenant.ownerBio}</p>}
              <div className="flex flex-wrap gap-4 mt-4 text-sm text-emerald-100">
                <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {tenant.memberCount} team</span>
                <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {trips.length} upcoming</span>
                {avgRating && (
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-amber-300 text-amber-300" /> {avgRating} ({reviews.length})
                  </span>
                )}
              </div>
              {user && tenant.ownerId !== user.id && (
                <button
                  onClick={() => navigate(`/dashboard/messages?to=${tenant.ownerId}`)}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium"
                >
                  <MessageSquare className="w-4 h-4" /> Message
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {tenant.team.length > 1 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Team</h2>
            <div className="flex flex-wrap gap-3">
              {tenant.team.map((member, i) => (
                <div key={i} className="flex items-center gap-2 bg-white rounded-xl border px-3 py-2">
                  {member.avatarUrl ? (
                    <img src={member.avatarUrl} alt="" className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700">
                      {member.displayName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{member.displayName}</p>
                    <p className="text-xs text-gray-500 capitalize">{member.role.replace('_', ' ')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center gap-2 mb-4">
            <Mountain className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-gray-900">Upcoming trips</h2>
          </div>
          {trips.length === 0 ? (
            <div className="bg-white rounded-xl border p-8 text-center text-gray-600">
              No upcoming trips scheduled.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trips.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>
          )}
        </div>

        {reviews.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-bold text-gray-900">Reviews</h2>
              {avgRating && (
                <span className="text-sm font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">{avgRating}</span>
              )}
            </div>
            <div className="space-y-3">
              {reviews.map((review) => (
                <div key={review.id} className="bg-white rounded-xl border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-gray-900 text-sm">{review.userName}</p>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{review.comment}</p>
                  <p className="text-xs text-gray-400 mt-2">{new Date(review.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
